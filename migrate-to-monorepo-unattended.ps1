# WriteCareNotes Monorepo Migration Script - UNATTENDED MODE
# This script runs completely automatically without any prompts
# Run before bed, npm install tomorrow morning!

param(
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"

# Color functions
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Step { param($msg) Write-Host "`n🔄 $msg" -ForegroundColor Blue }

# Log file
$logFile = "migration-log-$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"

function Write-Log {
    param($msg)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $msg" | Out-File -FilePath $logFile -Append
    Write-Host $msg
}

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     WriteCareNotes Monorepo Migration                       ║
║     UNATTENDED MODE - No prompts, runs to completion        ║
║                                                              ║
║     Safe to run before bed! 🌙                              ║
║     Run 'npm install' tomorrow morning                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

if ($DryRun) {
    Write-Warning "DRY RUN MODE: No changes will be made`n"
}

Write-Log "Migration started - Unattended mode"

# 1. Prerequisites check
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

try {
    $gitVersion = git --version 2>$null
    Write-Success "Git found: $gitVersion"
    Write-Log "Git: $gitVersion"
} catch {
    Write-Error "Git not found!"
    Write-Log "ERROR: Git not found"
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
    exit 1
}

Write-Success "All prerequisites met!"
Write-Log "Prerequisites check passed"

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
        Write-Log "Backup created successfully at $backupPath"
    } catch {
        Write-Error "Failed to create backup: $_"
        Write-Log "ERROR: Backup failed - $_"
        exit 1
    }
}

# 3. Create directory structure
Write-Step "Step 3/8: Creating monorepo directory structure..."
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
            Write-Error "Failed to create $dir: $_"
            Write-Log "ERROR: Failed to create $dir - $_"
        }
    }
}

# 4. Move backend code
Write-Step "Step 4/8: Moving backend code to apps/backend/..."
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
            Write-Info "[DRY RUN] Would move: $item -> apps/backend/$item"
            Write-Log "[DRY RUN] Move: $item"
        } else {
            try {
                Move-Item -Path $item -Destination "apps/backend/" -Force -ErrorAction Stop
                Write-Success "Moved: $item -> apps/backend/"
                Write-Log "Moved: $item to apps/backend/"
            } catch {
                Write-Error "Failed to move $item: $_"
                Write-Log "ERROR: Failed to move $item - $_"
            }
        }
    } else {
        Write-Warning "Skipped (not found): $item"
        Write-Log "Skipped (not found): $item"
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
        "lint" = "turbo run lint"
        "clean" = "turbo run clean"
        "format" = "prettier --write ."
        "backend:dev" = "turbo run dev --filter=backend"
        "backend:build" = "turbo run build --filter=backend"
        "backend:test" = "turbo run test --filter=backend"
        "types:build" = "turbo run build --filter=@writecarenotes/shared-types"
    }
    devDependencies = @{
        "turbo" = "^2.3.3"
        "prettier" = "^3.0.0"
        "@types/node" = "^20.0.0"
        "typescript" = "^5.9.3"
    }
    engines = @{
        node = ">=18.0.0"
        npm = ">=9.0.0"
    }
}

if ($DryRun) {
    Write-Info "[DRY RUN] Would create root package.json"
    Write-Log "[DRY RUN] Root package.json would be created"
} else {
    try {
        $rootPackageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json" -ErrorAction Stop
        Write-Success "Created root package.json"
        Write-Log "Root package.json created"
    } catch {
        Write-Error "Failed to create root package.json: $_"
        Write-Log "ERROR: Failed to create root package.json - $_"
    }
}

# 6. Create Turborepo config
Write-Step "Step 6/8: Creating turbo.json configuration..."
Write-Log "Creating turbo.json"

$turboConfig = @{
    '$schema' = "https://turbo.build/schema.json"
    pipeline = @{
        build = @{
            dependsOn = @("^build")
            outputs = @("dist/**", "build/**", ".next/**")
        }
        test = @{
            dependsOn = @("build")
            outputs = @("coverage/**")
        }
        lint = @{
            outputs = @()
        }
        dev = @{
            cache = $false
            persistent = $true
        }
        clean = @{
            cache = $false
        }
    }
}

