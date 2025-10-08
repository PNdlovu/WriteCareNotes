/**
 * @fileoverview Communication Adapter Factory
 * @module CommunicationAdapterFactory
 * @category Communication
 * @subcategory Services
 * @version 1.0.0
 * @since 2025-10-07
 * @author WriteCareNotes Development Team
 * 
 * @description
 * Factory service for creating, managing, and coordinating communication adapters.
 * Implements the Factory Pattern with adapter registry, health monitoring coordination,
 * and dynamic instantiation based on configuration.
 * 
 * Features:
 * - Adapter registration and lifecycle management
 * - Dynamic adapter instantiation
 * - Health check coordination across all adapters
 * - Adapter configuration validation
 * - Thread-safe adapter caching
 * 
 * @compliance
 * - GDPR Article 25: Data protection by design
 * - ISO 27001: Information security management
 * - Healthcare IT Standards (NHS Digital, CQC requirements)
 * 
 * @example
 * ```typescript
 * const factory = CommunicationAdapterFactory.getInstance();
 * 
 * // Register adapter class
 * factory.registerAdapter('whatsapp', WhatsAppBusinessAdapter);
 * 
 * // Create adapter instance
 * const adapter = await factory.createAdapter('whatsapp', config);
 * 
 * // Get all healthy adapters
 * const healthyAdapters = await factory.getHealthyAdapters();
 * ```
 */

import {
  ICommunicationAdapter,
  CommunicationChannelType,
  AdapterConfiguration,
  HealthCheckResult
} from '../../interfaces/communication/ICommunicationAdapter.js';
import { Logger } from '../../utils/Logger.js';

/**
 * Adapter constructor type
 * 
 * @typedef {new () => ICommunicationAdapter} AdapterConstructor
 */
export type AdapterConstructor = new () => ICommunicationAdapter;

/**
 * Adapter registry entry
 * 
 * @interface AdapterRegistryEntry
 */
export interface AdapterRegistryEntry {
  /** Adapter ID */
  adapterId: string;
  
  /** Adapter constructor */
  constructor: AdapterConstructor;
  
  /** Channel type */
  channelType: CommunicationChannelType;
  
  /** Channel name */
  channelName: string;
  
  /** Registration timestamp */
  registeredAt: Date;
}

/**
 * Adapter instance entry
 * 
 * @interface AdapterInstanceEntry
 */
export interface AdapterInstanceEntry {
  /** Adapter instance */
  adapter: ICommunicationAdapter;
  
  /** Configuration */
  configuration: AdapterConfiguration;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last health check result */
  lastHealthCheck?: HealthCheckResult;
  
  /** Last health check timestamp */
  lastHealthCheckAt?: Date;
}

/**
 * Factory statistics
 * 
 * @interface FactoryStatistics
 */
export interface FactoryStatistics {
  /** Total registered adapter types */
  totalRegisteredTypes: number;
  
  /** Total active adapter instances */
  totalActiveInstances: number;
  
  /** Healthy adapter instances */
  healthyInstances: number;
  
  /** Unhealthy adapter instances */
  unhealthyInstances: number;
  
  /** Adapter types breakdown */
  adapterTypes: Record<string, number>;
}

/**
 * Communication Adapter Factory
 * Singleton factory for managing communication adapters
 * 
 * @class CommunicationAdapterFactory
 */
export class CommunicationAdapterFactory {
  /** Singleton instance */
  private static instance: CommunicationAdapterFactory | null = null;
  
  /** Logger */
  private logger: Logger;
  
  /** Adapter registry (adapterId -> constructor) */
  private registry: Map<string, AdapterRegistryEntry> = new Map();
  
  /** Active adapter instances (organizationId:adapterId -> instance) */
  private instances: Map<string, AdapterInstanceEntry> = new Map();
  
  /** Health check interval timer */
  private healthCheckTimer: NodeJS.Timeout | null = null;
  
  /** Health check interval in milliseconds */
  private healthCheckIntervalMs = 60000; // 1 minute

