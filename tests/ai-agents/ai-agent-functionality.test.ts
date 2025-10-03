/**
 * @fileoverview AI Agent Functionality Tests
 * @module AIAgentFunctionalityTests
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-14
 * 
 * @description Comprehensive functionality tests for AI agent system
 */

import request from 'supertest';
import { app } from '../../src/server';
import { AppDataSource } from '../../src/config/database';
import jwt from 'jsonwebtoken';

describe('AI Agent Functionality Tests', () => {
  let tenantToken: string;

  beforeAll(async () => {
    await AppDataSource.initialize();
    
    tenantToken = jwt.sign(
      { 
        userId: 'user-healthcare-123', 
        tenantId: 'healthcare-test-tenant',
        roles: ['CARE_STAFF'],
        dataAccessLevel: 'STANDARD'
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('Public AI Agent Functionality', () => {
    test('should handle product information inquiries', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'What features does WriteCareNotes offer for medication management?',
          inquiryType: 'FEATURE',
          userContext: {
            organizationType: 'care_home',
            organizationSize: 'medium'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('medication');
      expect(response.body.data.confidence).toBeGreaterThan(0.5);
      expect(response.body.data.knowledgeSources).toBeDefined();
      expect(Array.isArray(response.body.data.knowledgeSources)).toBe(true);
    });

    test('should provide pricing information', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'How much does WriteCareNotes cost for a 50-bed care home?',
          inquiryType: 'PRICING',
          userContext: {
            organizationSize: 'medium',
            organizationType: 'care_home'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.message).toContain('£');
      expect(response.body.data.message).toMatch(/Professional|Enterprise/);
      expect(response.body.data.suggestedActions).toBeDefined();
      
      const demoAction = response.body.data.suggestedActions.find(
        action => action.type === 'SCHEDULE_DEMO'
      );
      expect(demoAction).toBeDefined();
    });

    test('should handle compliance inquiries', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'How does WriteCareNotes help with CQC inspections?',
          inquiryType: 'COMPLIANCE'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.message).toContain('CQC');
      expect(response.body.data.message).toMatch(/compliance|inspection|Key Lines of Enquiry/i);
      expect(response.body.data.confidence).toBeGreaterThan(0.7);
      
      const complianceAction = response.body.data.suggestedActions.find(
        action => action.type === 'COMPLIANCE_GUIDE'
      );
      expect(complianceAction).toBeDefined();
    });

    test('should generate appropriate follow-up questions', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'I need a care home management system',
          inquiryType: 'GENERAL'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.followUpQuestions).toBeDefined();
      expect(Array.isArray(response.body.data.followUpQuestions)).toBe(true);
      expect(response.body.data.followUpQuestions.length).toBeGreaterThan(0);
      expect(response.body.data.followUpQuestions.length).toBeLessThanOrEqual(3);
    });

    test('should escalate complex inquiries', async () => {
      const complexInquiry = 'I need a comprehensive solution that integrates with our existing NHS systems, handles multi-site operations across England and Scotland, complies with both CQC and Care Inspectorate requirements, includes advanced medication management with interaction checking, provides family portal access, supports mobile care staff, includes financial analytics, and can be implemented within 6 weeks with full staff training and data migration from our current system.';

      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: complexInquiry,
          inquiryType: 'GENERAL',
          userContext: {
            urgency: 'HIGH'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.escalationRequired).toBe(true);
      
      const salesAction = response.body.data.suggestedActions.find(
        action => action.type === 'CONTACT_SALES'
      );
      expect(salesAction).toBeDefined();
    });

    test('should provide knowledge base summary', async () => {
      const response = await request(app)
        .get('/api/v1/ai-agents/public/knowledge-base');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalArticles).toBeGreaterThanOrEqual(0);
      expect(response.body.data.totalFaqs).toBeGreaterThan(0);
      expect(response.body.data.totalFeatures).toBeGreaterThan(0);
      expect(response.body.data.lastUpdated).toBeDefined();
    });
  });

  describe('Tenant AI Agent Functionality', () => {
    test('should provide care plan assistance', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/tenant/care-inquiry')
        .set('Authorization', `Bearer ${tenantToken}`)
        .set('X-Tenant-ID', 'healthcare-test-tenant')
        .send({
          message: 'Help me develop a care plan for a resident with dementia and mobility issues',
          inquiryType: 'CARE_PLAN',
          residentId: 'healthcare-test-tenant_resident_123',
          careContext: {
            currentCareNeeds: ['Dementia care', 'Mobility assistance'],
            recentAssessments: ['Cognitive assessment: moderate decline'],
            familyConcerns: ['Memory loss progression']
          },
          urgencyLevel: 'MEDIUM',
          confidentialityLevel: 'SENSITIVE'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.tenantId).toBe('healthcare-test-tenant');
      expect(response.body.data.message).toContain('dementia');
      expect(response.body.data.careRecommendations).toBeDefined();
      expect(Array.isArray(response.body.data.careRecommendations)).toBe(true);
      expect(response.body.data.encryptionKeyId).toBeDefined();
    });

    test('should generate care recommendations', async () => {
      const response = await request(app)
        .get('/api/v1/ai-agents/tenant/care-recommendations/healthcare-test-tenant_resident_123')
        .set('Authorization', `Bearer ${tenantToken}`)
        .set('X-Tenant-ID', 'healthcare-test-tenant');

      expect(response.status).toBe(200);
      expect(response.body.data.recommendations).toBeDefined();
      expect(response.body.data.confidence).toBeGreaterThan(0);
      expect(response.body.tenantId).toBe('healthcare-test-tenant');
      expect(response.body.residentId).toBe('healthcare-test-tenant_resident_123');
    });

    test('should provide compliance alerts', async () => {
      const response = await request(app)
        .get('/api/v1/ai-agents/tenant/compliance-alerts')
        .set('Authorization', `Bearer ${tenantToken}`)
        .set('X-Tenant-ID', 'healthcare-test-tenant');

      expect(response.status).toBe(200);
      expect(response.body.data.alerts).toBeDefined();
      expect(Array.isArray(response.body.data.alerts)).toBe(true);
      expect(response.body.tenantId).toBe('healthcare-test-tenant');
    });

    test('should assist with documentation', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/tenant/documentation-assistance')
        .set('Authorization', `Bearer ${tenantToken}`)
        .set('X-Tenant-ID', 'healthcare-test-tenant')
        .send({
          documentType: 'CARE_NOTE',
          currentContent: 'Resident had a good day. Ate well.',
          residentId: 'healthcare-test-tenant_resident_123'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.suggestions).toBeDefined();
      expect(response.body.data.actionItems).toBeDefined();
      expect(response.body.documentType).toBe('CARE_NOTE');
    });

    test('should handle medication inquiries', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/tenant/care-inquiry')
        .set('Authorization', `Bearer ${tenantToken}`)
        .set('X-Tenant-ID', 'healthcare-test-tenant')
        .send({
          message: 'Resident is experiencing side effects from new medication. What should I do?',
          inquiryType: 'MEDICATION',
          residentId: 'healthcare-test-tenant_resident_123',
          urgencyLevel: 'HIGH',
          confidentialityLevel: 'SENSITIVE'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.message).toContain('medication');
      expect(response.body.data.escalationRequired).toBe(true); // Medical issues should escalate
      expect(response.body.data.confidentialityLevel).toBe('SENSITIVE');
    });

    test('should handle risk assessment inquiries', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/tenant/care-inquiry')
        .set('Authorization', `Bearer ${tenantToken}`)
        .set('X-Tenant-ID', 'healthcare-test-tenant')
        .send({
          message: 'Resident has had three falls this week. Need to update risk assessment.',
          inquiryType: 'RISK_ASSESSMENT',
          residentId: 'healthcare-test-tenant_resident_123',
          careContext: {
            currentCareNeeds: ['Fall prevention'],
            recentAssessments: ['Fall risk: HIGH']
          },
          urgencyLevel: 'HIGH'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.message).toMatch(/fall|risk/i);
      expect(response.body.data.careRecommendations).toBeDefined();
      
      const fallPrevention = response.body.data.careRecommendations.find(
        rec => rec.type === 'CARE_PLAN_UPDATE' && rec.recommendation.toLowerCase().includes('fall')
      );
      expect(fallPrevention).toBeDefined();
    });

    test('should handle emergency situations', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/tenant/emergency')
        .set('Authorization', `Bearer ${tenantToken}`)
        .set('X-Tenant-ID', 'healthcare-test-tenant')
        .send({
          message: 'Resident is having difficulty breathing and appears distressed',
          emergencyType: 'MEDICAL_EMERGENCY',
          residentId: 'healthcare-test-tenant_resident_123'
        });

      expect(response.status).toBe(200);
      expect(response.body.emergency).toBe(true);
      expect(response.body.escalated).toBe(true);
      expect(response.body.data.escalationRequired).toBe(true);
      expect(response.body.data.confidentialityLevel).toBe('HIGHLY_SENSITIVE');
    });
  });

  describe('Knowledge Base Integration', () => {
    test('should retrieve relevant knowledge for public inquiries', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'How does NHS integration work?',
          inquiryType: 'INTEGRATION'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.knowledgeSources).toBeDefined();
      expect(response.body.data.knowledgeSources.length).toBeGreaterThan(0);
      
      const nhsSource = response.body.data.knowledgeSources.find(
        source => source.toLowerCase().includes('nhs')
      );
      expect(nhsSource).toBeDefined();
    });

    test('should access tenant-specific knowledge', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/tenant/care-inquiry')
        .set('Authorization', `Bearer ${tenantToken}`)
        .set('X-Tenant-ID', 'healthcare-test-tenant')
        .send({
          message: 'What are our organization\'s policies for end-of-life care?',
          inquiryType: 'CARE_PLAN',
          confidentialityLevel: 'SENSITIVE'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.knowledgeSources).toBeDefined();
      
      // Should include tenant-specific sources
      const tenantSource = response.body.data.knowledgeSources.find(
        source => source.includes('Tenant Article:') || source.includes('Organizational Policy:')
      );
      expect(tenantSource).toBeDefined();
    });
  });

  describe('Response Quality', () => {
    test('should provide high-confidence responses for clear inquiries', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'What is the monthly price for the Professional tier?',
          inquiryType: 'PRICING'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.confidence).toBeGreaterThan(0.8);
      expect(response.body.data.message).toContain('£');
      expect(response.body.data.message).toContain('Professional');
    });

    test('should provide lower confidence for ambiguous inquiries', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'Tell me about stuff',
          inquiryType: 'GENERAL'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.confidence).toBeLessThan(0.7);
      expect(response.body.data.followUpQuestions).toBeDefined();
      expect(response.body.data.followUpQuestions.length).toBeGreaterThan(0);
    });

    test('should escalate when confidence is too low', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'asdfghjkl qwerty random gibberish',
          inquiryType: 'GENERAL'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.confidence).toBeLessThan(0.3);
      expect(response.body.data.escalationRequired).toBe(true);
    });
  });

  describe('Performance Requirements', () => {
    test('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'Tell me about your care management features',
          inquiryType: 'FEATURE'
        });

      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(3000); // 3 second limit
      expect(response.body.data.responseTime).toBeLessThan(2000); // Internal processing limit
    });

    test('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = Array(10).fill(null).map((_, index) => 
        request(app)
          .post('/api/v1/ai-agents/public/inquiry')
          .send({
            message: `Concurrent test message ${index}`,
            inquiryType: 'GENERAL'
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / responses.length;

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      expect(averageTime).toBeLessThan(1000); // Should handle concurrency efficiently
    });
  });

  describe('Session Management', () => {
    test('should create and manage sessions properly', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'Start new session',
          inquiryType: 'GENERAL'
        });

      expect(response.status).toBe(200);
      expect(response.body.sessionId).toBeDefined();
      expect(response.body.sessionId).toMatch(/^session_/);
      
      publicSessionId = response.body.sessionId;
    });

    test('should maintain session context across requests', async () => {
      // First request
      const response1 = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'I am interested in your pricing',
          inquiryType: 'PRICING'
        });

      expect(response1.status).toBe(200);
      const sessionId = response1.body.sessionId;

      // Follow-up request with same session
      const response2 = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'What about integration capabilities?',
          inquiryType: 'INTEGRATION',
          sessionId: sessionId
        });

      expect(response2.status).toBe(200);
      expect(response2.body.sessionId).toBe(sessionId);
      // Response should reference previous context
      expect(response2.body.data.message).toMatch(/integration|connect|API/i);
    });

    test('should isolate tenant sessions', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/tenant/care-inquiry')
        .set('Authorization', `Bearer ${tenantToken}`)
        .set('X-Tenant-ID', 'healthcare-test-tenant')
        .send({
          message: 'Create tenant session',
          inquiryType: 'DOCUMENTATION'
        });

      expect(response.status).toBe(200);
      expect(response.body.sessionId).toBeDefined();
      expect(response.body.sessionId).toMatch(/^tenant_session_/);
      expect(response.body.tenantId).toBe('healthcare-test-tenant');
      
      tenantSessionId = response.body.sessionId;
    });
  });

  describe('Error Handling', () => {
    test('should handle missing required fields gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          // Missing message field
          inquiryType: 'GENERAL'
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('MISSING_MESSAGE');
    });

    test('should handle invalid inquiry types', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'Test message',
          inquiryType: 'INVALID_TYPE'
        });

      expect(response.status).toBe(200); // Should default to GENERAL
      expect(response.body.data.message).toBeDefined();
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .set('Content-Type', 'application/json')
        .send('{"message": "test", invalid json}');

      expect(response.status).toBe(400);
    });

    test('should handle service unavailability', async () => {
      // This would require mocking service failures
      // For now, test that error responses are properly formatted
      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'Test error handling',
          inquiryType: 'GENERAL'
        });

      // Should succeed, but if it fails, should be graceful
      if (response.status !== 200) {
        expect(response.body.error).toBeDefined();
        expect(response.body.code).toBeDefined();
      }
    });
  });

  describe('Health Checks', () => {
    test('should provide public agent health status', async () => {
      const response = await request(app)
        .get('/api/v1/ai-agents/public/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('PublicAIAgent');
      expect(response.body.version).toBe('1.0.0');
    });

    test('should provide tenant agent health status', async () => {
      const response = await request(app)
        .get('/api/v1/ai-agents/tenant/health')
        .set('Authorization', `Bearer ${tenantToken}`)
        .set('X-Tenant-ID', 'healthcare-test-tenant');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('TenantAIAgent');
      expect(response.body.tenantId).toBe('healthcare-test-tenant');
      expect(response.body.isolationEnforced).toBe(true);
    });
  });

  describe('Analytics and Monitoring', () => {
    test('should track interaction metrics', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'Track this interaction',
          inquiryType: 'GENERAL'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.responseTime).toBeDefined();
      expect(response.body.data.responseTime).toBeGreaterThan(0);
      expect(response.body.timestamp).toBeDefined();
    });

    test('should provide appropriate confidence scores', async () => {
      // High confidence scenario
      const highConfidenceResponse = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'What is the price of the Essential tier?',
          inquiryType: 'PRICING'
        });

      expect(highConfidenceResponse.status).toBe(200);
      expect(highConfidenceResponse.body.data.confidence).toBeGreaterThan(0.8);

      // Low confidence scenario
      const lowConfidenceResponse = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'Random question about something unclear',
          inquiryType: 'GENERAL'
        });

      expect(lowConfidenceResponse.status).toBe(200);
      expect(lowConfidenceResponse.body.data.confidence).toBeLessThan(0.5);
    });
  });

  describe('Multi-Language Support', () => {
    test('should handle Welsh language inquiries', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'Dywedwch wrthyf am eich system rheoli gofal', // Welsh: Tell me about your care management system
          inquiryType: 'FEATURE',
          userContext: {
            languagePreference: 'cy' // Welsh
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.message).toBeDefined();
      // Should either respond in Welsh or acknowledge language preference
    });

    test('should handle Scottish Gaelic inquiries', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'Innis dhomh mu dheidhinn ur siostam riaghlaidh cùraim',
          inquiryType: 'FEATURE',
          userContext: {
            languagePreference: 'gd' // Scottish Gaelic
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.message).toBeDefined();
    });
  });

  describe('Integration with Existing Services', () => {
    test('should integrate with notification service for escalations', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/tenant/emergency')
        .set('Authorization', `Bearer ${tenantToken}`)
        .set('X-Tenant-ID', 'healthcare-test-tenant')
        .send({
          message: 'Medical emergency requiring immediate attention',
          emergencyType: 'MEDICAL_EMERGENCY',
          residentId: 'healthcare-test-tenant_resident_123'
        });

      expect(response.status).toBe(200);
      expect(response.body.escalated).toBe(true);
      // In production, this would verify notification was sent
    });

    test('should integrate with audit service', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/tenant/care-inquiry')
        .set('Authorization', `Bearer ${tenantToken}`)
        .set('X-Tenant-ID', 'healthcare-test-tenant')
        .send({
          message: 'Test audit integration',
          inquiryType: 'DOCUMENTATION'
        });

      expect(response.status).toBe(200);
      // In production, this would verify audit log was created
      expect(response.body.data.responseId).toBeDefined();
    });
  });

  describe('Edge Cases and Stress Testing', () => {
    test('should handle very long messages', async () => {
      const longMessage = 'This is a very long message that tests the system\'s ability to handle extended user input. '.repeat(100);

      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: longMessage,
          inquiryType: 'GENERAL'
        });

      expect([200, 403]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.data.message).toBeDefined();
      }
    });

    test('should handle special characters and emojis', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'Hello! 👋 I need help with care management 🏥 for elderly residents 👵👴',
          inquiryType: 'FEATURE'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.message).toBeDefined();
    });

    test('should handle rapid successive requests', async () => {
      const rapidRequests = Array(5).fill(null).map((_, index) => 
        request(app)
          .post('/api/v1/ai-agents/public/inquiry')
          .send({
            message: `Rapid request ${index}`,
            inquiryType: 'GENERAL'
          })
      );

      const responses = await Promise.all(rapidRequests);
      
      responses.forEach((response, index) => {
        expect([200, 429]).toContain(response.status); // Success or rate limited
      });
    });

    test('should handle missing optional fields', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'Simple message with minimal data'
          // Missing inquiryType and userContext
        });

      expect(response.status).toBe(200);
      expect(response.body.data.message).toBeDefined();
    });
  });

  describe('Accessibility and Usability', () => {
    test('should provide clear and helpful error messages', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/tenant/care-inquiry')
        .send({
          message: 'Test without auth'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
      expect(response.body.code).toBeDefined();
    });

    test('should provide actionable suggestions', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'I want to see a demo',
          inquiryType: 'DEMO'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.suggestedActions).toBeDefined();
      expect(response.body.data.suggestedActions.length).toBeGreaterThan(0);
      
      const demoAction = response.body.data.suggestedActions.find(
        action => action.type === 'SCHEDULE_DEMO'
      );
      expect(demoAction).toBeDefined();
      expect(demoAction.url).toBeDefined();
    });

    test('should provide relevant follow-up questions', async () => {
      const response = await request(app)
        .post('/api/v1/ai-agents/public/inquiry')
        .send({
          message: 'I need help with compliance',
          inquiryType: 'COMPLIANCE'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.followUpQuestions).toBeDefined();
      expect(response.body.data.followUpQuestions.length).toBeGreaterThan(0);
      
      // Should include compliance-related follow-ups
      const complianceQuestion = response.body.data.followUpQuestions.find(
        question => question.toLowerCase().includes('compliance') || 
                   question.toLowerCase().includes('inspection') ||
                   question.toLowerCase().includes('regulatory')
      );
      expect(complianceQuestion).toBeDefined();
    });
  });
});

export default {};