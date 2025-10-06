import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env') });

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  maxConnections: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  database: number;
  maxRetries: number;
  retryDelayOnFailover: number;
}

interface AIConfig {
  openai: {
    apiKey: string;
    baseURL?: string;
    model: string;
    maxTokens: number;
    temperature: number;
    timeout: number;
  };
  azureOpenAI: {
    apiKey: string;
    endpoint: string;
    apiVersion: string;
    deploymentName: string;
  };
}

interface StorageConfig {
  provider: 'aws' | 'azure' | 'gcp' | 'local';
  aws?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
  };
  azure?: {
    connectionString: string;
    containerName: string;
  };
  local?: {
    uploadPath: string;
    maxFileSize: number;
  };
}

interface EmailConfig {
  provider: 'sendgrid' | 'ses' | 'smtp';
  sendgrid?: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  ses?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
  };
}

interface SMSConfig {
  provider: 'twilio' | 'aws_sns';
  twilio?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
  awsSns?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
}

interface WebRTCConfig {
  provider: 'daily' | 'twilio' | 'agora';
  daily?: {
    apiKey: string;
    domain: string;
  };
  twilio?: {
    accountSid: string;
    authToken: string;
  };
}

interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
  };
  cors: {
    origin: string[];
    credentials: boolean;
  };
}

interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  host: string;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  database: DatabaseConfig;
  redis: RedisConfig;
  ai: AIConfig;
  storage: StorageConfig;
  email: EmailConfig;
  sms: SMSConfig;
  webrtc: WebRTCConfig;
  security: SecurityConfig;
}

class ConfigurationService {
  private static instance: ConfigurationService;
  private config: AppConfig;

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

  private loadConfiguration(): AppConfig {
    return {
      nodeEnv: (process.env.NODE_ENV as any) || 'development',
      port: parseInt(process.env.PORT || '3000'),
      host: process.env.HOST || '0.0.0.0',
      logLevel: (process.env.LOG_LEVEL as any) || 'info',

      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'writecarenotes',
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: process.env.DB_SSL === 'true',
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000')
      },

      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        database: parseInt(process.env.REDIS_DB || '0'),
        maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
        retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100')
      },

      ai: {
        openai: {
          apiKey: process.env.OPENAI_API_KEY || '',
          baseURL: process.env.OPENAI_BASE_URL,
          model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
          maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
          temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
          timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000')
        },
        azureOpenAI: {
          apiKey: process.env.AZURE_OPENAI_API_KEY || '',
          endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
          apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-01',
          deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || ''
        }
      },

      storage: {
        provider: (process.env.STORAGE_PROVIDER as any) || 'local',
        aws: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
          region: process.env.AWS_REGION || 'us-east-1',
          bucket: process.env.AWS_S3_BUCKET || ''
        },
        azure: {
          connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
          containerName: process.env.AZURE_STORAGE_CONTAINER || 'writecarenotes'
        },
        local: {
          uploadPath: process.env.LOCAL_UPLOAD_PATH || './uploads',
          maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800')
        }
      },

      email: {
        provider: (process.env.EMAIL_PROVIDER as any) || 'smtp',
        sendgrid: {
          apiKey: process.env.SENDGRID_API_KEY || '',
          fromEmail: process.env.SENDGRID_FROM_EMAIL || '',
          fromName: process.env.SENDGRID_FROM_NAME || 'WriteCareNotes'
        },
        ses: {
          accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY || '',
          region: process.env.AWS_SES_REGION || 'us-east-1'
        },
        smtp: {
          host: process.env.SMTP_HOST || '',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          username: process.env.SMTP_USERNAME || '',
          password: process.env.SMTP_PASSWORD || ''
        }
      },

      sms: {
        provider: (process.env.SMS_PROVIDER as any) || 'twilio',
        twilio: {
          accountSid: process.env.TWILIO_ACCOUNT_SID || '',
          authToken: process.env.TWILIO_AUTH_TOKEN || '',
          fromNumber: process.env.TWILIO_FROM_NUMBER || ''
        },
        awsSns: {
          accessKeyId: process.env.AWS_SNS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SNS_SECRET_ACCESS_KEY || '',
          region: process.env.AWS_SNS_REGION || 'us-east-1'
        }
      },

      webrtc: {
        provider: (process.env.WEBRTC_PROVIDER as any) || 'daily',
        daily: {
          apiKey: process.env.DAILY_API_KEY || '',
          domain: process.env.DAILY_DOMAIN || ''
        },
        twilio: {
          accountSid: process.env.TWILIO_VIDEO_ACCOUNT_SID || '',
          authToken: process.env.TWILIO_VIDEO_AUTH_TOKEN || ''
        }
      },

      security: {
        jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
        rateLimiting: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
        },
        cors: {
          origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
          credentials: process.env.CORS_CREDENTIALS === 'true'
        }
      }
    };
  }

  private validateConfiguration(): void {
    const errors: string[] = [];

    if (this.config.nodeEnv === 'production') {
      const requiredVars = [
        { key: 'DB_PASSWORD', value: this.config.database.password },
        { key: 'JWT_SECRET', value: this.config.security.jwtSecret },
        { key: 'OPENAI_API_KEY', value: this.config.ai.openai.apiKey },
        { key: 'DAILY_API_KEY', value: this.config.webrtc.daily?.apiKey }
      ];

      requiredVars.forEach(({ key, value }) => {
        if (!value || value === 'your-super-secret-jwt-key-change-in-production') {
          errors.push(`Missing required environment variable: ${key}`);
        }
      });
    }

    if (this.config.port < 1 || this.config.port > 65535) {
      errors.push('Invalid port number');
    }

    if (this.config.database.maxConnections < 1) {
      errors.push('Database max connections must be at least 1');
    }

    if (!this.config.ai.openai.apiKey && !this.config.ai.azureOpenAI.apiKey) {
      console.warn('No AI service configured. AI features will be disabled.');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  public get(): AppConfig {
    return this.config;
  }

  public getDatabase(): DatabaseConfig {
    return this.config.database;
  }

  public getRedis(): RedisConfig {
    return this.config.redis;
  }

  public getAI(): AIConfig {
    return this.config.ai;
  }

  public getStorage(): StorageConfig {
    return this.config.storage;
  }

  public getEmail(): EmailConfig {
    return this.config.email;
  }

  public getSMS(): SMSConfig {
    return this.config.sms;
  }

  public getWebRTC(): WebRTCConfig {
    return this.config.webrtc;
  }

  public getSecurity(): SecurityConfig {
    return this.config.security;
  }

  public isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  public isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  public isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }
}

export const configService = ConfigurationService.getInstance();
export default configService;