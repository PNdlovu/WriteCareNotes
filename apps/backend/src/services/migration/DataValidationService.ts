/**
 * @fileoverview Advanced data validation and quality assessment service
 * @module Migration/DataValidationService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Advanced data validation and quality assessment service
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Data Validation Service
 * @module DataValidationService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-03
 * 
 * @description Advanced data validation and quality assessment service
 * for healthcare migration with clinical safety validation and regulatory compliance.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface ValidationRule {
  ruleId: string;
  fieldName: string;
  ruleType: 'required' | 'format' | 'range' | 'custom' | 'clinical' | 'regulatory';
  description: string;
  validationFunction: (value: any, record?: any) => ValidationResult;
  severity: 'info' | 'warning' | 'error' | 'critical';
  autoFixable: boolean;
  clinicalSafety: boolean;
  regulatoryRequirement: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  suggestion?: string;
  fixedValue?: any;
  confidence?: number;
}

export interface DataQualityReport {
  reportId: string;
  generatedAt: Date;
  datasetInfo: {
    recordCount: number;
    fieldCount: number;
    dataSource: string;
    dataFormat: string;
  };
  overallScore: number;
  qualityMetrics: {
    completeness: QualityMetric;
    accuracy: QualityMetric;
    consistency: QualityMetric;
    validity: QualityMetric;
    uniqueness: QualityMetric;
    timeliness: QualityMetric;
  };
  fieldAnalysis: FieldQualityAnalysis[];
  validationResults: {
    passed: number;
    warnings: number;
    errors: number;
    critical: number;
  };
  recommendations: QualityRecommendation[];
  clinicalSafetyIssues: ClinicalSafetyIssue[];
  regulatoryComplianceStatus: RegulatoryComplianceStatus;
}

export interface QualityMetric {
  score: number; // 0-100
  description: string;
  issues: string[];
  recommendations: string[];
}

export interface FieldQualityAnalysis {
  fieldName: string;
  dataType: string;
  completeness: number;
  uniqueness: number;
  validity: number;
  patterns: string[];
  anomalies: string[];
  clinicalRelevance: 'high' | 'medium' | 'low';
  regulatoryImportance: 'critical' | 'important' | 'optional';
}

export interface QualityRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'data_quality' | 'clinical_safety' | 'regulatory' | 'performance';
  title: string;
  description: string;
  actionRequired: boolean;
  estimatedEffort: 'low' | 'medium' | 'high';
  impact: string;
}

export interface ClinicalSafetyIssue {
  issueId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'medication' | 'allergy' | 'demographics' | 'care_planning';
  description: string;
  affectedRecords: number;
  potentialRisks: string[];
  recommendedActions: string[];
  requiresClinicalReview: boolean;
}

export interface RegulatoryComplianceStatus {
  overallCompliance: number; // 0-100
  cqcCompliance: number;
  gdprCompliance: number;
  professionalStandardsCompliance: number;
  dataProtectionCompliance: number;
  issues: Array<{
    regulation: string;
    issue: string;
    severity: 'minor' | 'major' | 'critical';
    remediation: string;
  }>;
}

export class DataValidationService extends EventEmitter {
  privatevalidationRules: Map<string, ValidationRule[]> = new Map();
  privateclinicalValidators: Map<string, Function> = new Map();
  privateregulatoryCheckers: Map<string, Function> = new Map();

  const ructor() {
    super();
    this.initializeValidationRules();
    this.initializeClinicalValidators();
    this.initializeRegulatoryCheckers();
  }

  private initializeValidationRules(): void {
    // Core healthcare validation rules
    const coreRules: ValidationRule[] = [
      {
        ruleId: uuidv4(),
        fieldName: 'resident_id',
        ruleType: 'required',
        description: 'Resident ID must be present and unique',
        validationFunction: (value) => ({
          isValid: value !== null && value !== undefined && value !== '',
          message: value ? 'Valid resident ID' : 'Resident ID is required',
          suggestion: 'Provide a unique identifier for each resident'
        }),
        severity: 'critical',
        autoFixable: false,
        clinicalSafety: true,
        regulatoryRequirement: true
      },
      {
        ruleId: uuidv4(),
        fieldName: 'nhs_number',
        ruleType: 'format',
        description: 'NHS number must be valid 10-digit format with correct check digit',
        validationFunction: (value) => this.validateNHSNumber(value),
        severity: 'error',
        autoFixable: false,
        clinicalSafety: true,
        regulatoryRequirement: true
      },
      {
        ruleId: uuidv4(),
        fieldName: 'date_of_birth',
        ruleType: 'range',
        description: 'Date of birth must be valid and within reasonable age range for adult care',
        validationFunction: (value) => this.validateDateOfBirth(value),
        severity: 'error',
        autoFixable: true,
        clinicalSafety: true,
        regulatoryRequirement: true
      },
      {
        ruleId: uuidv4(),
        fieldName: 'current_medications',
        ruleType: 'clinical',
        description: 'Medications must be valid and properly structured',
        validationFunction: (value) => this.validateMedications(value),
        severity: 'warning',
        autoFixable: true,
        clinicalSafety: true,
        regulatoryRequirement: true
      },
      {
        ruleId: uuidv4(),
        fieldName: 'known_allergies',
        ruleType: 'clinical',
        description: 'Allergies must be clinically valid and properly categorized',
        validationFunction: (value) => this.validateAllergies(value),
        severity: 'warning',
        autoFixable: true,
        clinicalSafety: true,
        regulatoryRequirement: true
      },
      {
        ruleId: uuidv4(),
        fieldName: 'phone_number',
        ruleType: 'format',
        description: 'Phone number must be in valid UK format',
        validationFunction: (value) => this.validatePhoneNumber(value),
        severity: 'warning',
        autoFixable: true,
        clinicalSafety: false,
        regulatoryRequirement: false
      },
      {
        ruleId: uuidv4(),
        fieldName: 'postcode',
        ruleType: 'format',
        description: 'Postcode must be valid UK format',
        validationFunction: (value) => this.validatePostcode(value),
        severity: 'warning',
        autoFixable: true,
        clinicalSafety: false,
        regulatoryRequirement: false
      },
      {
        ruleId: uuidv4(),
        fieldName: 'care_level',
        ruleType: 'regulatory',
        description: 'Care level must be valid and compliant with CQC standards',
        validationFunction: (value) => this.validateCareLevel(value),
        severity: 'error',
        autoFixable: true,
        clinicalSafety: true,
        regulatoryRequirement: true
      }
    ];

    this.validationRules.set('core', coreRules);
  }

  private initializeClinicalValidators(): void {
    // Clinical validation functions
    this.clinicalValidators.set('medication_interactions', async (medications: any[]) => {
      // Simulate medication interaction checking
      const interactions = [];
      
      if (medications.some(m => m.name.toLowerCase().includes('warfarin')) &&
          medications.some(m => m.name.toLowerCase().includes('aspirin'))) {
        interactions.push({
          severity: 'high',
          description: 'Warfarin + Aspirin: Increased bleeding risk',
          recommendation: 'Monitor INR closely, consider PPI'
        });
      }
      
      return {
        hasInteractions: interactions.length > 0,
        interactions,
        riskLevel: interactions.length > 0 ? 'high' : 'low'
      };
    });

    this.clinicalValidators.set('allergy_medication_check', async (allergies: string[], medications: any[]) => {
      const conflicts = [];
      
      for (const allergy of allergies) {
        if (allergy.toLowerCase().includes('penicillin')) {
          const penicillinMeds = medications.filter(m => 
            m.name.toLowerCase().includes('amoxicillin') || 
            m.name.toLowerCase().includes('penicillin')
          );
          
          if (penicillinMeds.length > 0) {
            conflicts.push({
              severity: 'critical',
              allergy,
              medications: penicillinMeds.map(m => m.name),
              risk: 'Severe allergic reaction possible'
            });
          }
        }
      }
      
      return {
        hasConflicts: conflicts.length > 0,
        conflicts,
        requiresReview: conflicts.some(c => c.severity === 'critical')
      };
    });

    this.clinicalValidators.set('age_medication_appropriateness', async (age: number, medications: any[]) => {
      const inappropriateMeds = [];
      
      if (age > 75) {
        // Check for potentially inappropriate medications in elderly (Beers Criteria)
        const riskyMeds = ['diazepam', 'amitriptyline', 'chlorphenamine'];
        
        for (const med of medications) {
          if (riskyMeds.some(risky => med.name.toLowerCase().includes(risky))) {
            inappropriateMeds.push({
              medication: med.name,
              reason: 'Potentially inappropriate in elderly (Beers Criteria)',
              recommendation: 'Consider alternative medication'
            });
          }
        }
      }
      
      return {
        hasIssues: inappropriateMeds.length > 0,
        inappropriateMedications: inappropriateMeds,
        requiresPharmacistReview: inappropriateMeds.length > 0
      };
    });
  }

  private initializeRegulatoryCheckers(): void {
    // Regulatory compliance checkers
    this.regulatoryCheckers.set('cqc_essential_information', (record: any) => {
      const requiredFields = [
        'resident_id', 'full_name', 'date_of_birth', 'care_level',
        'admission_date', 'next_of_kin', 'gp_name'
      ];
      
      const missingFields = requiredFields.filter(field => !record[field]);
      
      return {
        compliant: missingFields.length === 0,
        missingFields,
        complianceScore: ((requiredFields.length - missingFields.length) / requiredFields.length) * 100
      };
    });

    this.regulatoryCheckers.set('gdpr_data_minimization', (record: any) => {
      const unnecessaryFields = [];
      const sensitiveFields = ['nhs_number', 'medical_history', 'known_allergies'];
      
      // Check if sensitive data is justified for care purposes
      for (const field of sensitiveFields) {
        if (record[field] && !this.isJustifiedForCare(field, record)) {
          unnecessaryFields.push(field);
        }
      }
      
      return {
        compliant: unnecessaryFields.length === 0,
        unnecessaryFields,
        recommendation: unnecessaryFields.length > 0 ? 'Review data necessity for care purposes' : 'GDPR compliant'
      };
    });

    this.regulatoryCheckers.set('professional_standards_compliance', (record: any) => {
      const issues = [];
      
      // Check medication prescriber information
      if (record.current_medications && Array.isArray(record.current_medications)) {
        const medicationsWithoutPrescriber = record.current_medications.filter(
          (med: any) => !med.prescriber || med.prescriber === ''
        );
        
        if (medicationsWithoutPrescriber.length > 0) {
          issues.push('Medications without prescriber information (NMC/GMC standards)');
        }
      }
      
      // Check care documentation completeness
      if (!record.care_requirements || record.care_requirements === '') {
        issues.push('Missing care requirements documentation (Professional standards)');
      }
      
      return {
        compliant: issues.length === 0,
        issues,
        complianceLevel: issues.length === 0 ? 'full' : issues.length < 3 ? 'partial' : 'poor'
      };
    });
  }

  /**
   * Perform comprehensive data quality assessment
   */
  async assessDataQuality(
    data: any[], 
    options: {
      includeClinicaValidation?: boolean;
      includeRegulatoryChecks?: boolean;
      detailedFieldAnalysis?: boolean;
      generateRecommendations?: boolean;
    } = {}
  ): Promise<DataQualityReport> {
    const reportId = uuidv4();
    const startTime = Date.now();
    
    this.emit('quality_assessment_started', { reportId, recordCount: data.length });
    
    try {
      // Basic dataset information
      const datasetInfo = {
        recordCount: data.length,
        fieldCount: data.length > 0 ? Object.keys(data[0]).length : 0,
        dataSource: 'migration_import',
        dataFormat: 'structured'
      };

      // Perform quality metric analysis
      const qualityMetrics = await this.analyzeQualityMetrics(data);
      
      // Field-level analysis
      const fieldAnalysis = options.detailedFieldAnalysis ? 
        await this.performFieldAnalysis(data) : [];

      // Validation results
      const validationResults = await this.performValidation(data);

      // Clinical safety assessment
      const clinicalSafetyIssues = options.includeClinicaValidation ? 
        await this.assessClinicalSafety(data) : [];

      // Regulatory compliance check
      const regulatoryComplianceStatus = options.includeRegulatoryChecks ? 
        await this.assessRegulatoryCompliance(data) : this.getDefaultComplianceStatus();

      // Generate recommendations
      const recommendations = options.generateRecommendations ? 
        await this.generateQualityRecommendations(qualityMetrics, validationResults, clinicalSafetyIssues) : [];

      // Calculate overall score
      const overallScore = this.calculateOverallQualityScore(
        qualityMetrics, 
        validationResults, 
        clinicalSafetyIssues
      );

      const report: DataQualityReport = {
        reportId,
        generatedAt: new Date(),
        datasetInfo,
        overallScore,
        qualityMetrics,
        fieldAnalysis,
        validationResults,
        recommendations,
        clinicalSafetyIssues,
        regulatoryComplianceStatus
      };

      this.emit('quality_assessment_completed', { 
        reportId, 
        duration: Date.now() - startTime,
        overallScore 
      });

      return report;

    } catch (error: unknown) {
      this.emit('quality_assessment_failed', { reportId, error: error instanceof Error ? error.message : "Unknown error" });
      throw error;
    }
  }

  private async analyzeQualityMetrics(data: any[]): Promise<any> {
    if (data.length === 0) {
      return this.getEmptyDataMetrics();
    }

    const fields = Object.keys(data[0]);
    
    // Completeness analysis
    const completeness = await this.analyzeCompleteness(data, fields);
    
    // Accuracy analysis
    const accuracy = await this.analyzeAccuracy(data, fields);
    
    // Consistency analysis
    const consistency = await this.analyzeConsistency(data, fields);
    
    // Validity analysis
    const validity = await this.analyzeValidity(data, fields);
    
    // Uniqueness analysis
    const uniqueness = await this.analyzeUniqueness(data, fields);
    
    // Timeliness analysis
    const timeliness = await this.analyzeTimeliness(data, fields);

    return {
      completeness,
      accuracy,
      consistency,
      validity,
      uniqueness,
      timeliness
    };
  }

  private async analyzeCompleteness(data: any[], fields: string[]): Promise<QualityMetric> {
    let totalFields = 0;
    let filledFields = 0;
    const fieldCompleteness: { [field: string]: number } = {};
    
    for (const field of fields) {
      let fieldFilledCount = 0;
      
      for (const record of data) {
        totalFields++;
        const value = record[field];
        
        if (value !== null && value !== undefined && value !== '') {
          filledFields++;
          fieldFilledCount++;
        }
      }
      
      fieldCompleteness[field] = (fieldFilledCount / data.length) * 100;
    }
    
    const overallCompleteness = (filledFields / totalFields) * 100;
    const incompleteFields = Object.entries(fieldCompleteness)
      .filter(([, completeness]) => completeness < 80)
      .map(([field]) => field);
    
    return {
      score: Math.round(overallCompleteness),
      description: `${Math.round(overallCompleteness)}% of fields are populated`,
      issues: incompleteFields.map(field => 
        `Field '${field}' has low completeness (${Math.round(fieldCompleteness[field])}%)`
      ),
      recommendations: incompleteFields.length > 0 ? [
        'Review data collection processes for incomplete fields',
        'Consider default values or validation rules for critical fields'
      ] : ['Excellent data completeness']
    };
  }

  private async analyzeAccuracy(data: any[], fields: string[]): Promise<QualityMetric> {
    let accuracyScore = 100;
    const issues: string[] = [];
    const recommendations: any[] = [];
    
    // Check for obvious data accuracy issues
    for (const record of data.slice(0, Math.min(100, data.length))) {
      // Age validation
      if (record.date_of_birth) {
        try {
          const dob = new Date(record.date_of_birth);
          const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
          
          if (age < 0 || age > 120) {
            accuracyScore -= 2;
            issues.push('Invalid age detected');
          }
        } catch (error: unknown) {
          accuracyScore -= 1;
          issues.push('Invalid date format detected');
        }
      }
      
      // Phone number format accuracy
      if (record.phone_number) {
        const phoneRegex = /^(\+44|0)[0-9\s\-\(\)]{8,15}$/;
        if (!phoneRegex.test(record.phone_number)) {
          accuracyScore -= 0.5;
          issues.push('Invalid phone number format detected');
        }
      }
      
      // NHS number accuracy
      if (record.nhs_number) {
        const nhsResult = this.validateNHSNumber(record.nhs_number);
        if (!nhsResult.isValid) {
          accuracyScore -= 3;
          issues.push('Invalid NHS number detected');
        }
      }
    }
    
    if (accuracyScore < 95) {
      recommendations.push('Review data entry processes to improve accuracy');
    }
    if (issues.length > 0) {
      recommendations.push('Implement automated validation during data entry');
    }
    
    return {
      score: Math.max(Math.round(accuracyScore), 0),
      description: `${Math.round(accuracyScore)}% data accuracy based on validation checks`,
      issues: [...new Set(issues)], // Remove duplicates
      recommendations
    };
  }

  private async analyzeConsistency(data: any[], fields: string[]): Promise<QualityMetric> {
    let consistencyScore = 100;
    const issues: string[] = [];
    const recommendations: any[] = [];
    
    // Check format consistency within fields
    const dateFields = fields.filter(field => 
      field.toLowerCase().includes('date') || field.toLowerCase().includes('dob')
    );
    
    for (const dateField of dateFields) {
      const dateFormats = new Set<string>();
      
      data.slice(0, 50).forEach(record => {
        if (record[dateField]) {
          const dateStr = String(record[dateField]);
          if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) dateFormats.add('ISO');
          else if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) dateFormats.add('UK');
          else if (/^\d{2}-\d{2}-\d{4}/.test(dateStr)) dateFormats.add('EU');
          else dateFormats.add('OTHER');
        }
      });
      
      if (dateFormats.size > 1) {
        consistencyScore -= 10;
        issues.push(`Inconsistent date formats in field '${dateField}'`);
        recommendations.push(`Standardize ${dateField} to YYYY-MM-DD format`);
      }
    }
    
    // Check naming consistency
    const nameFields = fields.filter(field => field.toLowerCase().includes('name'));
    for (const nameField of nameFields) {
      const casePatterns = new Set<string>();
      
      data.slice(0, 50).forEach(record => {
        if (record[nameField]) {
          const name = String(record[nameField]);
          if (name === name.toUpperCase()) casePatterns.add('UPPER');
          else if (name === name.toLowerCase()) casePatterns.add('LOWER');
          else casePatterns.add('MIXED');
        }
      });
      
      if (casePatterns.size > 1) {
        consistencyScore -= 5;
        issues.push(`Inconsistent name casing in field '${nameField}'`);
        recommendations.push(`Standardize ${nameField} to proper case`);
      }
    }
    
    return {
      score: Math.max(Math.round(consistencyScore), 0),
      description: `${Math.round(consistencyScore)}% format consistency across fields`,
      issues,
      recommendations
    };
  }

  private async analyzeValidity(data: any[], fields: string[]): Promise<QualityMetric> {
    let validityScore = 100;
    const issues: string[] = [];
    const recommendations: any[] = [];
    
    const coreRules = this.validationRules.get('core') || [];
    let totalValidations = 0;
    let passedValidations = 0;
    
    for (const record of data.slice(0, Math.min(100, data.length))) {
      for (const rule of coreRules) {
        if (record[rule.fieldName] !== undefined) {
          totalValidations++;
          const result = rule.validationFunction(record[rule.fieldName], record);
          
          if (result.isValid) {
            passedValidations++;
          } else {
            if (rule.severity === 'critical') validityScore -= 5;
            else if (rule.severity === 'error') validityScore -= 3;
            else if (rule.severity === 'warning') validityScore -= 1;
            
            issues.push(`${rule.fieldName}: ${result.message}`);
          }
        }
      }
    }
    
    if (totalValidations > 0) {
      const validationPassRate = (passedValidations / totalValidations) * 100;
      validityScore = Math.min(validityScore, validationPassRate);
    }
    
    if (validityScore < 90) {
      recommendations.push('Address validation failures to improve data validity');
    }
    
    return {
      score: Math.max(Math.round(validityScore), 0),
      description: `${Math.round(validityScore)}% of validations passed`,
      issues: [...new Set(issues)].slice(0, 10), // Top 10 issues
      recommendations
    };
  }

  private async analyzeUniqueness(data: any[], fields: string[]): Promise<QualityMetric> {
    let uniquenessScore = 100;
    const issues: string[] = [];
    const recommendations: any[] = [];
    
    // Check for duplicate records based on key fields
    const keyFields = ['resident_id', 'nhs_number', 'patient_id'];
    
    for (const keyField of keyFields) {
      if (fields.includes(keyField)) {
        const values = data.map(record => record[keyField]).filter(v => v);
        const uniqueValues = new Set(values);
        
        if (values.length !== uniqueValues.size) {
          const duplicateCount = values.length - uniqueValues.size;
          uniquenessScore -= duplicateCount * 10;
          issues.push(`${duplicateCount} duplicate values found in ${keyField}`);
          recommendations.push(`Remove or merge duplicate records for ${keyField}`);
        }
      }
    }
    
    return {
      score: Math.max(Math.round(uniquenessScore), 0),
      description: `${Math.round(uniquenessScore)}% uniqueness for key identifier fields`,
      issues,
      recommendations
    };
  }

  private async analyzeTimeliness(data: any[], fields: string[]): Promise<QualityMetric> {
    let timelinessScore = 100;
    const issues: string[] = [];
    const recommendations: any[] = [];
    
    // Check for outdated information
    const dateFields = fields.filter(field => 
      field.toLowerCase().includes('date') && 
      !field.toLowerCase().includes('birth') &&
      !field.toLowerCase().includes('admission')
    );
    
    for (const dateField of dateFields) {
      const dates = data.map(record => {
        try {
          return record[dateField] ? new Date(record[dateField]) : null;
        } catch {
          return null;
        }
      }).filter(date => date !== null);
      
      if (dates.length > 0) {
        const now = new Date();
        const oldDates = dates.filter(date => {
          const daysDiff = (now.getTime() - date!.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff > 365; // More than 1 year old
        });
        
        if (oldDates.length > 0) {
          const stalenessRatio = oldDates.length / dates.length;
          timelinessScore -= stalenessRatio * 20;
          issues.push(`${Math.round(stalenessRatio * 100)}% of ${dateField} entries are over 1 year old`);
          recommendations.push(`Update outdated ${dateField} information`);
        }
      }
    }
    
    return {
      score: Math.max(Math.round(timelinessScore), 0),
      description: `${Math.round(timelinessScore)}% of date-related information is current`,
      issues,
      recommendations
    };
  }

  private async performFieldAnalysis(data: any[]): Promise<FieldQualityAnalysis[]> {
    if (data.length === 0) return [];
    
    const fields = Object.keys(data[0]);
    const analyses: FieldQualityAnalysis[] = [];
    
    for (const field of fields) {
      const values = data.map(record => record[field]);
      const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
      const uniqueValues = new Set(nonNullValues);
      
      // Detect patterns
      const patterns = this.detectFieldPatterns(nonNullValues);
      
      // Detect anomalies
      const anomalies = this.detectFieldAnomalies(nonNullValues, field);
      
      // Assess clinical relevance
      const clinicalRelevance = this.assessClinicalRelevance(field);
      
      // Assess regulatory importance
      const regulatoryImportance = this.assessRegulatoryImportance(field);
      
      analyses.push({
        fieldName: field,
        dataType: this.detectDataType(nonNullValues),
        completeness: (nonNullValues.length / data.length) * 100,
        uniqueness: (uniqueValues.size / Math.max(nonNullValues.length, 1)) * 100,
        validity: await this.calculateFieldValidity(field, nonNullValues),
        patterns,
        anomalies,
        clinicalRelevance,
        regulatoryImportance
      });
    }
    
    return analyses;
  }

  private async performValidation(data: any[]): Promise<any> {
    const results = { passed: 0, warnings: 0, errors: 0, critical: 0 };
    const coreRules = this.validationRules.get('core') || [];
    
    for (const record of data) {
      for (const rule of coreRules) {
        if (record[rule.fieldName] !== undefined) {
          const result = rule.validationFunction(record[rule.fieldName], record);
          
          if (result.isValid) {
            results.passed++;
          } else {
            switch (rule.severity) {
              case 'critical': results.critical++; break;
              case 'error': results.errors++; break;
              case 'warning': results.warnings++; break;
              default: results.warnings++;
            }
          }
        }
      }
    }
    
    return results;
  }

  private async assessClinicalSafety(data: any[]): Promise<ClinicalSafetyIssue[]> {
    const issues: ClinicalSafetyIssue[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      
      // Medication safety checks
      if (record.current_medications && Array.isArray(record.current_medications)) {
        const age = record.date_of_birth ? 
          (Date.now() - new Date(record.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000) : 0;
        
        // Check for age-inappropriate medications
        const ageCheck = await this.clinicalValidators.get('age_medication_appropriateness')!(age, record.current_medications);
        
        if (ageCheck.hasIssues) {
          issues.push({
            issueId: uuidv4(),
            severity: 'high',
            category: 'medication',
            description: 'Potentially inappropriate medications for age group detected',
            affectedRecords: 1,
            potentialRisks: ['Adverse drug reactions', 'Falls risk', 'Cognitive impairment'],
            recommendedActions: ['Pharmacist review required', 'Consider alternative medications'],
            requiresClinicalReview: true
          });
        }
        
        // Check for drug interactions
        const interactionCheck = await this.clinicalValidators.get('medication_interactions')!(record.current_medications);
        
        if (interactionCheck.hasInteractions) {
          issues.push({
            issueId: uuidv4(),
            severity: 'critical',
            category: 'medication',
            description: 'Potential drug interactions detected',
            affectedRecords: 1,
            potentialRisks: ['Bleeding risk', 'Therapeutic failure', 'Toxicity'],
            recommendedActions: ['Clinical pharmacist review', 'Monitor closely', 'Consider alternatives'],
            requiresClinicalReview: true
          });
        }
        
        // Check allergy conflicts
        if (record.known_allergies) {
          const allergyCheck = await this.clinicalValidators.get('allergy_medication_check')!(
            record.known_allergies, 
            record.current_medications
          );
          
          if (allergyCheck.hasConflicts) {
            issues.push({
              issueId: uuidv4(),
              severity: 'critical',
              category: 'allergy',
              description: 'Medication conflicts with known allergies',
              affectedRecords: 1,
              potentialRisks: ['Allergic reactions', 'Anaphylaxis', 'Treatment complications'],
              recommendedActions: ['Immediate clinical review', 'Stop conflicting medications', 'Alternative prescribing'],
              requiresClinicalReview: true
            });
          }
        }
      }
    }
    
    return issues;
  }

  private async assessRegulatoryCompliance(data: any[]): Promise<RegulatoryComplianceStatus> {
    let cqcScore = 100;
    let gdprScore = 100;
    let professionalScore = 100;
    let dataProtectionScore = 100;
    const issues: any[] = [];
    
    for (const record of data.slice(0, Math.min(50, data.length))) {
      // CQC compliance check
      const cqcCheck = this.regulatoryCheckers.get('cqc_essential_information')!(record);
      if (!cqcCheck.compliant) {
        cqcScore -= 2;
        issues.push({
          regulation: 'CQC Essential Information',
          issue: `Missing requiredfields: ${cqcCheck.missingFields.join(', ')}`,
          severity: 'major',
          remediation: 'Ensure all CQC required fields are populated'
        });
      }
      
      // GDPR compliance check
      const gdprCheck = this.regulatoryCheckers.get('gdpr_data_minimization')!(record);
      if (!gdprCheck.compliant) {
        gdprScore -= 1;
        issues.push({
          regulation: 'GDPR Data Minimization',
          issue: `Unnecessary datafields: ${gdprCheck.unnecessaryFields.join(', ')}`,
          severity: 'minor',
          remediation: 'Review data necessity and obtain appropriate consents'
        });
      }
      
      // Professional standards check
      const professionalCheck = this.regulatoryCheckers.get('professional_standards_compliance')!(record);
      if (!professionalCheck.compliant) {
        professionalScore -= 3;
        issues.push({
          regulation: 'Professional Standards (NMC/GMC)',
          issue: professionalCheck.issues.join('; '),
          severity: 'major',
          remediation: 'Ensure professional documentation standards are met'
        });
      }
    }
    
    return {
      overallCompliance: Math.round((cqcScore + gdprScore + professionalScore + dataProtectionScore) / 4),
      cqcCompliance: Math.max(Math.round(cqcScore), 0),
      gdprCompliance: Math.max(Math.round(gdprScore), 0),
      professionalStandardsCompliance: Math.max(Math.round(professionalScore), 0),
      dataProtectionCompliance: Math.max(Math.round(dataProtectionScore), 0),
      issues
    };
  }

  private async generateQualityRecommendations(
    qualityMetrics: any,
    validationResults: any,
    clinicalIssues: ClinicalSafetyIssue[]
  ): Promise<QualityRecommendation[]> {
    const recommendations: QualityRecommendation[] = [];
    
    // Data quality recommendations
    if (qualityMetrics.completeness.score < 80) {
      recommendations.push({
        priority: 'high',
        category: 'data_quality',
        title: 'Improve Data Completeness',
        description: 'Several fields have low completion rates which may impact care quality',
        actionRequired: true,
        estimatedEffort: 'medium',
        impact: 'Improved care documentation and regulatory compliance'
      });
    }
    
    if (qualityMetrics.accuracy.score < 85) {
      recommendations.push({
        priority: 'high',
        category: 'data_quality',
        title: 'Address Data Accuracy Issues',
        description: 'Data accuracy issues detected that could impact patient safety',
        actionRequired: true,
        estimatedEffort: 'high',
        impact: 'Enhanced patient safety and care quality'
      });
    }
    
    // Clinical safety recommendations
    if (clinicalIssues.length > 0) {
      const criticalIssues = clinicalIssues.filter(issue => issue.severity === 'critical');
      
      if (criticalIssues.length > 0) {
        recommendations.push({
          priority: 'high',
          category: 'clinical_safety',
          title: 'Critical Clinical Safety Review Required',
          description: `${criticalIssues.length} critical clinical safety issues identified`,
          actionRequired: true,
          estimatedEffort: 'high',
          impact: 'Patient safety and regulatory compliance'
        });
      }
    }
    
    // Performance recommendations
    if (validationResults.errors > validationResults.passed * 0.1) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        title: 'Optimize Data Validation Process',
        description: 'High error rate may slow migration performance',
        actionRequired: false,
        estimatedEffort: 'medium',
        impact: 'Faster migration execution and better user experience'
      });
    }
    
    return recommendations;
  }

  // Validation helper methods

  private validateNHSNumber(value: any): ValidationResult {
    if (!value) {
      return { isValid: false, message: 'NHS number is required' };
    }
    
    const cleaned = String(value).replace(/\s/g, '');
    
    if (!/^\d{10}$/.test(cleaned)) {
      return { 
        isValid: false, 
        message: 'NHS number must be exactly 10 digits',
        suggestion: 'Provide a valid 10-digit NHS number'
      };
    }
    
    // Check digit validation
    const digits = cleaned.split('').map(Number);
    const checkDigit = digits[9];
    const sum = digits.slice(0, 9).reduce((acc, digit, index) => acc + digit * (10 - index), 0);
    const remainder = sum % 11;
    const expectedCheckDigit = remainder === 0 ? 0 : 11 - remainder;
    
    if (expectedCheckDigit !== checkDigit && expectedCheckDigit !== 11) {
      return { 
        isValid: false, 
        message: 'Invalid NHS number check digit',
        suggestion: 'Verify NHS number accuracy'
      };
    }
    
    return { isValid: true, message: 'Valid NHS number' };
  }

  private validateDateOfBirth(value: any): ValidationResult {
    if (!value) {
      return { isValid: false, message: 'Date of birth is required' };
    }
    
    try {
      const dob = new Date(value);
      const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      
      if (isNaN(dob.getTime())) {
        return { 
          isValid: false, 
          message: 'Invalid date format',
          suggestion: 'Use YYYY-MM-DD or DD/MM/YYYY format'
        };
      }
      
      if (age < 0) {
        return { 
          isValid: false, 
          message: 'Birth date cannot be in the future',
          suggestion: 'Check date accuracy'
        };
      }
      
      if (age > 120) {
        return { 
          isValid: false, 
          message: 'Age over 120 years is unlikely',
          suggestion: 'Verify birth date accuracy'
        };
      }
      
      if (age < 18) {
        return { 
          isValid: false, 
          message: 'Age under 18 - adult care system',
          suggestion: 'Confirm this is appropriate for adult care services'
        };
      }
      
      return { isValid: true, message: 'Valid date of birth' };
      
    } catch (error: unknown) {
      return { 
        isValid: false, 
        message: 'Date parsing failed',
        suggestion: 'Check date format'
      };
    }
  }

  private validateMedications(value: any): ValidationResult {
    if (!value) {
      return { isValid: true, message: 'No medications recorded' };
    }
    
    if (Array.isArray(value)) {
      const invalidMeds = value.filter(med => !med.name || med.name === '');
      
      if (invalidMeds.length > 0) {
        return {
          isValid: false,
          message: `${invalidMeds.length} medications missing names`,
          suggestion: 'Ensure all medications have valid names'
        };
      }
      
      return { isValid: true, message: `${value.length} medications validated` };
    }
    
    // String format medication list
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'none' || value.toLowerCase() === 'none known') {
        return { isValid: true, message: 'No medications recorded' };
      }
      
      const medicationCount = value.split(/[;,]/).filter(med => med.trim() !== '').length;
      return { 
        isValid: medicationCount > 0, 
        message: `${medicationCount} medications found in text format`,
        suggestion: 'Consider parsing into structured format'
      };
    }
    
    return { isValid: false, message: 'Invalid medication format' };
  }

  private validateAllergies(value: any): ValidationResult {
    if (!value) {
      return { isValid: true, message: 'No allergies recorded' };
    }
    
    if (Array.isArray(value)) {
      return { isValid: true, message: `${value.length} allergies recorded` };
    }
    
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'none' || value.toLowerCase() === 'none known') {
        return { isValid: true, message: 'No known allergies' };
      }
      
      const allergyCount = value.split(/[;,]/).filter(allergy => allergy.trim() !== '').length;
      return { 
        isValid: true, 
        message: `${allergyCount} allergies found`,
        suggestion: allergyCount > 0 ? 'Consider parsing into structured format' : undefined
      };
    }
    
    return { isValid: false, message: 'Invalid allergy format' };
  }

  private validatePhoneNumber(value: any): ValidationResult {
    if (!value) {
      return { isValid: true, message: 'Phone number not provided' };
    }
    
    const phoneRegex = /^(\+44|0)[0-9\s\-\(\)]{8,15}$/;
    const isValid = phoneRegex.test(String(value));
    
    return {
      isValid,
      message: isValid ? 'Valid UK phone number format' : 'Invalid phone number format',
      suggestion: isValid ? undefined : 'Use UKformat: +44XXXXXXXXXX or 0XXXXXXXXX',
      fixedValue: isValid ? undefined : this.normalizePhoneNumber(value)
    };
  }

  private validatePostcode(value: any): ValidationResult {
    if (!value) {
      return { isValid: true, message: 'Postcode not provided' };
    }
    
    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
    const isValid = postcodeRegex.test(String(value));
    
    return {
      isValid,
      message: isValid ? 'Valid UK postcode format' : 'Invalid postcode format',
      suggestion: isValid ? undefined : 'Use UK postcodeformat: SW1A 1AA',
      fixedValue: isValid ? undefined : this.normalizePostcode(value)
    };
  }

  private validateCareLevel(value: any): ValidationResult {
    if (!value) {
      return { isValid: false, message: 'Care level is required for CQC compliance' };
    }
    
    const validLevels = [
      'low dependency', 'medium dependency', 'high dependency', 
      'nursing care', 'dementia care', 'end of life care'
    ];
    
    const isValid = validLevels.some(level => 
      level.toLowerCase() === String(value).toLowerCase()
    );
    
    return {
      isValid,
      message: isValid ? 'Valid care level' : 'Invalid care level',
      suggestion: isValid ? undefined : `Use oneof: ${validLevels.join(', ')}`,
      fixedValue: isValid ? undefined : this.normalizeCareLevel(value)
    };
  }

  // Utility methods

  private detectFieldPatterns(values: any[]): string[] {
    const patterns: string[] = [];
    
    if (values.length === 0) return patterns;
    
    // Date patterns
    if (values.some(v => /^\d{4}-\d{2}-\d{2}/.test(String(v)))) {
      patterns.push('ISO date format (YYYY-MM-DD)');
    }
    if (values.some(v => /^\d{2}\/\d{2}\/\d{4}/.test(String(v)))) {
      patterns.push('UK date format (DD/MM/YYYY)');
    }
    
    // Phone patterns
    if (values.some(v => /^\+44/.test(String(v)))) {
      patterns.push('International phone format (+44)');
    }
    if (values.some(v => /^0\d{10}/.test(String(v).replace(/\s/g, '')))) {
      patterns.push('UK national phone format (0...)');
    }
    
    // NHS number pattern
    if (values.some(v => /^\d{10}$/.test(String(v).replace(/\s/g, '')))) {
      patterns.push('NHS number format (10 digits)');
    }
    
    return patterns;
  }

  private detectFieldAnomalies(values: any[], fieldName: string): string[] {
    const anomalies: string[] = [];
    
    // Detect outliers based on field type
    if (fieldName.toLowerCase().includes('age')) {
      const ages = values.map(v => parseInt(String(v))).filter(age => !isNaN(age));
      const unusualAges = ages.filter(age => age < 18 || age > 110);
      
      if (unusualAges.length > 0) {
        anomalies.push(`${unusualAges.length} unusual age values detected`);
      }
    }
    
    // Detect extremely long or short values
    const stringValues = values.map(v => String(v)).filter(s => s !== '');
    if (stringValues.length > 0) {
      const avgLength = stringValues.reduce((sum, s) => sum + s.length, 0) / stringValues.length;
      const outliers = stringValues.filter(s => s.length > avgLength * 3 || s.length < avgLength * 0.3);
      
      if (outliers.length > 0) {
        anomalies.push(`${outliers.length} unusual length values detected`);
      }
    }
    
    return anomalies;
  }

  private assessClinicalRelevance(fieldName: string): 'high' | 'medium' | 'low' {
    const highRelevanceFields = [
      'nhs_number', 'current_medications', 'known_allergies', 'medical_history',
      'care_level', 'mental_capacity', 'risk_factors'
    ];
    
    const mediumRelevanceFields = [
      'gp_name', 'emergency_contact', 'dietary_requirements', 'mobility_aid',
      'care_requirements'
    ];
    
    if (highRelevanceFields.some(field => fieldName.toLowerCase().includes(field))) {
      return 'high';
    }
    
    if (mediumRelevanceFields.some(field => fieldName.toLowerCase().includes(field))) {
      return 'medium';
    }
    
    return 'low';
  }

  private assessRegulatoryImportance(fieldName: string): 'critical' | 'important' | 'optional' {
    const criticalFields = [
      'resident_id', 'nhs_number', 'full_name', 'date_of_birth', 'care_level'
    ];
    
    const importantFields = [
      'admission_date', 'funding_type', 'next_of_kin', 'gp_name', 'current_medications'
    ];
    
    if (criticalFields.some(field => fieldName.toLowerCase().includes(field))) {
      return 'critical';
    }
    
    if (importantFields.some(field => fieldName.toLowerCase().includes(field))) {
      return 'important';
    }
    
    return 'optional';
  }

  private detectDataType(values: any[]): string {
    if (values.length === 0) return 'unknown';
    
    const sampleValue = values[0];
    
    if (typeof sampleValue === 'number') return 'number';
    if (typeof sampleValue === 'boolean') return 'boolean';
    if (sampleValue instanceof Date) return 'date';
    
    // String pattern analysis
    const stringValue = String(sampleValue);
    
    if (/^\d{4}-\d{2}-\d{2}/.test(stringValue)) return 'date';
    if (/^\d+$/.test(stringValue)) return 'number';
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) return 'email';
    if (/^(\+44|0)[0-9\s\-\(\)]{8,15}$/.test(stringValue)) return 'phone';
    
    return 'string';
  }

  private async calculateFieldValidity(fieldName: string, values: any[]): Promise<number> {
    if (values.length === 0) return 0;
    
    let validCount = 0;
    
    for (const value of values.slice(0, Math.min(100, values.length))) {
      // Apply relevant validation rules
      const rules = (this.validationRules.get('core') || [])
        .filter(rule => rule.fieldName === fieldName);
      
      let isFieldValid = true;
      
      for (const rule of rules) {
        const result = rule.validationFunction(value);
        if (!result.isValid && rule.severity !== 'info') {
          isFieldValid = false;
          break;
        }
      }
      
      if (isFieldValid) validCount++;
    }
    
    return (validCount / Math.min(100, values.length)) * 100;
  }

  private normalizePhoneNumber(value: any): string {
    let phone = String(value).replace(/[\s\-\(\)]/g, '');
    
    if (phone.startsWith('0')) {
      return '+44' + phone.substring(1);
    }
    
    return phone.startsWith('+') ? phone : '+44' + phone;
  }

  private normalizePostcode(value: any): string {
    const postcode = String(value).toUpperCase().replace(/\s+/g, '');
    
    if (postcode.length >= 5) {
      return postcode.slice(0, -3) + ' ' + postcode.slice(-3);
    }
    
    return postcode;
  }

  private normalizeCareLevel(value: any): string {
    const level = String(value).toLowerCase();
    
    if (level.includes('low')) return 'Low dependency';
    if (level.includes('medium') || level.includes('moderate')) return 'Medium dependency';
    if (level.includes('high')) return 'High dependency';
    if (level.includes('nursing')) return 'Nursing care';
    if (level.includes('dementia')) return 'Dementia care';
    
    return 'Medium dependency'; // Default
  }

  private isJustifiedForCare(fieldName: string, record: any): boolean {
    // GDPR data minimization check
    const careJustifiedFields = [
      'nhs_number', 'medical_history', 'known_allergies', 'current_medications',
      'care_requirements', 'risk_factors', 'mental_capacity'
    ];
    
    return careJustifiedFields.includes(fieldName);
  }

  private getEmptyDataMetrics(): any {
    return {
      completeness: { score: 0, description: 'No data provided', issues: ['Empty dataset'], recommendations: ['Provide data for analysis'] },
      accuracy: { score: 0, description: 'Cannot assess accuracy', issues: ['No data'], recommendations: [] },
      consistency: { score: 0, description: 'Cannot assess consistency', issues: ['No data'], recommendations: [] },
      validity: { score: 0, description: 'Cannot assess validity', issues: ['No data'], recommendations: [] },
      uniqueness: { score: 0, description: 'Cannot assess uniqueness', issues: ['No data'], recommendations: [] },
      timeliness: { score: 0, description: 'Cannot assess timeliness', issues: ['No data'], recommendations: [] }
    };
  }

  private getDefaultComplianceStatus(): RegulatoryComplianceStatus {
    return {
      overallCompliance: 100,
      cqcCompliance: 100,
      gdprCompliance: 100,
      professionalStandardsCompliance: 100,
      dataProtectionCompliance: 100,
      issues: []
    };
  }

  private calculateOverallQualityScore(
    qualityMetrics: any, 
    validationResults: any, 
    clinicalIssues: ClinicalSafetyIssue[]
  ): number {
    const metricScores = [
      qualityMetrics.completeness.score,
      qualityMetrics.accuracy.score,
      qualityMetrics.consistency.score,
      qualityMetrics.validity.score,
      qualityMetrics.uniqueness.score,
      qualityMetrics.timeliness.score
    ];
    
    let averageScore = metricScores.reduce((sum, score) => sum + score, 0) / metricScores.length;
    
    // Deduct for validation failures
    const totalValidations = validationResults.passed + validationResults.warnings + validationResults.errors + validationResults.critical;
    if (totalValidations > 0) {
      const validationPassRate = (validationResults.passed / totalValidations) * 100;
      averageScore = (averageScore + validationPassRate) / 2;
    }
    
    // Deduct for critical clinical issues
    const criticalIssues = clinicalIssues.filter(issue => issue.severity === 'critical').length;
    averageScore -= criticalIssues * 10;
    
    return Math.max(Math.round(averageScore), 0);
  }

  /**
   * Perform real-time validation during data import
   */
  async validateRecordRealTime(
    record: any, 
    rowNumber: number,
    options: {
      strictMode?: boolean;
      clinicalValidation?: boolean;
      autoFix?: boolean;
    } = {}
  ): Promise<{
    isValid: boolean;
    errors: any[];
    warnings: any[];
    fixedRecord?: any;
    clinicalFlags?: any[];
  }> {
    const errors: any[] = [];
    const warnings: any[] = [];
    const clinicalFlags: any[] = [];
    let fixedRecord = options.autoFix ? { ...record } : undefined;
    
    const coreRules = this.validationRules.get('core') || [];
    
    for (const rule of coreRules) {
      if (record[rule.fieldName] !== undefined) {
        const result = rule.validationFunction(record[rule.fieldName], record);
        
        if (!result.isValid) {
          const issue = {
            row: rowNumber,
            field: rule.fieldName,
            value: record[rule.fieldName],
            message: result.message,
            suggestion: result.suggestion,
            severity: rule.severity,
            autoFixable: rule.autoFixable && result.fixedValue !== undefined
          };
          
          if (rule.severity === 'critical' || rule.severity === 'error') {
            errors.push(issue);
          } else {
            warnings.push(issue);
          }
          
          // Auto-fix if possible and requested
          if (options.autoFix && rule.autoFixable && result.fixedValue !== undefined && fixedRecord) {
            fixedRecord[rule.fieldName] = result.fixedValue;
            issue.autoFixed = true;
          }
          
          // Flag clinical safety issues
          if (rule.clinicalSafety) {
            clinicalFlags.push({
              field: rule.fieldName,
              issue: result.message,
              severity: rule.severity,
              requiresReview: rule.severity === 'critical'
            });
          }
        }
      }
    }
    
    // Additional clinical validation if requested
    if (options.clinicalValidation) {
      const clinicalResults = await this.performClinicalValidation(record, rowNumber);
      clinicalFlags.push(...clinicalResults);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fixedRecord,
      clinicalFlags: clinicalFlags.length > 0 ? clinicalFlags : undefined
    };
  }

  private async performClinicalValidation(record: any, rowNumber: number): Promise<any[]> {
    const flags: any[] = [];
    
    // Age-medication appropriateness
    if (record.date_of_birth && record.current_medications) {
      const age = (Date.now() - new Date(record.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      const ageCheck = await this.clinicalValidators.get('age_medication_appropriateness')!(age, record.current_medications);
      
      if (ageCheck.hasIssues) {
        flags.push({
          row: rowNumber,
          type: 'age_medication_concern',
          severity: 'high',
          message: 'Age-inappropriate medications detected',
          requiresReview: true
        });
      }
    }
    
    return flags;
  }

  /**
   * Generate comprehensive validation report
   */
  async generateValidationReport(
    data: any[],
    migrationContext: {
      sourceSystem: string;
      targetSystem: string;
      migrationPurpose: string;
    }
  ): Promise<DataQualityReport> {
    return await this.assessDataQuality(data, {
      includeClinicaValidation: true,
      includeRegulatoryChecks: true,
      detailedFieldAnalysis: true,
      generateRecommendations: true
    });
  }
}

export default DataValidationService;
