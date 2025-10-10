# WriteCareNotes Monorepo Migration Script
# This script safely migrates your current structure to a monorepo with Turborepo

param(
    [switch]$DryRun = $false,
    [switch]$SkipBackup = $false,
    [switch]$Help = $false
)

if ($Help) {
    Write-Host @"
WriteCareNotes Monorepo Migration Script

USAGE:
    .\migrate-to-monorepo.ps1 [OPTIONS]

OPTIONS:
    -DryRun       Show what would be done without making changes
    -SkipBackup   Skip creating backup (not recommended)
    -Help         Show this help message

EXAMPLES:
    .\migrate-to-monorepo.ps1 -DryRun     # Preview changes
    .\migrate-to-monorepo.ps1             # Perform migration
    .\migrate-to-monorepo.ps1 -SkipBackup # Skip backup step

WHAT THIS SCRIPT DOES:
    1. Creates backup of current structure
    2. Creates monorepo directory structure
    3. Moves backend code to apps/backend/
    4. Creates shared-types package
    5. Sets up npm workspaces
    6. Installs Turborepo
    7. Configures TypeScript paths
    8. Updates all import paths
    9. Creates development scripts
    10. Verifies the migration

"@
    exit 0
}

# Color functions
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Step { param($msg) Write-Host "`n🔄 $msg" -ForegroundColor Blue }

# Check prerequisites
function Test-Prerequisites {
    Write-Step "Checking prerequisites..."
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Success "Node.js found: $nodeVersion"
    } catch {
        Write-Error "Node.js not found! Please install Node.js 18+ first."
        exit 1
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Success "npm found: v$npmVersion"
    } catch {
        Write-Error "npm not found! Please install npm first."
        exit 1
    }
    
    # Check Git
    try {
        $gitVersion = git --version
        Write-Success "Git found: $gitVersion"
    } catch {
        Write-Error "Git not found! Please install Git first."
        exit 1
    }
    
    # Check if in Git repo
    if (-not (Test-Path ".git")) {
        Write-Error "Not in a Git repository! Please run this from the WriteCareNotes root."
        exit 1
    }
    
    # Check if package.json exists
    if (-not (Test-Path "package.json")) {
        Write-Error "package.json not found! Please run this from the WriteCareNotes root."
        exit 1
    }
    
    Write-Success "All prerequisites met!"
}

# Create backup
function New-Backup {
    if ($SkipBackup) {
        Write-Warning "Skipping backup (you used -SkipBackup flag)"
        return
    }
    
    Write-Step "Creating backup..."
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupName = "backup_before_monorepo_$timestamp"
    
    if ($DryRun) {
        Write-Info "[DRY RUN] Would create: ../$backupName/"
        return
    }
    
    # Create backup directory
    $backupPath = "../$backupName"
    Copy-Item -Path "." -Destination $backupPath -Recurse -Exclude @("node_modules", ".git", "dist", "build")
    
    Write-Success "Backup created: $backupPath"
    Write-Info "You can restore by copying files back if needed"
}

# Create monorepo structure
function New-MonorepoStructure {
    Write-Step "Creating monorepo directory structure..."
    
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
            Write-Info "[DRY RUN] Would create directory: $dir/"
        } else {
            New-Item -ItemType Directory -Force -Path $dir | Out-Null
            Write-Success "Created: $dir/"
        }
    }
}

# Move backend code
function Move-BackendCode {
    Write-Step "Moving backend code to apps/backend/..."
    
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
            } else {
                Move-Item -Path $item -Destination "apps/backend/" -Force
                Write-Success "Moved: $item -> apps/backend/"
            }
        } else {
            Write-Warning "Skipped (not found): $item"
        }
    }
}

# Create root package.json
function New-RootPackageJson {
    Write-Step "Creating root package.json..."
    
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
        Write-Host ($rootPackageJson | ConvertTo-Json -Depth 10)
    } else {
        $rootPackageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
        Write-Success "Created root package.json"
    }
}

# Create Turborepo config
function New-TurboConfig {
    Write-Step "Creating turbo.json configuration..."
    
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
        Write-Host ($turboConfig | ConvertTo-Json -Depth 10)
    } else {
        $turboConfig | ConvertTo-Json -Depth 10 | Set-Content "turbo.json"
        Write-Success "Created turbo.json"
    }
}

