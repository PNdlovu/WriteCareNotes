import { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { HealthMonitoringService } from '../../services/health/HealthMonitoringService';
import { AssessmentType, AssessmentStatus } from '../../entities/assessment/ResidentAssessment';

/**
 * Controller #11: Health Monitoring
 * 
 * 13 endpoints for comprehensive health tracking
 */
export class HealthMonitoringController {
  const ructor(private healthService: HealthMonitoringService) {}

  /**
   * POST /health/vital-signs
   * Record vital signs
   */
  async recordVitalSigns(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const organizationId = req.user?.organizationId || req.body.organizationId;
      const record = await this.healthService.recordVitalSigns({
        ...req.body,
        organizationId,
      });

      res.status(201).json({
        success: true,
        data: record,
        message: 'Vital signs recorded successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to record vital signs',
      });
    }
  }

  /**
   * POST /health/weight
   * Record weight
   */
  async recordWeight(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const organizationId = req.user?.organizationId || req.body.organizationId;
      const record = await this.healthService.recordWeight({
        ...req.body,
        organizationId,
      });

      res.status(201).json({
        success: true,
        data: record,
        message: 'Weight recorded successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to record weight',
      });
    }
  }

  /**
   * POST /health/assessments
   * Create health assessment
   */
  async createAssessment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const organizationId = req.user?.organizationId || req.body.organizationId;
      const assessment = await this.healthService.createAssessment({
        ...req.body,
        organizationId,
      });

      res.status(201).json({
        success: true,
        data: assessment,
        message: 'Assessment created successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create assessment',
      });
    }
  }

  /**
   * GET /health/assessments/:id
   * Get assessment by ID
   */
  async getAssessmentById(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || req.query.organizationId as string;
      const assessment = await this.healthService.getAssessmentById(req.params.id, organizationId);

      if (!assessment) {
        res.status(404).json({
          success: false,
          error: 'Assessment not found',
        });
        return;
      }

      res.json({
        success: true,
        data: assessment,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve assessment',
      });
    }
  }

  /**
   * GET /health/assessments
   * List assessments with filtering
   */
  async getAssessments(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || req.query.organizationId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: any = {};
      if (req.query.residentId) filters.residentId = req.query.residentId;
      if (req.query.assessmentType) filters.assessmentType = req.query.assessmentType;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

      const result = await this.healthService.getAssessments(organizationId, filters, page, limit);

      res.json({
        success: true,
        data: result.assessments,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve assessments',
      });
    }
  }

  /**
   * PUT /health/assessments/:id
   * Update assessment
   */
  async updateAssessment(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || req.body.organizationId;
      const assessment = await this.healthService.updateAssessment(req.params.id, organizationId, req.body);

      res.json({
        success: true,
        data: assessment,
        message: 'Assessment updated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update assessment',
      });
    }
  }

  /**
   * POST /health/assessments/:id/complete
   * Complete assessment
   */
  async completeAssessment(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || req.body.organizationId;
      const assessment = await this.healthService.completeAssessment(req.params.id, organizationId);

      res.json({
        success: true,
        data: assessment,
        message: 'Assessment completed successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to complete assessment',
      });
    }
  }

  /**
   * GET /health/assessments/overdue
   * Get overdue assessments
   */
  async getOverdueAssessments(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || req.query.organizationId as string;
      const assessments = await this.healthService.getOverdueAssessments(organizationId);

      res.json({
        success: true,
        data: assessments,
        count: assessments.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve overdue assessments',
      });
    }
  }

  /**
   * GET /health/vital-signs/trends/:residentId
   * Get vital signs trend
   */
  async getVitalSignsTrend(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || req.query.organizationId as string;
      const { residentId } = req.params;
      const vitalType = req.query.vitalType as string || 'heart_rate';
      const days = parseInt(req.query.days as string) || 7;

      const trend = await this.healthService.getVitalSignsTrend(residentId, organizationId, vitalType, days);

      res.json({
        success: true,
        data: trend,
        metadata: {
          residentId,
          vitalType,
          days,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve vital signs trend',
      });
    }
  }

  /**
   * GET /health/weight/trends/:residentId
   * Get weight trend
   */
  async getWeightTrend(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || req.query.organizationId as string;
      const { residentId } = req.params;
      const months = parseInt(req.query.months as string) || 6;

      const trend = await this.healthService.getWeightTrend(residentId, organizationId, months);

      res.json({
        success: true,
        data: trend,
        metadata: {
          residentId,
          months,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve weight trend',
      });
    }
  }

  /**
   * POST /health/early-warning-score
   * Calculate early warning score
   */
  async calculateEarlyWarningScore(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const score = this.healthService.calculateEarlyWarningScore(req.body);

      let interpretation = 'Normal';
      let recommendation = 'Continue routine monitoring';

      if (score >= 1 && score <= 4) {
        interpretation = 'Low-medium clinical risk';
        recommendation = 'Increase frequency of monitoring';
      } else if (score >= 5 && score <= 6) {
        interpretation = 'Medium clinical risk';
        recommendation = 'Urgent review by registered nurse';
      } else if (score >= 7) {
        interpretation = 'High clinical risk';
        recommendation = 'Emergency assessment required';
      }

      res.json({
        success: true,
        data: {
          score,
          interpretation,
          recommendation,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to calculate early warning score',
      });
    }
  }

  /**
   * GET /health/statistics
   * Get health monitoring statistics
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || req.query.organizationId as string;
      const statistics = await this.healthService.getStatistics(organizationId);

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve statistics',
      });
    }
  }
}

/**
 * Validation rules
 */

