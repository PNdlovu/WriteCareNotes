import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Index } from 'typeorm';
import { IsNotEmpty, IsEnum, IsOptional, IsJSON, IsBoolean } from 'class-validator';
import { ResidentEntity } from './resident.entity';
import { RoomEntity } from './room.entity';

export enum DeviceType {
  VOICE_ASSISTANT = 'voice_assistant',
  SMART_SPEAKER = 'smart_speaker',
  FALL_DETECTOR = 'fall_detector',
  ENVIRONMENTAL_SENSOR = 'environmental_sensor',
  SMART_LIGHT = 'smart_light',
  SMART_THERMOSTAT = 'smart_thermostat',
  SMART_LOCK = 'smart_lock',
  SECURITY_CAMERA = 'security_camera',
  MEDICATION_DISPENSER = 'medication_dispenser',
  SLEEP_MONITOR = 'sleep_monitor',
  ACTIVITY_TRACKER = 'activity_tracker',
  EMERGENCY_BUTTON = 'emergency_button',
  AIR_QUALITY_MONITOR = 'air_quality_monitor',
  SMART_TV = 'smart_tv',
  TABLET_INTERFACE = 'tablet_interface',
}

export enum DeviceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
  OFFLINE = 'offline',
}

export enum ConnectivityType {
  WIFI = 'wifi',
  BLUETOOTH = 'bluetooth',
  ZIGBEE = 'zigbee',
  ZWAVE = 'z_wave',
  ETHERNET = 'ethernet',
  CELLULAR = 'cellular',
}

@Entity('smart_devices')
@Index(['deviceType', 'status'])
@Index(['roomId', 'deviceType'])
@Index(['residentId', 'deviceType'])
export class SmartDeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  deviceName: string;

  @Column({ type: 'enum', enum: DeviceType })
  @IsEnum(DeviceType)
  deviceType: DeviceType;

  @Column({ type: 'varchar', length: 100 })
  @IsNotEmpty()
  manufacturer: string;

  @Column({ type: 'varchar', length: 100 })
  @IsNotEmpty()
  model: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @IsNotEmpty()
  serialNumber: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  @IsOptional()
  ipAddress: string;

  @Column({ type: 'varchar', length: 17, nullable: true })
  @IsOptional()
  macAddress: string;

  @Column({ type: 'enum', enum: DeviceStatus, default: DeviceStatus.INACTIVE })
  @IsEnum(DeviceStatus)
  status: DeviceStatus;

  @Column({ type: 'enum', enum: ConnectivityType })
  @IsEnum(ConnectivityType)
  connectivityType: ConnectivityType;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  configuration: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  capabilities: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  currentState: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  automationRules: Record<string, any>;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  firmwareVersion: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  softwareVersion: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  lastSeen: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  lastMaintenanceDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  nextMaintenanceDate: Date;

  @Column({ type: 'int', default: 100 })
  batteryLevel: number;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isOnline: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  requiresAttention: boolean;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  alertSettings: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  privacySettings: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  roomId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  residentId: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  installedBy: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  installationDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => RoomEntity, { nullable: true })
  room: RoomEntity;

  @ManyToOne(() => ResidentEntity, { nullable: true })
  resident: ResidentEntity;

  // Methods for device management
  isHealthy(): boolean {
    return this.status === DeviceStatus.ACTIVE && 
           this.isOnline && 
           !this.requiresAttention &&
           this.batteryLevel > 20;
  }

  needsMaintenance(): boolean {
    if (!this.nextMaintenanceDate) return false;
    return new Date() >= this.nextMaintenanceDate;
  }

  getDeviceInfo(): Record<string, any> {
    return {
      id: this.id,
      name: this.deviceName,
      type: this.deviceType,
      status: this.status,
      isOnline: this.isOnline,
      batteryLevel: this.batteryLevel,
      lastSeen: this.lastSeen,
      capabilities: this.capabilities,
      currentState: this.currentState,
    };
  }

  updateState(newState: Record<string, any>): void {
    this.currentState = { ...this.currentState, ...newState };
    this.lastSeen = new Date();
    this.updatedAt = new Date();
  }

  setMaintenanceSchedule(intervalDays: number): void {
    if (this.lastMaintenanceDate) {
      this.nextMaintenanceDate = new Date(this.lastMaintenanceDate.getTime() + (intervalDays * 24 * 60 * 60 * 1000));
    } else {
      this.nextMaintenanceDate = new Date(Date.now() + (intervalDays * 24 * 60 * 60 * 1000));
    }
  }
}