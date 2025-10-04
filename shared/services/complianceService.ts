/**
 * @fileoverview Compliance Service
 * @module ComplianceService
 * @version 1.0.0
 * @description Healthcare compliance monitoring and reporting service
 */

import { apiClient, ApiResponse } from './apiClient'
import { encryptData } from '../utils/encryption'

// Types
export interface ComplianceReport {
  id: string
  organizationId: string
  reportType: 'cqc' | 'gdpr' | 'hipaa' | 'safeguarding' | 'medication' | 'infection_control'
  title: string
  description: string
  status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'under_review'
  score: number
  maxScore: number
  findings: ComplianceFinding[]
  recommendations: ComplianceRecommendation[]
  evidence: ComplianceEvidence[]
  assessedBy: string
  assessmentDate: string
  nextAssessmentDate: string
  createdAt: string
  updatedAt: string
}

export interface ComplianceFinding {
  id: string
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  requirement: string
  evidence?: string
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk'
  assignedTo?: string
  dueDate?: string
  resolutionNotes?: string
}

export interface ComplianceRecommendation {
  id: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  description: string
  actionRequired: string
  expectedOutcome: string
  timeline: string
  responsible: string
  status: 'pending' | 'in_progress' | 'completed' | 'deferred'
}

export interface ComplianceEvidence {
  id: string
  type: 'document' | 'photo' | 'video' | 'audit_log' | 'certificate' | 'training_record'
  title: string
  description: string
  fileUrl?: string
  uploadedBy: string
  uploadedAt: string
  expiryDate?: string
  tags: string[]
}

export interface GDPRRequest {
  id: string
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection'
  subjectId: string
  subjectName: string
  requestDetails: string
  status: 'received' | 'processing' | 'completed' | 'rejected' | 'partially_fulfilled'
  requestedBy: string
  requestedAt: string
  processedBy?: string
  processedAt?: string
  responseDetails?: string
  evidence?: string[]
}

export interface AuditTrail {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  resourceId: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: string
  sessionId: string
  organizationId: string
  complianceRelevant: boolean
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted'
}

export interface SafeguardingAlert {
  id: string
  residentId: string
  residentName: string
  alertType: 'physical_abuse' | 'emotional_abuse' | 'sexual_abuse' | 'financial_abuse' | 'neglect' | 'discrimination'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  reportedBy: string
  reportedAt: string
  status: 'reported' | 'investigating' | 'resolved' | 'unfounded'
  investigatedBy?: string
  investigationNotes?: string
  actionsTaken?: string[]
  evidence?: string[]
  externalReporting?: {
    cqc: boolean
    police: boolean
    localAuthority: boolean
    reportedAt?: string
  }
}

class ComplianceService {
  private readonly endpoints = {
    reports: '/compliance/reports',
    findings: '/compliance/findings',
    gdpr: '/compliance/gdpr',
    audits: '/compliance/audit-trail',
    safeguarding: '/compliance/safeguarding',
    training: '/compliance/training',
    policies: '/compliance/policies',
    certificates: '/compliance/certificates'
  }