export const recordVitalSignsValidation = [
  body('residentId').notEmpty().withMessage('Resident ID is required'),
  body('bloodPressure.systolic').isInt({ min: 50, max: 250 }).withMessage('Invalid systolic blood pressure'),
  body('bloodPressure.diastolic').isInt({ min: 30, max: 150 }).withMessage('Invalid diastolic blood pressure'),
  body('heartRate').isInt({ min: 30, max: 200 }).withMessage('Heart rate must be between 30 and 200'),
  body('temperature').isFloat({ min: 32, max: 43 }).withMessage('Temperature must be between 32°C and 43°C'),
  body('oxygenSaturation').isInt({ min: 50, max: 100 }).withMessage('Oxygen saturation must be between 50% and 100%'),
  body('respiratoryRate').isInt({ min: 5, max: 60 }).withMessage('Respiratory rate must be between 5 and 60'),
  body('recordedBy').notEmpty().withMessage('Recorded by is required'),
];

export const recordWeightValidation = [
  body('residentId').notEmpty().withMessage('Resident ID is required'),
  body('weight').isFloat({ min: 20, max: 300 }).withMessage('Weight must be between 20kg and 300kg'),
  body('height').optional().isFloat({ min: 50, max: 250 }).withMessage('Height must be between 50cm and 250cm'),
  body('recordedBy').notEmpty().withMessage('Recorded by is required'),
];

export const createAssessmentValidation = [
  body('residentId').notEmpty().withMessage('Resident ID is required'),
  body('assessmentType').isIn(Object.values(AssessmentType)).withMessage('Invalid assessment type'),
  body('assessorId').notEmpty().withMessage('Assessor ID is required'),
  body('scheduledDate').isISO8601().withMessage('Invalid scheduled date'),
  body('assessmentData').isObject().withMessage('Assessment data must be an object'),
  body('assessmentData.scores').isObject().withMessage('Scores must be an object'),
  body('assessmentData.observations').isArray().withMessage('Observations must be an array'),
  body('followUpPlan').isObject().withMessage('Follow-up plan must be an object'),
];

export const earlyWarningScoreValidation = [
  body('bloodPressure.systolic').isInt().withMessage('Systolic BP required'),
  body('bloodPressure.diastolic').isInt().withMessage('Diastolic BP required'),
  body('heartRate').isInt().withMessage('Heart rate required'),
  body('temperature').isFloat().withMessage('Temperature required'),
  body('oxygenSaturation').isInt().withMessage('Oxygen saturation required'),
  body('respiratoryRate').isInt().withMessage('Respiratory rate required'),
];
