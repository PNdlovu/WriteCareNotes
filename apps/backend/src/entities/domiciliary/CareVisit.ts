import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Employee } from '../hr/Employee';
import { ServiceUser } from './ServiceUser';

export enum VisitType {
  PERSONAL_CARE = 'personal_care',
  MEDICATION = 'medication',
  DOMESTIC = 'domestic',
  SOCIAL = 'social',
  HEALTHCARE = 'healthcare',
  ASSESSMENT = 'assessment',
  EMERGENCY = 'emergency',
  WELFARE_CHECK = 'welfare_check'
}

export enum VisitStatus {
  SCHEDULED = 'scheduled',
  EN_ROUTE = 'en_route',
  ARRIVED = 'arrived',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  MISSED = 'missed',
  CANCELLED = 'cancelled',
  EMERGENCY = 'emergency'
}

export enum VerificationMethod {
  QR_CODE = 'qr_code',
  GPS = 'gps',
  PHOTO = 'photo',
  SERVICE_USER_CONFIRM = 'service_user_confirm',
  FAMILY_CONFIRM = 'family_confirm',
  MANUAL = 'manual'
}

export interface VisitLocation {
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  accuracy?: number;
  timestamp: Date;
  method: 'gps' | 'manual' | 'network';
}

export interface VisitVerification {
  method: VerificationMethod;
  timestamp: Date;
  data: any; // QR code data, photo URL, etc.
  verified: boolean;
  verifiedBy?: string; // Service user name or family member
}

export interface CareTask {
  id: string;
  category: 'personal_care' | 'medication' | 'mobility' | 'nutrition' | 'social' | 'domestic' | 'healthcare';
  task: string;
  description?: string;
  estimatedDuration: number; // minutes
  priority: 'critical' | 'important' | 'routine';
  completed: boolean;
  completedAt?: Date;
  notes?: string;
  issues?: string;
  requiresFollowUp: boolean;
  photosRequired: boolean;
  photoUrls?: string[];
}

export interface MedicationAdministration {
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: Date;
  actualTime?: Date;
  administered: boolean;
  administeredBy?: string;
  reason?: string; // If not administered
  sideEffectsNoted?: string;
  serviceUserResponse?: string;
  witnessRequired: boolean;
  witnessName?: string;
  photos?: string[]; // Photos of medication, MAR chart, etc.
}

export interface VisitObservation {
  id: string;
  category: 'physical' | 'mental' | 'environmental' | 'social' | 'safety';
  observation: string;
  severity: 'normal' | 'concern' | 'urgent';
  actionRequired: boolean;
  actionTaken?: string;
  reportedTo?: string[];
  timestamp: Date;
  photos?: string[];
}

export interface ServiceUserFeedback {
  satisfactionRating: number; // 1-5
  comments?: string;
  concerns?: string;
  compliments?: string;
  requestedChanges?: string;
  providedBy: string; // Service user or family member
  timestamp: Date;
}

export interface TravelInformation {
  travelTime: number; // minutes
  travelDistance: number; // kilometers
  travelMethod: 'car' | 'public_transport' | 'walking' | 'cycling';
  mileage?: number;
  parkingCost?: number;
  tolls?: number;
  route?: {
    startLocation: VisitLocation;
    endLocation: VisitLocation;
    waypoints?: VisitLocation[];
  };
}

