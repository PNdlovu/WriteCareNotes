import axios, { AxiosInstance } from 'axios';
import { Logger } from '../core/Logger';

interface RoomConfig {
  name: string;
  privacy: 'private' | 'public';
  properties: {
    max_participants: number;
    enable_screenshare: boolean;
    enable_recording: boolean;
    start_audio_off: boolean;
    start_video_off: boolean;
    exp?: number; // Expiry time
  };
}

interface Room {
  id: string;
  name: string;
  api_created: boolean;
  privacy: string;
  url: string;
  created_at: string;
  config: RoomConfig['properties'];
}

interface AccessTokenConfig {
  userId: string;
  userName: string;
  permissions: {
    canAdmin: boolean;
    canSend: boolean;
    canReceive: boolean;
  };
  exp?: number; // Token expiry
}

interface RecordingConfig {
  layout?: {
    preset: 'default' | 'single-participant' | 'portrait';
  };
  instanceId?: string;
}

interface Recording {
  id: string;
  roomName: string;
  status: 'started' | 'stopped' | 'finished';
  startedAt?: string;
  finishedAt?: string;
  downloadLink?: string;
  duration?: number;
}

export class WebRTCProvider {
  privateclient: AxiosInstance;
  privatelogger: Logger;
  privateapiKey: string;
  privatebaseUrl: string;

