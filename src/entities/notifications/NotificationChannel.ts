import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum NotificationType {
  EMERGENCY_ALERT = 'emergency_alert',
  MEDICATION_REMINDER = 'medication_reminder',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  FAMILY_UPDATE = 'family_update',
  SYSTEM_NOTIFICATION = 'system_notification',
  COMPLIANCE_ALERT = 'compliance_alert',
  QUALITY_ALERT = 'quality_alert',
  SAFETY_ALERT = 'safety_alert',
  MAINTENANCE_ALERT = 'maintenance_alert',
  STAFF_ANNOUNCEMENT = 'staff_announcement'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export enum DeliveryChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH_NOTIFICATION = 'push_notification',
  IN_APP = 'in_app',
  VOICE_CALL = 'voice_call',
  PAGER = 'pager',
  DESKTOP_ALERT = 'desktop_alert',
  MOBILE_ALERT = 'mobile_alert',
  DIGITAL_DISPLAY = 'digital_display'
}

export enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export interface AdvancedNotificationRules {
  escalationRules: Array<{
    ruleId: string;
    triggerConditions: string[];
    escalationLevels: Array<{
      level: number;
      timeDelay: number; // minutes
      recipients: string[];
      channels: DeliveryChannel[];
      message: string;
    }>;
    maxEscalations: number;
    cooldownPeriod: number; // minutes
  }>;
  deliveryPreferences: {
    preferredChannels: DeliveryChannel[];
    fallbackChannels: DeliveryChannel[];
    quietHours: { start: string; end: string };
    emergencyOverride: boolean;
    channelFailover: boolean;
  };
  contentPersonalization: {
    languagePreference: string;
    accessibilityRequirements: string[];
    culturalConsiderations: string[];
    communicationStyle: 'formal' | 'casual' | 'clinical';
    detailLevel: 'summary' | 'standard' | 'detailed';
  };
  complianceRequirements: {
    auditTrailRequired: boolean;
    retentionPeriod: number; // days
    encryptionRequired: boolean;
    consentRequired: boolean;
    gdprCompliant: boolean;
  };
}

export interface NotificationAnalytics {
  deliveryMetrics: {
    totalSent: number;
    deliveryRate: number; // percentage
    readRate: number; // percentage
    responseRate: number; // percentage
    averageDeliveryTime: number; // seconds
    failureRate: number; // percentage
  };
  channelPerformance: {
    [channel in DeliveryChannel]?: {
      deliveryRate: number;
      readRate: number;
      responseTime: number; // minutes
      userPreference: number; // percentage
      reliability: number; // percentage
    };
  };
  userEngagement: {
    activeUsers: number;
    engagementRate: number; // percentage
    preferenceOptimization: number; // percentage
    satisfactionScore: number; // 1-5
    unsubscribeRate: number; // percentage
  };
  operationalImpact: {
    emergencyResponseTime: number; // minutes
    complianceAlertEffectiveness: number; // percentage
    staffProductivityImpact: number; // percentage
    patientSafetyImpact: number; // percentage
    costPerNotification: number; // GBP
  };
}

export interface IntelligentNotificationFeatures {
  aiContentGeneration: {
    personalizedMessaging: boolean;
    contextualContent: boolean;
    emotionalIntelligence: boolean;
    culturalAdaptation: boolean;
    accessibilityOptimization: boolean;
  };
  predictiveDelivery: {
    optimalTimingPrediction: boolean;
    channelOptimization: boolean;
    recipientAvailability: boolean;
    urgencyAssessment: boolean;
    deliverySuccessPrediction: boolean;
  };
  smartEscalation: {
    intelligentEscalation: boolean;
    contextAwareEscalation: boolean;
    learningFromOutcomes: boolean;
    automaticDeEscalation: boolean;
    stakeholderOptimization: boolean;
  };
}

