import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Organization Hierarchy Service Exceptions for WriteCareNotes
 * @module OrganizationHierarchyExceptions
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Custom exception classes for Organization Hierarchy Service
 * with multi-tenancy, compliance, and audit trail support.
 */

/**
 * Base Organization Hierarchy Error
 */
export class OrganizationHierarchyError extends Error {
  public readonly code: string;
  public readonly correlationId: string;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    correlationId: string,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'OrganizationHierarchyError';
    this.code = code;
    this.correlationId = correlationId;
    this.timestamp = new Date();
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OrganizationHierarchyError);
    }
  }

  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      correlationId: this.correlationId,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack
    };
  }
}

/**
 * Organization Validation Error
 */
export class OrganizationValidationError extends OrganizationHierarchyError {
  public readonly validationErrors: ValidationError[];

  constructor(
    message: string,
    correlationId: string,
    validationErrors: ValidationError[],
    context?: Record<string, any>
  ) {
    super(message, 'ORGANIZATION_VALIDATION_ERROR', correlationId, context);
    this.name = 'OrganizationValidationError';
    this.validationErrors = validationErrors;
  }

  getFormattedErrors(): string {
    return this.validationErrors
      .map(error => `${error.field}: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`)
      .join(', ');
  }
}

/**
 * Hierarchy Violation Error
 */
export class HierarchyViolationError extends OrganizationHierarchyError {
  public readonly violationType: HierarchyViolationType;
  public readonly organizationId?: string;
  public readonly parentOrganizationId?: string;

  constructor(
    message: string,
    correlationId: string,
    violationType: HierarchyViolationType,
    organizationId?: string,
    parentOrganizationId?: string,
    context?: Record<string, any>
  ) {
    super(message, 'HIERARCHY_VIOLATION_ERROR', correlationId, context);
    this.name = 'HierarchyViolationError';
    this.violationType = violationType;
    this.organizationId = organizationId;
    this.parentOrganizationId = parentOrganizationId;
  }
}

/**
 * Tenant Isolation Error
 */
export class TenantIsolationError extends OrganizationHierarchyError {
  public readonly userTenantId: string;
  public readonly targetTenantId: string;
  public readonly operationType: string;

  constructor(
    message: string,
    correlationId: string,
    userTenantId: string,
    targetTenantId: string,
    operationType: string = 'UNKNOWN',
    context?: Record<string, any>
  ) {
    super(message, 'TENANT_ISOLATION_ERROR', correlationId, context);
    this.name = 'TenantIsolationError';
    this.userTenantId = userTenantId;
    this.targetTenantId = targetTenantId;
    this.operationType = operationType;
  }

  getIsolationDetails(): TenantIsolationDetails {
    return {
      userTenantId: this.userTenantId,
      targetTenantId: this.targetTenantId,
      operationType: this.operationType,
      violationTime: this.timestamp,
      correlationId: this.correlationId
    };
  }
}

/**
 * Configuration Error
 */
export class ConfigurationError extends OrganizationHierarchyError {
  public readonly organizationId: string;
  public readonly configurationCategory?: string;
  public readonly configurationKey?: string;

  constructor(
    message: string,
    correlationId: string,
    organizationId: string,
    configurationCategory?: string,
    configurationKey?: string,
    context?: Record<string, any>
  ) {
    super(message, 'CONFIGURATION_ERROR', correlationId, context);
    this.name = 'ConfigurationError';
    this.organizationId = organizationId;
    this.configurationCategory = configurationCategory;
    this.configurationKey = configurationKey;
  }
}

/**
 * Dashboard Generation Error
 */
export class DashboardGenerationError extends OrganizationHierarchyError {
  public readonly dashboardLevel: string;
  public readonly organizationScope: string[];
  public readonly widgetErrors: WidgetError[];

  constructor(
    message: string,
    correlationId: string,
    dashboardLevel: string,
    organizationScope: string[],
    widgetErrors: WidgetError[] = [],
    context?: Record<string, any>
  ) {
    super(message, 'DASHBOARD_GENERATION_ERROR', correlationId, context);
    this.name = 'DashboardGenerationError';
    this.dashboardLevel = dashboardLevel;
    this.organizationScope = organizationScope;
    this.widgetErrors = widgetErrors;
  }
}

/**
 * Report Generation Error
 */
export class ReportGenerationError extends OrganizationHierarchyError {
  public readonly reportType: string;
  public readonly organizationScope: string[];
  public readonly dataErrors: DataError[];

  constructor(
    message: string,
    correlationId: string,
    reportType: string,
    organizationScope: string[],
    dataErrors: DataError[] = [],
    context?: Record<string, any>
  ) {
    super(message, 'REPORT_GENERATION_ERROR', correlationId, context);
    this.name = 'ReportGenerationError';
    this.reportType = reportType;
    this.organizationScope = organizationScope;
    this.dataErrors = dataErrors;
  }
}

