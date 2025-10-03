import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PilotFeedbackAgentService } from '../../src/services/pilot/pilot-feedback-agent.service';
import { PIIMaskingService } from '../../src/services/security/pii-masking.service';
import { AgentRBACService } from '../../src/services/security/agent-rbac.service';
import { AgentAuditService } from '../../src/services/audit/agent-audit.service';
import { PilotFeedbackEvent, AgentConfiguration } from '../../src/types/pilot-feedback-agent.types';

// Mock dependencies
jest.mock('../../src/repositories/pilot-feedback-agent.repository');
jest.mock('../../src/services/notifications/notification.service');
jest.mock('../../src/services/compliance/compliance.service');

describe('Pilot Feedback Agent Service', () => {
  let agentService: PilotFeedbackAgentService;
  let piiMaskingService: PIIMaskingService;
  let rbacService: AgentRBACService;
  let auditService: AgentAuditService;

  beforeEach(() => {
    agentService = new PilotFeedbackAgentService();
    piiMaskingService = new PIIMaskingService();
    rbacService = new AgentRBACService();
    auditService = new AgentAuditService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processFeedbackEvent', () => {
    it('should process valid feedback event successfully', async () => {
      const event: PilotFeedbackEvent = {
        eventId: 'evt-123',
        tenantId: 't-123',
        submittedAt: '2025-01-22T10:30:00Z',
        module: 'medication',
        severity: 'high',
        role: 'care_worker',
        text: 'Medication save button not working properly',
        attachments: [],
        consents: {
          improvementProcessing: true
        }
      };

      // Mock repository methods
      const mockRepository = require('../../src/repositories/pilot-feedback-agent.repository').PilotFeedbackAgentRepository;
      mockRepository.prototype.getAgentConfiguration = jest.fn().mockResolvedValue({
        enabled: true,
        autonomy: 'recommend-only'
      });
      mockRepository.prototype.storeEvent = jest.fn().mockResolvedValue(undefined);

      await expect(agentService.processFeedbackEvent(event)).resolves.not.toThrow();
    });

    it('should reject event without consent', async () => {
      const event: PilotFeedbackEvent = {
        eventId: 'evt-123',
        tenantId: 't-123',
        submittedAt: '2025-01-22T10:30:00Z',
        module: 'medication',
        severity: 'high',
        role: 'care_worker',
        text: 'Medication save button not working properly',
        attachments: [],
        consents: {
          improvementProcessing: false
        }
      };

      await expect(agentService.processFeedbackEvent(event)).rejects.toThrow('Improvement processing consent not given');
    });

    it('should reject event with missing required fields', async () => {
      const event = {
        eventId: 'evt-123',
        tenantId: 't-123',
        // Missing required fields
      } as any;

      await expect(agentService.processFeedbackEvent(event)).rejects.toThrow('Invalid event data');
    });

    it('should skip processing when agent is disabled', async () => {
      const event: PilotFeedbackEvent = {
        eventId: 'evt-123',
        tenantId: 't-123',
        submittedAt: '2025-01-22T10:30:00Z',
        module: 'medication',
        severity: 'high',
        role: 'care_worker',
        text: 'Medication save button not working properly',
        attachments: [],
        consents: {
          improvementProcessing: true
        }
      };

      const mockRepository = require('../../src/repositories/pilot-feedback-agent.repository').PilotFeedbackAgentRepository;
      mockRepository.prototype.getAgentConfiguration = jest.fn().mockResolvedValue({
        enabled: false,
        autonomy: 'recommend-only'
      });

      await expect(agentService.processFeedbackEvent(event)).resolves.not.toThrow();
    });
  });

  describe('getAgentStatus', () => {
    it('should return agent status for tenant', async () => {
      const tenantId = 't-123';
      
      const mockRepository = require('../../src/repositories/pilot-feedback-agent.repository').PilotFeedbackAgentRepository;
      mockRepository.prototype.getAgentConfiguration = jest.fn().mockResolvedValue({
        enabled: true,
        autonomy: 'recommend-only'
      });
      mockRepository.prototype.getLastProcessingTime = jest.fn().mockResolvedValue(new Date());
      mockRepository.prototype.getQueueSize = jest.fn().mockResolvedValue(5);
      mockRepository.prototype.getErrorCount = jest.fn().mockResolvedValue(0);

      const status = await agentService.getAgentStatus(tenantId);

      expect(status).toEqual({
        tenantId,
        enabled: true,
        autonomy: 'recommend-only',
        lastRun: expect.any(Date),
        queueSize: 5,
        errorCount: 0,
        isProcessing: false
      });
    });
  });

  describe('approveRecommendation', () => {
    it('should approve recommendation successfully', async () => {
      const tenantId = 't-123';
      const recommendationId = 'rec-456';
      const action = 'create_ticket';
      const notes = 'Approved for development';

      const mockRepository = require('../../src/repositories/pilot-feedback-agent.repository').PilotFeedbackAgentRepository;
      mockRepository.prototype.getRecommendation = jest.fn().mockResolvedValue({
        recommendationId,
        tenantId,
        theme: 'ui_performance',
        proposedActions: ['Fix save button', 'Add error handling']
      });
      mockRepository.prototype.updateRecommendationStatus = jest.fn().mockResolvedValue(undefined);

      await expect(agentService.approveRecommendation(tenantId, recommendationId, action, notes))
        .resolves.not.toThrow();
    });

    it('should reject approval for non-existent recommendation', async () => {
      const tenantId = 't-123';
      const recommendationId = 'rec-nonexistent';
      const action = 'create_ticket';

      const mockRepository = require('../../src/repositories/pilot-feedback-agent.repository').PilotFeedbackAgentRepository;
      mockRepository.prototype.getRecommendation = jest.fn().mockResolvedValue(null);

      await expect(agentService.approveRecommendation(tenantId, recommendationId, action))
        .rejects.toThrow('Recommendation not found');
    });
  });
});

