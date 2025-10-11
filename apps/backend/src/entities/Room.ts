import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Room Entity for WriteCareNotes
 * @module RoomEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Room entity for managing care home accommodation.
 */

import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Resident } from './Resident';

@Entity('wcn_rooms')
export class Room extends BaseEntity {
  @Column({ type: 'var char', length: 50, unique: true })
  roomNumber!: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  roomName?: string;

  @Column({ type: 'var char', length: 50 })
  roomType!: string; // SINGLE, DOUBLE, SHARED

  @Column({ type: 'integer', default: 1 })
  capacity!: number;

  @Column({ type: 'var char', length: 50, default: 'AVAILABLE' })
  status!: string; // AVAILABLE, OCCUPIED, MAINTENANCE, OUT_OF_SERVICE

  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => Resident, resident => resident.room)
  residents!: Resident[];
}

export default Room;
