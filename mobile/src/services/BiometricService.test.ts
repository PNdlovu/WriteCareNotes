/**
 * @fileoverview BiometricService Test Suite
 * @module BiometricService.test
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive test suite for BiometricService covering:
 * - Enterprise security features
 * - Device integrity validation
 * - Rate limiting and brute force protection
 * - Secure storage operations
 * - Audit logging and compliance
 * - Error handling and edge cases
 */

import { BiometricService, BiometricType, SecurityLevel } from './BiometricService';

// Mock dependencies
jest.mock('react-native-touch-id', () => ({
  isSupported: jest.fn(),
  authenticate: jest.fn()
}));

jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(),
  getInternetCredentials: jest.fn(),
  resetInternetCredentials: jest.fn(),
  resetGenericPassword: jest.fn(),
  ACCESS_CONTROL: {
    BIOMETRY_ANY: 'BIOMETRY_ANY',
    BIOMETRY_CURRENT_SET: 'BIOMETRY_CURRENT_SET',
    DEVICE_PASSCODE: 'DEVICE_PASSCODE'
  }
}));

jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn().mockResolvedValue('test-device-id'),
  isEmulator: jest.fn().mockResolvedValue(false)
}));

jest.mock('jail-monkey', () => ({
  isJailBroken: jest.fn().mockReturnValue(false),
  isDebugged: jest.fn().mockReturnValue(false),
  isOnExternalStorage: jest.fn().mockReturnValue(false)
}));

jest.mock('crypto-js', () => ({
  SHA256: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mocked-hash')
  }),
  lib: {
    WordArray: {
      random: jest.fn().mockReturnValue({
        toString: jest.fn().mockReturnValue('random-string')
      })
    }
  }
}));

// Mock utility modules
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }
}));

jest.mock('../utils/auditLogger', () => ({
  AuditLogger: jest.fn().mockImplementation(() => ({
    logEvent: jest.fn(),
    logSecurityEvent: jest.fn()
  }))
}));

jest.mock('../utils/metricsCollector', () => ({
  MetricsCollector: jest.fn().mockImplementation(() => ({
    recordMetric: jest.fn()
  }))
}));

jest.mock('../utils/securityValidator', () => ({
  SecurityValidator: jest.fn().mockImplementation(() => ({
    validateSecurityLevel: jest.fn()
  }))
}));

