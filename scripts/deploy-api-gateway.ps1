# Deploy Kong API Gateway for WriteCareNotes Healthcare System
# Provides secure, compliant API gateway with healthcare-specific features

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "development",
    
    [Parameter(Mandatory=$false)]
    [string]$Namespace = "api-gateway",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipValidation,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

# Set error handling
$ErrorActionPreference = "Stop"

# Configuration
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Split-Path -Parent $SCRIPT_DIR
$KUBE_CONFIG_DIR = Join-Path $PROJECT_ROOT "kubernetes"
$API_GATEWAY_CONFIG_DIR = Join-Path $KUBE_CONFIG_DIR "api-gateway"

Write-Host "🚀 Deploying WriteCareNotes API Gateway Infrastructure" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Namespace: $Namespace" -ForegroundColor Yellow

# Validate prerequisites
function Test-Prerequisites {
    Write-Host "📋 Validating prerequisites..." -ForegroundColor Blue
    
    # Check kubectl
    try {
        $kubectlVersion = kubectl version --client --short 2>$null
        Write-Host "✅ kubectl: $kubectlVersion" -ForegroundColor Green
    }
    catch {
        Write-Error "❌ kubectl not found or not accessible"
        exit 1
    }
    
    # Check cluster connectivity
    try {
        $clusterInfo = kubectl cluster-info --request-timeout=10s 2>$null
        Write-Host "✅ Kubernetes cluster accessible" -ForegroundColor Green
    }
    catch {
        Write-Error "❌ Cannot connect to Kubernetes cluster"
        exit 1
    }
    
    # Check required directories
    if (-not (Test-Path $API_GATEWAY_CONFIG_DIR)) {
        Write-Error "❌ API Gateway configuration directory not found: $API_GATEWAY_CONFIG_DIR"
        exit 1
    }
    
    Write-Host "✅ All prerequisites validated" -ForegroundColor Green
}

# Create namespace
function New-ApiGatewayNamespace {
    Write-Host "📦 Creating API Gateway namespace..." -ForegroundColor Blue
    
    $namespaceExists = kubectl get namespace $Namespace --ignore-not-found=true 2>$null
    
    if (-not $namespaceExists) {
        if ($DryRun) {
            Write-Host "🔍 [DRY RUN] Would create namespace: $Namespace" -ForegroundColor Yellow
        } else {
            kubectl create namespace $Namespace
            Write-Host "✅ Created namespace: $Namespace" -ForegroundColor Green
        }
    } else {
        Write-Host "✅ Namespace already exists: $Namespace" -ForegroundColor Green
    }
    
    # Label namespace for healthcare context
    if (-not $DryRun) {
        kubectl label namespace $Namespace healthcare-context=api-gateway --overwrite
        kubectl label namespace $Namespace compliance-level=high --overwrite
        kubectl label namespace $Namespace data-classification=infrastructure --overwrite
    }
}

# Install Kong CRDs
function Install-KongCRDs {
    Write-Host "🔧 Installing Kong Custom Resource Definitions..." -ForegroundColor Blue
    
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would install Kong CRDs" -ForegroundColor Yellow
        return
    }
    
    try {
        # Install Kong CRDs
        kubectl apply -f https://raw.githubusercontent.com/Kong/kubernetes-ingress-controller/v2.12.0/config/crd/bases/configuration.konghq.com_kongplugins.yaml
        kubectl apply -f https://raw.githubusercontent.com/Kong/kubernetes-ingress-controller/v2.12.0/config/crd/bases/configuration.konghq.com_kongservices.yaml
        kubectl apply -f https://raw.githubusercontent.com/Kong/kubernetes-ingress-controller/v2.12.0/config/crd/bases/configuration.konghq.com_kongroutes.yaml
        kubectl apply -f https://raw.githubusercontent.com/Kong/kubernetes-ingress-controller/v2.12.0/config/crd/bases/configuration.konghq.com_kongconsumers.yaml
        
        Write-Host "✅ Kong CRDs installed successfully" -ForegroundColor Green
    }
    catch {
        Write-Warning "⚠️ Failed to install Kong CRDs: $($_.Exception.Message)"
        Write-Host "Continuing with deployment..." -ForegroundColor Yellow
    }
}

# Deploy Kong Gateway
function Deploy-KongGateway {
    Write-Host "🔧 Deploying Kong Gateway..." -ForegroundColor Blue
    
    $kongConfigFile = Join-Path $API_GATEWAY_CONFIG_DIR "kong-healthcare-config.yaml"
    
    if (-not (Test-Path $kongConfigFile)) {
        Write-Error "❌ Kong configuration not found: $kongConfigFile"
        exit 1
    }
    
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would deploy Kong Gateway from: $kongConfigFile" -ForegroundColor Yellow
        kubectl apply -f $kongConfigFile --namespace=$Namespace --dry-run=client
    } else {
        kubectl apply -f $kongConfigFile --namespace=$Namespace
        Write-Host "✅ Kong Gateway configuration applied" -ForegroundColor Green
    }
}

