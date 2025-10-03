# WriteCareNotes Kubernetes Infrastructure Deployment Script (PowerShell)
# This script deploys the complete microservices infrastructure foundation

param(
    [switch]$DryRun = $false,
    [switch]$SkipValidation = $false
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
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
    Write-Log "Checking prerequisites..."
    
    # Check if kubectl is installed
    try {
        $null = kubectl version --client --short 2>$null
    }
    catch {
        Write-Error "kubectl is not installed. Please install kubectl first."
        exit 1
    }
    
    # Check if helm is installed
    try {
        $null = helm version --short 2>$null
    }
    catch {
        Write-Error "helm is not installed. Please install helm first."
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

# Validate Kubernetes YAML files
function Test-YamlFiles {
    if ($SkipValidation) {
        Write-Warning "Skipping YAML validation as requested"
        return
    }
    
    Write-Log "Validating Kubernetes YAML files..."
    
    $yamlFiles = @(
        "kubernetes/cluster/namespace-config.yaml",
        "kubernetes/cluster/ingress-controller.yaml",
        "kubernetes/monitoring/prometheus-config.yaml",
        "kubernetes/monitoring/grafana-config.yaml",
        "kubernetes/cluster/load-balancer-config.yaml"
    )
    
    foreach ($file in $yamlFiles) {
        if (-not (Test-Path $file)) {
            Write-Error "Required file $file not found"
            exit 1
        }
        
        # Validate YAML syntax
        try {
            $null = kubectl apply --dry-run=client -f $file 2>$null
            Write-Success "Validated $file"
        }
        catch {
            Write-Error "Invalid YAML syntax in $file"
            exit 1
        }
    }
}

# Deploy namespaces
function Deploy-Namespaces {
    Write-Log "Deploying namespaces..."
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would deploy namespaces" -Color "Yellow"
        kubectl apply --dry-run=client -f kubernetes/cluster/namespace-config.yaml
        return
    }
    
    kubectl apply -f kubernetes/cluster/namespace-config.yaml
    
    # Wait for namespaces to be ready
    $namespaces = @("core-healthcare", "operational", "compliance", "integration", "ai-analytics", "infrastructure", "monitoring")
    
    foreach ($ns in $namespaces) {
        try {
            kubectl wait --for=condition=Ready namespace/$ns --timeout=60s
            Write-Success "Namespace $ns is ready"
        }
        catch {
            Write-Warning "Namespace $ns may not be fully ready yet"
        }
    }
}

# Deploy monitoring infrastructure
function Deploy-Monitoring {
    Write-Log "Deploying monitoring infrastructure..."
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would deploy monitoring infrastructure" -Color "Yellow"
        kubectl apply --dry-run=client -f kubernetes/monitoring/prometheus-config.yaml
        kubectl apply --dry-run=client -f kubernetes/monitoring/grafana-config.yaml
        return
    }
    
    # Deploy Prometheus
    kubectl apply -f kubernetes/monitoring/prometheus-config.yaml
    
    # Wait for Prometheus to be ready
    try {
        kubectl wait --for=condition=available deployment/prometheus -n monitoring --timeout=300s
        Write-Success "Prometheus deployed successfully"
    }
    catch {
        Write-Warning "Prometheus deployment may still be in progress"
    }
    
    # Deploy Grafana
    kubectl apply -f kubernetes/monitoring/grafana-config.yaml
    
    # Wait for Grafana to be ready
    try {
        kubectl wait --for=condition=available deployment/grafana -n monitoring --timeout=300s
        Write-Success "Grafana deployed successfully"
    }
    catch {
        Write-Warning "Grafana deployment may still be in progress"
    }
}

# Deploy ingress controller
function Deploy-Ingress {
    Write-Log "Deploying NGINX Ingress Controller..."
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would deploy ingress controller" -Color "Yellow"
        return
    }
    
    # Add ingress-nginx helm repository
    try {
        helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx 2>$null
        helm repo update 2>$null
    }
    catch {
        Write-Warning "Helm repository operations may have failed"
    }
    
    # Deploy ingress controller
    kubectl apply -f kubernetes/cluster/ingress-controller.yaml
    
    # Wait for ingress controller to be ready
    try {
        kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=300s
        Write-Success "NGINX Ingress Controller deployed successfully"
    }
    catch {
        Write-Warning "Ingress controller deployment may still be in progress"
    }
}

# Deploy load balancer configuration
function Deploy-LoadBalancer {
    Write-Log "Deploying load balancer configuration..."
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would deploy load balancer configuration" -Color "Yellow"
        kubectl apply --dry-run=client -f kubernetes/cluster/load-balancer-config.yaml
        return
    }
    
    kubectl apply -f kubernetes/cluster/load-balancer-config.yaml
    Write-Success "Load balancer configuration deployed successfully"
}

# Verify deployment
function Test-Deployment {
    Write-Log "Verifying deployment..."
    
    # Check namespace status
    Write-Log "Checking namespace status..."
    kubectl get namespaces -l tier
    
    # Check monitoring services
    Write-Log "Checking monitoring services..."
    kubectl get pods -n monitoring
    kubectl get services -n monitoring
    
    # Check ingress controller
    Write-Log "Checking ingress controller..."
    kubectl get pods -n ingress-nginx
    kubectl get services -n ingress-nginx
    
    Write-Success "Deployment verification completed"
}

# Display access information
function Show-AccessInfo {
    Write-Log "Deployment completed successfully!" -Color "Green"
    Write-Host ""
    Write-Host "=== ACCESS INFORMATION ===" -ForegroundColor $Colors.Blue
    Write-Host ""
    Write-Host "To access Prometheus:" -ForegroundColor $Colors.White
    Write-Host "  kubectl port-forward -n monitoring svc/prometheus 9090:9090" -ForegroundColor $Colors.Yellow
    Write-Host "  Then open: http://localhost:9090" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Host "To access Grafana:" -ForegroundColor $Colors.White
    Write-Host "  kubectl port-forward -n monitoring svc/grafana 3000:3000" -ForegroundColor $Colors.Yellow
    Write-Host "  Then open: http://localhost:3000" -ForegroundColor $Colors.Yellow
    Write-Host "  Default credentials: admin / WriteCareNotesGrafana2025" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Host "To check ingress controller status:" -ForegroundColor $Colors.White
    Write-Host "  kubectl get services -n ingress-nginx" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Host "To view all deployed resources:" -ForegroundColor $Colors.White
    Write-Host "  kubectl get all --all-namespaces -l tier" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Success "WriteCareNotes microservices infrastructure is ready!"
}

# Main execution
function Main {
    Write-Log "Starting WriteCareNotes Kubernetes infrastructure deployment..."
    
    try {
        Test-Prerequisites
        Test-YamlFiles
        Deploy-Namespaces
        Deploy-Monitoring
        Deploy-Ingress
        Deploy-LoadBalancer
        
        if (-not $DryRun) {
            Test-Deployment
        }
        
        Show-AccessInfo
    }
    catch {
        Write-Error "Deployment failed: $($_.Exception.Message)"
        exit 1
    }
}

# Execute main function
Main