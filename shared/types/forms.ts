/**
 * @fileoverview Form Types
 * @module FormTypes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Shared types for form system and form builder
 */

export enum FormFieldType {
  TEXT = 'text',
  EMAIL = 'email',
  NUMBER = 'number',
  DATE = 'date',
  DATETIME = 'datetime',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  FILE_UPLOAD = 'file_upload',
  SIGNATURE = 'signature',
  RATING = 'rating',
  SLIDER = 'slider',
  ADDRESS = 'address',
  PHONE = 'phone',
  NHS_NUMBER = 'nhs_number',
  MEDICAL_CONDITION = 'medical_condition'
}

export enum ValidationRule {
  REQUIRED = 'required',
  MIN_LENGTH = 'min_length',
  MAX_LENGTH = 'max_length',
  MIN_VALUE = 'min_value',
  MAX_VALUE = 'max_value',
  PATTERN = 'pattern',
  EMAIL_FORMAT = 'email_format',
  UK_POSTCODE = 'uk_postcode',
  NHS_NUMBER_FORMAT = 'nhs_number_format',
  PHONE_NUMBER = 'phone_number',
  CUSTOM_VALIDATION = 'custom_validation'
}

export interface FormField {
  fieldId: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: FormFieldType;
  description?: string;
  placeholder?: string;
  defaultValue?: any;
  
  // Validation
  validationRules: Array<{
    rule: ValidationRule;
    value?: any;
    message: string;
  }>;
  
  // Options for select/radio fields
  options?: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  
  // Conditional Logic
  conditionalLogic?: {
    showIf: Array<{
      fieldId: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
      value: any;
    }>;
    requiredIf?: Array<{
      fieldId: string;
      operator: string;
      value: any;
    }>;
  };
  
  // Layout and Styling
  layout: {
    row: number;
    column: number;
    width: number; // 1-12 (bootstrap grid)
    cssClasses?: string[];
  };
  
  // Data Handling
  dataBinding?: {
    entityType: string;
    entityField: string;
    transformation?: string;
  };
  
  // Security
  encrypted: boolean;
  gdprCategory: 'personal' | 'sensitive' | 'clinical' | 'financial';
  retentionPeriod: number; // days
}

export interface FormDefinition {
  formId: string;
  formName: string;
  formTitle: string;
  description: string;
  version: string;
  
  // Form Configuration
  isActive: boolean;
  isPublished: boolean;
  multiPage: boolean;
  allowSaveDraft: boolean;
  requiresAuthentication: boolean;
  
  // Form Structure
  pages: Array<{
    pageId: string;
    pageTitle: string;
    pageDescription?: string;
    fields: FormField[];
    navigationRules?: {
      nextPage?: string;
      previousPage?: string;
      skipConditions?: any[];
    };
  }>;
  
  // Submission Handling
  submissionSettings: {
    allowMultipleSubmissions: boolean;
    submissionLimit?: number;
    confirmationMessage: string;
    redirectUrl?: string;
    emailConfirmation: boolean;
    autoSave: boolean;
    autoSaveInterval: number; // seconds
  };
  
  // Workflow Integration
  workflowIntegration?: {
    triggerWorkflow: boolean;
    workflowId: string;
    approvalRequired: boolean;
    approvers: string[];
    escalationRules: any[];
  };
  
  // Compliance
  complianceSettings: {
    gdprCompliant: boolean;
    dataRetentionDays: number;
    consentRequired: boolean;
    auditTrail: boolean;
    digitalSignatureRequired: boolean;
  };
  
  // Analytics
  analyticsEnabled: boolean;
  trackingEvents: string[];
}

export interface FormSubmission {
  submissionId: string;
  formId: string;
  formVersion: string;
  submittedBy: string;
  submittedDate: Date;
  
  // Submission Data
  formData: { [fieldId: string]: any };
  encryptedFields: string[];
  
  // Status
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'processed';
  
  // Approval Workflow
  approvalHistory: Array<{
    approvedBy: string;
    approvedDate: Date;
    decision: 'approved' | 'rejected';
    comments?: string;
  }>;
  
