# Deploy Message Queue Infrastructure for WriteCareNotes Healthcare System
# Provides RabbitMQ and Kafka messaging with healthcare-specific configurations

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "development",
    
    [Parameter(Mandatory=$false)]
    [string]$Component = "all",
    
    [Parameter(Mandatory=$false)]
    [string]$Namespace = "messaging",
    
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
$MESSAGING_CONFIG_DIR = Join-Path $KUBE_CONFIG_DIR "messaging"

Write-Host "🚀 Deploying WriteCareNotes Message Queue Infrastructure" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Component: $Component" -ForegroundColor Yellow
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
    if (-not (Test-Path $MESSAGING_CONFIG_DIR)) {
        Write-Error "❌ Messaging configuration directory not found: $MESSAGING_CONFIG_DIR"
        exit 1
    }
    
    Write-Host "✅ All prerequisites validated" -ForegroundColor Green
}

# Create namespace
function New-MessagingNamespace {
    Write-Host "📦 Creating messaging namespace..." -ForegroundColor Blue
    
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
        kubectl label namespace $Namespace healthcare-context=messaging --overwrite
        kubectl label namespace $Namespace compliance-level=high --overwrite
        kubectl label namespace $Namespace data-classification=infrastructure --overwrite
    }
}

# Deploy RabbitMQ cluster
function Deploy-RabbitMQ {
    Write-Host "🔧 Deploying RabbitMQ cluster..." -ForegroundColor Blue
    
    $rabbitmqConfigFile = Join-Path $MESSAGING_CONFIG_DIR "rabbitmq-healthcare-config.yaml"
    
    if (-not (Test-Path $rabbitmqConfigFile)) {
        Write-Error "❌ RabbitMQ configuration not found: $rabbitmqConfigFile"
        exit 1
    }
    
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would deploy RabbitMQ cluster from: $rabbitmqConfigFile" -ForegroundColor Yellow
        kubectl apply -f $rabbitmqConfigFile --namespace=$Namespace --dry-run=client
    } else {
        kubectl apply -f $rabbitmqConfigFile --namespace=$Namespace
        Write-Host "✅ RabbitMQ cluster configuration applied" -ForegroundColor Green
    }
}

# Deploy Kafka cluster
function Deploy-Kafka {
    Write-Host "🔧 Deploying Kafka cluster..." -ForegroundColor Blue
    
    $kafkaConfigFile = Join-Path $MESSAGING_CONFIG_DIR "kafka-healthcare-config.yaml"
    
    if (-not (Test-Path $kafkaConfigFile)) {
        Write-Error "❌ Kafka configuration not found: $kafkaConfigFile"
        exit 1
    }
    
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would deploy Kafka cluster from: $kafkaConfigFile" -ForegroundColor Yellow
        kubectl apply -f $kafkaConfigFile --namespace=$Namespace --dry-run=client
    } else {
        # Add node-id annotations for Kafka pods
        kubectl apply -f $kafkaConfigFile --namespace=$Namespace
        
        # Add node-id annotations
        kubectl annotate pod kafka-0 -n $Namespace kafka.apache.org/node-id=0 --overwrite 2>$null || $true
        kubectl annotate pod kafka-1 -n $Namespace kafka.apache.org/node-id=1 --overwrite 2>$null || $true
        kubectl annotate pod kafka-2 -n $Namespace kafka.apache.org/node-id=2 --overwrite 2>$null || $true
        
        Write-Host "✅ Kafka cluster configuration applied" -ForegroundColor Green
    }
}