  /**
   * Private constructor (singleton pattern)
   */
  private constructor() {
    this.logger = new Logger('CommunicationAdapterFactory');
    this.startHealthCheckMonitoring();
  }

  /**
   * Get singleton instance
   * 
   * @static
   * @returns {CommunicationAdapterFactory} Factory instance
   */
  public static getInstance(): CommunicationAdapterFactory {
    if (!CommunicationAdapterFactory.instance) {
      CommunicationAdapterFactory.instance = new CommunicationAdapterFactory();
    }
    return CommunicationAdapterFactory.instance;
  }

  /**
   * Register an adapter class
   * 
   * @param {string} adapterId - Unique adapter identifier
   * @param {AdapterConstructor} constructor - Adapter constructor
   * @throws {Error} If adapter already registered
   */
  public registerAdapter(adapterId: string, constructor: AdapterConstructor): void {
    this.logger.info('Registering adapter', { adapterId });

    if (this.registry.has(adapterId)) {
      throw new Error(`Adapter ${adapterId} is already registered`);
    }

    // Create temporary instance to get metadata
    const tempInstance = new constructor();
    
    const entry: AdapterRegistryEntry = {
      adapterId,
      constructor,
      channelType: tempInstance.channelType,
      channelName: tempInstance.channelName,
      registeredAt: new Date()
    };

    this.registry.set(adapterId, entry);
    
    this.logger.info('Adapter registered successfully', {
      adapterId,
      channelType: entry.channelType,
      channelName: entry.channelName
    });
  }

  /**
   * Unregister an adapter class
   * 
   * @param {string} adapterId - Adapter identifier
   */
  public unregisterAdapter(adapterId: string): void {
    this.logger.info('Unregistering adapter', { adapterId });

    // Shutdown all instances of this adapter type
    const instancesToShutdown: string[] = [];
    
    for (const [instanceKey, instanceEntry] of this.instances.entries()) {
      if (instanceEntry.adapter.adapterId === adapterId) {
        instancesToShutdown.push(instanceKey);
      }
    }

    for (const instanceKey of instancesToShutdown) {
      this.shutdownInstance(instanceKey);
    }

    // Remove from registry
    this.registry.delete(adapterId);
    
    this.logger.info('Adapter unregistered', {
      adapterId,
      shutdownInstances: instancesToShutdown.length
    });
  }

