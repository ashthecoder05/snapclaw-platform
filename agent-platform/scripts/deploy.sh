#!/bin/bash
# Deploy platform to Kubernetes

set -e

# Configuration
ACR_NAME=${ACR_NAME:-"agentplatformacr"}
DOMAIN=${DOMAIN:-"your-domain.com"}

echo "🚀 Deploying AI Agent Platform"
echo "=============================="

# Step 1: Update deployment files with actual values
echo ""
echo "1. Updating configuration..."

# Create K8s deployment for control API
cat > k8s-control-api.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: control-api
  namespace: platform
spec:
  replicas: 1
  selector:
    matchLabels:
      app: control-api
  template:
    metadata:
      labels:
        app: control-api
    spec:
      containers:
      - name: control-api
        image: $ACR_NAME.azurecr.io/control-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: AGENT_IMAGE
          value: "$ACR_NAME.azurecr.io/agent:latest"
        - name: PLATFORM_DOMAIN
          value: "$DOMAIN"
        - name: AGENTS_NAMESPACE
          value: "agents"
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
---
apiVersion: v1
kind: Service
metadata:
  name: control-api
  namespace: platform
spec:
  selector:
    app: control-api
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
EOF

# Step 2: Deploy control API
echo ""
echo "2. Deploying Control API..."
kubectl apply -f k8s-control-api.yaml

# Step 3: Deploy PostgreSQL (optional for MVP)
echo ""
echo "3. Deploy PostgreSQL database? (y/n)"
read -r DEPLOY_DB

if [[ $DEPLOY_DB == "y" ]]; then
    cat > k8s-postgres.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: platform
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:14
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: agent_platform
        - name: POSTGRES_USER
          value: admin
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: platform
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
---
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: platform
type: Opaque
stringData:
  password: $(openssl rand -base64 32)
EOF

    kubectl apply -f k8s-postgres.yaml
    echo "✓ PostgreSQL deployed"
fi

# Step 4: Wait for deployments
echo ""
echo "4. Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/control-api -n platform

# Step 5: Get service endpoint
echo ""
echo "5. Getting service endpoints..."
CONTROL_API_IP=$(kubectl get svc control-api -n platform -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")

# Step 6: Deploy a test agent
echo ""
echo "6. Deploy a test agent? (y/n)"
read -r DEPLOY_TEST

if [[ $DEPLOY_TEST == "y" ]]; then
    echo "Enter your Telegram bot token:"
    read -r BOT_TOKEN
    echo "Enter your OpenAI API key:"
    read -r OPENAI_KEY

    if [[ -n "$CONTROL_API_IP" && "$CONTROL_API_IP" != "pending" ]]; then
        curl -X POST http://$CONTROL_API_IP/agents/deploy \
            -H "Content-Type: application/json" \
            -d "{
                \"user_id\": \"test-user\",
                \"bot_token\": \"$BOT_TOKEN\",
                \"model\": \"gpt-4o\",
                \"openai_api_key\": \"$OPENAI_KEY\",
                \"platform\": \"telegram\"
            }"
        echo "✓ Test agent deployment requested"
    else
        echo "⚠ Control API not ready yet. Try again in a few minutes."
    fi
fi

# Step 7: Output summary
echo ""
echo "=============================="
echo "✅ Deployment Complete!"
echo "=============================="
echo ""

if [[ -n "$CONTROL_API_IP" && "$CONTROL_API_IP" != "pending" ]]; then
    echo "Control API endpoint: http://$CONTROL_API_IP"
else
    echo "Control API endpoint: Pending (check in a few minutes)"
    echo "Run: kubectl get svc control-api -n platform"
fi

echo ""
echo "Useful commands:"
echo "  # Check pod status"
echo "  kubectl get pods -n platform"
echo "  kubectl get pods -n agents"
echo ""
echo "  # View logs"
echo "  kubectl logs -n platform -l app=control-api"
echo ""
echo "  # Port forward (for local testing)"
echo "  kubectl port-forward -n platform svc/control-api 8000:80"
echo ""
echo "  # Check deployed agents"
echo "  kubectl get deployments -n agents"