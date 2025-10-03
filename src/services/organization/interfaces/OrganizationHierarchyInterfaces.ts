import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Organization Hierarchy Service Interfaces for WriteCareNotes
 * @module OrganizationHierarchyInterfaces
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive interface definitions for Organization Hierarchy Service
 * with multi-tenancy, dashboard, and reporting capabilities.
 */

import { Organization, OrganizationType, OrganizationStatus, Jurisdiction } from '@/entities/organization/Organization';
import { OrganizationConfiguration } from '@/entities/organization/OrganizationConfiguration';

/**
 * Main Organization Hierarchy Service Interface
 */
export interface OrganizationHierarchyServiceInterface {
  // Organization Management
  createOrganization(request: CreateOrganizationRequest, userId: string, correlationId: string): Promise<OrganizationResult>;
  updateOrganization(id: string, request: UpdateOrganizationRequest, userId: string, correlationId: string): Promise<OrganizationResult>;
  getOrganization(id: string, userId: string, correlationId: string): Promise<OrganizationResult>;
  getOrganizations(params: OrganizationQueryParams, userId: string, correlationId: string): Promise<OrganizationResult[]>;
  deleteOrganization(id: string, userId: string, correlationId: string): Promise<void>;
  
  // Hierarchy Management
  getOrganizationHierarchy(params: HierarchyQueryParams, userId: string, correlationId: string): Promise<HierarchyResult>;
  moveOrganization(organizationId: string, newParentId: string, userId: string, correlationId: string): Promise<OrganizationResult>;
  getOrganizationChildren(organizationId: string, depth: number, userId: string, correlationId: string): Promise<OrganizationResult[]>;
  getOrganizationAncestors(organizationId: string, userId: string, correlationId: string): Promise<OrganizationResult[]>;
  
  // Dashboard Management
  generateConsolidatedDashboard(request: ConsolidatedDashboardRequest, userId: string, correlationId: string): Promise<DashboardResult>;
  updateConsolidatedDashboard(dashboardId: string, request: UpdateDashboardRequest, userId: string, correlationId: string): Promise<DashboardResult>;
  getConsolidatedDashboard(dashboardId: string, userId: string, correlationId: string): Promise<DashboardResult>;
  
  // Reporting
  generateCrossOrganizationalReport(request: CrossOrganizationalReportRequest, userId: string, correlationId: string): Promise<ReportResult>;
  getCrossOrganizationalReports(params: ReportQueryParams, userId: string, correlationId: string): Promise<ReportResult[]>;
  
  // Configuration Management
  manageOrganizationConfiguration(request: OrganizationConfigurationRequest, userId: string, correlationId: string): Promise<ConfigurationResult>;
  getOrganizationConfiguration(organizationId: string, category: string, userId: string, correlationId: string): Promise<ConfigurationResult>;
}

/**
 * Organization Request Interfaces
 */
export interface CreateOrganizationRequest {
  name: string;
  code?: string;
  description?: string;
  organizationType: OrganizationType;
  parentOrganizationId?: string;
  tenantId?: string;
  jurisdiction: Jurisdiction;
  dataResidency?: string;
  contactInformation?: any;
  address?: any;
  registrationNumber?: string;
  vatNumber?: string;
  establishedDate?: Date;
  legalStructure?: string;
  services?: string[];
  specializations?: string[];
  operatingHours?: any;
  metrics?: any;
  integrationSettings?: any;
  performanceSettings?: any;
  securitySettings?: any;
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
  status?: OrganizationStatus;
  contactInformation?: any;
  address?: any;
  services?: string[];
  specializations?: string[];
  operatingHours?: any;
  metrics?: any;
  integrationSettings?: any;
  performanceSettings?: any;
  securitySettings?: any;
}

export interface OrganizationQueryParams {
  tenantId?: string;
  organizationType?: OrganizationType;
  jurisdiction?: Jurisdiction;
  status?: OrganizationStatus;
  parentOrganizationId?: string;
  searchTerm?: string;
  services?: string[];
  specializations?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  includeMetrics?: boolean;
  includeChildren?: boolean;
}

/**
 * Hierarchy Request Interfaces
 */