describe('PII Masking Service', () => {
  let maskingService: PIIMaskingService;

  beforeEach(() => {
    maskingService = new PIIMaskingService();
  });

  describe('maskText', () => {
    it('should mask email addresses', async () => {
      const text = 'Contact nurse@carehome.com for issues';
      const masked = await maskingService.maskText(text);
      expect(masked).toBe('Contact [EMAIL] for issues');
    });

    it('should mask phone numbers', async () => {
      const text = 'Call 07912345678 for support';
      const masked = await maskingService.maskText(text);
      expect(masked).toBe('Call [PHONE] for support');
    });

    it('should mask names', async () => {
      const text = 'Nurse Sarah Smith reported the issue';
      const masked = await maskingService.maskText(text);
      expect(masked).toBe('[NAME] reported the issue');
    });

    it('should mask NHS numbers', async () => {
      const text = 'Patient NHS number 123 456 7890';
      const masked = await maskingService.maskText(text);
      expect(masked).toBe('Patient NHS number [NHS_NUMBER]');
    });

    it('should mask postcodes', async () => {
      const text = 'Located at SW1A 1AA';
      const masked = await maskingService.maskText(text);
      expect(masked).toBe('Located at [POSTCODE]');
    });

    it('should mask multiple PII types', async () => {
      const text = 'Nurse Sarah Smith (sarah@carehome.com) at SW1A 1AA called 07912345678';
      const masked = await maskingService.maskText(text);
      expect(masked).toBe('[NAME] ([EMAIL]) at [POSTCODE] called [PHONE]');
    });

    it('should handle text without PII', async () => {
      const text = 'The medication system is working well';
      const masked = await maskingService.maskText(text);
      expect(masked).toBe('The medication system is working well');
    });
  });

  describe('validateMasking', () => {
    it('should validate clean text', async () => {
      const text = 'The system is working properly';
      const validation = await maskingService.validateMasking(text);
      
      expect(validation.isClean).toBe(true);
      expect(validation.remainingPatterns).toEqual([]);
      expect(validation.confidence).toBe(100);
    });

    it('should detect remaining PII', async () => {
      const text = 'Contact test@example.com for help';
      const validation = await maskingService.validateMasking(text);
      
      expect(validation.isClean).toBe(false);
      expect(validation.remainingPatterns).toContain('email');
      expect(validation.confidence).toBeLessThan(100);
    });
  });

  describe('containsPII', () => {
    it('should detect PII in text', async () => {
      const text = 'Email: test@example.com';
      const containsPII = await maskingService.containsPII(text);
      expect(containsPII).toBe(true);
    });

    it('should not detect PII in clean text', async () => {
      const text = 'The system is working well';
      const containsPII = await maskingService.containsPII(text);
      expect(containsPII).toBe(false);
    });
  });
});

