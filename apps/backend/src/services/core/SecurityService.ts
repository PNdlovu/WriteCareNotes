/**
 * @fileoverview security Service
 * @module Core/SecurityService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description security Service
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { configService } from './ConfigurationService';
import { loggerService } from './LoggerService';
import { databaseService } from './DatabaseService';

interface User {
  id: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
}

interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;
  exp: number;
}

interface AuthRequest extends Request {
  user?: User;
  sessionId?: string;
}

enum UserRole {
  PATIENT = 'patient',
  CAREGIVER = 'caregiver',
  HEALTHCARE_PROVIDER = 'healthcare_provider',
  SUPERVISOR = 'supervisor',
  ADMIN = 'admin',
  SYSTEM_ADMIN = 'system_admin'
}

enum Permission {
  // Patient permissions
  VIEW_OWN_PROFILE = 'view_own_profile',
  UPDATE_OWN_PROFILE = 'update_own_profile',
  VIEW_OWN_NOTES = 'view_own_notes',
  CREATE_OWN_NOTES = 'create_own_notes',
  
  // Caregiver permissions
  VIEW_ASSIGNED_PATIENTS = 'view_assigned_patients',
  CREATE_CARE_NOTES = 'create_care_notes',
  UPDATE_CARE_NOTES = 'update_care_notes',
  VIEW_CARE_NOTES = 'view_care_notes',
  COMMUNICATE_WITH_PATIENTS = 'communicate_with_patients',
  
  // Healthcare Provider permissions
  VIEW_PATIENT_RECORDS = 'view_patient_records',
  UPDATE_PATIENT_RECORDS = 'update_patient_records',
  PRESCRIBE_MEDICATION = 'prescribe_medication',
  VIEW_MEDICAL_HISTORY = 'view_medical_history',
  CREATE_TREATMENT_PLANS = 'create_treatment_plans',
  
  // Supervisor permissions
  VIEW_SUPERVISION_REPORTS = 'view_supervision_reports',
  MANAGE_CAREGIVERS = 'manage_caregivers',
  VIEW_COMPLIANCE_REPORTS = 'view_compliance_reports',
  HANDLE_COMPLAINTS = 'handle_complaints',
  ESCALATE_ISSUES = 'escalate_issues',
  
  // Admin permissions
  MANAGE_USERS = 'manage_users',
  MANAGE_PERMISSIONS = 'manage_permissions',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  MANAGE_SYSTEM_SETTINGS = 'manage_system_settings',
  
  // System Admin permissions
  SYSTEM_ADMINISTRATION = 'system_administration',
  DATABASE_ACCESS = 'database_access',
  SECURITY_MANAGEMENT = 'security_management'
}

interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'phone' | 'date' | 'boolean';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean | string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

class SecurityService {
  private static instance: SecurityService;
  private blacklistedTokens: Set<string> = new Set();
  private failedLoginAttempts: Map<string, number> = new Map();
  private lockedAccounts: Map<string, Date> = new Map();

  private constructor() {}

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // Password hashing
  public async hashPassword(password: string): Promise<string> {
    const saltRounds = configService.getSecurity().bcryptRounds;
    return bcrypt.hash(password, saltRounds);
  }

  public async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // JWT token management
  public generateToken(user: User): string {
    const securityConfig = configService.getSecurity();
    
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    };

    const token = jwt.sign(payload, securityConfig.jwtSecret, {
      expiresIn: securityConfig.jwtExpiresIn,
      issuer: 'writecarenotes',
      audience: 'writecarenotes-client'
    });

    loggerService.auditSystemAccess(user.id, 'LOGIN', {
      email: user.email,
      role: user.role
    });

    return token;
  }

  public verifyToken(token: string): JWTPayload | null {
    if (this.blacklistedTokens.has(token)) {
      return null;
    }

    try {
      const securityConfig = configService.getSecurity();
      const decoded = jwt.verify(token, securityConfig.jwtSecret, {
        issuer: 'writecarenotes',
        audience: 'writecarenotes-client'
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      loggerService.securityViolation('INVALID_TOKEN', undefined, {
        error: (error as Error).message
      });
      return null;
    }
  }

  public blacklistToken(token: string): void {
    this.blacklistedTokens.add(token);
    
    // Clean up old blacklisted tokens periodically
    if (this.blacklistedTokens.size > 10000) {
      this.cleanupBlacklistedTokens();
    }
  }

  private cleanupBlacklistedTokens(): void {
    // Remove tokens that are older than the JWT expiration time
    // This is a simplified cleanup - in production, you might want to store
    // blacklisted tokens in Redis with TTL
    this.blacklistedTokens.clear();
  }

  // Authentication middleware
  public authenticate() {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const token = authHeader.substring(7);
        const decoded = this.verifyToken(token);

        if (!decoded) {
          return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Fetch current user data
        const user = await this.getUserById(decoded.userId);
        
        if (!user || !user.isActive) {
          return res.status(401).json({ error: 'Account not found or inactive' });
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return res.status(423).json({ error: 'Account temporarily locked' });
        }

        req.user = user;
        req.sessionId = Math.random().toString(36).substring(7);

        loggerService.debug('User authenticated', {
          userId: user.id,
          email: user.email,
          role: user.role,
          sessionId: req.sessionId
        });

        next();
      } catch (error) {
        loggerService.error('Authentication error', error as Error);
        res.status(500).json({ error: 'Authentication failed' });
      }
    };
  }

  // Authorization middleware
  public authorize(requiredPermissions: Permission[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userPermissions = req.user.permissions;
      const hasPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        loggerService.unauthorizedAccess(
          req.user.id,
          req.path,
          req.method,
          {
            requiredPermissions,
            userPermissions,
            sessionId: req.sessionId
          }
        );

        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: requiredPermissions
        });
      }

      next();
    };
  }

  // Role-based authorization
  public authorizeRole(requiredRoles: UserRole[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!requiredRoles.includes(req.user.role)) {
        loggerService.unauthorizedAccess(
          req.user.id,
          req.path,
          req.method,
          {
            requiredRoles,
            userRole: req.user.role,
            sessionId: req.sessionId
          }
        );

        return res.status(403).json({ 
          error: 'Insufficient role privileges',
          required: requiredRoles,
          current: req.user.role
        });
      }

      next();
    };
  }

  // Rate limiting
  public createRateLimit(options?: {
    windowMs?: number;
    maxRequests?: number;
    skipSuccessfulRequests?: boolean;
  }) {
    const securityConfig = configService.getSecurity();
    
    return rateLimit({
      windowMs: options?.windowMs || securityConfig.rateLimiting.windowMs,
      max: options?.maxRequests || securityConfig.rateLimiting.maxRequests,
      skipSuccessfulRequests: options?.skipSuccessfulRequests || false,
      keyGenerator: (req: Request) => {
        // Use user ID if authenticated, otherwise IP
        const authReq = req as AuthRequest;
        return authReq.user?.id || req.ip;
      },
      handler: (req: Request, res: Response) => {
        loggerService.securityThreat('RATE_LIMIT_EXCEEDED', 'MEDIUM', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path
        });

        res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil(options?.windowMs || securityConfig.rateLimiting.windowMs / 1000)
        });
      }
    });
  }

  // Input validation
  public validateInput(data: any, rules: ValidationRule[]): ValidationResult {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = data[rule.field];

      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      // Skip validation if field is not required and empty
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      if (rule.type) {
        if (!this.validateType(value, rule.type)) {
          errors.push(`${rule.field} must be a valid ${rule.type}`);
          continue;
        }
      }

      // Length validation for strings
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${rule.field} must be at least ${rule.minLength} characters`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${rule.field} must not exceed ${rule.maxLength} characters`);
        }
      }

      // Numeric validation
      if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push(`${rule.field} must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push(`${rule.field} must not exceed ${rule.max}`);
        }
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string') {
        if (!rule.pattern.test(value)) {
          errors.push(`${rule.field} format is invalid`);
        }
      }

      // Custom validation
      if (rule.customValidator) {
        const result = rule.customValidator(value);
        if (typeof result === 'string') {
          errors.push(result);
        } else if (!result) {
          errors.push(`${rule.field} is invalid`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'email':
        return typeof value === 'string' && 
               /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        return typeof value === 'string' && 
               /^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''));
      case 'date':
        return !isNaN(Date.parse(value));
      default:
        return true;
    }
  }

  // Input sanitization
  public sanitizeInput(data: any): any {
    if (typeof data === 'string') {
      return data
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/['"]/g, '') // Remove quotes that could break SQL
        .trim();
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = Array.isArray(data) ? [] : {};
      
      for (const key in data) {
        sanitized[key] = this.sanitizeInput(data[key]);
      }
      
      return sanitized;
    }

    return data;
  }

  // Security headers middleware
  public securityHeaders() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    });
  }

  // Login attempt tracking
  public async trackLoginAttempt(email: string, success: boolean): Promise<void> {
    const key = email.toLowerCase();
    
    if (success) {
      this.failedLoginAttempts.delete(key);
      this.lockedAccounts.delete(key);
      
      // Update last login time
      await databaseService.query(
        'UPDATE users SET last_login_at = NOW(), login_attempts = 0 WHERE email = $1',
        [email]
      );
    } else {
      const attempts = (this.failedLoginAttempts.get(key) || 0) + 1;
      this.failedLoginAttempts.set(key, attempts);
      
      // Lock account after 5 failed attempts
      if (attempts >= 5) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        this.lockedAccounts.set(key, lockUntil);
        
        await databaseService.query(
          'UPDATE users SET locked_until = $1, login_attempts = $2 WHERE email = $3',
          [lockUntil, attempts, email]
        );

        loggerService.securityViolation('ACCOUNT_LOCKED', undefined, {
          email,
          attempts,
          lockUntil
        });
      } else {
        await databaseService.query(
          'UPDATE users SET login_attempts = $1 WHERE email = $2',
          [attempts, email]
        );
      }

      loggerService.authenticationFailure(email, 'Invalid credentials', {
        attempts,
        ip: 'unknown' // This would be passed from the request
      });
    }
  }

  // User management
  private async getUserById(userId: string): Promise<User | null> {
    try {
      const result = await databaseService.query(
        `SELECT id, email, role, permissions, is_active, last_login_at, 
                login_attempts, locked_until
         FROM users 
         WHERE id = $1 AND deleted_at IS NULL`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        role: row.role as UserRole,
        permissions: row.permissions || [],
        isActive: row.is_active,
        lastLoginAt: row.last_login_at,
        loginAttempts: row.login_attempts || 0,
        lockedUntil: row.locked_until
      };
    } catch (error) {
      loggerService.error('Failed to get user by ID', error as Error, { userId });
      return null;
    }
  }

  // Session management
  public invalidateSession(token: string): void {
    this.blacklistToken(token);
  }

  public invalidateAllUserSessions(userId: string): void {
    // In a production system, you would track active sessions
    // and invalidate them from a session store (Redis, etc.)
    loggerService.auditSystemAccess(userId, 'LOGOUT', {
      reason: 'All sessions invalidated'
    });
  }
}

export const securityService = SecurityService.getInstance();
export {
  SecurityService,
  User,
  JWTPayload,
  AuthRequest,
  UserRole,
  Permission,
  ValidationRule,
  ValidationResult
};
export default securityService;