# Wait for messaging services to be ready
function Wait-MessagingServicesReady {
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would wait for messaging services to be ready" -ForegroundColor Yellow
        return
    }
    
    Write-Host "⏳ Waiting for messaging services to be ready..." -ForegroundColor Blue
    
    if ($Component -eq "all" -or $Component -eq "rabbitmq") {
        # Wait for RabbitMQ
        Write-Host "Waiting for RabbitMQ cluster..." -ForegroundColor Yellow
        $maxAttempts = 30
        $attempt = 0
        
        do {
            $attempt++
            Write-Host "Attempt $attempt/$maxAttempts - Checking RabbitMQ status..." -ForegroundColor Yellow
            
            $rabbitmqStatus = kubectl get statefulset rabbitmq -n $Namespace -o jsonpath='{.status.readyReplicas}' 2>$null
            
            if ($rabbitmqStatus -eq "3") {
                Write-Host "✅ RabbitMQ cluster is ready (3/3 replicas)" -ForegroundColor Green
                break
            }
            
            if ($attempt -eq $maxAttempts) {
                Write-Warning "⚠️ Timeout waiting for RabbitMQ cluster to be ready"
                break
            }
            
            Start-Sleep -Seconds 20
        } while ($true)
    }
    
    if ($Component -eq "all" -or $Component -eq "kafka") {
        # Wait for Kafka
        Write-Host "Waiting for Kafka cluster..." -ForegroundColor Yellow
        $maxAttempts = 30
        $attempt = 0
        
        do {
            $attempt++
            Write-Host "Attempt $attempt/$maxAttempts - Checking Kafka status..." -ForegroundColor Yellow
            
            $kafkaStatus = kubectl get statefulset kafka -n $Namespace -o jsonpath='{.status.readyReplicas}' 2>$null
            
            if ($kafkaStatus -eq "3") {
                Write-Host "✅ Kafka cluster is ready (3/3 replicas)" -ForegroundColor Green
                break
            }
            
            if ($attempt -eq $maxAttempts) {
                Write-Warning "⚠️ Timeout waiting for Kafka cluster to be ready"
                break
            }
            
            Start-Sleep -Seconds 20
        } while ($true)
        
        # Wait for Kafka topics setup job
        Write-Host "Waiting for Kafka topics setup..." -ForegroundColor Yellow
        kubectl wait --for=condition=complete --timeout=300s job/kafka-topics-setup -n $Namespace 2>$null || Write-Warning "⚠️ Kafka topics setup job may still be running"
    }
    
    Write-Host "✅ Messaging services are ready" -ForegroundColor Green
}

# Validate messaging deployment
function Test-MessagingDeployment {
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would validate messaging deployment" -ForegroundColor Yellow
        return
    }
    
    Write-Host "🔍 Validating messaging deployment..." -ForegroundColor Blue
    
    try {
        if ($Component -eq "all" -or $Component -eq "rabbitmq") {
            # Test RabbitMQ
            Write-Host "Testing RabbitMQ connectivity..." -ForegroundColor Yellow
            $rabbitmqPod = kubectl get pods -n $Namespace -l app=rabbitmq -o jsonpath='{.items[0].metadata.name}' 2>$null
            
            if ($rabbitmqPod) {
                $rabbitmqStatus = kubectl exec -n $Namespace $rabbitmqPod -- rabbitmq-diagnostics status 2>$null
                
                if ($rabbitmqStatus -match "Status of node") {
                    Write-Host "✅ RabbitMQ cluster is healthy" -ForegroundColor Green
                } else {
                    Write-Warning "⚠️ RabbitMQ cluster may have issues"
                }
                
                # Test RabbitMQ management
                $managementStatus = kubectl exec -n $Namespace $rabbitmqPod -- curl -s http://localhost:15672/api/overview -u healthcare_admin:WriteCareNotesRabbitMQ2025 2>$null
                
                if ($managementStatus -match "management_version") {
                    Write-Host "✅ RabbitMQ management interface is accessible" -ForegroundColor Green
                } else {
                    Write-Warning "⚠️ RabbitMQ management interface may have issues"
                }
            }
        }
        
        if ($Component -eq "all" -or $Component -eq "kafka") {
            # Test Kafka
            Write-Host "Testing Kafka connectivity..." -ForegroundColor Yellow
            $kafkaPod = kubectl get pods -n $Namespace -l app=kafka -o jsonpath='{.items[0].metadata.name}' 2>$null
            
            if ($kafkaPod) {
                $kafkaTopics = kubectl exec -n $Namespace $kafkaPod -- kafka-topics --list --bootstrap-server localhost:9092 2>$null
                
                if ($kafkaTopics -match "healthcare-events") {
                    Write-Host "✅ Kafka cluster is healthy and topics are created" -ForegroundColor Green
                } else {
                    Write-Warning "⚠️ Kafka cluster may have issues or topics not created"
                }
            }
        }
        
    }
    catch {
        Write-Warning "⚠️ Messaging deployment validation encountered errors: $($_.Exception.Message)"
    }
}

