/**
 * @fileoverview Production-ready notification service with email, SMS, and push capabilities
 * @module Notifications/NotificationService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Production-ready notification service with email, SMS, and push capabilities
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from 'eventemitter2';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import * as nodemailer from 'nodemailer';
import twilio from 'twilio';
import * as admin from 'firebase-admin';

@Entity('notifications')
@Index(['status', 'createdAt'])
@Index(['type', 'createdAt'])
@Index(['recipients'])
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  message: string;

  @Column()
  type: string;

  @Column('text', { array: true })
  recipients: string[];

  @Column()
  subject: string;

  @Column('text')
  content: string;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 'pending' })
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'read';

  @Column({ nullable: true })
  errorMessage?: string;

  @Column({ nullable: true })
  externalId?: string;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ nullable: true })
  scheduledFor?: Date;

  @Column({ default: false })
  isUrgent: boolean;

  @Column({ nullable: true })
  tenantId?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: string;
  recipients: string[];
  subject: string;
  content: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'read';
  errorMessage?: string;
  externalId?: string;
  retryCount: number;
  scheduledFor?: Date;
  isUrgent: boolean;
  tenantId?: string;
}

export interface NotificationRequest {
  message: string;
  type: string;
  recipients: string[];
  subject: string;
  content: string;
  metadata?: Record<string, any>;
  scheduledFor?: Date;
  isUrgent?: boolean;
  tenantId?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private emailTransporter: nodemailer.Transporter;
  private twilioClient: twilio.Twilio;
  private firebaseApp: admin.app.App;

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.initializeProviders();
  }

  /**
   * Initialize notification providers
   */
  private initializeProviders(): void {
    try {
      // Initialize email transporter
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Initialize Twilio client
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        this.twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
      }

      // Initialize Firebase Admin (for push notifications)
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      }

      this.logger.log('Notification providers initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize notification providers: ${error.message}`, error.stack);
    }
  }

  /**
   * Send a notification
   */
  async sendNotification(request: NotificationRequest): Promise<Notification> {
    try {
      // Create notification record
      const notificationEntity = this.notificationRepository.create({
        message: request.message,
        type: request.type,
        recipients: request.recipients,
        subject: request.subject,
        content: request.content,
        metadata: request.metadata || {},
        scheduledFor: request.scheduledFor,
        isUrgent: request.isUrgent || false,
        tenantId: request.tenantId,
        status: 'pending'
      });

      const savedNotification = await this.notificationRepository.save(notificationEntity);

      // Send immediately if not scheduled
      if (!request.scheduledFor || request.scheduledFor <= new Date()) {
        await this.processNotification(savedNotification);
      }

      return this.mapEntityToNotification(savedNotification);
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`, error.stack);
      throw new Error(`Failed to send notification: ${error.message}`);
    }
  }

  /**
   * Process and send notification based on type
   */
  private async processNotification(notification: NotificationEntity): Promise<void> {
    try {
      let success = false;
      let externalId: string | undefined;
      let errorMessage: string | undefined;

      switch (notification.type.toLowerCase()) {
        case 'email':
          ({ success, externalId, errorMessage } = await this.sendEmail(notification));
          break;
        case 'sms':
          ({ success, externalId, errorMessage } = await this.sendSMS(notification));
          break;
        case 'push':
          ({ success, externalId, errorMessage } = await this.sendPushNotificationInternal(notification));
          break;
        default:
          throw new Error(`Unsupported notification type: ${notification.type}`);
      }

      // Update notification status
      notification.status = success ? 'sent' : 'failed';
      notification.externalId = externalId;
      notification.errorMessage = errorMessage;
      notification.updatedAt = new Date();

      if (!success) {
        notification.retryCount++;
      }

      await this.notificationRepository.save(notification);

      // Emit event
      this.eventEmitter.emit('notification.processed', {
        notificationId: notification.id,
        type: notification.type,
        status: notification.status,
        recipientCount: notification.recipients.length,
        isUrgent: notification.isUrgent
      });

      this.logger.log(`Notification ${notification.id} processed: ${notification.status}`);
    } catch (error) {
      this.logger.error(`Failed to process notification ${notification.id}: ${error.message}`, error.stack);
      
      notification.status = 'failed';
      notification.errorMessage = error.message;
      notification.retryCount++;
      await this.notificationRepository.save(notification);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(notification: NotificationEntity): Promise<{
    success: boolean;
    externalId?: string;
    errorMessage?: string;
  }> {
    try {
      if (!this.emailTransporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: notification.recipients.join(', '),
        subject: notification.subject,
        html: notification.content,
        text: notification.message,
        headers: {
          'X-Notification-ID': notification.id,
          'X-Tenant-ID': notification.tenantId || 'default'
        }
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      
      return {
        success: true,
        externalId: result.messageId
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return {
        success: false,
        errorMessage: error.message
      };
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(notification: NotificationEntity): Promise<{
    success: boolean;
    externalId?: string;
    errorMessage?: string;
  }> {
    try {
      if (!this.twilioClient) {
        throw new Error('Twilio client not initialized');
      }

      const results = await Promise.allSettled(
        notification.recipients.map(async (recipient) => {
          const message = await this.twilioClient.messages.create({
            body: notification.message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: recipient
          });
          return message.sid;
        })
      );

      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');

      if (failed.length > 0) {
        this.logger.warn(`Some SMS messages failed to send: ${failed.length}/${results.length}`);
      }

      return {
        success: successful.length > 0,
        externalId: successful.length > 0 ? (successful[0] as PromiseFulfilledResult<string>).value : undefined,
        errorMessage: failed.length > 0 ? `${failed.length} messages failed` : undefined
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      return {
        success: false,
        errorMessage: error.message
      };
    }
  }

  /**
   * Send push notification (internal method)
   */
  private async sendPushNotificationInternal(notification: NotificationEntity): Promise<{
    success: boolean;
    externalId?: string;
    errorMessage?: string;
  }> {
    try {
      if (!this.firebaseApp) {
        throw new Error('Firebase app not initialized');
      }

      const messaging = admin.messaging(this.firebaseApp);
      
      const message = {
        notification: {
          title: notification.subject,
          body: notification.message
        },
        data: notification.metadata,
        tokens: notification.recipients
      };

      const response = await messaging.sendEachForMulticast(message);
      
      return {
        success: response.successCount > 0,
        externalId: response.responses[0]?.messageId,
        errorMessage: response.failureCount > 0 ? `${response.failureCount} messages failed` : undefined
      };
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`, error.stack);
      return {
        success: false,
        errorMessage: error.message
      };
    }
  }

  /**
   * Send email notification (convenience method)
   */
  async sendEmailNotification(
    to: string[],
    subject: string,
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<Notification> {
    return this.sendNotification({
      message: content.replace(/<[^>]*>/g, ''), // Strip HTML for message
      type: 'email',
      recipients: to,
      subject,
      content,
      metadata
    });
  }

  /**
   * Send SMS notification (convenience method)
   */
  async sendSMSNotification(
    to: string[],
    message: string,
    metadata: Record<string, any> = {}
  ): Promise<Notification> {
    return this.sendNotification({
      message,
      type: 'sms',
      recipients: to,
      subject: 'SMS Notification',
      content: message,
      metadata
    });
  }

  /**
   * Send push notification (convenience method)
   */
  async sendPushNotification(
    to: string[],
    title: string,
    body: string,
    metadata: Record<string, any> = {}
  ): Promise<Notification> {
    return this.sendNotification({
      message: body,
      type: 'push',
      recipients: to,
      subject: title,
      content: body,
      metadata
    });
  }

  /**
   * Get notification by ID
   */
  async getNotification(id: string): Promise<Notification | null> {
    try {
      const notification = await this.notificationRepository.findOne({ where: { id } });
      return notification ? this.mapEntityToNotification(notification) : null;
    } catch (error) {
      this.logger.error(`Failed to get notification: ${error.message}`, error.stack);
      throw new Error(`Failed to get notification: ${error.message}`);
    }
  }

  /**
   * Get notifications for a recipient
   */
  async getNotificationsForRecipient(recipient: string, limit = 50): Promise<Notification[]> {
    try {
      const notifications = await this.notificationRepository
        .createQueryBuilder('notification')
        .where(':recipient = ANY(notification.recipients)', { recipient })
        .orderBy('notification.createdAt', 'DESC')
        .limit(limit)
        .getMany();

      return notifications.map(this.mapEntityToNotification);
    } catch (error) {
      this.logger.error(`Failed to get notifications for recipient: ${error.message}`, error.stack);
      throw new Error(`Failed to get notifications for recipient: ${error.message}`);
    }
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(maxRetries = 3): Promise<number> {
    try {
      const failedNotifications = await this.notificationRepository.find({
        where: {
          status: 'failed',
          retryCount: { $lt: maxRetries } as any
        },
        take: 100
      });

      let retriedCount = 0;
      for (const notification of failedNotifications) {
        await this.processNotification(notification);
        retriedCount++;
      }

      this.logger.log(`Retried ${retriedCount} failed notifications`);
      return retriedCount;
    } catch (error) {
      this.logger.error(`Failed to retry notifications: ${error.message}`, error.stack);
      throw new Error(`Failed to retry notifications: ${error.message}`);
    }
  }

  /**
   * Send high value transaction alert (for FinancialAnalyticsService compatibility)
   */
  async sendHighValueTransactionAlert(alert: {
    transactionId: string;
    amount: any;
    userId: string;
    correlationId: string;
  }): Promise<void> {
    await this.sendNotification({
      message: `High value transaction alert: ${alert.amount} for transaction ${alert.transactionId}`,
      type: 'email',
      recipients: ['finance@writecarenotes.com', 'compliance@writecarenotes.com'],
      subject: 'High Value Transaction Alert',
      content: `A high value transaction has been processed. Transaction ID: ${alert.transactionId}, Amount: ${alert.amount}`,
      metadata: {
        transactionId: alert.transactionId,
        amount: alert.amount.toString(),
        userId: alert.userId,
        correlationId: alert.correlationId,
        alertType: 'high_value_transaction'
      },
      isUrgent: true
    });
  }

  /**
   * Map entity to notification interface
   */
  private mapEntityToNotification(entity: NotificationEntity): Notification {
    return {
      id: entity.id,
      message: entity.message,
      type: entity.type,
      recipients: entity.recipients,
      subject: entity.subject,
      content: entity.content,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      status: entity.status,
      errorMessage: entity.errorMessage,
      externalId: entity.externalId,
      retryCount: entity.retryCount,
      scheduledFor: entity.scheduledFor,
      isUrgent: entity.isUrgent,
      tenantId: entity.tenantId
    };
  }
}

export default NotificationService;