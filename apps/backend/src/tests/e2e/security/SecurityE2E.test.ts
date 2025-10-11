import { EventEmitter2 } from "eventemitter2";

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityService } from '../../../services/security/SecurityService';
import { SecurityPolicy } from '../../../entities/security/SecurityPolicy';
import { SecurityIncident } from '../../../entities/security/SecurityIncident';

describe('Security E2E Tests', () => {
  letapp: INestApplication;
  letservice: SecurityService;

  beforeAll(async () => {
    constmoduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [SecurityPolicy, SecurityIncident],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([SecurityPolicy, SecurityIncident]),
      ],
      providers: [SecurityService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = moduleFixture.get<SecurityService>(SecurityService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Security Management Workflow', () => {
    it('should handle complete security policy and incident lifecycle', async () => {
      // Step 1: Create security policies
      const authPolicy = await service.createSecurityPolicy({
        name: 'Authentication Policy',
        description: 'Password and authentication requirements',
        policyType: 'authentication' as const,
        rules: { minLength: 8, requireSpecialChars: true, requireNumbers: true },
        isActive: true,
        effectiveDate: new Date(),
        expiryDate: null
      });

      const accessPolicy = await service.createSecurityPolicy({
        name: 'Access Control Policy',
        description: 'Role-based access control requirements',
        policyType: 'authorization' as const,
        rules: { roleBasedAccess: true, timeBasedAccess: true, ipWhitelist: true },
        isActive: true,
        effectiveDate: new Date(),
        expiryDate: null
      });

      const dataPolicy = await service.createSecurityPolicy({
        name: 'Data Protection Policy',
        description: 'Data encryption and protection requirements',
        policyType: 'data_protection' as const,
        rules: { encryptionRequired: true, dataRetention: '7 years', auditLogging: true },
        isActive: true,
        effectiveDate: new Date(),
        expiryDate: null
      });

      expect(authPolicy).toBeDefined();
      expect(accessPolicy).toBeDefined();
      expect(dataPolicy).toBeDefined();

      // Step 2: Verify policy creation and properties
      const allPolicies = await service.getAllSecurityPolicies();
      expect(allPolicies).toHaveLength(3);

      const activePolicies = await service.getActivePolicies();
      expect(activePolicies).toHaveLength(3);
      expect(activePolicies.every(policy => policy.isActive === true)).toBe(true);

      // Step 3: Test policy filtering by type
      const authPolicies = await service.getPoliciesByType('authentication');
      expect(authPolicies).toHaveLength(1);
      expect(authPolicies[0].policyType).toBe('authentication');

      const accessPolicies = await service.getPoliciesByType('authorization');
      expect(accessPolicies).toHaveLength(1);
      expect(accessPolicies[0].policyType).toBe('authorization');

      const dataPolicies = await service.getPoliciesByType('data_protection');
      expect(dataPolicies).toHaveLength(1);
      expect(dataPolicies[0].policyType).toBe('data_protection');

      // Step 4: Create security incidents
      const incident1 = await service.createSecurityIncident({
        title: 'Unauthorized Access Attempt',
        description: 'Multiple failed login attempts detected from suspicious IP',
        incidentType: 'unauthorized_access' as const,
        severity: 'medium' as const,
        status: 'open' as const,
        reportedBy: 'user1',
        assignedTo: 'admin1',
        occurredAt: new Date(),
        resolvedAt: null,
        resolution: null
      });

      const incident2 = await service.createSecurityIncident({
        title: 'Data Breach Alert',
        description: 'Potential data breach detected in user database',
        incidentType: 'data_breach' as const,
        severity: 'high' as const,
        status: 'open' as const,
        reportedBy: 'system',
        assignedTo: 'admin2',
        occurredAt: new Date(),
        resolvedAt: null,
        resolution: null
      });

      const incident3 = await service.createSecurityIncident({
        title: 'Malware Detection',
        description: 'Malware detected and contained on workstation',
        incidentType: 'malware' as const,
        severity: 'low' as const,
        status: 'open' as const,
        reportedBy: 'antivirus',
        assignedTo: 'admin3',
        occurredAt: new Date(),
        resolvedAt: null,
        resolution: null
      });

      expect(incident1).toBeDefined();
      expect(incident2).toBeDefined();
      expect(incident3).toBeDefined();

      // Step 5: Verify incident creation and properties
      const allIncidents = await service.getAllSecurityIncidents();
      expect(allIncidents).toHaveLength(3);

      // Step 6: Test incident filtering by status
      const openIncidents = await service.getIncidentsByStatus('open');
      expect(openIncidents).toHaveLength(3);
      expect(openIncidents.every(incident => incident.status === 'open')).toBe(true);

      // Step 7: Test incident filtering by severity
      const highSeverityIncidents = await service.getIncidentsBySeverity('high');
      expect(highSeverityIncidents).toHaveLength(1);
      expect(highSeverityIncidents[0].severity).toBe('high');

      const mediumSeverityIncidents = await service.getIncidentsBySeverity('medium');
      expect(mediumSeverityIncidents).toHaveLength(1);
      expect(mediumSeverityIncidents[0].severity).toBe('medium');

      const lowSeverityIncidents = await service.getIncidentsBySeverity('low');
      expect(lowSeverityIncidents).toHaveLength(1);
      expect(lowSeverityIncidents[0].severity).toBe('low');

      // Step 8: Test incident filtering by type
      const unauthorizedAccessIncidents = await service.getIncidentsByType('unauthorized_access');
      expect(unauthorizedAccessIncidents).toHaveLength(1);
      expect(unauthorizedAccessIncidents[0].incidentType).toBe('unauthorized_access');

      const dataBreachIncidents = await service.getIncidentsByType('data_breach');
      expect(dataBreachIncidents).toHaveLength(1);
      expect(dataBreachIncidents[0].incidentType).toBe('data_breach');

      const malwareIncidents = await service.getIncidentsByType('malware');
      expect(malwareIncidents).toHaveLength(1);
      expect(malwareIncidents[0].incidentType).toBe('malware');

      // Step 9: Update policy status
      await service.updateSecurityPolicy(authPolicy.id, {
        isActive: false,
        description: 'Updated authentication policy - temporarily disabled'
      });

      const updatedAuthPolicy = await service.getSecurityPolicyById(authPolicy.id);
      expect(updatedAuthPolicy.isActive).toBe(false);
      expect(updatedAuthPolicy.description).toBe('Updated authentication policy - temporarily disabled');

      // Step 10: Handle incident lifecycle
      // Move incident 1 to in progress
      await service.updateSecurityIncident(incident1.id, {
        status: 'in_progress' as const,
        assignedTo: 'admin2'
      });

      let updatedIncident1 = await service.getSecurityIncidentById(incident1.id);
      expect(updatedIncident1.status).toBe('in_progress');
      expect(updatedIncident1.assignedTo).toBe('admin2');

      // Resolve incident 1
      await service.updateSecurityIncident(incident1.id, {
        status: 'resolved' as const,
        resolvedAt: new Date(),
        resolution: 'IP blocked and user account locked'
      });

      updatedIncident1 = await service.getSecurityIncidentById(incident1.id);
      expect(updatedIncident1.status).toBe('resolved');
      expect(updatedIncident1.resolvedAt).toBeDefined();
      expect(updatedIncident1.resolution).toBe('IP blocked and user account locked');

      // Move incident 2 to in progress
      await service.updateSecurityIncident(incident2.id, {
        status: 'in_progress' as const,
        assignedTo: 'admin1'
      });

      let updatedIncident2 = await service.getSecurityIncidentById(incident2.id);
      expect(updatedIncident2.status).toBe('in_progress');
      expect(updatedIncident2.assignedTo).toBe('admin1');

      // Resolve incident 2
      await service.updateSecurityIncident(incident2.id, {
        status: 'resolved' as const,
        resolvedAt: new Date(),
        resolution: 'False positive - no actual breach detected'
      });

      updatedIncident2 = await service.getSecurityIncidentById(incident2.id);
      expect(updatedIncident2.status).toBe('resolved');
      expect(updatedIncident2.resolvedAt).toBeDefined();
      expect(updatedIncident2.resolution).toBe('False positive - no actual breach detected');

      // Move incident 3 to in progress
      await service.updateSecurityIncident(incident3.id, {
        status: 'in_progress' as const,
        assignedTo: 'admin3'
      });

      let updatedIncident3 = await service.getSecurityIncidentById(incident3.id);
      expect(updatedIncident3.status).toBe('in_progress');
      expect(updatedIncident3.assignedTo).toBe('admin3');

      // Resolve incident 3
      await service.updateSecurityIncident(incident3.id, {
        status: 'resolved' as const,
        resolvedAt: new Date(),
        resolution: 'Malware removed and system secured'
      });

      updatedIncident3 = await service.getSecurityIncidentById(incident3.id);
      expect(updatedIncident3.status).toBe('resolved');
      expect(updatedIncident3.resolvedAt).toBeDefined();
      expect(updatedIncident3.resolution).toBe('Malware removed and system secured');

      // Step 11: Verify final statuses
      const resolvedIncidents = await service.getIncidentsByStatus('resolved');
      expect(resolvedIncidents).toHaveLength(3);
      expect(resolvedIncidents.every(incident => incident.status === 'resolved')).toBe(true);

      const inProgressIncidents = await service.getIncidentsByStatus('in_progress');
      expect(inProgressIncidents).toHaveLength(0);

      const openIncidentsFinal = await service.getIncidentsByStatus('open');
      expect(openIncidentsFinal).toHaveLength(0);

      // Step 12: Clean up - delete policies and incidents
      await service.deleteSecurityPolicy(authPolicy.id);
      await service.deleteSecurityPolicy(accessPolicy.id);
      await service.deleteSecurityPolicy(dataPolicy.id);
      await service.deleteSecurityIncident(incident1.id);
      await service.deleteSecurityIncident(incident2.id);
      await service.deleteSecurityIncident(incident3.id);

      // Verify deletion
      const finalPolicies = await service.getAllSecurityPolicies();
      expect(finalPolicies).toHaveLength(0);

      const finalIncidents = await service.getAllSecurityIncidents();
      expect(finalIncidents).toHaveLength(0);
    });

    it('should handle complex security scenarios', async () => {
      // Create multiple policies with different types and statuses
      const activeAuthPolicy = await service.createSecurityPolicy({
        name: 'Active Authentication Policy',
        description: 'Currently active authentication requirements',
        policyType: 'authentication' as const,
        rules: { minLength: 8, requireSpecialChars: true },
        isActive: true,
        effectiveDate: new Date(),
        expiryDate: null
      });

      const inactiveAuthPolicy = await service.createSecurityPolicy({
        name: 'Inactive Authentication Policy',
        description: 'Deprecated authentication requirements',
        policyType: 'authentication' as const,
        rules: { minLength: 6, requireSpecialChars: false },
        isActive: false,
        effectiveDate: new Date(),
        expiryDate: null
      });

      const accessPolicy = await service.createSecurityPolicy({
        name: 'Access Control Policy',
        description: 'Access control requirements',
        policyType: 'authorization' as const,
        rules: { roleBasedAccess: true, timeBasedAccess: true },
        isActive: true,
        effectiveDate: new Date(),
        expiryDate: null
      });

      // Create multiple incidents with different properties
      const criticalIncident = await service.createSecurityIncident({
        title: 'Critical System Compromise',
        description: 'System compromise detected',
        incidentType: 'system_compromise' as const,
        severity: 'critical' as const,
        status: 'open' as const,
        reportedBy: 'system',
        assignedTo: 'admin1',
        occurredAt: new Date(),
        resolvedAt: null,
        resolution: null
      });

      const highIncident = await service.createSecurityIncident({
        title: 'High Severity Data Breach',
        description: 'Data breach detected',
        incidentType: 'data_breach' as const,
        severity: 'high' as const,
        status: 'open' as const,
        reportedBy: 'user1',
        assignedTo: 'admin2',
        occurredAt: new Date(),
        resolvedAt: null,
        resolution: null
      });

      const mediumIncident = await service.createSecurityIncident({
        title: 'Medium Severity Unauthorized Access',
        description: 'Unauthorized access attempt',
        incidentType: 'unauthorized_access' as const,
        severity: 'medium' as const,
        status: 'open' as const,
        reportedBy: 'user2',
        assignedTo: 'admin3',
        occurredAt: new Date(),
        resolvedAt: null,
        resolution: null
      });

      const lowIncident = await service.createSecurityIncident({
        title: 'Low Severity Malware',
        description: 'Malware detected',
        incidentType: 'malware' as const,
        severity: 'low' as const,
        status: 'open' as const,
        reportedBy: 'antivirus',
        assignedTo: 'admin4',
        occurredAt: new Date(),
        resolvedAt: null,
        resolution: null
      });

      // Test policy filtering
      const allPolicies = await service.getAllSecurityPolicies();
      expect(allPolicies).toHaveLength(3);

      const activePolicies = await service.getActivePolicies();
      expect(activePolicies).toHaveLength(2);
      expect(activePolicies.every(policy => policy.isActive === true)).toBe(true);

      const authPolicies = await service.getPoliciesByType('authentication');
      expect(authPolicies).toHaveLength(2);
      expect(authPolicies.every(policy => policy.policyType === 'authentication')).toBe(true);

      const accessPolicies = await service.getPoliciesByType('authorization');
      expect(accessPolicies).toHaveLength(1);
      expect(accessPolicies[0].policyType).toBe('authorization');

      // Test incident filtering
      const allIncidents = await service.getAllSecurityIncidents();
      expect(allIncidents).toHaveLength(4);

      const openIncidents = await service.getIncidentsByStatus('open');
      expect(openIncidents).toHaveLength(4);
      expect(openIncidents.every(incident => incident.status === 'open')).toBe(true);

      const criticalIncidents = await service.getIncidentsBySeverity('critical');
      expect(criticalIncidents).toHaveLength(1);
      expect(criticalIncidents[0].severity).toBe('critical');

      const highIncidents = await service.getIncidentsBySeverity('high');
      expect(highIncidents).toHaveLength(1);
      expect(highIncidents[0].severity).toBe('high');

      const mediumIncidents = await service.getIncidentsBySeverity('medium');
      expect(mediumIncidents).toHaveLength(1);
      expect(mediumIncidents[0].severity).toBe('medium');

      const lowIncidents = await service.getIncidentsBySeverity('low');
      expect(lowIncidents).toHaveLength(1);
      expect(lowIncidents[0].severity).toBe('low');

      const systemCompromiseIncidents = await service.getIncidentsByType('system_compromise');
      expect(systemCompromiseIncidents).toHaveLength(1);
      expect(systemCompromiseIncidents[0].incidentType).toBe('system_compromise');

      const dataBreachIncidents = await service.getIncidentsByType('data_breach');
      expect(dataBreachIncidents).toHaveLength(1);
      expect(dataBreachIncidents[0].incidentType).toBe('data_breach');

      const unauthorizedAccessIncidents = await service.getIncidentsByType('unauthorized_access');
      expect(unauthorizedAccessIncidents).toHaveLength(1);
      expect(unauthorizedAccessIncidents[0].incidentType).toBe('unauthorized_access');

      const malwareIncidents = await service.getIncidentsByType('malware');
      expect(malwareIncidents).toHaveLength(1);
      expect(malwareIncidents[0].incidentType).toBe('malware');

      // Clean up
      await service.deleteSecurityPolicy(activeAuthPolicy.id);
      await service.deleteSecurityPolicy(inactiveAuthPolicy.id);
      await service.deleteSecurityPolicy(accessPolicy.id);
      await service.deleteSecurityIncident(criticalIncident.id);
      await service.deleteSecurityIncident(highIncident.id);
      await service.deleteSecurityIncident(mediumIncident.id);
      await service.deleteSecurityIncident(lowIncident.id);
    });

    it('should handle error scenarios gracefully', async () => {
      // Test operations on non-existent policy
      await expect(service.getSecurityPolicyById('non-existent-id'))
        .rejects.toThrow('Security policy not found');

      await expect(service.updateSecurityPolicy('non-existent-id', { isActive: false }))
        .rejects.toThrow('Security policy not found');

      await expect(service.deleteSecurityPolicy('non-existent-id'))
        .rejects.toThrow('Security policy not found');

      // Test operations on non-existent incident
      await expect(service.getSecurityIncidentById('non-existent-id'))
        .rejects.toThrow('Security incident not found');

      await expect(service.updateSecurityIncident('non-existent-id', { status: 'resolved' }))
        .rejects.toThrow('Security incident not found');

      await expect(service.deleteSecurityIncident('non-existent-id'))
        .rejects.toThrow('Security incident not found');

      // Test filtering with non-existent criteria
      const nonExistentTypePolicies = await service.getPoliciesByType('non-existent-type');
      expect(nonExistentTypePolicies).toHaveLength(0);

      const nonExistentStatusIncidents = await service.getIncidentsByStatus('non-existent-status');
      expect(nonExistentStatusIncidents).toHaveLength(0);

      const nonExistentSeverityIncidents = await service.getIncidentsBySeverity('non-existent-severity');
      expect(nonExistentSeverityIncidents).toHaveLength(0);

      const nonExistentTypeIncidents = await service.getIncidentsByType('non-existent-type');
      expect(nonExistentTypeIncidents).toHaveLength(0);
    });
  });
});
