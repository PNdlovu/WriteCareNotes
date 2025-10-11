/**
 * @fileoverview iot-integration.controller
 * @module Iot-integration/Iot-integration.controller
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description iot-integration.controller
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../middleware/auth.guard';
import { RbacGuard } from '../../middleware/rbac.guard';
import { IoTIntegrationService, IoTMessage } from '../../services/iot-integration.service';
import { AuditTrailService } from '../../services/audit/AuditTrailService';

@Controller('api/iot-integration')
@UseGuards(JwtAuthGuard)
export class IoTIntegrationController {
  const ructor(
    private readonlyiotIntegrationService: IoTIntegrationService,
    private readonlyauditService: AuditService,
  ) {}

  /**
   * Connect to a smart device
   */
  @Post('devices/:deviceId/connect')
  @UseGuards(RbacGuard)
  async connectDevice(
    @Param('deviceId') deviceId: string,
    @Body() deviceData: any,
    @Request() req: any,
  ) {
    try {
      const success = await this.iotIntegrationService.connectDevice(deviceData);

      await this.auditService.logEvent({
        resource: 'IoTIntegration',
        entityType: 'Device',
        entityId: deviceId,
        action: 'CREATE',
        details: {
          deviceName: deviceData.deviceName,
          deviceType: deviceData.deviceType,
          connectivityType: deviceData.connectivityType,
          roomId: deviceData.roomId,
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Device connected successfully' : 'Failed to connect device',
      };
    } catch (error) {
      console.error('Error connectingdevice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Disconnect from a smart device
   */
  @Post('devices/:deviceId/disconnect')
  @UseGuards(RbacGuard)
  async disconnectDevice(
    @Param('deviceId') deviceId: string,
    @Body() deviceData: any,
    @Request() req: any,
  ) {
    try {
      const success = await this.iotIntegrationService.disconnectDevice(deviceData);

      await this.auditService.logEvent({
        resource: 'IoTIntegration',
        entityType: 'Device',
        entityId: deviceId,
        action: 'DELETE',
        details: {
          deviceName: deviceData.deviceName,
          reason: 'manual_disconnect',
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Device disconnected successfully' : 'Failed to disconnect device',
      };
    } catch (error) {
      console.error('Error disconnectingdevice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send command to a connected device
   */
  @Post('devices/:deviceId/command')
  @UseGuards(RbacGuard)
  async sendDeviceCommand(
    @Param('deviceId') deviceId: string,
    @Body() commandData: {
      command: string;
      parameters?: Record<string, any>;
      device: any;
    },
    @Request() req: any,
  ) {
    try {
      const success = await this.iotIntegrationService.sendDeviceCommand(
        commandData.device,
        commandData.command,
        commandData.parameters || {},
      );

      await this.auditService.logEvent({
        resource: 'IoTIntegration',
        entityType: 'DeviceCommand',
        entityId: `cmd_${Date.now()}`,
        action: 'CREATE',
        details: {
          deviceId,
          command: commandData.command,
          parameters: commandData.parameters,
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Command sent successfully' : 'Failed to send command',
      };
    } catch (error) {
      console.error('Error sending devicecommand:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync device state with physical device
   */
  @Post('devices/:deviceId/sync')
  @UseGuards(RbacGuard)
  async syncDeviceState(
    @Param('deviceId') deviceId: string,
    @Body() deviceData: any,
    @Request() req: any,
  ) {
    try {
      const success = await this.iotIntegrationService.syncDeviceState(deviceData);

      await this.auditService.logEvent({
        resource: 'IoTIntegration',
        entityType: 'DeviceSync',
        entityId: deviceId,
        action: 'UPDATE',
        details: {
          deviceId,
          currentState: deviceData.currentState,
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Device state synced successfully' : 'Failed to sync device state',
      };
    } catch (error) {
      console.error('Error syncing devicestate:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get connection status for all devices
   */
  @Get('devices/connection-status')
  @UseGuards(RbacGuard)
  async getConnectionStatus(@Request() req: any) {
    try {
      const status = this.iotIntegrationService.getConnectionStatus();

      await this.auditService.logEvent({
        resource: 'IoTIntegration',
        entityType: 'ConnectionStatus',
        entityId: 'all_devices',
        action: 'READ',
        details: {
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: status,
        message: 'Connection status retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting connectionstatus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get device telemetry data
   */
  @Get('devices/:deviceId/telemetry')
  @UseGuards(RbacGuard)
  async getDeviceTelemetry(
    @Param('deviceId') deviceId: string,
    @Query('limit') limit: number = 50,
    @Request() req: any,
  ) {
    try {
      // This would typically fetch from a database
      const telemetryData = [
        {
          id: 'telemetry_001',
          deviceId,
          messageType: 'telemetry',
          payload: {
            temperature: 22.5,
            humidity: 65,
            battery_level: 78,
            motion_detected: false,
            timestamp: new Date(),
          },
          timestamp: new Date(),
        },
        {
          id: 'telemetry_002',
          deviceId,
          messageType: 'telemetry',
          payload: {
            temperature: 22.3,
            humidity: 66,
            battery_level: 77,
            motion_detected: true,
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
          },
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
        },
      ];

      await this.auditService.logEvent({
        resource: 'IoTIntegration',
        entityType: 'DeviceTelemetry',
        entityId: deviceId,
        action: 'READ',
        details: {
          limit,
          count: telemetryData.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: telemetryData.slice(0, limit),
        message: 'Device telemetry retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting devicetelemetry:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get device by ID
   */
  @Get('devices/:deviceId')
  @UseGuards(RbacGuard)
  async getDevice(
    @Param('deviceId') deviceId: string,
    @Request() req: any,
  ) {
    try {
      // This would typically fetch from a database
      const device = {
        id: deviceId,
        deviceName: 'Smart Light - Room 101',
        deviceType: 'SMART_LIGHT',
        connectivityType: 'WIFI',
        roomId: 'room_101',
        residentId: 'resident_001',
        isOnline: true,
        batteryLevel: 100,
        ipAddress: '192.168.1.100',
        configuration: {
          brightness: 80,
          color: '#FFFFFF',
          schedule: 'auto',
        },
        currentState: {
          isOn: true,
          brightness: 80,
          color: '#FFFFFF',
        },
        capabilities: {
          hasDisplay: false,
          hasCamera: false,
          hasMicrophone: false,
          hasSpeaker: false,
          hasMotionSensor: true,
          hasLightSensor: true,
        },
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.auditService.logEvent({
        resource: 'IoTIntegration',
        entityType: 'Device',
        entityId: deviceId,
        action: 'READ',
        details: {
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: device,
        message: 'Device retrieved successfully',
      };
    } catch (error) {
      console.error('Error gettingdevice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all devices
   */
  @Get('devices')
  @UseGuards(RbacGuard)
  async getAllDevices(
    @Query('deviceType') deviceType?: string,
    @Query('roomId') roomId?: string,
    @Query('isOnline') isOnline?: boolean,
    @Request() req: any,
  ) {
    try {
      // This would typically fetch from a database
      const devices = [
        {
          id: 'device_001',
          deviceName: 'Smart Light - Room 101',
          deviceType: 'SMART_LIGHT',
          connectivityType: 'WIFI',
          roomId: 'room_101',
          residentId: 'resident_001',
          isOnline: true,
          batteryLevel: 100,
        },
        {
          id: 'device_002',
          deviceName: 'Voice Assistant - Room 102',
          deviceType: 'VOICE_ASSISTANT',
          connectivityType: 'WIFI',
          roomId: 'room_102',
          residentId: 'resident_002',
          isOnline: true,
          batteryLevel: 85,
        },
        {
          id: 'device_003',
          deviceName: 'Fall Detector - Room 103',
          deviceType: 'FALL_DETECTOR',
          connectivityType: 'BLUETOOTH',
          roomId: 'room_103',
          residentId: 'resident_003',
          isOnline: false,
          batteryLevel: 45,
        },
      ];

      let filteredDevices = devices;

      if (deviceType) {
        filteredDevices = filteredDevices.filter(device => device.deviceType === deviceType);
      }

      if (roomId) {
        filteredDevices = filteredDevices.filter(device => device.roomId === roomId);
      }

      if (isOnline !== undefined) {
        filteredDevices = filteredDevices.filter(device => device.isOnline === isOnline);
      }

      await this.auditService.logEvent({
        resource: 'IoTIntegration',
        entityType: 'Devices',
        entityId: 'devices_list',
        action: 'READ',
        details: {
          deviceType,
          roomId,
          isOnline,
          count: filteredDevices.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: filteredDevices,
        message: 'Devices retrieved successfully',
      };
    } catch (error) {
      console.error('Error gettingdevices:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get device types and capabilities
   */
  @Get('device-types')
  @UseGuards(RbacGuard)
  async getDeviceTypes(@Request() req: any) {
    try {
      const deviceTypes = [
        {
          type: 'SMART_LIGHT',
          name: 'Smart Light',
          description: 'Intelligent lighting control with dimming and color options',
          capabilities: ['brightness_control', 'color_control', 'scheduling', 'motion_detection'],
          connectivityTypes: ['WIFI', 'ZIGBEE', 'ZWAVE'],
          commands: ['turn_on', 'turn_off', 'set_brightness', 'set_color', 'set_schedule'],
        },
        {
          type: 'VOICE_ASSISTANT',
          name: 'Voice Assistant',
          description: 'Voice-controlled smart speaker with AI capabilities',
          capabilities: ['voice_control', 'music_playback', 'intercom', 'reminders'],
          connectivityTypes: ['WIFI', 'BLUETOOTH'],
          commands: ['speak', 'play_music', 'setup_intercom', 'send_reminder'],
        },
        {
          type: 'FALL_DETECTOR',
          name: 'Fall Detection Device',
          description: 'Wearable device for fall detection and emergency alerts',
          capabilities: ['fall_detection', 'emergency_button', 'motion_tracking', 'location_tracking'],
          connectivityTypes: ['BLUETOOTH', 'CELLULAR'],
          commands: ['start_monitoring', 'stop_monitoring', 'configure_sensitivity'],
        },
        {
          type: 'SMART_THERMOSTAT',
          name: 'Smart Thermostat',
          description: 'Intelligent temperature control and climate management',
          capabilities: ['temperature_control', 'scheduling', 'energy_monitoring'],
          connectivityTypes: ['WIFI', 'ZIGBEE'],
          commands: ['set_temperature', 'set_schedule', 'get_energy_usage'],
        },
        {
          type: 'SMART_LOCK',
          name: 'Smart Lock',
          description: 'Electronic door lock with access control and monitoring',
          capabilities: ['remote_lock', 'access_logs', 'temporary_codes', 'auto_lock'],
          connectivityTypes: ['WIFI', 'ZIGBEE', 'ZWAVE'],
          commands: ['lock', 'unlock', 'create_code', 'delete_code', 'get_access_logs'],
        },
      ];

      await this.auditService.logEvent({
        resource: 'IoTIntegration',
        entityType: 'DeviceTypes',
        entityId: 'device_types_list',
        action: 'READ',
        details: {
          count: deviceTypes.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: deviceTypes,
        message: 'Device types retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting devicetypes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get connectivity types and protocols
   */
  @Get('connectivity-types')
  @UseGuards(RbacGuard)
  async getConnectivityTypes(@Request() req: any) {
    try {
      const connectivityTypes = [
        {
          type: 'WIFI',
          name: 'WiFi',
          description: 'Wireless local area network connectivity',
          range: '50-100 meters',
          powerConsumption: 'Medium',
          security: 'WPA3',
          useCases: ['smart_lights', 'voice_assistants', 'thermostats'],
        },
        {
          type: 'BLUETOOTH',
          name: 'Bluetooth',
          description: 'Short-range wireless communication',
          range: '1-10 meters',
          powerConsumption: 'Low',
          security: 'AES-128',
          useCases: ['wearables', 'fall_detectors', 'mobile_devices'],
        },
        {
          type: 'ZIGBEE',
          name: 'Zigbee',
          description: 'Low-power mesh network protocol',
          range: '10-100 meters',
          powerConsumption: 'Very Low',
          security: 'AES-128',
          useCases: ['sensors', 'smart_lights', 'locks'],
        },
        {
          type: 'ZWAVE',
          name: 'Z-Wave',
          description: 'Wireless mesh networking protocol',
          range: '30-100 meters',
          powerConsumption: 'Low',
          security: 'AES-128',
          useCases: ['home_automation', 'security_systems', 'locks'],
        },
        {
          type: 'CELLULAR',
          name: 'Cellular',
          description: 'Mobile network connectivity',
          range: 'Nationwide',
          powerConsumption: 'High',
          security: 'LTE/5G',
          useCases: ['emergency_devices', 'remote_monitoring', 'backup_connectivity'],
        },
      ];

      await this.auditService.logEvent({
        resource: 'IoTIntegration',
        entityType: 'ConnectivityTypes',
        entityId: 'connectivity_types_list',
        action: 'READ',
        details: {
          count: connectivityTypes.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: connectivityTypes,
        message: 'Connectivity types retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting connectivitytypes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get IoT integration statistics
   */
  @Get('statistics')
  @UseGuards(RbacGuard)
  async getIoTStatistics(@Request() req: any) {
    try {
      const statistics = {
        totalDevices: 45,
        connectedDevices: 42,
        offlineDevices: 3,
        deviceTypes: {
          SMART_LIGHT: 15,
          VOICE_ASSISTANT: 8,
          FALL_DETECTOR: 12,
          SMART_THERMOSTAT: 6,
          SMART_LOCK: 4,
        },
        connectivityTypes: {
          WIFI: 28,
          BLUETOOTH: 10,
          ZIGBEE: 5,
          ZWAVE: 2,
        },
        averageUptime: 98.5,
        totalCommands: 1250,
        successfulCommands: 1180,
        failedCommands: 70,
        averageResponseTime: 150, // milliseconds
        lastUpdated: new Date(),
      };

      await this.auditService.logEvent({
        resource: 'IoTIntegration',
        entityType: 'Statistics',
        entityId: 'iot_statistics',
        action: 'READ',
        details: {
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: statistics,
        message: 'IoT statistics retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting IoTstatistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
