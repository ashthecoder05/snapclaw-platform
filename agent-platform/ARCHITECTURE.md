# AI Agent Platform - Architecture & Build Plan

## 🎯 Project Goal
Build a SimpleClaw-style platform where users can deploy AI agents (Telegram/Discord bots) with one click, without manual server setup.

## 🏗️ System Architecture

```
┌─────────────────┐
│  Next.js UI     │ ← User clicks "Deploy"
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  FastAPI        │ ← Control Plane (Orchestrator)
│  Control API    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Kubernetes     │ ← Creates agent pods dynamically
│  + Istio        │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Agent Pods     │ ← AI bots (one per user)
│  (Containers)   │
└─────────────────┘
```

## 📦 Components

### 1. Agent Runtime (`agent-runtime/`)
**Purpose:** The containerized AI bot that runs for each user

**Tech Stack:**
- Python 3.11
- FastAPI (webhook server)
- Azure OpenAI / OpenAI SDK
- python-telegram-bot

**Key Features:**
- Receives Telegram messages via webhook
- Processes with LLM (GPT-4o, Claude, etc.)
- Sends responses back
- Configurable via ENV variables

**Files:**
- `main.py` - FastAPI webhook server
- `requirements.txt` - Dependencies
- `Dockerfile` - Container image

### 2. Control API (`control-api/`)
**Purpose:** The brain - orchestrates agent deployments

**Tech Stack:**
- FastAPI
- Kubernetes Python client
- PostgreSQL (planned)
- Redis (planned)

**Key Features:**
- `/agents/deploy` - Creates new agent
- `/agents/{id}` - Get agent status
- `/agents/{id}/restart` - Restart agent
- `/agents/{id}` DELETE - Delete agent
- Manages K8s resources dynamically

**Files:**
- `main.py` - API endpoints
- `deployer.py` - Kubernetes deployment logic
- `database.py` - Data persistence (currently in-memory)
- `requirements.txt` - Dependencies

### 3. Infrastructure (`infra/`)
**Purpose:** K8s templates and routing

**Components:**
- **Helm Chart** (`helm/agent-chart/`)
  - Deployment template
  - Service template
  - Secret template
  - values.yaml

- **Istio Gateway** (`istio-gateway.yaml`)
  - Routes webhooks to correct agent pods
  - `/webhook/{agent-id}` → agent service

### 4. Frontend (`frontend/`)
**Purpose:** User interface for deploying agents

**Tech Stack:**
- Next.js 14
- React
- Tailwind CSS
- TypeScript

**Key Features:**
- Simple deploy form
- Agent status display
- Webhook URL display

## 🔄 Deployment Flow

```
User fills form → Frontend submits
                      ↓
              Control API receives
                      ↓
          ┌───────────┴───────────┐
          ↓                       ↓
    Create Secret           Create Deployment
    (K8s Secret)           (K8s Deployment)
          ↓                       ↓
          └───────────┬───────────┘
                      ↓
              Create Service
                      ↓
              Return webhook URL
                      ↓
          Store in database
                      ↓
          Agent pod starts
                      ↓
          Bot is live ✅
```

## 🚀 MVP Build Plan (Phase 1)

### Week 1: Core Infrastructure
- [x] Agent runtime container
- [x] Control API with deployment logic
- [x] Kubernetes Python client integration
- [x] Helm chart templates
- [x] Istio gateway configuration
- [ ] Test local deployment

### Week 2: Integration & Testing
- [ ] Build and push agent Docker image
- [ ] Deploy control API to K8s
- [ ] Test end-to-end agent deployment
- [ ] Set up webhook routing with Istio
- [ ] Test Telegram bot integration

### Week 3: Frontend & Polish
- [ ] Complete Next.js UI
- [ ] Add authentication (Clerk/Auth0)
- [ ] Agent status dashboard
- [ ] Error handling & logging

### Week 4: Production Ready
- [ ] Replace in-memory DB with PostgreSQL
- [ ] Add Redis for queues
- [ ] Implement rate limiting
- [ ] Add monitoring (Prometheus/Grafana)
- [ ] Documentation

## 📋 Key Technical Decisions

### 1. Why Kubernetes over Serverless?
- You already use K8s + Istio + FluxCD
- Better control over networking
- Multi-tenant isolation via namespaces
- Istio provides advanced routing

