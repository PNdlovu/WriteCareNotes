import { apiClient } from './apiClient';

export interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  roomNumber: string;
  careLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'active' | 'discharged' | 'deceased';
  admissionDate: string;
  email?: string;
  phone?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  medicalConditions?: string[];
  allergies?: string[];
  medications?: string[];
  carePlan?: {
    id: string;
    title: string;
    status: 'active' | 'completed' | 'paused';
    lastUpdated: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResidentFilters {
  status?: 'active' | 'discharged' | 'deceased';
  careLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  roomNumber?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ResidentStats {
  totalResidents: number;
  activeResidents: number;
  dischargedResidents: number;
  newAdmissions: number;
  careLevelDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  averageAge: number;
  occupancyRate: number;
}

export interface CarePlan {
  id: string;
  residentId: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: string;
  endDate?: string;
  assignedTo: string;
  tasks: CareTask[];
  lastUpdated: string;
  createdAt: string;
}

export interface CareTask {
  id: string;
  carePlanId: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

export interface RiskAssessment {
  id: string;
  residentId: string;
  assessmentDate: string;
  assessedBy: string;
  riskAreas: {
    falls: number;
    pressureUlcers: number;
    malnutrition: number;
    dehydration: number;
    medicationErrors: number;
    socialIsolation: number;
  };
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  nextAssessmentDate: string;
}

class ResidentService {
  async getResidents(organizationId: string, filters?: ResidentFilters): Promise<Resident[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.careLevel) params.append('careLevel', filters.careLevel);
    if (filters?.roomNumber) params.append('roomNumber', filters.roomNumber);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get<Resident[]>(
      `/residents/${organizationId}?${params.toString()}`
    );
    return response.data;
  }

  async getResidentById(residentId: string): Promise<Resident> {
    const response = await apiClient.get<Resident>(`/residents/${residentId}`);
    return response.data;
  }

  async createResident(organizationId: string, data: Partial<Resident>): Promise<Resident> {
    const response = await apiClient.post<Resident>(`/residents/${organizationId}`, data);
    return response.data;
  }

  async updateResident(residentId: string, data: Partial<Resident>): Promise<Resident> {
    const response = await apiClient.put<Resident>(`/residents/${residentId}`, data);
    return response.data;
  }

  async deleteResident(residentId: string): Promise<void> {
    await apiClient.delete(`/residents/${residentId}`);
  }

  async getResidentStats(organizationId: string): Promise<ResidentStats> {
    const response = await apiClient.get<ResidentStats>(`/residents/stats/${organizationId}`);
    return response.data;
  }

  async getCarePlans(residentId: string): Promise<CarePlan[]> {
    const response = await apiClient.get<CarePlan[]>(`/residents/${residentId}/care-plans`);
    return response.data;
  }

  async createCarePlan(residentId: string, data: Partial<CarePlan>): Promise<CarePlan> {
    const response = await apiClient.post<CarePlan>(`/residents/${residentId}/care-plans`, data);
    return response.data;
  }

  async updateCarePlan(carePlanId: string, data: Partial<CarePlan>): Promise<CarePlan> {
    const response = await apiClient.put<CarePlan>(`/care-plans/${carePlanId}`, data);
    return response.data;
  }

  async completeCareTask(taskId: string, notes?: string): Promise<CareTask> {
    const response = await apiClient.post<CareTask>(`/care-tasks/${taskId}/complete`, { notes });
    return response.data;
  }

  async getRiskAssessment(residentId: string): Promise<RiskAssessment> {
    const response = await apiClient.get<RiskAssessment>(`/residents/${residentId}/risk-assessment`);
    return response.data;
  }

  async createRiskAssessment(residentId: string, data: Partial<RiskAssessment>): Promise<RiskAssessment> {
    const response = await apiClient.post<RiskAssessment>(`/residents/${residentId}/risk-assessment`, data);
    return response.data;
  }

  async updateRiskAssessment(assessmentId: string, data: Partial<RiskAssessment>): Promise<RiskAssessment> {
    const response = await apiClient.put<RiskAssessment>(`/risk-assessments/${assessmentId}`, data);
    return response.data;
  }

  async dischargeResident(residentId: string, dischargeData: {
    dischargeDate: string;
    dischargeReason: string;
    dischargeDestination: string;
    notes?: string;
  }): Promise<Resident> {
    const response = await apiClient.post<Resident>(`/residents/${residentId}/discharge`, dischargeData);
    return response.data;
  }

  async getResidentHistory(residentId: string): Promise<{
    admissions: Array<{
      id: string;
      admissionDate: string;
      dischargeDate?: string;
      roomNumber: string;
      careLevel: string;
      notes?: string;
    }>;
    carePlans: CarePlan[];
    riskAssessments: RiskAssessment[];
    medicationChanges: Array<{
      id: string;
      date: string;
      medication: string;
      change: string;
      reason: string;
    }>;
  }> {
    const response = await apiClient.get(`/residents/${residentId}/history`);
    return response.data;
  }

  async searchResidents(organizationId: string, query: string): Promise<Resident[]> {
    const response = await apiClient.get<Resident[]>(`/residents/search/${organizationId}?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  async getResidentsByRoom(organizationId: string, roomNumber: string): Promise<Resident[]> {
    const response = await apiClient.get<Resident[]>(`/residents/room/${organizationId}/${roomNumber}`);
    return response.data;
  }

  async getResidentsByCareLevel(organizationId: string, careLevel: string): Promise<Resident[]> {
    const response = await apiClient.get<Resident[]>(`/residents/care-level/${organizationId}/${careLevel}`);
    return response.data;
  }

  async exportResidents(organizationId: string, format: 'csv' | 'pdf' | 'excel'): Promise<Blob> {
    const response = await apiClient.get(`/residents/export/${organizationId}?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async importResidents(organizationId: string, file: File): Promise<{
    success: boolean;
    imported: number;
    errors: Array<{
      row: number;
      error: string;
    }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(`/residents/import/${organizationId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
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
export const residentService = new ResidentService();