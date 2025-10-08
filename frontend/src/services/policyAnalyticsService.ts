/**
 * @fileoverview Policy Analytics Service
 * @module PolicyAnalyticsService
 * @category Services
 * @subcategory Policy Intelligence
 * @version 1.0.0
 * @since 2025-10-07
 * 
 * @description
 * Service layer for Policy Analytics API integration.
 * Handles fetching effectiveness metrics, ROI data, violation patterns,
 * and generating executive reports.
 * 
 * @compliance
 * - ISO 27001 - Performance Metrics
 * - GDPR Article 32 - Monitoring & Analytics
 */

import { apiClient } from './apiClient';

/**
 * Time period options for analytics
 */
export type AnalyticsPeriod = '7days' | '30days' | '90days' | '1year' | 'all-time';

/**
 * Report formats
 */
export type ReportFormat = 'pdf' | 'excel' | 'csv';

/**
 * Report scheduling frequency
 */
export type ReportFrequency = 'daily' | 'weekly' | 'monthly';

/**
 * Policy effectiveness metrics
 */
export interface PolicyEffectiveness {
  policyId: string;
  policyName: string;
  category: string;
  effectivenessScore: number; // 0-100
  acknowledgmentRate: number; // 0-100
  avgTimeToAcknowledge: number; // hours
  violationRate: number; // violations per 1000 acknowledgments
  complianceImprovement: number; // percentage change
  forecastedAcknowledgment: number; // predicted acknowledgment rate (7 days)
}

/**
 * ROI metrics
 */
export interface ROIMetrics {
  timeSaved: {
    hours: number;
    value: number; // monetary value
  };
  violationsPrevented: {
    count: number;
    potentialFines: number;
  };
  costAvoidance: {
    total: number;
    breakdown: {
      regulatoryFines: number;
      staffTime: number;
      rework: number;
      automation: number;
    };
  };
  complianceImprovement: number; // percentage
  staffProductivityGain: number; // percentage
  period: AnalyticsPeriod;
}

/**
 * Violation pattern
 */
export interface ViolationPattern {
  category: string;
  violationCount: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  commonCauses: Array<{
    cause: string;
    frequency: number;
    percentage: number;
  }>;
  topPolicies: Array<{
    policyId: string;
    policyName: string;
    violationCount: number;
  }>;
  recommendations: string[];
}

/**
 * Acknowledgment forecast
 */
export interface AcknowledgmentForecast {
  date: string;
  predicted: number;
  confidence: number; // 0-100
}

/**
 * Executive summary
 */
export interface ExecutiveSummary {
  period: AnalyticsPeriod;
  highlights: {
    totalPolicies: number;
    averageEffectiveness: number;
    totalROI: number;
    complianceRate: number;
  };
  topPerformers: Array<{
    policyName: string;
    metric: string;
    value: number;
  }>;
  areasOfConcern: Array<{
    area: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
  }>;
  recommendations: string[];
}

/**
 * Fetch policy effectiveness metrics
 * 
 * @param organizationId - Organization identifier
 * @param period - Time period for analytics
 * @returns Array of effectiveness metrics
 * 
 * @example
 * ```ts
 * const metrics = await fetchPolicyEffectiveness('org-123', '30days');
 * ```
 */
export async function fetchPolicyEffectiveness(
  organizationId: string,
  period: AnalyticsPeriod = '30days'
): Promise<PolicyEffectiveness[]> {
  const response = await apiClient.get<PolicyEffectiveness[]>(
    `/api/v1/organizations/${organizationId}/analytics/effectiveness`,
    {
      params: { period }
    }
  );

  return response.data;
}

/**
 * Fetch ROI metrics
 * 
 * @param organizationId - Organization identifier
 * @param period - Time period for metrics
 * @returns ROI metrics
 * 
 * @example
 * ```ts
 * const roi = await fetchROIMetrics('org-123', '90days');
 * console.log(`Total ROI: £${roi.costAvoidance.total.toLocaleString()}`);
 * ```
 */
export async function fetchROIMetrics(
  organizationId: string,
  period: AnalyticsPeriod = '30days'
): Promise<ROIMetrics> {
  const response = await apiClient.get<ROIMetrics>(
    `/api/v1/organizations/${organizationId}/analytics/roi`,
    {
      params: { period }
    }
  );

  return response.data;
}

/**
 * Fetch violation patterns
 * 
 * @param organizationId - Organization identifier
 * @param period - Time period for analysis
 * @returns Array of violation patterns by category
 * 
 * @example
 * ```ts
 * const patterns = await fetchViolationPatterns('org-123', '90days');
 * ```
 */
