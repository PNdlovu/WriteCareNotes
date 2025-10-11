import { EventEmitter2 } from "eventemitter2";

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecurityService } from '../../../services/security/SecurityService';
import { SecurityPolicy } from '../../../entities/security/SecurityPolicy';
import { SecurityIncident } from '../../../entities/security/SecurityIncident';

describe('SecurityService', () => {
  let service: SecurityService;
  let securityPolicyRepository: Repository<SecurityPolicy>;
  let securityIncidentRepository: Repository<SecurityIncident>;

  const mockSecurityPolicyRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  };

  const mockSecurityIncidentRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityService,
        {
          provide: getRepositoryToken(SecurityPolicy),
          useValue: mockSecurityPolicyRepository,
        },
        {
          provide: getRepositoryToken(SecurityIncident),
          useValue: mockSecurityIncidentRepository,
        },
      ],
    }).compile();

    service = module.get<SecurityService>(SecurityService);
    securityPolicyRepository = module.get<Repository<SecurityPolicy>>(getRepositoryToken(SecurityPolicy));
    securityIncidentRepository = module.get<Repository<SecurityIncident>>(getRepositoryToken(SecurityIncident));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSecurityPolicy', () => {
    it('should create a new security policy successfully', async () => {
      const policyData = {
        name: 'Password Policy',
        description: 'Password requirements and rules',
        policyType: 'authentication' as const,
        rules: { minLength: 8, requireSpecialChars: true },
        isActive: true,
        effectiveDate: new Date(),
        expiryDate: null
      };

      const mockPolicy = { id: '1', ...policyData, createdAt: new Date(), updatedAt: new Date() };
      mockSecurityPolicyRepository.create.mockReturnValue(mockPolicy);
      mockSecurityPolicyRepository.save.mockResolvedValue(mockPolicy);

      const result = await service.createSecurityPolicy(policyData);

      expect(mockSecurityPolicyRepository.create).toHaveBeenCalledWith(policyData);
      expect(mockSecurityPolicyRepository.save).toHaveBeenCalledWith(mockPolicy);
      expect(result).toEqual(mockPolicy);
    });
  });

  describe('getAllSecurityPolicies', () => {
    it('should return all security policies', async () => {
      const mockPolicies = [
        { id: '1', name: 'Password Policy', policyType: 'authentication', isActive: true },
        { id: '2', name: 'Access Control Policy', policyType: 'authorization', isActive: true }
      ];

      mockSecurityPolicyRepository.find.mockResolvedValue(mockPolicies);

      const result = await service.getAllSecurityPolicies();

      expect(mockSecurityPolicyRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockPolicies);
    });
  });

  describe('getSecurityPolicyById', () => {
    it('should return security policy by id', async () => {
      const mockPolicy = { id: '1', name: 'Password Policy', policyType: 'authentication', isActive: true };
      mockSecurityPolicyRepository.findOne.mockResolvedValue(mockPolicy);

      const result = await service.getSecurityPolicyById('1');

      expect(mockSecurityPolicyRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(mockPolicy);
    });

    it('should throw error when security policy not found', async () => {
      mockSecurityPolicyRepository.findOne.mockResolvedValue(null);

      await expect(service.getSecurityPolicyById('1')).rejects.toThrow('Security policy not found');
    });
  });

  describe('updateSecurityPolicy', () => {
    it('should update security policy successfully', async () => {
      const updateData = { isActive: false, description: 'Updated password policy' };
      const mockPolicy = { id: '1', name: 'Password Policy', policyType: 'authentication', ...updateData };

      mockSecurityPolicyRepository.findOne.mockResolvedValue(mockPolicy);
      mockSecurityPolicyRepository.save.mockResolvedValue(mockPolicy);

      const result = await service.updateSecurityPolicy('1', updateData);

      expect(mockSecurityPolicyRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockSecurityPolicyRepository.save).toHaveBeenCalledWith(mockPolicy);
      expect(result).toEqual(mockPolicy);
    });

    it('should throw error when security policy not found', async () => {
      mockSecurityPolicyRepository.findOne.mockResolvedValue(null);

      await expect(service.updateSecurityPolicy('1', { isActive: false })).rejects.toThrow('Security policy not found');
    });
  });

  describe('deleteSecurityPolicy', () => {
    it('should delete security policy successfully', async () => {
      const mockPolicy = { id: '1', name: 'Password Policy', policyType: 'authentication', isActive: true };
      mockSecurityPolicyRepository.findOne.mockResolvedValue(mockPolicy);
      mockSecurityPolicyRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteSecurityPolicy('1');

      expect(mockSecurityPolicyRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockSecurityPolicyRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw error when security policy not found', async () => {
      mockSecurityPolicyRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteSecurityPolicy('1')).rejects.toThrow('Security policy not found');
    });
  });

  describe('createSecurityIncident', () => {
    it('should create a new security incident successfully', async () => {
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

      const mockIncident = { id: '1', ...incidentData, createdAt: new Date(), updatedAt: new Date() };
      mockSecurityIncidentRepository.create.mockReturnValue(mockIncident);
      mockSecurityIncidentRepository.save.mockResolvedValue(mockIncident);

      const result = await service.createSecurityIncident(incidentData);

      expect(mockSecurityIncidentRepository.create).toHaveBeenCalledWith(incidentData);
      expect(mockSecurityIncidentRepository.save).toHaveBeenCalledWith(mockIncident);
      expect(result).toEqual(mockIncident);
    });
  });

  describe('getAllSecurityIncidents', () => {
    it('should return all security incidents', async () => {
      const mockIncidents = [
        { id: '1', title: 'Unauthorized Access', incidentType: 'unauthorized_access', severity: 'high', status: 'open' },
        { id: '2', title: 'Data Breach', incidentType: 'data_breach', severity: 'critical', status: 'resolved' }
      ];

      mockSecurityIncidentRepository.find.mockResolvedValue(mockIncidents);

      const result = await service.getAllSecurityIncidents();

      expect(mockSecurityIncidentRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockIncidents);
    });
  });

  describe('getSecurityIncidentById', () => {
    it('should return security incident by id', async () => {
      const mockIncident = { id: '1', title: 'Unauthorized Access', incidentType: 'unauthorized_access', severity: 'high', status: 'open' };
      mockSecurityIncidentRepository.findOne.mockResolvedValue(mockIncident);

      const result = await service.getSecurityIncidentById('1');

      expect(mockSecurityIncidentRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(mockIncident);
    });

    it('should throw error when security incident not found', async () => {
      mockSecurityIncidentRepository.findOne.mockResolvedValue(null);

      await expect(service.getSecurityIncidentById('1')).rejects.toThrow('Security incident not found');
    });
  });

  describe('updateSecurityIncident', () => {
    it('should update security incident successfully', async () => {
      const updateData = { status: 'in_progress' as const, assignedTo: 'admin2' };
      const mockIncident = { id: '1', title: 'Unauthorized Access', incidentType: 'unauthorized_access', severity: 'high', ...updateData };

      mockSecurityIncidentRepository.findOne.mockResolvedValue(mockIncident);
      mockSecurityIncidentRepository.save.mockResolvedValue(mockIncident);

      const result = await service.updateSecurityIncident('1', updateData);

      expect(mockSecurityIncidentRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockSecurityIncidentRepository.save).toHaveBeenCalledWith(mockIncident);
      expect(result).toEqual(mockIncident);
    });

    it('should throw error when security incident not found', async () => {
      mockSecurityIncidentRepository.findOne.mockResolvedValue(null);

      await expect(service.updateSecurityIncident('1', { status: 'in_progress' })).rejects.toThrow('Security incident not found');
    });
  });

  describe('deleteSecurityIncident', () => {
    it('should delete security incident successfully', async () => {
      const mockIncident = { id: '1', title: 'Unauthorized Access', incidentType: 'unauthorized_access', severity: 'high', status: 'open' };
      mockSecurityIncidentRepository.findOne.mockResolvedValue(mockIncident);
      mockSecurityIncidentRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteSecurityIncident('1');

      expect(mockSecurityIncidentRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockSecurityIncidentRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw error when security incident not found', async () => {
      mockSecurityIncidentRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteSecurityIncident('1')).rejects.toThrow('Security incident not found');
    });
  });

  describe('getIncidentsByStatus', () => {
    it('should return incidents by status', async () => {
      const mockIncidents = [
        { id: '1', title: 'Unauthorized Access', incidentType: 'unauthorized_access', severity: 'high', status: 'open' }
      ];

      mockSecurityIncidentRepository.find.mockResolvedValue(mockIncidents);

      const result = await service.getIncidentsByStatus('open');

      expect(mockSecurityIncidentRepository.find).toHaveBeenCalledWith({
        where: { status: 'open' }
      });
      expect(result).toEqual(mockIncidents);
    });
  });

  describe('getIncidentsBySeverity', () => {
    it('should return incidents by severity', async () => {
      const mockIncidents = [
        { id: '1', title: 'Unauthorized Access', incidentType: 'unauthorized_access', severity: 'high', status: 'open' }
      ];

      mockSecurityIncidentRepository.find.mockResolvedValue(mockIncidents);

      const result = await service.getIncidentsBySeverity('high');

      expect(mockSecurityIncidentRepository.find).toHaveBeenCalledWith({
        where: { severity: 'high' }
      });
      expect(result).toEqual(mockIncidents);
    });
  });

  describe('getIncidentsByType', () => {
    it('should return incidents by type', async () => {
      const mockIncidents = [
        { id: '1', title: 'Unauthorized Access', incidentType: 'unauthorized_access', severity: 'high', status: 'open' }
      ];

      mockSecurityIncidentRepository.find.mockResolvedValue(mockIncidents);

      const result = await service.getIncidentsByType('unauthorized_access');

      expect(mockSecurityIncidentRepository.find).toHaveBeenCalledWith({
        where: { incidentType: 'unauthorized_access' }
      });
      expect(result).toEqual(mockIncidents);
    });
  });

  describe('getActivePolicies', () => {
    it('should return active security policies', async () => {
      const mockPolicies = [
        { id: '1', name: 'Password Policy', policyType: 'authentication', isActive: true }
      ];

      mockSecurityPolicyRepository.find.mockResolvedValue(mockPolicies);

      const result = await service.getActivePolicies();

      expect(mockSecurityPolicyRepository.find).toHaveBeenCalledWith({
        where: { isActive: true }
      });
      expect(result).toEqual(mockPolicies);
    });
  });

  describe('getPoliciesByType', () => {
    it('should return policies by type', async () => {
      const mockPolicies = [
        { id: '1', name: 'Password Policy', policyType: 'authentication', isActive: true }
      ];

      mockSecurityPolicyRepository.find.mockResolvedValue(mockPolicies);

      const result = await service.getPoliciesByType('authentication');

      expect(mockSecurityPolicyRepository.find).toHaveBeenCalledWith({
        where: { policyType: 'authentication' }
      });
      expect(result).toEqual(mockPolicies);
    });
  });
});
