import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Custom React hook for Controlled Substances Register functionality
 * @module useControlledSubstances
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Provides comprehensive controlled substances management functionality
 * including real-time stock tracking, compliance monitoring, transaction processing,
 * and regulatory reporting. Implements MHRA regulations and CQC compliance.
 * 
 * @example
 * // Usage in ControlledSubstancesRegister component
 * const {
 *   substances,
 *   transactions,
 *   complianceAlerts,
 *   loading,
 *   error,
 *   recordTransaction,
 *   performReconciliation,
 *   acknowledgeAlert
 * } = useControlledSubstances(organizationId);
 * 
 * @compliance
 * - MHRA Controlled Drugs Regulations
 * - CQC Medication Management Standards
 * - Care Inspectorate Scotland Guidelines
 * - CIW Wales Controlled Substances Requirements
 * - RQIA Northern Ireland Standards
 * 
 * @security
 * - Dual witness verification for all transactions
 * - Tamper-evident audit logging
 * - Real-time compliance monitoring
 * - Encrypted data transmission
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../services/apiClient';

// Types and Interfaces
interface ControlledSubstance {
  id: string;
  name: string;
  schedule: 'CD1' | 'CD2' | 'CD3' | 'CD4' | 'CD5';
  strength: string;
  formulation: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unit: string;
  supplier: string;
  licenseNumber: string;
  expiryDate: Date;
  batchNumber: string;
  lastReconciliation: Date;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired' | 'quarantined';
  location: string;
  safeStorageVerified: boolean;
  lastAudit: Date;
  complianceStatus: 'compliant' | 'warning' | 'violation';
  createdAt: Date;
  updatedAt: Date;
}

interface StockTransaction {
  id: string;
  substanceId: string;
  type: 'receipt' | 'administration' | 'disposal' | 'transfer' | 'adjustment' | 'destruction';
  quantity: number;
  runningBalance: number;
  timestamp: Date;
  primaryWitness: {
    id: string;
    name: string;
    role: string;
    signature: string;
  };
  secondaryWitness?: {
    id: string;
    name: string;
    role: string;
    signature: string;
  };
  residentId?: string;
  residentName?: string;
  prescriptionId?: string;
  reason?: string;
  notes?: string;
  batchNumber?: string;
  expiryDate?: Date;
  supplier?: string;
  invoiceNumber?: string;
  destructionMethod?: string;
  destructionWitnessId?: string;
  complianceVerified: boolean;
  auditTrailId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ComplianceAlert {
  id: string;
  type: 'stock_discrepancy' | 'missing_witness' | 'expired_stock' | 'audit_overdue' | 'license_expiry' | 'storage_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  substanceId?: string;
  substanceName?: string;
  message: string;
  details: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  actionRequired: string;
  regulatoryImplication: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ReconciliationRecord {
  id: string;
  date: Date;
  performedBy: string;
  witnessedBy: string;
  substancesChecked: number;
  discrepanciesFound: number;
  status: 'complete' | 'pending' | 'discrepancies_found';
  notes: string;
  nextDueDate: Date;
  complianceScore: number;
  createdAt: Date;
  updatedAt: Date;
}

interface TransactionRequest {
  substanceId: string;
  type: StockTransaction['type'];
  quantity: number;
  primaryWitness: {
    id: string;
    name: string;
    role: string;
    signature: string;
  };
  secondaryWitness?: {
    id: string;
    name: string;
    role: string;
    signature: string;
  };
  residentId?: string;
  prescriptionId?: string;
  reason?: string;
  notes?: string;
  batchNumber?: string;
  expiryDate?: Date;
  supplier?: string;
  invoiceNumber?: string;
  destructionMethod?: string;
  destructionWitnessId?: string;
}

interface ReconciliationRequest {
  performedBy: string;
  witnessedBy: string;
  notes?: string;
  substanceChecks: {
    substanceId: string;
    expectedStock: number;
    actualStock: number;
    discrepancyReason?: string;
  }[];
}

interface UseControlledSubstancesOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealTimeUpdates?: boolean;
  includeHistoricalData?: boolean;
}

interface UseControlledSubstancesReturn {
  // Data
  substances: ControlledSubstance[];
  transactions: StockTransaction[];
  complianceAlerts: ComplianceAlert[];
  reconciliationRecords: ReconciliationRecord[];
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  recordTransaction: (request: TransactionRequest) => Promise<StockTransaction>;
  performReconciliation: (request: ReconciliationRequest) => Promise<ReconciliationRecord>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string, resolution: string) => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Computed values
  complianceMetrics: {
    total: number;
    compliant: number;
    warnings: number;
    violations: number;
    lowStock: number;
    expired: number;
    complianceRate: number;
  };
  
