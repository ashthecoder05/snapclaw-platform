# Build Guide - AI Agent Platform

## 🎯 Goal
Build a working MVP that deploys Telegram AI bots with one click.

## 📅 14-Day Implementation Plan

### **Phase 1: Foundation (Days 1-4)**

#### Day 1: Agent Runtime
**Goal:** Create working AI bot container

```bash
# 1. Build agent container
cd agent-platform/agent-runtime
docker build -t your-registry/ai-agent:v1 .

# 2. Test locally
docker run -p 8080:8080 \
  -e BOT_TOKEN="your_telegram_token" \
  -e OPENAI_API_KEY="your_openai_key" \
  -e MODEL="gpt-4o" \
  -e USER_ID="test-user" \
  your-registry/ai-agent:v1

# 3. Test webhook
curl -X POST http://localhost:8080/webhook \
  -H "Content-Type: application/json" \
  -d '{"message":{"chat":{"id":123},"text":"hello"}}'

# 4. Push to registry
docker push your-registry/ai-agent:v1
```

**Success Criteria:**
- ✅ Container builds successfully
- ✅ Health endpoint responds
- ✅ Webhook processes messages
- ✅ LLM integration works

#### Day 2: Control API Setup
**Goal:** Get control API running

```bash
# 1. Install dependencies
cd agent-platform/control-api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Configure kubeconfig
export KUBECONFIG=~/.kube/config

# 3. Run API
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 4. Test health endpoint
curl http://localhost:8000/health
```

**Success Criteria:**
- ✅ API starts without errors
- ✅ Health check passes
- ✅ Can connect to K8s cluster

#### Day 3: Kubernetes Setup
**Goal:** Prepare K8s infrastructure

```bash
# 1. Create namespace
kubectl create namespace agents

# 2. Verify Istio
kubectl get gateway -n istio-system

# 3. Install Helm chart (dry-run first)
cd agent-platform/infra/helm
helm install test-agent ./agent-chart \
  --namespace agents \
  --dry-run \
  --set agentId=test-001 \
  --set userId=testuser \
  --set image.repository=your-registry/ai-agent \
  --set image.tag=v1 \
  --set secrets.botToken=xxx \
  --set secrets.openaiApiKey=xxx

# 4. Apply Istio gateway
kubectl apply -f agent-platform/infra/istio-gateway.yaml
```

**Success Criteria:**
- ✅ Namespace created
- ✅ Helm chart validates
- ✅ Istio gateway configured

#### Day 4: First Deployment Test
**Goal:** Deploy one agent manually

```bash
# 1. Deploy via control API
curl -X POST http://localhost:8000/agents/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "testuser",
    "bot_token": "YOUR_BOT_TOKEN",
    "model": "gpt-4o",
    "openai_api_key": "YOUR_KEY",
    "platform": "telegram"
  }'

# 2. Check deployment
kubectl get pods -n agents

# 3. Check logs
kubectl logs -n agents -l app=agent-testuser-xxx

# 4. Test webhook
curl -X POST https://yourdomain.com/webhook/agent-testuser-xxx/webhook \
  -H "Content-Type: application/json" \
  -d '{"message":{"chat":{"id":123},"text":"hello"}}'
```

**Success Criteria:**
- ✅ Agent pod starts
- ✅ No crash loops
- ✅ Webhook accessible via Istio
- ✅ Bot responds on Telegram

---

### **Phase 2: Integration (Days 5-8)**

#### Day 5: Webhook Routing
**Goal:** Set up proper webhook routing with Istio

**Tasks:**
1. Configure Istio VirtualService with dynamic routing
2. Set up TLS certificates
3. Test webhook routing to multiple agents
4. Configure Telegram webhook URLs

```bash
# Set Telegram webhook
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -d "url=https://yourdomain.com/webhook/agent-xxx"
```

#### Day 6: Database Integration
**Goal:** Replace in-memory storage with PostgreSQL

**Tasks:**
1. Deploy PostgreSQL to K8s
2. Create schema:
```sql
CREATE TABLE agents (
    agent_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    model VARCHAR(100) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    webhook_url TEXT,
    status VARCHAR(50) DEFAULT 'running',
    created_at TIMESTAMP DEFAULT NOW()
);
```
3. Update `database.py` to use PostgreSQL
4. Test CRUD operations

#### Day 7: Frontend Basic
**Goal:** Get UI running

```bash
cd agent-platform/frontend

# 1. Install dependencies
npm install

# 2. Configure API endpoint
# Edit .env.local:
NEXT_PUBLIC_API_URL=http://localhost:8000

# 3. Run dev server
npm run dev

# 4. Test in browser
open http://localhost:3000
```

#### Day 8: End-to-End Test
**Goal:** Deploy agent from UI

**Test Flow:**
1. Open frontend
2. Fill form with real bot token
3. Click Deploy
4. Verify pod created in K8s
5. Test bot on Telegram
6. Check agent status in UI

---

### **Phase 3: Production Ready (Days 9-12)**

#### Day 9: Error Handling
**Tasks:**
- Add proper error responses in API
- Add retry logic for K8s operations
- Add validation for bot tokens
- Add deployment timeout handling

