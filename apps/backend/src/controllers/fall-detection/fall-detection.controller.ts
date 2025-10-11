/**
 * @fileoverview fall-detection.controller
 * @module Fall-detection/Fall-detection.controller
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description fall-detection.controller
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../middleware/auth.guard';
import { RbacGuard } from '../../middleware/rbac.guard';
import { FallDetectionService, FallEvent, EmergencyAlert, MovementPattern } from '../../services/fall-detection.service';
import { AuditTrailService } from '../../services/audit/AuditTrailService';

@Controller('api/fall-detection')
@UseGuards(JwtAuthGuard)
export class FallDetectionController {
  constructor(
    private readonly fallDetectionService: FallDetectionService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Initialize fall detection device
   */
  @Post('devices/:deviceId/initialize')
  @UseGuards(RbacGuard)
  async initializeDevice(
    @Param('deviceId') deviceId: string,
    @Body() deviceData: any,
    @Request() req: any,
  ) {
    try {
      const success = await this.fallDetectionService.initializeDevice(deviceData);

      await this.auditService.logEvent({
        resource: 'FallDetection',
        entityType: 'Device',
        entityId: deviceId,
        action: 'CREATE',
        details: {
          deviceName: deviceData.deviceName,
          deviceType: deviceData.deviceType,
          roomId: deviceData.roomId,
          residentId: deviceData.residentId,
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Fall detection device initialized successfully' : 'Failed to initialize device',
      };
    } catch (error) {
      console.error('Error initializing fall detection device:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process fall detection data
   */
  @Post('devices/:deviceId/process-fall')
  @UseGuards(RbacGuard)
  async processFallDetection(
    @Param('deviceId') deviceId: string,
    @Body() sensorData: {
      acceleration?: {
        x: number;
        y: number;
        z: number;
        magnitude: number;
      };
      gyroscope?: any;
      orientation?: any;
      location?: {
        x: number;
        y: number;
        z: number;
      };
      preFallMagnitude?: number;
      postImpactMovement?: number;
    },
    @Request() req: any,
  ) {
    try {
      const fallEvent = await this.fallDetectionService.processFallDetection(deviceId, sensorData);

      if (fallEvent) {
        await this.auditService.logEvent({
          resource: 'FallDetection',
          entityType: 'FallEvent',
          entityId: fallEvent.id,
          action: 'CREATE',
          details: {
            deviceId,
            residentId: fallEvent.residentId,
            confidence: fallEvent.confidence,
            severity: fallEvent.severity,
            acceleration: fallEvent.accelerationData,
          },
          userId: req.user.id,
        });

        return {
          success: true,
          data: fallEvent,
          message: 'Fall detected and processed successfully',
        };
      } else {
        return {
          success: true,
          data: null,
          message: 'No fall detected in sensor data',
        };
      }
    } catch (error) {
      console.error('Error processing fall detection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle emergency button press
   */
  @Post('devices/:deviceId/emergency-button')
  @UseGuards(RbacGuard)
  async handleEmergencyButton(
    @Param('deviceId') deviceId: string,
    @Body() emergencyData: { residentId?: string },
    @Request() req: any,
  ) {
    try {
      const alert = await this.fallDetectionService.handleEmergencyButton(deviceId, emergencyData.residentId);

      await this.auditService.logEvent({
        resource: 'FallDetection',
        entityType: 'EmergencyAlert',
        entityId: alert.id,
        action: 'CREATE',
        details: {
          deviceId,
          residentId: emergencyData.residentId,
          alertType: alert.type,
          priority: alert.priority,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: alert,
        message: 'Emergency button alert processed successfully',
      };
    } catch (error) {
      console.error('Error handling emergency button:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Monitor movement patterns
   */
  @Post('devices/:deviceId/movement')
  @UseGuards(RbacGuard)
  async monitorMovementPatterns(
    @Param('deviceId') deviceId: string,
    @Body() movementData: {
      walking?: number;
      sitting?: number;
      lying?: number;
      standing?: number;
      unknown?: number;
    },
    @Request() req: any,
  ) {
    try {
      const pattern = await this.fallDetectionService.monitorMovementPatterns(deviceId, movementData);

      if (pattern) {
        await this.auditService.logEvent({
          resource: 'FallDetection',
          entityType: 'MovementPattern',
          entityId: `pattern_${Date.now()}`,
          action: 'CREATE',
          details: {
            deviceId,
            residentId: pattern.residentId,
            activityLevel: pattern.activityLevel,
            isAbnormal: pattern.isAbnormal,
            patterns: pattern.patterns,
          },
          userId: req.user.id,
        });

        return {
          success: true,
          data: pattern,
          message: 'Movement pattern processed successfully',
        };
      } else {
        return {
          success: true,
          data: null,
          message: 'No movement pattern data processed',
        };
      }
    } catch (error) {
      console.error('Error monitoring movement patterns:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check for no movement alerts
   */
  @Get('no-movement-alerts')
  @UseGuards(RbacGuard)
  async checkNoMovementAlerts(@Request() req: any) {
    try {
      const alerts = await this.fallDetectionService.checkNoMovementAlerts();

      await this.auditService.logEvent({
        resource: 'FallDetection',
        entityType: 'NoMovementAlert',
        entityId: 'no_movement_check',
        action: 'READ',
        details: {
          alertCount: alerts.length,
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: alerts,
        message: 'No movement alerts retrieved successfully',
      };
    } catch (error) {
      console.error('Error checking no movement alerts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update fall event status
   */
  @Put('fall-events/:eventId/status')
  @UseGuards(RbacGuard)
  async updateFallEventStatus(
    @Param('eventId') eventId: string,
    @Body() statusData: {
      status: 'detected' | 'confirmed' | 'false_positive' | 'resolved';
      staffId?: string;
    },
    @Request() req: any,
  ) {
    try {
      const success = await this.fallDetectionService.updateFallEventStatus(
        eventId,
        statusData.status,
        statusData.staffId,
      );

      await this.auditService.logEvent({
        resource: 'FallDetection',
        entityType: 'FallEvent',
        entityId: eventId,
        action: 'UPDATE',
        details: {
          status: statusData.status,
          staffId: statusData.staffId,
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Fall event status updated successfully' : 'Failed to update fall event status',
      };
    } catch (error) {
      console.error('Error updating fall event status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get fall detection statistics
   */
  @Get('statistics')
  @UseGuards(RbacGuard)
  async getFallDetectionStats(
    @Query('timeRange') timeRange: 'day' | 'week' | 'month' = 'week',
    @Request() req: any,
  ) {
    try {
      const stats = await this.fallDetectionService.getFallDetectionStats(timeRange);

      await this.auditService.logEvent({
        resource: 'FallDetection',
        entityType: 'Statistics',
        entityId: 'fall_detection_stats',
        action: 'READ',
        details: {
          timeRange,
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: stats,
        message: 'Fall detection statistics retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting fall detection statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get fall event by ID
   */
  @Get('fall-events/:eventId')
  @UseGuards(RbacGuard)
  async getFallEvent(
    @Param('eventId') eventId: string,
    @Request() req: any,
  ) {
    try {
      // This would typically fetch from a database
      const fallEvent = {
        id: eventId,
        deviceId: 'device_001',
        residentId: 'resident_001',
        roomId: 'room_001',
        timestamp: new Date(),
        confidence: 0.85,
        accelerationData: {
          x: 2.5,
          y: -1.8,
          z: 9.2,
          magnitude: 3.2,
        },
        location: {
          x: 1.5,
          y: 2.0,
          z: 0.8,
        },
        severity: 'high',
        status: 'detected',
        responseTime: null,
        staffResponded: [],
      };

      await this.auditService.logEvent({
        resource: 'FallDetection',
        entityType: 'FallEvent',
        entityId: eventId,
        action: 'READ',
        details: {
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: fallEvent,
        message: 'Fall event retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting fall event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get device status
   */
  @Get('devices/:deviceId/status')
  @UseGuards(RbacGuard)
  async getDeviceStatus(
    @Param('deviceId') deviceId: string,
    @Request() req: any,
  ) {
    try {
      // This would typically fetch from a database
      const deviceStatus = {
        deviceId,
        isOnline: true,
        batteryLevel: 78,
        lastSeen: new Date(),
        configuration: {
          sensitivity: 'medium',
          fallThreshold: 2.5,
          impactThreshold: 3.0,
          movementTimeout: 300,
          emergencyTimeout: 30,
          enablePreImpactDetection: true,
          enablePostFallMonitoring: true,
        },
        recentFalls: 2,
        lastFall: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        accuracy: 0.92,
      };

      await this.auditService.logEvent({
        resource: 'FallDetection',
        entityType: 'DeviceStatus',
        entityId: deviceId,
        action: 'READ',
        details: {
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: deviceStatus,
        message: 'Device status retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting device status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get recent fall events
   */
  @Get('fall-events')
  @UseGuards(RbacGuard)
  async getRecentFallEvents(
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Request() req: any,
  ) {
    try {
      // This would typically fetch from a database
      const fallEvents = [
        {
          id: 'fall_001',
          deviceId: 'device_001',
          residentId: 'resident_001',
          roomId: 'room_001',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          confidence: 0.85,
          severity: 'high',
          status: 'confirmed',
          responseTime: 120000, // 2 minutes
          staffResponded: ['staff_001'],
        },
        {
          id: 'fall_002',
          deviceId: 'device_002',
          residentId: 'resident_002',
          roomId: 'room_002',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          confidence: 0.72,
          severity: 'medium',
          status: 'false_positive',
          responseTime: 45000, // 45 seconds
          staffResponded: ['staff_002'],
        },
      ];

      const filteredEvents = status
        ? fallEvents.filter(event => event.status === status)
        : fallEvents;

      await this.auditService.logEvent({
        resource: 'FallDetection',
        entityType: 'FallEvents',
        entityId: 'fall_events_list',
        action: 'READ',
        details: {
          limit,
          status,
          count: filteredEvents.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: filteredEvents.slice(0, limit),
        message: 'Recent fall events retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting recent fall events:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get movement baseline for resident
   */
  @Get('residents/:residentId/movement-baseline')
  @UseGuards(RbacGuard)
  async getMovementBaseline(
    @Param('residentId') residentId: string,
    @Request() req: any,
  ) {
    try {
      // This would typically fetch from a database
      const baseline = {
        residentId,
        deviceId: 'device_001',
        timestamp: new Date(),
        activityLevel: 0.65,
        isAbnormal: false,
        patterns: {
          walking: 0.3,
          sitting: 0.4,
          lying: 0.2,
          standing: 0.1,
          unknown: 0.0,
        },
        dataPoints: 30, // Number of data points used for baseline
        lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      };

      await this.auditService.logEvent({
        resource: 'FallDetection',
        entityType: 'MovementBaseline',
        entityId: residentId,
        action: 'READ',
        details: {
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: baseline,
        message: 'Movement baseline retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting movement baseline:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}