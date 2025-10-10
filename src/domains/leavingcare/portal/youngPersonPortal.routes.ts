/**
 * Young Person Portal Routes
 * 
 * LIMITED SELF-SERVICE PORTAL FOR 16+ CARE LEAVERS
 * 
 * AUTHENTICATION:
 * - Requires JWT token with childId
 * - Age verification middleware (16+)
 * - Own data access only
 * 
 * ENDPOINTS:
 * - GET /portal/dashboard - Overview
 * - GET /portal/finances - Financial information
 * - GET /portal/life-skills - Life skills progress
 * - PATCH /portal/life-skills/:id - Update skill progress
 * - GET /portal/education - Education plan
 * - GET /portal/accommodation - Accommodation plan
 * - GET /portal/pathway-plan - Pathway plan summary
 * - GET /portal/personal-advisor - PA contact details
 * - POST /portal/requests - Submit request to PA
 */

import { Router } from 'express';
import { YoungPersonPortalController } from './YoungPersonPortalController';
import { requireLeavingCareAge } from '../../../middleware/age-gated.middleware';
import { authenticateYoungPerson } from '../../../middleware/auth.middleware';
import { validateRequest } from '../../../middleware/validation.middleware';
import { body, param } from 'express-validator';

const router = Router();
const controller = new YoungPersonPortalController();

/**
 * ALL ROUTES REQUIRE:
 * 1. Authentication (JWT with childId)
 * 2. Age verification (16+)
 */
router.use(authenticateYoungPerson);
router.use(requireLeavingCareAge);

/**
 * @route   GET /api/v1/portal/dashboard
 * @desc    Get portal dashboard overview
 * @access  Young Person (16+, own data only)
 */
router.get('/dashboard', controller.getDashboard);

/**
 * @route   GET /api/v1/portal/finances
 * @desc    Get finances overview (grants, allowances, savings)
 * @access  Young Person (16+, own data only)
 */
router.get('/finances', controller.getMyFinances);

/**
 * @route   GET /api/v1/portal/life-skills
 * @desc    Get life skills progress
 * @access  Young Person (16+, own data only)
 */
router.get('/life-skills', controller.getMyLifeSkills);

/**
 * @route   PATCH /api/v1/portal/life-skills/:skillId
 * @desc    Update life skills progress
 * @access  Young Person (16+, own data only, WRITE ACCESS)
 */
router.patch(
  '/life-skills/:skillId',
  [
    param('skillId').isUUID().withMessage('Invalid skill ID'),
    body('completed').isBoolean().withMessage('Completed must be boolean'),
    body('notes').optional().isString().withMessage('Notes must be string')
  ],
  validateRequest,
  controller.updateLifeSkillProgress
);

/**
 * @route   GET /api/v1/portal/education
 * @desc    Get education plan (PEP, courses, qualifications)
 * @access  Young Person (16+, own data only)
 */
router.get('/education', controller.getMyEducation);

/**
 * @route   GET /api/v1/portal/accommodation
 * @desc    Get accommodation plan (housing, tenancy readiness)
 * @access  Young Person (16+, own data only)
 */
router.get('/accommodation', controller.getMyAccommodation);

/**
 * @route   GET /api/v1/portal/pathway-plan
 * @desc    Get pathway plan summary
 * @access  Young Person (16+, own data only)
 */
router.get('/pathway-plan', controller.getMyPathwayPlan);

/**
 * @route   GET /api/v1/portal/personal-advisor
 * @desc    Get personal advisor contact details
 * @access  Young Person (16+, own data only)
 */
router.get('/personal-advisor', controller.getMyPersonalAdvisor);

/**
 * @route   POST /api/v1/portal/requests
 * @desc    Submit request to personal advisor
 * @access  Young Person (16+, own data only, WRITE ACCESS)
 */
router.post(
  '/requests',
  [
    body('subject').notEmpty().withMessage('Subject is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('requestType')
      .isIn(['general', 'accommodation', 'finances', 'education', 'urgent'])
      .withMessage('Invalid request type')
  ],
  validateRequest,
  controller.submitRequest
);

export default router;
