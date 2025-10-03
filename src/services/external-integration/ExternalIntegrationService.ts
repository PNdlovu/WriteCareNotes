import { EventEmitter2 } from "eventemitter2";

import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { ExternalSystem, SystemType, IntegrationStatus } from '../../entities/external-integration/ExternalSystem';
import { AuditTrailService } from '../audit/AuditTrailService';

export class ExternalIntegrationService {
  private systemRepository: Repository<ExternalSystem>;
  private auditService: AuditTrailService;

  constructor() {
    this.systemRepository = AppDataSource.getRepository(ExternalSystem);
    this.auditService = new AuditTrailService();
  }

  async createExternalSystem(systemData: Partial<ExternalSystem>): Promise<ExternalSystem> {
    try {
      const systemId = await this.generateSystemId();
      
      const system = this.systemRepository.create({
        ...systemData,
        systemId,
        status: IntegrationStatus.TESTING,
        connectionConfig: {
          endpoint: systemData.connectionConfig?.endpoint || 'https://api.example.com',
          authentication: { type: 'oauth2', credentials: 'encrypted' },
          timeout: 30000,
          retryPolicy: { maxRetries: 3, backoffMs: 1000 }
        },
        dataMapping: {
          inboundMappings: [],
          outboundMappings: [],
          transformationRules: []
        },
        totalTransactions: 0,
        failedTransactions: 0
      });

      const savedSystem = await this.systemRepository.save(system);
      
      await this.auditService.logEvent({
        resource: 'ExternalSystem',
        entityType: 'ExternalSystem',
        entityId: savedSystem.id,
        action: 'CREATE_EXTERNAL_SYSTEM',
        details: { systemId: savedSystem.systemId, systemType: savedSystem.systemType },
        userId: 'integration_system'
      });

      return savedSystem;
    } catch (error: unknown) {
      console.error('Error creating external system:', error);
      throw error;
    }
  }

  async getIntegrationAnalytics(): Promise<any> {
    try {
      const allSystems = await this.systemRepository.find();
      
      return {
        totalSystems: allSystems.length,
        activeSystems: allSystems.filter(sys => sys.status === IntegrationStatus.ACTIVE).length,
        averageSuccessRate: allSystems.reduce((sum, sys) => sum + sys.calculateSuccessRate(), 0) / allSystems.length,
        healthySystems: allSystems.filter(sys => sys.isHealthy()).length,
        systemsByType: this.calculateSystemDistribution(allSystems)
      };
    } catch (error: unknown) {
      console.error('Error getting integration analytics:', error);
      throw error;
    }
  }

  private async generateSystemId(): Promise<string> {
    const count = await this.systemRepository.count();
    return `EXT${String(count + 1).padStart(4, '0')}`;
  }

  private calculateSystemDistribution(systems: ExternalSystem[]): any {
    return systems.reduce((acc, system) => {
      acc[system.systemType] = (acc[system.systemType] || 0) + 1;
      return acc;
    }, {});
  }
}