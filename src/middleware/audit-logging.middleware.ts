/**
 * @fileoverview Automatic Audit Logging Middleware
 * @module Middleware/AuditLogging
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance CQC, GDPR, NHS Digital, ISO 27001
 * 
 * @description
 * Middleware that automatically logs all API requests to the audit trail.
 * Captures request/response data, timing, user context, and compliance information.
 */

import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { AuditService } from '../services/audit/AuditService';
import { AuditEventType, ComplianceFramework } from '../entities/audit/AuditEvent';

// Paths that should not be audited (to prevent audit log flooding)
const EXCLUDED_PATHS = [
  '/health',
  '/api/health',
  '/api/v1/system/status',
  '/api/v1/system/diagnostics',
  '/favicon.ico',
];

// Sensitive fields that should be redacted in audit logs
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'creditCard',
  'ssn',
];

/**
 * Redact sensitive data from objects
 */
function redactSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const redacted = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in redacted) {
    const lowerKey = key.toLowerCase();
    const shouldRedact = SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()));

    if (shouldRedact) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }

  return redacted;
}

/**
 * Determine audit event type based on HTTP method
 */
function getEventTypeFromMethod(method: string): AuditEventType {
  switch (method.toUpperCase()) {
    case 'POST':
      return AuditEventType.DATA_MODIFICATION;
    case 'PUT':
    case 'PATCH':
      return AuditEventType.DATA_MODIFICATION;
    case 'DELETE':
      return AuditEventType.DATA_DELETION;
    case 'GET':
      return AuditEventType.DATA_ACCESS;
    default:
      return AuditEventType.DATA_ACCESS;
  }
}

/**
 * Determine entity type and ID from request path
 */
function extractEntityInfo(path: string): { entityType: string; entityId: string } {
  const parts = path.split('/').filter(p => p);
  
  // Try to find UUID pattern in path
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const entityId = parts.find(p => uuidPattern.test(p)) || 'unknown';
  
  // Get entity type from path segments
  const entityType = parts.find(p => !uuidPattern.test(p) && p !== 'api' && p !== 'v1') || 'unknown';
  
  return { entityType, entityId };
}

/**
 * Determine compliance requirements based on path and data
 */
function determineComplianceRequirements(path: string, body: any): ComplianceFramework[] {
  const requirements: ComplianceFramework[] = [ComplianceFramework.GDPR]; // GDPR applies to all

  // Care-related operations
  if (path.includes('/residents') || path.includes('/care') || path.includes('/medication')) {
    requirements.push(ComplianceFramework.CQC, ComplianceFramework.NICE_GUIDELINES);
  }

  // Medical/health data
  if (path.includes('/health') || path.includes('/medical') || path.includes('/medication')) {
    requirements.push(ComplianceFramework.NHS_DIGITAL, ComplianceFramework.ISO_27001);
  }

  // Staff data
  if (path.includes('/staff') || path.includes('/hr')) {
    requirements.push(ComplianceFramework.CARE_ACT_2014);
  }

  // Check for mental capacity references
  if (body && (body.mentalCapacity || body.capacityAssessment)) {
    requirements.push(ComplianceFramework.MENTAL_CAPACITY_ACT);
  }

  return [...new Set(requirements)]; // Remove duplicates
}

/**
 * Determine data classification based on path and content
 */
