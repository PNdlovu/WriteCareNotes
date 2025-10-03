import { apiClient } from './apiClient';

export interface MedicationDue {
  id: string;
  residentId: string;
  residentName: string;
  medicationName: string;
  dosage: string;
  route: string;
  scheduledTime: string;
  status: 'due' | 'overdue' | 'completed' | 'skipped';
  priority: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface MedicationAlert {
  id: string;
  type: 'interaction' | 'allergy' | 'contraindication' | 'expiry' | 'stock';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  residentId?: string;
  medicationId?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalDueMedications: number;
  overdueMedications: number;
  completedToday: number;
  activeAlerts: number;
  totalResidents: number;
  complianceRate: number;
}

export interface MedicationAdministration {
  id: string;
  medicationDueId: string;
  administeredBy: string;
  administeredAt: string;
  actualDosage: string;
  notes?: string;
  witnessedBy?: string;
}

class MedicationService {
  async getDashboardStats(organizationId: string): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>(`/medications/dashboard/stats/${organizationId}`);
    return response.data;
  }

  async getDueMedications(organizationId: string, filters?: {
    status?: string;
    priority?: string;
    residentId?: string;
    limit?: number;
  }): Promise<MedicationDue[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.residentId) params.append('residentId', filters.residentId);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<MedicationDue[]>(
      `/medications/due/${organizationId}?${params.toString()}`
    );
    return response.data;
  }

  async getActiveAlerts(organizationId: string): Promise<MedicationAlert[]> {
    const response = await apiClient.get<MedicationAlert[]>(`/medications/alerts/${organizationId}`);
    return response.data;
  }

  async administerMedication(medicationDueId: string, data: {
    actualDosage: string;
    notes?: string;
    witnessedBy?: string;
  }): Promise<MedicationAdministration> {
    const response = await apiClient.post<MedicationAdministration>(
      `/medications/administer/${medicationDueId}`,
      data
    );
    return response.data;
  }

  async skipMedication(medicationDueId: string, reason: string): Promise<void> {
    await apiClient.post(`/medications/skip/${medicationDueId}`, { reason });
  }

  async getMedicationHistory(residentId: string, filters?: {
    startDate?: string;
    endDate?: string;
    medicationId?: string;
  }): Promise<MedicationAdministration[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.medicationId) params.append('medicationId', filters.medicationId);

    const response = await apiClient.get<MedicationAdministration[]>(
      `/medications/history/${residentId}?${params.toString()}`
    );
    return response.data;
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    await apiClient.post(`/medications/alerts/${alertId}/acknowledge`);
  }

  async dismissAlert(alertId: string, reason?: string): Promise<void> {
    await apiClient.post(`/medications/alerts/${alertId}/dismiss`, { reason });
  }

  async getComplianceReport(organizationId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<{
    period: string;
    complianceRate: number;
    totalMedications: number;
    onTimeAdministrations: number;
    lateAdministrations: number;
    missedAdministrations: number;
    trends: Array<{
      date: string;
      rate: number;
    }>;
  }> {
    const response = await apiClient.get(`/medications/compliance/${organizationId}?period=${period}`);
    return response.data;
  }
}

export const medicationService = new MedicationService();