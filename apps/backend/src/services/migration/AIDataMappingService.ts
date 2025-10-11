/**
 * @fileoverview Advanced AI-powered data mapping service for care home data migration
 * @module Migration/AIDataMappingService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Advanced AI-powered data mapping service for healthcare data migration
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview AI Data Mapping Service
 * @module AIDataMappingService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-03
 * 
 * @description Advanced AI-powered data mapping service for healthcare data migration
 * with intelligent field detection, semantic analysis, and automated transformation suggestions.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface MappingRecommendation {
  mappingId: string;
  sourceField: string;
  targetField: string;
  confidence: number;
  reasoning: string;
  transformationType: 'direct' | 'calculated' | 'lookup' | 'conditional' | 'ai_suggested' | 'semantic';
  transformationLogic: string;
  validationRules: string[];
  sampleTransformation: {
    input: any;
    output: any;
    explanation: string;
  };
  alternativeTargets: Array<{
    field: string;
    confidence: number;
    reasoning: string;
  }>;
  dataQualityImpact: {
    completeness: number;
    accuracy: number;
    consistency: number;
  };
}

export interface SemanticAnalysis {
  field: string;
  semanticCategory: string;
  healthcareContext: string;
  clinicalRelevance: 'high' | 'medium' | 'low';
  regulatoryImportance: 'critical' | 'important' | 'optional';
  dataClassification: 'personal' | 'medical' | 'administrative' | 'operational';
  gdprCategory: 'special' | 'personal' | 'non_personal';
}

export interface FieldPattern {
  pattern: RegExp;
  targetField: string;
  confidence: number;
  context: string;
  transformationHint: string;
}

export interface DataRelationship {
  primaryField: string;
  relatedField: string;
  relationshipType: 'one_to_one' | 'one_to_many' | 'many_to_one' | 'hierarchical';
  confidence: number;
  description: string;
}

export class AIDataMappingService extends EventEmitter {
  private healthcareFieldPatterns: FieldPattern[];
  private semanticRules: Map<string, SemanticAnalysis>;
  private transformationLibrary: Map<string, Function>;
  private learningCache: Map<string, MappingRecommendation[]> = new Map();

  constructor() {
    super();
    this.initializeHealthcarePatterns();
    this.initializeSemanticRules();
    this.initializeTransformationLibrary();
  }

  private initializeHealthcarePatterns(): void {
    this.healthcareFieldPatterns = [
      // Patient/Resident Identification
      {
        pattern: /^(patient|resident|client|service_user)_?(id|ref|number)$/i,
        targetField: 'resident_id',
        confidence: 0.95,
        context: 'Primary identifier for care recipient',
        transformationHint: 'Ensure uniqueness and format consistency'
      },
      {
        pattern: /^nhs_?(number|no)$/i,
        targetField: 'nhs_number',
        confidence: 0.98,
        context: 'NHS unique patient identifier',
        transformationHint: 'Validate 10-digit format and check digit'
      },
      
      // Personal Information
      {
        pattern: /^(full_?name|patient_?name|client_?name)$/i,
        targetField: 'full_name',
        confidence: 0.92,
        context: 'Complete name of care recipient',
        transformationHint: 'Standardize capitalization and format'
      },
      {
        pattern: /^(first_?name|given_?name|forename)$/i,
        targetField: 'first_name',
        confidence: 0.94,
        context: 'First/given name',
        transformationHint: 'Proper case formatting'
      },
      {
        pattern: /^(last_?name|surname|family_?name)$/i,
        targetField: 'last_name',
        confidence: 0.94,
        context: 'Family/surname',
        transformationHint: 'Proper case formatting'
      },
      {
        pattern: /^(dob|date_?of_?birth|birth_?date)$/i,
        targetField: 'date_of_birth',
        confidence: 0.96,
        context: 'Date of birth',
        transformationHint: 'Parse multiple date formats, validate age range'
      },
      {
        pattern: /^(gender|sex)$/i,
        targetField: 'gender',
        confidence: 0.90,
        context: 'Gender identity',
        transformationHint: 'Standardize to male/female/other/prefer_not_to_say'
      },
      
      // Contact Information
      {
        pattern: /^(phone|telephone|mobile|contact_?number)$/i,
        targetField: 'phone_number',
        confidence: 0.88,
        context: 'Primary contact number',
        transformationHint: 'Normalize to UK format with +44 prefix'
      },
      {
        pattern: /^(email|email_?address)$/i,
        targetField: 'email',
        confidence: 0.92,
        context: 'Email address',
        transformationHint: 'Validate format and normalize case'
      },
      {
        pattern: /^(address|home_?address|residential_?address)$/i,
        targetField: 'address',
        confidence: 0.85,
        context: 'Home/residential address',
        transformationHint: 'Standardize address format'
      },
      {
        pattern: /^(post_?code|postal_?code|zip)$/i,
        targetField: 'postcode',
        confidence: 0.90,
        context: 'UK postcode',
        transformationHint: 'Validate UK postcode format and normalize spacing'
      },
      
      // Medical Information
      {
        pattern: /^(medications?|current_?medications?|drugs?)$/i,
        targetField: 'current_medications',
        confidence: 0.85,
        context: 'Current medication regimen',
        transformationHint: 'Parse medication strings into structured format'
      },
      {
        pattern: /^(allergies|known_?allergies|adverse_?reactions)$/i,
        targetField: 'known_allergies',
        confidence: 0.88,
        context: 'Known allergies and adverse reactions',
        transformationHint: 'Parse comma-separated values, handle "None known"'
      },
      {
        pattern: /^(medical_?history|conditions|diagnoses)$/i,
        targetField: 'medical_history',
        confidence: 0.82,
        context: 'Medical history and conditions',
        transformationHint: 'Structure medical conditions with dates and status'
      },
      {
        pattern: /^(gp|general_?practitioner|primary_?care)$/i,
        targetField: 'gp_name',
        confidence: 0.85,
        context: 'General Practitioner details',
        transformationHint: 'Extract GP name and practice information'
      },
      
      // Care Information
      {
        pattern: /^(care_?level|dependency_?level|care_?category)$/i,
        targetField: 'care_level',
        confidence: 0.87,
        context: 'Level of care required',
        transformationHint: 'Standardize to Low/Medium/High dependency or Nursing care'
      },
      {
        pattern: /^(care_?needs|care_?requirements|support_?needs)$/i,
        targetField: 'care_requirements',
        confidence: 0.83,
        context: 'Specific care needs and requirements',
        transformationHint: 'Structure care needs into categories'
      },
      {
        pattern: /^(room|room_?number|accommodation)$/i,
        targetField: 'room_number',
        confidence: 0.90,
        context: 'Room/accommodation assignment',
        transformationHint: 'Standardize room numbering format'
      },
      
      // Administrative Information
      {
        pattern: /^(admission_?date|start_?date|entry_?date)$/i,
        targetField: 'admission_date',
        confidence: 0.88,
        context: 'Date of admission to care',
        transformationHint: 'Parse date format and validate against business rules'
      },
      {
        pattern: /^(funding|payment|fee_?arrangement)$/i,
        targetField: 'funding_type',
        confidence: 0.85,
        context: 'Funding arrangement type',
        transformationHint: 'Standardize funding categories'
      },
      {
        pattern: /^(next_?of_?kin|emergency_?contact|contact_?person)$/i,
        targetField: 'next_of_kin',
        confidence: 0.86,
        context: 'Emergency contact information',
        transformationHint: 'Parse contact details into structured format'
      },
      
      // Risk and Assessment
      {
        pattern: /^(risk|risk_?factors|risk_?assessment)$/i,
        targetField: 'risk_factors',
        confidence: 0.80,
        context: 'Identified risk factors',
        transformationHint: 'Categorize risks by type and severity'
      },
      {
        pattern: /^(mobility|mobility_?aid|walking_?aid)$/i,
        targetField: 'mobility_aid',
        confidence: 0.85,
        context: 'Mobility assistance requirements',
        transformationHint: 'Standardize mobility aid descriptions'
      },
      {
        pattern: /^(diet|dietary|nutrition|food)$/i,
        targetField: 'dietary_requirements',
        confidence: 0.82,
        context: 'Dietary and nutritional requirements',
        transformationHint: 'Structure dietary information'
      }
    ];
  }

  private initializeSemanticRules(): void {
    this.semanticRules = new Map([
      ['resident_id', {
        field: 'resident_id',
        semanticCategory: 'identifier',
        healthcareContext: 'patient_identification',
        clinicalRelevance: 'high',
        regulatoryImportance: 'critical',
        dataClassification: 'personal',
        gdprCategory: 'personal'
      }],
      ['nhs_number', {
        field: 'nhs_number',
        semanticCategory: 'identifier',
        healthcareContext: 'national_identifier',
        clinicalRelevance: 'high',
        regulatoryImportance: 'critical',
        dataClassification: 'personal',
        gdprCategory: 'special'
      }],
      ['date_of_birth', {
        field: 'date_of_birth',
        semanticCategory: 'demographic',
        healthcareContext: 'patient_demographics',
        clinicalRelevance: 'high',
        regulatoryImportance: 'critical',
        dataClassification: 'personal',
        gdprCategory: 'personal'
      }],
      ['current_medications', {
        field: 'current_medications',
        semanticCategory: 'clinical',
        healthcareContext: 'medication_management',
        clinicalRelevance: 'high',
        regulatoryImportance: 'critical',
        dataClassification: 'medical',
        gdprCategory: 'special'
      }],
      ['known_allergies', {
        field: 'known_allergies',
        semanticCategory: 'clinical',
        healthcareContext: 'safety_information',
        clinicalRelevance: 'high',
        regulatoryImportance: 'critical',
        dataClassification: 'medical',
        gdprCategory: 'special'
      }],
      ['care_level', {
        field: 'care_level',
        semanticCategory: 'care_planning',
        healthcareContext: 'care_assessment',
        clinicalRelevance: 'medium',
        regulatoryImportance: 'important',
        dataClassification: 'administrative',
        gdprCategory: 'special'
      }]
    ]);
  }

  private initializeTransformationLibrary(): void {
    this.transformationLibrary = new Map([
      ['normalize_name', (value: string) => {
        return value.split(' ')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ');
      }],
      ['parse_uk_date', (value: string) => {
        const ukDatePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        const match = value.match(ukDatePattern);
        if (match) {
          const [, day, month, year] = match;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        return new Date(value);
      }],
      ['normalize_phone_uk', (value: string) => {
        let phone = value.replace(/[\s\-\(\)]/g, '');
        if (phone.startsWith('0')) {
          phone = '+44' + phone.substring(1);
        } else if (!phone.startsWith('+44')) {
          phone = '+44' + phone;
        }
        return phone;
      }],
      ['parse_medications', (value: string) => {
        if (!value || value.toLowerCase() === 'none') return [];
        
        return value.split(/[;,]/).map(med => {
          const trimmed = med.trim();
          const nameMatch = trimmed.match(/^([A-Za-z\s]+)/);
          const dosageMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|units?)/i);
          const frequencyMatch = trimmed.match(/\b(OD|BD|TDS|QDS|PRN|ON)\b/i);
          
          return {
            name: nameMatch ? nameMatch[1].trim() : trimmed,
            dosage: dosageMatch ? `${dosageMatch[1]}${dosageMatch[2]}` : '',
            frequency: frequencyMatch ? frequencyMatch[1] : 'As directed',
            route: 'Oral',
            active: true
          };
        }).filter(med => med.name);
      }],
      ['normalize_postcode_uk', (value: string) => {
        const cleaned = value.toUpperCase().replace(/\s+/g, '');
        if (cleaned.length >= 5) {
          return cleaned.slice(0, -3) + ' ' + cleaned.slice(-3);
        }
        return value.toUpperCase();
      }],
      ['validate_nhs_number', (value: string) => {
        const cleaned = value.replace(/\s/g, '');
        if (!/^\d{10}$/.test(cleaned)) {
          throw new Error('NHS number must be 10 digits');
        }
        
        // Check digit validation
        const digits = cleaned.split('').map(Number);
        const checkDigit = digits[9];
        const sum = digits.slice(0, 9).reduce((acc, digit, index) => acc + digit * (10 - index), 0);
        const remainder = sum % 11;
        const expectedCheckDigit = remainder === 0 ? 0 : 11 - remainder;
        
        if (expectedCheckDigit !== checkDigit && expectedCheckDigit !== 11) {
          throw new Error('Invalid NHS number check digit');
        }
        
        return cleaned;
      }]
    ]);
  }

  /**
   * Generate comprehensive AI-powered mapping recommendations
   */
  async generateMappingRecommendations(
    sourceData: any[], 
    targetSchema?: any,
    context?: {
      sourceSystemType: string;
      migrationPurpose: string;
      dataClassification: string;
    }
  ): Promise<MappingRecommendation[]> {
    if (!sourceData || sourceData.length === 0) {
      return [];
    }

    const recommendations: MappingRecommendation[] = [];
    const sampleRecord = sourceData[0];
    const sourceFields = Object.keys(sampleRecord);
    
    this.emit('mapping_analysis_started', { 
      fieldCount: sourceFields.length, 
      recordCount: sourceData.length 
    });

    // Analyze each source field
    for (const sourceField of sourceFields) {
      const fieldRecommendation = await this.analyzeField(
        sourceField, 
        sourceData, 
        context
      );
      
      if (fieldRecommendation) {
        recommendations.push(fieldRecommendation);
      }
    }

    // Detect data relationships
    const relationships = await this.detectDataRelationships(sourceData, recommendations);
    
    // Enhance recommendations with relationship context
    this.enhanceWithRelationships(recommendations, relationships);
    
    // Sort by confidence and clinical relevance
    recommendations.sort((a, b) => {
      const aRelevance = this.getSemanticAnalysis(a.targetField)?.clinicalRelevance || 'low';
      const bRelevance = this.getSemanticAnalysis(b.targetField)?.clinicalRelevance || 'low';
      
      const relevanceScore = { high: 3, medium: 2, low: 1 };
      
      if (relevanceScore[aRelevance] !== relevanceScore[bRelevance]) {
        return relevanceScore[bRelevance] - relevanceScore[aRelevance];
      }
      
      return b.confidence - a.confidence;
    });

    this.emit('mapping_analysis_completed', { 
      recommendationCount: recommendations.length,
      highConfidenceCount: recommendations.filter(r => r.confidence > 0.9).length
    });

    return recommendations;
  }

  private async analyzeField(
    sourceField: string, 
    sourceData: any[], 
    context?: any
  ): Promise<MappingRecommendation | null> {
    const fieldValues = sourceData.map(record => record[sourceField])
      .filter(value => value !== null && value !== undefined && value !== '');
    
    if (fieldValues.length === 0) {
      return null; // Skip empty fields
    }

    // Pattern matching
    const patternMatch = this.findBestPatternMatch(sourceField);
    
    if (patternMatch) {
      return await this.createRecommendationFromPattern(
        sourceField,
        patternMatch,
        fieldValues,
        context
      );
    }

    // Semantic analysis for unmapped fields
    return await this.performSemanticAnalysis(sourceField, fieldValues, context);
  }

  private findBestPatternMatch(sourceField: string): FieldPattern | null {
    let bestMatch: FieldPattern | null = null;
    let highestConfidence = 0;

    for (const pattern of this.healthcareFieldPatterns) {
      if (pattern.pattern.test(sourceField)) {
        if (pattern.confidence > highestConfidence) {
          bestMatch = pattern;
          highestConfidence = pattern.confidence;
        }
      }
    }

    return bestMatch;
  }

  private async createRecommendationFromPattern(
    sourceField: string,
    pattern: FieldPattern,
    fieldValues: any[],
    context?: any
  ): Promise<MappingRecommendation> {
    const sampleValue = fieldValues[0];
    const transformationFunction = this.getTransformationFunction(pattern.targetField);
    
    // Generate sample transformation
    let sampleOutput = sampleValue;
    let transformationExplanation = 'Direct mapping';
    
    if (transformationFunction) {
      try {
        sampleOutput = transformationFunction(sampleValue);
        transformationExplanation = `Transformed using ${pattern.transformationHint}`;
      } catch (error: unknown) {
        transformationExplanation = `Transformation needed: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`;
      }
    }

    // Calculate data quality impact
    const qualityImpact = await this.assessQualityImpact(fieldValues, pattern.targetField);
    
    // Generate alternative targets
    const alternatives = this.generateAlternativeTargets(sourceField, pattern.targetField);

    return {
      mappingId: uuidv4(),
      sourceField,
      targetField: pattern.targetField,
      confidence: pattern.confidence,
      reasoning: `Pattern match: ${pattern.context}`,
      transformationType: transformationFunction ? 'ai_suggested' : 'direct',
      transformationLogic: pattern.transformationHint,
      validationRules: this.generateValidationRules(pattern.targetField),
      sampleTransformation: {
        input: sampleValue,
        output: sampleOutput,
        explanation: transformationExplanation
      },
      alternativeTargets: alternatives,
      dataQualityImpact: qualityImpact
    };
  }

  private async performSemanticAnalysis(
    sourceField: string,
    fieldValues: any[],
    context?: any
  ): Promise<MappingRecommendation | null> {
    // Advanced semantic analysis for fields that don't match patterns
    const fieldLower = sourceField.toLowerCase();
    const sampleValue = fieldValues[0];
    
    // Healthcare-specific semantic analysis
    const semanticMappings = [
      {
        keywords: ['weight', 'mass', 'kg'],
        target: 'weight',
        confidence: 0.75,
        reasoning: 'Physical measurement field'
      },
      {
        keywords: ['height', 'tall', 'cm'],
        target: 'height',
        confidence: 0.75,
        reasoning: 'Physical measurement field'
      },
      {
        keywords: ['religion', 'faith', 'belief'],
        target: 'religion',
        confidence: 0.80,
        reasoning: 'Religious/spiritual preference'
      },
      {
        keywords: ['language', 'speak', 'tongue'],
        target: 'preferred_language',
        confidence: 0.78,
        reasoning: 'Communication preference'
      },
      {
        keywords: ['social', 'worker', 'authority'],
        target: 'social_worker',
        confidence: 0.72,
        reasoning: 'Social services contact'
      }
    ];

    for (const mapping of semanticMappings) {
      if (mapping.keywords.some(keyword => fieldLower.includes(keyword))) {
        const qualityImpact = await this.assessQualityImpact(fieldValues, mapping.target);
        
        return {
          mappingId: uuidv4(),
          sourceField,
          targetField: mapping.target,
          confidence: mapping.confidence,
          reasoning: mapping.reasoning,
          transformationType: 'semantic',
          transformationLogic: 'Semantic field analysis with healthcare context',
          validationRules: this.generateValidationRules(mapping.target),
          sampleTransformation: {
            input: sampleValue,
            output: sampleValue,
            explanation: 'Direct semantic mapping'
          },
          alternativeTargets: [],
          dataQualityImpact: qualityImpact
        };
      }
    }

    return null;
  }

  private getTransformationFunction(targetField: string): Function | null {
    const transformationMap: { [key: string]: string } = {
      'full_name': 'normalize_name',
      'first_name': 'normalize_name',
      'last_name': 'normalize_name',
      'date_of_birth': 'parse_uk_date',
      'phone_number': 'normalize_phone_uk',
      'postcode': 'normalize_postcode_uk',
      'nhs_number': 'validate_nhs_number',
      'current_medications': 'parse_medications'
    };

    const functionName = transformationMap[targetField];
    return functionName ? this.transformationLibrary.get(functionName) || null : null;
  }

  private async assessQualityImpact(fieldValues: any[], targetField: string): Promise<any> {
    const nonEmptyValues = fieldValues.filter(v => v !== null && v !== undefined && v !== '');
    const completeness = nonEmptyValues.length / fieldValues.length;
    
    // Assess accuracy based on field type
    let accuracy = 0.9; // Default high accuracy
    const semanticInfo = this.getSemanticAnalysis(targetField);
    
    if (semanticInfo?.clinicalRelevance === 'high') {
      // Higher standards for clinical fields
      accuracy = completeness > 0.95 ? 0.95 : completeness * 0.9;
    }
    
    // Assess consistency (similar values should have similar formats)
    const uniqueFormats = new Set();
    if (targetField === 'date_of_birth') {
      nonEmptyValues.forEach(value => {
        const dateStr = String(value);
        if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) uniqueFormats.add('ISO');
        else if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) uniqueFormats.add('UK');
        else uniqueFormats.add('OTHER');
      });
    }
    
    const consistency = uniqueFormats.size <= 1 ? 1.0 : 1.0 / uniqueFormats.size;
    
    return {
      completeness: Math.round(completeness * 100) / 100,
      accuracy: Math.round(accuracy * 100) / 100,
      consistency: Math.round(consistency * 100) / 100
    };
  }

  private generateAlternativeTargets(sourceField: string, primaryTarget: string): Array<{ field: string; confidence: number; reasoning: string }> {
    const alternatives: Array<{ field: string; confidence: number; reasoning: string }> = [];
    
    // Generate contextual alternatives based on source field
    const fieldLower = sourceField.toLowerCase();
    
    if (fieldLower.includes('name')) {
      if (primaryTarget === 'full_name') {
        alternatives.push(
          { field: 'first_name', confidence: 0.7, reasoning: 'Could be first name only' },
          { field: 'last_name', confidence: 0.6, reasoning: 'Could be surname only' }
        );
      }
    }
    
    if (fieldLower.includes('date')) {
      if (primaryTarget === 'date_of_birth') {
        alternatives.push(
          { field: 'admission_date', confidence: 0.4, reasoning: 'Could be admission date' },
          { field: 'assessment_date', confidence: 0.3, reasoning: 'Could be assessment date' }
        );
      }
    }
    
    if (fieldLower.includes('contact') || fieldLower.includes('phone')) {
      if (primaryTarget === 'phone_number') {
        alternatives.push(
          { field: 'emergency_contact_phone', confidence: 0.6, reasoning: 'Could be emergency contact' },
          { field: 'gp_phone', confidence: 0.4, reasoning: 'Could be GP contact' }
        );
      }
    }
    
    return alternatives;
  }

  private generateValidationRules(targetField: string): string[] {
    const validationMap: { [key: string]: string[] } = {
      'resident_id': ['Not null', 'Unique', 'Alphanumeric', 'Max 20 characters'],
      'nhs_number': ['Exactly 10 digits', 'Valid check digit', 'Unique'],
      'date_of_birth': ['Valid date', 'Age 18-120', 'Not future date'],
      'phone_number': ['UK format', 'Valid digits', 'Min 10 characters'],
      'postcode': ['UK postcode format', 'Valid area code'],
      'email': ['Valid email format', 'Max 255 characters'],
      'current_medications': ['Valid medication names', 'Structured format'],
      'known_allergies': ['Valid allergy types', 'No duplicates'],
      'care_level': ['Valid care level', 'One of: Low/Medium/High/Nursing'],
      'full_name': ['Not empty', 'Valid characters', 'Max 100 characters'],
      'gender': ['Valid gender', 'One of: male/female/other/prefer_not_to_say']
    };

    return validationMap[targetField] || ['Not empty', 'Valid format'];
  }

  private getSemanticAnalysis(targetField: string): SemanticAnalysis | null {
    return this.semanticRules.get(targetField) || null;
  }

  /**
   * Detect relationships between data fields
   */
  private async detectDataRelationships(
    sourceData: any[], 
    recommendations: MappingRecommendation[]
  ): Promise<DataRelationship[]> {
    const relationships: DataRelationship[] = [];
    
    // Detect hierarchical relationships
    const idFields = recommendations.filter(r => r.targetField.includes('id'));
    const nameFields = recommendations.filter(r => r.targetField.includes('name'));
    
    // Patient -> Contact relationships
    const patientIdField = recommendations.find(r => r.targetField === 'resident_id');
    const contactFields = recommendations.filter(r => 
      r.targetField.includes('contact') || r.targetField.includes('kin')
    );
    
    if (patientIdField && contactFields.length > 0) {
      for (const contactField of contactFields) {
        relationships.push({
          primaryField: patientIdField.targetField,
          relatedField: contactField.targetField,
          relationshipType: 'one_to_many',
          confidence: 0.85,
          description: 'Resident can have multiple emergency contacts'
        });
      }
    }

    // Medical data relationships
    const medFields = recommendations.filter(r => 
      ['current_medications', 'known_allergies', 'medical_history'].includes(r.targetField)
    );
    
    if (patientIdField && medFields.length > 0) {
      for (const medField of medFields) {
        relationships.push({
          primaryField: patientIdField.targetField,
          relatedField: medField.targetField,
          relationshipType: 'one_to_one',
          confidence: 0.90,
          description: 'Medical information belongs to specific resident'
        });
      }
    }

    return relationships;
  }

  private enhanceWithRelationships(
    recommendations: MappingRecommendation[], 
    relationships: DataRelationship[]
  ): void {
    for (const recommendation of recommendations) {
      const relatedRelationships = relationships.filter(r => 
        r.primaryField === recommendation.targetField || r.relatedField === recommendation.targetField
      );
      
      if (relatedRelationships.length > 0) {
        recommendation.reasoning += ` (Related to ${relatedRelationships.length} other field(s))`;
        recommendation.confidence = Math.min(recommendation.confidence + 0.05, 1.0);
      }
    }
  }

  /**
   * Learn from user feedback to improve future recommendations
   */
  async learnFromFeedback(feedback: {
    mappingId: string;
    accepted: boolean;
    userSelectedTarget?: string;
    userReasoning?: string;
    sourceField: string;
    originalRecommendation: string;
  }): Promise<void> {
    const cacheKey = `${feedback.sourceField.toLowerCase()}_${feedback.originalRecommendation}`;
    
    if (feedback.accepted) {
      // Positive feedback - increase confidence for similar patterns
      this.adjustPatternConfidence(feedback.sourceField, feedback.originalRecommendation, 0.05);
    } else {
      // Negative feedback - decrease confidence and learn alternative
      this.adjustPatternConfidence(feedback.sourceField, feedback.originalRecommendation, -0.1);
      
      if (feedback.userSelectedTarget) {
        // Learn new mapping preference
        await this.learnNewMapping(
          feedback.sourceField,
          feedback.userSelectedTarget,
          feedback.userReasoning || 'User preference'
        );
      }
    }

    this.emit('learning_updated', { 
      sourceField: feedback.sourceField,
      accepted: feedback.accepted,
      newTarget: feedback.userSelectedTarget
    });
  }

  private adjustPatternConfidence(sourceField: string, targetField: string, adjustment: number): void {
    for (const pattern of this.healthcareFieldPatterns) {
      if (pattern.pattern.test(sourceField) && pattern.targetField === targetField) {
        pattern.confidence = Math.max(0.1, Math.min(1.0, pattern.confidence + adjustment));
        break;
      }
    }
  }

  private async learnNewMapping(sourceField: string, targetField: string, reasoning: string): Promise<void> {
    // Create new pattern based on user feedback
    const newPattern: FieldPattern = {
      pattern: new RegExp(`^${sourceField.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      targetField,
      confidence: 0.7, // Start with moderate confidence
      context: reasoning,
      transformationHint: 'User-defined mapping'
    };
    
    this.healthcareFieldPatterns.push(newPattern);
  }

  /**
   * Batch process multiple datasets for mapping recommendations
   */
  async batchGenerateMappings(
    datasets: Array<{
      name: string;
      data: any[];
      context?: any;
    }>
  ): Promise<{ [datasetName: string]: MappingRecommendation[] }> {
    const results: { [datasetName: string]: MappingRecommendation[] } = {};
    
    for (const dataset of datasets) {
      this.emit('batch_processing', { 
        datasetName: dataset.name, 
        recordCount: dataset.data.length 
      });
      
      results[dataset.name] = await this.generateMappingRecommendations(
        dataset.data,
        undefined,
        dataset.context
      );
    }
    
    return results;
  }

  /**
   * Export mapping recommendations for review and modification
   */
  exportMappingTemplate(recommendations: MappingRecommendation[]): any {
    return {
      version: '1.0',
      generatedAt: new Date(),
      mappingCount: recommendations.length,
      mappings: recommendations.map(rec => ({
        sourceField: rec.sourceField,
        targetField: rec.targetField,
        transformationType: rec.transformationType,
        transformationLogic: rec.transformationLogic,
        confidence: rec.confidence,
        validationRules: rec.validationRules,
        userApproved: false,
        notes: ''
      })),
      instructions: [
        'Review each mapping for accuracy',
        'Modify target fields as needed',
        'Add custom transformation logic if required',
        'Set userApproved to true for confirmed mappings'
      ]
    };
  }

  /**
   * Import mapping template with user modifications
   */
  async importMappingTemplate(template: any): Promise<MappingRecommendation[]> {
    const recommendations: MappingRecommendation[] = [];
    
    for (const mapping of template.mappings) {
      if (mapping.userApproved) {
        recommendations.push({
          mappingId: uuidv4(),
          sourceField: mapping.sourceField,
          targetField: mapping.targetField,
          confidence: mapping.userApproved ? 1.0 : mapping.confidence,
          reasoning: mapping.userApproved ? 'User approved mapping' : 'Template import',
          transformationType: mapping.transformationType,
          transformationLogic: mapping.transformationLogic,
          validationRules: mapping.validationRules,
          sampleTransformation: {
            input: 'sample',
            output: 'transformed_sample',
            explanation: 'User-approved transformation'
          },
          alternativeTargets: [],
          dataQualityImpact: {
            completeness: 1.0,
            accuracy: 1.0,
            consistency: 1.0
          }
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Get mapping statistics and insights
   */
  getMappingStatistics(recommendations: MappingRecommendation[]): any {
    const stats = {
      totalMappings: recommendations.length,
      highConfidenceMappings: recommendations.filter(r => r.confidence > 0.9).length,
      mediumConfidenceMappings: recommendations.filter(r => r.confidence > 0.7 && r.confidence <= 0.9).length,
      lowConfidenceMappings: recommendations.filter(r => r.confidence <= 0.7).length,
      aiSuggestedMappings: recommendations.filter(r => r.transformationType === 'ai_suggested').length,
      directMappings: recommendations.filter(r => r.transformationType === 'direct').length,
      averageConfidence: recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length,
      fieldCoverage: {
        clinical: recommendations.filter(r => {
          const semantic = this.getSemanticAnalysis(r.targetField);
          return semantic?.healthcareContext.includes('clinical');
        }).length,
        administrative: recommendations.filter(r => {
          const semantic = this.getSemanticAnalysis(r.targetField);
          return semantic?.healthcareContext.includes('administrative');
        }).length,
        demographic: recommendations.filter(r => {
          const semantic = this.getSemanticAnalysis(r.targetField);
          return semantic?.healthcareContext.includes('demographic');
        }).length
      }
    };
    
    return {
      ...stats,
      qualityScore: this.calculateMappingQualityScore(stats),
      recommendations: this.generateMappingRecommendations(stats)
    };
  }

  private calculateMappingQualityScore(stats: any): number {
    let score = 0;
    
    // Base score from confidence levels
    score += (stats.highConfidenceMappings / stats.totalMappings) * 40;
    score += (stats.mediumConfidenceMappings / stats.totalMappings) * 25;
    score += (stats.lowConfidenceMappings / stats.totalMappings) * 10;
    
    // Bonus for AI assistance
    score += (stats.aiSuggestedMappings / stats.totalMappings) * 20;
    
    // Bonus for field coverage
    const totalCoverage = stats.fieldCoverage.clinical + stats.fieldCoverage.administrative + stats.fieldCoverage.demographic;
    score += Math.min(totalCoverage / stats.totalMappings, 1) * 15;
    
    return Math.round(Math.min(score, 100));
  }

  private generateMappingRecommendations(stats: any): string[] {
    const recommendations: any[] = [];
    
    if (stats.lowConfidenceMappings > stats.totalMappings * 0.3) {
      recommendations.push('Consider manual review of low-confidence mappings');
    }
    
    if (stats.fieldCoverage.clinical < 3) {
      recommendations.push('Ensure critical clinical fields are mapped');
    }
    
    if (stats.averageConfidence < 0.8) {
      recommendations.push('Review field mappings to improve overall confidence');
    }
    
    if (stats.aiSuggestedMappings === 0) {
      recommendations.push('Enable AI assistance for better mapping suggestions');
    }
    
    return recommendations;
  }
}

export default AIDataMappingService;