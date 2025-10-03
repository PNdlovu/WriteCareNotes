import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SecurityComplianceService } from '../../../src/services/security/SecurityComplianceService';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('SecurityComplianceService', () => {
  let service: SecurityComplianceService;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    mockEventEmitter = {
      emit: jest.fn(),
    } as any;

    service = new SecurityComplianceService(mockEventEmitter);
  });

  describe('logSecurityEvent', () => {
    it('should log security events successfully', async () => {
      const eventData = {
        userId: 'user-123',
        eventType: 'LOGIN_ATTEMPT',
        entityType: 'User',
        entityId: 'user-123',
        details: { ip: '192.168.1.1', userAgent: 'Mozilla/5.0' },
        riskLevel: 'LOW' as const,
        complianceFrameworks: ['GDPR', 'ISO27001'],
      };

      const result = await service.logSecurityEvent(eventData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(eventData.userId);
      expect(result.eventType).toBe(eventData.eventType);
      expect(result.riskLevel).toBe(eventData.riskLevel);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('security.event.logged', expect.any(Object));
    });

    it('should handle high-risk events', async () => {
      const eventData = {
        userId: 'user-123',
        eventType: 'UNAUTHORIZED_ACCESS',
        entityType: 'Patient',
        entityId: 'patient-456',
        details: { ip: '192.168.1.100', attemptedResource: '/api/patients' },
        riskLevel: 'HIGH' as const,
        complianceFrameworks: ['GDPR', 'HIPAA'],
      };

      const result = await service.logSecurityEvent(eventData);

      expect(result).toBeDefined();
      expect(result.riskLevel).toBe('HIGH');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('security.high.risk.event', expect.any(Object));
    });
  });

  describe('processDataSubjectRequest', () => {
    it('should process GDPR data subject requests', async () => {
      const request = {
        requestType: 'ACCESS' as const,
        dataSubjectId: 'resident-123',
        requestedBy: 'user-456',
        details: { reason: 'Data access request' },
      };

      const result = await service.processDataSubjectRequest(request);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.requestType).toBe(request.requestType);
      expect(result.dataSubjectId).toBe(request.dataSubjectId);
      expect(result.status).toBe('PROCESSING');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('gdpr.request.processed', expect.any(Object));
    });

    it('should handle data deletion requests', async () => {
      const request = {
        requestType: 'DELETION' as const,
        dataSubjectId: 'resident-123',
        requestedBy: 'user-456',
        details: { reason: 'Right to be forgotten' },
      };

      const result = await service.processDataSubjectRequest(request);

      expect(result).toBeDefined();
      expect(result.requestType).toBe('DELETION');
      expect(result.status).toBe('PROCESSING');
    });
  });

  describe('reportSecurityIncident', () => {
    it('should report security incidents', async () => {
      const incident = {
        incidentType: 'DATA_BREACH' as const,
        severity: 'HIGH' as const,
        description: 'Unauthorized access to patient data',
        reportedBy: 'user-123',
        affectedSystems: ['database', 'api'],
        details: { affectedRecords: 100, breachType: 'unauthorized_access' },
      };

      const result = await service.reportSecurityIncident(incident);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.incidentType).toBe(incident.incidentType);
      expect(result.severity).toBe(incident.severity);
      expect(result.status).toBe('REPORTED');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('security.incident.reported', expect.any(Object));
    });

    it('should handle critical incidents', async () => {
      const incident = {
        incidentType: 'MALWARE_DETECTED' as const,
        severity: 'CRITICAL' as const,
        description: 'Malware detected on server',
        reportedBy: 'system',
        affectedSystems: ['server-01'],
        details: { malwareType: 'ransomware', affectedFiles: 1000 },
      };

      const result = await service.reportSecurityIncident(incident);

      expect(result).toBeDefined();
      expect(result.severity).toBe('CRITICAL');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('security.critical.incident', expect.any(Object));
    });
  });

  describe('checkComplianceStatus', () => {
    it('should check GDPR compliance status', async () => {
      const result = await service.checkComplianceStatus('GDPR');

      expect(result).toBeDefined();
      expect(result.framework).toBe('GDPR');
      expect(result.status).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.violations).toBeDefined();
      expect(Array.isArray(result.violations)).toBe(true);
    });

    it('should check ISO 27001 compliance status', async () => {
      const result = await service.checkComplianceStatus('ISO27001');

      expect(result).toBeDefined();
      expect(result.framework).toBe('ISO27001');
      expect(result.status).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('getComplianceReport', () => {
    it('should generate compliance reports', async () => {
      const result = await service.getComplianceReport({
        frameworks: ['GDPR', 'ISO27001'],
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      expect(result).toBeDefined();
      expect(result.reportId).toBeDefined();
      expect(result.frameworks).toEqual(['GDPR', 'ISO27001']);
      expect(result.generatedAt).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.details).toBeDefined();
    });
  });

  describe('encryptSensitiveData', () => {
    it('should encrypt sensitive data', async () => {
      const data = {
        field: 'sensitive-information',
        value: 'patient-medical-data',
      };

      const result = await service.encryptSensitiveData(data);

      expect(result).toBeDefined();
      expect(result.encryptedValue).toBeDefined();
      expect(result.encryptedValue).not.toBe(data.value);
      expect(result.encryptionKey).toBeDefined();
      expect(result.algorithm).toBeDefined();
    });
  });

  describe('decryptSensitiveData', () => {
    it('should decrypt sensitive data', async () => {
      const data = {
        field: 'sensitive-information',
        value: 'patient-medical-data',
      };

      const encrypted = await service.encryptSensitiveData(data);
      const decrypted = await service.decryptSensitiveData({
        encryptedValue: encrypted.encryptedValue,
        encryptionKey: encrypted.encryptionKey,
        algorithm: encrypted.algorithm,
      });

      expect(decrypted).toBe(data.value);
    });
  });

  describe('detectAnomalies', () => {
    it('should detect security anomalies', async () => {
      const data = {
        userId: 'user-123',
        activity: 'LOGIN',
        timestamp: new Date(),
        metadata: { ip: '192.168.1.1', location: 'London' },
      };

      const result = await service.detectAnomalies(data);

      expect(result).toBeDefined();
      expect(result.isAnomaly).toBeDefined();
      expect(typeof result.isAnomaly).toBe('boolean');
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
      if (result.isAnomaly) {
        expect(result.reasons).toBeDefined();
        expect(Array.isArray(result.reasons)).toBe(true);
      }
    });
  });

  describe('getSecurityMetrics', () => {
    it('should return security metrics', async () => {
      const result = await service.getSecurityMetrics();

      expect(result).toBeDefined();
      expect(result.totalEvents).toBeGreaterThanOrEqual(0);
      expect(result.highRiskEvents).toBeGreaterThanOrEqual(0);
      expect(result.criticalIncidents).toBeGreaterThanOrEqual(0);
      expect(result.complianceScore).toBeGreaterThanOrEqual(0);
      expect(result.complianceScore).toBeLessThanOrEqual(100);
      expect(result.lastUpdated).toBeDefined();
    });
  });

  describe('auditDataAccess', () => {
    it('should audit data access', async () => {
      const accessData = {
        userId: 'user-123',
        resourceType: 'Patient',
        resourceId: 'patient-456',
        action: 'READ',
        timestamp: new Date(),
        metadata: { ip: '192.168.1.1' },
      };

      const result = await service.auditDataAccess(accessData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(accessData.userId);
      expect(result.resourceType).toBe(accessData.resourceType);
      expect(result.action).toBe(accessData.action);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('security.access.audited', expect.any(Object));
    });
  });
});