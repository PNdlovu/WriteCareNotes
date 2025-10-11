import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Shift } from './Shift';

export enum RotaStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum RotaType {
  WEEKLY = 'weekly',
  FORTNIGHTLY = 'fortnightly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

export interface RotaMetrics {
  totalShifts: number;
  totalHours: number;
  totalCost: number;
  coveragePercentage: number;
  overtimeHours: number;
  staffingLevels: {
    day: number;
    evening: number;
    night: number;
  };
}

export interface RotaRequirements {
  minimumStaffPerShift: number;
  maximumStaffPerShift: number;
  requiredSkills: string[];
  requiredCertifications: string[];
  budgetConstraints?: {
    maxTotalCost: number;
    maxOvertimeCost: number;
  };
}

export interface RotaConstraints {
  maxConsecutiveDays: number;
  minRestHoursBetweenShifts: number;
  maxWeeklyHours: number;
  maxMonthlyHours: number;
  preferredDaysOff: string[];
  unavailableDates: Date[];
}

@Entity('rotas')
export class Rota extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  rotaCode: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: RotaType
  })
  type: RotaType;

  @Column({
    type: 'enum',
    enum: RotaStatus,
    default: RotaStatus.DRAFT
  })
  status: RotaStatus;

  @Column('date')
  startDate: Date;

  @Column('date')
  endDate: Date;

  @Column()
  locationId: string;

  @Column()
  department: string;

  @Column('text', { nullable: true })
  description?: string;

  @OneToMany(() => Shift, shift => shift.id)
  @JoinColumn()
  shifts: Shift[];

  @Column('jsonb', { nullable: true })
  requirements?: RotaRequirements;

  @Column('jsonb', { nullable: true })
  const raints?: RotaConstraints;

  @Column('jsonb', { nullable: true })
  metrics?: RotaMetrics;

  @Column({ nullable: true })
  createdBy?: string;

  @Column({ nullable: true })
  publishedBy?: string;

  @Column('timestamp', { nullable: true })
  publishedAt?: Date;

  @Column({ nullable: true })
  approvedBy?: string;

  @Column('timestamp', { nullable: true })
  approvedAt?: Date;

  @Column({ default: false })
  isTemplate: boolean;

  @Column({ nullable: true })
  templateId?: string;

  @Column({ default: false })
  isRecurring: boolean;

  @Column('text', { nullable: true })
  recurringPattern?: string;

  @Column({ nullable: true })
  parentRotaId?: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column({ default: 0 })
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Business Methods
  isDraft(): boolean {
    return this.status === RotaStatus.DRAFT;
  }

  isPublished(): boolean {
    return this.status === RotaStatus.PUBLISHED;
  }

  isActive(): boolean {
    return this.status === RotaStatus.ACTIVE;
  }

  isCompleted(): boolean {
    return this.status === RotaStatus.COMPLETED;
  }

  isCurrent(): boolean {
    const now = new Date();
    return this.startDate <= now && this.endDate >= now && this.isActive();
  }

  isUpcoming(): boolean {
    return this.startDate > new Date() && (this.isPublished() || this.isActive());
  }

  isPast(): boolean {
    return this.endDate < new Date();
  }

  canBeModified(): boolean {
    return this.isDraft() || (this.isPublished() && this.isUpcoming());
  }

  canBePublished(): boolean {
    return this.isDraft() && this.hasValidShifts();
  }

  getDurationDays(): number {
    const timeDiff = this.endDate.getTime() - this.startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
  }

  hasValidShifts(): boolean {
    return this.shifts && this.shifts.length > 0;
  }

  getTotalShifts(): number {
    return this.shifts?.length || 0;
  }

  getTotalHours(): number {
    if (!this.shifts) return 0;
    return this.shifts.reduce((total, shift) => total + shift.scheduledHours, 0);
  }

  getTotalCost(): number {
    if (!this.shifts) return 0;
    return this.shifts.reduce((total, shift) => {
      return total + (shift.scheduledHours * shift.hourlyRate);
    }, 0);
  }

  getOvertimeHours(): number {
    if (!this.shifts) return 0;
    return this.shifts.reduce((total, shift) => {
      return total + (shift.isOvertime() ? shift.scheduledHours : 0);
    }, 0);
  }

  getOvertimeCost(): number {
    if (!this.shifts) return 0;
    return this.shifts.reduce((total, shift) => {
      if (shift.isOvertime()) {
        const overtimeRate = shift.overtimeRate || shift.hourlyRate * 1.5;
        return total + (shift.scheduledHours * overtimeRate);
      }
      return total;
    }, 0);
  }

  getCoveragePercentage(): number {
    if (!this.requirements || !this.shifts) return 0;
    
    const requiredShifts = this.getDurationDays() * this.requirements.minimumStaffPerShift;
    const actualShifts = this.shifts.length;
    
    return Math.min((actualShifts / requiredShifts) * 100, 100);
  }

  getStaffingLevels() {
    if (!this.shifts) return { day: 0, evening: 0, night: 0 };
    
    const levels = { day: 0, evening: 0, night: 0 };
    
    this.shifts.forEach(shift => {
      const hour = shift.scheduledStart.getHours();
      if (hour >= 6 && hour < 14) {
        levels.day++;
      } else if (hour >= 14 && hour < 22) {
        levels.evening++;
      } else {
        levels.night++;
      }
    });
    
    return levels;
  }

  getUnfilledShifts(): number {
    if (!this.shifts) return 0;
    return this.shifts.filter(shift => !shift.employeeId).length;
  }

  hasConflicts(): boolean {
    if (!this.shifts) return false;
    
    // Check for overlapping shifts for the same employee
    const employeeShifts = new Map<string, Shift[]>();
    
    this.shifts.forEach(shift => {
      if (!shift.employeeId) return;
      
      if (!employeeShifts.has(shift.employeeId)) {
        employeeShifts.set(shift.employeeId, []);
      }
      employeeShifts.get(shift.employeeId)!.push(shift);
    });
    
    for (const [, shifts] of employeeShifts) {
      for (let i = 0; i < shifts.length; i++) {
        for (let j = i + 1; j < shifts.length; j++) {
          if (this.shiftsOverlap(shifts[i], shifts[j])) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  private shiftsOverlap(shift1: Shift, shift2: Shift): boolean {
    return !(shift1.scheduledEnd <= shift2.scheduledStart || 
             shift1.scheduledStart >= shift2.scheduledEnd);
  }

  isWithinBudget(): boolean {
    if (!this.requirements?.budgetConstraints) return true;
    
    const totalCost = this.getTotalCost();
    const overtimeCost = this.getOvertimeCost();
    
    return totalCost <= this.requirements.budgetConstraints.maxTotalCost &&
           overtimeCost <= this.requirements.budgetConstraints.maxOvertimeCost;
  }

  calculateMetrics(): RotaMetrics {
    const metrics: RotaMetrics = {
      totalShifts: this.getTotalShifts(),
      totalHours: this.getTotalHours(),
      totalCost: this.getTotalCost(),
      coveragePercentage: this.getCoveragePercentage(),
      overtimeHours: this.getOvertimeHours(),
      staffingLevels: this.getStaffingLevels()
    };
    
    this.metrics = metrics;
    return metrics;
  }

  getRotaSummary() {
    return {
      rotaCode: this.rotaCode,
      name: this.name,
      type: this.type,
      status: this.status,
      period: `${this.startDate.toLocaleDateString()} - ${this.endDate.toLocaleDateString()}`,
      department: this.department,
      totalShifts: this.getTotalShifts(),
      totalHours: this.getTotalHours(),
      coverage: `${this.getCoveragePercentage().toFixed(1)}%`,
      cost: this.getTotalCost()
    };
  }

  clone(newStartDate: Date, newEndDate: Date): Partial<Rota> {
    return {
      name: `${this.name} (Copy)`,
      type: this.type,
      startDate: newStartDate,
      endDate: newEndDate,
      locationId: this.locationId,
      department: this.department,
      description: this.description,
      requirements: this.requirements,
      const raints: this.const raints,
      isTemplate: false,
      templateId: this.isTemplate ? this.id : this.templateId
    };
  }
}
