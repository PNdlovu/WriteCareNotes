#!/bin/bash

# Pilot Feedback Agent Deployment Script
# This script handles the deployment of the pilot feedback agent orchestration system

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-development}"
TENANT_ID="${2:-}"
DRY_RUN="${3:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required tools are installed
    local required_tools=("kubectl" "helm" "docker" "node" "npm")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed or not in PATH"
            exit 1
        fi
    done
    
    # Check if kubectl context is set
    if ! kubectl cluster-info &> /dev/null; then
        log_error "kubectl cluster context is not set or cluster is not accessible"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker is not running"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Validate environment
validate_environment() {
    log_info "Validating environment: $ENVIRONMENT"
    
    case "$ENVIRONMENT" in
        development|staging|production)
            log_success "Environment $ENVIRONMENT is valid"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT. Must be one of: development, staging, production"
            exit 1
            ;;
    esac
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."
    
    local image_tag="${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"
    
    # Build agent service image
    log_info "Building pilot-feedback-agent image..."
    docker build -t "pilot-feedback-agent:$image_tag" \
        -f "$PROJECT_ROOT/Dockerfile.agent" \
        "$PROJECT_ROOT"
    
    # Build PII masking service image
    log_info "Building pii-masking-service image..."
    docker build -t "pii-masking-service:$image_tag" \
        -f "$PROJECT_ROOT/Dockerfile.masking" \
        "$PROJECT_ROOT"
    
    # Tag images for registry
    local registry="${REGISTRY:-localhost:5000}"
    docker tag "pilot-feedback-agent:$image_tag" "$registry/pilot-feedback-agent:$image_tag"
    docker tag "pii-masking-service:$image_tag" "$registry/pii-masking-service:$image_tag"
    
    log_success "Docker images built successfully"
    echo "IMAGE_TAG=$image_tag" > "$PROJECT_ROOT/.image_tag"
}

# Push images to registry
push_images() {
    log_info "Pushing images to registry..."
    
    local image_tag
    image_tag=$(cat "$PROJECT_ROOT/.image_tag" | cut -d'=' -f2)
    local registry="${REGISTRY:-localhost:5000}"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would push images to $registry"
        return 0
    fi
    
    docker push "$registry/pilot-feedback-agent:$image_tag"
    docker push "$registry/pii-masking-service:$image_tag"
    
    log_success "Images pushed to registry"
}

# Deploy database migrations
deploy_migrations() {
    log_info "Deploying database migrations..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would deploy database migrations"
        return 0
    fi
    
    # Run database migrations
    kubectl run migration-job \
        --image="pilot-feedback-agent:$(cat "$PROJECT_ROOT/.image_tag" | cut -d'=' -f2)" \
        --rm -i --restart=Never \
        --env="NODE_ENV=$ENVIRONMENT" \
        --env="DATABASE_URL=$DATABASE_URL" \
        --command -- npm run migrate
    
    log_success "Database migrations completed"
}

# Deploy Helm charts
deploy_helm() {
    log_info "Deploying Helm charts..."
    
    local image_tag
    image_tag=$(cat "$PROJECT_ROOT/.image_tag" | cut -d'=' -f2)
    local registry="${REGISTRY:-localhost:5000}"
    
    # Create namespace if it doesn't exist
    kubectl create namespace pilot-feedback-agent --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy agent service
    helm upgrade --install pilot-feedback-agent \
        "$PROJECT_ROOT/kubernetes/helm/pilot-feedback-agent" \
        --namespace pilot-feedback-agent \
        --set image.repository="$registry/pilot-feedback-agent" \
        --set image.tag="$image_tag" \
        --set environment="$ENVIRONMENT" \
        --set imagePullSecrets[0].name="registry-secret" \
        --values "$PROJECT_ROOT/kubernetes/helm/pilot-feedback-agent/values-$ENVIRONMENT.yaml" \
        --wait --timeout=10m
    
    # Deploy PII masking service
    helm upgrade --install pii-masking-service \
        "$PROJECT_ROOT/kubernetes/helm/pii-masking-service" \
        --namespace pilot-feedback-agent \
        --set image.repository="$registry/pii-masking-service" \
        --set image.tag="$image_tag" \
        --set environment="$ENVIRONMENT" \
        --set imagePullSecrets[0].name="registry-secret" \
        --values "$PROJECT_ROOT/kubernetes/helm/pii-masking-service/values-$ENVIRONMENT.yaml" \
        --wait --timeout=10m
    
    log_success "Helm charts deployed successfully"
}

# Configure feature flags
configure_feature_flags() {
    log_info "Configuring feature flags..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would configure feature flags"
        return 0
    fi
    
    # Set default feature flags based on environment
    case "$ENVIRONMENT" in
        development)
            kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
                node scripts/set-feature-flags.js \
                --environment=development \
                --enabled-flags="clustering,summarization,recommendations" \
                --disabled-flags="notifications,monitoring"
            ;;
        staging)
            kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
                node scripts/set-feature-flags.js \
                --environment=staging \
                --enabled-flags="clustering,summarization,recommendations,notifications" \
                --disabled-flags="monitoring"
            ;;
        production)
            kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
                node scripts/set-feature-flags.js \
                --environment=production \
                --enabled-flags="clustering,summarization,recommendations,notifications,monitoring" \
                --disabled-flags=""
            ;;
    esac
    
    log_success "Feature flags configured"
}

