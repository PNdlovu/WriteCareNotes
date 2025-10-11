/**
 * @fileoverview Resident API routes for WriteCareNotes healthcare system
 * @module ResidentRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Provides RESTful API endpoints for resident management including
 * CRUD operations, admission/discharge workflows, transfers, and search capabilities
 * with comprehensive validation, authentication, and audit logging.
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 * 
 * @security
 * - JWT authentication required for all endpoints
 * - Role-based access control with healthcare context validation
 * - Input validation and sanitization for all requests
 * - Comprehensive audit logging for all operations
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ResidentService, Resident, AdmissionData, DischargeData, TransferData } from '../../services/resident/ResidentService';
import { authMiddleware } from '../../middleware/auth.middleware';
import { healthcareContextMiddleware } from '../../middleware/healthcare-context.middleware';
import { rateLimitMiddleware } from '../../middleware/rate-limit.middleware';
import { auditMiddleware } from '../../middleware/audit.middleware';
import { createLogger } from '../../utils/logger';

const router = Router();
const logger = createLogger('ResidentRoutes');
const residentService = new ResidentService();

// Apply middleware to all routes
router.use(authMiddleware);
router.use(healthcareContextMiddleware('resident-management'));
router.use(rateLimitMiddleware('resident-service'));
router.use(auditMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Resident:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - nhsNumber
 *         - dateOfBirth
 *         - gender
 *         - careLevel
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique resident identifier
 *         firstName:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           description: Resident's first name
 *         lastName:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           description: Resident's last name
 *         nhsNumber:
 *           type: string
 *           pattern: '^[0-9]{10}$'
 *           description: NHS number (10 digits)
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: Date of birth
 *         gender:
 *           type: string
 *           enum: [male, female, other, prefer-not-to-say]
 *           description: Gender identity
 *         careLevel:
 *           type: string
 *           enum: [residential, nursing, dementia, mental-health]
 *           description: Level of care required
 *         roomNumber:
 *           type: string
 *           description: Current room number
 *         status:
 *           type: string
 *           enum: [admitted, discharged, transferred, deceased]
 *           description: Current resident status
 *         medicalConditions:
 *           type: array
 *           items:
 *             type: string
 *           description: List of medical conditions
 *         allergies:
 *           type: array
 *           items:
 *             type: string
 *           description: List of known allergies
 */

/**
 * @swagger
 * /api/v1/residents:
 *   post:
 *     summary: Create a new resident
 *     description: Creates a new resident record with comprehensive healthcare information
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Resident'
 *     responses:
 *       201:
 *         description: Resident created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Resident'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Resident with NHS number already exists
 */
