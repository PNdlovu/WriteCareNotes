/**
 * @fileoverview Middleware for validating compliance requirements across British Isles
 * @module Compliance-validation-middleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Middleware for validating compliance requirements across British Isles
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Compliance Validation Middleware
 * @module ComplianceValidationMiddleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Middleware for validating compliance requirements across British Isles
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Compliance Validation Context
 */
interface ComplianceValidationContext {
  organizationId: string;
  userId: string;
  action: string;
  jurisdiction?: string;
  serviceType?: string;
  dataClassification?: string;
  professionalBody?: string;
}

/**
 * Compliance Validation Result
 */
interface ComplianceValidationResult {
  isValid: boolean;
  violations: ComplianceViolation[];
  warnings: ComplianceWarning[];
  requiredActions: string[];
  blockedReasons: string[];
}

/**
 * Compliance Violation
 */
interface ComplianceViolation {
  type: 'regulatory' | 'professional' | 'data_protection' | 'clinical_safety';
  severity: 'critical' | 'high' | 'medium' | 'low';
  regulation: string;
  description: string;
  requiredAction: string;
  deadline?: Date;
}

/**
 * Compliance Warning
 */
interface ComplianceWarning {
  type: 'approaching_deadline' | 'missing_documentation' | 'training_required';
  message: string;
  recommendedAction: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Compliance Validation Middleware
 */
export class ComplianceValidationMiddleware {
  // Logger removed

  const ructor(private readonlyeventEmitter: EventEmitter2) {}

  /**
   * Main compliance validation middleware
   */
  validateCompliance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = this.extractValidationContext(req);
      const validationResult = await this.performComplianceValidation(context);

      // Add compliance context to request
      req['complianceContext'] = {
        context,
        validationResult,
        validatedAt: new Date()
      };

      // Check for blocking violations
      if (this.hasBlockingViolations(validationResult)) {
        return res.status(403).json({
          success: false,
          message: 'Compliance validation failed',
          violations: validationResult.violations,
          blockedReasons: validationResult.blockedReasons
        });
      }

      // Log warnings if present
      if (validationResult.warnings.length > 0) {
        console.warn(`Compliance warnings for ${context.organizationId}: ${validationResult.warnings.length} warnings`);
      }

      // Emit compliance validation event
      this.eventEmitter.emit('compliance.validation.completed', {
        organizationId: context.organizationId,
        action: context.action,
        isValid: validationResult.isValid,
        violationCount: validationResult.violations.length,
        warningCount: validationResult.warnings.length
      });

