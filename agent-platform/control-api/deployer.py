"""
Kubernetes Deployer - Creates and manages agent deployments
"""
import os
import logging
from typing import Dict
from kubernetes import client, config
from kubernetes.client.rest import ApiException

logger = logging.getLogger(__name__)


class AgentDeployer:
    """Manages agent deployments in Kubernetes"""

    def __init__(self):
        """Initialize Kubernetes client"""
        try:
            # Try in-cluster config first
            config.load_incluster_config()
        except:
            # Fall back to kubeconfig
            config.load_kube_config()

        self.apps_v1 = client.AppsV1Api()
        self.core_v1 = client.CoreV1Api()
        self.namespace = os.getenv("AGENTS_NAMESPACE", "agents")
        self.image = os.getenv("AGENT_IMAGE", "your-registry/ai-agent:latest")
        self.domain = os.getenv("PLATFORM_DOMAIN", "yourdomain.com")

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
        Deploy a new agent to Kubernetes

        Steps:
        1. Create Secret with credentials
        2. Create Deployment
        3. Create Service
        4. Return webhook URL
        """
        try:
            # 1. Create Secret
            await self._create_secret(
                agent_id=agent_id,
                bot_token=bot_token,
                openai_api_key=openai_api_key,
                openai_endpoint=openai_endpoint
            )

            # 2. Create Deployment
            await self._create_deployment(
                agent_id=agent_id,
                user_id=user_id,
                model=model
            )

            # 3. Create Service
            await self._create_service(agent_id)

            # 4. Generate webhook URL
            webhook_url = f"https://{self.domain}/webhook/{agent_id}"

            logger.info(f"Agent deployed: {agent_id}")

            return {
                "agent_id": agent_id,
                "webhook_url": webhook_url,
                "status": "deployed"
            }

        except ApiException as e:
            logger.error(f"Kubernetes API error: {e}")
            raise Exception(f"Failed to deploy agent: {e}")

    async def _create_secret(
        self,
        agent_id: str,
        bot_token: str,
        openai_api_key: str,
        openai_endpoint: str = None
    ):
        """Create Kubernetes Secret for agent credentials"""
        secret = client.V1Secret(
            metadata=client.V1ObjectMeta(
                name=f"{agent_id}-secret",
                namespace=self.namespace
            ),
            string_data={
                "BOT_TOKEN": bot_token,
                "OPENAI_API_KEY": openai_api_key,
                "OPENAI_ENDPOINT": openai_endpoint or ""
            }
        )

        try:
            self.core_v1.create_namespaced_secret(
                namespace=self.namespace,
                body=secret
            )
        except ApiException as e:
            if e.status == 409:  # Already exists
                self.core_v1.replace_namespaced_secret(
                    name=f"{agent_id}-secret",
                    namespace=self.namespace,
                    body=secret
                )
            else:
                raise

    async def _create_deployment(
        self,
        agent_id: str,
        user_id: str,
        model: str
    ):
        """Create Kubernetes Deployment for agent"""

        # Container definition
        container = client.V1Container(
            name="agent",
            image=self.image,
            ports=[client.V1ContainerPort(container_port=8080)],
            env=[
                client.V1EnvVar(name="USER_ID", value=user_id),
                client.V1EnvVar(name="MODEL", value=model),
                # Load secrets from K8s Secret
                client.V1EnvVar(
                    name="BOT_TOKEN",
                    value_from=client.V1EnvVarSource(
                        secret_key_ref=client.V1SecretKeySelector(
                            name=f"{agent_id}-secret",
                            key="BOT_TOKEN"
                        )
                    )
                ),
                client.V1EnvVar(
                    name="OPENAI_API_KEY",
                    value_from=client.V1EnvVarSource(
                        secret_key_ref=client.V1SecretKeySelector(
                            name=f"{agent_id}-secret",
                            key="OPENAI_API_KEY"
                        )
                    )
                ),
                client.V1EnvVar(
                    name="OPENAI_ENDPOINT",
                    value_from=client.V1EnvVarSource(
                        secret_key_ref=client.V1SecretKeySelector(
                            name=f"{agent_id}-secret",
                            key="OPENAI_ENDPOINT"
                        )
                    )
                )
            ],
            resources=client.V1ResourceRequirements(
                requests={"cpu": "100m", "memory": "256Mi"},
                limits={"cpu": "500m", "memory": "512Mi"}
            )
        )

        # Deployment spec
        deployment = client.V1Deployment(
            metadata=client.V1ObjectMeta(
                name=agent_id,
                namespace=self.namespace,
                labels={"app": agent_id, "type": "agent"}
            ),
            spec=client.V1DeploymentSpec(
                replicas=1,
                selector=client.V1LabelSelector(
                    match_labels={"app": agent_id}
                ),
                template=client.V1PodTemplateSpec(
                    metadata=client.V1ObjectMeta(
                        labels={"app": agent_id}
                    ),
                    spec=client.V1PodSpec(containers=[container])
                )
            )
        )

        try:
            self.apps_v1.create_namespaced_deployment(
                namespace=self.namespace,
                body=deployment
            )
        except ApiException as e:
            if e.status == 409:  # Already exists
                self.apps_v1.replace_namespaced_deployment(
                    name=agent_id,
                    namespace=self.namespace,
                    body=deployment
                )
            else:
                raise

    async def _create_service(self, agent_id: str):
        """Create Kubernetes Service for agent"""
        service = client.V1Service(
            metadata=client.V1ObjectMeta(
                name=agent_id,
                namespace=self.namespace
            ),
            spec=client.V1ServiceSpec(
                selector={"app": agent_id},
                ports=[
                    client.V1ServicePort(
                        port=80,
                        target_port=8080,
                        protocol="TCP"
                    )
                ]
            )
        )

        try:
            self.core_v1.create_namespaced_service(
                namespace=self.namespace,
                body=service
            )
        except ApiException as e:
            if e.status == 409:  # Already exists
                self.core_v1.replace_namespaced_service(
                    name=agent_id,
                    namespace=self.namespace,
                    body=service
                )
            else:
                raise

    async def get_status(self, agent_id: str) -> str:
        """Get agent deployment status"""
        try:
            deployment = self.apps_v1.read_namespaced_deployment(
                name=agent_id,
                namespace=self.namespace
            )

            if deployment.status.available_replicas == 1:
                return "running"
            elif deployment.status.replicas == 0:
                return "stopped"
            else:
                return "starting"

        except ApiException as e:
            if e.status == 404:
                return "not_found"
            raise

    async def delete(self, agent_id: str):
        """Delete agent deployment"""
        try:
            # Delete deployment
            self.apps_v1.delete_namespaced_deployment(
                name=agent_id,
                namespace=self.namespace
            )

            # Delete service
            self.core_v1.delete_namespaced_service(
                name=agent_id,
                namespace=self.namespace
            )

            # Delete secret
            self.core_v1.delete_namespaced_secret(
                name=f"{agent_id}-secret",
                namespace=self.namespace
            )

        except ApiException as e:
            if e.status != 404:
                raise

    async def restart(self, agent_id: str):
        """Restart agent by deleting pods"""
        try:
            pods = self.core_v1.list_namespaced_pod(
                namespace=self.namespace,
                label_selector=f"app={agent_id}"
            )

            for pod in pods.items:
                self.core_v1.delete_namespaced_pod(
                    name=pod.metadata.name,
                    namespace=self.namespace
                )

        except ApiException as e:
            logger.error(f"Error restarting agent: {e}")
            raise
