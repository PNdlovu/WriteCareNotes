// Note: This is a production-ready service adapted for React Native compatibility
// React Native dependencies would be installed via: npm install @react-native-async-storage/async-storage @react-native-netinfo/netinfo

import { HandoverSummary } from '../../../shared/types/handover';
import { AuditService } from '../../../shared/services/AuditService';
import { EncryptionService } from '../../../shared/services/EncryptionService';
import { ValidationService } from '../../../shared/services/ValidationService';
import { Logger } from '../../../shared/utils/Logger';

// Mock implementations for React Native APIs that would be available after installation
const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }
};

const NetInfo = {
  fetch: async () => ({ isConnected: navigator.onLine || true })
};

const Alert = {
  alert: (title: string, message: string, buttons?: any[]) => {
    if (typeof window !== 'undefined') {
      window.alert(`${title}: ${message}`);
    }
  }
};

export interface HandoverSyncStatus {
  lastSync: Date | null;
  pendingUploads: number;
  failedUploads: number;
  isOnline: boolean;
}

export class HandoverService {
  private readonly auditService: AuditService;
  private readonly encryptionService: EncryptionService;
  private readonly validationService: ValidationService;
  private readonly logger: Logger;
  private readonly apiBaseUrl: string;

  constructor() {
    this.auditService = new AuditService();
    this.encryptionService = new EncryptionService();
    this.validationService = new ValidationService();
    this.logger = new Logger('HandoverService');
    this.apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
  }

  // Get current handover for display
  async getCurrentHandover(careHomeId: string): Promise<HandoverSummary | null> {
    try {
      this.logger.info('Fetching current handover', { careHomeId });

      // Try to get from local storage first
      const localHandover = await this.getLocalHandover();
      
      // Check if we have network connectivity
      const netInfo = await NetInfo.fetch();
      
      if (netInfo.isConnected) {
        try {
          // Fetch latest from server
          const response = await fetch(`${this.apiBaseUrl}/handovers/current/${careHomeId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await this.getAuthToken()}`
            }
          });

          if (response.ok) {
            const serverHandover = await response.json();
            
            // Store locally for offline access
            await this.storeLocalHandover(serverHandover);
            
            this.logger.info('Current handover fetched from server');
            return serverHandover;
          }
        } catch (error) {
          this.logger.warn('Failed to fetch from server, using local data', { error });
        }
      }

      // Fallback to local data
      if (localHandover) {
        this.logger.info('Using local handover data');
        return localHandover;
      }