export interface HierarchyQueryParams {
  tenantId?: string;
  rootOrganizationId?: string;
  maxDepth?: number;
  organizationType?: OrganizationType;
  jurisdiction?: Jurisdiction;
  status?: OrganizationStatus;
  includeMetrics?: boolean;
  includeConfigurations?: boolean;
  forceRefresh?: boolean;
}

export interface MoveOrganizationRequest {
  newParentId?: string;
  reason: string;
  effectiveDate?: Date;
  notifyStakeholders?: boolean;
  migrationPlan?: MigrationPlan;
}

export interface MigrationPlan {
  dataTransfer: DataTransferPlan[];
  userMigration: UserMigrationPlan[];
  configurationMigration: ConfigurationMigrationPlan[];
  rollbackPlan: RollbackPlan;
}

export interface DataTransferPlan {
  entityType: string;
  transferMethod: 'copy' | 'move' | 'reference';
  validationRules: string[];
  rollbackSupported: boolean;
}

export interface UserMigrationPlan {
  userId: string;
  currentRoles: string[];
  newRoles: string[];
  migrationDate: Date;
  notificationRequired: boolean;
}

export interface ConfigurationMigrationPlan {
  configurationId: string;
  migrationStrategy: 'inherit' | 'override' | 'merge';
  conflictResolution: 'parent_wins' | 'child_wins' | 'manual_review';
}

export interface RollbackPlan {
  rollbackTriggers: string[];
  rollbackSteps: RollbackStep[];
  rollbackTimeout: number;
  automaticRollback: boolean;
}

export interface RollbackStep {
  stepId: string;
  stepType: 'data_restore' | 'configuration_restore' | 'permission_restore';
  stepOrder: number;
  rollbackCommand: string;
  validationCommand: string;
}

/**
 * Dashboard Request Interfaces
 */
export interface ConsolidatedDashboardRequest {
  dashboardName: string;
  dashboardLevel: DashboardLevel;
  organizationScope: string[];
  widgets: DashboardWidget[];
  dataAggregation: DataAggregationRule[];
  permissions: DashboardPermission[];
  refreshFrequency: RefreshFrequency;
  drillDownCapability: DrillDownCapability[];
  exportOptions: ExportOption[];
  alertConfiguration: AlertConfiguration[];
  customization: DashboardCustomization;
}

export interface UpdateDashboardRequest {
  dashboardName?: string;
  widgets?: DashboardWidget[];
  dataAggregation?: DataAggregationRule[];
  permissions?: DashboardPermission[];
  refreshFrequency?: RefreshFrequency;
  alertConfiguration?: AlertConfiguration[];
  customization?: DashboardCustomization;
}

export enum DashboardLevel {
  EXECUTIVE = 'executive',
  MANAGEMENT = 'management',
  OPERATIONAL = 'operational',
  DEPARTMENTAL = 'departmental',
  TEAM = 'team',
  INDIVIDUAL = 'individual'
}

export interface DashboardWidget {
  widgetId: string;
  widgetType: WidgetType;
  widgetName: string;
  dataSource: DataSource;
  visualization: VisualizationType;
  filters: WidgetFilter[];
  refreshInterval: number;
  position: WidgetPosition;
  size: WidgetSize;
  configuration: WidgetConfiguration;
}

export enum WidgetType {
  KPI_METRIC = 'kpi_metric',
  CHART = 'chart',
  TABLE = 'table',
  MAP = 'map',
  GAUGE = 'gauge',
  ALERT_LIST = 'alert_list',
  TREND_ANALYSIS = 'trend_analysis',
  COMPARISON = 'comparison'
}

export interface DataSource {
  sourceType: 'organization_metrics' | 'financial_data' | 'operational_data' | 'compliance_data';
  sourceId: string;
  aggregationLevel: 'individual' | 'department' | 'organization' | 'tenant';
  timeRange: TimeRange;
  filters: DataFilter[];
}

export interface TimeRange {
  startDate: Date;
  endDate: Date;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  comparison?: 'previous_period' | 'same_period_last_year' | 'custom';
}

