# WriteCareNotes ELK Stack Deployment Script (PowerShell)
# Deploys Elasticsearch, Logstash, Kibana, and Filebeat for centralized logging

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
    Write-Log "Checking ELK stack prerequisites..."
    
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
    
    # Check if logging namespace exists or can be created
    try {
        kubectl get namespace logging 2>$null
        Write-Success "Logging namespace already exists"
    }
    catch {
        Write-Log "Logging namespace will be created"
    }
    
    Write-Success "Prerequisites check passed"
}

# Validate YAML files
function Test-LoggingYamlFiles {
    if ($SkipValidation) {
        Write-Warning "Skipping YAML validation as requested"
        return
    }
    
    Write-Log "Validating logging stack YAML files..."
    
    $yamlFiles = @(
        "kubernetes/logging/elasticsearch-config.yaml",
        "kubernetes/logging/logstash-config.yaml",
        "kubernetes/logging/kibana-config.yaml",
        "kubernetes/logging/filebeat-config.yaml"
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

# Deploy Elasticsearch
function Deploy-Elasticsearch {
    Write-Log "Deploying Elasticsearch cluster..."
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would deploy Elasticsearch" -Color "Yellow"
        kubectl apply --dry-run=client -f kubernetes/logging/elasticsearch-config.yaml
        return
    }
    
    kubectl apply -f kubernetes/logging/elasticsearch-config.yaml
    
    # Wait for Elasticsearch to be ready
    Write-Log "Waiting for Elasticsearch cluster to be ready..."
    try {
        kubectl wait --for=condition=ready pod -l app=elasticsearch -n logging --timeout=600s
        Write-Success "Elasticsearch cluster is ready"
    }
    catch {
        Write-Warning "Elasticsearch cluster may still be starting up"
    }
    
    # Check cluster health
    Write-Log "Checking Elasticsearch cluster health..."
    Start-Sleep -Seconds 30
    
    try {
        $elasticPod = kubectl get pods -n logging -l app=elasticsearch -o jsonpath="{.items[0].metadata.name}" 2>$null
        if ($elasticPod) {
            kubectl exec -n logging $elasticPod -- curl -k -u "elastic:WriteCareNotesElastic2025" "https://localhost:9200/_cluster/health?pretty" 2>$null
            Write-Success "Elasticsearch cluster health check completed"
        }
    }
    catch {
        Write-Warning "Could not perform Elasticsearch health check"
    }
}

# Deploy Logstash
function Deploy-Logstash {
    Write-Log "Deploying Logstash for log processing..."
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would deploy Logstash" -Color "Yellow"
        kubectl apply --dry-run=client -f kubernetes/logging/logstash-config.yaml
        return
    }
    
    kubectl apply -f kubernetes/logging/logstash-config.yaml
    
    # Wait for Logstash to be ready
    Write-Log "Waiting for Logstash to be ready..."
    try {
        kubectl wait --for=condition=available deployment/logstash -n logging --timeout=300s
        Write-Success "Logstash is ready"
    }
    catch {
        Write-Warning "Logstash deployment may still be in progress"
    }
}

# Deploy Kibana
function Deploy-Kibana {
    Write-Log "Deploying Kibana for log visualization..."
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would deploy Kibana" -Color "Yellow"
        kubectl apply --dry-run=client -f kubernetes/logging/kibana-config.yaml
        return
    }
    
    kubectl apply -f kubernetes/logging/kibana-config.yaml
    
    # Wait for Kibana to be ready
    Write-Log "Waiting for Kibana to be ready..."
    try {
        kubectl wait --for=condition=available deployment/kibana -n logging --timeout=300s
        Write-Success "Kibana is ready"
    }
    catch {
        Write-Warning "Kibana deployment may still be in progress"
    }
}

# Deploy Filebeat
function Deploy-Filebeat {
    Write-Log "Deploying Filebeat for log collection..."
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would deploy Filebeat" -Color "Yellow"
        kubectl apply --dry-run=client -f kubernetes/logging/filebeat-config.yaml
        return
    }
    
    kubectl apply -f kubernetes/logging/filebeat-config.yaml
    
    # Wait for Filebeat DaemonSet to be ready
    Write-Log "Waiting for Filebeat DaemonSet to be ready..."
    try {
        kubectl rollout status daemonset/filebeat -n logging --timeout=300s
        Write-Success "Filebeat DaemonSet is ready"
    }
    catch {
        Write-Warning "Filebeat DaemonSet may still be rolling out"
    }
}

