/**
 * @fileoverview REST API controller for controlled substances management with dual witness
 * @module Medication/ControlledSubstancesController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description REST API controller for controlled substances management with dual witness
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Controlled Substances Controller for WriteCareNotes Healthcare Management
 * @module ControlledSubstancesController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description REST API controller for controlled substances management with dual witness
 * verification, custody chain tracking, stock reconciliation, and regulatory compliance
 * across all British Isles jurisdictions.
 * 
 * @compliance
 * - England: MHRA Controlled Drugs Regulations 2013, CQC Standards
 * - Scotland: MHRA Controlled Drugs Regulations 2013, Care Inspectorate Standards
 * - Wales: MHRA Controlled Drugs Regulations 2013, CIW Standards
 * - Northern Ireland: MHRA Controlled Drugs Regulations 2013, RQIA Standards
 * - Republic of Ireland: IMB Controlled Drugs Regulations, HIQA Standards
 * - Isle of Man: DHSC Controlled Substances Guidelines
 * - Guernsey: Committee for Health & Social Care Controlled Drugs Policy
 * - Jersey: Care Commission Controlled Substances Requirements
 * - Misuse of Drugs Act 1971
 * - Controlled Drugs (Supervision of Management and Use) Regulations 2013
 * 
 * @security
 * - Dual witness verification for all operations
 * - Cryptographic custody chain tracking
 * - Role-based access control with enhanced permissions
 * - Comprehensive audit logging for regulatory compliance
 * - Real-time discrepancy detection and alerts
 */

import { Request, Response } from 'express';
import { 
  ControlledSubstancesService, 
  ControlledDrugRegisterEntry, 
  ControlledDrugFilters,
  WitnessVerification 
} from '../../services/medication/ControlledSubstancesService';
import { logger } from '../../utils/logger';

/**
 * Controller class for controlled substances management operations
 * Handles HTTP requests for controlled drug registration, administration recording,
 * stock reconciliation, and destruction with dual witness verification and
 * comprehensive regulatory compliance across all British Isles jurisdictions.
 */
export class ControlledSubstancesController {
  privatecontrolledSubstancesService: ControlledSubstancesService;

  constructor() {
    this.controlledSubstancesService = new ControlledSubstancesService();
  }

