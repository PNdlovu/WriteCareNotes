export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
  requestId?: string;
}

export class ResponseBuilder {
  private response: APIResponse;

  constructor(requestId?: string) {
    this.response = {
      success: true,
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  static success<T>(data?: T, requestId?: string): APIResponse<T> {
    return new ResponseBuilder(requestId).withData(data).build();
  }

  static error(
    message: string, 
    code?: string, 
    details?: any, 
    requestId?: string
  ): APIResponse {
    return new ResponseBuilder(requestId)
      .withError(message, code, details)
      .build();
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    requestId?: string
  ): APIResponse<T[]> {
    const totalPages = Math.ceil(total / limit);
    
    return new ResponseBuilder(requestId)
      .withData(data)
      .withPagination(page, limit, total, totalPages)
      .build();
  }

  withData<T>(data: T): ResponseBuilder {
    this.response.data = data;
    return this;
  }

  withError(message: string, code?: string, details?: any): ResponseBuilder {
    this.response.success = false;
    this.response.error = {
      message,
      code,
      details
    };
    delete this.response.data; // Remove data if there's an error
    return this;
  }

  withPagination(
    page: number,
    limit: number,
    total: number,
    totalPages?: number
  ): ResponseBuilder {
    this.response.pagination = {
      page,
      limit,
      total,
      totalPages: totalPages || Math.ceil(total / limit)
    };
    return this;
  }

  withRequestId(requestId: string): ResponseBuilder {
    this.response.requestId = requestId;
    return this;
  }

  build(): APIResponse {
    return { ...this.response };
  }
}

// Pagination utilities
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedQuery extends PaginationParams {
  offset: number;
}

export function parsePaginationParams(
  query: any,
  defaults: { page: number; limit: number; maxLimit: number } = {
    page: 1,
    limit: 20,
    maxLimit: 100
  }
): PaginatedQuery {
  const page = Math.max(1, parseInt(query.page) || defaults.page);
  const limit = Math.min(
    defaults.maxLimit,
    Math.max(1, parseInt(query.limit) || defaults.limit)
  );
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder === 'desc' ? 'desc' : 'asc'
  };
}

// Status response utilities for health checks and system status
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version?: string;
  services: {
    [serviceName: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTime?: number;
      message?: string;
    };
  };
}

export function createHealthResponse(
  status: HealthStatus['status'],
  services: HealthStatus['services'],
  version?: string
): APIResponse<HealthStatus> {
  const healthData: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version,
    services
  };

  return ResponseBuilder.success(healthData);
}

// Common response helpers for care home operations
export class CareHomeResponseBuilder {
  static residentCreated(resident: any, requestId?: string): APIResponse {
    return ResponseBuilder.success(
      {
        message: 'Resident created successfully',
        resident
      },
      requestId
    );
  }

  static residentUpdated(resident: any, requestId?: string): APIResponse {
    return ResponseBuilder.success(
      {
        message: 'Resident updated successfully',
        resident
      },
      requestId
    );
  }

  static medicationAdministered(
    medicationRecord: any,
    requestId?: string
  ): APIResponse {
    return ResponseBuilder.success(
      {
        message: 'Medication administered and recorded',
        medicationRecord
      },
      requestId
    );
  }

  static careNoteAdded(careNote: any, requestId?: string): APIResponse {
    return ResponseBuilder.success(
      {
        message: 'Care note added successfully',
        careNote
      },
      requestId
    );
  }

  static incidentReported(incident: any, requestId?: string): APIResponse {
    return ResponseBuilder.success(
      {
        message: 'Incident reported successfully',
        incident
      },
      requestId
    );
  }

  static auditCompleted(auditResults: any, requestId?: string): APIResponse {
    return ResponseBuilder.success(
      {
        message: 'Audit completed successfully',
        auditResults
      },
      requestId
    );
  }
}

// Response type guards
export function isSuccessResponse<T>(response: APIResponse<T>): response is APIResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined;
}

export function isErrorResponse(response: APIResponse): response is APIResponse & { success: false; error: NonNullable<APIResponse['error']> } {
  return response.success === false && response.error !== undefined;
}

export function isPaginatedResponse<T>(response: APIResponse<T[]>): response is APIResponse<T[]> & { pagination: NonNullable<APIResponse['pagination']> } {
  return response.pagination !== undefined;
}

// Standard success messages
export const SuccessMessages = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  RETRIEVED: 'Resource retrieved successfully',
  AUTHENTICATED: 'Authentication successful',
  LOGGED_OUT: 'Logged out successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  EMAIL_SENT: 'Email sent successfully',
  FILE_UPLOADED: 'File uploaded successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
  
  // Care home specific
  RESIDENT_ADMITTED: 'Resident admitted successfully',
  RESIDENT_DISCHARGED: 'Resident discharged successfully',
  MEDICATION_ADMINISTERED: 'Medication administered successfully',
  CARE_PLAN_UPDATED: 'Care plan updated successfully',
  STAFF_ASSIGNED: 'Staff member assigned successfully',
  INCIDENT_RESOLVED: 'Incident resolved successfully',
  ASSESSMENT_COMPLETED: 'Assessment completed successfully'
} as const;

// Export types for external use
export type SuccessMessage = typeof SuccessMessages[keyof typeof SuccessMessages];