import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { VoiceAssistantService } from '../../src/services/voice-assistant.service';
import { IoTIntegrationService } from '../../src/services/iot-integration.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('VoiceAssistantService', () => {
  let service: VoiceAssistantService;
  let mockIoTService: jest.Mocked<IoTIntegrationService>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    mockIoTService = {
      sendDeviceCommand: jest.fn(),
      getDeviceById: jest.fn(),
    } as any;

    mockEventEmitter = {
      emit: jest.fn(),
    } as any;

    service = new VoiceAssistantService(mockIoTService, mockEventEmitter);
  });

  describe('processVoiceCommand', () => {
    it('should process voice commands successfully', async () => {
      const audioData = Buffer.from('mock audio data');
      const residentId = 'resident-123';
      const deviceId = 'device-456';

      const result = await service.processVoiceCommand(audioData, residentId, deviceId);

      expect(result).toBeDefined();
      expect(result.command).toBeDefined();
      expect(result.intent).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.residentId).toBe(residentId);
      expect(result.deviceId).toBe(deviceId);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('voice.command.processed', expect.any(Object));
    });

    it('should handle speech recognition errors', async () => {
      const audioData = Buffer.alloc(0); // Empty audio
      const residentId = 'resident-123';
      const deviceId = 'device-456';

      await expect(service.processVoiceCommand(audioData, residentId, deviceId))
        .rejects.toThrow('No speech detected in audio');
    });
  });

  describe('speakMessage', () => {
    it('should speak messages to devices', async () => {
      const deviceId = 'device-456';
      const message = 'Hello, how can I help you?';
      const priority = 'normal';

      mockIoTService.getDeviceById.mockResolvedValue({
        id: deviceId,
        deviceType: 'SMART_SPEAKER',
        status: 'ONLINE',
        capabilities: ['speak', 'listen'],
      } as any);

      mockIoTService.sendDeviceCommand.mockResolvedValue(true);

      const result = await service.speakMessage(deviceId, message, priority);

      expect(result).toBe(true);
      expect(mockIoTService.getDeviceById).toHaveBeenCalledWith(deviceId);
      expect(mockIoTService.sendDeviceCommand).toHaveBeenCalledWith(
        expect.any(Object),
        'speak',
        expect.objectContaining({
          message,
          audioUrl: expect.any(String),
          priority,
        })
      );
    });

    it('should handle device not found errors', async () => {
      const deviceId = 'non-existent-device';
      const message = 'Hello';
      const priority = 'normal';

      mockIoTService.getDeviceById.mockResolvedValue(null);

      await expect(service.speakMessage(deviceId, message, priority))
        .rejects.toThrow('Device not found');
    });
  });

  describe('speechToText', () => {
    it('should convert speech to text', async () => {
      const audioData = Buffer.from('mock audio data');

      const result = await service['speechToText'](audioData);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty audio data', async () => {
      const audioData = Buffer.alloc(0);

      await expect(service['speechToText'](audioData))
        .rejects.toThrow('No speech detected in audio');
    });
  });

  describe('textToSpeech', () => {
    it('should convert text to speech', async () => {
      const text = 'Hello, this is a test message';

      const result = await service['textToSpeech'](text);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('tts-service.carehome.com');
    });

    it('should handle empty text', async () => {
      const text = '';

      await expect(service['textToSpeech'](text))
        .rejects.toThrow('Empty text provided for speech synthesis');
    });

    it('should handle whitespace-only text', async () => {
      const text = '   ';

      await expect(service['textToSpeech'](text))
        .rejects.toThrow('Empty text provided for speech synthesis');
    });
  });

  describe('processNaturalLanguage', () => {
    it('should process natural language commands', async () => {
      const text = 'I need help with my medication';
      const residentId = 'resident-123';

      const result = await service['processNaturalLanguage'](text, residentId);

      expect(result).toBeDefined();
      expect(result.command).toBe(text);
      expect(result.intent).toBeDefined();
      expect(result.parameters).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.residentId).toBe(residentId);
    });

    it('should handle medication-related commands', async () => {
      const text = 'Can you help me with my medication schedule?';
      const residentId = 'resident-123';

      const result = await service['processNaturalLanguage'](text, residentId);

      expect(result).toBeDefined();
      expect(result.intent).toBe('medication_help');
      expect(result.parameters).toHaveProperty('medication_type');
    });

    it('should handle emergency commands', async () => {
      const text = 'I need emergency help';
      const residentId = 'resident-123';

      const result = await service['processNaturalLanguage'](text, residentId);

      expect(result).toBeDefined();
      expect(result.intent).toBe('emergency');
      expect(result.parameters).toHaveProperty('urgency');
    });
  });

  describe('detectSpeechInAudio', () => {
    it('should detect speech in audio data', () => {
      const audioData = Buffer.alloc(1000, 100); // Simulate audio with some data

      const result = service['detectSpeechInAudio'](audioData);

      expect(typeof result).toBe('boolean');
    });

    it('should not detect speech in empty audio', () => {
      const audioData = Buffer.alloc(0);

      const result = service['detectSpeechInAudio'](audioData);

      expect(result).toBe(false);
    });
  });

  describe('prepareTextForSynthesis', () => {
    it('should prepare text for synthesis', () => {
      const text = '  Hello,   this is a test!  ';

      const result = service['prepareTextForSynthesis'](text);

      expect(result).toBe('Hello, this is a test!');
      expect(result.length).toBeLessThanOrEqual(500);
    });

    it('should remove special characters', () => {
      const text = 'Hello @#$%^&*() this is a test!';

      const result = service['prepareTextForSynthesis'](text);

      expect(result).toBe('Hello this is a test!');
    });

    it('should limit text length', () => {
      const text = 'a'.repeat(600);

      const result = service['prepareTextForSynthesis'](text);

      expect(result.length).toBe(500);
    });
  });

  describe('generateSynthesisParameters', () => {
    it('should generate synthesis parameters', () => {
      const text = 'Hello, this is a test';

      const result = service['generateSynthesisParameters'](text);

      expect(result).toBeDefined();
      expect(result.voice).toBeDefined();
      expect(result.speed).toBe(1.0);
      expect(result.pitch).toBe(0.0);
      expect(result.volume).toBe(1.0);
      expect(result.language).toBe('en-US');
      expect(result.textLength).toBe(text.length);
    });
  });

  describe('generateAudioId', () => {
    it('should generate unique audio IDs', () => {
      const id1 = service['generateAudioId']();
      const id2 = service['generateAudioId']();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^audio_\d+_[a-z0-9]+$/);
    });
  });

  describe('storeAudioFile', () => {
    it('should store audio files and return URLs', async () => {
      const audioId = 'audio_123_test';
      const audioData = Buffer.from('mock audio data');

      const result = await service['storeAudioFile'](audioId, audioData);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('tts-service.carehome.com');
      expect(result).toContain(audioId);
      expect(result).toContain('.wav');
    });
  });

  describe('getMusicPlaylists', () => {
    it('should return music playlists', () => {
      const result = service.getMusicPlaylists();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      const playlist = result[0];
      expect(playlist.id).toBeDefined();
      expect(playlist.name).toBeDefined();
      expect(playlist.songs).toBeDefined();
      expect(Array.isArray(playlist.songs)).toBe(true);
      expect(playlist.genre).toBeDefined();
      expect(playlist.ageAppropriate).toBeDefined();
    });
  });

  describe('playMusic', () => {
    it('should play music on devices', async () => {
      const deviceId = 'device-456';
      const playlistId = 'playlist-123';
      const volume = 50;

      mockIoTService.getDeviceById.mockResolvedValue({
        id: deviceId,
        deviceType: 'SMART_SPEAKER',
        status: 'ONLINE',
        capabilities: ['play_music'],
      } as any);

      mockIoTService.sendDeviceCommand.mockResolvedValue(true);

      const result = await service.playMusic(deviceId, playlistId, volume);

      expect(result).toBe(true);
      expect(mockIoTService.sendDeviceCommand).toHaveBeenCalledWith(
        expect.any(Object),
        'play_music',
        expect.objectContaining({
          playlistId,
          volume,
        })
      );
    });
  });

  describe('handleEmergency', () => {
    it('should handle emergency situations', async () => {
      const residentId = 'resident-123';
      const deviceId = 'device-456';
      const emergencyType = 'medical';

      mockIoTService.getDeviceById.mockResolvedValue({
        id: deviceId,
        deviceType: 'SMART_SPEAKER',
        status: 'ONLINE',
        capabilities: ['emergency_alert'],
      } as any);

      mockIoTService.sendDeviceCommand.mockResolvedValue(true);

      const result = await service.handleEmergency(residentId, deviceId, emergencyType);

      expect(result).toBe(true);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('voice.emergency.triggered', expect.any(Object));
    });
  });
});