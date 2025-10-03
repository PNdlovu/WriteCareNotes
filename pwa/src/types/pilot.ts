export interface PilotFeedbackDto {
  tenantId: string;
  module: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedFix?: string;
  submittedBy: string;
}

export interface PilotMetricsDto {
  tenantId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PilotStatus {
  tenantId: string;
  status: 'pending' | 'active' | 'completed' | 'suspended' | 'cancelled';
  progress: number;
  metrics: {
    engagement: EngagementMetrics;
    compliance: ComplianceMetrics;
    adoption: AdoptionMetrics;
    feedback: FeedbackMetrics;
  };
  recentFeedback: PilotFeedback[];
  alerts: PilotAlert[];
}

export interface EngagementMetrics {
  activeUsers: number;
  totalLogins: number;
  avgSessionDuration: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
}

export interface ComplianceMetrics {
  auditTrailCompleteness: number;
  consentRecords: number;
  nhsSyncSuccessRate: number;
  gdprCompliance: number;
  cqcCompliance: number;
}

export interface AdoptionMetrics {
  modulesUsed: number;
  medicationLogs: number;
  carePlans: number;
  consentEvents: number;
  nhsIntegrations: number;
}

export interface FeedbackMetrics {
  totalFeedback: number;
  feedbackResolutionRate: number;
  avgResolutionTime: number;
  severityBreakdown: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export interface PilotFeedback {
  id: string;
  tenantId: string;
  module: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedFix?: string;
  submittedBy: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface PilotAlert {
  type: 'compliance' | 'feedback' | 'engagement' | 'adoption';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  action: string;
  createdAt: string;
}

export interface PilotDashboard {
  pilot: {
    id: string;
    tenantId: string;
    careHomeName: string;
    location: string;
    region: string;
    size: number;
    type: string;
    status: string;
    startDate: string;
    endDate?: string;
  };
  metrics: {
    engagement: EngagementMetrics;
    compliance: ComplianceMetrics;
    adoption: AdoptionMetrics;
    feedback: FeedbackMetrics;
  };
  recentFeedback: PilotFeedback[];
  alerts: PilotAlert[];
  overallScore: number;
}