import { DataSource, Repository, Between, In } from 'typeorm';
import { FamilyMember, FamilyMemberStatus, AccessLevel, RelationshipType } from '../../entities/family/FamilyMember';
import { FamilyMessage, MessageType, MessagePriority, MessageStatus } from '../../entities/family/FamilyMessage';
import { VisitRequest, VisitType, VisitStatus, VisitPriority } from '../../entities/family/VisitRequest';

// DTOs
export interface CreateFamilyMemberDTO {
  residentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  relationship: RelationshipType;
  accessLevel?: AccessLevel;
  isPrimaryContact?: boolean;
  isEmergencyContact?: boolean;
  hasDecisionMakingAuthority?: boolean;
  canViewMedicalInfo?: boolean;
  canViewFinancialInfo?: boolean;
  address?: string;
  city?: string;
  postcode?: string;
  organizationId: string;
}

export interface UpdateFamilyMemberDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  accessLevel?: AccessLevel;
  isPrimaryContact?: boolean;
  isEmergencyContact?: boolean;
  status?: FamilyMemberStatus;
  preferences?: any;
}

export interface CreateMessageDTO {
  familyId: string;
  residentId: string;
  subject: string;
  content: string;
  type?: MessageType;
  priority?: MessagePriority;
  fromFamily: boolean;
  requiresAcknowledgment?: boolean;
  senderName?: string;
  recipientName?: string;
  organizationId: string;
}

export interface CreateVisitRequestDTO {
  familyId: string;
  residentId: string;
  type: VisitType;
  title: string;
  description?: string;
  scheduledTime: Date;
  duration?: number;
  participants: any[];
  location: any;
  reason?: string;
  specialRequirements?: string;
  priority?: VisitPriority;
  organizationId: string;
}

export interface FamilyFilters {
  residentId?: string;
  relationship?: RelationshipType;
  accessLevel?: AccessLevel;
  status?: FamilyMemberStatus;
  isPrimaryContact?: boolean;
  isEmergencyContact?: boolean;
}

