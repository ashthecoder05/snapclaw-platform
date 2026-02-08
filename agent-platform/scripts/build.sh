#!/bin/bash
# Build and push Docker images

set -e

# Configuration
ACR_NAME=${ACR_NAME:-"agentplatformacr"}
VERSION=${VERSION:-"latest"}

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔨 Building Docker Images"
echo "========================="

# Login to ACR
echo ""
echo "Logging into Azure Container Registry..."
az acr login --name $ACR_NAME

# Build agent runtime
echo ""
echo "Building agent runtime image..."
docker build -t $ACR_NAME.azurecr.io/agent:$VERSION ./agent-runtime

# Build control API
echo ""
echo "Building control API image..."

# First create a Dockerfile for control API
cat > control-api/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create non-root user
RUN useradd -m -u 1000 apiuser && chown -R apiuser:apiuser /app
USER apiuser

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

docker build -t $ACR_NAME.azurecr.io/control-api:$VERSION ./control-api

# Push images
echo ""
echo "Pushing images to ACR..."
docker push $ACR_NAME.azurecr.io/agent:$VERSION
docker push $ACR_NAME.azurecr.io/control-api:$VERSION

echo ""
echo -e "${GREEN}✓${NC} Images built and pushed successfully!"
echo ""
echo "Images available:"
echo "  - $ACR_NAME.azurecr.io/agent:$VERSION"
echo "  - $ACR_NAME.azurecr.io/control-api:$VERSION"