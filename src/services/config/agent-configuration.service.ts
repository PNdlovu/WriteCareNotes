import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { 
  AgentConfiguration, 
  AgentDeploymentConfig,
  AgentRolloutPlan 
} from '../../types/pilot-feedback-agent.types';
import { DatabaseService } from '../database/database.service';
import { AgentFeatureFlagsService } from './agent-feature-flags.service';

export class AgentConfigurationService {
  private db: DatabaseService;
  private featureFlags: AgentFeatureFlagsService;
  private configCache: Map<string, AgentConfiguration> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.db = new DatabaseService();
    this.featureFlags = new AgentFeatureFlagsService();
  }

  /**
   * Get agent configuration for tenant
   */
  async getAgentConfiguration(tenantId: string): Promise<AgentConfiguration> {
    const cacheKey = `config:${tenantId}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      const cached = this.configCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Fetch from database
    const config = await this.fetchAgentConfiguration(tenantId);
    
    // Cache the result
    this.configCache.set(cacheKey, config);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

    return config;
  }

  /**
   * Update agent configuration for tenant
   */
  async updateAgentConfiguration(
    tenantId: string,
    updates: Partial<AgentConfiguration>,
    updatedBy: string
  ): Promise<void> {
    const existingConfig = await this.getAgentConfiguration(tenantId);
    const updatedConfig = {
      ...existingConfig,
      ...updates,
      updatedAt: new Date()
    };

    // Validate configuration
    await this.validateConfiguration(updatedConfig);

    // Update in database
    await this.storeAgentConfiguration(updatedConfig);

    // Update cache
    const cacheKey = `config:${tenantId}`;
    this.configCache.set(cacheKey, updatedConfig);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

    // Log configuration change
    await this.logConfigurationChange(tenantId, existingConfig, updatedConfig, updatedBy);

    logger.info('Agent configuration updated', {
      tenantId,
      updatedBy,
      changes: Object.keys(updates)
    });
  }

  /**
   * Create rollout plan for agent deployment
   */
  async createRolloutPlan(plan: Omit<AgentRolloutPlan, 'status'>): Promise<AgentRolloutPlan> {
    const rolloutPlan: AgentRolloutPlan = {
      ...plan,
      status: 'planned'
    };

    const query = `
      INSERT INTO agent_rollout_plans (
        id, phase, tenants, features, success_criteria, 
        start_date, end_date, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      uuidv4(),
      rolloutPlan.phase,
      JSON.stringify(rolloutPlan.tenants),
      JSON.stringify(rolloutPlan.features),
      JSON.stringify(rolloutPlan.successCriteria),
      rolloutPlan.startDate,
      rolloutPlan.endDate,
      rolloutPlan.status,
      new Date()
    ];

    await this.db.query(query, values);

    logger.info('Rollout plan created', {
      planId: rolloutPlan.phase,
      tenants: rolloutPlan.tenants.length,
      features: rolloutPlan.features.length
    });

    return rolloutPlan;
  }

  /**
   * Update rollout plan status
   */
  async updateRolloutPlanStatus(
    planId: string,
    status: AgentRolloutPlan['status'],
    updatedBy: string
  ): Promise<void> {
    const query = `
      UPDATE agent_rollout_plans 
      SET status = ?, updated_at = ?, updated_by = ?
      WHERE id = ?
    `;

    await this.db.query(query, [status, new Date(), updatedBy, planId]);

    logger.info('Rollout plan status updated', {
      planId,
      status,
      updatedBy
    });
  }

  /**
   * Get deployment configuration
   */
  async getDeploymentConfig(environment: string): Promise<AgentDeploymentConfig> {
    const query = `
      SELECT 
        environment, region, scaling, resources, 
        monitoring, security, created_at, updated_at
      FROM agent_deployment_configs 
      WHERE environment = ?
    `;

    const rows = await this.db.query(query, [environment]);
    
    if (rows.length === 0) {
      return this.getDefaultDeploymentConfig(environment);
    }

    const row = rows[0];
    return {
      environment: row.environment,
      region: row.region,
      scaling: JSON.parse(row.scaling || '{}'),
      resources: JSON.parse(row.resources || '{}'),
      monitoring: JSON.parse(row.monitoring || '{}'),
      security: JSON.parse(row.security || '{}')
    };
  }

  /**
   * Update deployment configuration
   */
  async updateDeploymentConfig(
    environment: string,
    config: Partial<AgentDeploymentConfig>,
    updatedBy: string
  ): Promise<void> {
    const existingConfig = await this.getDeploymentConfig(environment);
    const updatedConfig = {
      ...existingConfig,
      ...config
    };

    const query = `
      INSERT INTO agent_deployment_configs (
        environment, region, scaling, resources, 
        monitoring, security, updated_at, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        region = VALUES(region),
        scaling = VALUES(scaling),
        resources = VALUES(resources),
        monitoring = VALUES(monitoring),
        security = VALUES(security),
        updated_at = VALUES(updated_at),
        updated_by = VALUES(updated_by)
    `;

    const values = [
      updatedConfig.environment,
      updatedConfig.region,
      JSON.stringify(updatedConfig.scaling),
      JSON.stringify(updatedConfig.resources),
      JSON.stringify(updatedConfig.monitoring),
      JSON.stringify(updatedConfig.security),
      new Date(),
      updatedBy
    ];

    await this.db.query(query, values);

    logger.info('Deployment configuration updated', {
      environment,
      updatedBy,
      changes: Object.keys(config)
    });
  }

  /**
   * Get configuration audit log
   */
  async getConfigurationAuditLog(
    tenantId: string,
    limit: number = 100
  ): Promise<Array<{
    id: string;
    tenantId: string;
    action: string;
    oldConfig: any;
    newConfig: any;
    changedBy: string;
    changedAt: Date;
  }>> {
    const query = `
      SELECT 
        id, tenant_id as tenantId, action, 
        old_config as oldConfig, new_config as newConfig,
        changed_by as changedBy, changed_at as changedAt
      FROM agent_configuration_audit
      WHERE tenant_id = ?
      ORDER BY changed_at DESC
      LIMIT ?
    `;

    const rows = await this.db.query(query, [tenantId, limit]);
    
    return rows.map(row => ({
      id: row.id,
      tenantId: row.tenantId,
      action: row.action,
      oldConfig: JSON.parse(row.oldConfig || '{}'),
      newConfig: JSON.parse(row.newConfig || '{}'),
      changedBy: row.changedBy,
      changedAt: row.changedAt
    }));
  }

  /**
   * Validate configuration changes
   */
  async validateConfigurationChange(
    tenantId: string,
    changes: Partial<AgentConfiguration>
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate autonomy level
    if (changes.autonomy && !['recommend-only', 'limited-autonomous', 'full-autonomous'].includes(changes.autonomy)) {
      errors.push('Invalid autonomy level');
    }

    // Validate batch size
    if (changes.batchSize && (changes.batchSize < 1 || changes.batchSize > 100)) {
      errors.push('Batch size must be between 1 and 100');
    }

    // Validate processing interval
    if (changes.processingInterval && (changes.processingInterval < 1000 || changes.processingInterval > 3600000)) {
      errors.push('Processing interval must be between 1 second and 1 hour');
    }

    // Validate max retries
    if (changes.maxRetries && (changes.maxRetries < 0 || changes.maxRetries > 10)) {
      errors.push('Max retries must be between 0 and 10');
    }

    // Validate thresholds
    if (changes.thresholds) {
      if (changes.thresholds.minClusterSize && changes.thresholds.minClusterSize < 2) {
        errors.push('Minimum cluster size must be at least 2');
      }

      if (changes.thresholds.minRecommendationEvents && changes.thresholds.minRecommendationEvents < 1) {
        errors.push('Minimum recommendation events must be at least 1');
      }

      if (changes.thresholds.maxProcessingTime && changes.thresholds.maxProcessingTime < 1000) {
        errors.push('Maximum processing time must be at least 1 second');
      }
    }

    // Check compliance requirements
    if (changes.autonomy && changes.autonomy !== 'recommend-only') {
      warnings.push('Non-recommend-only autonomy may require additional compliance review');
    }

    // Check feature dependencies
    if (changes.features) {
      if (changes.features.recommendations && !changes.features.clustering) {
        warnings.push('Recommendations require clustering to be enabled');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get configuration templates
   */
  getConfigurationTemplates(): Record<string, Partial<AgentConfiguration>> {
    return {
      'development': {
        enabled: true,
        autonomy: 'recommend-only',
        batchSize: 5,
        processingInterval: 30000,
        maxRetries: 5,
        features: {
          clustering: true,
          summarization: true,
          recommendations: true,
          notifications: false
        },
        thresholds: {
          minClusterSize: 2,
          minRecommendationEvents: 2,
          maxProcessingTime: 60000
        }
      },
      'staging': {
        enabled: true,
        autonomy: 'recommend-only',
        batchSize: 10,
        processingInterval: 60000,
        maxRetries: 3,
        features: {
          clustering: true,
          summarization: true,
          recommendations: true,
          notifications: true
        },
        thresholds: {
          minClusterSize: 2,
          minRecommendationEvents: 3,
          maxProcessingTime: 300000
        }
      },
      'production': {
        enabled: false,
        autonomy: 'recommend-only',
        batchSize: 10,
        processingInterval: 60000,
        maxRetries: 3,
        features: {
          clustering: true,
          summarization: true,
          recommendations: true,
          notifications: true
        },
        thresholds: {
          minClusterSize: 3,
          minRecommendationEvents: 5,
          maxProcessingTime: 300000
        }
      }
    };
  }

  // Private helper methods
  private async fetchAgentConfiguration(tenantId: string): Promise<AgentConfiguration> {
    const query = `
      SELECT 
        tenant_id as tenantId, enabled, autonomy, batch_size as batchSize,
        processing_interval as processingInterval, max_retries as maxRetries,
        features, thresholds, created_at as createdAt, updated_at as updatedAt
      FROM agent_configurations 
      WHERE tenant_id = ?
    `;

    const rows = await this.db.query(query, [tenantId]);
    
    if (rows.length === 0) {
      return this.getDefaultConfiguration(tenantId);
    }

    const row = rows[0];
    return {
      tenantId: row.tenantId,
      enabled: row.enabled,
      autonomy: row.autonomy,
      batchSize: row.batchSize,
      processingInterval: row.processingInterval,
      maxRetries: row.maxRetries,
      features: JSON.parse(row.features || '{}'),
      thresholds: JSON.parse(row.thresholds || '{}'),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  private async storeAgentConfiguration(config: AgentConfiguration): Promise<void> {
    const query = `
      INSERT INTO agent_configurations (
        tenant_id, enabled, autonomy, batch_size, processing_interval,
        max_retries, features, thresholds, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        enabled = VALUES(enabled),
        autonomy = VALUES(autonomy),
        batch_size = VALUES(batch_size),
        processing_interval = VALUES(processing_interval),
        max_retries = VALUES(max_retries),
        features = VALUES(features),
        thresholds = VALUES(thresholds),
        updated_at = VALUES(updated_at)
    `;

    const values = [
      config.tenantId,
      config.enabled,
      config.autonomy,
      config.batchSize,
      config.processingInterval,
      config.maxRetries,
      JSON.stringify(config.features),
      JSON.stringify(config.thresholds),
      config.createdAt,
      config.updatedAt
    ];

    await this.db.query(query, values);
  }

  private async validateConfiguration(config: AgentConfiguration): Promise<void> {
    const validation = await this.validateConfigurationChange(config.tenantId, config);
    
    if (!validation.valid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      logger.warn('Configuration validation warnings', {
        tenantId: config.tenantId,
        warnings: validation.warnings
      });
    }
  }

  private async logConfigurationChange(
    tenantId: string,
    oldConfig: AgentConfiguration,
    newConfig: AgentConfiguration,
    changedBy: string
  ): Promise<void> {
    const query = `
      INSERT INTO agent_configuration_audit (
        id, tenant_id, action, old_config, new_config,
        changed_by, changed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      uuidv4(),
      tenantId,
      'CONFIGURATION_UPDATED',
      JSON.stringify(oldConfig),
      JSON.stringify(newConfig),
      changedBy,
      new Date()
    ];

    await this.db.query(query, values);
  }

  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? Date.now() < expiry : false;
  }

  private getDefaultConfiguration(tenantId: string): AgentConfiguration {
    return {
      tenantId,
      enabled: false,
      autonomy: 'recommend-only',
      batchSize: 10,
      processingInterval: 60000,
      maxRetries: 3,
      features: {
        clustering: true,
        summarization: true,
        recommendations: true,
        notifications: true
      },
      thresholds: {
        minClusterSize: 2,
        minRecommendationEvents: 3,
        maxProcessingTime: 300000
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private getDefaultDeploymentConfig(environment: string): AgentDeploymentConfig {
    return {
      environment: environment as any,
      region: 'eu-west-2',
      scaling: {
        minInstances: 1,
        maxInstances: 10,
        targetCpuUtilization: 70
      },
      resources: {
        cpu: '500m',
        memory: '1Gi',
        storage: '10Gi'
      },
      monitoring: {
        enabled: true,
        logLevel: 'info',
        metricsInterval: 60
      },
      security: {
        networkPolicy: 'default-deny',
        podSecurityPolicy: 'restricted',
        serviceAccount: 'agent-service-account'
      }
    };
  }
}