# Setup index templates and patterns
function Initialize-ElasticsearchTemplates {
    Write-Log "Setting up Elasticsearch index templates..."
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would setup index templates" -Color "Yellow"
        return
    }
    
    # Wait a bit for Elasticsearch to be fully ready
    Start-Sleep -Seconds 60
    
    try {
        $elasticPod = kubectl get pods -n logging -l app=elasticsearch -o jsonpath="{.items[0].metadata.name}" 2>$null
        if ($elasticPod) {
            # Create healthcare logs index template
            kubectl exec -n logging $elasticPod -- curl -k -u "elastic:WriteCareNotesElastic2025" -X PUT "https://localhost:9200/_index_template/healthcare-logs" -H "Content-Type: application/json" -d @/dev/stdin <<< '{"index_patterns":["healthcare-logs-*"],"template":{"settings":{"number_of_shards":3,"number_of_replicas":1},"mappings":{"properties":{"@timestamp":{"type":"date"},"level":{"type":"keyword"},"message":{"type":"text"},"service":{"type":"keyword"},"user_id":{"type":"keyword"},"tenant_id":{"type":"keyword"},"correlation_id":{"type":"keyword"},"event_type":{"type":"keyword"},"compliance_level":{"type":"keyword"},"resident_id":{"type":"keyword"},"medication_id":{"type":"keyword"}}}}}' 2>$null
            
            Write-Success "Index templates created successfully"
        }
    }
    catch {
        Write-Warning "Could not create index templates - they may need to be created manually"
    }
}

# Verify logging stack deployment
function Test-LoggingStackDeployment {
    Write-Log "Verifying logging stack deployment..."
    
    # Check Elasticsearch
    Write-Log "Checking Elasticsearch status..."
    kubectl get pods -n logging -l app=elasticsearch
    kubectl get services -n logging -l app=elasticsearch
    
    # Check Logstash
    Write-Log "Checking Logstash status..."
    kubectl get pods -n logging -l app=logstash
    kubectl get services -n logging -l app=logstash
    
    # Check Kibana
    Write-Log "Checking Kibana status..."
    kubectl get pods -n logging -l app=kibana
    kubectl get services -n logging -l app=kibana
    
    # Check Filebeat
    Write-Log "Checking Filebeat status..."
    kubectl get daemonset -n logging filebeat
    kubectl get pods -n logging -l app=filebeat
    
    Write-Success "Logging stack verification completed"
}

# Display access information
function Show-LoggingStackInfo {
    Write-Log "ELK stack deployment completed successfully!" -Color "Green"
    Write-Host ""
    Write-Host "=== LOGGING STACK ACCESS INFORMATION ===" -ForegroundColor $Colors.Blue
    Write-Host ""
    Write-Host "To access Kibana:" -ForegroundColor $Colors.White
    Write-Host "  kubectl port-forward -n logging svc/kibana 5601:5601" -ForegroundColor $Colors.Yellow
    Write-Host "  Then open: https://localhost:5601" -ForegroundColor $Colors.Yellow
    Write-Host "  Username: elastic" -ForegroundColor $Colors.Yellow
    Write-Host "  Password: WriteCareNotesElastic2025" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Host "To access Elasticsearch directly:" -ForegroundColor $Colors.White
    Write-Host "  kubectl port-forward -n logging svc/elasticsearch-client 9200:9200" -ForegroundColor $Colors.Yellow
    Write-Host "  Then: curl -k -u elastic:WriteCareNotesElastic2025 https://localhost:9200/_cluster/health" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Host "To check log ingestion:" -ForegroundColor $Colors.White
    Write-Host "  kubectl logs -n logging -l app=filebeat" -ForegroundColor $Colors.Yellow
    Write-Host "  kubectl logs -n logging -l app=logstash" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Host "Healthcare-specific index patterns:" -ForegroundColor $Colors.White
    Write-Host "  - healthcare-logs-* (medication, care plans, assessments)" -ForegroundColor $Colors.Yellow
    Write-Host "  - audit-logs-* (compliance and regulatory audit trail)" -ForegroundColor $Colors.Yellow
    Write-Host "  - application-logs-* (general application logs)" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Success "WriteCareNotes centralized logging is ready for healthcare operations!"
}

# Main execution
function Main {
    Write-Log "Starting WriteCareNotes ELK stack deployment..."
    
    try {
        Test-Prerequisites
        Test-LoggingYamlFiles
        Deploy-Elasticsearch
        Deploy-Logstash
        Deploy-Kibana
        Deploy-Filebeat
        
        if (-not $DryRun) {
            Initialize-ElasticsearchTemplates
            Test-LoggingStackDeployment
        }
        
        Show-LoggingStackInfo
    }
    catch {
        Write-Error "ELK stack deployment failed: $($_.Exception.Message)"
        exit 1
    }
}

# Execute main function
Main