#### Day 10: Monitoring
**Tasks:**
- Add Prometheus metrics to control API
- Add health checks to agent runtime
- Set up Grafana dashboards
- Configure alerts

#### Day 11: Security Hardening
**Tasks:**
- Migrate secrets to Azure Key Vault
- Add network policies
- Configure pod security policies
- Add rate limiting to API

#### Day 12: Multi-User Testing
**Tasks:**
- Deploy 10+ agents simultaneously
- Test resource limits
- Monitor performance
- Optimize as needed

---

### **Phase 4: Polish (Days 13-14)**

#### Day 13: UI Improvements
**Tasks:**
- Add agent list view
- Add delete agent functionality
- Add restart agent functionality
- Add logs viewer

#### Day 14: Documentation & Deployment
**Tasks:**
- Write deployment documentation
- Create CI/CD pipeline
- Deploy to production cluster
- User acceptance testing

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Agent runtime handles messages correctly
- [ ] Control API validates input
- [ ] Kubernetes deployment logic works
- [ ] Database operations succeed

### Integration Tests
- [ ] Deploy agent end-to-end
- [ ] Webhook routing works
- [ ] Multiple agents don't interfere
- [ ] Delete agent cleans up resources

### Load Tests
- [ ] Deploy 100 agents
- [ ] Handle 1000 messages/minute
- [ ] API response time < 2s

### Security Tests
- [ ] Secrets not exposed in logs
- [ ] API authentication works
- [ ] Rate limiting effective
- [ ] Network policies enforced

---

## 🚨 Common Issues & Solutions

### Issue 1: Pod won't start
**Symptoms:** CrashLoopBackOff
**Debug:**
```bash
kubectl describe pod -n agents <pod-name>
kubectl logs -n agents <pod-name>
```
**Common causes:**
- Missing environment variables
- Invalid API keys
- Image pull errors

### Issue 2: Webhook not routing
**Symptoms:** 404 on webhook URL
**Debug:**
```bash
kubectl get virtualservice -n agents
kubectl logs -n istio-system -l app=istio-ingressgateway
```
**Common causes:**
- VirtualService not applied
- DNS not pointing to gateway
- TLS certificate issues

### Issue 3: LLM timeout
**Symptoms:** Telegram shows "typing..." forever
**Debug:**
```bash
kubectl logs -n agents -l app=agent-xxx --tail=100
```
**Common causes:**
- API key invalid
- Rate limit exceeded
- Network policy blocking egress

---

## 📊 Success Metrics

### MVP Success (Day 14):
- ✅ Deploy agent in < 30 seconds
- ✅ Handle 100+ messages/hour per agent
- ✅ 99% uptime for control API
- ✅ Support 50+ concurrent agents

### Production Ready (Month 2):
- ✅ Deploy agent in < 10 seconds
- ✅ Handle 10K+ messages/hour total
- ✅ 99.9% uptime
- ✅ Support 1000+ concurrent agents

---

## 🔧 Required Configuration

### 1. Environment Variables (Control API)
```bash
export KUBECONFIG=/path/to/kubeconfig
export AGENTS_NAMESPACE=agents
export AGENT_IMAGE=your-registry/ai-agent:v1
export PLATFORM_DOMAIN=yourdomain.com
```

### 2. Kubernetes Secrets
```bash
# For PostgreSQL
kubectl create secret generic db-credentials \
  -n agents \
  --from-literal=username=admin \
  --from-literal=password=yourpassword
```

### 3. Istio Configuration
- TLS certificate in place
- Gateway configured
- DNS pointing to load balancer

### 4. Docker Registry
- Private registry set up (Azure ACR, Docker Hub, etc.)
- Pull secrets configured in K8s

---

## 📝 Pre-Deployment Checklist

Before deploying to production:

### Infrastructure
- [ ] K8s cluster running
- [ ] Istio installed and configured
- [ ] Namespace created
- [ ] Registry accessible

### Code
- [ ] Agent image built and pushed
- [ ] Control API tested locally
- [ ] Helm charts validated
- [ ] Frontend builds successfully

### Security
- [ ] Secrets stored securely
- [ ] Network policies applied
- [ ] TLS certificates valid
- [ ] Rate limiting configured

### Monitoring
- [ ] Prometheus scraping metrics
- [ ] Grafana dashboards created
- [ ] Alerts configured
- [ ] Logs aggregated

---

## 🎓 Learning Resources

### Kubernetes Python Client
- https://github.com/kubernetes-client/python

### Istio Routing
- https://istio.io/latest/docs/tasks/traffic-management/

### Telegram Bot API
- https://core.telegram.org/bots/api

### FastAPI
- https://fastapi.tiangolo.com/

---

## 🔄 Continuous Improvement

### Week 2-4
- Add Discord support
- Implement RAG agents
- Add custom tool builder

### Month 2-3
- Multi-region deployment
- Advanced analytics
- Team collaboration features

### Month 4+
- Agent marketplace
- White-label options
- Enterprise features

---

**Ready to build?** Start with Day 1! 🚀
