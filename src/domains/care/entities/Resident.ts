/**
 * @fileoverview Resident Entity (Stub)
 * @module Entities/Resident
 * @version 1.0.0
 */

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('residents')
export class Resident {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  roomNumber?: string;

  @Column({ type: 'uuid', nullable: true })
  organizationId?: string;

  @Column({ type: 'uuid', nullable: true })
  tenantId?: string;

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

export default Resident;