# Deploy Kong Plugins
function Deploy-KongPlugins {
    Write-Host "🔧 Deploying Kong Healthcare Plugins..." -ForegroundColor Blue
    
    $pluginsConfigFile = Join-Path $API_GATEWAY_CONFIG_DIR "kong-healthcare-plugins.yaml"
    
    if (-not (Test-Path $pluginsConfigFile)) {
        Write-Error "❌ Kong plugins configuration not found: $pluginsConfigFile"
        exit 1
    }
    
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would deploy Kong plugins from: $pluginsConfigFile" -ForegroundColor Yellow
        kubectl apply -f $pluginsConfigFile --namespace=$Namespace --dry-run=client
    } else {
        kubectl apply -f $pluginsConfigFile --namespace=$Namespace
        Write-Host "✅ Kong healthcare plugins configuration applied" -ForegroundColor Green
    }
}

# Deploy Kong Services and Routes
function Deploy-KongServices {
    Write-Host "🔧 Deploying Kong Services and Routes..." -ForegroundColor Blue
    
    $servicesConfigFile = Join-Path $API_GATEWAY_CONFIG_DIR "kong-healthcare-services.yaml"
    
    if (-not (Test-Path $servicesConfigFile)) {
        Write-Error "❌ Kong services configuration not found: $servicesConfigFile"
        exit 1
    }
    
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would deploy Kong services from: $servicesConfigFile" -ForegroundColor Yellow
        kubectl apply -f $servicesConfigFile --namespace=$Namespace --dry-run=client
    } else {
        kubectl apply -f $servicesConfigFile --namespace=$Namespace
        Write-Host "✅ Kong services and routes configuration applied" -ForegroundColor Green
    }
}

# Wait for Kong to be ready
function Wait-KongReady {
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would wait for Kong to be ready" -ForegroundColor Yellow
        return
    }
    
    Write-Host "⏳ Waiting for Kong Gateway to be ready..." -ForegroundColor Blue
    
    # Wait for Kong migration job to complete
    Write-Host "Waiting for Kong database migration..." -ForegroundColor Yellow
    kubectl wait --for=condition=complete --timeout=300s job/kong-migration -n $Namespace
    
    # Wait for Kong deployment
    Write-Host "Waiting for Kong deployment..." -ForegroundColor Yellow
    kubectl wait --for=condition=available --timeout=300s deployment/kong -n $Namespace
    
    Write-Host "✅ Kong Gateway is ready" -ForegroundColor Green
}

# Validate Kong deployment
function Test-KongDeployment {
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would validate Kong deployment" -ForegroundColor Yellow
        return
    }
    
    Write-Host "🔍 Validating Kong Gateway deployment..." -ForegroundColor Blue
    
    try {
        # Test Kong Admin API
        Write-Host "Testing Kong Admin API..." -ForegroundColor Yellow
        $kongPod = kubectl get pods -n $Namespace -l app=kong -o jsonpath='{.items[0].metadata.name}' 2>$null
        
        if ($kongPod) {
            $kongStatus = kubectl exec -n $Namespace $kongPod -- curl -s http://localhost:8001/status 2>$null
            
            if ($kongStatus -match '"database":{"reachable":true}') {
                Write-Host "✅ Kong Admin API is healthy" -ForegroundColor Green
            } else {
                Write-Warning "⚠️ Kong Admin API may have issues"
            }
            
            # Test Kong services
            Write-Host "Checking Kong services..." -ForegroundColor Yellow
            $services = kubectl exec -n $Namespace $kongPod -- curl -s http://localhost:8001/services 2>$null
            
            if ($services -match '"data":\[') {
                Write-Host "✅ Kong services are configured" -ForegroundColor Green
            } else {
                Write-Warning "⚠️ Kong services may not be configured properly"
            }
        }
        
    }
    catch {
        Write-Warning "⚠️ Kong deployment validation encountered errors: $($_.Exception.Message)"
    }
}

# Configure Kong for healthcare
function Set-HealthcareConfiguration {
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would configure Kong for healthcare" -ForegroundColor Yellow
        return
    }
    
    Write-Host "⚙️ Configuring Kong for healthcare compliance..." -ForegroundColor Blue
    
    try {
        $kongPod = kubectl get pods -n $Namespace -l app=kong -o jsonpath='{.items[0].metadata.name}' 2>$null
        
        if ($kongPod) {
            # Enable healthcare plugins globally
            Write-Host "Enabling healthcare plugins..." -ForegroundColor Yellow
            
            # Create global healthcare audit plugin
            kubectl exec -n $Namespace $kongPod -- curl -X POST http://localhost:8001/plugins -d "name=healthcare-audit" -d "config.enabled=true" 2>$null
            
            # Create global rate limiting plugin
            kubectl exec -n $Namespace $kongPod -- curl -X POST http://localhost:8001/plugins -d "name=healthcare-rate-limit" -d "config.enabled=true" 2>$null
            
            Write-Host "✅ Healthcare plugins configured" -ForegroundColor Green
        }
        
    }
    catch {
        Write-Warning "⚠️ Healthcare configuration encountered errors: $($_.Exception.Message)"
    }
}