router.post('/',
  [
    body('firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    body('nhsNumber')
      .matches(/^[0-9]{10}$/)
      .withMessage('NHS number must be exactly 10 digits'),
    body('dateOfBirth')
      .isISO8601()
      .toDate()
      .withMessage('Date of birth must be a valid date'),
    body('gender')
      .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
      .withMessage('Gender must be one of: male, female, other, prefer-not-to-say'),
    body('careLevel')
      .isIn(['residential', 'nursing', 'dementia', 'mental-health'])
      .withMessage('Care level must be one of: residential, nursing, dementia, mental-health'),
    body('medicalConditions')
      .optional()
      .isArray()
      .withMessage('Medical conditions must be an array'),
    body('allergies')
      .optional()
      .isArray()
      .withMessage('Allergies must be an array'),
    body('emergencyContacts')
      .optional()
      .isArray()
      .withMessage('Emergency contacts must be an array')
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User ID not found in request'
        });
      }

      const residentData = {
        ...req.body,
        status: 'discharged' // New residents start as discharged until admitted
      };

      const resident = await residentService.createResident(residentData, userId);

      res.status(201).json({
        success: true,
        data: resident
      });

    } catch (error) {
      logger.error('Failed to create resident:', error);
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: 'Resident with this NHS number already exists'
        });
      }

      if (error.message.includes('Invalid NHS number')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid NHS number format'
        });
      }

      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/residents/{id}:
 *   get:
 *     summary: Get resident by ID
 *     description: Retrieves a resident's complete information by their unique identifier
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Resident unique identifier
 *     responses:
 *       200:
 *         description: Resident found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Resident'
 *       404:
 *         description: Resident not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Resident ID must be a valid UUID')
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.user?.id;
      const residentId = req.params.id;

      const resident = await residentService.getResidentById(residentId, userId);

      if (!resident) {
        return res.status(404).json({
          success: false,
          error: 'Resident not found'
        });
      }

      res.json({
        success: true,
        data: resident
      });

    } catch (error) {
      logger.error(`Failed to get resident ${req.params.id}:`, error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/residents/{id}:
 *   put:
 *     summary: Update resident
 *     description: Updates a resident's information with comprehensive validation
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Resident unique identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Resident'
 *     responses:
 *       200:
 *         description: Resident updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Resident not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Resident ID must be a valid UUID'),
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    body('nhsNumber')
      .optional()
      .matches(/^[0-9]{10}$/)
      .withMessage('NHS number must be exactly 10 digits'),
    body('careLevel')
      .optional()
      .isIn(['residential', 'nursing', 'dementia', 'mental-health'])
      .withMessage('Care level must be one of: residential, nursing, dementia, mental-health'),
    body('medicalConditions')
      .optional()
      .isArray()
      .withMessage('Medical conditions must be an array'),
    body('allergies')
      .optional()
      .isArray()
      .withMessage('Allergies must be an array')
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.user?.id;
      const residentId = req.params.id;

      const updatedResident = await residentService.updateResident(residentId, req.body, userId);

      res.json({
        success: true,
        data: updatedResident
      });

    } catch (error) {
      logger.error(`Failed to update resident ${req.params.id}:`, error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Resident not found'
        });
      }

      if (error.message.includes('Invalid NHS number')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid NHS number format'
        });
      }

      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/residents:
 *   get:
 *     summary: Search residents
 *     description: Search and filter residents with pagination
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Search by resident name
 *       - in: query
 *         name: nhsNumber
 *         schema:
 *           type: string
 *         description: Search by NHS number
 *       - in: query
 *         name: roomNumber
 *         schema:
 *           type: string
 *         description: Filter by room number
 *       - in: query
 *         name: careLevel
 *         schema:
 *           type: string
 *           enum: [residential, nursing, dementia, mental-health]
 *         description: Filter by care level
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [admitted, discharged, transferred, deceased]
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     residents:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Resident'
 *                     totalCount:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('careLevel')
      .optional()
      .isIn(['residential', 'nursing', 'dementia', 'mental-health'])
      .withMessage('Care level must be one of: residential, nursing, dementia, mental-health'),
    query('status')
      .optional()
      .isIn(['admitted', 'discharged', 'transferred', 'deceased'])
      .withMessage('Status must be one of: admitted, discharged, transferred, deceased')
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.user?.id;
      const searchCriteria = {
        name: req.query.name as string,
        nhsNumber: req.query.nhsNumber as string,
        roomNumber: req.query.roomNumber as string,
        careLevel: req.query.careLevel as string,
        status: req.query.status as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
      };

      const results = await residentService.searchResidents(searchCriteria, userId);

      res.json({
        success: true,
        data: results
      });

    } catch (error) {
      logger.error('Failed to search residents:', error);
      next(error);
    }
  }
);/**
 * @s
wagger
 * /api/v1/residents/{id}/admit:
 *   post:
 *     summary: Admit resident
 *     description: Admit a resident to the care home with comprehensive admission workflow
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Resident unique identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - admissionDate
 *               - careLevel
 *               - roomNumber
 *               - admissionReason
 *               - referralSource
 *               - fundingType
 *             properties:
 *               admissionDate:
 *                 type: string
 *                 format: date-time
 *               careLevel:
 *                 type: string
 *                 enum: [residential, nursing, dementia, mental-health]
 *               roomNumber:
 *                 type: string
 *               admissionReason:
 *                 type: string
 *               referralSource:
 *                 type: string
 *               fundingType:
 *                 type: string
 *                 enum: [private, local-authority, nhs, insurance]
 *     responses:
 *       200:
 *         description: Resident admitted successfully
 *       400:
 *         description: Invalid admission data or resident already admitted
 *       404:
 *         description: Resident not found
 *       409:
 *         description: Room already occupied
 */
