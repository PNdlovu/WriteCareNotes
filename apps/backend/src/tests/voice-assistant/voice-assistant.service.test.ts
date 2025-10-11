import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VoiceAssistantService } from '../../services/voice-assistant.service';
import { IoTIntegrationService } from '../../services/iot-integration.service';
import { SmartDeviceEntity, DeviceType } from '../../entities/smart-device.entity';

describe('VoiceAssistantService', () => {
  let service: VoiceAssistantService;
  let iotService: IoTIntegrationService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const mockIoTService = {
      sendDeviceCommand: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoiceAssistantService,
        {
          provide: IoTIntegrationService,
          useValue: mockIoTService,
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
            on: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VoiceAssistantService>(VoiceAssistantService);
    iotService = module.get<IoTIntegrationService>(IoTIntegrationService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initializeDevice', () => {
    it('should initialize a voice assistant device successfully', async () => {
      const device: SmartDeviceEntity = {
        id: 'device_001',
        deviceName: 'Care Home Voice Assistant',
        deviceType: DeviceType.VOICE_ASSISTANT,
        roomId: 'room_001',
        residentId: 'resident_001',
        isOnline: true,
        batteryLevel: 85,
        configuration: {
          wakeWord: 'Hello Care',
          volume: 70,
          privacyMode: true,
        },
        currentState: {
          volume: 70,
        },
        capabilities: {
          hasDisplay: true,
          hasCamera: false,
          hasMicrophone: true,
          hasSpeaker: true,
        },
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.initializeDevice(device);

      expect(result).toBe(true);
      expect(iotService.sendDeviceCommand).toHaveBeenCalledWith(device, 'configure', expect.any(Object));
    });

    it('should return false for non-voice assistant device', async () => {
      const device: SmartDeviceEntity = {
        id: 'device_001',
        deviceName: 'Smart Light',
        deviceType: DeviceType.SMART_LIGHT,
        roomId: 'room_001',
        isOnline: true,
        batteryLevel: 100,
        configuration: {},
        currentState: {},
        capabilities: {},
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.initializeDevice(device);

      expect(result).toBe(false);
    });

    it('should handle initialization errors gracefully', async () => {
      const device: SmartDeviceEntity = {
        id: 'device_001',
        deviceName: 'Care Home Voice Assistant',
        deviceType: DeviceType.VOICE_ASSISTANT,
        roomId: 'room_001',
        isOnline: true,
        batteryLevel: 85,
        configuration: {},
        currentState: {},
        capabilities: {},
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock IoT service to throw error
      jest.spyOn(iotService, 'sendDeviceCommand').mockRejectedValue(new Error('Connection failed'));

      const result = await service.initializeDevice(device);

      expect(result).toBe(false);
    });
  });

  describe('processVoiceCommand', () => {
    it('should process voice command successfully', async () => {
      const deviceId = 'device_001';
      const audioData = Buffer.from('mock audio data');
      const residentId = 'resident_001';

      // Mock device in voice devices map
      (service as any).voiceDevices.set(deviceId, {
        id: deviceId,
        deviceType: DeviceType.VOICE_ASSISTANT,
        residentId,
        roomId: 'room_001',
      });

      const response = await service.processVoiceCommand(deviceId, audioData, residentId);

      expect(response).toBeDefined();
      expect(response.text).toBeDefined();
      expect(typeof response.text).toBe('string');
    });

    it('should handle device not found error', async () => {
      const deviceId = 'non_existent_device';
      const audioData = Buffer.from('mock audio data');

      const response = await service.processVoiceCommand(deviceId, audioData);

      expect(response.text).toContain("I'm sorry, I couldn't understand that");
    });

    it('should handle speech recognition errors gracefully', async () => {
      const deviceId = 'device_001';
      const audioData = Buffer.alloc(0); // Empty audio data

      // Mock device in voice devices map
      (service as any).voiceDevices.set(deviceId, {
        id: deviceId,
        deviceType: DeviceType.VOICE_ASSISTANT,
        roomId: 'room_001',
      });

      const response = await service.processVoiceCommand(deviceId, audioData);

      expect(response.text).toContain("I'm sorry, I couldn't understand that");
    });
  });

  describe('speak', () => {
    it('should make device speak successfully', async () => {
      const deviceId = 'device_001';
      const message = 'Hello, how can I help you?';
      const priority = 'normal';

      // Mock device in voice devices map
      (service as any).voiceDevices.set(deviceId, {
        id: deviceId,
        deviceType: DeviceType.VOICE_ASSISTANT,
        roomId: 'room_001',
      });

      const result = await service.speak(deviceId, message, priority);

      expect(result).toBe(true);
      expect(iotService.sendDeviceCommand).toHaveBeenCalledWith(
        expect.any(Object),
        'speak',
        expect.objectContaining({
          message,
          priority,
        })
      );
    });

    it('should return false for non-existent device', async () => {
      const deviceId = 'non_existent_device';
      const message = 'Hello';

      const result = await service.speak(deviceId, message);

      expect(result).toBe(false);
    });

    it('should handle TTS errors gracefully', async () => {
      const deviceId = 'device_001';
      const message = 'Hello';

      // Mock device in voice devices map
      (service as any).voiceDevices.set(deviceId, {
        id: deviceId,
        deviceType: DeviceType.VOICE_ASSISTANT,
        roomId: 'room_001',
      });

      // Mock TTS to throw error
      jest.spyOn(service as any, 'textToSpeech').mockRejectedValue(new Error('TTS failed'));

      const result = await service.speak(deviceId, message);

      expect(result).toBe(false);
    });
  });

  describe('playMusic', () => {
    it('should play music with playlist ID', async () => {
      const deviceId = 'device_001';
      const playlistId = 'classical-relaxing';

      // Mock device in voice devices map
      (service as any).voiceDevices.set(deviceId, {
        id: deviceId,
        deviceType: DeviceType.VOICE_ASSISTANT,
        roomId: 'room_001',
        currentState: { volume: 60 },
      });

      const result = await service.playMusic(deviceId, playlistId);

      expect(result).toBe(true);
      expect(iotService.sendDeviceCommand).toHaveBeenCalledWith(
        expect.any(Object),
        'play_music',
        expect.objectContaining({
          playlist: playlistId,
        })
      );
    });

    it('should play music with song title', async () => {
      const deviceId = 'device_001';
      const songTitle = 'Canon in D';

      // Mock device in voice devices map
      (service as any).voiceDevices.set(deviceId, {
        id: deviceId,
        deviceType: DeviceType.VOICE_ASSISTANT,
        roomId: 'room_001',
        currentState: { volume: 60 },
      });

      const result = await service.playMusic(deviceId, undefined, songTitle);

      expect(result).toBe(true);
    });

    it('should return false for non-existent device', async () => {
      const deviceId = 'non_existent_device';

      const result = await service.playMusic(deviceId);

      expect(result).toBe(false);
    });

    it('should handle no playlist found', async () => {
      const deviceId = 'device_001';

      // Mock device in voice devices map
      (service as any).voiceDevices.set(deviceId, {
        id: deviceId,
        deviceType: DeviceType.VOICE_ASSISTANT,
        roomId: 'room_001',
        currentState: { volume: 60 },
      });

      // Mock speak method to track calls
      jest.spyOn(service, 'speak').mockResolvedValue(true);

      const result = await service.playMusic(deviceId, 'non_existent_playlist');

      expect(result).toBe(false);
      expect(service.speak).toHaveBeenCalledWith(
        deviceId,
        "I couldn't find any music to play. Would you like me to suggest something?"
      );
    });
  });

  describe('setupIntercom', () => {
    it('should setup intercom between devices successfully', async () => {
      const fromDeviceId = 'device_001';
      const toDeviceId = 'device_002';
      const message = 'Hello, this is a test message';

      // Mock devices in voice devices map
      (service as any).voiceDevices.set(fromDeviceId, {
        id: fromDeviceId,
        deviceType: DeviceType.VOICE_ASSISTANT,
        roomId: 'room_001',
      });
      (service as any).voiceDevices.set(toDeviceId, {
        id: toDeviceId,
        deviceType: DeviceType.VOICE_ASSISTANT,
        roomId: 'room_002',
      });

      // Mock speak method
      jest.spyOn(service, 'speak').mockResolvedValue(true);

      const result = await service.setupIntercom(fromDeviceId, toDeviceId, message);

      expect(result).toBe(true);
      expect(service.speak).toHaveBeenCalledWith(toDeviceId, "You have an incoming message from another room", 'high');
      expect(service.speak).toHaveBeenCalledWith(toDeviceId, message, 'high');
    });

    it('should setup live intercom without message', async () => {
      const fromDeviceId = 'device_001';
      const toDeviceId = 'device_002';

      // Mock devices in voice devices map
      (service as any).voiceDevices.set(fromDeviceId, {
        id: fromDeviceId,
        deviceType: DeviceType.VOICE_ASSISTANT,
        roomId: 'room_001',
      });
      (service as any).voiceDevices.set(toDeviceId, {
        id: toDeviceId,
        deviceType: DeviceType.VOICE_ASSISTANT,
        roomId: 'room_002',
      });

      // Mock speak method
      jest.spyOn(service, 'speak').mockResolvedValue(true);

      const result = await service.setupIntercom(fromDeviceId, toDeviceId);

      expect(result).toBe(true);
      expect(iotService.sendDeviceCommand).toHaveBeenCalledWith(
        expect.any(Object),
        'start_intercom',
        { targetDevice: toDeviceId }
      );
      expect(iotService.sendDeviceCommand).toHaveBeenCalledWith(
        expect.any(Object),
        'accept_intercom',
        { sourceDevice: fromDeviceId }
      );
    });

    it('should return false for missing devices', async () => {
      const fromDeviceId = 'device_001';
      const toDeviceId = 'non_existent_device';

      // Mock only one device
      (service as any).voiceDevices.set(fromDeviceId, {
        id: fromDeviceId,
        deviceType: DeviceType.VOICE_ASSISTANT,
        roomId: 'room_001',
      });

      const result = await service.setupIntercom(fromDeviceId, toDeviceId);

      expect(result).toBe(false);
    });
  });

  describe('sendMedicationReminder', () => {
    it('should send medication reminder successfully', async () => {
      const residentId = 'resident_001';
      const medicationName = 'Paracetamol';
      const dosage = '500mg';
      const time = '2:00 PM';

      // Mock voice devices for resident
      (service as any).voiceDevices.set('device_001', {
        id: 'device_001',
        deviceType: DeviceType.VOICE_ASSISTANT,
        residentId,
        roomId: 'room_001',
        capabilities: { hasDisplay: true },
      });

      // Mock speak method
      jest.spyOn(service, 'speak').mockResolvedValue(true);

      const result = await service.sendMedicationReminder(residentId, medicationName, dosage, time);

      expect(result).toBe(true);
      expect(service.speak).toHaveBeenCalledWith(
        'device_001',
        `It's time for your ${medicationName}. Please take ${dosage} as prescribed.`,
        'high'
      );
    });

    it('should return false when no devices found for resident', async () => {
      const residentId = 'resident_without_devices';
      const medicationName = 'Paracetamol';
      const dosage = '500mg';
      const time = '2:00 PM';

      const result = await service.sendMedicationReminder(residentId, medicationName, dosage, time);

      expect(result).toBe(false);
    });
  });

  describe('handleEmergency', () => {
    it('should handle emergency successfully', async () => {
      const deviceId = 'device_001';
      const emergencyType = 'fall';
      const residentId = 'resident_001';

      // Mock device in voice devices map
      (service as any).voiceDevices.set(deviceId, {
        id: deviceId,
        deviceType: DeviceType.VOICE_ASSISTANT,
        residentId,
        roomId: 'room_001',
      });

      // Mock speak method
      jest.spyOn(service, 'speak').mockResolvedValue(true);

      const result = await service.handleEmergency(deviceId, emergencyType, residentId);

      expect(result).toBe(true);
      expect(service.speak).toHaveBeenCalledWith(
        deviceId,
        "I've detected you may have fallen. Help is on the way. Please stay calm.",
        'emergency'
      );
    });

    it('should return false for non-existent device', async () => {
      const deviceId = 'non_existent_device';
      const emergencyType = 'fall';

      const result = await service.handleEmergency(deviceId, emergencyType);

      expect(result).toBe(false);
    });

    it('should handle different emergency types', async () => {
      const deviceId = 'device_001';
      const residentId = 'resident_001';

      // Mock device in voice devices map
      (service as any).voiceDevices.set(deviceId, {
        id: deviceId,
        deviceType: DeviceType.VOICE_ASSISTANT,
        residentId,
        roomId: 'room_001',
      });

      // Mock speak method
      jest.spyOn(service, 'speak').mockResolvedValue(true);

      const emergencyTypes = ['fall', 'medical', 'help', 'fire'] as const;
      
      for (const emergencyType of emergencyTypes) {
        const result = await service.handleEmergency(deviceId, emergencyType, residentId);
        expect(result).toBe(true);
      }
    });
  });

  describe('event emission', () => {
    it('should emit voice command processed event', async () => {
      const deviceId = 'device_001';
      const audioData = Buffer.from('mock audio data');

      // Mock device in voice devices map
      (service as any).voiceDevices.set(deviceId, {
        id: deviceId,
        deviceType: DeviceType.VOICE_ASSISTANT,
        roomId: 'room_001',
      });

      await service.processVoiceCommand(deviceId, audioData);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'voice.command.processed',
        expect.objectContaining({
          deviceId,
          command: expect.any(Object),
          response: expect.any(Object),
          timestamp: expect.any(Date),
        })
      );
    });

    it('should emit voice message sent event', async () => {
      const deviceId = 'device_001';
      const message = 'Hello';

      // Mock device in voice devices map
      (service as any).voiceDevices.set(deviceId, {
        id: deviceId,
        deviceType: DeviceType.VOICE_ASSISTANT,
        roomId: 'room_001',
      });

      await service.speak(deviceId, message);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'voice.message.sent',
        expect.objectContaining({
          deviceId,
          message,
          priority: 'normal',
          timestamp: expect.any(Date),
        })
      );
    });

    it('should emit emergency voice detected event', async () => {
      const deviceId = 'device_001';
      const emergencyType = 'fall';
      const residentId = 'resident_001';

      // Mock device in voice devices map
      (service as any).voiceDevices.set(deviceId, {
        id: deviceId,
        deviceType: DeviceType.VOICE_ASSISTANT,
        residentId,
        roomId: 'room_001',
      });

      // Mock speak method
      jest.spyOn(service, 'speak').mockResolvedValue(true);

      await service.handleEmergency(deviceId, emergencyType, residentId);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'emergency.voice.detected',
        expect.objectContaining({
          deviceId,
          emergencyType,
          residentId,
          roomId: 'room_001',
          timestamp: expect.any(Date),
          severity: 'high',
        })
      );
    });
  });

  describe('private methods', () => {
    it('should detect speech in audio data', () => {
      const audioData = Buffer.alloc(1000, 100); // Mock audio data
      const hasSpeech = (service as any).detectSpeechInAudio(audioData);
      
      expect(typeof hasSpeech).toBe('boolean');
    });

    it('should process audio for speech recognition', async () => {
      const audioData = Buffer.alloc(2000); // Mock audio data
      const transcription = await (service as any).processAudioForSpeech(audioData);
      
      expect(typeof transcription).toBe('string');
      expect(transcription.length).toBeGreaterThan(0);
    });

    it('should prepare text for speech synthesis', () => {
      const text = '  Hello,   world!  @#$%  ';
      const cleanText = (service as any).prepareTextForSynthesis(text);
      
      expect(cleanText).toBe('Hello, world!');
    });

    it('should generate synthesis parameters', () => {
      const text = 'Hello world';
      const params = (service as any).generateSynthesisParameters(text);
      
      expect(params).toBeDefined();
      expect(params.voice).toBeDefined();
      expect(params.speed).toBeDefined();
      expect(params.pitch).toBeDefined();
      expect(params.volume).toBeDefined();
      expect(params.language).toBeDefined();
    });

    it('should process natural language understanding', async () => {
      const text = 'Play classical music';
      const command = await (service as any).processNaturalLanguage(text);
      
      expect(command).toBeDefined();
      expect(command.id).toBeDefined();
      expect(command.command).toBe(text);
      expect(command.intent).toBeDefined();
      expect(command.parameters).toBeDefined();
      expect(command.confidence).toBeDefined();
      expect(command.timestamp).toBeDefined();
    });

    it('should get volume for priority', () => {
      expect((service as any).getVolumeForPriority('emergency')).toBe(100);
      expect((service as any).getVolumeForPriority('high')).toBe(85);
      expect((service as any).getVolumeForPriority('normal')).toBe(70);
      expect((service as any).getVolumeForPriority('low')).toBe(50);
      expect((service as any).getVolumeForPriority('unknown')).toBe(70);
    });
  });
});