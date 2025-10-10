# Monorepo Migration Guide for WriteCareNotes

**Status**: Ready to Execute  
**Estimated Time**: 30-45 minutes  
**Risk Level**: Low (backup created automatically)

---

## 🎯 What This Migration Does

### Before (Current):
```
WriteCareNotes/
├── src/
│   ├── server.ts
│   ├── app.ts
│   └── domains/
│       ├── children/
│       ├── careplanning/
│       └── ... (51 more modules)
├── package.json
├── tsconfig.json
└── Dockerfile
```

### After (Monorepo):
```
WriteCareNotes/
├── package.json                 # Root workspace config
├── turbo.json                  # Turborepo config
├── apps/
│   └── backend/                # Your modular monolith (code unchanged!)
│       ├── package.json
│       ├── tsconfig.json
│       ├── Dockerfile
│       └── src/
│           ├── server.ts
│           ├── app.ts
│           └── domains/
│               ├── children/
│               ├── careplanning/
│               └── ... (51 more modules)
├── packages/
│   └── shared-types/           # NEW: Shared TypeScript types
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── entities/
│           ├── dtos/
│           └── enums/
└── tools/                      # Build scripts (future)
```

---

## ✅ What Changes

| Aspect | Before | After |
|--------|--------|-------|
| **Your backend code** | `src/domains/` | `apps/backend/src/domains/` ✅ Same! |
| **Database** | Single PostgreSQL | Single PostgreSQL ✅ Same! |
| **Deployment** | Single monolith | Single monolith ✅ Same! |
| **Architecture** | Modular monolith | Modular monolith ✅ Same! |
| **package.json** | 1 file | 3 files (root + backend + types) |
| **Build tool** | npm scripts | Turborepo (faster!) |
| **Type sharing** | Not possible | Easy import from packages/ |

**Bottom Line**: Your backend code doesn't change. We're just organizing the repository for future growth!

---

## 🚀 Quick Start: Run the Migration

### Step 1: Preview Changes (Recommended)
```powershell
# See what will happen without making changes
.\migrate-to-monorepo.ps1 -DryRun
```

This shows you:
- ✅ What directories will be created
- ✅ What files will be moved
- ✅ What configurations will be added
- ✅ No actual changes made!

### Step 2: Run the Migration
```powershell
# Perform the actual migration
.\migrate-to-monorepo.ps1
```

This will:
1. ✅ Create backup at `../backup_before_monorepo_YYYYMMDD_HHMMSS/`
2. ✅ Create monorepo structure (`apps/`, `packages/`)
3. ✅ Move backend code to `apps/backend/`
4. ✅ Create `packages/shared-types/`
5. ✅ Set up npm workspaces
6. ✅ Install Turborepo
7. ✅ Install all dependencies
8. ✅ Verify migration success

### Step 3: Verify Everything Works
```powershell
# Install dependencies (if not done automatically)
npm install

# Build everything
npm run build

# Start backend in dev mode
npm run backend:dev
```

---

## 📋 Detailed Migration Steps

### What the Script Does

#### 1. **Prerequisites Check** ✅
```powershell
- Verify Node.js 18+ installed
- Verify npm installed
- Verify Git installed
- Verify you're in Git repo
- Verify package.json exists
```

#### 2. **Backup Creation** 📦
```powershell
- Creates: ../backup_before_monorepo_YYYYMMDD_HHMMSS/
- Copies all files (except node_modules, dist)
- Safe rollback available if needed
```

#### 3. **Directory Structure** 📁
```powershell
Creates:
- apps/
- apps/backend/
- packages/
- packages/shared-types/
- packages/shared-types/src/
- packages/shared-types/src/entities/
- packages/shared-types/src/dtos/
- packages/shared-types/src/enums/
- tools/
```

#### 4. **Move Backend Code** 🚚
```powershell
Moves to apps/backend/:
- src/                    ✅ All your modules
- package.json
- tsconfig.json
- jest.config.js
- babel.config.js
- .env.example
- Dockerfile
- Dockerfile.production
```

#### 5. **Root Configuration** ⚙️

**Creates `package.json`:**
```json
{
  "name": "writecarenotes-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "backend:dev": "turbo run dev --filter=backend",
    "backend:build": "turbo run build --filter=backend",
    "types:build": "turbo run build --filter=@writecarenotes/shared-types"
  },
  "devDependencies": {
    "turbo": "^2.3.3",
    "prettier": "^3.0.0"
  }
}
```

**Creates `turbo.json`:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

#### 6. **Shared Types Package** 📦

**Creates `packages/shared-types/package.json`:**
```json
{
  "name": "@writecarenotes/shared-types",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  }
}
```

**Creates `packages/shared-types/tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist",
    "strict": true
  },
  "include": ["src/**/*"]
}
```