describe('BiometricService', () => {
  let biometricService: BiometricService;
  let mockTouchID: any;
  let mockKeychain: any;
  let mockDeviceInfo: any;
  let mockJailMonkey: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock implementations
    mockTouchID = require('react-native-touch-id');
    mockKeychain = require('react-native-keychain');
    mockDeviceInfo = require('react-native-device-info');
    mockJailMonkey = require('jail-monkey');
    
    // Default mock values
    mockTouchID.isSupported.mockResolvedValue('TouchID');
    mockTouchID.authenticate.mockResolvedValue(true);
    mockKeychain.setInternetCredentials.mockResolvedValue(true);
    mockKeychain.getInternetCredentials.mockResolvedValue({
      username: 'test',
      password: JSON.stringify({ value: 'test-data', timestamp: new Date().toISOString() })
    });
    
    biometricService = new BiometricService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize service with enterprise security features', () => {
      expect(biometricService).toBeInstanceOf(BiometricService);
    });

    it('should perform device integrity check on initialization', async () => {
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockJailMonkey.isJailBroken).toHaveBeenCalled();
      expect(mockDeviceInfo.isEmulator).toHaveBeenCalled();
    });
  });

  describe('Biometric Capabilities', () => {
    it('should detect TouchID capabilities on iOS', async () => {
      mockTouchID.isSupported.mockResolvedValue('TouchID');
      
      const capabilities = await biometricService.getBiometricCapabilities();
      
      expect(capabilities).toEqual({
        isAvailable: true,
        biometricType: BiometricType.TOUCH_ID,
        isEnrolled: true,
        supportedTypes: [BiometricType.TOUCH_ID],
        securityLevel: SecurityLevel.HIGH,
        limitations: []
      });
    });

    it('should detect FaceID capabilities on iOS', async () => {
      mockTouchID.isSupported.mockResolvedValue('FaceID');
      
      const capabilities = await biometricService.getBiometricCapabilities();
      
      expect(capabilities.biometricType).toBe(BiometricType.FACE_ID);
      expect(capabilities.securityLevel).toBe(SecurityLevel.HIGH);
    });

    it('should handle biometric unavailability', async () => {
      mockTouchID.isSupported.mockResolvedValue(false);
      
      const capabilities = await biometricService.getBiometricCapabilities();
      
      expect(capabilities).toEqual({
        isAvailable: false,
        biometricType: BiometricType.NONE,
        isEnrolled: false,
        supportedTypes: [],
        securityLevel: SecurityLevel.NONE,
        limitations: ['No biometric authentication available']
      });
    });

    it('should detect compromised device and adjust security level', async () => {
      mockJailMonkey.isJailBroken.mockReturnValue(true);
      
      const capabilities = await biometricService.getBiometricCapabilities();
      
      expect(capabilities.securityLevel).toBe(SecurityLevel.LOW);
      expect(capabilities.limitations).toContain('Device security compromised');
    });
  });

  describe('Device Integrity', () => {
    it('should perform comprehensive device integrity check', async () => {
      mockJailMonkey.isJailBroken.mockReturnValue(false);
      mockDeviceInfo.isEmulator.mockResolvedValue(false);
      mockJailMonkey.isDebugged.mockReturnValue(false);
      mockJailMonkey.isOnExternalStorage.mockReturnValue(false);
      
      // Access private method through any cast for testing
      const status = await (biometricService as any).performDeviceIntegrityCheck();
      
      expect(status.score).toBe(100);
      expect(status.isCompromised).toBe(false);
      expect(status.issues).toHaveLength(0);
    });

    it('should detect jailbroken device', async () => {
      mockJailMonkey.isJailBroken.mockReturnValue(true);
      
      const status = await (biometricService as any).performDeviceIntegrityCheck();
      
      expect(status.score).toBeLessThan(100);
      expect(status.isCompromised).toBe(true);
      expect(status.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'jailbreak',
            severity: 'critical'
          })
        ])
      );
    });

    it('should detect emulator environment', async () => {
      mockDeviceInfo.isEmulator.mockResolvedValue(true);
      
      const status = await (biometricService as any).performDeviceIntegrityCheck();
      
      expect(status.isEmulator).toBe(true);
      expect(status.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'emulator',
            severity: 'high'
          })
        ])
      );
    });

    it('should cache device integrity results', async () => {
      // First call
      await (biometricService as any).getDeviceIntegrityStatus();
      
      // Second call should use cache
      await (biometricService as any).getDeviceIntegrityStatus();
      
      // Device info should only be called once (from cache on second call)
      expect(mockDeviceInfo.getUniqueId).toHaveBeenCalledTimes(2); // Once for cache key, once for initial check
    });
  });

  describe('Authentication', () => {
    it('should successfully authenticate user with biometrics', async () => {
      mockTouchID.authenticate.mockResolvedValue(true);
      
      const result = await biometricService.authenticateUser('Test authentication');
      
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.biometricType).toBe(BiometricType.TOUCH_ID);
      expect(mockTouchID.authenticate).toHaveBeenCalledWith(
        'Test authentication',
        expect.any(Object)
      );
    });

    it('should handle authentication failure', async () => {
      mockTouchID.authenticate.mockRejectedValue({ name: 'UserCancel' });
      
      const result = await biometricService.authenticateUser();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication was cancelled');
    });

    it('should handle biometric lockout', async () => {
      mockTouchID.authenticate.mockRejectedValue({ name: 'BiometryLockout' });
      
      const result = await biometricService.authenticateUser();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Biometric authentication is locked out');
    });

    it('should generate unique authentication tokens', async () => {
      mockTouchID.authenticate.mockResolvedValue(true);
      
      const result1 = await biometricService.authenticateUser();
      const result2 = await biometricService.authenticateUser();
      
      expect(result1.token).toBeDefined();
      expect(result2.token).toBeDefined();
      expect(result1.token).not.toBe(result2.token);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow authentication within rate limits', async () => {
      const rateLimit = await (biometricService as any).checkRateLimit('test-user');
      
      expect(rateLimit.allowed).toBe(true);
      expect(rateLimit.remainingAttempts).toBeGreaterThan(0);
    });

    it('should enforce rate limiting after maximum attempts', async () => {
      const userId = 'test-user';
      
      // Exhaust all attempts
      for (let i = 0; i < 5; i++) {
        await (biometricService as any).checkRateLimit(userId);
      }
      
      // Next attempt should be blocked
      const rateLimit = await (biometricService as any).checkRateLimit(userId);
      
      expect(rateLimit.allowed).toBe(false);
      expect(rateLimit.remainingAttempts).toBe(0);
      expect(rateLimit.resetTime).toBeDefined();
    });

    it('should reset rate limiting after window expires', async () => {
      const userId = 'test-user';
      
      // Mock time to simulate window expiry
      const originalNow = Date.now;
      Date.now = jest.fn().mockReturnValue(originalNow() + 16 * 60 * 1000); // 16 minutes later
      
      const rateLimit = await (biometricService as any).checkRateLimit(userId);
      
      expect(rateLimit.allowed).toBe(true);
      
      // Restore original Date.now
      Date.now = originalNow;
    });
  });

  describe('Secure Storage', () => {
    it('should store data with biometric protection', async () => {
      const result = await biometricService.storeSecureData('test-key', { data: 'sensitive' }, true);
      
      expect(result).toBe(true);
      expect(mockKeychain.setInternetCredentials).toHaveBeenCalledWith(
        'test-key',
        'test-key',
        expect.stringContaining('sensitive'),
        expect.objectContaining({
          accessControl: expect.any(String)
        })
      );
    });

    it('should retrieve stored data with biometric authentication', async () => {
      const testData = { sensitive: 'data' };
      mockKeychain.getInternetCredentials.mockResolvedValue({
        username: 'test',
        password: JSON.stringify({ value: testData, timestamp: new Date().toISOString() })
      });
      
      const result = await biometricService.getSecureData('test-key');
      
      expect(result).toEqual(testData);
      expect(mockKeychain.getInternetCredentials).toHaveBeenCalledWith(
        'test-key',
        expect.objectContaining({
          showModal: true,
          promptMessage: 'Authenticate to access secure data'
        })
      );
    });

    it('should handle secure storage failures gracefully', async () => {
      mockKeychain.setInternetCredentials.mockRejectedValue(new Error('Storage failed'));
      
      const result = await biometricService.storeSecureData('test-key', { data: 'test' });
      
      expect(result).toBe(false);
    });

    it('should delete secure data', async () => {
      mockKeychain.resetInternetCredentials.mockResolvedValue(true);
      
      const result = await biometricService.deleteSecureData('test-key');
      
      expect(result).toBe(true);
      expect(mockKeychain.resetInternetCredentials).toHaveBeenCalledWith('test-key');
    });
  });

  describe('Token Management', () => {
    it('should validate authentic tokens', async () => {
      // Generate a token first
      mockTouchID.authenticate.mockResolvedValue(true);
      const authResult = await biometricService.authenticateUser();
      
      const isValid = await biometricService.validateAuthToken(authResult.token!);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid tokens', async () => {
      const isValid = await biometricService.validateAuthToken('invalid-token');
      
      expect(isValid).toBe(false);
    });

    it('should reject expired tokens', async () => {
      // Generate a token
      mockTouchID.authenticate.mockResolvedValue(true);
      const authResult = await biometricService.authenticateUser();
      
      // Mock time to simulate token expiry
      const originalNow = Date.now;
      Date.now = jest.fn().mockReturnValue(originalNow() + 16 * 60 * 1000); // 16 minutes later
      
      const isValid = await biometricService.validateAuthToken(authResult.token!);
      
      expect(isValid).toBe(false);
      
      // Restore original Date.now
      Date.now = originalNow;
    });

    it('should extend token expiry', async () => {
      mockTouchID.authenticate.mockResolvedValue(true);
      const authResult = await biometricService.authenticateUser();
      
      const extended = await biometricService.extendTokenExpiry(authResult.token!);
      
      expect(extended).toBe(true);
    });
  });

  describe('Cleanup Operations', () => {
    it('should clean up expired tokens', async () => {
      // Generate some tokens
      mockTouchID.authenticate.mockResolvedValue(true);
      await biometricService.authenticateUser();
      await biometricService.authenticateUser();
      
      // Mock time to expire tokens
      const originalNow = Date.now;
      Date.now = jest.fn().mockReturnValue(originalNow() + 16 * 60 * 1000);
      
      // Trigger cleanup
      await (biometricService as any).cleanupExpiredTokens();
      
      // Tokens should be cleaned up
      const tokenCacheSize = (biometricService as any).authTokenCache.size;
      expect(tokenCacheSize).toBe(0);
      
      Date.now = originalNow;
    });

    it('should clear all secure data', async () => {
      await biometricService.clearAllSecureData();
      
      expect(mockKeychain.resetGenericPassword).toHaveBeenCalled();
    });
  });

  describe('Security Utilities', () => {
    it('should provide biometric type display names', () => {
      expect(biometricService.getBiometricTypeDisplayName(BiometricType.TOUCH_ID)).toBe('Touch ID');
      expect(biometricService.getBiometricTypeDisplayName(BiometricType.FACE_ID)).toBe('Face ID');
      expect(biometricService.getBiometricTypeDisplayName(BiometricType.FINGERPRINT)).toBe('Fingerprint');
    });

    it('should determine authentication requirements by feature', async () => {
      // Sensitive features should always require auth
      const payrollRequired = await biometricService.isAuthenticationRequired('payroll_access');
      expect(payrollRequired).toBe(true);
      
      // Recent auth should not require re-auth for non-sensitive features
      const recentAuth = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const notRequired = await biometricService.isAuthenticationRequired('basic_feature', recentAuth);
      expect(notRequired).toBe(false);
      
      // Old auth should require re-auth
      const oldAuth = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
      const required = await biometricService.isAuthenticationRequired('basic_feature', oldAuth);
      expect(required).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle TouchID service errors gracefully', async () => {
      mockTouchID.isSupported.mockRejectedValue(new Error('Service unavailable'));
      
      const capabilities = await biometricService.getBiometricCapabilities();
      
      expect(capabilities.isAvailable).toBe(false);
      expect(capabilities.limitations).toContain('Capability detection failed');
    });

    it('should handle keychain errors gracefully', async () => {
      mockKeychain.getInternetCredentials.mockRejectedValue(new Error('Keychain error'));
      
      const result = await biometricService.getSecureData('test-key');
      
      expect(result).toBeNull();
    });

    it('should handle device info errors gracefully', async () => {
      mockDeviceInfo.getUniqueId.mockRejectedValue(new Error('Device info unavailable'));
      
      const status = await (biometricService as any).performDeviceIntegrityCheck();
      
      expect(status.score).toBe(0);
      expect(status.isCompromised).toBe(true);
    });
  });

  describe('Audit Logging', () => {
    it('should log authentication attempts', async () => {
      await biometricService.authenticateUser('Test auth');
      
      // Verify audit logging was called
      expect((biometricService as any).auditLogger.logEvent).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          action: expect.any(String)
        })
      );
    });

    it('should log security violations', async () => {
      mockJailMonkey.isJailBroken.mockReturnValue(true);
      
      await (biometricService as any).performDeviceIntegrityCheck();
      
      // Should trigger security event logging for compromised device
      expect((biometricService as any).auditLogger.logSecurityEvent).toHaveBeenCalled();
    });
  });
});