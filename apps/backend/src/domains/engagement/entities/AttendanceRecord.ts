import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Activity } from './Activity';
import { Resident } from '../../care/entities/Resident';
import { StaffMember } from '../../staff/entities/StaffMember';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  LEFT_EARLY = 'left_early',
  PARTIAL = 'partial',
  EXCUSED = 'excused',
  UNEXCUSED = 'unexcused'
}

export enum AttendanceType {
  RESIDENT = 'resident',
  STAFF = 'staff',
  VISITOR = 'visitor',
  VOLUNTEER = 'volunteer',
  FAMILY = 'family'
}

@Entity('attendance_records')
export class AttendanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Activity, activity => activity.attendanceRecords)
  @JoinColumn({ name: 'activityId' })
  activity: Activity;

  @Column({ type: 'uuid' })
  activityId: string;

  @Column({ type: 'var char', length: 100 })
  participantId: string;

  @Column({ type: 'var char', length: 200 })
  participantName: string;

  @Column({ type: 'enum', enum: AttendanceType })
  participantType: AttendanceType;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.PRESENT })
  status: AttendanceStatus;

  @Column({ type: 'timestamp', nullable: true })
  checkInTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkOutTime: Date;

  @Column({ type: 'int', nullable: true })
  duration: number; // Minutes

  @Column({ type: 'boolean', default: false })
  isRSVP: boolean;

  @Column({ type: 'timestamp', nullable: true })
  rsvpDate: Date;

  @Column({ type: 'boolean', default: false })
  isNoShow: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  reasonForAbsence: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  engagementScore: number; // 1-5 scale

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ type: 'json', nullable: true })
  healthNotes: any; // Any health-related observations

  @Column({ type: 'json', nullable: true })
  behaviorNotes: any; // Any behavioral observations

  @Column({ type: 'var char', length: 100, nullable: true })
  recordedBy: string;

  @ManyToOne(() => StaffMember)
  @JoinColumn({ name: 'recordedBy' })
  recorder: StaffMember;

  @Column({ type: 'var char', length: 100, nullable: true })
  createdBy: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public calculateDuration(): void {
    if (this.checkInTime && this.checkOutTime) {
      const diffTime = this.checkOutTime.getTime() - this.checkInTime.getTime();
      this.duration = Math.round(diffTime / (1000 * 60)); // Convert to minutes
    }
  }

  public isPresent(): boolean {
    return this.status === AttendanceStatus.PRESENT;
  }

  public isAbsent(): boolean {
    return this.status === AttendanceStatus.ABSENT;
  }

  public isLate(): boolean {
    return this.status === AttendanceStatus.LATE;
  }

  public leftEarly(): boolean {
    return this.status === AttendanceStatus.LEFT_EARLY;
  }

  public isPartial(): boolean {
    return this.status === AttendanceStatus.PARTIAL;
  }

  public isExcused(): boolean {
    return this.status === AttendanceStatus.EXCUSED;
  }

  public isUnexcused(): boolean {
    return this.status === AttendanceStatus.UNEXCUSED;
  }

  public getIsNoShow(): boolean {
    return this.isNoShow;
  }

  public isResident(): boolean {
    return this.participantType === AttendanceType.RESIDENT;
  }

  public isStaff(): boolean {
    return this.participantType === AttendanceType.STAFF;
  }

  public isVisitor(): boolean {
    return this.participantType === AttendanceType.VISITOR;
  }

  public isVolunteer(): boolean {
    return this.participantType === AttendanceType.VOLUNTEER;
  }

  public isFamily(): boolean {
    return this.participantType === AttendanceType.FAMILY;
  }

  public checkIn(checkInTime?: Date): void {
    this.checkInTime = checkInTime || new Date();
    this.status = AttendanceStatus.PRESENT;
    this.isNoShow = false;
  }

  public checkOut(checkOutTime?: Date): void {
    this.checkOutTime = checkOutTime || new Date();
    this.calculateDuration();
  }

  public markAbsent(reason?: string): void {
    this.status = AttendanceStatus.ABSENT;
    this.reasonForAbsence = reason || '';
    this.isNoShow = true;
  }

  public markLate(reason?: string): void {
    this.status = AttendanceStatus.LATE;
    this.notes = this.notes ? `${this.notes}\nLate: ${reason}` : `Late: ${reason}`;
  }

  public markLeftEarly(reason?: string): void {
    this.status = AttendanceStatus.LEFT_EARLY;
    this.notes = this.notes ? `${this.notes}\nLeft Early: ${reason}` : `Left Early: ${reason}`;
  }

  public markExcused(reason: string): void {
    this.status = AttendanceStatus.EXCUSED;
    this.reasonForAbsence = reason;
  }

  public markUnexcused(): void {
    this.status = AttendanceStatus.UNEXCUSED;
  }

  public setEngagementScore(score: number): void {
    if (score < 1 || score > 5) {
      throw new Error('Engagement score must be between 1 and 5');
    }
    this.engagementScore = score;
  }

  public getEngagementLevel(): string {
    if (!this.engagementScore) return 'Not Rated';
    
    if (this.engagementScore >= 4.5) return 'Excellent';
    if (this.engagementScore >= 3.5) return 'Good';
    if (this.engagementScore >= 2.5) return 'Fair';
    if (this.engagementScore >= 1.5) return 'Poor';
    return 'Very Poor';
  }

  public getAttendanceSummary(): {
    id: string;
    participantName: string;
    participantType: string;
    status: string;
    checkInTime: Date | null;
    checkOutTime: Date | null;
    duration: number | null;
    isRSVP: boolean;
    rsvpDate: Date | null;
    isNoShow: boolean;
    engagementScore: number | null;
    engagementLevel: string;
    reasonForAbsence: string;
    notes: string;
    feedback: string;
  } {
    return {
      id: this.id,
      participantName: this.participantName,
      participantType: this.participantType,
      status: this.status,
      checkInTime: this.checkInTime,
      checkOutTime: this.checkOutTime,
      duration: this.duration,
      isRSVP: this.isRSVP,
      rsvpDate: this.rsvpDate,
      isNoShow: this.isNoShow,
      engagementScore: this.engagementScore,
      engagementLevel: this.getEngagementLevel(),
      reasonForAbsence: this.reasonForAbsence || '',
      notes: this.notes || '',
      feedback: this.feedback || '',
    };
  }

  public getDurationFormatted(): string {
    if (!this.duration) return 'N/A';
    
    const hours = Math.floor(this.duration / 60);
    const minutes = this.duration % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  public isFullyAttended(): boolean {
    return this.status === AttendanceStatus.PRESENT && 
           this.checkInTime && 
           this.checkOutTime && 
           !this.isNoShow;
  }

  public getAttendancePercentage(): number {
    if (!this.activity) return 0;
    
    const activityDuration = this.activity.duration;
    if (!activityDuration || !this.duration) return 0;
    
    return Math.min(100, (this.duration / activityDuration) * 100);
  }
}