  const ructor() {
    this.logger = new Logger('WebRTCProvider');
    this.apiKey = process.env.DAILY_API_KEY || '';
    this.baseUrl = 'https://api.daily.co/v1';
    
    if (!this.apiKey) {
      throw new Error('DAILY_API_KEY environment variable is required');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug('WebRTC API Request', {
          method: config.method,
          url: config.url,
          data: config.data
        });
        return config;
      },
      (error) => {
        this.logger.error('WebRTC API Request Error', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug('WebRTC API Response', {
          status: response.status,
          data: response.data
        });
        return response;
      },
      (error) => {
        this.logger.error('WebRTC API Response Error', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Create a new WebRTC room
   */
  async createRoom(config: RoomConfig): Promise<Room> {
    try {
      const requestData = {
        name: config.name,
        privacy: config.privacy,
        properties: {
          ...config.properties,
          exp: config.properties.exp || Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours default
        }
      };

      const response = await this.client.post('/rooms', requestData);
      
      const room: Room = response.data;
      
      this.logger.info('WebRTC room created successfully', {
        roomId: room.id,
        roomName: room.name,
        url: room.url
      });

      return room;

    } catch (error: any) {
      this.logger.error('Failed to create WebRTC room', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      throw new Error(`Failed to create WebRTCroom: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Get room details
   */
  async getRoom(roomName: string): Promise<Room> {
    try {
      const response = await this.client.get(`/rooms/${roomName}`);
      return response.data;

    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Room '${roomName}' not found`);
      }
      
      this.logger.error('Failed to get WebRTC room', {
        roomName,
        error: error.message,
        status: error.response?.status
      });
      
      throw new Error(`Failed to get WebRTCroom: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Update room configuration
   */
  async updateRoom(roomName: string, properties: Partial<RoomConfig['properties']>): Promise<Room> {
    try {
      const response = await this.client.post(`/rooms/${roomName}`, {
        properties
      });
      
      this.logger.info('WebRTC room updated successfully', {
        roomName,
        updatedProperties: properties
      });

      return response.data;

    } catch (error: any) {
      this.logger.error('Failed to update WebRTC room', {
        roomName,
        error: error.message,
        status: error.response?.status
      });
      
      throw new Error(`Failed to update WebRTCroom: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Delete a room
   */
  async deleteRoom(roomName: string): Promise<void> {
    try {
      await this.client.delete(`/rooms/${roomName}`);
      
      this.logger.info('WebRTC room deleted successfully', { roomName });

    } catch (error: any) {
      if (error.response?.status === 404) {
        this.logger.warn('Attempted to delete non-existent room', { roomName });
        return; // Room doesn't exist, consider it successful
      }
      
      this.logger.error('Failed to delete WebRTC room', {
        roomName,
        error: error.message,
        status: error.response?.status
      });
      
      throw new Error(`Failed to delete WebRTCroom: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Generate access token for a user to join a room
   */
  async generateAccessToken(roomName: string, config: AccessTokenConfig): Promise<string> {
    try {
      const payload = {
        properties: {
          room_name: roomName,
          user_name: config.userName,
          is_owner: config.permissions.canAdmin,
          start_audio_off: !config.permissions.canSend,
          start_video_off: !config.permissions.canSend,
          exp: config.exp || Math.floor(Date.now() / 1000) + (4 * 60 * 60) // 4 hours default
        }
      };

      const response = await this.client.post('/meeting-tokens', payload);
      
      const token = response.data.token;
      
      this.logger.info('Access token generated successfully', {
        roomName,
        userId: config.userId,
        userName: config.userName
      });

      return token;

    } catch (error: any) {
      this.logger.error('Failed to generate access token', {
        roomName,
        userId: config.userId,
        error: error.message,
        status: error.response?.status
      });
      
      throw new Error(`Failed to generate accesstoken: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Start recording a room
   */
  async startRecording(roomName: string, config: RecordingConfig = {}): Promise<Recording> {
    try {
      const requestData = {
        properties: {
          ...config,
          instanceId: config.instanceId || `recording_${Date.now()}`
        }
      };

      const response = await this.client.post(`/rooms/${roomName}/recordings`, requestData);
      
      const recording: Recording = response.data;
      
      this.logger.info('Recording started successfully', {
        roomName,
        recordingId: recording.id,
        instanceId: config.instanceId
      });

      return recording;

    } catch (error: any) {
      this.logger.error('Failed to start recording', {
        roomName,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      throw new Error(`Failed to startrecording: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Stop recording a room
   */
  async stopRecording(roomName: string, instanceId?: string): Promise<Recording> {
    try {
      const url = instanceId 
        ? `/rooms/${roomName}/recordings/${instanceId}/stop`
        : `/rooms/${roomName}/recordings/stop`;

      const response = await this.client.post(url);
      
      const recording: Recording = response.data;
      
      this.logger.info('Recording stopped successfully', {
        roomName,
        recordingId: recording.id,
        instanceId
      });

      return recording;

    } catch (error: any) {
      this.logger.error('Failed to stop recording', {
        roomName,
        instanceId,
        error: error.message,
        status: error.response?.status
      });
      
      throw new Error(`Failed to stoprecording: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Get recording details
   */
  async getRecording(recordingId: string): Promise<Recording> {
    try {
      const response = await this.client.get(`/recordings/${recordingId}`);
      return response.data;

    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Recording '${recordingId}' not found`);
      }
      
      this.logger.error('Failed to get recording', {
        recordingId,
        error: error.message,
        status: error.response?.status
      });
      
      throw new Error(`Failed to getrecording: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * List recordings for a room
   */
  async listRecordings(roomName?: string): Promise<Recording[]> {
    try {
      const params = roomName ? { room_name: roomName } : {};
      const response = await this.client.get('/recordings', { params });
      
      return response.data.data || [];

    } catch (error: any) {
      this.logger.error('Failed to list recordings', {
        roomName,
        error: error.message,
        status: error.response?.status
      });
      
      throw new Error(`Failed to listrecordings: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Delete a recording
   */
  async deleteRecording(recordingId: string): Promise<void> {
    try {
      await this.client.delete(`/recordings/${recordingId}`);
      
      this.logger.info('Recording deleted successfully', { recordingId });

    } catch (error: any) {
      if (error.response?.status === 404) {
        this.logger.warn('Attempted to delete non-existent recording', { recordingId });
        return; // Recording doesn't exist, consider it successful
      }
      
      this.logger.error('Failed to delete recording', {
        recordingId,
        error: error.message,
        status: error.response?.status
      });
      
      throw new Error(`Failed to deleterecording: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Get room participants
   */
  async getRoomParticipants(roomName: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/rooms/${roomName}/participants`);
      return response.data.data || [];

    } catch (error: any) {
      this.logger.error('Failed to get room participants', {
        roomName,
        error: error.message,
        status: error.response?.status
      });
      
      throw new Error(`Failed to get roomparticipants: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Eject a participant from a room
   */
  async ejectParticipant(roomName: string, participantId: string): Promise<void> {
    try {
      await this.client.post(`/rooms/${roomName}/participants/${participantId}/eject`);
      
      this.logger.info('Participant ejected successfully', {
        roomName,
        participantId
      });

    } catch (error: any) {
      this.logger.error('Failed to eject participant', {
        roomName,
        participantId,
        error: error.message,
        status: error.response?.status
      });
      
      throw new Error(`Failed to ejectparticipant: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Get analytics for a room
   */
  async getRoomAnalytics(roomName: string, from?: Date, to?: Date): Promise<any> {
    try {
      const params: any = {};
      if (from) params.from = from.toISOString();
      if (to) params.to = to.toISOString();

      const response = await this.client.get(`/analytics/rooms/${roomName}`, { params });
      return response.data;

    } catch (error: any) {
      this.logger.error('Failed to get room analytics', {
        roomName,
        error: error.message,
        status: error.response?.status
      });
      
      throw new Error(`Failed to get roomanalytics: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Test connectivity to Daily.co API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/');
      this.logger.info('Daily.co API connection test successful', {
        status: response.status
      });
      return true;

    } catch (error: any) {
      this.logger.error('Daily.co API connection test failed', {
        error: error.message,
        status: error.response?.status
      });
      return false;
    }
  }

  /**
   * Validate room URL format
   */
  static validateRoomUrl(url: string): boolean {
    const roomUrlPattern = /^https:\/\/[a-zA-Z0-9-]+\.daily\.co\/[a-zA-Z0-9-_]+$/;
    return roomUrlPattern.test(url);
  }

  /**
   * Extract room name from URL
   */
  static extractRoomName(url: string): string | null {
    const match = url.match(/\/([a-zA-Z0-9-_]+)$/);
    return match ? match[1] : null;
  }

  /**
   * Health check for the WebRTC provider
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      apiConnection: boolean;
      responseTime: number;
      lastError?: string;
    };
  }> {
    const startTime = Date.now();
    
    try {
      const isConnected = await this.testConnection();
      const responseTime = Date.now() - startTime;
      
      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        details: {
          apiConnection: isConnected,
          responseTime
        }
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'unhealthy',
        details: {
          apiConnection: false,
          responseTime,
          lastError: error.message
        }
      };
    }
  }
}
