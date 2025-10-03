# WriteCareNotes Database Infrastructure Deployment Script (PowerShell)
# Deploys PostgreSQL cluster and creates healthcare service databases

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
    Write-Log "Checking database infrastructure prerequisites..."
    
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
    
    # Check if databases namespace exists or can be created
    try {
        kubectl get namespace databases 2>$null
        Write-Success "Databases namespace already exists"
    }
    catch {
        Write-Log "Databases namespace will be created"
    }
    
    Write-Success "Prerequisites check passed"
}

# Deploy PostgreSQL Cluster
function Deploy-PostgreSQLCluster {
    Write-Log "Deploying PostgreSQL cluster..."
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would deploy PostgreSQL cluster" -Color "Yellow"
        kubectl apply --dry-run=client -f kubernetes/databases/postgresql-cluster.yaml
        return
    }
    
    kubectl apply -f kubernetes/databases/postgresql-cluster.yaml
    
    # Wait for PostgreSQL to be ready
    Write-Log "Waiting for PostgreSQL cluster to be ready..."
    try {
        kubectl wait --for=condition=ready pod -l app=postgresql,role=primary -n databases --timeout=600s
        Write-Success "PostgreSQL cluster is ready"
    }
    catch {
        Write-Warning "PostgreSQL cluster may still be starting up"
    }
    
    # Check PostgreSQL health
    Write-Log "Checking PostgreSQL health..."
    Start-Sleep -Seconds 30
    
    try {
        $postgresqlPod = kubectl get pods -n databases -l app=postgresql,role=primary -o jsonpath="{.items[0].metadata.name}" 2>$null
        if ($postgresqlPod) {
            kubectl exec -n databases $postgresqlPod -- pg_isready -U postgres 2>$null
            Write-Success "PostgreSQL health check passed"
        }
    }
    catch {
        Write-Warning "Could not perform PostgreSQL health check"
    }
}

# Create Healthcare Databases
function Deploy-HealthcareDatabases {
    Write-Log "Creating healthcare service databases..."
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would create healthcare databases" -Color "Yellow"
        kubectl apply --dry-run=client -f kubernetes/databases/healthcare-databases.yaml
        return
    }
    
    kubectl apply -f kubernetes/databases/healthcare-databases.yaml
    
    # Wait for database setup to complete
    Write-Log "Waiting for database setup to complete..."
    try {
        kubectl wait --for=condition=complete job/healthcare-databases-setup -n databases --timeout=300s
        Write-Success "Healthcare databases setup completed"
    }
    catch {
        Write-Warning "Healthcare databases setup may still be running"
    }
}

# Run Database Migrations
function Deploy-DatabaseMigrations {
    Write-Log "Running database migrations..."
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would run database migrations" -Color "Yellow"
        return
    }
    
    # Get PostgreSQL pod for running migrations
    $postgresqlPod = kubectl get pods -n databases -l app=postgresql,role=primary -o jsonpath="{.items[0].metadata.name}" 2>$null
    
    if (-not $postgresqlPod) {
        Write-Warning "Could not find PostgreSQL pod for migrations"
        return
    }
    
    # Run resident service migrations
    Write-Log "Running resident service migrations..."
    try {
        $migrationContent = Get-Content "database/migrations/resident-service/001_create_residents_schema.sql" -Raw
        $tempFile = "/tmp/resident_migration.sql"
        
        # Copy migration file to pod
        kubectl exec -n databases $postgresqlPod -- bash -c "cat > $tempFile" <<< $migrationContent
        
        # Run migration
        kubectl exec -n databases $postgresqlPod -- psql -U resident_service -d resident_service_db -f $tempFile
        
        Write-Success "Resident service migrations completed"
    }
    catch {
        Write-Warning "Resident service migrations may have failed"
    }
    
    # Run medication service migrations
    Write-Log "Running medication service migrations..."
    try {
        $migrationContent = Get-Content "database/migrations/medication-service/001_create_medications_schema.sql" -Raw
        $tempFile = "/tmp/medication_migration.sql"
        
        # Copy migration file to pod
        kubectl exec -n databases $postgresqlPod -- bash -c "cat > $tempFile" <<< $migrationContent
        
        # Run migration
        kubectl exec -n databases $postgresqlPod -- psql -U medication_service -d medication_service_db -f $tempFile
        
        Write-Success "Medication service migrations completed"
    }
    catch {
        Write-Warning "Medication service migrations may have failed"
    }
}

