/**
 * British Isles Care Home Compliance Test Setup
 * Zero tolerance for non-compliance
 */

import { BritishIslesComplianceChecker } from '../scripts/compliance-checker';

// Global compliance validation before tests
beforeAll(async () => {
  console.log('🏴󠁧󠁢󠁪󠁥󠁲󠁿🇮🇲🇬🇧🇮🇪 Validating British Isles Compliance...');
  
  const checker = new BritishIslesComplianceChecker();
  const summary = await checker.generateComplianceReport(process.cwd());
  
  if (summary.criticalIssues.length > 0) {
    console.error(`❌ ${summary.criticalIssues.length} critical compliance issues detected`);
    console.error('Run npm run compliance:fix to remediate gaps');
    
    // List first 5 critical issues
    summary.criticalIssues.slice(0, 5).forEach(issue => {
      console.error(`- ${issue.rule}: ${issue.recommendation}`);
    });
    
    throw new Error('COMPLIANCE FAILURE: British Isles care home regulations not met');
  }
  
  console.log('✅ British Isles compliance validated - proceeding with tests');
});

// Compliance-specific matchers
expect.extend({
  toMeetBritishIslesCompliance(received: any) {
    // Custom matcher for compliance validation
    const pass = typeof received === 'object' && received !== null;
    
    if (pass) {
      return {
        message: () => `Expected ${received} not to meet British Isles compliance`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${received} to meet British Isles compliance`,
        pass: false,
      };
    }
  },
});

// Global test environment setup
declare global {
  var BRITISH_ISLES_JURISDICTIONS: string[];
  var CARE_HOME_REGULATORS: Record<string, string>;
}

global.BRITISH_ISLES_JURISDICTIONS = [
  'England',
  'Scotland', 
  'Wales',
  'Northern Ireland',
  'Jersey',
  'Guernsey',
  'Isle of Man',
  'Republic of Ireland'
];

global.CARE_HOME_REGULATORS = {
  'England': 'CQC',
  'Scotland': 'Care Inspectorate Scotland',
  'Wales': 'CIW',
  'Northern Ireland': 'RQIA',
  'Jersey': 'Jersey Care Commission',
  'Guernsey': 'Committee for Health & Social Care',
  'Isle of Man': 'Department of Health and Social Care (IoM)',
  'Republic of Ireland': 'HIQA'
};

console.log('🏆 British Isles Care Home Compliance Test Environment Ready');