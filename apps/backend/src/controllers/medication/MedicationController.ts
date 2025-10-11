/**
 * @fileoverview REST API controller for medication management operations including
 * @module Medication/MedicationController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description REST API controller for medication management operations including
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Medication Controller for WriteCareNotes Healthcare Management
 * @module MedicationController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description REST API controller for medication management operations including
 * CRUD operations, interaction checking, expiration tracking, and inventory management
 * across all British Isles jurisdictions.
 * 
 * @compliance
 * - England: CQC Medication Management Standards
 * - Scotland: Care Inspectorate Medication Guidelines
 * - Wales: CIW Medication Safety Requirements
 * - NorthernIreland: RQIA Medication Standards
 * - Republic ofIreland: HIQA Medication Management Framework
 * - Isle ofMan: DHSC Medication Guidelines
 * - Guernsey: Committee for Health & Social Care Standards
 * - Jersey: Care Commission Medication Requirements
 * - MHRA Good Distribution Practice Guidelines
 * - Human Medicines Regulations 2012
 * 
 * @security
 * - Role-based access control for all endpoints
 * - Input validation and sanitization
 * - Comprehensive audit logging
 * - Rate limiting and security headers
 */

import { Request, Response } from 'express';
import { MedicationService, MedicationData, MedicationFilters } from '../../services/medication/MedicationService';
import { logger } from '../../utils/logger';

/**
 * Controller class for medication management operations
 * Handles HTTP requests for medication CRUD operations, interaction checking,
 * and inventory management with comprehensive validation and error handling.
 */
export class MedicationController {
  privatemedicationService: MedicationService;

  const ructor() {
    this.medicationService = new MedicationService();
  }

  /**
   * Create a new medication
   */
  async createMedication(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;

      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const medicationData: MedicationData = {
        name: req.body['name'],
        genericName: req.body['genericName'],
        brandName: req.body['brandName'],
        dosageForm: req.body['dosageForm'],
        strength: req.body['strength'],
        unit: req.body['unit'],
        manufacturer: req.body['manufacturer'],
        ndcNumber: req.body['ndcNumber'],
        lotNumber: req.body['lotNumber'],
        expirationDate: req.body['expirationDate'] ? new Date(req.body['expirationDate']) : undefined,
        category: req.body["category"],
        therapeuticClass: req.body['therapeuticClass'],
        controlledSubstanceSchedule: req.body['controlledSubstanceSchedule'],
        fdaApproved: req.body['fdaApproved'] ?? true,
        blackBoxWarning: req.body['blackBoxWarning'],
        contraindications: req.body['contraindications'],
        sideEffects: req.body['sideEffects'],
        interactions: req.body['interactions'],
        storageRequirements: req.body['storageRequirements'],
        administrationInstructions: req.body['administrationInstructions'],
        isActive: req.body['isActive'] ?? true
      };

      // Validate required fields
      if (!medicationData.name || !medicationData.dosageForm || 
          !medicationData.strength || !medicationData.unit || !medicationData.category) {
        res.status(400).json({ 
          error: 'Missing requiredfields: name, dosageForm, strength, unit, category' 
        });
        return;
      }

      // Validate dosage form
      const validDosageForms = [
        'tablet', 'capsule', 'liquid', 'injection', 'cream', 'ointment', 
        'patch', 'inhaler', 'drops', 'suppository', 'powder', 'gel'
      ];
      if (!validDosageForms.includes(medicationData.dosageForm.toLowerCase())) {
        res.status(400).json({ 
          error: 'Invalid dosage form. Must be oneof: ' + validDosageForms.join(', ')
        });
        return;
      }

      // Validate category
      const validCategories = [
        'analgesic', 'antibiotic', 'antihypertensive', 'antidiabetic', 
        'anticoagulant', 'antidepressant', 'antipsychotic', 'anticonvulsant',
        'bronchodilator', 'diuretic', 'hormone', 'immunosuppressant',
        'vitamin', 'supplement', 'other'
      ];
      if (!validCategories.includes(medicationData.category.toLowerCase())) {
        res.status(400).json({ 
          error: 'Invalid category. Must be oneof: ' + validCategories.join(', ')
        });
        return;
      }

      // Validate expiration date if provided
      if (medicationData.expirationDate && isNaN(medicationData.expirationDate.getTime())) {
        res.status(400).json({ error: 'Invalid expiration date' });
        return;
      }

      const medication = await this.medicationService.createMedication(
        medicationData,
        organizationId,
        userId
      );

      res.status(201).json({
        message: 'Medication created successfully',
        data: medication
      });
    } catch (error: unknown) {
      console.error('Error in createMedication controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error.message : "Unknown error".includes('already exists')) {
        res.status(409).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else if (error instanceof Error ? error.message : "Unknown error".includes('Invalid')) {
        res.status(400).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to create medication' });
      }
    }
  }

