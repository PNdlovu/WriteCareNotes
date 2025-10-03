# WriteCareNotes Service Mesh Deployment Script (PowerShell)
# Deploys Istio service mesh with healthcare-specific configurations

param(
    [switch]$DryRun = $false,
    [switch]$SkipValidation = $false
)

$ErrorActionPreference = "Stop"

$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

function Write-Log {
    param([string]$Message, [string]$Color = "Blue")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Colors[$Color]
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

# Check prerequisites
function Test-Prerequisites {
    Write-Log "Checking service mesh prerequisites..."
    
    # Check if istioctl is installed
    try {
        $null = istioctl version --short 2>$null
    }
    catch {
        Write-Error "istioctl is not installed. Please install Istio CLI first."
        Write-Log "Download from: https://istio.io/latest/docs/setup/getting-started/#download"
        exit 1
    }
    
    # Check if kubectl is installed
    try {
        $null = kubectl version --client --short 2>$null
    }
    catch {
        Write-Error "kubectl is not installed. Please install kubectl first."
        exit 1
    }
    
    # Check if cluster is accessible
    try {
        $null = kubectl cluster-info 2>$null
    }
    catch {
        Write-Error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    }
    
    Write-Success "Prerequisites check passed"
}

# Install Istio
function Install-Istio {
    Write-Log "Installing Istio service mesh..."
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would install Istio" -Color "Yellow"
        return
    }
    
    # Create istio-system namespace
    kubectl create namespace istio-system --dry-run=client -o yaml | kubectl apply -f -
    
    # Install Istio with production profile
    try {
        istioctl install --set values.pilot.traceSampling=1.0 --set values.global.meshID=writecarenotes-mesh --set values.global.multiCluster.clusterName=writecarenotes-cluster --set values.global.network=writecarenotes-network -y
        Write-Success "Istio installed successfully"
    }
    catch {
        Write-Error "Failed to install Istio: $($_.Exception.Message)"
        exit 1
    }
    
    # Wait for Istio components to be ready
    Write-Log "Waiting for Istio components to be ready..."
    kubectl wait --for=condition=available deployment/istiod -n istio-system --timeout=300s
    Write-Success "Istio control plane is ready"
}

# Enable sidecar injection
function Enable-SidecarInjection {
    Write-Log "Enabling sidecar injection for healthcare namespaces..."
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would enable sidecar injection" -Color "Yellow"
        return
    }
    
    $namespaces = @("core-healthcare", "operational", "compliance", "integration")
    
    foreach ($ns in $namespaces) {
        try {
            kubectl label namespace $ns istio-injection=enabled --overwrite
            Write-Success "Enabled sidecar injection for namespace: $ns"
        }
        catch {
            Write-Warning "Failed to enable sidecar injection for namespace: $ns"
        }
    }
}

# Deploy service mesh configuration
function Deploy-ServiceMeshConfig {
    Write-Log "Deploying service mesh configuration..."
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would deploy service mesh configuration" -Color "Yellow"
        kubectl apply --dry-run=client -f kubernetes/service-mesh/istio-config.yaml
        kubectl apply --dry-run=client -f kubernetes/service-mesh/circuit-breaker-config.yaml
        return
    }
    
    # Deploy Istio configuration
    kubectl apply -f kubernetes/service-mesh/istio-config.yaml
    Write-Success "Istio configuration deployed"
    
    # Deploy circuit breaker configuration
    kubectl apply -f kubernetes/service-mesh/circuit-breaker-config.yaml
    Write-Success "Circuit breaker configuration deployed"
}

# Deploy distributed tracing
function Deploy-DistributedTracing {
    Write-Log "Deploying distributed tracing with Jaeger..."
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would deploy distributed tracing" -Color "Yellow"
        kubectl apply --dry-run=client -f kubernetes/service-mesh/distributed-tracing-config.yaml
        return
    }
    
    # Install Jaeger operator
    try {
        kubectl create namespace observability --dry-run=client -o yaml | kubectl apply -f -
        kubectl apply -f https://github.com/jaegertracing/jaeger-operator/releases/download/v1.41.0/jaeger-operator.yaml -n observability
        Write-Success "Jaeger operator installed"
    }
    catch {
        Write-Warning "Jaeger operator installation may have failed or already exists"
    }
    
    # Deploy tracing configuration
    kubectl apply -f kubernetes/service-mesh/distributed-tracing-config.yaml
    Write-Success "Distributed tracing configuration deployed"
}

# Verify service mesh deployment
function Test-ServiceMeshDeployment {
    Write-Log "Verifying service mesh deployment..."
    
    # Check Istio components
    Write-Log "Checking Istio components..."
    kubectl get pods -n istio-system
    
    # Check sidecar injection labels
    Write-Log "Checking sidecar injection labels..."
    kubectl get namespaces -l istio-injection=enabled
    
    # Check Istio configuration
    Write-Log "Checking Istio configuration..."
    kubectl get gateway,virtualservice,destinationrule --all-namespaces
    
    # Check tracing components
    Write-Log "Checking tracing components..."
    kubectl get pods -n tracing
    
    Write-Success "Service mesh verification completed"
}

# Display access information
function Show-ServiceMeshInfo {
    Write-Log "Service mesh deployment completed successfully!" -Color "Green"
    Write-Host ""
    Write-Host "=== SERVICE MESH ACCESS INFORMATION ===" -ForegroundColor $Colors.Blue
    Write-Host ""
    Write-Host "To access Istio dashboard (Kiali):" -ForegroundColor $Colors.White
    Write-Host "  kubectl port-forward -n istio-system svc/kiali 20001:20001" -ForegroundColor $Colors.Yellow
    Write-Host "  Then open: http://localhost:20001" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Host "To access Jaeger tracing UI:" -ForegroundColor $Colors.White
    Write-Host "  kubectl port-forward -n tracing svc/writecarenotes-jaeger-query 16686:16686" -ForegroundColor $Colors.Yellow
    Write-Host "  Then open: http://localhost:16686" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Host "To check service mesh status:" -ForegroundColor $Colors.White
    Write-Host "  istioctl proxy-status" -ForegroundColor $Colors.Yellow
    Write-Host "  istioctl analyze" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Host "To view service mesh configuration:" -ForegroundColor $Colors.White
    Write-Host "  kubectl get gateway,virtualservice,destinationrule --all-namespaces" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Success "WriteCareNotes service mesh is ready for healthcare microservices!"
}

# Main execution
function Main {
    Write-Log "Starting WriteCareNotes service mesh deployment..."
    
    try {
        Test-Prerequisites
        Install-Istio
        Enable-SidecarInjection
        Deploy-ServiceMeshConfig
        Deploy-DistributedTracing
        
        if (-not $DryRun) {
            Test-ServiceMeshDeployment
        }
        
        Show-ServiceMeshInfo
    }
    catch {
        Write-Error "Service mesh deployment failed: $($_.Exception.Message)"
        exit 1
    }
}

# Execute main function
Main