from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Optional, List, Dict
import logging
from datetime import datetime
import os

# Use VM deployer for real website deployments
if os.getenv("USE_VM_DEPLOYER", "true").lower() == "true":
    from vm_deployer import VMDeployer
    use_vm_deployer = True
elif os.getenv("MOCK_K8S", "true").lower() == "true":
    from mock_deployer import MockAgentDeployer as AgentDeployer
    use_vm_deployer = False
else:
    from deployer import AgentDeployer
    use_vm_deployer = False

from database import Database
from telegram_bot import TelegramBot

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Agent Platform - One-Click Website Deployment")

# Configure CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Initialize services
if use_vm_deployer:
    deployer = VMDeployer()
else:
    deployer = AgentDeployer()
db = Database()
telegram_bot = TelegramBot()

# Store for deployed websites (for demo preview) - will be migrated to database
deployed_websites: Dict[str, Dict] = {}

# Simple auth helper - in production, use proper JWT/OAuth
async def get_current_user(user_id: Optional[str] = Header(None)):
    """Get current user from header"""
    if not user_id:
        return None
    # Create user if doesn't exist
    await db.create_user(user_id)
    return user_id


class DeployRequest(BaseModel):
    user_id: str
    bot_token: str
    model: str = "gpt-4o"
    openai_api_key: str
    openai_endpoint: Optional[str] = None
    platform: str = "telegram"


class WebsiteDeployRequest(BaseModel):
    user_id: str
    website_name: str
    website_type: str = "static"  # static, nodejs, react, telegram, openclaw
    custom_html: Optional[str] = None
    bot_token: Optional[str] = None


class AgentStatus(BaseModel):
    agent_id: str
    user_id: str
    status: str
    model: str
    platform: str
    created_at: datetime
    webhook_url: Optional[str] = None


@app.get("/")
async def root():
    return {"message": "Agent Platform Control API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/agents/deploy", response_model=AgentStatus)
async def deploy_agent(request: DeployRequest):
    """
    Deploy a new AI agent

    This endpoint:
    1. Creates Kubernetes namespace/resources
    2. Stores secrets securely
    3. Deploys agent container
    4. Sets up webhook routing
    """
    try:
        logger.info(f"Deploying agent for user: {request.user_id}")

        # Generate agent ID
        agent_id = f"agent-{request.user_id}-{int(datetime.now().timestamp())}"

        # Deploy to Kubernetes
        result = await deployer.deploy(
            agent_id=agent_id,
            user_id=request.user_id,
            bot_token=request.bot_token,
            model=request.model,
            openai_api_key=request.openai_api_key,
            openai_endpoint=request.openai_endpoint,
            platform=request.platform
        )

        # Store in database
        agent = await db.create_agent(
            agent_id=agent_id,
            user_id=request.user_id,
            model=request.model,
            platform=request.platform,
            webhook_url=result["webhook_url"]
        )

        logger.info(f"Agent deployed successfully: {agent_id}")

        return AgentStatus(
            agent_id=agent_id,
            user_id=request.user_id,
            status="running",
            model=request.model,
            platform=request.platform,
            created_at=datetime.now(),
            webhook_url=result["webhook_url"]
        )

    except Exception as e:
        logger.error(f"Deployment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/agents/{agent_id}", response_model=AgentStatus)
