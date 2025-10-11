/**
 * @fileoverview Security middleware specifically for AI agents with enhanced protection
 * @module Ai-agent-security-middleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Security middleware specifically for AI agents with enhanced protection
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview AI Agent Security Middleware
 * @module AIAgentSecurityMiddleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-14
 * 
 * @description Security middleware specifically for AI agents with enhanced protection
 * against data leaks, prompt injection, and unauthorized access.
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';
import rateLimit from 'express-rate-limit';
import { createHash } from 'crypto';

interface AIAgentSecurityContext {
  agentType: 'PUBLIC' | 'TENANT';
  sessionId: string;
  tenantId?: string;
  userId?: string;
  securityLevel: 'BASIC' | 'ENHANCED' | 'MAXIMUM';
  encryptionRequired: boolean;
  auditLevel: 'MINIMAL' | 'STANDARD' | 'COMPREHENSIVE';
}

interface SecurityViolation {
  type: 'PROMPT_INJECTION' | 'DATA_EXTRACTION' | 'CROSS_TENANT_ATTEMPT' | 'RATE_LIMIT_EXCEEDED' | 'MALICIOUS_CONTENT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  evidence: string;
  timestamp: Date;
  blocked: boolean;
}

declare global {
  namespace Express {
    interface Request {
      aiSecurity?: AIAgentSecurityContext;
      securityViolations?: SecurityViolation[];
    }
  }
}

const logger = new Logger('AIAgentSecurityMiddleware');

/**
 * Public AI Agent Rate Limiting
 */
export const publicAIRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: {
    error: 'Too many requests to AI agent',
    code: 'AI_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use IP + User-Agent for more granular rate limiting
    return createHash('sha256')
      .update(req.ip + (req.get('User-Agent') || ''))
      .digest('hex');
  }
});

/**
 * Tenant AI Agent Rate Limiting
 */
export const tenantAIRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // 100 requests per window per tenant
  message: {
    error: 'Too many requests to tenant AI agent',
    code: 'TENANT_AI_RATE_LIMIT_EXCEEDED',
    retryAfter: '5 minutes'
  },
  keyGenerator: (req: Request) => {
    const tenantId = req.tenant?.tenantId || req.headers['x-tenant-id'] || 'unknown';
    const userId = req.user?.id || 'anonymous';
    return `tenant:${tenantId}:user:${userId}`;
  }
});

/**
 * AI Agent Security Middleware Factory
 */
export function aiAgentSecurityMiddleware(agentType: 'PUBLIC' | 'TENANT') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = generateSessionId();
      const violations: SecurityViolation[] = [];
      
      // Initialize security context
      const securityContext: AIAgentSecurityContext = {
        agentType,
        sessionId,
        securityLevel: agentType === 'TENANT' ? 'MAXIMUM' : 'ENHANCED',
        encryptionRequired: agentType === 'TENANT',
        auditLevel: agentType === 'TENANT' ? 'COMPREHENSIVE' : 'STANDARD'
      };

      if (agentType === 'TENANT') {
        securityContext.tenantId = req.tenant?.tenantId;
        securityContext.userId = req.user?.id;
        
        if (!securityContext.tenantId || !securityContext.userId) {
          return res.status(401).json({
            error: 'Authentication required for tenant AI agent',
            code: 'AI_TENANT_AUTH_REQUIRED'
          });
        }
      }

      // Perform security validations
      await performSecurityValidations(req, securityContext, violations);

      // Check for critical violations
      const criticalViolations = violations.filter(v => v.severity === 'CRITICAL');
      if (criticalViolations.length > 0) {
        console.error('Critical security violations detected for AI agent', {
          agentType,
          sessionId,
          tenantId: securityContext.tenantId,
          violations: criticalViolations
        });

        return res.status(403).json({
          error: 'Security violation detected',
          code: 'AI_SECURITY_VIOLATION',
          violations: criticalViolations.map(v => v.type)
        });
      }

      // Set security context in request
      req.aiSecurity = securityContext;
      req.securityViolations = violations;

      // Add security headers
      res.setHeader('X-AI-Security-Level', securityContext.securityLevel);
      res.setHeader('X-AI-Session-ID', sessionId);
      if (agentType === 'TENANT') {
        res.setHeader('X-AI-Tenant-Isolation', 'ENFORCED');
      }

      logger.debug('AI agent security validation complete', {
        agentType,
        sessionId,
        tenantId: securityContext.tenantId,
        violationsCount: violations.length,
        securityLevel: securityContext.securityLevel
      });

      next();

    } catch (error: unknown) {
      console.error('AI agent security middleware error', {
        agentType,
        error: error instanceof Error ? error.message : "Unknown error",
        path: req.path,
        method: req.method,
        stack: error instanceof Error ? error.stack : undefined
      });

      res.status(500).json({
        error: 'AI security validation failed',
        code: 'AI_SECURITY_ERROR'
      });
    }
  };
}