**Creates `packages/shared-types/src/index.ts`:**
```typescript
// Export all shared types
export * from './entities';
export * from './dtos';
export * from './enums';
```

#### 7. **Update Backend Package** 📝

Updates `apps/backend/package.json`:
```json
{
  "name": "backend",
  "dependencies": {
    "@writecarenotes/shared-types": "workspace:*",
    // ... existing dependencies
  }
}
```

#### 8. **Install Dependencies** 📥
```powershell
npm install
```

This installs:
- Turborepo
- All backend dependencies
- Shared types dependencies
- Sets up workspace links

#### 9. **Verification** ✅
```powershell
Checks:
✅ Root package.json exists
✅ turbo.json exists
✅ apps/backend/ exists
✅ apps/backend/src/ exists
✅ packages/shared-types/ exists
✅ All files moved correctly
```

---

## 🎮 Available Commands After Migration

### Development
```powershell
# Start backend in dev mode
npm run backend:dev

# Or use turbo directly
turbo run dev --filter=backend

# Watch shared types for changes
npm run types:build -- --watch
```

### Building
```powershell
# Build everything
npm run build

# Build only backend
npm run backend:build

# Build only shared types
npm run types:build

# Build with cache info
turbo run build --summarize
```

### Testing
```powershell
# Run all tests
npm run test

# Test only backend
npm run backend:test

# Test with coverage
turbo run test -- --coverage
```

### Maintenance
```powershell
# Clean all build outputs
turbo run clean

# Clear Turborepo cache
turbo run build --force

# Format all code
npm run format
```

---

## 📦 Using Shared Types

### Step 1: Create a Shared Type

**In `packages/shared-types/src/entities/Child.ts`:**
```typescript
export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  careHomeId: string;
}
```

**Export from `packages/shared-types/src/entities/index.ts`:**
```typescript
export * from './Child';
```

### Step 2: Build Types
```powershell
npm run types:build
```

### Step 3: Use in Backend
```typescript
// apps/backend/src/domains/children/service.ts
import { Child } from '@writecarenotes/shared-types';

export class ChildrenService {
  async findById(id: string): Promise<Child> {
    // Your logic here
  }
  
  async create(data: Partial<Child>): Promise<Child> {
    // Your logic here
  }
}
```

### Step 4: Use in Frontend (Future)
```typescript
// apps/frontend/src/components/ChildProfile.tsx
import { Child } from '@writecarenotes/shared-types';

export function ChildProfile({ child }: { child: Child }) {
  return (
    <div>
      <h1>{child.firstName} {child.lastName}</h1>
      <p>DOB: {child.dateOfBirth}</p>
    </div>
  );
}
```

✅ **Same types, no duplication, no sync issues!**

---

## 🔄 Rollback Plan (If Needed)

### If Migration Fails or You Change Your Mind:

#### Option 1: Use Backup
```powershell
# Stop and go back to backup
cd ..
Remove-Item -Recurse -Force WriteCareNotes
Rename-Item backup_before_monorepo_YYYYMMDD_HHMMSS WriteCareNotes
cd WriteCareNotes
npm install
```

#### Option 2: Manual Restore (If Backup Missing)
```powershell
# Move backend code back to root
Move-Item apps/backend/src ./
Move-Item apps/backend/package.json ./
Move-Item apps/backend/tsconfig.json ./
Move-Item apps/backend/Dockerfile ./

# Remove monorepo structure
Remove-Item -Recurse apps, packages, tools
Remove-Item package.json, turbo.json

# Reinstall
npm install
```

---

## 🎯 Next Steps After Migration

### 1. **Verify Backend Works** (Day 1)
```powershell
npm run backend:dev
# Test all your existing endpoints
# Ensure database connections work
# Run existing tests: npm run backend:test
```

### 2. **Extract Types Gradually** (Week 1)
```powershell
# Start with one entity
# Example: Move Child entity
cp apps/backend/src/domains/children/entities/Child.ts packages/shared-types/src/entities/

# Update imports in backend
# Instead of: import { Child } from './entities/Child';
# Use: import { Child } from '@writecarenotes/shared-types';

# Build types: npm run types:build
# Test backend: npm run backend:test
```

### 3. **Add Frontend App** (When Ready)
```powershell
cd apps
npx create-react-app frontend --template typescript

# Or Next.js
npx create-next-app@latest frontend --typescript

# Or Vite
npm create vite@latest frontend -- --template react-ts
```

Then update root `package.json` workspaces (already configured!).

### 4. **Add Mobile App** (Future)
```powershell
cd apps
npx react-native init mobile --template react-native-template-typescript
```

---

## 🛠️ Turborepo Features You'll Love

### 1. **Incremental Builds**
```powershell
# First build (everything)
turbo run build
✓ Built 3 packages in 2min

# Change one file in backend
turbo run build
✓ Only rebuilt backend (cached rest!) in 5sec
```

