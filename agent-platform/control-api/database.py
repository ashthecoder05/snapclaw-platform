"""
Database layer - Stores deployment metadata
For MVP, using simple in-memory storage with JSON file persistence
In production, replace with PostgreSQL
"""
from typing import Dict, List, Optional
from datetime import datetime
import logging
import json
import os
from pathlib import Path

logger = logging.getLogger(__name__)


class Database:
    """Simple in-memory database with file persistence"""

    def __init__(self, persist_file: str = "deployments.json"):
        self.deployments: Dict[str, Dict] = {}
        self.users: Dict[str, Dict] = {}
        self.persist_file = persist_file
        self._load_from_file()

        # Initialize admin user
        self.users["admin"] = {
            "user_id": "admin",
            "email": "admin@localhost",
            "role": "admin",
            "created_at": datetime.now().isoformat()
        }

    def _load_from_file(self):
        """Load deployments from file if exists"""
        if os.path.exists(self.persist_file):
            try:
                with open(self.persist_file, 'r') as f:
                    data = json.load(f)
                    self.deployments = data.get("deployments", {})
                    self.users = data.get("users", {})
                    logger.info(f"Loaded {len(self.deployments)} deployments from {self.persist_file}")
            except Exception as e:
                logger.error(f"Error loading from file: {e}")

    def _save_to_file(self):
        """Save deployments to file"""
        try:
            data = {
                "deployments": self.deployments,
                "users": self.users
            }
            with open(self.persist_file, 'w') as f:
                json.dump(data, f, indent=2, default=str)
            logger.info(f"Saved {len(self.deployments)} deployments to {self.persist_file}")
        except Exception as e:
            logger.error(f"Error saving to file: {e}")

    async def create_deployment(
        self,
        deployment_id: str,
        user_id: str,
        website_name: str,
        website_type: str,
        vm_ip: str,
        ssh_key: str,
        website_url: str,
        website_content: str = None
    ) -> Dict:
        """Store new deployment"""
        deployment = {
            "deployment_id": deployment_id,
            "user_id": user_id,
            "website_name": website_name,
            "website_type": website_type,
            "vm_ip": vm_ip,
            "ssh_key": ssh_key,
            "website_url": website_url,
            "website_content": website_content,
            "status": "deployed",
            "created_at": datetime.now().isoformat(),
            "last_health_check": datetime.now().isoformat()
        }

        self.deployments[deployment_id] = deployment
        self._save_to_file()
        logger.info(f"Deployment stored: {deployment_id}")
        return deployment

    async def get_deployment(self, deployment_id: str) -> Optional[Dict]:
        """Get deployment by ID"""
        return self.deployments.get(deployment_id)

    async def list_deployments(self, user_id: str = None, is_admin: bool = False) -> List[Dict]:
        """List deployments - all for admin, user-specific for regular users"""
        if is_admin:
            # Admin sees all deployments
            return list(self.deployments.values())
        elif user_id:
            # Regular user sees only their deployments
            return [
                deployment for deployment in self.deployments.values()
                if deployment["user_id"] == user_id
            ]
        return []

    async def update_deployment_status(self, deployment_id: str, status: str):
        """Update deployment status"""
        if deployment_id in self.deployments:
            self.deployments[deployment_id]["status"] = status
            self.deployments[deployment_id]["last_health_check"] = datetime.now().isoformat()
            self._save_to_file()
            logger.info(f"Deployment {deployment_id} status updated to: {status}")

    async def delete_deployment(self, deployment_id: str):
        """Delete deployment"""
        if deployment_id in self.deployments:
            del self.deployments[deployment_id]
            self._save_to_file()
            logger.info(f"Deployment deleted: {deployment_id}")

    async def get_stats(self, is_admin: bool = False, user_id: str = None) -> Dict:
        """Get deployment statistics"""
        if is_admin:
            deployments = list(self.deployments.values())
        elif user_id:
            deployments = [d for d in self.deployments.values() if d["user_id"] == user_id]
        else:
            deployments = []

        active_count = len([d for d in deployments if d.get("status") == "deployed"])
        failed_count = len([d for d in deployments if d.get("status") == "failed"])

        # Get unique users
        unique_users = len(set(d["user_id"] for d in self.deployments.values())) if is_admin else 1

        return {
            "total_deployments": len(deployments),
            "active_deployments": active_count,
            "failed_deployments": failed_count,
            "unique_users": unique_users if is_admin else None,
            "avg_deploy_time": "20s",
            "uptime": "99.9%"
        }

    async def create_user(self, user_id: str, email: str = None, role: str = "user") -> Dict:
        """Create a new user"""
        if user_id not in self.users:
            self.users[user_id] = {
                "user_id": user_id,
                "email": email or f"{user_id}@example.com",
                "role": role,
                "created_at": datetime.now().isoformat()
            }
            self._save_to_file()
            logger.info(f"User created: {user_id}")
        return self.users[user_id]

    async def get_user(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        return self.users.get(user_id)

    async def is_admin(self, user_id: str) -> bool:
        """Check if user is admin"""
        user = self.users.get(user_id, {})
        return user.get("role") == "admin"


# PostgreSQL implementation example (commented out for MVP)
"""
import asyncpg

class PostgresDatabase:
    def __init__(self, connection_string: str):
        self.pool = None
        self.connection_string = connection_string

    async def connect(self):
        self.pool = await asyncpg.create_pool(self.connection_string)

    async def create_agent(self, agent_id, user_id, model, platform, webhook_url):
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(
                '''
                INSERT INTO agents (agent_id, user_id, model, platform, webhook_url, status, created_at)
                VALUES ($1, $2, $3, $4, $5, 'running', NOW())
                RETURNING *
                ''',
                agent_id, user_id, model, platform, webhook_url
            )

    async def get_agent(self, agent_id):
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(
                'SELECT * FROM agents WHERE agent_id = $1',
                agent_id
            )

    async def list_agents(self, user_id):
        async with self.pool.acquire() as conn:
            return await conn.fetch(
                'SELECT * FROM agents WHERE user_id = $1',
                user_id
            )

    async def delete_agent(self, agent_id):
        async with self.pool.acquire() as conn:
            await conn.execute(
                'DELETE FROM agents WHERE agent_id = $1',
                agent_id
            )
"""
