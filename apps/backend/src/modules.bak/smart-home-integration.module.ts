/**
 * @fileoverview smart-home-integration.module
 * @module Modules/Smart-home-integration.module
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description smart-home-integration.module
 */

import { EventEmitter2 } from "eventemitter2";

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmartDeviceEntity } from '../entities/smart-device.entity';
import { SmartHomeController } from '../controllers/smart-home.controller';
import { SmartHomeService } from '../services/smart-home.service';
import { IoTIntegrationService } from '../services/iot-integration.service';
import { VoiceAssistantService } from '../services/voice-assistant.service';
import { FallDetectionService } from '../services/fall-detection.service';
import { EnvironmentControlService } from '../services/environment-control.service';
import { SecuritySystemService } from '../services/security-system.service';

/**
 * Smart Home Integration Module
 * 
 * Provides comprehensive IoT device management and smart home automation
 * for care home environmentsincluding:
 * - Voice assistants and smart speakers
 * - Environmental controls (lighting, temperature, air quality)
 * - Safety systems (fall detection, emergency alerts)
 * - Security systems (smart locks, cameras, access control)
 * - Automated medication reminders
 * - Sleep and activity monitoring
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SmartDeviceEntity,
    ]),
  ],
  controllers: [SmartHomeController],
  providers: [
    SmartHomeService,
    IoTIntegrationService,
    VoiceAssistantService,
    FallDetectionService,
    EnvironmentControlService,
    SecuritySystemService,
  ],
  exports: [
    SmartHomeService,
    IoTIntegrationService,
    VoiceAssistantService,
    FallDetectionService,
    EnvironmentControlService,
    SecuritySystemService,
  ],
})
export class SmartHomeIntegrationModule {}
