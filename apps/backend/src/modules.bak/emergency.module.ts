/**
 * @fileoverview Comprehensive emergency management module with nurse call system,
 * @module Modules/Emergency.module
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Comprehensive emergency management module with nurse call system,
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Emergency Management Module
 * @module EmergencyModule
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive emergency management module with nurse call system,
 * on-call management, and incident response coordination.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmergencyIncident } from '../entities/emergency/EmergencyIncident';
import { NurseCallAlert } from '../entities/emergency/NurseCallAlert';
import { OnCallRota } from '../entities/emergency/OnCallRota';
import { Resident } from '../entities/resident/Resident';
import { EmergencyOnCallController } from '../controllers/emergency/EmergencyOnCallController';
import { EnterpriseEmergencyManagementService } from '../services/emergency/EnterpriseEmergencyManagementService';
import { NurseCallSystemService } from '../services/emergency/NurseCallSystemService';
import { EmergencyOnCallService } from '../services/emergency/EmergencyOnCallService';
import { NotificationModule } from './notification.module';
import { EncryptionModule } from './encryption.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmergencyIncident,
      NurseCallAlert,
      OnCallRota,
      Resident
    ]),
    NotificationModule,
    EncryptionModule
  ],
  controllers: [EmergencyOnCallController],
  providers: [
    EnterpriseEmergencyManagementService,
    NurseCallSystemService,
    EmergencyOnCallService
  ],
  exports: [
    EnterpriseEmergencyManagementService,
    NurseCallSystemService,
    EmergencyOnCallService
  ]
})
export class EmergencyModule {}