/**
 * Permission Denied Error
 */
export class PermissionDeniedError extends OrganizationHierarchyError {
  public readonly userId: string;
  public readonly requiredPermissions: string[];
  public readonly organizationId?: string;
  public readonly operationType: string;

  constructor(
    message: string,
    correlationId: string,
    userId: string,
    requiredPermissions: string[],
    operationType: string,
    organizationId?: string,
    context?: Record<string, any>
  ) {
    super(message, 'PERMISSION_DENIED_ERROR', correlationId, context);
    this.name = 'PermissionDeniedError';
    this.userId = userId;
    this.requiredPermissions = requiredPermissions;
    this.organizationId = organizationId;
    this.operationType = operationType;
  }
}

/**
 * Data Aggregation Error
 */
export class DataAggregationError extends OrganizationHierarchyError {
  public readonly aggregationType: string;
  public readonly sourceOrganizations: string[];
  public readonly failedOrganizations: string[];

  constructor(
    message: string,
    correlationId: string,
    aggregationType: string,
    sourceOrganizations: string[],
    failedOrganizations: string[],
    context?: Record<string, any>
  ) {
    super(message, 'DATA_AGGREGATION_ERROR', correlationId, context);
    this.name = 'DataAggregationError';
    this.aggregationType = aggregationType;
    this.sourceOrganizations = sourceOrganizations;
    this.failedOrganizations = failedOrganizations;
  }
}

/**
 * Hierarchy Cycle Error
 */
export class HierarchyCycleError extends OrganizationHierarchyError {
  public readonly cycleNodes: string[];
  public readonly cycleLength: number;

  constructor(
    message: string,
    correlationId: string,
    cycleNodes: string[],
    context?: Record<string, any>
  ) {
    super(message, 'HIERARCHY_CYCLE_ERROR', correlationId, context);
    this.name = 'HierarchyCycleError';
    this.cycleNodes = cycleNodes;
    this.cycleLength = cycleNodes.length;
  }
}

/**
 * Organization Migration Error
 */
export class OrganizationMigrationError extends OrganizationHierarchyError {
  public readonly organizationId: string;
  public readonly sourceParentId?: string;
  public readonly targetParentId?: string;
  public readonly migrationStep: string;
  public readonly rollbackRequired: boolean;

  constructor(
    message: string,
    correlationId: string,
    organizationId: string,
    migrationStep: string,
    rollbackRequired: boolean = false,
    sourceParentId?: string,
    targetParentId?: string,
    context?: Record<string, any>
  ) {
    super(message, 'ORGANIZATION_MIGRATION_ERROR', correlationId, context);
    this.name = 'OrganizationMigrationError';
    this.organizationId = organizationId;
    this.sourceParentId = sourceParentId;
    this.targetParentId = targetParentId;
    this.migrationStep = migrationStep;
    this.rollbackRequired = rollbackRequired;
  }
}

/**
 * Supporting Types and Interfaces
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export enum HierarchyViolationType {
  INVALID_PARENT = 'invalid_parent',
  CIRCULAR_REFERENCE = 'circular_reference',
  DEPTH_EXCEEDED = 'depth_exceeded',
  TYPE_MISMATCH = 'type_mismatch',
  JURISDICTION_CONFLICT = 'jurisdiction_conflict',
  TENANT_BOUNDARY_VIOLATION = 'tenant_boundary_violation'
}

export interface TenantIsolationDetails {
  userTenantId: string;
  targetTenantId: string;
  operationType: string;
  violationTime: Date;
  correlationId: string;
}

export interface WidgetError {
  widgetId: string;
  widgetType: string;
  errorType: WidgetErrorType;
  errorMessage: string;
  dataSource?: string;
}

export enum WidgetErrorType {
  DATA_SOURCE_UNAVAILABLE = 'data_source_unavailable',
  INVALID_CONFIGURATION = 'invalid_configuration',
  PERMISSION_DENIED = 'permission_denied',
  AGGREGATION_FAILED = 'aggregation_failed',
  RENDERING_FAILED = 'rendering_failed'
}

export interface DataError {
  organizationId: string;
  dataType: string;
  errorType: DataErrorType;
  errorMessage: string;
  affectedRecords?: number;
}

export enum DataErrorType {
  DATA_NOT_FOUND = 'data_not_found',
  DATA_QUALITY_ISSUE = 'data_quality_issue',
  ACCESS_DENIED = 'access_denied',
  TRANSFORMATION_FAILED = 'transformation_failed',
  VALIDATION_FAILED = 'validation_failed'
}

/**
 * Error Factory for creating standardized errors
 */
