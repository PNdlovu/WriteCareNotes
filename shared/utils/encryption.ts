/**
 * @fileoverview Healthcare Data Encryption Utilities
 * @module Encryption
 * @version 1.0.0
 * @description HIPAA-compliant encryption utilities for healthcare data
 */

import CryptoJS from 'crypto-js'

// Encryption configuration for healthcare data
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-256-GCM',
  keySize: 256 / 32, // 256 bits
  ivSize: 96 / 8,    // 96 bits for GCM
  tagSize: 128 / 8,  // 128 bits authentication tag
  iterations: 100000  // PBKDF2 iterations
}

// Get encryption key from environment
const getEncryptionKey = (): string => {
  const key = process.env.REACT_APP_ENCRYPTION_KEY || 
               process.env.ENCRYPTION_KEY || 
               'writecarenotes-default-key-2025-healthcare'
  
  if (key === 'writecarenotes-default-key-2025-healthcare') {
    console.warn('Using default encryption key. This should not be used in production!')
  }
  
  return key
}

/**
 * Generate a cryptographically secure random key
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const generateSecureKey = (): string => {
  return CryptoJS.lib.WordArray.random(ENCRYPTION_CONFIG.keySize).toString()
}

/**
 * Generate a secure initialization vector
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const generateIV = (): string => {
  return CryptoJS.lib.WordArray.random(ENCRYPTION_CONFIG.ivSize).toString()
}

/**
 * Derive encryption key from password using PBKDF2
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const deriveKey = (password: string, salt: string): string => {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: ENCRYPTION_CONFIG.keySize,
    iterations: ENCRYPTION_CONFIG.iterations,
    hasher: CryptoJS.algo.SHA256
  }).toString()
}

/**
 * Encrypt healthcare data with AES-256-GCM
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const encryptData = (plaintext: string, customKey?: string): string => {
  try {
    const key = customKey || getEncryptionKey()
    const iv = generateIV()
    const salt = CryptoJS.lib.WordArray.random(128/8).toString()
    
    // Derive key with salt
    const derivedKey = deriveKey(key, salt)
    
    // Encrypt data
    const encrypted = CryptoJS.AES.encrypt(plaintext, derivedKey, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.NoPadding
    })
    
    // Combine salt, iv, and encrypted data
    const combined = {
      salt,
      iv,
      encrypted: encrypted.toString(),
      tag: encrypted.tag?.toString() || ''
    }
    
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(JSON.stringify(combined)))
  } catch (error) {
    console.error('Encryption failed:', error)
    throw new Error('Failed to encrypt healthcare data')
  }
}

/**
 * Decrypt healthcare data with AES-256-GCM
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const decryptData = (encryptedData: string, customKey?: string): string => {
  try {
    const key = customKey || getEncryptionKey()
    
    // Parse combined data
    const combined = JSON.parse(CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(encryptedData)))
    const { salt, iv, encrypted, tag } = combined
    
    // Derive key with salt
    const derivedKey = deriveKey(key, salt)
    
    // Decrypt data
    const decrypted = CryptoJS.AES.decrypt(encrypted, derivedKey, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.NoPadding,
      tag: CryptoJS.enc.Hex.parse(tag)
    })
    
    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    console.error('Decryption failed:', error)
    throw new Error('Failed to decrypt healthcare data')
  }
}

/**
 * Encrypt sensitive healthcare fields
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const encryptHealthcareFields = (data: Record<string, any>): Record<string, any> => {
  const sensitiveFields = [
    'nhsNumber',
    'socialSecurityNumber',
    'dateOfBirth',
    'phoneNumber',
    'email',
    'address',
    'medicalHistory',
    'medications',
    'allergies',
    'emergencyContacts',
    'notes',
    'diagnosis'
  ]
  
  const encrypted = { ...data }
  
  for (const field of sensitiveFields) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encryptData(encrypted[field])
    } else if (encrypted[field] && typeof encrypted[field] === 'object') {
      encrypted[field] = encryptData(JSON.stringify(encrypted[field]))
    }
  }
  
  return encrypted
}

/**
 * Decrypt sensitive healthcare fields
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const decryptHealthcareFields = (data: Record<string, any>): Record<string, any> => {
  const sensitiveFields = [
    'nhsNumber',
    'socialSecurityNumber',
    'dateOfBirth',
    'phoneNumber',
    'email',
    'address',
    'medicalHistory',
    'medications',
    'allergies',
    'emergencyContacts',
    'notes',
    'diagnosis'
  ]
  
  const decrypted = { ...data }
  
  for (const field of sensitiveFields) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      try {
        const decryptedValue = decryptData(decrypted[field])
        
        // Try to parse as JSON if it looks like an object
        if (decryptedValue.startsWith('{') || decryptedValue.startsWith('[')) {
          try {
            decrypted[field] = JSON.parse(decryptedValue)
          } catch {
            decrypted[field] = decryptedValue
          }
        } else {
          decrypted[field] = decryptedValue
        }
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error)
        // Keep original value if decryption fails
      }
    }
  }
  
  return decrypted
}

/**
 * Hash sensitive data for indexing (one-way)
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const hashForIndex = (data: string): string => {
  return CryptoJS.SHA256(data + getEncryptionKey()).toString()
}

/**
 * Generate secure token for sessions
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const generateSecureToken = (length: number = 32): string => {
  return CryptoJS.lib.WordArray.random(length).toString()
}

/**
 * Encrypt data for transmission
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const encryptForTransmission = (data: any): string => {
  const jsonString = JSON.stringify(data)
  return encryptData(jsonString)
}

/**
 * Decrypt data from transmission
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const decryptFromTransmission = (encryptedData: string): any => {
  const decryptedString = decryptData(encryptedData)
  return JSON.parse(decryptedString)
}

/**
 * Validate encryption key strength
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const validateKeyStrength = (key: string): boolean => {
  // Minimum requirements for healthcare data encryption
  const minLength = 32
  const hasUppercase = /[A-Z]/.test(key)
  const hasLowercase = /[a-z]/.test(key)
  const hasNumbers = /\d/.test(key)
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(key)
  
  return key.length >= minLength && hasUppercase && hasLowercase && hasNumbers && hasSpecialChars
}

/**
 * Secure data comparison (timing-safe)
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const secureCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  
  return result === 0
}

/**
 * Generate audit trail hash
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const generateAuditHash = (data: any): string => {
  const auditString = JSON.stringify(data) + Date.now() + getEncryptionKey()
  return CryptoJS.SHA256(auditString).toString()
}

/**
 * Encrypt file data
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const encryptFile = async (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      try {
        const base64Data = btoa(reader.result as string)
        const encrypted = encryptData(base64Data)
        resolve(encrypted)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(reader.error)
    reader.readAsBinaryString(file)
  })
}

/**
 * Decrypt file data
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const decryptFile = (encryptedData: string): string => {
  const decrypted = decryptData(encryptedData)
  return atob(decrypted)
}