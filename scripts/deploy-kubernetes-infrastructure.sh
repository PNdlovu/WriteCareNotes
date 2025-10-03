#!/bin/bash

# WriteCareNotes Kubernetes Infrastructure Deployment Script
# This script deploys the complete microservices infrastructure foundation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        error "helm is not installed. Please install helm first."
        exit 1
    fi
    
    # Check if cluster is accessible
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Validate Kubernetes YAML files
validate_yaml_files() {
    log "Validating Kubernetes YAML files..."
    
    local yaml_files=(
        "kubernetes/cluster/namespace-config.yaml"
        "kubernetes/cluster/ingress-controller.yaml"
        "kubernetes/monitoring/prometheus-config.yaml"
        "kubernetes/monitoring/grafana-config.yaml"
        "kubernetes/cluster/load-balancer-config.yaml"
    )
    
    for file in "${yaml_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            error "Required file $file not found"
            exit 1
        fi
        
        # Validate YAML syntax
        if ! kubectl apply --dry-run=client -f "$file" &> /dev/null; then
            error "Invalid YAML syntax in $file"
            exit 1
        fi
        
        success "Validated $file"
    done
}

# Deploy namespaces
deploy_namespaces() {
    log "Deploying namespaces..."
    
    kubectl apply -f kubernetes/cluster/namespace-config.yaml
    
    # Wait for namespaces to be ready
    local namespaces=("core-healthcare" "operational" "compliance" "integration" "ai-analytics" "infrastructure" "monitoring")
    
    for ns in "${namespaces[@]}"; do
        kubectl wait --for=condition=Ready namespace/$ns --timeout=60s
        success "Namespace $ns is ready"
    done
}

# Deploy monitoring infrastructure
deploy_monitoring() {
    log "Deploying monitoring infrastructure..."
    
    # Deploy Prometheus
    kubectl apply -f kubernetes/monitoring/prometheus-config.yaml
    
    # Wait for Prometheus to be ready
    kubectl wait --for=condition=available deployment/prometheus -n monitoring --timeout=300s
    success "Prometheus deployed successfully"
    
    # Deploy Grafana
    kubectl apply -f kubernetes/monitoring/grafana-config.yaml
    
    # Wait for Grafana to be ready
    kubectl wait --for=condition=available deployment/grafana -n monitoring --timeout=300s
    success "Grafana deployed successfully"
}

# Deploy ingress controller
deploy_ingress() {
    log "Deploying NGINX Ingress Controller..."
    
    # Add ingress-nginx helm repository
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo update
    
    # Deploy ingress controller
    kubectl apply -f kubernetes/cluster/ingress-controller.yaml
    
    # Wait for ingress controller to be ready
    kubectl wait --namespace ingress-nginx \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=300s
    
    success "NGINX Ingress Controller deployed successfully"
}

# Deploy load balancer configuration
deploy_load_balancer() {
    log "Deploying load balancer configuration..."
    
    kubectl apply -f kubernetes/cluster/load-balancer-config.yaml
    
    success "Load balancer configuration deployed successfully"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check namespace status
    log "Checking namespace status..."
    kubectl get namespaces -l tier
    
    # Check monitoring services
    log "Checking monitoring services..."
    kubectl get pods -n monitoring
    kubectl get services -n monitoring
    
    # Check ingress controller
    log "Checking ingress controller..."
    kubectl get pods -n ingress-nginx
    kubectl get services -n ingress-nginx
    
    # Check if Prometheus is accessible
    log "Checking Prometheus health..."
    if kubectl port-forward -n monitoring svc/prometheus 9090:9090 &
    then
        local port_forward_pid=$!
        sleep 5
        
        if curl -s http://localhost:9090/-/healthy > /dev/null; then
            success "Prometheus is healthy"
        else
            warning "Prometheus health check failed"
        fi
        
        kill $port_forward_pid 2>/dev/null || true
    fi
    
    # Check if Grafana is accessible
    log "Checking Grafana health..."
    if kubectl port-forward -n monitoring svc/grafana 3000:3000 &
    then
        local port_forward_pid=$!
        sleep 5
        
        if curl -s http://localhost:3000/api/health > /dev/null; then
            success "Grafana is healthy"
        else
            warning "Grafana health check failed"
        fi
        
        kill $port_forward_pid 2>/dev/null || true
    fi
    
    success "Deployment verification completed"
}

# Display access information
display_access_info() {
    log "Deployment completed successfully!"
    echo ""
    echo "=== ACCESS INFORMATION ==="
    echo ""
    echo "To access Prometheus:"
    echo "  kubectl port-forward -n monitoring svc/prometheus 9090:9090"
    echo "  Then open: http://localhost:9090"
    echo ""
    echo "To access Grafana:"
    echo "  kubectl port-forward -n monitoring svc/grafana 3000:3000"
    echo "  Then open: http://localhost:3000"
    echo "  Default credentials: admin / WriteCareNotesGrafana2025"
    echo ""
    echo "To check ingress controller status:"
    echo "  kubectl get services -n ingress-nginx"
    echo ""
    echo "To view all deployed resources:"
    echo "  kubectl get all --all-namespaces -l tier"
    echo ""
    success "WriteCareNotes microservices infrastructure is ready!"
}

# Main execution
main() {
    log "Starting WriteCareNotes Kubernetes infrastructure deployment..."
    
    check_prerequisites
    validate_yaml_files
    deploy_namespaces
    deploy_monitoring
    deploy_ingress
    deploy_load_balancer
    verify_deployment
    display_access_info
}

# Execute main function
main "$@"