export class OrganizationErrorFactory {
  /**
   * Create organization validation error
   */
  static createValidationError(
    correlationId: string,
    validationErrors: ValidationError[],
    context?: Record<string, any>
  ): OrganizationValidationError {
    const message = `Organization validation failed: ${validationErrors.length} errors found`;
    return new OrganizationValidationError(message, correlationId, validationErrors, context);
  }

  /**
   * Create hierarchy violation error
   */
  static createHierarchyViolationError(
    correlationId: string,
    violationType: HierarchyViolationType,
    organizationId?: string,
    parentOrganizationId?: string,
    context?: Record<string, any>
  ): HierarchyViolationError {
    const message = `Hierarchy violation detected: ${violationType}`;
    return new HierarchyViolationError(
      message,
      correlationId,
      violationType,
      organizationId,
      parentOrganizationId,
      context
    );
  }

  /**
   * Create tenant isolation error
   */
  static createTenantIsolationError(
    correlationId: string,
    userTenantId: string,
    targetTenantId: string,
    operationType: string,
    context?: Record<string, any>
  ): TenantIsolationError {
    const message = `Tenant isolation violation: User from tenant ${userTenantId} attempted ${operationType} on tenant ${targetTenantId}`;
    return new TenantIsolationError(
      message,
      correlationId,
      userTenantId,
      targetTenantId,
      operationType,
      context
    );
  }

  /**
   * Create configuration error
   */
  static createConfigurationError(
    correlationId: string,
    organizationId: string,
    configurationCategory?: string,
    configurationKey?: string,
    context?: Record<string, any>
  ): ConfigurationError {
    const message = `Configuration error for organization ${organizationId}`;
    return new ConfigurationError(
      message,
      correlationId,
      organizationId,
      configurationCategory,
      configurationKey,
      context
    );
  }

  /**
   * Create dashboard generation error
   */
  static createDashboardGenerationError(
    correlationId: string,
    dashboardLevel: string,
    organizationScope: string[],
    widgetErrors: WidgetError[] = [],
    context?: Record<string, any>
  ): DashboardGenerationError {
    const message = `Dashboard generation failed for level ${dashboardLevel}`;
    return new DashboardGenerationError(
      message,
      correlationId,
      dashboardLevel,
      organizationScope,
      widgetErrors,
      context
    );
  }

  /**
   * Create report generation error
   */
  static createReportGenerationError(
    correlationId: string,
    reportType: string,
    organizationScope: string[],
    dataErrors: DataError[] = [],
    context?: Record<string, any>
  ): ReportGenerationError {
    const message = `Report generation failed for type ${reportType}`;
    return new ReportGenerationError(
      message,
      correlationId,
      reportType,
      organizationScope,
      dataErrors,
      context
    );
  }

  /**
   * Create permission denied error
   */
  static createPermissionDeniedError(
    correlationId: string,
    userId: string,
    requiredPermissions: string[],
    operationType: string,
    organizationId?: string,
    context?: Record<string, any>
  ): PermissionDeniedError {
    const message = `Permission denied for user ${userId}: requires ${requiredPermissions.join(', ')}`;
    return new PermissionDeniedError(
      message,
      correlationId,
      userId,
      requiredPermissions,
      operationType,
      organizationId,
      context
    );
  }

  /**
   * Create hierarchy cycle error
   */
  static createHierarchyCycleError(
    correlationId: string,
    cycleNodes: string[],
    context?: Record<string, any>
  ): HierarchyCycleError {
    const message = `Hierarchy cycle detected involving ${cycleNodes.length} organizations`;
    return new HierarchyCycleError(message, correlationId, cycleNodes, context);
  }

  /**
   * Create organization migration error
   */
  static createOrganizationMigrationError(
    correlationId: string,
    organizationId: string,
    migrationStep: string,
    rollbackRequired: boolean = false,
    sourceParentId?: string,
    targetParentId?: string,
    context?: Record<string, any>
  ): OrganizationMigrationError {
    const message = `Organization migration failed at step: ${migrationStep}`;
    return new OrganizationMigrationError(
      message,
      correlationId,
      organizationId,
      migrationStep,
      rollbackRequired,
      sourceParentId,
      targetParentId,
      context
    );
  }
}

export default {
  OrganizationHierarchyError,
  OrganizationValidationError,
  HierarchyViolationError,
  TenantIsolationError,
  ConfigurationError,
  DashboardGenerationError,
  ReportGenerationError,
  PermissionDeniedError,
  DataAggregationError,
  HierarchyCycleError,
  OrganizationMigrationError,
  OrganizationErrorFactory
};