import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { BudgetService } from '../../services/finance/BudgetService';
import { logger } from '../../utils/logger';

const router = Router();
const budgetService = new BudgetService();

/**
 * @fileoverview Budget Management API Routes
 * @module BudgetRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description API routes for budget management including variance tracking,
 * budget vs actual reporting, and financial forecasting capabilities.
 */

// Validation middleware
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Budget Routes

/**
 * @route GET /api/finance/budgets
 * @desc Get all budgets with optional filtering
 * @access Private
 */
router.get('/', [
  query('status').optional().isIn(['draft', 'pending_approval', 'approved', 'active', 'locked', 'archived']),
  query('budgetType').optional().isIn(['annual', 'quarterly', 'monthly', 'project', 'department', 'capital', 'operational']),
  query('financialYear').optional().isString(),
  query('careHomeId').optional().isUUID(),
  query('departmentId').optional().isUUID(),
  query('isActive').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      status: req.query.status as string,
      budgetType: req.query.budgetType as string,
      financialYear: req.query.financialYear as string,
      careHomeId: req.query.careHomeId as string,
      departmentId: req.query.departmentId as string,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    const result = await budgetService.getAllBudgets(filters);
    
    res.json({
      success: true,
      data: result.budgets,
      pagination: result.pagination,
      message: 'Budgets retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrievingbudgets:', error);
    next(error);
  }
});

/**
 * @route GET /api/finance/budgets/:id
 * @desc Get budget by ID
 * @access Private
 */
router.get('/:id', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const budget = await budgetService.getBudgetById(req.params.id);
    
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    res.json({
      success: true,
      data: budget,
      message: 'Budget retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrievingbudget:', error);
    next(error);
  }
});

/**
 * @route POST /api/finance/budgets
 * @desc Create new budget
 * @access Private
 */
router.post('/', [
  body('budgetName').isString().isLength({ min: 1, max: 255 }),
  body('budgetCode').optional().isString().isLength({ min: 1, max: 50 }),
  body('budgetType').isIn(['annual', 'quarterly', 'monthly', 'project', 'department', 'capital', 'operational']),
  body('description').optional().isString(),
  body('financialYear').isString().isLength({ min: 4, max: 10 }),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('currency').optional().isString().isLength({ min: 3, max: 3 }),
  body('totalBudgetedRevenue').optional().isDecimal(),
  body('totalBudgetedExpenses').optional().isDecimal(),
  body('careHomeId').optional().isUUID(),
  body('departmentId').optional().isUUID(),
  body('budgetedOccupancy').optional().isInt({ min: 0 }),
  body('budgetedRevenuePerBed').optional().isDecimal(),
  body('budgetedCostPerResident').optional().isDecimal(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const budgetData = {
      ...req.body,
      createdBy: req.user?.id
    };

    const budget = await budgetService.createBudget(budgetData);
    
    res.status(201).json({
      success: true,
      data: budget,
      message: 'Budget created successfully'
    });
  } catch (error) {
    logger.error('Error creatingbudget:', error);
    next(error);
  }
});

/**
 * @route PUT /api/finance/budgets/:id
 * @desc Update budget
 * @access Private
 */
router.put('/:id', [
  param('id').isUUID(),
  body('budgetName').optional().isString().isLength({ min: 1, max: 255 }),
  body('description').optional().isString(),
  body('status').optional().isIn(['draft', 'pending_approval', 'approved', 'active', 'locked', 'archived']),
  body('totalBudgetedRevenue').optional().isDecimal(),
  body('totalBudgetedExpenses').optional().isDecimal(),
  body('actualRevenue').optional().isDecimal(),
  body('actualExpenses').optional().isDecimal(),
  body('budgetedOccupancy').optional().isInt({ min: 0 }),
  body('actualOccupancy').optional().isInt({ min: 0 }),
  body('budgetedRevenuePerBed').optional().isDecimal(),
  body('budgetedCostPerResident').optional().isDecimal(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user?.id
    };

    const budget = await budgetService.updateBudget(req.params.id, updateData);
    
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    res.json({
      success: true,
      data: budget,
      message: 'Budget updated successfully'
    });
  } catch (error) {
    logger.error('Error updatingbudget:', error);
    next(error);
  }
});

/**
 * @route DELETE /api/finance/budgets/:id
 * @desc Delete budget
 * @access Private
 */
router.delete('/:id', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await budgetService.deleteBudget(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    logger.error('Error deletingbudget:', error);
    next(error);
  }
});

// Budget Actions

/**
 * @route POST /api/finance/budgets/:id/approve
 * @desc Approve budget
 * @access Private
 */
router.post('/:id/approve', [
  param('id').isUUID(),
  body('notes').optional().isString(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const budget = await budgetService.approveBudget(
      req.params.id,
      req.user?.id,
      req.body.notes
    );
    
    res.json({
      success: true,
      data: budget,
      message: 'Budget approved successfully'
    });
  } catch (error) {
    logger.error('Error approvingbudget:', error);
    next(error);
  }
});

/**
 * @route POST /api/finance/budgets/:id/activate
 * @desc Activate budget
 * @access Private
 */