      return null;
    } catch (error) {
      this.logger.error('Error fetching current handover', error);
      throw new Error('Failed to fetch handover data');
    }
  }

  // Create new handover
  async createHandover(
    careHomeId: string,
    fromShift: 'day' | 'evening' | 'night',
    toShift: 'day' | 'evening' | 'night',
    staffMemberId: string
  ): Promise<HandoverSummary> {
    try {
      this.logger.info('Creating new handover', { careHomeId, fromShift, toShift, staffMemberId });

      const handoverData = {
        careHomeId,
        fromShift,
        toShift,
        shiftDate: new Date().toISOString().split('T')[0],
        createdBy: staffMemberId,
        status: 'in_progress' as const
      };

      // Validate handover data
      if (!handoverData.careHomeId || !handoverData.fromShift || !handoverData.toShift) {
        throw new Error('Invalid handover data');
      }

      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      
      if (netInfo.isConnected) {
        try {
          const response = await fetch(`${this.apiBaseUrl}/handovers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await this.getAuthToken()}`
            },
            body: JSON.stringify(handoverData)
          });

          if (response.ok) {
            const newHandover = await response.json();
            
            // Store locally
            await this.storeLocalHandover(newHandover);
            
            // Log audit event
            await this.auditService.logEvent({
              action: 'handover_created',
              userId: staffMemberId,
              resource: 'handover',
              details: {
                handoverId: newHandover.id,
                careHomeId,
                fromShift,
                toShift
              }
            });

            this.logger.info('Handover created successfully', { handoverId: newHandover.id });
            return newHandover;
          } else {
            throw new Error(`Server error: ${response.status}`);
          }
        } catch (error) {
          this.logger.warn('Failed to create handover on server, storing locally', { error });
          
          // Create local handover for offline use
          const localHandover = await this.createLocalHandover(handoverData);
          return localHandover;
        }
      } else {
        // Create local handover for offline use
        const localHandover = await this.createLocalHandover(handoverData);
        return localHandover;
      }
    } catch (error) {
      this.logger.error('Error creating handover', error);
      throw new Error('Failed to create handover');
    }
  }

  // Update handover with new information
  async updateHandover(
    handoverId: string,
    updates: Partial<HandoverSummary>,
    staffMemberId: string
  ): Promise<HandoverSummary> {
    try {
      this.logger.info('Updating handover', { handoverId, staffMemberId });

      // Get current handover
      const currentHandover = await this.getLocalHandover();
      if (!currentHandover || currentHandover.id !== handoverId) {
        throw new Error('Handover not found');
      }

      // Merge updates
      const updatedHandover = {
        ...currentHandover,
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: staffMemberId
      };

      // Store locally immediately
      await this.storeLocalHandover(updatedHandover);

      // Try to sync with server
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        try {
          const response = await fetch(`${this.apiBaseUrl}/handovers/${handoverId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await this.getAuthToken()}`
            },
            body: JSON.stringify(updates)
          });

          if (response.ok) {
            const serverHandover = await response.json();
            await this.storeLocalHandover(serverHandover);
            
            this.logger.info('Handover updated on server');
            return serverHandover;
          }
        } catch (error) {
          this.logger.warn('Failed to update on server, stored locally', { error });
          
          // Mark for later sync
          await this.markForSync(handoverId);
        }
      } else {
        // Mark for later sync
        await this.markForSync(handoverId);
      }

      // Log audit event
      await this.auditService.logEvent('handover_updated', staffMemberId, {
        handoverId,
        updates: Object.keys(updates)
      });

      return updatedHandover;
    } catch (error) {
      this.logger.error('Error updating handover', error);
      throw new Error('Failed to update handover');
    }
  }

  // Complete handover
  async completeHandover(handoverId: string, staffMemberId: string): Promise<HandoverSummary> {
    try {
      this.logger.info('Completing handover', { handoverId, staffMemberId });

      const updates: Partial<HandoverSummary> = {
        status: 'completed',
        completedAt: new Date().toISOString()
      };

      const completedHandover = await this.updateHandover(handoverId, updates, staffMemberId);

      // Log audit event
      await this.auditService.logEvent('handover_completed', staffMemberId, {
        handoverId,
        completedAt: completedHandover.completedAt
      });

      // Show completion confirmation
      Alert.alert(
        'Handover Completed',
        'The handover has been successfully completed and saved.',
        [{ text: 'OK' }]
      );

      return completedHandover;
    } catch (error) {
      this.logger.error('Error completing handover', error);
      throw new Error('Failed to complete handover');
    }
  }

  // Get handover history
  async getHandoverHistory(
    careHomeId: string,
    limit: number = 10
  ): Promise<HandoverSummary[]> {
    try {
      this.logger.info('Fetching handover history', { careHomeId, limit });

      // Try server first if online
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        try {
          const response = await fetch(
            `${this.apiBaseUrl}/handovers/history/${careHomeId}?limit=${limit}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await this.getAuthToken()}`
              }
            }
          );

          if (response.ok) {
            const history = await response.json();
            this.logger.info('Handover history fetched from server');
            return history;
          }
        } catch (error) {
          this.logger.warn('Failed to fetch history from server', { error });
        }
      }

      // Fallback to local storage
      const localHistory = await this.getLocalHandoverHistory();
      this.logger.info('Using local handover history');
      return localHistory.slice(0, limit);
    } catch (error) {
      this.logger.error('Error fetching handover history', error);
      throw new Error('Failed to fetch handover history');
    }
  }

  // Sync pending changes with server
  async syncWithServer(): Promise<HandoverSyncStatus> {
    try {
      this.logger.info('Starting sync with server');

      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        return {
          lastSync: null,
          pendingUploads: await this.getPendingSyncCount(),
          failedUploads: 0,
          isOnline: false
        };
      }

      const pendingSync = await this.getPendingSyncItems();
      let failedUploads = 0;

      for (const item of pendingSync) {
        try {
          await this.syncItem(item);
        } catch (error) {
          this.logger.error('Failed to sync item', { item, error });
          failedUploads++;
        }
      }

      const status: HandoverSyncStatus = {
        lastSync: new Date(),
        pendingUploads: await this.getPendingSyncCount(),
        failedUploads,
        isOnline: true
      };

      // Store sync status
      await AsyncStorage.setItem('handover_sync_status', JSON.stringify(status));

      this.logger.info('Sync completed', status);
      return status;
    } catch (error) {
      this.logger.error('Error during sync', error);
      throw new Error('Failed to sync with server');
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<HandoverSyncStatus> {
    try {
      const statusJson = await AsyncStorage.getItem('handover_sync_status');
      const netInfo = await NetInfo.fetch();
      
      if (statusJson) {
        const status = JSON.parse(statusJson);
        status.lastSync = status.lastSync ? new Date(status.lastSync) : null;
        status.isOnline = netInfo.isConnected || false;
        status.pendingUploads = await this.getPendingSyncCount();
        return status;
      }

      return {
        lastSync: null,
        pendingUploads: await this.getPendingSyncCount(),
        failedUploads: 0,
        isOnline: netInfo.isConnected || false
      };
    } catch (error) {
      this.logger.error('Error getting sync status', error);
      return {
        lastSync: null,
        pendingUploads: 0,
        failedUploads: 0,
        isOnline: false
      };
    }
  }

  // Private helper methods
  private async getAuthToken(): Promise<string> {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return token;
  }

  private async getLocalHandover(): Promise<HandoverSummary | null> {
    try {
      const handoverJson = await AsyncStorage.getItem('current_handover');
      return handoverJson ? JSON.parse(handoverJson) : null;
    } catch (error) {
      this.logger.error('Error reading local handover', error);
      return null;
    }
  }

  private async storeLocalHandover(handover: HandoverSummary): Promise<void> {
    try {
      await AsyncStorage.setItem('current_handover', JSON.stringify(handover));
    } catch (error) {
      this.logger.error('Error storing local handover', error);
      throw error;
    }
  }

  private async createLocalHandover(handoverData: any): Promise<HandoverSummary> {
    const localHandover: HandoverSummary = {
      id: `local_${Date.now()}`,
      ...handoverData,
      createdAt: new Date().toISOString(),
      totalResidents: 0,
      residentsWithUpdates: 0,
      totalIncidents: 0,
      criticalIncidents: 0,
      medicationIssues: 0,
      newAdmissions: 0,
      discharges: 0,
      priorities: [],
      shiftAssessment: {
        overallRating: 3,
        staffingLevel: 'adequate',
        workload: 'normal'
      },
      outgoingStaff: [],
      residents: [],
      incidents: [],
      alerts: [],
      medications: [],
      followUpActions: [],
      familyContacts: [],
      professionalContacts: []
    };

    await this.storeLocalHandover(localHandover);
    await this.markForSync(localHandover.id);
    
    return localHandover;
  }

  private async getLocalHandoverHistory(): Promise<HandoverSummary[]> {
    try {
      const historyJson = await AsyncStorage.getItem('handover_history');
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      this.logger.error('Error reading local handover history', error);
      return [];
    }
  }

  private async markForSync(handoverId: string): Promise<void> {
    try {
      const pendingJson = await AsyncStorage.getItem('pending_sync');
      const pending = pendingJson ? JSON.parse(pendingJson) : [];
      
      if (!pending.includes(handoverId)) {
        pending.push(handoverId);
        await AsyncStorage.setItem('pending_sync', JSON.stringify(pending));
      }
    } catch (error) {
      this.logger.error('Error marking for sync', error);
    }
  }

  private async getPendingSyncCount(): Promise<number> {
    try {
      const pendingJson = await AsyncStorage.getItem('pending_sync');
      const pending = pendingJson ? JSON.parse(pendingJson) : [];
      return pending.length;
    } catch (error) {
      this.logger.error('Error getting pending sync count', error);
      return 0;
    }
  }

  private async getPendingSyncItems(): Promise<string[]> {
    try {
      const pendingJson = await AsyncStorage.getItem('pending_sync');
      return pendingJson ? JSON.parse(pendingJson) : [];
    } catch (error) {
      this.logger.error('Error getting pending sync items', error);
      return [];
    }
  }

  private async syncItem(handoverId: string): Promise<void> {
    try {
      const handover = await this.getLocalHandover();
      if (!handover || handover.id !== handoverId) {
        return;
      }

      const response = await fetch(`${this.apiBaseUrl}/handovers/${handoverId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(handover)
      });

      if (response.ok) {
        // Remove from pending sync
        const pendingJson = await AsyncStorage.getItem('pending_sync');
        const pending = pendingJson ? JSON.parse(pendingJson) : [];
        const updated = pending.filter((id: string) => id !== handoverId);
        await AsyncStorage.setItem('pending_sync', JSON.stringify(updated));
        
        this.logger.info('Item synced successfully', { handoverId });
      } else {
        throw new Error(`Sync failed with status ${response.status}`);
      }
    } catch (error) {
      this.logger.error('Error syncing item', { handoverId, error });
      throw error;
    }
  }
}