@Entity('care_visits')
export class CareVisit extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  visitNumber: string;

  @Column()
  serviceUserId: string;

  @ManyToOne(() => ServiceUser)
  @JoinColumn({ name: 'serviceUserId' })
  serviceUser: ServiceUser;

  @Column()
  careWorkerId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'careWorkerId' })
  careWorker: Employee;

  @Column({
    type: 'enum',
    enum: VisitType
  })
  type: VisitType;

  @Column({
    type: 'enum',
    enum: VisitStatus,
    default: VisitStatus.SCHEDULED
  })
  status: VisitStatus;

  @Column('timestamp')
  scheduledStartTime: Date;

  @Column('timestamp')
  scheduledEndTime: Date;

  @Column('timestamp', { nullable: true })
  actualStartTime?: Date;

  @Column('timestamp', { nullable: true })
  actualEndTime?: Date;

  @Column('int')
  plannedDuration: number; // minutes

  @Column('int', { nullable: true })
  actualDuration?: number; // minutes

  @Column('jsonb')
  scheduledTasks: CareTask[];

  @Column('jsonb', { nullable: true })
  completedTasks?: CareTask[];

  @Column('jsonb', { nullable: true })
  medications?: MedicationAdministration[];

  @Column('jsonb', { nullable: true })
  observations?: VisitObservation[];

  @Column('jsonb', { nullable: true })
  arrivalVerification?: VisitVerification;

  @Column('jsonb', { nullable: true })
  departureVerification?: VisitVerification;

  @Column('jsonb', { nullable: true })
  location?: VisitLocation;

  @Column('text', { nullable: true })
  visitNotes?: string;

  @Column('text', { nullable: true })
  handoverNotes?: string; // For next carer

  @Column('jsonb', { nullable: true })
  serviceUserFeedback?: ServiceUserFeedback;

  @Column('jsonb', { nullable: true })
  travelInfo?: TravelInformation;

  @Column({ default: false })
  requiresFollowUp: boolean;

  @Column('text', { nullable: true })
  followUpReason?: string;

  @Column({ nullable: true })
  followUpAssignedTo?: string;

  @Column({ default: false })
  hasIncident: boolean;

  @Column('text', { nullable: true })
  incidentDescription?: string;

  @Column('timestamp', { nullable: true })
  incidentReportedAt?: Date;

  @Column({ default: false })
  isEmergency: boolean;

  @Column('text', { nullable: true })
  emergencyDetails?: string;

  @Column('jsonb', { nullable: true })
  emergencyContacted?: string[]; // List of people contacted

  @Column({ nullable: true })
  supervisorNotified?: string;

  @Column('timestamp', { nullable: true })
  supervisorNotifiedAt?: Date;

  @Column('jsonb', { nullable: true })
  photoUrls?: string[];

  @Column('jsonb', { nullable: true })
  documentUrls?: string[]; // Care plans, risk assessments updated

  @Column({ default: false })
  requiresManagerReview: boolean;

  @Column({ nullable: true })
  reviewedBy?: string;

  @Column('timestamp', { nullable: true })
  reviewedAt?: Date;

  @Column('text', { nullable: true })
  reviewNotes?: string;

  @Column({ default: false })
  invoiced: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  invoiceAmount?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isScheduled(): boolean {
    return this.status === VisitStatus.SCHEDULED;
  }

  isInProgress(): boolean {
    return [VisitStatus.EN_ROUTE, VisitStatus.ARRIVED, VisitStatus.IN_PROGRESS].includes(this.status);
  }

  isCompleted(): boolean {
    return this.status === VisitStatus.COMPLETED;
  }

  isMissed(): boolean {
    return this.status === VisitStatus.MISSED;
  }

  isOverdue(): boolean {
    if (this.isCompleted() || this.status === VisitStatus.CANCELLED) {
      return false;
    }
    return new Date() > this.scheduledEndTime;
  }

  isLate(): boolean {
    if (!this.actualStartTime) {
      return new Date() > this.scheduledStartTime;
    }
    return this.actualStartTime > this.scheduledStartTime;
  }

  getLateDuration(): number {
    if (!this.isLate() || !this.actualStartTime) return 0;
    return Math.max(0, this.actualStartTime.getTime() - this.scheduledStartTime.getTime()) / (1000 * 60);
  }

  getDurationVariance(): number {
    if (!this.actualDuration) return 0;
    return this.actualDuration - this.plannedDuration;
  }

  getCompletionPercentage(): number {
    if (!this.completedTasks || this.scheduledTasks.length === 0) return 0;
    const completedCount = this.completedTasks.filter(task => task.completed).length;
    return (completedCount / this.scheduledTasks.length) * 100;
  }

  hasUncompletedCriticalTasks(): boolean {
    if (!this.completedTasks) return false;
    return this.scheduledTasks.some(task => 
      task.priority === 'critical' && 
      !this.completedTasks!.find(ct => ct.id === task.id)?.completed
    );
  }

  requiresImmediateAttention(): boolean {
    return this.isEmergency || 
           this.hasIncident || 
           this.hasUncompletedCriticalTasks() ||
           this.observations?.some(obs => obs.severity === 'urgent') || false;
  }

  getCriticalObservations(): VisitObservation[] {
    return this.observations?.filter(obs => obs.severity === 'urgent' || obs.severity === 'concern') || [];
  }

  getMissedMedications(): MedicationAdministration[] {
    return this.medications?.filter(med => !med.administered && med.scheduledTime < new Date()) || [];
  }

  hasLocationVerification(): boolean {
    return !!this.arrivalVerification?.verified;
  }

  getVisitEfficiency(): number {
    if (!this.actualDuration || this.plannedDuration === 0) return 0;
    return (this.plannedDuration / this.actualDuration) * 100;
  }

  getTotalTravelTime(): number {
    return this.travelInfo?.travelTime || 0;
  }

  getTravelCost(): number {
    const mileageCost = (this.travelInfo?.mileage || 0) * 0.45; // UK mileage rate
    const parkingCost = this.travelInfo?.parkingCost || 0;
    const tollCost = this.travelInfo?.tolls || 0;
    return mileageCost + parkingCost + tollCost;
  }

  generateVisitSummary(): any {
    return {
      visitNumber: this.visitNumber,
      serviceUser: this.serviceUser?.getFullName(),
      careWorker: this.careWorker?.getFullName(),
      type: this.type,
      status: this.status,
      scheduledTime: `${this.scheduledStartTime.toLocaleTimeString()} - ${this.scheduledEndTime.toLocaleTimeString()}`,
      actualTime: this.actualStartTime && this.actualEndTime ? 
        `${this.actualStartTime.toLocaleTimeString()} - ${this.actualEndTime.toLocaleTimeString()}` : null,
      duration: {
        planned: this.plannedDuration,
        actual: this.actualDuration,
        variance: this.getDurationVariance()
      },
      completion: {
        percentage: this.getCompletionPercentage(),
        criticalTasksComplete: !this.hasUncompletedCriticalTasks()
      },
      concerns: {
        isLate: this.isLate(),
        hasIncident: this.hasIncident,
        isEmergency: this.isEmergency,
        requiresFollowUp: this.requiresFollowUp,
        criticalObservations: this.getCriticalObservations().length
      },
      verification: {
        locationVerified: this.hasLocationVerification(),
        arrivalMethod: this.arrivalVerification?.method,
        departureMethod: this.departureVerification?.method
      }
    };
  }

  calculatePayableHours(): number {
    if (!this.actualDuration) return this.plannedDuration / 60;
    
    // Use actual duration but minimum of planned duration
    const payableMinutes = Math.max(this.actualDuration, this.plannedDuration);
    return payableMinutes / 60;
  }

  needsQualityReview(): boolean {
    return this.hasIncident ||
           this.isEmergency ||
           this.getCompletionPercentage() < 80 ||
           this.getDurationVariance() > 30 ||
           this.serviceUserFeedback?.satisfactionRating !== undefined && this.serviceUserFeedback.satisfactionRating < 3;
  }

  getNextVisitRecommendations(): string[] {
    const recommendations: any[] = [];
    
    if (this.getDurationVariance() > 15) {
      recommendations.push('Consider extending scheduled duration');
    }
    
    if (this.hasUncompletedCriticalTasks()) {
      recommendations.push('Ensure critical tasks are prioritized');
    }
    
    if (this.observations?.some(obs => obs.actionRequired)) {
      recommendations.push('Follow up on observations requiring action');
    }
    
    if (this.serviceUserFeedback?.requestedChanges) {
      recommendations.push('Address service user requested changes');
    }
    
    return recommendations;
  }
}
