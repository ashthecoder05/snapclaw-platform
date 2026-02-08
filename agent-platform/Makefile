# Makefile for AI Agent Platform

.PHONY: help setup build deploy clean test local

# Configuration
ACR_NAME ?= agentplatformacr
RESOURCE_GROUP ?= agent-platform-rg
AKS_NAME ?= agent-platform-aks

help: ## Show this help
	@echo "AI Agent Platform - Make Commands"
	@echo "================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Set up Azure infrastructure (ACR, AKS)
	@echo "Setting up Azure infrastructure..."
	@chmod +x scripts/setup.sh
	@./scripts/setup.sh

build: ## Build and push Docker images
	@echo "Building Docker images..."
	@chmod +x scripts/build.sh
	@./scripts/build.sh

deploy: ## Deploy platform to Kubernetes
	@echo "Deploying to Kubernetes..."
	@chmod +x scripts/deploy.sh
	@./scripts/deploy.sh

local: ## Run services locally for development
	@echo "Starting local development environment..."
	@echo "Starting control API..."
	cd control-api && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt && uvicorn main:app --reload &
	@echo "Control API running on http://localhost:8000"
	@echo "Starting frontend..."
	cd frontend && npm install && npm run dev &
	@echo "Frontend running on http://localhost:3000"

test-agent: ## Deploy a test agent
	@echo "Deploying test agent..."
	@read -p "Enter Telegram bot token: " BOT_TOKEN; \
	read -p "Enter OpenAI API key: " OPENAI_KEY; \
	curl -X POST http://localhost:8000/agents/deploy \
		-H "Content-Type: application/json" \
		-d "{\"user_id\":\"test\",\"bot_token\":\"$$BOT_TOKEN\",\"model\":\"gpt-4o\",\"openai_api_key\":\"$$OPENAI_KEY\",\"platform\":\"telegram\"}"

logs: ## View platform logs
	@echo "Control API logs:"
	kubectl logs -n platform -l app=control-api --tail=50
	@echo "\nAgent logs:"
	kubectl logs -n agents -l type=agent --tail=50

status: ## Check platform status
	@echo "Platform Status"
	@echo "==============="
	@echo "\nControl API:"
	@kubectl get pods -n platform
	@echo "\nAgents:"
	@kubectl get pods -n agents
	@echo "\nServices:"
	@kubectl get svc -n platform

port-forward: ## Port forward control API to localhost
	@echo "Port forwarding control API to localhost:8000..."
	kubectl port-forward -n platform svc/control-api 8000:80

monitoring: ## Deploy monitoring stack (Prometheus + Grafana)
	@echo "Deploying monitoring stack..."
	kubectl apply -f monitoring/prometheus-config.yaml
	@echo "Prometheus deployed. Access at: kubectl port-forward -n platform svc/prometheus 9090:9090"

database: ## Initialize database
	@echo "Initializing database..."
	kubectl exec -it -n platform deployment/postgres -- psql -U admin -d agent_platform -f /schema.sql

clean: ## Clean up all resources
	@echo "⚠️  This will delete all deployed agents and platform components!"
	@read -p "Are you sure? (y/N): " CONFIRM; \
	if [ "$$CONFIRM" = "y" ]; then \
		echo "Cleaning up..."; \
		kubectl delete namespace agents --ignore-not-found; \
		kubectl delete namespace platform --ignore-not-found; \
		echo "Cleanup complete"; \
	else \
		echo "Cleanup cancelled"; \
	fi

test: ## Run tests
	@echo "Running tests..."
	@cd control-api && python -m pytest tests/
	@cd agent-runtime && python -m pytest tests/

docker-run-agent: ## Run agent container locally
	@echo "Running agent container locally..."
	docker run -p 8080:8080 \
		-e BOT_TOKEN="test" \
		-e OPENAI_API_KEY="test" \
		-e MODEL="gpt-4o" \
		-e USER_ID="local-test" \
		$(ACR_NAME).azurecr.io/agent:latest

docker-run-api: ## Run control API container locally
	@echo "Running control API container locally..."
	docker run -p 8000:8000 \
		-e AGENT_IMAGE="$(ACR_NAME).azurecr.io/agent:latest" \
		-e PLATFORM_DOMAIN="localhost" \
		-e AGENTS_NAMESPACE="agents" \
		$(ACR_NAME).azurecr.io/control-api:latest

azure-login: ## Login to Azure
	az login
	az account set --subscription "$$(az account list --query '[0].id' -o tsv)"

k8s-dashboard: ## Open Kubernetes dashboard
	@echo "Starting Kubernetes dashboard..."
	kubectl proxy &
	@echo "Dashboard available at: http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/"

info: ## Show platform information
	@echo "AI Agent Platform Information"
	@echo "============================="
	@echo "Resource Group: $(RESOURCE_GROUP)"
	@echo "ACR: $(ACR_NAME).azurecr.io"
	@echo "AKS: $(AKS_NAME)"
	@echo ""
	@echo "Namespaces:"
	@echo "  - platform (control API, database)"
	@echo "  - agents (deployed bots)"
	@echo ""
	@echo "Quick Start:"
	@echo "  1. make setup    # Create Azure resources"
	@echo "  2. make build    # Build Docker images"
	@echo "  3. make deploy   # Deploy platform"
	@echo "  4. make status   # Check status"