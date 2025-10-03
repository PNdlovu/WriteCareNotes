import { EventEmitter2 } from "eventemitter2";

import { config as loadEnv } from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
loadEnv();

export interface ProductionConfig {
  server: {
    port: number;
    host: string;
    environment: string;
    corsOrigins: string[];
    trustProxy: boolean;
    securityHeaders: boolean;
  };
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: {
      enabled: boolean;
      rejectUnauthorized: boolean;
      ca?: string;
      key?: string;
      cert?: string;
    };
    pool: {
      min: number;
      max: number;
      acquireTimeoutMillis: number;
      idleTimeoutMillis: number;
    };
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    retryDelayOnFailover: number;
    maxRetriesPerRequest: number;
  };
  security: {
    jwt: {
      secret: string;
      refreshSecret: string;
      issuer: string;
      audience: string;
      accessTokenExpiry: string;
      refreshTokenExpiry: string;
    };
    encryption: {
      algorithm: string;
      key: string;
      fieldEncryptionKey: string;
    };
    rateLimit: {
      windowMs: number;
      maxRequests: number;
      skipSuccessfulRequests: boolean;
    };
    bcrypt: {
      saltRounds: number;
    };
  };
  monitoring: {
    logging: {
      level: string;
      format: string;
      enableConsole: boolean;
      enableFile: boolean;
      filePath: string;
    };
    health: {
      checkInterval: number;
      timeout: number;
      endpoints: string[];
    };
    metrics: {
      enabled: boolean;
      endpoint: string;
      collectInterval: number;
    };
    sentry: {
      enabled: boolean;
      dsn?: string;
      environment: string;
      release: string;
    };
  };
  external: {
    email: {
      provider: 'sendgrid' | 'smtp';
      apiKey?: string;
      smtp?: {
        host: string;
        port: number;
        username: string;
        password: string;
        secure: boolean;
      };
      from: {
        email: string;
        name: string;
      };
    };
    sms: {
      provider: 'twilio';
      accountSid: string;
      authToken: string;
      phoneNumber: string;
    };
    storage: {
      provider: 'aws' | 'local';
      aws?: {
        accessKeyId: string;
        secretAccessKey: string;
        region: string;
        bucket: string;
      };
      local?: {
        uploadPath: string;
        maxFileSize: number;
      };
    };
    maps: {
      provider: 'google';
      apiKey: string;
    };
  };
  features: {
    biometricAuth: boolean;
    locationVerification: boolean;
    offlineMode: boolean;
    familyPortal: boolean;
    executiveDashboard: boolean;
    domiciliaryCare: boolean;
    payrollModule: boolean;
    timeTracking: boolean;
  };
}

class ConfigurationService {
  private static instance: ConfigurationService;
  private config: ProductionConfig;

  private constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  public static getInstance(): ConfigurationService {
    if (!ConfigurationService.instance) {
      ConfigurationService.instance = new ConfigurationService();
    }
    return ConfigurationService.instance;
  }

