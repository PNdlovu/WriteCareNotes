#!/usr/bin/env node

/**
 * WriteCareNotes Completion Agent
 * 🔒 Completion Mandate: Transform all modules to production-grade, audit-ready, enterprise-compliant
 * 
 * This agent enforces strict hygiene and eliminates all placeholders across the codebase
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

interface CompletionRule {
  id: string;
  category: 'microservice' | 'ui' | 'testing' | 'data' | 'docs' | 'ci_cd';
  name: string;
  pattern: RegExp;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  fix: string;
}

interface ModuleStatus {
  name: string;
  path: string;
  status: 'complete' | 'in_progress' | 'needs_transformation' | 'failed';
  issues: CompletionIssue[];
  tests: boolean;
  docs: boolean;
  ui: boolean;
  compliance: boolean;
  lastUpdated: Date;
}

interface CompletionIssue {
  rule: string;
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  fix: string;
}

interface CompletionReport {
  totalModules: number;
  completeModules: number;
  criticalIssues: number;
  moduleStatuses: ModuleStatus[];
  auditSummary: {
    productionReady: number;
    complianceScore: number;
    testCoverage: number;
    documentationScore: number;
  };
}

class WriteCareNotesCompletionAgent {
  private rules: CompletionRule[] = [];
  private moduleStatuses: Map<string, ModuleStatus> = new Map();
  private rootPath: string;

  constructor(rootPath: string = process.cwd()) {
    this.rootPath = rootPath;
    this.initializeRules();
  }

  private initializeRules(): void {
    this.rules = [
      // 🔧 Microservice Rules
      {
        id: 'NO_TODO_COMMENTS',
        category: 'microservice',
        name: 'No TODO Comments',
        pattern: /\/\/\s*TODO|\/\*\s*TODO|\*\s*TODO/gi,
        severity: 'high',
        description: 'TODO comments indicate incomplete implementation',
        fix: 'Implement the missing functionality or remove the comment'
      },
      {
        id: 'NO_MOCK_IMPLEMENTATIONS',
        category: 'microservice',
        name: 'No Mock Implementations',
        pattern: /mock|stub|placeholder|return\s+null|return\s+undefined|throw\s+new\s+Error\(['"`]not\s+implemented/gi,
        severity: 'critical',
        description: 'Mock implementations must be replaced with real logic',
        fix: 'Implement actual business logic'
      },
      {
        id: 'AUDIT_LOGGING_REQUIRED',
        category: 'microservice',
        name: 'Audit Logging Required',
        pattern: /async\s+(\w+)\s*\([^)]*\)\s*:\s*Promise[^{]*\{(?![^}]*logger\.|[^}]*audit\.)/gi,
        severity: 'high',
        description: 'Critical operations must include audit logging',
        fix: 'Add logger or audit service calls'
      },
      {
        id: 'ERROR_HANDLING_REQUIRED',
        category: 'microservice',
        name: 'Error Handling Required',
        pattern: /try\s*\{[^}]*\}\s*catch\s*\([^)]*\)\s*\{\s*\}/gi,
        severity: 'medium',
        description: 'Empty catch blocks indicate poor error handling',
        fix: 'Add proper error handling and logging'
      },
      
      // 🎨 UI Rules
      {
        id: 'SHADCN_UI_REQUIRED',
        category: 'ui',
        name: 'shadcn/ui Components Required',
        pattern: /(import.*from\s+['"`]react['"`]|export.*component)/gi,
        severity: 'medium',
        description: 'UI components should use shadcn/ui framework',
        fix: 'Migrate to shadcn/ui components'
      },
      {
        id: 'ACCESSIBILITY_REQUIRED',
        category: 'ui',
        name: 'Accessibility Attributes Required',
        pattern: /<(button|input|form|img|a)\s+(?![^>]*aria-|[^>]*role=)/gi,
        severity: 'high',
        description: 'UI elements must include accessibility attributes',
        fix: 'Add aria-label, role, or other accessibility attributes'
      },
      
      // 🧪 Testing Rules
      {
        id: 'TESTS_REQUIRED',
        category: 'testing',
        name: 'Tests Required',
        pattern: /export\s+(class|function|const)\s+\w+/gi,
        severity: 'high',
        description: 'Exported modules must have corresponding tests',
        fix: 'Create unit tests for exported functionality'
      },
      
      // 📦 Data Rules
      {
        id: 'NO_PLACEHOLDER_DATA',
        category: 'data',
        name: 'No Placeholder Data',
        pattern: /['"`](lorem\s+ipsum|placeholder|test\s+data|sample\s+data|n\/a|tbd|todo)['"`]/gi,
        severity: 'medium',
        description: 'Placeholder data must be replaced with realistic examples',
        fix: 'Use realistic, audit-safe data'
      },
      
      // 📚 Documentation Rules
      {
        id: 'JSDOC_REQUIRED',
        category: 'docs',
        name: 'JSDoc Required',
        pattern: /export\s+(class|function)\s+\w+(?!\s*\/\*\*)/gi,
        severity: 'medium',
        description: 'Exported classes and functions must have JSDoc documentation',
        fix: 'Add comprehensive JSDoc comments'
      }
    ];
  }

  /**
   * Scan the entire codebase for modules requiring transformation
   */
  async scanModules(): Promise<ModuleStatus[]> {
    console.log('🔍 Scanning modules for completion status...');
    
    const modules: ModuleStatus[] = [];
    await this.scanDirectory(this.rootPath, modules);
    
    return modules;
  }

  private async scanDirectory(dirPath: string, modules: ModuleStatus[]): Promise<void> {
    if (this.shouldSkipDirectory(dirPath)) return;

    try {
      const items = await readdirAsync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = await statAsync(fullPath);
        
        if (stat.isDirectory()) {
          await this.scanDirectory(fullPath, modules);
        } else if (this.isModuleFile(fullPath)) {
          const moduleStatus = await this.analyzeModule(fullPath);
          modules.push(moduleStatus);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dirPath}`);
    }
  }

  private shouldSkipDirectory(dirPath: string): boolean {
    const skipDirs = [
      'node_modules', 'dist', 'build', '.git', 'coverage',
      'reports', 'logs', '.next', '.vscode'
    ];
    
    return skipDirs.some(skip => dirPath.includes(skip));
  }

  private isModuleFile(filePath: string): boolean {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const testPatterns = ['.test.', '.spec.', '.stories.'];
    
    return extensions.some(ext => filePath.endsWith(ext)) &&
           !testPatterns.some(pattern => filePath.includes(pattern));
  }

  /**
   * Analyze a single module for completion status
   */
  private async analyzeModule(filePath: string): Promise<ModuleStatus> {
    const content = await readFileAsync(filePath, 'utf-8');
    const lines = content.split('\n');
    const issues: CompletionIssue[] = [];
    
    // Check each rule against the module
    for (const rule of this.rules) {
      const matches = content.match(rule.pattern);
      if (matches) {
        for (const match of matches) {
          const lineIndex = lines.findIndex(line => line.includes(match));
          issues.push({
            rule: rule.id,
            file: filePath,
            line: lineIndex + 1,
            severity: rule.severity,
            description: rule.description,
            fix: rule.fix
          });
        }
      }
    }

    // Determine module status
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    
    let status: ModuleStatus['status'];
    if (criticalIssues > 0) {
      status = 'needs_transformation';
    } else if (highIssues > 0) {
      status = 'in_progress';
    } else if (issues.length === 0) {
      status = 'complete';
    } else {
      status = 'in_progress';
    }

    const moduleName = path.basename(filePath, path.extname(filePath));
    
    return {
      name: moduleName,
      path: filePath,
      status,
      issues,
      tests: await this.hasTests(filePath),
      docs: this.hasDocumentation(content),
      ui: this.isUIComponent(content),
      compliance: this.hasComplianceFeatures(content),
      lastUpdated: new Date()
    };
  }

  private async hasTests(filePath: string): Promise<boolean> {
    const testFile = filePath.replace(/\.(ts|tsx|js|jsx)$/, '.test.$1');
    const specFile = filePath.replace(/\.(ts|tsx|js|jsx)$/, '.spec.$1');
    
    try {
      await statAsync(testFile);
      return true;
    } catch {
      try {
        await statAsync(specFile);
        return true;
      } catch {
        return false;
      }
    }
  }

  private hasDocumentation(content: string): boolean {
    return /\/\*\*[\s\S]*?\*\/|^[ \t]*\*[ \t]*@\w+/m.test(content);
  }

  private isUIComponent(content: string): boolean {
    return /import.*react|jsx|tsx|component/gi.test(content);
  }

  private hasComplianceFeatures(content: string): boolean {
    const compliancePatterns = [
      /audit|logger|gdpr|cqc|nhs|compliance/gi,
      /encrypt|hash|secure|validate/gi,
      /permission|authorization|authentication/gi
    ];
    
    return compliancePatterns.some(pattern => pattern.test(content));
  }

  /**
   * Generate comprehensive completion report
   */
  async generateCompletionReport(): Promise<CompletionReport> {
    console.log('📊 Generating completion report...');
    
    const modules = await this.scanModules();
    const criticalIssues = modules.reduce((sum, m) => 
      sum + m.issues.filter(i => i.severity === 'critical').length, 0);
    
    const completeModules = modules.filter(m => m.status === 'complete').length;
    const productionReady = modules.filter(m => 
      m.status === 'complete' && m.tests && m.docs && m.compliance).length;
    
    const testCoverage = modules.filter(m => m.tests).length / modules.length * 100;
    const documentationScore = modules.filter(m => m.docs).length / modules.length * 100;
    const complianceScore = modules.filter(m => m.compliance).length / modules.length * 100;

    return {
      totalModules: modules.length,
      completeModules,
      criticalIssues,
      moduleStatuses: modules,
      auditSummary: {
        productionReady,
        complianceScore,
        testCoverage,
        documentationScore
      }
    };
  }

  /**
   * Generate MODULE_CLOSURE_TRACKER.md
   */
  async generateClosureTracker(report: CompletionReport): Promise<void> {
    console.log('📋 Generating MODULE_CLOSURE_TRACKER.md...');
    
    const trackerContent = `# MODULE_CLOSURE_TRACKER.md

## 🎯 Enterprise Completion Status

**Last Updated:** ${new Date().toISOString()}
**Total Modules:** ${report.totalModules}
**Production Ready:** ${report.auditSummary.productionReady}
**Critical Issues:** ${report.criticalIssues}

### 📊 Audit Summary

| Metric | Score | Status |
|--------|-------|--------|
| Production Ready | ${report.auditSummary.productionReady}/${report.totalModules} | ${report.auditSummary.productionReady === report.totalModules ? '✅' : '🔄'} |
| Test Coverage | ${report.auditSummary.testCoverage.toFixed(1)}% | ${report.auditSummary.testCoverage >= 85 ? '✅' : '❌'} |
| Documentation | ${report.auditSummary.documentationScore.toFixed(1)}% | ${report.auditSummary.documentationScore >= 90 ? '✅' : '❌'} |
| Compliance | ${report.auditSummary.complianceScore.toFixed(1)}% | ${report.auditSummary.complianceScore >= 95 ? '✅' : '❌'} |

### 📋 Module Status Details

| Module | Status | Tests | Docs | UI | Compliance | Issues | Path |
|--------|--------|-------|------|----|-----------| -------|------|
${report.moduleStatuses.map(module => {
  const statusIcon = {
    'complete': '✅',
    'in_progress': '🔄',
    'needs_transformation': '❌',
    'failed': '💥'
  }[module.status];
  
  const testsIcon = module.tests ? '✅' : '❌';
  const docsIcon = module.docs ? '✅' : '❌';
  const uiIcon = module.ui ? '✅' : '➖';
  const complianceIcon = module.compliance ? '✅' : '❌';
  const criticalIssueCount = module.issues.filter(i => i.severity === 'critical').length;
  
  return `| ${module.name} | ${statusIcon} ${module.status} | ${testsIcon} | ${docsIcon} | ${uiIcon} | ${complianceIcon} | ${criticalIssueCount} | ${module.path.replace(this.rootPath, '.')} |`;
}).join('\n')}

### 🚨 Critical Issues Requiring Immediate Attention

${report.moduleStatuses
  .filter(m => m.issues.some(i => i.severity === 'critical'))
  .map(module => {
    const criticalIssues = module.issues.filter(i => i.severity === 'critical');
    return `#### ${module.name}\n\n` + 
           criticalIssues.map(issue => 
             `- **${issue.rule}**: ${issue.description}\n  - **Fix**: ${issue.fix}\n  - **Location**: Line ${issue.line}`
           ).join('\n\n');
  }).join('\n\n')}

### 🎯 Completion Roadmap

#### Phase 1: Critical Issues (${report.moduleStatuses.filter(m => m.status === 'needs_transformation').length} modules)
${report.moduleStatuses
  .filter(m => m.status === 'needs_transformation')
  .map(m => `- [ ] **${m.name}** - ${m.issues.filter(i => i.severity === 'critical').length} critical issues`)
  .join('\n')}

#### Phase 2: In Progress (${report.moduleStatuses.filter(m => m.status === 'in_progress').length} modules)
${report.moduleStatuses
  .filter(m => m.status === 'in_progress')
  .map(m => `- [ ] **${m.name}** - ${m.issues.filter(i => i.severity === 'high').length} high priority issues`)
  .join('\n')}

#### Phase 3: Testing & Documentation
${report.moduleStatuses
  .filter(m => !m.tests || !m.docs)
  .map(m => `- [ ] **${m.name}** - ${!m.tests ? 'Add tests' : ''} ${!m.docs ? 'Add documentation' : ''}`)
  .join('\n')}

---
*Generated by WriteCareNotes Completion Agent v1.0*
*🔒 Zero Tolerance for Incomplete Implementation*
`;

    const trackerPath = path.join(this.rootPath, 'MODULE_CLOSURE_TRACKER.md');
    await writeFileAsync(trackerPath, trackerContent);
    console.log(`✅ Generated: ${trackerPath}`);
  }

  /**
   * Auto-fix common issues where possible
   */
  async autoFixIssues(modules: ModuleStatus[]): Promise<number> {
    console.log('🔧 Attempting auto-fixes...');
    
    let fixedCount = 0;
    
    for (const module of modules) {
      if (module.status === 'needs_transformation') {
        // Skip auto-fix for critical modules - manual review required
        continue;
      }
      
      let content = await readFileAsync(module.path, 'utf-8');
      let modified = false;
      
      // Auto-fix: Add basic JSDoc for exported functions
      content = content.replace(
        /^export\s+(function|const)\s+(\w+)/gm,
        '/**\n * TODO: Add proper documentation\n */\nexport $1 $2'
      );
      
      // Auto-fix: Add basic error logging to empty catch blocks
      content = content.replace(
        /catch\s*\([^)]*\)\s*\{\s*\}/g,
        'catch (error) {\n  logger.error(`Error in ${module.name}:`, error);\n  throw error;\n}'
      );
      
      if (content !== await readFileAsync(module.path, 'utf-8')) {
        await writeFileAsync(module.path, content);
        fixedCount++;
        modified = true;
      }
    }
    
    console.log(`✅ Auto-fixed ${fixedCount} modules`);
    return fixedCount;
  }

  /**
   * Run the complete transformation process
   */
  async runCompletionProcess(): Promise<void> {
    console.log('🚀 Starting WriteCareNotes Completion Agent...\n');
    
    try {
      // Generate initial report
      const report = await this.generateCompletionReport();
      
      console.log(`📊 Initial Status:
📦 Total Modules: ${report.totalModules}
✅ Complete: ${report.completeModules}
🚨 Critical Issues: ${report.criticalIssues}
📈 Test Coverage: ${report.auditSummary.testCoverage.toFixed(1)}%
📚 Documentation: ${report.auditSummary.documentationScore.toFixed(1)}%
🔒 Compliance: ${report.auditSummary.complianceScore.toFixed(1)}%\n`);

      // Generate closure tracker
      await this.generateClosureTracker(report);
      
      // Attempt auto-fixes
      const fixedCount = await this.autoFixIssues(report.moduleStatuses);
      
      // Generate final report if fixes were applied
      if (fixedCount > 0) {
        console.log('\n🔄 Regenerating report after auto-fixes...');
        const finalReport = await this.generateCompletionReport();
        await this.generateClosureTracker(finalReport);
      }
      
      console.log('\n🎯 Completion Agent finished successfully!');
      console.log('📋 Check MODULE_CLOSURE_TRACKER.md for detailed status');
      
      if (report.criticalIssues > 0) {
        console.log(`\n⚠️  ${report.criticalIssues} critical issues require manual attention`);
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Completion Agent failed:', error);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const agent = new WriteCareNotesCompletionAgent();
  await agent.runCompletionProcess();
}

if (require.main === module) {
  main().catch(console.error);
}

export { WriteCareNotesCompletionAgent };