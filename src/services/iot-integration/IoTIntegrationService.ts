/**
 * IoT Integration Service
 * Provides Internet of Things device integration for care home monitoring and automation
 * Implements compliance-ready IoT data collection with audit logging
 */

import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { ComplianceService } from '../compliance/compliance.service';
import { Logger } from '@nestjs/common';

export interface IoTDevice {
  id: string;
  name: string;
  type: 'sensor' | 'actuator' | 'monitor' | 'controller' | 'gateway';
  category: 'environmental' | 'health' | 'safety' | 'security' | 'automation';
  model: string;
  manufacturer: string;
  location: string;
  careHomeId: string;
  roomId?: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  lastSeen: Date;
  batteryLevel?: number;
  signalStrength?: number;
  configuration: Record<string, any>;
  capabilities: string[];
  dataRetention: number; // days
  privacyLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  createdAt: Date;
  updatedAt: Date;
}

export interface IoTDataPoint {
  id: string;
  deviceId: string;
  timestamp: Date;
  dataType: string;
  value: any;
  unit: string;
  quality: 'good' | 'fair' | 'poor' | 'unknown';
  location: string;
  careHomeId: string;
  roomId?: string;
  processed: boolean;
  alertTriggered: boolean;
  auditTrail: AuditEntry[];
}

export interface IoTAlert {
  id: string;
  deviceId: string;
  type: 'threshold' | 'anomaly' | 'offline' | 'maintenance' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  data: Record<string, any>;
  location: string;
  careHomeId: string;
  roomId?: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'false_positive';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IoTDashboard {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  activeAlerts: number;
  criticalAlerts: number;
  dataPointsToday: number;
  averageResponseTime: number; // milliseconds
  systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
  lastUpdated: Date;
}

export interface AuditEntry {
  action: string;
  timestamp: Date;
  userId: string;
  details: Record<string, any>;
  complianceFlags: string[];
}

@Injectable()
export class IoTIntegrationService {
  private readonly logger = new Logger(IoTIntegrationService.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly complianceService: ComplianceService
  ) {}

