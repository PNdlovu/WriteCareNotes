import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Redis Configuration for WriteCareNotes
 * @module RedisConfig
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Redis configuration for caching, session management,
 * and real-time features with healthcare-grade security.
 */

import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Redis configuration interface
 */
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  retryAttempts: number;
  retryDelay: number;
  maxRetriesPerRequest: number;
  connectTimeout: number;
  commandTimeout: number;
  lazyConnect: boolean;
  keepAlive: number;
  family: number;
  enableReadyCheck: boolean;
  maxLoadingTimeout: number;
}

/**
 * Get Redis configuration based on environment
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export function getRedisConfig(): RedisConfig {

  const nodeEnv = process.env['NODE_ENV'] || 'development';
  
  const baseConfig: RedisConfig = {
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
    password: process.env['REDIS_PASSWORD'],
    db: parseInt(process.env['REDIS_DB'] || '0', 10),
    keyPrefix: process.env['REDIS_KEY_PREFIX'] || 'writecarenotes:',
    retryAttempts: parseInt(process.env['REDIS_RETRY_ATTEMPTS'] || '3', 10),
    retryDelay: parseInt(process.env['REDIS_RETRY_DELAY'] || '2000', 10),
    maxRetriesPerRequest: parseInt(process.env['REDIS_MAX_RETRIES_PER_REQUEST'] || '3', 10),
    connectTimeout: parseInt(process.env['REDIS_CONNECT_TIMEOUT'] || '10000', 10),
    commandTimeout: parseInt(process.env['REDIS_COMMAND_TIMEOUT'] || '5000', 10),
    lazyConnect: process.env['REDIS_LAZY_CONNECT'] === 'true',
    keepAlive: parseInt(process.env['REDIS_KEEP_ALIVE'] || '30000', 10),
    family: parseInt(process.env['REDIS_FAMILY'] || '4', 10),
    enableReadyCheck: process.env['REDIS_ENABLE_READY_CHECK'] !== 'false',
    maxLoadingTimeout: parseInt(process.env['REDIS_MAX_LOADING_TIMEOUT'] || '5000', 10)

  };

  // Environment-specific overrides
  switch (nodeEnv) {
    case 'production':
      return {
        ...baseConfig,
        retryAttempts: 5,
        retryDelay: 1000,
        connectTimeout: 5000,
        commandTimeout: 3000,
        lazyConnect: true
      };
      
    case 'staging':
      return {
        ...baseConfig,
        retryAttempts: 4,
        retryDelay: 1500,
        connectTimeout: 7500
      };
      
    case 'test':
      return {
        ...baseConfig,

        db: parseInt(process.env['REDIS_TEST_DB'] || '15', 10),

        keyPrefix: 'writecarenotes:test:',
        retryAttempts: 1,
        retryDelay: 500,
        connectTimeout: 2000,
        commandTimeout: 1000
      };
      
    case 'development':
    default:
      return baseConfig;
  }
}

/**
 * Redis database allocation for different purposes
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const REDIS_DATABASES = {
  CACHE: 0,           // General application cache
  SESSIONS: 1,        // User sessions
  RATE_LIMITING: 2,   // Rate limiting counters
  AUDIT_QUEUE: 3,     // Audit log queue
  NOTIFICATIONS: 4,   // Notification queue
  REAL_TIME: 5,       // Real-time features (WebSocket, etc.)
  COMPLIANCE: 6,      // Compliance data cache
  SECURITY: 7,        // Security incident tracking
  ANALYTICS: 8,       // Analytics data cache
  TEMP_DATA: 9,       // Temporary data storage
  LOCKS: 10,          // Distributed locks
  METRICS: 11,        // Performance metrics
  BACKUP: 12,         // Backup coordination
  TESTING: 15         // Testing database
} as const;

/**
 * Get Redis configuration for specific purpose
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export function getRedisConfigForPurpose(purpose: keyof typeof REDIS_DATABASES): RedisConfig {
  const config = getRedisConfig();
  return {
    ...config,
    db: REDIS_DATABASES[purpose],
    keyPrefix: `${config.keyPrefix}${purpose.toLowerCase()}:`
  };
}

/**
 * Redis connection options for different use cases
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const REDIS_CONNECTION_OPTIONS = {
  // High-performance cache
  CACHE: {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    lazyConnect: true
  },
  
  // Reliable session storage
  SESSIONS: {
    enableOfflineQueue: true,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 500,
    enableReadyCheck: true,
    lazyConnect: false
  },
  
  // Real-time features
  REAL_TIME: {
    enableOfflineQueue: true,
    maxRetriesPerRequest: 5,
    retryDelayOnFailover: 200,
    enableReadyCheck: true,
    lazyConnect: false,
    keepAlive: 10000
  },
  
  // Critical audit data
  AUDIT: {
    enableOfflineQueue: true,
    maxRetriesPerRequest: 10,
    retryDelayOnFailover: 1000,
    enableReadyCheck: true,
    lazyConnect: false,
    connectTimeout: 15000
  }
} as const;

/**
 * Cache TTL configurations (in seconds)
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const CACHE_TTL = {
  // Short-term cache (5 minutes)
  SHORT: 300,
  
  // Medium-term cache (1 hour)
  MEDIUM: 3600,
  
  // Long-term cache (24 hours)
  LONG: 86400,
  
  // Session cache (30 minutes)
  SESSION: 1800,
  
  // Rate limiting windows
  RATE_LIMIT_MINUTE: 60,
  RATE_LIMIT_HOUR: 3600,
  RATE_LIMIT_DAY: 86400,
  
  // Healthcare-specific caches
  RESIDENT_DATA: 1800,      // 30 minutes
  MEDICATION_DATA: 900,     // 15 minutes
  CARE_PLANS: 3600,         // 1 hour
  COMPLIANCE_DATA: 7200,    // 2 hours
  AUDIT_SUMMARY: 300,       // 5 minutes
  
  // Organization data
  ORGANIZATION_HIERARCHY: 3600,  // 1 hour
  PERMISSIONS: 1800,             // 30 minutes
  CONFIGURATIONS: 7200,          // 2 hours
  
  // Financial data
  FINANCIAL_REPORTS: 1800,   // 30 minutes
  BUDGET_DATA: 3600,         // 1 hour
  FORECASTS: 7200,           // 2 hours
  
  // Security data
  SECURITY_INCIDENTS: 300,   // 5 minutes
  ACCESS_LOGS: 600,          // 10 minutes
  THREAT_INTELLIGENCE: 1800  // 30 minutes
} as const;

/**
 * Validate Redis configuration
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export function validateRedisConfig(config: RedisConfig): void {
  if (!config.host) {
    throw new Error('Redis host is required');
  }
  
  if (config.port < 1 || config.port > 65535) {
    throw new Error('Redis port must be between 1 and 65535');
  }
  
  if (config.db < 0 || config.db > 15) {
    throw new Error('Redis database must be between 0 and 15');
  }
  
  if (config.retryAttempts < 0 || config.retryAttempts > 10) {
    throw new Error('Redis retry attempts must be between 0 and 10');
  }
  
  if (config.connectTimeout < 1000 || config.connectTimeout > 60000) {
    throw new Error('Redis connect timeout must be between 1000ms and 60000ms');
  }
}

/**
 * Get Redis health check configuration
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export function getRedisHealthConfig() {
  return {
    timeout: 3000,
    interval: 30000,
    retries: 3,
    command: 'PING'
  };
}

/**
 * Redis key patterns for different data types
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const REDIS_KEY_PATTERNS = {
  // User sessions
  SESSION: 'session:{sessionId}',
  USER_SESSION: 'user:{userId}:sessions',
  
  // Rate limiting
  RATE_LIMIT: 'rate_limit:{identifier}:{window}',
  
  // Cache patterns
  ORGANIZATION: 'org:{orgId}',
  ORGANIZATION_HIERARCHY: 'org_hierarchy:{tenantId}',
  USER_PERMISSIONS: 'user:{userId}:permissions',
  
  // Healthcare data
  RESIDENT: 'resident:{residentId}',
  MEDICATION: 'medication:{medicationId}',
  CARE_PLAN: 'care_plan:{planId}',
  
  // Financial data
  TRANSACTION: 'transaction:{transactionId}',
  BUDGET: 'budget:{budgetId}',
  FORECAST: 'forecast:{forecastId}',
  
  // Security data
  SECURITY_INCIDENT: 'security:{incidentId}',
  ACCESS_LOG: 'access:{userId}:{timestamp}',
  
  // Audit data
  AUDIT_LOG: 'audit:{auditId}',
  AUDIT_SUMMARY: 'audit_summary:{date}',
  
  // Locks
  DISTRIBUTED_LOCK: 'lock:{resource}',
  
  // Notifications
  NOTIFICATION: 'notification:{notificationId}',
  USER_NOTIFICATIONS: 'user:{userId}:notifications'
} as const;

/**
 * Default Redis configuration
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const defaultRedisConfig = getRedisConfig();

/**
 * Validate configuration on module load
 */
try {
  validateRedisConfig(defaultRedisConfig);
} catch (error: unknown) {
  console.error('Redis configuration validationfailed:', error instanceof Error ? error.message : "Unknown error");
  process.exit(1);
}