async def get_agent_status(agent_id: str):
    """Get status of a specific agent"""
    try:
        agent = await db.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        # Check actual status from Kubernetes
        k8s_status = await deployer.get_status(agent_id)

        return AgentStatus(
            agent_id=agent["agent_id"],
            user_id=agent["user_id"],
            status=k8s_status,
            model=agent["model"],
            platform=agent["platform"],
            created_at=agent["created_at"],
            webhook_url=agent["webhook_url"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting agent status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/users/{user_id}/agents", response_model=List[AgentStatus])
async def list_user_agents(user_id: str):
    """List all agents for a user"""
    try:
        agents = await db.list_agents(user_id)
        return [
            AgentStatus(
                agent_id=a["agent_id"],
                user_id=a["user_id"],
                status=a["status"],
                model=a["model"],
                platform=a["platform"],
                created_at=a["created_at"],
                webhook_url=a["webhook_url"]
            )
            for a in agents
        ]
    except Exception as e:
        logger.error(f"Error listing agents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str):
    """Delete an agent"""
    try:
        # Delete from Kubernetes
        await deployer.delete(agent_id)

        # Delete from database
        await db.delete_agent(agent_id)

        return {"message": "Agent deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agents/{agent_id}/restart")
async def restart_agent(agent_id: str):
    """Restart an agent"""
    try:
        await deployer.restart(agent_id)
        return {"message": "Agent restarted successfully"}
    except Exception as e:
        logger.error(f"Error restarting agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/website/deploy")
async def deploy_website(request: WebsiteDeployRequest):
    """
    Deploy a website with one click!

    This endpoint:
    1. Provisions a VM (15 min)
    2. Creates SSH keys (10 min)
    3. Connects to server (5 min)
    4. Installs Node.js/NPM (5 min)
    5. Deploys website
    6. Returns live URL

    Total time: ~35 minutes
    """
    try:
        logger.info(f"Deploying website for user: {request.user_id}")

        if not use_vm_deployer:
            raise HTTPException(
                status_code=501,
                detail="Website deployment requires VM deployer. Set USE_VM_DEPLOYER=true"
            )

        # Deploy website
        result = await deployer.deploy_website(
            user_id=request.user_id,
            website_name=request.website_name,
            website_content=request.custom_html
        )

        # Store the deployed website for preview
        deployment_id = result["deployment_id"]
        deployed_websites[deployment_id] = {
            "user_id": request.user_id,
            "website_name": request.website_name,
            "content": request.custom_html or deployer._get_default_website(request.website_name, request.user_id),
            "deployed_at": datetime.now()
        }

        # Create a preview URL using localhost
        preview_url = f"http://localhost:8000/preview/{deployment_id}"

        logger.info(f"Website deployed successfully: {preview_url}")

        # If this is a Telegram bot deployment, send welcome message
        telegram_result = None
        if request.bot_token and request.website_type in ["telegram", "openclaw"]:
            logger.info(f"Sending Telegram welcome message for bot: {request.website_name}")
            telegram_result = await telegram_bot.send_welcome_message(request.bot_token)
            if telegram_result.get("success"):
                logger.info(f"Welcome message sent successfully to Telegram")
            else:
                logger.warning(f"Could not send welcome message: {telegram_result.get('message')}")

        return {
            "deployment_id": result["deployment_id"],
            "website_url": preview_url,  # Return the preview URL instead
            "public_ip": result["public_ip"],
            "status": result["status"],
            "message": result["message"],
            "ssh_access": result.get("ssh_command", "N/A in demo mode"),
            "telegram_message_sent": telegram_result.get("success", False) if telegram_result else False,
            "telegram_info": telegram_result.get("message", "") if telegram_result else ""
        }

    except Exception as e:
        logger.error(f"Website deployment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/preview/{deployment_id}", response_class=HTMLResponse)
async def preview_website(deployment_id: str):
    """
    Preview the deployed website
    Returns the actual HTML content
    """
    if deployment_id not in deployed_websites:
        # Try to get default website if not found
        from vm_deployer import VMDeployer
        temp_deployer = VMDeployer()
        return temp_deployer._get_default_website("Demo Website", "demo-user")

    website = deployed_websites[deployment_id]
    return website["content"]


@app.get("/deployments")
async def list_deployments():
    """
    List all deployed websites
    """
    deployments_list = []

    for deployment_id, website in deployed_websites.items():
        deployments_list.append({
            "deployment_id": deployment_id,
            "user_id": website["user_id"],
            "website_name": website["website_name"],
            "deployed_at": website["deployed_at"].isoformat() if hasattr(website["deployed_at"], 'isoformat') else str(website["deployed_at"]),
            "preview_url": f"http://localhost:8000/preview/{deployment_id}",
            "status": "deployed"
        })

    return {
        "deployments": deployments_list,
        "total": len(deployments_list)
    }


@app.get("/deployments/{deployment_id}")
async def get_deployment_details(deployment_id: str):
    """
    Get details of a specific deployment
    """
    if deployment_id not in deployed_websites:
        raise HTTPException(status_code=404, detail="Deployment not found")

    website = deployed_websites[deployment_id]
    return {
        "deployment_id": deployment_id,
        "user_id": website["user_id"],
        "website_name": website["website_name"],
        "deployed_at": website["deployed_at"].isoformat() if hasattr(website["deployed_at"], 'isoformat') else str(website["deployed_at"]),
        "preview_url": f"http://localhost:8000/preview/{deployment_id}",
        "status": "deployed",
        "public_ip": "40.78.123.456",
        "ssh_access": f"ssh -i /tmp/ssh-keys/{deployment_id}/id_rsa azureuser@40.78.123.456"
    }
