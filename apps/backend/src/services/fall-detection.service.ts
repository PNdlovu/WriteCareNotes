/**
 * @fileoverview fall-detection.service
 * @module Fall-detection.service
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description fall-detection.service
 */

import { EventEmitter2 } from "eventemitter2";

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SmartDeviceEntity, DeviceType } from '../entities/smart-device.entity';
import { IoTIntegrationService } from './iot-integration.service';

export interface FallEvent {
  id: string;
  deviceId: string;
  residentId?: string;
  roomId?: string;
  timestamp: Date;
  confidence: number;
  accelerationData?: {
    x: number;
    y: number;
    z: number;
    magnitude: number;
  };
  location?: {
    x: number;
    y: number;
    z: number;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'confirmed' | 'false_positive' | 'resolved';
  responseTime?: number;
  staffResponded?: string[];
}

export interface EmergencyAlert {
  id: string;
  type: 'fall' | 'emergency_button' | 'no_movement' | 'medical_emergency';
  deviceId: string;
  residentId?: string;
  roomId?: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  autoResolved: boolean;
  responseRequired: boolean;
}

export interface MovementPattern {
  residentId: string;
  deviceId: string;
  timestamp: Date;
  activityLevel: number;
  isAbnormal: boolean;
  patterns: {
    walking: number;
    sitting: number;
    lying: number;
    standing: number;
    unknown: number;
  };
}


export class FallDetectionService {
  // Logger removed
  private fallDetectors: Map<string, SmartDeviceEntity> = new Map();
  private recentFallEvents: Map<string, FallEvent> = new Map();
  private movementBaselines: Map<string, MovementPattern[]> = new Map();
  private alertThresholds = {
    fallConfidence: 0.75,
    noMovementMinutes: 120,
    abnormalPatternThreshold: 0.8,
  };

  constructor(
    private readonly iotService: IoTIntegrationService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.setupEventListeners();
  }

  /**
   * Initialize fall detection device
   */
  async initializeDevice(device: SmartDeviceEntity): Promise<boolean> {
    try {
      if (device.deviceType !== DeviceType.FALL_DETECTOR && device.deviceType !== DeviceType.EMERGENCY_BUTTON) {
        console.error(`Device ${device.id} is not a fall detection device`);
        return false;
      }

      this.fallDetectors.set(device.id, device);

      // Configure device settings
      const config = {
        sensitivity: device.configuration?.sensitivity || 'medium',
        fallThreshold: device.configuration?.fallThreshold || 2.5, // G-force threshold
        impactThreshold: device.configuration?.impactThreshold || 3.0,
        movementTimeout: device.configuration?.movementTimeout || 300, // seconds
        emergencyTimeout: device.configuration?.emergencyTimeout || 30, // seconds for auto-alert
        enablePreImpactDetection: device.configuration?.enablePreImpactDetection !== false,
        enablePostFallMonitoring: device.configuration?.enablePostFallMonitoring !== false,
      };

      await this.iotService.sendDeviceCommand(device, 'configure_fall_detection', config);

      // Start monitoring
      await this.startFallMonitoring(device.id);

      console.log(`Fall detection device ${device.deviceName} initialized successfully`);
      return true;
    } catch (error: unknown) {
      console.error(`Failed to initialize fall detection device ${device.id}: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`, error instanceof Error ? error instanceof Error ? error.stack : undefined : undefined);
      return false;
    }
  }

