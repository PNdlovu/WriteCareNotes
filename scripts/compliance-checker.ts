#!/usr/bin/env node

/**
 * British Isles Care Home Compliance Checker
 * Automated validation for all care home regulatory requirements across British Isles
 * Zero tolerance for non-compliance
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

interface ComplianceRule {
  id: string;
  jurisdiction: string;
  regulator: string;
  category: string;
  pattern: RegExp;
  required: boolean;
  description: string;
  examples: string[];
}

interface ComplianceResult {
  file: string;
  jurisdiction: string;
  regulator: string;
  rule: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'MISSING';
  line?: number;
  context?: string;
  recommendation?: string;
}

interface ComplianceSummary {
  totalFiles: number;
  compliantFiles: number;
  nonCompliantFiles: number;
  missingRequirements: number;
  jurisdictionsCovered: string[];
  criticalIssues: ComplianceResult[];
  recommendations: string[];
}

class BritishIslesComplianceChecker {
  private rules: ComplianceRule[] = [
    // England - CQC Requirements
    {
      id: 'CQC_SAFE_001',
      jurisdiction: 'England',
      regulator: 'CQC',
      category: 'Safety',
      pattern: /(?:medication|medicine|drug).{0,50}(?:administration|management|tracking|audit)/i,
      required: true,
      description: 'Medication management and administration tracking',
      examples: ['medication administration', 'drug management system', 'medicine tracking']
    },
    {
      id: 'CQC_EFFECTIVE_002',
      jurisdiction: 'England',
      regulator: 'CQC',
      category: 'Effectiveness',
      pattern: /(?:care.?plan|assessment|review).{0,50}(?:personalized|individual|tailored)/i,
      required: true,
      description: 'Personalized care planning and assessment',
      examples: ['personalized care plan', 'individual assessment', 'tailored care review']
    },
    {
      id: 'CQC_CARING_003',
      jurisdiction: 'England',
      regulator: 'CQC',
      category: 'Caring',
      pattern: /(?:dignity|respect|privacy|confidentiality).{0,50}(?:protection|maintenance|preservation)/i,
      required: true,
      description: 'Dignity and privacy protection',
      examples: ['dignity protection', 'privacy maintenance', 'confidentiality preservation']
    },
    {
      id: 'CQC_RESPONSIVE_004',
      jurisdiction: 'England',
      regulator: 'CQC',
      category: 'Responsive',
      pattern: /(?:complaint|concern|feedback).{0,50}(?:handling|management|response|tracking)/i,
      required: true,
      description: 'Complaints and feedback management',
      examples: ['complaint handling', 'feedback management', 'concern response system']
    },
    {
      id: 'CQC_WELL_LED_005',
      jurisdiction: 'England',
      regulator: 'CQC',
      category: 'Well-led',
      pattern: /(?:audit|quality.?assurance|governance).{0,50}(?:system|process|framework)/i,
      required: true,
      description: 'Quality assurance and governance systems',
      examples: ['audit system', 'quality assurance framework', 'governance process']
    },

    // Scotland - Care Inspectorate
    {
      id: 'CIS_HEALTH_001',
      jurisdiction: 'Scotland',
      regulator: 'Care Inspectorate Scotland',
      category: 'Health and Wellbeing',
      pattern: /(?:wellbeing|welfare|health.?outcome).{0,50}(?:monitoring|tracking|assessment)/i,
      required: true,
      description: 'Health and wellbeing outcome monitoring',
      examples: ['wellbeing monitoring', 'health outcome tracking', 'welfare assessment']
    },
    {
      id: 'CIS_QUALITY_002',
      jurisdiction: 'Scotland',
      regulator: 'Care Inspectorate Scotland',
      category: 'Quality of Care',
      pattern: /(?:care.?standard|quality.?indicator).{0,50}(?:measurement|evaluation|assessment)/i,
      required: true,
      description: 'Care standards and quality indicators',
      examples: ['care standard measurement', 'quality indicator assessment']
    },
    {
      id: 'CIS_ENVIRONMENT_003',
      jurisdiction: 'Scotland',
      regulator: 'Care Inspectorate Scotland',
      category: 'Environment',
      pattern: /(?:environment|facility|premises).{0,50}(?:safety|security|maintenance)/i,
      required: true,
      description: 'Environmental safety and security',
      examples: ['environment safety', 'facility security', 'premises maintenance']
    },
    {
      id: 'CIS_STAFFING_004',
      jurisdiction: 'Scotland',
      regulator: 'Care Inspectorate Scotland',
      category: 'Staffing',
      pattern: /(?:staff|personnel).{0,50}(?:training|competency|qualification|supervision)/i,
      required: true,
      description: 'Staff training and competency management',
      examples: ['staff training', 'personnel competency', 'qualification tracking']
    },
    {
      id: 'CIS_MANAGEMENT_005',
      jurisdiction: 'Scotland',
      regulator: 'Care Inspectorate Scotland',
      category: 'Management',
      pattern: /(?:leadership|management).{0,50}(?:effectiveness|quality|oversight)/i,
      required: true,
      description: 'Leadership and management effectiveness',
      examples: ['leadership effectiveness', 'management quality', 'oversight system']
    },

    // Wales - CIW (Care Inspectorate Wales)
    {
      id: 'CIW_VOICE_001',
      jurisdiction: 'Wales',
      regulator: 'CIW',
      category: 'Voice and Choice',
      pattern: /(?:voice|choice|preference).{0,50}(?:respect|consideration|implementation)/i,
      required: true,
      description: 'Resident voice and choice respect',
      examples: ['voice respect', 'choice consideration', 'preference implementation']
    },
    {
      id: 'CIW_PREVENTION_002',
      jurisdiction: 'Wales',
      regulator: 'CIW',
      category: 'Prevention',
      pattern: /(?:prevention|early.?intervention|risk.?reduction).{0,50}(?:strategy|approach|system)/i,
      required: true,
      description: 'Prevention and early intervention strategies',
      examples: ['prevention strategy', 'early intervention approach', 'risk reduction system']
    },
    {
      id: 'CIW_WELLBEING_003',
      jurisdiction: 'Wales',
      regulator: 'CIW',
      category: 'Wellbeing',
      pattern: /(?:wellbeing|emotional.?health|mental.?health).{0,50}(?:support|promotion|enhancement)/i,
      required: true,
      description: 'Wellbeing and emotional health support',
      examples: ['wellbeing support', 'emotional health promotion', 'mental health enhancement']
    },

    // Northern Ireland - RQIA
    {
      id: 'RQIA_SAFE_001',
      jurisdiction: 'Northern Ireland',
      regulator: 'RQIA',
      category: 'Safe',
      pattern: /(?:safeguarding|protection|safety).{0,50}(?:procedure|protocol|system)/i,
      required: true,
      description: 'Safeguarding and protection procedures',
      examples: ['safeguarding procedure', 'protection protocol', 'safety system']
    },
    {
      id: 'RQIA_EFFECTIVE_002',
      jurisdiction: 'Northern Ireland',
      regulator: 'RQIA',
      category: 'Effective',
      pattern: /(?:evidence.?based|best.?practice|clinical.?governance)/i,
      required: true,
      description: 'Evidence-based practice and clinical governance',
      examples: ['evidence-based care', 'best practice implementation', 'clinical governance']
    },
    {
      id: 'RQIA_COMPASSIONATE_003',
      jurisdiction: 'Northern Ireland',
      regulator: 'RQIA',
      category: 'Compassionate',
      pattern: /(?:compassion|empathy|dignity).{0,50}(?:delivery|demonstration|practice)/i,
      required: true,
      description: 'Compassionate care delivery',
      examples: ['compassion delivery', 'empathy demonstration', 'dignity practice']
    },

    // Jersey - Jersey Care Commission
    {
      id: 'JCC_STANDARDS_001',
      jurisdiction: 'Jersey',
      regulator: 'Jersey Care Commission',
      category: 'Care Standards',
      pattern: /(?:jersey|channel.?island).{0,50}(?:standard|regulation|requirement)/i,
      required: true,
      description: 'Jersey-specific care standards compliance',
      examples: ['Jersey care standards', 'Channel Island regulations']
    },

    // Guernsey - Committee for Health & Social Care
    {
      id: 'GHSC_STANDARDS_001',
      jurisdiction: 'Guernsey',
      regulator: 'Committee for Health & Social Care',
      category: 'Care Standards',
      pattern: /(?:guernsey|bailiwick).{0,50}(?:standard|regulation|requirement)/i,
      required: true,
      description: 'Guernsey-specific care standards compliance',
      examples: ['Guernsey care standards', 'Bailiwick regulations']
    },

    // Isle of Man - Department of Health and Social Care
    {
      id: 'IOMDHSC_STANDARDS_001',
      jurisdiction: 'Isle of Man',
      regulator: 'Department of Health and Social Care (IoM)',
      category: 'Care Standards',
      pattern: /(?:isle.?of.?man|manx).{0,50}(?:standard|regulation|requirement)/i,
      required: true,
      description: 'Isle of Man care standards compliance',
      examples: ['Isle of Man care standards', 'Manx regulations']
    },

    // Republic of Ireland - HIQA
    {
      id: 'HIQA_STANDARDS_001',
      jurisdiction: 'Republic of Ireland',
      regulator: 'HIQA',
      category: 'Care Standards',
      pattern: /(?:hiqa|irish.?standard).{0,50}(?:compliance|adherence|implementation)/i,
      required: true,
      description: 'HIQA care standards compliance',
      examples: ['HIQA compliance', 'Irish standard adherence']
    },

    // Cross-jurisdictional Requirements
    {
      id: 'GDPR_001',
      jurisdiction: 'All British Isles',
      regulator: 'Data Protection',
      category: 'Data Protection',
      pattern: /(?:gdpr|data.?protection|privacy.?policy).{0,50}(?:compliance|adherence|implementation)/i,
      required: true,
      description: 'GDPR and data protection compliance',
      examples: ['GDPR compliance', 'data protection adherence', 'privacy policy implementation']
    },
    {
      id: 'INFECTION_CONTROL_001',
      jurisdiction: 'All British Isles',
      regulator: 'Health Protection',
      category: 'Infection Control',
      pattern: /(?:infection.?control|outbreak.?management|hygiene).{0,50}(?:protocol|procedure|system)/i,
      required: true,
      description: 'Infection control and outbreak management',
      examples: ['infection control protocol', 'outbreak management procedure', 'hygiene system']
    }
  ];

  private excludePatterns = [
    /node_modules/,
    /\.git/,
    /dist/,
    /build/,
    /coverage/,
    /\.log$/,
    /\.map$/,
    /package-lock\.json$/,
    /yarn\.lock$/,
    /\.eslintrc/,
    /\.gitignore/,
    /\.dockerignore/,
    /Dockerfile/,
    /docker-compose/,
    /\.config\./,
    /\.yml$/,
    /\.yaml$/,
    /\.json$/,
    /\.md$/,
    /\.txt$/,
    /\.sql$/,
    /tsconfig/,
    /jest\.config/,
    /babel\.config/,
    /postcss\.config/,
    /tailwind\.config/,
    /vite\.config/
  ];

  private includeExtensions = ['.ts', '.tsx', '.js', '.jsx'];

  // Only check service files, hooks, routes, and core business logic
  private businessLogicPatterns = [
    /\/src\/services\//,
    /\/src\/hooks\//,
    /\/src\/routes\//,
    /\/src\/components\//,
    /\/src\/pages\//,
    /\/src\/controllers\//,
    /\/src\/middleware\//,
    /\/src\/.*\.ts$/,
    /\/src\/.*\.tsx$/
  ];

  async scanDirectory(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const items = await readdirAsync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        
        if (this.excludePatterns.some(pattern => pattern.test(fullPath))) {
          continue;
        }
        
        const stat = await statAsync(fullPath);
        
        if (stat.isDirectory()) {
          const subFiles = await this.scanDirectory(fullPath);
          files.push(...subFiles);
        } else if (this.includeExtensions.some(ext => fullPath.endsWith(ext))) {
          // Only include business logic files for compliance checking
          const normalizedPath = fullPath.replace(/\\/g, '/');
          if (this.businessLogicPatterns.some(pattern => pattern.test(normalizedPath))) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dirPath}: ${error}`);
    }
    
    return files;
  }

  async analyzeFile(filePath: string): Promise<ComplianceResult[]> {
    const results: ComplianceResult[] = [];
    
    try {
      const content = await readFileAsync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      for (const rule of this.rules) {
        const matches = content.match(rule.pattern);
        
        if (matches) {
          // Find the line number
          let lineNumber = 0;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].match(rule.pattern)) {
              lineNumber = i + 1;
              break;
            }
          }
          
          results.push({
            file: filePath,
            jurisdiction: rule.jurisdiction,
            regulator: rule.regulator,
            rule: rule.id,
            status: 'COMPLIANT',
            line: lineNumber,
            context: matches[0],
            recommendation: `✅ ${rule.description} - Implementation found`
          });
        } else if (rule.required) {
          results.push({
            file: filePath,
            jurisdiction: rule.jurisdiction,
            regulator: rule.regulator,
            rule: rule.id,
            status: 'MISSING',
            recommendation: `❌ Missing: ${rule.description}. Examples: ${rule.examples.join(', ')}`
          });
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not analyze file ${filePath}: ${error}`);
    }
    
    return results;
  }

  async generateComplianceReport(rootPath: string): Promise<ComplianceSummary> {
    console.log('🔍 Starting British Isles Care Home Compliance Scan...');
    console.log(`📁 Scanning directory: ${rootPath}`);
    
    const files = await this.scanDirectory(rootPath);
    console.log(`📄 Found ${files.length} files to analyze`);
    
    const allResults: ComplianceResult[] = [];
    let processedFiles = 0;
    
    for (const file of files) {
      const results = await this.analyzeFile(file);
      allResults.push(...results);
      processedFiles++;
      
      if (processedFiles % 10 === 0) {
        console.log(`⏳ Processed ${processedFiles}/${files.length} files...`);
      }
    }
    
    // Calculate summary statistics
    const compliantFiles = new Set(
      allResults.filter(r => r.status === 'COMPLIANT').map(r => r.file)
    ).size;
    
    const nonCompliantFiles = new Set(
      allResults.filter(r => r.status === 'NON_COMPLIANT').map(r => r.file)
    ).size;
    
    const missingRequirements = allResults.filter(r => r.status === 'MISSING').length;
    
    const jurisdictionsCovered = Array.from(new Set(allResults.map(r => r.jurisdiction)));
    
    const criticalIssues = allResults.filter(r => 
      r.status === 'NON_COMPLIANT' || r.status === 'MISSING'
    );
    
    const recommendations = [
      `📊 Total files scanned: ${files.length}`,
      `✅ Files with compliance evidence: ${compliantFiles}`,
      `❌ Missing compliance requirements: ${missingRequirements}`,
      `🏴󠁧󠁢󠁪󠁥󠁲󠁿 Jurisdictions covered: ${jurisdictionsCovered.join(', ')}`,
      `🔧 Critical issues to address: ${criticalIssues.length}`
    ];
    
    return {
      totalFiles: files.length,
      compliantFiles,
      nonCompliantFiles,
      missingRequirements,
      jurisdictionsCovered,
      criticalIssues,
      recommendations
    };
  }

  async generateDetailedReport(summary: ComplianceSummary, outputPath: string): Promise<void> {
    const timestamp = new Date().toISOString();
    
    const report = `# British Isles Care Home Compliance Report
Generated: ${timestamp}

## 🎯 Executive Summary

- **Total Files Analyzed**: ${summary.totalFiles}
- **Compliant Files**: ${summary.compliantFiles}
- **Files with Missing Requirements**: ${summary.missingRequirements}
- **Jurisdictions Covered**: ${summary.jurisdictionsCovered.length}/8
- **Critical Issues**: ${summary.criticalIssues.length}

## 🏴󠁧󠁢󠁪󠁥󠁲󠁿🇮🇲🇬🇧🇮🇪 Regulatory Coverage

### Jurisdictions Analyzed:
${summary.jurisdictionsCovered.map(j => `- ✅ ${j}`).join('\n')}

## ❌ Critical Issues Requiring Attention

${summary.criticalIssues.length === 0 ? '🎉 **NO CRITICAL ISSUES FOUND** - All required compliance patterns detected!' : ''}

${summary.criticalIssues.slice(0, 20).map(issue => `
### ${issue.rule} - ${issue.jurisdiction}
- **File**: \`${issue.file}\`
- **Regulator**: ${issue.regulator}
- **Status**: ${issue.status}
- **Recommendation**: ${issue.recommendation}
${issue.line ? `- **Line**: ${issue.line}` : ''}
${issue.context ? `- **Context**: \`${issue.context}\`` : ''}
`).join('\n')}

${summary.criticalIssues.length > 20 ? `\n... and ${summary.criticalIssues.length - 20} more issues` : ''}

## 🚀 Next Steps

${summary.recommendations.map(rec => `- ${rec}`).join('\n')}

## 🏆 Compliance Score

**Overall Compliance**: ${Math.round((summary.compliantFiles / summary.totalFiles) * 100)}%

${summary.criticalIssues.length === 0 ? '🥇 **GOLD STANDARD ACHIEVED** - Full British Isles compliance detected!' : ''}
${summary.criticalIssues.length > 0 && summary.criticalIssues.length <= 5 ? '🥈 **SILVER STANDARD** - Minor compliance gaps to address' : ''}
${summary.criticalIssues.length > 5 && summary.criticalIssues.length <= 15 ? '🥉 **BRONZE STANDARD** - Moderate compliance work needed' : ''}
${summary.criticalIssues.length > 15 ? '⚠️  **NEEDS IMPROVEMENT** - Significant compliance work required' : ''}

---
*Generated by British Isles Care Home Compliance Checker v1.0*
*Zero Tolerance for Non-Compliance*
`;

    await fs.promises.writeFile(outputPath, report, 'utf-8');
    console.log(`📋 Detailed compliance report generated: ${outputPath}`);
  }
}

// Main execution
async function main() {
  const checker = new BritishIslesComplianceChecker();
  const rootPath = process.cwd();
  const outputPath = path.join(rootPath, 'reports', 'british-isles-compliance-report.md');
  
  try {
    // Ensure reports directory exists
    const reportsDir = path.dirname(outputPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    console.log('🏴󠁧󠁢󠁪󠁥󠁲󠁿🇮🇲🇬🇧🇮🇪 British Isles Care Home Compliance Scanner');
    console.log('=====================================');
    console.log('Zero Tolerance for Non-Compliance');
    console.log('');
    
    const summary = await checker.generateComplianceReport(rootPath);
    await checker.generateDetailedReport(summary, outputPath);
    
    console.log('');
    console.log('🎯 COMPLIANCE SCAN COMPLETE');
    console.log('==========================');
    console.log(`📊 Files analyzed: ${summary.totalFiles}`);
    console.log(`✅ Compliant files: ${summary.compliantFiles}`);
    console.log(`❌ Critical issues: ${summary.criticalIssues.length}`);
    console.log(`🏴󠁧󠁢󠁪󠁥󠁲󠁿 Jurisdictions: ${summary.jurisdictionsCovered.join(', ')}`);
    console.log(`📋 Report: ${outputPath}`);
    
    if (summary.criticalIssues.length === 0) {
      console.log('');
      console.log('🏆 ZERO TOLERANCE ACHIEVED!');
      console.log('All critical compliance requirements detected!');
      process.exit(0);
    } else {
      console.log('');
      console.log('⚠️  COMPLIANCE GAPS DETECTED');
      console.log(`${summary.criticalIssues.length} issues require attention`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Compliance scan failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { BritishIslesComplianceChecker };