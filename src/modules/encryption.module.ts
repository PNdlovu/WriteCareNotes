import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Enterprise Encryption Module
 * @module EncryptionModule
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive encryption module for enterprise data protection
 * with field-level encryption and key management.
 */

import { Module } from '@nestjs/common';
import { FieldLevelEncryptionService } from '../services/encryption/FieldLevelEncryptionService';
import { EncryptionService } from '../services/encryption/EncryptionService';

@Module({
  providers: [
    FieldLevelEncryptionService,
    EncryptionService
  ],
  exports: [
    FieldLevelEncryptionService,
    EncryptionService
  ]
})
export class EncryptionModule {}