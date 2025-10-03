import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum FiveSPhase {
  SORT = 'sort',
  SET_IN_ORDER = 'set_in_order',
  SHINE = 'shine',
  STANDARDIZE = 'standardize',
  SUSTAIN = 'sustain'
}

export enum WorkplaceArea {
  CARE_STATIONS = 'care_stations',
  MEDICATION_ROOM = 'medication_room',
  KITCHEN = 'kitchen',
  LAUNDRY = 'laundry',
  MAINTENANCE = 'maintenance',
  OFFICE_AREAS = 'office_areas',
  STORAGE_AREAS = 'storage_areas'
}

@Entity('five_s_workplace')
export class FiveSWorkplace extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workplaceName: string;

  @Column({ enum: WorkplaceArea })
  area: WorkplaceArea;

  @Column('jsonb')
  assessmentScores: {
    sort: number;
    setInOrder: number;
    shine: number;
    standardize: number;
    sustain: number;
    overall: number;
  };

  @Column('jsonb')
  improvementActions: Array<{
    phase: FiveSPhase;
    action: string;
    responsible: string;
    dueDate: Date;
    completed: boolean;
  }>;

  @Column('timestamp')
  lastAuditDate: Date;

  @Column('timestamp')
  nextAuditDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  getOverallScore(): number {
    return this.assessmentScores.overall;
  }

  needsImprovement(): boolean {
    return this.assessmentScores.overall < 80;
  }
}