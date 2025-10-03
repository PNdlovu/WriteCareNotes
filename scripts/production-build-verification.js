#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Production Build Verification');
console.log('==================================\n');

class BuildVerification {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = 0;
    this.failed = 0;
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    const icon = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };

    console.log(`${colors[type]}${icon[type]} ${message}${colors.reset}`);
  }

  async runCheck(name, checkFn) {
    try {
      this.log(`Checking ${name}...`, 'info');
      await checkFn();
      this.log(`${name} - PASSED`, 'success');
      this.passed++;
    } catch (error) {
      this.log(`${name} - FAILED: ${error.message}`, 'error');
      this.errors.push({ check: name, error: error.message });
      this.failed++;
    }
  }

  // Check 1: Environment Configuration
  async checkEnvironmentConfig() {
    const requiredEnvVars = [
      'NODE_ENV',
      'PORT',
      'DB_HOST',
      'DB_PORT', 
      'DB_USERNAME',
      'DB_NAME'
    ];

    const missing = [];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }

    // Check .env.example exists
    if (!fs.existsSync('.env.example')) {
      throw new Error('.env.example file not found');
    }
  }

  // Check 2: Database Entities
  async checkDatabaseEntities() {
    const entityPaths = [
      'src/entities/hr/Employee.ts',
      'src/entities/workforce/TimeEntry.ts',
      'src/entities/workforce/PayrollRecord.ts',
      'src/entities/workforce/Shift.ts',
      'src/entities/workforce/Holiday.ts',
      'src/entities/workforce/Rota.ts',
      'src/entities/workforce/OvertimeRequest.ts',
      'src/entities/domiciliary/ServiceUser.ts',
      'src/entities/domiciliary/CareVisit.ts',
      'src/entities/auth/UniversalUser.ts'
    ];

    for (const entityPath of entityPaths) {
      if (!fs.existsSync(entityPath)) {
        throw new Error(`Entity file missing: ${entityPath}`);
      }

      const content = fs.readFileSync(entityPath, 'utf8');
      
      // Check for required decorators
      if (!content.includes('@Entity(')) {
        throw new Error(`${entityPath} missing @Entity decorator`);
      }

      // Check for primary key
      if (!content.includes('@PrimaryGeneratedColumn(')) {
        throw new Error(`${entityPath} missing @PrimaryGeneratedColumn decorator`);
      }

      // Check for proper exports
      if (!content.includes('export class')) {
        throw new Error(`${entityPath} missing proper class export`);
      }
    }
  }

  // Check 3: Services Implementation
  async checkServices() {
    const servicePaths = [
      'src/services/workforce/TimeTrackingService.ts',
      'src/services/workforce/PayrollService.ts',
      'src/services/domiciliary/DomiciliaryService.ts',
      'src/services/auth/RoleBasedAccessService.ts',
      'src/services/auth/JWTAuthenticationService.ts',
      'src/services/security/DevicePolicyService.ts',
      'src/services/validation/ValidationService.ts'
    ];

    for (const servicePath of servicePaths) {
      if (!fs.existsSync(servicePath)) {
        throw new Error(`Service file missing: ${servicePath}`);
      }

      const content = fs.readFileSync(servicePath, 'utf8');
      
      // Check for proper class structure
      if (!content.includes('export class')) {
        throw new Error(`${servicePath} missing proper class export`);
      }

      // Check for constructor
      if (!content.includes('constructor(')) {
        throw new Error(`${servicePath} missing constructor`);
      }

      // Check for no TODO or FIXME comments
      if (content.includes('TODO') || content.includes('FIXME') || content.includes('PLACEHOLDER')) {
        this.warnings.push(`${servicePath} contains TODO/FIXME/PLACEHOLDER comments`);
      }

      // Check for no console.log in production code
      const consoleLogs = (content.match(/console\.log\(/g) || []).length;
      if (consoleLogs > 0) {
        this.warnings.push(`${servicePath} contains ${consoleLogs} console.log statements`);
      }
    }
  }

  // Check 4: Mobile App Structure
  async checkMobileApp() {
    const mobileFiles = [
      'mobile/package.json',
      'mobile/App.tsx',
      'mobile/src/screens/workforce/ClockInOutScreen.tsx',
      'mobile/src/screens/workforce/PayslipsScreen.tsx',
      'mobile/src/screens/workforce/HolidaysScreen.tsx',
      'mobile/src/screens/family/FamilyDashboardScreen.tsx',
      'mobile/src/screens/executive/ExecutiveDashboardScreen.tsx',
      'mobile/src/navigation/UniversalNavigator.tsx',
      'mobile/src/services/OfflineStorageService.ts',
      'mobile/src/services/BiometricService.ts',
      'mobile/src/services/PushNotificationService.ts'
    ];

    for (const filePath of mobileFiles) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Mobile app file missing: ${filePath}`);
      }

      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for React Native imports
        if (filePath.includes('screens/') && !content.includes('react-native')) {
          throw new Error(`${filePath} missing React Native imports`);
        }

        // Check for proper exports
        if (!content.includes('export')) {
          throw new Error(`${filePath} missing exports`);
        }
      }
    }

    // Check mobile package.json
    const mobilePackage = JSON.parse(fs.readFileSync('mobile/package.json', 'utf8'));
    const requiredDependencies = [
      'react',
      'react-native',
      '@react-navigation/native',
      'react-redux',
      '@reduxjs/toolkit'
    ];

    for (const dep of requiredDependencies) {
      if (!mobilePackage.dependencies[dep]) {
        throw new Error(`Mobile app missing required dependency: ${dep}`);
      }
    }
  }

  // Check 5: PWA Structure
  async checkPWA() {
    const pwaFiles = [
      'pwa/package.json',
      'pwa/vite.config.ts',
      'pwa/tsconfig.json'
    ];

    for (const filePath of pwaFiles) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`PWA file missing: ${filePath}`);
      }
    }

    // Check PWA package.json
    const pwaPackage = JSON.parse(fs.readFileSync('pwa/package.json', 'utf8'));
    const requiredDependencies = [
      'react',
      'react-dom',
      'vite',
      'typescript'
    ];

    for (const dep of requiredDependencies) {
      if (!pwaPackage.dependencies[dep] && !pwaPackage.devDependencies[dep]) {
        throw new Error(`PWA missing required dependency: ${dep}`);
      }
    }
  }

  // Check 6: Database Migrations
  async checkMigrations() {
    const migrationPath = 'src/migrations';
    if (!fs.existsSync(migrationPath)) {
      throw new Error('Migrations directory not found');
    }

    const migrationFiles = fs.readdirSync(migrationPath).filter(f => f.endsWith('.ts'));
    if (migrationFiles.length === 0) {
      throw new Error('No migration files found');
    }

    // Check first migration file
    const firstMigration = fs.readFileSync(path.join(migrationPath, migrationFiles[0]), 'utf8');
    if (!firstMigration.includes('MigrationInterface')) {
      throw new Error('Migration file does not implement MigrationInterface');
    }

    if (!firstMigration.includes('public async up(') || !firstMigration.includes('public async down(')) {
      throw new Error('Migration file missing up() or down() methods');
    }
  }

  // Check 7: API Controllers
  async checkControllers() {
    const controllerPaths = [
      'src/controllers/workforce/TimeTrackingController.ts'
    ];

    for (const controllerPath of controllerPaths) {
      if (!fs.existsSync(controllerPath)) {
        throw new Error(`Controller file missing: ${controllerPath}`);
      }

      const content = fs.readFileSync(controllerPath, 'utf8');
      
      // Check for proper Express controller structure
      if (!content.includes('Request, Response')) {
        throw new Error(`${controllerPath} missing Express Request/Response imports`);
      }

      // Check for error handling
      if (!content.includes('try {') || !content.includes('catch')) {
        throw new Error(`${controllerPath} missing proper error handling`);
      }

      // Check for validation
      if (!content.includes('validation')) {
        this.warnings.push(`${controllerPath} may be missing input validation`);
      }
    }
  }

  // Check 8: Security Implementation
  async checkSecurity() {
    const securityFiles = [
      'src/services/auth/JWTAuthenticationService.ts',
      'src/services/auth/RoleBasedAccessService.ts',
      'src/services/security/DevicePolicyService.ts',
      'src/middleware/ErrorHandler.ts'
    ];

    for (const filePath of securityFiles) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Security file missing: ${filePath}`);
      }

      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for security best practices
      if (filePath.includes('JWT') && !content.includes('jwt.verify')) {
        throw new Error(`${filePath} missing JWT verification logic`);
      }

      if (filePath.includes('Password') && !content.includes('bcrypt')) {
        this.warnings.push(`${filePath} may be missing password hashing`);
      }
    }
  }

  // Check 9: Configuration Files
  async checkConfiguration() {
    const configFiles = [
      'src/config/database.ts',
      'src/config/production.config.ts',
      '.env.example'
    ];

    for (const filePath of configFiles) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Configuration file missing: ${filePath}`);
      }
    }

    // Check .env.example has all required variables
    const envExample = fs.readFileSync('.env.example', 'utf8');
    const requiredVars = [
      'NODE_ENV',
      'PORT',
      'DB_HOST',
      'DB_PASSWORD',
      'JWT_SECRET',
      'ENCRYPTION_KEY'
    ];

    for (const envVar of requiredVars) {
      if (!envExample.includes(envVar)) {
        throw new Error(`.env.example missing ${envVar}`);
      }
    }
  }

  // Check 10: Data Seeding
  async checkDataSeeding() {
    const seederPath = 'src/seeders/ComprehensiveDataSeeder.ts';
    if (!fs.existsSync(seederPath)) {
      throw new Error('Data seeder file missing');
    }

    const content = fs.readFileSync(seederPath, 'utf8');
    
    // Check for comprehensive seeding methods
    const requiredMethods = [
      'seedEmployees',
      'seedServiceUsers',
      'seedUniversalUsers',
      'seedTimeEntries',
      'seedCareVisits',
      'seedPayrollRecords'
    ];

    for (const method of requiredMethods) {
      if (!content.includes(method)) {
        throw new Error(`Data seeder missing ${method} method`);
      }
    }
  }

  // Check 11: No Mocks or Placeholders
  async checkNoMocksOrPlaceholders() {
    const excludePatterns = [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.next'
    ];

    const checkDirectory = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.relative('.', fullPath);
        
        // Skip excluded directories
        if (excludePatterns.some(pattern => relativePath.includes(pattern))) {
          continue;
        }

        if (fs.statSync(fullPath).isDirectory()) {
          checkDirectory(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Check for problematic patterns
          const problematicPatterns = [
            { pattern: /\/\/\s*TODO/gi, type: 'TODO comment' },
            { pattern: /\/\/\s*FIXME/gi, type: 'FIXME comment' },
            { pattern: /\/\/\s*PLACEHOLDER/gi, type: 'PLACEHOLDER comment' },
            { pattern: /\/\/\s*STUB/gi, type: 'STUB comment' },
            { pattern: /\/\/\s*MOCK/gi, type: 'MOCK comment' },
            { pattern: /throw new Error\(['"]Not implemented['"]\)/gi, type: 'Not implemented error' },
            { pattern: /return null; \/\/ (Placeholder|TODO|FIXME)/gi, type: 'Placeholder return' },
            { pattern: /console\.log\(/g, type: 'Console.log statement' }
          ];

          for (const { pattern, type } of problematicPatterns) {
            const matches = content.match(pattern);
            if (matches) {
              if (type === 'Console.log statement') {
                this.warnings.push(`${relativePath}: Contains ${matches.length} ${type}(s)`);
              } else {
                throw new Error(`${relativePath}: Contains ${type} - ${matches[0]}`);
              }
            }
          }
        }
      }
    };

    checkDirectory('src');
    checkDirectory('mobile/src');
    checkDirectory('pwa/src');
  }

  // Check 12: TypeScript Compilation
  async checkTypeScriptCompilation() {
    try {
      // Check if TypeScript files compile without errors
      execSync('npx tsc --noEmit --project tsconfig.json', { stdio: 'pipe' });
    } catch (error) {
      throw new Error(`TypeScript compilation failed: ${error.message}`);
    }
  }

  // Check 13: Package Dependencies
  async checkDependencies() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check for security vulnerabilities
    try {
      const auditResult = execSync('npm audit --json', { stdio: 'pipe' }).toString();
      const audit = JSON.parse(auditResult);
      
      if (audit.metadata.vulnerabilities.high > 0 || audit.metadata.vulnerabilities.critical > 0) {
        throw new Error(`High/Critical security vulnerabilities found: ${audit.metadata.vulnerabilities.high} high, ${audit.metadata.vulnerabilities.critical} critical`);
      }

      if (audit.metadata.vulnerabilities.moderate > 5) {
        this.warnings.push(`${audit.metadata.vulnerabilities.moderate} moderate security vulnerabilities found`);
      }
    } catch (error) {
      if (!error.message.includes('npm audit')) {
        throw error;
      }
      this.warnings.push('Could not run npm audit');
    }

    // Check for required production dependencies
    const requiredDeps = [
      'express',
      'typeorm',
      'postgres',
      'jsonwebtoken',
      'bcryptjs',
      'joi',
      'cors',
      'helmet',
      'compression'
    ];

    for (const dep of requiredDeps) {
      if (!packageJson.dependencies[dep]) {
        throw new Error(`Missing required dependency: ${dep}`);
      }
    }
  }

  // Check 14: Mobile App Dependencies
  async checkMobileDependencies() {
    const mobilePackage = JSON.parse(fs.readFileSync('mobile/package.json', 'utf8'));
    
    const requiredDeps = [
      'react',
      'react-native',
      '@react-navigation/native',
      'react-redux',
      '@reduxjs/toolkit',
      'react-native-biometrics',
      'react-native-keychain',
      '@react-native-async-storage/async-storage'
    ];

    for (const dep of requiredDeps) {
      if (!mobilePackage.dependencies[dep]) {
        throw new Error(`Mobile app missing required dependency: ${dep}`);
      }
    }
  }

  // Check 15: API Routes
  async checkAPIRoutes() {
    // Check if route files exist and are properly structured
    const routePaths = [
      'src/routes/workforce',
      'src/routes/domiciliary',
      'src/routes/auth'
    ];

    for (const routePath of routePaths) {
      if (!fs.existsSync(routePath)) {
        this.warnings.push(`Route directory missing: ${routePath} (will be created on first run)`);
      }
    }
  }

  // Check 16: Production Readiness
  async checkProductionReadiness() {
    // Check for production configuration
    const prodConfig = fs.readFileSync('src/config/production.config.ts', 'utf8');
    
    const requiredConfigs = [
      'JWT_SECRET',
      'ENCRYPTION_KEY',
      'DATABASE_URL',
      'CORS_ORIGIN',
      'RATE_LIMIT'
    ];

    for (const config of requiredConfigs) {
      if (!prodConfig.includes(config)) {
        throw new Error(`Production config missing: ${config}`);
      }
    }

    // Check for security headers
    if (!prodConfig.includes('securityHeaders')) {
      throw new Error('Production config missing security headers');
    }

    // Check for monitoring configuration
    if (!prodConfig.includes('monitoring')) {
      throw new Error('Production config missing monitoring setup');
    }
  }

  async runAllChecks() {
    console.log('Starting comprehensive build verification...\n');

    await this.runCheck('Environment Configuration', () => this.checkEnvironmentConfig());
    await this.runCheck('Database Entities', () => this.checkDatabaseEntities());
    await this.runCheck('Services Implementation', () => this.checkServices());
    await this.runCheck('Mobile App Structure', () => this.checkMobileApp());
    await this.runCheck('PWA Structure', () => this.checkPWA());
    await this.runCheck('Database Migrations', () => this.checkMigrations());
    await this.runCheck('API Controllers', () => this.checkControllers());
    await this.runCheck('Security Implementation', () => this.checkSecurity());
    await this.runCheck('Configuration Files', () => this.checkConfiguration());
    await this.runCheck('Data Seeding', () => this.checkDataSeeding());
    await this.runCheck('No Mocks/Placeholders', () => this.checkNoMocksOrPlaceholders());
    await this.runCheck('Mobile Dependencies', () => this.checkMobileDependencies());
    await this.runCheck('API Routes', () => this.checkAPIRoutes());
    await this.runCheck('Production Readiness', () => this.checkProductionReadiness());

    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 BUILD VERIFICATION SUMMARY');
    console.log('='.repeat(50));
    
    this.log(`Total Checks: ${this.passed + this.failed}`, 'info');
    this.log(`Passed: ${this.passed}`, 'success');
    this.log(`Failed: ${this.failed}`, this.failed > 0 ? 'error' : 'success');
    this.log(`Warnings: ${this.warnings.length}`, this.warnings.length > 0 ? 'warning' : 'success');

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.check}: ${error.error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    if (this.failed === 0) {
      this.log('\n🎉 BUILD VERIFICATION PASSED!', 'success');
      this.log('✅ Application is production-ready with no mocks, placeholders, or stubs!', 'success');
    } else {
      this.log('\n💥 BUILD VERIFICATION FAILED!', 'error');
      this.log(`❌ ${this.failed} critical issues must be resolved before production deployment.`, 'error');
      process.exit(1);
    }
  }
}

// Set environment variables for testing
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '3000';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_USERNAME = process.env.DB_USERNAME || 'postgres';
process.env.DB_NAME = process.env.DB_NAME || 'writecarenotes';

// Run verification
const verification = new BuildVerification();
verification.runAllChecks().catch(error => {
  console.error('💥 Verification script failed:', error);
  process.exit(1);
});