  // Compliance
  consentGiven: boolean;
  consentTimestamp?: Date;
  digitalSignature?: {
    signedBy: string;
    signedDate: Date;
    signatureData: string;
    ipAddress: string;
  };
  
  // Processing
  processedDate?: Date;
  processedBy?: string;
  processingNotes?: string;
}

export interface FormAnalytics {
  formPerformance: {
    totalSubmissions: number;
    completionRate: number;
    averageCompletionTime: number; // minutes
    abandonmentRate: number;
    errorRate: number;
  };
  fieldAnalytics: Array<{
    fieldId: string;
    fieldName: string;
    completionRate: number;
    errorRate: number;
    averageTimeSpent: number;
    commonErrors: string[];
  }>;
  userBehavior: {
    averagePageTime: { [pageId: string]: number };
    dropoffPoints: string[];
    mostProblematicFields: string[];
    mobileUsageRate: number;
  };
  complianceMetrics: {
    consentRate: number;
    gdprCompliance: number;
    auditTrailCompleteness: number;
    dataRetentionCompliance: number;
  };
}

export interface FormTemplate {
  templateId: string;
  templateName: string;
  description: string;
  category: 'admission' | 'assessment' | 'medication' | 'incident' | 'care_plan' | 'general';
  formDefinition: FormDefinition;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  rating: number;
  tags: string[];
}

export interface AIFormSuggestion {
  suggestionId: string;
  suggestionType: 'field' | 'validation' | 'layout' | 'optimization';
  title: string;
  description: string;
  confidence: number; // 0-1
  fields?: FormField[];
  validationRules?: Array<{
    rule: ValidationRule;
    value?: any;
    message: string;
  }>;
  layoutSuggestions?: {
    fieldId: string;
    suggestedLayout: {
      row: number;
      column: number;
      width: number;
    };
  }[];
  optimizationSuggestions?: {
    type: 'performance' | 'accessibility' | 'usability';
    description: string;
    impact: 'low' | 'medium' | 'high';
  }[];
}

export interface FormBuilderState {
  currentForm: FormDefinition;
  selectedField: FormField | null;
  selectedPage: number;
  isDirty: boolean;
  validationErrors: Array<{
    fieldId: string;
    error: string;
  }>;
  aiSuggestions: AIFormSuggestion[];
  isGeneratingAI: boolean;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Array<{
    fieldId: string;
    fieldName: string;
    error: string;
  }>;
  warnings: Array<{
    fieldId: string;
    fieldName: string;
    warning: string;
  }>;
}

export interface FormSubmissionResult {
  success: boolean;
  submissionId?: string;
  errors?: string[];
  warnings?: string[];
  redirectUrl?: string;
}

export interface FormAccessibilitySettings {
  screenReaderSupport: boolean;
  keyboardNavigation: boolean;
  highContrastMode: boolean;
  largeTextSupport: boolean;
  colorBlindSupport: boolean;
  ariaLabels: boolean;
  focusManagement: boolean;
}

export interface FormLocalization {
  language: string;
  translations: {
    [key: string]: string;
  };
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  currency: string;
}

export interface FormIntegration {
  webhookUrl?: string;
  apiEndpoint?: string;
  authentication?: {
    type: 'bearer' | 'basic' | 'api_key';
    credentials: any;
  };
  dataMapping: {
    [fieldId: string]: string;
  };
  transformationRules?: {
    [fieldId: string]: {
      type: 'format' | 'calculate' | 'lookup';
      rules: any;
    };
  };
}

export interface FormSecuritySettings {
  encryptionEnabled: boolean;
  encryptionAlgorithm: string;
  accessControl: {
    roles: string[];
    permissions: string[];
  };
  auditLogging: boolean;
  dataRetention: {
    enabled: boolean;
    period: number; // days
    autoDelete: boolean;
  };
  gdprCompliance: {
    dataMinimization: boolean;
    purposeLimitation: boolean;
    storageLimitation: boolean;
    consentManagement: boolean;
  };
}