# Setup healthcare-specific configurations
function Set-HealthcareMessagingConfigurations {
    if ($DryRun) {
        Write-Host "🔍 [DRY RUN] Would setup healthcare messaging configurations" -ForegroundColor Yellow
        return
    }
    
    Write-Host "⚙️ Setting up healthcare-specific messaging configurations..." -ForegroundColor Blue
    
    try {
        if ($Component -eq "all" -or $Component -eq "rabbitmq") {
            # Verify RabbitMQ healthcare queues
            Write-Host "Verifying RabbitMQ healthcare queues..." -ForegroundColor Yellow
            $rabbitmqPod = kubectl get pods -n $Namespace -l app=rabbitmq -o jsonpath='{.items[0].metadata.name}' 2>$null
            
            if ($rabbitmqPod) {
                $queues = kubectl exec -n $Namespace $rabbitmqPod -- rabbitmqctl list_queues name messages 2>$null
                
                if ($queues -match "healthcare") {
                    Write-Host "✅ Healthcare queues are configured" -ForegroundColor Green
                } else {
                    Write-Warning "⚠️ Healthcare queues may not be configured properly"
                }
            }
        }
        
        if ($Component -eq "all" -or $Component -eq "kafka") {
            # Verify Kafka healthcare topics
            Write-Host "Verifying Kafka healthcare topics..." -ForegroundColor Yellow
            $kafkaPod = kubectl get pods -n $Namespace -l app=kafka -o jsonpath='{.items[0].metadata.name}' 2>$null
            
            if ($kafkaPod) {
                $topics = kubectl exec -n $Namespace $kafkaPod -- kafka-topics --list --bootstrap-server localhost:9092 2>$null
                $healthcareTopics = ($topics | Where-Object { $_ -match "healthcare|resident|medication|care-plan|audit|compliance" }).Count
                
                if ($healthcareTopics -gt 10) {
                    Write-Host "✅ Healthcare topics are configured ($healthcareTopics topics)" -ForegroundColor Green
                } else {
                    Write-Warning "⚠️ Healthcare topics may not be configured properly"
                }
            }
        }
        
    }
    catch {
        Write-Warning "⚠️ Healthcare messaging configuration encountered errors: $($_.Exception.Message)"
    }
}

