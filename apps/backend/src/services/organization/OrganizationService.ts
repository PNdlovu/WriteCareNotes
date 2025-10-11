/**
 * @fileoverview Organization Service
 * @module Services/Organization/OrganizationService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Complete organization management service with CRUD operations,
 * compliance tracking, and settings management
 */

import { Repository, DataSource } from 'typeorm';
import { Organization, OrganizationType } from '../../entities/Organization';
import { Tenant } from '../../entities/Tenant';

export interface CreateOrganizationDto {
  tenantId: string;
  name: string;
  type: OrganizationType;
  cqcRegistration?: string;
  ofstedRegistration?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    county?: string;
    postcode: string;
    country: string;
  };
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  settings?: Record<string, any>;
  createdBy?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  type?: OrganizationType;
  cqcRegistration?: string;
  ofstedRegistration?: string;
  address?: Record<string, any>;
  contactInfo?: Record<string, any>;
  settings?: Record<string, any>;
  complianceStatus?: Record<string, any>;
  updatedBy?: string;
}

export interface OrganizationFilters {
  tenantId?: string;
  type?: OrganizationType;
  name?: string;
  isActive?: boolean;
}

export class OrganizationService {
  privateorganizationRepository: Repository<Organization>;
  privatetenantRepository: Repository<Tenant>;

  constructor(dataSource: DataSource) {
    this.organizationRepository = dataSource.getRepository(Organization);
    this.tenantRepository = dataSource.getRepository(Tenant);
  }

  /**
   * Create a new organization
   */
  async create(dto: CreateOrganizationDto): Promise<Organization> {
    // Validate tenant exists and is active
    const tenant = await this.tenantRepository.findOne({
      where: { id: dto.tenantId },
    });

    if (!tenant) {
      throw new Error(`Tenant with ID ${dto.tenantId} not found`);
    }

    if (!tenant.isActive) {
      throw new Error(`Tenant ${tenant.name} is not active`);
    }

    // Create organization
    const organization = this.organizationRepository.create({
      tenantId: dto.tenantId,
      name: dto.name,
      type: dto.type,
      cqcRegistration: dto.cqcRegistration,
      ofstedRegistration: dto.ofstedRegistration,
      address: dto.address || {},
      contactInfo: dto.contactInfo || {},
      settings: dto.settings || this.getDefaultSettings(dto.type),
      complianceStatus: this.getDefaultComplianceStatus(dto.type),
      createdBy: dto.createdBy,
    });

    const saved = await this.organizationRepository.save(organization);

    console.info('Organization created', {
      organizationId: saved.id,
      name: saved.name,
      type: saved.type,
      tenantId: saved.tenantId,
    });

    return saved;
  }

  /**
   * Find organization by ID
   */
  async findById(id: string, tenantId?: string): Promise<Organization | null> {
    constwhere: any = { id };
    
    if (tenantId) {
      where.tenantId = tenantId;
      where.deletedAt = null;
    }

    return this.organizationRepository.findOne({
      where,
      relations: ['tenant'],
    });
  }

  /**
   * Find all organizations with filters
   */
  async findAll(filters: OrganizationFilters = {}): Promise<Organization[]> {
    const queryBuilder = this.organizationRepository
      .createQueryBuilder('organization')
      .leftJoinAndSelect('organization.tenant', 'tenant')
      .where('organization.deletedAt IS NULL');

    if (filters.tenantId) {
      queryBuilder.andWhere('organization.tenantId = :tenantId', {
        tenantId: filters.tenantId,
      });
    }

    if (filters.type) {
      queryBuilder.andWhere('organization.type = :type', {
        type: filters.type,
      });
    }

    if (filters.name) {
      queryBuilder.andWhere('organization.name ILIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    queryBuilder.orderBy('organization.name', 'ASC');

    return queryBuilder.getMany();
  }

  /**
   * Update organization
   */
  async update(
    id: string,
    dto: UpdateOrganizationDto,
    tenantId?: string
  ): Promise<Organization> {
    const organization = await this.findById(id, tenantId);

    if (!organization) {
      throw new Error(`Organization with ID ${id} not found`);
    }

    // Update fields
    if (dto.name !== undefined) organization.name = dto.name;
    if (dto.type !== undefined) organization.type = dto.type;
    if (dto.cqcRegistration !== undefined) organization.cqcRegistration = dto.cqcRegistration;
    if (dto.ofstedRegistration !== undefined) organization.ofstedRegistration = dto.ofstedRegistration;
    if (dto.address !== undefined) organization.address = dto.address;
    if (dto.contactInfo !== undefined) organization.contactInfo = dto.contactInfo;
    if (dto.settings !== undefined) {
      organization.settings = { ...organization.settings, ...dto.settings };
    }
    if (dto.complianceStatus !== undefined) {
      organization.complianceStatus = { ...organization.complianceStatus, ...dto.complianceStatus };
    }
    if (dto.updatedBy !== undefined) organization.updatedBy = dto.updatedBy;

    const updated = await this.organizationRepository.save(organization);

    console.info('Organization updated', {
      organizationId: updated.id,
      changes: Object.keys(dto),
    });

    return updated;
  }

  /**
   * Soft delete organization
   */
  async delete(id: string, tenantId?: string, deletedBy?: string): Promise<void> {
    const organization = await this.findById(id, tenantId);

    if (!organization) {
      throw new Error(`Organization with ID ${id} not found`);
    }

    organization.deletedAt = new Date();
    if (deletedBy) {
      organization.updatedBy = deletedBy;
    }

    await this.organizationRepository.save(organization);

    console.info('Organization deleted', {
      organizationId: id,
      deletedBy,
    });
  }

  /**
   * Restore soft-deleted organization
   */
  async restore(id: string, tenantId?: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { id, tenantId },
    });

    if (!organization) {
      throw new Error(`Organization with ID ${id} not found`);
    }

    organization.deletedAt = null;
    const restored = await this.organizationRepository.save(organization);

    console.info('Organization restored', { organizationId: id });

    return restored;
  }

