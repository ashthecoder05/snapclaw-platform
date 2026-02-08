#!/bin/bash
# Setup script for AI Agent Platform

set -e

echo "🚀 AI Agent Platform - Setup Script"
echo "===================================="

# Configuration
RESOURCE_GROUP=${RESOURCE_GROUP:-"agent-platform-rg"}
ACR_NAME=${ACR_NAME:-"agentplatformacr"}
AKS_NAME=${AKS_NAME:-"agent-platform-aks"}
LOCATION=${LOCATION:-"eastus"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

function print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

function print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Step 1: Check prerequisites
echo ""
echo "1. Checking prerequisites..."

if ! command -v az &> /dev/null; then
    print_error "Azure CLI not found. Please install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    print_error "kubectl not found. Please install: https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    print_error "Docker not found. Please install: https://docs.docker.com/get-docker/"
    exit 1
fi

print_success "All prerequisites installed"

# Step 2: Azure login check
echo ""
echo "2. Checking Azure login..."

if ! az account show &> /dev/null; then
    print_warning "Not logged into Azure. Running 'az login'..."
    az login
fi

SUBSCRIPTION=$(az account show --query name -o tsv)
print_success "Logged into Azure subscription: $SUBSCRIPTION"

# Step 3: Create Resource Group
echo ""
echo "3. Creating Resource Group..."

if az group show --name $RESOURCE_GROUP &> /dev/null; then
    print_warning "Resource group '$RESOURCE_GROUP' already exists"
else
    az group create --name $RESOURCE_GROUP --location $LOCATION
    print_success "Resource group '$RESOURCE_GROUP' created"
fi

# Step 4: Create Azure Container Registry
echo ""
echo "4. Creating Azure Container Registry..."

if az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    print_warning "ACR '$ACR_NAME' already exists"
else
    az acr create \
        --resource-group $RESOURCE_GROUP \
        --name $ACR_NAME \
        --sku Basic \
        --admin-enabled true
    print_success "ACR '$ACR_NAME' created"
fi

# Step 5: Create AKS Cluster
echo ""
echo "5. Creating AKS Cluster (this may take 5-10 minutes)..."

if az aks show --name $AKS_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    print_warning "AKS cluster '$AKS_NAME' already exists"
else
    az aks create \
        --resource-group $RESOURCE_GROUP \
        --name $AKS_NAME \
        --node-count 2 \
        --node-vm-size Standard_B2s \
        --generate-ssh-keys \
        --attach-acr $ACR_NAME \
        --enable-managed-identity
    print_success "AKS cluster '$AKS_NAME' created"
fi

# Step 6: Get AKS credentials
echo ""
echo "6. Configuring kubectl..."

az aks get-credentials \
    --resource-group $RESOURCE_GROUP \
    --name $AKS_NAME \
    --overwrite-existing

print_success "kubectl configured for AKS cluster"

# Step 7: Verify cluster connection
echo ""
echo "7. Verifying cluster connection..."

if kubectl get nodes &> /dev/null; then
    print_success "Successfully connected to AKS cluster"
    kubectl get nodes
else
    print_error "Failed to connect to AKS cluster"
    exit 1
fi

# Step 8: Create namespaces
echo ""
echo "8. Creating Kubernetes namespaces..."

kubectl create namespace agents --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace platform --dry-run=client -o yaml | kubectl apply -f -

print_success "Namespaces created"

# Step 9: Install Istio (optional but recommended)
echo ""
echo "9. Installing Istio (optional)..."
echo "Do you want to install Istio for advanced routing? (y/n)"
read -r INSTALL_ISTIO

if [[ $INSTALL_ISTIO == "y" ]]; then
    if ! command -v istioctl &> /dev/null; then
        print_warning "istioctl not found. Installing..."
        curl -L https://istio.io/downloadIstio | sh -
        export PATH=$PWD/istio-*/bin:$PATH
    fi

    istioctl install --set profile=minimal -y
    kubectl label namespace agents istio-injection=enabled
    print_success "Istio installed"
else
    print_warning "Skipping Istio installation"
fi

# Step 10: Output summary
echo ""
echo "===================================="
echo "✅ Setup Complete!"
echo "===================================="
echo ""
echo "Resources created:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  ACR: $ACR_NAME.azurecr.io"
echo "  AKS Cluster: $AKS_NAME"
echo ""
echo "Next steps:"
echo "  1. Build and push agent image:"
echo "     ./scripts/build.sh"
echo ""
echo "  2. Deploy the platform:"
echo "     ./scripts/deploy.sh"
echo ""
echo "  3. Access the platform:"
echo "     kubectl port-forward -n platform svc/control-api 8000:80"
echo ""
echo "Environment variables to save:"
echo "  export RESOURCE_GROUP=$RESOURCE_GROUP"
echo "  export ACR_NAME=$ACR_NAME"
echo "  export AKS_NAME=$AKS_NAME"