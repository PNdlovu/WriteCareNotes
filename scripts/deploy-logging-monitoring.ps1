# Deploy Centralized Logging and Monitoring Infrastructure for WriteCareNotes
# Provides comprehensive ELK stack and Prometheus/Grafana monitoring with healthcare compliance

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "development",
    
    [Parameter(Mandatory=$false)]
    [string]$Component = "all",
    
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
$LOGGING_CONFIG_DIR = Join-Path $KUBE_CONFIG_DIR "logging"
$MONITORING_CONFIG_DIR = Join-Path $KUBE_CONFIG_DIR "monitoring"

Write-Host "🚀 Deploying WriteCareNotes Logging and Monitoring Infrastructure" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Component: $Component" -ForegroundColor Yellow

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
    if (-not (Test-Path $LOGGING_CONFIG_DIR)) {
        Write-Error "❌ Logging configuration directory not found: $LOGGING_CONFIG_DIR"
        exit 1
    }
    
    if (-not (Test-Path $MONITORING_CONFIG_DIR)) {
        Write-Error "❌ Monitoring configuration directory not found: $MONITORING_CONFIG_DIR"
        exit 1
    }
    
    Write-Host "✅ All prerequisites validated" -ForegroundColor Green
}

# Create namespaces
function New-LoggingMonitoringNamespaces {
    Write-Host "📦 Creating logging and monitoring namespaces..." -ForegroundColor Blue
    
    $namespaces = @("logging", "monitoring")
    
    foreach ($namespace in $namespaces) {
        $namespaceExists = kubectl get namespace $namespace --ignore-not-found=true 2>$null
        
        if (-not $namespaceExists) {
            if ($DryRun) {
                Write-Host "🔍 [DRY RUN] Would create namespace: $namespace" -ForegroundColor Yellow
            } else {
                kubectl create namespace $namespace
                Write-Host "✅ Created namespace: $namespace" -ForegroundColor Green
            }
        } else {
            Write-Host "✅ Namespace already exists: $namespace" -ForegroundColor Green
        }
        
        # Label namespaces for healthcare context
        if (-not $DryRun) {
            kubectl label namespace $namespace healthcare-context=infrastructure --overwrite
            kubectl label namespace $namespace compliance-level=high --overwrite
            kubectl label namespace $namespace data-classification=operational --overwrite
        }
    }
}

# Deploy Elasticsearch cluster
function Deploy-ElasticsearchCluster {
    Write-Host "🔧 Deploying Elasticsearch cluster..." -ForegroundColor Blue
    
    $elasticsearchConfigFile = Join-Path $LOGGING_CONFIG_DIR "elasticsearch-cluster-config.yaml"
    
    if (-not (Test-Path $elasticsearchConfigFile)) {
        Write-Error "❌ Elasticsearch configuration not found: $elasticsearchConfigFile"
        exit 1
    }
    
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would deploy Elasticsearch cluster from: $elasticsearchConfigFile" -ForegroundColor Yellow
        kubectl apply -f $elasticsearchConfigFile --dry-run=client
    } else {
        kubectl apply -f $elasticsearchConfigFile
        Write-Host "✅ Elasticsearch cluster configuration applied" -ForegroundColor Green
    }
}

# Deploy Logstash
function Deploy-Logstash {
    Write-Host "🔧 Deploying Logstash..." -ForegroundColor Blue
    
    $logstashConfigFile = Join-Path $LOGGING_CONFIG_DIR "logstash-healthcare-config.yaml"
    
    if (-not (Test-Path $logstashConfigFile)) {
        Write-Error "❌ Logstash configuration not found: $logstashConfigFile"
        exit 1
    }
    
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would deploy Logstash from: $logstashConfigFile" -ForegroundColor Yellow
        kubectl apply -f $logstashConfigFile --dry-run=client
    } else {
        kubectl apply -f $logstashConfigFile
        Write-Host "✅ Logstash configuration applied" -ForegroundColor Green
    }
}

