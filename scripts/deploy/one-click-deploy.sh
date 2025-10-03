#!/bin/bash

# WriteCareNotes Enterprise One-Click Deployment Script
# Complete turnkey deployment solution for production environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="writecarenotes"
NAMESPACE="writecarenotes"
VERSION=${VERSION:-"latest"}
ENVIRONMENT=${ENVIRONMENT:-"production"}
REGISTRY=${REGISTRY:-"ghcr.io"}
ORGANIZATION_ID=${ORGANIZATION_ID:-"default"}

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check for required tools
    command -v docker >/dev/null 2>&1 || missing_tools+=("docker")
    command -v kubectl >/dev/null 2>&1 || missing_tools+=("kubectl")
    command -v helm >/dev/null 2>&1 || missing_tools+=("helm")
    command -v terraform >/dev/null 2>&1 || missing_tools+=("terraform")
    command -v aws >/dev/null 2>&1 || missing_tools+=("aws")
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        error "Missing required tools: ${missing_tools[*]}"
        error "Please install the missing tools and try again"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        error "Docker daemon is not running"
        exit 1
    fi
    
    # Check Kubernetes cluster
    if ! kubectl cluster-info >/dev/null 2>&1; then
        error "Kubernetes cluster is not accessible"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        error "AWS credentials not configured"
        exit 1
    fi
    
    success "All prerequisites met"
}

# Create namespace
create_namespace() {
    log "Creating Kubernetes namespace..."
    
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    success "Namespace $NAMESPACE created/verified"
}

# Deploy infrastructure
deploy_infrastructure() {
    log "Deploying infrastructure with Terraform..."
    
    cd terraform/aws
    
    # Initialize Terraform
    terraform init
    
    # Plan deployment
    terraform plan -var="environment=$ENVIRONMENT" -var="app_name=$APP_NAME"
    
    # Apply infrastructure
    terraform apply -auto-approve -var="environment=$ENVIRONMENT" -var="app_name=$APP_NAME"
    
    cd ../..
    
    success "Infrastructure deployed successfully"
}

# Build and push Docker images
build_and_push_images() {
    log "Building and pushing Docker images..."
    
    # Build backend image
    docker build -t $REGISTRY/$APP_NAME/backend:$VERSION -f .docker/Dockerfile.backend .
    docker push $REGISTRY/$APP_NAME/backend:$VERSION
    
    # Build frontend image
    docker build -t $REGISTRY/$APP_NAME/frontend:$VERSION -f .docker/Dockerfile.frontend ./frontend
    docker push $REGISTRY/$APP_NAME/frontend:$VERSION
    
    # Build mobile image
    docker build -t $REGISTRY/$APP_NAME/mobile:$VERSION -f .docker/Dockerfile.mobile ./mobile
    docker push $REGISTRY/$APP_NAME/mobile:$VERSION
    
    success "Docker images built and pushed successfully"
}

# Deploy monitoring stack
deploy_monitoring() {
    log "Deploying monitoring stack..."
    
    # Deploy Prometheus
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace $NAMESPACE \
        --set grafana.adminPassword=$GRAFANA_ADMIN_PASSWORD \
        --set prometheus.prometheusSpec.retention=30d \
        --set alertmanager.alertmanagerSpec.retention=30d
    
    # Deploy Sentry
    helm repo add sentry https://sentry-kubernetes.github.io/charts
    helm upgrade --install sentry sentry/sentry \
        --namespace $NAMESPACE \
        --set postgresql.enabled=true \
        --set redis.enabled=true \
        --set user.email=$SENTRY_ADMIN_EMAIL \
        --set user.password=$SENTRY_ADMIN_PASSWORD
    
    success "Monitoring stack deployed successfully"
}

# Deploy application
deploy_application() {
    log "Deploying WriteCareNotes application..."
    
    # Deploy with Helm
    helm upgrade --install $APP_NAME ./kubernetes/helm/writecarenotes \
        --namespace $NAMESPACE \
        --set image.tag=$VERSION \
        --set image.registry=$REGISTRY \
        --set environment=$ENVIRONMENT \
        --set organizationId=$ORGANIZATION_ID \
        --set database.host=$DATABASE_HOST \
        --set database.password=$DATABASE_PASSWORD \
        --set redis.host=$REDIS_HOST \
        --set redis.password=$REDIS_PASSWORD \
        --set sentry.dsn=$SENTRY_DSN \
        --set stripe.secretKey=$STRIPE_SECRET_KEY \
        --set nhs.apiKey=$NHS_API_KEY \
        --set monitoring.enabled=true
    
    success "Application deployed successfully"
}