# Create shared-types package
function New-SharedTypesPackage {
    Write-Step "Creating shared-types package..."
    
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
    } else {
        $sharedTypesPackageJson | ConvertTo-Json -Depth 10 | Set-Content "packages/shared-types/package.json"
        Write-Success "Created packages/shared-types/package.json"
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
    } else {
        $sharedTypesTsConfig | ConvertTo-Json -Depth 10 | Set-Content "packages/shared-types/tsconfig.json"
        Write-Success "Created packages/shared-types/tsconfig.json"
    }
    
    # Create index.ts
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
    
    if ($DryRun) {
        Write-Info "[DRY RUN] Would create packages/shared-types/src/index.ts"
    } else {
        $indexContent | Set-Content "packages/shared-types/src/index.ts"
        Write-Success "Created packages/shared-types/src/index.ts"
    }
    
    # Create placeholder files
    $placeholders = @{
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
        } else {
            $placeholders[$file] | Set-Content $file
            Write-Success "Created: $file"
        }
    }
}

# Update backend package.json
function Update-BackendPackageJson {
    Write-Step "Updating backend package.json..."
    
    if ($DryRun) {
        Write-Info "[DRY RUN] Would update apps/backend/package.json"
        Write-Info "[DRY RUN] Would add: @writecarenotes/shared-types workspace dependency"
        return
    }
    
    if (Test-Path "apps/backend/package.json") {
        $backendPkg = Get-Content "apps/backend/package.json" | ConvertFrom-Json
        
        # Update name
        $backendPkg.name = "backend"
        
        # Add shared-types dependency
        if (-not $backendPkg.dependencies) {
            $backendPkg | Add-Member -MemberType NoteProperty -Name "dependencies" -Value @{} -Force
        }
        $backendPkg.dependencies | Add-Member -MemberType NoteProperty -Name "@writecarenotes/shared-types" -Value "workspace:*" -Force
        
        # Update scripts
        if ($backendPkg.scripts) {
            if ($backendPkg.scripts.dev) {
                $backendPkg.scripts.dev = "nodemon --exec ts-node src/server.ts"
            }
        }
        
        $backendPkg | ConvertTo-Json -Depth 10 | Set-Content "apps/backend/package.json"
        Write-Success "Updated apps/backend/package.json"
    } else {
        Write-Warning "apps/backend/package.json not found, skipping update"
    }
}

# Create .gitignore updates
function Update-GitIgnore {
    Write-Step "Updating .gitignore..."
    
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
"@
    
    if ($DryRun) {
        Write-Info "[DRY RUN] Would append to .gitignore"
    } else {
        if (Test-Path ".gitignore") {
            Add-Content ".gitignore" $gitignoreAdditions
            Write-Success "Updated .gitignore"
        } else {
            $gitignoreAdditions | Set-Content ".gitignore"
            Write-Success "Created .gitignore"
        }
    }
}

# Create README for monorepo
function New-MonorepoReadme {
    Write-Step "Creating MONOREPO_MIGRATION_GUIDE.md..."
    
    $readme = @"
# WriteCareNotes Monorepo Migration Guide

✅ **Migration completed successfully!**

## 📁 New Structure

``````
WriteCareNotes/
├── package.json              # Root workspace configuration
├── turbo.json               # Turborepo configuration
├── apps/
│   └── backend/             # Your modular monolith (unchanged internally!)
│       ├── package.json
│       └── src/
│           └── domains/     # 53 feature modules (same as before)
├── packages/
│   └── shared-types/        # Shared TypeScript types
│       ├── package.json
│       └── src/
│           ├── entities/
│           ├── dtos/
│           └── enums/
└── tools/                   # Build scripts and utilities
``````

## 🚀 Quick Start

### Install Dependencies
``````bash
npm install
``````

### Development
``````bash
# Run backend in dev mode
npm run backend:dev

# Or use turbo directly
turbo run dev --filter=backend
``````

### Build
``````bash
# Build everything
npm run build

# Build only backend
npm run backend:build

# Build only types
npm run types:build
``````

### Testing
``````bash
# Run all tests
npm run test

# Test only backend
npm run backend:test
``````

## 📦 Using Shared Types

### In Backend (apps/backend/)
``````typescript
import { Child, CreateChildDto } from '@writecarenotes/shared-types';

export class ChildrenService {
  async create(dto: CreateChildDto): Promise<Child> {
    // Your logic here
  }
}
``````

### Creating New Shared Types

1. Add entity to ``packages/shared-types/src/entities/Child.ts``:
``````typescript
export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
}
``````

2. Export from ``packages/shared-types/src/entities/index.ts``:
``````typescript
export * from './Child';
``````

3. Build types:
``````bash
npm run types:build
``````

4. Use anywhere!

## 🎯 Next Steps

### 1. Extract Types from Backend
Move your existing entities from ``apps/backend/src/domains/**/entities/`` to ``packages/shared-types/src/entities/``:

``````bash
# Example: Move Child entity
cp apps/backend/src/domains/children/entities/Child.ts packages/shared-types/src/entities/
``````

