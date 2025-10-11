import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Activity, ActivityStatus, ActivityType } from '../entities/Activity';
import { AttendanceRecord, AttendanceStatus, AttendanceType } from '../entities/AttendanceRecord';
import { Resident } from '../../care/entities/Resident';
import { StaffMember } from '../../staff/entities/StaffMember';

export interface CreateActivityRequest {
  title: string;
  description: string;
  type: ActivityType;
  location: string;
  specificLocation?: string;
  scheduledDate: Date;
  startTime: Date;
  endTime: Date;
  maxParticipants: number;
  minParticipants?: number;
  cost?: number;
  currency?: string;
  requiresRSVP?: boolean;
  isRecurring?: boolean;
  recurringPattern?: string;
  recurringInterval?: number;
  recurringEndDate?: Date;
  requiredEquipment?: string[];
  requiredSkills?: string[];
  requiredCertifications?: string[];
  instructions?: string;
  safetyNotes?: string;
  facilitatorId?: string;
}

export interface RSVPRequest {
  activityId: string;
  participantId: string;
  participantName: string;
  participantType: AttendanceType;
  notes?: string;
}

export interface AttendanceData {
  activityId: string;
  participantId: string;
  participantName: string;
  participantType: AttendanceType;
  status: AttendanceStatus;
  checkInTime?: Date;
  checkOutTime?: Date;
  notes?: string;
  reasonForAbsence?: string;
  engagementScore?: number;
  feedback?: string;
}

export interface ActivityFilters {
  type?: ActivityType;
  status?: ActivityStatus;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  facilitatorId?: string;
  requiresRSVP?: boolean;
  isRecurring?: boolean;
}

export interface EngagementMetrics {
  totalActivities: number;
  totalParticipants: number;
  averageAttendance: number;
  averageEngagementScore: number;
  participationRate: number;
  topActivityTypes: { type: string; count: number; participation: number }[];
  attendanceTrends: { date: string; attendance: number }[];
  engagementTrends: { date: string; score: number }[];
}

@Injectable()
export class EngagementService {
  const ructor(
    @InjectRepository(Activity)
    privateactivityRepository: Repository<Activity>,
    @InjectRepository(AttendanceRecord)
    privateattendanceRepository: Repository<AttendanceRecord>,
    @InjectRepository(Resident)
    privateresidentRepository: Repository<Resident>,
    @InjectRepository(StaffMember)
    privatestaffRepository: Repository<StaffMember>,
  ) {}

  /**
   * Create a new activity
   */
  async createActivity(request: CreateActivityRequest, createdBy: string): Promise<Activity> {
    const activity = this.activityRepository.create({
      ...request,
      status: ActivityStatus.SCHEDULED,
      currentParticipants: 0,
      createdBy,
      updatedBy: createdBy,
    });

    // Calculate duration
    activity.calculateDuration();

    return await this.activityRepository.save(activity);
  }

