import { EventEmitter2 } from 'eventemitter2';
import { Logger } from '@nestjs/common';

export interface Notification {
  id: string;
  message: string;
  type: string;
  recipients: string[];
  subject: string;
  content: string;
  metadata: Record<string, any>;
  createdAt: Date;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
}

export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private eventEmitter: EventEmitter2;

  constructor(eventEmitter: EventEmitter2) {
    this.eventEmitter = eventEmitter;
  }

  async sendNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'status'>): Promise<Notification> {
    try {
      const newNotification: Notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        ...notification,
        createdAt: new Date(),
        status: 'pending'
      };

      // In a real implementation, this would send actual notifications
      this.logger.log(`Sending notification: ${notification.subject} to ${notification.recipients.length} recipients`);
      
      // Simulate sending
      newNotification.status = 'sent';
      
      // Emit event
      this.eventEmitter.emit('notification.sent', {
        notificationId: newNotification.id,
        type: notification.type,
        recipientCount: notification.recipients.length
      });

      return newNotification;
    } catch (error) {
      this.logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  async sendEmailNotification(
    to: string[],
    subject: string,
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<Notification> {
    return this.sendNotification({
      message: content,
      type: 'email',
      recipients: to,
      subject,
      content,
      metadata
    });
  }

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
}

export default NotificationService;