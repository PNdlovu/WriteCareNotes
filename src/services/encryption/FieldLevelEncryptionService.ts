import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Field Level Encryption Service for WriteCareNotes
 * @module FieldLevelEncryptionService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Advanced field-level encryption service for healthcare data protection
 * with AES-256-GCM encryption and key rotation capabilities.
 */

import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

export interface EncryptionResult {
  encryptedData: string;
  keyId: string;
  algorithm: string;
  iv: string;
  authTag: string;
  timestamp: Date;
}

export interface DecryptionRequest {
  encryptedData: string;
  keyId: string;
  algorithm: string;
  iv: string;
  authTag: string;
}

export interface EncryptionKey {
  keyId: string;
  key: Buffer;
  algorithm: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  purpose: string;
}


export class FieldLevelEncryptionService {
  // Logger removed
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private encryptionKeys: Map<string, EncryptionKey> = new Map();
  private currentKeyId: string;

  constructor(private readonly configService: ConfigService) {
    this.initializeEncryptionKeys();
    console.log('Field Level Encryption Service initialized with AES-256-GCM');
  }

  /**
   * Encrypt a field value with current encryption key
   */
  async encryptField(plaintext: string, purpose: string = 'general'): Promise<string> {
    try {
      if (!plaintext || plaintext.trim() === '') {
        return plaintext;
      }

      const key = this.getCurrentEncryptionKey(purpose);
      const iv = crypto.randomBytes(this.ivLength);
      
      const cipher = crypto.createCipher(this.algorithm, key.key);
      cipher.setAAD(Buffer.from(key.keyId)); // Additional authenticated data
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();

      const result: EncryptionResult = {
        encryptedData: encrypted,
        keyId: key.keyId,
        algorithm: this.algorithm,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        timestamp: new Date()
      };

      // Return as base64 encoded JSON for storage
      return Buffer.from(JSON.stringify(result)).toString('base64');

    } catch (error: unknown) {
      console.error('Failed to encrypt field', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        purpose
      });
      throw new Error(`Encryption failed: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  /**
   * Decrypt a field value
   */
  async decryptField(encryptedValue: string): Promise<string> {
    try {
      if (!encryptedValue || encryptedValue.trim() === '') {
        return encryptedValue;
      }

      // Check if value is already decrypted (for backward compatibility)
      if (!this.isEncryptedValue(encryptedValue)) {
        return encryptedValue;
      }

      const decryptionRequest: DecryptionRequest = JSON.parse(
        Buffer.from(encryptedValue, 'base64').toString('utf8')
      );

      const key = this.getEncryptionKey(decryptionRequest.keyId);
      if (!key) {
        throw new Error(`Encryption key not found: ${decryptionRequest.keyId}`);
      }

      const decipher = crypto.createDecipher(decryptionRequest.algorithm, key.key);
      decipher.setAAD(Buffer.from(decryptionRequest.keyId));
      decipher.setAuthTag(Buffer.from(decryptionRequest.authTag, 'hex'));

      let decrypted = decipher.update(decryptionRequest.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;

    } catch (error: unknown) {
      console.error('Failed to decrypt field', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        encryptedValueLength: encryptedValue?.length
      });
      throw new Error(`Decryption failed: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  /**
   * Encrypt multiple fields in an object
   */
  async encryptFields(
    data: Record<string, any>,
    fieldsToEncrypt: string[],
    purpose: string = 'general'
  ): Promise<Record<string, any>> {
    try {
      const encryptedData = { ...data };

      for (const field of fieldsToEncrypt) {
        if (encryptedData[field] !== undefined && encryptedData[field] !== null) {
          const value = typeof encryptedData[field] === 'string' 
            ? encryptedData[field] 
            : JSON.stringify(encryptedData[field]);
          
          encryptedData[field] = await this.encryptField(value, purpose);
        }
      }

      return encryptedData;

    } catch (error: unknown) {
      console.error('Failed to encrypt fields', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        fieldsToEncrypt,
        purpose
      });
      throw error;
    }
  }

  /**
   * Decrypt multiple fields in an object
   */
  async decryptFields(
    data: Record<string, any>,
    fieldsToDecrypt: string[]
  ): Promise<Record<string, any>> {
    try {
      const decryptedData = { ...data };

      for (const field of fieldsToDecrypt) {
        if (decryptedData[field] !== undefined && decryptedData[field] !== null) {
          decryptedData[field] = await this.decryptField(decryptedData[field]);
        }
      }

      return decryptedData;

    } catch (error: unknown) {
      console.error('Failed to decrypt fields', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        fieldsToDecrypt
      });
      throw error;
    }
  }

