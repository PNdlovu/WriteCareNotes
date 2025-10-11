import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum SystemType {
  NHS_SPINE = 'nhs_spine',
  GP_SYSTEM = 'gp_system',
  HOSPITAL_SYSTEM = 'hospital_system',
  PHARMACY_SYSTEM = 'pharmacy_system',
  SOCIAL_SERVICES = 'social_services',
  REGULATORY_SYSTEM = 'regulatory_system',
  FINANCIAL_SYSTEM = 'financial_system',
  FAMILY_PORTAL = 'family_portal'
}

export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  MAINTENANCE = 'maintenance',
  TESTING = 'testing'
}

@Entity('external_systems')
export class ExternalSystem extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  systemId: string;

  @Column()
  systemName: string;

  @Column({
    type: 'enum',
    enum: SystemType
  })
  systemType: SystemType;

  @Column({
    type: 'enum',
    enum: IntegrationStatus,
    default: IntegrationStatus.ACTIVE
  })
  status: IntegrationStatus;

  @Column('jsonb')
  connectionConfig: {
    endpoint: string;
    authentication: any;
    timeout: number;
    retryPolicy: any;
  };

  @Column('jsonb')
  dataMapping: {
    inboundMappings: any[];
    outboundMappings: any[];
    transformationRules: any[];
  };

  @Column('int', { default: 0 })
  totalTransactions: number;

  @Column('int', { default: 0 })
  failedTransactions: number;

  @Column('timestamp', { nullable: true })
  lastSuccessfulSync?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  calculateSuccessRate(): number {
    if (this.totalTransactions === 0) return 100;
    return ((this.totalTransactions - this.failedTransactions) / this.totalTransactions) * 100;
  }

  isHealthy(): boolean {
    return this.status === IntegrationStatus.ACTIVE && this.calculateSuccessRate() >= 95;
  }
}