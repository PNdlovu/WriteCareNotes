import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { AgentFeatureFlag, AgentDeploymentConfig } from '../../types/pilot-feedback-agent.types';
import { DatabaseService } from '../database/database.service';

export class AgentFeatureFlagsService {
  private db: DatabaseService;
  private flagCache: Map<string, AgentFeatureFlag> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.db = new DatabaseService();
    this.initializeDefaultFlags();
  }

  /**
   * Get feature flag value for tenant
   */
  async getFeatureFlag(tenantId: string, flag: string): Promise<boolean> {
    const cacheKey = `${tenantId}:${flag}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      const cachedFlag = this.flagCache.get(cacheKey);
      if (cachedFlag) {
        return this.evaluateFlag(cachedFlag);
      }
    }

    // Fetch from database
    const flagData = await this.fetchFeatureFlag(tenantId, flag);
    if (flagData) {
      this.flagCache.set(cacheKey, flagData);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);
      return this.evaluateFlag(flagData);
    }

    // Return default value
    return this.getDefaultFlagValue(flag);
  }

  /**
   * Set feature flag for tenant
   */
  async setFeatureFlag(
    tenantId: string,
    flag: string,
    enabled: boolean,
    rolloutPercentage?: number,
    conditions?: Record<string, any>
  ): Promise<void> {
    const flagData: AgentFeatureFlag = {
      tenantId,
      flag,
      enabled,
      rolloutPercentage: rolloutPercentage || 0,
      conditions: conditions || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.storeFeatureFlag(flagData);
    
    // Update cache
    const cacheKey = `${tenantId}:${flag}`;
    this.flagCache.set(cacheKey, flagData);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

    logger.info('Feature flag updated', {
      tenantId,
      flag,
      enabled,
      rolloutPercentage,
      conditions
    });
  }

  /**
   * Get all feature flags for tenant
   */
  async getTenantFeatureFlags(tenantId: string): Promise<AgentFeatureFlag[]> {
    const query = `
      SELECT 
        tenant_id as tenantId,
        flag,
        enabled,
        rollout_percentage as rolloutPercentage,
        conditions,
        created_at as createdAt,
        updated_at as updatedAt
      FROM agent_feature_flags 
      WHERE tenant_id = ?
      ORDER BY flag ASC
    `;

    const rows = await this.db.query(query, [tenantId]);
    
    return rows.map(row => ({
      tenantId: row.tenantId,
      flag: row.flag,
      enabled: row.enabled,
      rolloutPercentage: row.rolloutPercentage,
      conditions: JSON.parse(row.conditions || '{}'),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  }

  /**
   * Check if feature is enabled for tenant with conditions
   */
  async isFeatureEnabled(
    tenantId: string,
    flag: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    const flagData = await this.getFeatureFlagData(tenantId, flag);
    if (!flagData) {
      return this.getDefaultFlagValue(flag);
    }

    // Check if flag is globally disabled
    if (!flagData.enabled) {
      return false;
    }

    // Check rollout percentage
    if (flagData.rolloutPercentage < 100) {
      const hash = this.hashTenantId(tenantId);
      const percentage = (hash % 100) + 1;
      if (percentage > flagData.rolloutPercentage) {
        return false;
      }
    }

    // Check conditions
    if (flagData.conditions && context) {
      return this.evaluateConditions(flagData.conditions, context);
    }

    return true;
  }

  /**
   * Bulk update feature flags
   */
  async bulkUpdateFeatureFlags(
    tenantId: string,
    flags: Array<{
      flag: string;
      enabled: boolean;
      rolloutPercentage?: number;
      conditions?: Record<string, any>;
    }>
  ): Promise<void> {
    const transaction = await this.db.beginTransaction();
    
    try {
      for (const flagUpdate of flags) {
        await this.setFeatureFlag(
          tenantId,
          flagUpdate.flag,
          flagUpdate.enabled,
          flagUpdate.rolloutPercentage,
          flagUpdate.conditions
        );
      }
      
      await this.db.commitTransaction(transaction);
      
      logger.info('Bulk feature flags updated', {
        tenantId,
        flagCount: flags.length
      });
      
    } catch (error) {
      await this.db.rollbackTransaction(transaction);
      throw error;
    }
  }

  /**
   * Delete feature flag
   */
  async deleteFeatureFlag(tenantId: string, flag: string): Promise<void> {
    const query = `
      DELETE FROM agent_feature_flags 
      WHERE tenant_id = ? AND flag = ?
    `;

    await this.db.query(query, [tenantId, flag]);
    
    // Remove from cache
    const cacheKey = `${tenantId}:${flag}`;
    this.flagCache.delete(cacheKey);
    this.cacheExpiry.delete(cacheKey);

    logger.info('Feature flag deleted', { tenantId, flag });
  }

  /**
   * Get feature flag usage statistics
   */
  async getFeatureFlagStats(tenantId?: string): Promise<{
    totalFlags: number;
    enabledFlags: number;
    disabledFlags: number;
    rolloutFlags: number;
    conditionalFlags: number;
  }> {
    let query = `
      SELECT 
        COUNT(*) as totalFlags,
        SUM(CASE WHEN enabled = true THEN 1 ELSE 0 END) as enabledFlags,
        SUM(CASE WHEN enabled = false THEN 1 ELSE 0 END) as disabledFlags,
        SUM(CASE WHEN rollout_percentage > 0 AND rollout_percentage < 100 THEN 1 ELSE 0 END) as rolloutFlags,
        SUM(CASE WHEN conditions IS NOT NULL AND conditions != '{}' THEN 1 ELSE 0 END) as conditionalFlags
      FROM agent_feature_flags
    `;

    const params: any[] = [];
    if (tenantId) {
      query += ' WHERE tenant_id = ?';
      params.push(tenantId);
    }

    const rows = await this.db.query(query, params);
    const row = rows[0];

    return {
      totalFlags: row.totalFlags || 0,
      enabledFlags: row.enabledFlags || 0,
      disabledFlags: row.disabledFlags || 0,
      rolloutFlags: row.rolloutFlags || 0,
      conditionalFlags: row.conditionalFlags || 0
    };
  }

  /**
   * Get feature flag audit log
   */
  async getFeatureFlagAuditLog(
    tenantId: string,
    flag?: string,
    limit: number = 100
  ): Promise<Array<{
    id: string;
    tenantId: string;
    flag: string;
    action: string;
    oldValue: any;
    newValue: any;
    changedBy: string;
    changedAt: Date;
  }>> {
    let query = `
      SELECT 
        id,
        tenant_id as tenantId,
        flag,
        action,
        old_value as oldValue,
        new_value as newValue,
        changed_by as changedBy,
        changed_at as changedAt
      FROM agent_feature_flag_audit
      WHERE tenant_id = ?
    `;

    const params: any[] = [tenantId];
    
    if (flag) {
      query += ' AND flag = ?';
      params.push(flag);
    }

    query += ' ORDER BY changed_at DESC LIMIT ?';
    params.push(limit);

    const rows = await this.db.query(query, params);
    
    return rows.map(row => ({
      id: row.id,
      tenantId: row.tenantId,
      flag: row.flag,
      action: row.action,
      oldValue: JSON.parse(row.oldValue || '{}'),
      newValue: JSON.parse(row.newValue || '{}'),
      changedBy: row.changedBy,
      changedAt: row.changedAt
    }));
  }

  // Private helper methods
  private async fetchFeatureFlag(tenantId: string, flag: string): Promise<AgentFeatureFlag | null> {
    const query = `
      SELECT 
        tenant_id as tenantId,
        flag,
        enabled,
        rollout_percentage as rolloutPercentage,
        conditions,
        created_at as createdAt,
        updated_at as updatedAt
      FROM agent_feature_flags 
      WHERE tenant_id = ? AND flag = ?
    `;

    const rows = await this.db.query(query, [tenantId, flag]);
    
    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      tenantId: row.tenantId,
      flag: row.flag,
      enabled: row.enabled,
      rolloutPercentage: row.rolloutPercentage,
      conditions: JSON.parse(row.conditions || '{}'),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  private async getFeatureFlagData(tenantId: string, flag: string): Promise<AgentFeatureFlag | null> {
    const cacheKey = `${tenantId}:${flag}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.flagCache.get(cacheKey) || null;
    }

    return await this.fetchFeatureFlag(tenantId, flag);
  }

  private async storeFeatureFlag(flagData: AgentFeatureFlag): Promise<void> {
    const query = `
      INSERT INTO agent_feature_flags (
        tenant_id, flag, enabled, rollout_percentage, 
        conditions, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        enabled = VALUES(enabled),
        rollout_percentage = VALUES(rollout_percentage),
        conditions = VALUES(conditions),
        updated_at = VALUES(updated_at)
    `;

    const values = [
      flagData.tenantId,
      flagData.flag,
      flagData.enabled,
      flagData.rolloutPercentage,
      JSON.stringify(flagData.conditions),
      flagData.createdAt,
      flagData.updatedAt
    ];

    await this.db.query(query, values);
  }

  private evaluateFlag(flagData: AgentFeatureFlag): boolean {
    if (!flagData.enabled) {
      return false;
    }

    if (flagData.rolloutPercentage < 100) {
      const hash = this.hashTenantId(flagData.tenantId);
      const percentage = (hash % 100) + 1;
      return percentage <= flagData.rolloutPercentage;
    }

    return true;
  }

  private evaluateConditions(conditions: Record<string, any>, context: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (context[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry ? Date.now() < expiry : false;
  }

  private hashTenantId(tenantId: string): number {
    let hash = 0;
    for (let i = 0; i < tenantId.length; i++) {
      const char = tenantId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private getDefaultFlagValue(flag: string): boolean {
    const defaultFlags: Record<string, boolean> = {
      'agent.pilotFeedback.enabled': false,
      'agent.pilotFeedback.autonomy': false,
      'agent.pilotFeedback.clustering': true,
      'agent.pilotFeedback.summarization': true,
      'agent.pilotFeedback.recommendations': true,
      'agent.pilotFeedback.notifications': true,
      'agent.pilotFeedback.monitoring': true,
      'agent.pilotFeedback.audit': true
    };

    return defaultFlags[flag] || false;
  }

  private initializeDefaultFlags(): void {
    // This would initialize default feature flags for all tenants
    // Implementation depends on your specific requirements
  }
}