/**
 * @fileoverview Frontend service for medication administration API interactions
 * @module MedicationAdministrationService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Frontend service for medication administration API interactions
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Medication Administration Service for WriteCareNotes Frontend
 * @module medicationAdministrationService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Frontend service for medication administration API interactions
 * with comprehensive error handling and data transformation.
 */

import { apiClient } from './apiClient';

interface PendingMedication {
  id: string;
  prescriptionId: string;
  medicationName: string;
  dosage: string;
  route: string;
  scheduledTime: Date;
  isOverdue: boolean;
  isPRN: boolean;
  lastAdministered?: Date;
  safetyAlerts: SafetyAlert[];
}

interface SafetyAlert {
  id: string;
  type: 'interaction' | 'allergy' | 'contraindication' | 'dosage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: string;
  requiresAction: boolean;
}

interface AdministrationRequest {
  medicationId: string;
  residentId: string;
  organizationId: string;
  dosageGiven: string;
  routeUsed: string;
  administrationTime: Date;
  administeredBy: string;
  witnessedBy?: string;
  notes?: string;
  sideEffectsObserved?: string[];
}

interface RefusalRequest {
  medicationId: string;
  residentId: string;
  organizationId: string;
  refusalReason: string;
  refusalTime: Date;
}

interface AdministrationHistory {
  id: string;
  medicationName: string;
  dosage: string;
  route: string;
  administrationTime: Date;
  administeredBy: string;
  status: 'completed' | 'refused' | 'missed';
}

class MedicationAdministrationService {
  /**
   * Get pending medications for a resident
   */
  async getPendingMedications(residentId: string, organizationId: string): Promise<PendingMedication[]> {
    try {
      const response = await apiClient.get(`/api/v1/medication-administration/pending`, {
        params: { residentId, organizationId }
      });

      return response.data.map((item: any) => ({
        ...item,
        scheduledTime: new Date(item.scheduledTime),
        lastAdministered: item.lastAdministered ? new Date(item.lastAdministered) : undefined
      }));
    } catch (error: unknown) {
      throw new Error('Failed to fetch pending medications');
    }
  }

  /**
   * Get PRN medications for a resident
   */
  async getPRNMedications(residentId: string, organizationId: string): Promise<PendingMedication[]> {
    try {
      const response = await apiClient.get(`/api/v1/medication-administration/prn`, {
        params: { residentId, organizationId }
      });

      return response.data.map((item: any) => ({
        ...item,
        scheduledTime: new Date(item.scheduledTime),
        lastAdministered: item.lastAdministered ? new Date(item.lastAdministered) : undefined
      }));
    } catch (error: unknown) {
      throw new Error('Failed to fetch PRN medications');
    }
  }

  /**
   * Get administration history for a resident
   */
  async getAdministrationHistory(
    residentId: string, 
    organizationId: string, 
    options: { limit?: number; offset?: number } = {}
  ): Promise<AdministrationHistory[]> {
    try {
      const response = await apiClient.get(`/api/v1/medication-administration/history`, {
        params: { residentId, organizationId, ...options }
      });

      return response.data.map((item: any) => ({
        ...item,
        administrationTime: new Date(item.administrationTime)
      }));
    } catch (error: unknown) {
      throw new Error('Failed to fetch administration history');
    }
  }

  /**
   * Record medication administration
   */
  async recordAdministration(request: AdministrationRequest): Promise<{ id: string }> {
    try {
      const response = await apiClient.post('/api/v1/medication-administration/record', request);
      return response.data;
    } catch (error: unknown) {
      throw new Error('Failed to record medication administration');
    }
  }

  /**
   * Record medication refusal
   */
  async recordRefusal(request: RefusalRequest): Promise<void> {
    try {
      await apiClient.post('/api/v1/medication-administration/refusal', request);
    } catch (error: unknown) {
      throw new Error('Failed to record medication refusal');
    }
  }

  /**
   * Get medication details by ID
   */
  async getMedicationDetails(medicationId: string, organizationId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/v1/medications/${medicationId}`, {
        params: { organizationId }
      });
      return response.data;
    } catch (error: unknown) {
      throw new Error('Failed to fetch medication details');
    }
  }
}

export const medicationAdministrationService = new MedicationAdministrationService();
