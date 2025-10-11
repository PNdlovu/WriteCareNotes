/**
 * Young Person Portal Controller
 * 
 * LIMITED SELF-SERVICE PORTAL FOR 16+ CARE LEAVERS
 * 
 * ACCESSRESTRICTIONS:
 * - Must be 16+ years old
 * - Can only access own data
 * - Read-only for most data (managed by staff)
 * - Limited write access for specific features
 * 
 * FEATURES:
 * - My Finances (grants, allowances, budgeting)
 * - My Life Skills (independence preparation)
 * - My Education (PEP, courses, qualifications)
 * - My Accommodation (housing planning)
 * 
 * COMPLIANCE:
 * - Children (Leaving Care) Act 2000
 * - Care Leavers (England) Regulations 2010
 * - Data Protection Act 2018 (age 16+ data rights)
 */

import { Request, Response, NextFunction } from 'express';
import { YoungPersonPortalService } from './YoungPersonPortalService';
import { AppError } from '../../../middleware/errorBoundary';
import { logger } from '../../../utils/logger';

// Extend Express Request type to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    childId: string;
    [key: string]: any;
  };
}

export class YoungPersonPortalController {
  privateportalService: YoungPersonPortalService;

  const ructor() {
    this.portalService = new YoungPersonPortalService();
  }

  /**
   * Get portal dashboard overview
   * 16+ only, own data only
   */
  getDashboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const youngPersonId = req.user?.childId; // From JWT token
      
      if (!youngPersonId) {
        throw new AppError('Unauthorized: No child ID in token', 401);
      }

      // Verify age 16+
      await this.verifyLeavingCareAge(youngPersonId);

      const dashboard = await this.portalService.getDashboard(youngPersonId);

      res.status(200).json({
        status: 'success',
        data: dashboard
      });

      logger.info(`Young person portal accessed by child ${youngPersonId}`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get finances overview
   * Leaving care grants, allowances, savings
   */
  getMyFinances = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const youngPersonId = req.user?.childId;
      
      if (!youngPersonId) {
        throw new AppError('Unauthorized: No child ID in token', 401);
      }

      await this.verifyLeavingCareAge(youngPersonId);

      const finances = await this.portalService.getFinances(youngPersonId);

      res.status(200).json({
        status: 'success',
        data: finances
      });

      logger.info(`Finances accessed by young person ${youngPersonId}`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get life skills progress
   * Cooking, budgeting, job search, independent living
   */
  getMyLifeSkills = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const youngPersonId = req.user?.childId;
      
      if (!youngPersonId) {
        throw new AppError('Unauthorized: No child ID in token', 401);
      }

      await this.verifyLeavingCareAge(youngPersonId);

      const lifeSkills = await this.portalService.getLifeSkills(youngPersonId);

      res.status(200).json({
        status: 'success',
        data: lifeSkills
      });

      logger.info(`Life skills accessed by young person ${youngPersonId}`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update life skills progress
   * WRITE ACCESS - Young person can update their own progress
   */
  updateLifeSkillProgress = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const youngPersonId = req.user?.childId;
      const { skillId, completed, notes } = req.body;
      
      if (!youngPersonId) {
        throw new AppError('Unauthorized: No child ID in token', 401);
      }

      await this.verifyLeavingCareAge(youngPersonId);

      const updatedSkill = await this.portalService.updateLifeSkillProgress(
        youngPersonId,
        skillId,
        { completed, notes }
      );

      res.status(200).json({
        status: 'success',
        data: updatedSkill,
        message: 'Life skill progress updated successfully'
      });

      logger.info(`Life skill ${skillId} updated by young person ${youngPersonId}`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get education plan
   * PEP goals, courses, qualifications
   */
  getMyEducation = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const youngPersonId = req.user?.childId;
      
      if (!youngPersonId) {
        throw new AppError('Unauthorized: No child ID in token', 401);
      }

      await this.verifyLeavingCareAge(youngPersonId);

      const education = await this.portalService.getEducation(youngPersonId);

      res.status(200).json({
        status: 'success',
        data: education
      });

      logger.info(`Education plan accessed by young person ${youngPersonId}`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get accommodation plan
   * Housing options, viewing appointments, tenancy readiness
   */
  getMyAccommodation = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const youngPersonId = req.user?.childId;
      
      if (!youngPersonId) {
        throw new AppError('Unauthorized: No child ID in token', 401);
      }

      await this.verifyLeavingCareAge(youngPersonId);

      const accommodation = await this.portalService.getAccommodation(youngPersonId);

      res.status(200).json({
        status: 'success',
        data: accommodation
      });

      logger.info(`Accommodation plan accessed by young person ${youngPersonId}`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get pathway plan summary
   * READ-ONLY - Managed by personal advisor
   */
  getMyPathwayPlan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const youngPersonId = req.user?.childId;
      
      if (!youngPersonId) {
        throw new AppError('Unauthorized: No child ID in token', 401);
      }

      await this.verifyLeavingCareAge(youngPersonId);

      const pathwayPlan = await this.portalService.getPathwayPlan(youngPersonId);

      res.status(200).json({
        status: 'success',
        data: pathwayPlan
      });

      logger.info(`Pathway plan accessed by young person ${youngPersonId}`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get personal advisor contact
   */
  getMyPersonalAdvisor = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const youngPersonId = req.user?.childId;
      
      if (!youngPersonId) {
        throw new AppError('Unauthorized: No child ID in token', 401);
      }

      await this.verifyLeavingCareAge(youngPersonId);

      const advisor = await this.portalService.getPersonalAdvisor(youngPersonId);

      res.status(200).json({
        status: 'success',
        data: advisor
      });

      logger.info(`Personal advisor details accessed by young person ${youngPersonId}`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Submit feedback/request to personal advisor
   * WRITE ACCESS - Young person can communicate
   */
  submitRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const youngPersonId = req.user?.childId;
      const { subject, message, requestType } = req.body;
      
      if (!youngPersonId) {
        throw new AppError('Unauthorized: No child ID in token', 401);
      }

      await this.verifyLeavingCareAge(youngPersonId);

      const request = await this.portalService.submitRequest(
        youngPersonId,
        { subject, message, requestType }
      );

      res.status(201).json({
        status: 'success',
        data: request,
        message: 'Request submitted successfully to your personal advisor'
      });

      logger.info(`Request submitted by young person ${youngPersonId}: ${subject}`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Helper: Verify child is 16+ (leaving care age)
   */
  private async verifyLeavingCareAge(childId: string): Promise<void> {
    const isEligible = await this.portalService.verifyLeavingCareAge(childId);
    
    if (!isEligible) {
      throw new AppError(
        'Access denied: Young Person Portal is available from age 16',
        403
      );
    }
  }
}