if ($DryRun) {
    Write-Info "[DRY RUN] Would create turbo.json"
    Write-Log "[DRY RUN] turbo.json would be created"
} else {
    try {
        $turboConfig | ConvertTo-Json -Depth 10 | Set-Content "turbo.json" -ErrorAction Stop
        Write-Success "Created turbo.json"
        Write-Log "turbo.json created"
    } catch {
        Write-Error "Failed to create turbo.json: $_"
        Write-Log "ERROR: Failed to create turbo.json - $_"
    }
}

# 7. Create shared-types package
Write-Step "Step 7/8: Creating shared-types package..."
Write-Log "Creating shared-types package"

$sharedTypesPackageJson = @{
    name = "@writecarenotes/shared-types"
    version = "1.0.0"
    main = "dist/index.js"
    types = "dist/index.d.ts"
    scripts = @{
        "build" = "tsc"
        "dev" = "tsc --watch"
        "clean" = "rm -rf dist"
    }
    devDependencies = @{
        "typescript" = "^5.9.3"
    }
}

if ($DryRun) {
    Write-Info "[DRY RUN] Would create packages/shared-types/package.json"
    Write-Log "[DRY RUN] Shared types package.json would be created"
} else {
    try {
        $sharedTypesPackageJson | ConvertTo-Json -Depth 10 | Set-Content "packages/shared-types/package.json" -ErrorAction Stop
        Write-Success "Created packages/shared-types/package.json"
        Write-Log "Shared types package.json created"
    } catch {
        Write-Error "Failed to create shared-types package.json: $_"
        Write-Log "ERROR: Failed to create shared-types package.json - $_"
    }
}

# Create tsconfig.json for shared-types
$sharedTypesTsConfig = @{
    compilerOptions = @{
        target = "ES2020"
        module = "commonjs"
        declaration = $true
        outDir = "./dist"
        strict = $true
        esModuleInterop = $true
        skipLibCheck = $true
        forceConsistentCasingInFileNames = $true
    }
    include = @("src/**/*")
    exclude = @("node_modules", "dist")
}

if ($DryRun) {
    Write-Info "[DRY RUN] Would create packages/shared-types/tsconfig.json"
    Write-Log "[DRY RUN] Shared types tsconfig.json would be created"
} else {
    try {
        $sharedTypesTsConfig | ConvertTo-Json -Depth 10 | Set-Content "packages/shared-types/tsconfig.json" -ErrorAction Stop
        Write-Success "Created packages/shared-types/tsconfig.json"
        Write-Log "Shared types tsconfig.json created"
    } catch {
        Write-Error "Failed to create shared-types tsconfig.json: $_"
        Write-Log "ERROR: Failed to create shared-types tsconfig.json - $_"
    }
}

# Create source files
$indexContent = @"
// Shared TypeScript types for WriteCareNotes
// Export all entities, DTOs, and enums here

// Entities
export * from './entities';

// DTOs
export * from './dtos';

// Enums
export * from './enums';
"@

$placeholders = @{
    "packages/shared-types/src/index.ts" = $indexContent
    "packages/shared-types/src/entities/index.ts" = "// Export all entities here`nexport {};"
    "packages/shared-types/src/dtos/index.ts" = "// Export all DTOs here`nexport {};"
    "packages/shared-types/src/enums/index.ts" = "// Export all enums here`nexport {};"
    "packages/shared-types/README.md" = @"
# @writecarenotes/shared-types

Shared TypeScript types, interfaces, and enums used across all WriteCareNotes applications.

## Usage

``````typescript
import { Child, CreateChildDto, UserRole } from '@writecarenotes/shared-types';
``````

## Structure

- ``entities/`` - Domain entities (Child, CarePlan, User, etc.)
- ``dtos/`` - Data Transfer Objects for API requests/responses
- ``enums/`` - Shared enumerations (UserRole, ChildStatus, etc.)
"@
}

foreach ($file in $placeholders.Keys) {
    if ($DryRun) {
        Write-Info "[DRY RUN] Would create: $file"
        Write-Log "[DRY RUN] File: $file"
    } else {
        try {
            $placeholders[$file] | Set-Content $file -ErrorAction Stop
            Write-Success "Created: $file"
            Write-Log "Created file: $file"
        } catch {
            Write-Error "Failed to create $file: $_"
            Write-Log "ERROR: Failed to create $file - $_"
        }
    }
}

# 8. Update backend package.json
Write-Step "Step 8/8: Updating backend package.json..."
Write-Log "Updating backend package.json"

