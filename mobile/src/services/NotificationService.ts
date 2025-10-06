import { AuditService } from '../../../shared/services/AuditService';
import { EncryptionService } from '../../../shared/services/EncryptionService';
import { Logger } from '../../../shared/utils/Logger';

export interface NotificationPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  urgentNotifications: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
  };
  categories: {
    medicationReminders: boolean;
    appointmentReminders: boolean;
    incidentAlerts: boolean;
    handoverNotifications: boolean;
    familyUpdates: boolean;
    emergencyAlerts: boolean;
  };
}

export interface NotificationData {
  id: string;
  type: 'medication' | 'appointment' | 'incident' | 'handover' | 'family' | 'emergency' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  data?: any;
  scheduledFor?: Date;
  expiresAt?: Date;
  recipientId: string;
  recipientType: 'staff' | 'family' | 'resident';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  channels: ('push' | 'email' | 'sms')[];
}

export interface NotificationChannel {
  type: 'push' | 'email' | 'sms';
  enabled: boolean;
  address?: string; // email address or phone number
  verified: boolean;
  lastUsed?: Date;
}

export class NotificationService {
  private readonly auditService: AuditService;
  private readonly encryptionService: EncryptionService;
  private readonly logger: Logger;
  private readonly apiBaseUrl: string;

  // Mock storage for web compatibility
  private readonly storage = {
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

  constructor() {
    this.auditService = new AuditService();
    this.encryptionService = new EncryptionService();
    this.logger = new Logger('NotificationService');
    this.apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
  }

  // Send immediate notification
  async sendNotification(
    notification: Omit<NotificationData, 'id' | 'status' | 'createdAt'>
  ): Promise<NotificationData> {
    try {
      const notificationData: NotificationData = {
        id: this.generateNotificationId(),
        status: 'pending',
        createdAt: new Date(),
        ...notification
      };

      this.logger.info('Sending notification', {
        id: notificationData.id,
        type: notificationData.type,
        priority: notificationData.priority,
        recipient: notificationData.recipientId
      });

      // Get recipient preferences
      const preferences = await this.getNotificationPreferences(
        notificationData.recipientId
      );

      // Check if notifications are enabled for this category
      if (!this.isNotificationEnabled(notificationData, preferences)) {
        this.logger.info('Notification disabled by preferences', {
          id: notificationData.id,
          type: notificationData.type
        });
        notificationData.status = 'failed';
        return notificationData;
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences)) {
        // Schedule for later unless urgent
        if (notificationData.priority !== 'urgent') {
          const scheduledTime = this.calculateNextSendTime(preferences);
          const scheduledNotification = {
            ...notification,
            scheduledFor: scheduledTime
          };
          await this.scheduleNotification(scheduledNotification);
          return { ...notificationData, scheduledFor: scheduledTime };
        }
      }

      // Send via available channels
      const results = await this.sendViaChannels(notificationData, preferences);
      
      // Update status based on results
      notificationData.status = results.some(r => r.success) ? 'sent' : 'failed';
      notificationData.sentAt = new Date();

      // Store notification record
      await this.storeNotification(notificationData);

      // Log audit event
      await this.auditService.logEvent({
        action: 'notification_sent',
        userId: notificationData.recipientId,
        resource: 'notification',
        details: {
          notificationId: notificationData.id,
          type: notificationData.type,
          priority: notificationData.priority,
          channels: notificationData.channels,
          success: notificationData.status === 'sent'
        }
      });

      return notificationData;
    } catch (error) {
      this.logger.error('Error sending notification', error);
      throw new Error('Failed to send notification');
    }
  }