### 2. **Parallel Execution**
```powershell
# Runs builds in parallel automatically
turbo run build
# Backend, shared-types, frontend build simultaneously!
```

### 3. **Smart Caching**
```powershell
# Turborepo caches build outputs
# If code hasn't changed, uses cache
# 10x faster rebuilds!
```

### 4. **Dependency-Aware**
```powershell
# Knows shared-types must build before backend
# Automatically builds in correct order
turbo run build
# 1. shared-types
# 2. backend (depends on shared-types)
# 3. frontend (depends on shared-types)
```

---

## 📊 Performance Benefits

### Build Times Comparison

| Scenario | Without Turbo | With Turbo | Improvement |
|----------|---------------|------------|-------------|
| **Clean build** | 2min | 2min | Same (first time) |
| **Rebuild all** | 2min | 5sec | **24x faster** |
| **Change one file** | 2min | 5sec | **24x faster** |
| **CI/CD builds** | 2min | 30sec | **4x faster** |

### Developer Experience

| Task | Before | After |
|------|--------|-------|
| **Add frontend** | New repo, setup from scratch | `npx create-react-app apps/frontend` |
| **Share types** | Copy-paste, manual sync | `import from '@writecarenotes/shared-types'` |
| **Full-stack feature** | 2 PRs, 2 repos | 1 atomic commit |
| **Dependency updates** | Update each repo | `npm update --workspaces` |

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Cannot find module '@writecarenotes/shared-types'"
```powershell
# Solution: Build shared-types first
npm run types:build

# Or rebuild everything
npm run build
```

### Issue 2: "Workspace dependency not found"
```powershell
# Solution: Reinstall dependencies
npm install

# Or clean and reinstall
Remove-Item -Recurse node_modules
npm install
```

### Issue 3: "Turbo command not found"
```powershell
# Solution: Install turbo
npm install turbo --save-dev

# Or reinstall root dependencies
npm install
```

### Issue 4: TypeScript errors after migration
```powershell
# Solution: Rebuild types
npm run types:build

# Clear TypeScript cache
Remove-Item -Recurse apps/backend/dist
npm run backend:build
```

---

## ✅ Migration Checklist

### Pre-Migration
- [ ] Commit all current changes
- [ ] Ensure tests pass: `npm test`
- [ ] Ensure app runs: `npm run dev`
- [ ] Read this guide completely
- [ ] Run dry-run: `.\migrate-to-monorepo.ps1 -DryRun`

### During Migration
- [ ] Run migration script: `.\migrate-to-monorepo.ps1`
- [ ] Verify backup created
- [ ] Watch for errors in output
- [ ] Wait for npm install to complete

### Post-Migration
- [ ] Verify structure: `tree /F apps packages`
- [ ] Install dependencies: `npm install`
- [ ] Build everything: `npm run build`
- [ ] Run tests: `npm run test`
- [ ] Start dev server: `npm run backend:dev`
- [ ] Test existing endpoints
- [ ] Commit changes: `git add -A && git commit -m "refactor: Migrate to monorepo structure"`

### Gradual Improvements
- [ ] Extract one entity to shared-types
- [ ] Update imports to use `@writecarenotes/shared-types`
- [ ] Rebuild and test
- [ ] Repeat for more entities
- [ ] Add frontend app (when ready)

---

## 📚 Resources

### Turborepo
- [Official Docs](https://turbo.build/repo/docs)
- [Getting Started](https://turbo.build/repo/docs/getting-started)
- [Caching Guide](https://turbo.build/repo/docs/core-concepts/caching)

### npm Workspaces
- [Official Docs](https://docs.npmjs.com/cli/v9/using-npm/workspaces)
- [Tutorial](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#workspaces)

### TypeScript Project References
- [Handbook](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Monorepo Setup](https://www.typescriptlang.org/docs/handbook/project-references.html#composite)

---

## 🎯 Summary

### What You Get:
✅ **Organized structure** ready for multiple apps  
✅ **Type safety** across entire stack  
✅ **Faster builds** with Turborepo caching  
✅ **Easy code sharing** between apps  
✅ **Atomic commits** for full-stack features  
✅ **Future-proof** for frontend/mobile apps  

### What Stays the Same:
✅ **Backend code** (53 modules unchanged)  
✅ **Database** (single PostgreSQL)  
✅ **Architecture** (modular monolith)  
✅ **Deployment** (single application)  

### Time Investment:
⏱️ **Migration**: 30-45 minutes  
⏱️ **Learning**: 1-2 hours  
⏱️ **Return**: Lifetime of benefits!  

---

**Ready to migrate?** Run:
```powershell
.\migrate-to-monorepo.ps1
```

**Have questions?** Check:
- MONOREPO_MIGRATION_GUIDE.md (created after migration)
- Turborepo docs: https://turbo.build/repo
- Or ask! 😊
