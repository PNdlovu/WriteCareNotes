/**
 * @fileoverview Comprehensive consent management module with GDPR compliance,
 * @module Modules/Consent.module
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Comprehensive consent management module with GDPR compliance,
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Enterprise Consent Management Module
 * @module ConsentModule
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive consent management module with GDPR compliance,
 * capacity assessment, and automated monitoring.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsentManagement } from '../entities/consent/ConsentManagement';
import { Resident } from '../entities/resident/Resident';
import { EnterpriseConsentManagementService } from '../services/consent/EnterpriseConsentManagementService';
import { ConsentController } from '../controllers/consent/ConsentController';
import { NotificationModule } from './notification.module';
import { AuditModule } from './audit.module';
import { EncryptionModule } from './encryption.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConsentManagement, Resident]),
    NotificationModule,
    AuditModule,
    EncryptionModule
  ],
  providers: [EnterpriseConsentManagementService],
  controllers: [ConsentController],
  exports: [EnterpriseConsentManagementService]
})
export class ConsentModule {}