  /**
   * Process fall detection data from device
   */
  async processFallDetection(deviceId: string, sensorData: any): Promise<FallEvent | null> {
    try {
      const device = this.fallDetectors.get(deviceId);
      if (!device) {
        console.error(`Fall detection device ${deviceId} not found`);
        return null;
      }

      // Analyze sensor data for fall patterns
      const fallAnalysis = await this.analyzeFallPattern(sensorData);
      
      if (fallAnalysis.confidence < this.alertThresholds.fallConfidence) {
        // Not confident enough to trigger fall alert
        return null;
      }

      // Create fall event
      const fallEvent: FallEvent = {
        id: `fall_${Date.now()}_${deviceId}`,
        deviceId,
        residentId: device.residentId,
        roomId: device.roomId,
        timestamp: new Date(),
        confidence: fallAnalysis.confidence,
        accelerationData: sensorData.acceleration,
        location: sensorData.location,
        severity: this.calculateFallSeverity(fallAnalysis),
        status: 'detected',
      };

      // Store recent fall event
      this.recentFallEvents.set(fallEvent.id, fallEvent);

      // Trigger immediate response
      await this.triggerFallResponse(fallEvent);

      console.log(`Fall detected: ${fallEvent.id} with confidence ${fallEvent.confidence}`);
      return fallEvent;
    } catch (error: unknown) {
      console.error(`Failed to process fall detection: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`, error instanceof Error ? error instanceof Error ? error.stack : undefined : undefined);
      return null;
    }
  }

  /**
   * Handle emergency button press
   */
  async handleEmergencyButton(deviceId: string, residentId?: string): Promise<EmergencyAlert> {
    try {
      const device = this.fallDetectors.get(deviceId);
      if (!device) {
        throw new Error(`Emergency button device ${deviceId} not found`);
      }

      const alert: EmergencyAlert = {
        id: `emergency_${Date.now()}_${deviceId}`,
        type: 'emergency_button',
        deviceId,
        residentId: residentId || device.residentId,
        roomId: device.roomId,
        timestamp: new Date(),
        priority: 'high',
        message: 'Emergency button pressed - immediate assistance required',
        autoResolved: false,
        responseRequired: true,
      };

      // Trigger immediate emergency response
      await this.triggerEmergencyResponse(alert);

      console.log(`Emergency button pressed: ${alert.id}`);
      return alert;
    } catch (error: unknown) {
      console.error(`Failed to handle emergency button: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`, error instanceof Error ? error instanceof Error ? error.stack : undefined : undefined);
      throw error;
    }
  }

  /**
   * Monitor resident movement patterns
   */
  async monitorMovementPatterns(deviceId: string, movementData: any): Promise<MovementPattern> {
    try {
      const device = this.fallDetectors.get(deviceId);
      if (!device || !device.residentId) {
        return null;
      }

      const pattern: MovementPattern = {
        residentId: device.residentId,
        deviceId,
        timestamp: new Date(),
        activityLevel: this.calculateActivityLevel(movementData),
        isAbnormal: false,
        patterns: {
          walking: movementData.walking || 0,
          sitting: movementData.sitting || 0,
          lying: movementData.lying || 0,
          standing: movementData.standing || 0,
          unknown: movementData.unknown || 0,
        },
      };

      // Compare with baseline patterns
      const baseline = await this.getMovementBaseline(device.residentId);
      if (baseline) {
        pattern.isAbnormal = this.isAbnormalPattern(pattern, baseline);
        
        if (pattern.isAbnormal) {
          await this.handleAbnormalMovement(pattern);
        }
      }

      // Store pattern for future analysis
      await this.storeMovementPattern(pattern);

      return pattern;
    } catch (error: unknown) {
      console.error(`Failed to monitor movement patterns: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`, error instanceof Error ? error instanceof Error ? error.stack : undefined : undefined);
      return null;
    }
  }

  /**
   * Check for no movement alerts
   */
  async checkNoMovementAlerts(): Promise<EmergencyAlert[]> {
    try {
      const alerts: EmergencyAlert[] = [];
      const now = new Date();
      const timeoutMs = this.alertThresholds.noMovementMinutes * 60 * 1000;

      for (const [deviceId, device] of this.fallDetectors) {
        if (!device.residentId || !device.lastSeen) {
          continue;
        }

        const timeSinceLastMovement = now.getTime() - device.lastSeen.getTime();
        
        if (timeSinceLastMovement > timeoutMs) {
          const alert: EmergencyAlert = {
            id: `no_movement_${Date.now()}_${deviceId}`,
            type: 'no_movement',
            deviceId,
            residentId: device.residentId,
            roomId: device.roomId,
            timestamp: now,
            priority: 'medium',
            message: `No movement detected for ${Math.round(timeSinceLastMovement / (60 * 1000))} minutes`,
            autoResolved: false,
            responseRequired: true,
          };

          alerts.push(alert);
          await this.triggerEmergencyResponse(alert);
        }
      }

      return alerts;
    } catch (error: unknown) {
      console.error(`Failed to check no movement alerts: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`, error instanceof Error ? error instanceof Error ? error.stack : undefined : undefined);
      return [];
    }
  }

