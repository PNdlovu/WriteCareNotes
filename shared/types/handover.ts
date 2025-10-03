/**
 * @fileoverview Handover Types
 * @module HandoverTypes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Shared types for handover summaries and related data structures
 */

export interface HandoverSummary {
  summaryId: string;
  handoverDate: Date;
  shiftType: 'day' | 'evening' | 'night';
  departmentId: string;
  generatedBy: string;
  
  // Structured Summary Sections
  residents: {
    totalResidents: number;
    newAdmissions: number;
    discharges: number;
    criticalUpdates: ResidentSummary[];
    medicationChanges: MedicationSummary[];
    carePlanUpdates: CarePlanSummary[];
  };
  
  medications: {
    totalMedications: number;
    newMedications: number;
    discontinuedMedications: number;
    doseChanges: number;
    prnGiven: number;
    medicationAlerts: MedicationAlert[];
  };
  
  incidents: {
    totalIncidents: number;
    criticalIncidents: number;
    falls: number;
    medicationErrors: number;
    behavioralIncidents: number;
    incidentDetails: IncidentSummary[];
  };
  
  alerts: {
    totalAlerts: number;
    criticalAlerts: number;
    medicalAlerts: number;
    safetyAlerts: number;
    familyAlerts: number;
    alertDetails: AlertSummary[];
  };
  
  // AI Processing Metadata
  aiProcessing: {
    processingTime: number; // milliseconds
    confidenceScore: number; // 0-1
    dataSources: string[];
    modelVersion: string;
    qualityScore: number; // 0-100
  };
  
  // Compliance
  gdprCompliant: boolean;
  piiMasked: boolean;
  auditTrail: AuditEntry[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ResidentSummary {
  residentId: string;
  residentName: string; // Masked if PII protection enabled
  roomNumber: string;
  careLevel: string;
  keyUpdates: string[];
  concerns: string[];
  actionRequired: boolean;
  followUpDate?: Date;
}

export interface MedicationSummary {
  residentId: string;
  medicationName: string;
  changeType: 'new' | 'dose_change' | 'frequency_change' | 'discontinued' | 'withheld';
  details: string;
  prescriber: string;
  timeOfChange: Date;
  monitoringRequired: boolean;
}

export interface CarePlanSummary {
  residentId: string;
  carePlanId: string;
  updateType: 'assessment' | 'goal_change' | 'intervention_added' | 'intervention_modified';
  description: string;
  updatedBy: string;
  effectiveDate: Date;
}

export interface MedicationAlert {
  alertId: string;
  residentId: string;
  medicationName: string;
  alertType: 'interaction' | 'allergy' | 'overdose_risk' | 'missed_dose' | 'side_effect';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  actionRequired: string;
  reportedBy: string;
  reportedAt: Date;
}

export interface IncidentSummary {
  incidentId: string;
  incidentType: string;
  residentId?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timeOccurred: Date;
  actionsTaken: string[];
  followUpRequired: boolean;
  familyNotified: boolean;
}

export interface AlertSummary {
  alertId: string;
  alertType: 'medical' | 'safety' | 'behavioral' | 'family' | 'equipment' | 'environmental';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  residentId?: string;
  location?: string;
  timeRaised: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  assignedTo?: string;
}

export interface AuditEntry {
  action: string;
  timestamp: Date;
  userId: string;
  details: Record<string, any>;
  complianceFlags: string[];
}

export interface HandoverDataInput {
  shiftNotes: string[];
  incidents: any[];
  carePlanUpdates: any[];
  medicationChanges: any[];
  residentUpdates: any[];
  criticalAlerts: any[];
  environmentalConcerns: any[];
  equipmentIssues: any[];
  staffNotes: string[];
  familyCommunications: any[];
}

export interface SummarizationRequest {
  handoverData: HandoverDataInput;
  departmentId: string;
  shiftType: 'day' | 'evening' | 'night';
  handoverDate: Date;
  requestedBy: string;
  organizationId: string;
  tenantId: string;
  options: {
    includePII: boolean;
    detailLevel: 'summary' | 'detailed' | 'comprehensive';
    focusAreas: string[];
    excludeResidents?: string[];
  };
}

export interface HandoverAnalytics {
  totalSummaries: number;
  averageProcessingTime: number;
  averageQualityScore: number;
  averageConfidenceScore: number;
  totalResidents: number;
  totalIncidents: number;
  totalAlerts: number;
  qualityTrends: QualityTrend[];
  processingTimeTrends: ProcessingTimeTrend[];
}

export interface QualityTrend {
  date: Date;
  qualityScore: number;
  confidenceScore: number;
}

export interface ProcessingTimeTrend {
  date: Date;
  processingTime: number;
}

export interface HandoverTemplate {
  templateId: string;
  templateName: string;
  description: string;
  shiftType: 'day' | 'evening' | 'night' | 'all';
  departmentId?: string;
  sections: HandoverTemplateSection[];
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HandoverTemplateSection {
  sectionId: string;
  sectionName: string;
  sectionType: 'residents' | 'medications' | 'incidents' | 'alerts' | 'general';
  required: boolean;
  order: number;
  fields: HandoverTemplateField[];
}

export interface HandoverTemplateField {
  fieldId: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'date' | 'number';
  required: boolean;
  options?: string[];
  defaultValue?: any;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface HandoverGenerationOptions {
  dataSources: {
    shiftNotes: boolean;
    incidents: boolean;
    carePlanUpdates: boolean;
    medicationChanges: boolean;
    residentUpdates: boolean;
    criticalAlerts: boolean;
    environmentalConcerns: boolean;
    equipmentIssues: boolean;
    staffNotes: boolean;
    familyCommunications: boolean;
  };
  outputOptions: {
    includePII: boolean;
    detailLevel: 'summary' | 'detailed' | 'comprehensive';
    focusAreas: string[];
    excludeResidents: string[];
    format: 'markdown' | 'html' | 'pdf' | 'json';
  };
  aiOptions: {
    modelVersion: string;
    temperature: number;
    maxTokens: number;
    customPrompt?: string;
  };
}

export interface HandoverExportOptions {
  format: 'pdf' | 'html' | 'markdown' | 'json' | 'csv';
  includeCharts: boolean;
  includeRawData: boolean;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  filters: {
    shiftTypes: string[];
    departments: string[];
    qualityThreshold: number;
  };
}