router.post('/:id/admit',
  [
    param('id')
      .isUUID()
      .withMessage('Resident ID must be a valid UUID'),
    body('admissionDate')
      .isISO8601()
      .toDate()
      .withMessage('Admission date must be a valid date'),
    body('careLevel')
      .isIn(['residential', 'nursing', 'dementia', 'mental-health'])
      .withMessage('Care level must be one of: residential, nursing, dementia, mental-health'),
    body('roomNumber')
      .trim()
      .isLength({ min: 1, max: 10 })
      .withMessage('Room number must be between 1 and 10 characters'),
    body('admissionReason')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Admission reason must be between 1 and 500 characters'),
    body('referralSource')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Referral source must be between 1 and 100 characters'),
    body('fundingType')
      .isIn(['private', 'local-authority', 'nhs', 'insurance'])
      .withMessage('Funding type must be one of: private, local-authority, nhs, insurance')
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.user?.id;
      const residentId = req.params.id;

      constadmissionData: AdmissionData = {
        ...req.body,
        admittedBy: userId
      };

      await residentService.admitResident(residentId, admissionData);

      res.json({
        success: true,
        message: 'Resident admitted successfully'
      });

    } catch (error) {
      logger.error(`Failed to admit resident ${req.params.id}:`, error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Resident not found'
        });
      }

      if (error.message.includes('already admitted')) {
        return res.status(400).json({
          success: false,
          error: 'Resident is already admitted'
        });
      }

      if (error.message.includes('already occupied')) {
        return res.status(409).json({
          success: false,
          error: 'Room is already occupied'
        });
      }

      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/residents/{id}/discharge:
 *   post:
 *     summary: Discharge resident
 *     description: Discharge a resident from the care home with comprehensive discharge workflow
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Resident unique identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dischargeDate
 *               - dischargeReason
 *               - dischargeDestination
 *               - followUpRequired
 *             properties:
 *               dischargeDate:
 *                 type: string
 *                 format: date-time
 *               dischargeReason:
 *                 type: string
 *               dischargeDestination:
 *                 type: string
 *               followUpRequired:
 *                 type: boolean
 *               followUpDetails:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resident discharged successfully
 *       400:
 *         description: Invalid discharge data or resident not admitted
 *       404:
 *         description: Resident not found
 */
router.post('/:id/discharge',
  [
    param('id')
      .isUUID()
      .withMessage('Resident ID must be a valid UUID'),
    body('dischargeDate')
      .isISO8601()
      .toDate()
      .withMessage('Discharge date must be a valid date'),
    body('dischargeReason')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Discharge reason must be between 1 and 500 characters'),
    body('dischargeDestination')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Discharge destination must be between 1 and 200 characters'),
    body('followUpRequired')
      .isBoolean()
      .withMessage('Follow up required must be a boolean')
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.user?.id;
      const residentId = req.params.id;

      constdischargeData: DischargeData = {
        ...req.body,
        dischargedBy: userId
      };

      await residentService.dischargeResident(residentId, dischargeData);

      res.json({
        success: true,
        message: 'Resident discharged successfully'
      });

    } catch (error) {
      logger.error(`Failed to discharge resident ${req.params.id}:`, error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Resident not found'
        });
      }

      if (error.message.includes('not currently admitted')) {
        return res.status(400).json({
          success: false,
          error: 'Resident is not currently admitted'
        });
      }

      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/residents/{id}/transfer:
 *   post:
 *     summary: Transfer resident
 *     description: Transfer a resident between rooms or care levels
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Resident unique identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transferDate
 *               - fromRoom
 *               - toRoom
 *               - transferReason
 *             properties:
 *               transferDate:
 *                 type: string
 *                 format: date-time
 *               fromRoom:
 *                 type: string
 *               toRoom:
 *                 type: string
 *               transferReason:
 *                 type: string
 *               newCareLevel:
 *                 type: string
 *                 enum: [residential, nursing, dementia, mental-health]
 *     responses:
 *       200:
 *         description: Resident transferred successfully
 *       400:
 *         description: Invalid transfer data
 *       404:
 *         description: Resident not found
 *       409:
 *         description: Destination room already occupied
 */
router.post('/:id/transfer',
  [
    param('id')
      .isUUID()
      .withMessage('Resident ID must be a valid UUID'),
    body('transferDate')
      .isISO8601()
      .toDate()
      .withMessage('Transfer date must be a valid date'),
    body('fromRoom')
      .trim()
      .isLength({ min: 1, max: 10 })
      .withMessage('From room must be between 1 and 10 characters'),
    body('toRoom')
      .trim()
      .isLength({ min: 1, max: 10 })
      .withMessage('To room must be between 1 and 10 characters'),
    body('transferReason')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Transfer reason must be between 1 and 500 characters'),
    body('newCareLevel')
      .optional()
      .isIn(['residential', 'nursing', 'dementia', 'mental-health'])
      .withMessage('New care level must be one of: residential, nursing, dementia, mental-health')
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.user?.id;
      const residentId = req.params.id;

      consttransferData: TransferData = {
        ...req.body,
        transferredBy: userId
      };

      await residentService.transferResident(residentId, transferData);

      res.json({
        success: true,
        message: 'Resident transferred successfully'
      });

    } catch (error) {
      logger.error(`Failed to transfer resident ${req.params.id}:`, error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Resident not found'
        });
      }

      if (error.message.includes('not currently admitted')) {
        return res.status(400).json({
          success: false,
          error: 'Resident is not currently admitted'
        });
      }

      if (error.message.includes('not in the specified from room')) {
        return res.status(400).json({
          success: false,
          error: 'Resident is not in the specified from room'
        });
      }

      if (error.message.includes('already occupied')) {
        return res.status(409).json({
          success: false,
          error: 'Destination room is already occupied'
        });
      }

      next(error);
    }
  }
);

export default router;
