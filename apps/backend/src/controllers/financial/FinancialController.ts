/**
 * @fileoverview financial Controller
 * @module Financial/FinancialController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description financial Controller
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { FinancialAnalyticsService } from '../../services/financial/FinancialAnalyticsService';

export class FinancialController {
  privatefinancialService: FinancialAnalyticsService;

  constructor() {
    this.financialService = new FinancialAnalyticsService();
  }

  async getFinancialSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await this.financialService.getFinancialSummary();
      
      res.json({
        success: true,
        data: summary,
        timestamp: new Date()
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve financial summary',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async generateReport(req: Request, res: Response): Promise<void> {
    try {
      const { reportType, startDate, endDate } = req.query;
      
      const report = await this.financialService.generateReport(
        reportType as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json({
        success: true,
        data: report
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate financial report',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getForecast(req: Request, res: Response): Promise<void> {
    try {
      const months = req.query['months'] ? parseInt(req.query['months'] as string) : 12;
      const forecast = await this.financialService.getForecast(months);
      
      res.json({
        success: true,
        data: forecast,
        forecastPeriod: `${months} months`
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate forecast',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}
