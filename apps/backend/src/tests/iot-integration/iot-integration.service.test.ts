import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IoTIntegrationService } from '../../services/iot-integration.service';
import { AuditTrailService } from '../../services/audit/AuditTrailService';

describe('IoTIntegrationService', () => {
  let service: IoTIntegrationService;
  let mockRepository: any;
  let mockEventEmitter: any;
  let mockAuditService: any;

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    mockAuditService = {
      logEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IoTIntegrationService,
        {
          provide: getRepositoryToken('IoTDevice'),
          useValue: mockRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<IoTIntegrationService>(IoTIntegrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connectDevice', () => {
    it('should connect a WiFi device successfully', async () => {
      const deviceData = {
        deviceName: 'Smart Light',
        deviceType: 'SMART_LIGHT',
        connectivityType: 'WIFI',
        roomId: 'room_101',
        residentId: 'resident_001',
        configuration: {
          ssid: 'CareHome_WiFi',
          password: 'secure_password',
          ipAddress: '192.168.1.100',
        },
      };

      const result = await service.connectDevice(deviceData);

      expect(result).toBe(true);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('iot.device.connected', {
        deviceId: expect.any(String),
        deviceName: deviceData.deviceName,
        deviceType: deviceData.deviceType,
        connectivityType: deviceData.connectivityType,
        roomId: deviceData.roomId,
        residentId: deviceData.residentId,
        isOnline: true,
        batteryLevel: 100,
        ipAddress: deviceData.configuration.ipAddress,
        configuration: deviceData.configuration,
        currentState: {
          isOn: false,
          brightness: 100,
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
        lastSeen: expect.any(Date),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should connect a Bluetooth device successfully', async () => {
      const deviceData = {
        deviceName: 'Fall Detector',
        deviceType: 'FALL_DETECTOR',
        connectivityType: 'BLUETOOTH',
        roomId: 'room_102',
        residentId: 'resident_002',
        configuration: {
          deviceAddress: '00:11:22:33:44:55',
          pairingCode: '1234',
        },
      };

      const result = await service.connectDevice(deviceData);

      expect(result).toBe(true);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('iot.device.connected', expect.objectContaining({
        deviceName: deviceData.deviceName,
        deviceType: deviceData.deviceType,
        connectivityType: deviceData.connectivityType,
      }));
    });

    it('should handle connection failure', async () => {
      const deviceData = {
        deviceName: 'Invalid Device',
        deviceType: 'UNKNOWN_TYPE',
        connectivityType: 'INVALID',
        roomId: 'room_103',
        residentId: 'resident_003',
        configuration: {},
      };

      const result = await service.connectDevice(deviceData);

      expect(result).toBe(false);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('iot.device.connection_failed', {
        deviceName: deviceData.deviceName,
        deviceType: deviceData.deviceType,
        connectivityType: deviceData.connectivityType,
        error: 'Unsupported device type or connectivity type',
      });
    });
  });

  describe('disconnectDevice', () => {
    it('should disconnect a device successfully', async () => {
      const deviceData = {
        id: 'device_001',
        deviceName: 'Smart Light',
        deviceType: 'SMART_LIGHT',
        connectivityType: 'WIFI',
        roomId: 'room_101',
        residentId: 'resident_001',
      };

      const result = await service.disconnectDevice(deviceData);

      expect(result).toBe(true);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('iot.device.disconnected', {
        deviceId: deviceData.id,
        deviceName: deviceData.deviceName,
        deviceType: deviceData.deviceType,
        connectivityType: deviceData.connectivityType,
        roomId: deviceData.roomId,
        residentId: deviceData.residentId,
        reason: 'manual_disconnect',
        timestamp: expect.any(Date),
      });
    });

    it('should handle disconnection failure', async () => {
      const deviceData = {
        id: 'invalid_device',
        deviceName: 'Invalid Device',
        deviceType: 'UNKNOWN_TYPE',
        connectivityType: 'INVALID',
        roomId: 'room_103',
        residentId: 'resident_003',
      };

      const result = await service.disconnectDevice(deviceData);

      expect(result).toBe(false);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('iot.device.disconnection_failed', {
        deviceId: deviceData.id,
        deviceName: deviceData.deviceName,
        error: 'Device not found or already disconnected',
      });
    });
  });

  describe('sendDeviceCommand', () => {
    it('should send command to WiFi device successfully', async () => {
      const device = {
        id: 'device_001',
        deviceName: 'Smart Light',
        deviceType: 'SMART_LIGHT',
        connectivityType: 'WIFI',
        roomId: 'room_101',
        residentId: 'resident_001',
        isOnline: true,
        configuration: {
          ipAddress: '192.168.1.100',
          port: 8080,
        },
      };

      const command = 'turn_on';
      const parameters = { brightness: 80, color: '#FFFFFF' };

      const result = await service.sendDeviceCommand(device, command, parameters);

      expect(result).toBe(true);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('iot.device.command_sent', {
        deviceId: device.id,
        deviceName: device.deviceName,
        command,
        parameters,
        timestamp: expect.any(Date),
      });
    });

    it('should send command to Bluetooth device successfully', async () => {
      const device = {
        id: 'device_002',
        deviceName: 'Fall Detector',
        deviceType: 'FALL_DETECTOR',
        connectivityType: 'BLUETOOTH',
        roomId: 'room_102',
        residentId: 'resident_002',
        isOnline: true,
        configuration: {
          deviceAddress: '00:11:22:33:44:55',
        },
      };

      const command = 'start_monitoring';
      const parameters = { sensitivity: 'high' };

      const result = await service.sendDeviceCommand(device, command, parameters);

      expect(result).toBe(true);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('iot.device.command_sent', {
        deviceId: device.id,
        deviceName: device.deviceName,
        command,
        parameters,
        timestamp: expect.any(Date),
      });
    });

    it('should handle command failure for offline device', async () => {
      const device = {
        id: 'device_003',
        deviceName: 'Offline Device',
        deviceType: 'SMART_LIGHT',
        connectivityType: 'WIFI',
        roomId: 'room_103',
        residentId: 'resident_003',
        isOnline: false,
        configuration: {},
      };

      const command = 'turn_on';
      const parameters = {};

      const result = await service.sendDeviceCommand(device, command, parameters);

      expect(result).toBe(false);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('iot.device.command_failed', {
        deviceId: device.id,
        deviceName: device.deviceName,
        command,
        parameters,
        error: 'Device is offline',
        timestamp: expect.any(Date),
      });
    });

    it('should handle unsupported command', async () => {
      const device = {
        id: 'device_001',
        deviceName: 'Smart Light',
        deviceType: 'SMART_LIGHT',
        connectivityType: 'WIFI',
        roomId: 'room_101',
        residentId: 'resident_001',
        isOnline: true,
        configuration: {
          ipAddress: '192.168.1.100',
          port: 8080,
        },
      };

      const command = 'unsupported_command';
      const parameters = {};

      const result = await service.sendDeviceCommand(device, command, parameters);

      expect(result).toBe(false);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('iot.device.command_failed', {
        deviceId: device.id,
        deviceName: device.deviceName,
        command,
        parameters,
        error: 'Unsupported command for this device type',
        timestamp: expect.any(Date),
      });
    });
  });

  describe('syncDeviceState', () => {
    it('should sync device state successfully', async () => {
      const deviceData = {
        id: 'device_001',
        deviceName: 'Smart Light',
        deviceType: 'SMART_LIGHT',
        connectivityType: 'WIFI',
        roomId: 'room_101',
        residentId: 'resident_001',
        isOnline: true,
        currentState: {
          isOn: true,
          brightness: 80,
          color: '#FFFFFF',
        },
        configuration: {
          ipAddress: '192.168.1.100',
          port: 8080,
        },
      };

      const result = await service.syncDeviceState(deviceData);

      expect(result).toBe(true);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('iot.device.state_synced', {
        deviceId: deviceData.id,
        deviceName: deviceData.deviceName,
        currentState: deviceData.currentState,
        timestamp: expect.any(Date),
      });
    });

    it('should handle sync failure for offline device', async () => {
      const deviceData = {
        id: 'device_003',
        deviceName: 'Offline Device',
        deviceType: 'SMART_LIGHT',
        connectivityType: 'WIFI',
        roomId: 'room_103',
        residentId: 'resident_003',
        isOnline: false,
        currentState: {
          isOn: false,
          brightness: 0,
          color: '#000000',
        },
        configuration: {},
      };

      const result = await service.syncDeviceState(deviceData);

      expect(result).toBe(false);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('iot.device.sync_failed', {
        deviceId: deviceData.id,
        deviceName: deviceData.deviceName,
        error: 'Device is offline',
        timestamp: expect.any(Date),
      });
    });
  });

  describe('getConnectionStatus', () => {
    it('should return connection status for all devices', () => {
      const status = service.getConnectionStatus();

      expect(status).toEqual({
        totalDevices: 0,
        connectedDevices: 0,
        offlineDevices: 0,
        connectivityTypes: {
          WIFI: 0,
          BLUETOOTH: 0,
          ZIGBEE: 0,
          ZWAVE: 0,
          CELLULAR: 0,
        },
        deviceTypes: {
          SMART_LIGHT: 0,
          VOICE_ASSISTANT: 0,
          FALL_DETECTOR: 0,
          SMART_THERMOSTAT: 0,
          SMART_LOCK: 0,
        },
        averageUptime: 0,
        lastUpdated: expect.any(Date),
      });
    });
  });

  describe('WiFiProtocol', () => {
    it('should connect WiFi device successfully', async () => {
      const protocol = new (service as any).WiFiProtocol();
      const deviceData = {
        deviceName: 'Smart Light',
        deviceType: 'SMART_LIGHT',
        roomId: 'room_101',
        residentId: 'resident_001',
        configuration: {
          ssid: 'CareHome_WiFi',
          password: 'secure_password',
          ipAddress: '192.168.1.100',
        },
      };

      const result = await protocol.connect(deviceData);

      expect(result).toBe(true);
    });

    it('should send command to WiFi device successfully', async () => {
      const protocol = new (service as any).WiFiProtocol();
      const device = {
        id: 'device_001',
        deviceName: 'Smart Light',
        deviceType: 'SMART_LIGHT',
        roomId: 'room_101',
        residentId: 'resident_001',
        isOnline: true,
        configuration: {
          ipAddress: '192.168.1.100',
          port: 8080,
        },
      };

      const command = 'turn_on';
      const parameters = { brightness: 80 };

      const result = await protocol.sendCommand(device, command, parameters);

      expect(result).toBe(true);
    });

    it('should sync WiFi device state successfully', async () => {
      const protocol = new (service as any).WiFiProtocol();
      const device = {
        id: 'device_001',
        deviceName: 'Smart Light',
        deviceType: 'SMART_LIGHT',
        roomId: 'room_101',
        residentId: 'resident_001',
        isOnline: true,
        currentState: {
          isOn: true,
          brightness: 80,
          color: '#FFFFFF',
        },
        configuration: {
          ipAddress: '192.168.1.100',
          port: 8080,
        },
      };

      const result = await protocol.syncState(device);

      expect(result).toBe(true);
    });
  });

  describe('BluetoothProtocol', () => {
    it('should connect Bluetooth device successfully', async () => {
      const protocol = new (service as any).BluetoothProtocol();
      const deviceData = {
        deviceName: 'Fall Detector',
        deviceType: 'FALL_DETECTOR',
        roomId: 'room_102',
        residentId: 'resident_002',
        configuration: {
          deviceAddress: '00:11:22:33:44:55',
          pairingCode: '1234',
        },
      };

      const result = await protocol.connect(deviceData);

      expect(result).toBe(true);
    });

    it('should send command to Bluetooth device successfully', async () => {
      const protocol = new (service as any).BluetoothProtocol();
      const device = {
        id: 'device_002',
        deviceName: 'Fall Detector',
        deviceType: 'FALL_DETECTOR',
        roomId: 'room_102',
        residentId: 'resident_002',
        isOnline: true,
        configuration: {
          deviceAddress: '00:11:22:33:44:55',
        },
      };

      const command = 'start_monitoring';
      const parameters = { sensitivity: 'high' };

      const result = await protocol.sendCommand(device, command, parameters);

      expect(result).toBe(true);
    });

    it('should sync Bluetooth device state successfully', async () => {
      const protocol = new (service as any).BluetoothProtocol();
      const device = {
        id: 'device_002',
        deviceName: 'Fall Detector',
        deviceType: 'FALL_DETECTOR',
        roomId: 'room_102',
        residentId: 'resident_002',
        isOnline: true,
        currentState: {
          isMonitoring: true,
          sensitivity: 'high',
          batteryLevel: 85,
        },
        configuration: {
          deviceAddress: '00:11:22:33:44:55',
        },
      };

      const result = await protocol.syncState(device);

      expect(result).toBe(true);
    });
  });

  describe('ZigbeeProtocol', () => {
    it('should connect Zigbee device successfully', async () => {
      const protocol = new (service as any).ZigbeeProtocol();
      const deviceData = {
        deviceName: 'Smart Sensor',
        deviceType: 'SMART_SENSOR',
        roomId: 'room_103',
        residentId: 'resident_003',
        configuration: {
          networkKey: 'zigbee_network_key',
          deviceAddress: '0x1234',
        },
      };

      const result = await protocol.connect(deviceData);

      expect(result).toBe(true);
    });

    it('should send command to Zigbee device successfully', async () => {
      const protocol = new (service as any).ZigbeeProtocol();
      const device = {
        id: 'device_003',
        deviceName: 'Smart Sensor',
        deviceType: 'SMART_SENSOR',
        roomId: 'room_103',
        residentId: 'resident_003',
        isOnline: true,
        configuration: {
          networkKey: 'zigbee_network_key',
          deviceAddress: '0x1234',
        },
      };

      const command = 'read_sensor';
      const parameters = { sensorType: 'temperature' };

      const result = await protocol.sendCommand(device, command, parameters);

      expect(result).toBe(true);
    });

    it('should sync Zigbee device state successfully', async () => {
      const protocol = new (service as any).ZigbeeProtocol();
      const device = {
        id: 'device_003',
        deviceName: 'Smart Sensor',
        deviceType: 'SMART_SENSOR',
        roomId: 'room_103',
        residentId: 'resident_003',
        isOnline: true,
        currentState: {
          temperature: 22.5,
          humidity: 65,
          batteryLevel: 90,
        },
        configuration: {
          networkKey: 'zigbee_network_key',
          deviceAddress: '0x1234',
        },
      };

      const result = await protocol.syncState(device);

      expect(result).toBe(true);
    });
  });

  describe('ZWaveProtocol', () => {
    it('should connect Z-Wave device successfully', async () => {
      const protocol = new (service as any).ZWaveProtocol();
      const deviceData = {
        deviceName: 'Smart Lock',
        deviceType: 'SMART_LOCK',
        roomId: 'room_104',
        residentId: 'resident_004',
        configuration: {
          homeId: '0x12345678',
          nodeId: 5,
        },
      };

      const result = await protocol.connect(deviceData);

      expect(result).toBe(true);
    });

    it('should send command to Z-Wave device successfully', async () => {
      const protocol = new (service as any).ZWaveProtocol();
      const device = {
        id: 'device_004',
        deviceName: 'Smart Lock',
        deviceType: 'SMART_LOCK',
        roomId: 'room_104',
        residentId: 'resident_004',
        isOnline: true,
        configuration: {
          homeId: '0x12345678',
          nodeId: 5,
        },
      };

      const command = 'lock';
      const parameters = {};

      const result = await protocol.sendCommand(device, command, parameters);

      expect(result).toBe(true);
    });

    it('should sync Z-Wave device state successfully', async () => {
      const protocol = new (service as any).ZWaveProtocol();
      const device = {
        id: 'device_004',
        deviceName: 'Smart Lock',
        deviceType: 'SMART_LOCK',
        roomId: 'room_104',
        residentId: 'resident_004',
        isOnline: true,
        currentState: {
          isLocked: true,
          batteryLevel: 95,
          lastAccess: new Date(),
        },
        configuration: {
          homeId: '0x12345678',
          nodeId: 5,
        },
      };

      const result = await protocol.syncState(device);

      expect(result).toBe(true);
    });
  });

  describe('CellularProtocol', () => {
    it('should connect Cellular device successfully', async () => {
      const protocol = new (service as any).CellularProtocol();
      const deviceData = {
        deviceName: 'Emergency Device',
        deviceType: 'EMERGENCY_DEVICE',
        roomId: 'room_105',
        residentId: 'resident_005',
        configuration: {
          simCardId: 'SIM123456789',
          apn: 'carehome.mobile',
        },
      };

      const result = await protocol.connect(deviceData);

      expect(result).toBe(true);
    });

    it('should send command to Cellular device successfully', async () => {
      const protocol = new (service as any).CellularProtocol();
      const device = {
        id: 'device_005',
        deviceName: 'Emergency Device',
        deviceType: 'EMERGENCY_DEVICE',
        roomId: 'room_105',
        residentId: 'resident_005',
        isOnline: true,
        configuration: {
          simCardId: 'SIM123456789',
          apn: 'carehome.mobile',
        },
      };

      const command = 'send_emergency_alert';
      const parameters = { alertType: 'medical_emergency' };

      const result = await protocol.sendCommand(device, command, parameters);

      expect(result).toBe(true);
    });

    it('should sync Cellular device state successfully', async () => {
      const protocol = new (service as any).CellularProtocol();
      const device = {
        id: 'device_005',
        deviceName: 'Emergency Device',
        deviceType: 'EMERGENCY_DEVICE',
        roomId: 'room_105',
        residentId: 'resident_005',
        isOnline: true,
        currentState: {
          signalStrength: 85,
          batteryLevel: 70,
          lastHeartbeat: new Date(),
        },
        configuration: {
          simCardId: 'SIM123456789',
          apn: 'carehome.mobile',
        },
      };

      const result = await protocol.syncState(device);

      expect(result).toBe(true);
    });
  });
});