/**
 * @fileoverview Unified encryption service for enterprise data protection
 * @module Encryption/EncryptionService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Unified encryption service for enterprise data protection
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Enterprise Encryption Service
 * @module EncryptionService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Unified encryption service for enterprise data protection
 * with AES-256-GCM encryption and comprehensive key management.
 */

import { Injectable, Logger } from '@nestjs/common';
import { FieldLevelEncryptionService } from './FieldLevelEncryptionService';


export class EncryptionService {
  // Logger removed

  constructor(
    private readonly fieldEncryptionService: FieldLevelEncryptionService
  ) {
    console.log('Enterprise Encryption Service initialized');
  }

  /**
   * Encrypt sensitive data with enterprise-grade security
   */
  async encryptSensitiveData(data: string): Promise<string> {
    try {
      const encryptionResult = await this.fieldEncryptionService.encryptField(data, 'sensitive_data');
      
      // Return encrypted data in a format that includes all necessary metadata
      return JSON.stringify({
        data: encryptionResult.encryptedData,
        keyId: encryptionResult.keyId,
        algorithm: encryptionResult.algorithm,
        iv: encryptionResult.iv,
        authTag: encryptionResult.authTag,
        timestamp: encryptionResult.timestamp
      });

    } catch (error: unknown) {
      console.error('Failed to encrypt sensitive data', {
        error: error instanceof Error ? error.message : "Unknown error",
        dataLength: data.length
      });
      throw error;
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptSensitiveData(encryptedData: string): Promise<string> {
    try {
      const encryptionMetadata = JSON.parse(encryptedData);
      
      const decryptionRequest = {
        encryptedData: encryptionMetadata.data,
        keyId: encryptionMetadata.keyId,
        algorithm: encryptionMetadata.algorithm,
        iv: encryptionMetadata.iv,
        authTag: encryptionMetadata.authTag
      };

      return await this.fieldEncryptionService.decryptField(decryptionRequest);

    } catch (error: unknown) {
      console.error('Failed to decrypt sensitive data', {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }

  /**
   * Encrypt healthcare data with special category protections
   */
  async encryptHealthcareData(data: string): Promise<string> {
    return this.encryptSensitiveData(data); // Uses same high-grade encryption
  }

  /**
   * Encrypt financial data
   */
  async encryptFinancialData(data: string): Promise<string> {
    return this.encryptSensitiveData(data); // Uses same high-grade encryption
  }

  /**
   * Encrypt personal identifiable information
   */
  async encryptPII(data: string): Promise<string> {
    return this.encryptSensitiveData(data); // Uses same high-grade encryption
  }
}