export interface DataFilter {
  field: string;
  operator: FilterOperator;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  BETWEEN = 'between',
  IN = 'in',
  NOT_IN = 'not_in',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with'
}

export enum VisualizationType {
  LINE_CHART = 'line_chart',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  AREA_CHART = 'area_chart',
  SCATTER_PLOT = 'scatter_plot',
  HEATMAP = 'heatmap',
  TREEMAP = 'treemap',
  GAUGE = 'gauge',
  TABLE = 'table',
  CARD = 'card'
}

export interface WidgetFilter {
  filterId: string;
  filterName: string;
  filterType: 'dropdown' | 'date_range' | 'text_input' | 'multi_select';
  options?: FilterOption[];
  defaultValue?: any;
  required: boolean;
}

export interface FilterOption {
  label: string;
  value: any;
  group?: string;
}

export interface WidgetPosition {
  x: number;
  y: number;
  z?: number;
}

export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface WidgetConfiguration {
  colors?: string[];
  theme?: 'light' | 'dark' | 'auto';
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltips?: boolean;
  animation?: boolean;
  customSettings?: Record<string, any>;
}

export interface DataAggregationRule {
  ruleId: string;
  ruleName: string;
  aggregationType: AggregationType;
  groupByFields: string[];
  aggregationFields: AggregationField[];
  filters: DataFilter[];
  sortOrder: SortOrder[];
}

export enum AggregationType {
  SUM = 'sum',
  AVERAGE = 'average',
  COUNT = 'count',
  MIN = 'min',
  MAX = 'max',
  MEDIAN = 'median',
  PERCENTILE = 'percentile',
  STANDARD_DEVIATION = 'standard_deviation'
}

export interface AggregationField {
  fieldName: string;
  aggregationType: AggregationType;
  alias?: string;
  format?: string;
}

export interface SortOrder {
  field: string;
  direction: 'ASC' | 'DESC';
  priority: number;
}

export interface DashboardPermission {
  userId?: string;
  roleId?: string;
  organizationId?: string;
  permissionType: DashboardPermissionType;
  accessLevel: AccessLevel;
  restrictions?: PermissionRestriction[];
}

export enum DashboardPermissionType {
  VIEW = 'view',
  EDIT = 'edit',
  SHARE = 'share',
  EXPORT = 'export',
  ADMIN = 'admin'
}

export enum AccessLevel {
  FULL = 'full',
  LIMITED = 'limited',
  READ_ONLY = 'read_only',
  NO_ACCESS = 'no_access'
}

export interface PermissionRestriction {
  restrictionType: 'time_based' | 'ip_based' | 'data_based';
  restrictionValue: any;
  expiryDate?: Date;
}

export enum RefreshFrequency {
  REAL_TIME = 'real_time',
  EVERY_MINUTE = 'every_minute',
  EVERY_5_MINUTES = 'every_5_minutes',
  EVERY_15_MINUTES = 'every_15_minutes',
  EVERY_30_MINUTES = 'every_30_minutes',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  MANUAL = 'manual'
}

export interface DrillDownCapability {
  fromLevel: string;
  toLevel: string;
  drillDownType: 'hierarchy' | 'time' | 'category' | 'custom';
  configuration: DrillDownConfiguration;
}

export interface DrillDownConfiguration {
  targetDashboard?: string;
  targetWidget?: string;
  parameterMapping: ParameterMapping[];
  filterInheritance: boolean;
}

export interface ParameterMapping {
  sourceParameter: string;
  targetParameter: string;
  transformation?: string;
}

export interface ExportOption {
  format: ExportFormat;
  includeData: boolean;
  includeCharts: boolean;
  includeFilters: boolean;
  customization?: ExportCustomization;
}

export enum ExportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  PNG = 'png',
  SVG = 'svg',
  JSON = 'json'
}

export interface ExportCustomization {
  template?: string;
  branding?: boolean;
  watermark?: string;
  compression?: boolean;
}

export interface AlertConfiguration {
  alertId: string;
  alertName: string;
  alertType: AlertType;
  conditions: AlertCondition[];
  actions: AlertAction[];
  schedule: AlertSchedule;
  escalation: AlertEscalation;
}