### 2. Why FastAPI?
- You already use it
- Async support
- Great with K8s Python client
- Fast development

### 3. Why Helm Charts?
- Version control for deployments
- Easy rollback
- Template reuse
- Industry standard

### 4. Agent Architecture
- Each user = separate pod
- Secrets stored in K8s Secrets
- ENV variables for configuration
- Stateless design (can restart anytime)

## 🔐 Security Considerations

### Current (MVP):
- K8s Secrets for API keys
- Environment variable injection
- Namespace isolation

### Production Todo:
- [ ] Azure Key Vault integration
- [ ] mTLS between services
- [ ] Network policies
- [ ] Pod security policies
- [ ] Secret rotation
- [ ] Audit logging

## 📊 Scaling Strategy

### Current (MVP):
- 1 pod per agent
- Manual scaling

### Future:
- Horizontal pod autoscaling (HPA)
- Multi-region deployment
- CDN for frontend
- Database read replicas
- Redis cluster

## 🛠️ Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, Tailwind |
| Control API | FastAPI, Python 3.11 |
| Agent Runtime | FastAPI, OpenAI SDK |
| Orchestration | Kubernetes, Helm |
| Networking | Istio Gateway |
| Database (Planned) | PostgreSQL |
| Cache (Planned) | Redis |
| Secrets | K8s Secrets → Azure Key Vault |
| CI/CD | GitHub Actions, FluxCD |
| Monitoring (Planned) | Prometheus, Grafana |

## 🎯 What Makes This Different from SimpleClaw?

### SimpleClaw:
- Fixed agent type (OpenClaw)
- Pre-configured tools
- Limited customization

### Our Platform:
- ✅ **Flexible agent runtime** - can deploy any AI agent
- ✅ **MCP tools integration** - add custom tools
- ✅ **Multi-model support** - GPT, Claude, Gemini
- ✅ **Open architecture** - extend with your own agents
- ✅ **DevOps-first** - built for senior engineers who want control

## 🔮 Future Enhancements (Phase 2+)

1. **Agent Types**
   - [ ] RAG agents
   - [ ] Social media agents
   - [ ] Email assistants
   - [ ] MCP workflow agents

2. **Platforms**
   - [x] Telegram
   - [ ] Discord
   - [ ] Slack
   - [ ] WhatsApp

3. **Features**
   - [ ] Agent marketplace
   - [ ] Custom tool builder
   - [ ] Analytics dashboard
   - [ ] Team collaboration
   - [ ] Billing integration

4. **Infrastructure**
   - [ ] Multi-region support
   - [ ] Auto-scaling policies
   - [ ] Cost optimization
   - [ ] Disaster recovery

## 📝 Next Steps

1. **Test the agent runtime locally**
   ```bash
   cd agent-platform/agent-runtime
   docker build -t ai-agent:test .
   docker run -p 8080:8080 \
     -e BOT_TOKEN=xxx \
     -e OPENAI_API_KEY=xxx \
     ai-agent:test
   ```

2. **Deploy control API**
   ```bash
   cd agent-platform/control-api
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

3. **Set up K8s namespace**
   ```bash
   kubectl create namespace agents
   ```

4. **Test deployment flow**
   ```bash
   curl -X POST http://localhost:8000/agents/deploy \
     -H "Content-Type: application/json" \
     -d '{"user_id":"test","bot_token":"xxx",...}'
   ```

## 🧠 Architecture Advantages

### For Senior DevOps Engineers:
- ✅ Uses your existing K8s + Istio stack
- ✅ GitOps-friendly (FluxCD compatible)
- ✅ Infrastructure as Code (Helm + Terraform ready)
- ✅ Observable (Prometheus metrics ready)
- ✅ Scalable (K8s native)

### For AI Development:
- ✅ Model-agnostic (swap LLMs easily)
- ✅ Tool extensibility (MCP compatible)
- ✅ Multi-agent orchestration ready
- ✅ RAG integration path clear

## 📞 Support & Customization

This architecture is designed to be:
- **Production-ready** - follows K8s best practices
- **Extensible** - add new agent types easily
- **Observable** - built-in health checks
- **Secure** - secrets management from day 1
- **Scalable** - K8s native scaling

---

**Status:** Foundation complete ✅
**Next:** Test MVP deployment
