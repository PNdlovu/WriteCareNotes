/**
 * @fileoverview n h s patient Service
 * @module Integration/Nhs/NHSPatientService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description n h s patient Service
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger } from '../../../utils/logger';
import PrometheusService from '../../monitoring/PrometheusService';
import SentryService from '../../monitoring/SentryService';

interface NHSPatient {
  nhsNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };
  contactDetails: {
    phone?: string;
    email?: string;
  };
  gpDetails?: {
    practiceName: string;
    practiceCode: string;
    gpName: string;
    gpCode: string;
  };
  allergies: string[];
  medications: string[];
  conditions: string[];
  lastUpdated: string;
}

interface CareRecord {
  id: string;
  nhsNumber: string;
  recordType: 'assessment' | 'care_plan' | 'medication' | 'incident' | 'review';
  title: string;
  content: string;
  author: {
    name: string;
    role: string;
    organization: string;
  };
  timestamp: string;
  status: 'draft' | 'active' | 'archived';
  metadata: Record<string, any>;
}

interface NHSResponse<T> {
  success: boolean;
  data: T;
  errors?: string[];
  warnings?: string[];
}

/**
 * NHS Patient Service
 * Provides integration with NHS Digital services for patient data management
 */
export class NHSPatientService {
  private staticinstance: NHSPatientService;
  privateapiClient: AxiosInstance;
  privateprometheusService: PrometheusService;
  privatesentryService: SentryService;

