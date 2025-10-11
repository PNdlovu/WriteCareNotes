import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Medication Administration Hook for WriteCareNotes
 * @module useMedicationAdministration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Hook for managing medication administration workflows,
 * including due medications, PRN requests, and administration recording.
 */

import { useState, useEffect, useCallback } from 'react';
import { medicationAdministrationService } from '../services/medicationAdministrationService';

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

interface AdministrationRecord {
  medicationId: string;
  dosageGiven: string;
  routeUsed: string;
  administrationTime: Date;
  administeredBy: string;
  witnessedBy?: string;
  notes?: string;
  refusalReason?: string;
  sideEffectsObserved?: string[];
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

/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const useMedicationAdministration = (residentId: string, organizationId: string) => {
  const [pendingMedications, setPendingMedications] = useState<PendingMedication[]>([]);
  const [prnMedications, setPrnMedications] = useState<PendingMedication[]>([]);
  const [administrationHistory, setAdministrationHistory] = useState<AdministrationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMedications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [pending, prn, history] = await Promise.all([
        medicationAdministrationService.getPendingMedications(residentId, organizationId),
        medicationAdministrationService.getPRNMedications(residentId, organizationId),
        medicationAdministrationService.getAdministrationHistory(residentId, organizationId, { limit: 20 })
      ]);

      setPendingMedications(pending);
      setPrnMedications(prn);
      setAdministrationHistory(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch medications');
    } finally {
      setLoading(false);
    }
  }, [residentId, organizationId]);

  const recordAdministration = useCallback(async (record: AdministrationRecord) => {
    try {
      const result = await medicationAdministrationService.recordAdministration({
        ...record,
        residentId,
        organizationId
      });

      // Refresh medications after successful administration
      await fetchMedications();

      return result;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to record administration');
    }
  }, [residentId, organizationId, fetchMedications]);

  const recordRefusal = useCallback(async (medicationId: string, reason: string) => {
    try {
      await medicationAdministrationService.recordRefusal({
        medicationId,
        residentId,
        organizationId,
        refusalReason: reason,
        refusalTime: new Date()
      });

      // Refresh medications after recording refusal
      await fetchMedications();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to record refusal');
    }
  }, [residentId, organizationId, fetchMedications]);

  const refreshMedications = useCallback(() => {
    return fetchMedications();
  }, [fetchMedications]);

  // Initial load
  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchMedications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMedications]);

  return {
    pendingMedications,
    prnMedications,
    administrationHistory,
    loading,
    error,
    recordAdministration,
    recordRefusal,
    refreshMedications
  };
};