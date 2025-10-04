/**
 * @fileoverview Healthcare Services
 * @module HealthcareServices
 * @version 1.0.0
 * @description Core healthcare services for residents, medication, and care management
 */

import { apiClient, ApiResponse } from './apiClient'

// Types
export interface Resident {
  id: string
  nhsNumber?: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  address: {
    street: string
    city: string
    county: string
    postcode: string
    country: string
  }
  emergencyContacts: EmergencyContact[]
  medicalHistory: MedicalHistory[]
  allergies: Allergy[]
  medications: Medication[]
  careNeeds: CareNeed[]
  roomNumber?: string
  admissionDate: string
  dischargeDate?: string
  status: 'active' | 'discharged' | 'temporary_leave'
  riskAssessments: RiskAssessment[]
  careplan: CarePlan
  preferences: ResidentPreferences
  documents: Document[]
  photos: Photo[]
  nextOfKin: NextOfKin
  gp: GeneralPractitioner
  socialWorker?: SocialWorker
  createdAt: string
  updatedAt: string
}

export interface EmergencyContact {
  id: string
  name: string
  relationship: string
  phoneNumber: string
  email?: string
  address?: string
  isPrimary: boolean
}

export interface MedicalHistory {
  id: string
  condition: string
  diagnosedDate: string
  status: 'active' | 'resolved' | 'chronic'
  notes?: string
  treatingPhysician?: string
}

export interface Allergy {
  id: string
  allergen: string
  type: 'food' | 'medication' | 'environmental' | 'other'
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening'
  symptoms: string[]
  notes?: string
  identifiedDate: string
}

export interface Medication {
  id: string
  name: string
  genericName?: string
  dosage: string
  frequency: string
  route: 'oral' | 'topical' | 'injection' | 'inhalation' | 'other'
  prescribedBy: string
  prescribedDate: string
  startDate: string
  endDate?: string
  indication: string
  instructions: string
  status: 'active' | 'discontinued' | 'on_hold'
  sideEffects?: string[]
  administrationTimes: string[]
  administrationRecords: MedicationAdministration[]
}

export interface MedicationAdministration {
  id: string
  medicationId: string
  scheduledTime: string
  actualTime?: string
  dosageGiven?: string
  administeredBy?: string
  status: 'scheduled' | 'given' | 'missed' | 'refused' | 'not_required'
  notes?: string
  witnessedBy?: string
  sideEffectsObserved?: string[]
}

export interface CareNeed {
  id: string
  category: 'mobility' | 'personal_care' | 'nutrition' | 'medical' | 'social' | 'mental_health'
  description: string
  level: 'low' | 'medium' | 'high' | 'critical'
  interventions: string[]
  goals: string[]
  reviewDate: string
  status: 'active' | 'resolved' | 'under_review'
}

export interface RiskAssessment {
  id: string
  type: 'falls' | 'pressure_sores' | 'malnutrition' | 'infection' | 'mental_health' | 'safeguarding'
  score: number
  level: 'low' | 'medium' | 'high' | 'critical'
  factors: string[]
  mitigations: string[]
  assessedBy: string
  assessmentDate: string
  reviewDate: string
  status: 'current' | 'expired' | 'under_review'
}

export interface CarePlan {
  id: string
  residentId: string
  goals: CareGoal[]
  interventions: CareIntervention[]
  reviews: CarePlanReview[]
  createdBy: string
  createdDate: string
  lastReviewDate: string
  nextReviewDate: string
  status: 'active' | 'under_review' | 'completed'
}

export interface CareGoal {
  id: string
  description: string
  category: string
  targetDate: string
  status: 'not_started' | 'in_progress' | 'achieved' | 'not_achieved'
  progress: number
  notes?: string
}

export interface CareIntervention {
  id: string
  description: string
  frequency: string
  instructions: string
  assignedTo?: string[]
  status: 'active' | 'completed' | 'discontinued'
}