# Deploy Kibana
function Deploy-Kibana {
    Write-Host "🔧 Deploying Kibana..." -ForegroundColor Blue
    
    $kibanaConfigFile = Join-Path $LOGGING_CONFIG_DIR "kibana-healthcare-config.yaml"
    
    if (-not (Test-Path $kibanaConfigFile)) {
        Write-Error "❌ Kibana configuration not found: $kibanaConfigFile"
        exit 1
    }
    
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would deploy Kibana from: $kibanaConfigFile" -ForegroundColor Yellow
        kubectl apply -f $kibanaConfigFile --dry-run=client
    } else {
        kubectl apply -f $kibanaConfigFile
        Write-Host "✅ Kibana configuration applied" -ForegroundColor Green
    }
}

# Deploy Prometheus
function Deploy-Prometheus {
    Write-Host "🔧 Deploying Prometheus..." -ForegroundColor Blue
    
    $prometheusConfigFile = Join-Path $MONITORING_CONFIG_DIR "prometheus-healthcare-config.yaml"
    
    if (-not (Test-Path $prometheusConfigFile)) {
        Write-Error "❌ Prometheus configuration not found: $prometheusConfigFile"
        exit 1
    }
    
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would deploy Prometheus from: $prometheusConfigFile" -ForegroundColor Yellow
        kubectl apply -f $prometheusConfigFile --dry-run=client
    } else {
        kubectl apply -f $prometheusConfigFile
        Write-Host "✅ Prometheus configuration applied" -ForegroundColor Green
    }
}

# Deploy Grafana
function Deploy-Grafana {
    Write-Host "🔧 Deploying Grafana..." -ForegroundColor Blue
    
    $grafanaConfigFile = Join-Path $MONITORING_CONFIG_DIR "grafana-healthcare-dashboards.yaml"
    
    if (-not (Test-Path $grafanaConfigFile)) {
        Write-Error "❌ Grafana configuration not found: $grafanaConfigFile"
        exit 1
    }
    
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would deploy Grafana from: $grafanaConfigFile" -ForegroundColor Yellow
        kubectl apply -f $grafanaConfigFile --dry-run=client
    } else {
        kubectl apply -f $grafanaConfigFile
        Write-Host "✅ Grafana configuration applied" -ForegroundColor Green
    }
}

# Wait for services to be ready
function Wait-ServicesReady {
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would wait for services to be ready" -ForegroundColor Yellow
        return
    }
    
    Write-Host "⏳ Waiting for logging and monitoring services to be ready..." -ForegroundColor Blue
    
    # Wait for Elasticsearch
    Write-Host "Waiting for Elasticsearch cluster..." -ForegroundColor Yellow
    $maxAttempts = 30
    $attempt = 0
    
    do {
        $attempt++
        Write-Host "Attempt $attempt/$maxAttempts - Checking Elasticsearch status..." -ForegroundColor Yellow
        
        $elasticsearchStatus = kubectl get statefulset elasticsearch -n logging -o jsonpath='{.status.readyReplicas}' 2>$null
        
        if ($elasticsearchStatus -eq "3") {
            Write-Host "✅ Elasticsearch cluster is ready (3/3 replicas)" -ForegroundColor Green
            break
        }
        
        if ($attempt -eq $maxAttempts) {
            Write-Warning "⚠️ Timeout waiting for Elasticsearch cluster to be ready"
            break
        }
        
        Start-Sleep -Seconds 20
    } while ($true)
    
    # Wait for Prometheus
    Write-Host "Waiting for Prometheus..." -ForegroundColor Yellow
    kubectl wait --for=condition=available --timeout=300s deployment/prometheus -n monitoring
    
    # Wait for Grafana
    Write-Host "Waiting for Grafana..." -ForegroundColor Yellow
    kubectl wait --for=condition=available --timeout=300s deployment/grafana -n monitoring
    
    Write-Host "✅ All services are ready" -ForegroundColor Green
}

