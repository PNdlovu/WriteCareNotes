/**
 * @fileoverview Policy Gap Analysis Service
 * @module PolicyGapService
 * @category Services
 * @subcategory Policy Intelligence
 * @version 1.0.0
 * @since 2025-10-07
 * 
 * @description
 * Service layer for Policy Gap Analysis API integration.
 * Handles fetching gap analysis data, creating policies from templates,
 * and managing gap remediation workflows.
 * 
 * @compliance
 * - GDPR Article 32 - Security of processing
 * - ISO 27001 - Information Security Management
 */

import { apiClient } from './apiClient';

/**
 * British Isles jurisdictions
 */
export type Jurisdiction = 
  | 'england'
  | 'wales'
  | 'scotland'
  | 'northern-ireland'
  | 'ireland'
  | 'jersey'
  | 'isle-of-man';

/**
 * Care service types
 */
export type ServiceType =
  | 'residential-care'
  | 'nursing-home'
  | 'domiciliary-care'
  | 'day-care'
  | 'supported-living'
  | 'specialist-care';

/**
 * Policy gap priority levels
 */
export type GapPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Policy gap interface
 */
export interface PolicyGap {
  id: string;
  policyName: string;
  category: string;
  priority: GapPriority;
  regulatoryRequirement: string;
  regulator: string;
  description: string;
  consequences: string[];
  recommendedTemplate?: string;
  benchmarkCoverage: number; // Percentage of similar organizations with this policy
}

/**
 * Gap analysis result
 */
export interface GapAnalysisResult {
  totalRequired: number;
  implemented: number;
  missing: number;
  coveragePercentage: number;
  gaps: PolicyGap[];
  categoryBreakdown: Record<string, { required: number; implemented: number }>;
}

/**
 * Fetch policy gap analysis
 * 
 * @param organizationId - Organization identifier
 * @param jurisdiction - British Isles jurisdiction
 * @param serviceType - Type of care service
 * @returns Gap analysis result
 * 
 * @example
 * ```ts
 * const analysis = await fetchGapAnalysis('org-123', 'england', 'residential-care');
 * console.log(`Coverage: ${analysis.coveragePercentage}%`);
 * ```
 */
export async function fetchGapAnalysis(
  organizationId: string,
  jurisdiction: Jurisdiction,
  serviceType: ServiceType
): Promise<GapAnalysisResult> {
  const response = await apiClient.get<GapAnalysisResult>(
    `/api/v1/organizations/${organizationId}/policy-gaps`,
    {
      params: {
        jurisdiction,
        serviceType
      }
    }
  );

  return response.data;
}

/**
 * Create policy from template
 * 
 * @param organizationId - Organization identifier
 * @param templateId - Policy template identifier
 * @param customization - Optional template customizations
 * @returns Created policy data
 * 
 * @example
 * ```ts
 * const policy = await createPolicyFromTemplate(
 *   'org-123',
 *   'template-safeguarding-adults',
 *   { jurisdiction: 'england' }
 * );
 * ```
 */
export async function createPolicyFromTemplate(
  organizationId: string,
  templateId: string,
  customization?: {
    jurisdiction?: Jurisdiction;
    serviceType?: ServiceType;
    customFields?: Record<string, any>;
  }
): Promise<{ policyId: string; policyName: string }> {
  const response = await apiClient.post(
    `/api/v1/organizations/${organizationId}/policies/from-template`,
    {
      templateId,
      ...customization
    }
  );

  return response.data;
}

/**
 * Mark gap as addressed
 * 
 * @param organizationId - Organization identifier
 * @param gapId - Gap identifier
 * @param policyId - Policy created to address gap
 * @returns Success confirmation
 * 
 * @example
 * ```ts
 * await markGapAddressed('org-123', 'gap-1', 'policy-456');
 * ```
 */
export async function markGapAddressed(
  organizationId: string,
  gapId: string,
  policyId: string
): Promise<{ success: boolean }> {
  const response = await apiClient.post(
    `/api/v1/organizations/${organizationId}/policy-gaps/${gapId}/addressed`,
    {
      policyId
    }
  );

  return response.data;
}

/**
 * Get gap remediation history
 * 
 * @param organizationId - Organization identifier
 * @param limit - Number of records to return
 * @returns Remediation history
 * 
 * @example
 * ```ts
 * const history = await getGapRemediationHistory('org-123', 10);
 * ```
 */
export async function getGapRemediationHistory(
  organizationId: string,
  limit = 20
): Promise<Array<{
  gapId: string;
  gapName: string;
  addressedDate: string;
  policyId: string;
  policyName: string;
  addressedBy: string;
}>> {
  const response = await apiClient.get(
    `/api/v1/organizations/${organizationId}/policy-gaps/history`,
    {
      params: { limit }
    }
  );

  return response.data;
}

/**
 * Export gap analysis report
 * 
 * @param organizationId - Organization identifier
 * @param jurisdiction - British Isles jurisdiction
 * @param format - Export format
 * @returns Blob containing report file
 * 
 * @example
 * ```ts
 * const blob = await exportGapAnalysisReport('org-123', 'england', 'pdf');
 * const url = window.URL.createObjectURL(blob);
 * window.open(url);
 * ```
 */
export async function exportGapAnalysisReport(
  organizationId: string,
  jurisdiction: Jurisdiction,
  format: 'pdf' | 'csv' | 'excel' = 'pdf'
): Promise<Blob> {
  const response = await apiClient.get(
    `/api/v1/organizations/${organizationId}/policy-gaps/export/${format}`,
    {
      params: { jurisdiction },
      responseType: 'blob'
    }
  );

  return response.data;
}
