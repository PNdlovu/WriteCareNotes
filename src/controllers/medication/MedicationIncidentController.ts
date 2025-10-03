import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Medication Incident Controller for WriteCareNotes Healthcare Management
 * @module MedicationIncidentController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description REST API controller for comprehensive medication incident management
 * with severity assessment, root cause analysis, automated classification, trend analysis,
 * and regulatory reporting across all British Isles jurisdictions.
 * 
 * @compliance
 * - England: CQC Medication Incident Reporting, MHRA Yellow Card Scheme
 * - Scotland: Care Inspectorate Incident Management, MHRA Yellow Card Scheme
 * - Wales: CIW Incident Reporting Requirements, MHRA Yellow Card Scheme
 * - Northern Ireland: RQIA Incident Management Standards, MHRA Yellow Card Scheme
 * - Republic of Ireland: HIQA Incident Management Framework, IMB Adverse Event Reporting
 * - Isle of Man: DHSC Incident Reporting Guidelines
 * - Guernsey: Committee for Health & Social Care Incident Standards
 * - Jersey: Care Commission Incident Requirements
 * - MHRA Pharmacovigilance Guidelines
 * - WHO-UMC Causality Assessment
 * 
 * @security
 * - Encrypted incident data with field-level protection
 * - Role-based access control for incident operations
 * - Comprehensive audit trails for regulatory compliance
 * - Automated regulatory notification systems
 * - Secure handling of sensitive incident information
 */

import { Request, Response } from 'express';
import { 
  MedicationIncidentService, 
  MedicationIncident,
  IncidentFilters,
  IncidentStats,
  IncidentTrend
} from '../../services/medication/MedicationIncidentService';
import { logger } from '../../utils/logger';

/**
 * Controller class for medication incident management operations
 * Handles HTTP requests for incident reporting, root cause analysis, regulatory
 * notifications, trend analysis, and statistics with comprehensive validation
 * and automated regulatory compliance across all British Isles jurisdictions.
 */
export class MedicationIncidentController {
  private incidentService: MedicationIncidentService;

  constructor() {
    this.incidentService = new MedicationIncidentService();
  }