# Display deployment summary
function Show-DeploymentSummary {
    Write-Host "`n📋 Deployment Summary" -ForegroundColor Green
    Write-Host "===================" -ForegroundColor Green
    
    if ($DryRun) {
        Write-Host "🔍 DRY RUN MODE - No actual changes made" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Kong Gateway: Deployed with PostgreSQL backend" -ForegroundColor Green
        Write-Host "✅ Healthcare Plugins: Authentication, rate limiting, audit logging" -ForegroundColor Green
        Write-Host "✅ Service Routes: All microservices configured with healthcare compliance" -ForegroundColor Green
        Write-Host "✅ Namespace: $Namespace configured with healthcare labels" -ForegroundColor Green
    }
    
    Write-Host "`n🔗 Access Information:" -ForegroundColor Blue
    Write-Host "Kong Proxy: http://kong-proxy.$Namespace.svc.cluster.local" -ForegroundColor White
    Write-Host "Kong Admin: http://kong-admin.$Namespace.svc.cluster.local:8001" -ForegroundColor White
    
    Write-Host "`n🏥 Healthcare Services Configured:" -ForegroundColor Blue
    Write-Host "• Resident Service: /api/v1/residents/*" -ForegroundColor White
    Write-Host "• Medication Service: /api/v1/medications/*, /api/v1/prescriptions/*, /api/v1/mar/*" -ForegroundColor White
    Write-Host "• Care Planning Service: /api/v1/care-plans/*, /api/v1/assessments/*" -ForegroundColor White
    Write-Host "• Assessment Service: /api/v1/assessments/*, /api/v1/risk-assessments/*" -ForegroundColor White
    Write-Host "• Health Records Service: /api/v1/health-records/*, /api/v1/vital-signs/*" -ForegroundColor White
    Write-Host "• Financial Service: /api/v1/billing/*, /api/v1/payments/*, /api/v1/invoices/*" -ForegroundColor White
    Write-Host "• HR Service: /api/v1/staff/*, /api/v1/schedules/*, /api/v1/payroll/*" -ForegroundColor White
    Write-Host "• Compliance Service: /api/v1/compliance/*, /api/v1/cqc/*" -ForegroundColor White
    Write-Host "• Audit Service: /api/v1/audit/*" -ForegroundColor White
    Write-Host "• Reporting Service: /api/v1/reports/*, /api/v1/analytics/*" -ForegroundColor White
    Write-Host "• Identity Service: /api/v1/auth/*, /api/v1/users/*" -ForegroundColor White
    
    Write-Host "`n🔒 Healthcare Security Features:" -ForegroundColor Blue
    Write-Host "• NHS number validation for healthcare endpoints" -ForegroundColor White
    Write-Host "• Healthcare-specific rate limiting by compliance level" -ForegroundColor White
    Write-Host "• Comprehensive audit logging for all API requests" -ForegroundColor White
    Write-Host "• JWT authentication with healthcare context validation" -ForegroundColor White
    Write-Host "• CORS configuration for healthcare web applications" -ForegroundColor White
    Write-Host "• Request size limiting for healthcare data uploads" -ForegroundColor White
    
    Write-Host "`n📋 Next Steps:" -ForegroundColor Blue
    Write-Host "1. Configure SSL certificates for HTTPS endpoints" -ForegroundColor White
    Write-Host "2. Set up external load balancer for production access" -ForegroundColor White
    Write-Host "3. Configure JWT issuer and consumer credentials" -ForegroundColor White
    Write-Host "4. Test API routing and healthcare plugin functionality" -ForegroundColor White
    Write-Host "5. Set up monitoring and alerting for API Gateway metrics" -ForegroundColor White
}

# Main execution
try {
    if (-not $SkipValidation) {
        Test-Prerequisites
    }
    
    New-ApiGatewayNamespace
    Install-KongCRDs
    Deploy-KongGateway
    Deploy-KongPlugins
    Deploy-KongServices
    Wait-KongReady
    
    if (-not $SkipValidation) {
        Test-KongDeployment
    }
    
    Set-HealthcareConfiguration
    Show-DeploymentSummary
    
    Write-Host "`n🎉 API Gateway deployment completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}