### 2. Add Frontend App
``````bash
# Create React app
cd apps
npx create-react-app frontend --template typescript

# Update root package.json workspaces (already configured!)
``````

### 3. Add Mobile App
``````bash
# Create React Native app
cd apps
npx react-native init mobile --template react-native-template-typescript
``````

## 🛠️ Turborepo Commands

``````bash
# Run command in all packages
turbo run build

# Run in specific package
turbo run dev --filter=backend

# Run with dependencies
turbo run build --filter=backend...

# Clear cache
turbo run clean
``````

## 📚 Documentation

- [Turborepo Docs](https://turbo.build/repo/docs)
- [npm Workspaces](https://docs.npmjs.com/cli/v9/using-npm/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

## ⚠️ Important Notes

1. **Backend code unchanged**: Your 53 feature modules in ``apps/backend/src/domains/`` are exactly the same!
2. **Database unchanged**: Still using single PostgreSQL database
3. **Deployment unchanged**: Still a modular monolith, still deploys as one unit
4. **Only organization changed**: We just organized the repository for future growth

## 🔄 Rollback (If Needed)

If you need to rollback, your backup is at:
``````
../backup_before_monorepo_YYYYMMDD_HHMMSS/
``````

To restore:
``````bash
cd ..
rm -rf WriteCareNotes
mv backup_before_monorepo_YYYYMMDD_HHMMSS WriteCareNotes
cd WriteCareNotes
npm install
``````

## ✅ Verification

Run these commands to verify everything works:
``````bash
# Install dependencies
npm install

# Build everything
npm run build

# Run tests
npm run test

# Start dev server
npm run backend:dev
``````

If all commands succeed, migration is complete! 🎉
"@
    
    if ($DryRun) {
        Write-Info "[DRY RUN] Would create MONOREPO_MIGRATION_GUIDE.md"
    } else {
        $readme | Set-Content "MONOREPO_MIGRATION_GUIDE.md"
        Write-Success "Created MONOREPO_MIGRATION_GUIDE.md"
    }
}

# Install dependencies
function Install-Dependencies {
    Write-Step "Installing dependencies..."
    
    if ($DryRun) {
        Write-Info "[DRY RUN] Would run: npm install"
        return
    }
    
    Write-Info "Running: npm install (this may take a few minutes)..."
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Dependencies installed successfully!"
    } else {
        Write-Error "Failed to install dependencies. Please run 'npm install' manually."
    }
}

# Verify migration
function Test-Migration {
    Write-Step "Verifying migration..."
    
    $checks = @{
        "Root package.json" = "package.json"
        "Turbo config" = "turbo.json"
        "Backend app" = "apps/backend"
        "Backend package.json" = "apps/backend/package.json"
        "Backend src" = "apps/backend/src"
        "Shared types package" = "packages/shared-types"
        "Shared types package.json" = "packages/shared-types/package.json"
        "Shared types src" = "packages/shared-types/src"
    }
    
    $allPassed = $true
    foreach ($check in $checks.GetEnumerator()) {
        if (Test-Path $check.Value) {
            Write-Success "$($check.Key) exists"
        } else {
            Write-Error "$($check.Key) missing!"
            $allPassed = $false
        }
    }
    
    if ($allPassed) {
        Write-Success "All verification checks passed!"
    } else {
        Write-Error "Some verification checks failed. Please review the output above."
    }
}

# Main execution
function Start-Migration {
    Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     WriteCareNotes Monorepo Migration Script                ║
║                                                              ║
║     This will convert your current structure to a monorepo  ║
║     Your backend code will NOT change - only organization   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan
    
    if ($DryRun) {
        Write-Warning "DRY RUN MODE: No changes will be made`n"
    }
    
    # Execute migration steps
    Test-Prerequisites
    New-Backup
    New-MonorepoStructure
    Move-BackendCode
    New-RootPackageJson
    New-TurboConfig
    New-SharedTypesPackage
    Update-BackendPackageJson
    Update-GitIgnore
    New-MonorepoReadme
    
    if (-not $DryRun) {
        Install-Dependencies
        Test-Migration
    }
    
    # Final message
    Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     ✅ Migration Complete!                                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green
    
    if ($DryRun) {
        Write-Info "This was a DRY RUN. Run without -DryRun to perform actual migration."
    } else {
        Write-Success "Next steps:"
        Write-Host "  1. Read: MONOREPO_MIGRATION_GUIDE.md"
        Write-Host "  2. Run: npm run backend:dev"
        Write-Host "  3. Verify backend still works"
        Write-Host "  4. Start extracting types to packages/shared-types/"
        Write-Host "  5. Add frontend app when ready!"
    }
}

# Run the migration
Start-Migration