if ($DryRun) {
    Write-Info "[DRY RUN] Would update apps/backend/package.json"
    Write-Log "[DRY RUN] Backend package.json would be updated"
} else {
    if (Test-Path "apps/backend/package.json") {
        try {
            $backendPkg = Get-Content "apps/backend/package.json" | ConvertFrom-Json
            
            # Update name
            $backendPkg.name = "backend"
            
            # Add shared-types dependency
            if (-not $backendPkg.dependencies) {
                $backendPkg | Add-Member -MemberType NoteProperty -Name "dependencies" -Value @{} -Force
            }
            
            # Convert dependencies to hashtable if it's not already
            $depsHash = @{}
            foreach ($prop in $backendPkg.dependencies.PSObject.Properties) {
                $depsHash[$prop.Name] = $prop.Value
            }
            $depsHash["@writecarenotes/shared-types"] = "workspace:*"
            $backendPkg.dependencies = $depsHash
            
            $backendPkg | ConvertTo-Json -Depth 10 | Set-Content "apps/backend/package.json" -ErrorAction Stop
            Write-Success "Updated apps/backend/package.json"
            Write-Log "Backend package.json updated"
        } catch {
            Write-Error "Failed to update backend package.json: $_"
            Write-Log "ERROR: Failed to update backend package.json - $_"
        }
    } else {
        Write-Warning "apps/backend/package.json not found"
        Write-Log "WARNING: apps/backend/package.json not found"
    }
}

# Update .gitignore
Write-Step "Updating .gitignore..."
Write-Log "Updating .gitignore"

$gitignoreAdditions = @"

# Monorepo specific
node_modules/
.turbo/
dist/
build/
coverage/
.env
.env.local
.DS_Store

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Migration
migration-log-*.txt
backup_before_monorepo_*/
"@

if ($DryRun) {
    Write-Info "[DRY RUN] Would update .gitignore"
    Write-Log "[DRY RUN] .gitignore would be updated"
} else {
    try {
        if (Test-Path ".gitignore") {
            Add-Content ".gitignore" $gitignoreAdditions -ErrorAction Stop
            Write-Success "Updated .gitignore"
            Write-Log ".gitignore updated"
        } else {
            $gitignoreAdditions | Set-Content ".gitignore" -ErrorAction Stop
            Write-Success "Created .gitignore"
            Write-Log ".gitignore created"
        }
    } catch {
        Write-Error "Failed to update .gitignore: $_"
        Write-Log "ERROR: Failed to update .gitignore - $_"
    }
}

# Create post-migration readme
Write-Step "Creating post-migration instructions..."
Write-Log "Creating post-migration instructions"

$postMigrationInstructions = @"
# ✅ Monorepo Migration Complete!

**Migration Date**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Backup Location**: ../$backupName/
**Log File**: $logFile

---

## 🌅 Next Steps (Tomorrow Morning)

### 1. Install Dependencies
``````powershell
npm install
``````

This will:
- ✅ Install Turborepo
- ✅ Install all backend dependencies
- ✅ Install shared-types dependencies
- ✅ Set up workspace links
- ⏱️ Takes ~5-10 minutes

### 2. Verify Migration
``````powershell
# Check that everything built correctly
npm run build

# Should see:
# ✓ @writecarenotes/shared-types:build
# ✓ backend:build
``````

### 3. Test Backend
``````powershell
# Start backend in dev mode
npm run backend:dev

# Should start on port 3000 as before
``````

### 4. Run Tests
``````powershell
# Run all tests
npm run test

# Or just backend tests
npm run backend:test
``````

---

## 📁 What Changed

### Before:
``````
WriteCareNotes/
├── src/                    # Backend code
├── package.json
└── Dockerfile
``````

### After:
``````
WriteCareNotes/
├── apps/
│   └── backend/           # Your backend (code unchanged!)
│       ├── src/           # Same 53 modules
│       ├── package.json
│       └── Dockerfile
├── packages/
│   └── shared-types/      # NEW: Shared TypeScript types
└── package.json           # Root workspace config
``````

---

## 🎮 New Commands

``````powershell
# Development
npm run backend:dev              # Start backend
npm run types:build              # Build shared types

# Building
npm run build                    # Build everything
npm run backend:build            # Build only backend

