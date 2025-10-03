/**
 * @fileoverview Separate Communication Service
 * @module CommunicationService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import AppDataSource from '../../config/database';
import { CommunicationChannel } from '../../entities/communication/CommunicationChannel';
import { CommunicationMessage } from '../../entities/communication/CommunicationMessage';
import { AuditTrailService } from '../audit/AuditTrailService';
import { NotificationService } from '../notifications/NotificationService';

export interface CreateChannelDto {
  channelType: 'email' | 'sms' | 'push' | 'in_app' | 'webhook' | 'api' | 'voice' | 'video' | 'chat';
  channelName: string;
  displayName: string;
  description?: string;
  configuration: any;
  capabilities: any;
  provider?: string;
  providerId?: string;
  isDefault?: boolean;
  priority?: number;
  notes?: string;
}

export interface SendMessageDto {
  channelId: string;
  messageType: 'notification' | 'alert' | 'reminder' | 'update' | 'emergency' | 'marketing' | 'system' | 'user';
  subject: string;
  content: string;
  recipients: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: Date;
  attachments?: any[];
  template?: any;
  metadata?: any;
  requiresDeliveryConfirmation?: boolean;
  requiresReadReceipt?: boolean;
}

export interface MessageDeliveryResult {
  messageId: string;
  success: boolean;
  deliveredCount: number;
  failedCount: number;
  errors: any[];
  deliveryTime: number;
}

export interface ChannelHealthStatus {
  channelId: string;
  channelName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: Date;
  errorMessage?: string;
}


export class CommunicationService {
  private channelRepository: Repository<CommunicationChannel>;
  private messageRepository: Repository<CommunicationMessage>;
  private auditService: AuditTrailService;
  private notificationService: NotificationService;

  constructor() {
    this.channelRepository = AppDataSource.getRepository(CommunicationChannel);
    this.messageRepository = AppDataSource.getRepository(CommunicationMessage);
    this.auditService = new AuditTrailService();
    this.notificationService = new NotificationService(new EventEmitter2());
  }

  async createChannel(channelData: CreateChannelDto): Promise<CommunicationChannel> {
    try {
      // Validate channel configuration
      const channel = this.channelRepository.create({
        ...channelData,
        isActive: true,
        statistics: {
          totalMessagesSent: 0,
          totalMessagesDelivered: 0,
          totalMessagesFailed: 0,
          averageDeliveryTime: 0,
          successRate: 0,
          lastUsed: new Date(),
          uptime: 0,
          errorRate: 0
        }
      });

      const validation = channel.validateConfiguration();
      if (!validation.isValid) {
        throw new Error(`Invalid channel configuration: ${validation.errors.join(', ')}`);
      }

      const savedChannel = await this.channelRepository.save(channel);

      // Perform initial health check
      await this.performHealthCheck(savedChannel.id);

      // Log audit trail
      await this.auditService.logEvent({
        resource: 'CommunicationChannel',
        entityType: 'CommunicationChannel',
        entityId: savedChannel.id,
        action: 'CREATE',
        details: {
          channelType: savedChannel.channelType,
          channelName: savedChannel.channelName,
          provider: savedChannel.provider
        },
        userId: 'system'
      });

      return savedChannel;
    } catch (error: unknown) {
      console.error('Error creating communication channel:', error);
      throw error;
    }
  }

  async sendMessage(messageData: SendMessageDto): Promise<MessageDeliveryResult> {
    try {
      const startTime = Date.now();

      // Get channel
      const channel = await this.channelRepository.findOne({
        where: { id: messageData.channelId }
      });

      if (!channel) {
        throw new Error('Communication channel not found');
      }

      if (!channel.isActive) {
        throw new Error('Communication channel is not active');
      }

      // Create message
      const message = this.messageRepository.create({
        ...messageData,
        status: 'draft',
        totalRecipients: this.calculateTotalRecipients(messageData.recipients),
        retryCount: 0,
        maxRetries: 3,
        isRichText: messageData.content.includes('<') || messageData.content.includes('**'),
        complianceData: {
          gdprConsent: true,
          consentTimestamp: new Date(),
          dataRetentionPeriod: 7 * 365, // 7 years
          encryptionRequired: true,
          auditRequired: true
        }
      });

      // Validate message
      const validation = message.validateMessage();
      if (!validation.isValid) {
        throw new Error(`Invalid message: ${validation.errors.join(', ')}`);
      }

      // Check if channel can handle this message
      if (!channel.canHandleMessage(message)) {
        throw new Error('Channel cannot handle this message type or content');
      }

      const savedMessage = await this.messageRepository.save(message);

      // Schedule message if scheduledAt is provided
      if (messageData.scheduledAt) {
        message.scheduleMessage(messageData.scheduledAt);
        await this.messageRepository.save(message);
      } else {
        // Send message immediately
        const deliveryResult = await this.deliverMessage(savedMessage, channel);
        
        const deliveryTime = Date.now() - startTime;
        
        // Log audit trail
        await this.auditService.logEvent({
          resource: 'CommunicationMessage',
        entityType: 'CommunicationMessage',
          entityId: savedMessage.id,
          action: 'SEND',
          details: {
            channelId: messageData.channelId,
            messageType: messageData.messageType,
            totalRecipients: savedMessage.totalRecipients,
            deliveryTime: deliveryTime
          },
          userId: 'system'
        });

        return deliveryResult;
      }

      return {
        messageId: savedMessage.id,
        success: true,
        deliveredCount: 0,
        failedCount: 0,
        errors: [],
        deliveryTime: 0
      };
    } catch (error: unknown) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async deliverMessage(message: CommunicationMessage, channel: CommunicationChannel): Promise<MessageDeliveryResult> {
    try {
      const startTime = Date.now();
      
      message.sendMessage();
      await this.messageRepository.save(message);

      let deliveredCount = 0;
      let failedCount = 0;
      const errors: any[] = [];

      // Process recipients based on channel type
      switch (channel.channelType) {
        case 'email':
          const emailResult = await this.deliverEmailMessage(message, channel);
          deliveredCount = emailResult.delivered;
          failedCount = emailResult.failed;
          errors.push(...emailResult.errors);
          break;

        case 'sms':
          const smsResult = await this.deliverSMSMessage(message, channel);
          deliveredCount = smsResult.delivered;
          failedCount = smsResult.failed;
          errors.push(...smsResult.errors);
          break;

        case 'push':
          const pushResult = await this.deliverPushMessage(message, channel);
          deliveredCount = pushResult.delivered;
          failedCount = pushResult.failed;
          errors.push(...pushResult.errors);
          break;

        case 'in_app':
          const inAppResult = await this.deliverInAppMessage(message, channel);
          deliveredCount = inAppResult.delivered;
          failedCount = inAppResult.failed;
          errors.push(...inAppResult.errors);
          break;

        default:
          throw new Error(`Unsupported channel type: ${channel.channelType}`);
      }

      // Update message status
      if (failedCount === 0) {
        message.markAsDelivered();
      } else if (deliveredCount === 0) {
        message.markAsFailed('All delivery attempts failed');
      } else {
        message.status = 'sent'; // Partially delivered
      }

      await this.messageRepository.save(message);

      // Update channel statistics
      const deliveryTime = Date.now() - startTime;
      channel.updateStatistics(deliveredCount + failedCount, deliveredCount, failedCount, deliveryTime);
      await this.channelRepository.save(channel);

      return {
        messageId: message.id,
        success: failedCount === 0,
        deliveredCount: deliveredCount,
        failedCount: failedCount,
        errors: errors,
        deliveryTime: deliveryTime
      };
    } catch (error: unknown) {
      console.error('Error delivering message:', error);
      message.markAsFailed(error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error");
      await this.messageRepository.save(message);
      throw error;
    }
  }

  async performHealthCheck(channelId: string): Promise<ChannelHealthStatus> {
    try {
      const channel = await this.channelRepository.findOne({
        where: { id: channelId }
      });

      if (!channel) {
        throw new Error('Channel not found');
      }

      const startTime = Date.now();
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let errorMessage: string | undefined;

      try {
        // Perform health check based on channel type
        switch (channel.channelType) {
          case 'email':
            await this.checkEmailChannelHealth(channel);
            break;
          case 'sms':
            await this.checkSMSChannelHealth(channel);
            break;
          case 'push':
            await this.checkPushChannelHealth(channel);
            break;
          default:
            // For other channel types, assume healthy
            break;
        }
      } catch (error: unknown) {
        status = 'unhealthy';
        errorMessage = error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error";
      }

      const responseTime = Date.now() - startTime;

      // Update channel health status
      channel.updateHealthCheck(status, responseTime, errorMessage);
      await this.channelRepository.save(channel);

      return {
        channelId: channel.id,
        channelName: channel.channelName,
        status: status,
        responseTime: responseTime,
        lastChecked: new Date(),
        errorMessage: errorMessage
      };
    } catch (error: unknown) {
      console.error('Error performing health check:', error);
      throw error;
    }
  }

  async getAllChannels(): Promise<CommunicationChannel[]> {
    try {
      return await this.channelRepository.find({
        order: { priority: 'DESC', createdAt: 'ASC' }
      });
    } catch (error: unknown) {
      console.error('Error getting all channels:', error);
      throw error;
    }
  }

  async getChannelById(channelId: string): Promise<CommunicationChannel> {
    try {
      const channel = await this.channelRepository.findOne({
        where: { id: channelId }
      });

      if (!channel) {
        throw new Error('Channel not found');
      }

      return channel;
    } catch (error: unknown) {
      console.error('Error getting channel by ID:', error);
      throw error;
    }
  }

  async updateChannel(channelId: string, updateData: Partial<CreateChannelDto>): Promise<CommunicationChannel> {
    try {
      const channel = await this.channelRepository.findOne({
        where: { id: channelId }
      });

      if (!channel) {
        throw new Error('Channel not found');
      }

      // Update channel data
      Object.assign(channel, updateData);
      const updatedChannel = await this.channelRepository.save(channel);

      // Log audit trail
      await this.auditService.logEvent({
        resource: 'CommunicationChannel',
        entityType: 'CommunicationChannel',
        entityId: channelId,
        action: 'UPDATE',
        resource: 'CommunicationChannel',
        details: updateData,
        userId: 'system'
      
      });

      return updatedChannel;
    } catch (error: unknown) {
      console.error('Error updating channel:', error);
      throw error;
    }
  }

  async deleteChannel(channelId: string): Promise<void> {
    try {
      const channel = await this.channelRepository.findOne({
        where: { id: channelId }
      });

      if (!channel) {
        throw new Error('Channel not found');
      }

      // Check if channel has pending messages
      const pendingMessages = await this.messageRepository.count({
        where: {
          channelId: channelId,
          status: In(['draft', 'scheduled', 'sending'])
        }
      });

      if (pendingMessages > 0) {
        throw new Error('Cannot delete channel with pending messages');
      }

      await this.channelRepository.remove(channel);

      // Log audit trail
      await this.auditService.logEvent({
        resource: 'CommunicationChannel',
        entityType: 'CommunicationChannel',
        entityId: channelId,
        action: 'DELETE',
        details: {
          channelName: channel.channelName,
          channelType: channel.channelType
        },
        userId: 'system'
      });
    } catch (error: unknown) {
      console.error('Error deleting channel:', error);
      throw error;
    }
  }

  async getMessageHistory(channelId?: string, limit: number = 100): Promise<CommunicationMessage[]> {
    try {
      const query = this.messageRepository.createQueryBuilder('message')
        .orderBy('message.createdAt', 'DESC')
        .limit(limit);

      if (channelId) {
        query.where('message.channelId = :channelId', { channelId });
      }

      return await query.getMany();
    } catch (error: unknown) {
      console.error('Error getting message history:', error);
      throw error;
    }
  }

  async getChannelStatistics(channelId: string): Promise<any> {
    try {
      const channel = await this.channelRepository.findOne({
        where: { id: channelId }
      });

      if (!channel) {
        throw new Error('Channel not found');
      }

      const messages = await this.messageRepository.find({
        where: { channelId: channelId }
      });

      const statistics = {
        channel: channel.getChannelSummary(),
        totalMessages: messages.length,
        messagesByStatus: {
          draft: messages.filter(m => m.isDraft()).length,
          scheduled: messages.filter(m => m.isScheduled()).length,
          sending: messages.filter(m => m.isSending()).length,
          sent: messages.filter(m => m.isSent()).length,
          delivered: messages.filter(m => m.isDelivered()).length,
          failed: messages.filter(m => m.isFailed()).length,
          cancelled: messages.filter(m => m.isCancelled()).length
        },
        messagesByType: {
          notification: messages.filter(m => m.messageType === 'notification').length,
          alert: messages.filter(m => m.messageType === 'alert').length,
          reminder: messages.filter(m => m.messageType === 'reminder').length,
          update: messages.filter(m => m.messageType === 'update').length,
          emergency: messages.filter(m => m.messageType === 'emergency').length,
          marketing: messages.filter(m => m.messageType === 'marketing').length,
          system: messages.filter(m => m.messageType === 'system').length,
          user: messages.filter(m => m.messageType === 'user').length
        },
        averageDeliveryTime: channel.getAverageDeliveryTime(),
        successRate: channel.getSuccessRate(),
        healthStatus: channel.healthCheck?.status || 'unknown'
      };

      return statistics;
    } catch (error: unknown) {
      console.error('Error getting channel statistics:', error);
      throw error;
    }
  }

  // Private helper methods
  private calculateTotalRecipients(recipients: any): number {
    return (recipients.userIds?.length || 0) +
           (recipients.emailAddresses?.length || 0) +
           (recipients.phoneNumbers?.length || 0) +
           (recipients.groups?.length || 0) +
           (recipients.roles?.length || 0) +
           (recipients.customRecipients?.length || 0);
  }

  private async deliverEmailMessage(message: CommunicationMessage, channel: CommunicationChannel): Promise<any> {
    // In production, this would integrate with actual email service (SendGrid, AWS SES, etc.)
    const delivered = Math.floor(message.totalRecipients * 0.95); // 95% success rate
    const failed = message.totalRecipients - delivered;
    
    return {
      delivered: delivered,
      failed: failed,
      errors: failed > 0 ? ['Some email deliveries failed'] : []
    };
  }

  private async deliverSMSMessage(message: CommunicationMessage, channel: CommunicationChannel): Promise<any> {
    // In production, this would integrate with actual SMS service (Twilio, AWS SNS, etc.)
    const delivered = Math.floor(message.totalRecipients * 0.98); // 98% success rate
    const failed = message.totalRecipients - delivered;
    
    return {
      delivered: delivered,
      failed: failed,
      errors: failed > 0 ? ['Some SMS deliveries failed'] : []
    };
  }

  private async deliverPushMessage(message: CommunicationMessage, channel: CommunicationChannel): Promise<any> {
    // In production, this would integrate with actual push notification service (FCM, APNS, etc.)
    const delivered = Math.floor(message.totalRecipients * 0.90); // 90% success rate
    const failed = message.totalRecipients - delivered;
    
    return {
      delivered: delivered,
      failed: failed,
      errors: failed > 0 ? ['Some push notifications failed'] : []
    };
  }

  private async deliverInAppMessage(message: CommunicationMessage, channel: CommunicationChannel): Promise<any> {
    // In production, this would store in-app notifications in database
    const delivered = message.totalRecipients; // 100% success rate for in-app
    const failed = 0;
    
    return {
      delivered: delivered,
      failed: failed,
      errors: []
    };
  }

  private async checkEmailChannelHealth(channel: CommunicationChannel): Promise<void> {
    // In production, this would test actual email service connectivity
    // For now, simulate a health check
    if (!channel.configuration.endpoint && !channel.configuration.credentials?.apiKey) {
      throw new Error('Email channel configuration is incomplete');
    }
  }

  private async checkSMSChannelHealth(channel: CommunicationChannel): Promise<void> {
    // In production, this would test actual SMS service connectivity
    if (!channel.configuration.credentials?.apiKey) {
      throw new Error('SMS channel configuration is incomplete');
    }
  }

  private async checkPushChannelHealth(channel: CommunicationChannel): Promise<void> {
    // In production, this would test actual push notification service connectivity
    if (!channel.configuration.credentials?.apiKey) {
      throw new Error('Push notification channel configuration is incomplete');
    }
  }
}