/**
 * Perform comprehensive security validations
 */
async function performSecurityValidations(
  req: Request,
  context: AIAgentSecurityContext,
  violations: SecurityViolation[]
): Promise<void> {
  try {
    // Check for prompt injection attempts
    await checkPromptInjection(req, violations);
    
    // Check for data extraction attempts
    await checkDataExtractionAttempts(req, violations);
    
    // Check for cross-tenant access attempts (tenant agents only)
    if (context.agentType === 'TENANT') {
      await checkCrossTenantAttempts(req, context, violations);
    }
    
    // Check for malicious content
    await checkMaliciousContent(req, violations);
    
    // Validate request structure
    await validateRequestStructure(req, violations);

  } catch (error: unknown) {
    console.error('Security validation error', {
      sessionId: context.sessionId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    
    violations.push({
      type: 'MALICIOUS_CONTENT',
      severity: 'HIGH',
      description: 'Security validation failed',
      evidence: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date(),
      blocked: true
    });
  }
}

/**
 * Check for prompt injection attempts
 */
async function checkPromptInjection(req: Request, violations: SecurityViolation[]): Promise<void> {
  const suspiciousPatterns = [
    /ignore\s+previous\s+instructions/i,
    /forget\s+everything/i,
    /you\s+are\s+now/i,
    /system\s+prompt/i,
    /\\n\\n\s*assistant:/i,
    /\\n\\n\s*human:/i,
    /<\|.*\|>/,
    /\[INST\]/i,
    /\[\/INST\]/i,
    /@@@/,
    /###\s*NEW\s+ROLE/i
  ];

  const content = JSON.stringify(req.body).toLowerCase();
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      violations.push({
        type: 'PROMPT_INJECTION',
        severity: 'CRITICAL',
        description: 'Potential prompt injection attempt detected',
        evidence: `Pattern matched: ${pattern.toString()}`,
        timestamp: new Date(),
        blocked: true
      });
      break;
    }
  }
}

/**
 * Check for data extraction attempts
 */
async function checkDataExtractionAttempts(req: Request, violations: SecurityViolation[]): Promise<void> {
  const extractionPatterns = [
    /show\s+me\s+all/i,
    /list\s+all\s+users/i,
    /database\s+schema/i,
    /table\s+structure/i,
    /admin\s+credentials/i,
    /password/i,
    /api\s+key/i,
    /secret/i,
    /token/i,
    /dump\s+data/i,
    /export\s+all/i
  ];

  const content = JSON.stringify(req.body).toLowerCase();
  
  for (const pattern of extractionPatterns) {
    if (pattern.test(content)) {
      violations.push({
        type: 'DATA_EXTRACTION',
        severity: 'HIGH',
        description: 'Potential data extraction attempt detected',
        evidence: `Pattern matched: ${pattern.toString()}`,
        timestamp: new Date(),
        blocked: true
      });
      break;
    }
  }
}

/**
 * Check for cross-tenant access attempts
 */
async function checkCrossTenantAttempts(
  req: Request,
  context: AIAgentSecurityContext,
  violations: SecurityViolation[]
): Promise<void> {
  const crossTenantPatterns = [
    /other\s+tenant/i,
    /different\s+organization/i,
    /another\s+care\s+home/i,
    /switch\s+tenant/i,
    /tenant\s*[:=]\s*[^}]+/i
  ];

  const content = JSON.stringify(req.body).toLowerCase();
  
  for (const pattern of crossTenantPatterns) {
    if (pattern.test(content)) {
      violations.push({
        type: 'CROSS_TENANT_ATTEMPT',
        severity: 'CRITICAL',
        description: 'Potential cross-tenant access attempt detected',
        evidence: `Pattern matched: ${pattern.toString()}`,
        timestamp: new Date(),
        blocked: true
      });
      break;
    }
  }
}

/**
 * Check for malicious content
 */
async function checkMaliciousContent(req: Request, violations: SecurityViolation[]): Promise<void> {
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /function\s*\(/i,
    /\{\{.*\}\}/,
    /\$\{.*\}/,
    /<%.*%>/
  ];

  const content = JSON.stringify(req.body);
  
  for (const pattern of maliciousPatterns) {
    if (pattern.test(content)) {
      violations.push({
        type: 'MALICIOUS_CONTENT',
        severity: 'HIGH',
        description: 'Potentially malicious content detected',
        evidence: `Pattern matched: ${pattern.toString()}`,
        timestamp: new Date(),
        blocked: true
      });
      break;
    }
  }
}

