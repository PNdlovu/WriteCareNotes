import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum DeviceType {
  SMARTPHONE = 'smartphone',
  TABLET = 'tablet',
  SMARTWATCH = 'smartwatch',
  DESKTOP_PWA = 'desktop_pwa',
  KIOSK = 'kiosk'
}

export enum SessionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  SUSPENDED = 'suspended'
}

export enum SyncStatus {
  SYNCHRONIZED = 'synchronized',
  PENDING_SYNC = 'pending_sync',
  SYNC_CONFLICT = 'sync_conflict',
  SYNC_ERROR = 'sync_error',
  OFFLINE_MODE = 'offline_mode'
}

export interface DeviceCapabilities {
  biometricAuth: {
    fingerprint: boolean;
    faceRecognition: boolean;
    voiceRecognition: boolean;
  };
  sensors: {
    gps: boolean;
    accelerometer: boolean;
    gyroscope: boolean;
    camera: boolean;
    microphone: boolean;
    nfc: boolean;
  };
  connectivity: {
    wifi: boolean;
    cellular: boolean;
    bluetooth: boolean;
    offlineStorage: number; // MB
  };
  performance: {
    cpuCores: number;
    ramGB: number;
    storageGB: number;
    batteryLevel?: number;
  };
}

export interface OfflineCapabilities {
  offlineTasksSupported: string[];
  maxOfflineDuration: number; // hours
  localStorageQuota: number; // MB
  criticalDataCached: boolean;
  offlineFormsAvailable: string[];
  emergencyFunctionsAvailable: boolean;
  syncQueueSize: number;
  lastSuccessfulSync: Date;
}

export interface SecurityContext {
  encryptionEnabled: boolean;
  biometricLockEnabled: boolean;
  autoLockTimeout: number; // minutes
  remoteWipeCapable: boolean;
  vpnRequired: boolean;
  certificatePinning: boolean;
  jailbreakDetection: boolean;
  appIntegrityVerification: boolean;
  secureStorageEnabled: boolean;
}

export interface UserExperience {
  theme: 'light' | 'dark' | 'high_contrast' | 'auto';
  fontSize: 'small' | 'medium' | 'large' | 'extra_large';
  language: string;
  accessibilityFeatures: {
    screenReader: boolean;
    voiceNavigation: boolean;
    gestureNavigation: boolean;
    simplifiedInterface: boolean;
    colorBlindSupport: boolean;
  };
  notificationPreferences: {
    pushEnabled: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    quietHours: { start: string; end: string };
  };
}

export interface PerformanceMetrics {
  averageResponseTime: number; // ms
  crashCount: number;
  errorRate: number; // percentage
  batteryUsage: number; // percentage per hour
  dataUsage: number; // MB
  featureUsageStats: { [feature: string]: number };
  userSatisfactionRating: number; // 1-5
  sessionDuration: number; // minutes
}

export interface LocationTracking {
  gpsEnabled: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };
  locationHistory: Array<{
    latitude: number;
    longitude: number;
    timestamp: Date;
    activity: string;
  }>;
  geofenceAlerts: Array<{
    geofenceId: string;
    alertType: 'enter' | 'exit';
    timestamp: Date;
    location: { latitude: number; longitude: number };
  }>;
  emergencyLocationSharing: boolean;
}

