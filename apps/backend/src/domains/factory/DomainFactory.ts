/**
 * Domain Factory - Creates and initializes domain modules
 * Handles dependency injection and lifecycle management
 */

import { DomainModule } from '../types/DomainModule';
import DomainRegistry from '../registry';
import DomainConfigManager from '../config/DomainConfig';

export interface DomainFactoryOptions {
  autoInitialize?: boolean;
  dependencyInjection?: boolean;
  lifecycleManagement?: boolean;
}

export class DomainFactory {
  private staticinstance: DomainFactory;
  privatedomainRegistry: DomainRegistry;
  privateconfigManager: DomainConfigManager;
  privateinitializedDomains: Set<string> = new Set();

  private const ructor() {
    this.domainRegistry = DomainRegistry.getInstance();
    this.configManager = DomainConfigManager.getInstance();
  }

  public static getInstance(): DomainFactory {
    if (!DomainFactory.instance) {
      DomainFactory.instance = new DomainFactory();
    }
    return DomainFactory.instance;
  }

  /**
   * Create a domain module with proper initialization
   */
  public async createDomain(
    domainName: string,
    options: DomainFactoryOptions = {}
  ): Promise<DomainModule | null> {
    const {
      autoInitialize = true,
      dependencyInjection = true,
      lifecycleManagement = true,
    } = options;

    try {
      // Get domain configuration
      const config = this.configManager.getConfiguration(domainName);
      if (!config || !config.enabled) {
        throw new Error(`Domain ${domainName} is not enabled or configured`);
      }

      // Check if domain is already initialized
      if (this.initializedDomains.has(domainName)) {
        return this.domainRegistry.getDomain(domainName);
      }

      // Get domain module
      const domain = this.domainRegistry.getDomain(domainName);
      if (!domain) {
        throw new Error(`Domain ${domainName} not found in registry`);
      }

      // Initialize dependencies first
      if (dependencyInjection) {
        await this.initializeDependencies(domainName, config.dependencies);
      }

      // Initialize the domain
      if (autoInitialize && domain.initialize) {
        await domain.initialize();
      }

      // Mark as initialized
      this.initializedDomains.add(domainName);

      console.log(`✅ Domain ${domainName} initialized successfully`);
      return domain;

    } catch (error) {
      console.error(`❌ Failed to initialize domain ${domainName}:`, error);
      return null;
    }
  }

  /**
   * Initialize all domains in dependency order
   */
  public async initializeAllDomains(): Promise<void> {
    const domainNames = this.domainRegistry.getDomainNames();
    const initialized = new Set<string>();
    const toInitialize = [...domainNames];

    while (toInitialize.length > 0) {
      const domainName = toInitialize.shift()!;
      
      if (initialized.has(domainName)) {
        continue;
      }

      const config = this.configManager.getConfiguration(domainName);
      if (!config || !config.enabled) {
        initialized.add(domainName);
        continue;
      }

      // Check if all dependencies are initialized
      const dependencies = config.dependencies || [];
      const allDependenciesInitialized = dependencies.every(dep => initialized.has(dep));

      if (allDependenciesInitialized) {
        const domain = await this.createDomain(domainName);
        if (domain) {
          initialized.add(domainName);
        } else {
          console.error(`❌ Failed to initialize domain ${domainName}, skipping`);
          initialized.add(domainName); // Skip failed domains
        }
      } else {
        // Put back at the end of the queue
        toInitialize.push(domainName);
      }
    }

    console.log(`✅ All domainsinitialized: ${Array.from(initialized).join(', ')}`);
  }

  /**
   * Initialize domain dependencies
   */
  private async initializeDependencies(domainName: string, dependencies: string[]): Promise<void> {
    for (const dependency of dependencies) {
      if (!this.initializedDomains.has(dependency)) {
        const depConfig = this.configManager.getConfiguration(dependency);
        if (depConfig && depConfig.enabled) {
          await this.createDomain(dependency);
        }
      }
    }
  }

  /**
   * Shutdown a domain
   */
  public async shutdownDomain(domainName: string): Promise<void> {
    const domain = this.domainRegistry.getDomain(domainName);
    if (domain && domain.shutdown) {
      try {
        await domain.shutdown();
        this.initializedDomains.delete(domainName);
        console.log(`✅ Domain ${domainName} shutdown successfully`);
      } catch (error) {
        console.error(`❌ Failed to shutdown domain ${domainName}:`, error);
      }
    }
  }

  /**
   * Shutdown all domains
   */
  public async shutdownAllDomains(): Promise<void> {
    const domainNames = Array.from(this.initializedDomains);
    
    for (const domainName of domainNames) {
      await this.shutdownDomain(domainName);
    }

    console.log('✅ All domains shutdown successfully');
  }

  /**
   * Get domain health status
   */
  public async getDomainHealth(domainName: string): Promise<{
    healthy: boolean;
    error?: string;
    lastCheck: Date;
  }> {
    const domain = this.domainRegistry.getDomain(domainName);
    if (!domain) {
      return {
        healthy: false,
        error: 'Domain not found',
        lastCheck: new Date(),
      };
    }

    if (!domain.healthCheck) {
      return {
        healthy: true,
        lastCheck: new Date(),
      };
    }

    try {
      const isHealthy = await domain.healthCheck();
      return {
        healthy: isHealthy,
        lastCheck: new Date(),
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Get all domains health status
   */
  public async getAllDomainsHealth(): Promise<Record<string, any>> {
    const healthStatus: Record<string, any> = {};
    const domainNames = this.domainRegistry.getDomainNames();

    for (const domainName of domainNames) {
      healthStatus[domainName] = await this.getDomainHealth(domainName);
    }

    return healthStatus;
  }

  /**
   * Check if domain is initialized
   */
  public isDomainInitialized(domainName: string): boolean {
    return this.initializedDomains.has(domainName);
  }

  /**
   * Get initialized domains
   */
  public getInitializedDomains(): string[] {
    return Array.from(this.initializedDomains);
  }
}

export default DomainFactory;