function classifyData(path: string, body: any): {
  dataType: 'personal' | 'sensitive_personal' | 'medical' | 'financial' | 'operational';
  sensitivityLevel: 'public' | 'internal' | 'confidential' | 'restricted' | 'top_secret';
  retentionPeriod: number;
  encryptionRequired: boolean;
  accessRestrictions: string[];
} {
  let dataType: any = 'operational';
  let sensitivityLevel: any = 'internal';
  let retentionPeriod = 2555; // 7 years default (CQC requirement)
  let encryptionRequired = false;
  const accessRestrictions: string[] = [];

  // Medical/care data
  if (path.includes('/residents') || path.includes('/care') || path.includes('/medication')) {
    dataType = 'medical';
    sensitivityLevel = 'confidential';
    retentionPeriod = 2920; // 8 years for medical records
    encryptionRequired = true;
    accessRestrictions.push('care_staff', 'clinical_staff');
  }

  // Financial data
  if (path.includes('/financial') || path.includes('/payment') || path.includes('/billing')) {
    dataType = 'financial';
    sensitivityLevel = 'confidential';
    retentionPeriod = 2555; // 7 years for financial records
    encryptionRequired = true;
    accessRestrictions.push('finance_team', 'administrators');
  }

  // Staff data
  if (path.includes('/staff') || path.includes('/hr')) {
    dataType = 'personal';
    sensitivityLevel = 'confidential';
    retentionPeriod = 2190; // 6 years after employment ends
    encryptionRequired = true;
    accessRestrictions.push('hr_team', 'managers');
  }

  // Sensitive personal data
  if (body && (body.medicalHistory || body.disabilities || body.religion || body.sexuality)) {
    dataType = 'sensitive_personal';
    sensitivityLevel = 'restricted';
    encryptionRequired = true;
  }

  return {
    dataType,
    sensitivityLevel,
    retentionPeriod,
    encryptionRequired,
    accessRestrictions,
  };
}

/**
 * Create audit logging middleware
 */
export function createAuditMiddleware(dataSource: DataSource) {
  const auditService = new AuditService(dataSource);

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip excluded paths
    if (EXCLUDED_PATHS.some(path => req.path.startsWith(path))) {
      return next();
    }

    const startTime = Date.now();
    const originalJson = res.json.bind(res);
    let responseBody: any;
    let statusCode: number;

    // Intercept response
    res.json = function (body: any) {
      responseBody = body;
      statusCode = res.statusCode;
      return originalJson(body);
    };

    // Wait for response to complete
    res.on('finish', async () => {
      const processingTime = Date.now() - startTime;

      try {
        const user = (req as any).user || { id: 'anonymous' };
        const { entityType, entityId } = extractEntityInfo(req.path);
        const dataClassification = classifyData(req.path, req.body);
        const complianceRequirements = determineComplianceRequirements(req.path, req.body);

        await auditService.logEvent({
          eventType: getEventTypeFromMethod(req.method),
          entityType,
          entityId,
          action: `${req.method} ${req.path}`,
          userId: user.id,
          details: {
            method: req.method,
            path: req.path,
            query: redactSensitiveData(req.query),
            body: redactSensitiveData(req.body),
            headers: {
              userAgent: req.get('user-agent'),
              contentType: req.get('content-type'),
              accept: req.get('accept'),
            },
            response: {
              statusCode,
              body: redactSensitiveData(responseBody),
            },
          },
          auditContext: {
            sessionId: (req as any).session?.id || 'unknown',
            userAgent: req.get('user-agent') || 'unknown',
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            geolocation: undefined, // Would be populated from IP lookup service
            deviceInfo: {
              deviceType: req.get('user-agent')?.includes('Mobile') ? 'mobile' : 'desktop',
              operatingSystem: extractOS(req.get('user-agent') || ''),
              browserInfo: req.get('user-agent'),
            },
            networkInfo: {
              networkType: 'ethernet',
              connectionSecurity: req.secure,
              vpnUsed: false, // Would be detected from IP analysis
            },
          },
          dataClassification: {
            ...dataClassification,
            complianceRequirements,
          },
          businessJustification: req.get('x-business-justification') || undefined,
          beforeState: (req as any).beforeState,
          afterState: responseBody,
        }, processingTime);

      } catch (error) {
        // Log error but don't fail the request
        console.error('Audit logging error:', error);
      }
    });

    next();
  };
}

/**
 * Extract operating system from user agent
 */
function extractOS(userAgent: string): string {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS') || userAgent.includes('iPhone')) return 'iOS';
  return 'Unknown';
}

export default createAuditMiddleware;
