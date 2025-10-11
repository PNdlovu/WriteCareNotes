import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { AttendanceRecord } from './AttendanceRecord';
import { Resident } from '../../care/entities/Resident';
import { StaffMember } from '../../staff/entities/StaffMember';

export enum ActivityType {
  PHYSICAL = 'physical',
  COGNITIVE = 'cognitive',
  SOCIAL = 'social',
  CREATIVE = 'creative',
  EDUCATIONAL = 'educational',
  THERAPEUTIC = 'therapeutic',
  RECREATIONAL = 'recreational',
  SPIRITUAL = 'spiritual',
  NUTRITIONAL = 'nutritional',
  OTHER = 'other'
}

export enum ActivityStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed'
}

export enum ActivityFrequency {
  ONE_TIME = 'one_time',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

export enum ActivityLocation {
  INDOOR = 'indoor',
  OUTDOOR = 'outdoor',
  VIRTUAL = 'virtual',
  MOBILE = 'mobile'
}

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ActivityType })
  type: ActivityType;

  @Column({ type: 'enum', enum: ActivityStatus, default: ActivityStatus.SCHEDULED })
  status: ActivityStatus;

  @Column({ type: 'enum', enum: ActivityFrequency, default: ActivityFrequency.ONE_TIME })
  frequency: ActivityFrequency;

  @Column({ type: 'enum', enum: ActivityLocation })
  location: ActivityLocation;

  @Column({ type: 'varchar', length: 200, nullable: true })
  specificLocation: string; // Room name, outdoor area, etc.

  @Column({ type: 'timestamp' })
  scheduledDate: Date;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ type: 'int', default: 0 })
  duration: number; // Minutes

  @Column({ type: 'int', default: 0 })
  maxParticipants: number;

  @Column({ type: 'int', default: 0 })
  minParticipants: number;

  @Column({ type: 'int', default: 0 })
  currentParticipants: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  cost: number;

  @Column({ type: 'varchar', length: 3, default: 'GBP' })
  currency: string;

  @Column({ type: 'boolean', default: false })
  requiresRSVP: boolean;

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  recurringPattern: string; // daily, weekly, monthly, custom

  @Column({ type: 'int', nullable: true })
  recurringInterval: number; // Every X days/weeks/months

  @Column({ type: 'timestamp', nullable: true })
  recurringEndDate: Date;

  @Column({ type: 'json', nullable: true })
  requiredEquipment: string[];

  @Column({ type: 'json', nullable: true })
  requiredSkills: string[];

  @Column({ type: 'json', nullable: true })
  requiredCertifications: string[];

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ type: 'text', nullable: true })
  safetyNotes: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  facilitatorId: string;

  @ManyToOne(() => StaffMember)
  @JoinColumn({ name: 'facilitatorId' })
  facilitator: StaffMember;

  @Column({ type: 'varchar', length: 100, nullable: true })
  createdBy: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  updatedBy: string;

  // Relationships
  @OneToMany(() => AttendanceRecord, attendance => attendance.activity)
  attendanceRecords: AttendanceRecord[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public calculateDuration(): void {
    const diffTime = this.endTime.getTime() - this.startTime.getTime();
    this.duration = Math.round(diffTime / (1000 * 60)); // Convert to minutes
  }

  public isScheduled(): boolean {
    return this.status === ActivityStatus.SCHEDULED;
  }

  public isInProgress(): boolean {
    return this.status === ActivityStatus.IN_PROGRESS;
  }

  public isCompleted(): boolean {
    return this.status === ActivityStatus.COMPLETED;
  }

  public isCancelled(): boolean {
    return this.status === ActivityStatus.CANCELLED;
  }

  public isPostponed(): boolean {
    return this.status === ActivityStatus.POSTPONED;
  }

  public isUpcoming(): boolean {
    return this.scheduledDate > new Date() && this.status === ActivityStatus.SCHEDULED;
  }

  public isPast(): boolean {
    return this.endTime < new Date();
  }

  public isToday(): boolean {
    const today = new Date();
    const activityDate = new Date(this.scheduledDate);
    return activityDate.toDateString() === today.toDateString();
  }

  public isThisWeek(): boolean {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return this.scheduledDate >= weekStart && this.scheduledDate <= weekEnd;
  }

  public getDaysUntilActivity(): number {
    const today = new Date();
    const diffTime = this.scheduledDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public getHoursUntilActivity(): number {
    const today = new Date();
    const diffTime = this.scheduledDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60));
  }

  public canBeStarted(): boolean {
    return this.status === ActivityStatus.SCHEDULED && 
           this.scheduledDate <= new Date() && 
           this.endTime > new Date();
  }

  public canBeCompleted(): boolean {
    return this.status === ActivityStatus.IN_PROGRESS;
  }

  public canBeCancelled(): boolean {
    return this.status === ActivityStatus.SCHEDULED || this.status === ActivityStatus.IN_PROGRESS;
  }

  public canBePostponed(): boolean {
    return this.status === ActivityStatus.SCHEDULED;
  }

  public startActivity(): void {
    if (!this.canBeStarted()) {
      throw new Error('Activity cannot be started in current status');
    }
    this.status = ActivityStatus.IN_PROGRESS;
  }

  public completeActivity(): void {
    if (!this.canBeCompleted()) {
      throw new Error('Activity cannot be completed in current status');
    }
    this.status = ActivityStatus.COMPLETED;
  }

  public cancelActivity(reason?: string): void {
    if (!this.canBeCancelled()) {
      throw new Error('Activity cannot be cancelled in current status');
    }
    this.status = ActivityStatus.CANCELLED;
    if (reason) {
      this.notes = this.notes ? `${this.notes}\nCancelled: ${reason}` : `Cancelled: ${reason}`;
    }
  }

  public postponeActivity(newDate: Date, reason?: string): void {
    if (!this.canBePostponed()) {
      throw new Error('Activity cannot be postponed in current status');
    }
    this.scheduledDate = newDate;
    this.status = ActivityStatus.POSTPONED;
    if (reason) {
      this.notes = this.notes ? `${this.notes}\nPostponed: ${reason}` : `Postponed: ${reason}`;
    }
  }

  public isFullyBooked(): boolean {
    return this.currentParticipants >= this.maxParticipants;
  }

  public hasMinimumParticipants(): boolean {
    return this.currentParticipants >= this.minParticipants;
  }

  public getAvailableSpots(): number {
    return Math.max(0, this.maxParticipants - this.currentParticipants);
  }

  public getParticipationRate(): number {
    if (this.maxParticipants === 0) return 0;
    return (this.currentParticipants / this.maxParticipants) * 100;
  }

  public getActivitySummary(): {
    id: string;
    title: string;
    type: string;
    status: string;
    scheduledDate: Date;
    startTime: Date;
    endTime: Date;
    duration: number;
    location: string;
    specificLocation: string;
    maxParticipants: number;
    currentParticipants: number;
    availableSpots: number;
    participationRate: number;
    isFullyBooked: boolean;
    hasMinimumParticipants: boolean;
    requiresRSVP: boolean;
    isRecurring: boolean;
    cost: number;
    currency: string;
    facilitatorName: string;
  } {
    return {
      id: this.id,
      title: this.title,
      type: this.type,
      status: this.status,
      scheduledDate: this.scheduledDate,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.duration,
      location: this.location,
      specificLocation: this.specificLocation || '',
      maxParticipants: this.maxParticipants,
      currentParticipants: this.currentParticipants,
      availableSpots: this.getAvailableSpots(),
      participationRate: this.getParticipationRate(),
      isFullyBooked: this.isFullyBooked(),
      hasMinimumParticipants: this.hasMinimumParticipants(),
      requiresRSVP: this.requiresRSVP,
      isRecurring: this.isRecurring,
      cost: this.cost || 0,
      currency: this.currency,
      facilitatorName: this.facilitator?.getFullName() || '',
    };
  }
}