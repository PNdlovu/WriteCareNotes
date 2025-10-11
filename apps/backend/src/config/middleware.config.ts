import { EventEmitter2 } from "eventemitter2";

import { config } from 'dotenv';

config();

export interface MiddlewareConfig {
  security: {
    csrf: {
      enabled: boolean;
      tokenLength: number;
      cookieName: string;
      headerName: string;
      secure: boolean;
      sameSite: 'strict' | 'lax' | 'none';
      maxAge: number;
    };
    sanitization: {
      enabled: boolean;
      allowedTags: string[];
      allowedAttributes: string[];
    };
    headers: {
      csp: string;
      hsts: string;
      xFrameOptions: string;
      xContentTypeOptions: string;
      xssProtection: string;
    };
  };
  rateLimiting: {
    enabled: boolean;
    redis: {
      host: string;
      port: number;
      password?: string;
      db: number;
    };
    limits: {
      general: {
        windowMs: number;
        max: number;
      };
      auth: {
        windowMs: number;
        max: number;
      };
      healthcare: {
        windowMs: number;
        max: number;
      };
      medication: {
        windowMs: number;
        max: number;
      };
      emergency: {
        windowMs: number;
        max: number;
      };
      upload: {
        windowMs: number;
        max: number;
      };
    };
  };
  audit: {
    enabled: boolean;
    maxLogs: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    includeRequestBody: boolean;
    includeResponseBody: boolean;
    sensitiveFields: string[];
  };
  validation: {
    enabled: boolean;
    stripUnknown: boolean;
    abortEarly: boolean;
    convert: boolean;
  };
}

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
export const middlewareConfig: MiddlewareConfig = {
  security: {
    csrf: {
      enabled: process.env['CSRF_ENABLED'] !== 'false',
      tokenLength: parseInt(process.env['CSRF_TOKEN_LENGTH'] || '32'),
      cookieName: process.env['CSRF_COOKIE_NAME'] || 'csrf-token',
      headerName: process.env['CSRF_HEADER_NAME'] || 'x-csrf-token',
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: (process.env['CSRF_SAME_SITE'] as 'strict' | 'lax' | 'none') || 'strict',
      maxAge: parseInt(process.env['CSRF_MAX_AGE'] || '86400000') // 24 hours
    },
    sanitization: {
      enabled: process.env['SANITIZATION_ENABLED'] !== 'false',
      allowedTags: (process.env['SANITIZATION_ALLOWED_TAGS'] || 'p,br,strong,em').split(','),
      allowedAttributes: (process.env['SANITIZATION_ALLOWED_ATTR'] || '').split(',').filter(Boolean)
    },
    headers: {
      csp: process.env['CSP_POLICY'] || "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
      hsts: process.env['HSTS_HEADER'] || 'max-age=31536000; includeSubDomains; preload',
      xFrameOptions: process.env['X_FRAME_OPTIONS'] || 'DENY',
      xContentTypeOptions: process.env['X_CONTENT_TYPE_OPTIONS'] || 'nosniff',
      xssProtection: process.env['XSS_PROTECTION'] || '1; mode=block'
    }
  },
  rateLimiting: {
    enabled: process.env['RATE_LIMITING_ENABLED'] !== 'false',
    redis: {
      host: process.env['REDIS_HOST'] || 'localhost',
      port: parseInt(process.env['REDIS_PORT'] || '6379'),
      password: process.env['REDIS_PASSWORD'],
      db: parseInt(process.env['REDIS_DB'] || '0')
    },
    limits: {
      general: {
        windowMs: parseInt(process.env['RATE_LIMIT_GENERAL_WINDOW'] || '900000'), // 15 minutes
        max: parseInt(process.env['RATE_LIMIT_GENERAL_MAX'] || '100')
      },
      auth: {
        windowMs: parseInt(process.env['RATE_LIMIT_AUTH_WINDOW'] || '900000'), // 15 minutes
        max: parseInt(process.env['RATE_LIMIT_AUTH_MAX'] || '5')
      },
      healthcare: {
        windowMs: parseInt(process.env['RATE_LIMIT_HEALTHCARE_WINDOW'] || '60000'), // 1 minute
        max: parseInt(process.env['RATE_LIMIT_HEALTHCARE_MAX'] || '30')
      },
      medication: {
        windowMs: parseInt(process.env['RATE_LIMIT_MEDICATION_WINDOW'] || '60000'), // 1 minute
        max: parseInt(process.env['RATE_LIMIT_MEDICATION_MAX'] || '20')
      },
      emergency: {
        windowMs: parseInt(process.env['RATE_LIMIT_EMERGENCY_WINDOW'] || '60000'), // 1 minute
        max: parseInt(process.env['RATE_LIMIT_EMERGENCY_MAX'] || '5')
      },
      upload: {
        windowMs: parseInt(process.env['RATE_LIMIT_UPLOAD_WINDOW'] || '3600000'), // 1 hour
        max: parseInt(process.env['RATE_LIMIT_UPLOAD_MAX'] || '10')
      }
    }
  },
  audit: {
    enabled: process.env['AUDIT_ENABLED'] !== 'false',
    maxLogs: parseInt(process.env['AUDIT_MAX_LOGS'] || '10000'),
    logLevel: (process.env['AUDIT_LOG_LEVEL'] as 'debug' | 'info' | 'warn' | 'error') || 'info',
    includeRequestBody: process.env['AUDIT_INCLUDE_REQUEST_BODY'] !== 'false',
    includeResponseBody: process.env['AUDIT_INCLUDE_RESPONSE_BODY'] === 'true',
    sensitiveFields: (process.env['AUDIT_SENSITIVE_FIELDS'] || 'password,token,secret,key,ssn,nhsNumber').split(',')
  },
  validation: {
    enabled: process.env['VALIDATION_ENABLED'] !== 'false',
    stripUnknown: process.env['VALIDATION_STRIP_UNKNOWN'] !== 'false',
    abortEarly: process.env['VALIDATION_ABORT_EARLY'] === 'true',
    convert: process.env['VALIDATION_CONVERT'] !== 'false'
  }
};

export default middlewareConfig;
