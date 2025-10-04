import { useQuery, useQueryClient } from '@tanstack/react-query';
import { medicationService, DashboardStats, MedicationDue, MedicationAlert } from '../services/medicationService';
import { useAuth } from '../contexts/AuthContext';

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
export const useMedicationDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const organizationId = user?.organizationId || '';

  // Dashboard stats query
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery<DashboardStats>({
    queryKey: ['medication-dashboard-stats', organizationId],
    queryFn: () => medicationService.getDashboardStats(organizationId),
    enabled: !!organizationId,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Due medications query
  const {
    data: dueMedications,
    isLoading: medicationsLoading,
    error: medicationsError,
    refetch: refetchMedications,
  } = useQuery<MedicationDue[]>({
    queryKey: ['due-medications', organizationId],
    queryFn: () => medicationService.getDueMedications(organizationId, { limit: 20 }),
    enabled: !!organizationId,
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });

  // Active alerts query
  const {
    data: alerts,
    isLoading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts,
  } = useQuery<MedicationAlert[]>({
    queryKey: ['medication-alerts', organizationId],
    queryFn: () => medicationService.getActiveAlerts(organizationId),
    enabled: !!organizationId,
    refetchInterval: 3 * 60 * 1000, // Refetch every 3 minutes
  });

  // Overdue medications (derived from due medications)
  const overdueMedications = dueMedications?.filter(med => med.status === 'overdue') || [];

  // High priority medications (derived from due medications)
  const highPriorityMedications = dueMedications?.filter(med => med.priority === 'high') || [];

  // Critical alerts (derived from alerts)
  const criticalAlerts = alerts?.filter(alert => alert.severity === 'critical') || [];

  const isLoading = statsLoading || medicationsLoading || alertsLoading;
  const error = statsError || medicationsError || alertsError;

  const refetchAll = () => {
    refetchStats();
    refetchMedications();
    refetchAlerts();
  };

  // Invalidate queries when medications are administered
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['medication-dashboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['due-medications'] });
    queryClient.invalidateQueries({ queryKey: ['medication-alerts'] });
  };

  return {
    // Data
    stats: stats || {
      totalDueMedications: 0,
      overdueMedications: 0,
      completedToday: 0,
      activeAlerts: 0,
      totalResidents: 0,
      complianceRate: 0,
    },
    dueMedications: dueMedications || [],
    overdueMedications,
    highPriorityMedications,
    alerts: alerts || [],
    criticalAlerts,
    
    // Loading states
    isLoading,
    statsLoading,
    medicationsLoading,
    alertsLoading,
    
    // Errors
    error,
    statsError,
    medicationsError,
    alertsError,
    
    // Actions
    refetch: refetchAll,
    refetchStats,
    refetchMedications,
    refetchAlerts,
    invalidateQueries,
  };
};