export interface CarePlanReview {
  id: string
  reviewDate: string
  reviewedBy: string
  goalsProgress: string
  interventionsEffectiveness: string
  newGoals?: CareGoal[]
  modifiedInterventions?: CareIntervention[]
  nextReviewDate: string
}

export interface CareNote {
  id: string
  residentId: string
  type: 'general' | 'medical' | 'behavioral' | 'social' | 'incident' | 'medication'
  title: string
  content: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string
  tags: string[]
  attachments?: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
  acknowledgedBy?: string[]
  followUpRequired: boolean
  followUpDate?: string
  isConfidential: boolean
}

// Healthcare Services Class
class HealthcareServices {
  private readonly endpoints = {
    residents: '/residents',
    medications: '/medications',
    careNotes: '/care-notes',
    carePlans: '/care-plans',
    riskAssessments: '/risk-assessments',
    incidents: '/incidents',
    appointments: '/appointments',
    vitals: '/vitals'
  }

  // Residents Management
  async getResidents(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    roomNumber?: string
  }): Promise<ApiResponse<{ residents: Resident[], total: number }>> {
    return apiClient.get(this.endpoints.residents, { params })
  }

  async getResident(id: string): Promise<ApiResponse<Resident>> {
    return apiClient.get(`${this.endpoints.residents}/${id}`)
  }

  async createResident(residentData: Omit<Resident, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Resident>> {
    return apiClient.post(this.endpoints.residents, residentData)
  }

  async updateResident(id: string, updates: Partial<Resident>): Promise<ApiResponse<Resident>> {
    return apiClient.put(`${this.endpoints.residents}/${id}`, updates)
  }

  async deleteResident(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.endpoints.residents}/${id}`)
  }

  // Medication Management
  async getMedications(residentId?: string): Promise<ApiResponse<Medication[]>> {
    const params = residentId ? { residentId } : {}
    return apiClient.get(this.endpoints.medications, { params })
  }

  async getMedication(id: string): Promise<ApiResponse<Medication>> {
    return apiClient.get(`${this.endpoints.medications}/${id}`)
  }

  async createMedication(medicationData: Omit<Medication, 'id' | 'administrationRecords'>): Promise<ApiResponse<Medication>> {
    return apiClient.post(this.endpoints.medications, medicationData)
  }

  async updateMedication(id: string, updates: Partial<Medication>): Promise<ApiResponse<Medication>> {
    return apiClient.put(`${this.endpoints.medications}/${id}`, updates)
  }

  async discontinueMedication(id: string, reason: string): Promise<ApiResponse<Medication>> {
    return apiClient.patch(`${this.endpoints.medications}/${id}/discontinue`, { reason })
  }

  async recordMedicationAdministration(
    medicationId: string,
    administration: Omit<MedicationAdministration, 'id' | 'medicationId'>
  ): Promise<ApiResponse<MedicationAdministration>> {
    return apiClient.post(`${this.endpoints.medications}/${medicationId}/administration`, administration)
  }

  async getMedicationSchedule(date: string, residentId?: string): Promise<ApiResponse<MedicationAdministration[]>> {
    const params = { date, ...(residentId && { residentId }) }
    return apiClient.get(`${this.endpoints.medications}/schedule`, { params })
  }

  // Care Notes Management
  async getCareNotes(params?: {
    residentId?: string
    type?: string
    priority?: string
    page?: number
    limit?: number
    dateFrom?: string
    dateTo?: string
  }): Promise<ApiResponse<{ notes: CareNote[], total: number }>> {
    return apiClient.get(this.endpoints.careNotes, { params })
  }

  async getCareNote(id: string): Promise<ApiResponse<CareNote>> {
    return apiClient.get(`${this.endpoints.careNotes}/${id}`)
  }

  async createCareNote(noteData: Omit<CareNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<CareNote>> {
    return apiClient.post(this.endpoints.careNotes, noteData)
  }

  async updateCareNote(id: string, updates: Partial<CareNote>): Promise<ApiResponse<CareNote>> {
    return apiClient.put(`${this.endpoints.careNotes}/${id}`, updates)
  }

  async acknowledgeCareNote(id: string): Promise<ApiResponse<CareNote>> {
    return apiClient.patch(`${this.endpoints.careNotes}/${id}/acknowledge`)
  }

  // Care Plans Management
  async getCarePlans(residentId?: string): Promise<ApiResponse<CarePlan[]>> {
    const params = residentId ? { residentId } : {}
    return apiClient.get(this.endpoints.carePlans, { params })
  }

  async getCarePlan(id: string): Promise<ApiResponse<CarePlan>> {
    return apiClient.get(`${this.endpoints.carePlans}/${id}`)
  }

  async createCarePlan(carePlanData: Omit<CarePlan, 'id' | 'reviews'>): Promise<ApiResponse<CarePlan>> {
    return apiClient.post(this.endpoints.carePlans, carePlanData)
  }

  async updateCarePlan(id: string, updates: Partial<CarePlan>): Promise<ApiResponse<CarePlan>> {
    return apiClient.put(`${this.endpoints.carePlans}/${id}`, updates)
  }

  async reviewCarePlan(id: string, reviewData: Omit<CarePlanReview, 'id'>): Promise<ApiResponse<CarePlan>> {
    return apiClient.post(`${this.endpoints.carePlans}/${id}/review`, reviewData)
  }

  // Risk Assessments
  async getRiskAssessments(residentId?: string): Promise<ApiResponse<RiskAssessment[]>> {
    const params = residentId ? { residentId } : {}
    return apiClient.get(this.endpoints.riskAssessments, { params })
  }

  async createRiskAssessment(assessmentData: Omit<RiskAssessment, 'id'>): Promise<ApiResponse<RiskAssessment>> {
    return apiClient.post(this.endpoints.riskAssessments, assessmentData)
  }

  async updateRiskAssessment(id: string, updates: Partial<RiskAssessment>): Promise<ApiResponse<RiskAssessment>> {
    return apiClient.put(`${this.endpoints.riskAssessments}/${id}`, updates)
  }

  // Vitals and Health Monitoring
  async recordVitals(residentId: string, vitals: {
    temperature?: number
    bloodPressureSystolic?: number
    bloodPressureDiastolic?: number
    heartRate?: number
    respiratoryRate?: number
    oxygenSaturation?: number
    bloodGlucose?: number
    weight?: number
    height?: number
    pain?: number
    notes?: string
    recordedAt: string
  }): Promise<ApiResponse<any>> {
    return apiClient.post(`${this.endpoints.vitals}`, { residentId, ...vitals })
  }

  async getVitals(residentId: string, params?: {
    dateFrom?: string
    dateTo?: string
    type?: string
  }): Promise<ApiResponse<any[]>> {
    return apiClient.get(`${this.endpoints.vitals}/${residentId}`, { params })
  }

  // Appointments
  async getAppointments(params?: {
    residentId?: string
    date?: string
    type?: string
    status?: string
  }): Promise<ApiResponse<any[]>> {
    return apiClient.get(this.endpoints.appointments, { params })
  }

  async createAppointment(appointmentData: any): Promise<ApiResponse<any>> {
    return apiClient.post(this.endpoints.appointments, appointmentData)
  }

  async updateAppointment(id: string, updates: any): Promise<ApiResponse<any>> {
    return apiClient.put(`${this.endpoints.appointments}/${id}`, updates)
  }

  // Incidents
  async getIncidents(params?: {
    residentId?: string
    type?: string
    severity?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<ApiResponse<any[]>> {
    return apiClient.get(this.endpoints.incidents, { params })
  }

  async createIncident(incidentData: any): Promise<ApiResponse<any>> {
    return apiClient.post(this.endpoints.incidents, incidentData)
  }

  async updateIncident(id: string, updates: any): Promise<ApiResponse<any>> {
    return apiClient.put(`${this.endpoints.incidents}/${id}`, updates)
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
export const healthcareServices = new HealthcareServices()
export default healthcareServices