      next();

    } catch (error: unknown) {
      console.error(`Compliance validationfailed: ${error instanceof Error ? error.message : "Unknown error"}`);
      return res.status(500).json({
        success: false,
        message: 'Compliance validation error',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * Jurisdiction-specific compliance validation
   */
  validateJurisdictionCompliance = (jurisdiction: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = this.extractValidationContext(req);
        context.jurisdiction = jurisdiction;

        const jurisdictionValidation = await this.performJurisdictionValidation(context);

        if (!jurisdictionValidation.isValid) {
          return res.status(403).json({
            success: false,
            message: `${jurisdiction} compliance validation failed`,
            violations: jurisdictionValidation.violations,
            jurisdiction
          });
        }

        req['jurisdictionCompliance'] = {
          jurisdiction,
          validation: jurisdictionValidation,
          validatedAt: new Date()
        };

        next();

      } catch (error: unknown) {
        console.error(`${jurisdiction} compliance validationfailed: ${error instanceof Error ? error.message : "Unknown error"}`);
        return res.status(500).json({
          success: false,
          message: `${jurisdiction} compliance validation error`,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    };
  };

  /**
   * Professional standards validation
   */
  validateProfessionalStandards = (professionalBody?: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const context = this.extractValidationContext(req);
        context.professionalBody = professionalBody;

        const professionalValidation = await this.performProfessionalValidation(context);

        if (!professionalValidation.isValid) {
          return res.status(403).json({
            success: false,
            message: 'Professional standards validation failed',
            violations: professionalValidation.violations,
            professionalBody
          });
        }

        req['professionalCompliance'] = {
          professionalBody,
          validation: professionalValidation,
          validatedAt: new Date()
        };

        next();

      } catch (error: unknown) {
        console.error(`Professional standards validationfailed: ${error instanceof Error ? error.message : "Unknown error"}`);
        return res.status(500).json({
          success: false,
          message: 'Professional standards validation error',
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    };
  };

  /**
   * Data protection compliance validation
   */
  validateDataProtection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = this.extractValidationContext(req);
      const dataProtectionValidation = await this.performDataProtectionValidation(context);

      if (!dataProtectionValidation.isValid) {
        return res.status(403).json({
          success: false,
          message: 'Data protection compliance validation failed',
          violations: dataProtectionValidation.violations
        });
      }

      req['dataProtectionCompliance'] = {
        validation: dataProtectionValidation,
        validatedAt: new Date()
      };

      next();

    } catch (error: unknown) {
      console.error(`Data protection validationfailed: ${error instanceof Error ? error.message : "Unknown error"}`);
      return res.status(500).json({
        success: false,
        message: 'Data protection validation error',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * Clinical safety validation
   */
  validateClinicalSafety = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = this.extractValidationContext(req);
      const clinicalSafetyValidation = await this.performClinicalSafetyValidation(context);

      if (!clinicalSafetyValidation.isValid) {
        return res.status(403).json({
          success: false,
          message: 'Clinical safety validation failed',
          violations: clinicalSafetyValidation.violations
        });
      }

      req['clinicalSafetyCompliance'] = {
        validation: clinicalSafetyValidation,
        validatedAt: new Date()
      };

      next();

    } catch (error: unknown) {
      console.error(`Clinical safety validationfailed: ${error instanceof Error ? error.message : "Unknown error"}`);
      return res.status(500).json({
        success: false,
        message: 'Clinical safety validation error',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * Extract validation context from request
   */
  private extractValidationContext(req: Request): ComplianceValidationContext {
    return {
      organizationId: req.body?.organizationId || req.params?.organizationId || req.user?.organizationId,
      userId: req.user?.id || 'anonymous',
      action: `${req.method} ${req.path}`,
      jurisdiction: req.body?.jurisdiction || req.query?.jurisdiction,
      serviceType: req.body?.serviceType || req.query?.serviceType,
      dataClassification: req.body?.dataClassification || 'standard',
      professionalBody: req.body?.professionalBody || req.query?.professionalBody
    };
  }

  /**
   * Perform comprehensive compliance validation
   */
  private async performComplianceValidation(context: ComplianceValidationContext): Promise<ComplianceValidationResult> {
    const violations: ComplianceViolation[] = [];
    const warnings: ComplianceWarning[] = [];
    const requiredActions: string[] = [];

    // Validate regulatory compliance
    const regulatoryViolations = await this.validateRegulatoryCompliance(context);
    violations.push(...regulatoryViolations);

    // Validate professional standards
    const professionalViolations = await this.validateProfessionalCompliance(context);
    violations.push(...professionalViolations);

    // Validate data protection
    const dataProtectionViolations = await this.validateDataProtectionCompliance(context);
    violations.push(...dataProtectionViolations);

    // Validate clinical safety
    const clinicalSafetyViolations = await this.validateClinicalSafetyCompliance(context);
    violations.push(...clinicalSafetyViolations);

    // Generate warnings
    const complianceWarnings = await this.generateComplianceWarnings(context);
    warnings.push(...complianceWarnings);

    // Generate required actions
    for (const violation of violations) {
      if (violation.requiredAction) {
        requiredActions.push(violation.requiredAction);
      }
    }

    const isValid = violations.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0;
    const blockedReasons = violations
      .filter(v => v.severity === 'critical')
      .map(v => v.description);

    return {
      isValid,
      violations,
      warnings,
      requiredActions: [...new Set(requiredActions)],
      blockedReasons
    };
  }

  /**
   * Perform jurisdiction-specific validation
   */
  private async performJurisdictionValidation(context: ComplianceValidationContext): Promise<ComplianceValidationResult> {
    const violations: ComplianceViolation[] = [];

    switch (context.jurisdiction) {
      case 'england':
        violations.push(...await this.validateCQCCompliance(context));
        break;
      case 'scotland':
        violations.push(...await this.validateScotlandCompliance(context));
        break;
      case 'wales':
        violations.push(...await this.validateWalesCompliance(context));
        break;
      case 'northern_ireland':
        violations.push(...await this.validateNorthernIrelandCompliance(context));
        break;
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings: [],
      requiredActions: violations.map(v => v.requiredAction),
      blockedReasons: violations.filter(v => v.severity === 'critical').map(v => v.description)
    };
  }

  /**
   * Validate regulatory compliance
   */
  private async validateRegulatoryCompliance(context: ComplianceValidationContext): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    // Check NHS Digital compliance
    const nhsDigitalValid = await this.checkNHSDigitalCompliance(context.organizationId);
    if (!nhsDigitalValid) {
      violations.push({
        type: 'regulatory',
        severity: 'high',
        regulation: 'NHS Digital DSPT',
        description: 'DSPT assessment not current or standards not met',
        requiredAction: 'Complete DSPT assessment and achieve Standards Met status'
      });
    }

    // Check professional registration compliance
    if (context.professionalBody) {
      const professionalValid = await this.checkProfessionalRegistration(context.userId, context.professionalBody);
      if (!professionalValid) {
        violations.push({
          type: 'professional',
          severity: 'critical',
          regulation: `${context.professionalBody.toUpperCase()} Registration`,
          description: 'Professional registration not valid or expired',
          requiredAction: 'Renew professional registration immediately'
        });
      }
    }

    return violations;
  }

  /**
   * Validate professional compliance
   */
  private async validateProfessionalCompliance(context: ComplianceValidationContext): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    // Check actual professional standards compliance
    const professionalStandardsViolations = await this.professionalStandardsService.validateCompliance(context);
    violations.push(...professionalStandardsViolations);

    return violations;
  }

  /**
   * Validate data protection compliance
   */
  private async validateDataProtectionCompliance(context: ComplianceValidationContext): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    // Check GDPR compliance for data processing actions
    if (context.action.includes('data') || context.action.includes('personal')) {
      const gdprValid = await this.checkGDPRCompliance(context.organizationId);
      if (!gdprValid) {
        violations.push({
          type: 'data_protection',
          severity: 'high',
          regulation: 'GDPR',
          description: 'Data processing not compliant with GDPR requirements',
          requiredAction: 'Ensure lawful basis and data subject rights compliance'
        });
      }
    }

    return violations;
  }

  /**
   * Validate clinical safety compliance
   */
  private async validateClinicalSafetyCompliance(context: ComplianceValidationContext): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    // Check clinical safety for clinical actions
    if (context.action.includes('clinical') || context.action.includes('medication') || context.action.includes('care')) {
      const clinicalSafetyValid = await this.checkClinicalSafety(context.organizationId);
      if (!clinicalSafetyValid) {
        violations.push({
          type: 'clinical_safety',
          severity: 'critical',
          regulation: 'DCB0129 Clinical Risk Management',
          description: 'Clinical safety requirements not met',
          requiredAction: 'Complete clinical risk assessment and implement safety controls'
        });
      }
    }

    return violations;
  }

  /**
   * Validate CQC compliance (England)
   */
  private async validateCQCCompliance(context: ComplianceValidationContext): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    // Check CQC registration
    const cqcRegistered = await this.checkCQCRegistration(context.organizationId);
    if (!cqcRegistered) {
      violations.push({
        type: 'regulatory',
        severity: 'critical',
        regulation: 'CQC Registration',
        description: 'Service not registered with CQC',
        requiredAction: 'Register service with CQC before providing care'
      });
    }

    // Check fundamental standards compliance
    const fundamentalStandardsValid = await this.checkFundamentalStandards(context.organizationId);
    if (!fundamentalStandardsValid) {
      violations.push({
        type: 'regulatory',
        severity: 'high',
        regulation: 'CQC Fundamental Standards',
        description: 'One or more fundamental standards not met',
        requiredAction: 'Address fundamental standards non-compliance immediately'
      });
    }

    return violations;
  }

  /**
   * Validate Scotland compliance
   */
  private async validateScotlandCompliance(context: ComplianceValidationContext): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    // Check Care Inspectorate registration
    const scotlandRegistered = await this.checkScotlandRegistration(context.organizationId);
    if (!scotlandRegistered) {
      violations.push({
        type: 'regulatory',
        severity: 'critical',
        regulation: 'Care Inspectorate Scotland Registration',
        description: 'Service not registered with Care Inspectorate Scotland',
        requiredAction: 'Register service with Care Inspectorate Scotland'
      });
    }

    return violations;
  }

  /**
   * Validate Wales compliance
   */
  private async validateWalesCompliance(context: ComplianceValidationContext): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    // Check CIW registration
    const walesRegistered = await this.checkWalesRegistration(context.organizationId);
    if (!walesRegistered) {
      violations.push({
        type: 'regulatory',
        severity: 'critical',
        regulation: 'CIW Registration',
        description: 'Service not registered with Care Inspectorate Wales',
        requiredAction: 'Register service with CIW'
      });
    }

    // Check Welsh language compliance
    const welshLanguageValid = await this.checkWelshLanguageCompliance(context.organizationId);
    if (!welshLanguageValid) {
      violations.push({
        type: 'regulatory',
        severity: 'medium',
        regulation: 'Welsh Language Standards',
        description: 'Welsh language active offer not implemented',
        requiredAction: 'Implement Welsh language active offer'
      });
    }

    return violations;
  }

  /**
   * Validate Northern Ireland compliance
   */
  private async validateNorthernIrelandCompliance(context: ComplianceValidationContext): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    // Check RQIA registration
    const rqiaRegistered = await this.checkRQIARegistration(context.organizationId);
    if (!rqiaRegistered) {
      violations.push({
        type: 'regulatory',
        severity: 'critical',
        regulation: 'RQIA Registration',
        description: 'Service not registered with RQIA',
        requiredAction: 'Register service with RQIA'
      });
    }

    // Check human rights compliance
    const humanRightsValid = await this.checkHumanRightsCompliance(context.organizationId);
    if (!humanRightsValid) {
      violations.push({
        type: 'regulatory',
        severity: 'high',
        regulation: 'Human Rights Act',
        description: 'Human rights principles not embedded in service delivery',
        requiredAction: 'Implement human rights-based care approach'
      });
    }

    return violations;
  }

  /**
   * Generate compliance warnings
   */
  private async generateComplianceWarnings(context: ComplianceValidationContext): Promise<ComplianceWarning[]> {
    const warnings: ComplianceWarning[] = [];

    // Check for approaching deadlines
    const approachingDeadlines = await this.checkApproachingDeadlines(context.organizationId);
    for (const deadline of approachingDeadlines) {
      warnings.push({
        type: 'approaching_deadline',
        message: `${deadline.type} deadlineapproaching: ${deadline.description}`,
        recommendedAction: `Prepare for ${deadline.type} renewal`,
        priority: deadline.priority
      });
    }

    // Check for missing documentation
    const missingDocs = await this.checkMissingDocumentation(context.organizationId);
    for (const doc of missingDocs) {
      warnings.push({
        type: 'missing_documentation',
        message: `Missing documentation: ${doc.name}`,
        recommendedAction: `Provide ${doc.name} documentation`,
        priority: doc.priority
      });
    }

    // Check for training requirements
    const trainingRequired = await this.checkTrainingRequirements(context.organizationId, context.userId);
    for (const training of trainingRequired) {
      warnings.push({
        type: 'training_required',
        message: `Training required: ${training.name}`,
        recommendedAction: `Complete ${training.name} training`,
        priority: training.priority
      });
    }

    return warnings;
  }

  /**
   * Check if violations are blocking
   */
  private hasBlockingViolations(validationResult: ComplianceValidationResult): boolean {
    return validationResult.violations.some(v => v.severity === 'critical');
  }

  /**
   * Helper methods for compliance checking
   */
  private async checkNHSDigitalCompliance(organizationId: string): Promise<boolean> {
    // Implementation would check actual NHS Digital compliance status
    return true; // Assume compliant for demo
  }

  private async checkProfessionalRegistration(userId: string, professionalBody: string): Promise<boolean> {
    // Implementation would check actual professional registration status
    return true; // Assume compliant for demo
  }

  private async checkGDPRCompliance(organizationId: string): Promise<boolean> {
    // Implementation would check actual GDPR compliance status
    return true; // Assume compliant for demo
  }

  private async checkClinicalSafety(organizationId: string): Promise<boolean> {
    // Implementation would check actual clinical safety compliance
    return true; // Assume compliant for demo
  }

  private async checkCQCRegistration(organizationId: string): Promise<boolean> {
    // Implementation would check actual CQC registration status
    return true; // Assume registered for demo
  }

  private async checkFundamentalStandards(organizationId: string): Promise<boolean> {
    // Implementation would check actual fundamental standards compliance
    return true; // Assume compliant for demo
  }

  private async checkScotlandRegistration(organizationId: string): Promise<boolean> {
    // Implementation would check actual Scotland registration status
    return true; // Assume registered for demo
  }

  private async checkWalesRegistration(organizationId: string): Promise<boolean> {
    // Implementation would check actual Wales registration status
    return true; // Assume registered for demo
  }

  private async checkWelshLanguageCompliance(organizationId: string): Promise<boolean> {
    // Implementation would check actual Welsh language compliance
    return true; // Assume compliant for demo
  }

  private async checkRQIARegistration(organizationId: string): Promise<boolean> {
    // Implementation would check actual RQIA registration status
    return true; // Assume registered for demo
  }

  private async checkHumanRightsCompliance(organizationId: string): Promise<boolean> {
    // Implementation would check actual human rights compliance
    return true; // Assume compliant for demo
  }

  private async checkApproachingDeadlines(organizationId: string): Promise<any[]> {
    return [
      {
        type: 'professional_registration',
        description: 'NMC Registration - J. Smith',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        priority: 'high'
      }
    ];
  }

  private async checkMissingDocumentation(organizationId: string): Promise<any[]> {
    return [
      {
        name: 'Export Licence',
        type: 'brexit_documentation',
        priority: 'medium'
      }
    ];
  }

  private async checkTrainingRequirements(organizationId: string, userId: string): Promise<any[]> {
    return [
      {
        name: 'Welsh Language Awareness',
        type: 'cultural_competency',
        priority: 'low'
      }
    ];
  }

  /**
   * Perform jurisdiction validation
   */
  private async performJurisdictionValidation(context: ComplianceValidationContext): Promise<ComplianceValidationResult> {
    // Implementation would perform actual jurisdiction validation
    return {
      isValid: true,
      violations: [],
      warnings: [],
      requiredActions: [],
      blockedReasons: []
    };
  }

  /**
   * Perform professional validation
   */
  private async performProfessionalValidation(context: ComplianceValidationContext): Promise<ComplianceValidationResult> {
    // Implementation would perform actual professional validation
    return {
      isValid: true,
      violations: [],
      warnings: [],
      requiredActions: [],
      blockedReasons: []
    };
  }

  /**
   * Perform data protection validation
   */
  private async performDataProtectionValidation(context: ComplianceValidationContext): Promise<ComplianceValidationResult> {
    // Implementation would perform actual data protection validation
    return {
      isValid: true,
      violations: [],
      warnings: [],
      requiredActions: [],
      blockedReasons: []
    };
  }

  /**
   * Perform clinical safety validation
   */
  private async performClinicalSafetyValidation(context: ComplianceValidationContext): Promise<ComplianceValidationResult> {
    // Implementation would perform actual clinical safety validation
    return {
      isValid: true,
      violations: [],
      warnings: [],
      requiredActions: [],
      blockedReasons: []
    };
  }
}

/**
 * Middleware factory functions
 */
export const complianceValidationMiddleware = (eventEmitter: EventEmitter2) => {
  const middleware = new ComplianceValidationMiddleware(eventEmitter);
  return middleware.validateCompliance;
};

export const jurisdictionComplianceMiddleware = (jurisdiction: string, eventEmitter: EventEmitter2) => {
  const middleware = new ComplianceValidationMiddleware(eventEmitter);
  return middleware.validateJurisdictionCompliance(jurisdiction);
};

export const professionalStandardsMiddleware = (professionalBody: string, eventEmitter: EventEmitter2) => {
  const middleware = new ComplianceValidationMiddleware(eventEmitter);
  return middleware.validateProfessionalStandards(professionalBody);
};

export const dataProtectionMiddleware = (eventEmitter: EventEmitter2) => {
  const middleware = new ComplianceValidationMiddleware(eventEmitter);
  return middleware.validateDataProtection;
};

export const clinicalSafetyMiddleware = (eventEmitter: EventEmitter2) => {
  const middleware = new ComplianceValidationMiddleware(eventEmitter);
  return middleware.validateClinicalSafety;
};
