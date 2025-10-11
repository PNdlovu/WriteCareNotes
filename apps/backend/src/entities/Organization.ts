import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Tenant } from './Tenant';

export enum OrganizationType {
  CARE_HOME = 'CARE_HOME',
  NURSING_HOME = 'NURSING_HOME',
  ASSISTED_LIVING = 'ASSISTED_LIVING',
  DOMICILIARY = 'DOMICILIARY',
  NHS_TRUST = 'NHS_TRUST'
}

@Entity('organizations')
@Index(['tenantId'])
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'enum', enum: OrganizationType })
  type: OrganizationType;

  @Column({ name: 'cqc_registration', length: 50, nullable: true })
  cqcRegistration?: string;

  @Column({ name: 'ofsted_registration', length: 50, nullable: true })
  ofstedRegistration?: string;

  @Column({ type: 'jsonb', nullable: true })
  address?: Record<string, any>;

  @Column({ name: 'contact_info', type: 'jsonb', nullable: true })
  contactInfo?: Record<string, any>;

  @Column({ type: 'jsonb', default: '{}' })
  settings: Record<string, any>;

  @Column({ name: 'compliance_status', type: 'jsonb', default: '{}' })
  complianceStatus: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  // Relationships
  @ManyToOne(() => Tenant, tenant => tenant.organizations)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Add users relationship to prevent TypeScript errors
  users: any[];

  // Relationships with other entities will be established after proper entity loading
}
