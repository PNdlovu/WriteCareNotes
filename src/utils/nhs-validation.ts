import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview NHS Number Validation Utility for WriteCareNotes
 * @module NHSValidation
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description NHS number validation with check digit verification
 * for British Isles healthcare compliance.
 * 
 * @compliance
 * - NHS Digital Data Standards
 * - NHS Number Format Specification
 * - Healthcare data validation requirements
 */

import { logger } from './logger';

/**
 * NHS Number validation service
 */
export class NHSNumberValidator {
  /**
   * Validate NHS number format and check digit
   */
  static validate(nhsNumber: string): boolean {
    if (!nhsNumber || typeof nhsNumber !== 'string') {
      return false;
    }

    // Remove any spaces or hyphens
    const cleanNumber = nhsNumber.replace(/[\s-]/g, '');

    // Check if it's exactly 10 digits
    if (!/^\d{10}$/.test(cleanNumber)) {
      return false;
    }

    // Validate check digit using NHS algorithm
    return this.validateCheckDigit(cleanNumber);
  }

  /**
   * Validate NHS number check digit using Modulus 11 algorithm
   */
  private static validateCheckDigit(nhsNumber: string): boolean {
    try {
      const digits = nhsNumber.split('').map(Number);
      const checkDigit = digits[9];

      // Calculate weighted sum of first 9 digits
      let sum = 0;
      for (let i = 0; i < 9; i++) {

        sum += (digits[i] || 0) * (10 - i);

      }

      // Calculate remainder
      const remainder = sum % 11;
      
      // Calculate expected check digit
      let expectedCheckDigit = 11 - remainder;

      // Handle special cases
      if (expectedCheckDigit === 11) {
        expectedCheckDigit = 0;
      } else if (expectedCheckDigit === 10) {
        // NHS numbers with check digit 10 are invalid
        return false;
      }

      const isValid = expectedCheckDigit === checkDigit;

      // Log validation for audit
      logger.debug('NHS number validation', {
        isValid,
        auditTrail: true,
        nhsNumberMasked: this.maskNHSNumber(nhsNumber)
      });

      return isValid;

    } catch (error: unknown) {
      console.error('NHS number validation error', { error });
      return false;
    }
  }

  /**
   * Format NHS number for display (XXX XXX XXXX)
   */
  static format(nhsNumber: string): string {
    if (!nhsNumber) {
      return '';
    }

    const cleanNumber = nhsNumber.replace(/[\s-]/g, '');
    
    if (cleanNumber.length !== 10) {
      return nhsNumber; // Return original if invalid length
    }

    return `${cleanNumber.slice(0, 3)} ${cleanNumber.slice(3, 6)} ${cleanNumber.slice(6, 10)}`;
  }

  /**
   * Mask NHS number for logging (XXX XXX 1234)
   */
  static maskNHSNumber(nhsNumber: string): string {
    if (!nhsNumber) {
      return '';
    }

    const cleanNumber = nhsNumber.replace(/[\s-]/g, '');
    
    if (cleanNumber.length !== 10) {
      return 'INVALID';
    }

    return `XXX XXX ${cleanNumber.slice(6, 10)}`;
  }

  /**
   * Generate random valid NHS number for testing
   */
  static generateTestNHSNumber(): string {
    // Generate first 9 digits randomly
    const digits: number[] = [];
    for (let i = 0; i < 9; i++) {
      digits.push(Math.floor(Math.random() * 10));
    }

    // Calculate check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {

      sum += (digits[i] || 0) * (10 - i);

    }

    const remainder = sum % 11;
    let checkDigit = 11 - remainder;

    if (checkDigit === 11) {
      checkDigit = 0;
    } else if (checkDigit === 10) {
      // Regenerate if check digit would be 10
      return this.generateTestNHSNumber();
    }

    digits.push(checkDigit);
    
    const nhsNumber = digits.join('');
    
    logger.debug('Test NHS number generated', {
      nhsNumberMasked: this.maskNHSNumber(nhsNumber),
      auditTrail: true
    });

    return nhsNumber;
  }

  /**
   * Validate multiple NHS numbers
   */
  static validateBatch(nhsNumbers: string[]): { valid: string[]; invalid: string[] } {
    const result = {
      valid: [] as string[],
      invalid: [] as string[]
    };

    for (const nhsNumber of nhsNumbers) {
      if (this.validate(nhsNumber)) {
        result.valid.push(nhsNumber);
      } else {
        result.invalid.push(nhsNumber);
      }
    }

    console.info('NHS number batch validation', {
      total: nhsNumbers.length,
      valid: result.valid.length,
      invalid: result.invalid.length,
      auditTrail: true
    });

    return result;
  }

  /**
   * Check if NHS number is from a specific region (informational only)
   */
  static getRegionInfo(nhsNumber: string): string | null {
    if (!this.validate(nhsNumber)) {
      return null;
    }

    const cleanNumber = nhsNumber.replace(/[\s-]/g, '');
    const firstThree = cleanNumber.slice(0, 3);

    const firstDigit = parseInt(firstThree[0] || '0');


    // Basic region mapping (simplified)
    switch (firstDigit) {
      case 1:
      case 2:
      case 3:
        return 'Northern England';
      case 4:
      case 5:
        return 'Central England';
      case 6:
      case 7:
        return 'Southern England';
      case 8:
      case 9:
        return 'Wales, Scotland, Northern Ireland';
      default:
        return 'Unknown';
    }
  }
}

/**
 * Convenience function for NHS number validation
 */
export function validateNHSNumber(nhsNumber: string): boolean {
  return NHSNumberValidator.validate(nhsNumber);
}

/**
 * Convenience function for NHS number formatting
 */
export function formatNHSNumber(nhsNumber: string): string {
  return NHSNumberValidator.format(nhsNumber);
}

/**
 * Convenience function for NHS number masking
 */
export function maskNHSNumber(nhsNumber: string): string {
  return NHSNumberValidator.maskNHSNumber(nhsNumber);
}

export default NHSNumberValidator;