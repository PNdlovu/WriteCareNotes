/**
 * @fileoverview Staff Management Service - Complete CRUD and Business Logic
 * @module Services/Staff/StaffService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * 
 * @description
 * Production-ready service for managing staff members with full CRUD operations,
 * shift management, certification tracking, and compliance monitoring.
 * Integrates with Organization service for multi-tenancy.
 */

import { DataSource, Repository, IsNull, Not, Like, In } from 'typeorm';
import { StaffMember, StaffStatus, EmploymentType, StaffRole } from '../../domains/staff/entities/StaffMember';

interface CreateStaffDTO {
  firstName: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: Date;
  gender?: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  employmentType: EmploymentType;
  role: StaffRole;
  department?: string;
  employeeNumber?: string;
  hireDate: Date;
  professionalRegistration?: string;
  registrationExpiry?: Date;
  dbsNumber?: string;
  dbsExpiry?: Date;
  qualifications?: Array<{
    name: string;
    level: string;
    institution: string;
    dateObtained: Date;
    expiryDate?: Date;
  }>;
  certifications?: Array<{
    name: string;
    issuingBody: string;
    dateIssued: Date;
    expiryDate?: Date;
  }>;
  userId?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  availability?: {
    monday?: { start: string; end: string };
    tuesday?: { start: string; end: string };
    wednesday?: { start: string; end: string };
    thursday?: { start: string; end: string };
    friday?: { start: string; end: string };
    saturday?: { start: string; end: string };
    sunday?: { start: string; end: string };
  };
}

interface UpdateStaffDTO extends Partial<CreateStaffDTO> {
  status?: StaffStatus;
  terminationDate?: Date;
}

interface StaffFilters {
  status?: StaffStatus;
  role?: StaffRole;
  employmentType?: EmploymentType;
  department?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  organizationId?: string;
}

interface CertificationUpdateDTO {
  name: string;
  issuingBody: string;
  dateIssued: Date;
  expiryDate?: Date;
}

interface AvailabilityUpdateDTO {
  monday?: { start: string; end: string };
  tuesday?: { start: string; end: string };
  wednesday?: { start: string; end: string };
  thursday?: { start: string; end: string };
  friday?: { start: string; end: string };
  saturday?: { start: string; end: string };
  sunday?: { start: string; end: string };
}

export class StaffService {
  private staffRepository: Repository<StaffMember>;

  constructor(private dataSource: DataSource) {
    this.staffRepository = this.dataSource.getRepository(StaffMember);
  }

  /**
   * Create new staff member
   */
  async create(
    dto: CreateStaffDTO,
    userId: string,
    tenantId: string,
    organizationId: string
  ): Promise<StaffMember> {
    const staff = this.staffRepository.create({
      ...dto,
      tenantId,
      organizationId,
      status: StaffStatus.ACTIVE,
      createdBy: userId,
      updatedBy: userId,
    });

    // Validate before saving
    const validation = staff.validate();
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check for duplicate email
    const existing = await this.staffRepository.findOne({
      where: { email: dto.email, deletedAt: IsNull() },
    });

    if (existing) {
      throw new Error('Staff member with this email already exists');
    }

    return await this.staffRepository.save(staff);
  }

  /**
   * Find staff member by ID
   */
  async findById(id: string, tenantId: string): Promise<StaffMember | null> {
    return await this.staffRepository.findOne({
      where: {
        id,
        tenantId,
        deletedAt: IsNull(),
      },
      relations: ['organization'],
    });
  }