export async function fetchViolationPatterns(
  organizationId: string,
  period: AnalyticsPeriod = '30days'
): Promise<ViolationPattern[]> {
  const response = await apiClient.get<ViolationPattern[]>(
    `/api/v1/organizations/${organizationId}/analytics/violations`,
    {
      params: { period }
    }
  );

  return response.data;
}

/**
 * Fetch acknowledgment forecast
 * 
 * @param organizationId - Organization identifier
 * @param policyId - Optional policy ID for specific forecast
 * @param days - Number of days to forecast (default: 7)
 * @returns Array of forecast data points
 * 
 * @example
 * ```ts
 * const forecast = await fetchAcknowledgmentForecast('org-123', undefined, 7);
 * ```
 */
export async function fetchAcknowledgmentForecast(
  organizationId: string,
  policyId?: string,
  days = 7
): Promise<AcknowledgmentForecast[]> {
  const response = await apiClient.get<AcknowledgmentForecast[]>(
    `/api/v1/organizations/${organizationId}/analytics/forecast`,
    {
      params: { policyId, days }
    }
  );

  return response.data;
}

/**
 * Generate executive summary
 * 
 * @param organizationId - Organization identifier
 * @param period - Time period for summary
 * @returns Executive summary
 * 
 * @example
 * ```ts
 * const summary = await generateExecutiveSummary('org-123', '30days');
 * ```
 */
export async function generateExecutiveSummary(
  organizationId: string,
  period: AnalyticsPeriod = '30days'
): Promise<ExecutiveSummary> {
  const response = await apiClient.get<ExecutiveSummary>(
    `/api/v1/organizations/${organizationId}/analytics/summary`,
    {
      params: { period }
    }
  );

  return response.data;
}

/**
 * Export analytics report
 * 
 * @param organizationId - Organization identifier
 * @param format - Export format
 * @param period - Time period for report
 * @returns Blob containing report file
 * 
 * @example
 * ```ts
 * const blob = await exportAnalyticsReport('org-123', 'pdf', '30days');
 * const url = window.URL.createObjectURL(blob);
 * window.open(url);
 * ```
 */
export async function exportAnalyticsReport(
  organizationId: string,
  format: ReportFormat = 'pdf',
  period: AnalyticsPeriod = '30days'
): Promise<Blob> {
  const response = await apiClient.get(
    `/api/v1/organizations/${organizationId}/analytics/export/${format}`,
    {
      params: { period },
      responseType: 'blob'
    }
  );

  return response.data;
}

/**
 * Schedule analytics report
 * 
 * @param organizationId - Organization identifier
 * @param config - Report schedule configuration
 * @returns Schedule confirmation
 * 
 * @example
 * ```ts
 * await scheduleAnalyticsReport('org-123', {
 *   frequency: 'weekly',
 *   format: 'pdf',
 *   recipients: ['manager@example.com']
 * });
 * ```
 */
export async function scheduleAnalyticsReport(
  organizationId: string,
  config: {
    frequency: ReportFrequency;
    format: ReportFormat;
    recipients: string[];
    period?: AnalyticsPeriod;
  }
): Promise<{ scheduleId: string; success: boolean }> {
  const response = await apiClient.post(
    `/api/v1/organizations/${organizationId}/analytics/schedule`,
    config
  );

  return response.data;
}

/**
 * Cancel scheduled report
 * 
 * @param scheduleId - Schedule identifier
 * @returns Cancellation confirmation
 * 
 * @example
 * ```ts
 * await cancelScheduledReport('schedule-123');
 * ```
 */
export async function cancelScheduledReport(
  scheduleId: string
): Promise<{ success: boolean }> {
  const response = await apiClient.delete(
    `/api/v1/analytics/schedules/${scheduleId}`
  );

  return response.data;
}

/**
 * Get category performance breakdown
 * 
 * @param organizationId - Organization identifier
 * @param period - Time period for analysis
 * @returns Category performance metrics
 * 
 * @example
 * ```ts
 * const performance = await getCategoryPerformance('org-123', '30days');
 * ```
 */
export async function getCategoryPerformance(
  organizationId: string,
  period: AnalyticsPeriod = '30days'
): Promise<Record<string, {
  effectiveness: number;
  acknowledgmentRate: number;
  violationCount: number;
  improvement: number;
}>> {
  const response = await apiClient.get(
    `/api/v1/organizations/${organizationId}/analytics/category-performance`,
    {
      params: { period }
    }
  );

  return response.data;
}
