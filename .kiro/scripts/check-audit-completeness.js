#!/usr/bin/env node

/**
 * @fileoverview Audit Trail Completeness Checker for WriteCareNotes
 * @module AuditCompletenessChecker
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Validates that all healthcare operations include complete
 * audit trails as required by CQC, Care Inspectorate, CIW, and RQIA standards.
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 */

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');

class AuditCompletenessChecker {
  constructor() {
    this.requiredAuditFields = [
      'userId',
      'timestamp',
      'action',
      'resourceType',
      'resourceId',
      'correlationId'
    ];

    this.healthcareSpecificFields = [
      'clinicalJustification',
      'gdprLawfulBasis',
      'complianceFlags'
    ];

    this.criticalOperations = [
      'MEDICATION_ADMINISTERED',
      'MEDICATION_PRESCRIBED',
      'CARE_PLAN_UPDATED',
      'RESIDENT_ADMITTED',
      'RESIDENT_DISCHARGED',
      'RISK_ASSESSMENT_COMPLETED',
      'INCIDENT_REPORTED',
      'PERSONAL_DATA_ACCESSED',
      'FINANCIAL_TRANSACTION'
    ];

    this.issues = [];
  }

  async checkAuditCompleteness() {
    console.log('🔍 Checking audit trail completeness...\n');

    try {
      // Find all TypeScript files
      const files = await this.findSourceFiles();
      
      // Check each file for audit compliance
      for (const file of files) {
        await this.checkFileAuditCompliance(file);
      }

      // Generate report
      await this.generateReport();

      if (this.issues.length > 0) {
        console.log(`❌ Found ${this.issues.length} audit compliance issues`);
        process.exit(1);
      } else {
        console.log('✅ All audit trail requirements satisfied');
        process.exit(0);
      }

    } catch (error) {
      console.error('❌ Audit check failed:', error.message);
      process.exit(1);
    }
  }

  async findSourceFiles() {
    return new Promise((resolve, reject) => {
      glob('src/**/*.ts', { ignore: ['**/*.test.ts', '**/*.spec.ts'] }, (err, files) => {
        if (err) reject(err);
        else resolve(files);
      });
    });
  }

  async checkFileAuditCompliance(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    
    // Check for healthcare operations
    const healthcareOperations = this.findHealthcareOperations(content, filePath);
    
    for (const operation of healthcareOperations) {
      await this.validateOperationAuditTrail(operation, content, filePath);
    }
  }

  findHealthcareOperations(content, filePath) {
    const operations = [];
    
    // Look for critical healthcare operations
    for (const operation of this.criticalOperations) {
      const regex = new RegExp(`(${operation}|${operation.toLowerCase()})`, 'g');
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        operations.push({
          type: operation,
          line: this.getLineNumber(content, match.index),
          column: match.index,
          filePath
        });
      }
    }

    // Look for medication-related functions
    const medicationRegex = /(administer|prescribe|dispense).*medication/gi;
    let match;
    while ((match = medicationRegex.exec(content)) !== null) {
      operations.push({
        type: 'MEDICATION_OPERATION',
        line: this.getLineNumber(content, match.index),
        column: match.index,
        filePath
      });
    }

    // Look for resident data operations
    const residentDataRegex = /(create|update|delete).*resident/gi;
    while ((match = residentDataRegex.exec(content)) !== null) {
      operations.push({
        type: 'RESIDENT_DATA_OPERATION',
        line: this.getLineNumber(content, match.index),
        column: match.index,
        filePath
      });
    }