  /**
   * Register new controlled drug stock
   */
  async registerControlledDrug(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const {
        medicationId,
        medicationName,
        schedule,
        batchNumber,
        expiryDate,
        supplierName,
        supplierLicense,
        receivedDate,
        receivedQuantity,
        receivedBy,
        witnessedBy,
        storageLocation,
        primaryWitness,
        secondaryWitness
      } = req.body;

      // Validate required fields
      if (!medicationId || !medicationName || !schedule || !batchNumber || 
          !expiryDate || !supplierName || !supplierLicense || !receivedDate || 
          !receivedQuantity || !receivedBy || !witnessedBy || !storageLocation ||
          !primaryWitness || !secondaryWitness) {
        res.status(400).json({ 
          error: 'Missing required fields for controlled drug registration' 
        });
        return;
      }

      // Validate schedule
      const validSchedules = ['I', 'II', 'III', 'IV', 'V'];
      if (!validSchedules.includes(schedule)) {
        res.status(400).json({ 
          error: 'Invalid controlled substance schedule. Must be I, II, III, IV, or V' 
        });
        return;
      }

      // Validate quantity
      if (receivedQuantity <= 0) {
        res.status(400).json({ error: 'Received quantity must be greater than 0' });
        return;
      }

      // Validate dates
      const expiryDateTime = new Date(expiryDate);
      const receivedDateTime = new Date(receivedDate);
      
      if (isNaN(expiryDateTime.getTime()) || isNaN(receivedDateTime.getTime())) {
        res.status(400).json({ error: 'Invalid date format' });
        return;
      }

      if (expiryDateTime <= receivedDateTime) {
        res.status(400).json({ error: 'Expiry date must be after received date' });
        return;
      }

      // Validate witness verifications
      constprimaryWitnessVerification: WitnessVerification = {
        witnessId: primaryWitness.witnessId,
        witnessName: primaryWitness.witnessName,
        witnessRole: primaryWitness.witnessRole,
        witnessSignature: primaryWitness.witnessSignature,
        biometricVerification: primaryWitness.biometricVerification,
        verificationTimestamp: new Date(primaryWitness.verificationTimestamp),
        deviceId: primaryWitness.deviceId,
        ipAddress: req.ip
      };

      constsecondaryWitnessVerification: WitnessVerification = {
        witnessId: secondaryWitness.witnessId,
        witnessName: secondaryWitness.witnessName,
        witnessRole: secondaryWitness.witnessRole,
        witnessSignature: secondaryWitness.witnessSignature,
        biometricVerification: secondaryWitness.biometricVerification,
        verificationTimestamp: new Date(secondaryWitness.verificationTimestamp),
        deviceId: secondaryWitness.deviceId,
        ipAddress: req.ip
      };

      const registerData = {
        medicationId,
        medicationName,
        schedule,
        batchNumber,
        expiryDate: expiryDateTime,
        supplierName,
        supplierLicense,
        receivedDate: receivedDateTime,
        receivedQuantity,
        receivedBy,
        witnessedBy,
        storageLocation
      };

      const registerEntry = await this.controlledSubstancesService.registerControlledDrug(
        registerData,
        primaryWitnessVerification,
        secondaryWitnessVerification,
        organizationId,
        userId
      );

      res.status(201).json({
        message: 'Controlled drug registered successfully',
        data: registerEntry
      });
    } catch (error: unknown) {
      console.error('Error in registerControlledDrug controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error.message : "Unknown error".includes('not found')) {
        res.status(404).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else if (error instanceof Error ? error.message : "Unknown error".includes('not a controlled substance')) {
        res.status(400).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else if (error instanceof Error ? error.message : "Unknown error".includes('witnesses must be different')) {
        res.status(400).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else if (error instanceof Error ? error.message : "Unknown error".includes('Invalid supplier license')) {
        res.status(400).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to register controlled drug' });
      }
    }
  }

  /**
   * Record controlled drug administration
   */
  async recordAdministration(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;
      const { registerId } = req.params;

      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!registerId) {
        res.status(400).json({ error: 'Register ID is required' });
        return;
      }

      const {
        residentId,
        prescriptionId,
        administrationId,
        quantity,
        administrationDate,
        notes,
        primaryWitness,
        secondaryWitness
      } = req.body;

      // Validate required fields
      if (!residentId || !prescriptionId || !administrationId || !quantity || 
          !administrationDate || !primaryWitness || !secondaryWitness) {
        res.status(400).json({ 
          error: 'Missing required fields for controlled drug administration' 
        });
        return;
      }

      // Validate quantity
      if (quantity <= 0) {
        res.status(400).json({ error: 'Administration quantity must be greater than 0' });
        return;
      }

      // Validate administration date
      const adminDateTime = new Date(administrationDate);
      if (isNaN(adminDateTime.getTime())) {
        res.status(400).json({ error: 'Invalid administration date format' });
        return;
      }

      // Validate witness verifications
      constprimaryWitnessVerification: WitnessVerification = {
        witnessId: primaryWitness.witnessId,
        witnessName: primaryWitness.witnessName,
        witnessRole: primaryWitness.witnessRole,
        witnessSignature: primaryWitness.witnessSignature,
        biometricVerification: primaryWitness.biometricVerification,
        verificationTimestamp: new Date(primaryWitness.verificationTimestamp),
        deviceId: primaryWitness.deviceId,
        ipAddress: req.ip
      };

      constsecondaryWitnessVerification: WitnessVerification = {
        witnessId: secondaryWitness.witnessId,
        witnessName: secondaryWitness.witnessName,
        witnessRole: secondaryWitness.witnessRole,
        witnessSignature: secondaryWitness.witnessSignature,
        biometricVerification: secondaryWitness.biometricVerification,
        verificationTimestamp: new Date(secondaryWitness.verificationTimestamp),
        deviceId: secondaryWitness.deviceId,
        ipAddress: req.ip
      };

      const administrationData = {
        residentId,
        prescriptionId,
        administrationId,
        quantity,
        administrationDate: adminDateTime,
        notes
      };

      const transaction = await this.controlledSubstancesService.recordControlledDrugAdministration(
        registerId,
        administrationData,
        primaryWitnessVerification,
        secondaryWitnessVerification,
        organizationId,
        userId
      );

      res.status(201).json({
        message: 'Controlled drug administration recorded successfully',
        data: transaction
      });
    } catch (error: unknown) {
      console.error('Error in recordAdministration controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        params: req.params,
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error.message : "Unknown error".includes('not found')) {
        res.status(404).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else if (error instanceof Error ? error.message : "Unknown error".includes('Insufficient stock')) {
        res.status(409).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else if (error instanceof Error ? error.message : "Unknown error".includes('does not match')) {
        res.status(400).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else if (error instanceof Error ? error.message : "Unknown error".includes('witnesses must be different')) {
        res.status(400).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to record controlled drug administration' });
      }
    }
  }

  /**
   * Perform stock reconciliation
   */
  async performReconciliation(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;
      const { registerId } = req.params;

      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!registerId) {
        res.status(400).json({ error: 'Register ID is required' });
        return;
      }

      const {
        actualStock,
        reconciledBy,
        witnessedBy,
        notes
      } = req.body;

      // Validate required fields
      if (actualStock === undefined || !reconciledBy || !witnessedBy) {
        res.status(400).json({ 
          error: 'Missing required fields: actualStock, reconciledBy, witnessedBy' 
        });
        return;
      }

      // Validate actual stock
      if (actualStock < 0) {
        res.status(400).json({ error: 'Actual stock cannot be negative' });
        return;
      }

      // Validate that reconciler and witness are different
      if (reconciledBy === witnessedBy) {
        res.status(400).json({ error: 'Reconciler and witness must be different individuals' });
        return;
      }

      const reconciliation = await this.controlledSubstancesService.performStockReconciliation(
        registerId,
        actualStock,
        reconciledBy,
        witnessedBy,
        notes,
        organizationId,
        userId
      );

      res.json({
        message: 'Stock reconciliation completed successfully',
        data: reconciliation
      });
    } catch (error: unknown) {
      console.error('Error in performReconciliation controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        params: req.params,
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error.message : "Unknown error".includes('not found')) {
        res.status(404).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to perform stock reconciliation' });
      }
    }
  }

  /**
   * Record controlled drug destruction
   */
  async recordDestruction(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;
      const { registerId } = req.params;

      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!registerId) {
        res.status(400).json({ error: 'Register ID is required' });
        return;
      }

      const {
        quantity,
        reason,
        destructionMethod,
        destructionLocation,
        destructionDate,
        notes,
        witness1,
        witness2,
        supervisorId
      } = req.body;

      // Validate required fields
      if (!quantity || !reason || !destructionMethod || !destructionLocation || 
          !destructionDate || !witness1 || !witness2 || !supervisorId) {
        res.status(400).json({ 
          error: 'Missing required fields for controlled drug destruction' 
        });
        return;
      }

      // Validate quantity
      if (quantity <= 0) {
        res.status(400).json({ error: 'Destruction quantity must be greater than 0' });
        return;
      }

      // Validate reason
      const validReasons = ['expired', 'damaged', 'recalled', 'patient_deceased', 'discontinued', 'other'];
      if (!validReasons.includes(reason)) {
        res.status(400).json({ 
          error: 'Invalid destruction reason. Must be one of: ' + validReasons.join(', ')
        });
        return;
      }

      // Validate destruction date
      const destructDateTime = new Date(destructionDate);
      if (isNaN(destructDateTime.getTime())) {
        res.status(400).json({ error: 'Invalid destruction date format' });
        return;
      }

      // Validate witness verifications
      constwitness1Verification: WitnessVerification = {
        witnessId: witness1.witnessId,
        witnessName: witness1.witnessName,
        witnessRole: witness1.witnessRole,
        witnessSignature: witness1.witnessSignature,
        biometricVerification: witness1.biometricVerification,
        verificationTimestamp: new Date(witness1.verificationTimestamp),
        deviceId: witness1.deviceId,
        ipAddress: req.ip
      };

      constwitness2Verification: WitnessVerification = {
        witnessId: witness2.witnessId,
        witnessName: witness2.witnessName,
        witnessRole: witness2.witnessRole,
        witnessSignature: witness2.witnessSignature,
        biometricVerification: witness2.biometricVerification,
        verificationTimestamp: new Date(witness2.verificationTimestamp),
        deviceId: witness2.deviceId,
        ipAddress: req.ip
      };

      const destructionData = {
        quantity,
        reason,
        destructionMethod,
        destructionLocation,
        destructionDate: destructDateTime,
        notes
      };

      const destruction = await this.controlledSubstancesService.recordControlledDrugDestruction(
        registerId,
        destructionData,
        witness1Verification,
        witness2Verification,
        supervisorId,
        organizationId,
        userId
      );

      res.status(201).json({
        message: 'Controlled drug destruction recorded successfully',
        data: destruction
      });
    } catch (error: unknown) {
      console.error('Error in recordDestruction controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        params: req.params,
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error.message : "Unknown error".includes('not found')) {
        res.status(404).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else if (error instanceof Error ? error.message : "Unknown error".includes('Insufficient stock')) {
        res.status(409).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else if (error instanceof Error ? error.message : "Unknown error".includes('witnesses must be different')) {
        res.status(400).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to record controlled drug destruction' });
      }
    }
  }

  /**
   * Get controlled drug register
   */
  async getRegister(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const page = parseInt(req.query['page'] as string) || 1;
      const limit = Math.min(parseInt(req.query['limit'] as string) || 50, 100);

      constfilters: ControlledDrugFilters = {};

      // Apply filters from query parameters
      if (req.query['schedule']) {
        filters.schedule = req.query['schedule'] as string;
      }
      if (req.query['medicationName']) {
        filters.medicationName = req.query['medicationName'] as string;
      }
      if (req.query['batchNumber']) {
        filters.batchNumber = req.query['batchNumber'] as string;
      }
      if (req.query['storageLocation']) {
        filters.storageLocation = req.query['storageLocation'] as string;
      }
      if (req.query['lowStock'] !== undefined) {
        filters.lowStock = req.query['lowStock'] === 'true';
      }
      if (req.query['expiringWithinDays']) {
        filters.expiringWithinDays = parseInt(req.query['expiringWithinDays'] as string);
      }
      if (req.query['hasDiscrepancies'] !== undefined) {
        filters.hasDiscrepancies = req.query['hasDiscrepancies'] === 'true';
      }
      if (req.query['lastReconciliationBefore']) {
        filters.lastReconciliationBefore = new Date(req.query['lastReconciliationBefore'] as string);
        if (isNaN(filters.lastReconciliationBefore.getTime())) {
          res.status(400).json({ error: 'Invalid lastReconciliationBefore date format' });
          return;
        }
      }
      if (req.query['isActive'] !== undefined) {
        filters.isActive = req.query['isActive'] === 'true';
      }

      const result = await this.controlledSubstancesService.getControlledDrugRegister(
        filters,
        organizationId,
        page,
        limit
      );

      res.json({
        message: 'Controlled drug register retrieved successfully',
        data: result
      });
    } catch (error: unknown) {
      console.error('Error in getRegister controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        query: req.query,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({ error: 'Failed to retrieve controlled drug register' });
    }
  }

  /**
   * Get controlled drug statistics
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const stats = await this.controlledSubstancesService.getControlledDrugStats(organizationId);

      res.json({
        message: 'Controlled drug statistics retrieved successfully',
        data: stats
      });
    } catch (error: unknown) {
      console.error('Error in getStats controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({ error: 'Failed to retrieve controlled drug statistics' });
    }
  }
}
