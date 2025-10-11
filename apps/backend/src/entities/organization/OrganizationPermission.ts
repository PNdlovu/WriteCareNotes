import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Organization Permission Entity for WriteCareNotes
 * @module OrganizationPermissionEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Organization permission entity for hierarchical access control
 * with role-based permissions and organizational context.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { 
  IsUUID, 
  IsEnum, 
  IsString, 
  IsBoolean, 
  IsDate, 
  IsOptional, 
  Length,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from '@/entities/BaseEntity';
import { Organization } from './Organization';

export enum PermissionType {
  SYSTEM = 'system',
  ORGANIZATIONAL = 'organizational',
  FUNCTIONAL = 'functional',
  DATA = 'data',
  CLINICAL = 'clinical',
  FINANCIAL = 'financial',
  ADMINISTRATIVE = 'administrative'
}

export enum PermissionScope {
  GLOBAL = 'global',
  TENANT = 'tenant',
  ORGANIZATION = 'organization',
  DEPARTMENT = 'department',
  TEAM = 'team',
  INDIVIDUAL = 'individual'
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  APPROVE = 'approve',
  EXPORT = 'export',
  IMPORT = 'import',
  MANAGE = 'manage',
  ADMIN = 'admin'
}

export enum PermissionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
  REVOKED = 'revoked'
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  context: 'user' | 'organization' | 'resource' | 'time' | 'location';
}

export interface PermissionRestriction {
  restrictionType: 'time_based' | 'ip_based' | 'location_based' | 'device_based' | 'data_classification';
  restrictionValue: any;
  description: string;
  isActive: boolean;
}

export interface PermissionDelegation {
  delegatedTo: string;
  delegatedBy: string;
  delegationDate: Date;
  expiryDate?: Date;
  canSubDelegate: boolean;
  restrictions?: PermissionRestriction[];
}

export interface PermissionInheritance {
  inheritFrom: string[];
  inheritanceType: 'full' | 'partial' | 'conditional';
  conditions?: PermissionCondition[];
  overrides?: string[];
}

export interface PermissionAudit {
  auditId: string;
  action: 'granted' | 'revoked' | 'modified' | 'used' | 'delegated';
  timestamp: Date;
  performedBy: string;
  reason?: string;
  details?: Record<string, any>;
}

