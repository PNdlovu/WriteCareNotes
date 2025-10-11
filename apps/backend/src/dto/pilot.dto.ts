export interface CreatePilotDto {
  tenantId?: string;
  careHomeName: string;
  location: string;
  region: string;
  size: number; // number of residents
  type: 'nursing' | 'residential' | 'dementia' | 'mixed';
  contactEmail: string;
  contactPhone: string;
  startDate?: Date;
  endDate?: Date;
  features?: string[];
}

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

export interface PilotStatusDto {
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
  avgSessionDuration: number; // minutes
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
}

export interface ComplianceMetrics {
  auditTrailCompleteness: number; // percentage
  consentRecords: number;
  nhsSyncSuccessRate: number; // percentage
  gdprCompliance: number; // percentage
  cqcCompliance: number; // percentage
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
  feedbackResolutionRate: number; // percentage
  avgResolutionTime: number; // hours
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
  createdAt: Date;
  updatedAt: Date;
}

export interface PilotAlert {
  type: 'compliance' | 'feedback' | 'engagement' | 'adoption';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  action: string;
  createdAt: Date;
}

export interface PilotDashboardDto {
  pilot: {
    id: string;
    tenantId: string;
    careHomeName: string;
    location: string;
    region: string;
    size: number;
    type: string;
    status: string;
    startDate: Date;
    endDate?: Date;
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

export interface PilotOnboardingChecklistDto {
  tenantId: string;
  preOnboarding: {
    ndaSigned: boolean;
    dataProcessingAgreementSigned: boolean;
    tenantEnvironmentProvisioned: boolean;
    adminCredentialsIssued: boolean;
  };
  technicalSetup: {
    databaseSchemaMigrated: boolean;
    nhsApiKeysConfigured: boolean;
    auditLoggingVerified: boolean;
    healthChecksPassing: boolean;
  };
  training: {
    staffOnboardingSessionDelivered: boolean;
    feedbackProcessExplained: boolean;
    supportContactShared: boolean;
  };
  goLive: {
    pilotTenantActivated: boolean;
    featureFlagsSet: boolean;
    monitoringDashboardEnabled: boolean;
  };
  completedAt?: Date;
  completedBy?: string;
}

export interface PilotCaseStudyDto {
  careHomeName: string;
  location: string;
  pilotDuration: string;
  numberOfResidents: number;
  numberOfStaffUsers: number;
  objectives: string[];
  implementation: {
    deploymentMethod: string;
    modulesEnabled: string[];
    trainingDelivered: string[];
    supportProvided: string[];
  };
  results: {
    engagementMetrics: EngagementMetrics;
    complianceMetrics: ComplianceMetrics;
    operationalMetrics: {
      reductionInPaperRecords: number; // percentage
      timeSavedPerShift: number; // minutes
      errorReductionInMedicationLogs: number; // percentage
    };
  };
  feedback: {
    staffTestimonials: string[];
    residentFamilyFeedback: string[];
    suggestionsForImprovement: string[];
  };
  outcomes: {
    pilotSatisfactionScore: number; // 1-10
    keyBenefitsRealized: string[];
    challengesEncountered: string[];
    nextSteps: string[];
  };
  trustSignals: {
    auditTrailVerificationCompleted: boolean;
    complianceChecksPassed: boolean;
    earlyAdopterDiscountApplied: boolean;
  };
}