# Configure tenant-specific settings
configure_tenant() {
    if [ -z "$TENANT_ID" ]; then
        log_info "No tenant ID provided, skipping tenant configuration"
        return 0
    fi
    
    log_info "Configuring tenant: $TENANT_ID"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would configure tenant $TENANT_ID"
        return 0
    fi
    
    # Set tenant-specific configuration
    kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
        node scripts/configure-tenant.js \
        --tenant-id="$TENANT_ID" \
        --environment="$ENVIRONMENT" \
        --enable-agent=false \
        --autonomy="recommend-only"
    
    log_success "Tenant $TENANT_ID configured"
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Wait for pods to be ready
    kubectl wait --for=condition=ready pod -l app=pilot-feedback-agent -n pilot-feedback-agent --timeout=300s
    kubectl wait --for=condition=ready pod -l app=pii-masking-service -n pilot-feedback-agent --timeout=300s
    
    # Check service endpoints
    local agent_service="pilot-feedback-agent-service"
    local masking_service="pii-masking-service"
    
    # Test agent service health
    kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
        curl -f http://localhost:3000/health || {
        log_error "Agent service health check failed"
        return 1
    }
    
    # Test PII masking service health
    kubectl exec -n pilot-feedback-agent deployment/pii-masking-service -- \
        curl -f http://localhost:3001/health || {
        log_error "PII masking service health check failed"
        return 1
    }
    
    log_success "Health checks passed"
}

# Run smoke tests
run_smoke_tests() {
    log_info "Running smoke tests..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would run smoke tests"
        return 0
    fi
    
    # Run basic functionality tests
    kubectl exec -n pilot-feedback-agent deployment/pilot-feedback-agent -- \
        npm run test:smoke || {
        log_error "Smoke tests failed"
        return 1
    }
    
    log_success "Smoke tests passed"
}

# Cleanup old resources
cleanup_old_resources() {
    log_info "Cleaning up old resources..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would cleanup old resources"
        return 0
    fi
    
    # Remove old migration jobs
    kubectl delete job migration-job -n pilot-feedback-agent --ignore-not-found=true
    
    # Clean up old images (keep last 5 tags)
    local registry="${REGISTRY:-localhost:5000}"
    docker images "$registry/pilot-feedback-agent" --format "table {{.Tag}}" | tail -n +6 | xargs -r -I {} docker rmi "$registry/pilot-feedback-agent:{}" || true
    docker images "$registry/pii-masking-service" --format "table {{.Tag}}" | tail -n +6 | xargs -r -I {} docker rmi "$registry/pii-masking-service:{}" || true
    
    log_success "Cleanup completed"
}

# Rollback deployment
rollback_deployment() {
    log_error "Rolling back deployment..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would rollback deployment"
        return 0
    fi
    
    # Rollback Helm releases
    helm rollback pilot-feedback-agent -n pilot-feedback-agent
    helm rollback pii-masking-service -n pilot-feedback-agent
    
    log_success "Rollback completed"
}

# Main deployment function
main() {
    log_info "Starting pilot feedback agent deployment"
    log_info "Environment: $ENVIRONMENT"
    log_info "Tenant ID: ${TENANT_ID:-'Not specified'}"
    log_info "Dry run: $DRY_RUN"
    
    # Set up error handling
    trap 'log_error "Deployment failed. Rolling back..."; rollback_deployment; exit 1' ERR
    
    # Execute deployment steps
    check_prerequisites
    validate_environment
    build_images
    push_images
    deploy_migrations
    deploy_helm
    configure_feature_flags
    configure_tenant
    run_health_checks
    run_smoke_tests
    cleanup_old_resources
    
    log_success "Pilot feedback agent deployment completed successfully!"
    
    # Display deployment information
    echo ""
    log_info "Deployment Summary:"
    echo "  Environment: $ENVIRONMENT"
    echo "  Image Tag: $(cat "$PROJECT_ROOT/.image_tag" | cut -d'=' -f2)"
    echo "  Namespace: pilot-feedback-agent"
    echo "  Agent Service: pilot-feedback-agent-service"
    echo "  PII Masking Service: pii-masking-service"
    echo ""
    
    if [ -n "$TENANT_ID" ]; then
        echo "  Tenant ID: $TENANT_ID"
        echo "  Agent Status: Disabled (requires manual enablement)"
        echo ""
        log_warning "Remember to enable the agent for tenant $TENANT_ID when ready"
    fi
    
    # Clean up temporary files
    rm -f "$PROJECT_ROOT/.image_tag"
}

# Show usage information
show_usage() {
    echo "Usage: $0 <environment> [tenant_id] [dry_run]"
    echo ""
    echo "Arguments:"
    echo "  environment    Deployment environment (development|staging|production)"
    echo "  tenant_id      Optional tenant ID for tenant-specific configuration"
    echo "  dry_run        Set to 'true' for dry run mode (optional)"
    echo ""
    echo "Examples:"
    echo "  $0 development"
    echo "  $0 staging t-123"
    echo "  $0 production t-456 true"
    echo ""
    echo "Environment Variables:"
    echo "  REGISTRY       Docker registry URL (default: localhost:5000)"
    echo "  DATABASE_URL   Database connection URL"
}

# Check if help is requested
if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
    show_usage
    exit 0
fi

# Validate arguments
if [ $# -lt 1 ]; then
    log_error "Missing required argument: environment"
    show_usage
    exit 1
fi

# Run main function
main "$@"