  /**
   * Get medications with filtering and pagination
   */
  async getMedications(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const page = parseInt(req.query['page'] as string) || 1;
      const limit = Math.min(parseInt(req.query['limit'] as string) || 50, 100);

      const filters: MedicationFilters = {};

      // Apply filters from query parameters
      if (req.query['name']) {
        filters.name = req.query['name'] as string;
      }
      if (req.query['genericName']) {
        filters.genericName = req.query['genericName'] as string;
      }
      if (req.query['category']) {
        filters.category = req.query['category'] as string;
      }
      if (req.query['therapeuticClass']) {
        filters.therapeuticClass = req.query['therapeuticClass'] as string;
      }
      if (req.query['controlledSubstanceSchedule']) {
        filters.controlledSubstanceSchedule = req.query['controlledSubstanceSchedule'] as string;
      }
      if (req.query['fdaApproved'] !== undefined) {
        filters.fdaApproved = req.query['fdaApproved'] === 'true';
      }
      if (req.query['isActive'] !== undefined) {
        filters.isActive = req.query['isActive'] === 'true';
      }
      if (req.query['expiringBefore']) {
        filters.expiringBefore = new Date(req.query['expiringBefore'] as string);
        if (isNaN(filters.expiringBefore.getTime())) {
          res.status(400).json({ error: 'Invalid expiringBefore date format' });
          return;
        }
      }
      if (req.query['manufacturer']) {
        filters.manufacturer = req.query['manufacturer'] as string;
      }

      const result = await this.medicationService.getMedications(
        filters,
        organizationId,
        page,
        limit
      );

      res.json({
        message: 'Medications retrieved successfully',
        data: result
      });
    } catch (error: unknown) {
      console.error('Error in getMedications controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        query: req.query,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({ error: 'Failed to retrieve medications' });
    }
  }

  /**
   * Get a specific medication by ID
   */
  async getMedicationById(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const { id } = req.params;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!id) {
        res.status(400).json({ error: 'Medication ID is required' });
        return;
      }

      const medication = await this.medicationService.getMedicationById(id, organizationId);

      if (!medication) {
        res.status(404).json({ error: 'Medication not found' });
        return;
      }

