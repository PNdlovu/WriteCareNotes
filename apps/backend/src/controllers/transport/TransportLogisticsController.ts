/**
 * @fileoverview transport logistics Controller
 * @module Transport/TransportLogisticsController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description transport logistics Controller
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { TransportLogisticsService } from '../../services/transport/TransportLogisticsService';
import { Vehicle, VehicleType } from '../../entities/transport/Vehicle';

export class TransportLogisticsController {
  privatetransportService: TransportLogisticsService;

  const ructor() {
    this.transportService = new TransportLogisticsService();
  }

  // Vehicle Fleet Management
  async addVehicle(req: Request, res: Response): Promise<void> {
    try {
      const vehicleData = req.body as Partial<Vehicle>;
      const vehicle = await this.transportService.addVehicle(vehicleData);
      
      res.status(201).json({
        success: true,
        message: 'Vehicle added successfully',
        data: vehicle
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to add vehicle',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getAllVehicles(req: Request, res: Response): Promise<void> {
    try {
      const vehicles = await this.transportService.getAllVehicles();
      
      res.json({
        success: true,
        data: vehicles,
        total: vehicles.length
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve vehicles',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getAvailableVehicles(req: Request, res: Response): Promise<void> {
    try {
      const vehicles = await this.transportService.getAvailableVehicles();
      
      res.json({
        success: true,
        data: vehicles,
        total: vehicles.length
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve available vehicles',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getVehiclesByType(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleType } = req.params;
      const vehicles = await this.transportService.getVehiclesByType(vehicleType as VehicleType);
      
      res.json({
        success: true,
        data: vehicles,
        total: vehicles.length,
        vehicleType
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve vehicles by type',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Transport Request Management
  async createTransportRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestData = req.body;
      const transportRequest = await this.transportService.createTransportRequest(requestData);
      
      res.status(201).json({
        success: true,
        message: 'Transport request created successfully',
        data: transportRequest
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to create transport request',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getAllTransportRequests(req: Request, res: Response): Promise<void> {
    try {
      const requests = await this.transportService.getAllTransportRequests();
      
      res.json({
        success: true,
        data: requests,
        total: requests.length
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transport requests',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async approveTransportRequest(req: Request, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;
      const { approvedBy } = req.body;

      if (!approvedBy) {
        res.status(400).json({
          success: false,
          message: 'Approved by field is required'
        });
        return;
      }

      await this.transportService.approveTransportRequest(requestId, approvedBy);
      
      res.json({
        success: true,
        message: 'Transport request approved and scheduled'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to approve transport request',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Emergency Transport
  async requestEmergencyTransport(req: Request, res: Response): Promise<void> {
    try {
      const emergencyData = req.body;
      const emergencyRequest = await this.transportService.requestEmergencyTransport(emergencyData);
      
      res.status(201).json({
        success: true,
        message: 'Emergency transport requested',
        data: emergencyRequest
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to request emergency transport',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Journey Management
  async startJourney(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const journeyData = req.body;
      
      await this.transportService.startJourney(vehicleId, journeyData);
      
      res.json({
        success: true,
        message: 'Journey started successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to start journey',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async completeJourney(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId, journeyId } = req.params;
      const completionData = req.body;
      
      await this.transportService.completeJourney(vehicleId, journeyId, completionData);
      
      res.json({
        success: true,
        message: 'Journey completed successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to complete journey',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Route Optimization
  async optimizeRoutes(req: Request, res: Response): Promise<void> {
    try {
      const date = req.query['date'] ? new Date(req.query['date'] as string) : new Date();
      const optimization = await this.transportService.optimizeRoutes(date);
      
      res.json({
        success: true,
        data: optimization
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to optimize routes',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Analytics
  async getFleetAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.transportService.getFleetAnalytics();
      
      res.json({
        success: true,
        data: analytics,
        timestamp: new Date()
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve fleet analytics',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getMaintenanceAlerts(req: Request, res: Response): Promise<void> {
    try {
      const alerts = await this.transportService.getMaintenanceAlerts();
      
      res.json({
        success: true,
        data: alerts,
        total: alerts.length
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve maintenance alerts',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Vehicle Maintenance
  async scheduleVehicleMaintenance(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const { maintenanceType, scheduledDate } = req.body;

      if (!maintenanceType || !scheduledDate) {
        res.status(400).json({
          success: false,
          message: 'Maintenance type and scheduled date are required'
        });
        return;
      }

      await this.transportService.scheduleVehicleMaintenance(
        vehicleId, 
        maintenanceType, 
        new Date(scheduledDate)
      );
      
      res.json({
        success: true,
        message: 'Vehicle maintenance scheduled successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to schedule vehicle maintenance',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async completeVehicleMaintenance(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const maintenanceData = req.body;
      
      await this.transportService.completeVehicleMaintenance(vehicleId, maintenanceData);
      
      res.json({
        success: true,
        message: 'Vehicle maintenance completed successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to complete vehicle maintenance',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}