@Entity('wcn_organization_permissions')
@Index(['organizationId', 'userId'])
@Index(['permissionType', 'scope'])
@Index(['status', 'isActive'])
@Index(['effectiveDate', 'expiryDate'])
export class OrganizationPermission extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  override id!: string;

  // Permission Identity
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @Length(1, 255)
  permissionName!: string;

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  @Length(1, 100)
  permissionCode!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  // Permission Classification
  @Column({ type: 'enum', enum: PermissionType })
  @IsEnum(PermissionType)
  permissionType!: PermissionType;

  @Column({ type: 'enum', enum: PermissionScope })
  @IsEnum(PermissionScope)
  scope!: PermissionScope;

  @Column({ type: 'enum', enum: PermissionAction })
  @IsEnum(PermissionAction)
  action!: PermissionAction;

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  @Length(1, 100)
  resource!: string;

  // Permission Status
  @Column({ type: 'enum', enum: PermissionStatus, default: PermissionStatus.ACTIVE })
  @IsEnum(PermissionStatus)
  status!: PermissionStatus;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActive!: boolean;

  @Column({ type: 'integer', default: 0 })
  priority!: number;

  // Subject Information
  @Column({ type: 'uuid' })
  @IsUUID()
  userId!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  roleId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  groupId?: string;

  // Effective Dates
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @IsDate()
  effectiveDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  expiryDate?: Date;

  // Permission Conditions
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Object)
  conditions?: PermissionCondition[];

  // Permission Restrictions
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Object)
  restrictions?: PermissionRestriction[];

  // Delegation Information
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  delegation?: PermissionDelegation;

  // Inheritance Information
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  inheritance?: PermissionInheritance;

  // Approval Workflow
  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  grantedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  grantedDate?: Date;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  grantReason?: string;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  approvedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  approvedDate?: Date;

  // Usage Tracking
  @Column({ type: 'integer', default: 0 })
  usageCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  lastUsedDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  lastReviewDate?: Date;

  // Audit Trail
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Object)
  auditTrail?: PermissionAudit[];

  // Relationships
  @ManyToOne(() => Organization, organization => organization.permissions)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ type: 'uuid' })
  @IsUUID()
  organizationId!: string;

  // Audit Fields
  @CreateDateColumn()
  override createdAt!: Date;

  @UpdateDateColumn()
  override updatedAt!: Date;

  @DeleteDateColumn()
  override deletedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  override createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  override updatedBy?: string;

  /**
   * Lifecycle hooks
   */
  @BeforeInsert()
  async beforeInsert(): Promise<void> {
    this.validatePermissionData();
    this.setDefaults();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    if (!this.permissionCode) {
      this.permissionCode = this.generatePermissionCode();
    }
    
    this.addAuditEntry('granted', this.createdBy || 'system', this.grantReason);
  }

  @BeforeUpdate()
  async beforeUpdate(): Promise<void> {
    this.validatePermissionData();
    this.updateUsageTracking();
    
    this.addAuditEntry('modified', this.updatedBy || 'system', 'Permission updated');
  }

  /**
   * Validation methods
   */
  private validatePermissionData(): void {
    // Validate effective dates
    if (this.expiryDate && this.effectiveDate >= this.expiryDate) {
      throw new Error('Effective date must be before expiry date');
    }

    // Validate permission scope and resource alignment
    this.validateScopeResourceAlignment();

    // Validate conditions
    if (this.conditions) {
      this.validateConditions();
    }

    // Validate restrictions
    if (this.restrictions) {
      this.validateRestrictions();
    }

    // Validate delegation
    if (this.delegation) {
      this.validateDelegation();
    }
  }

  private validateScopeResourceAlignment(): void {
    const scopeResourceMap = {
      [PermissionScope.GLOBAL]: ['system', 'tenant', 'organization'],
      [PermissionScope.TENANT]: ['tenant', 'organization', 'user'],
      [PermissionScope.ORGANIZATION]: ['organization', 'department', 'resident', 'staff'],
      [PermissionScope.DEPARTMENT]: ['department', 'team', 'resident', 'staff'],
      [PermissionScope.TEAM]: ['team', 'resident', 'staff'],
      [PermissionScope.INDIVIDUAL]: ['user', 'resident', 'staff']
    };

    const allowedResources = scopeResourceMap[this.scope];
    if (allowedResources && !allowedResources.some(resource => this.resource.includes(resource))) {
      throw new Error(`Resource '${this.resource}' not compatible with scope '${this.scope}'`);
    }
  }

  private validateConditions(): void {
    if (!this.conditions || this.conditions.length === 0) return;

    for (const condition of this.conditions) {
      if (!condition.field || !condition.operator || condition.value === undefined) {
        throw new Error('Invalid permission condition: field, operator, and value are required');
      }

      // Validate operator-value compatibility
      if (['in', 'not_in'].includes(condition.operator) && !Array.isArray(condition.value)) {
        throw new Error(`Operator '${condition.operator}' requires array value`);
      }

      if (['greater_than', 'less_than'].includes(condition.operator) && isNaN(Number(condition.value))) {
        throw new Error(`Operator '${condition.operator}' requires numeric value`);
      }
    }
  }

  private validateRestrictions(): void {
    if (!this.restrictions || this.restrictions.length === 0) return;

    for (const restriction of this.restrictions) {
      if (!restriction.restrictionType || restriction.restrictionValue === undefined) {
        throw new Error('Invalid permission restriction: type and value are required');
      }

      // Validate restriction type-specific rules
      switch (restriction.restrictionType) {
        case 'time_based':
          this.validateTimeBasedRestriction(restriction);
          break;
        case 'ip_based':
          this.validateIPBasedRestriction(restriction);
          break;
        case 'location_based':
          this.validateLocationBasedRestriction(restriction);
          break;
      }
    }
  }

  private validateTimeBasedRestriction(restriction: PermissionRestriction): void {
    const timeValue = restriction.restrictionValue;
    
    if (!timeValue.startTime || !timeValue.endTime) {
      throw new Error('Time-based restriction requires startTime and endTime');
    }

    if (timeValue.days && !Array.isArray(timeValue.days)) {
      throw new Error('Time-based restriction days must be an array');
    }
  }

  private validateIPBasedRestriction(restriction: PermissionRestriction): void {
    const ipValue = restriction.restrictionValue;
    
    if (typeof ipValue === 'string') {
      // Validate single IP or CIDR
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
      if (!ipRegex.test(ipValue)) {
        throw new Error('Invalid IP address or CIDR format');
      }
    } else if (Array.isArray(ipValue)) {
      // Validate array of IPs
      for (const ip of ipValue) {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
        if (!ipRegex.test(ip)) {
          throw new Error(`Invalid IP address format: ${ip}`);
        }
      }
    } else {
      throw new Error('IP-based restriction value must be string or array');
    }
  }

  private validateLocationBasedRestriction(restriction: PermissionRestriction): void {
    const locationValue = restriction.restrictionValue;
    
    if (!locationValue.allowedLocations && !locationValue.blockedLocations) {
      throw new Error('Location-based restriction requires allowedLocations or blockedLocations');
    }
  }

  private validateDelegation(): void {
    if (!this.delegation) return;

    if (!this.delegation.delegatedTo || !this.delegation.delegatedBy) {
      throw new Error('Delegation requires delegatedTo and delegatedBy');
    }

    if (this.delegation.expiryDate && this.delegation.delegationDate >= this.delegation.expiryDate) {
      throw new Error('Delegation date must be before expiry date');
    }
  }

  /**
   * Utility methods
   */
  private setDefaults(): void {
    if (!this.effectiveDate) {
      this.effectiveDate = new Date();
    }

    if (!this.auditTrail) {
      this.auditTrail = [];
    }

    if (!this.grantedDate) {
      this.grantedDate = new Date();
    }
  }

  private generatePermissionCode(): string {
    const typePrefix = this.permissionType.substring(0, 3).toUpperCase();
    const actionPrefix = this.action.substring(0, 3).toUpperCase();
    const resourcePrefix = this.resource.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    
    return `${typePrefix}-${actionPrefix}-${resourcePrefix}-${timestamp}`;
  }

  private updateUsageTracking(): void {
    this.usageCount += 1;
    this.lastUsedDate = new Date();
  }

  private addAuditEntry(action: string, performedBy: string, reason?: string): void {
    if (!this.auditTrail) {
      this.auditTrail = [];
    }

    constauditEntry: PermissionAudit = {
      auditId: uuidv4(),
      action: action as any,
      timestamp: new Date(),
      performedBy,
      reason,
      details: {
        permissionCode: this.permissionCode,
        scope: this.scope,
        resource: this.resource,
        action: this.action
      }
    };

    this.auditTrail.push(auditEntry);

    // Keep only last 50 audit entries
    if (this.auditTrail.length > 50) {
      this.auditTrail = this.auditTrail.slice(-50);
    }
  }

  /**
   * Business methods
   */
  
  /**
   * Check if permission is currently effective
   */
  isEffective(): boolean {
    const now = new Date();
    
    if (this.effectiveDate > now) {
      return false;
    }
    
    if (this.expiryDate && this.expiryDate <= now) {
      return false;
    }
    
    return this.isActive && this.status === PermissionStatus.ACTIVE;
  }

  /**
   * Check if permission applies to a specific context
   */
  appliesTo(context: {
    userId?: string;
    organizationId?: string;
    resource?: any;
    action?: string;
    timestamp?: Date;
    ipAddress?: string;
    location?: any;
  }): boolean {
    try {
      // Check basic permission match
      if (context.userId && this.userId !== context.userId) {
        return false;
      }

      if (context.organizationId && this.organizationId !== context.organizationId) {
        return false;
      }

      if (context.action && this.action !== context.action) {
        return false;
      }

      // Check conditions
      if (this.conditions && !this.evaluateConditions(context)) {
        return false;
      }

      // Check restrictions
      if (this.restrictions && !this.checkRestrictions(context)) {
        return false;
      }

      return this.isEffective();

    } catch (error: unknown) {
      return false;
    }
  }

  private evaluateConditions(context: any): boolean {
    if (!this.conditions) return true;

    return this.conditions.every(condition => {
      letcontextValue: any;

      switch (condition.context) {
        case 'user':
          contextValue = context.userId;
          break;
        case 'organization':
          contextValue = context.organizationId;
          break;
        case 'resource':
          contextValue = context.resource?.[condition.field];
          break;
        case 'time':
          contextValue = context.timestamp || new Date();
          break;
        case 'location':
          contextValue = context.location?.[condition.field];
          break;
        default:
          contextValue = context[condition.field];
      }

      return this.evaluateCondition(condition, contextValue);
    });
  }

  private evaluateCondition(condition: PermissionCondition, contextValue: any): boolean {
    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;
      case 'not_equals':
        return contextValue !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(contextValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(contextValue);
      case 'contains':
        return String(contextValue).includes(String(condition.value));
      case 'greater_than':
        return Number(contextValue) > Number(condition.value);
      case 'less_than':
        return Number(contextValue) < Number(condition.value);
      default:
        return false;
    }
  }

  private checkRestrictions(context: any): boolean {
    if (!this.restrictions) return true;

    return this.restrictions.every(restriction => {
      if (!restriction.isActive) return true;

      switch (restriction.restrictionType) {
        case 'time_based':
          return this.checkTimeRestriction(restriction, context.timestamp);
        case 'ip_based':
          return this.checkIPRestriction(restriction, context.ipAddress);
        case 'location_based':
          return this.checkLocationRestriction(restriction, context.location);
        default:
          return true;
      }
    });
  }

  private checkTimeRestriction(restriction: PermissionRestriction, timestamp?: Date): boolean {
    const now = timestamp || new Date();
    const timeValue = restriction.restrictionValue;

    // Check day of week
    if (timeValue.days && Array.isArray(timeValue.days)) {
      const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
      if (!timeValue.days.includes(dayOfWeek)) {
        return false;
      }
    }

    // Check time range
    if (timeValue.startTime && timeValue.endTime) {
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      return currentTime >= timeValue.startTime && currentTime <= timeValue.endTime;
    }

    return true;
  }

  private checkIPRestriction(restriction: PermissionRestriction, ipAddress?: string): boolean {
    if (!ipAddress) return false;

    const allowedIPs = Array.isArray(restriction.restrictionValue) 
      ? restriction.restrictionValue 
      : [restriction.restrictionValue];

    return allowedIPs.some(allowedIP => {
      if (allowedIP.includes('/')) {
        // CIDR notation - simplified check
        const [network, mask] = allowedIP.split('/');
        return ipAddress.startsWith(network.split('.').slice(0, parseInt(mask) / 8).join('.'));
      } else {
        // Exact IP match
        return ipAddress === allowedIP;
      }
    });
  }

  private checkLocationRestriction(restriction: PermissionRestriction, location?: any): boolean {
    if (!location) return false;

    const locationValue = restriction.restrictionValue;

    if (locationValue.allowedLocations) {
      return locationValue.allowedLocations.some((allowed: any) => 
        this.matchesLocation(location, allowed)
      );
    }

    if (locationValue.blockedLocations) {
      return !locationValue.blockedLocations.some((blocked: any) => 
        this.matchesLocation(location, blocked)
      );
    }

    return true;
  }

  private matchesLocation(userLocation: any, restrictionLocation: any): boolean {
    // Simplified location matching
    if (restrictionLocation.country && userLocation.country !== restrictionLocation.country) {
      return false;
    }

    if (restrictionLocation.region && userLocation.region !== restrictionLocation.region) {
      return false;
    }

    if (restrictionLocation.city && userLocation.city !== restrictionLocation.city) {
      return false;
    }

    return true;
  }

  /**
   * Delegate permission to another user
   */
  delegate(
    delegatedTo: string,
    delegatedBy: string,
    expiryDate?: Date,
    canSubDelegate: boolean = false,
    restrictions?: PermissionRestriction[]
  ): void {
    this.delegation = {
      delegatedTo,
      delegatedBy,
      delegationDate: new Date(),
      expiryDate,
      canSubDelegate,
      restrictions
    };

    this.addAuditEntry('delegated', delegatedBy, `Delegated to ${delegatedTo}`);
  }

  /**
   * Revoke permission
   */
  revoke(revokedBy: string, reason?: string): void {
    this.status = PermissionStatus.REVOKED;
    this.isActive = false;
    
    this.addAuditEntry('revoked', revokedBy, reason);
  }

  /**
   * Extend permission expiry
   */
  extend(newExpiryDate: Date, extendedBy: string, reason?: string): void {
    const oldExpiry = this.expiryDate;
    this.expiryDate = newExpiryDate;
    
    this.addAuditEntry('modified', extendedBy, 
      `Extended expiry from ${oldExpiry} to ${newExpiryDate}. Reason: ${reason}`
    );
  }

  /**
   * Get permission summary
   */
  getSummary(): {
    id: string;
    name: string;
    code: string;
    type: PermissionType;
    scope: PermissionScope;
    action: PermissionAction;
    resource: string;
    status: PermissionStatus;
    isEffective: boolean;
    expiryDate?: Date;
  } {
    return {
      id: this.id,
      name: this.permissionName,
      code: this.permissionCode,
      type: this.permissionType,
      scope: this.scope,
      action: this.action,
      resource: this.resource,
      status: this.status,
      isEffective: this.isEffective(),
      expiryDate: this.expiryDate
    };
  }
}

export default OrganizationPermission;