  /**
   * Update fall event status
   */
  async updateFallEventStatus(eventId: string, status: FallEvent['status'], staffId?: string): Promise<boolean> {
    try {
      const fallEvent = this.recentFallEvents.get(eventId);
      if (!fallEvent) {
        console.error(`Fall event ${eventId} not found`);
        return false;
      }

      fallEvent.status = status;
      
      if (staffId && !fallEvent.staffResponded) {
        fallEvent.staffResponded = [];
      }
      
      if (staffId && !fallEvent.staffResponded.includes(staffId)) {
        fallEvent.staffResponded.push(staffId);
      }

      if (status === 'confirmed' || status === 'resolved') {
        fallEvent.responseTime = new Date().getTime() - fallEvent.timestamp.getTime();
      }

      // Update stored event
      this.recentFallEvents.set(eventId, fallEvent);

      // Emit status update event
      this.eventEmitter.emit('fall.status.updated', fallEvent);

      console.log(`Fall event ${eventId} status updated to ${status}`);
      return true;
    } catch (error: unknown) {
      console.error(`Failed to update fall event status: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`, error instanceof Error ? error instanceof Error ? error.stack : undefined : undefined);
      return false;
    }
  }

  /**
   * Get fall detection statistics
   */
  async getFallDetectionStats(timeRange: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const recentEvents = Array.from(this.recentFallEvents.values())
        .filter(event => event.timestamp >= startDate);

      const stats = {
        totalFalls: recentEvents.length,
        confirmedFalls: recentEvents.filter(e => e.status === 'confirmed').length,
        falsePositives: recentEvents.filter(e => e.status === 'false_positive').length,
        unresolvedFalls: recentEvents.filter(e => e.status === 'detected').length,
        averageResponseTime: this.calculateAverageResponseTime(recentEvents),
        severityDistribution: {
          low: recentEvents.filter(e => e.severity === 'low').length,
          medium: recentEvents.filter(e => e.severity === 'medium').length,
          high: recentEvents.filter(e => e.severity === 'high').length,
          critical: recentEvents.filter(e => e.severity === 'critical').length,
        },
        devicePerformance: this.calculateDevicePerformance(),
        timeRange,
      };

      return stats;
    } catch (error: unknown) {
      console.error(`Failed to get fall detection stats: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`, error instanceof Error ? error instanceof Error ? error.stack : undefined : undefined);
      throw error;
    }
  }

  /**
   * Start fall monitoring for a device
   */
  private async startFallMonitoring(deviceId: string): Promise<boolean> {
    try {
      const device = this.fallDetectors.get(deviceId);
      if (!device) {
        return false;
      }

      await this.iotService.sendDeviceCommand(device, 'start_monitoring', {
        interval: 100, // milliseconds
        reportingInterval: 5000, // milliseconds
        enableRealTimeAlerts: true,
      });

      return true;
    } catch (error: unknown) {
      console.error(`Failed to start fall monitoring for device ${deviceId}: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`, error instanceof Error ? error instanceof Error ? error.stack : undefined : undefined);
      return false;
    }
  }

