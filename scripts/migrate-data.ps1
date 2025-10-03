# Data Migration Script for WriteCareNotes Monolith to Microservices Transition
# Provides comprehensive data migration with healthcare-specific validation and compliance

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "development",
    
    [Parameter(Mandatory=$false)]
    [string]$Phase = "all",
    
    [Parameter(Mandatory=$false)]
    [string]$Service = "",
    
    [Parameter(Mandatory=$false)]
    [int]$BatchSize = 1000,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipValidation,
    
    [Parameter(Mandatory=$false)]
    [switch]$Rollback,
    
    [Parameter(Mandatory=$false)]
    [switch]$ContinueOnError
)

# Set error handling
$ErrorActionPreference = "Stop"

# Configuration
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Split-Path -Parent $SCRIPT_DIR
$CONFIG_DIR = Join-Path $PROJECT_ROOT "config"
$LOGS_DIR = Join-Path $PROJECT_ROOT "logs"

# Ensure logs directory exists
if (-not (Test-Path $LOGS_DIR)) {
    New-Item -ItemType Directory -Path $LOGS_DIR -Force | Out-Null
}

$LOG_FILE = Join-Path $LOGS_DIR "data-migration-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

Write-Host "🚀 WriteCareNotes Data Migration Tool" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Phase: $Phase" -ForegroundColor Yellow
Write-Host "Service: $(if ($Service) { $Service } else { 'All Services' })" -ForegroundColor Yellow
Write-Host "Batch Size: $BatchSize" -ForegroundColor Yellow
Write-Host "Dry Run: $(if ($DryRun) { 'Yes' } else { 'No' })" -ForegroundColor Yellow
Write-Host "Log File: $LOG_FILE" -ForegroundColor Yellow

# Logging function
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Write to console with color
    switch ($Level) {
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "WARN" { Write-Host $logEntry -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        default { Write-Host $logEntry -ForegroundColor White }
    }
    
    # Write to log file
    Add-Content -Path $LOG_FILE -Value $logEntry
}

# Database configuration
function Get-DatabaseConfig {
    param([string]$Environment)
    
    $configFile = Join-Path $CONFIG_DIR "database-$Environment.json"
    
    if (-not (Test-Path $configFile)) {
        Write-Log "Database configuration file not found: $configFile" "ERROR"
        exit 1
    }
    
    try {
        $config = Get-Content $configFile | ConvertFrom-Json
        return $config
    }
    catch {
        Write-Log "Failed to parse database configuration: $($_.Exception.Message)" "ERROR"
        exit 1
    }
}

# Validate prerequisites
function Test-Prerequisites {
    Write-Log "Validating prerequisites..." "INFO"
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        Write-Log "Node.js version: $nodeVersion" "SUCCESS"
    }
    catch {
        Write-Log "Node.js not found or not accessible" "ERROR"
        exit 1
    }
    
    # Check npm
    try {
        $npmVersion = npm --version 2>$null
        Write-Log "npm version: $npmVersion" "SUCCESS"
    }
    catch {
        Write-Log "npm not found or not accessible" "ERROR"
        exit 1
    }
    
    # Check if migration service exists
    $migrationServicePath = Join-Path $PROJECT_ROOT "src/services/migration/DataMigrationService.ts"
    if (-not (Test-Path $migrationServicePath)) {
        Write-Log "Migration service not found: $migrationServicePath" "ERROR"
        exit 1
    }
    
    Write-Log "All prerequisites validated successfully" "SUCCESS"
}