  private loadConfiguration(): ProductionConfig {
    return {
      server: {

        port: parseInt(process.env['PORT'] || '3000'),
        host: process.env['HOST'] || '0.0.0.0',
        environment: process.env['NODE_ENV'] || 'development',
        corsOrigins: (process.env['CORS_ORIGIN'] || 'http://localhost:3000').split(','),
        trustProxy: process.env['TRUST_PROXY'] === 'true',
        securityHeaders: process.env['SECURITY_HEADERS'] !== 'false',
      },
      database: {
        host: process.env['DB_HOST'] || 'localhost',
        port: parseInt(process.env['DB_PORT'] || '5432'),
        username: process.env['DB_USERNAME'] || 'postgres',
        password: process.env['DB_PASSWORD'] || '',
        database: process.env['DB_NAME'] || 'writecarenotes',
        ssl: {
          enabled: process.env['DB_SSL_ENABLED'] === 'true',
          rejectUnauthorized: process.env['DB_SSL_REJECT_UNAUTHORIZED'] !== 'false',
          ca: process.env['DB_SSL_CA'],
          key: process.env['DB_SSL_KEY'],
          cert: process.env['DB_SSL_CERT'],
        },
        pool: {
          min: parseInt(process.env['DB_POOL_MIN'] || '2'),
          max: parseInt(process.env['DB_POOL_MAX'] || '20'),
          acquireTimeoutMillis: parseInt(process.env['DB_ACQUIRE_TIMEOUT'] || '60000'),
          idleTimeoutMillis: parseInt(process.env['DB_IDLE_TIMEOUT'] || '30000'),
        },
      },
      redis: {
        host: process.env['REDIS_HOST'] || 'localhost',
        port: parseInt(process.env['REDIS_PORT'] || '6379'),
        password: process.env['REDIS_PASSWORD'],
        db: parseInt(process.env['REDIS_DB'] || '0'),
        retryDelayOnFailover: parseInt(process.env['REDIS_RETRY_DELAY'] || '100'),
        maxRetriesPerRequest: parseInt(process.env['REDIS_MAX_RETRIES'] || '3'),
      },
      security: {
        jwt: {
          secret: process.env['JWT_SECRET'] || this.generateSecureSecret(),
          refreshSecret: process.env['JWT_REFRESH_SECRET'] || this.generateSecureSecret(),
          issuer: process.env['JWT_ISSUER'] || 'writecarenotes.com',
          audience: process.env['JWT_AUDIENCE'] || 'writecarenotes-app',
          accessTokenExpiry: process.env['ACCESS_TOKEN_EXPIRY'] || '15m',
          refreshTokenExpiry: process.env['REFRESH_TOKEN_EXPIRY'] || '7d',
        },
        encryption: {
          algorithm: 'aes-256-gcm',
          key: process.env['ENCRYPTION_KEY'] || this.generateEncryptionKey(),
          fieldEncryptionKey: process.env['FIELD_ENCRYPTION_KEY'] || this.generateEncryptionKey(),
        },
        rateLimit: {
          windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
          maxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
          skipSuccessfulRequests: process.env['RATE_LIMIT_SKIP_SUCCESS'] === 'true',
        },
        bcrypt: {
          saltRounds: parseInt(process.env['BCRYPT_SALT_ROUNDS'] || '12'),

        },
      },
      monitoring: {
        logging: {

          level: process.env['LOG_LEVEL'] || 'info',
          format: process.env['LOG_FORMAT'] || 'json',
          enableConsole: process.env['LOG_CONSOLE'] !== 'false',
          enableFile: process.env['LOG_FILE'] === 'true',
          filePath: process.env['LOG_FILE_PATH'] || './logs/app.log',
        },
        health: {
          checkInterval: parseInt(process.env['HEALTH_CHECK_INTERVAL'] || '30000'),
          timeout: parseInt(process.env['PING_TIMEOUT'] || '5000'),
          endpoints: (process.env['HEALTH_CHECK_ENDPOINTS'] || '/health,/ready').split(','),
        },
        metrics: {
          enabled: process.env['METRICS_ENABLED'] === 'true',
          endpoint: process.env['METRICS_ENDPOINT'] || '/metrics',
          collectInterval: parseInt(process.env['METRICS_COLLECT_INTERVAL'] || '60000'),
        },
        sentry: {
          enabled: process.env['SENTRY_ENABLED'] === 'true',
          dsn: process.env['SENTRY_DSN'],
          environment: process.env['NODE_ENV'] || 'development',
          release: process.env['APP_VERSION'] || '1.0.0',

        },
      },
      external: {
        email: {

          provider: (process.env['EMAIL_PROVIDER'] as 'sendgrid' | 'smtp') || 'sendgrid',
          apiKey: process.env['SENDGRID_API_KEY'],
          smtp: {
            host: process.env['SMTP_HOST'] || 'localhost',
            port: parseInt(process.env['SMTP_PORT'] || '587'),
            username: process.env['SMTP_USERNAME'] || '',
            password: process.env['SMTP_PASSWORD'] || '',
            secure: process.env['SMTP_SECURE'] === 'true',
          },
          from: {
            email: process.env['FROM_EMAIL'] || 'noreply@writecarenotes.com',
            name: process.env['FROM_NAME'] || 'WriteCareNotes',

          },
        },
        sms: {
          provider: 'twilio',

          accountSid: process.env['TWILIO_ACCOUNT_SID'] || '',
          authToken: process.env['TWILIO_AUTH_TOKEN'] || '',
          phoneNumber: process.env['TWILIO_PHONE_NUMBER'] || '',
        },
        storage: {
          provider: (process.env['STORAGE_PROVIDER'] as 'aws' | 'local') || 'local',
          aws: {
            accessKeyId: process.env['AWS_ACCESS_KEY_ID'] || '',
            secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'] || '',
            region: process.env['AWS_REGION'] || 'eu-west-2',
            bucket: process.env['AWS_S3_BUCKET'] || 'writecarenotes-uploads',
          },
          local: {
            uploadPath: process.env['UPLOAD_PATH'] || './uploads',
            maxFileSize: parseInt(process.env['MAX_FILE_SIZE_MB'] || '10') * 1024 * 1024,

          },
        },
        maps: {
          provider: 'google',

          apiKey: process.env['GOOGLE_MAPS_API_KEY'] || '',
        },
      },
      features: {
        biometricAuth: process.env['ENABLE_BIOMETRIC_AUTH'] !== 'false',
        locationVerification: process.env['ENABLE_LOCATION_VERIFICATION'] !== 'false',
        offlineMode: process.env['ENABLE_OFFLINE_MODE'] !== 'false',
        familyPortal: process.env['ENABLE_FAMILY_PORTAL'] !== 'false',
        executiveDashboard: process.env['ENABLE_EXECUTIVE_DASHBOARD'] !== 'false',
        domiciliaryCare: process.env['ENABLE_DOMICILIARY_CARE'] !== 'false',
        payrollModule: process.env['ENABLE_PAYROLL_MODULE'] !== 'false',
        timeTracking: process.env['ENABLE_TIME_TRACKING'] !== 'false',

      },
    };
  }

