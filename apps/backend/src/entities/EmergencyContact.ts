import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Emergency Contact Entity for WriteCareNotes
 * @module EmergencyContactEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Emergency contact entity with encrypted personal information.
 */

import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Resident } from './Resident';

@Entity('wcn_emergency_contacts')
export class EmergencyContact extends BaseEntity {
  @Column({ type: 'text' }) // Encrypted
  firstName!: string;

  @Column({ type: 'text' }) // Encrypted
  lastName!: string;

  @Column({ type: 'var char', length: 100 })
  relationship!: string;

  @Column({ type: 'text' }) // Encrypted
  phoneNumber!: string;

  @Column({ type: 'text', nullable: true }) // Encrypted
  email?: string;

  @Column({ type: 'text', nullable: true }) // Encrypted
  address?: string;

  @Column({ type: 'boolean', default: false })
  isPrimary!: boolean;

  @ManyToOne(() => Resident, resident => resident.emergencyContacts)
  @JoinColumn({ name: 'resident_id' })
  resident!: Resident;
}

export default EmergencyContact;
