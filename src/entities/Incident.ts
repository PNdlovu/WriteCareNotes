import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Tenant } from './Tenant';
import { Organization } from './Organization';

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum IncidentStatus {
  REPORTED = 'REPORTED',
  INVESTIGATING = 'INVESTIGATING',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED'
}

@Entity('incidents')
@Index(['tenantId'])
@Index(['organizationId'])
@Index(['residentId'])
@Index(['severity'])
@Index(['occurredAt'])
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'incident_number', length: 100, unique: true })
  incidentNumber: string;

  @Column({ name: 'resident_id', nullable: true })
  residentId?: string;

  @Column({ name: 'reporter_id' })
  reporterId: string;

  @Column({ name: 'incident_type', length: 50 })
  incidentType: string;

  @Column({ type: 'enum', enum: IncidentSeverity })
  severity: IncidentSeverity;

  @Column({ length: 50, nullable: true })
  category?: string;

  @Column({ length: 50, nullable: true })
  subcategory?: string;

  @Column({ length: 255, nullable: true })
  location?: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'immediate_actions', type: 'text', nullable: true })
  immediateActions?: string;

  @Column({ type: 'jsonb', default: '[]' })
  injuries: Record<string, any>[];

  @Column({ type: 'jsonb', default: '[]' })
  witnesses: Record<string, any>[];

  @Column({ name: 'equipment_involved', type: 'jsonb', default: '[]' })
  equipmentInvolved: Record<string, any>[];

  @Column({ name: 'environmental_factors', type: 'text', nullable: true })
  environmentalFactors?: string;

  @Column({ name: 'occurred_at' })
  occurredAt: Date;

  @Column({ name: 'discovered_at', nullable: true })
  discoveredAt?: Date;

  @Column({ name: 'reported_at', default: () => 'CURRENT_TIMESTAMP' })
  reportedAt: Date;

  @Column({ type: 'enum', enum: IncidentStatus, default: IncidentStatus.REPORTED })
  status: IncidentStatus;

  @Column({ name: 'investigation_findings', type: 'text', nullable: true })
  investigationFindings?: string;

  @Column({ name: 'root_cause_analysis', type: 'text', nullable: true })
  rootCauseAnalysis?: string;

  @Column({ name: 'corrective_actions', type: 'jsonb', default: '[]' })
  correctiveActions: Record<string, any>[];

  @Column({ name: 'preventive_measures', type: 'jsonb', default: '[]' })
  preventiveMeasures: Record<string, any>[];

  @Column({ name: 'lessons_learned', type: 'text', nullable: true })
  lessonsLearned?: string;

  @Column({ name: 'follow_up_required', default: false })
  followUpRequired: boolean;

  @Column({ name: 'follow_up_date', type: 'date', nullable: true })
  followUpDate?: Date;

  @Column({ name: 'regulatory_notification_required', default: false })
  regulatoryNotificationRequired: boolean;

  @Column({ name: 'regulatory_notified_at', nullable: true })
  regulatoryNotifiedAt?: Date;

  @Column({ name: 'family_notified', default: false })
  familyNotified: boolean;

  @Column({ name: 'family_notified_at', nullable: true })
  familyNotifiedAt?: Date;

  @Column({ name: 'gp_notified', default: false })
  gpNotified: boolean;

  @Column({ name: 'gp_notified_at', nullable: true })
  gpNotifiedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;

  // Relationships
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  // Additional entity relationships will be configured after all entities are properly loaded
}