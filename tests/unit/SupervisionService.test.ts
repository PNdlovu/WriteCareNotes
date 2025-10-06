import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { SupervisionService } from '../../src/services/communication/SupervisionService';
import { databaseService } from '../../src/services/core/DatabaseService';
import { aiService } from '../../src/services/core/AIService';
import { loggerService } from '../../src/services/core/LoggerService';

// Mock dependencies
jest.mock('../../src/services/core/DatabaseService');
jest.mock('../../src/services/core/AIService');
jest.mock('../../src/services/core/LoggerService');

const mockDatabaseService = databaseService as jest.Mocked<typeof databaseService>;
const mockAIService = aiService as jest.Mocked<typeof aiService>;
const mockLoggerService = loggerService as jest.Mocked<typeof loggerService>;

describe('SupervisionService Unit Tests', () => {
  let supervisionService: SupervisionService;

  beforeEach(() => {
    jest.clearAllMocks();
    supervisionService = SupervisionService.getInstance();
  });

  describe('Initialization', () => {
    test('should create singleton instance', () => {
      const instance1 = SupervisionService.getInstance();
      const instance2 = SupervisionService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Supervision Report Generation', () => {
    test('should generate supervision report with AI summarization', async () => {
      // Mock data
      const mockSessions = [
        {
          id: 'session-1',
          patient_id: 'patient-1',
          provider_id: 'provider-1',
          session_type: 'video_call',
          status: 'completed',
          started_at: new Date('2024-01-01T10:00:00Z'),
          ended_at: new Date('2024-01-01T11:00:00Z'),
          transcript: 'Patient discussed symptoms and treatment progress.'
        }
      ];

      const mockNotes = [
        {
          id: 'note-1',
          patient_id: 'patient-1',
          author_id: 'caregiver-1',
          content: 'Patient shows improvement in mobility.',
          created_at: new Date('2024-01-01T12:00:00Z')
        }
      ];

      const mockSummary = 'Patient shows positive progress with improved mobility and engagement.';

      // Mock database calls
      mockDatabaseService.query
        .mockResolvedValueOnce({ rows: mockSessions } as any)
        .mockResolvedValueOnce({ rows: mockNotes } as any);

      // Mock AI service
      mockAIService.summarizeText.mockResolvedValue(mockSummary);

      const report = await supervisionService.generateSupervisionReport(
        'provider-1',
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(report).toBeDefined();
      expect(report.providerId).toBe('provider-1');
      expect(report.summary).toBe(mockSummary);
      expect(report.sessionsReviewed).toBe(1);
      expect(report.notesReviewed).toBe(1);

      expect(mockDatabaseService.query).toHaveBeenCalledTimes(2);
      expect(mockAIService.summarizeText).toHaveBeenCalledWith({
        text: expect.stringContaining('Patient discussed symptoms'),
        focusAreas: ['quality_of_care', 'patient_outcomes', 'compliance']
      });
    });

    test('should handle AI service errors gracefully', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          transcript: 'Test transcript'
        }
      ];

      mockDatabaseService.query
        .mockResolvedValueOnce({ rows: mockSessions } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      mockAIService.summarizeText.mockRejectedValue(new Error('AI service unavailable'));

      const report = await supervisionService.generateSupervisionReport(
        'provider-1',
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(report.summary).toContain('Unable to generate AI summary');
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to generate AI summary for supervision report',
        expect.any(Error),
        expect.any(Object)
      );
    });
  });

  describe('Compliance Assessment', () => {
    test('should assess compliance for sessions', async () => {
      const mockSession = {
        id: 'session-1',
        patient_id: 'patient-1',
        transcript: 'Session conducted with proper consent and documentation.',
        recording_url: 'https://example.com/recording.mp4'
      };

      const mockCompliance = {
        compliant: true,
        issues: [],
        recommendations: [],
        confidence: 0.95
      };

      mockDatabaseService.findById.mockResolvedValue(mockSession);
      mockAIService.analyzeCompliance.mockResolvedValue(mockCompliance);

      const assessment = await supervisionService.assessCompliance('session-1', 'session');

      expect(assessment).toBeDefined();
      expect(assessment.entityId).toBe('session-1');
      expect(assessment.entityType).toBe('session');
      expect(assessment.compliant).toBe(true);
      expect(assessment.issues).toHaveLength(0);

      expect(mockAIService.analyzeCompliance).toHaveBeenCalledWith({
        content: mockSession.transcript,
        regulations: ['GDPR', 'HIPAA', 'Care Quality Commission (CQC)']
      });
    });

    test('should identify compliance issues', async () => {
      const mockSession = {
        id: 'session-1',
        transcript: 'Informal conversation without proper consent documentation.'
      };

      const mockCompliance = {
        compliant: false,
        issues: ['Missing consent documentation', 'Informal communication style'],
        recommendations: ['Ensure proper consent forms', 'Follow professional communication protocols'],
        confidence: 0.85
      };

      mockDatabaseService.findById.mockResolvedValue(mockSession);
      mockAIService.analyzeCompliance.mockResolvedValue(mockCompliance);

      const assessment = await supervisionService.assessCompliance('session-1', 'session');

      expect(assessment.compliant).toBe(false);
      expect(assessment.issues).toHaveLength(2);
      expect(assessment.recommendations).toHaveLength(2);
    });
  });

  describe('Complaint Handling', () => {
    test('should create complaint record', async () => {
      const complaintData = {
        patientId: 'patient-1',
        providerId: 'provider-1',
        category: 'quality_of_care',
        description: 'Patient concerned about treatment approach',
        severity: 'medium' as const,
        reportedBy: 'patient-1'
      };

      const mockComplaint = {
        id: 'complaint-1',
        ...complaintData,
        status: 'open',
        created_at: new Date()
      };

      mockDatabaseService.insert.mockResolvedValue(mockComplaint);

      const complaint = await supervisionService.createComplaint(complaintData);

      expect(complaint).toBeDefined();
      expect(complaint.id).toBe('complaint-1');
      expect(complaint.status).toBe('open');

      expect(mockDatabaseService.insert).toHaveBeenCalledWith(
        'complaints',
        expect.objectContaining({
          patient_id: 'patient-1',
          provider_id: 'provider-1',
          category: 'quality_of_care'
        })
      );
    });

    test('should escalate high severity complaints automatically', async () => {
      const complaintData = {
        patientId: 'patient-1',
        providerId: 'provider-1',
        category: 'safety_concern',
        description: 'Patient safety was compromised',
        severity: 'high' as const,
        reportedBy: 'supervisor-1'
      };

      const mockComplaint = {
        id: 'complaint-1',
        ...complaintData,
        status: 'escalated'
      };

      mockDatabaseService.insert.mockResolvedValue(mockComplaint);
      mockDatabaseService.query.mockResolvedValue({ rows: [] } as any);

      await supervisionService.createComplaint(complaintData);

      // Verify escalation was triggered
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO escalations'),
        expect.arrayContaining(['complaint-1'])
      );
    });
  });

  describe('Performance Monitoring', () => {
    test('should calculate provider performance metrics', async () => {
      const mockMetrics = [
        {
          provider_id: 'provider-1',
          total_sessions: 25,
          completed_sessions: 23,
          avg_session_rating: 4.2,
          total_notes: 45,
          compliance_score: 0.92
        }
      ];

      mockDatabaseService.query.mockResolvedValue({ rows: mockMetrics } as any);

      const performance = await supervisionService.getProviderPerformance(
        'provider-1',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(performance).toBeDefined();
      expect(performance.providerId).toBe('provider-1');
      expect(performance.totalSessions).toBe(25);
      expect(performance.completionRate).toBeCloseTo(0.92);
      expect(performance.averageRating).toBe(4.2);
      expect(performance.complianceScore).toBe(0.92);
    });

    test('should handle providers with no activity', async () => {
      mockDatabaseService.query.mockResolvedValue({ rows: [] } as any);

      const performance = await supervisionService.getProviderPerformance(
        'provider-new',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(performance.totalSessions).toBe(0);
      expect(performance.completionRate).toBe(0);
      expect(performance.averageRating).toBe(0);
      expect(performance.complianceScore).toBe(1); // No issues = perfect compliance
    });
  });

  describe('Alert Management', () => {
    test('should create supervision alert for critical issues', async () => {
      const alertData = {
        type: 'compliance_violation',
        severity: 'critical' as const,
        entityType: 'session',
        entityId: 'session-1',
        message: 'Critical compliance violation detected',
        metadata: { violationType: 'consent_missing' }
      };

      const mockAlert = {
        id: 'alert-1',
        ...alertData,
        status: 'active',
        created_at: new Date()
      };

      mockDatabaseService.insert.mockResolvedValue(mockAlert);

      const alert = await supervisionService.createSupervisionAlert(alertData);

      expect(alert).toBeDefined();
      expect(alert.id).toBe('alert-1');
      expect(alert.severity).toBe('critical');
      expect(alert.status).toBe('active');

      expect(mockDatabaseService.insert).toHaveBeenCalledWith(
        'supervision_alerts',
        expect.objectContaining({
          type: 'compliance_violation',
          severity: 'critical'
        })
      );
    });

    test('should acknowledge supervision alerts', async () => {
      const mockAcknowledgedAlert = {
        id: 'alert-1',
        status: 'acknowledged',
        acknowledged_by: 'supervisor-1',
        acknowledged_at: new Date()
      };

      mockDatabaseService.update.mockResolvedValue(mockAcknowledgedAlert);

      const result = await supervisionService.acknowledgeAlert('alert-1', 'supervisor-1');

      expect(result).toBe(true);
      expect(mockDatabaseService.update).toHaveBeenCalledWith(
        'supervision_alerts',
        'alert-1',
        expect.objectContaining({
          status: 'acknowledged',
          acknowledged_by: 'supervisor-1'
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      mockDatabaseService.query.mockRejectedValue(new Error('Connection failed'));

      await expect(
        supervisionService.generateSupervisionReport(
          'provider-1',
          new Date(),
          new Date()
        )
      ).rejects.toThrow('Connection failed');

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to generate supervision report',
        expect.any(Error),
        expect.any(Object)
      );
    });

    test('should validate input parameters', async () => {
      await expect(
        supervisionService.generateSupervisionReport(
          '', // Invalid provider ID
          new Date(),
          new Date()
        )
      ).rejects.toThrow('Provider ID is required');
    });
  });
});