  /**
   * Get activities with filters
   */
  async getActivities(filters: ActivityFilters = {}): Promise<Activity[]> {
    const query = this.activityRepository.createQueryBuilder('activity')
      .leftJoinAndSelect('activity.facilitator', 'facilitator')
      .leftJoinAndSelect('activity.attendanceRecords', 'attendance');

    if (filters.type) {
      query.andWhere('activity.type = :type', { type: filters.type });
    }

    if (filters.status) {
      query.andWhere('activity.status = :status', { status: filters.status });
    }

    if (filters.location) {
      query.andWhere('activity.location = :location', { location: filters.location });
    }

    if (filters.startDate) {
      query.andWhere('activity.scheduledDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('activity.scheduledDate <= :endDate', { endDate: filters.endDate });
    }

    if (filters.facilitatorId) {
      query.andWhere('activity.facilitatorId = :facilitatorId', { facilitatorId: filters.facilitatorId });
    }

    if (filters.requiresRSVP !== undefined) {
      query.andWhere('activity.requiresRSVP = :requiresRSVP', { requiresRSVP: filters.requiresRSVP });
    }

    if (filters.isRecurring !== undefined) {
      query.andWhere('activity.isRecurring = :isRecurring', { isRecurring: filters.isRecurring });
    }

    return await query
      .orderBy('activity.scheduledDate', 'ASC')
      .getMany();
  }

  /**
   * Get activity by ID
   */
  async getActivity(activityId: string): Promise<Activity | null> {
    return await this.activityRepository.findOne({
      where: { id: activityId },
      relations: ['facilitator', 'attendanceRecords'],
    });
  }

  /**
   * RSVP to an activity
   */
  async rsvpToActivity(request: RSVPRequest, recordedBy: string): Promise<AttendanceRecord> {
    const activity = await this.activityRepository.findOne({
      where: { id: request.activityId },
    });

    if (!activity) {
      throw new Error('Activity not found');
    }

    if (!activity.requiresRSVP) {
      throw new Error('This activity does not require RSVP');
    }

    if (activity.isFullyBooked()) {
      throw new Error('Activity is fully booked');
    }

    // Check if already RSVP'd
    const existingRSVP = await this.attendanceRepository.findOne({
      where: {
        activityId: request.activityId,
        participantId: request.participantId,
      },
    });

    if (existingRSVP) {
      throw new Error('Already RSVP\'d to this activity');
    }

    const attendance = this.attendanceRepository.create({
      activityId: request.activityId,
      participantId: request.participantId,
      participantName: request.participantName,
      participantType: request.participantType,
      status: AttendanceStatus.PRESENT,
      isRSVP: true,
      rsvpDate: new Date(),
      notes: request.notes,
      recordedBy,
      createdBy: recordedBy,
      updatedBy: recordedBy,
    });

    const savedAttendance = await this.attendanceRepository.save(attendance);

    // Update activity participant count
    activity.currentParticipants += 1;
    await this.activityRepository.save(activity);

    return savedAttendance;
  }

  /**
   * Record attendance
   */
  async recordAttendance(data: AttendanceData, recordedBy: string): Promise<AttendanceRecord> {
    const activity = await this.activityRepository.findOne({
      where: { id: data.activityId },
    });

    if (!activity) {
      throw new Error('Activity not found');
    }

    // Check if attendance already recorded
    const existingAttendance = await this.attendanceRepository.findOne({
      where: {
        activityId: data.activityId,
        participantId: data.participantId,
      },
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = data.status;
      existingAttendance.checkInTime = data.checkInTime;
      existingAttendance.checkOutTime = data.checkOutTime;
      existingAttendance.notes = data.notes;
      existingAttendance.reasonForAbsence = data.reasonForAbsence;
      existingAttendance.engagementScore = data.engagementScore;
      existingAttendance.feedback = data.feedback;
      existingAttendance.updatedBy = recordedBy;

      existingAttendance.calculateDuration();
      return await this.attendanceRepository.save(existingAttendance);
    }

    // Create new attendance record
    const attendance = this.attendanceRepository.create({
      ...data,
      recordedBy,
      createdBy: recordedBy,
      updatedBy: recordedBy,
    });

    attendance.calculateDuration();
    return await this.attendanceRepository.save(attendance);
  }

  /**
   * Get attendance records for an activity
   */
  async getActivityAttendance(activityId: string): Promise<AttendanceRecord[]> {
    return await this.attendanceRepository.find({
      where: { activityId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get participant's attendance history
   */
  async getParticipantAttendance(participantId: string, limit: number = 50): Promise<AttendanceRecord[]> {
    return await this.attendanceRepository.find({
      where: { participantId },
      relations: ['activity'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Start an activity
   */
  async startActivity(activityId: string, startedBy: string): Promise<Activity> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new Error('Activity not found');
    }

    if (!activity.canBeStarted()) {
      throw new Error('Activity cannot be started in current status');
    }

    activity.startActivity();
    activity.updatedBy = startedBy;

    return await this.activityRepository.save(activity);
  }

  /**
   * Complete an activity
   */
  async completeActivity(activityId: string, completedBy: string): Promise<Activity> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new Error('Activity not found');
    }

    if (!activity.canBeCompleted()) {
      throw new Error('Activity cannot be completed in current status');
    }

    activity.completeActivity();
    activity.updatedBy = completedBy;

    return await this.activityRepository.save(activity);
  }

  /**
   * Cancel an activity
   */
  async cancelActivity(activityId: string, cancelledBy: string, reason?: string): Promise<Activity> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new Error('Activity not found');
    }

    if (!activity.canBeCancelled()) {
      throw new Error('Activity cannot be cancelled in current status');
    }

    activity.cancelActivity(reason);
    activity.updatedBy = cancelledBy;

    return await this.activityRepository.save(activity);
  }

  /**
   * Get engagement metrics
   */
  async getEngagementMetrics(startDate: Date, endDate: Date): Promise<EngagementMetrics> {
    const activities = await this.activityRepository.find({
      where: {
        scheduledDate: Between(startDate, endDate),
      },
      relations: ['attendanceRecords'],
    });

    const totalActivities = activities.length;
    const totalParticipants = activities.reduce((sum, activity) => sum + activity.currentParticipants, 0);
    
    const attendanceRecords = await this.attendanceRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const presentRecords = attendanceRecords.filter(record => record.isPresent());
    const averageAttendance = totalActivities > 0 ? presentRecords.length / totalActivities : 0;
    
    const engagementScores = attendanceRecords
      .filter(record => record.engagementScore !== null)
      .map(record => record.engagementScore!);
    
    const averageEngagementScore = engagementScores.length > 0 
      ? engagementScores.reduce((sum, score) => sum + score, 0) / engagementScores.length 
      : 0;

    const participationRate = totalActivities > 0 ? (presentRecords.length / totalActivities) * 100 : 0;

    // Group by activity type
    const typeGroups = activities.reduce((groups, activity) => {
      const type = activity.type;
      if (!groups[type]) {
        groups[type] = { count: 0, participation: 0 };
      }
      groups[type].count += 1;
      groups[type].participation += activity.currentParticipants;
      return groups;
    }, {} as Record<string, { count: number; participation: number }>);

    const topActivityTypes = Object.entries(typeGroups)
      .map(([type, data]) => ({
        type,
        count: data.count,
        participation: data.participation,
      }))
      .sort((a, b) => b.participation - a.participation)
      .slice(0, 5);

    /**
     * Generate daily attendance trends from actual attendance records
     * Aggregates attendance by date to show participation patterns over time
     */
    const attendanceTrends = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayAttendance = attendanceRecords.filter(record => 
        record.createdAt.toDateString() === currentDate.toDateString()
      ).length;
      
      attendanceTrends.push({
        date: currentDate.toISOString().split('T')[0],
        attendance: dayAttendance,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    /**
     * Generate daily engagement score trends from actual engagement data
     * Calculates average engagement score per day to track quality of participation
     */
    const engagementTrends = [];
    const engagementDate = new Date(startDate);
    while (engagementDate <= endDate) {
      const dayEngagement = attendanceRecords
        .filter(record => 
          record.createdAt.toDateString() === engagementDate.toDateString() && 
          record.engagementScore !== null
        )
        .reduce((sum, record) => sum + (record.engagementScore || 0), 0);
      
      const dayCount = attendanceRecords.filter(record => 
        record.createdAt.toDateString() === engagementDate.toDateString() && 
        record.engagementScore !== null
      ).length;
      
      engagementTrends.push({
        date: engagementDate.toISOString().split('T')[0],
        score: dayCount > 0 ? dayEngagement / dayCount : 0,
      });
      
      engagementDate.setDate(engagementDate.getDate() + 1);
    }

    return {
      totalActivities,
      totalParticipants,
      averageAttendance,
      averageEngagementScore,
      participationRate,
      topActivityTypes,
      attendanceTrends,
      engagementTrends,
    };
  }

  /**
   * Get upcoming activities
   */
  async getUpcomingActivities(limit: number = 10): Promise<Activity[]> {
    return await this.activityRepository.find({
      where: {
        status: ActivityStatus.SCHEDULED,
        scheduledDate: Between(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      },
      relations: ['facilitator'],
      order: { scheduledDate: 'ASC' },
      take: limit,
    });
  }

  /**
   * Get today's activities
   */
  async getTodaysActivities(): Promise<Activity[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return await this.activityRepository.find({
      where: {
        scheduledDate: Between(startOfDay, endOfDay),
      },
      relations: ['facilitator', 'attendanceRecords'],
      order: { startTime: 'ASC' },
    });
  }
}

export default EngagementService;