# Test database connections
function Test-DatabaseConnections {
    param($DatabaseConfig)
    
    Write-Log "Testing database connections..." "INFO"
    
    # Test source database
    Write-Log "Testing source database connection..." "INFO"
    $sourceTest = Test-DatabaseConnection -Config $DatabaseConfig.source -Name "Source"
    
    if (-not $sourceTest) {
        Write-Log "Source database connection failed" "ERROR"
        exit 1
    }
    
    # Test target databases
    foreach ($service in $DatabaseConfig.targets.PSObject.Properties) {
        Write-Log "Testing $($service.Name) database connection..." "INFO"
        $targetTest = Test-DatabaseConnection -Config $service.Value -Name $service.Name
        
        if (-not $targetTest) {
            Write-Log "$($service.Name) database connection failed" "ERROR"
            if (-not $ContinueOnError) {
                exit 1
            }
        }
    }
    
    Write-Log "Database connection tests completed" "SUCCESS"
}

# Test individual database connection
function Test-DatabaseConnection {
    param($Config, $Name)
    
    try {
        # Use psql to test connection
        $env:PGPASSWORD = $Config.password
        $testQuery = "SELECT 1"
        $result = psql -h $Config.host -p $Config.port -U $Config.username -d $Config.database -c $testQuery -t 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "$Name database connection successful" "SUCCESS"
            return $true
        } else {
            Write-Log "$Name database connection failed" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "$Name database connection error: $($_.Exception.Message)" "ERROR"
        return $false
    }
    finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Create migration configuration
function New-MigrationConfig {
    param($DatabaseConfig, $BatchSize, $DryRun)
    
    $migrationConfig = @{
        sourceDatabase = $DatabaseConfig.source
        targetDatabases = @{}
        batchSize = $BatchSize
        maxRetries = 3
        retryDelayMs = 5000
        validationEnabled = -not $SkipValidation
        dryRun = $DryRun.IsPresent
    }
    
    # Add target databases
    foreach ($service in $DatabaseConfig.targets.PSObject.Properties) {
        $migrationConfig.targetDatabases[$service.Name] = $service.Value
    }
    
    return $migrationConfig
}

# Execute migration
function Start-DataMigration {
    param($MigrationConfig)
    
    Write-Log "Starting data migration..." "INFO"
    
    # Create temporary config file
    $tempConfigFile = Join-Path $env:TEMP "migration-config-$(Get-Date -Format 'yyyyMMddHHmmss').json"
    $MigrationConfig | ConvertTo-Json -Depth 10 | Set-Content $tempConfigFile
    
    try {
        # Build migration command
        $migrationScript = Join-Path $PROJECT_ROOT "dist/scripts/run-migration.js"
        $nodeArgs = @(
            $migrationScript,
            "--config", $tempConfigFile,
            "--environment", $Environment
        )
        
        if ($Phase -ne "all") {
            $nodeArgs += "--phase", $Phase
        }
        
        if ($Service) {
            $nodeArgs += "--service", $Service
        }
        
        if ($DryRun) {
            $nodeArgs += "--dry-run"
        }
        
        if ($Rollback) {
            $nodeArgs += "--rollback"
        }
        
        Write-Log "Executing migration with command: node $($nodeArgs -join ' ')" "INFO"
        
        # Execute migration
        $process = Start-Process -FilePath "node" -ArgumentList $nodeArgs -NoNewWindow -PassThru -RedirectStandardOutput "$LOGS_DIR/migration-output.log" -RedirectStandardError "$LOGS_DIR/migration-error.log"
        
        # Monitor progress
        $startTime = Get-Date
        $lastProgressUpdate = $startTime
        
        while (-not $process.HasExited) {
            Start-Sleep -Seconds 5
            
            # Update progress every 30 seconds
            if ((Get-Date) - $lastProgressUpdate -gt [TimeSpan]::FromSeconds(30)) {
                $elapsed = (Get-Date) - $startTime
                Write-Log "Migration running for $($elapsed.ToString('hh\:mm\:ss'))..." "INFO"
                $lastProgressUpdate = Get-Date
            }
        }
        
        $process.WaitForExit()
        $exitCode = $process.ExitCode
        
        if ($exitCode -eq 0) {
            Write-Log "Migration completed successfully" "SUCCESS"
            
            # Display migration output
            if (Test-Path "$LOGS_DIR/migration-output.log") {
                $output = Get-Content "$LOGS_DIR/migration-output.log" -Raw
                Write-Log "Migration Output:" "INFO"
                Write-Host $output -ForegroundColor Cyan
            }
            
            return $true
        } else {
            Write-Log "Migration failed with exit code: $exitCode" "ERROR"
            
            # Display error output
            if (Test-Path "$LOGS_DIR/migration-error.log") {
                $errorOutput = Get-Content "$LOGS_DIR/migration-error.log" -Raw
                Write-Log "Migration Errors:" "ERROR"
                Write-Host $errorOutput -ForegroundColor Red
            }
            
            return $false
        }
        
    } catch {
        Write-Log "Migration execution failed: $($_.Exception.Message)" "ERROR"
        return $false
        
    } finally {
        # Clean up temporary config file
        if (Test-Path $tempConfigFile) {
            Remove-Item $tempConfigFile -Force
        }
    }
}

# Validate migration results
function Test-MigrationResults {
    param($DatabaseConfig)
    
    Write-Log "Validating migration results..." "INFO"
    
    $validationResults = @()
    
    foreach ($service in $DatabaseConfig.targets.PSObject.Properties) {
        Write-Log "Validating $($service.Name) migration..." "INFO"
        
        try {
            $env:PGPASSWORD = $service.Value.password
            
            # Get table counts
            $tablesQuery = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
            $tables = psql -h $service.Value.host -p $service.Value.port -U $service.Value.username -d $service.Value.database -c $tablesQuery -t 2>$null
            
            if ($LASTEXITCODE -eq 0) {
                $tableCount = ($tables | Where-Object { $_.Trim() -ne "" }).Count
                Write-Log "$($service.Name): $tableCount tables migrated" "SUCCESS"
                
                $validationResults += @{
                    Service = $service.Name
                    Status = "Success"
                    TableCount = $tableCount
                }
            } else {
                Write-Log "$($service.Name): Validation failed" "ERROR"
                $validationResults += @{
                    Service = $service.Name
                    Status = "Failed"
                    TableCount = 0
                }
            }
            
        } catch {
            Write-Log "$($service.Name): Validation error - $($_.Exception.Message)" "ERROR"
            $validationResults += @{
                Service = $service.Name
                Status = "Error"
                TableCount = 0
                Error = $_.Exception.Message
            }
            
        } finally {
            Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
        }
    }
    
    return $validationResults
}

# Generate migration report
function New-MigrationReport {
    param($ValidationResults, $StartTime, $EndTime)
    
    $reportFile = Join-Path $LOGS_DIR "migration-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').html"
    
    $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>WriteCareNotes Data Migration Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
        .summary { background-color: #ecf0f1; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .success { color: #27ae60; }
        .error { color: #e74c3c; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #bdc3c7; padding: 10px; text-align: left; }
        th { background-color: #34495e; color: white; }
        .footer { margin-top: 30px; font-size: 12px; color: #7f8c8d; }
    </style>
</head>
<body>
    <div class="header">
        <h1>WriteCareNotes Data Migration Report</h1>
        <p>Environment: $Environment | Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</p>
    </div>
    
    <div class="summary">
        <h2>Migration Summary</h2>
        <p><strong>Start Time:</strong> $($StartTime.ToString('yyyy-MM-dd HH:mm:ss'))</p>
        <p><strong>End Time:</strong> $($EndTime.ToString('yyyy-MM-dd HH:mm:ss'))</p>
        <p><strong>Duration:</strong> $(($EndTime - $StartTime).ToString('hh\:mm\:ss'))</p>
        <p><strong>Dry Run:</strong> $(if ($DryRun) { 'Yes' } else { 'No' })</p>
        <p><strong>Batch Size:</strong> $BatchSize</p>
    </div>
    
    <h2>Service Migration Results</h2>
    <table>
        <tr>
            <th>Service</th>
            <th>Status</th>
            <th>Tables Migrated</th>
            <th>Notes</th>
        </tr>
"@
    
    foreach ($result in $ValidationResults) {
        $statusClass = if ($result.Status -eq "Success") { "success" } else { "error" }
        $notes = if ($result.Error) { $result.Error } else { "" }
        
        $html += @"
        <tr>
            <td>$($result.Service)</td>
            <td class="$statusClass">$($result.Status)</td>
            <td>$($result.TableCount)</td>
            <td>$notes</td>
        </tr>
"@
    }
    
    $html += @"
    </table>
    
    <div class="footer">
        <p>This report was generated by the WriteCareNotes Data Migration Tool.</p>
        <p>For support, please contact the development team.</p>
    </div>
</body>
</html>
"@
    
    $html | Set-Content $reportFile
    Write-Log "Migration report generated: $reportFile" "SUCCESS"
    
    return $reportFile
}

# Main execution
try {
    $startTime = Get-Date
    Write-Log "Starting WriteCareNotes data migration process" "INFO"
    
    if (-not $SkipValidation) {
        Test-Prerequisites
    }
    
    # Get database configuration
    $databaseConfig = Get-DatabaseConfig -Environment $Environment
    
    if (-not $SkipValidation) {
        Test-DatabaseConnections -DatabaseConfig $databaseConfig
    }
    
    # Create migration configuration
    $migrationConfig = New-MigrationConfig -DatabaseConfig $databaseConfig -BatchSize $BatchSize -DryRun $DryRun
    
    # Execute migration
    $migrationSuccess = Start-DataMigration -MigrationConfig $migrationConfig
    
    if (-not $migrationSuccess) {
        Write-Log "Migration failed" "ERROR"
        exit 1
    }
    
    # Validate results (skip for dry run)
    $validationResults = @()
    if (-not $DryRun -and -not $SkipValidation) {
        $validationResults = Test-MigrationResults -DatabaseConfig $databaseConfig
    }
    
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    # Generate report
    if ($validationResults.Count -gt 0) {
        $reportFile = New-MigrationReport -ValidationResults $validationResults -StartTime $startTime -EndTime $endTime
        Write-Log "Migration report available at: $reportFile" "INFO"
    }
    
    Write-Log "Data migration completed successfully in $($duration.ToString('hh\:mm\:ss'))" "SUCCESS"
    
    # Summary
    Write-Host "`n📋 Migration Summary" -ForegroundColor Green
    Write-Host "===================" -ForegroundColor Green
    Write-Host "Duration: $($duration.ToString('hh\:mm\:ss'))" -ForegroundColor White
    Write-Host "Environment: $Environment" -ForegroundColor White
    Write-Host "Dry Run: $(if ($DryRun) { 'Yes' } else { 'No' })" -ForegroundColor White
    Write-Host "Log File: $LOG_FILE" -ForegroundColor White
    
    if ($validationResults.Count -gt 0) {
        Write-Host "`n🎯 Service Results:" -ForegroundColor Blue
        foreach ($result in $validationResults) {
            $color = if ($result.Status -eq "Success") { "Green" } else { "Red" }
            Write-Host "  $($result.Service): $($result.Status) ($($result.TableCount) tables)" -ForegroundColor $color
        }
    }
    
    Write-Host "`n🎉 Migration process completed!" -ForegroundColor Green
    
} catch {
    $endTime = Get-Date
    Write-Log "Migration process failed: $($_.Exception.Message)" "ERROR"
    Write-Log "Stack trace: $($_.ScriptStackTrace)" "ERROR"
    
    Write-Host "`n❌ Migration failed after $(($endTime - $startTime).ToString('hh\:mm\:ss'))" -ForegroundColor Red
    Write-Host "Check log file for details: $LOG_FILE" -ForegroundColor Yellow
    
    exit 1
}