  /**
   * Analyze sensor data for fall patterns
   */
  private async analyzeFallPattern(sensorData: any): Promise<{ confidence: number; type: string }> {
    try {
      // Simplified fall detection algorithm
      // In a real implementation, this would use machine learning models
      
      const { acceleration, gyroscope, orientation } = sensorData;
      let confidence = 0;
      let fallType = 'unknown';

      // Check for sudden acceleration change (impact)
      if (acceleration && acceleration.magnitude > 3.0) {
        confidence += 0.4;
        fallType = 'impact';
      }

      // Check for orientation change
      if (orientation && Math.abs(orientation.pitch) > 45) {
        confidence += 0.3;
      }

      // Check for free fall detection (low acceleration before impact)
      if (acceleration && acceleration.preFallMagnitude < 0.5) {
        confidence += 0.2;
        fallType = 'free_fall';
      }

      // Check for post-fall stillness
      if (sensorData.postImpactMovement < 0.1) {
        confidence += 0.1;
      }

      return { confidence: Math.min(confidence, 1.0), type: fallType };
    } catch (error: unknown) {
      console.error(`Failed to analyze fall pattern: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`, error instanceof Error ? error instanceof Error ? error.stack : undefined : undefined);
      return { confidence: 0, type: 'unknown' };
    }
  }

  /**
   * Calculate fall severity
   */
  private calculateFallSeverity(analysis: { confidence: number; type: string }): FallEvent['severity'] {
    if (analysis.confidence >= 0.95) return 'critical';
    if (analysis.confidence >= 0.85) return 'high';
    if (analysis.confidence >= 0.75) return 'medium';
    return 'low';
  }

  /**
   * Trigger fall response
   */
  private async triggerFallResponse(fallEvent: FallEvent): Promise<void> {
    try {
      // Emit fall detection event
      this.eventEmitter.emit('fall.detected', fallEvent);

      // Send immediate alerts based on severity
      const alertPriority = fallEvent.severity === 'critical' ? 'emergency' : 
                           fallEvent.severity === 'high' ? 'high' : 'medium';

      this.eventEmitter.emit('emergency.alert', {
        type: 'fall_detected',
        priority: alertPriority,
        deviceId: fallEvent.deviceId,
        residentId: fallEvent.residentId,
        roomId: fallEvent.roomId,
        message: `Fall detected with ${Math.round(fallEvent.confidence * 100)}% confidence`,
        timestamp: fallEvent.timestamp,
      });

      // Auto-escalate critical falls
      if (fallEvent.severity === 'critical') {
        setTimeout(() => {
          if (fallEvent.status === 'detected') {
            this.eventEmitter.emit('emergency.escalate', fallEvent);
          }
        }, 60000); // Escalate after 1 minute if not responded
      }

    } catch (error: unknown) {
      console.error(`Failed to trigger fall response: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`, error instanceof Error ? error instanceof Error ? error.stack : undefined : undefined);
    }
  }

  /**
   * Trigger emergency response
   */
  private async triggerEmergencyResponse(alert: EmergencyAlert): Promise<void> {
    try {
      this.eventEmitter.emit('emergency.alert', alert);

      // Auto-escalate if no response within timeout
      if (alert.responseRequired) {
        setTimeout(() => {
          this.eventEmitter.emit('emergency.escalate', alert);
        }, 120000); // Escalate after 2 minutes
      }

    } catch (error: unknown) {
      console.error(`Failed to trigger emergency response: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`, error instanceof Error ? error instanceof Error ? error.stack : undefined : undefined);
    }
  }

  /**
   * Calculate activity level from movement data
   */
  private calculateActivityLevel(movementData: any): number {
    // Simplified activity calculation
    const total = Object.values(movementData.patterns || {}).reduce((sum: number, val: number) => sum + val, 0);
    return Math.min(total / 100, 1.0); // Normalize to 0-1
  }

