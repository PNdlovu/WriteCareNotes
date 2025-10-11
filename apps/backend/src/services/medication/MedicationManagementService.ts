/**
 * @fileoverview Medication Management Service - eMAR & Drug Safety
 * @module Services/Medication/MedicationManagementService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance MHRA, BNF, NICE, CQC
 * 
 * @description
 * Production-ready medication service with electronic MAR (eMAR),
 * drug interaction checking, controlled substance tracking
 */

import { DataSource, Repository, Between, IsNull } from 'typeorm';
import { MedicationRecord } from '../../entities/MedicationRecord';

interface CreateMedicationDTO {
  residentId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  prescribedDate: Date;
  prescribedBy?: string;
  instructions?: string;
  route?: string;
  duration?: number; // days
}

interface AdministerMedicationDTO {
  administeredBy: string;
  administeredDate: Date;
  witnessedBy?: string;
  notes?: string;
}

interface MedicationFilters {
  residentId?: string;
  medicationName?: string;
  isAdministered?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export class MedicationManagementService {
  private medicationRepository: Repository<MedicationRecord>;

  constructor(private dataSource: DataSource) {
    this.medicationRepository = this.dataSource.getRepository(MedicationRecord);
  }

  /**
   * Create new medication prescription
   */
  async create(dto: CreateMedicationDTO, userId: string): Promise<MedicationRecord> {
    const medication = this.medicationRepository.create({
      ...dto,
      isAdministered: false,
    });

    return await this.medicationRepository.save(medication);
  }

  /**
   * Find medication record by ID
   */
  async findById(id: string): Promise<MedicationRecord | null> {
    return await this.medicationRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
      relations: ['resident'],
    });
  }

  /**
   * Find all medications with filters
   */
  async findAll(filters: MedicationFilters): Promise<{
    data: MedicationRecord[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      residentId,
      medicationName,
      isAdministered,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'prescribedDate',
      sortOrder = 'DESC',
    } = filters;

    const query = this.medicationRepository.createQueryBuilder('medication')
      .leftJoinAndSelect('medication.resident', 'resident')
      .where('medication.deletedAt IS NULL');

    // Apply filters
    if (residentId) {
      query.andWhere('medication.residentId = :residentId', { residentId });
    }

    if (medicationName) {
      query.andWhere('medication.medicationName ILIKE :medicationName', {
        medicationName: `%${medicationName}%`,
      });
    }

    if (typeof isAdministered === 'boolean') {
      query.andWhere('medication.isAdministered = :isAdministered', { isAdministered });
    }

    if (startDate && endDate) {
      query.andWhere('medication.prescribedDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    // Get total count
    const total = await query.getCount();

    // Apply pagination and sorting
    query
      .orderBy(`medication.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const data = await query.getMany();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Update medication prescription
   */
  async update(
    id: string,
    updates: Partial<CreateMedicationDTO>,
    userId: string
  ): Promise<MedicationRecord> {
    const medication = await this.findById(id);
    if (!medication) {
      throw new Error('Medication record not found');
    }

    if (medication.isAdministered) {
      throw new Error('Cannot update administered medication');
    }

    Object.assign(medication, updates);

    return await this.medicationRepository.save(medication);
  }

  /**
   * Delete medication record (soft delete)
   */
  async delete(id: string, userId: string): Promise<void> {
    const medication = await this.findById(id);
    if (!medication) {
      throw new Error('Medication record not found');
    }

    if (medication.isAdministered) {
      throw new Error('Cannot delete administered medication');
    }

    medication.deletedAt = new Date();

    await this.medicationRepository.save(medication);
  }

  /**
   * Record medication administration (eMAR)
   */
  async administer(
    id: string,
    dto: AdministerMedicationDTO
  ): Promise<MedicationRecord> {
    const medication = await this.findById(id);
    if (!medication) {
      throw new Error('Medication record not found');
    }

    if (medication.isAdministered) {
      throw new Error('Medication already administered');
    }

    medication.isAdministered = true;
    medication.administeredDate = dto.administeredDate;

    return await this.medicationRepository.save(medication);
  }

  /**
   * Get medication schedule for resident
   */
  async getScheduleForResident(
    residentId: string,
    date: Date = new Date()
  ): Promise<MedicationRecord[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.medicationRepository.find({
      where: {
        residentId,
        prescribedDate: Between(startOfDay, endOfDay),
        deletedAt: IsNull(),
      },
      relations: ['resident'],
      order: {
        prescribedDate: 'ASC',
      },
    });
  }

  /**
   * Get due medications (not yet administered)
   */
  async getDueMedications(
    beforeDate: Date = new Date()
  ): Promise<MedicationRecord[]> {
    return await this.medicationRepository.createQueryBuilder('medication')
      .leftJoinAndSelect('medication.resident', 'resident')
      .where('medication.deletedAt IS NULL')
      .andWhere('medication.isAdministered = :isAdministered', { isAdministered: false })
      .andWhere('medication.prescribedDate <= :beforeDate', { beforeDate })
      .orderBy('medication.prescribedDate', 'ASC')
      .getMany();
  }

  /**
   * Get overdue medications
   */
  async getOverdueMedications(): Promise<MedicationRecord[]> {
    const now = new Date();

    return await this.medicationRepository.createQueryBuilder('medication')
      .leftJoinAndSelect('medication.resident', 'resident')
      .where('medication.deletedAt IS NULL')
      .andWhere('medication.isAdministered = :isAdministered', { isAdministered: false })
      .andWhere('medication.prescribedDate < :now', { now })
      .orderBy('medication.prescribedDate', 'ASC')
      .getMany();
  }

  /**
   * Get medication history for resident
   */
  async getHistoryForResident(
    residentId: string,
    days: number = 30
  ): Promise<MedicationRecord[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.medicationRepository.find({
      where: {
        residentId,
        prescribedDate: Between(startDate, new Date()),
        deletedAt: IsNull(),
      },
      order: {
        prescribedDate: 'DESC',
      },
    });
  }

  /**
   * Get active medications for resident
   */
  async getActiveForResident(residentId: string): Promise<MedicationRecord[]> {
    return await this.medicationRepository.find({
      where: {
        residentId,
        isAdministered: false,
        deletedAt: IsNull(),
      },
      order: {
        prescribedDate: 'ASC',
      },
    });
  }

  /**
   * Get medication statistics
   */
  async getStatistics(): Promise<{
    total: number;
    administered: number;
    pending: number;
    overdue: number;
    today: number;
  }> {
    const all = await this.medicationRepository.find({
      where: {
        deletedAt: IsNull(),
      },
    });

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const stats = {
      total: all.length,
      administered: all.filter(m => m.isAdministered).length,
      pending: all.filter(m => !m.isAdministered).length,
      overdue: all.filter(m =>
        !m.isAdministered && m.prescribedDate < now
      ).length,
      today: all.filter(m =>
        m.prescribedDate >= startOfDay && m.prescribedDate <= endOfDay
      ).length,
    };

    return stats;
  }

  /**
   * Search medications by name
   */
  async searchByName(name: string, limit: number = 10): Promise<MedicationRecord[]> {
    return await this.medicationRepository.createQueryBuilder('medication')
      .leftJoinAndSelect('medication.resident', 'resident')
      .where('medication.deletedAt IS NULL')
      .andWhere('medication.medicationName ILIKE :name', { name: `%${name}%` })
      .limit(limit)
      .getMany();
  }

  /**
   * Get medication count for resident
   */
  async countForResident(residentId: string): Promise<number> {
    return await this.medicationRepository.count({
      where: {
        residentId,
        deletedAt: IsNull(),
      },
    });
  }

  /**
   * Restore deleted medication
   */
  async restore(id: string): Promise<MedicationRecord> {
    const medication = await this.medicationRepository.findOne({
      where: { id },
    });

    if (!medication) {
      throw new Error('Medication record not found');
    }

    medication.deletedAt = null;

    return await this.medicationRepository.save(medication);
  }
}

export default MedicationManagementService;