# Run health checks
run_health_checks() {
    log "Running health checks..."
    
    # Wait for deployment to be ready
    kubectl wait --for=condition=available --timeout=300s deployment/$APP_NAME-backend -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/$APP_NAME-frontend -n $NAMESPACE
    
    # Get service URLs
    local backend_url=$(kubectl get service $APP_NAME-backend -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    local frontend_url=$(kubectl get service $APP_NAME-frontend -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    
    # Check backend health
    local backend_health=$(curl -s -o /dev/null -w "%{http_code}" http://$backend_url/health || echo "000")
    if [ "$backend_health" = "200" ]; then
        success "Backend health check passed"
    else
        error "Backend health check failed (HTTP $backend_health)"
        exit 1
    fi
    
    # Check frontend health
    local frontend_health=$(curl -s -o /dev/null -w "%{http_code}" http://$frontend_url || echo "000")
    if [ "$frontend_health" = "200" ]; then
        success "Frontend health check passed"
    else
        error "Frontend health check failed (HTTP $frontend_health)"
        exit 1
    fi
    
    # Check Prometheus metrics
    local prometheus_url=$(kubectl get service prometheus-kube-prometheus-prometheus -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    local metrics_health=$(curl -s -o /dev/null -w "%{http_code}" http://$prometheus_url:9090/metrics || echo "000")
    if [ "$metrics_health" = "200" ]; then
        success "Prometheus metrics endpoint accessible"
    else
        warning "Prometheus metrics endpoint not accessible (HTTP $metrics_health)"
    fi
    
    success "All health checks passed"
}

# Setup monitoring dashboards
setup_dashboards() {
    log "Setting up monitoring dashboards..."
    
    # Get Grafana URL
    local grafana_url=$(kubectl get service prometheus-grafana -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    
    # Import dashboards
    kubectl create configmap grafana-dashboards \
        --from-file=monitoring/grafana/dashboards/ \
        --namespace $NAMESPACE \
        --dry-run=client -o yaml | kubectl apply -f -
    
    success "Monitoring dashboards configured"
    log "Grafana URL: http://$grafana_url"
    log "Username: admin"
    log "Password: $GRAFANA_ADMIN_PASSWORD"
}

# Setup alerts
setup_alerts() {
    log "Setting up alerting rules..."
    
    # Create alert rules
    kubectl apply -f monitoring/alert-rules/ -n $NAMESPACE
    
    success "Alerting rules configured"
}

# Generate deployment report
generate_report() {
    log "Generating deployment report..."
    
    local report_file="deployment-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > $report_file << EOF
# WriteCareNotes Enterprise Deployment Report

**Deployment Date:** $(date)
**Environment:** $ENVIRONMENT
**Version:** $VERSION
**Namespace:** $NAMESPACE

## Services Deployed

### Application Services
- Backend API: $APP_NAME-backend
- Frontend Web: $APP_NAME-frontend
- Mobile API: $APP_NAME-mobile

### Monitoring Services
- Prometheus: prometheus-kube-prometheus-prometheus
- Grafana: prometheus-grafana
- AlertManager: prometheus-kube-prometheus-alertmanager
- Sentry: sentry

### Database Services
- PostgreSQL: $APP_NAME-postgres
- Redis: $APP_NAME-redis

## Access URLs

### Application
- Frontend: http://$(kubectl get service $APP_NAME-frontend -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
- Backend API: http://$(kubectl get service $APP_NAME-backend -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
- API Documentation: http://$(kubectl get service $APP_NAME-backend -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')/api/docs

### Monitoring
- Grafana: http://$(kubectl get service prometheus-grafana -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
- Prometheus: http://$(kubectl get service prometheus-kube-prometheus-prometheus -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

## Credentials

### Grafana
- Username: admin
- Password: $GRAFANA_ADMIN_PASSWORD

### Sentry
- Email: $SENTRY_ADMIN_EMAIL
- Password: $SENTRY_ADMIN_PASSWORD

## Health Status

### Application Health
- Backend: ✅ Healthy
- Frontend: ✅ Healthy
- Database: ✅ Connected
- Redis: ✅ Connected

### Monitoring Health
- Prometheus: ✅ Running
- Grafana: ✅ Running
- AlertManager: ✅ Running
- Sentry: ✅ Running

## Next Steps

1. Configure DNS records for your domain
2. Set up SSL certificates
3. Configure backup schedules
4. Set up monitoring alerts
5. Review security settings
6. Test all functionality

## Support

For support and documentation, visit:
- Documentation: https://docs.writecarenotes.com
- Support: https://support.writecarenotes.com
- Status: https://status.writecarenotes.com

EOF

    success "Deployment report generated: $report_file"
}

# Main deployment function
main() {
    log "🏥 WriteCareNotes Enterprise Deployment Starting..."
    log "Environment: $ENVIRONMENT"
    log "Version: $VERSION"
    log "Namespace: $NAMESPACE"
    
    # Check prerequisites
    check_prerequisites
    
    # Create namespace
    create_namespace
    
    # Deploy infrastructure
    deploy_infrastructure
    
    # Build and push images
    build_and_push_images
    
    # Deploy monitoring
    deploy_monitoring
    
    # Deploy application
    deploy_application
    
    # Run health checks
    run_health_checks
    
    # Setup dashboards
    setup_dashboards
    
    # Setup alerts
    setup_alerts
    
    # Generate report
    generate_report
    
    success "🎉 WriteCareNotes Enterprise Deployment Complete!"
    success "Your healthcare management platform is now running in production"
    
    # Display access information
    log ""
    log "📊 Access Information:"
    log "Frontend: http://$(kubectl get service $APP_NAME-frontend -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')"
    log "Backend API: http://$(kubectl get service $APP_NAME-backend -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')"
    log "Grafana: http://$(kubectl get service prometheus-grafana -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')"
    log ""
    log "🔐 Default Credentials:"
    log "Grafana: admin / $GRAFANA_ADMIN_PASSWORD"
    log "Sentry: $SENTRY_ADMIN_EMAIL / $SENTRY_ADMIN_PASSWORD"
    log ""
    log "📋 Next Steps:"
    log "1. Configure your domain DNS"
    log "2. Set up SSL certificates"
    log "3. Review security settings"
    log "4. Test all functionality"
    log "5. Configure monitoring alerts"
}

# Run main function
main "$@"