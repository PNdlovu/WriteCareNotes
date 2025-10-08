/**
 * @fileoverview Express middleware for GDPR compliance validation
 * @module Gdpr-compliance-middleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Express middleware for GDPR compliance validation
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview GDPR Compliance Middleware
 * @module GDPRComplianceMiddleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Express middleware for GDPR compliance validation
 * with data processing legitimacy checks and consent verification.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './role-check-middleware';

export interface GDPRContext {
  dataProcessingPurpose: string;
  lawfulBasis: string;
  specialCategoryBasis?: string;
  dataMinimization: boolean;
  consentRequired: boolean;
  retentionPeriod: number;
  dataSubjectRights: string[];
}

/**
 * GDPR compliance middleware
 */
export const gdprComplianceMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Add GDPR context to request
    req.gdprContext = determineGDPRContext(req);

    // Validate data processing legitimacy
    const complianceCheck = validateDataProcessing(req.gdprContext, req);

    if (!complianceCheck.compliant) {
      return res.status(403).json({
        success: false,
        error: 'GDPR compliance violation',
        code: 'GDPR_VIOLATION',
        violations: complianceCheck.violations,
        remediation: complianceCheck.remediation
      });
    }

    // Log GDPR compliance check for audit
    console.log(`GDPR compliance validated for user ${req.user?.userId} with purpose: ${req.gdprContext.dataProcessingPurpose}`);

    next();
  } catch (error: unknown) {
    console.error('GDPR compliance middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during GDPR validation',
      code: 'GDPR_MIDDLEWARE_ERROR'
    });
  }
};

/**
 * Determine GDPR context based on request
 */
function determineGDPRContext(req: AuthenticatedRequest): GDPRContext {
  const path = req.path;
  const method = req.method;

  // Default context for consent management
  if (path.includes('/consent')) {
    return {
      dataProcessingPurpose: 'consent_management',
      lawfulBasis: 'legal_obligation',
      specialCategoryBasis: 'healthcare',
      dataMinimization: true,
      consentRequired: false, // Consent management itself doesn't require consent
      retentionPeriod: 7, // years
      dataSubjectRights: ['access', 'rectification', 'erasure', 'portability']
    };
  }

  // Default context for safeguarding
  if (path.includes('/safeguarding')) {
    return {
      dataProcessingPurpose: 'safeguarding_protection',
      lawfulBasis: 'vital_interests',
      specialCategoryBasis: 'substantial_public_interest',
      dataMinimization: true,
      consentRequired: false, // Safeguarding overrides consent requirements
      retentionPeriod: 25, // years for safeguarding records
      dataSubjectRights: ['access', 'rectification'] // Limited rights for safeguarding data
    };
  }

  // Default context for document management
  if (path.includes('/document')) {
    return {
      dataProcessingPurpose: 'care_service_delivery',
      lawfulBasis: 'legitimate_interests',
      specialCategoryBasis: 'healthcare',
      dataMinimization: true,
      consentRequired: true,
      retentionPeriod: 7, // years
      dataSubjectRights: ['access', 'rectification', 'erasure', 'restriction', 'portability']
    };
  }

  // Default fallback context
  return {
    dataProcessingPurpose: 'care_service_delivery',
    lawfulBasis: 'consent',
    specialCategoryBasis: 'healthcare',
    dataMinimization: true,
    consentRequired: true,
    retentionPeriod: 7,
    dataSubjectRights: ['access', 'rectification', 'erasure', 'restriction', 'portability', 'objection']
  };
}

/**
 * Validate data processing against GDPR requirements
 */
function validateDataProcessing(context: GDPRContext, req: AuthenticatedRequest): {
  compliant: boolean;
  violations: string[];
  remediation: string[];
} {
  const violations: string[] = [];
  const remediation: string[] = [];

  // Check if lawful basis is appropriate for the purpose
  if (context.consentRequired && !context.lawfulBasis.includes('consent')) {
    violations.push('Consent required but lawful basis does not include consent');
    remediation.push('Obtain explicit consent or change lawful basis');
  }

  // Check special category data basis for healthcare data
  if (req.body?.healthData && !context.specialCategoryBasis) {
    violations.push('Special category health data requires additional lawful basis');
    remediation.push('Specify special category basis under GDPR Article 9');
  }

  // Check data minimization
  if (!context.dataMinimization) {
    violations.push('Data minimization principle not applied');
    remediation.push('Ensure only necessary data is processed');
  }

  // Check retention period reasonableness
  if (context.retentionPeriod > 25) {
    violations.push('Retention period exceeds reasonable limits');
    remediation.push('Justify extended retention or reduce period');
  }

  return {
    compliant: violations.length === 0,
    violations,
    remediation
  };
}

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      gdprContext?: GDPRContext;
    }
  }
}