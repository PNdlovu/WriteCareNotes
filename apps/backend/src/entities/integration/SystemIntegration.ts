import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum IntegrationType {
  API = 'api',
  DATABASE = 'database',
  FILE_TRANSFER = 'file_transfer',
  MESSAGING = 'messaging',
  WEBHOOK = 'webhook',
  REAL_TIME_STREAM = 'real_time_stream'
}

export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  MAINTENANCE = 'maintenance'
}

export interface IntegrationEndpoint {
  endpointUrl: string;
  authenticationMethod: 'api_key' | 'oauth' | 'certificate' | 'basic_auth';
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  dataFormat: 'json' | 'xml' | 'hl7' | 'fhir' | 'csv';
  encryptionRequired: boolean;
}

export interface DataMapping {
  sourceField: string;
  targetField: string;
  transformation: string;
  validation: string;
  required: boolean;
}

@Entity('system_integrations')
export class SystemIntegration extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  integrationName: string;

  @Column({ enum: IntegrationType })
  integrationType: IntegrationType;

  @Column({ enum: IntegrationStatus, default: IntegrationStatus.ACTIVE })
  status: IntegrationStatus;

  @Column('jsonb')
  endpoint: IntegrationEndpoint;

  @Column('jsonb')
  dataMapping: DataMapping[];

  @Column('timestamp')
  lastSync: Date;

  @Column('int')
  successfulSyncs: number;

  @Column('int')
  failedSyncs: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  isHealthy(): boolean {
    const totalSyncs = this.successfulSyncs + this.failedSyncs;
    const successRate = totalSyncs > 0 ? (this.successfulSyncs / totalSyncs) : 1;
    return successRate >= 0.95 && this.status === IntegrationStatus.ACTIVE;
  }

  getSuccessRate(): number {
    const totalSyncs = this.successfulSyncs + this.failedSyncs;
    return totalSyncs > 0 ? (this.successfulSyncs / totalSyncs) * 100 : 100;
  }
}