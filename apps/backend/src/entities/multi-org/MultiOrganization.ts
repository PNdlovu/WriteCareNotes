import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum OrganizationType {
  CARE_HOME = 'care_home',
  NURSING_HOME = 'nursing_home',
  RESIDENTIAL_HOME = 'residential_home',
  DOMICILIARY_PROVIDER = 'domiciliary_provider',
  HEALTHCARE_TRUST = 'healthcare_trust'
}

@Entity('multi_organizations')
export class MultiOrganization extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  organizationCode: string;

  @Column()
  organizationName: string;

  @Column({
    type: 'enum',
    enum: OrganizationType
  })
  organizationType: OrganizationType;

  @Column('jsonb')
  hierarchyLevel: {
    level: number;
    parentOrganizationId?: string;
    childOrganizations: string[];
  };

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  isParentOrganization(): boolean {
    return this.hierarchyLevel.level === 1;
  }

  hasChildOrganizations(): boolean {
    return this.hierarchyLevel.childOrganizations.length > 0;
  }
}