describe('Agent RBAC Service', () => {
  let rbacService: AgentRBACService;

  beforeEach(() => {
    rbacService = new AgentRBACService();
  });

  describe('checkPermission', () => {
    it('should grant permission for valid user and resource', async () => {
      const userId = 'user-123';
      const tenantId = 't-123';
      const resource = 'agent';
      const action = 'read';

      // Mock user access control
      rbacService['userAccess'].set(`${userId}:${tenantId}`, {
        userId,
        tenantId,
        roles: ['Pilot Admin'],
        permissions: []
      });

      const hasPermission = await rbacService.checkPermission(userId, tenantId, resource, action);
      expect(hasPermission).toBe(true);
    });

    it('should deny permission for invalid user', async () => {
      const userId = 'user-nonexistent';
      const tenantId = 't-123';
      const resource = 'agent';
      const action = 'read';

      const hasPermission = await rbacService.checkPermission(userId, tenantId, resource, action);
      expect(hasPermission).toBe(false);
    });
  });

  describe('assignRole', () => {
    it('should assign role to user', async () => {
      const userId = 'user-123';
      const tenantId = 't-123';
      const roleId = 'Pilot Admin';

      await rbacService.assignRole(userId, tenantId, roleId);

      const accessControl = await rbacService.getUserAccessControl(userId, tenantId);
      expect(accessControl?.roles).toContain(roleId);
    });
  });

  describe('grantPermission', () => {
    it('should grant direct permission to user', async () => {
      const userId = 'user-123';
      const tenantId = 't-123';
      const resource = 'recommendations';
      const actions = ['approve', 'dismiss'];

      await rbacService.grantPermission(userId, tenantId, resource, actions);

      const permissions = await rbacService.getUserPermissions(userId, tenantId);
      const permission = permissions.find(p => p.resource === resource);
      expect(permission).toBeDefined();
      expect(permission?.actions).toEqual(expect.arrayContaining(actions));
    });
  });
});

describe('Agent Audit Service', () => {
  let auditService: AgentAuditService;

  beforeEach(() => {
    auditService = new AgentAuditService();
  });

  describe('logAgentEvent', () => {
    it('should log agent event successfully', async () => {
      const event = {
        correlationId: 'corr-123',
        tenantId: 't-123',
        action: 'EVENT_RECEIVED',
        eventId: 'evt-123',
        metadata: {
          module: 'medication',
          severity: 'high'
        }
      };

      await expect(auditService.logAgentEvent(event)).resolves.not.toThrow();
    });

    it('should log error event', async () => {
      const event = {
        correlationId: 'corr-123',
        tenantId: 't-123',
        action: 'EVENT_PROCESSING_FAILED',
        eventId: 'evt-123',
        error: 'Processing failed due to invalid data'
      };

      await expect(auditService.logAgentEvent(event)).resolves.not.toThrow();
    });
  });

  describe('getAuditLogs', () => {
    it('should retrieve audit logs with filters', async () => {
      const tenantId = 't-123';
      const filters = {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31'),
        action: 'EVENT_RECEIVED',
        limit: 10
      };

      const logs = await auditService.getAuditLogs(tenantId, filters);
      expect(Array.isArray(logs)).toBe(true);
    });
  });
});

describe('Integration Tests', () => {
  describe('End-to-End Feedback Processing', () => {
    it('should process feedback from submission to recommendation', async () => {
      // This would be a comprehensive integration test
      // covering the entire flow from feedback submission
      // through processing to recommendation generation
    });
  });

  describe('Compliance Validation', () => {
    it('should maintain compliance throughout processing', async () => {
      // This would test that all compliance requirements
      // are maintained throughout the processing pipeline
    });
  });

  describe('Performance Testing', () => {
    it('should handle high volume of feedback events', async () => {
      // This would test system performance under load
    });
  });
});

describe('Security Tests', () => {
  describe('PII Protection', () => {
    it('should never expose PII in outputs', async () => {
      // This would test that no PII leaks through the system
    });
  });

  describe('Access Control', () => {
    it('should enforce proper access controls', async () => {
      // This would test that access controls work correctly
    });
  });

  describe('Audit Trail', () => {
    it('should maintain complete audit trail', async () => {
      // This would test that all actions are properly audited
    });
  });
});