  // Compliance Reports
  async getComplianceReports(params?: {
    type?: string
    status?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<ApiResponse<ComplianceReport[]>> {
    return apiClient.get(this.endpoints.reports, { params })
  }

  async getComplianceReport(id: string): Promise<ApiResponse<ComplianceReport>> {
    return apiClient.get(`${this.endpoints.reports}/${id}`)
  }

  async createComplianceReport(reportData: Omit<ComplianceReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ComplianceReport>> {
    return apiClient.post(this.endpoints.reports, reportData)
  }

  async updateComplianceReport(id: string, updates: Partial<ComplianceReport>): Promise<ApiResponse<ComplianceReport>> {
    return apiClient.put(`${this.endpoints.reports}/${id}`, updates)
  }

  // CQC Specific Reports
  async generateCQCReport(params: {
    dateFrom: string
    dateTo: string
    includeResidents?: boolean
    includeMedication?: boolean
    includeSafeguarding?: boolean
  }): Promise<ApiResponse<ComplianceReport>> {
    return apiClient.post(`${this.endpoints.reports}/cqc`, params)
  }

  // GDPR Compliance
  async getGDPRRequests(params?: {
    status?: string
    type?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<ApiResponse<GDPRRequest[]>> {
    return apiClient.get(this.endpoints.gdpr, { params })
  }

  async createGDPRRequest(requestData: Omit<GDPRRequest, 'id' | 'requestedAt'>): Promise<ApiResponse<GDPRRequest>> {
    return apiClient.post(this.endpoints.gdpr, requestData)
  }

  async processGDPRRequest(id: string, response: {
    status: GDPRRequest['status']
    responseDetails: string
    evidence?: string[]
  }): Promise<ApiResponse<GDPRRequest>> {
    return apiClient.put(`${this.endpoints.gdpr}/${id}/process`, response)
  }

  async exportPersonalData(subjectId: string): Promise<ApiResponse<any>> {
    return apiClient.get(`${this.endpoints.gdpr}/export/${subjectId}`)
  }

  async deletePersonalData(subjectId: string, reason: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.endpoints.gdpr}/delete/${subjectId}`, {
      data: { reason }
    })
  }

  // Audit Trail
  async getAuditTrail(params?: {
    userId?: string
    resource?: string
    dateFrom?: string
    dateTo?: string
    action?: string
    complianceRelevant?: boolean
  }): Promise<ApiResponse<AuditTrail[]>> {
    return apiClient.get(this.endpoints.audits, { params })
  }

  async logAuditEvent(eventData: Omit<AuditTrail, 'id' | 'timestamp'>): Promise<ApiResponse<AuditTrail>> {
    const encryptedData = {
      ...eventData,
      details: encryptData(JSON.stringify(eventData.details))
    }
    return apiClient.post(this.endpoints.audits, encryptedData)
  }

  async generateAuditReport(params: {
    dateFrom: string
    dateTo: string
    includeSystemEvents?: boolean
    includeUserActions?: boolean
    includeDataAccess?: boolean
  }): Promise<ApiResponse<any>> {
    return apiClient.post(`${this.endpoints.audits}/report`, params)
  }

  // Safeguarding
  async getSafeguardingAlerts(params?: {
    status?: string
    severity?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<ApiResponse<SafeguardingAlert[]>> {
    return apiClient.get(this.endpoints.safeguarding, { params })
  }

  async createSafeguardingAlert(alertData: Omit<SafeguardingAlert, 'id' | 'reportedAt'>): Promise<ApiResponse<SafeguardingAlert>> {
    const encryptedData = {
      ...alertData,
      description: encryptData(alertData.description)
    }
    return apiClient.post(this.endpoints.safeguarding, encryptedData)
  }

  async updateSafeguardingAlert(id: string, updates: Partial<SafeguardingAlert>): Promise<ApiResponse<SafeguardingAlert>> {
    const encryptedUpdates = { ...updates }
    if (updates.description) {
      encryptedUpdates.description = encryptData(updates.description)
    }
    if (updates.investigationNotes) {
      encryptedUpdates.investigationNotes = encryptData(updates.investigationNotes)
    }
    return apiClient.put(`${this.endpoints.safeguarding}/${id}`, encryptedUpdates)
  }

  // Training Compliance
  async getTrainingRecords(params?: {
    staffId?: string
    courseType?: string
    status?: string
    expiryDate?: string
  }): Promise<ApiResponse<any[]>> {
    return apiClient.get(this.endpoints.training, { params })
  }

  async recordTrainingCompletion(trainingData: {
    staffId: string
    courseId: string
    courseName: string
    completedAt: string
    expiryDate?: string
    certificateUrl?: string
    score?: number
  }): Promise<ApiResponse<any>> {
    return apiClient.post(this.endpoints.training, trainingData)
  }

  async getTrainingComplianceReport(): Promise<ApiResponse<any>> {
    return apiClient.get(`${this.endpoints.training}/compliance-report`)
  }

  // Policy Management
  async getPolicies(params?: {
    category?: string
    status?: string
    reviewDate?: string
  }): Promise<ApiResponse<any[]>> {
    return apiClient.get(this.endpoints.policies, { params })
  }

  async createPolicy(policyData: any): Promise<ApiResponse<any>> {
    return apiClient.post(this.endpoints.policies, policyData)
  }

  async updatePolicy(id: string, updates: any): Promise<ApiResponse<any>> {
    return apiClient.put(`${this.endpoints.policies}/${id}`, updates)
  }

  async acknowledgePolicy(id: string): Promise<ApiResponse<any>> {
    return apiClient.post(`${this.endpoints.policies}/${id}/acknowledge`)
  }

  // Certificates and Registrations
  async getCertificates(params?: {
    type?: string
    status?: string
    expiryDate?: string
  }): Promise<ApiResponse<any[]>> {
    return apiClient.get(this.endpoints.certificates, { params })
  }

  async uploadCertificate(certificateData: {
    type: string
    name: string
    issuer: string
    issuedDate: string
    expiryDate: string
    fileUrl: string
  }): Promise<ApiResponse<any>> {
    return apiClient.post(this.endpoints.certificates, certificateData)
  }

  async renewCertificate(id: string, renewalData: any): Promise<ApiResponse<any>> {
    return apiClient.post(`${this.endpoints.certificates}/${id}/renew`, renewalData)
  }

  // Compliance Dashboard
  async getComplianceDashboard(): Promise<ApiResponse<{
    overallScore: number
    cqcStatus: string
    gdprCompliance: number
    safeguardingAlerts: number
    trainingCompliance: number
    policyCompliance: number
    certificateStatus: any[]
    recentFindings: ComplianceFinding[]
    upcomingDeadlines: any[]
  }>> {
    return apiClient.get('/compliance/dashboard')
  }

  // Risk Assessment
  async performRiskAssessment(assessmentData: {
    type: string
    scope: string
    criteria: any[]
    assessor: string
  }): Promise<ApiResponse<any>> {
    return apiClient.post('/compliance/risk-assessment', assessmentData)
  }

  // Incident Reporting
  async reportComplianceIncident(incidentData: {
    type: string
    severity: string
    description: string
    affectedResidents?: string[]
    reportedBy: string
    immediateAction?: string
  }): Promise<ApiResponse<any>> {
    const encryptedData = {
      ...incidentData,
      description: encryptData(incidentData.description)
    }
    return apiClient.post('/compliance/incidents', encryptedData)
  }

  // Data Breach Response
  async reportDataBreach(breachData: {
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    affectedDataTypes: string[]
    affectedRecords: number
    discoveredAt: string
    containedAt?: string
    notificationRequired: boolean
  }): Promise<ApiResponse<any>> {
    const encryptedData = {
      ...breachData,
      description: encryptData(breachData.description)
    }
    return apiClient.post('/compliance/data-breach', encryptedData)
  }
}

/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const complianceService = new ComplianceService()
export default complianceService