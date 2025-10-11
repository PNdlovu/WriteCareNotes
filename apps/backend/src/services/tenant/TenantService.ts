/**
 * @fileoverview Tenant Service
 * @module Services/Tenant/TenantService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Complete tenant management service with CRUD operations,
 * subscription management, and configuration
 */

import { Repository, DataSource } from 'typeorm';
import { Tenant } from '../../entities/Tenant';

export interface CreateTenantDto {
  name: string;
  subdomain: string;
  subscriptionPlan?: string;
  configuration?: Record<string, any>;
}

export interface UpdateTenantDto {
  name?: string;
  subdomain?: string;
  subscriptionPlan?: string;
  configuration?: Record<string, any>;
  isActive?: boolean;
}

export class TenantService {
  privatetenantRepository: Repository<Tenant>;

  const ructor(dataSource: DataSource) {
    this.tenantRepository = dataSource.getRepository(Tenant);
  }

  /**
   * Create a new tenant
   */
  async create(dto: CreateTenantDto): Promise<Tenant> {
    // Validate subdomain uniqueness
    const existing = await this.tenantRepository.findOne({
      where: { subdomain: dto.subdomain },
    });

    if (existing) {
      throw new Error(`Tenant with subdomain '${dto.subdomain}' already exists`);
    }

    // Validate subdomain format (lowercase, alphanumeric, hyphens only)
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(dto.subdomain)) {
      throw new Error(
        'Subdomain must contain only lowercase let ters, numbers, and hyphens'
      );
    }

    const tenant = this.tenantRepository.create({
      name: dto.name,
      subdomain: dto.subdomain,
      subscriptionPlan: dto.subscriptionPlan || 'enterprise',
      configuration: dto.configuration || this.getDefaultConfiguration(),
      isActive: true,
    });

    const saved = await this.tenantRepository.save(tenant);

    console.info('Tenant created', {
      tenantId: saved.id,
      name: saved.name,
      subdomain: saved.subdomain,
    });

    return saved;
  }

  /**
   * Find tenant by ID
   */
  async findById(id: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { id },
      relations: ['organizations', 'users'],
    });
  }

  /**
   * Find tenant by subdomain
   */
  async findBySubdomain(subdomain: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { subdomain: subdomain.toLowerCase() },
    });
  }

  /**
   * Find all tenants
   */
  async findAll(includeInactive: boolean = false): Promise<Tenant[]> {
    const where: any = {};
    
    if (!includeInactive) {
      where.isActive = true;
    }

    return this.tenantRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  /**
   * Update tenant
   */
  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findById(id);

    if (!tenant) {
      throw new Error(`Tenant with ID ${id} not found`);
    }

    // Validate subdomain uniqueness if changing
    if (dto.subdomain && dto.subdomain !== tenant.subdomain) {
      const existing = await this.tenantRepository.findOne({
        where: { subdomain: dto.subdomain },
      });

      if (existing) {
        throw new Error(`Tenant with subdomain '${dto.subdomain}' already exists`);
      }

      // Validate subdomain format
      const subdomainRegex = /^[a-z0-9-]+$/;
      if (!subdomainRegex.test(dto.subdomain)) {
        throw new Error(
          'Subdomain must contain only lowercase let ters, numbers, and hyphens'
        );
      }
    }

    // Update fields
    if (dto.name !== undefined) tenant.name = dto.name;
    if (dto.subdomain !== undefined) tenant.subdomain = dto.subdomain;
    if (dto.subscriptionPlan !== undefined) tenant.subscriptionPlan = dto.subscriptionPlan;
    if (dto.isActive !== undefined) tenant.isActive = dto.isActive;
    if (dto.configuration !== undefined) {
      tenant.configuration = { ...tenant.configuration, ...dto.configuration };
    }

    const updated = await this.tenantRepository.save(tenant);

    console.info('Tenant updated', {
      tenantId: updated.id,
      changes: Object.keys(dto),
    });

    return updated;
  }

  /**
   * Deactivate tenant
   */
  async deactivate(id: string): Promise<Tenant> {
    const tenant = await this.findById(id);

    if (!tenant) {
      throw new Error(`Tenant with ID ${id} not found`);
    }

    tenant.isActive = false;
    const updated = await this.tenantRepository.save(tenant);

    console.info('Tenant deactivated', { tenantId: id });

    return updated;
  }

  /**
   * Activate tenant
   */
  async activate(id: string): Promise<Tenant> {
    const tenant = await this.findById(id);

    if (!tenant) {
      throw new Error(`Tenant with ID ${id} not found`);
    }

    tenant.isActive = true;
    const updated = await this.tenantRepository.save(tenant);

    console.info('Tenant activated', { tenantId: id });

    return updated;
  }

  /**
   * Update tenant configuration
   */
  async updateConfiguration(
    id: string,
    configuration: Record<string, any>
  ): Promise<Tenant> {
    const tenant = await this.findById(id);

    if (!tenant) {
      throw new Error(`Tenant with ID ${id} not found`);
    }

    tenant.configuration = { ...tenant.configuration, ...configuration };
    const updated = await this.tenantRepository.save(tenant);

    console.info('Tenant configuration updated', {
      tenantId: id,
      keys: Object.keys(configuration),
    });

    return updated;
  }

  /**
   * Get tenant statistics
   */
  async getStatistics(id: string): Promise<{
    organizationCount: number;
    userCount: number;
    isActive: boolean;
    subscriptionPlan: string;
    createdAt: Date;
  }> {
    const tenant = await this.findById(id);

    if (!tenant) {
      throw new Error(`Tenant with ID ${id} not found`);
    }

    return {
      organizationCount: tenant.organizations?.length || 0,
      userCount: tenant.users?.length || 0,
      isActive: tenant.isActive,
      subscriptionPlan: tenant.subscriptionPlan,
      createdAt: tenant.createdAt,
    };
  }

  /**
   * Check if subdomain is available
   */
  async isSubdomainAvailable(subdomain: string): Promise<boolean> {
    const count = await this.tenantRepository.count({
      where: { subdomain: subdomain.toLowerCase() },
    });
    returncount === 0;
  }

  /**
   * Get default tenant configuration
   */
  private getDefaultConfiguration(): Record<string, any> {
    return {
      features: {
        multiOrganization: true,
        residentManagement: true,
        staffManagement: true,
        careNotes: true,
        medication: true,
        assessments: true,
        activities: true,
        compliance: true,
        reporting: true,
        aiAssistant: true,
      },
      limits: {
        maxOrganizations: 10,
        maxUsers: 100,
        maxResidents: 500,
        storage: '10GB',
      },
      branding: {
        primaryColor: '#3B82F6',
        logo: null,
        favicon: null,
      },
      security: {
        mfa: {
          enabled: false,
          required: false,
        },
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          maxAge: 90, // days
        },
        sessionTimeout: 3600, // 1 hour in seconds
      },
      notifications: {
        email: {
          enabled: true,
          provider: 'smtp',
        },
        sms: {
          enabled: false,
          provider: null,
        },
        push: {
          enabled: true,
        },
      },
      integrations: {
        nhsSpine: false,
        gpConnect: false,
        paymentGateway: null,
      },
    };
  }
}