    return operations;
  }

  async validateOperationAuditTrail(operation, content, filePath) {
    const functionContext = this.extractFunctionContext(content, operation.line);
    
    // Check for audit logging
    const hasAuditLogging = this.checkAuditLogging(functionContext);
    
    if (!hasAuditLogging.present) {
      this.issues.push({
        type: 'MISSING_AUDIT_LOGGING',
        severity: 'HIGH',
        operation: operation.type,
        file: filePath,
        line: operation.line,
        message: 'Healthcare operation missing audit trail logging',
        suggestion: 'Add audit logging using auditLogger.log() with required fields'
      });
      return;
    }

    // Check for required fields
    const missingFields = this.checkRequiredAuditFields(functionContext);
    
    if (missingFields.length > 0) {
      this.issues.push({
        type: 'INCOMPLETE_AUDIT_FIELDS',
        severity: 'MEDIUM',
        operation: operation.type,
        file: filePath,
        line: operation.line,
        message: `Audit logging missing required fields: ${missingFields.join(', ')}`,
        suggestion: 'Add missing audit fields to comply with healthcare standards'
      });
    }

    // Check for healthcare-specific fields
    const missingHealthcareFields = this.checkHealthcareSpecificFields(functionContext, operation.type);
    
    if (missingHealthcareFields.length > 0) {
      this.issues.push({
        type: 'MISSING_HEALTHCARE_AUDIT_FIELDS',
        severity: 'HIGH',
        operation: operation.type,
        file: filePath,
        line: operation.line,
        message: `Healthcare operation missing specific audit fields: ${missingHealthcareFields.join(', ')}`,
        suggestion: 'Add healthcare-specific audit fields for regulatory compliance'
      });
    }

    // Check for GDPR compliance
    if (this.isPersonalDataOperation(operation.type)) {
      const hasGDPRCompliance = this.checkGDPRCompliance(functionContext);
      
      if (!hasGDPRCompliance) {
        this.issues.push({
          type: 'MISSING_GDPR_COMPLIANCE',
          severity: 'CRITICAL',
          operation: operation.type,
          file: filePath,
          line: operation.line,
          message: 'Personal data operation missing GDPR compliance audit fields',
          suggestion: 'Add gdprLawfulBasis and consentCheck to audit logging'
        });
      }
    }
  }

  extractFunctionContext(content, lineNumber) {
    const lines = content.split('\n');
    const startLine = Math.max(0, lineNumber - 20);
    const endLine = Math.min(lines.length, lineNumber + 20);
    
    return lines.slice(startLine, endLine).join('\n');
  }

  checkAuditLogging(context) {
    const auditPatterns = [
      /auditLogger\.log/,
      /audit\.log/,
      /logAuditEvent/,
      /recordAuditTrail/
    ];

    for (const pattern of auditPatterns) {
      if (pattern.test(context)) {
        return { present: true, pattern: pattern.source };
      }
    }

    return { present: false };
  }

  checkRequiredAuditFields(context) {
    const missingFields = [];

    for (const field of this.requiredAuditFields) {
      const fieldPattern = new RegExp(`['"\`]${field}['"\`]|${field}:`);
      if (!fieldPattern.test(context)) {
        missingFields.push(field);
      }
    }

    return missingFields;
  }

  checkHealthcareSpecificFields(context, operationType) {
    const missingFields = [];

    // Clinical justification required for all healthcare operations
    if (!context.includes('clinicalJustification')) {
      missingFields.push('clinicalJustification');
    }

    // Medication operations need additional fields
    if (operationType.includes('MEDICATION')) {
      const medicationFields = ['medicationId', 'dosage', 'route', 'safetyChecksCompleted'];
      
      for (const field of medicationFields) {
        if (!context.includes(field)) {
          missingFields.push(field);
        }
      }
    }

    return missingFields;
  }

  checkGDPRCompliance(context) {
    const gdprFields = ['gdprLawfulBasis', 'consentCheck', 'dataMinimization'];
    
    return gdprFields.some(field => context.includes(field));
  }

  isPersonalDataOperation(operationType) {
    const personalDataOperations = [
      'RESIDENT_ADMITTED',
      'RESIDENT_DISCHARGED',
      'PERSONAL_DATA_ACCESSED',
      'CARE_PLAN_UPDATED',
      'RESIDENT_DATA_OPERATION'
    ];

    return personalDataOperations.includes(operationType);
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  async generateReport() {
    if (this.issues.length === 0) {
      console.log('✅ Audit Trail Compliance Report');
      console.log('================================');
      console.log('All healthcare operations include complete audit trails.');
      console.log('No compliance issues found.\n');
      return;
    }

    console.log('❌ Audit Trail Compliance Report');
    console.log('=================================\n');

    // Group issues by severity
    const critical = this.issues.filter(i => i.severity === 'CRITICAL');
    const high = this.issues.filter(i => i.severity === 'HIGH');
    const medium = this.issues.filter(i => i.severity === 'MEDIUM');

    if (critical.length > 0) {
      console.log('🚨 CRITICAL Issues:');
      critical.forEach(issue => this.printIssue(issue));
      console.log();
    }

    if (high.length > 0) {
      console.log('⚠️  HIGH Priority Issues:');
      high.forEach(issue => this.printIssue(issue));
      console.log();
    }

    if (medium.length > 0) {
      console.log('📋 MEDIUM Priority Issues:');
      medium.forEach(issue => this.printIssue(issue));
      console.log();
    }

    console.log('📊 Summary:');
    console.log(`Total Issues: ${this.issues.length}`);
    console.log(`Critical: ${critical.length}`);
    console.log(`High: ${high.length}`);
    console.log(`Medium: ${medium.length}\n`);

    // Generate fix suggestions
    console.log('💡 Fix Suggestions:');
    console.log('==================');
    
    const uniqueSuggestions = [...new Set(this.issues.map(i => i.suggestion))];
    uniqueSuggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion}`);
    });

    console.log('\n📋 Compliance Requirements:');
    console.log('===========================');
    console.log('All healthcare operations must include:');
    console.log('• Complete audit trail with userId, timestamp, action');
    console.log('• Clinical justification for healthcare decisions');
    console.log('• GDPR lawful basis for personal data processing');
    console.log('• Correlation ID for request tracking');
    console.log('• Compliance flags for regulatory requirements\n');

    // Save detailed report
    await this.saveDetailedReport();
  }

  printIssue(issue) {
    console.log(`  📁 ${issue.file}:${issue.line}`);
    console.log(`     Operation: ${issue.operation}`);
    console.log(`     Issue: ${issue.message}`);
    console.log(`     Fix: ${issue.suggestion}\n`);
  }

  async saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalIssues: this.issues.length,
      issuesBySeverity: {
        critical: this.issues.filter(i => i.severity === 'CRITICAL').length,
        high: this.issues.filter(i => i.severity === 'HIGH').length,
        medium: this.issues.filter(i => i.severity === 'MEDIUM').length
      },
      issues: this.issues,
      complianceStatus: this.issues.length === 0 ? 'COMPLIANT' : 'NON_COMPLIANT',
      recommendations: this.generateRecommendations()
    };

    // Ensure reports directory exists
    await fs.mkdir('reports', { recursive: true });
    
    await fs.writeFile(
      'reports/audit-compliance-report.json',
      JSON.stringify(report, null, 2)
    );

    console.log('📄 Detailed report saved to: reports/audit-compliance-report.json');
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.issues.some(i => i.type === 'MISSING_AUDIT_LOGGING')) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Implement audit logging for all healthcare operations',
        implementation: 'Use auditLogger.log() with required fields in all healthcare functions'
      });
    }

    if (this.issues.some(i => i.type === 'MISSING_GDPR_COMPLIANCE')) {
      recommendations.push({
        priority: 'CRITICAL',
        action: 'Add GDPR compliance to personal data operations',
        implementation: 'Include gdprLawfulBasis and consent checking in audit logs'
      });
    }

    if (this.issues.some(i => i.type === 'INCOMPLETE_AUDIT_FIELDS')) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Complete audit field requirements',
        implementation: 'Ensure all audit logs include userId, timestamp, action, resourceId, correlationId'
      });
    }

    return recommendations;
  }
}

// Run audit check if called directly
if (require.main === module) {
  const checker = new AuditCompletenessChecker();
  checker.checkAuditCompleteness().catch(console.error);
}

module.exports = AuditCompletenessChecker;