// Auto-generated interfaces for TypeScript error resolution
export interface DatabaseConnection {
  query(sql: string, params?: any[]): Promise<any>;
  transaction<T>(fn: (connection: DatabaseConnection) => Promise<T>): Promise<T>;
}

export interface VisitorManagement {
  id: string;
  visitorName: string;
  residentId: string;
  visitDate: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  purpose: string;
  status: string;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  address: string;
  contactInfo: any;
  settings: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialTransactionResult {
  success: boolean;
  transaction: any;
  correlationId: string;
}

export interface ComplianceCheckResult {
  isCompliant: boolean;
  violations: string[];
  recommendations: string[];
  entityType?: string;
  entityId?: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  timestamp: Date;
  details?: any;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