  /**
   * Get movement baseline for a resident
   */
  private async getMovementBaseline(residentId: string): Promise<MovementPattern | null> {
    const patterns = this.movementBaselines.get(residentId) || [];
    if (patterns.length < 7) { // Need at least a week of data
      return null;
    }

    // Calculate average pattern
    const avgPattern = patterns.reduce((acc, pattern) => {
      acc.activityLevel += pattern.activityLevel;
      acc.patterns.walking += pattern.patterns.walking;
      acc.patterns.sitting += pattern.patterns.sitting;
      acc.patterns.lying += pattern.patterns.lying;
      acc.patterns.standing += pattern.patterns.standing;
      return acc;
    }, {
      activityLevel: 0,
      patterns: { walking: 0, sitting: 0, lying: 0, standing: 0, unknown: 0 }
    });

    const count = patterns.length;
    return {
      residentId,
      deviceId: '',
      timestamp: new Date(),
      activityLevel: avgPattern.activityLevel / count,
      isAbnormal: false,
      patterns: {
        walking: avgPattern.patterns.walking / count,
        sitting: avgPattern.patterns.sitting / count,
        lying: avgPattern.patterns.lying / count,
        standing: avgPattern.patterns.standing / count,
        unknown: 0,
      },
    };
  }

  /**
   * Check if movement pattern is abnormal
   */
  private isAbnormalPattern(current: MovementPattern, baseline: MovementPattern): boolean {
    const activityDiff = Math.abs(current.activityLevel - baseline.activityLevel);
    return activityDiff > this.alertThresholds.abnormalPatternThreshold;
  }

  /**
   * Handle abnormal movement patterns
   */
  private async handleAbnormalMovement(pattern: MovementPattern): Promise<void> {
    const alert: EmergencyAlert = {
      id: `abnormal_movement_${Date.now()}_${pattern.deviceId}`,
      type: 'no_movement',
      deviceId: pattern.deviceId,
      residentId: pattern.residentId,
      roomId: undefined,
      timestamp: pattern.timestamp,
      priority: 'low',
      message: 'Abnormal movement pattern detected - wellness check recommended',
      autoResolved: false,
      responseRequired: false,
    };

    this.eventEmitter.emit('movement.abnormal', alert);
  }

  /**
   * Store movement pattern for analysis
   */
  private async storeMovementPattern(pattern: MovementPattern): Promise<void> {
    const patterns = this.movementBaselines.get(pattern.residentId) || [];
    patterns.push(pattern);
    
    // Keep only last 30 days of patterns
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const filteredPatterns = patterns.filter(p => p.timestamp >= thirtyDaysAgo);
    
    this.movementBaselines.set(pattern.residentId, filteredPatterns);
  }

  /**
   * Calculate average response time
   */
  private calculateAverageResponseTime(events: FallEvent[]): number {
    const respondedEvents = events.filter(e => e.responseTime);
    if (respondedEvents.length === 0) return 0;
    
    const totalTime = respondedEvents.reduce((sum, e) => sum + e.responseTime, 0);
    return Math.round(totalTime / respondedEvents.length / 1000); // Convert to seconds
  }

  /**
   * Calculate device performance metrics
   */
  private calculateDevicePerformance(): Record<string, any> {
    const performance: Record<string, any> = {};
    
    for (const [deviceId, device] of this.fallDetectors) {
      const deviceEvents = Array.from(this.recentFallEvents.values())
        .filter(e => e.deviceId === deviceId);
      
      performance[deviceId] = {
        totalDetections: deviceEvents.length,
        accuracy: deviceEvents.length > 0 ? 
          deviceEvents.filter(e => e.status !== 'false_positive').length / deviceEvents.length : 1,
        avgConfidence: deviceEvents.length > 0 ?
          deviceEvents.reduce((sum, e) => sum + e.confidence, 0) / deviceEvents.length : 0,
        isOnline: device.isOnline,
        batteryLevel: device.batteryLevel,
      };
    }
    
    return performance;
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Listen for IoT telemetry data
    this.eventEmitter.on('iot.telemetry.received', async (message) => {
      if (this.fallDetectors.has(message.deviceId)) {
        if (message.payload.fall_detected) {
          await this.processFallDetection(message.deviceId, message.payload);
        }
        if (message.payload.movement_data) {
          await this.monitorMovementPatterns(message.deviceId, message.payload.movement_data);
        }
        if (message.payload.emergency_button) {
          await this.handleEmergencyButton(message.deviceId);
        }
      }
    });

    // Periodic check for no movement alerts
    setInterval(() => {
      this.checkNoMovementAlerts();
    }, 60000); // Check every minute
  }
}