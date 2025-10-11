import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { CareLevel } from './Bed';

export enum WaitingListPriority {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum WaitingListStatus {
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  PLACED = 'placed',
  WITHDRAWN = 'withdrawn',
  EXPIRED = 'expired'
}

export enum FundingSource {
  PRIVATE_PAY = 'private_pay',
  NHS_CHC = 'nhs_chc',
  LOCAL_AUTHORITY = 'local_authority',
  INSURANCE = 'insurance',
  MIXED_FUNDING = 'mixed_funding'
}

export interface ContactDetails {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  isPrimaryContact: boolean;
}

export interface MedicalRequirements {
  careLevel: CareLevel[];
  specialistCare: string[];
  mobilitySupport: string[];
  cognitiveSupport: string[];
  medicalEquipment: string[];
  dietaryRequirements: string[];
}

export interface RoomPreferences {
  roomType: string[];
  floor?: number;
  wing?: string;
  amenities: string[];
  accessibility: string[];
  location: 'ground_floor' | 'upper_floor' | 'no_preference';
}

export interface AssessmentDetails {
  assessmentDate: Date;
  assessor: string;
  careNeedsScore: number;
  mobilityScore: number;
  cognitiveScore: number;
  medicalComplexity: 'low' | 'medium' | 'high' | 'very_high';
  recommendedCareLevel: CareLevel;
  notes: string;
}

@Entity('waiting_list_entries')
export class WaitingListEntry extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicationNumber: string;

  @Column()
  prospectiveResidentName: string;

  @Column('date')
  dateOfBirth: Date;

  @Column()
  nhsNumber: string;

  @Column('jsonb')
  contactDetails: ContactDetails[];

  @Column({
    type: 'enum',
    enum: WaitingListPriority,
    default: WaitingListPriority.MEDIUM
  })
  priority: WaitingListPriority;

  @Column({
    type: 'enum',
    enum: WaitingListStatus,
    default: WaitingListStatus.ACTIVE
  })
  status: WaitingListStatus;

  @Column('date')
  applicationDate: Date;

  @Column('date', { nullable: true })
  preferredAdmissionDate?: Date;

  @Column('date', { nullable: true })
  urgentAdmissionDate?: Date;

  @Column({
    type: 'enum',
    enum: FundingSource
  })
  fundingSource: FundingSource;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  weeklyBudget?: number;

  @Column('jsonb')
  medicalRequirements: MedicalRequirements;

  @Column('jsonb')
  roomPreferences: RoomPreferences;

  @Column('jsonb', { nullable: true })
  assessmentDetails?: AssessmentDetails;

  @Column('text', { nullable: true })
  specialRequirements?: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column('uuid', { nullable: true })
  assignedBedId?: string;

  @Column('timestamp', { nullable: true })
  placementDate?: Date;

  @Column('text', { nullable: true })
  placementNotes?: string;

  @Column()
  referralSource: string;

  @Column()
  referrerName: string;

  @Column()
  referrerContact: string;

  @Column('timestamp', { nullable: true })
  lastContactDate?: Date;

  @Column('timestamp', { nullable: true })
  nextFollowUpDate?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isActive(): boolean {
    return this.status === WaitingListStatus.ACTIVE;
  }

  isUrgent(): boolean {
    return this.priority === WaitingListPriority.URGENT;
  }

  getDaysOnWaitingList(): number {
    const now = new Date();
    const applicationDate = new Date(this.applicationDate);
    const diffTime = Math.abs(now.getTime() - applicationDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isFollowUpDue(): boolean {
    if (!this.nextFollowUpDate) return false;
    return new Date() >= new Date(this.nextFollowUpDate);
  }

  canBeAccommodatedBy(bed: any): boolean {
    // Check care level compatibility
    const careCompatible = this.medicalRequirements.careLevel.some(level => 
      bed.careLevel.includes(level)
    );

    // Check room type preference
    const roomTypeCompatible = this.roomPreferences.roomType.length === 0 || 
      this.roomPreferences.roomType.includes(bed.room.roomType);

    // Check accessibility requirements
    const accessibilityCompatible = this.medicalRequirements.mobilitySupport.every(requirement => {
      switch (requirement) {
        case 'wheelchair_access':
          return bed.accessibility.wheelchairAccessible;
        case 'hoist_compatible':
          return bed.accessibility.hoistCompatible;
        case 'low_height':
          return bed.accessibility.lowHeight;
        default:
          return true;
      }
    });

    return careCompatible && roomTypeCompatible && accessibilityCompatible;
  }

  calculatePriorityScore(): number {
    let score = 0;

    // Base priority score
    switch (this.priority) {
      case WaitingListPriority.URGENT:
        score += 100;
        break;
      case WaitingListPriority.HIGH:
        score += 75;
        break;
      case WaitingListPriority.MEDIUM:
        score += 50;
        break;
      case WaitingListPriority.LOW:
        score += 25;
        break;
    }

    // Time on waiting list bonus
    const daysWaiting = this.getDaysOnWaitingList();
    score += Math.min(daysWaiting * 0.5, 50); // Max 50 points for time

    // Medical complexity bonus
    if (this.assessmentDetails) {
      switch (this.assessmentDetails.medicalComplexity) {
        case 'very_high':
          score += 30;
          break;
        case 'high':
          score += 20;
          break;
        case 'medium':
          score += 10;
          break;
      }
    }

    return score;
  }
}
