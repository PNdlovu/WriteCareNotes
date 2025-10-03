import AsyncStorage from '@react-native-async-storage/async-storage';
import { openDatabase, SQLiteDatabase } from 'react-native-sqlite-storage';
import NetInfo from '@react-native-community/netinfo';
import CryptoJS from 'crypto-js';

export interface OfflineData {
  id: string;
  type: 'time_entry' | 'payslip' | 'holiday' | 'shift' | 'profile';
  data: any;
  timestamp: Date;
  synced: boolean;
  encrypted: boolean;
}

export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  priority: 'high' | 'medium' | 'low';
}

export class OfflineStorageService {
  private db: SQLiteDatabase | null = null;
  private encryptionKey: string;
  private syncQueue: SyncQueueItem[] = [];
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;

  constructor() {
    this.encryptionKey = this.generateEncryptionKey();
    this.initializeDatabase();
    this.setupNetworkListener();
    this.loadSyncQueue();
  }

  // Database Initialization
  private async initializeDatabase(): Promise<void> {
    try {
      this.db = openDatabase(
        {
          name: 'WorkforceOffline.db',
          location: 'default',
          createFromLocation: '~WorkforceOffline.db',
        },
        () => {
          console.log('Database opened successfully');
          this.createTables();
        },
        (error) => {
          console.error('Error opening database:', error);
        }
      );
    } catch (error) {
      console.error('Database initialization error:', error);
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    const tables = [
      `CREATE TABLE IF NOT EXISTS offline_data (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        synced INTEGER DEFAULT 0,
        encrypted INTEGER DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        retry_count INTEGER DEFAULT 0,
        priority TEXT DEFAULT 'medium'
      )`,
      `CREATE TABLE IF NOT EXISTS user_preferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`
    ];

    for (const sql of tables) {
      this.db.executeSql(sql, [], 
        () => console.log('Table created successfully'),
        (error) => console.error('Error creating table:', error)
      );
    }
  }

  // Network Status Management
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected || false;
      
      // If we just came back online, trigger sync
      if (wasOffline && this.isOnline) {
        this.syncOfflineData();
      }
    });
  }

  // Offline Data Storage
  async storeOfflineData(
    type: string,
    data: any,
    encrypt: boolean = false
  ): Promise<string> {
    const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let dataToStore = JSON.stringify(data);
    if (encrypt) {
      dataToStore = this.encryptData(dataToStore);
    }

    const offlineData: OfflineData = {
      id,
      type: type as any,
      data: dataToStore,
      timestamp: new Date(),
      synced: false,
      encrypted: encrypt
    };

    if (this.db) {
      this.db.executeSql(
        'INSERT INTO offline_data (id, type, data, timestamp, synced, encrypted) VALUES (?, ?, ?, ?, ?, ?)',
        [id, type, dataToStore, Date.now(), 0, encrypt ? 1 : 0],
        () => console.log('Offline data stored:', id),
        (error) => console.error('Error storing offline data:', error)
      );
    }

    return id;
  }

  async getOfflineData(type?: string): Promise<OfflineData[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }

      const query = type 
        ? 'SELECT * FROM offline_data WHERE type = ? ORDER BY timestamp DESC'
        : 'SELECT * FROM offline_data ORDER BY timestamp DESC';
      
      const params = type ? [type] : [];

      this.db.executeSql(
        query,
        params,
        (result) => {
          const data: OfflineData[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows.item(i);
            let parsedData = row.data;
            
            if (row.encrypted) {
              parsedData = this.decryptData(parsedData);
            }
            
            data.push({
              id: row.id,
              type: row.type,
              data: JSON.parse(parsedData),
              timestamp: new Date(row.timestamp),
              synced: row.synced === 1,
              encrypted: row.encrypted === 1
            });
          }
          resolve(data);
        },
        (error) => {
          console.error('Error retrieving offline data:', error);
          reject(error);
        }
      );
    });
  }

  // Time Entry Offline Storage
  async storeTimeEntryOffline(timeEntryData: any): Promise<string> {
    const id = await this.storeOfflineData('time_entry', timeEntryData, true);
    
    // Add to sync queue with high priority
    await this.addToSyncQueue({
      id: `sync_${id}`,
      action: 'create',
      entity: 'time_entry',
      data: timeEntryData,
      timestamp: new Date(),
      retryCount: 0,
      priority: 'high'
    });

    return id;
  }

  async getOfflineTimeEntries(): Promise<any[]> {
    const offlineData = await this.getOfflineData('time_entry');
    return offlineData.map(item => item.data);
  }

  // Payslip Offline Storage
  async storePayslipOffline(payslipData: any): Promise<string> {
    return await this.storeOfflineData('payslip', payslipData, true);
  }

  async getOfflinePayslips(): Promise<any[]> {
    const offlineData = await this.getOfflineData('payslip');
    return offlineData.map(item => item.data);
  }

  // Holiday Request Offline Storage
  async storeHolidayRequestOffline(holidayData: any): Promise<string> {
    const id = await this.storeOfflineData('holiday', holidayData, false);
    
    await this.addToSyncQueue({
      id: `sync_${id}`,
      action: 'create',
      entity: 'holiday',
      data: holidayData,
      timestamp: new Date(),
      retryCount: 0,
      priority: 'medium'
    });

    return id;
  }

  // Sync Queue Management
  private async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    if (this.db) {
      this.db.executeSql(
        'INSERT INTO sync_queue (id, action, entity, data, timestamp, retry_count, priority) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          item.id,
          item.action,
          item.entity,
          JSON.stringify(item.data),
          Date.now(),
          item.retryCount,
          item.priority
        ],
        () => console.log('Added to sync queue:', item.id),
        (error) => console.error('Error adding to sync queue:', error)
      );
    }

    this.syncQueue.push(item);
  }

  private async loadSyncQueue(): Promise<void> {
    if (!this.db) return;

    this.db.executeSql(
      'SELECT * FROM sync_queue ORDER BY priority DESC, timestamp ASC',
      [],
      (result) => {
        this.syncQueue = [];
        for (let i = 0; i < result.rows.length; i++) {
          const row = result.rows.item(i);
          this.syncQueue.push({
            id: row.id,
            action: row.action,
            entity: row.entity,
            data: JSON.parse(row.data),
            timestamp: new Date(row.timestamp),
            retryCount: row.retry_count,
            priority: row.priority
          });
        }
        console.log(`Loaded ${this.syncQueue.length} items in sync queue`);
      },
      (error) => console.error('Error loading sync queue:', error)
    );
  }

  // Data Synchronization
  async syncOfflineData(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) {
      console.log('Sync skipped: offline or already in progress');
      return;
    }

    this.syncInProgress = true;
    console.log('Starting offline data sync...');

    try {
      // Sort by priority and timestamp
      const sortedQueue = this.syncQueue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return a.timestamp.getTime() - b.timestamp.getTime();
      });

      for (const item of sortedQueue) {
        try {
          await this.syncQueueItem(item);
          await this.removeFromSyncQueue(item.id);
        } catch (error) {
          console.error(`Error syncing item ${item.id}:`, error);
          await this.handleSyncError(item);
        }
      }

      console.log('Offline data sync completed');
    } catch (error) {
      console.error('Sync process error:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncQueueItem(item: SyncQueueItem): Promise<void> {
    // This would make actual API calls to sync data
    // For now, we'll simulate the sync process
    
    console.log(`Syncing ${item.entity} ${item.action}:`, item.id);
    
    switch (item.entity) {
      case 'time_entry':
        await this.syncTimeEntry(item);
        break;
      case 'holiday':
        await this.syncHolidayRequest(item);
        break;
      case 'profile':
        await this.syncProfileUpdate(item);
        break;
      default:
        console.warn('Unknown entity type for sync:', item.entity);
    }
  }

  private async syncTimeEntry(item: SyncQueueItem): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mark original offline data as synced
    if (this.db) {
      this.db.executeSql(
        'UPDATE offline_data SET synced = 1 WHERE id = ?',
        [item.id.replace('sync_', '')],
        () => console.log('Time entry marked as synced'),
        (error) => console.error('Error marking as synced:', error)
      );
    }
  }

  private async syncHolidayRequest(item: SyncQueueItem): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('Holiday request synced:', item.id);
  }

  private async syncProfileUpdate(item: SyncQueueItem): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    console.log('Profile update synced:', item.id);
  }

  private async handleSyncError(item: SyncQueueItem): Promise<void> {
    item.retryCount++;
    
    // Max retry attempts
    if (item.retryCount >= 3) {
      console.error(`Max retries reached for ${item.id}, removing from queue`);
      await this.removeFromSyncQueue(item.id);
      return;
    }

    // Update retry count in database
    if (this.db) {
      this.db.executeSql(
        'UPDATE sync_queue SET retry_count = ? WHERE id = ?',
        [item.retryCount, item.id],
        () => console.log(`Retry count updated for ${item.id}`),
        (error) => console.error('Error updating retry count:', error)
      );
    }
  }

  private async removeFromSyncQueue(itemId: string): Promise<void> {
    if (this.db) {
      this.db.executeSql(
        'DELETE FROM sync_queue WHERE id = ?',
        [itemId],
        () => console.log(`Removed ${itemId} from sync queue`),
        (error) => console.error('Error removing from sync queue:', error)
      );
    }

    this.syncQueue = this.syncQueue.filter(item => item.id !== itemId);
  }

  // Encryption/Decryption
  private generateEncryptionKey(): string {
    // In a real app, this would be derived from user credentials or device keychain
    return 'workforce-offline-key-2024';
  }

  private encryptData(data: string): string {
    try {
      return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      return data; // Fallback to unencrypted
    }
  }

  private decryptData(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedData; // Fallback to original data
    }
  }

  // Utility Methods
  async clearOfflineData(type?: string): Promise<void> {
    if (!this.db) return;

    const query = type 
      ? 'DELETE FROM offline_data WHERE type = ?'
      : 'DELETE FROM offline_data';
    
    const params = type ? [type] : [];

    this.db.executeSql(
      query,
      params,
      () => console.log('Offline data cleared'),
      (error) => console.error('Error clearing offline data:', error)
    );
  }

  async getStorageInfo(): Promise<{
    totalItems: number;
    syncedItems: number;
    pendingSync: number;
    storageSize: string;
  }> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve({
          totalItems: 0,
          syncedItems: 0,
          pendingSync: 0,
          storageSize: '0 KB'
        });
        return;
      }

      this.db.executeSql(
        'SELECT COUNT(*) as total, SUM(synced) as synced FROM offline_data',
        [],
        (result) => {
          const row = result.rows.item(0);
          resolve({
            totalItems: row.total,
            syncedItems: row.synced || 0,
            pendingSync: this.syncQueue.length,
            storageSize: '~1 MB' // Estimated size
          });
        },
        (error) => {
          console.error('Error getting storage info:', error);
          resolve({
            totalItems: 0,
            syncedItems: 0,
            pendingSync: 0,
            storageSize: '0 KB'
          });
        }
      );
    });
  }

  isNetworkAvailable(): boolean {
    return this.isOnline;
  }

  getSyncQueueLength(): number {
    return this.syncQueue.length;
  }

  // Force sync (manual trigger)
  async forceSyncNow(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    
    await this.syncOfflineData();
  }

  // User Preferences Storage
  async setUserPreference(key: string, value: any): Promise<void> {
    try {
      await AsyncStorage.setItem(`pref_${key}`, JSON.stringify(value));
      
      if (this.db) {
        this.db.executeSql(
          'INSERT OR REPLACE INTO user_preferences (key, value) VALUES (?, ?)',
          [key, JSON.stringify(value)],
          () => console.log('User preference saved:', key),
          (error) => console.error('Error saving preference:', error)
        );
      }
    } catch (error) {
      console.error('Error setting user preference:', error);
    }
  }

  async getUserPreference(key: string): Promise<any> {
    try {
      const value = await AsyncStorage.getItem(`pref_${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting user preference:', error);
      return null;
    }
  }
}

export default OfflineStorageService;