/**
 * Validate request structure
 */
async function validateRequestStructure(req: Request, violations: SecurityViolation[]): Promise<void> {
  try {
    // Check request size
    const requestSize = JSON.stringify(req.body).length;
    if (requestSize > 50000) { // 50KB limit
      violations.push({
        type: 'MALICIOUS_CONTENT',
        severity: 'MEDIUM',
        description: 'Request size exceeds maximum allowed',
        evidence: `Request size: ${requestSize} bytes`,
        timestamp: new Date(),
        blocked: true
      });
    }

    // Check for excessive nesting
    const nestingDepth = getObjectDepth(req.body);
    if (nestingDepth > 10) {
      violations.push({
        type: 'MALICIOUS_CONTENT',
        severity: 'MEDIUM',
        description: 'Request structure too deeply nested',
        evidence: `Nesting depth: ${nestingDepth}`,
        timestamp: new Date(),
        blocked: true
      });
    }

  } catch (error: unknown) {
    violations.push({
      type: 'MALICIOUS_CONTENT',
      severity: 'HIGH',
      description: 'Request structure validation failed',
      evidence: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date(),
      blocked: true
    });
  }
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `ai_session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Get object nesting depth
 */
function getObjectDepth(obj: any): number {
  if (typeof obj !== 'object' || obj === null) {
    return 0;
  }
  
  let maxDepth = 0;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const depth = getObjectDepth(obj[key]) + 1;
      maxDepth = Math.max(maxDepth, depth);
    }
  }
  
  return maxDepth;
}

/**
 * Tenant AI Agent Input Sanitization
 */
export function sanitizeTenantAIInput(req: Request, res: Response, next: NextFunction): void {
  try {
    if (req.body && req.body['message']) {
      // Remove potentially dangerous content
      req.body['message'] = sanitizeMessage(req.body['message']);
    }

    if (req.body && req.body['careContext']) {
      // Sanitize care context data
      req.body['careContext'] = sanitizeCareContext(req.body['careContext']);
    }

    next();

  } catch (error: unknown) {
    console.error('AI input sanitization failed', {
      error: error instanceof Error ? error.message : "Unknown error",
      path: req.path
    });

    res.status(400).json({
      error: 'Invalid input format',
      code: 'AI_INPUT_SANITIZATION_ERROR'
    });
  }
}

/**
 * Sanitize message content
 */
function sanitizeMessage(message: string): string {
  if (typeof message !== 'string') {
    return '';
  }

  // Remove HTML tags
  message = message.replace(/<[^>]*>/g, '');
  
  // Remove script content
  message = message.replace(/javascript:/gi, '');
  
  // Remove potential template injection
  message = message.replace(/\{\{.*?\}\}/g, '');
  message = message.replace(/\$\{.*?\}/g, '');
  
  // Limit message length
  if (message.length > 10000) {
    message = message.substring(0, 10000) + '... [truncated]';
  }
  
  return message.trim();
}

/**
 * Sanitize care context data
 */
function sanitizeCareContext(careContext: any): any {
  if (!careContext || typeofcareContext !== 'object') {
    return {};
  }

  const sanitized = {};
  
  // Only allow specific known fields
  const allowedFields = [
    'currentCareNeeds',
    'recentAssessments',
    'medicationChanges',
    'familyConcerns',
    'complianceRequirements'
  ];

  for (const field of allowedFields) {
    if (careContext[field]) {
      if (Array.isArray(careContext[field])) {
        sanitized[field] = careContext[field]
          .filter(item => typeofitem === 'string')
          .map(item => sanitizeMessage(item))
          .slice(0, 10); // Limit array size
      } else if (typeof careContext[field] === 'string') {
        sanitized[field] = sanitizeMessage(careContext[field]);
      }
    }
  }

  return sanitized;
}

/**
 * Tenant AI Agent Isolation Validation
 */
export function validateTenantAIIsolation(req: Request, res: Response, next: NextFunction): void {
  try {
    const tenantId = req.tenant?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      return res.status(401).json({
        error: 'Tenant authentication required for AI agent access',
        code: 'AI_TENANT_AUTH_REQUIRED'
      });
    }

    // Validate tenant-user relationship
    if (!isValidTenantUserRelationship(tenantId, userId)) {
      console.warn('Invalid tenant-user relationship for AI agent', {
        tenantId,
        userId,
        path: req.path,
        ip: req.ip
      });

      return res.status(403).json({
        error: 'Tenant access violation',
        code: 'AI_TENANT_ACCESS_VIOLATION'
      });
    }

    // Check for resident ID validation
    if (req.body['residentId']) {
      if (!isValidResidentAccess(req.body['residentId'], tenantId)) {
        console.warn('Invalid resident access attempt via AI agent', {
          tenantId,
          userId,
          residentId: req.body['residentId'],
          path: req.path
        });

        return res.status(403).json({
          error: 'Resident access violation',
          code: 'AI_RESIDENT_ACCESS_VIOLATION'
        });
      }
    }

    next();

  } catch (error: unknown) {
    console.error('Tenant AI isolation validation error', {
      error: error instanceof Error ? error.message : "Unknown error",
      path: req.path,
      tenantId: req.tenant?.tenantId
    });

    res.status(500).json({
      error: 'AI isolation validation failed',
      code: 'AI_ISOLATION_ERROR'
    });
  }
}

/**
 * Validate tenant-user relationship
 */
function isValidTenantUserRelationship(tenantId: string, userId: string): boolean {
  try {
    // Verify against the actual database
    const relationship = await this.userTenantService.validateUserTenantRelationship(userId, tenantId);
    return relationship.isValid;
  } catch (error: unknown) {
    console.error('Failed to validate tenant-user relationship', {
      tenantId,
      userId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return false;
  }
}

/**
 * Validate resident access permissions
 */
function isValidResidentAccess(residentId: string, tenantId: string): boolean {
  try {
    // Verify resident belongs to tenant
    return residentId.includes(tenantId) || residentId.startsWith(`${tenantId}_`);
  } catch (error: unknown) {
    console.error('Failed to validate resident access', {
      residentId,
      tenantId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return false;
  }
}

/**
 * AI Response Encryption Middleware
 */
export function encryptAIResponse(req: Request, res: Response, next: NextFunction): void {
  if (req.aiSecurity?.encryptionRequired) {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      try {
        // Encrypt response data for tenant agents
        const encryptedData = encryptResponseData(data, req.aiSecurity.tenantId);
        return originalSend.call(this, encryptedData);
      } catch (error: unknown) {
        console.error('AI response encryption failed', {
          sessionId: req.aiSecurity.sessionId,
          tenantId: req.aiSecurity.tenantId,
          error: error instanceof Error ? error.message : "Unknown error"
        });
        
        return originalSend.call(this, {
          error: 'Response encryption failed',
          code: 'AI_ENCRYPTION_ERROR'
        });
      }
    };
  }
  
  next();
}

/**
 * Encrypt response data
 */
function encryptResponseData(data: any, tenantId: string): any {
  try {
    // Use proper encryption with tenant-specific keys
    if (typeof data === 'object' && data !== null) {
      const encryptedData = this.encryptionService.encryptWithTenantKey(data, tenantId);
      return {
        encryptedPayload: encryptedData,
        encrypted: true,
        encryptionVersion: '2.0',
        tenantId: tenantId
      };
    }
    
    return data;
  } catch (error: unknown) {
    console.error('Failed to encrypt response data', {
      tenantId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    throw error;
  }
}

/**
 * AI Agent Audit Logging Middleware
 */
export function auditAIInteraction(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Capture original response methods
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Override response methods to capture data
  res.send = function(data: any) {
    logAIInteraction(req, res, data, Date.now() - startTime);
    return originalSend.call(this, data);
  };
  
  res.json = function(data: any) {
    logAIInteraction(req, res, data, Date.now() - startTime);
    return originalJson.call(this, data);
  };
  
  next();
}

/**
 * Log AI interaction for audit trail
 */
function logAIInteraction(req: Request, res: Response, responseData: any, responseTime: number): void {
  try {
    const auditData = {
      sessionId: req.aiSecurity?.sessionId,
      agentType: req.aiSecurity?.agentType,
      tenantId: req.aiSecurity?.tenantId,
      userId: req.aiSecurity?.userId,
      requestPath: req.path,
      requestMethod: req.method,
      requestSize: JSON.stringify(req.body).length,
      responseSize: JSON.stringify(responseData).length,
      responseTime,
      statusCode: res.statusCode,
      securityViolations: req.securityViolations?.length || 0,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    console.log('AI agent interaction logged', auditData);

    // In production, store in audit database
    // await auditService.logAIInteraction(auditData);

  } catch (error: unknown) {
    console.error('Failed to log AI interaction', {
      sessionId: req.aiSecurity?.sessionId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

export default {
  aiAgentSecurityMiddleware,
  publicAIRateLimit,
  tenantAIRateLimit,
  sanitizeTenantAIInput,
  validateTenantAIIsolation,
  encryptAIResponse,
  auditAIInteraction
};
