import TouchID from 'react-native-touch-id';
import { Platform } from 'react-native';
import Keychain from 'react-native-keychain';
import DeviceInfo from 'react-native-device-info';
import CryptoJS from 'crypto-js';

export enum BiometricType {
  TOUCH_ID = 'TouchID',
  FACE_ID = 'FaceID',
  FINGERPRINT = 'Fingerprint',
  FACE = 'Face',
  IRIS = 'Iris',
  NONE = 'None'
}

export interface BiometricAuthResult {
  success: boolean;
  biometricType?: BiometricType;
  error?: string;
  token?: string;
}

export interface BiometricCapabilities {
  isAvailable: boolean;
  biometricType: BiometricType;
  isEnrolled: boolean;
  supportedTypes: BiometricType[];
}

export interface SecureStorageItem {
  key: string;
  value: string;
  biometricProtected: boolean;
  timestamp: Date;
}

export class BiometricService {
  private readonly SERVICE_NAME = 'WorkforceManagementApp';
  private readonly BIOMETRIC_TOKEN_KEY = 'biometric_auth_token';
  private authTokenCache: Map<string, { token: string; expiry: Date }> = new Map();

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      const capabilities = await this.getBiometricCapabilities();
      console.log('Biometric capabilities:', capabilities);
    } catch (error) {
      console.error('Error initializing biometric service:', error);
    }
  }

  // Biometric Capability Detection
  async getBiometricCapabilities(): Promise<BiometricCapabilities> {
    try {
      const biometricType = await TouchID.isSupported();
      const isAvailable = !!biometricType;
      
      let supportedTypes: BiometricType[] = [];
      let primaryType = BiometricType.NONE;

      if (isAvailable) {
        if (Platform.OS === 'ios') {
          switch (biometricType) {
            case 'FaceID':
              primaryType = BiometricType.FACE_ID;
              supportedTypes = [BiometricType.FACE_ID];
              break;
            case 'TouchID':
              primaryType = BiometricType.TOUCH_ID;
              supportedTypes = [BiometricType.TOUCH_ID];
              break;
            default:
              primaryType = BiometricType.TOUCH_ID;
              supportedTypes = [BiometricType.TOUCH_ID];
          }
        } else {
          // Android
          primaryType = BiometricType.FINGERPRINT;
          supportedTypes = [BiometricType.FINGERPRINT, BiometricType.FACE];
        }
      }

      return {
        isAvailable,
        biometricType: primaryType,
        isEnrolled: isAvailable, // TouchID.isSupported() already checks enrollment
        supportedTypes
      };
    } catch (error) {
      console.error('Error getting biometric capabilities:', error);
      return {
        isAvailable: false,
        biometricType: BiometricType.NONE,
        isEnrolled: false,
        supportedTypes: []
      };
    }
  }

  // Authentication Methods
  async authenticateUser(
    reason: string = 'Please authenticate to continue',
    options?: {
      fallbackLabel?: string;
      cancelLabel?: string;
      disableDeviceFallback?: boolean;
    }
  ): Promise<BiometricAuthResult> {
    try {
      const capabilities = await this.getBiometricCapabilities();
      
      if (!capabilities.isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device'
        };
      }

      const touchIdOptions = {
        title: 'Authentication Required',
        subtitle: reason,
        description: 'Use your biometric to authenticate',
        fallbackLabel: options?.fallbackLabel || 'Use Passcode',
        cancelLabel: options?.cancelLabel || 'Cancel',
        disableDeviceFallback: options?.disableDeviceFallback || false,
        imageColor: '#667eea',
        imageErrorColor: '#e74c3c',
        sensorDescription: 'Touch sensor',
        sensorErrorDescription: 'Failed',
        showErrorMessage: true,
        passcodeFallback: !options?.disableDeviceFallback
      };

      await TouchID.authenticate(reason, touchIdOptions);
      
      // Generate authentication token
      const authToken = await this.generateAuthToken();
      
      return {
        success: true,
        biometricType: capabilities.biometricType,
        token: authToken
      };

    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      
      let errorMessage = 'Authentication failed';
      
      if (error.name === 'UserCancel') {
        errorMessage = 'Authentication was cancelled';
      } else if (error.name === 'UserFallback') {
        errorMessage = 'User chose to use device passcode';
      } else if (error.name === 'BiometryNotAvailable') {
        errorMessage = 'Biometric authentication is not available';
      } else if (error.name === 'BiometryNotEnrolled') {
        errorMessage = 'No biometric data is enrolled';
      } else if (error.name === 'BiometryLockout') {
        errorMessage = 'Biometric authentication is locked out';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Quick authentication for frequent actions
  async quickAuthenticate(): Promise<BiometricAuthResult> {
    return this.authenticateUser('Quick authentication required', {
      disableDeviceFallback: true,
      cancelLabel: 'Cancel'
    });
  }

  // Sensitive data authentication
  async authenticateForSensitiveData(): Promise<BiometricAuthResult> {
    return this.authenticateUser(
      'Access to sensitive data requires biometric authentication',
      {
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel'
      }
    );
  }

  // Token Management
  private async generateAuthToken(): Promise<string> {
    const deviceId = await DeviceInfo.getUniqueId();
    const timestamp = Date.now();
    const randomBytes = Math.random().toString(36).substring(2, 15);
    
    const tokenData = {
      deviceId,
      timestamp,
      randomBytes,
      version: '1.0'
    };

    const token = CryptoJS.SHA256(JSON.stringify(tokenData)).toString();
    
    // Cache token with expiry (15 minutes)
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    this.authTokenCache.set(token, { token, expiry });
    
    return token;
  }

  async validateAuthToken(token: string): Promise<boolean> {
    const cachedToken = this.authTokenCache.get(token);
    
    if (!cachedToken) {
      return false;
    }

    if (new Date() > cachedToken.expiry) {
      this.authTokenCache.delete(token);
      return false;
    }

    return true;
  }

  async extendTokenExpiry(token: string): Promise<boolean> {
    const cachedToken = this.authTokenCache.get(token);
    
    if (!cachedToken) {
      return false;
    }

    // Extend by another 15 minutes
    const newExpiry = new Date(Date.now() + 15 * 60 * 1000);
    this.authTokenCache.set(token, { ...cachedToken, expiry: newExpiry });
    
    return true;
  }

  // Secure Storage with Biometric Protection
  async storeSecureData(
    key: string,
    data: any,
    biometricProtected: boolean = true
  ): Promise<boolean> {
    try {
      const serializedData = JSON.stringify({
        value: data,
        timestamp: new Date().toISOString(),
        biometricProtected
      });

      const options: Keychain.Options = {
        service: this.SERVICE_NAME,
        accessGroup: undefined,
        accessControl: biometricProtected 
          ? Keychain.ACCESS_CONTROL.BIOMETRY_ANY 
          : Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,
        authenticatePrompt: biometricProtected 
          ? 'Authenticate to access secure data'
          : undefined,
        showModal: true,
        kLocalizedFallbackTitle: 'Use Passcode'
      };

      await Keychain.setInternetCredentials(
        key,
        key,
        serializedData,
        options
      );

      return true;
    } catch (error) {
      console.error('Error storing secure data:', error);
      return false;
    }
  }

  async getSecureData(key: string): Promise<any | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(key, {
        showModal: true,
        promptMessage: 'Authenticate to access secure data'
      });

      if (!credentials || credentials === false) {
        return null;
      }

      const parsedData = JSON.parse(credentials.password);
      return parsedData.value;
    } catch (error) {
      console.error('Error retrieving secure data:', error);
      return null;
    }
  }

  async deleteSecureData(key: string): Promise<boolean> {
    try {
      await Keychain.resetInternetCredentials(key);
      return true;
    } catch (error) {
      console.error('Error deleting secure data:', error);
      return false;
    }
  }

  // Biometric Settings Management
  async storeBiometricPreference(enabled: boolean): Promise<void> {
    await this.storeSecureData('biometric_enabled', enabled, false);
  }

  async getBiometricPreference(): Promise<boolean> {
    const preference = await this.getSecureData('biometric_enabled');
    return preference !== null ? preference : true; // Default to enabled
  }

  // Employee Credentials Management
  async storeEmployeeCredentials(
    employeeId: string,
    credentials: {
      username: string;
      token: string;
      refreshToken?: string;
    }
  ): Promise<boolean> {
    return await this.storeSecureData(
      `employee_${employeeId}`,
      credentials,
      true
    );
  }

  async getEmployeeCredentials(employeeId: string): Promise<any | null> {
    return await this.getSecureData(`employee_${employeeId}`);
  }

  async clearEmployeeCredentials(employeeId: string): Promise<boolean> {
    return await this.deleteSecureData(`employee_${employeeId}`);
  }

  // Payroll Data Protection
  async storePayrollData(
    employeeId: string,
    payrollData: any
  ): Promise<boolean> {
    return await this.storeSecureData(
      `payroll_${employeeId}`,
      payrollData,
      true // Always require biometric for payroll data
    );
  }

  async getPayrollData(employeeId: string): Promise<any | null> {
    return await this.getSecureData(`payroll_${employeeId}`);
  }

  // Time Entry Protection
  async storeTimeEntryDraft(
    employeeId: string,
    timeEntryData: any
  ): Promise<boolean> {
    return await this.storeSecureData(
      `time_draft_${employeeId}`,
      timeEntryData,
      false // Less sensitive, don't require biometric
    );
  }

  async getTimeEntryDraft(employeeId: string): Promise<any | null> {
    return await this.getSecureData(`time_draft_${employeeId}`);
  }

  // Security Utilities
  async checkDeviceIntegrity(): Promise<{
    isSecure: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    let isSecure = true;

    try {
      // Check if device is jailbroken/rooted
      const isEmulator = await DeviceInfo.isEmulator();
      if (isEmulator) {
        issues.push('Running on emulator');
        isSecure = false;
      }

      // Check biometric capability
      const capabilities = await this.getBiometricCapabilities();
      if (!capabilities.isAvailable) {
        issues.push('Biometric authentication not available');
      }

      // Check if device has screen lock
      // Note: This would require additional native modules in a real implementation
      
      return { isSecure, issues };
    } catch (error) {
      console.error('Error checking device integrity:', error);
      return {
        isSecure: false,
        issues: ['Unable to verify device security']
      };
    }
  }

  async generateSecurePin(): Promise<string> {
    // Generate a 6-digit secure PIN
    const array = new Uint32Array(6);
    const crypto = require('crypto');
    crypto.getRandomValues(array);
    
    return Array.from(array)
      .map(x => (x % 10).toString())
      .join('');
  }

  // Session Management
  async createSecureSession(
    employeeId: string,
    biometricToken: string
  ): Promise<string> {
    const sessionData = {
      employeeId,
      biometricToken,
      timestamp: Date.now(),
      deviceId: await DeviceInfo.getUniqueId(),
      sessionId: CryptoJS.lib.WordArray.random(128/8).toString()
    };

    const sessionToken = CryptoJS.SHA256(JSON.stringify(sessionData)).toString();
    
    // Store session securely
    await this.storeSecureData(
      `session_${sessionToken}`,
      sessionData,
      true
    );

    return sessionToken;
  }

  async validateSession(sessionToken: string): Promise<boolean> {
    try {
      const sessionData = await this.getSecureData(`session_${sessionToken}`);
      
      if (!sessionData) {
        return false;
      }

      // Check if session is expired (24 hours)
      const sessionAge = Date.now() - sessionData.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (sessionAge > maxAge) {
        await this.deleteSecureData(`session_${sessionToken}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }

  async clearSession(sessionToken: string): Promise<void> {
    await this.deleteSecureData(`session_${sessionToken}`);
  }

  // Cleanup Methods
  async clearAllSecureData(): Promise<void> {
    try {
      await Keychain.resetGenericPassword();
      this.authTokenCache.clear();
    } catch (error) {
      console.error('Error clearing secure data:', error);
    }
  }

  async clearExpiredTokens(): Promise<void> {
    const now = new Date();
    for (const [token, data] of this.authTokenCache.entries()) {
      if (now > data.expiry) {
        this.authTokenCache.delete(token);
      }
    }
  }

  // Utility Methods
  getBiometricTypeDisplayName(type: BiometricType): string {
    switch (type) {
      case BiometricType.TOUCH_ID:
        return 'Touch ID';
      case BiometricType.FACE_ID:
        return 'Face ID';
      case BiometricType.FINGERPRINT:
        return 'Fingerprint';
      case BiometricType.FACE:
        return 'Face Recognition';
      case BiometricType.IRIS:
        return 'Iris Recognition';
      default:
        return 'Biometric Authentication';
    }
  }

  async isAuthenticationRequired(
    feature: string,
    lastAuthTime?: Date
  ): Promise<boolean> {
    // Define features that always require authentication
    const alwaysRequireAuth = [
      'payroll_access',
      'sensitive_data',
      'admin_functions'
    ];

    if (alwaysRequireAuth.includes(feature)) {
      return true;
    }

    // Check if recent authentication exists (within last 15 minutes)
    if (lastAuthTime) {
      const timeSinceAuth = Date.now() - lastAuthTime.getTime();
      const authValidityPeriod = 15 * 60 * 1000; // 15 minutes
      
      if (timeSinceAuth < authValidityPeriod) {
        return false;
      }
    }

    return true;
  }
}

export default BiometricService;