  // Filters and search
  filteredSubstances: ControlledSubstance[];
  setScheduleFilter: (schedule: string) => void;
  setStatusFilter: (status: string) => void;
  setSearchTerm: (term: string) => void;
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
export const useControlledSubstances = (
  organizationId: string,
  options: UseControlledSubstancesOptions = {}
): UseControlledSubstancesReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    enableRealTimeUpdates = true,
    includeHistoricalData = true
  } = options;

  // State
  const [substances, setSubstances] = useState<ControlledSubstance[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlert[]>([]);
  const [reconciliationRecords, setReconciliationRecords] = useState<ReconciliationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [scheduleFilter, setScheduleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Load controlled substances data
  const loadData = useCallback(async () => {
    if (!organizationId) return;

    try {
      setError(null);
      
      const params = new URLSearchParams({
        organizationId,
        includeTransactions: 'true',
        includeAlerts: 'true',
        includeReconciliations: 'true',
        includeHistorical: includeHistoricalData.toString()
      });

      const response = await apiClient.get(`/controlled-substances?${params}`);
      
      if (response.success) {
        setSubstances(response.data.substances || []);
        setTransactions(response.data.transactions || []);
        setComplianceAlerts(response.data.alerts || []);
        setReconciliationRecords(response.data.reconciliations || []);
      } else {
        throw new Error(response.error?.message || 'Failed to load controlled substances data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load controlled substances data';
      setError(errorMessage);
      console.error('Error loading controlled substances:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, includeHistoricalData]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh data
  useEffect(() => {
    if (!autoRefresh || !organizationId) return;

    const interval = setInterval(() => {
      loadData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadData, organizationId]);

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!enableRealTimeUpdates || !organizationId) return;


    const ws = new WebSocket(`${process.env['REACT_APP_WS_URL']}/controlled-substances/${organizationId}`);

    
    ws.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);
        
        switch (update.type) {
          case 'SUBSTANCE_UPDATED':
            setSubstances(prev => prev.map(s => 
              s.id === update.data.id ? { ...s, ...update.data } : s
            ));
            break;
            
          case 'TRANSACTION_RECORDED':
            setTransactions(prev => [update.data, ...prev]);
            // Update substance stock
            setSubstances(prev => prev.map(s => 
              s.id === update.data.substanceId 
                ? { ...s, currentStock: update.data.runningBalance }
                : s
            ));
            break;
            
          case 'COMPLIANCE_ALERT':
            setComplianceAlerts(prev => [update.data, ...prev]);
            break;
            
          case 'RECONCILIATION_COMPLETED':
            setReconciliationRecords(prev => [update.data, ...prev]);
            break;
            
          default:
            console.log('Unknown update type:', update.type);
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [enableRealTimeUpdates, organizationId]);

  // Record transaction
  const recordTransaction = useCallback(async (request: TransactionRequest): Promise<StockTransaction> => {
    try {
      setError(null);
      
      const response = await apiClient.post('/controlled-substances/transactions', {
        ...request,
        organizationId
      });
      
      if (response.success) {
        const transaction = response.data.transaction;
        
        // Update local state
        setTransactions(prev => [transaction, ...prev]);
        setSubstances(prev => prev.map(s => 
          s.id === request.substanceId 
            ? { ...s, currentStock: response.data.newStock }
            : s
        ));
        
        return transaction;
      } else {
        throw new Error(response.error?.message || 'Failed to record transaction');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record transaction';
      setError(errorMessage);
      throw err;
    }
  }, [organizationId]);

  // Perform reconciliation
  const performReconciliation = useCallback(async (request: ReconciliationRequest): Promise<ReconciliationRecord> => {
    try {
      setError(null);
      
      const response = await apiClient.post('/controlled-substances/reconciliation', {
        ...request,
        organizationId
      });
      
      if (response.success) {
        const reconciliation = response.data.reconciliation;
        
        // Update local state
        setReconciliationRecords(prev => [reconciliation, ...prev]);
        
        // Update substance compliance status if needed
        if (response.data.updatedSubstances) {
          setSubstances(prev => prev.map(s => {
            const updated = response.data.updatedSubstances.find((us: any) => us.id === s.id);
            return updated ? { ...s, ...updated } : s;
          }));
        }
        
        return reconciliation;
      } else {
        throw new Error(response.error?.message || 'Failed to perform reconciliation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to perform reconciliation';
      setError(errorMessage);
      throw err;
    }
  }, [organizationId]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback(async (alertId: string): Promise<void> => {
    try {
      setError(null);
      
      const response = await apiClient.patch(`/controlled-substances/alerts/${alertId}/acknowledge`, {
        organizationId
      });
      
      if (response.success) {
        setComplianceAlerts(prev => prev.map(alert => 
          alert.id === alertId 
            ? { 
                ...alert, 
                acknowledged: true, 
                acknowledgedAt: new Date(),
                acknowledgedBy: response.data.acknowledgedBy 
              }
            : alert
        ));
      } else {
        throw new Error(response.error?.message || 'Failed to acknowledge alert');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to acknowledge alert';
      setError(errorMessage);
      throw err;
    }
  }, [organizationId]);

  // Resolve alert
  const resolveAlert = useCallback(async (alertId: string, resolution: string): Promise<void> => {
    try {
      setError(null);
      
      const response = await apiClient.patch(`/controlled-substances/alerts/${alertId}/resolve`, {
        organizationId,
        resolution
      });
      
      if (response.success) {
        setComplianceAlerts(prev => prev.map(alert => 
          alert.id === alertId 
            ? { 
                ...alert, 
                resolved: true, 
                resolvedAt: new Date(),
                resolvedBy: response.data.resolvedBy 
              }
            : alert
        ));
      } else {
        throw new Error(response.error?.message || 'Failed to resolve alert');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve alert';
      setError(errorMessage);
      throw err;
    }
  }, [organizationId]);

  // Refresh data manually
  const refreshData = useCallback(async (): Promise<void> => {
    setLoading(true);
    await loadData();
  }, [loadData]);

  // Calculate compliance metrics
  const complianceMetrics = useMemo(() => {
    const total = substances.length;
    const compliant = substances.filter(s => s.complianceStatus === 'compliant').length;
    const warnings = substances.filter(s => s.complianceStatus === 'warning').length;
    const violations = substances.filter(s => s.complianceStatus === 'violation').length;
    const lowStock = substances.filter(s => s.currentStock <= s.minimumStock).length;
    const expired = substances.filter(s => new Date(s.expiryDate) <= new Date()).length;

    return {
      total,
      compliant,
      warnings,
      violations,
      lowStock,
      expired,
      complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 100
    };
  }, [substances]);

  // Filter substances
  const filteredSubstances = useMemo(() => {
    return substances.filter(substance => {
      const matchesSchedule = scheduleFilter === 'all' || substance.schedule === scheduleFilter;
      const matchesStatus = statusFilter === 'all' || substance.status === statusFilter;
      const matchesSearch = searchTerm === '' || 
        substance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        substance.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        substance.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSchedule && matchesStatus && matchesSearch;
    });
  }, [substances, scheduleFilter, statusFilter, searchTerm]);

  return {
    // Data
    substances,
    transactions,
    complianceAlerts,
    reconciliationRecords,
    
    // State
    loading,
    error,
    
    // Actions
    recordTransaction,
    performReconciliation,
    acknowledgeAlert,
    resolveAlert,
    refreshData,
    
    // Computed values
    complianceMetrics,
    
    // Filters and search
    filteredSubstances,
    setScheduleFilter,
    setStatusFilter,
    setSearchTerm
  };
};

export default useControlledSubstances;