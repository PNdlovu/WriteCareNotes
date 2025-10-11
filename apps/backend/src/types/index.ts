import { EventEmitter2 } from "eventemitter2";

// Core type definitions
export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  careHomeId?: string;
}

export interface AuthenticatedRequest {
  user?: User;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: Date;
}

export interface NotificationType {
  type: string;
  recipients: string[];
}

export interface NotificationRecipient {
  id: string;
  type: string;
}

export enum SecurityCertification {
  NHS_DIGITAL = 'nhs_digital',
  GDPR_COMPLIANT = 'gdpr_compliant',
  ISO_27001 = 'iso_27001',
  SOC_2_TYPE_II = 'soc_2_type_ii',
  GOVERNMENT_SECURITY = 'government_security'
}

export interface MultiTenantIsolation {
  tenantId: string;
  isolationLevel: string;
}

export interface TenantConfig {
  tenantTier: string;
  securityLevel: string;
}

export interface ErrorCode {
  code: string;
  statusCode: number;
  message: string;
  description: string;
  category: string;
}

export interface ErrorMapping {
  code: ErrorCode;
  statusCode: number;
  message: string;
  description: string;
  category: string;
}

export interface HTTPStatusCode {
  OK: 200;
  CREATED: 201;
  BAD_REQUEST: 400;
  UNAUTHORIZED: 401;
  FORBIDDEN: 403;
  NOT_FOUND: 404;
  INTERNAL_SERVER_ERROR: 500;
}