@Entity('mobile_sessions')
export class MobileSession extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sessionToken: string;

  @Column()
  userId: string;

  @Column()
  deviceId: string;

  @Column({
    type: 'enum',
    enum: DeviceType
  })
  deviceType: DeviceType;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.ACTIVE
  })
  status: SessionStatus;

  @Column({
    type: 'enum',
    enum: SyncStatus,
    default: SyncStatus.SYNCHRONIZED
  })
  syncStatus: SyncStatus;

  @Column('jsonb')
  deviceInfo: {
    manufacturer: string;
    model: string;
    operatingSystem: string;
    osVersion: string;
    appVersion: string;
    screenResolution: string;
    timezone: string;
  };

  @Column('jsonb')
  deviceCapabilities: DeviceCapabilities;

  @Column('jsonb')
  offlineCapabilities: OfflineCapabilities;

  @Column('jsonb')
  securityContext: SecurityContext;

  @Column('jsonb')
  userExperience: UserExperience;

  @Column('jsonb')
  performanceMetrics: PerformanceMetrics;

  @Column('jsonb')
  locationTracking: LocationTracking;

  @Column('timestamp')
  lastActivity: Date;

  @Column('timestamp')
  lastSync: Date;

  @Column('timestamp', { nullable: true })
  expiryTime?: Date;

  @Column('jsonb')
  pendingSyncData: Array<{
    entityType: string;
    entityId: string;
    operation: 'create' | 'update' | 'delete';
    data: any;
    timestamp: Date;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;

  @Column('jsonb')
  conflictResolution: Array<{
    conflictId: string;
    entityType: string;
    entityId: string;
    localVersion: any;
    serverVersion: any;
    resolutionStrategy: 'server_wins' | 'client_wins' | 'merge' | 'manual';
    resolvedAt?: Date;
    resolvedBy?: string;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isActive(): boolean {
    return this.status === SessionStatus.ACTIVE && !this.isExpired();
  }

  isExpired(): boolean {
    return this.expiryTime ? new Date() > this.expiryTime : false;
  }

  isOfflineCapable(): boolean {
    return this.offlineCapabilities.offlineTasksSupported.length > 0 &&
           this.offlineCapabilities.criticalDataCached;
  }

  canPerformOfflineTask(taskType: string): boolean {
    return this.offlineCapabilities.offlineTasksSupported.includes(taskType);
  }

  hasSecurityViolation(): boolean {
    return this.securityContext.jailbreakDetection || 
           !this.securityContext.appIntegrityVerification ||
           this.performanceMetrics.crashCount > 5;
  }

  needsSync(): boolean {
    return this.syncStatus === SyncStatus.PENDING_SYNC ||
           this.pendingSyncData.length > 0 ||
           (new Date().getTime() - this.lastSync.getTime()) > (60 * 60 * 1000); // 1 hour
  }

  hasSyncConflicts(): boolean {
    return this.syncStatus === SyncStatus.SYNC_CONFLICT ||
           this.conflictResolution.some(conflict => !conflict.resolvedAt);
  }

  updateActivity(): void {
    this.lastActivity = new Date();
    this.updatePerformanceMetrics();
  }

  addPendingSyncData(entityType: string, entityId: string, operation: string, data: any, priority: string = 'medium'): void {
    this.pendingSyncData.push({
      entityType,
      entityId,
      operation: operation as any,
      data,
      timestamp: new Date(),
      priority: priority as any
    });
    
    this.syncStatus = SyncStatus.PENDING_SYNC;
  }

  addSyncConflict(conflictData: any): void {
    const conflict = {
      conflictId: crypto.randomUUID(),
      entityType: conflictData.entityType,
      entityId: conflictData.entityId,
      localVersion: conflictData.localVersion,
      serverVersion: conflictData.serverVersion,
      resolutionStrategy: 'manual' as const
    };
    
    this.conflictResolution.push(conflict);
    this.syncStatus = SyncStatus.SYNC_CONFLICT;
  }

  resolveSyncConflict(conflictId: string, strategy: string, resolvedBy: string): void {
    const conflict = this.conflictResolution.find(c => c.conflictId === conflictId);
    if (conflict) {
      conflict.resolutionStrategy = strategy as any;
      conflict.resolvedAt = new Date();
      conflict.resolvedBy = resolvedBy;
    }
    
    // Check if all conflicts are resolved
    const unresolvedConflicts = this.conflictResolution.filter(c => !c.resolvedAt);
    if (unresolvedConflicts.length === 0) {
      this.syncStatus = SyncStatus.SYNCHRONIZED;
    }
  }

  clearSyncData(): void {
    this.pendingSyncData = [];
    this.syncStatus = SyncStatus.SYNCHRONIZED;
    this.lastSync = new Date();
  }

  extendSession(durationMinutes: number = 60): void {
    const newExpiry = new Date();
    newExpiry.setMinutes(newExpiry.getMinutes() + durationMinutes);
    this.expiryTime = newExpiry;
  }

  terminateSession(reason: string): void {
    this.status = SessionStatus.TERMINATED;
    this.expiryTime = new Date();
    
    // Clear sensitive data
    this.sessionToken = 'TERMINATED';
    this.pendingSyncData = [];
  }

  enableOfflineMode(): void {
    this.syncStatus = SyncStatus.OFFLINE_MODE;
    this.offlineCapabilities.criticalDataCached = true;
  }

  disableOfflineMode(): void {
    if (this.syncStatus === SyncStatus.OFFLINE_MODE) {
      this.syncStatus = SyncStatus.PENDING_SYNC;
    }
  }

  updateLocation(latitude: number, longitude: number, accuracy: number): void {
    if (this.locationTracking.gpsEnabled) {
      this.locationTracking.currentLocation = {
        latitude,
        longitude,
        accuracy,
        timestamp: new Date()
      };
      
      this.locationTracking.locationHistory.push({
        latitude,
        longitude,
        timestamp: new Date(),
        activity: 'location_update'
      });
      
      // Keep only last 100 location points
      if (this.locationTracking.locationHistory.length > 100) {
        this.locationTracking.locationHistory = this.locationTracking.locationHistory.slice(-100);
      }
    }
  }

  checkGeofences(geofences: Array<{ id: string; boundaries: any }>): void {
    if (!this.locationTracking.currentLocation) return;
    
    const currentLoc = this.locationTracking.currentLocation;
    
    for (const geofence of geofences) {
      const isInside = this.isLocationInsideGeofence(currentLoc, geofence.boundaries);
      const wasInside = this.wasInGeofence(geofence.id);
      
      if (isInside && !wasInside) {
        this.locationTracking.geofenceAlerts.push({
          geofenceId: geofence.id,
          alertType: 'enter',
          timestamp: new Date(),
          location: { latitude: currentLoc.latitude, longitude: currentLoc.longitude }
        });
      } else if (!isInside && wasInside) {
        this.locationTracking.geofenceAlerts.push({
          geofenceId: geofence.id,
          alertType: 'exit',
          timestamp: new Date(),
          location: { latitude: currentLoc.latitude, longitude: currentLoc.longitude }
        });
      }
    }
  }

  private updatePerformanceMetrics(): void {
    // Update session duration
    const sessionStart = new Date(this.createdAt);
    const now = new Date();
    this.performanceMetrics.sessionDuration = Math.floor((now.getTime() - sessionStart.getTime()) / (1000 * 60));
  }

  private isLocationInsideGeofence(location: any, boundaries: any): boolean {
    // Advanced geofence algorithm implementation
    const distance = this.calculateDistance(
      this.gpsLocation.latitude, 
      this.gpsLocation.longitude,
      boundaries.centerLat, 
      boundaries.centerLng
    );
    return distance <= boundaries.radius;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula for accurate distance calculation
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  private wasInGeofence(geofenceId: string): boolean {
    const recentAlerts = this.locationTracking.geofenceAlerts.filter(alert => 
      alert.geofenceId === geofenceId &&
      new Date().getTime() - new Date(alert.timestamp).getTime() < 5 * 60 * 1000 // 5 minutes
    );
    
    const lastAlert = recentAlerts[recentAlerts.length - 1];
    return lastAlert ? lastAlert.alertType === 'enter' : false;
  }

  getSessionSummary(): any {
    return {
      sessionId: this.id,
      userId: this.userId,
      deviceType: this.deviceType,
      status: this.status,
      syncStatus: this.syncStatus,
      duration: this.performanceMetrics.sessionDuration,
      offlineCapable: this.isOfflineCapable(),
      securityCompliant: !this.hasSecurityViolation(),
      pendingSyncItems: this.pendingSyncData.length,
      unresolvedConflicts: this.conflictResolution.filter(c => !c.resolvedAt).length,
      lastActivity: this.lastActivity,
      performanceScore: this.calculatePerformanceScore()
    };
  }

  private calculatePerformanceScore(): number {
    let score = 100;
    
    // Deduct for performance issues
    if (this.performanceMetrics.averageResponseTime > 2000) score -= 20; // Slow response
    if (this.performanceMetrics.crashCount > 0) score -= this.performanceMetrics.crashCount * 10;
    if (this.performanceMetrics.errorRate > 5) score -= 15; // High error rate
    if (this.hasSecurityViolation()) score -= 30;
    
    // Add for good performance
    if (this.performanceMetrics.averageResponseTime < 500) score += 10; // Fast response
    if (this.performanceMetrics.userSatisfactionRating >= 4.5) score += 10;
    if (this.isOfflineCapable()) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }
}