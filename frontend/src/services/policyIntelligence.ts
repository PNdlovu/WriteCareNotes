/**
 * @fileoverview Policy Intelligence Service Index
 * @module PolicyIntelligenceServices
 * @category Services
 * @subcategory Policy Intelligence
 * @version 1.0.0
 * @since 2025-10-07
 * 
 * @description
 * Barrel export for all Policy Intelligence services.
 * Provides convenient access to gap analysis, risk management,
 * and analytics services.
 */

// Gap Analysis Service
export {
  fetchGapAnalysis,
  createPolicyFromTemplate,
  markGapAddressed,
  getGapRemediationHistory,
  exportGapAnalysisReport,
  type Jurisdiction,
  type ServiceType,
  type GapPriority,
  type PolicyGap,
  type GapAnalysisResult
} from './policyGapService';

// Risk Management Service
export {
  fetchPolicyRisks,
  fetchRiskAlerts,
  acknowledgeAlert,
  fetchRiskTrends,
  updateRiskThreshold,
  recalculatePolicyRisk,
  exportRiskReport,
  type RiskLevel,
  type PolicyRisk,
  type RiskAlert,
  type RiskTrendPoint
} from './policyRiskService';

// Analytics Service
export {
  fetchPolicyEffectiveness,
  fetchROIMetrics,
  fetchViolationPatterns,
  fetchAcknowledgmentForecast,
  generateExecutiveSummary,
  exportAnalyticsReport,
  scheduleAnalyticsReport,
  cancelScheduledReport,
  getCategoryPerformance,
  type AnalyticsPeriod,
  type ReportFormat,
  type ReportFrequency,
  type PolicyEffectiveness,
  type ROIMetrics,
  type ViolationPattern,
  type AcknowledgmentForecast,
  type ExecutiveSummary
} from './policyAnalyticsService';