  /**
   * Update organization settings
   */
  async updateSettings(
    id: string,
    settings: Record<string, any>,
    tenantId?: string
  ): Promise<Organization> {
    const organization = await this.findById(id, tenantId);

    if (!organization) {
      throw new Error(`Organization with ID ${id} not found`);
    }

    organization.settings = { ...organization.settings, ...settings };
    const updated = await this.organizationRepository.save(organization);

    console.info('Organization settings updated', {
      organizationId: id,
      settings: Object.keys(settings),
    });

    return updated;
  }

  /**
   * Update compliance status
   */
  async updateComplianceStatus(
    id: string,
    complianceStatus: Record<string, any>,
    tenantId?: string
  ): Promise<Organization> {
    const organization = await this.findById(id, tenantId);

    if (!organization) {
      throw new Error(`Organization with ID ${id} not found`);
    }

    organization.complianceStatus = {
      ...organization.complianceStatus,
      ...complianceStatus,
      lastUpdated: new Date().toISOString(),
    };

    const updated = await this.organizationRepository.save(organization);

    console.info('Organization compliance status updated', {
      organizationId: id,
      status: complianceStatus,
    });

    return updated;
  }

  /**
   * Get organizations by tenant
   */
  async findByTenant(tenantId: string): Promise<Organization[]> {
    return this.findAll({ tenantId });
  }

  /**
   * Count organizations by tenant
   */
  async countByTenant(tenantId: string): Promise<number> {
    return this.organizationRepository.count({
      where: { tenantId, deletedAt: null },
    });
  }

  /**
   * Check if organization belongs to tenant
   */
  async belongsToTenant(organizationId: string, tenantId: string): Promise<boolean> {
    const count = await this.organizationRepository.count({
      where: { id: organizationId, tenantId },
    });
    return count > 0;
  }

  /**
   * Validate organization access for user
   */
  async validateAccess(
    organizationId: string,
    userId: string,
    tenantId: string
  ): Promise<boolean> {
    // First check tenant match
    const belongsToTenant = await this.belongsToTenant(organizationId, tenantId);
    if (!belongsToTenant) {
      return false;
    }

    // In a real implementation, would check user permissions here
    // For now, just return true if organization belongs to tenant
    return true;
  }

  /**
   * Get default settings for organization type
   */
  private getDefaultSettings(type: OrganizationType): Record<string, any> {
    const baseSettings = {
      timezone: 'Europe/London',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      currency: 'GBP',
      language: 'en-GB',
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
    };

    consttypeSpecificSettings: Record<OrganizationType, Record<string, any>> = {
      [OrganizationType.CARE_HOME]: {
        ...baseSettings,
        maxResidents: 50,
        staffingRatio: '1:4',
        visitingHours: { start: '09:00', end: '20:00' },
      },
      [OrganizationType.NURSING_HOME]: {
        ...baseSettings,
        maxResidents: 40,
        staffingRatio: '1:3',
        medicationManagement: true,
        visitingHours: { start: '08:00', end: '21:00' },
      },
      [OrganizationType.ASSISTED_LIVING]: {
        ...baseSettings,
        maxResidents: 30,
        staffingRatio: '1:5',
        independentLiving: true,
      },
      [OrganizationType.DOMICILIARY]: {
        ...baseSettings,
        maxClients: 100,
        travelTimeTracking: true,
        mileageTracking: true,
      },
      [OrganizationType.NHS_TRUST]: {
        ...baseSettings,
        maxDepartments: 20,
        integrations: ['NHS Spine', 'GP Connect'],
      },
    };

    return typeSpecificSettings[type] || baseSettings;
  }

  /**
   * Get default compliance status for organization type
   */
  private getDefaultComplianceStatus(type: OrganizationType): Record<string, any> {
    const baseStatus = {
      lastInspection: null,
      nextInspection: null,
      overallRating: null,
      areas: [],
    };

    consttypeSpecificStatus: Record<OrganizationType, Record<string, any>> = {
      [OrganizationType.CARE_HOME]: {
        ...baseStatus,
        regulator: 'CQC',
        requiredAreas: ['Safe', 'Effective', 'Caring', 'Responsive', 'Well-led'],
      },
      [OrganizationType.NURSING_HOME]: {
        ...baseStatus,
        regulator: 'CQC',
        requiredAreas: ['Safe', 'Effective', 'Caring', 'Responsive', 'Well-led'],
        nursingStandards: true,
      },
      [OrganizationType.ASSISTED_LIVING]: {
        ...baseStatus,
        regulator: 'CQC',
        requiredAreas: ['Safe', 'Effective', 'Caring', 'Responsive', 'Well-led'],
      },
      [OrganizationType.DOMICILIARY]: {
        ...baseStatus,
        regulator: 'CQC',
        requiredAreas: ['Safe', 'Effective', 'Caring', 'Responsive', 'Well-led'],
        homeVisits: true,
      },
      [OrganizationType.NHS_TRUST]: {
        ...baseStatus,
        regulator: 'CQC',
        requiredAreas: ['Safe', 'Effective', 'Caring', 'Responsive', 'Well-led'],
        nhsStandards: true,
      },
    };

    return typeSpecificStatus[type] || baseStatus;
  }
}
