import { EventEmitter2 } from "eventemitter2";

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityService } from '../../../services/security/SecurityService';
import { SecurityPolicy } from '../../../entities/security/SecurityPolicy';
import { SecurityIncident } from '../../../entities/security/SecurityIncident';

describe('SecurityService Integration Tests', () => {
  letservice: SecurityService;
  letmodule: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
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

    service = module.get<SecurityService>(SecurityService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Security Policy Management Integration', () => {
    it('should create, read, update, and delete security policies', async () => {
      // Create a security policy
      const policyData = {
        name: 'Password Policy',
        description: 'Password requirements and rules',
        policyType: 'authentication' as const,
        rules: { minLength: 8, requireSpecialChars: true, requireNumbers: true },
        isActive: true,
        effectiveDate: new Date(),
        expiryDate: null
      };

      const createdPolicy = await service.createSecurityPolicy(policyData);
      expect(createdPolicy).toBeDefined();
      expect(createdPolicy.name).toBe('Password Policy');
      expect(createdPolicy.policyType).toBe('authentication');
      expect(createdPolicy.isActive).toBe(true);

      // Read the security policy
      const retrievedPolicy = await service.getSecurityPolicyById(createdPolicy.id);
      expect(retrievedPolicy).toBeDefined();
      expect(retrievedPolicy.name).toBe('Password Policy');

      // Update the security policy
      const updateData = { isActive: false, description: 'Updated password policy' };
      const updatedPolicy = await service.updateSecurityPolicy(createdPolicy.id, updateData);
      expect(updatedPolicy.isActive).toBe(false);
      expect(updatedPolicy.description).toBe('Updated password policy');

      // Delete the security policy
      await service.deleteSecurityPolicy(createdPolicy.id);
      await expect(service.getSecurityPolicyById(createdPolicy.id)).rejects.toThrow('Security policy not found');
    });

    it('should filter policies by type and active status', async () => {
      // Create multiple policies with different types and statuses
      const authPolicy = await service.createSecurityPolicy({
        name: 'Authentication Policy',
        description: 'Authentication requirements',
        policyType: 'authentication' as const,
        rules: { minLength: 8, requireSpecialChars: true },
        isActive: true,
        effectiveDate: new Date(),
        expiryDate: null
      });

      const authPolicy2 = await service.createSecurityPolicy({
        name: 'Advanced Authentication Policy',
        description: 'Advanced authentication requirements',
        policyType: 'authentication' as const,
        rules: { minLength: 12, requireSpecialChars: true, requireBiometric: true },
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

      const dataPolicy = await service.createSecurityPolicy({
        name: 'Data Protection Policy',
        description: 'Data protection requirements',
        policyType: 'data_protection' as const,
        rules: { encryptionRequired: true, dataRetention: '7 years' },
        isActive: true,
        effectiveDate: new Date(),
        expiryDate: null
      });

      // Test filtering by type
      const authPolicies = await service.getPoliciesByType('authentication');
      expect(authPolicies).toHaveLength(2);
      expect(authPolicies.every(policy => policy.policyType === 'authentication')).toBe(true);

      const accessPolicies = await service.getPoliciesByType('authorization');
      expect(accessPolicies).toHaveLength(1);
      expect(accessPolicies[0].policyType).toBe('authorization');

      const dataPolicies = await service.getPoliciesByType('data_protection');
      expect(dataPolicies).toHaveLength(1);
      expect(dataPolicies[0].policyType).toBe('data_protection');

      // Test filtering by active status
      const activePolicies = await service.getActivePolicies();
      expect(activePolicies).toHaveLength(3);
      expect(activePolicies.every(policy => policy.isActive === true)).toBe(true);
    });
  });

  describe('Security Incident Management Integration', () => {
    it('should create, read, update, and delete security incidents', async () => {
      // Create a security incident
      const incidentData = {
        title: 'Unauthorized Access Attempt',
        description: 'Multiple failed login attempts detected',
        incidentType: 'unauthorized_access' as const,
        severity: 'medium' as const,
        status: 'open' as const,
        reportedBy: 'user1',
        assignedTo: 'admin1',
        occurredAt: new Date(),
        resolvedAt: null,
        resolution: null
      };

      const createdIncident = await service.createSecurityIncident(incidentData);
      expect(createdIncident).toBeDefined();
      expect(createdIncident.title).toBe('Unauthorized Access Attempt');
      expect(createdIncident.incidentType).toBe('unauthorized_access');
      expect(createdIncident.severity).toBe('medium');
      expect(createdIncident.status).toBe('open');

      // Read the security incident
      const retrievedIncident = await service.getSecurityIncidentById(createdIncident.id);
      expect(retrievedIncident).toBeDefined();
      expect(retrievedIncident.title).toBe('Unauthorized Access Attempt');

      // Update the security incident
      const updateData = { status: 'in_progress' as const, assignedTo: 'admin2' };
      const updatedIncident = await service.updateSecurityIncident(createdIncident.id, updateData);
      expect(updatedIncident.status).toBe('in_progress');
      expect(updatedIncident.assignedTo).toBe('admin2');

      // Delete the security incident
      await service.deleteSecurityIncident(createdIncident.id);
      await expect(service.getSecurityIncidentById(createdIncident.id)).rejects.toThrow('Security incident not found');
    });

    it('should filter incidents by status, severity, and type', async () => {
      // Create multiple incidents with different properties
      const incident1 = await service.createSecurityIncident({
        title: 'High Severity Unauthorized Access',
        description: 'Critical unauthorized access attempt',
        incidentType: 'unauthorized_access' as const,
        severity: 'high' as const,
        status: 'open' as const,
        reportedBy: 'user1',
        assignedTo: 'admin1',
        occurredAt: new Date(),
        resolvedAt: null,
        resolution: null
      });

      const incident2 = await service.createSecurityIncident({
        title: 'Medium Severity Data Breach',
        description: 'Potential data breach detected',
        incidentType: 'data_breach' as const,
        severity: 'medium' as const,
        status: 'in_progress' as const,
        reportedBy: 'user2',
        assignedTo: 'admin2',
        occurredAt: new Date(),
        resolvedAt: null,
        resolution: null
      });

      const incident3 = await service.createSecurityIncident({
        title: 'Low Severity Malware',
        description: 'Malware detected and contained',
        incidentType: 'malware' as const,
        severity: 'low' as const,
        status: 'resolved' as const,
        reportedBy: 'user3',
        assignedTo: 'admin3',
        occurredAt: new Date(),
        resolvedAt: new Date(),
        resolution: 'Malware removed and system secured'
      });

      const incident4 = await service.createSecurityIncident({
        title: 'Critical System Compromise',
        description: 'System compromise detected',
        incidentType: 'system_compromise' as const,
        severity: 'critical' as const,
        status: 'open' as const,
        reportedBy: 'user4',
        assignedTo: 'admin1',
        occurredAt: new Date(),
        resolvedAt: null,
        resolution: null
      });

      // Test filtering by status
      const openIncidents = await service.getIncidentsByStatus('open');
      expect(openIncidents).toHaveLength(2);
      expect(openIncidents.every(incident => incident.status === 'open')).toBe(true);

      const inProgressIncidents = await service.getIncidentsByStatus('in_progress');
      expect(inProgressIncidents).toHaveLength(1);
      expect(inProgressIncidents[0].status).toBe('in_progress');

      const resolvedIncidents = await service.getIncidentsByStatus('resolved');
      expect(resolvedIncidents).toHaveLength(1);
      expect(resolvedIncidents[0].status).toBe('resolved');

      // Test filtering by severity
      const highSeverityIncidents = await service.getIncidentsBySeverity('high');
      expect(highSeverityIncidents).toHaveLength(1);
      expect(highSeverityIncidents[0].severity).toBe('high');

      const mediumSeverityIncidents = await service.getIncidentsBySeverity('medium');
      expect(mediumSeverityIncidents).toHaveLength(1);
      expect(mediumSeverityIncidents[0].severity).toBe('medium');

      const criticalSeverityIncidents = await service.getIncidentsBySeverity('critical');
      expect(criticalSeverityIncidents).toHaveLength(1);
      expect(criticalSeverityIncidents[0].severity).toBe('critical');

      // Test filtering by type
      const unauthorizedAccessIncidents = await service.getIncidentsByType('unauthorized_access');
      expect(unauthorizedAccessIncidents).toHaveLength(1);
      expect(unauthorizedAccessIncidents[0].incidentType).toBe('unauthorized_access');

      const dataBreachIncidents = await service.getIncidentsByType('data_breach');
      expect(dataBreachIncidents).toHaveLength(1);
      expect(dataBreachIncidents[0].incidentType).toBe('data_breach');

      const malwareIncidents = await service.getIncidentsByType('malware');
      expect(malwareIncidents).toHaveLength(1);
      expect(malwareIncidents[0].incidentType).toBe('malware');
    });

    it('should handle incident lifecycle management', async () => {
      // Create an incident
      const incidentData = {
        title: 'Security Incident Lifecycle Test',
        description: 'Testing incident lifecycle management',
        incidentType: 'unauthorized_access' as const,
        severity: 'medium' as const,
        status: 'open' as const,
        reportedBy: 'user1',
        assignedTo: 'admin1',
        occurredAt: new Date(),
        resolvedAt: null,
        resolution: null
      };

      const createdIncident = await service.createSecurityIncident(incidentData);

      // Move to in progress
      await service.updateSecurityIncident(createdIncident.id, {
        status: 'in_progress' as const,
        assignedTo: 'admin2'
      });

      let updatedIncident = await service.getSecurityIncidentById(createdIncident.id);
      expect(updatedIncident.status).toBe('in_progress');
      expect(updatedIncident.assignedTo).toBe('admin2');

      // Resolve the incident
      await service.updateSecurityIncident(createdIncident.id, {
        status: 'resolved' as const,
        resolvedAt: new Date(),
        resolution: 'Incident resolved successfully'
      });

      updatedIncident = await service.getSecurityIncidentById(createdIncident.id);
      expect(updatedIncident.status).toBe('resolved');
      expect(updatedIncident.resolvedAt).toBeDefined();
      expect(updatedIncident.resolution).toBe('Incident resolved successfully');
    });
  });
});
