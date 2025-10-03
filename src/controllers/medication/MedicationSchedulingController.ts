import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Medication Scheduling Controller for WriteCareNotes Healthcare Management
 * @module MedicationSchedulingController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description REST API controller for intelligent medication scheduling with optimization
 * algorithms, real-time alert system, PRN medication management, schedule adjustment
 * handling, and mobile-friendly alerts across all British Isles jurisdictions.
 * 
 * @compliance
 * - England: CQC Medication Management Standards, NICE Guidelines
 * - Scotland: Care Inspectorate Medication Guidelines, NHS Scotland Standards
 * - Wales: CIW Medication Administration Requirements, NHS Wales Standards
 * - Northern Ireland: RQIA Medication Management Standards, HSC Standards
 * - Republic of Ireland: HIQA Medication Safety Guidelines, HSE Standards
 * - Isle of Man: DHSC Medication Administration Protocols
 * - Guernsey: Committee for Health & Social Care Standards
 * - Jersey: Care Commission Medication Requirements
 * - RCN Medication Administration Standards
 * - NMC Standards for Medicines Management
 * 
 * @security
 * - Encrypted scheduling data with field-level protection
 * - Role-based access control for scheduling operations
 * - Comprehensive audit trails for all scheduling activities
 * - Secure real-time alert delivery mechanisms
 * - Protected PRN medication request handling
 */

import { Request, Response } from 'express';
import { 
  MedicationSchedulingService, 
  MedicationSchedule,
  MedicationAlert,
  ScheduleOptimization,
  ScheduleFilters,
  ScheduleStats,
  OptimizationRule
} from '../../services/medication/MedicationSchedulingService';
import { logger } from '../../utils/logger';

/**
 * Controller class for medication scheduling operations
 * Handles HTTP requests for schedule creation, optimization, alert management,
 * PRN requests, and real-time notifications with comprehensive validation
 * and automated compliance across all British Isles jurisdictions.
 */
export class MedicationSchedulingController {
  private schedulingService: MedicationSchedulingService;

  constructor() {
    this.schedulingService = new MedicationSchedulingService();
  }

