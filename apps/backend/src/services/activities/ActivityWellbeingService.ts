import { DataSource, Repository, Between } from 'typeorm';
import { Activity, ActivityType, ActivityCategory } from '../../entities/activities/Activity';
import { AttendanceRecord } from '../../entities/activities/AttendanceRecord';

// DTOs
export interface CreateActivityDTO {
  activityName: string;
  description: string;
  activityType: ActivityType;
  activityCategory: ActivityCategory;
  scheduledDate: Date;
  duration: number; // minutes
  location: string;
  maxParticipants?: number;
  facilitatorId: string;
  organizationId: string;
}

export interface UpdateActivityDTO {
  activityName?: string;
  description?: string;
  scheduledDate?: Date;
  duration?: number;
  location?: string;
  maxParticipants?: number;
}

export interface RecordAttendanceDTO {
  activityId: string;
  residentId: string;
  attended: boolean;
  participationLevel: 'full' | 'partial' | 'observer' | 'declined';
  enjoymentLevel?: number; // 1-5
  engagementLevel?: number; // 1-5
  notes?: string;
  recordedBy: string;
  organizationId: string;
}

export interface WellbeingAssessmentDTO {
  residentId: string;
  assessmentDate: Date;
  moodRating: number; // 1-10
  socialEngagement: number; // 1-10
  physicalActivity: number; // 1-10
  cognitiveStimulation: number; // 1-10
  overallWellbeing: number; // 1-10
  observations: string[];
  concerns: string[];
  recommendations: string[];
  assessedBy: string;
  organizationId: string;
}

export interface ActivityFilters {
  activityType?: ActivityType;
  activityCategory?: ActivityCategory;
  startDate?: Date;
  endDate?: Date;
  facilitatorId?: string;
}

/**
 * Service #12: Activity & Wellbeing Service
 * 
 * Comprehensive activity coordination and wellbeing tracking with:
 * - Activity planning and scheduling
 * - Attendance tracking
 * - Participation monitoring
 * - Wellbeing assessments
 * - Social engagement tracking
 * - Therapeutic outcome measurement
 * 
 * Compliance: CQC, person-centered care, therapeutic activity standards
 */
export class ActivityWellbeingService {
  privateactivityRepository: Repository<Activity>;
  privateattendanceRepository: Repository<AttendanceRecord>;

  constructor(private dataSource: DataSource) {
    this.activityRepository = this.dataSource.getRepository(Activity);
    this.attendanceRepository = this.dataSource.getRepository(AttendanceRecord);
  }

  /**
   * Create a new activity
   */
  async createActivity(dto: CreateActivityDTO): Promise<Activity> {
    const activity = this.activityRepository.create({
      activityName: dto.activityName,
      description: dto.description,
      activityType: dto.activityType,
      activityCategory: dto.activityCategory,
      scheduledDate: dto.scheduledDate,
      duration: dto.duration,
      location: dto.location,
      maxParticipants: dto.maxParticipants || 20,
      status: 'scheduled',
      organizationId: dto.organizationId,
    });

    return await this.activityRepository.save(activity);
  }

  /**
   * Get activity by ID
   */
  async getActivityById(id: string, organizationId: string): Promise<Activity | null> {
    return await this.activityRepository.findOne({
      where: { id, organizationId },
      relations: ['participants'],
    });
  }

