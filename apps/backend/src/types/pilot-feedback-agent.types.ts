// Core event and data types for pilot feedback agent orchestration

export interface PilotFeedbackEvent {
  eventId: string;
  tenantId: string;
  submittedAt: string; // ISO 8601
  module: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  role: 'care_worker' | 'admin' | 'manager' | 'family' | 'resident';
  text: string;
  attachments: string[];
  consents: {
    improvementProcessing: boolean;
  };
}

export interface AgentSummary {
  summaryId: string;
  tenantId: string;
  window: {
    from: Date;
    to: Date;
  };
  topThemes: Array<{
    theme: string;
    count: number;
    modules: string[];
  }>;
  totalEvents: number;
  riskNotes: string;
  createdAt: Date;
}

export interface AgentCluster {
  clusterId: string;
  tenantId: string;
  module: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  theme: string;
  eventCount: number;
  eventIds: string[];
  keywords: string[];
  createdAt: Date;
}

export interface AgentRecommendation {
  recommendationId: string;
  tenantId: string;
  theme: string;
  proposedActions: string[];
  requiresApproval: boolean;
  linkedFeedbackIds: string[];
  privacyReview: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status?: 'pending' | 'approved' | 'dismissed';
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
}

export interface AgentAuditRecord {
  auditId: string;
  correlationId: string;
  tenantId: string;
  action: string;
  eventId?: string;
  recommendationId?: string;
  metadata?: Record<string, any>;
  error?: string;
  timestamp: Date;
}

export interface AgentStatus {
  tenantId: string;
  enabled: boolean;
  autonomy: 'recommend-only' | 'limited-autonomous' | 'full-autonomous';
  lastRun?: Date;
  queueSize: number;
  errorCount: number;
  isProcessing: boolean;
}

export interface AgentConfiguration {
  tenantId: string;
  enabled: boolean;
  autonomy: 'recommend-only' | 'limited-autonomous' | 'full-autonomous';
  batchSize: number;
  processingInterval: number; // milliseconds
  maxRetries: number;
  features: {
    clustering: boolean;
    summarization: boolean;
    recommendations: boolean;
    notifications: boolean;
  };
  thresholds: {
    minClusterSize: number;
    minRecommendationEvents: number;
    maxProcessingTime: number; // milliseconds
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentOutputs {
  summary: AgentSummary;
  clusters: AgentCluster[];
  recommendations: AgentRecommendation[];
}

export interface AgentMetrics {
  tenantId: string;
  period: {
    from: Date;
    to: Date;
  };
  processing: {
    totalEvents: number;
    processedEvents: number;
    failedEvents: number;
    avgProcessingTime: number; // milliseconds
  };
  outputs: {
    summariesGenerated: number;
    clustersCreated: number;
    recommendationsGenerated: number;
    recommendationsApproved: number;
    recommendationsDismissed: number;
  };
  quality: {
    piiMaskingAccuracy: number; // percentage
    phileakageDetections: number;
    duplicateClusterRate: number; // percentage
    reviewerApprovalRate: number; // percentage
  };
  compliance: {
    sarPropagations: number;
    erasurePropagations: number;
    auditEvents: number;
    policyViolations: number;
  };
}

export interface AgentReviewRequest {
  recommendationId: string;
  tenantId: string;
  theme: string;
  proposedActions: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  linkedFeedbackCount: number;
  createdAt: Date;
  requiresUrgentReview: boolean;
}

export interface AgentApprovalAction {
  recommendationId: string;
  tenantId: string;
  action: 'create_ticket' | 'dismiss' | 'escalate' | 'request_more_info';
  notes?: string;
  approvedBy: string;
  approvedAt: Date;
}

export interface AgentNotification {
  notificationId: string;
  tenantId: string;
  type: 'recommendation_ready' | 'approval_required' | 'processing_error' | 'compliance_alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
  createdAt: Date;
  readAt?: Date;
  recipients: string[];
}

export interface AgentHealthCheck {
  service: 'pilot-feedback-agent';
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: 'pass' | 'fail';
    queue: 'pass' | 'fail';
    masking: 'pass' | 'fail';
    compliance: 'pass' | 'fail';
    audit: 'pass' | 'fail';
  };
  metrics: {
    uptime: number; // seconds
    memoryUsage: number; // MB
    cpuUsage: number; // percentage
    queueSize: number;
    errorRate: number; // percentage
  };
  lastCheck: Date;
}

export interface AgentFeatureFlag {
  tenantId: string;
  flag: string;
  enabled: boolean;
  rolloutPercentage?: number;
  conditions?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentComplianceReport {
  tenantId: string;
  period: {
    from: Date;
    to: Date;
  };
  dataProcessing: {
    eventsProcessed: number;
    piiMasked: number;
    phileakageDetected: number;
    consentVerified: number;
  };
  dataRetention: {
    summariesRetained: number;
    clustersRetained: number;
    recommendationsRetained: number;
    auditRecordsRetained: number;
  };
  dataSubjectRights: {
    sarRequests: number;
    erasureRequests: number;
    rectificationRequests: number;
    portabilityRequests: number;
  };
  security: {
    accessAttempts: number;
    unauthorizedAccess: number;
    dataBreaches: number;
    policyViolations: number;
  };
  generatedAt: Date;
}

// RBAC and access control types
export interface AgentRole {
  roleId: string;
  name: string;
  permissions: AgentPermission[];
  description: string;
  createdAt: Date;
}

export interface AgentPermission {
  permissionId: string;
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

export interface AgentAccessControl {
  userId: string;
  tenantId: string;
  roles: string[];
  permissions: AgentPermission[];
  restrictions?: {
    modules?: string[];
    timeWindows?: Array<{ from: string; to: string }>;
    ipRanges?: string[];
  };
}

// Configuration and deployment types
export interface AgentDeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  region: string;
  scaling: {
    minInstances: number;
    maxInstances: number;
    targetCpuUtilization: number;
  };
  resources: {
    cpu: string;
    memory: string;
    storage: string;
  };
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    metricsInterval: number; // seconds
  };
  security: {
    networkPolicy: string;
    podSecurityPolicy: string;
    serviceAccount: string;
  };
}

export interface AgentRolloutPlan {
  phase: 'design' | 'shadow' | 'limited' | 'pilot' | 'ga';
  tenants: string[];
  features: string[];
  successCriteria: Record<string, any>;
  startDate: Date;
  endDate?: Date;
  status: 'planned' | 'active' | 'completed' | 'paused' | 'failed';
}
