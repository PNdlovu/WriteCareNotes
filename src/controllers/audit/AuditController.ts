/**/**

 * @fileoverview Audit Controller - HTTP API Layer for Audit Management * @fileoverview audit Controller

 * @module Controllers/Audit/AuditController * @module Audit/AuditController

 * @version 1.0.0 * @version 1.0.0

 * @author WriteCareNotes Team * @author WriteCareNotes Team

 * @since 2025-10-08 * @since 2025-10-07

 * @compliance CQC, GDPR, NHS Digital, ISO 27001 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR

 */ * @stability stable

 * 

import { Request, Response } from 'express'; * @description audit Controller

import { query, param, body, ValidationChain } from 'express-validator'; */

import { AuditService } from '../../services/audit/AuditService';

import { AuditEventType, RiskLevel, ComplianceFramework } from '../../entities/audit/AuditEvent';import { EventEmitter2 } from "eventemitter2";



function getUserContext(req: Request): { userId: string; sessionId: string } {import { Request, Response } from 'express';

  return {import { EnterpriseAuditService } from '../../services/audit/EnterpriseAuditService';

    userId: (req as any).user?.id || 'anonymous',

    sessionId: (req as any).session?.id || 'unknown',export class AuditController {

  };  private auditService: EnterpriseAuditService;

}

  constructor() {

export class AuditController {    this.auditService = new EnterpriseAuditService();

  constructor(private auditService: AuditService) {}  }



  /**  async createAuditEvent(req: Request, res: Response): Promise<void> {

   * Get audit event by ID    try {

   * GET /audit/:id      const event = await this.auditService.createAdvancedAuditEvent(req.body);

   */      res.status(201).json({ success: true, data: event });

  async getById(req: Request, res: Response): Promise<void> {    } catch (error: unknown) {

    try {      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });

      const event = await this.auditService.findById(req.params.id);    }

  }

      if (!event) {

        res.status(404).json({  async conductInvestigation(req: Request, res: Response): Promise<void> {

          status: 'error',    try {

          message: 'Audit event not found',      const investigation = await this.auditService.conductAuditInvestigation(req.body);

        });      res.json({ success: true, data: investigation });

        return;    } catch (error: unknown) {

      }      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });

    }

      res.status(200).json({  }

        status: 'success',

        data: event,  async getAuditAnalytics(req: Request, res: Response): Promise<void> {

      });    try {

    } catch (error: any) {      const analytics = await this.auditService.getAdvancedAuditAnalytics();

      res.status(500).json({      res.json({ success: true, data: analytics });

        status: 'error',    } catch (error: unknown) {

        message: error.message || 'Failed to retrieve audit event',      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });

      });    }

    }  }

  }}

  /**
   * Search audit events
   * GET /audit/search
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        eventType: req.query.eventType as AuditEventType,
        entityType: req.query.entityType as string,
        entityId: req.query.entityId as string,
        userId: req.query.userId as string,
        riskLevel: req.query.riskLevel as RiskLevel,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        isSuccessful: req.query.isSuccessful === 'true' ? true : req.query.isSuccessful === 'false' ? false : undefined,
        complianceFramework: req.query.complianceFramework as ComplianceFramework,
        searchTerm: req.query.searchTerm as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
      };

      const result = await this.auditService.search(filters);

      res.status(200).json({
        status: 'success',
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to search audit events',
      });
    }
  }

  /**
   * Get entity history
   * GET /audit/entity/:entityType/:entityId
   */
  async getEntityHistory(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const events = await this.auditService.getEntityHistory(entityType, entityId, limit);

      res.status(200).json({
        status: 'success',
        data: events,
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to retrieve entity history',
      });
    }
  }

  /**
   * Get user activity
   * GET /audit/user/:userId
   */
  async getUserActivity(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

      const events = await this.auditService.getUserActivity(userId, startDate, endDate, limit);

      res.status(200).json({
        status: 'success',
        data: events,
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to retrieve user activity',
      });
    }
  }

  /**
   * Get high-risk events
   * GET /audit/high-risk
   */
  async getHighRiskEvents(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const events = await this.auditService.getHighRiskEvents(limit);

      res.status(200).json({
        status: 'success',
        data: events,
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to retrieve high-risk events',
      });
    }
  }

  /**
   * Get failed operations
   * GET /audit/failed
   */
  async getFailedOperations(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const events = await this.auditService.getFailedOperations(limit);

      res.status(200).json({
        status: 'success',
        data: events,
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to retrieve failed operations',
      });
    }
  }

  /**
   * Get events requiring investigation
   * GET /audit/investigation-required
   */
  async getEventsRequiringInvestigation(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const events = await this.auditService.getEventsRequiringInvestigation(limit);

      res.status(200).json({
        status: 'success',
        data: events,
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to retrieve events requiring investigation',
      });
    }
  }

  /**
   * Get compliance report
   * GET /audit/compliance/report
   */
  async getComplianceReport(req: Request, res: Response): Promise<void> {
    try {
      const framework = req.query.framework as ComplianceFramework;
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      if (!framework || !startDate || !endDate) {
        res.status(400).json({
          status: 'error',
          message: 'Framework, startDate, and endDate are required',
        });
        return;
      }

      const report = await this.auditService.getComplianceReport(framework, startDate, endDate);

      res.status(200).json({
        status: 'success',
        data: report,
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to generate compliance report',
      });
    }
  }

  /**
   * Get statistics
   * GET /audit/statistics
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await this.auditService.getStatistics(startDate, endDate);

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to retrieve statistics',
      });
    }
  }

  /**
   * Delete expired events (cleanup)
   * DELETE /audit/cleanup/expired
   */
  async deleteExpiredEvents(req: Request, res: Response): Promise<void> {
    try {
      const deletedCount = await this.auditService.deleteExpiredEvents();

      res.status(200).json({
        status: 'success',
        data: { deletedCount },
        message: `Successfully deleted ${deletedCount} expired audit events`,
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to delete expired events',
      });
    }
  }

  /**
   * Archive old events
   * POST /audit/archive
   */
  async archiveOldEvents(req: Request, res: Response): Promise<void> {
    try {
      const daysOld = req.body.daysOld || 90;
      const archivedCount = await this.auditService.archiveOldEvents(daysOld);

      res.status(200).json({
        status: 'success',
        data: { archivedCount },
        message: `Successfully archived ${archivedCount} old audit events`,
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to archive old events',
      });
    }
  }
}

// Validation rules
export const auditSearchValidation: ValidationChain[] = [
  query('eventType').optional().isIn(Object.values(AuditEventType)),
  query('riskLevel').optional().isIn(Object.values(RiskLevel)),
  query('complianceFramework').optional().isIn(Object.values(ComplianceFramework)),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

export const complianceReportValidation: ValidationChain[] = [
  query('framework').isIn(Object.values(ComplianceFramework)).withMessage('Valid compliance framework is required'),
  query('startDate').isISO8601().withMessage('Valid start date is required'),
  query('endDate').isISO8601().withMessage('Valid end date is required'),
];

export const archiveValidation: ValidationChain[] = [
  body('daysOld').optional().isInt({ min: 1 }).withMessage('Days old must be a positive integer'),
];

export default AuditController;