  /**
   * Get all activities with filtering
   */
  async getActivities(
    organizationId: string,
    filters: ActivityFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ activities: Activity[]; total: number; page: number; totalPages: number }> {
    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.organizationId = :organizationId', { organizationId });

    if (filters.activityType) {
      queryBuilder.andWhere('activity.activityType = :activityType', { activityType: filters.activityType });
    }

    if (filters.activityCategory) {
      queryBuilder.andWhere('activity.activityCategory = :activityCategory', {
        activityCategory: filters.activityCategory,
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('activity.scheduledDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('activity.scheduledDate <= :endDate', { endDate: filters.endDate });
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    queryBuilder.orderBy('activity.scheduledDate', 'DESC');

    const [activities, total] = await queryBuilder.getManyAndCount();

    return {
      activities,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update activity
   */
  async updateActivity(id: string, organizationId: string, dto: UpdateActivityDTO): Promise<Activity> {
    const activity = await this.getActivityById(id, organizationId);
    if (!activity) {
      throw new Error('Activity not found');
    }

    Object.assign(activity, dto);
    return await this.activityRepository.save(activity);
  }

  /**
   * Delete activity
   */
  async deleteActivity(id: string, organizationId: string): Promise<void> {
    const activity = await this.getActivityById(id, organizationId);
    if (!activity) {
      throw new Error('Activity not found');
    }

    await this.activityRepository.softRemove(activity);
  }

  /**
   * Record attendance
   */
  async recordAttendance(dto: RecordAttendanceDTO): Promise<AttendanceRecord> {
    const attendance = this.attendanceRepository.create({
      activityId: dto.activityId,
      residentId: dto.residentId,
      attended: dto.attended,
      participationLevel: dto.participationLevel,
      enjoymentLevel: dto.enjoymentLevel || 0,
      engagementLevel: dto.engagementLevel || 0,
      notes: dto.notes,
      recordedBy: dto.recordedBy,
      recordedAt: new Date(),
      organizationId: dto.organizationId,
    });

    return await this.attendanceRepository.save(attendance);
  }

  /**
   * Get attendance by activity
   */
  async getAttendanceByActivity(activityId: string, organizationId: string): Promise<AttendanceRecord[]> {
    return await this.attendanceRepository.find({
      where: { activityId, organizationId },
      relations: ['resident'],
      order: { recordedAt: 'DESC' },
    });
  }

  /**
   * Get attendance by resident
   */
  async getAttendanceByResident(
    residentId: string,
    organizationId: string,
    days: number = 30
  ): Promise<AttendanceRecord[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return await this.attendanceRepository.find({
      where: {
        residentId,
        organizationId,
      },
      relations: ['activity'],
      order: { recordedAt: 'DESC' },
    });
  }

  /**
   * Get upcoming activities
   */
  async getUpcomingActivities(organizationId: string, days: number = 7): Promise<Activity[]> {
    const startDate = new Date();
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return await this.activityRepository.find({
      where: {
        organizationId,
        scheduledDate: Between(startDate, endDate),
      },
      order: { scheduledDate: 'ASC' },
    });
  }

  /**
   * Get activity participation stats
   */
  async getParticipationStats(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalActivities: number;
    totalAttendance: number;
    avgParticipation: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    topActivities: any[];
  }> {
    const activities = await this.activityRepository.find({
      where: {
        organizationId,
        scheduledDate: Between(startDate, endDate),
      },
    });

    const attendance = await this.attendanceRepository.find({
      where: { organizationId },
    });

    const byType = activities.reduce((acc, activity) => {
      acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = activities.reduce((acc, activity) => {
      acc[activity.activityCategory] = (acc[activity.activityCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalAttendance = attendance.filter(a => a.attended).length;
    const avgParticipation =
      activities.length > 0 ? Math.round((totalAttendance / activities.length) * 100) / 100 : 0;

    // Top activities by attendance
    const activityAttendance = attendance.reduce((acc, record) => {
      if (record.attended) {
        acc[record.activityId] = (acc[record.activityId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topActivities = Object.entries(activityAttendance)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([activityId, count]) => ({ activityId, attendanceCount: count }));

    return {
      totalActivities: activities.length,
      totalAttendance,
      avgParticipation,
      byType,
      byCategory,
      topActivities,
    };
  }

  /**
   * Get wellbeing trends for resident
   */
  async getWellbeingTrends(
    residentId: string,
    organizationId: string,
    months: number = 6
  ): Promise<any[]> {
    // In production, this would query a wellbeing_assessments table
    // For now, calculate from activity participation
    const startDate = new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000);

    const attendance = await this.attendanceRepository.find({
      where: {
        residentId,
        organizationId,
      },
      order: { recordedAt: 'ASC' },
    });

    // Group by month and calculate averages
    const monthlyData = attendance.reduce((acc, record) => {
      const month = new Date(record.recordedAt).toISOString().slice(0, 7);
      if (!acc[month]) {
        acc[month] = {
          month,
          count: 0,
          totalEnjoyment: 0,
          totalEngagement: 0,
        };
      }
      acc[month].count++;
      acc[month].totalEnjoyment += record.enjoymentLevel || 0;
      acc[month].totalEngagement += record.engagementLevel || 0;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(monthlyData).map((data: any) => ({
      month: data.month,
      activitiesAttended: data.count,
      avgEnjoyment: data.count > 0 ? Math.round((data.totalEnjoyment / data.count) * 10) / 10 : 0,
      avgEngagement: data.count > 0 ? Math.round((data.totalEngagement / data.count) * 10) / 10 : 0,
    }));
  }

  /**
   * Get statistics
   */
  async getStatistics(organizationId: string): Promise<{
    totalActivities: number;
    upcomingActivities: number;
    totalAttendance: number;
    avgAttendanceRate: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    const activities = await this.activityRepository.find({ where: { organizationId } });
    const attendance = await this.attendanceRepository.find({ where: { organizationId } });

    const upcoming = await this.getUpcomingActivities(organizationId, 30);

    const byType = activities.reduce((acc, activity) => {
      acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = activities.reduce((acc, activity) => {
      acc[activity.activityCategory] = (acc[activity.activityCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalAttendance = attendance.filter(a => a.attended).length;
    const totalPossible = attendance.length;
    const avgAttendanceRate = totalPossible > 0 ? Math.round((totalAttendance / totalPossible) * 100) : 0;

    return {
      totalActivities: activities.length,
      upcomingActivities: upcoming.length,
      totalAttendance,
      avgAttendanceRate,
      byType,
      byCategory,
    };
  }
}
