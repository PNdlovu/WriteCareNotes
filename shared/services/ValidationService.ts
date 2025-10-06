export class ValidationService {
  // Email validation using RFC 5322 compliant regex
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  // UK phone number validation
  isValidPhoneNumber(phone: string): boolean {
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    
    // UK mobile numbers (07xxx xxxxxx) or landlines with area codes
    const ukMobileRegex = /^(\+44|0044|0)7\d{9}$/;
    const ukLandlineRegex = /^(\+44|0044|0)[1-9]\d{8,9}$/;
    
    return ukMobileRegex.test(digitsOnly) || ukLandlineRegex.test(digitsOnly);
  }

  // UK postcode validation
  isValidPostcode(postcode: string): boolean {
    const normalizedPostcode = postcode.replace(/\s/g, '').toUpperCase();
    const postcodeRegex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?[0-9][A-Z]{2}$/;
    return postcodeRegex.test(normalizedPostcode);
  }

  // Password strength validation
  isValidPassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password cannot contain repeated characters');
    }
    
    const commonPatterns = ['123456', 'abcdef', 'qwerty', 'password'];
    const lowerPassword = password.toLowerCase();
    for (const pattern of commonPatterns) {
      if (lowerPassword.includes(pattern)) {
        errors.push('Password cannot contain common patterns');
        break;
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // NHS number validation (UK specific)
  isValidNHSNumber(nhsNumber: string): boolean {
    const digits = nhsNumber.replace(/\s/g, '');
    
    if (!/^\d{10}$/.test(digits)) {
      return false;
    }
    
    // Calculate check digit using NHS algorithm
    const weights = [10, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    
    for (let i = 0; i < 9; i++) {
      sum += parseInt(digits[i]) * weights[i];
    }
    
    const remainder = sum % 11;
    const checkDigit = 11 - remainder;
    
    if (checkDigit === 11) {
      return digits[9] === '0';
    } else if (checkDigit === 10) {
      return false; // Invalid NHS number
    } else {
      return digits[9] === checkDigit.toString();
    }
  }

  // Care home registration number validation
  isValidCareHomeRegNumber(regNumber: string): boolean {
    // CQC registration numbers are typically alphanumeric, 8-12 characters
    const normalizedRegNumber = regNumber.replace(/\s/g, '').toUpperCase();
    const regNumberRegex = /^[A-Z0-9]{8,12}$/;
    return regNumberRegex.test(normalizedRegNumber);
  }

  // Invitation code validation
  isValidInvitationCode(code: string): boolean {
    // Format: XXXX-XXXX-XXXX-XXXX (16 alphanumeric characters)
    const normalizedCode = code.replace(/[-\s]/g, '').toUpperCase();
    const codeRegex = /^[A-Z0-9]{16}$/;
    return codeRegex.test(normalizedCode);
  }

  // Verification code validation (6 digits)
  isValidVerificationCode(code: string): boolean {
    const digitCode = code.replace(/\s/g, '');
    return /^\d{6}$/.test(digitCode);
  }

  // Date validation
  isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  // Age validation for care home residents
  isValidAge(dateOfBirth: string): { valid: boolean; age?: number; error?: string } {
    if (!this.isValidDate(dateOfBirth)) {
      return { valid: false, error: 'Invalid date format' };
    }
    
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()) 
      ? age - 1 
      : age;
    
    if (actualAge < 0) {
      return { valid: false, error: 'Date of birth cannot be in the future' };
    }
    
    if (actualAge > 120) {
      return { valid: false, error: 'Age cannot exceed 120 years' };
    }
    
    return { valid: true, age: actualAge };
  }

  // Sanitize input to prevent XSS
  sanitizeInput(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }

  // Validate care plan priority
  isValidCarePlanPriority(priority: string): boolean {
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'];
    return validPriorities.includes(priority.toUpperCase());
  }

  // Validate medication administration times
  isValidMedicationTime(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  // Validate file size for uploads
  isValidFileSize(sizeInBytes: number, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return sizeInBytes > 0 && sizeInBytes <= maxSizeBytes;
  }

  // Validate file type for document uploads
  isValidFileType(fileName: string, allowedTypes: string[] = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']): boolean {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    return fileExtension ? allowedTypes.includes(fileExtension) : false;
  }
}