import { apiClient } from './apiClient';
import { PilotFeedbackDto, PilotMetricsDto } from '../../types/pilot';

class PilotService {
  private baseUrl = '/api/pilot';

  /**
   * Submit pilot feedback
   */
  async submitFeedback(feedback: PilotFeedbackDto): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/feedback`, feedback);
    return response.data;
  }

  /**
   * Get pilot status
   */
  async getPilotStatus(tenantId: string): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/status/${tenantId}`);
    return response.data;
  }

  /**
   * Get pilot metrics
   */
  async getPilotMetrics(params: PilotMetricsDto): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.tenantId) queryParams.append('tenantId', params.tenantId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const response = await apiClient.get(`${this.baseUrl}/metrics?${queryParams}`);
    return response.data;
  }

  /**
   * Get pilot dashboard data
   */
  async getPilotDashboard(tenantId: string): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/dashboard/${tenantId}`);
    return response.data;
  }

  /**
   * Get recent feedback for current tenant
   */
  async getRecentFeedback(tenantId: string, limit: number = 10): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/feedback/${tenantId}?limit=${limit}`);
    return response.data;
  }
}

export const pilotService = new PilotService();