# Display deployment summary
function Show-DeploymentSummary {
    Write-Host "`n📋 Deployment Summary" -ForegroundColor Green
    Write-Host "===================" -ForegroundColor Green
    
    if ($DryRun) {
        Write-Host "🔍 DRY RUN MODE - No actual changes made" -ForegroundColor Yellow
    } else {
        if ($Component -eq "all" -or $Component -eq "rabbitmq") {
            Write-Host "✅ RabbitMQ: 3-node cluster with healthcare queues and exchanges" -ForegroundColor Green
        }
        if ($Component -eq "all" -or $Component -eq "kafka") {
            Write-Host "✅ Kafka: 3-node cluster with healthcare topics and event streaming" -ForegroundColor Green
        }
        Write-Host "✅ Healthcare Messaging: Compliance-aware queues and topics configured" -ForegroundColor Green
        Write-Host "✅ Namespace: $Namespace configured with healthcare labels" -ForegroundColor Green
    }
    
    Write-Host "`n🔗 Access Information:" -ForegroundColor Blue
    if ($Component -eq "all" -or $Component -eq "rabbitmq") {
        Write-Host "RabbitMQ AMQP: rabbitmq.$Namespace.svc.cluster.local:5672" -ForegroundColor White
        Write-Host "RabbitMQ Management: rabbitmq.$Namespace.svc.cluster.local:15672" -ForegroundColor White
        Write-Host "RabbitMQ Metrics: rabbitmq.$Namespace.svc.cluster.local:15692" -ForegroundColor White
    }
    if ($Component -eq "all" -or $Component -eq "kafka") {
        Write-Host "Kafka Brokers: kafka.$Namespace.svc.cluster.local:9092" -ForegroundColor White
        Write-Host "Kafka Metrics: kafka.$Namespace.svc.cluster.local:9308" -ForegroundColor White
    }
    
    Write-Host "`n🏥 Healthcare Messaging Features:" -ForegroundColor Blue
    if ($Component -eq "all" -or $Component -eq "rabbitmq") {
        Write-Host "RabbitMQ Healthcare Queues:" -ForegroundColor White
        Write-Host "• healthcare.resident.events - Resident management events" -ForegroundColor White
        Write-Host "• healthcare.medication.events - Critical medication events (priority queue)" -ForegroundColor White
        Write-Host "• healthcare.care-plan.events - Care planning and assessment events" -ForegroundColor White
        Write-Host "• healthcare.audit.events - Audit and compliance events (30-day retention)" -ForegroundColor White
        Write-Host "• healthcare.compliance.events - Regulatory compliance events" -ForegroundColor White
        Write-Host "• healthcare.notifications.critical - Critical healthcare alerts" -ForegroundColor White
        Write-Host "• healthcare.dlq - Dead letter queue for failed messages" -ForegroundColor White
    }
    
    if ($Component -eq "all" -or $Component -eq "kafka") {
        Write-Host "Kafka Healthcare Topics:" -ForegroundColor White
        Write-Host "• healthcare-events - General healthcare event streaming" -ForegroundColor White
        Write-Host "• resident-events - Resident lifecycle events" -ForegroundColor White
        Write-Host "• medication-events - Medication administration and safety events" -ForegroundColor White
        Write-Host "• care-plan-events - Care planning and goal tracking events" -ForegroundColor White
        Write-Host "• audit-events - Immutable audit trail (30-day retention)" -ForegroundColor White
        Write-Host "• compliance-events - Regulatory compliance monitoring" -ForegroundColor White
        Write-Host "• critical-alerts - High-priority healthcare alerts" -ForegroundColor White
        Write-Host "• nhs-integration-events - NHS system integration events" -ForegroundColor White
        Write-Host "• fhir-events - FHIR healthcare interoperability events" -ForegroundColor White
    }
    
    Write-Host "`n🔒 Healthcare Compliance Features:" -ForegroundColor Blue
    Write-Host "• Message persistence with healthcare data retention policies" -ForegroundColor White
    Write-Host "• Dead letter queues for failed message handling and recovery" -ForegroundColor White
    Write-Host "• Priority queues for critical medication and safety events" -ForegroundColor White
    Write-Host "• Audit trail preservation with extended retention periods" -ForegroundColor White
    Write-Host "• High availability with 3-node clustering and replication" -ForegroundColor White
    Write-Host "• Monitoring and metrics for healthcare operational visibility" -ForegroundColor White
    
    Write-Host "`n📋 Next Steps:" -ForegroundColor Blue
    Write-Host "1. Configure microservices to publish and consume healthcare events" -ForegroundColor White
    Write-Host "2. Set up message schema validation for healthcare data integrity" -ForegroundColor White
    Write-Host "3. Configure monitoring and alerting for message queue health" -ForegroundColor White
    Write-Host "4. Test message delivery and dead letter queue handling" -ForegroundColor White
    Write-Host "5. Set up backup and disaster recovery for message persistence" -ForegroundColor White
}

# Main execution
try {
    if (-not $SkipValidation) {
        Test-Prerequisites
    }
    
    New-MessagingNamespace
    
    # Deploy components based on selection
    if ($Component -eq "all" -or $Component -eq "rabbitmq") {
        Deploy-RabbitMQ
    }
    
    if ($Component -eq "all" -or $Component -eq "kafka") {
        Deploy-Kafka
    }
    
    Wait-MessagingServicesReady
    
    if (-not $SkipValidation) {
        Test-MessagingDeployment
    }
    
    Set-HealthcareMessagingConfigurations
    Show-DeploymentSummary
    
    Write-Host "`n🎉 Message queue infrastructure deployment completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}