export enum AlertType {
  THRESHOLD = 'threshold',
  ANOMALY = 'anomaly',
  TREND = 'trend',
  COMPARISON = 'comparison',
  CUSTOM = 'custom'
}

export interface AlertCondition {
  metric: string;
  operator: ComparisonOperator;
  threshold: number;
  timeWindow: number;
  aggregation: AggregationType;
}

export enum ComparisonOperator {
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal'
}

export interface AlertAction {
  actionType: AlertActionType;
  configuration: AlertActionConfiguration;
  priority: number;
}

export enum AlertActionType {
  EMAIL = 'email',
  SMS = 'sms',
  WEBHOOK = 'webhook',
  DASHBOARD_NOTIFICATION = 'dashboard_notification',
  MOBILE_PUSH = 'mobile_push',
  SLACK = 'slack',
  TEAMS = 'teams'
}

export interface AlertActionConfiguration {
  recipients?: string[];
  template?: string;
  customMessage?: string;
  webhookUrl?: string;
  retryPolicy?: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number;
  backoffStrategy: 'linear' | 'exponential';
}

export interface AlertSchedule {
  enabled: boolean;
  frequency: AlertFrequency;
  timeZone: string;
  quietHours?: QuietHours;
}

export enum AlertFrequency {
  CONTINUOUS = 'continuous',
  EVERY_MINUTE = 'every_minute',
  EVERY_5_MINUTES = 'every_5_minutes',
  EVERY_15_MINUTES = 'every_15_minutes',
  EVERY_30_MINUTES = 'every_30_minutes',
  HOURLY = 'hourly',
  DAILY = 'daily'
}

export interface QuietHours {
  startTime: string;
  endTime: string;
  days: string[];
}

export interface AlertEscalation {
  enabled: boolean;
  escalationLevels: EscalationLevel[];
  maxEscalationLevel: number;
}

export interface EscalationLevel {
  level: number;
  delay: number;
  recipients: string[];
  actions: AlertAction[];
}

export interface DashboardCustomization {
  theme: DashboardTheme;
  layout: DashboardLayout;
  branding: DashboardBranding;
  personalization: DashboardPersonalization;
}

export interface DashboardTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
}

export interface DashboardLayout {
  layoutType: 'grid' | 'free_form' | 'template';
  columns: number;
  rows: number;
  spacing: number;
  responsive: boolean;
}

export interface DashboardBranding {
  logo?: string;
  organizationName?: string;
  customCSS?: string;
  favicon?: string;
}

export interface DashboardPersonalization {
  allowUserCustomization: boolean;
  saveUserPreferences: boolean;
  defaultView?: string;
  favoriteWidgets?: string[];
}

/**
 * Reporting Request Interfaces
 */
export interface CrossOrganizationalReportRequest {
  reportName: string;
  reportType: ReportType;
  organizationScope: string[];
  dateRange: DateRange;
  metrics: ReportMetric[];
  dimensions: ReportDimension[];
  filters: ReportFilter[];
  groupBy: string[];
  calculations: ReportCalculation[];
  dataAggregation: DataAggregationRule[];
  format: ReportFormat;
  template?: string;
  distribution?: ReportDistribution;
  scheduling?: ReportScheduling;
}

export enum ReportType {
  FINANCIAL = 'financial',
  OPERATIONAL = 'operational',
  COMPLIANCE = 'compliance',
  QUALITY = 'quality',
  PERFORMANCE = 'performance',
  CUSTOM = 'custom'
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  comparison?: DateRange;
}

export interface ReportMetric {
  metricId: string;
  metricName: string;
  metricType: MetricType;
  aggregation: AggregationType;
  format?: string;
  calculation?: string;
}

export enum MetricType {
  FINANCIAL = 'financial',
  OPERATIONAL = 'operational',
  QUALITY = 'quality',
  COMPLIANCE = 'compliance',
  PERFORMANCE = 'performance',
  CUSTOM = 'custom'
}

export interface ReportDimension {
  dimensionId: string;
  dimensionName: string;
  dimensionType: DimensionType;
  hierarchy?: string[];
  grouping?: boolean;
}