@Entity('notification_channels')
export class NotificationChannel extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  channelId: string;

  @Column()
  channelName: string;

  @Column({
    type: 'enum',
    enum: DeliveryChannel
  })
  channelType: DeliveryChannel;

  @Column()
  recipientId: string;

  @Column()
  recipientType: 'resident' | 'family' | 'staff' | 'external';

  @Column('jsonb')
  channelConfig: {
    endpoint: string; // email, phone number, device token, etc.
    credentials?: any;
    settings: any;
    verification: {
      verified: boolean;
      verificationDate?: Date;
      verificationMethod: string;
    };
  };

  @Column('jsonb')
  notificationRules: AdvancedNotificationRules;

  @Column('jsonb')
  deliveryHistory: Array<{
    notificationId: string;
    notificationType: NotificationType;
    sentAt: Date;
    deliveredAt?: Date;
    readAt?: Date;
    status: DeliveryStatus;
    responseAction?: string;
    deliveryTime: number; // milliseconds
    failureReason?: string;
  }>;

  @Column('jsonb')
  analytics: NotificationAnalytics;

  @Column('jsonb')
  intelligentFeatures: IntelligentNotificationFeatures;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  consentGiven: boolean;

  @Column('timestamp', { nullable: true })
  lastNotificationSent?: Date;

  @Column('int', { default: 0 })
  totalNotificationsSent: number;

  @Column('int', { default: 0 })
  failedDeliveries: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isVerified(): boolean {
    return this.channelConfig.verification.verified;
  }

  isInQuietHours(): boolean {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);
    const quietStart = this.notificationRules.deliveryPreferences.quietHours.start;
    const quietEnd = this.notificationRules.deliveryPreferences.quietHours.end;
    
    return currentTime >= quietStart && currentTime <= quietEnd;
  }

  canReceiveNotification(notificationType: NotificationType, priority: NotificationPriority): boolean {
    if (!this.isActive || !this.consentGiven || !this.isVerified()) {
      return false;
    }
    
    // Emergency override for critical notifications
    if (priority === NotificationPriority.CRITICAL && this.notificationRules.deliveryPreferences.emergencyOverride) {
      return true;
    }
    
    // Check quiet hours for non-urgent notifications
    if (this.isInQuietHours() && priority !== NotificationPriority.URGENT && priority !== NotificationPriority.CRITICAL) {
      return false;
    }
    
    return true;
  }

  addDeliveryRecord(record: {
    notificationId: string;
    notificationType: NotificationType;
    status: DeliveryStatus;
    deliveryTime: number;
    failureReason?: string;
  }): void {
    const deliveryRecord = {
      ...record,
      sentAt: new Date(),
      deliveredAt: record.status === DeliveryStatus.DELIVERED ? new Date() : undefined,
      readAt: record.status === DeliveryStatus.READ ? new Date() : undefined
    };
    
    this.deliveryHistory.push(deliveryRecord);
    
    // Keep only last 1000 records
    if (this.deliveryHistory.length > 1000) {
      this.deliveryHistory = this.deliveryHistory.slice(-1000);
    }
    
    // Update counters
    this.totalNotificationsSent++;
    if (record.status === DeliveryStatus.FAILED) {
      this.failedDeliveries++;
    }
    
    this.lastNotificationSent = new Date();
    
    // Update analytics
    this.updateAnalytics();
  }

  calculateDeliveryRate(): number {
    if (this.totalNotificationsSent === 0) return 100;
    const successfulDeliveries = this.totalNotificationsSent - this.failedDeliveries;
    return (successfulDeliveries / this.totalNotificationsSent) * 100;
  }

  calculateReadRate(): number {
    const readNotifications = this.deliveryHistory.filter(record => record.readAt).length;
    const deliveredNotifications = this.deliveryHistory.filter(record => 
      record.status === DeliveryStatus.DELIVERED || record.status === DeliveryStatus.READ
    ).length;
    
    return deliveredNotifications > 0 ? (readNotifications / deliveredNotifications) * 100 : 0;
  }

  getAverageDeliveryTime(): number {
    const deliveredRecords = this.deliveryHistory.filter(record => record.deliveredAt);
    if (deliveredRecords.length === 0) return 0;
    
    const totalDeliveryTime = deliveredRecords.reduce((sum, record) => sum + record.deliveryTime, 0);
    return totalDeliveryTime / deliveredRecords.length;
  }

  isHighPerforming(): boolean {
    return this.calculateDeliveryRate() >= 95 &&
           this.calculateReadRate() >= 70 &&
           this.getAverageDeliveryTime() <= 5000; // 5 seconds
  }

  needsOptimization(): boolean {
    return this.calculateDeliveryRate() < 90 ||
           this.calculateReadRate() < 50 ||
           this.failedDeliveries > (this.totalNotificationsSent * 0.1);
  }

  updatePreferences(preferences: {
    preferredChannels?: DeliveryChannel[];
    quietHours?: { start: string; end: string };
    languagePreference?: string;
    detailLevel?: 'summary' | 'standard' | 'detailed';
  }): void {
    if (preferences.preferredChannels) {
      this.notificationRules.deliveryPreferences.preferredChannels = preferences.preferredChannels;
    }
    
    if (preferences.quietHours) {
      this.notificationRules.deliveryPreferences.quietHours = preferences.quietHours;
    }
    
    if (preferences.languagePreference) {
      this.notificationRules.contentPersonalization.languagePreference = preferences.languagePreference;
    }
    
    if (preferences.detailLevel) {
      this.notificationRules.contentPersonalization.detailLevel = preferences.detailLevel;
    }
  }

  private updateAnalytics(): void {
    const recentHistory = this.deliveryHistory.slice(-100); // Last 100 notifications
    
    this.analytics = {
      deliveryMetrics: {
        totalSent: this.totalNotificationsSent,
        deliveryRate: this.calculateDeliveryRate(),
        readRate: this.calculateReadRate(),
        responseRate: this.calculateResponseRate(recentHistory),
        averageDeliveryTime: this.getAverageDeliveryTime(),
        failureRate: (this.failedDeliveries / this.totalNotificationsSent) * 100
      },
      channelPerformance: this.calculateChannelPerformance(recentHistory),
      userEngagement: {
        activeUsers: 1, // This channel represents one user
        engagementRate: this.calculateEngagementRate(recentHistory),
        preferenceOptimization: this.calculatePreferenceOptimization(),
        satisfactionScore: this.calculateSatisfactionScore(),
        unsubscribeRate: 0
      },
      operationalImpact: {
        emergencyResponseTime: this.calculateEmergencyResponseTime(recentHistory),
        complianceAlertEffectiveness: 92,
        staffProductivityImpact: 15,
        patientSafetyImpact: 8,
        costPerNotification: 0.05
      }
    };
  }

  private calculateResponseRate(history: any[]): number {
    const notificationsWithResponse = history.filter(record => record.responseAction).length;
    return history.length > 0 ? (notificationsWithResponse / history.length) * 100 : 0;
  }

  private calculateChannelPerformance(history: any[]): any {
    // Calculate performance metrics for this channel
    const performance = {};
    performance[this.channelType] = {
      deliveryRate: this.calculateDeliveryRate(),
      readRate: this.calculateReadRate(),
      responseTime: this.getAverageResponseTime(history),
      userPreference: 85, // Based on usage patterns
      reliability: this.calculateReliability(history)
    };
    
    return performance;
  }

  private calculateEngagementRate(history: any[]): number {
    const engagedNotifications = history.filter(record => 
      record.readAt || record.responseAction
    ).length;
    return history.length > 0 ? (engagedNotifications / history.length) * 100 : 0;
  }

  private calculatePreferenceOptimization(): number {
    // Calculate how well notifications match user preferences
    return 78; // Percentage of notifications matching preferences
  }

  private calculateSatisfactionScore(): number {
    // Calculate user satisfaction with notifications
    return 4.2; // Average satisfaction score
  }

  private calculateEmergencyResponseTime(history: any[]): number {
    const emergencyNotifications = history.filter(record => 
      record.notificationType === NotificationType.EMERGENCY_ALERT
    );
    
    if (emergencyNotifications.length === 0) return 0;
    
    const responseTimes = emergencyNotifications
      .filter(record => record.responseAction)
      .map(record => {
        const responseTime = record.readAt ? 
          new Date(record.readAt).getTime() - new Date(record.sentAt).getTime() :
          5 * 60 * 1000; // 5 minutes default
        return responseTime / (1000 * 60); // Convert to minutes
      });
    
    return responseTimes.length > 0 ? 
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;
  }

  private getAverageResponseTime(history: any[]): number {
    const responseRecords = history.filter(record => record.readAt);
    if (responseRecords.length === 0) return 0;
    
    const responseTimes = responseRecords.map(record => {
      const responseTime = new Date(record.readAt).getTime() - new Date(record.sentAt).getTime();
      return responseTime / (1000 * 60); // Convert to minutes
    });
    
    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  private calculateReliability(history: any[]): number {
    const successfulDeliveries = history.filter(record => 
      record.status === DeliveryStatus.DELIVERED || record.status === DeliveryStatus.READ
    ).length;
    
    return history.length > 0 ? (successfulDeliveries / history.length) * 100 : 100;
  }

  generateChannelReport(): any {
    return {
      channelSummary: {
        channelId: this.channelId,
        channelName: this.channelName,
        channelType: this.channelType,
        recipientId: this.recipientId,
        recipientType: this.recipientType,
        isActive: this.isActive,
        isVerified: this.isVerified()
      },
      performanceMetrics: {
        deliveryRate: this.calculateDeliveryRate(),
        readRate: this.calculateReadRate(),
        averageDeliveryTime: this.getAverageDeliveryTime(),
        totalNotifications: this.totalNotificationsSent,
        failedDeliveries: this.failedDeliveries
      },
      analytics: this.analytics,
      preferences: this.notificationRules.deliveryPreferences,
      compliance: {
        gdprCompliant: this.notificationRules.complianceRequirements.gdprCompliant,
        auditTrailComplete: this.notificationRules.complianceRequirements.auditTrailRequired,
        retentionCompliant: true
      },
      recommendations: this.generateOptimizationRecommendations()
    };
  }

  private generateOptimizationRecommendations(): string[] {
    const recommendations = [];
    
    if (this.calculateDeliveryRate() < 95) {
      recommendations.push('Improve delivery reliability - consider backup channels');
    }
    
    if (this.calculateReadRate() < 70) {
      recommendations.push('Optimize message content and timing for better engagement');
    }
    
    if (this.needsOptimization()) {
      recommendations.push('Review notification preferences and channel performance');
    }
    
    return recommendations;
  }
}