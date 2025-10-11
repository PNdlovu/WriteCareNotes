/**
 * @fileoverview maintenance facilities Controller
 * @module Maintenance/MaintenanceFacilitiesController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description maintenance facilities Controller
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { MaintenanceFacilitiesService } from '../../services/maintenance/MaintenanceFacilitiesService';
import { Asset, AssetType } from '../../entities/maintenance/Asset';

export class MaintenanceFacilitiesController {
  privatemaintenanceService: MaintenanceFacilitiesService;

  constructor() {
    this.maintenanceService = new MaintenanceFacilitiesService();
  }

  // Asset Management
  async createAsset(req: Request, res: Response): Promise<void> {
    try {
      const assetData = req.body as Partial<Asset>;
      const asset = await this.maintenanceService.createAsset(assetData);
      
      res.status(201).json({
        success: true,
        message: 'Asset created successfully',
        data: asset
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to create asset',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getAllAssets(req: Request, res: Response): Promise<void> {
    try {
      const assets = await this.maintenanceService.getAllAssets();
      
      res.json({
        success: true,
        data: assets,
        total: assets.length
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve assets',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getAssetsByType(req: Request, res: Response): Promise<void> {
    try {
      const { assetType } = req.params;
      const assets = await this.maintenanceService.getAssetsByType(assetType as AssetType);
      
      res.json({
        success: true,
        data: assets,
        total: assets.length,
        assetType
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve assets by type',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getAssetsByLocation(req: Request, res: Response): Promise<void> {
    try {
      const { location } = req.params;
      const assets = await this.maintenanceService.getAssetsByLocation(location);
      
      res.json({
        success: true,
        data: assets,
        total: assets.length,
        location
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve assets by location',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Work Order Management
  async createWorkOrder(req: Request, res: Response): Promise<void> {
    try {
      const workOrderData = req.body;
      const workOrder = await this.maintenanceService.createWorkOrder(workOrderData);
      
      res.status(201).json({
        success: true,
        message: 'Work order created successfully',
        data: workOrder
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to create work order',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getAllWorkOrders(req: Request, res: Response): Promise<void> {
    try {
      const workOrders = await this.maintenanceService.getAllWorkOrders();
      
      res.json({
        success: true,
        data: workOrders,
        total: workOrders.length
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve work orders',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async completeWorkOrder(req: Request, res: Response): Promise<void> {
    try {
      const { workOrderId } = req.params;
      const completionData = req.body;
      
      await this.maintenanceService.completeWorkOrder(workOrderId, completionData);
      
      res.json({
        success: true,
        message: 'Work order completed successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to complete work order',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Preventive Maintenance
  async schedulePreventiveMaintenance(req: Request, res: Response): Promise<void> {
    try {
      const workOrders = await this.maintenanceService.schedulePreventiveMaintenance();
      
      res.json({
        success: true,
        message: `Scheduled ${workOrders.length} preventive maintenance work orders`,
        data: workOrders
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to schedule preventive maintenance',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Analytics
  async getMaintenanceAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.maintenanceService.getMaintenanceAnalytics();
      
      res.json({
        success: true,
        data: analytics,
        timestamp: new Date()
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve maintenance analytics',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getMaintenanceCalendar(req: Request, res: Response): Promise<void> {
    try {
      const startDate = req.query['startDate'] ? new Date(req.query['startDate'] as string) : new Date();
      const endDate = req.query['endDate'] ? new Date(req.query['endDate'] as string) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      const calendar = await this.maintenanceService.getMaintenanceCalendar(startDate, endDate);
      
      res.json({
        success: true,
        data: calendar,
        period: { startDate, endDate }
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve maintenance calendar',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Emergency Management
  async reportEmergencyIssue(req: Request, res: Response): Promise<void> {
    try {
      const issueData = req.body;
      const emergencyWorkOrder = await this.maintenanceService.reportEmergencyIssue(issueData);
      
      res.status(201).json({
        success: true,
        message: 'Emergency issue reported and work order created',
        data: emergencyWorkOrder
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to report emergency issue',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Compliance
  async getComplianceStatus(req: Request, res: Response): Promise<void> {
    try {
      const complianceStatus = await this.maintenanceService.getComplianceStatus();
      
      res.json({
        success: true,
        data: complianceStatus
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve compliance status',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}
