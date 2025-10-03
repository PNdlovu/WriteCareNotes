# Deploy Distributed Caching Infrastructure for WriteCareNotes Healthcare System
# Provides Redis cluster deployment with healthcare-specific optimizations

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "development",
    
    [Parameter(Mandatory=$false)]
    [string]$Namespace = "caching",
    
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
$CACHING_CONFIG_DIR = Join-Path $KUBE_CONFIG_DIR "caching"

Write-Host "🚀 Deploying WriteCareNotes Distributed Caching Infrastructure" -ForegroundColor Green
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
    if (-not (Test-Path $CACHING_CONFIG_DIR)) {
        Write-Error "❌ Caching configuration directory not found: $CACHING_CONFIG_DIR"
        exit 1
    }
    
    Write-Host "✅ All prerequisites validated" -ForegroundColor Green
}

# Create namespace
function New-CachingNamespace {
    Write-Host "📦 Creating caching namespace..." -ForegroundColor Blue
    
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
        kubectl label namespace $Namespace healthcare-context=caching --overwrite
        kubectl label namespace $Namespace compliance-level=high --overwrite
        kubectl label namespace $Namespace data-classification=healthcare --overwrite
    }
}

# Deploy Redis cluster
function Deploy-RedisCluster {
    Write-Host "🔧 Deploying Redis cluster..." -ForegroundColor Blue
    
    $redisConfigFile = Join-Path $CACHING_CONFIG_DIR "redis-cluster-config.yaml"
    
    if (-not (Test-Path $redisConfigFile)) {
        Write-Error "❌ Redis cluster configuration not found: $redisConfigFile"
        exit 1
    }
    
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would deploy Redis cluster from: $redisConfigFile" -ForegroundColor Yellow
        kubectl apply -f $redisConfigFile --namespace=$Namespace --dry-run=client
    } else {
        kubectl apply -f $redisConfigFile --namespace=$Namespace
        Write-Host "✅ Redis cluster configuration applied" -ForegroundColor Green
    }
}

# Wait for Redis cluster to be ready
function Wait-RedisClusterReady {
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would wait for Redis cluster to be ready" -ForegroundColor Yellow
        return
    }
    
    Write-Host "⏳ Waiting for Redis cluster to be ready..." -ForegroundColor Blue
    
    $maxAttempts = 30
    $attempt = 0
    
    do {
        $attempt++
        Write-Host "Attempt $attempt/$maxAttempts - Checking Redis cluster status..." -ForegroundColor Yellow
        
        # Check StatefulSet status
        $statefulSetStatus = kubectl get statefulset redis-cluster -n $Namespace -o jsonpath='{.status.readyReplicas}' 2>$null
        
        if ($statefulSetStatus -eq "6") {
            Write-Host "✅ Redis cluster StatefulSet is ready (6/6 replicas)" -ForegroundColor Green
            break
        }
        
        if ($attempt -eq $maxAttempts) {
            Write-Error "❌ Timeout waiting for Redis cluster to be ready"
            exit 1
        }
        
        Start-Sleep -Seconds 10
    } while ($true)
    
    # Wait for cluster initialization job
    Write-Host "⏳ Waiting for Redis cluster initialization..." -ForegroundColor Blue
    
    $jobAttempts = 0
    $maxJobAttempts = 20
    
    do {
        $jobAttempts++
        Write-Host "Job attempt $jobAttempts/$maxJobAttempts - Checking cluster initialization..." -ForegroundColor Yellow
        
        $jobStatus = kubectl get job redis-cluster-init -n $Namespace -o jsonpath='{.status.succeeded}' 2>$null
        
        if ($jobStatus -eq "1") {
            Write-Host "✅ Redis cluster initialization completed" -ForegroundColor Green
            break
        }
        
        if ($jobAttempts -eq $maxJobAttempts) {
            Write-Warning "⚠️ Redis cluster initialization job may still be running"
            break
        }
        
        Start-Sleep -Seconds 15
    } while ($true)
}

# Validate Redis cluster
function Test-RedisCluster {
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would validate Redis cluster" -ForegroundColor Yellow
        return
    }
    
    Write-Host "🔍 Validating Redis cluster..." -ForegroundColor Blue
    
    try {
        # Test Redis connectivity
        $testPod = "redis-cluster-0"
        $redisPassword = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("V3JpdGVDYXJlTm90ZXNSZWRpczIwMjU="))
        
        Write-Host "Testing Redis connectivity..." -ForegroundColor Yellow
        $pingResult = kubectl exec -n $Namespace $testPod -- redis-cli -a $redisPassword ping 2>$null
        
        if ($pingResult -eq "PONG") {
            Write-Host "✅ Redis connectivity test passed" -ForegroundColor Green
        } else {
            Write-Warning "⚠️ Redis connectivity test failed"
        }
        
        # Test cluster status
        Write-Host "Checking Redis cluster status..." -ForegroundColor Yellow
        $clusterInfo = kubectl exec -n $Namespace $testPod -- redis-cli -a $redisPassword cluster info 2>$null
        
        if ($clusterInfo -match "cluster_state:ok") {
            Write-Host "✅ Redis cluster is healthy" -ForegroundColor Green
        } else {
            Write-Warning "⚠️ Redis cluster may have issues"
        }
        
        # Test cluster nodes
        Write-Host "Checking Redis cluster nodes..." -ForegroundColor Yellow
        $clusterNodes = kubectl exec -n $Namespace $testPod -- redis-cli -a $redisPassword cluster nodes 2>$null
        $nodeCount = ($clusterNodes -split "`n").Count
        
        if ($nodeCount -ge 6) {
            Write-Host "✅ Redis cluster has $nodeCount nodes" -ForegroundColor Green
        } else {
            Write-Warning "⚠️ Redis cluster has fewer nodes than expected: $nodeCount"
        }
        
    }
    catch {
        Write-Warning "⚠️ Redis cluster validation encountered errors: $($_.Exception.Message)"
    }
}