  /**
   * Create optimized medication schedule
   */
  async createSchedule(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const {
        prescriptionId,
        frequency,
        scheduleType,
        optimizationPreferences,
        alertSettings,
        priority,
        specialInstructions,
        prnIndication,
        prnMaxDoses,
        prnMinInterval,
        prnMaxDaily
      } = req.body;

      // Validate required fields
      if (!prescriptionId || !frequency || !scheduleType || !optimizationPreferences || 
          !alertSettings || !priority) {
        res.status(400).json({ 
          error: 'Missing required fields: prescriptionId, frequency, scheduleType, optimizationPreferences, alertSettings, priority' 
        });
        return;
      }

      // Validate schedule type
      const validScheduleTypes = ['regular', 'prn', 'stat', 'variable'];
      if (!validScheduleTypes.includes(scheduleType)) {
        res.status(400).json({ 
          error: 'Invalid schedule type. Must be one of: ' + validScheduleTypes.join(', ')
        });
        return;
      }

      // Validate priority
      const validPriorities = ['low', 'normal', 'high', 'critical'];
      if (!validPriorities.includes(priority)) {
        res.status(400).json({ 
          error: 'Invalid priority. Must be one of: ' + validPriorities.join(', ')
        });
        return;
      }

      // Validate frequency type
      const validFrequencyTypes = ['once', 'daily', 'weekly', 'monthly', 'interval', 'custom'];
      if (!frequency.type || !validFrequencyTypes.includes(frequency.type)) {
        res.status(400).json({ 
          error: 'Invalid frequency type. Must be one of: ' + validFrequencyTypes.join(', ')
        });
        return;
      }

      // Validate PRN specific fields
      if (scheduleType === 'prn') {
        if (!prnIndication || !prnMaxDoses || !prnMinInterval) {
          res.status(400).json({ 
            error: 'PRN schedules require prnIndication, prnMaxDoses, and prnMinInterval' 
          });
          return;
        }

        if (prnMaxDoses <= 0 || prnMinInterval <= 0) {
          res.status(400).json({ 
            error: 'PRN max doses and minimum interval must be greater than 0' 
          });
          return;
        }
      }

      // Validate optimization preferences
      if (typeof optimizationPreferences.groupWithMeals !== 'boolean' ||
          typeof optimizationPreferences.avoidNighttime !== 'boolean') {
        res.status(400).json({ 
          error: 'Optimization preferences must include boolean values for groupWithMeals and avoidNighttime' 
        });
        return;
      }

      // Validate alert settings
      if (!alertSettings.preAlertMinutes || !alertSettings.overdueAlertMinutes || 
          !alertSettings.escalationMinutes || !alertSettings.alertMethods || 
          !alertSettings.alertRecipients) {
        res.status(400).json({ 
          error: 'Alert settings must include preAlertMinutes, overdueAlertMinutes, escalationMinutes, alertMethods, and alertRecipients' 
        });
        return;
      }

      const validAlertMethods = ['push', 'email', 'sms', 'dashboard'];
      if (!Array.isArray(alertSettings.alertMethods) || 
          !alertSettings.alertMethods.every(method => validAlertMethods.includes(method))) {
        res.status(400).json({ 
          error: 'Invalid alert methods. Must be array containing: ' + validAlertMethods.join(', ')
        });
        return;
      }

      if (!Array.isArray(alertSettings.alertRecipients) || alertSettings.alertRecipients.length === 0) {
        res.status(400).json({ 
          error: 'Alert recipients must be a non-empty array' 
        });
        return;
      }

      const scheduleData = {
        frequency,
        scheduleType,
        optimizationPreferences,
        alertSettings,
        priority,
        specialInstructions,
        prnIndication,
        prnMaxDoses,
        prnMinInterval,
        prnMaxDaily
      };

      const schedule = await this.schedulingService.createMedicationSchedule(
        prescriptionId,
        scheduleData,
        organizationId,
        userId
      );

      res.status(201).json({
        message: 'Medication schedule created successfully',
        data: schedule
      });
    } catch (error: unknown) {
      console.error('Error in createSchedule controller', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('not found')) {
        res.status(404).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('require')) {
        res.status(400).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to create medication schedule' });
      }
    }
  }

  /**
   * Generate real-time medication alerts
   */
  async generateAlerts(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const alertTypes = req.query['alertTypes'] as string;
      let alertTypeArray: MedicationAlert['alertType'][] | undefined;

      if (alertTypes) {
        alertTypeArray = alertTypes.split(',') as MedicationAlert['alertType'][];
        
        const validAlertTypes = [
          'due', 'overdue', 'pre_alert', 'missed', 'prn_available', 
          'prn_limit_reached', 'interaction_warning', 'schedule_conflict'
        ];
        
        if (!alertTypeArray.every(type => validAlertTypes.includes(type))) {
          res.status(400).json({ 
            error: 'Invalid alert types. Must be one of: ' + validAlertTypes.join(', ')
          });
          return;
        }
      }

      const alerts = await this.schedulingService.generateMedicationAlerts(
        organizationId,
        alertTypeArray
      );

      res.json({
        message: 'Medication alerts generated successfully',
        data: {
          alerts,
          totalAlerts: alerts.length,
          urgentAlerts: alerts.filter(alert => ['urgent', 'critical'].includes(alert.severity)).length,
          generatedAt: new Date()
        }
      });
    } catch (error: unknown) {
      console.error('Error in generateAlerts controller', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        query: req.query,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({ error: 'Failed to generate medication alerts' });
    }
  }

  /**
   * Optimize resident medication schedules
   */
  async optimizeSchedules(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;
      const { residentId } = req.params;

      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!residentId) {
        res.status(400).json({ error: 'Resident ID is required' });
        return;
      }

      const { optimizationRules } = req.body;

      // Validate optimization rules if provided
      let rules: OptimizationRule[] = [];
      if (optimizationRules) {
        if (!Array.isArray(optimizationRules)) {
          res.status(400).json({ error: 'Optimization rules must be an array' });
          return;
        }

        const validRuleTypes = [
          'group_medications', 'avoid_interactions', 'respect_intervals', 
          'meal_timing', 'sleep_schedule', 'staff_availability'
        ];

        for (const rule of optimizationRules) {
          if (!rule.ruleType || !validRuleTypes.includes(rule.ruleType)) {
            res.status(400).json({ 
              error: 'Invalid rule type. Must be one of: ' + validRuleTypes.join(', ')
            });
            return;
          }

          if (typeof rule.priority !== 'number' || rule.priority < 1 || rule.priority > 10) {
            res.status(400).json({ 
              error: 'Rule priority must be a number between 1 and 10' 
            });
            return;
          }

          if (!rule.description || typeof rule.description !== 'string') {
            res.status(400).json({ 
              error: 'Rule description is required and must be a string' 
            });
            return;
          }
        }

        rules = optimizationRules;
      } else {
        // Use default optimization rules
        rules = [
          {
            ruleType: 'group_medications',
            priority: 8,
            description: 'Group medications with similar administration times',
            parameters: { maxTimeWindow: 30 }
          },
          {
            ruleType: 'avoid_interactions',
            priority: 10,
            description: 'Avoid scheduling interacting medications at the same time',
            parameters: { minimumSeparation: 60 }
          },
          {
            ruleType: 'respect_intervals',
            priority: 9,
            description: 'Respect minimum intervals between doses',
            parameters: {}
          },
          {
            ruleType: 'meal_timing',
            priority: 6,
            description: 'Consider meal timing for medication administration',
            parameters: { mealTimes: ['08:00', '12:30', '18:00'] }
          }
        ];
      }

      const optimization = await this.schedulingService.optimizeResidentSchedules(
        residentId,
        rules,
        organizationId,
        userId
      );

      res.json({
        message: 'Medication schedules optimized successfully',
        data: optimization
      });
    } catch (error: unknown) {
      console.error('Error in optimizeSchedules controller', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        params: req.params,
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('not found')) {
        res.status(404).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to optimize medication schedules' });
      }
    }
  }

  /**
   * Handle PRN medication request
   */
  async handlePrnRequest(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;
      const { scheduleId } = req.params;

      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!scheduleId) {
        res.status(400).json({ error: 'Schedule ID is required' });
        return;
      }

      const {
        indication,
        requestedBy,
        requestedAt,
        clinicalJustification,
        vitalSigns
      } = req.body;

      // Validate required fields
      if (!indication || !requestedBy || !requestedAt || !clinicalJustification) {
        res.status(400).json({ 
          error: 'Missing required fields: indication, requestedBy, requestedAt, clinicalJustification' 
        });
        return;
      }

      // Validate requested time
      const requestedDateTime = new Date(requestedAt);
      if (isNaN(requestedDateTime.getTime())) {
        res.status(400).json({ error: 'Invalid requestedAt date format' });
        return;
      }

      // Validate vital signs if provided
      if (vitalSigns) {
        if (vitalSigns.painScore !== undefined) {
          if (typeof vitalSigns.painScore !== 'number' || vitalSigns.painScore < 0 || vitalSigns.painScore > 10) {
            res.status(400).json({ error: 'Pain score must be a number between 0 and 10' });
            return;
          }
        }

        if (vitalSigns.heartRate !== undefined) {
          if (typeof vitalSigns.heartRate !== 'number' || vitalSigns.heartRate < 30 || vitalSigns.heartRate > 200) {
            res.status(400).json({ error: 'Heart rate must be a number between 30 and 200' });
            return;
          }
        }

        if (vitalSigns.temperature !== undefined) {
          if (typeof vitalSigns.temperature !== 'number' || vitalSigns.temperature < 30 || vitalSigns.temperature > 45) {
            res.status(400).json({ error: 'Temperature must be a number between 30 and 45 degrees Celsius' });
            return;
          }
        }

        if (vitalSigns.respiratoryRate !== undefined) {
          if (typeof vitalSigns.respiratoryRate !== 'number' || vitalSigns.respiratoryRate < 8 || vitalSigns.respiratoryRate > 40) {
            res.status(400).json({ error: 'Respiratory rate must be a number between 8 and 40' });
            return;
          }
        }
      }

      const requestData = {
        indication,
        requestedBy,
        requestedAt: requestedDateTime,
        clinicalJustification,
        vitalSigns
      };

      const result = await this.schedulingService.handlePrnRequest(
        scheduleId,
        requestData,
        organizationId,
        userId
      );

      if (result.approved) {
        res.status(200).json({
          message: 'PRN medication request approved',
          data: result
        });
      } else {
        res.status(409).json({
          message: 'PRN medication request denied',
          data: result
        });
      }
    } catch (error: unknown) {
      console.error('Error in handlePrnRequest controller', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        params: req.params,
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('not found')) {
        res.status(404).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('not PRN type')) {
        res.status(400).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to handle PRN medication request' });
      }
    }
  }

  /**
   * Update medication schedule
   */
  async updateSchedule(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;
      const { scheduleId } = req.params;

      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!scheduleId) {
        res.status(400).json({ error: 'Schedule ID is required' });
        return;
      }

      const {
        frequency,
        optimizationPreferences,
        alertSettings,
        priority,
        status,
        specialInstructions
      } = req.body;

      // Validate frequency if provided
      if (frequency) {
        const validFrequencyTypes = ['once', 'daily', 'weekly', 'monthly', 'interval', 'custom'];
        if (!frequency.type || !validFrequencyTypes.includes(frequency.type)) {
          res.status(400).json({ 
            error: 'Invalid frequency type. Must be one of: ' + validFrequencyTypes.join(', ')
          });
          return;
        }
      }

      // Validate priority if provided
      if (priority) {
        const validPriorities = ['low', 'normal', 'high', 'critical'];
        if (!validPriorities.includes(priority)) {
          res.status(400).json({ 
            error: 'Invalid priority. Must be one of: ' + validPriorities.join(', ')
          });
          return;
        }
      }

      // Validate status if provided
      if (status) {
        const validStatuses = ['active', 'paused', 'completed', 'discontinued'];
        if (!validStatuses.includes(status)) {
          res.status(400).json({ 
            error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
          });
          return;
        }
      }

      // Validate alert methods if provided
      if (alertSettings?.alertMethods) {
        const validAlertMethods = ['push', 'email', 'sms', 'dashboard'];
        if (!Array.isArray(alertSettings.alertMethods) || 
            !alertSettings.alertMethods.every(method => validAlertMethods.includes(method))) {
          res.status(400).json({ 
            error: 'Invalid alert methods. Must be array containing: ' + validAlertMethods.join(', ')
          });
          return;
        }
      }

      const updates = {
        frequency,
        optimizationPreferences,
        alertSettings,
        priority,
        status,
        specialInstructions
      };

      // Remove undefined values
      Object.keys(updates).forEach(key => {
        if (updates[key] === undefined) {
          delete updates[key];
        }
      });

      if (Object.keys(updates).length === 0) {
        res.status(400).json({ error: 'No valid updates provided' });
        return;
      }

      const updatedSchedule = await this.schedulingService.updateMedicationSchedule(
        scheduleId,
        updates,
        organizationId,
        userId
      );

      res.json({
        message: 'Medication schedule updated successfully',
        data: updatedSchedule
      });
    } catch (error: unknown) {
      console.error('Error in updateSchedule controller', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        params: req.params,
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('not found')) {
        res.status(404).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to update medication schedule' });
      }
    }
  }

  /**
   * Get medication schedules with filtering
   */
  async getSchedules(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const page = parseInt(req.query['page'] as string) || 1;
      const limit = Math.min(parseInt(req.query['limit'] as string) || 50, 100);

      const filters: ScheduleFilters = {};

      // Apply filters from query parameters
      if (req.query['residentId']) {
        filters.residentId = req.query['residentId'] as string;
      }
      if (req.query['medicationName']) {
        filters.medicationName = req.query['medicationName'] as string;
      }
      if (req.query['scheduleType']) {
        filters.scheduleType = req.query['scheduleType'] as string;
      }
      if (req.query['status']) {
        filters.status = req.query['status'] as string;
      }
      if (req.query['priority']) {
        filters.priority = req.query['priority'] as string;
      }
      if (req.query['location']) {
        filters.location = req.query['location'] as string;
      }
      if (req.query['dueWithinHours']) {
        const hours = parseInt(req.query['dueWithinHours'] as string);
        if (isNaN(hours) || hours < 0 || hours > 168) {
          res.status(400).json({ error: 'dueWithinHours must be a number between 0 and 168' });
          return;
        }
        filters.dueWithinHours = hours;
      }
      if (req.query['overdueOnly'] !== undefined) {
        filters.overdueOnly = req.query['overdueOnly'] === 'true';
      }
      if (req.query['alertsOnly'] !== undefined) {
        filters.alertsOnly = req.query['alertsOnly'] === 'true';
      }

      const result = await this.schedulingService.getMedicationSchedules(
        filters,
        organizationId,
        page,
        limit
      );

      res.json({
        message: 'Medication schedules retrieved successfully',
        data: result
      });
    } catch (error: unknown) {
      console.error('Error in getSchedules controller', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        query: req.query,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({ error: 'Failed to retrieve medication schedules' });
    }
  }

  /**
   * Get scheduling statistics
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const stats = await this.schedulingService.getSchedulingStats(organizationId);

      res.json({
        message: 'Scheduling statistics retrieved successfully',
        data: stats
      });
    } catch (error: unknown) {
      console.error('Error in getStats controller', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({ error: 'Failed to retrieve scheduling statistics' });
    }
  }
}