  /**
   * Generate new encryption key
   */
  async generateNewKey(purpose: string = 'general'): Promise<EncryptionKey> {
    try {
      const keyId = `key_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
      const key = crypto.randomBytes(this.keyLength);
      
      const encryptionKey: EncryptionKey = {
        keyId,
        key,
        algorithm: this.algorithm,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isActive: true,
        purpose
      };

      this.encryptionKeys.set(keyId, encryptionKey);

      console.log('New encryption key generated', {
        keyId,
        purpose,
        algorithm: this.algorithm
      });

      return encryptionKey;

    } catch (error: unknown) {
      console.error('Failed to generate new encryption key', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        purpose
      });
      throw error;
    }
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys(): Promise<void> {
    try {
      console.log('Starting key rotation process');

      // Generate new keys for each purpose
      const purposes = ['general', 'financial', 'healthcare', 'personal'];
      
      for (const purpose of purposes) {
        const newKey = await this.generateNewKey(purpose);
        
        // Mark old keys as inactive but keep them for decryption
        for (const [keyId, key] of this.encryptionKeys.entries()) {
          if (key.purpose === purpose && key.keyId !== newKey.keyId) {
            key.isActive = false;
          }
        }
      }

      // Update current key ID to the latest general purpose key
      const generalKeys = Array.from(this.encryptionKeys.values())
        .filter(key => key.purpose === 'general' && key.isActive)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      if (generalKeys.length > 0) {
        this.currentKeyId = generalKeys[0].keyId;
      }

      console.log('Key rotation completed', {
        totalKeys: this.encryptionKeys.size,
        activeKeys: Array.from(this.encryptionKeys.values()).filter(k => k.isActive).length
      });

    } catch (error: unknown) {
      console.error('Failed to rotate encryption keys', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
      throw error;
    }
  }

  /**
   * Get encryption key statistics
   */
  getKeyStatistics(): any {
    const keys = Array.from(this.encryptionKeys.values());
    
    return {
      totalKeys: keys.length,
      activeKeys: keys.filter(k => k.isActive).length,
      expiredKeys: keys.filter(k => k.expiresAt && k.expiresAt < new Date()).length,
      keysByPurpose: keys.reduce((acc, key) => {
        acc[key.purpose] = (acc[key.purpose] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      oldestKey: keys.reduce((oldest, key) => 
        !oldest || key.createdAt < oldest.createdAt ? key : oldest, null as EncryptionKey | null
      )?.createdAt,
      newestKey: keys.reduce((newest, key) => 
        !newest || key.createdAt > newest.createdAt ? key : newest, null as EncryptionKey | null
      )?.createdAt
    };
  }

  /**
   * Private helper methods
   */
  private initializeEncryptionKeys(): void {
    // Initialize with default keys from configuration
    const masterKey = this.configService.get<string>('ENCRYPTION_MASTER_KEY') || 
                     crypto.randomBytes(this.keyLength).toString('hex');

    // Generate initial keys for different purposes
    const purposes = ['general', 'financial', 'healthcare', 'personal'];
    
    purposes.forEach(purpose => {
      const keyId = `initial_${purpose}_${Date.now()}`;
      const key = crypto.scryptSync(masterKey, `salt_${purpose}`, this.keyLength);
      
      const encryptionKey: EncryptionKey = {
        keyId,
        key,
        algorithm: this.algorithm,
        createdAt: new Date(),
        isActive: true,
        purpose
      };

      this.encryptionKeys.set(keyId, encryptionKey);
    });

    // Set current key ID to general purpose key
    const generalKey = Array.from(this.encryptionKeys.values())
      .find(key => key.purpose === 'general');
    
    if (generalKey) {
      this.currentKeyId = generalKey.keyId;
    }

    console.log('Encryption keys initialized', {
      keyCount: this.encryptionKeys.size,
      purposes: purposes
    });
  }

  private getCurrentEncryptionKey(purpose: string = 'general'): EncryptionKey {
    // Find active key for the specified purpose
    const key = Array.from(this.encryptionKeys.values())
      .find(k => k.purpose === purpose && k.isActive);

    if (!key) {
      throw new Error(`No active encryption key found for purpose: ${purpose}`);
    }

    // Check if key is expired
    if (key.expiresAt && key.expiresAt < new Date()) {
      throw new Error(`Encryption key expired: ${key.keyId}`);
    }

    return key;
  }

  private getEncryptionKey(keyId: string): EncryptionKey | undefined {
    return this.encryptionKeys.get(keyId);
  }

  private isEncryptedValue(value: string): boolean {
    try {
      // Check if value is base64 encoded JSON with encryption metadata
      const decoded = Buffer.from(value, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);
      
      return parsed.encryptedData && 
             parsed.keyId && 
             parsed.algorithm && 
             parsed.iv && 
             parsed.authTag;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup expired keys (keep for historical decryption but mark as expired)
   */
  async cleanupExpiredKeys(): Promise<void> {
    try {
      const now = new Date();
      let expiredCount = 0;

      for (const [keyId, key] of this.encryptionKeys.entries()) {
        if (key.expiresAt && key.expiresAt < now && key.isActive) {
          key.isActive = false;
          expiredCount++;
        }
      }

      console.log('Expired keys cleanup completed', {
        expiredCount,
        totalKeys: this.encryptionKeys.size
      });

    } catch (error: unknown) {
      console.error('Failed to cleanup expired keys', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
      throw error;
    }
  }
}

export default FieldLevelEncryptionService;