export enum DimensionType {
  ORGANIZATION = 'organization',
  TIME = 'time',
  GEOGRAPHY = 'geography',
  SERVICE = 'service',
  DEPARTMENT = 'department',
  CUSTOM = 'custom'
}

export interface ReportFilter {
  filterId: string;
  filterName: string;
  field: string;
  operator: FilterOperator;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface ReportCalculation {
  calculationId: string;
  calculationName: string;
  calculationType: CalculationType;
  formula: string;
  dependencies: string[];
}

export enum CalculationType {
  SUM = 'sum',
  AVERAGE = 'average',
  PERCENTAGE = 'percentage',
  RATIO = 'ratio',
  VARIANCE = 'variance',
  GROWTH_RATE = 'growth_rate',
  CUSTOM = 'custom'
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
  HTML = 'html'
}

export interface ReportDistribution {
  distributionType: DistributionType;
  recipients: ReportRecipient[];
  deliveryMethod: DeliveryMethod;
  schedule?: DistributionSchedule;
}

export enum DistributionType {
  IMMEDIATE = 'immediate',
  SCHEDULED = 'scheduled',
  ON_DEMAND = 'on_demand'
}

export interface ReportRecipient {
  recipientId: string;
  recipientType: 'user' | 'role' | 'organization' | 'external';
  contactMethod: 'email' | 'portal' | 'api';
  customization?: RecipientCustomization;
}

export interface RecipientCustomization {
  format?: ReportFormat;
  sections?: string[];
  filters?: ReportFilter[];
  branding?: boolean;
}

export enum DeliveryMethod {
  EMAIL = 'email',
  PORTAL = 'portal',
  API = 'api',
  FTP = 'ftp',
  WEBHOOK = 'webhook'
}

export interface DistributionSchedule {
  frequency: ScheduleFrequency;
  time: string;
  timeZone: string;
  days?: string[];
  dates?: number[];
}

export enum ScheduleFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export interface ReportScheduling {
  enabled: boolean;
  schedule: DistributionSchedule;
  retention: ReportRetention;
  versioning: ReportVersioning;
}

export interface ReportRetention {
  retentionPeriod: number;
  retentionUnit: 'days' | 'months' | 'years';
  archiveAfter?: number;
  deleteAfter?: number;
}

export interface ReportVersioning {
  versioningEnabled: boolean;
  maxVersions: number;
  versionNaming: 'timestamp' | 'sequential' | 'semantic';
}

export interface ReportQueryParams {
  reportType?: ReportType;
  organizationScope?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  status?: ReportStatus;
  createdBy?: string;
  page?: number;
  limit?: number;
}

export enum ReportStatus {
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SCHEDULED = 'scheduled',
  CANCELLED = 'cancelled'
}

/**
 * Configuration Request Interfaces
 */
export interface OrganizationConfigurationRequest {
  organizationId: string;
  category: string;
  configurationData: Record<string, any>;
  propagateToChildren?: boolean;
  deploymentStrategy?: DeploymentStrategy;
  effectiveDate?: Date;
  expiryDate?: Date;
  approvalRequired?: boolean;
}

export enum DeploymentStrategy {
  IMMEDIATE = 'immediate',
  SCHEDULED = 'scheduled',
  PHASED = 'phased',
  MANUAL = 'manual'
}

/**
 * Response Interfaces
 */
export interface OrganizationResult {
  success: boolean;
  organization?: Organization;
  error?: string;
  correlationId: string;
  responseTime?: number;
}

export interface HierarchyResult {
  success: boolean;
  hierarchy?: any[];
  metrics?: any;
  error?: string;
  correlationId: string;
  totalOrganizations?: number;
  maxDepth?: number;
}

export interface DashboardResult {
  success: boolean;
  dashboard?: any;
  error?: string;
  correlationId: string;
  generationTime?: number;
}

export interface ReportResult {
  success: boolean;
  report?: any;
  error?: string;
  correlationId: string;
  generationTime?: number;
}

export interface ConfigurationResult {
  success: boolean;
  configuration?: OrganizationConfiguration;
  deploymentResult?: any;
  error?: string;
  correlationId: string;
}