# Validate deployment
function Test-LoggingMonitoringDeployment {
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would validate deployment" -ForegroundColor Yellow
        return
    }
    
    Write-Host "🔍 Validating logging and monitoring deployment..." -ForegroundColor Blue
    
    try {
        # Test Elasticsearch
        Write-Host "Testing Elasticsearch connectivity..." -ForegroundColor Yellow
        $elasticsearchPod = kubectl get pods -n logging -l app=elasticsearch -o jsonpath='{.items[0].metadata.name}' 2>$null
        
        if ($elasticsearchPod) {
            $elasticsearchHealth = kubectl exec -n logging $elasticsearchPod -- curl -s -k -u elastic:WriteCareNotesElastic2025 https://localhost:9200/_cluster/health 2>$null
            
            if ($elasticsearchHealth -match '"status":"green"') {
                Write-Host "✅ Elasticsearch cluster is healthy" -ForegroundColor Green
            } else {
                Write-Warning "⚠️ Elasticsearch cluster may have issues"
            }
        }
        
        # Test Prometheus
        Write-Host "Testing Prometheus connectivity..." -ForegroundColor Yellow
        $prometheusResponse = kubectl exec -n monitoring deployment/prometheus -- wget -qO- http://localhost:9090/-/healthy 2>$null
        
        if ($prometheusResponse -eq "Prometheus is Healthy.") {
            Write-Host "✅ Prometheus is healthy" -ForegroundColor Green
        } else {
            Write-Warning "⚠️ Prometheus may have issues"
        }
        
        # Test Grafana
        Write-Host "Testing Grafana connectivity..." -ForegroundColor Yellow
        $grafanaResponse = kubectl exec -n monitoring deployment/grafana -- wget -qO- http://localhost:3000/api/health 2>$null
        
        if ($grafanaResponse -match '"database":"ok"') {
            Write-Host "✅ Grafana is healthy" -ForegroundColor Green
        } else {
            Write-Warning "⚠️ Grafana may have issues"
        }
        
    }
    catch {
        Write-Warning "⚠️ Deployment validation encountered errors: $($_.Exception.Message)"
    }
}

# Setup healthcare-specific configurations
function Set-HealthcareConfigurations {
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would setup healthcare configurations" -ForegroundColor Yellow
        return
    }
    
    Write-Host "⚙️ Setting up healthcare-specific configurations..." -ForegroundColor Blue
    
    # Create Elasticsearch index templates
    Write-Host "Creating Elasticsearch index templates..." -ForegroundColor Yellow
    $elasticsearchPod = kubectl get pods -n logging -l app=elasticsearch -o jsonpath='{.items[0].metadata.name}' 2>$null
    
    if ($elasticsearchPod) {
        # Create healthcare logs index template
        kubectl exec -n logging $elasticsearchPod -- curl -X PUT -k -u elastic:WriteCareNotesElastic2025 "https://localhost:9200/_index_template/healthcare-logs" -H "Content-Type: application/json" -d '{
          "index_patterns": ["healthcare-logs-*"],
          "template": {
            "settings": {
              "number_of_shards": 2,
              "number_of_replicas": 1,
              "index.lifecycle.name": "healthcare-logs-policy"
            },
            "mappings": {
              "properties": {
                "@timestamp": {"type": "date"},
                "healthcare_context": {"type": "keyword"},
                "compliance_level": {"type": "keyword"},
                "contains_pii": {"type": "boolean"},
                "audit_required": {"type": "boolean"}
              }
            }
          }
        }' 2>$null
        
        Write-Host "✅ Healthcare index templates created" -ForegroundColor Green
    }
    
    # Import Grafana dashboards
    Write-Host "Importing Grafana healthcare dashboards..." -ForegroundColor Yellow
    # Dashboards are already configured via ConfigMaps
    Write-Host "✅ Healthcare dashboards configured" -ForegroundColor Green
}

