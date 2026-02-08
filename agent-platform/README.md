# AI Agent Platform

> **One-click AI bot deployment platform** - Deploy Telegram/Discord bots connected to GPT/Claude/Gemini without touching servers.

## 🎯 What Is This?

A SimpleClaw-style platform where users:
1. Fill a form (bot token + API key)
2. Click "Deploy"
3. Get a working AI assistant in seconds

**No SSH. No Node setup. No manual deployment.**

## 🏗️ Architecture

```
Frontend (Next.js) → Control API (FastAPI) → Kubernetes → Agent Pods
```

- **Frontend:** Simple deployment UI
- **Control API:** Orchestrates K8s deployments
- **Agent Pods:** Individual AI bots (one per user)
- **Infrastructure:** K8s + Istio for routing

## 📁 Project Structure

```
agent-platform/
├── agent-runtime/         # AI bot container
│   ├── main.py           # FastAPI webhook server
│   ├── Dockerfile
│   └── requirements.txt
│
├── control-api/          # Deployment orchestrator
│   ├── main.py          # API endpoints
│   ├── deployer.py      # K8s deployment logic
│   ├── database.py      # Data persistence
│   └── requirements.txt
│
├── frontend/            # Next.js UI
│   ├── app/
│   └── package.json
│
├── infra/              # K8s templates
│   ├── helm/           # Helm charts
│   └── istio-gateway.yaml
│
├── ARCHITECTURE.md     # Detailed architecture docs
├── BUILD_GUIDE.md      # Step-by-step implementation
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites
- Kubernetes cluster (AKS recommended)
- Istio installed
- Docker registry access
- kubectl configured

### 1. Build Agent Runtime

```bash
cd agent-runtime
docker build -t your-registry/ai-agent:v1 .
docker push your-registry/ai-agent:v1
```

### 2. Run Control API

```bash
cd control-api
pip install -r requirements.txt
export AGENT_IMAGE=your-registry/ai-agent:v1
export PLATFORM_DOMAIN=yourdomain.com
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 3. Set Up Kubernetes

```bash
kubectl create namespace agents
kubectl apply -f infra/istio-gateway.yaml
```

### 4. Deploy First Agent

```bash
curl -X POST http://localhost:8000/agents/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "testuser",
    "bot_token": "YOUR_TELEGRAM_BOT_TOKEN",
    "model": "gpt-4o",
    "openai_api_key": "YOUR_OPENAI_KEY",
    "platform": "telegram"
  }'
```

### 5. Run Frontend (Optional)

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000

## 🔑 Environment Variables

### Agent Runtime
- `BOT_TOKEN` - Telegram bot token
- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_ENDPOINT` - Azure OpenAI endpoint (optional)
- `MODEL` - Model name (gpt-4o, gpt-3.5-turbo)
- `USER_ID` - User identifier

### Control API
- `KUBECONFIG` - Kubernetes config path
- `AGENTS_NAMESPACE` - K8s namespace (default: agents)
- `AGENT_IMAGE` - Agent container image
- `PLATFORM_DOMAIN` - Your domain for webhooks

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design, tech stack, decisions
- **[BUILD_GUIDE.md](./BUILD_GUIDE.md)** - 14-day implementation plan

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Agent Runtime | Python, FastAPI, OpenAI SDK |
| Control API | FastAPI, Kubernetes Python Client |
| Frontend | Next.js 14, React, Tailwind |
| Infrastructure | Kubernetes, Helm, Istio |
| Database | PostgreSQL (planned) |
| Cache | Redis (planned) |

## 🎯 MVP Features

- ✅ Deploy Telegram bots with one click
- ✅ Support multiple LLM models (GPT-4o, GPT-3.5)
- ✅ Kubernetes-based deployment
- ✅ Istio webhook routing
- ✅ Agent status monitoring
- ✅ Automatic secret management

## 🔮 Roadmap

### Phase 1 (Current)
- [x] Agent runtime
- [x] Control API
- [x] K8s deployment
- [ ] Frontend UI
- [ ] End-to-end testing

### Phase 2
- [ ] Discord support
- [ ] PostgreSQL integration
- [ ] Redis caching
- [ ] Monitoring dashboard

### Phase 3
- [ ] Claude/Gemini support
- [ ] RAG agents
- [ ] Custom tool builder
- [ ] MCP integration

### Phase 4
- [ ] Multi-region deployment
- [ ] Agent marketplace
- [ ] Team collaboration
- [ ] Billing integration

## 🧪 Testing

```bash
# Test agent locally
cd agent-runtime
docker build -t ai-agent:test .
docker run -p 8080:8080 \
  -e BOT_TOKEN=xxx \
  -e OPENAI_API_KEY=xxx \
  ai-agent:test

# Test control API
cd control-api
pytest tests/

# Test K8s deployment
kubectl get pods -n agents
kubectl logs -n agents -l app=agent-xxx
```

## 🔒 Security

- Secrets stored in Kubernetes Secrets (MVP)
- Azure Key Vault integration (planned)
- Network policies for pod isolation
- TLS for all webhooks
- API authentication (planned)

## 📊 Performance

### MVP Targets
- Deploy agent: < 30 seconds
- Webhook latency: < 500ms
- Support: 50+ concurrent agents

### Production Targets
- Deploy agent: < 10 seconds
- Webhook latency: < 200ms
- Support: 1000+ concurrent agents

## 🤝 Contributing

This is a personal project, but contributions are welcome!

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Follow [BUILD_GUIDE.md](./BUILD_GUIDE.md)
3. Submit PR

## 📝 License

MIT

## 🙏 Acknowledgments

Inspired by SimpleClaw and the need for developer-friendly AI agent deployment platforms.

---

**Built with ❤️ for DevOps engineers who want to deploy AI agents without the hassle.**