      res.json({
        message: 'Medication retrieved successfully',
        data: medication
      });
    } catch (error: unknown) {
      console.error('Error in getMedicationById controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        params: req.params,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({ error: 'Failed to retrieve medication' });
    }
  }

  /**
   * Update a medication
   */
  async updateMedication(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;
      const { id } = req.params;

      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!id) {
        res.status(400).json({ error: 'Medication ID is required' });
        return;
      }

      const updates: Partial<MedicationData> = {};

      // Only include provided fields in updates
      if (req.body['name'] !== undefined) updates.name = req.body['name'];
      if (req.body['genericName'] !== undefined) updates.genericName = req.body['genericName'];
      if (req.body['brandName'] !== undefined) updates.brandName = req.body['brandName'];
      if (req.body['dosageForm'] !== undefined) updates.dosageForm = req.body['dosageForm'];
      if (req.body['strength'] !== undefined) updates.strength = req.body['strength'];
      if (req.body['unit'] !== undefined) updates.unit = req.body['unit'];
      if (req.body['manufacturer'] !== undefined) updates.manufacturer = req.body['manufacturer'];
      if (req.body['ndcNumber'] !== undefined) updates.ndcNumber = req.body['ndcNumber'];
      if (req.body['lotNumber'] !== undefined) updates.lotNumber = req.body['lotNumber'];
      if (req.body['expirationDate'] !== undefined) {
        updates.expirationDate = new Date(req.body['expirationDate']);
        if (isNaN(updates.expirationDate.getTime())) {
          res.status(400).json({ error: 'Invalid expiration date' });
          return;
        }
      }
      if (req.body["category"] !== undefined) updates.category = req.body["category"];
      if (req.body['therapeuticClass'] !== undefined) updates.therapeuticClass = req.body['therapeuticClass'];
      if (req.body['controlledSubstanceSchedule'] !== undefined) updates.controlledSubstanceSchedule = req.body['controlledSubstanceSchedule'];
      if (req.body['fdaApproved'] !== undefined) updates.fdaApproved = req.body['fdaApproved'];
      if (req.body['blackBoxWarning'] !== undefined) updates.blackBoxWarning = req.body['blackBoxWarning'];
      if (req.body['contraindications'] !== undefined) updates.contraindications = req.body['contraindications'];
      if (req.body['sideEffects'] !== undefined) updates.sideEffects = req.body['sideEffects'];
      if (req.body['interactions'] !== undefined) updates.interactions = req.body['interactions'];
      if (req.body['storageRequirements'] !== undefined) updates.storageRequirements = req.body['storageRequirements'];
      if (req.body['administrationInstructions'] !== undefined) updates.administrationInstructions = req.body['administrationInstructions'];
      if (req.body['isActive'] !== undefined) updates.isActive = req.body['isActive'];

      // Validate dosage form if being updated
      if (updates.dosageForm) {
        const validDosageForms = [
          'tablet', 'capsule', 'liquid', 'injection', 'cream', 'ointment', 
          'patch', 'inhaler', 'drops', 'suppository', 'powder', 'gel'
        ];
        if (!validDosageForms.includes(updates.dosageForm.toLowerCase())) {
          res.status(400).json({ 
            error: 'Invalid dosage form. Must be oneof: ' + validDosageForms.join(', ')
          });
          return;
        }
      }

      // Validate category if being updated
      if (updates.category) {
        const validCategories = [
          'analgesic', 'antibiotic', 'antihypertensive', 'antidiabetic', 
          'anticoagulant', 'antidepressant', 'antipsychotic', 'anticonvulsant',
          'bronchodilator', 'diuretic', 'hormone', 'immunosuppressant',
          'vitamin', 'supplement', 'other'
        ];
        if (!validCategories.includes(updates.category.toLowerCase())) {
          res.status(400).json({ 
            error: 'Invalid category. Must be oneof: ' + validCategories.join(', ')
          });
          return;
        }
      }

      const updatedMedication = await this.medicationService.updateMedication(
        id,
        updates,
        organizationId,
        userId
      );

      res.json({
        message: 'Medication updated successfully',
        data: updatedMedication
      });
    } catch (error: unknown) {
      console.error('Error in updateMedication controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        params: req.params,
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error.message : "Unknown error".includes('not found')) {
        res.status(404).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else if (error instanceof Error ? error.message : "Unknown error".includes('already exists')) {
        res.status(409).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else if (error instanceof Error ? error.message : "Unknown error".includes('Invalid')) {
        res.status(400).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to update medication' });
      }
    }
  }

  /** updateMedication(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;
      const { id } = req.params;

      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!id) {
        res.status(400).json({ error: 'Medication ID is required' });
        return;
      }

      const updates: Partial<MedicationData> = {};

      // Only include provided fields in updates
      if (req.body['name'] !== undefined) updates.name = req.body['name'];
      if (req.body['genericName'] !== undefined) updates.genericName = req.body['genericName'];
      if (req.body['brandName'] !== undefined) updates.brandName = req.body['brandName'];
      if (req.body['dosageForm'] !== undefined) updates.dosageForm = req.body['dosageForm'];
      if (req.body['strength'] !== undefined) updates.strength = req.body['strength'];
      if (req.body['unit'] !== undefined) updates.unit = req.body['unit'];
      if (req.body['manufacturer'] !== undefined) updates.manufacturer = req.body['manufacturer'];
      if (req.body['ndcNumber'] !== undefined) updates.ndcNumber = req.body['ndcNumber'];
      if (req.body['lotNumber'] !== undefined) updates.lotNumber = req.body['lotNumber'];
      if (req.body['expirationDate'] !== undefined) {
        updates.expirationDate = new Date(req.body['expirationDate']);
        if (isNaN(updates.expirationDate.getTime())) {
          res.status(400).json({ error: 'Invalid expiration date' });
          return;
        }
      }
      if (req.body["category"] !== undefined) updates.category = req.body["category"];
      if (req.body['therapeuticClass'] !== undefined) updates.therapeuticClass = req.body['therapeuticClass'];
      if (req.body['controlledSubstanceSchedule'] !== undefined) updates.controlledSubstanceSchedule = req.body['controlledSubstanceSchedule'];
      if (req.body['fdaApproved'] !== undefined) updates.fdaApproved = req.body['fdaApproved'];
      if (req.body['blackBoxWarning'] !== undefined) updates.blackBoxWarning = req.body['blackBoxWarning'];
      if (req.body['contraindications'] !== undefined) updates.contraindications = req.body['contraindications'];
      if (req.body['sideEffects'] !== undefined) updates.sideEffects = req.body['sideEffects'];
      if (req.body['interactions'] !== undefined) updates.interactions = req.body['interactions'];
      if (req.body['storageRequirements'] !== undefined) updates.storageRequirements = req.body['storageRequirements'];
      if (req.body['administrationInstructions'] !== undefined) updates.administrationInstructions = req.body['administrationInstructions'];
      if (req.body['isActive'] !== undefined) updates.isActive = req.body['isActive'];

      // Validate dosage form if being updated
      if (updates.dosageForm) {
        const validDosageForms = [
          'tablet', 'capsule', 'liquid', 'injection', 'cream', 'ointment', 
          'patch', 'inhaler', 'drops', 'suppository', 'powder', 'gel'
        ];
        if (!validDosageForms.includes(updates.dosageForm.toLowerCase())) {
          res.status(400).json({ 
            error: 'Invalid dosage form. Must be oneof: ' + validDosageForms.join(', ')
          });
          return;
        }
      }

      // Validate category if being updated
      if (updates.category) {
        const validCategories = [
          'analgesic', 'antibiotic', 'antihypertensive', 'antidiabetic', 
          'anticoagulant', 'antidepressant', 'antipsychotic', 'anticonvulsant',
          'bronchodilator', 'diuretic', 'hormone', 'immunosuppressant',
          'vitamin', 'supplement', 'other'
        ];
        if (!validCategories.includes(updates.category.toLowerCase())) {
          res.status(400).json({ 
            error: 'Invalid category. Must be oneof: ' + validCategories.join(', ')
          });
          return;
        }
      }

      const updatedMedication = await this.medicationService.updateMedication(
        id,
        updates,
        organizationId,
        userId
      );

      res.json({
        message: 'Medication updated successfully',
        data: updatedMedication
      });
    } catch (error: unknown) {
      console.error('Error in updateMedication controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        params: req.params,
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error.message : "Unknown error".includes('not found')) {
        res.status(404).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else if (error instanceof Error ? error.message : "Unknown error".includes('already exists')) {
        res.status(409).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else if (error instanceof Error ? error.message : "Unknown error".includes('Invalid')) {
        res.status(400).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to update medication' });
      }
    }
  }

  /**
   * Deactivate a medication
   */
  async deactivateMedication(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;
      const { id } = req.params;

      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!id) {
        res.status(400).json({ error: 'Medication ID is required' });
        return;
      }

      const reason = req.body['reason'];

      const deactivatedMedication = await this.medicationService.deactivateMedication(
        id,
        organizationId,
        userId,
        reason
      );

      res.json({
        message: 'Medication deactivated successfully',
        data: deactivatedMedication
      });
    } catch (error: unknown) {
      console.error('Error in deactivateMedication controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        params: req.params,
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error.message : "Unknown error".includes('not found')) {
        res.status(404).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else if (error instanceof Error ? error.message : "Unknown error".includes('already inactive')) {
        res.status(409).json({ error: error instanceof Error ? error.message : "Unknown error" });
      } else {
        res.status(500).json({ error: 'Failed to deactivate medication' });
      }
    }
  }

  /**
   * Check medication interactions
   */
  async checkMedicationInteractions(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const medicationIds = req.body['medicationIds'];

      if (!Array.isArray(medicationIds) || medicationIds.length < 2) {
        res.status(400).json({ 
          error: 'At least 2 medication IDs are required for interaction checking' 
        });
        return;
      }

      if (medicationIds.length > 20) {
        res.status(400).json({ 
          error: 'Maximum 20 medications can be checked at once' 
        });
        return;
      }

      const interactions = await this.medicationService.checkMedicationInteractions(
        medicationIds,
        organizationId
      );

      res.json({
        message: 'Medication interactions checked successfully',
        data: {
          medicationIds,
          interactions,
          interactionCount: interactions.length,
          hasInteractions: interactions.length > 0
        }
      });
    } catch (error: unknown) {
      console.error('Error in checkMedicationInteractions controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        body: req.body,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({ error: 'Failed to check medication interactions' });
    }
  }

  /**
   * Get expiring medications
   */
  async getExpiringMedications(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const daysAhead = parseInt(req.query['daysAhead'] as string) || 30;

      if (daysAhead < 1 || daysAhead > 365) {
        res.status(400).json({ 
          error: 'Days ahead must be between 1 and 365' 
        });
        return;
      }

      const expiringMedications = await this.medicationService.getExpiringMedications(
        organizationId,
        daysAhead
      );

      res.json({
        message: 'Expiring medications retrieved successfully',
        data: {
          medications: expiringMedications,
          count: expiringMedications.length,
          daysAhead
        }
      });
    } catch (error: unknown) {
      console.error('Error in getExpiringMedications controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        query: req.query,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({ error: 'Failed to retrieve expiring medications' });
    }
  }

  /**
   * Search medications
   */
  async searchMedications(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      const { term } = req.params;
      const limit = parseInt(req.query['limit'] as string) || 20;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!term || term.trim().length < 2) {
        res.status(400).json({ 
          error: 'Search term must be at least 2 characters long' 
        });
        return;
      }

      const medications = await this.medicationService.searchMedications(
        term,
        organizationId,
        limit
      );

      res.json({
        message: 'Medication search completed successfully',
        data: {
          medications,
          count: medications.length,
          searchTerm: term
        }
      });
    } catch (error: unknown) {
      console.error('Error in searchMedications controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        params: req.params,
        query: req.query,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({ error: 'Failed to search medications' });
    }
  }

  /**
   * Get medication statistics
   */
  async getMedicationStatistics(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const statistics = await this.medicationService.getMedicationStatistics(organizationId);

      res.json({
        message: 'Medication statistics retrieved successfully',
        data: statistics
      });
    } catch (error: unknown) {
      console.error('Error in getMedicationStatistics controller', {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({ error: 'Failed to retrieve medication statistics' });
    }
  }
}
