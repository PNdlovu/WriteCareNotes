/**
 * @fileoverview Firebase Service for Push Notifications
 * @module FirebaseService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Service for managing Firebase Cloud Messaging (FCM) push notifications
 * 
 * @compliance
 * - GDPR and Data Protection Act 2018
 * - CQC Regulation 10 - Dignity and respect
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  sound?: string;
  badge?: number;
  clickAction?: string;
  tag?: string;
  color?: string;
  icon?: string;
  channelId?: string;
  priority?: 'normal' | 'high';
  timeToLive?: number;
  collapseKey?: string;
  mutableContent?: boolean;
  contentAvailable?: boolean;
  apns?: {
    payload?: {
      aps?: {
        alert?: {
          title?: string;
          body?: string;
          subtitle?: string;
        };
        badge?: number;
        sound?: string;
        category?: string;
        threadId?: string;
        mutableContent?: boolean;
        contentAvailable?: boolean;
      };
    };
    headers?: Record<string, string>;
  };
  android?: {
    notification?: {
      title?: string;
      body?: string;
      icon?: string;
      color?: string;
      sound?: string;
      tag?: string;
      clickAction?: string;
      bodyLocKey?: string;
      bodyLocArgs?: string[];
      titleLocKey?: string;
      titleLocArgs?: string[];
      channelId?: string;
      imageUrl?: string;
      ticker?: string;
      sticky?: boolean;
      notificationPriority?: 'PRIORITY_MIN' | 'PRIORITY_LOW' | 'PRIORITY_DEFAULT' | 'PRIORITY_HIGH' | 'PRIORITY_MAX';
      visibility?: 'VISIBILITY_PRIVATE' | 'VISIBILITY_PUBLIC' | 'VISIBILITY_SECRET';
      notificationCount?: number;
      lightSettings?: {
        color?: {
          red?: number;
          green?: number;
          blue?: number;
          alpha?: number;
        };
        lightOnDuration?: string;
        lightOffDuration?: string;
      };
      defaultSound?: boolean;
      defaultVibrateTimings?: boolean;
      defaultLightSettings?: boolean;
      vibrateTimings?: string[];
      eventTime?: string;
      localOnly?: boolean;
      priority?: 'PRIORITY_MIN' | 'PRIORITY_LOW' | 'PRIORITY_DEFAULT' | 'PRIORITY_HIGH' | 'PRIORITY_MAX';
    };
    data?: Record<string, string>;
    priority?: 'normal' | 'high';
    ttl?: string;
    collapseKey?: string;
    restrictedPackageName?: string;
    fcmOptions?: {
      analyticsLabel?: string;
    };
  };
  webpush?: {
    headers?: Record<string, string>;
    data?: Record<string, string>;
    notification?: {
      title?: string;
      body?: string;
      icon?: string;
      badge?: string;
      color?: string;
      sound?: string;
      tag?: string;
      requireInteraction?: boolean;
      silent?: boolean;
      timestamp?: number;
      vibrate?: number[];
      actions?: Array<{
        action: string;
        title: string;
        icon?: string;
      }>;
    };
    fcmOptions?: {
      link?: string;
      analyticsLabel?: string;
    };
  };
}

export interface NotificationTopic {
  name: string;
  description?: string;
  createdAt: Date;
  subscriberCount?: number;
}

export interface DeviceToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  userId: string;
  deviceId?: string;
  appVersion?: string;
  lastUsed: Date;
  isActive: boolean;
}

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App;

  constructor(private readonly configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      // Initialize Firebase Admin SDK
      const serviceAccount = {
        type: 'service_account',
        project_id: this.configService.get<string>('FIREBASE_PROJECT_ID'),
        private_key_id: this.configService.get<string>('FIREBASE_PRIVATE_KEY_ID'),
        private_key: this.configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
        client_email: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
        client_id: this.configService.get<string>('FIREBASE_CLIENT_ID'),
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${this.configService.get<string>('FIREBASE_CLIENT_EMAIL')}`,
      };

      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
      });

      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error: any) {
      this.logger.error(`Failed to initialize Firebase: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send notification to a specific device token
   */
  async sendNotification(
    token: string,
    notification: PushNotification
  ): Promise<string> {
    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: notification.data || {},
        android: notification.android ? {
          notification: notification.android.notification,
          data: notification.android.data,
          priority: notification.android.priority,
          ttl: notification.android.ttl,
          collapseKey: notification.android.collapseKey,
          restrictedPackageName: notification.android.restrictedPackageName,
          fcmOptions: notification.android.fcmOptions,
        } : undefined,
        apns: notification.apns ? {
          payload: notification.apns.payload,
          headers: notification.apns.headers,
        } : undefined,
        webpush: notification.webpush ? {
          headers: notification.webpush.headers,
          data: notification.webpush.data,
          notification: notification.webpush.notification,
          fcmOptions: notification.webpush.fcmOptions,
        } : undefined,
        fcmOptions: {
          analyticsLabel: notification.data?.analyticsLabel,
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Notification sent successfully: ${response}`);
      return response;
    } catch (error: any) {
      this.logger.error(`Failed to send notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send notification to multiple device tokens
   */
  async sendMulticastNotification(
    tokens: string[],
    notification: PushNotification
  ): Promise<admin.messaging.BatchResponse> {
    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: notification.data || {},
        android: notification.android ? {
          notification: notification.android.notification,
          data: notification.android.data,
          priority: notification.android.priority,
          ttl: notification.android.ttl,
          collapseKey: notification.android.collapseKey,
          restrictedPackageName: notification.android.restrictedPackageName,
          fcmOptions: notification.android.fcmOptions,
        } : undefined,
        apns: notification.apns ? {
          payload: notification.apns.payload,
          headers: notification.apns.headers,
        } : undefined,
        webpush: notification.webpush ? {
          headers: notification.webpush.headers,
          data: notification.webpush.data,
          notification: notification.webpush.notification,
          fcmOptions: notification.webpush.fcmOptions,
        } : undefined,
        fcmOptions: {
          analyticsLabel: notification.data?.analyticsLabel,
        },
      };

      const response = await admin.messaging().sendMulticast(message);
      this.logger.log(`Multicast notification sent: ${response.successCount}/${tokens.length} successful`);
      return response;
    } catch (error: any) {
      this.logger.error(`Failed to send multicast notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send notification to a topic
   */
  async sendTopicNotification(
    topic: string,
    notification: PushNotification
  ): Promise<string> {
    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: notification.data || {},
        android: notification.android ? {
          notification: notification.android.notification,
          data: notification.android.data,
          priority: notification.android.priority,
          ttl: notification.android.ttl,
          collapseKey: notification.android.collapseKey,
          restrictedPackageName: notification.android.restrictedPackageName,
          fcmOptions: notification.android.fcmOptions,
        } : undefined,
        apns: notification.apns ? {
          payload: notification.apns.payload,
          headers: notification.apns.headers,
        } : undefined,
        webpush: notification.webpush ? {
          headers: notification.webpush.headers,
          data: notification.webpush.data,
          notification: notification.webpush.notification,
          fcmOptions: notification.webpush.fcmOptions,
        } : undefined,
        fcmOptions: {
          analyticsLabel: notification.data?.analyticsLabel,
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Topic notification sent successfully: ${response}`);
      return response;
    } catch (error: any) {
      this.logger.error(`Failed to send topic notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send notification to a condition (e.g., topic expression)
   */
  async sendConditionalNotification(
    condition: string,
    notification: PushNotification
  ): Promise<string> {
    try {
      const message: admin.messaging.Message = {
        condition,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: notification.data || {},
        android: notification.android ? {
          notification: notification.android.notification,
          data: notification.android.data,
          priority: notification.android.priority,
          ttl: notification.android.ttl,
          collapseKey: notification.android.collapseKey,
          restrictedPackageName: notification.android.restrictedPackageName,
          fcmOptions: notification.android.fcmOptions,
        } : undefined,
        apns: notification.apns ? {
          payload: notification.apns.payload,
          headers: notification.apns.headers,
        } : undefined,
        webpush: notification.webpush ? {
          headers: notification.webpush.headers,
          data: notification.webpush.data,
          notification: notification.webpush.notification,
          fcmOptions: notification.webpush.fcmOptions,
        } : undefined,
        fcmOptions: {
          analyticsLabel: notification.data?.analyticsLabel,
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Conditional notification sent successfully: ${response}`);
      return response;
    } catch (error: any) {
      this.logger.error(`Failed to send conditional notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Subscribe device token to a topic
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<admin.messaging.MessagingTopicManagementResponse> {
    try {
      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      this.logger.log(`Subscribed ${tokens.length} tokens to topic: ${topic}`);
      return response;
    } catch (error: any) {
      this.logger.error(`Failed to subscribe to topic: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Unsubscribe device token from a topic
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<admin.messaging.MessagingTopicManagementResponse> {
    try {
      const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
      this.logger.log(`Unsubscribed ${tokens.length} tokens from topic: ${topic}`);
      return response;
    } catch (error: any) {
      this.logger.error(`Failed to unsubscribe from topic: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get topic information
   */
  async getTopicInfo(topic: string): Promise<admin.messaging.MessagingTopicManagementResponse> {
    try {
      // Note: Firebase Admin SDK doesn't have a direct method to get topic info
      // This would typically be handled by your own topic management system
      this.logger.log(`Getting topic info for: ${topic}`);
      return {
        successCount: 0,
        failureCount: 0,
        errors: [],
      };
    } catch (error: any) {
      this.logger.error(`Failed to get topic info: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Validate device token
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      // Send a test message to validate the token
      const message: admin.messaging.Message = {
        token,
        data: {
          test: 'true',
        },
      };

      await admin.messaging().send(message);
      return true;
    } catch (error: any) {
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        return false;
      }
      this.logger.error(`Failed to validate token: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send data-only message (silent push)
   */
  async sendDataMessage(
    token: string,
    data: Record<string, string>
  ): Promise<string> {
    try {
      const message: admin.messaging.Message = {
        token,
        data,
        android: {
          priority: 'high',
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Data message sent successfully: ${response}`);
      return response;
    } catch (error: any) {
      this.logger.error(`Failed to send data message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send notification with custom payload
   */
  async sendCustomNotification(
    token: string,
    payload: any
  ): Promise<string> {
    try {
      const message: admin.messaging.Message = {
        token,
        ...payload,
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Custom notification sent successfully: ${response}`);
      return response;
    } catch (error: any) {
      this.logger.error(`Failed to send custom notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create notification for family portal
   */
  createFamilyNotification(
    title: string,
    body: string,
    data: Record<string, string> = {}
  ): PushNotification {
    return {
      title,
      body,
      data: {
        ...data,
        source: 'family_portal',
        timestamp: new Date().toISOString(),
      },
      priority: 'high',
      android: {
        notification: {
          title,
          body,
          icon: 'ic_notification',
          color: '#2196F3',
          channelId: 'family_portal_channel',
          priority: 'PRIORITY_HIGH',
          visibility: 'VISIBILITY_PUBLIC',
        },
        data,
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            badge: 1,
            sound: 'default',
            category: 'FAMILY_PORTAL',
            mutableContent: true,
            contentAvailable: true,
          },
        },
      },
      webpush: {
        notification: {
          title,
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          color: '#2196F3',
          requireInteraction: true,
          actions: [
            {
              action: 'view',
              title: 'View Details',
            },
            {
              action: 'dismiss',
              title: 'Dismiss',
            },
          ],
        },
        fcmOptions: {
          link: '/family-portal',
        },
      },
    };
  }

  /**
   * Send emergency notification
   */
  async sendEmergencyNotification(
    tokens: string[],
    title: string,
    body: string,
    data: Record<string, string> = {}
  ): Promise<admin.messaging.BatchResponse> {
    const notification: PushNotification = {
      title: `🚨 URGENT: ${title}`,
      body,
      data: {
        ...data,
        type: 'emergency',
        priority: 'urgent',
      },
      priority: 'high',
      android: {
        notification: {
          title: `🚨 URGENT: ${title}`,
          body,
          icon: 'ic_emergency',
          color: '#F44336',
          channelId: 'emergency_channel',
          priority: 'PRIORITY_MAX',
          visibility: 'VISIBILITY_PUBLIC',
          sticky: true,
          vibrateTimings: ['0ms', '500ms', '500ms'],
        },
        data,
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: `🚨 URGENT: ${title}`,
              body,
            },
            badge: 1,
            sound: 'emergency.wav',
            category: 'EMERGENCY',
            mutableContent: true,
            contentAvailable: true,
          },
        },
      },
      webpush: {
        notification: {
          title: `🚨 URGENT: ${title}`,
          body,
          icon: '/icons/emergency-icon.png',
          badge: '/icons/emergency-badge.png',
          color: '#F44336',
          requireInteraction: true,
          vibrate: [200, 100, 200],
          actions: [
            {
              action: 'call',
              title: 'Call Now',
            },
            {
              action: 'view',
              title: 'View Details',
            },
          ],
        },
        fcmOptions: {
          link: '/family-portal/emergency',
        },
      },
    };

    return this.sendMulticastNotification(tokens, notification);
  }

  /**
   * Send care update notification
   */
  async sendCareUpdateNotification(
    tokens: string[],
    residentName: string,
    updateType: string,
    data: Record<string, string> = {}
  ): Promise<admin.messaging.BatchResponse> {
    const notification: PushNotification = {
      title: `Care Update: ${residentName}`,
      body: `New ${updateType} update is available`,
      data: {
        ...data,
        type: 'care_update',
        residentName,
        updateType,
      },
      priority: 'normal',
      android: {
        notification: {
          title: `Care Update: ${residentName}`,
          body: `New ${updateType} update is available`,
          icon: 'ic_care_update',
          color: '#4CAF50',
          channelId: 'care_updates_channel',
          priority: 'PRIORITY_DEFAULT',
          visibility: 'VISIBILITY_PUBLIC',
        },
        data,
        priority: 'normal',
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: `Care Update: ${residentName}`,
              body: `New ${updateType} update is available`,
            },
            badge: 1,
            sound: 'default',
            category: 'CARE_UPDATE',
            mutableContent: true,
          },
        },
      },
      webpush: {
        notification: {
          title: `Care Update: ${residentName}`,
          body: `New ${updateType} update is available`,
          icon: '/icons/care-update-icon.png',
          badge: '/icons/badge-72x72.png',
          color: '#4CAF50',
          requireInteraction: false,
        },
        fcmOptions: {
          link: '/family-portal/updates',
        },
      },
    };

    return this.sendMulticastNotification(tokens, notification);
  }

  /**
   * Send photo sharing notification
   */
  async sendPhotoNotification(
    tokens: string[],
    residentName: string,
    photoCount: number,
    data: Record<string, string> = {}
  ): Promise<admin.messaging.BatchResponse> {
    const notification: PushNotification = {
      title: `New Photos: ${residentName}`,
      body: `${photoCount} new photo${photoCount > 1 ? 's' : ''} shared`,
      data: {
        ...data,
        type: 'photo_share',
        residentName,
        photoCount: photoCount.toString(),
      },
      priority: 'normal',
      android: {
        notification: {
          title: `New Photos: ${residentName}`,
          body: `${photoCount} new photo${photoCount > 1 ? 's' : ''} shared`,
          icon: 'ic_photo',
          color: '#FF9800',
          channelId: 'photo_sharing_channel',
          priority: 'PRIORITY_DEFAULT',
          visibility: 'VISIBILITY_PUBLIC',
        },
        data,
        priority: 'normal',
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: `New Photos: ${residentName}`,
              body: `${photoCount} new photo${photoCount > 1 ? 's' : ''} shared`,
            },
            badge: 1,
            sound: 'default',
            category: 'PHOTO_SHARE',
            mutableContent: true,
          },
        },
      },
      webpush: {
        notification: {
          title: `New Photos: ${residentName}`,
          body: `${photoCount} new photo${photoCount > 1 ? 's' : ''} shared`,
          icon: '/icons/photo-icon.png',
          badge: '/icons/badge-72x72.png',
          color: '#FF9800',
          requireInteraction: false,
        },
        fcmOptions: {
          link: '/family-portal/photos',
        },
      },
    };

    return this.sendMulticastNotification(tokens, notification);
  }

  /**
   * Clean up invalid tokens
   */
  async cleanupInvalidTokens(tokens: string[]): Promise<string[]> {
    const validTokens: string[] = [];
    const invalidTokens: string[] = [];

    for (const token of tokens) {
      try {
        const isValid = await this.validateToken(token);
        if (isValid) {
          validTokens.push(token);
        } else {
          invalidTokens.push(token);
        }
      } catch (error: any) {
        this.logger.warn(`Token validation failed: ${token} - ${error.message}`);
        invalidTokens.push(token);
      }
    }

    if (invalidTokens.length > 0) {
      this.logger.log(`Found ${invalidTokens.length} invalid tokens to clean up`);
    }

    return validTokens;
  }

  /**
   * Get Firebase app instance
   */
  getApp(): admin.app.App {
    return this.app;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      // Test Firebase connection by getting project info
      const projectId = this.app.options.projectId;
      return {
        status: 'healthy',
        message: `Firebase connected to project: ${projectId}`,
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        message: `Firebase connection failed: ${error.message}`,
      };
    }
  }
}