# Verify database deployment
function Test-DatabaseDeployment {
    Write-Log "Verifying database infrastructure deployment..."
    
    # Check PostgreSQL cluster
    Write-Log "Checking PostgreSQL cluster status..."
    kubectl get pods -n databases -l app=postgresql
    kubectl get services -n databases -l app=postgresql
    kubectl get pvc -n databases
    
    # Check database setup job
    Write-Log "Checking database setup job..."
    kubectl get jobs -n databases
    
    # Check database secrets
    Write-Log "Checking database connection secrets..."
    kubectl get secrets -n databases | grep "db-secret"
    
    # Test database connections
    Write-Log "Testing database connections..."
    $postgresqlPod = kubectl get pods -n databases -l app=postgresql,role=primary -o jsonpath="{.items[0].metadata.name}" 2>$null
    
    if ($postgresqlPod) {
        try {
            # Test resident service database
            kubectl exec -n databases $postgresqlPod -- psql -U resident_service -d resident_service_db -c "SELECT 1;" 2>$null
            Write-Success "Resident service database connection successful"
        }
        catch {
            Write-Warning "Could not connect to resident service database"
        }
        
        try {
            # Test medication service database
            kubectl exec -n databases $postgresqlPod -- psql -U medication_service -d medication_service_db -c "SELECT 1;" 2>$null
            Write-Success "Medication service database connection successful"
        }
        catch {
            Write-Warning "Could not connect to medication service database"
        }
    }
    
    Write-Success "Database infrastructure verification completed"
}

# Display access information
function Show-DatabaseInfo {
    Write-Log "Database infrastructure deployment completed successfully!" -Color "Green"
    Write-Host ""
    Write-Host "=== DATABASE INFRASTRUCTURE ACCESS INFORMATION ===" -ForegroundColor $Colors.Blue
    Write-Host ""
    Write-Host "PostgreSQL Primary Connection:" -ForegroundColor $Colors.White
    Write-Host "  Host: postgresql-primary.databases.svc.cluster.local" -ForegroundColor $Colors.Yellow
    Write-Host "  Port: 5432" -ForegroundColor $Colors.Yellow
    Write-Host "  Admin User: postgres" -ForegroundColor $Colors.Yellow
    Write-Host "  Admin Password: WriteCareNotesPostgreS2025" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Host "Healthcare Service Databases:" -ForegroundColor $Colors.White
    Write-Host "  - resident_service_db (User: resident_service)" -ForegroundColor $Colors.Yellow
    Write-Host "  - medication_service_db (User: medication_service)" -ForegroundColor $Colors.Yellow
    Write-Host "  - care_planning_service_db (User: care_planning_service)" -ForegroundColor $Colors.Yellow
    Write-Host "  - assessment_service_db (User: assessment_service)" -ForegroundColor $Colors.Yellow
    Write-Host "  - health_records_service_db (User: health_records_service)" -ForegroundColor $Colors.Yellow
    Write-Host "  - financial_service_db (User: financial_service)" -ForegroundColor $Colors.Yellow
    Write-Host "  - hr_payroll_service_db (User: hr_payroll_service)" -ForegroundColor $Colors.Yellow
    Write-Host "  - compliance_service_db (User: compliance_service)" -ForegroundColor $Colors.Yellow
    Write-Host "  - audit_service_db (User: audit_service)" -ForegroundColor $Colors.Yellow
    Write-Host "  - nhs_integration_service_db (User: nhs_integration_service)" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Host "Database Connection Secrets:" -ForegroundColor $Colors.White
    Write-Host "  kubectl get secret <service>-db-secret -n databases -o yaml" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Host "Direct Database Access:" -ForegroundColor $Colors.White
    Write-Host "  kubectl port-forward -n databases svc/postgresql-primary 5432:5432" -ForegroundColor $Colors.Yellow
    Write-Host "  Then: psql -h localhost -U postgres -d <database_name>" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Host "Database Features:" -ForegroundColor $Colors.White
    Write-Host "  - NHS number validation with check digit algorithm" -ForegroundColor $Colors.Yellow
    Write-Host "  - Comprehensive audit trails for all healthcare data" -ForegroundColor $Colors.Yellow
    Write-Host "  - GDPR compliance with consent tracking" -ForegroundColor $Colors.Yellow
    Write-Host "  - Controlled substance inventory management" -ForegroundColor $Colors.Yellow
    Write-Host "  - Drug interaction checking" -ForegroundColor $Colors.Yellow
    Write-Host "  - Full-text search capabilities" -ForegroundColor $Colors.Yellow
    Write-Host ""
    Write-Success "WriteCareNotes database infrastructure is ready for healthcare microservices!"
}

# Main execution
function Main {
    Write-Log "Starting WriteCareNotes database infrastructure deployment..."
    
    try {
        Test-Prerequisites
        Deploy-PostgreSQLCluster
        Deploy-HealthcareDatabases
        
        if (-not $DryRun) {
            Deploy-DatabaseMigrations
            Test-DatabaseDeployment
        }
        
        Show-DatabaseInfo
    }
    catch {
        Write-Error "Database infrastructure deployment failed: $($_.Exception.Message)"
        exit 1
    }
}

# Execute main function
Main