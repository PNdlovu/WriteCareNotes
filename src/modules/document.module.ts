/**
 * @fileoverview document.module
 * @module Modules/Document.module
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description document.module
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Document Management Module
 * @module DocumentModule
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentManagement } from '../entities/document/DocumentManagement';
import { DocumentManagementController } from '../controllers/document/DocumentManagementController';
import { EnterpriseDocumentManagementService } from '../services/document/EnterpriseDocumentManagementService';
import { NotificationModule } from './notification.module';
import { EncryptionModule } from './encryption.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentManagement]),
    NotificationModule,
    EncryptionModule
  ],
  controllers: [DocumentManagementController],
  providers: [EnterpriseDocumentManagementService],
  exports: [EnterpriseDocumentManagementService]
})
export class DocumentModule {}