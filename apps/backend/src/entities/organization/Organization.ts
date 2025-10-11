import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Organization Entity for Care Home Management System
 * @module Organization
 * @version 1.0.0
 * @author Care Home Management Team
 * @since 2025-01-01
 * 
 * @description Simple organization entity for care home management.
 */

export interface Organization {
  id: string;
  name: string;
  type: 'CARE_HOME' | 'NURSING_HOME' | 'ASSISTED_LIVING' | 'HOSPITAL' | 'CLINIC';
  address?: Address;
  contactInfo?: ContactInfo;
  settings?: OrganizationSettings;
  parentOrganizationId?: string;
  tenantId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  deletedAt?: Date;
}

export interface Address {
  street: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    email?: string;
  };
}

export interface OrganizationSettings {
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  timeFormat: '12' | '24';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  features: {
    medicationManagement: boolean;
    carePlanning: boolean;
    reporting: boolean;
    nhsIntegration: boolean;
  };
  compliance: {
    cqcRegistered: boolean;
    cqcRegistrationNumber?: string;
    nhsContract: boolean;
    nhsContractNumber?: string;
  };
}

export interface CreateOrganizationRequest {
  name: string;
  type: 'CARE_HOME' | 'NURSING_HOME' | 'ASSISTED_LIVING' | 'HOSPITAL' | 'CLINIC';
  address?: Address;
  contactInfo?: ContactInfo;
  settings?: Partial<OrganizationSettings>;
  parentOrganizationId?: string;
  tenantId: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  type?: 'CARE_HOME' | 'NURSING_HOME' | 'ASSISTED_LIVING' | 'HOSPITAL' | 'CLINIC';
  address?: Address;
  contactInfo?: ContactInfo;
  settings?: Partial<OrganizationSettings>;
  parentOrganizationId?: string;
  isActive?: boolean;
}

export interface OrganizationSearchFilters {
  tenantId: string;
  type?: string;
  isActive?: boolean;
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface OrganizationSearchResult {
  organizations: Organization[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface OrganizationMetrics {
  totalResidents: number;
  activeResidents: number;
  totalStaff: number;
  activeStaff: number;
  occupancyRate: number;
  averageAge: number;
  careLevelBreakdown: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  incidentCount: number;
  medicationErrors: number;
  complianceScore: number;
}

export interface OrganizationHierarchy {
  organization: Organization;
  children: OrganizationHierarchy[];
  metrics: OrganizationMetrics;
}

export interface OrganizationPermission {
  id: string;
  organizationId: string;
  userId: string;
  role: 'ADMIN' | 'MANAGER' | 'NURSE' | 'CARER' | 'VIEWER';
  permissions: string[];
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationBranding {
  id: string;
  organizationId: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  customCss?: string;
  favicon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationConfiguration {
  id: string;
  organizationId: string;
  key: string;
  value: any;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'DATE';
  description?: string;
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface DataSharingPolicy {
  id: string;
  organizationId: string;
  policyName: string;
  description: string;
  dataTypes: string[];
  sharingPartners: string[];
  consentRequired: boolean;
  retentionPeriod: number; // in days
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface BillingConfiguration {
  id: string;
  organizationId: string;
  billingType: 'SELF_PAY' | 'NHS_FUNDED' | 'INSURANCE' | 'MIXED';
  paymentTerms: number; // in days
  currency: string;
  taxRate: number;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  invoiceTemplate?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface ComplianceConfiguration {
  id: string;
  organizationId: string;
  complianceType: 'CQC' | 'NHS' | 'GDPR' | 'ISO' | 'CUSTOM';
  requirements: string[];
  auditFrequency: number; // in days
  lastAuditDate?: Date;
  nextAuditDate?: Date;
  complianceOfficer: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Default organization settings
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const DEFAULT_ORGANIZATION_SETTINGS: OrganizationSettings = {
  timezone: 'Europe/London',
  currency: 'GBP',
  language: 'en',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24',
  notifications: {
    email: true,
    sms: false,
    push: true
  },
  features: {
    medicationManagement: true,
    carePlanning: true,
    reporting: true,
    nhsIntegration: false
  },
  compliance: {
    cqcRegistered: false,
    nhsContract: false
  }
};

// Organization types with descriptions
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const ORGANIZATION_TYPES = {
  CARE_HOME: 'Care Home',
  NURSING_HOME: 'Nursing Home',
  ASSISTED_LIVING: 'Assisted Living',
  HOSPITAL: 'Hospital',
  CLINIC: 'Clinic'
} as const;

// Organization roles with permissions
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const ORGANIZATION_ROLES = {
  ADMIN: {
    name: 'Administrator',
    permissions: ['*'] // All permissions
  },
  MANAGER: {
    name: 'Manager',
    permissions: [
      'residents:read',
      'residents:write',
      'staff:read',
      'staff:write',
      'reports:read',
      'settings:read'
    ]
  },
  NURSE: {
    name: 'Nurse',
    permissions: [
      'residents:read',
      'residents:write',
      'medications:read',
      'medications:write',
      'care_plans:read',
      'care_plans:write'
    ]
  },
  CARER: {
    name: 'Carer',
    permissions: [
      'residents:read',
      'medications:read',
      'care_plans:read',
      'activities:read',
      'activities:write'
    ]
  },
  VIEWER: {
    name: 'Viewer',
    permissions: [
      'residents:read',
      'reports:read'
    ]
  }
} as const;

// Validation functions
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export function validateOrganization(organization: Partial<Organization>): string[] {
  const errors: string[] = [];

  if (!organization.name?.trim()) {
    errors.push('Organization name is required');
  }

  if (!organization.type) {
    errors.push('Organization type is required');
  } else if (!Object.keys(ORGANIZATION_TYPES).includes(organization.type)) {
    errors.push('Invalid organization type');
  }

  if (!organization.tenantId?.trim()) {
    errors.push('Tenant ID is required');
  }

  if (organization.address) {
    const addressErrors = validateAddress(organization.address);
    errors.push(...addressErrors);
  }

  if (organization.contactInfo) {
    const contactErrors = validateContactInfo(organization.contactInfo);
    errors.push(...contactErrors);
  }

  return errors;
}

/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export function validateAddress(address: Address): string[] {
  const errors: string[] = [];

  if (!address.street?.trim()) {
    errors.push('Street address is required');
  }

  if (!address.city?.trim()) {
    errors.push('City is required');
  }

  if (!address.postcode?.trim()) {
    errors.push('Postcode is required');
  }

  if (!address.country?.trim()) {
    errors.push('Country is required');
  }

  return errors;
}

/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export function validateContactInfo(contactInfo: ContactInfo): string[] {
  const errors: string[] = [];

  if (contactInfo.email && !isValidEmail(contactInfo.email)) {
    errors.push('Invalid email format');
  }

  if (contactInfo.phone && !isValidPhone(contactInfo.phone)) {
    errors.push('Invalid phone format');
  }

  if (contactInfo.website && !isValidUrl(contactInfo.website)) {
    errors.push('Invalid website URL');
  }

  return errors;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
