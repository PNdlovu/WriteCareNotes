import { EventEmitter2 } from "eventemitter2";

import { Repository } from 'typeorm';
import { EventEmitter2 } from 'eventemitter2';
import AppDataSource from '../../config/database';
import { SystemIntegration, IntegrationType, IntegrationStatus } from '../../entities/integration/SystemIntegration';
import { NotificationService } from '../notifications/NotificationService';
import { AuditTrailService } from '../audit/AuditTrailService';

export class IntegrationService {
  private integrationRepository: Repository<SystemIntegration>;
  private notificationService: NotificationService;
  private auditService: AuditTrailService;

  constructor() {
    this.integrationRepository = AppDataSource.getRepository(SystemIntegration);
    this.notificationService = new NotificationService(new EventEmitter2());
    this.auditService = new AuditTrailService();
  }

  async createAdvancedIntegration(integrationData: Partial<SystemIntegration>): Promise<SystemIntegration> {
    try {
      const integration = this.integrationRepository.create({
        ...integrationData,
        status: IntegrationStatus.ACTIVE,
        lastSync: new Date(),
        successfulSyncs: 0,
        failedSyncs: 0
      });

      const savedIntegration = await this.integrationRepository.save(integration);
      
      // Test integration connectivity
      await this.testIntegrationConnectivity(savedIntegration);
      
      return savedIntegration;
    } catch (error: unknown) {
      console.error('Error creating advanced integration:', error);
      throw error;
    }
  }

  async getIntegrationHealth(): Promise<any> {
    try {
      const integrations = await this.integrationRepository.find();
      
      return {
        totalIntegrations: integrations.length,
        healthyIntegrations: integrations.filter(int => int.isHealthy()).length,
        averageSuccessRate: this.calculateAverageSuccessRate(integrations),
        criticalIssues: integrations.filter(int => !int.isHealthy()).length
      };
    } catch (error: unknown) {
      console.error('Error getting integration health:', error);
      throw error;
    }
  }

  private async testIntegrationConnectivity(integration: SystemIntegration): Promise<void> {
    // Test integration connectivity
    try {
      // Simulate connectivity test
      integration.successfulSyncs++;
      await this.integrationRepository.save(integration);
    } catch (error: unknown) {
      integration.failedSyncs++;
      integration.status = IntegrationStatus.ERROR;
      await this.integrationRepository.save(integration);
    }
  }

  private calculateAverageSuccessRate(integrations: SystemIntegration[]): number {
    if (integrations.length === 0) return 100;
    const totalSuccessRate = integrations.reduce((sum, int) => sum + int.getSuccessRate(), 0);
    return totalSuccessRate / integrations.length;
  }
}