  private const ructor() {
    this.prometheusService = PrometheusService.getInstance();
    this.sentryService = SentryService.getInstance();
    
    this.apiClient = axios.create({
      baseURL: process.env['NHS_API_BASE_URL'] || 'https://api.nhs.uk',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env['NHS_API_KEY']}`,
        'X-API-Version': '1.0',
        'X-Organization-ID': process.env['ORGANIZATION_ID'] || 'default'
      }
    });

    this.setupInterceptors();
  }

  public static getInstance(): NHSPatientService {
    if (!NHSPatientService.instance) {
      NHSPatientService.instance = new NHSPatientService();
    }
    return NHSPatientService.instance;
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.apiClient.interceptors.request.use(
      (config) => {
        const startTime = Date.now();
        config.metadata = { startTime };
        
        logger.info('NHS API request initiated', {
          method: config.method?.toUpperCase(),
          url: config.url,
          organizationId: config.headers['X-Organization-ID']
        });

        return config;
      },
      (error) => {
        logger.error('NHS API request error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.apiClient.interceptors.response.use(
      (response: AxiosResponse) => {
        const duration = Date.now() - response.config.metadata?.startTime;
        
        // Record metrics
        this.prometheusService.recordExternalAPICall(
          'NHS',
          response.config.url || '',
          response.config.method?.toUpperCase() || 'GET',
          response.status,
          duration,
          response.config.headers['X-Organization-ID'] as string
        );

        logger.info('NHS API request completed', {
          method: response.config.method?.toUpperCase(),
          url: response.config.url,
          status: response.status,
          duration
        });

        return response;
      },
      (error) => {
        const duration = Date.now() - (error.config?.metadata?.startTime || Date.now());
        
        // Record error metrics
        this.prometheusService.recordExternalAPICall(
          'NHS',
          error.config?.url || '',
          error.config?.method?.toUpperCase() || 'GET',
          error.response?.status || 0,
          duration,
          error.config?.headers['X-Organization-ID'] as string
        );

        // Capture error in Sentry
        this.sentryService.captureException(error, {
          service: 'NHS',
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status
        });

        logger.error('NHS API request failed', {
          error: error.message,
          status: error.response?.status,
          url: error.config?.url,
          duration
        });

        return Promise.reject(error);
      }
    );
  }

  /**
   * Get patient by NHS number
   */
  async getPatientByNHSNumber(nhsNumber: string): Promise<NHSPatient> {
    try {
      // Validate NHS number format
      if (!this.isValidNHSNumber(nhsNumber)) {
        throw new Error('Invalid NHS number format');
      }

      const response = await this.apiClient.get<NHSResponse<NHSPatient>>(
        `/patients/${nhsNumber}`
      );

      if (!response.data.success) {
        throw new Error(`NHS APIerror: ${response.data.errors?.join(', ')}`);
      }

      logger.info('Patient retrieved from NHS', {
        nhsNumber,
        patientName: `${response.data.data.firstName} ${response.data.data.lastName}`
      });

      return response.data.data;
    } catch (error) {
      logger.error('Failed to retrieve patient from NHS', { error, nhsNumber });
      throw error;
    }
  }

  /**
   * Search patients by criteria
   */
  async searchPatients(criteria: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    postcode?: string;
  }): Promise<NHSPatient[]> {
    try {
      const response = await this.apiClient.post<NHSResponse<NHSPatient[]>>(
        '/patients/search',
        criteria
      );

      if (!response.data.success) {
        throw new Error(`NHS APIerror: ${response.data.errors?.join(', ')}`);
      }

      logger.info('Patient search completed', {
        criteria,
        resultCount: response.data.data.length
      });

      return response.data.data;
    } catch (error) {
      logger.error('Failed to search patients in NHS', { error, criteria });
      throw error;
    }
  }

  /**
   * Update patient care record
   */
  async updatePatientCareRecord(nhsNumber: string, careRecord: CareRecord): Promise<void> {
    try {
      if (!this.isValidNHSNumber(nhsNumber)) {
        throw new Error('Invalid NHS number format');
      }

      const response = await this.apiClient.post<NHSResponse<void>>(
        `/patients/${nhsNumber}/care-records`,
        careRecord
      );

      if (!response.data.success) {
        throw new Error(`NHS APIerror: ${response.data.errors?.join(', ')}`);
      }

      logger.info('Patient care record updated in NHS', {
        nhsNumber,
        recordId: careRecord.id,
        recordType: careRecord.recordType
      });

      // Record business event
      this.prometheusService.recordBusinessEvent('care_record_updated', 'care_planning', {
        nhsNumber,
        recordType: careRecord.recordType,
        organizationId: careRecord.author.organization
      });
    } catch (error) {
      logger.error('Failed to update patient care record in NHS', { error, nhsNumber, recordId: careRecord.id });
      throw error;
    }
  }

  /**
   * Get patient care records
   */
  async getPatientCareRecords(nhsNumber: string, recordType?: string): Promise<CareRecord[]> {
    try {
      if (!this.isValidNHSNumber(nhsNumber)) {
        throw new Error('Invalid NHS number format');
      }

      const params = recordType ? { type: recordType } : {};
      const response = await this.apiClient.get<NHSResponse<CareRecord[]>>(
        `/patients/${nhsNumber}/care-records`,
        { params }
      );

      if (!response.data.success) {
        throw new Error(`NHS APIerror: ${response.data.errors?.join(', ')}`);
      }

      logger.info('Patient care records retrieved from NHS', {
        nhsNumber,
        recordType,
        recordCount: response.data.data.length
      });

      return response.data.data;
    } catch (error) {
      logger.error('Failed to retrieve patient care records from NHS', { error, nhsNumber, recordType });
      throw error;
    }
  }

  /**
   * Validate NHS number format
   */
  private isValidNHSNumber(nhsNumber: string): boolean {
    // Remove spaces and hyphens
    const cleaned = nhsNumber.replace(/[\s-]/g, '');
    
    // Check if it's 10 digits
    if (!/^\d{10}$/.test(cleaned)) {
      return false;
    }

    // Calculate check digit
    const digits = cleaned.split('').map(Number);
    let sum = 0;
    
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * (10 - i);
    }
    
    const remainder = sum % 11;
    const checkDigit = 11 - remainder;
    
    if (checkDigit === 11) {
      return digits[9] === 0;
    } else if (checkDigit === 10) {
      return false; // Invalid NHS number
    } else {
      return digits[9] === checkDigit;
    }
  }

  /**
   * Get patient appointments
   */
  async getPatientAppointments(nhsNumber: string, startDate?: string, endDate?: string): Promise<any[]> {
    try {
      if (!this.isValidNHSNumber(nhsNumber)) {
        throw new Error('Invalid NHS number format');
      }

      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await this.apiClient.get<NHSResponse<any[]>>(
        `/patients/${nhsNumber}/appointments`,
        { params }
      );

      if (!response.data.success) {
        throw new Error(`NHS APIerror: ${response.data.errors?.join(', ')}`);
      }

      logger.info('Patient appointments retrieved from NHS', {
        nhsNumber,
        appointmentCount: response.data.data.length
      });

      return response.data.data;
    } catch (error) {
      logger.error('Failed to retrieve patient appointments from NHS', { error, nhsNumber });
      throw error;
    }
  }

  /**
   * Get patient medications
   */
  async getPatientMedications(nhsNumber: string): Promise<any[]> {
    try {
      if (!this.isValidNHSNumber(nhsNumber)) {
        throw new Error('Invalid NHS number format');
      }

      const response = await this.apiClient.get<NHSResponse<any[]>>(
        `/patients/${nhsNumber}/medications`
      );

      if (!response.data.success) {
        throw new Error(`NHS APIerror: ${response.data.errors?.join(', ')}`);
      }

      logger.info('Patient medications retrieved from NHS', {
        nhsNumber,
        medicationCount: response.data.data.length
      });

      return response.data.data;
    } catch (error) {
      logger.error('Failed to retrieve patient medications from NHS', { error, nhsNumber });
      throw error;
    }
  }

  /**
   * Sync patient data with local system
   */
  async syncPatientData(nhsNumber: string, organizationId: string): Promise<void> {
    try {
      const patient = await this.getPatientByNHSNumber(nhsNumber);
      const careRecords = await this.getPatientCareRecords(nhsNumber);
      const appointments = await this.getPatientAppointments(nhsNumber);
      const medications = await this.getPatientMedications(nhsNumber);

      // Here you would typically update your local database
      // This is a placeholder for the actual sync logic
      logger.info('Patient data synced with NHS', {
        nhsNumber,
        organizationId,
        patientData: {
          name: `${patient.firstName} ${patient.lastName}`,
          careRecords: careRecords.length,
          appointments: appointments.length,
          medications: medications.length
        }
      });

      // Record sync event
      this.prometheusService.recordBusinessEvent('patient_data_synced', 'integration', {
        nhsNumber,
        organizationId
      });
    } catch (error) {
      logger.error('Failed to sync patient data with NHS', { error, nhsNumber, organizationId });
      throw error;
    }
  }

  /**
   * Health check for NHS API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/health');
      return response.status === 200;
    } catch (error) {
      logger.error('NHS API health check failed', { error });
      return false;
    }
  }
}

export default NHSPatientService;