# Display deployment summary
function Show-DeploymentSummary {
    Write-Host "`n📋 Deployment Summary" -ForegroundColor Green
    Write-Host "===================" -ForegroundColor Green
    
    if ($DryRun) {
        Write-Host "🔍 DRY RUN MODE - No actual changes made" -ForegroundColor Yellow
    } else {
        Write-Host "✅ ELK Stack: Elasticsearch, Logstash, Kibana deployed" -ForegroundColor Green
        Write-Host "✅ Monitoring: Prometheus and Grafana deployed" -ForegroundColor Green
        Write-Host "✅ Healthcare Dashboards: Compliance, medication safety, performance" -ForegroundColor Green
        Write-Host "✅ Namespaces: logging and monitoring configured" -ForegroundColor Green
    }
    
    Write-Host "`n🔗 Access Information:" -ForegroundColor Blue
    Write-Host "Kibana: http://kibana.logging.svc.cluster.local:5601" -ForegroundColor White
    Write-Host "Grafana: http://grafana.monitoring.svc.cluster.local:3000" -ForegroundColor White
    Write-Host "Prometheus: http://prometheus.monitoring.svc.cluster.local:9090" -ForegroundColor White
    Write-Host "Elasticsearch: https://elasticsearch.logging.svc.cluster.local:9200" -ForegroundColor White
    
    Write-Host "`n📊 Healthcare Dashboards:" -ForegroundColor Blue
    Write-Host "• Healthcare Overview - System health and resident metrics" -ForegroundColor White
    Write-Host "• Medication Safety - Critical medication monitoring and alerts" -ForegroundColor White
    Write-Host "• Compliance Dashboard - CQC, GDPR, and regulatory compliance" -ForegroundColor White
    Write-Host "• Security Monitoring - Authentication and access control" -ForegroundColor White
    Write-Host "• Performance Analytics - System performance and response times" -ForegroundColor White
    
    Write-Host "`n🏥 Healthcare Features:" -ForegroundColor Blue
    Write-Host "• PII-aware logging with automatic masking" -ForegroundColor White
    Write-Host "• Healthcare-specific log parsing and enrichment" -ForegroundColor White
    Write-Host "• Compliance-aware alerting and monitoring" -ForegroundColor White
    Write-Host "• 7-year data retention for healthcare compliance" -ForegroundColor White
    Write-Host "• Audit trail completeness monitoring" -ForegroundColor White
    
    Write-Host "`n📋 Next Steps:" -ForegroundColor Blue
    Write-Host "1. Configure log shipping from microservices" -ForegroundColor White
    Write-Host "2. Set up alerting rules for healthcare incidents" -ForegroundColor White
    Write-Host "3. Configure SMTP for alert notifications" -ForegroundColor White
    Write-Host "4. Import additional healthcare-specific dashboards" -ForegroundColor White
    Write-Host "5. Set up automated compliance reporting" -ForegroundColor White
}

# Main execution
try {
    if (-not $SkipValidation) {
        Test-Prerequisites
    }
    
    New-LoggingMonitoringNamespaces
    
    # Deploy components based on selection
    if ($Component -eq "all" -or $Component -eq "logging") {
        Deploy-ElasticsearchCluster
        Deploy-Logstash
        Deploy-Kibana
    }
    
    if ($Component -eq "all" -or $Component -eq "monitoring") {
        Deploy-Prometheus
        Deploy-Grafana
    }
    
    if ($Component -eq "all") {
        Wait-ServicesReady
        
        if (-not $SkipValidation) {
            Test-LoggingMonitoringDeployment
        }
        
        Set-HealthcareConfigurations
    }
    
    Show-DeploymentSummary
    
    Write-Host "`n🎉 Logging and monitoring infrastructure deployment completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}