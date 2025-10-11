/**
 * @fileoverview pilot.controller
 * @module Pilot/Pilot.controller
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description pilot.controller
 */

import { Request, Response } from 'express';
import { PilotService } from '../../services/pilot/pilot.service';
import { CreatePilotDto, PilotFeedbackDto, PilotMetricsDto } from '../../dto/pilot.dto';
import { logger } from '../../utils/logger';

export class PilotController {
  private pilotService: PilotService;

  constructor() {
    this.pilotService = new PilotService();
  }

  /**
   * Register a new pilot tenant (care home)
   * POST /pilot/register
   */
  async registerPilot(req: Request, res: Response): Promise<void> {
    try {
      const pilotData: CreatePilotDto = req.body;
      const result = await this.pilotService.registerPilot(pilotData);
      
      logger.info('Pilot registered successfully', { 
        tenantId: result.tenantId, 
        careHomeName: pilotData.careHomeName 
      });
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Pilot registered successfully'
      });
    } catch (error) {
      logger.error('Failed to register pilot', { error: error.message });
      res.status(400).json({
        success: false,
        message: 'Failed to register pilot',
        error: error.message
      });
    }
  }

  /**
   * Get pilot status and progress
   * GET /pilot/status/:tenantId
   */
  async getPilotStatus(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const status = await this.pilotService.getPilotStatus(tenantId);
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Failed to get pilot status', { 
        tenantId: req.params.tenantId, 
        error: error.message 
      });
      res.status(404).json({
        success: false,
        message: 'Pilot not found',
        error: error.message
      });
    }
  }

  /**
   * Submit structured feedback
   * POST /pilot/feedback
   */
  async submitFeedback(req: Request, res: Response): Promise<void> {
    try {
      const feedbackData: PilotFeedbackDto = req.body;
      const result = await this.pilotService.submitFeedback(feedbackData);
      
      logger.info('Pilot feedback submitted', { 
        tenantId: feedbackData.tenantId,
        module: feedbackData.module,
        severity: feedbackData.severity
      });
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Feedback submitted successfully'
      });
    } catch (error) {
      logger.error('Failed to submit feedback', { error: error.message });
      res.status(400).json({
        success: false,
        message: 'Failed to submit feedback',
        error: error.message
      });
    }
  }

  /**
   * Get pilot metrics and KPIs
   * GET /pilot/metrics
   */
  async getPilotMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, startDate, endDate } = req.query;
      const metrics = await this.pilotService.getPilotMetrics({
        tenantId: tenantId as string,
        startDate: startDate as string,
        endDate: endDate as string
      });
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Failed to get pilot metrics', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to get pilot metrics',
        error: error.message
      });
    }
  }

  /**
   * Get all pilots for admin dashboard
   * GET /pilot/list
   */
  async getAllPilots(req: Request, res: Response): Promise<void> {
    try {
      const { status, region } = req.query;
      const pilots = await this.pilotService.getAllPilots({
        status: status as string,
        region: region as string
      });
      
      res.json({
        success: true,
        data: pilots
      });
    } catch (error) {
      logger.error('Failed to get pilots list', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to get pilots list',
        error: error.message
      });
    }
  }

  /**
   * Update pilot status (admin only)
   * PUT /pilot/:tenantId/status
   */
  async updatePilotStatus(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const { status, notes } = req.body;
      
      const result = await this.pilotService.updatePilotStatus(tenantId, status, notes);
      
      logger.info('Pilot status updated', { 
        tenantId, 
        status, 
        updatedBy: req.user?.id 
      });
      
      res.json({
        success: true,
        data: result,
        message: 'Pilot status updated successfully'
      });
    } catch (error) {
      logger.error('Failed to update pilot status', { 
        tenantId: req.params.tenantId, 
        error: error.message 
      });
      res.status(400).json({
        success: false,
        message: 'Failed to update pilot status',
        error: error.message
      });
    }
  }
}