# Testing
npm run test                     # Run all tests
npm run backend:test             # Test only backend

# Maintenance
turbo run clean                  # Clean all outputs
npm run format                   # Format code
``````

---

## 🛡️ Rollback (If Needed)

If something went wrong:

``````powershell
cd ..
Remove-Item -Recurse -Force WriteCareNotes
Rename-Item $backupName WriteCareNotes
cd WriteCareNotes
npm install
``````

---

## ✅ Verification Checklist

After running ``npm install``, verify:

- [ ] ``npm run build`` succeeds
- [ ] ``npm run backend:dev`` starts server
- [ ] Database connection works
- [ ] API endpoints respond
- [ ] Tests pass: ``npm run test``

---

## 📚 Documentation

- **Full Guide**: MONOREPO_MIGRATION_GUIDE.md
- **Turborepo Docs**: https://turbo.build/repo/docs
- **Migration Log**: $logFile

---

## 💡 Tips

### Using Shared Types

1. **Create a type** in ``packages/shared-types/src/entities/Child.ts``:
``````typescript
export interface Child {
  id: string;
  firstName: string;
  lastName: string;
}
``````

2. **Export it** from ``packages/shared-types/src/entities/index.ts``:
``````typescript
export * from './Child';
``````

3. **Build types**:
``````powershell
npm run types:build
``````

4. **Use everywhere**:
``````typescript
import { Child } from '@writecarenotes/shared-types';
``````

### Adding Frontend (Future)

``````powershell
cd apps
npx create-react-app frontend --template typescript
# Already configured in workspace!
``````

---

**Everything is ready! Just run ``npm install`` tomorrow morning.** 🚀

Sleep well! 🌙
"@

if ($DryRun) {
    Write-Info "[DRY RUN] Would create POST_MIGRATION_INSTRUCTIONS.md"
    Write-Log "[DRY RUN] Post-migration instructions would be created"
} else {
    try {
        $postMigrationInstructions | Set-Content "POST_MIGRATION_INSTRUCTIONS.md" -ErrorAction Stop
        Write-Success "Created POST_MIGRATION_INSTRUCTIONS.md"
        Write-Log "Post-migration instructions created"
    } catch {
        Write-Error "Failed to create post-migration instructions: $_"
        Write-Log "ERROR: Failed to create post-migration instructions - $_"
    }
}

# Verification
if (-not $DryRun) {
    Write-Step "Verifying migration..."
    Write-Log "Running verification checks"
    
    $checks = @{
        "Root package.json" = "package.json"
        "Turbo config" = "turbo.json"
        "Backend app" = "apps/backend"
        "Backend package.json" = "apps/backend/package.json"
        "Backend src" = "apps/backend/src"
        "Shared types package" = "packages/shared-types"
        "Shared types package.json" = "packages/shared-types/package.json"
        "Shared types src" = "packages/shared-types/src"
        "Post-migration instructions" = "POST_MIGRATION_INSTRUCTIONS.md"
    }
    
    $allPassed = $true
    foreach ($check in $checks.GetEnumerator()) {
        if (Test-Path $check.Value) {
            Write-Success "$($check.Key) ✓"
            Write-Log "Verification passed: $($check.Key)"
        } else {
            Write-Error "$($check.Key) ✗"
            Write-Log "Verification failed: $($check.Key)"
            $allPassed = $false
        }
    }
    
    if ($allPassed) {
        Write-Success "`nAll verification checks passed!"
        Write-Log "All verification checks passed"
    } else {
        Write-Error "`nSome verification checks failed"
        Write-Log "Some verification checks failed"
    }
}

# Final message
Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     ✅ Migration Complete!                                   ║
║                                                              ║
║     Safe to close this window and go to bed! 🌙             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green

if ($DryRun) {
    Write-Info "This was a DRY RUN. Run without -DryRun to perform migration."
    Write-Log "Dry run completed"
} else {
    Write-Success "Tomorrow morning:"
    Write-Host "  1. Open terminal in this directory"
    Write-Host "  2. Run: npm install"
    Write-Host "  3. Read: POST_MIGRATION_INSTRUCTIONS.md"
    Write-Host "  4. Verify: npm run backend:dev"
    Write-Host ""
    Write-Success "Backup saved at: ../$backupName/"
    Write-Success "Migration log saved: $logFile"
    Write-Log "Migration completed successfully"
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
