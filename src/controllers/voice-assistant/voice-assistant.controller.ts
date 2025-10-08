/**
 * @fileoverview voice-assistant.controller
 * @module Voice-assistant/Voice-assistant.controller
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description voice-assistant.controller
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../middleware/auth.guard';
import { RbacGuard } from '../../middleware/rbac.guard';
import { VoiceAssistantService, VoiceCommand, VoiceResponse } from '../../services/voice-assistant.service';
import { AuditTrailService } from '../../services/audit/AuditTrailService';

@Controller('api/voice-assistant')
@UseGuards(JwtAuthGuard)
export class VoiceAssistantController {
  constructor(
    private readonly voiceAssistantService: VoiceAssistantService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Initialize a voice assistant device
   */
  @Post('devices/:deviceId/initialize')
  @UseGuards(RbacGuard)
  async initializeDevice(
    @Param('deviceId') deviceId: string,
    @Body() deviceData: any,
    @Request() req: any,
  ) {
    try {
      const success = await this.voiceAssistantService.initializeDevice(deviceData);

      await this.auditService.logEvent({
        resource: 'VoiceAssistant',
        entityType: 'Device',
        entityId: deviceId,
        action: 'CREATE',
        details: {
          deviceName: deviceData.deviceName,
          deviceType: deviceData.deviceType,
          roomId: deviceData.roomId,
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Voice assistant device initialized successfully' : 'Failed to initialize device',
      };
    } catch (error) {
      console.error('Error initializing voice assistant device:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process voice command from audio data
   */
  @Post('devices/:deviceId/process-command')
  @UseGuards(RbacGuard)
  @UseInterceptors(FileInterceptor('audio'))
  async processVoiceCommand(
    @Param('deviceId') deviceId: string,
    @UploadedFile() audioFile: Express.Multer.File,
    @Body() commandData: { residentId?: string },
    @Request() req: any,
  ) {
    try {
      if (!audioFile) {
        return {
          success: false,
          error: 'Audio file is required',
        };
      }

      const response = await this.voiceAssistantService.processVoiceCommand(
        deviceId,
        audioFile.buffer,
        commandData.residentId,
      );

      await this.auditService.logEvent({
        resource: 'VoiceAssistant',
        entityType: 'VoiceCommand',
        entityId: `cmd_${Date.now()}`,
        action: 'CREATE',
        details: {
          deviceId,
          residentId: commandData.residentId,
          commandLength: audioFile.buffer.length,
          responseLength: response.text.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: response,
        message: 'Voice command processed successfully',
      };
    } catch (error) {
      console.error('Error processing voice command:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Make the voice assistant speak a message
   */
  @Post('devices/:deviceId/speak')
  @UseGuards(RbacGuard)
  async speak(
    @Param('deviceId') deviceId: string,
    @Body() speakData: {
      message: string;
      priority?: 'low' | 'normal' | 'high' | 'emergency';
    },
    @Request() req: any,
  ) {
    try {
      const success = await this.voiceAssistantService.speak(
        deviceId,
        speakData.message,
        speakData.priority || 'normal',
      );

      await this.auditService.logEvent({
        resource: 'VoiceAssistant',
        entityType: 'VoiceMessage',
        entityId: `msg_${Date.now()}`,
        action: 'CREATE',
        details: {
          deviceId,
          message: speakData.message,
          priority: speakData.priority || 'normal',
          messageLength: speakData.message.length,
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Message sent successfully' : 'Failed to send message',
      };
    } catch (error) {
      console.error('Error sending voice message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Play music on a voice assistant
   */
  @Post('devices/:deviceId/play-music')
  @UseGuards(RbacGuard)
  async playMusic(
    @Param('deviceId') deviceId: string,
    @Body() musicData: {
      playlistId?: string;
      songTitle?: string;
    },
    @Request() req: any,
  ) {
    try {
      const success = await this.voiceAssistantService.playMusic(
        deviceId,
        musicData.playlistId,
        musicData.songTitle,
      );

      await this.auditService.logEvent({
        resource: 'VoiceAssistant',
        entityType: 'MusicPlayback',
        entityId: `music_${Date.now()}`,
        action: 'CREATE',
        details: {
          deviceId,
          playlistId: musicData.playlistId,
          songTitle: musicData.songTitle,
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Music playback started successfully' : 'Failed to start music playback',
      };
    } catch (error) {
      console.error('Error playing music:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Set up intercom between devices
   */
  @Post('devices/:fromDeviceId/intercom/:toDeviceId')
  @UseGuards(RbacGuard)
  async setupIntercom(
    @Param('fromDeviceId') fromDeviceId: string,
    @Param('toDeviceId') toDeviceId: string,
    @Body() intercomData: { message?: string },
    @Request() req: any,
  ) {
    try {
      const success = await this.voiceAssistantService.setupIntercom(
        fromDeviceId,
        toDeviceId,
        intercomData.message,
      );

      await this.auditService.logEvent({
        resource: 'VoiceAssistant',
        entityType: 'Intercom',
        entityId: `intercom_${Date.now()}`,
        action: 'CREATE',
        details: {
          fromDeviceId,
          toDeviceId,
          hasMessage: !!intercomData.message,
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Intercom established successfully' : 'Failed to establish intercom',
      };
    } catch (error) {
      console.error('Error setting up intercom:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send medication reminder
   */
  @Post('medication-reminders')
  @UseGuards(RbacGuard)
  async sendMedicationReminder(
    @Body() reminderData: {
      residentId: string;
      medicationName: string;
      dosage: string;
      time: string;
    },
    @Request() req: any,
  ) {
    try {
      const success = await this.voiceAssistantService.sendMedicationReminder(
        reminderData.residentId,
        reminderData.medicationName,
        reminderData.dosage,
        reminderData.time,
      );

      await this.auditService.logEvent({
        resource: 'VoiceAssistant',
        entityType: 'MedicationReminder',
        entityId: `reminder_${Date.now()}`,
        action: 'CREATE',
        details: {
          residentId: reminderData.residentId,
          medicationName: reminderData.medicationName,
          dosage: reminderData.dosage,
          time: reminderData.time,
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Medication reminder sent successfully' : 'Failed to send medication reminder',
      };
    } catch (error) {
      console.error('Error sending medication reminder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle emergency voice commands
   */
  @Post('devices/:deviceId/emergency')
  @UseGuards(RbacGuard)
  async handleEmergency(
    @Param('deviceId') deviceId: string,
    @Body() emergencyData: {
      emergencyType: 'fall' | 'medical' | 'help' | 'fire';
      residentId?: string;
    },
    @Request() req: any,
  ) {
    try {
      const success = await this.voiceAssistantService.handleEmergency(
        deviceId,
        emergencyData.emergencyType,
        emergencyData.residentId,
      );

      await this.auditService.logEvent({
        resource: 'VoiceAssistant',
        entityType: 'EmergencyAlert',
        entityId: `emergency_${Date.now()}`,
        action: 'CREATE',
        details: {
          deviceId,
          emergencyType: emergencyData.emergencyType,
          residentId: emergencyData.residentId,
          severity: emergencyData.emergencyType === 'fire' ? 'critical' : 'high',
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Emergency alert processed successfully' : 'Failed to process emergency alert',
      };
    } catch (error) {
      console.error('Error handling emergency:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get voice assistant device status
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
        batteryLevel: 85,
        volume: 70,
        lastSeen: new Date(),
        capabilities: {
          hasDisplay: true,
          hasCamera: false,
          hasMicrophone: true,
          hasSpeaker: true,
        },
        currentState: {
          isPlaying: false,
          currentPlaylist: null,
          isInIntercom: false,
        },
      };

      await this.auditService.logEvent({
        resource: 'VoiceAssistant',
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
   * Get available music playlists
   */
  @Get('music/playlists')
  @UseGuards(RbacGuard)
  async getMusicPlaylists(
    @Query('genre') genre?: string,
    @Request() req: any,
  ) {
    try {
      // This would typically fetch from a database
      const playlists = [
        {
          id: 'classical-relaxing',
          name: 'Classical Relaxation',
          genre: 'classical',
          ageAppropriate: true,
          songCount: 3,
        },
        {
          id: 'golden-oldies',
          name: 'Golden Oldies',
          genre: 'oldies',
          ageAppropriate: true,
          songCount: 3,
        },
        {
          id: 'nature-sounds',
          name: 'Nature & Relaxation',
          genre: 'ambient',
          ageAppropriate: true,
          songCount: 3,
        },
      ];

      const filteredPlaylists = genre
        ? playlists.filter(playlist => playlist.genre === genre)
        : playlists;

      await this.auditService.logEvent({
        resource: 'VoiceAssistant',
        entityType: 'MusicPlaylists',
        entityId: 'playlists_list',
        action: 'READ',
        details: {
          genre,
          count: filteredPlaylists.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: filteredPlaylists,
        message: 'Music playlists retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting music playlists:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get voice command history
   */
  @Get('devices/:deviceId/commands')
  @UseGuards(RbacGuard)
  async getCommandHistory(
    @Param('deviceId') deviceId: string,
    @Query('limit') limit: number = 10,
    @Request() req: any,
  ) {
    try {
      // This would typically fetch from a database
      const commandHistory = [
        {
          id: 'cmd_001',
          command: 'Play classical music',
          intent: 'play_music',
          confidence: 0.95,
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          response: 'Now playing Classical Relaxation',
        },
        {
          id: 'cmd_002',
          command: 'What time is it?',
          intent: 'time_inquiry',
          confidence: 0.98,
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          response: 'It is 2:30 PM',
        },
      ];

      await this.auditService.logEvent({
        resource: 'VoiceAssistant',
        entityType: 'CommandHistory',
        entityId: deviceId,
        action: 'READ',
        details: {
          limit,
          count: commandHistory.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: commandHistory.slice(0, limit),
        message: 'Command history retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting command history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}