  /**
   * Find all staff members with filters
   */
  async findAll(filters: StaffFilters, tenantId: string): Promise<{
    data: StaffMember[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      status,
      role,
      employmentType,
      department,
      searchTerm,
      page = 1,
      limit = 20,
      sortBy = 'lastName',
      sortOrder = 'ASC',
      organizationId,
    } = filters;

    const query = this.staffRepository.createQueryBuilder('staff')
      .where('staff.tenantId = :tenantId', { tenantId })
      .andWhere('staff.deletedAt IS NULL');

    // Apply filters
    if (status) {
      query.andWhere('staff.status = :status', { status });
    }

    if (role) {
      query.andWhere('staff.role = :role', { role });
    }

    if (employmentType) {
      query.andWhere('staff.employmentType = :employmentType', { employmentType });
    }

    if (department) {
      query.andWhere('staff.department = :department', { department });
    }

    if (organizationId) {
      query.andWhere('staff.organizationId = :organizationId', { organizationId });
    }

    if (searchTerm) {
      query.andWhere(
        '(LOWER(staff.firstName) LIKE LOWER(:searchTerm) OR ' +
        'LOWER(staff.lastName) LIKE LOWER(:searchTerm) OR ' +
        'LOWER(staff.email) LIKE LOWER(:searchTerm) OR ' +
        'LOWER(staff.employeeNumber) LIKE LOWER(:searchTerm))',
        { searchTerm: `%${searchTerm}%` }
      );
    }

    // Get total count
    const total = await query.getCount();

    // Apply pagination and sorting
    query
      .orderBy(`staff.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .leftJoinAndSelect('staff.organization', 'organization');

    const data = await query.getMany();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Update staff member
   */
  async update(
    id: string,
    dto: UpdateStaffDTO,
    userId: string,
    tenantId: string
  ): Promise<StaffMember> {
    const staff = await this.findById(id, tenantId);
    if (!staff) {
      throw new Error('Staff member not found');
    }

    // Update fields
    Object.assign(staff, {
      ...dto,
      updatedBy: userId,
    });

    // Validate
    const validation = staff.validate();
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check email uniqueness if changed
    if (dto.email && dto.email !== staff.email) {
      const existing = await this.staffRepository.findOne({
        where: { email: dto.email, deletedAt: IsNull() },
      });

      if (existing && existing.id !== id) {
        throw new Error('Email already in use by another staff member');
      }
    }

    return await this.staffRepository.save(staff);
  }

  /**
   * Soft delete staff member
   */
  async delete(id: string, userId: string, tenantId: string): Promise<void> {
    const staff = await this.findById(id, tenantId);
    if (!staff) {
      throw new Error('Staff member not found');
    }

    staff.deletedAt = new Date();
    staff.deletedBy = userId;
    staff.status = StaffStatus.TERMINATED;

    await this.staffRepository.save(staff);
  }

  /**
   * Restore deleted staff member
   */
  async restore(id: string, userId: string, tenantId: string): Promise<StaffMember> {
    const staff = await this.staffRepository.findOne({
      where: { id, tenantId },
    });

    if (!staff) {
      throw new Error('Staff member not found');
    }

    staff.deletedAt = undefined;
    staff.deletedBy = undefined;
    staff.status = StaffStatus.ACTIVE;
    staff.updatedBy = userId;

    return await this.staffRepository.save(staff);
  }

  /**
   * Update staff status
   */
  async updateStatus(
    id: string,
    status: StaffStatus,
    userId: string,
    tenantId: string,
    terminationDate?: Date
  ): Promise<StaffMember> {
    const staff = await this.findById(id, tenantId);
    if (!staff) {
      throw new Error('Staff member not found');
    }

    staff.status = status;
    staff.updatedBy = userId;

    if (status === StaffStatus.TERMINATED && terminationDate) {
      staff.terminationDate = terminationDate;
    }

    return await this.staffRepository.save(staff);
  }

  /**
   * Add or update certification
   */
  async updateCertifications(
    id: string,
    certifications: CertificationUpdateDTO[],
    userId: string,
    tenantId: string
  ): Promise<StaffMember> {
    const staff = await this.findById(id, tenantId);
    if (!staff) {
      throw new Error('Staff member not found');
    }

    staff.certifications = certifications;
    staff.updatedBy = userId;

    return await this.staffRepository.save(staff);
  }

  /**
   * Update DBS information
   */
  async updateDBS(
    id: string,
    dbsNumber: string,
    dbsExpiry: Date,
    userId: string,
    tenantId: string
  ): Promise<StaffMember> {
    const staff = await this.findById(id, tenantId);
    if (!staff) {
      throw new Error('Staff member not found');
    }

    staff.dbsNumber = dbsNumber;
    staff.dbsExpiry = dbsExpiry;
    staff.updatedBy = userId;

    return await this.staffRepository.save(staff);
  }

  /**
   * Update professional registration
   */
  async updateRegistration(
    id: string,
    registrationNumber: string,
    registrationExpiry: Date,
    userId: string,
    tenantId: string
  ): Promise<StaffMember> {
    const staff = await this.findById(id, tenantId);
    if (!staff) {
      throw new Error('Staff member not found');
    }

    staff.professionalRegistration = registrationNumber;
    staff.registrationExpiry = registrationExpiry;
    staff.updatedBy = userId;

    return await this.staffRepository.save(staff);
  }

  /**
   * Update availability schedule
   */
  async updateAvailability(
    id: string,
    availability: AvailabilityUpdateDTO,
    userId: string,
    tenantId: string
  ): Promise<StaffMember> {
    const staff = await this.findById(id, tenantId);
    if (!staff) {
      throw new Error('Staff member not found');
    }

    staff.availability = availability;
    staff.updatedBy = userId;

    return await this.staffRepository.save(staff);
  }

  /**
   * Get staff members with expiring certifications
   */
  async getExpiringCertifications(
    tenantId: string,
    daysAhead: number = 30,
    organizationId?: string
  ): Promise<Array<{
    staff: StaffMember;
    expiringCertifications: Array<{ name: string; expiryDate: Date }>;
  }>> {
    const query = this.staffRepository.createQueryBuilder('staff')
      .where('staff.tenantId = :tenantId', { tenantId })
      .andWhere('staff.deletedAt IS NULL')
      .andWhere('staff.status = :status', { status: StaffStatus.ACTIVE });

    if (organizationId) {
      query.andWhere('staff.organizationId = :organizationId', { organizationId });
    }

    const staffMembers = await query.getMany();

    const result: Array<{
      staff: StaffMember;
      expiringCertifications: Array<{ name: string; expiryDate: Date }>;
    }> = [];

    for (const staff of staffMembers) {
      const expiringCerts = staff.getExpiringCertifications();
      if (expiringCerts.length > 0) {
        result.push({
          staff,
          expiringCertifications: expiringCerts,
        });
      }
    }

    return result;
  }

  /**
   * Get staff members with expiring DBS
   */
  async getExpiringDBS(
    tenantId: string,
    daysAhead: number = 30,
    organizationId?: string
  ): Promise<StaffMember[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);

    const query = this.staffRepository.createQueryBuilder('staff')
      .where('staff.tenantId = :tenantId', { tenantId })
      .andWhere('staff.deletedAt IS NULL')
      .andWhere('staff.status = :status', { status: StaffStatus.ACTIVE })
      .andWhere('staff.dbsExpiry IS NOT NULL')
      .andWhere('staff.dbsExpiry <= :targetDate', { targetDate });

    if (organizationId) {
      query.andWhere('staff.organizationId = :organizationId', { organizationId });
    }

    return await query.getMany();
  }

  /**
   * Get staff members with invalid DBS
   */
  async getInvalidDBS(tenantId: string, organizationId?: string): Promise<StaffMember[]> {
    const query = this.staffRepository.createQueryBuilder('staff')
      .where('staff.tenantId = :tenantId', { tenantId })
      .andWhere('staff.deletedAt IS NULL')
      .andWhere('staff.status = :status', { status: StaffStatus.ACTIVE })
      .andWhere('(staff.dbsExpiry IS NULL OR staff.dbsExpiry < :now)', { now: new Date() });

    if (organizationId) {
      query.andWhere('staff.organizationId = :organizationId', { organizationId });
    }

    return await query.getMany();
  }

  /**
   * Get statistics
   */
  async getStatistics(tenantId: string, organizationId?: string): Promise<{
    total: number;
    active: number;
    onLeave: number;
    suspended: number;
    terminated: number;
    byRole: Record<string, number>;
    byEmploymentType: Record<string, number>;
    expiringDBS: number;
    invalidDBS: number;
  }> {
    const baseQuery = this.staffRepository.createQueryBuilder('staff')
      .where('staff.tenantId = :tenantId', { tenantId })
      .andWhere('staff.deletedAt IS NULL');

    if (organizationId) {
      baseQuery.andWhere('staff.organizationId = :organizationId', { organizationId });
    }

    const allStaff = await baseQuery.getMany();

    const stats = {
      total: allStaff.length,
      active: allStaff.filter(s => s.status === StaffStatus.ACTIVE).length,
      onLeave: allStaff.filter(s => s.status === StaffStatus.ON_LEAVE).length,
      suspended: allStaff.filter(s => s.status === StaffStatus.SUSPENDED).length,
      terminated: allStaff.filter(s => s.status === StaffStatus.TERMINATED).length,
      byRole: {} as Record<string, number>,
      byEmploymentType: {} as Record<string, number>,
      expiringDBS: 0,
      invalidDBS: 0,
    };

    // Count by role
    for (const staff of allStaff) {
      stats.byRole[staff.role] = (stats.byRole[staff.role] || 0) + 1;
      stats.byEmploymentType[staff.employmentType] = (stats.byEmploymentType[staff.employmentType] || 0) + 1;
    }

    // Count expiring/invalid DBS
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    for (const staff of allStaff) {
      if (staff.status === StaffStatus.ACTIVE) {
        if (!staff.isDBSValid()) {
          stats.invalidDBS++;
        } else if (staff.dbsExpiry && new Date(staff.dbsExpiry) <= thirtyDaysFromNow) {
          stats.expiringDBS++;
        }
      }
    }

    return stats;
  }

  /**
   * Get active staff count
   */
  async countActiveStaff(tenantId: string, organizationId?: string): Promise<number> {
    const query = this.staffRepository.createQueryBuilder('staff')
      .where('staff.tenantId = :tenantId', { tenantId })
      .andWhere('staff.deletedAt IS NULL')
      .andWhere('staff.status = :status', { status: StaffStatus.ACTIVE });

    if (organizationId) {
      query.andWhere('staff.organizationId = :organizationId', { organizationId });
    }

    return await query.getCount();
  }

  /**
   * Get staff by role
   */
  async findByRole(role: StaffRole, tenantId: string, organizationId?: string): Promise<StaffMember[]> {
    const query = this.staffRepository.createQueryBuilder('staff')
      .where('staff.tenantId = :tenantId', { tenantId })
      .andWhere('staff.deletedAt IS NULL')
      .andWhere('staff.status = :status', { status: StaffStatus.ACTIVE })
      .andWhere('staff.role = :role', { role });

    if (organizationId) {
      query.andWhere('staff.organizationId = :organizationId', { organizationId });
    }

    return await query.getMany();
  }

  /**
   * Check if staff member belongs to tenant
   */
  private async belongsToTenant(id: string, tenantId: string): Promise<boolean> {
    const count = await this.staffRepository.count({
      where: { id, tenantId },
    });
    return count > 0;
  }

  /**
   * Validate organization access
   */
  private async validateOrganizationAccess(
    staffId: string,
    organizationId: string,
    tenantId: string
  ): Promise<boolean> {
    const staff = await this.staffRepository.findOne({
      where: { id: staffId, organizationId, tenantId },
    });
    return staff !== null;
  }
}

export default StaffService;
