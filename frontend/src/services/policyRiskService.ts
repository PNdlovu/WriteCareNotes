/**
 * @fileoverview Policy Risk Management Service
 * @module PolicyRiskService
 * @category Services
 * @subcategory Policy Intelligence
 * @version 1.0.0
 * @since 2025-10-07
 * 
 * @description
 * Service layer for Policy Risk Management API integration.
 * Handles fetching risk scores, alerts, trends, and managing risk mitigation.
 * 
 * @compliance
 * - ISO 27001 - Risk Management
 * - GDPR Article 32 - Risk Assessment
 */

import { apiClient } from './apiClient';

/**
 * Risk level classification
 */
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'minimal';

/**
 * Policy risk assessment
 */
export interface PolicyRisk {
  policyId: string;
  policyName: string;
  category: string;
  overallRisk: number; // 0-100
  riskLevel: RiskLevel;
  factors: {
    ageScore: number;
    acknowledgmentScore: number;
    violationScore: number;
    updateFrequencyScore: number;
  };
  trend: 'increasing' | 'decreasing' | 'stable';
  lastReviewDate: string;
  nextReviewDate: string;
  acknowledgmentRate: number;
  violationCount: number;
  recommendedActions: string[];
}

/**
 * Risk alert
 */
export interface RiskAlert {
  id: string;
  policyId: string;
  policyName: string;
  severity: RiskLevel;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

/**
 * Risk trend data point
 */
export interface RiskTrendPoint {
  date: string;
  averageRisk: number;
  criticalPolicies: number;
  highRiskPolicies: number;
}

/**
 * Fetch policy risk assessments
 * 
 * @param organizationId - Organization identifier
 * @param filters - Optional filters
 * @returns Array of policy risk assessments
 * 
 * @example
 * ```ts
 * const risks = await fetchPolicyRisks('org-123', { riskLevel: 'high' });
 * ```
 */
export async function fetchPolicyRisks(
  organizationId: string,
  filters?: {
    riskLevel?: RiskLevel;
    category?: string;
    minScore?: number;
  }
): Promise<PolicyRisk[]> {
  const response = await apiClient.get<PolicyRisk[]>(
    `/api/v1/organizations/${organizationId}/policy-risks`,
    {
      params: filters
    }
  );

  return response.data;
}

/**
 * Fetch active risk alerts
 * 
 * @param organizationId - Organization identifier
 * @param includeAcknowledged - Whether to include acknowledged alerts
 * @returns Array of risk alerts
 * 
 * @example
 * ```ts
 * const alerts = await fetchRiskAlerts('org-123', false);
 * ```
 */
export async function fetchRiskAlerts(
  organizationId: string,
  includeAcknowledged = false
): Promise<RiskAlert[]> {
  const response = await apiClient.get<RiskAlert[]>(
    `/api/v1/organizations/${organizationId}/risk-alerts`,
    {
      params: { includeAcknowledged }
    }
  );

  return response.data;
}

/**
 * Acknowledge risk alert
 * 
 * @param alertId - Alert identifier
 * @param notes - Optional acknowledgment notes
 * @returns Success confirmation
 * 
 * @example
 * ```ts
 * await acknowledgeAlert('alert-123', 'Scheduled policy review for next week');
 * ```
 */
export async function acknowledgeAlert(
  alertId: string,
  notes?: string
): Promise<{ success: boolean }> {
  const response = await apiClient.post(
    `/api/v1/risk-alerts/${alertId}/acknowledge`,
    { notes }
  );

  return response.data;
}

/**
 * Fetch risk trend data
 * 
 * @param organizationId - Organization identifier
 * @param days - Number of days to retrieve (default: 30)
 * @returns Array of risk trend data points
 * 
 * @example
 * ```ts
 * const trends = await fetchRiskTrends('org-123', 90);
 * ```
 */
export async function fetchRiskTrends(
  organizationId: string,
  days = 30
): Promise<RiskTrendPoint[]> {
  const response = await apiClient.get<RiskTrendPoint[]>(
    `/api/v1/organizations/${organizationId}/risk-trends`,
    {
      params: { days }
    }
  );

  return response.data;
}

/**
 * Update policy risk threshold
 * 
 * @param organizationId - Organization identifier
 * @param threshold - Risk score threshold for alerts (0-100)
 * @returns Updated threshold configuration
 * 
 * @example
 * ```ts
 * await updateRiskThreshold('org-123', 75);
 * ```
 */
export async function updateRiskThreshold(
  organizationId: string,
  threshold: number
): Promise<{ threshold: number }> {
  const response = await apiClient.put(
    `/api/v1/organizations/${organizationId}/risk-threshold`,
    { threshold }
  );

  return response.data;
}

/**
 * Recalculate risk score for a specific policy
 * 
 * @param policyId - Policy identifier
 * @returns Updated risk assessment
 * 
 * @example
 * ```ts
 * const updatedRisk = await recalculatePolicyRisk('policy-456');
 * ```
 */
export async function recalculatePolicyRisk(
  policyId: string
): Promise<PolicyRisk> {
  const response = await apiClient.post<PolicyRisk>(
    `/api/v1/policies/${policyId}/recalculate-risk`
  );

  return response.data;
}

/**
 * Export risk report
 * 
 * @param organizationId - Organization identifier
 * @param format - Export format
 * @param filters - Optional filters
 * @returns Blob containing report file
 * 
 * @example
 * ```ts
 * const blob = await exportRiskReport('org-123', 'pdf');
 * const url = window.URL.createObjectURL(blob);
 * window.open(url);
 * ```
 */
export async function exportRiskReport(
  organizationId: string,
  format: 'pdf' | 'csv' | 'excel' = 'pdf',
  filters?: {
    riskLevel?: RiskLevel;
    category?: string;
  }
): Promise<Blob> {
  const response = await apiClient.get(
    `/api/v1/organizations/${organizationId}/risk-report/export/${format}`,
    {
      params: filters,
      responseType: 'blob'
    }
  );

  return response.data;
}
