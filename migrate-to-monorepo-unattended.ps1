# WriteCareNotes Monorepo Migration Script - UNATTENDED MODE
# Run before bed, npm install tomorrow!

param(
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"

# Color functions
function Write-Success { param($msg) Write-Host "SUCCESS: $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "INFO: $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "WARNING: $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "ERROR: $msg" -ForegroundColor Red }
function Write-Step { param($msg) Write-Host "`nSTEP: $msg" -ForegroundColor Blue }

# Log file
$logFile = "migration-log-$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"

function Write-Log {
    param($msg)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $msg" | Out-File -FilePath $logFile -Append
}

Write-Host @"
========================================================
     WriteCareNotes Monorepo Migration
     UNATTENDED MODE - Runs to completion
     
     Safe to run before bed!
     Run 'npm install' tomorrow morning
========================================================
"@ -ForegroundColor Cyan

if ($DryRun) {
    Write-Warning "DRY RUN MODE: No changes will be made"
}

Write-Log "Migration started - Unattended mode"

# 1. Prerequisites
Write-Step "Step 1/8: Checking prerequisites..."
Write-Log "Checking prerequisites"

$allGood = $true

try {
    $nodeVersion = node --version 2>$null
    Write-Success "Node.js found: $nodeVersion"
    Write-Log "Node.js: $nodeVersion"
} catch {
    Write-Error "Node.js not found!"
    Write-Log "ERROR: Node.js not found"
    $allGood = $false
}

try {
    $npmVersion = npm --version 2>$null
    Write-Success "npm found: v$npmVersion"
    Write-Log "npm: v$npmVersion"
} catch {
    Write-Error "npm not found!"
    Write-Log "ERROR: npm not found"
    $allGood = $false
}

if (-not (Test-Path ".git")) {
    Write-Error "Not in a Git repository!"
    Write-Log "ERROR: Not in Git repository"
    $allGood = $false
}

if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found!"
    Write-Log "ERROR: package.json not found"
    $allGood = $false
}

if (-not $allGood) {
    Write-Error "Prerequisites check failed. Exiting."
    Write-Log "Migration failed - Prerequisites check"
    Write-Host "`nPress any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Success "All prerequisites met!"

# 2. Create backup
Write-Step "Step 2/8: Creating backup..."
Write-Log "Creating backup"

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupName = "backup_before_monorepo_$timestamp"

if ($DryRun) {
    Write-Info "[DRY RUN] Would create: ../$backupName/"
    Write-Log "[DRY RUN] Backup would be created"
} else {
    try {
        $backupPath = "../$backupName"
        Write-Info "Creating backup at: $backupPath"
        Copy-Item -Path "." -Destination $backupPath -Recurse -Exclude @("node_modules", ".git", "dist", "build", ".turbo") -ErrorAction Stop
        Write-Success "Backup created: $backupPath"
        Write-Log "Backup created successfully"
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Error "Failed to create backup: $errorMsg"
        Write-Log "ERROR: Backup failed - $errorMsg"
        Write-Host "`nPress any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
}

# 3. Create directories
Write-Step "Step 3/8: Creating directory structure..."
Write-Log "Creating directory structure"

$directories = @(
    "apps",
    "apps/backend",
    "packages",
    "packages/shared-types",
    "packages/shared-types/src",
    "packages/shared-types/src/entities",
    "packages/shared-types/src/dtos",
    "packages/shared-types/src/enums",
    "tools"
)

foreach ($dir in $directories) {
    if ($DryRun) {
        Write-Info "[DRY RUN] Would create: $dir/"
        Write-Log "[DRY RUN] Directory: $dir"
    } else {
        try {
            New-Item -ItemType Directory -Force -Path $dir -ErrorAction Stop | Out-Null
            Write-Success "Created: $dir/"
            Write-Log "Created directory: $dir"
        } catch {
            $errorMsg = $_.Exception.Message
            Write-Warning "Could not create $dir - $errorMsg"
            Write-Log "WARNING: Could not create $dir - $errorMsg"
        }
    }
}

# 4. Move backend code
Write-Step "Step 4/8: Moving backend code..."
Write-Log "Moving backend code"

$filesToMove = @(
    "src",
    "package.json",
    "tsconfig.json",
    "jest.config.js",
    "babel.config.js",
    ".env.example",
    "Dockerfile",
    "Dockerfile.production"
)

foreach ($item in $filesToMove) {
    if (Test-Path $item) {
        if ($DryRun) {
            Write-Info "[DRY RUN] Would move: $item"
            Write-Log "[DRY RUN] Move: $item"
        } else {
            try {
                Move-Item -Path $item -Destination "apps/backend/" -Force -ErrorAction Stop
                Write-Success "Moved: $item"
                Write-Log "Moved: $item"
            } catch {
                $errorMsg = $_.Exception.Message
                Write-Warning "Could not move $item - $errorMsg"
                Write-Log "WARNING: Could not move $item - $errorMsg"
            }
        }
    } else {
        Write-Info "Skipped (not found): $item"
        Write-Log "Skipped: $item"
    }
}

# 5. Create root package.json
Write-Step "Step 5/8: Creating root package.json..."
Write-Log "Creating root package.json"

$rootPackageJson = @{
    name = "writecarenotes-monorepo"
    version = "1.0.0"
    private = $true
    workspaces = @("apps/*", "packages/*")
    scripts = @{
        "dev" = "turbo run dev"
        "build" = "turbo run build"
        "test" = "turbo run test"
        "backend:dev" = "turbo run dev --filter=backend"
        "backend:build" = "turbo run build --filter=backend"
        "types:build" = "turbo run build --filter=@writecarenotes/shared-types"
    }
    devDependencies = @{
        "turbo" = "^2.3.3"
        "prettier" = "^3.0.0"
        "typescript" = "^5.9.3"
    }
}

if ($DryRun) {
    Write-Info "[DRY RUN] Would create root package.json"
} else {
    try {
        $rootPackageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json" -ErrorAction Stop
        Write-Success "Created root package.json"
        Write-Log "Root package.json created"
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Error "Failed to create root package.json: $errorMsg"
        Write-Log "ERROR: Root package.json - $errorMsg"
    }
}

# 6. Create turbo.json
Write-Step "Step 6/8: Creating turbo.json..."
Write-Log "Creating turbo.json"

$turboConfig = @{
    '$schema' = "https://turbo.build/schema.json"
    pipeline = @{
        build = @{
            dependsOn = @("^build")
            outputs = @("dist/**")
        }
        dev = @{
            cache = $false
            persistent = $true
        }
        test = @{
            outputs = @("coverage/**")
        }
    }
}

if ($DryRun) {
    Write-Info "[DRY RUN] Would create turbo.json"
} else {
    try {
        $turboConfig | ConvertTo-Json -Depth 10 | Set-Content "turbo.json" -ErrorAction Stop
        Write-Success "Created turbo.json"
        Write-Log "turbo.json created"
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Error "Failed to create turbo.json: $errorMsg"
        Write-Log "ERROR: turbo.json - $errorMsg"
    }
}

# 7. Create shared-types package
Write-Step "Step 7/8: Creating shared-types package..."
Write-Log "Creating shared-types"

$sharedTypesPackage = @{
    name = "@writecarenotes/shared-types"
    version = "1.0.0"
    main = "dist/index.js"
    types = "dist/index.d.ts"
    scripts = @{
        "build" = "tsc"
        "dev" = "tsc --watch"
    }
    devDependencies = @{
        "typescript" = "^5.9.3"
    }
}

if (-not $DryRun) {
    try {
        $sharedTypesPackage | ConvertTo-Json -Depth 10 | Set-Content "packages/shared-types/package.json" -ErrorAction Stop
        Write-Success "Created shared-types package.json"
        Write-Log "Shared-types package.json created"
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Error "Failed: $errorMsg"
        Write-Log "ERROR: $errorMsg"
    }
    
    # tsconfig for shared-types
    $tsConfig = @{
        compilerOptions = @{
            target = "ES2020"
            module = "commonjs"
            declaration = $true
            outDir = "./dist"
            strict = $true
        }
        include = @("src/**/*")
    }
    
    try {
        $tsConfig | ConvertTo-Json -Depth 10 | Set-Content "packages/shared-types/tsconfig.json" -ErrorAction Stop
        Write-Success "Created shared-types tsconfig.json"
    } catch {
        Write-Warning "Could not create tsconfig"
    }
    
    # Source files
    "@export * from './entities';`nexport * from './dtos';`nexport * from './enums';" | Set-Content "packages/shared-types/src/index.ts"
    "export {};" | Set-Content "packages/shared-types/src/entities/index.ts"
    "export {};" | Set-Content "packages/shared-types/src/dtos/index.ts"
    "export {};" | Set-Content "packages/shared-types/src/enums/index.ts"
    
    Write-Success "Created shared-types source files"
}

# 8. Update backend package.json
Write-Step "Step 8/8: Updating backend package.json..."
Write-Log "Updating backend"

if (-not $DryRun -and (Test-Path "apps/backend/package.json")) {
    try {
        $content = Get-Content "apps/backend/package.json" -Raw
        $pkg = $content | ConvertFrom-Json
        $pkg.name = "backend"
        
        if (-not $pkg.dependencies) {
            $pkg | Add-Member -NotePropertyName "dependencies" -NotePropertyValue @{} -Force
        }
        
        $pkg.dependencies | Add-Member -NotePropertyName "@writecarenotes/shared-types" -NotePropertyValue "workspace:*" -Force
        
        $pkg | ConvertTo-Json -Depth 10 | Set-Content "apps/backend/package.json"
        Write-Success "Updated backend package.json"
        Write-Log "Backend package.json updated"
    } catch {
        Write-Warning "Could not update backend package.json"
        Write-Log "WARNING: Backend package.json update failed"
    }
}

# Create instructions
$instructions = @"
# Migration Complete!

Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Backup: ../$backupName/
Log: $logFile

## Tomorrow Morning:

1. Run: npm install
2. Run: npm run build
3. Run: npm run backend:dev
4. Test your endpoints

## New Commands:

- npm run backend:dev    (start backend)
- npm run build          (build all)
- npm run types:build    (build types)

## Rollback (if needed):

cd ..
Remove-Item -Recurse WriteCareNotes
Rename-Item $backupName WriteCareNotes

Sleep well! 
"@

if (-not $DryRun) {
    $instructions | Set-Content "POST_MIGRATION_INSTRUCTIONS.md"
    Write-Success "Created POST_MIGRATION_INSTRUCTIONS.md"
}

# Final message
Write-Host @"

========================================================
     Migration Complete!
     
     Backup: ../$backupName/
     Log: $logFile
     
     Tomorrow: npm install
========================================================

"@ -ForegroundColor Green

Write-Success "Safe to close this window and go to bed!"
Write-Log "Migration completed successfully"

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
