/**
 * @fileoverview Comprehensive safeguarding module with enterprise-grade
 * @module Modules/Safeguarding.module
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Comprehensive safeguarding module with enterprise-grade
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Enterprise Safeguarding Module
 * @module SafeguardingModule
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive safeguarding module with enterprise-grade
 * alert management, risk detection, and regulatory compliance.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafeguardingAlert } from '../entities/safeguarding/SafeguardingAlert';
import { Resident } from '../entities/resident/Resident';
import { EnterpriseSafeguardingService } from '../services/safeguarding/EnterpriseSafeguardingService';
import { SafeguardingController } from '../controllers/safeguarding/SafeguardingController';
import { NotificationModule } from './notification.module';
import { AuditModule } from './audit.module';
import { EncryptionModule } from './encryption.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SafeguardingAlert, Resident]),
    NotificationModule,
    AuditModule,
    EncryptionModule
  ],
  providers: [EnterpriseSafeguardingService],
  controllers: [SafeguardingController],
  exports: [EnterpriseSafeguardingService]
})
export class SafeguardingModule {}