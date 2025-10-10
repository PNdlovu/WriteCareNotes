/**
 * Age-Gated Access Middleware
 * 
 * CONTROLS ACCESS BASED ON CHILD'S AGE
 * 
 * USAGE:
 * - requireLeavingCareAge: Requires 16+ for young person portal
 * - requireAdultAge: Requires 18+ for adult services
 * - ageRange: Custom age range verification
 * 
 * SECURITY:
 * - Verifies age from database (not JWT token)
 * - Prevents token manipulation
 * - Audit logs age verification attempts
 */

import { Request, Response, NextFunction } from 'express';
import { Child } from '../../domains/children/entities/Child';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';
import { AppDataSource } from '../config/database';

/**
 * Middleware: Require child to be 16+ (leaving care age)
 * 
 * USED FOR:
 * - Young person portal access
 * - Leaving care self-service features
 * - Limited write access to own data
 */
export const requireLeavingCareAge = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const childId = req.user?.childId;

    if (!childId) {
      throw new AppError('Unauthorized: No child ID in token', 401);
    }

    // Verify age from database (prevent token manipulation)
    const childRepository = AppDataSource.getRepository(Child);
    const child = await childRepository.findOne({
      where: { id: childId }
    });

    if (!child) {
      throw new AppError('Child not found', 404);
    }

    // Check age >= 16
    if (child.age < 16) {
      logger.warn(`Age verification failed for child ${childId}: Age ${child.age} (required 16+)`);
      
      throw new AppError(
        'Access denied: Young Person Portal is available from age 16. Please contact your social worker.',
        403
      );
    }

    // Log successful age verification
    logger.info(`Age verification passed for child ${childId}: Age ${child.age}`);

    // Attach child data to request for use in controllers
    req.child = child;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Require child to be 18+ (adult age)
 * 
 * USED FOR:
 * - Adult care services transition
 * - Full data access rights
 * - Independent decision making
 */
export const requireAdultAge = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const childId = req.user?.childId;

    if (!childId) {
      throw new AppError('Unauthorized: No child ID in token', 401);
    }

    const childRepository = AppDataSource.getRepository(Child);
    const child = await childRepository.findOne({
      where: { id: childId }
    });

    if (!child) {
      throw new AppError('Child not found', 404);
    }

    if (child.age < 18) {
      logger.warn(`Age verification failed for child ${childId}: Age ${child.age} (required 18+)`);
      
      throw new AppError(
        'Access denied: This service is available from age 18.',
        403
      );
    }

    logger.info(`Age verification passed for child ${childId}: Age ${child.age}`);
    req.child = child;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Require child to be within age range
 * 
 * USAGE:
 * router.use(requireAgeRange(13, 17)); // Teenagers only
 * 
 * USED FOR:
 * - Age-specific services
 * - Developmental stage services
 * - Custom age restrictions
 */
export const requireAgeRange = (minAge: number, maxAge: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const childId = req.user?.childId;

      if (!childId) {
        throw new AppError('Unauthorized: No child ID in token', 401);
      }

      const childRepository = AppDataSource.getRepository(Child);
      const child = await childRepository.findOne({
        where: { id: childId }
      });

      if (!child) {
        throw new AppError('Child not found', 404);
      }

      if (child.age < minAge || child.age > maxAge) {
        logger.warn(
          `Age verification failed for child ${childId}: Age ${child.age} (required ${minAge}-${maxAge})`
        );
        
        throw new AppError(
          `Access denied: This service is available for ages ${minAge}-${maxAge}.`,
          403
        );
      }

      logger.info(`Age verification passed for child ${childId}: Age ${child.age}`);
      req.child = child;

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware: Block child access (staff only)
 * 
 * USED FOR:
 * - 0-15 year old profiles (no child access)
 * - Staff-only management endpoints
 * - Sensitive safeguarding data
 */
export const staffOnlyAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is staff (not a child)
    const userRole = req.user?.role;

    if (!userRole || userRole === 'young_person') {
      throw new AppError(
        'Access denied: This endpoint is for staff use only.',
        403
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Calculate child's age from date of birth
 */
export const calculateAge = (dateOfBirth: Date): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};