  // Schedule notification for later delivery
  async scheduleNotification(
    notification: Omit<NotificationData, 'id' | 'status' | 'createdAt'> & {
      scheduledFor: Date;
    }
  ): Promise<NotificationData> {
    try {
      const notificationData: NotificationData = {
        id: this.generateNotificationId(),
        status: 'pending',
        createdAt: new Date(),
        ...notification
      };

      this.logger.info('Scheduling notification', {
        id: notificationData.id,
        scheduledFor: notificationData.scheduledFor
      });

      // Store in pending notifications
      await this.storePendingNotification(notificationData);

      // Log audit event
      await this.auditService.logEvent({
        action: 'notification_scheduled',
        userId: notificationData.recipientId,
        resource: 'notification',
        details: {
          notificationId: notificationData.id,
          scheduledFor: notificationData.scheduledFor,
          type: notificationData.type
        }
      });

      return notificationData;
    } catch (error) {
      this.logger.error('Error scheduling notification', error);
      throw new Error('Failed to schedule notification');
    }
  }

  // Get notification preferences for user
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // Try to get from local storage first
      const localPrefs = await this.storage.getItem(`notification_prefs_${userId}`);
      if (localPrefs) {
        return JSON.parse(localPrefs);
      }

      // Default preferences if none found
      const defaultPreferences: NotificationPreferences = {
        pushNotifications: true,
        emailNotifications: true,
        smsNotifications: false,
        urgentNotifications: true,
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00'
        },
        categories: {
          medicationReminders: true,
          appointmentReminders: true,
          incidentAlerts: true,
          handoverNotifications: true,
          familyUpdates: true,
          emergencyAlerts: true
        }
      };

      // Store default preferences
      await this.storage.setItem(
        `notification_prefs_${userId}`,
        JSON.stringify(defaultPreferences)
      );

      return defaultPreferences;
    } catch (error) {
      this.logger.error('Error getting notification preferences', error);
      
      // Return safe defaults
      return {
        pushNotifications: false,
        emailNotifications: false,
        smsNotifications: false,
        urgentNotifications: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        },
        categories: {
          medicationReminders: false,
          appointmentReminders: false,
          incidentAlerts: true,
          handoverNotifications: false,
          familyUpdates: false,
          emergencyAlerts: true
        }
      };
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const currentPrefs = await this.getNotificationPreferences(userId);
      const updatedPrefs = { ...currentPrefs, ...preferences };

      await this.storage.setItem(
        `notification_prefs_${userId}`,
        JSON.stringify(updatedPrefs)
      );

      // Log audit event
      await this.auditService.logEvent({
        action: 'notification_preferences_updated',
        userId,
        resource: 'user_preferences',
        details: {
          updatedFields: Object.keys(preferences)
        }
      });

      this.logger.info('Notification preferences updated', { userId });
      return updatedPrefs;
    } catch (error) {
      this.logger.error('Error updating notification preferences', error);
      throw new Error('Failed to update notification preferences');
    }
  }

  // Get notification history for user
  async getNotificationHistory(
    userId: string,
    limit: number = 50
  ): Promise<NotificationData[]> {
    try {
      const historyJson = await this.storage.getItem(`notification_history_${userId}`);
      const history: NotificationData[] = historyJson ? JSON.parse(historyJson) : [];
      
      return history
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      this.logger.error('Error getting notification history', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      const historyJson = await this.storage.getItem(`notification_history_${userId}`);
      const history: NotificationData[] = historyJson ? JSON.parse(historyJson) : [];
      
      const notification = history.find(n => n.id === notificationId);
      if (notification) {
        notification.status = 'read';
        notification.readAt = new Date();
        
        await this.storage.setItem(
          `notification_history_${userId}`,
          JSON.stringify(history)
        );

        // Log audit event
        await this.auditService.logEvent({
          action: 'notification_read',
          userId,
          resource: 'notification',
          details: { notificationId }
        });
      }
    } catch (error) {
      this.logger.error('Error marking notification as read', error);
    }
  }

  // Private helper methods
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isNotificationEnabled(
    notification: NotificationData,
    preferences: NotificationPreferences
  ): boolean {
    // Check category-specific preferences
    switch (notification.type) {
      case 'medication':
        return preferences.categories.medicationReminders;
      case 'appointment':
        return preferences.categories.appointmentReminders;
      case 'incident':
        return preferences.categories.incidentAlerts;
      case 'handover':
        return preferences.categories.handoverNotifications;
      case 'family':
        return preferences.categories.familyUpdates;
      case 'emergency':
        return preferences.categories.emergencyAlerts;
      default:
        return true;
    }
  }

  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    const startTime = this.parseTime(preferences.quietHours.start);
    const endTime = this.parseTime(preferences.quietHours.end);

    if (startTime > endTime) {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 100 + minutes;
  }

  private calculateNextSendTime(preferences: NotificationPreferences): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [hours, minutes] = preferences.quietHours.end.split(':').map(Number);
    tomorrow.setHours(hours, minutes, 0, 0);
    
    return tomorrow;
  }

  private async sendViaChannels(
    notification: NotificationData,
    preferences: NotificationPreferences
  ): Promise<Array<{ channel: string; success: boolean; error?: string }>> {
    const results: Array<{ channel: string; success: boolean; error?: string }> = [];

    for (const channel of notification.channels) {
      try {
        let success = false;
        
        switch (channel) {
          case 'push':
            if (preferences.pushNotifications) {
              success = await this.sendPushNotification(notification);
            }
            break;
          case 'email':
            if (preferences.emailNotifications) {
              success = await this.sendEmailNotification(notification);
            }
            break;
          case 'sms':
            if (preferences.smsNotifications) {
              success = await this.sendSmsNotification(notification);
            }
            break;
        }

        results.push({ channel, success });
      } catch (error) {
        results.push({
          channel,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  private async sendPushNotification(notification: NotificationData): Promise<boolean> {
    try {
      this.logger.info('Sending push notification', { id: notification.id });
      
      // In a real React Native app, this would use Firebase Cloud Messaging
      // For now, we'll simulate success
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        // Web push notification fallback
        return this.sendWebPushNotification(notification);
      }
      
      return true;
    } catch (error) {
      this.logger.error('Error sending push notification', error);
      return false;
    }
  }

  private async sendEmailNotification(notification: NotificationData): Promise<boolean> {
    try {
      this.logger.info('Sending email notification', { id: notification.id });
      
      // This would integrate with an email service
      // For now, we'll simulate success
      return true;
    } catch (error) {
      this.logger.error('Error sending email notification', error);
      return false;
    }
  }

  private async sendSmsNotification(notification: NotificationData): Promise<boolean> {
    try {
      this.logger.info('Sending SMS notification', { id: notification.id });
      
      // This would integrate with an SMS service
      // For now, we'll simulate success
      return true;
    } catch (error) {
      this.logger.error('Error sending SMS notification', error);
      return false;
    }
  }

  private async sendWebPushNotification(notification: NotificationData): Promise<boolean> {
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id
        });
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error('Error sending web push notification', error);
      return false;
    }
  }

  private async storeNotification(notification: NotificationData): Promise<void> {
    try {
      // Store in history
      const historyJson = await this.storage.getItem(`notification_history_${notification.recipientId}`);
      const history: NotificationData[] = historyJson ? JSON.parse(historyJson) : [];
      
      history.unshift(notification);
      
      // Keep only the latest 1000 notifications
      if (history.length > 1000) {
        history.splice(1000);
      }

      await this.storage.setItem(
        `notification_history_${notification.recipientId}`,
        JSON.stringify(history)
      );
    } catch (error) {
      this.logger.error('Error storing notification', error);
    }
  }

  private async storePendingNotification(notification: NotificationData): Promise<void> {
    try {
      const pendingJson = await this.storage.getItem('pending_notifications');
      const pending: NotificationData[] = pendingJson ? JSON.parse(pendingJson) : [];
      
      pending.push(notification);
      
      await this.storage.setItem('pending_notifications', JSON.stringify(pending));
    } catch (error) {
      this.logger.error('Error storing pending notification', error);
    }
  }
}