  private validateConfiguration(): void {
    const errors: string[] = [];

    // Validate required environment variables
    const requiredVars = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'DB_PASSWORD',
      'ENCRYPTION_KEY',
    ];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        errors.push(`Missing required environment variable: ${varName}`);
      }
    }

    // Validate JWT secret strength
    if (this.config.security.jwt.secret.length < 64) {
      errors.push('JWT_SECRET must be at least 64 characters long');
    }

    // Validate encryption key
    if (this.config.security.encryption.key.length < 32) {
      errors.push('ENCRYPTION_KEY must be at least 32 characters long');
    }

    // Validate database configuration

    if (!this.config.database.password && process.env['NODE_ENV'] === 'production') {

      errors.push('Database password is required in production');
    }

    // Validate external service configuration in production

    if (process.env['NODE_ENV'] === 'production') {

      if (!this.config.external.email.apiKey && !this.config.external.email.smtp?.username) {
        errors.push('Email configuration is required in production');
      }

      if (!this.config.external.sms.accountSid) {
        errors.push('SMS configuration is required in production');
      }

      if (!this.config.external.maps.apiKey) {
        console.warn('⚠️ Google Maps API key not configured - location features may be limited');
      }
    }

    if (errors.length > 0) {
      console.error('❌ Configuration validation failed:');
      errors.forEach(error => console.error(`  - ${error}`));
      

      if (process.env['NODE_ENV'] === 'production') {

        throw new Error('Invalid production configuration');
      } else {
        console.warn('⚠️ Configuration issues detected (continuing in development mode)');
      }
    } else {
      console.info('Configuration validation passed');
    }
  }

  private generateSecureSecret(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(64).toString('hex');
  }

  private generateEncryptionKey(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  public getConfig(): ProductionConfig {
    return { ...this.config }; // Return copy to prevent mutation
  }

  public getDatabaseUrl(): string {
    const { host, port, username, password, database, ssl } = this.config.database;
    const sslParam = ssl.enabled ? '?ssl=true' : '';
    return `postgresql://${username}:${password}@${host}:${port}/${database}${sslParam}`;
  }

  public getDatabaseUrlFromEnv(): string {

    return process.env['DATABASE_URL'] || this.getDatabaseUrl();

  }

  public getRedisUrl(): string {
    const { host, port, password, db } = this.config.redis;
    const auth = password ? `:${password}@` : '';
    return `redis://${auth}${host}:${port}/${db}`;
  }

  public isProduction(): boolean {
    return this.config.server.environment === 'production';
  }

  public isDevelopment(): boolean {
    return this.config.server.environment === 'development';
  }

  public isTest(): boolean {
    return this.config.server.environment === 'test';
  }

  // Feature flag helpers
  public isFeatureEnabled(feature: keyof ProductionConfig['features']): boolean {
    return this.config.features[feature];
  }

  // Environment-specific configurations
  public getLogLevel(): string {
    if (this.isProduction()) {
      return 'warn';
    } else if (this.isTest()) {
      return 'error';
    }
    return 'debug';
  }

  public shouldEnableDebugMode(): boolean {

    return this.isDevelopment() && process.env['DEBUG_MODE'] === 'true';

  }

  // Security configurations
  public getSecurityHeaders(): Record<string, string> {
    if (!this.config.server.securityHeaders) {
      return {};
    }

    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': this.getContentSecurityPolicy(),
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=self, camera=self, microphone=self',
    };
  }

  private getContentSecurityPolicy(): string {
    const policies = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.writecarenotes.com wss://api.writecarenotes.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ];

    return policies.join('; ');
  }

  // Health check configuration
  public getHealthCheckConfig(): any {
    return {
      checks: {
        database: {
          timeout: this.config.monitoring.health.timeout,
          interval: this.config.monitoring.health.checkInterval,
        },
        redis: {
          timeout: this.config.monitoring.health.timeout,
          interval: this.config.monitoring.health.checkInterval,
        },
        externalServices: {
          timeout: this.config.monitoring.health.timeout * 2,
          interval: this.config.monitoring.health.checkInterval * 2,
        },
      },
      endpoints: this.config.monitoring.health.endpoints,
    };
  }

  // Performance configurations
  public getPerformanceConfig(): any {
    return {
      compression: {
        enabled: true,
        level: this.isProduction() ? 6 : 1,
        threshold: 1024,
      },
      caching: {
        enabled: true,
        defaultTTL: 300, // 5 minutes
        checkPeriod: 600, // 10 minutes
      },
      clustering: {
        enabled: this.isProduction(),

        workers: process.env['CLUSTER_WORKERS'] || 'auto',

      },
    };
  }

  // Backup configurations
  public getBackupConfig(): any {
    return {
      enabled: this.isProduction(),

      schedule: process.env['BACKUP_SCHEDULE'] || '0 2 * * *', // Daily at 2 AM
      retention: {
        days: parseInt(process.env['BACKUP_RETENTION_DAYS'] || '30'),
        maxBackups: parseInt(process.env['MAX_BACKUPS'] || '100'),
      },
      storage: {
        provider: 'aws',
        bucket: process.env['BACKUP_S3_BUCKET'] || 'writecarenotes-backups',
        encryption: true,
      },
      notifications: {
        onSuccess: process.env['BACKUP_SUCCESS_NOTIFICATION'] === 'true',
        onFailure: true,
        recipients: (process.env['BACKUP_NOTIFICATION_EMAILS'] || '').split(',').filter(Boolean),

      },
    };
  }
}

// Export singleton instance
export const productionConfig = ConfigurationService.getInstance();

// Export configuration object
export const config = productionConfig.getConfig();

// Export commonly used configurations
export const {
  server: serverConfig,
  database: databaseConfig,
  security: securityConfig,
  monitoring: monitoringConfig,
  features: featureFlags,
} = config;

export default productionConfig;