router.post('/:id/activate', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const budget = await budgetService.activateBudget(req.params.id);
    
    res.json({
      success: true,
      data: budget,
      message: 'Budget activated successfully'
    });
  } catch (error) {
    logger.error('Error activatingbudget:', error);
    next(error);
  }
});

/**
 * @route POST /api/finance/budgets/:id/lock
 * @desc Lock budget
 * @access Private
 */
router.post('/:id/lock', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const budget = await budgetService.lockBudget(req.params.id, req.user?.id);
    
    res.json({
      success: true,
      data: budget,
      message: 'Budget locked successfully'
    });
  } catch (error) {
    logger.error('Error lockingbudget:', error);
    next(error);
  }
});

/**
 * @route POST /api/finance/budgets/:id/archive
 * @desc Archive budget
 * @access Private
 */
router.post('/:id/archive', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const budget = await budgetService.archiveBudget(req.params.id, req.user?.id);
    
    res.json({
      success: true,
      data: budget,
      message: 'Budget archived successfully'
    });
  } catch (error) {
    logger.error('Error archivingbudget:', error);
    next(error);
  }
});

// Budget Reporting Routes

/**
 * @route GET /api/finance/budgets/:id/performance
 * @desc Get budget performance summary
 * @access Private
 */
router.get('/:id/performance', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const performance = await budgetService.getBudgetPerformance(req.params.id);
    
    res.json({
      success: true,
      data: performance,
      message: 'Budget performance retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving budgetperformance:', error);
    next(error);
  }
});

/**
 * @route GET /api/finance/budgets/:id/variance-analysis
 * @desc Get budget variance analysis
 * @access Private
 */
router.get('/:id/variance-analysis', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const varianceAnalysis = await budgetService.getBudgetVarianceAnalysis(req.params.id);
    
    res.json({
      success: true,
      data: varianceAnalysis,
      message: 'Budget variance analysis retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving budget varianceanalysis:', error);
    next(error);
  }
});

/**
 * @route GET /api/finance/budgets/:id/utilization-metrics
 * @desc Get budget utilization metrics
 * @access Private
 */
router.get('/:id/utilization-metrics', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const utilizationMetrics = await budgetService.getBudgetUtilizationMetrics(req.params.id);
    
    res.json({
      success: true,
      data: utilizationMetrics,
      message: 'Budget utilization metrics retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving budget utilizationmetrics:', error);
    next(error);
  }
});

/**
 * @route GET /api/finance/budgets/:id/forecasting
 * @desc Get budget forecasting data
 * @access Private
 */
router.get('/:id/forecasting', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forecastingData = await budgetService.getBudgetForecastingData(req.params.id);
    
    res.json({
      success: true,
      data: forecastingData,
      message: 'Budget forecasting data retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving budget forecastingdata:', error);
    next(error);
  }
});

/**
 * @route GET /api/finance/budgets/summary
 * @desc Get budgets summary
 * @access Private
 */
router.get('/summary', [
  query('financialYear').optional().isString(),
  query('careHomeId').optional().isUUID(),
  query('departmentId').optional().isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      financialYear: req.query.financialYear as string,
      careHomeId: req.query.careHomeId as string,
      departmentId: req.query.departmentId as string
    };

    const summary = await budgetService.getBudgetsSummary(filters);
    
    res.json({
      success: true,
      data: summary,
      message: 'Budgets summary retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving budgetssummary:', error);
    next(error);
  }
});

/**
 * @route GET /api/finance/budgets/variance-report
 * @desc Get budget variance report
 * @access Private
 */
router.get('/variance-report', [
  query('financialYear').optional().isString(),
  query('careHomeId').optional().isUUID(),
  query('departmentId').optional().isUUID(),
  query('budgetType').optional().isIn(['annual', 'quarterly', 'monthly', 'project', 'department', 'capital', 'operational']),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      financialYear: req.query.financialYear as string,
      careHomeId: req.query.careHomeId as string,
      departmentId: req.query.departmentId as string,
      budgetType: req.query.budgetType as string
    };

    const varianceReport = await budgetService.getBudgetVarianceReport(filters);
    
    res.json({
      success: true,
      data: varianceReport,
      message: 'Budget variance report retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving budget variancereport:', error);
    next(error);
  }
});

/**
 * @route GET /api/finance/budgets/forecasting-report
 * @desc Get budget forecasting report
 * @access Private
 */
router.get('/forecasting-report', [
  query('financialYear').optional().isString(),
  query('careHomeId').optional().isUUID(),
  query('departmentId').optional().isUUID(),
  query('forecastPeriod').optional().isIn(['3_months', '6_months', '12_months']),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      financialYear: req.query.financialYear as string,
      careHomeId: req.query.careHomeId as string,
      departmentId: req.query.departmentId as string,
      forecastPeriod: req.query.forecastPeriod as string
    };

    const forecastingReport = await budgetService.getBudgetForecastingReport(filters);
    
    res.json({
      success: true,
      data: forecastingReport,
      message: 'Budget forecasting report retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving budget forecastingreport:', error);
    next(error);
  }
});

export default router;
