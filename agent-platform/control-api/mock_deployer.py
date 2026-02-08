"""
Mock Deployer for local testing without Kubernetes
"""
import os
import logging
from typing import Dict
from datetime import datetime

logger = logging.getLogger(__name__)


class MockAgentDeployer:
    """Mock deployer for testing without Kubernetes"""

    def __init__(self):
        """Initialize mock deployer"""
        logger.info("Using MOCK deployer - no real deployments will occur")
        self.namespace = os.getenv("AGENTS_NAMESPACE", "agents")
        self.image = os.getenv("AGENT_IMAGE", "your-registry/ai-agent:latest")
        self.domain = os.getenv("PLATFORM_DOMAIN", "localhost")
        self.deployed_agents = {}

    async def deploy(
        self,
        agent_id: str,
        user_id: str,
        bot_token: str,
        model: str,
        openai_api_key: str,
        openai_endpoint: str = None,
        platform: str = "telegram"
    ) -> Dict:
        """
        Mock deploy - simulates agent deployment
        """
        logger.info(f"[MOCK] Deploying agent: {agent_id}")

        # Simulate deployment
        self.deployed_agents[agent_id] = {
            "user_id": user_id,
            "model": model,
            "platform": platform,
            "status": "running",
            "deployed_at": datetime.now()
        }

        # Generate mock webhook URL
        webhook_url = f"https://{self.domain}/webhook/{agent_id}"

        logger.info(f"[MOCK] Agent deployed successfully: {agent_id}")

        return {
            "agent_id": agent_id,
            "webhook_url": webhook_url,
            "status": "deployed",
            "message": "MOCK deployment successful (no real K8s deployment)"
        }

    async def _create_secret(self, *args, **kwargs):
        """Mock secret creation"""
        logger.info("[MOCK] Creating secret")
        pass

    async def _create_deployment(self, *args, **kwargs):
        """Mock deployment creation"""
        logger.info("[MOCK] Creating deployment")
        pass

    async def _create_service(self, *args, **kwargs):
        """Mock service creation"""
        logger.info("[MOCK] Creating service")
        pass

    async def get_status(self, agent_id: str) -> str:
        """Get mock agent status"""
        if agent_id in self.deployed_agents:
            return self.deployed_agents[agent_id].get("status", "running")
        return "not_found"

    async def delete(self, agent_id: str):
        """Mock delete agent"""
        if agent_id in self.deployed_agents:
            del self.deployed_agents[agent_id]
            logger.info(f"[MOCK] Agent deleted: {agent_id}")

    async def restart(self, agent_id: str):
        """Mock restart agent"""
        if agent_id in self.deployed_agents:
            logger.info(f"[MOCK] Agent restarted: {agent_id}")
            self.deployed_agents[agent_id]["status"] = "restarting"