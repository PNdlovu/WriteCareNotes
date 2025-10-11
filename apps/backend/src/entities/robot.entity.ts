import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { IsNotEmpty, IsEnum, IsOptional, IsJSON, IsBoolean, IsNumber } from 'class-validator';
import { RobotTaskEntity } from './robot-task.entity';

export enum RobotType {
  ASSISTIVE = 'assistive',
  COMPANION = 'companion',
  MEDICAL = 'medical',
  MAINTENANCE = 'maintenance',
  DELIVERY = 'delivery',
  SECURITY = 'security',
  THERAPY = 'therapy',
  MOBILITY_AID = 'mobility_aid',
}

export enum RobotStatus {
  ACTIVE = 'active',
  IDLE = 'idle',
  CHARGING = 'charging',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
  OFFLINE = 'offline',
  EMERGENCY_STOP = 'emergency_stop',
}

export enum NavigationMode {
  AUTONOMOUS = 'autonomous',
  GUIDED = 'guided',
  REMOTE_CONTROL = 'remote_control',
  MANUAL = 'manual',
}

@Entity('robots')
@Index(['robotType', 'status'])
@Index(['currentLocation', 'status'])
@Index(['assignedResident', 'robotType'])
export class RobotEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'var char', length: 255 })
  @IsNotEmpty()
  name: string;

  @Column({ type: 'enum', enum: RobotType })
  @IsEnum(RobotType)
  robotType: RobotType;

  @Column({ type: 'var char', length: 100 })
  @IsNotEmpty()
  manufacturer: string;

  @Column({ type: 'var char', length: 100 })
  @IsNotEmpty()
  model: string;

  @Column({ type: 'var char', length: 255, unique: true })
  @IsNotEmpty()
  serialNumber: string;

  @Column({ type: 'var char', length: 50 })
  @IsNotEmpty()
  firmwareVersion: string;

  @Column({ type: 'var char', length: 50 })
  @IsNotEmpty()
  softwareVersion: string;

  @Column({ type: 'enum', enum: RobotStatus, default: RobotStatus.OFFLINE })
  @IsEnum(RobotStatus)
  status: RobotStatus;

  @Column({ type: 'var char', length: 255, nullable: true })
  @IsOptional()
  currentLocation: string;

  @Column({ type: 'var char', length: 255, nullable: true })
  @IsOptional()
  targetLocation: string;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  position: {
    x: number;
    y: number;
    z: number;
    orientation: number;
  };

  @Column({ type: 'enum', enum: NavigationMode, default: NavigationMode.AUTONOMOUS })
  @IsEnum(NavigationMode)
  navigationMode: NavigationMode;

  @Column({ type: 'int', default: 100 })
  @IsNumber()
  batteryLevel: number;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isCharging: boolean;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  lastChargeTime: Date;

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  operatingHours: number;

  @Column({ type: 'jsonb' })
  @IsJSON()
  capabilities: {
    mobility: boolean;
    manipulation: boolean;
    communication: boolean;
    sensing: boolean;
    ai: boolean;
    medicalFunctions: boolean;
    entertainmentFunctions: boolean;
    cleaningFunctions: boolean;
  };

  @Column({ type: 'jsonb' })
  @IsJSON()
  sensors: {
    cameras: number;
    lidar: boolean;
    ultrasonic: boolean;
    infrared: boolean;
    touch: boolean;
    microphones: number;
    speakers: number;
    environmentalSensors: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  currentTask: {
    id: string;
    type: string;
    description: string;
    startTime: Date;
    estimatedCompletion: Date;
    progress: number;
  };

  @Column({ type: 'var char', length: 255, nullable: true })
  @IsOptional()
  assignedResident: string;

  @Column({ type: 'var char', length: 255, nullable: true })
  @IsOptional()
  assignedStaff: string;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  schedule: {
    dailyTasks: Array<{
      time: string;
      task: string;
      location: string;
      resident?: string;
    }>;
    weeklyMaintenance: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  configuration: {
    speed: number;
    volume: number;
    interactionStyle: string;
    safetySettings: Record<string, any>;
    preferences: Record<string, any>;
  };

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  healthMetrics: {
    motorHealth: number;
    sensorHealth: number;
    batteryHealth: number;
    communicationHealth: number;
    overallHealth: number;
    lastDiagnostic: Date;
  };

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  lastMaintenanceDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  nextMaintenanceDate: Date;

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  totalTasks: number;

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  completedTasks: number;

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  failedTasks: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @IsNumber()
  totalDistance: number; // kilometers

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isOnline: boolean;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  lastSeen: Date;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  emergencyContacts: string[];

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  requiresAttention: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => RobotTaskEntity, task => task.robot)
  tasks: RobotTaskEntity[];

  // Helper methods
  isHealthy(): boolean {
    return this.status === RobotStatus.ACTIVE && 
           this.isOnline && 
           this.batteryLevel > 20 &&
           (this.healthMetrics?.overallHealth || 100) > 70;
  }

  needsCharging(): boolean {
    return this.batteryLevel < 25 && !this.isCharging;
  }

  needsMaintenance(): boolean {
    if (!this.nextMaintenanceDate) return false;
    return new Date() >= this.nextMaintenanceDate;
  }

  canPerformTask(taskType: string): boolean {
    switch (taskType) {
      case 'mobility_assistance':
        return this.robotType === RobotType.ASSISTIVE && this.capabilities.mobility;
      case 'companionship':
        return this.robotType === RobotType.COMPANION && this.capabilities.communication;
      case 'medication_delivery':
        return this.robotType === RobotType.MEDICAL && this.capabilities.medicalFunctions;
      case 'cleaning':
        return this.robotType === RobotType.MAINTENANCE && this.capabilities.cleaningFunctions;
      case 'delivery':
        return this.robotType === RobotType.DELIVERY && this.capabilities.mobility;
      default:
        return false;
    }
  }

  getTaskSuccessRate(): number {
    if (this.totalTasks === 0) return 100;
    return ((this.completedTasks / this.totalTasks) * 100);
  }

  updatePosition(x: number, y: number, z: number, orientation: number): void {
    this.position = { x, y, z, orientation };
    this.lastSeen = new Date();
    this.updatedAt = new Date();
  }

  startTask(task: any): void {
    this.currentTask = {
      id: task.id,
      type: task.type,
      description: task.description,
      startTime: new Date(),
      estimatedCompletion: task.estimatedCompletion,
      progress: 0,
    };
    this.status = RobotStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  completeTask(): void {
    if (this.currentTask) {
      this.completedTasks += 1;
      this.totalTasks += 1;
      this.currentTask = null;
      this.status = RobotStatus.IDLE;
      this.updatedAt = new Date();
    }
  }

  failTask(reason?: string): void {
    if (this.currentTask) {
      this.failedTasks += 1;
      this.totalTasks += 1;
      this.currentTask = null;
      this.status = RobotStatus.ERROR;
      if (reason) {
        this.notes = `Task failed: ${reason}`;
      }
      this.updatedAt = new Date();
    }
  }

  updateBatteryLevel(level: number): void {
    this.batteryLevel = Math.max(0, Math.min(100, level));
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

  performDiagnostic(): void {
    // Simulate diagnostic check
    const motorHealth = 80 + Math.random() * 20;
    const sensorHealth = 85 + Math.random() * 15;
    const batteryHealth = Math.max(50, 100 - (this.operatingHours / 100));
    const communicationHealth = this.isOnline ? 95 + Math.random() * 5 : 0;
    
    this.healthMetrics = {
      motorHealth,
      sensorHealth,
      batteryHealth,
      communicationHealth,
      overallHealth: (motorHealth + sensorHealth + batteryHealth + communicationHealth) / 4,
      lastDiagnostic: new Date(),
    };
    
    this.updatedAt = new Date();
  }

  emergencyStop(): void {
    this.status = RobotStatus.EMERGENCY_STOP;
    this.currentTask = null;
    this.requiresAttention = true;
    this.updatedAt = new Date();
  }

  resume(): void {
    if (this.status === RobotStatus.EMERGENCY_STOP) {
      this.status = RobotStatus.IDLE;
      this.requiresAttention = false;
      this.updatedAt = new Date();
    }
  }
}
