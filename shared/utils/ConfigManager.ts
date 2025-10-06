import { ValidationService } from '../services/ValidationService';
import { EncryptionService } from '../services/EncryptionService';

export interface Config {
  // Database configuration
  database: {
    host: string;
    port: number;
    name: string;
    username: string;
    password: string;
    ssl: boolean;
    connectionTimeout: number;
    idleTimeout: number;
    maxConnections: number;
  };

  // Security configuration
  security: {
    jwtSecret: string;
    sessionTimeout: number;
    passwordMinLength: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    encryptionKey: string;
  };

  // API configuration
  api: {
    port: number;
    host: string;
    cors: {
      origin: string[];
      credentials: boolean;
    };
    rateLimit: {
      windowMs: number;
      maxRequests: number;
    };
    timeout: number;
  };

  // Care home configuration
  careHome: {
    maxResidents: number;
    maxStaff: number;
    nhsApiKey?: string;
    cqcApiKey?: string;
    reminderIntervals: {
      medication: number;
      meal: number;
      activity: number;
    };
  };

  // Logging configuration
  logging: {
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
    directory: string;
    maxFileSize: number;
    maxFiles: number;
  };

  // Environment
  environment: 'development' | 'staging' | 'production';
}

class ConfigurationManager {
  private config: Config;
  private encryptionService: EncryptionService;
  private validationService: ValidationService;

  constructor() {
    this.encryptionService = new EncryptionService();
    this.validationService = new ValidationService();
    this.config = this.loadConfiguration();
  }

  private loadConfiguration(): Config {
    const env = process.env.NODE_ENV || 'development';
    
    // Base configuration with secure defaults
    const baseConfig: Config = {
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        name: process.env.DB_NAME || 'writecarenotes',
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: process.env.DB_SSL === 'true',
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
        idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '10000'),
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20')
      },
      security: {
        jwtSecret: process.env.JWT_SECRET || this.generateSecureSecret(),
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000'), // 1 hour
        passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900000'), // 15 minutes
        encryptionKey: process.env.ENCRYPTION_KEY || this.generateEncryptionKey()
      },
      api: {
        port: parseInt(process.env.PORT || '3000'),
        host: process.env.HOST || '0.0.0.0',
        cors: {
          origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
          credentials: true
        },
        rateLimit: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100')
        },
        timeout: parseInt(process.env.API_TIMEOUT || '30000')
      },
      careHome: {
        maxResidents: parseInt(process.env.MAX_RESIDENTS || '100'),
        maxStaff: parseInt(process.env.MAX_STAFF || '50'),
        nhsApiKey: process.env.NHS_API_KEY,
        cqcApiKey: process.env.CQC_API_KEY,
        reminderIntervals: {
          medication: parseInt(process.env.MEDICATION_REMINDER_INTERVAL || '3600000'), // 1 hour
          meal: parseInt(process.env.MEAL_REMINDER_INTERVAL || '10800000'), // 3 hours
          activity: parseInt(process.env.ACTIVITY_REMINDER_INTERVAL || '7200000') // 2 hours
        }
      },
      logging: {
        level: (process.env.LOG_LEVEL as any) || 'INFO',
        directory: process.env.LOG_DIR || './logs',
        maxFileSize: parseInt(process.env.LOG_MAX_FILE_SIZE || '10485760'), // 10MB
        maxFiles: parseInt(process.env.LOG_MAX_FILES || '10')
      },
      environment: env as 'development' | 'staging' | 'production'
    };

    this.validateConfiguration(baseConfig);
    return baseConfig;
  }

  private generateSecureSecret(): string {
    return this.encryptionService.generateSecureToken(64);
  }

  private generateEncryptionKey(): string {
    return this.encryptionService.generateSecureToken(32);
  }

  private validateConfiguration(config: Config): void {
    // Validate database configuration
    if (!config.database.host) {
      throw new Error('Database host is required');
    }
    if (config.database.port < 1 || config.database.port > 65535) {
      throw new Error('Database port must be between 1 and 65535');
    }
    if (!config.database.name) {
      throw new Error('Database name is required');
    }

    // Validate security configuration
    if (config.security.jwtSecret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters');
    }
    if (config.security.passwordMinLength < 8) {
      throw new Error('Password minimum length must be at least 8');
    }
    if (config.security.encryptionKey.length < 32) {
      throw new Error('Encryption key must be at least 32 characters');
    }

    // Validate API configuration
    if (config.api.port < 1 || config.api.port > 65535) {
      throw new Error('API port must be between 1 and 65535');
    }
    if (!config.api.host) {
      throw new Error('API host is required');
    }

    // Validate care home configuration
    if (config.careHome.maxResidents < 1) {
      throw new Error('Maximum residents must be at least 1');
    }
    if (config.careHome.maxStaff < 1) {
      throw new Error('Maximum staff must be at least 1');
    }

    // Validate environment
    if (!['development', 'staging', 'production'].includes(config.environment)) {
      throw new Error('Environment must be development, staging, or production');
    }
  }

  getConfig(): Readonly<Config> {
    return Object.freeze({ ...this.config });
  }

  getDatabaseConfig(): Readonly<Config['database']> {
    return Object.freeze({ ...this.config.database });
  }

  getSecurityConfig(): Readonly<Config['security']> {
    return Object.freeze({ ...this.config.security });
  }

  getApiConfig(): Readonly<Config['api']> {
    return Object.freeze({ ...this.config.api });
  }

  getCareHomeConfig(): Readonly<Config['careHome']> {
    return Object.freeze({ ...this.config.careHome });
  }

  getLoggingConfig(): Readonly<Config['logging']> {
    return Object.freeze({ ...this.config.logging });
  }

  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  isStaging(): boolean {
    return this.config.environment === 'staging';
  }

  // Get sensitive configuration values (encrypted in production)
  async getSensitiveValue(key: keyof Config['security']): Promise<string> {
    const value = this.config.security[key];
    if (typeof value !== 'string') {
      throw new Error(`Configuration value ${key} is not a string`);
    }
    
    // In production, these values should be encrypted at rest
    if (this.isProduction() && process.env.CONFIG_ENCRYPTION_ENABLED === 'true') {
      try {
        return await this.encryptionService.decrypt(value);
      } catch (error) {
        throw new Error(`Failed to decrypt configuration value ${key}`);
      }
    }
    
    return value;
  }

  // Update configuration at runtime (for testing or dynamic configuration)
  updateConfig(updates: Partial<Config>): void {
    this.config = { ...this.config, ...updates };
    this.validateConfiguration(this.config);
  }

  // Export configuration for debugging (with sensitive values masked)
  exportConfigForDebug(): any {
    const config = { ...this.config };
    
    // Mask sensitive values
    config.security.jwtSecret = '***MASKED***';
    config.security.encryptionKey = '***MASKED***';
    config.database.password = '***MASKED***';
    
    if (config.careHome.nhsApiKey) {
      config.careHome.nhsApiKey = '***MASKED***';
    }
    if (config.careHome.cqcApiKey) {
      config.careHome.cqcApiKey = '***MASKED***';
    }
    
    return config;
  }
}

// Export singleton instance
export const configManager = new ConfigurationManager();
export default configManager;