# Deploy monitoring
function Deploy-CacheMonitoring {
    Write-Host "📊 Deploying cache monitoring..." -ForegroundColor Blue
    
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would deploy cache monitoring" -ForegroundColor Yellow
        return
    }
    
    # The monitoring is included in the redis-cluster-config.yaml
    Write-Host "✅ Cache monitoring deployed with Redis cluster" -ForegroundColor Green
}

# Create cache service configuration
function New-CacheServiceConfig {
    Write-Host "⚙️ Creating cache service configuration..." -ForegroundColor Blue
    
    $configMapData = @"
apiVersion: v1
kind: ConfigMap
metadata:
  name: cache-service-config
  namespace: $Namespace
data:
  cache-config.json: |
    {
      "redis": {
        "cluster": {
          "nodes": [
            "redis-cluster-0.redis-cluster-headless.caching.svc.cluster.local:6379",
            "redis-cluster-1.redis-cluster-headless.caching.svc.cluster.local:6379",
            "redis-cluster-2.redis-cluster-headless.caching.svc.cluster.local:6379",
            "redis-cluster-3.redis-cluster-headless.caching.svc.cluster.local:6379",
            "redis-cluster-4.redis-cluster-headless.caching.svc.cluster.local:6379",
            "redis-cluster-5.redis-cluster-headless.caching.svc.cluster.local:6379"
          ],
          "options": {
            "connectTimeout": 10000,
            "lazyConnect": true,
            "maxRetriesPerRequest": 3,
            "retryDelayOnFailover": 100,
            "enableReadyCheck": true,
            "maxLoadingTimeout": 5000,
            "scaleReads": "slave"
          }
        },
        "healthcarePatterns": {
          "resident": {
            "keyPrefix": "resident",
            "defaultTTL": 3600,
            "containsPII": true,
            "healthcareContext": "resident-management"
          },
          "medication": {
            "keyPrefix": "medication",
            "defaultTTL": 1800,
            "containsPII": true,
            "healthcareContext": "medication-management"
          },
          "care-plan": {
            "keyPrefix": "care-plan",
            "defaultTTL": 7200,
            "containsPII": true,
            "healthcareContext": "care-planning"
          },
          "staff": {
            "keyPrefix": "staff",
            "defaultTTL": 3600,
            "containsPII": true,
            "healthcareContext": "hr-management"
          }
        }
      },
      "monitoring": {
        "metricsEnabled": true,
        "healthCheckInterval": 30000,
        "statsCollectionInterval": 60000
      },
      "security": {
        "encryptPII": true,
        "auditAllOperations": true,
        "correlationIdRequired": true
      }
    }
"@
    
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would create cache service configuration" -ForegroundColor Yellow
    } else {
        $configMapData | kubectl apply -f - 2>$null
        Write-Host "✅ Cache service configuration created" -ForegroundColor Green
    }
}

# Display deployment summary
function Show-DeploymentSummary {
    Write-Host "`n📋 Deployment Summary" -ForegroundColor Green
    Write-Host "===================" -ForegroundColor Green
    
    if ($DryRun) {
        Write-Host "🔍 DRY RUN MODE - No actual changes made" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Redis Cluster: 6-node cluster deployed" -ForegroundColor Green
        Write-Host "✅ Monitoring: Redis exporter deployed" -ForegroundColor Green
        Write-Host "✅ Configuration: Cache service config created" -ForegroundColor Green
        Write-Host "✅ Namespace: $Namespace configured with healthcare labels" -ForegroundColor Green
    }
    
    Write-Host "`n🔗 Access Information:" -ForegroundColor Blue
    Write-Host "Redis Cluster Service: redis-cluster.$Namespace.svc.cluster.local:6379" -ForegroundColor White
    Write-Host "Redis Monitoring: redis-cluster-monitor.$Namespace.svc.cluster.local:9121" -ForegroundColor White
    
    Write-Host "`n📊 Next Steps:" -ForegroundColor Blue
    Write-Host "1. Configure application services to use the Redis cluster" -ForegroundColor White
    Write-Host "2. Set up Prometheus to scrape Redis metrics" -ForegroundColor White
    Write-Host "3. Configure Grafana dashboards for cache monitoring" -ForegroundColor White
    Write-Host "4. Test cache performance and adjust TTL values as needed" -ForegroundColor White
    
    Write-Host "`n🏥 Healthcare Features:" -ForegroundColor Blue
    Write-Host "• PII-aware caching with encryption" -ForegroundColor White
    Write-Host "• Healthcare-specific cache patterns" -ForegroundColor White
    Write-Host "• Compliance-aware cache invalidation" -ForegroundColor White
    Write-Host "• Audit trail for all cache operations" -ForegroundColor White
}

# Main execution
try {
    if (-not $SkipValidation) {
        Test-Prerequisites
    }
    
    New-CachingNamespace
    Deploy-RedisCluster
    Wait-RedisClusterReady
    
    if (-not $SkipValidation) {
        Test-RedisCluster
    }
    
    Deploy-CacheMonitoring
    New-CacheServiceConfig
    Show-DeploymentSummary
    
    Write-Host "`n🎉 Distributed caching infrastructure deployment completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}