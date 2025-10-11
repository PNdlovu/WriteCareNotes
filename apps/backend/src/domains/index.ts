/**
 * Domain System - Centralized domain management
 * Provides a unified interface for all domain modules
 */

// Core domain system
export { default as DomainRegistry } from './registry';
export { default as DomainFactory } from './factory/DomainFactory';
export { default as DomainConfigManager } from './config/DomainConfig';
export { default as DomainMiddleware } from './middleware/DomainMiddleware';
export { default as DomainRouter } from './routing/DomainRouter';

// Domain modules
export * as AIDomain from './ai';
export * as FinanceDomain from './finance';
export * as EngagementDomain from './engagement';

// Types
export * from './types/DomainModule';

// Domain initialization helper
export class DomainSystem {
  private static instance: DomainSystem;
  privatefactory: DomainFactory;
  privateregistry: DomainRegistry;
  privateconfigManager: DomainConfigManager;

  private constructor() {
    this.factory = DomainFactory.getInstance();
    this.registry = DomainRegistry.getInstance();
    this.configManager = DomainConfigManager.getInstance();
  }

  public static getInstance(): DomainSystem {
    if (!DomainSystem.instance) {
      DomainSystem.instance = new DomainSystem();
    }
    return DomainSystem.instance;
  }

  /**
   * Initialize the entire domain system
   */
  public async initialize(): Promise<void> {
    console.log('🚀 Initializing Domain System...');
    
    try {
      // Initialize all domains
      await this.factory.initializeAllDomains();
      
      // Verify all domains are healthy
      const healthStatus = await this.factory.getAllDomainsHealth();
      const unhealthyDomains = Object.entries(healthStatus)
        .filter(([_, status]) => !status.healthy)
        .map(([name, _]) => name);

      if (unhealthyDomains.length > 0) {
        console.warn(`⚠️  Unhealthy domains: ${unhealthyDomains.join(', ')}`);
      }

      console.log('✅ Domain System initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Domain System:', error);
      throw error;
    }
  }

  /**
   * Shutdown the entire domain system
   */
  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Domain System...');
    
    try {
      await this.factory.shutdownAllDomains();
      console.log('✅ Domain System shutdown successfully');
    } catch (error) {
      console.error('❌ Failed to shutdown Domain System:', error);
      throw error;
    }
  }

  /**
   * Get domain health status
   */
  public async getHealthStatus(): Promise<Record<string, any>> {
    return await this.factory.getAllDomainsHealth();
  }

  /**
   * Get domain by name
   */
  public getDomain(name: string): DomainModule | undefined {
    return this.registry.getDomain(name);
  }

  /**
   * Get all domains
   */
  public getAllDomains(): Map<string, DomainModule> {
    return this.registry.getAllDomains();
  }

  /**
   * Get domain configuration
   */
  public getDomainConfig(name: string): any {
    return this.configManager.getConfiguration(name);
  }

  /**
   * Check if domain is enabled
   */
  public isDomainEnabled(name: string): boolean {
    return this.configManager.isDomainEnabled(name);
  }
}

// Default export
export default DomainSystem;