export interface MessageFilters {
  familyId?: string;
  residentId?: string;
  type?: MessageType;
  priority?: MessagePriority;
  status?: MessageStatus;
  fromFamily?: boolean;
  read?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface VisitFilters {
  familyId?: string;
  residentId?: string;
  type?: VisitType;
  status?: VisitStatus;
  priority?: VisitPriority;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Service #9: Family Communication Service
 * 
 * Comprehensive family portal management with:
 * - Family member management
 * - Communication logs
 * - Visit scheduling and management
 * - Update notifications
 * - Consent management
 * 
 * Compliance: GDPR, CQC, Mental Capacity Act 2005
 */
export class FamilyCommunicationService {
  privatefamilyRepository: Repository<FamilyMember>;
  privatemessageRepository: Repository<FamilyMessage>;
  privatevisitRepository: Repository<VisitRequest>;

  constructor(private dataSource: DataSource) {
    this.familyRepository = this.dataSource.getRepository(FamilyMember);
    this.messageRepository = this.dataSource.getRepository(FamilyMessage);
    this.visitRepository = this.dataSource.getRepository(VisitRequest);
  }

  /**
   * FAMILY MEMBER MANAGEMENT
   */

  async createFamilyMember(dto: CreateFamilyMemberDTO): Promise<FamilyMember> {
    const familyMember = this.familyRepository.create({
      ...dto,
      status: FamilyMemberStatus.PENDING_VERIFICATION,
      canRequestVisits: true,
      canReceiveUpdates: true,
    });

    const saved = await this.familyRepository.save(familyMember);
    saved.generateVerificationToken();
    await this.familyRepository.save(saved);

    return saved;
  }

  async findFamilyMemberById(id: string, organizationId: string): Promise<FamilyMember | null> {
    return await this.familyRepository.findOne({
      where: { id, organizationId },
      relations: ['resident'],
    });
  }

  async findAllFamilyMembers(
    organizationId: string,
    filters: FamilyFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ familyMembers: FamilyMember[]; total: number; page: number; totalPages: number }> {
    const queryBuilder = this.familyRepository
      .createQueryBuilder('family')
      .leftJoinAndSelect('family.resident', 'resident')
      .where('family.organizationId = :organizationId', { organizationId });

    if (filters.residentId) {
      queryBuilder.andWhere('family.residentId = :residentId', { residentId: filters.residentId });
    }
    if (filters.relationship) {
      queryBuilder.andWhere('family.relationship = :relationship', { relationship: filters.relationship });
    }
    if (filters.accessLevel) {
      queryBuilder.andWhere('family.accessLevel = :accessLevel', { accessLevel: filters.accessLevel });
    }
    if (filters.status) {
      queryBuilder.andWhere('family.status = :status', { status: filters.status });
    }
    if (filters.isPrimaryContact !== undefined) {
      queryBuilder.andWhere('family.isPrimaryContact = :isPrimaryContact', { isPrimaryContact: filters.isPrimaryContact });
    }
    if (filters.isEmergencyContact !== undefined) {
      queryBuilder.andWhere('family.isEmergencyContact = :isEmergencyContact', { isEmergencyContact: filters.isEmergencyContact });
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    queryBuilder.orderBy('family.createdAt', 'DESC');

    const [familyMembers, total] = await queryBuilder.getManyAndCount();

    return {
      familyMembers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateFamilyMember(id: string, organizationId: string, dto: UpdateFamilyMemberDTO): Promise<FamilyMember> {
    const familyMember = await this.findFamilyMemberById(id, organizationId);
    if (!familyMember) {
      throw new Error('Family member not found');
    }

    Object.assign(familyMember, dto);
    return await this.familyRepository.save(familyMember);
  }

  async deleteFamilyMember(id: string, organizationId: string): Promise<void> {
    const familyMember = await this.findFamilyMemberById(id, organizationId);
    if (!familyMember) {
      throw new Error('Family member not found');
    }

    await this.familyRepository.softRemove(familyMember);
  }

  async verifyFamilyMember(token: string): Promise<FamilyMember> {
    const familyMember = await this.familyRepository.findOne({
      where: { verificationToken: token },
    });

    if (!familyMember) {
      throw new Error('Invalid verification token');
    }

    if (!familyMember.isVerificationTokenValid()) {
      throw new Error('Verification token expired');
    }

    familyMember.verify();
    return await this.familyRepository.save(familyMember);
  }

  async getFamilyMembersByResident(residentId: string, organizationId: string): Promise<FamilyMember[]> {
    return await this.familyRepository.find({
      where: { residentId, organizationId },
      order: { isPrimaryContact: 'DESC', createdAt: 'ASC' },
    });
  }

  /**
   * MESSAGE MANAGEMENT
   */

  async createMessage(dto: CreateMessageDTO): Promise<FamilyMessage> {
    const message = this.messageRepository.create({
      ...dto,
      encryptedContent: dto.content, // In production, this would be encrypted
      status: MessageStatus.SENT,
      read: false,
    });

    return await this.messageRepository.save(message);
  }

  async findMessageById(id: string, organizationId: string): Promise<FamilyMessage | null> {
    return await this.messageRepository.findOne({
      where: { id, organizationId },
      relations: ['familyMember', 'resident'],
    });
  }

  async findAllMessages(
    organizationId: string,
    filters: MessageFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ messages: FamilyMessage[]; total: number; page: number; totalPages: number }> {
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.familyMember', 'family')
      .leftJoinAndSelect('message.resident', 'resident')
      .where('message.organizationId = :organizationId', { organizationId });

    if (filters.familyId) {
      queryBuilder.andWhere('message.familyId = :familyId', { familyId: filters.familyId });
    }
    if (filters.residentId) {
      queryBuilder.andWhere('message.residentId = :residentId', { residentId: filters.residentId });
    }
    if (filters.type) {
      queryBuilder.andWhere('message.type = :type', { type: filters.type });
    }
    if (filters.priority) {
      queryBuilder.andWhere('message.priority = :priority', { priority: filters.priority });
    }
    if (filters.status) {
      queryBuilder.andWhere('message.status = :status', { status: filters.status });
    }
    if (filters.fromFamily !== undefined) {
      queryBuilder.andWhere('message.fromFamily = :fromFamily', { fromFamily: filters.fromFamily });
    }
    if (filters.read !== undefined) {
      queryBuilder.andWhere('message.read = :read', { read: filters.read });
    }
    if (filters.startDate) {
      queryBuilder.andWhere('message.createdAt >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      queryBuilder.andWhere('message.createdAt <= :endDate', { endDate: filters.endDate });
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    queryBuilder.orderBy('message.createdAt', 'DESC');

    const [messages, total] = await queryBuilder.getManyAndCount();

    return {
      messages,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markMessageAsRead(id: string, organizationId: string, readBy?: string): Promise<FamilyMessage> {
    const message = await this.findMessageById(id, organizationId);
    if (!message) {
      throw new Error('Message not found');
    }

    message.markAsRead(readBy);
    return await this.messageRepository.save(message);
  }

  async acknowledgeMessage(id: string, organizationId: string, acknowledgedBy: string, notes?: string): Promise<FamilyMessage> {
    const message = await this.findMessageById(id, organizationId);
    if (!message) {
      throw new Error('Message not found');
    }

    message.acknowledge(acknowledgedBy, notes);
    return await this.messageRepository.save(message);
  }

  async getUnreadMessages(familyId: string, organizationId: string): Promise<FamilyMessage[]> {
    return await this.messageRepository.find({
      where: { familyId, organizationId, read: false, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * VISIT MANAGEMENT
   */

  async createVisitRequest(dto: CreateVisitRequestDTO): Promise<VisitRequest> {
    const visit = this.visitRepository.create({
      ...dto,
      requestedAt: new Date(),
      status: VisitStatus.PENDING,
      requiresApproval: true,
    });

    return await this.visitRepository.save(visit);
  }

  async findVisitById(id: string, organizationId: string): Promise<VisitRequest | null> {
    return await this.visitRepository.findOne({
      where: { id, organizationId },
      relations: ['familyMember', 'resident'],
    });
  }

  async findAllVisits(
    organizationId: string,
    filters: VisitFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ visits: VisitRequest[]; total: number; page: number; totalPages: number }> {
    const queryBuilder = this.visitRepository
      .createQueryBuilder('visit')
      .leftJoinAndSelect('visit.familyMember', 'family')
      .leftJoinAndSelect('visit.resident', 'resident')
      .where('visit.organizationId = :organizationId', { organizationId });

    if (filters.familyId) {
      queryBuilder.andWhere('visit.familyId = :familyId', { familyId: filters.familyId });
    }
    if (filters.residentId) {
      queryBuilder.andWhere('visit.residentId = :residentId', { residentId: filters.residentId });
    }
    if (filters.type) {
      queryBuilder.andWhere('visit.type = :type', { type: filters.type });
    }
    if (filters.status) {
      queryBuilder.andWhere('visit.status = :status', { status: filters.status });
    }
    if (filters.priority) {
      queryBuilder.andWhere('visit.priority = :priority', { priority: filters.priority });
    }
    if (filters.startDate) {
      queryBuilder.andWhere('visit.scheduledTime >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      queryBuilder.andWhere('visit.scheduledTime <= :endDate', { endDate: filters.endDate });
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    queryBuilder.orderBy('visit.scheduledTime', 'ASC');

    const [visits, total] = await queryBuilder.getManyAndCount();

    return {
      visits,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async approveVisit(id: string, organizationId: string, approvedBy: string, notes?: string): Promise<VisitRequest> {
    const visit = await this.findVisitById(id, organizationId);
    if (!visit) {
      throw new Error('Visit request not found');
    }

    if (!visit.canBeApproved()) {
      throw new Error('Visit cannot be approved in current status');
    }

    visit.approve(approvedBy, notes);
    return await this.visitRepository.save(visit);
  }

  async denyVisit(id: string, organizationId: string, deniedBy: string, reason: string): Promise<VisitRequest> {
    const visit = await this.findVisitById(id, organizationId);
    if (!visit) {
      throw new Error('Visit request not found');
    }

    if (!visit.canBeDenied()) {
      throw new Error('Visit cannot be denied in current status');
    }

    visit.deny(deniedBy, reason);
    return await this.visitRepository.save(visit);
  }

  async cancelVisit(id: string, organizationId: string, cancelledBy: string, reason: string): Promise<VisitRequest> {
    const visit = await this.findVisitById(id, organizationId);
    if (!visit) {
      throw new Error('Visit request not found');
    }

    if (!visit.canBeCancelled()) {
      throw new Error('Visit cannot be cancelled in current status');
    }

    visit.cancel(cancelledBy, reason);
    return await this.visitRepository.save(visit);
  }

  async rescheduleVisit(
    id: string,
    organizationId: string,
    newTime: Date,
    rescheduledBy: string,
    reason: string
  ): Promise<VisitRequest> {
    const visit = await this.findVisitById(id, organizationId);
    if (!visit) {
      throw new Error('Visit request not found');
    }

    if (!visit.canBeRescheduled()) {
      throw new Error('Visit cannot be rescheduled in current status');
    }

    visit.reschedule(newTime, rescheduledBy, reason);
    return await this.visitRepository.save(visit);
  }

  async completeVisit(id: string, organizationId: string, completedBy: string, notes?: string): Promise<VisitRequest> {
    const visit = await this.findVisitById(id, organizationId);
    if (!visit) {
      throw new Error('Visit request not found');
    }

    visit.complete(completedBy, notes);
    return await this.visitRepository.save(visit);
  }

  async getUpcomingVisits(organizationId: string, daysAhead: number = 7): Promise<VisitRequest[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return await this.visitRepository.find({
      where: {
        organizationId,
        status: In([VisitStatus.APPROVED, VisitStatus.CONFIRMED]),
        scheduledTime: Between(new Date(), futureDate),
      },
      order: { scheduledTime: 'ASC' },
    });
  }

  async getPendingVisits(organizationId: string): Promise<VisitRequest[]> {
    return await this.visitRepository.find({
      where: { organizationId, status: VisitStatus.PENDING },
      order: { requestedAt: 'ASC' },
    });
  }

  /**
   * STATISTICS
   */

  async getStatistics(organizationId: string): Promise<{
    familyMembers: {
      total: number;
      active: number;
      pending: number;
      byRelationship: Record<string, number>;
    };
    messages: {
      total: number;
      unread: number;
      fromFamily: number;
      toFamily: number;
      urgent: number;
    };
    visits: {
      total: number;
      pending: number;
      upcoming: number;
      thisWeek: number;
      thisMonth: number;
    };
  }> {
    const familyMembers = await this.familyRepository.find({ where: { organizationId } });
    const messages = await this.messageRepository.find({ where: { organizationId } });
    const visits = await this.visitRepository.find({ where: { organizationId } });

    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      familyMembers: {
        total: familyMembers.length,
        active: familyMembers.filter(f => f.status === FamilyMemberStatus.ACTIVE).length,
        pending: familyMembers.filter(f => f.status === FamilyMemberStatus.PENDING_VERIFICATION).length,
        byRelationship: familyMembers.reduce((acc, f) => {
          acc[f.relationship] = (acc[f.relationship] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      messages: {
        total: messages.length,
        unread: messages.filter(m => !m.read).length,
        fromFamily: messages.filter(m => m.fromFamily).length,
        toFamily: messages.filter(m => !m.fromFamily).length,
        urgent: messages.filter(m => m.priority === MessagePriority.URGENT).length,
      },
      visits: {
        total: visits.length,
        pending: visits.filter(v => v.status === VisitStatus.PENDING).length,
        upcoming: visits.filter(v => v.scheduledTime > now && [VisitStatus.APPROVED, VisitStatus.CONFIRMED].includes(v.status)).length,
        thisWeek: visits.filter(v => v.scheduledTime >= weekStart && v.scheduledTime < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)).length,
        thisMonth: visits.filter(v => v.scheduledTime >= monthStart && v.scheduledTime < new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1)).length,
      },
    };
  }
}