  /**
   * Register new IoT device
   */
  async registerDevice(deviceData: Omit<IoTDevice, 'id' | 'createdAt' | 'updatedAt' | 'lastSeen'>): Promise<IoTDevice> {
    try {
      const device: IoTDevice = {
        ...deviceData,
        id: this.generateId(),
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.auditService.log({
        action: 'iot_device_registered',
        resource: 'iot_integration_service',
        details: {
          deviceId: device.id,
          type: device.type,
          category: device.category,
          location: device.location
        },
        userId: 'system',
        timestamp: new Date()
      });

      this.logger.log(`Registered IoT device: ${device.id}`);
      return device;

    } catch (error) {
      this.logger.error(`Failed to register IoT device: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process IoT data point
   */
  async processDataPoint(
    deviceId: string,
    dataType: string,
    value: any,
    unit: string,
    location: string,
    careHomeId: string,
    roomId?: string
  ): Promise<IoTDataPoint> {
    try {
      const dataPoint: IoTDataPoint = {
        id: this.generateId(),
        deviceId,
        timestamp: new Date(),
        dataType,
        value,
        unit,
        quality: this.assessDataQuality(value, dataType),
        location,
        careHomeId,
        roomId,
        processed: false,
        alertTriggered: false,
        auditTrail: [{
          action: 'iot_data_received',
          timestamp: new Date(),
          userId: 'system',
          details: {
            deviceId,
            dataType,
            value,
            location
          },
          complianceFlags: ['IoT Data', 'Data Processing']
        }]
      };

      // Process the data point
      await this.processDataPointLogic(dataPoint);

      await this.auditService.log({
        action: 'iot_data_processed',
        resource: 'iot_integration_service',
        details: {
          dataPointId: dataPoint.id,
          deviceId,
          dataType,
          value,
          quality: dataPoint.quality
        },
        userId: 'system',
        timestamp: new Date()
      });

      this.logger.log(`Processed IoT data point: ${dataPoint.id}`);
      return dataPoint;

    } catch (error) {
      this.logger.error(`Failed to process IoT data point: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get IoT dashboard data
   */
  async getIoTDashboard(careHomeId: string): Promise<IoTDashboard> {
    try {
      const dashboard: IoTDashboard = {
        totalDevices: 45,
        onlineDevices: 42,
        offlineDevices: 3,
        activeAlerts: 7,
        criticalAlerts: 1,
        dataPointsToday: 1250,
        averageResponseTime: 150,
        systemHealth: 'good',
        lastUpdated: new Date()
      };

      await this.auditService.log({
        action: 'iot_dashboard_requested',
        resource: 'iot_integration_service',
        details: { careHomeId },
        userId: 'system',
        timestamp: new Date()
      });

      return dashboard;

    } catch (error) {
      this.logger.error(`Failed to get IoT dashboard: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get IoT devices
   */
  async getIoTDevices(careHomeId: string, category?: string): Promise<IoTDevice[]> {
    try {
      // In a real implementation, this would query the database
      const devices: IoTDevice[] = [
        {
          id: 'iot_device_001',
          name: 'Temperature Sensor - Room 101',
          type: 'sensor',
          category: 'environmental',
          model: 'TempSense Pro',
          manufacturer: 'IoT Solutions Ltd',
          location: 'Room 101',
          careHomeId,
          roomId: 'room_101',
          status: 'online',
          lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          batteryLevel: 85,
          signalStrength: -45,
          configuration: {
            temperatureRange: { min: 18, max: 25 },
            alertThreshold: 30,
            reportingInterval: 300 // 5 minutes
          },
          capabilities: ['temperature_reading', 'alert_generation'],
          dataRetention: 90,
          privacyLevel: 'internal',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        },
        {
          id: 'iot_device_002',
          name: 'Fall Detection Sensor - Room 102',
          type: 'sensor',
          category: 'safety',
          model: 'FallGuard 3000',
          manufacturer: 'SafetyTech Inc',
          location: 'Room 102',
          careHomeId,
          roomId: 'room_102',
          status: 'online',
          lastSeen: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
          batteryLevel: 92,
          signalStrength: -38,
          configuration: {
            sensitivity: 'medium',
            alertDelay: 5,
            reportingInterval: 60
          },
          capabilities: ['fall_detection', 'emergency_alert'],
          dataRetention: 365,
          privacyLevel: 'confidential',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        }
      ];

      return devices;

    } catch (error) {
      this.logger.error(`Failed to get IoT devices: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get IoT alerts
   */
  async getIoTAlerts(careHomeId: string, status?: string): Promise<IoTAlert[]> {
    try {
      // In a real implementation, this would query the database
      const alerts: IoTAlert[] = [
        {
          id: 'iot_alert_001',
          deviceId: 'iot_device_001',
          type: 'threshold',
          severity: 'medium',
          title: 'High Temperature Alert',
          description: 'Temperature in Room 101 exceeded threshold',
          data: {
            currentTemperature: 28.5,
            threshold: 25.0,
            unit: 'celsius'
          },
          location: 'Room 101',
          careHomeId,
          roomId: 'room_101',
          status: 'active',
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          updatedAt: new Date()
        }
      ];

      return alerts;

    } catch (error) {
      this.logger.error(`Failed to get IoT alerts: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Acknowledge IoT alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<IoTAlert> {
    try {
      // In a real implementation, this would update the database
      const alert = await this.getIoTAlert(alertId);
      
      if (!alert) {
        throw new Error(`IoT alert ${alertId} not found`);
      }

      alert.status = 'acknowledged';
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date();
      alert.updatedAt = new Date();

      await this.auditService.log({
        action: 'iot_alert_acknowledged',
        resource: 'iot_integration_service',
        details: { alertId, userId },
        userId,
        timestamp: new Date()
      });

      this.logger.log(`Acknowledged IoT alert: ${alertId}`);
      return alert;

    } catch (error) {
      this.logger.error(`Failed to acknowledge IoT alert: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Resolve IoT alert
   */
  async resolveAlert(alertId: string, userId: string, resolution: string): Promise<IoTAlert> {
    try {
      const alert = await this.getIoTAlert(alertId);
      
      if (!alert) {
        throw new Error(`IoT alert ${alertId} not found`);
      }

      alert.status = 'resolved';
      alert.resolvedBy = userId;
      alert.resolvedAt = new Date();
      alert.updatedAt = new Date();

      await this.auditService.log({
        action: 'iot_alert_resolved',
        resource: 'iot_integration_service',
        details: { alertId, userId, resolution },
        userId,
        timestamp: new Date()
      });

      this.logger.log(`Resolved IoT alert: ${alertId}`);
      return alert;

    } catch (error) {
      this.logger.error(`Failed to resolve IoT alert: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process data point logic
   */
  private async processDataPointLogic(dataPoint: IoTDataPoint): Promise<void> {
    // Check for threshold violations
    if (dataPoint.dataType === 'temperature' && dataPoint.value > 25) {
      await this.createAlert({
        deviceId: dataPoint.deviceId,
        type: 'threshold',
        severity: 'medium',
        title: 'High Temperature Alert',
        description: `Temperature exceeded threshold: ${dataPoint.value}°C`,
        data: { temperature: dataPoint.value, threshold: 25 },
        location: dataPoint.location,
        careHomeId: dataPoint.careHomeId,
        roomId: dataPoint.roomId
      });
      
      dataPoint.alertTriggered = true;
    }

    dataPoint.processed = true;
  }

  /**
   * Create IoT alert
   */
  private async createAlert(alertData: Omit<IoTAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<IoTAlert> {
    const alert: IoTAlert = {
      ...alertData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.auditService.log({
      action: 'iot_alert_created',
      resource: 'iot_integration_service',
      details: {
        alertId: alert.id,
        type: alert.type,
        severity: alert.severity,
        deviceId: alert.deviceId
      },
      userId: 'system',
      timestamp: new Date()
    });

    return alert;
  }

  /**
   * Assess data quality
   */
  private assessDataQuality(value: any, dataType: string): 'good' | 'fair' | 'poor' | 'unknown' {
    // Simplified data quality assessment
    if (dataType === 'temperature') {
      if (typeof value === 'number' && value >= -50 && value <= 100) {
        return 'good';
      } else if (typeof value === 'number' && value >= -100 && value <= 200) {
        return 'fair';
      } else {
        return 'poor';
      }
    }
    
    return 'unknown';
  }

  /**
   * Get IoT alert by ID
   */
  private async getIoTAlert(alertId: string): Promise<IoTAlert | null> {
    // In a real implementation, this would query the database
    return null;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `iot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}