  /**
   * Create adapter instance
   * 
   * @param {string} adapterId - Adapter identifier
   * @param {AdapterConfiguration} configuration - Adapter configuration
   * @returns {Promise<ICommunicationAdapter>} Initialized adapter
   * @throws {Error} If adapter not registered or initialization fails
   */
  public async createAdapter(
    adapterId: string,
    configuration: AdapterConfiguration
  ): Promise<ICommunicationAdapter> {
    this.logger.info('Creating adapter instance', {
      adapterId,
      organizationId: configuration.organizationId
    });

    // Validate organization ID
    if (!configuration.organizationId) {
      throw new Error('Organization ID is required in adapter configuration');
    }

    // Check if adapter is registered
    const registryEntry = this.registry.get(adapterId);
    if (!registryEntry) {
      throw new Error(`Adapter ${adapterId} is not registered`);
    }

    // Generate instance key
    const instanceKey = this.getInstanceKey(configuration.organizationId, adapterId);

    // Check if instance already exists
    if (this.instances.has(instanceKey)) {
      this.logger.warn('Adapter instance already exists, returning existing', {
        instanceKey
      });
      return this.instances.get(instanceKey)!.adapter;
    }

    try {
      // Create new instance
      const adapter = new registryEntry.constructor();
      
      // Initialize adapter
      await adapter.initialize(configuration);

      // Store instance
      const instanceEntry: AdapterInstanceEntry = {
        adapter,
        configuration,
        createdAt: new Date()
      };

      this.instances.set(instanceKey, instanceEntry);

      this.logger.info('Adapter instance created successfully', {
        instanceKey,
        adapterId
      });

      return adapter;
    } catch (error) {
      this.logger.error('Failed to create adapter instance', {
        adapterId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Failed to create adapter ${adapterId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get adapter instance
   * 
   * @param {string} organizationId - Organization ID
   * @param {string} adapterId - Adapter identifier
   * @returns {ICommunicationAdapter | null} Adapter instance or null
   */
  public getAdapter(organizationId: string, adapterId: string): ICommunicationAdapter | null {
    const instanceKey = this.getInstanceKey(organizationId, adapterId);
    const instanceEntry = this.instances.get(instanceKey);
    
    return instanceEntry ? instanceEntry.adapter : null;
  }

  /**
   * Get all adapters for an organization
   * 
   * @param {string} organizationId - Organization ID
   * @returns {ICommunicationAdapter[]} List of adapters
   */
  public getAdaptersByOrganization(organizationId: string): ICommunicationAdapter[] {
    const adapters: ICommunicationAdapter[] = [];

    for (const [instanceKey, instanceEntry] of this.instances.entries()) {
      if (instanceKey.startsWith(`${organizationId}:`)) {
        adapters.push(instanceEntry.adapter);
      }
    }

    return adapters;
  }

  /**
   * Get all healthy adapters
   * 
   * @returns {Promise<ICommunicationAdapter[]>} List of healthy adapters
   */
  public async getHealthyAdapters(): Promise<ICommunicationAdapter[]> {
    const healthyAdapters: ICommunicationAdapter[] = [];

    for (const instanceEntry of this.instances.values()) {
      if (instanceEntry.lastHealthCheck && instanceEntry.lastHealthCheck.healthy) {
        healthyAdapters.push(instanceEntry.adapter);
      }
    }

    return healthyAdapters;
  }

  /**
   * Get all registered adapter types
   * 
   * @returns {AdapterRegistryEntry[]} List of registered adapters
   */
  public getRegisteredAdapters(): AdapterRegistryEntry[] {
    return Array.from(this.registry.values());
  }

  /**
   * Check if adapter is registered
   * 
   * @param {string} adapterId - Adapter identifier
   * @returns {boolean} True if registered
   */
  public isAdapterRegistered(adapterId: string): boolean {
    return this.registry.has(adapterId);
  }

  /**
   * Shutdown adapter instance
   * 
   * @param {string} organizationId - Organization ID
   * @param {string} adapterId - Adapter identifier
   * @returns {Promise<void>}
   */
  public async shutdownAdapter(organizationId: string, adapterId: string): Promise<void> {
    const instanceKey = this.getInstanceKey(organizationId, adapterId);
    await this.shutdownInstance(instanceKey);
  }

  /**
   * Shutdown all adapters for an organization
   * 
   * @param {string} organizationId - Organization ID
   * @returns {Promise<void>}
   */
  public async shutdownOrganizationAdapters(organizationId: string): Promise<void> {
    this.logger.info('Shutting down all adapters for organization', { organizationId });

    const instanceKeys: string[] = [];
    
    for (const [instanceKey] of this.instances.entries()) {
      if (instanceKey.startsWith(`${organizationId}:`)) {
        instanceKeys.push(instanceKey);
      }
    }

    for (const instanceKey of instanceKeys) {
      await this.shutdownInstance(instanceKey);
    }

    this.logger.info('Organization adapters shut down', {
      organizationId,
      count: instanceKeys.length
    });
  }

  /**
   * Shutdown all adapter instances
   * 
   * @returns {Promise<void>}
   */
  public async shutdownAll(): Promise<void> {
    this.logger.info('Shutting down all adapters');

    // Stop health check monitoring
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    const instanceKeys = Array.from(this.instances.keys());
    
    for (const instanceKey of instanceKeys) {
      await this.shutdownInstance(instanceKey);
    }

    this.logger.info('All adapters shut down', {
      count: instanceKeys.length
    });
  }

  /**
   * Get factory statistics
   * 
   * @returns {FactoryStatistics} Statistics
   */
  public getStatistics(): FactoryStatistics {
    const adapterTypes: Record<string, number> = {};
    let healthyCount = 0;
    let unhealthyCount = 0;

    for (const instanceEntry of this.instances.values()) {
      const adapterId = instanceEntry.adapter.adapterId;
      adapterTypes[adapterId] = (adapterTypes[adapterId] || 0) + 1;

      if (instanceEntry.lastHealthCheck) {
        if (instanceEntry.lastHealthCheck.healthy) {
          healthyCount++;
        } else {
          unhealthyCount++;
        }
      }
    }

    return {
      totalRegisteredTypes: this.registry.size,
      totalActiveInstances: this.instances.size,
      healthyInstances: healthyCount,
      unhealthyInstances: unhealthyCount,
      adapterTypes
    };
  }

  /**
   * Generate instance key
   * 
   * @private
   * @param {string} organizationId - Organization ID
   * @param {string} adapterId - Adapter ID
   * @returns {string} Instance key
   */
  private getInstanceKey(organizationId: string, adapterId: string): string {
    return `${organizationId}:${adapterId}`;
  }

  /**
   * Shutdown single instance
   * 
   * @private
   * @param {string} instanceKey - Instance key
   * @returns {Promise<void>}
   */
  private async shutdownInstance(instanceKey: string): Promise<void> {
    const instanceEntry = this.instances.get(instanceKey);
    
    if (!instanceEntry) {
      return;
    }

    this.logger.info('Shutting down adapter instance', { instanceKey });

    try {
      await instanceEntry.adapter.shutdown();
      this.instances.delete(instanceKey);
      
      this.logger.info('Adapter instance shut down successfully', { instanceKey });
    } catch (error) {
      this.logger.error('Error shutting down adapter instance', {
        instanceKey,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Start periodic health check monitoring
   * 
   * @private
   */
  private startHealthCheckMonitoring(): void {
    this.logger.info('Starting health check monitoring', {
      intervalMs: this.healthCheckIntervalMs
    });

    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.healthCheckIntervalMs);
  }

  /**
   * Perform health checks on all adapters
   * 
   * @private
   * @returns {Promise<void>}
   */
  private async performHealthChecks(): Promise<void> {
    this.logger.debug('Performing health checks', {
      instanceCount: this.instances.size
    });

    const healthCheckPromises: Promise<void>[] = [];

    for (const [instanceKey, instanceEntry] of this.instances.entries()) {
      const promise = this.checkAdapterHealth(instanceKey, instanceEntry);
      healthCheckPromises.push(promise);
    }

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Check health of single adapter
   * 
   * @private
   * @param {string} instanceKey - Instance key
   * @param {AdapterInstanceEntry} instanceEntry - Instance entry
   * @returns {Promise<void>}
   */
  private async checkAdapterHealth(
    instanceKey: string,
    instanceEntry: AdapterInstanceEntry
  ): Promise<void> {
    try {
      const healthResult = await instanceEntry.adapter.healthCheck();
      
      instanceEntry.lastHealthCheck = healthResult;
      instanceEntry.lastHealthCheckAt = new Date();

      if (!healthResult.healthy) {
        this.logger.warn('Adapter health check failed', {
          instanceKey,
          errors: healthResult.errors
        });
      }
    } catch (error) {
      this.logger.error('Health check threw error', {
        instanceKey,
        error: error instanceof Error ? error.message : String(error)
      });

      instanceEntry.lastHealthCheck = {
        healthy: false,
        adapterId: instanceEntry.adapter.adapterId,
        timestamp: new Date(),
        latencyMs: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      };
      instanceEntry.lastHealthCheckAt = new Date();
    }
  }

  /**
   * Set health check interval
   * 
   * @param {number} intervalMs - Interval in milliseconds
   */
  public setHealthCheckInterval(intervalMs: number): void {
    this.healthCheckIntervalMs = intervalMs;

    // Restart timer with new interval
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.startHealthCheckMonitoring();
    }
  }
}
