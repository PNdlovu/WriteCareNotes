/**
 * @fileoverview bed management Controller
 * @module Bed/BedManagementController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description bed management Controller
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { BedManagementService, BedSearchCriteria } from '../../services/bed/BedManagementService';
import { WaitingListEntry } from '../../entities/bed/WaitingListEntry';
import { validateRequest } from '../../middleware/validation-middleware';
import { authenticate } from '../../middleware/auth-middleware';
import { authorize } from '../../middleware/rbac-middleware';

export class BedManagementController {
  private bedManagementService: BedManagementService;

  constructor() {
    this.bedManagementService = new BedManagementService();
  }

  // Bed Management Endpoints
  async getAllBeds(req: Request, res: Response): Promise<void> {
    try {
      const beds = await this.bedManagementService.getAllBeds();
      res.json({
        success: true,
        data: beds,
        total: beds.length
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve beds',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async getBedById(req: Request, res: Response): Promise<void> {
    try {
      const { bedId } = req.params;
      const bed = await this.bedManagementService.getBedById(bedId);
      
      if (!bed) {
        res.status(404).json({
          success: false,
          message: 'Bed not found'
        });
        return;
      }

      res.json({
        success: true,
        data: bed
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve bed',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async getAvailableBeds(req: Request, res: Response): Promise<void> {
    try {
      const criteria: BedSearchCriteria = {
        careLevel: req.query['careLevel'] as any,
        roomType: req.query['roomType'] as string,
        floor: req.query['floor'] ? parseInt(req.query['floor'] as string) : undefined,
        wing: req.query['wing'] as string,
        accessibility: req.query['accessibility'] as string[],
        maxRate: req.query['maxRate'] ? parseFloat(req.query['maxRate'] as string) : undefined,
        availableFrom: req.query['availableFrom'] ? new Date(req.query['availableFrom'] as string) : undefined,
        availableTo: req.query['availableTo'] ? new Date(req.query['availableTo'] as string) : undefined
      };

      const beds = await this.bedManagementService.getAvailableBeds(criteria);
      
      res.json({
        success: true,
        data: beds,
        total: beds.length,
        criteria
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve available beds',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async allocateBed(req: Request, res: Response): Promise<void> {
    try {
      const { bedId } = req.params;
      const { residentId } = req.body;

      if (!residentId) {
        res.status(400).json({
          success: false,
          message: 'Resident ID is required'
        });
        return;
      }

      const result = await this.bedManagementService.allocateBed(bedId, residentId);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: result
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to allocate bed',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async deallocateBed(req: Request, res: Response): Promise<void> {
    try {
      const { bedId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'Reason for deallocation is required'
        });
        return;
      }

      const result = await this.bedManagementService.deallocateBed(bedId, reason);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: result
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to deallocate bed',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  // Waiting List Management
  async addToWaitingList(req: Request, res: Response): Promise<void> {
    try {
      const waitingListData = req.body as Partial<WaitingListEntry>;
      
      // Validate required fields
      const requiredFields = ['prospectiveResidentName', 'dateOfBirth', 'nhsNumber', 'contactDetails', 'fundingSource'];
      const missingFields = requiredFields.filter(field => !waitingListData[field]);
      
      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
        return;
      }

      const entry = await this.bedManagementService.addToWaitingList(waitingListData);
      
      res.status(201).json({
        success: true,
        message: 'Added to waiting list successfully',
        data: entry
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to add to waiting list',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async getWaitingList(req: Request, res: Response): Promise<void> {
    try {
      const prioritized = req.query['prioritized'] === 'true';
      
      const waitingList = prioritized 
        ? await this.bedManagementService.getPrioritizedWaitingList()
        : await this.bedManagementService.getWaitingList();
      
      res.json({
        success: true,
        data: waitingList,
        total: waitingList.length,
        prioritized
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve waiting list',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async matchBedToWaitingList(req: Request, res: Response): Promise<void> {
    try {
      const matches = await this.bedManagementService.matchBedToWaitingList();
      
      res.json({
        success: true,
        data: matches,
        total: matches.length,
        message: `Found ${matches.length} potential bed matches`
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to match beds to waiting list',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  // Analytics Endpoints
  async getOccupancyAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.bedManagementService.getOccupancyAnalytics();
      
      res.json({
        success: true,
        data: analytics,
        timestamp: new Date()
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve occupancy analytics',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async getRevenueOptimization(req: Request, res: Response): Promise<void> {
    try {
      const suggestions = await this.bedManagementService.getRevenueOptimizationSuggestions();
      
      res.json({
        success: true,
        data: suggestions,
        total: suggestions.length,
        message: `Found ${suggestions.length} revenue optimization opportunities`
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve revenue optimization suggestions',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async getCapacityForecast(req: Request, res: Response): Promise<void> {
    try {
      const months = req.query['months'] ? parseInt(req.query['months'] as string) : 12;
      const forecast = await this.bedManagementService.getCapacityForecast(months);
      
      res.json({
        success: true,
        data: forecast,
        forecastPeriod: `${months} months`
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate capacity forecast',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  // Maintenance Endpoints
  async scheduleMaintenance(req: Request, res: Response): Promise<void> {
    try {
      const { bedId } = req.params;
      const { maintenanceType, scheduledDate } = req.body;

      if (!maintenanceType || !scheduledDate) {
        res.status(400).json({
          success: false,
          message: 'Maintenance type and scheduled date are required'
        });
        return;
      }

      await this.bedManagementService.scheduleMaintenance(
        bedId, 
        maintenanceType, 
        new Date(scheduledDate)
      );
      
      res.json({
        success: true,
        message: 'Maintenance scheduled successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to schedule maintenance',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async completeMaintenance(req: Request, res: Response): Promise<void> {
    try {
      const { bedId } = req.params;
      const { maintenanceNotes } = req.body;

      if (!maintenanceNotes) {
        res.status(400).json({
          success: false,
          message: 'Maintenance notes are required'
        });
        return;
      }

      await this.bedManagementService.completeMaintenance(bedId, maintenanceNotes);
      
      res.json({
        success: true,
        message: 'Maintenance completed successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to complete maintenance',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async markBedAsClean(req: Request, res: Response): Promise<void> {
    try {
      const { bedId } = req.params;
      
      await this.bedManagementService.markBedAsClean(bedId);
      
      res.json({
        success: true,
        message: 'Bed marked as clean and available'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to mark bed as clean',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async updateBedRate(req: Request, res: Response): Promise<void> {
    try {
      const { bedId } = req.params;
      const { newRate, reason } = req.body;

      if (!newRate || !reason) {
        res.status(400).json({
          success: false,
          message: 'New rate and reason are required'
        });
        return;
      }

      await this.bedManagementService.updateBedRate(bedId, newRate, reason);
      
      res.json({
        success: true,
        message: 'Bed rate updated successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to update bed rate',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }
}