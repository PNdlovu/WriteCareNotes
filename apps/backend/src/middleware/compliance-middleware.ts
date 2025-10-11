/**
 * @fileoverview Middleware for ensuring healthcare compliance
 * @module Compliance-middleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Middleware for ensuring healthcare compliance
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Compliance Middleware for WriteCareNotes
 * @module ComplianceMiddleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Middleware for ensuring healthcare compliance
 * across all API requests with GDPR, HIPAA, and regulatory support.
 */

import { Request, Response, NextFunction } from 'express';
import { HealthcareLogger } from '@/utils/logger';

/**
 * Compliance monitoring middleware
 */
export const complianceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Add compliance headers
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('x-xss-protection', '1; mode=block');
  res.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains');
  
  // Log compliance-relevant requests
  if (isComplianceRelevantRequest(req)) {
    HealthcareLogger.compliance('Compliance-relevant request processed', {
      method: req.method,
      path: req.path,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      correlationId: req.correlationId
    });
  }
  
  next();
};

/**
 * Check if request is compliance-relevant
 */
function isComplianceRelevantRequest(req: Request): boolean {
  const compliancePaths = [
    '/api/v1/residents',
    '/api/v1/financial',
    '/api/v1/organizations',
    '/api/v1/staff',
    '/api/v1/medications',
    '/api/v1/care-plans'
  ];
  
  return compliancePaths.some(path => req.path.startsWith(path));
}

export default complianceMiddleware;
