# Quick Start Guide

## ✅ What You Have

A complete SimpleClaw-style AI agent deployment platform with:

### Core Components (✅ Built)
- **Agent Runtime** - Containerized AI bot with Telegram + LLM integration
- **Control API** - FastAPI orchestrator that deploys agents to K8s
- **Helm Charts** - K8s templates for agent deployment
- **Istio Gateway** - Webhook routing configuration
- **Documentation** - Architecture, build guide, and references

### What's Next
- Frontend UI (basic structure created, needs completion)
- Database integration (PostgreSQL)
- Production hardening

---

## 🚀 Getting Started (5 Steps)

### Step 1: Prerequisites Check

```bash
# Verify you have:
- [ ] Kubernetes cluster access
- [ ] kubectl configured
- [ ] Docker installed
- [ ] Python 3.11+
- [ ] Istio installed in cluster

# Test:
kubectl get nodes
docker --version
python --version
```

### Step 2: Build Agent Image

```bash
cd agent-platform/agent-runtime

# Update image name in Dockerfile if needed
# Then build:
docker build -t <your-registry>/ai-agent:v1 .

# Push to your registry:
docker push <your-registry>/ai-agent:v1
```

### Step 3: Set Up Kubernetes

```bash
# Create namespace
kubectl create namespace agents

# Apply Istio gateway
kubectl apply -f agent-platform/infra/istio-gateway.yaml

# Verify
kubectl get gateway -n agents
```

### Step 4: Run Control API

```bash
cd agent-platform/control-api

# Install dependencies
pip install -r requirements.txt

# Configure
export AGENT_IMAGE=<your-registry>/ai-agent:v1
export PLATFORM_DOMAIN=<yourdomain.com>
export KUBECONFIG=~/.kube/config
export AGENTS_NAMESPACE=agents

# Run
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Step 5: Deploy Your First Agent

```bash
# Get a Telegram bot token from @BotFather
# Then deploy:

curl -X POST http://localhost:8000/agents/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-id",
    "bot_token": "YOUR_TELEGRAM_BOT_TOKEN",
    "model": "gpt-4o",
    "openai_api_key": "YOUR_OPENAI_API_KEY",
    "platform": "telegram"
  }'

# You should get back:
# {
#   "agent_id": "agent-your-user-id-xxx",
#   "status": "running",
#   "webhook_url": "https://yourdomain.com/webhook/agent-xxx"
# }
```

---

## 🧪 Testing Your Deployment

### 1. Check Pod Status
```bash
kubectl get pods -n agents
# Should show: agent-your-user-id-xxx
```

### 2. Check Logs
```bash
kubectl logs -n agents -l app=agent-your-user-id-xxx
```

### 3. Test Health Endpoint
```bash
# Port-forward to pod
kubectl port-forward -n agents <pod-name> 8080:8080

# In another terminal:
curl http://localhost:8080/health
```

### 4. Set Telegram Webhook
```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -d "url=https://yourdomain.com/webhook/agent-xxx/webhook"
```

### 5. Test on Telegram
Open your Telegram bot and send a message. It should respond!

---

## 🐛 Troubleshooting

### Pod won't start
```bash
# Check events
kubectl describe pod -n agents <pod-name>

# Common issues:
- Image pull errors → Check registry access
- CrashLoopBackOff → Check logs for missing env vars
- Pending → Check resource quotas
```

### Webhook not working
```bash
# Check Istio gateway
kubectl get gateway -n agents
kubectl get virtualservice -n agents

# Check Istio logs
kubectl logs -n istio-system -l app=istio-ingressgateway --tail=100

# Common issues:
- DNS not pointing to gateway
- TLS certificate missing
- VirtualService not applied
```

### Bot not responding
```bash
# Check agent logs
kubectl logs -n agents -l app=agent-xxx --tail=100

# Common issues:
- Invalid API key
- Rate limit exceeded
- Webhook URL not set in Telegram
```

---

## 📋 Configuration Reference

### Required Environment Variables (Control API)

| Variable | Description | Example |
|----------|-------------|---------|
| `AGENT_IMAGE` | Container image for agents | `myregistry/ai-agent:v1` |
| `PLATFORM_DOMAIN` | Your domain | `myplatform.com` |
| `AGENTS_NAMESPACE` | K8s namespace | `agents` |
| `KUBECONFIG` | Path to kubeconfig | `~/.kube/config` |

### Required Environment Variables (Agent Runtime)

| Variable | Description | Source |
|----------|-------------|--------|
| `BOT_TOKEN` | Telegram bot token | K8s Secret |
| `OPENAI_API_KEY` | OpenAI API key | K8s Secret |
| `OPENAI_ENDPOINT` | Azure OpenAI endpoint | K8s Secret (optional) |
| `MODEL` | Model name | Deployment config |
| `USER_ID` | User identifier | Deployment config |

---

## 🎯 What to Do Next

### Immediate (Today)
1. ✅ Test agent deployment locally
2. ✅ Verify webhook routing works
3. ✅ Test on Telegram

### This Week
1. Complete frontend UI
2. Add PostgreSQL database
3. Add agent list/delete endpoints
4. Set up monitoring

### Next 2 Weeks
1. Add Discord support
2. Implement Redis caching
3. Add authentication
4. Production deployment

---

## 📚 Reference Documents

- **[README.md](./README.md)** - Project overview
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design (detailed)
- **[BUILD_GUIDE.md](./BUILD_GUIDE.md)** - 14-day implementation plan

---

## 🔥 Pro Tips

### Development Workflow
```bash
# Terminal 1: Run control API
cd control-api && uvicorn main:app --reload

# Terminal 2: Watch K8s
watch kubectl get pods -n agents

# Terminal 3: Stream logs
kubectl logs -n agents -l type=agent -f
```

### Rapid Testing
```bash
# Deploy → Test → Delete cycle
AGENT_ID=$(curl -s -X POST localhost:8000/agents/deploy ... | jq -r .agent_id)
# ... test ...
curl -X DELETE localhost:8000/agents/$AGENT_ID
```

### Debugging Agent Issues
```bash
# Get shell in agent pod
kubectl exec -it -n agents <pod-name> -- /bin/bash

# Check environment
env | grep -E "BOT_TOKEN|OPENAI|MODEL"

# Test LLM connection
python -c "from openai import OpenAI; print(OpenAI().models.list())"
```

---

## ✨ Success Checklist

- [ ] Agent container builds successfully
- [ ] Control API starts without errors
- [ ] K8s namespace created
- [ ] First agent deploys
- [ ] Pod starts and stays running
- [ ] Health check passes
- [ ] Webhook routes correctly
- [ ] Telegram bot responds

**If all checked → You have a working MVP! 🎉**

---

## 🆘 Need Help?

1. Check logs: `kubectl logs -n agents <pod-name>`
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Follow [BUILD_GUIDE.md](./BUILD_GUIDE.md) step-by-step
4. Check K8s events: `kubectl get events -n agents`

---

**Ready to deploy AI agents? Start with Step 1! 🚀**