  /**
   * Report a new medication incident
   */
  async reportIncident(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const {
        incidentType,
        severity,
        category,
        incidentDate,
        discoveredDate,
        location,
        description,
        immediateActions,
        residentId,
        medicationId,
        prescriptionId,
        administrationId,
        intendedDose,
        actualDose,
        intendedRoute,
        actualRoute,
        intendedTime,
        actualTime,
        clinicalSymptoms,
        vitalSigns,
        treatmentRequired,
        hospitalAdmission,
        additionalMonitoring,
        witnessedBy,
        involvedStaff,
        reportedBy,
        reporterRole,
        jurisdiction
      } = req.body;

      // Validate required fields
      if (!incidentType || !severity || !category || !incidentDate || 
          !discoveredDate || !location || !description || !immediateActions ||
          !reportedBy || !reporterRole || !jurisdiction) {
        res.status(400).json({ 
          error: 'Missing required fields: incidentType, severity, category, incidentDate, discoveredDate, location, description, immediateActions, reportedBy, reporterRole, jurisdiction' 
        });
        return;
      }

      // Validate incident type
      const validIncidentTypes = [
        'medication_error', 'adverse_drug_reaction', 'near_miss', 'allergic_reaction', 
        'overdose', 'underdose', 'wrong_medication', 'wrong_patient', 'wrong_route', 
        'wrong_time', 'omitted_dose', 'contraindication', 'interaction', 'quality_defect'
      ];
      if (!validIncidentTypes.includes(incidentType)) {
        res.status(400).json({ 
          error: 'Invalid incident type. Must be one of: ' + validIncidentTypes.join(', ')
        });
        return;
      }

      // Validate severity
      const validSeverities = ['no_harm', 'minor_harm', 'moderate_harm', 'severe_harm', 'death'];
      if (!validSeverities.includes(severity)) {
        res.status(400).json({ 
          error: 'Invalid severity. Must be one of: ' + validSeverities.join(', ')
        });
        return;
      }

      // Validate category
      const validCategories = ['prescribing', 'dispensing', 'administration', 'monitoring', 'patient_related', 'system_related'];
      if (!validCategories.includes(category)) {
        res.status(400).json({ 
          error: 'Invalid category. Must be one of: ' + validCategories.join(', ')
        });
        return;
      }

      // Validate jurisdiction
      const validJurisdictions = [
        'england', 'scotland', 'wales', 'northern_ireland', 'republic_of_ireland', 
        'isle_of_man', 'guernsey', 'jersey'
      ];
      if (!validJurisdictions.includes(jurisdiction)) {
        res.status(400).json({ 
          error: 'Invalid jurisdiction. Must be one of: ' + validJurisdictions.join(', ')
        });
        return;
      }

      // Validate dates
      const incidentDateTime = new Date(incidentDate);
      const discoveredDateTime = new Date(discoveredDate);
      
      if (isNaN(incidentDateTime.getTime()) || isNaN(discoveredDateTime.getTime())) {
        res.status(400).json({ error: 'Invalid date format' });
        return;
      }

      if (discoveredDateTime < incidentDateTime) {
        res.status(400).json({ error: 'Discovered date cannot be before incident date' });
        return;
      }

      // Validate intended/actual times if provided
      let intendedDateTime: Date | undefined;
      let actualDateTime: Date | undefined;

      if (intendedTime) {
        intendedDateTime = new Date(intendedTime);
        if (isNaN(intendedDateTime.getTime())) {
          res.status(400).json({ error: 'Invalid intended time format' });
          return;
        }
      }

      if (actualTime) {
        actualDateTime = new Date(actualTime);
        if (isNaN(actualDateTime.getTime())) {
          res.status(400).json({ error: 'Invalid actual time format' });
          return;
        }
      }

      const incidentData = {
        incidentType,
        severity,
        category,
        incidentDate: incidentDateTime,
        discoveredDate: discoveredDateTime,
        location,
        description,
        immediateActions,
        residentId,
        medicationId,
        prescriptionId,
        administrationId,
        intendedDose,
        actualDose,
        intendedRoute,
        actualRoute,
        intendedTime: intendedDateTime,
        actualTime: actualDateTime,
        clinicalSymptoms,
        vitalSigns,
        treatmentRequired,
        hospitalAdmission: hospitalAdmission || false,
        additionalMonitoring,
        witnessedBy,
        involvedStaff
      };

      const incident = await this.incidentService.reportIncident(
        incidentData,
        reportedBy,
        reporterRole,
        organizationId,
        jurisdiction,
        userId
      );

      res.status(201).json({
        message: 'Medication incident reported successfully',
        data: incident
      });
    } catch (error: unknown) {
      console.error('Error in reportIncident controller', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('not found')) {
        res.status(404).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to report medication incident' });
      }
    }
  }

  /**
   * Perform root cause analysis
   */
  async performRootCauseAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;
      const { incidentId } = req.params;

      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!incidentId) {
        res.status(400).json({ error: 'Incident ID is required' });
        return;
      }

      const {
        methodology,
        primaryCause,
        secondaryCauses,
        systemFailures,
        humanFactors,
        environmentalFactors,
        equipmentFactors,
        processFailures,
        contributingFactors,
        analysedBy
      } = req.body;

      // Validate required fields
      if (!methodology || !primaryCause || !analysedBy) {
        res.status(400).json({ 
          error: 'Missing required fields: methodology, primaryCause, analysedBy' 
        });
        return;
      }

      // Validate methodology
      const validMethodologies = ['fishbone', 'five_whys', 'fault_tree', 'barrier_analysis', 'timeline_analysis'];
      if (!validMethodologies.includes(methodology)) {
        res.status(400).json({ 
          error: 'Invalid methodology. Must be one of: ' + validMethodologies.join(', ')
        });
        return;
      }

      // Validate contributing factors if provided
      if (contributingFactors && Array.isArray(contributingFactors)) {
        const validCategories = ['human', 'system', 'environmental', 'equipment', 'process', 'communication', 'training', 'workload'];
        const validImpacts = ['low', 'medium', 'high'];

        for (const factor of contributingFactors) {
          if (!factor.category || !validCategories.includes(factor.category)) {
            res.status(400).json({ 
              error: 'Invalid contributing factor category. Must be one of: ' + validCategories.join(', ')
            });
            return;
          }
          if (!factor.impact || !validImpacts.includes(factor.impact)) {
            res.status(400).json({ 
              error: 'Invalid contributing factor impact. Must be one of: ' + validImpacts.join(', ')
            });
            return;
          }
        }
      }

      const analysisData = {
        methodology,
        primaryCause,
        secondaryCauses: secondaryCauses || [],
        systemFailures: systemFailures || [],
        humanFactors: humanFactors || [],
        environmentalFactors: environmentalFactors || [],
        equipmentFactors: equipmentFactors || [],
        processFailures: processFailures || [],
        contributingFactors: contributingFactors || []
      };

      const updatedIncident = await this.incidentService.performRootCauseAnalysis(
        incidentId,
        analysisData,
        analysedBy,
        organizationId,
        userId
      );

      res.json({
        message: 'Root cause analysis completed successfully',
        data: updatedIncident
      });
    } catch (error: unknown) {
      console.error('Error in performRootCauseAnalysis controller', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        params: req.params,
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('not found')) {
        res.status(404).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('closed incident')) {
        res.status(409).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to perform root cause analysis' });
      }
    }
  }

  /**
   * Submit regulatory notification
   */
  async submitRegulatoryNotification(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;
      const { incidentId } = req.params;

      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!incidentId) {
        res.status(400).json({ error: 'Incident ID is required' });
        return;
      }

      const {
        authority,
        notificationType,
        additionalDetails,
        submittedBy
      } = req.body;

      // Validate required fields
      if (!authority || !notificationType || !submittedBy) {
        res.status(400).json({ 
          error: 'Missing required fields: authority, notificationType, submittedBy' 
        });
        return;
      }

      // Validate authority
      const validAuthorities = [
        'cqc', 'care_inspectorate', 'ciw', 'rqia', 'hiqa', 'dhsc_iom', 
        'ghsc_guernsey', 'care_commission_jersey', 'mhra', 'imb'
      ];
      if (!validAuthorities.includes(authority)) {
        res.status(400).json({ 
          error: 'Invalid authority. Must be one of: ' + validAuthorities.join(', ')
        });
        return;
      }

      // Validate notification type
      const validNotificationTypes = [
        'statutory_notification', 'serious_incident', 'adverse_event', 'quality_alert', 'safety_notice'
      ];
      if (!validNotificationTypes.includes(notificationType)) {
        res.status(400).json({ 
          error: 'Invalid notification type. Must be one of: ' + validNotificationTypes.join(', ')
        });
        return;
      }

      const notificationData = {
        authority,
        notificationType,
        additionalDetails
      };

      const notification = await this.incidentService.submitRegulatoryNotification(
        incidentId,
        notificationData,
        submittedBy,
        organizationId,
        userId
      );

      res.status(201).json({
        message: 'Regulatory notification submitted successfully',
        data: notification
      });
    } catch (error: unknown) {
      console.error('Error in submitRegulatoryNotification controller', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        params: req.params,
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('not found')) {
        res.status(404).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('not valid for jurisdiction')) {
        res.status(400).json({ error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to submit regulatory notification' });
      }
    }
  }

  /**
   * Get incident trends and analysis
   */
  async getIncidentTrends(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const jurisdiction = req.query['jurisdiction'] as string;
      const timeframeDays = parseInt(req.query['timeframeDays'] as string) || 90;

      if (timeframeDays < 1 || timeframeDays > 365) {
        res.status(400).json({ 
          error: 'Timeframe days must be between 1 and 365' 
        });
        return;
      }

      // Validate jurisdiction if provided
      if (jurisdiction) {
        const validJurisdictions = [
          'england', 'scotland', 'wales', 'northern_ireland', 'republic_of_ireland', 
          'isle_of_man', 'guernsey', 'jersey'
        ];
        if (!validJurisdictions.includes(jurisdiction)) {
          res.status(400).json({ 
            error: 'Invalid jurisdiction. Must be one of: ' + validJurisdictions.join(', ')
          });
          return;
        }
      }

      const trends = await this.incidentService.analyzeIncidentTrends(
        organizationId,
        jurisdiction as MedicationIncident['jurisdiction'],
        timeframeDays
      );

      res.json({
        message: 'Incident trends retrieved successfully',
        data: {
          trends,
          timeframeDays,
          jurisdiction: jurisdiction || 'all'
        }
      });
    } catch (error: unknown) {
      console.error('Error in getIncidentTrends controller', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        query: req.query,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({ error: 'Failed to retrieve incident trends' });
    }
  }

  /**
   * Get incident statistics
   */
  async getIncidentStats(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const jurisdiction = req.query['jurisdiction'] as string;
      const timeframeDays = parseInt(req.query['timeframeDays'] as string) || 30;

      if (timeframeDays < 1 || timeframeDays > 365) {
        res.status(400).json({ 
          error: 'Timeframe days must be between 1 and 365' 
        });
        return;
      }

      // Validate jurisdiction if provided
      if (jurisdiction) {
        const validJurisdictions = [
          'england', 'scotland', 'wales', 'northern_ireland', 'republic_of_ireland', 
          'isle_of_man', 'guernsey', 'jersey'
        ];
        if (!validJurisdictions.includes(jurisdiction)) {
          res.status(400).json({ 
            error: 'Invalid jurisdiction. Must be one of: ' + validJurisdictions.join(', ')
          });
          return;
        }
      }

      const stats = await this.incidentService.getIncidentStats(
        organizationId,
        jurisdiction as MedicationIncident['jurisdiction'],
        timeframeDays
      );

      res.json({
        message: 'Incident statistics retrieved successfully',
        data: {
          ...stats,
          timeframeDays,
          jurisdiction: jurisdiction || 'all'
        }
      });
    } catch (error: unknown) {
      console.error('Error in getIncidentStats controller', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        query: req.query,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({ error: 'Failed to retrieve incident statistics' });
    }
  }

  /**
   * Get incidents with filtering and pagination
   */
  async getIncidents(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const page = parseInt(req.query['page'] as string) || 1;
      const limit = Math.min(parseInt(req.query['limit'] as string) || 20, 100);

      const filters: IncidentFilters = {};

      // Apply filters from query parameters
      if (req.query['incidentType']) {
        filters.incidentType = req.query['incidentType'] as string;
      }
      if (req.query['severity']) {
        filters.severity = req.query['severity'] as string;
      }
      if (req.query['category']) {
        filters.category = req.query['category'] as string;
      }
      if (req.query['status']) {
        filters.status = req.query['status'] as string;
      }
      if (req.query['location']) {
        filters.location = req.query['location'] as string;
      }
      if (req.query['medicationName']) {
        filters.medicationName = req.query['medicationName'] as string;
      }
      if (req.query['residentId']) {
        filters.residentId = req.query['residentId'] as string;
      }
      if (req.query['reportedBy']) {
        filters.reportedBy = req.query['reportedBy'] as string;
      }
      if (req.query['jurisdiction']) {
        filters.jurisdiction = req.query['jurisdiction'] as string;
      }
      if (req.query['requiresRegulatoryReporting'] !== undefined) {
        filters.requiresRegulatoryReporting = req.query['requiresRegulatoryReporting'] === 'true';
      }

      // Date filters
      if (req.query['dateFrom']) {
        filters.dateFrom = new Date(req.query['dateFrom'] as string);
        if (isNaN(filters.dateFrom.getTime())) {
          res.status(400).json({ error: 'Invalid dateFrom format' });
          return;
        }
      }
      if (req.query['dateTo']) {
        filters.dateTo = new Date(req.query['dateTo'] as string);
        if (isNaN(filters.dateTo.getTime())) {
          res.status(400).json({ error: 'Invalid dateTo format' });
          return;
        }
      }

      // Get incidents from service
      const result = await this.medicationIncidentService.getIncidents(
        filters,
        organizationId,
        page,
        limit
      );

      res.json({
        message: 'Incidents retrieved successfully',
        data: result
      });
    } catch (error: unknown) {
      console.error('Error in getIncidents controller', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        query: req.query,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({ error: 'Failed to retrieve incidents' });
    }
  }
}