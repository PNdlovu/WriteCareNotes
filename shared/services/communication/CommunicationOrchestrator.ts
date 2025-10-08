/**
 * @fileoverview Communication Orchestrator Service
 * @module CommunicationOrchestrator
 * @category Communication
 * @subcategory Services
 * @version 1.0.0
 * @since 2025-10-07
 * @author WriteCareNotes Development Team
 * 
 * @description
 * Central orchestrator for routing messages through communication adapters based on
 * user preferences, with automatic fallback management and delivery tracking.
 * 
 * Features:
 * - Intelligent message routing based on user preferences
 * - Automatic fallback to alternative channels on failure
 * - Do-not-disturb window enforcement
 * - Consent and opt-out validation
 * - Delivery attempt tracking
 * - Multi-channel broadcast support
 * - Priority-based delivery
 * 
 * @compliance
 * - GDPR Article 6: Lawful basis for processing
 * - GDPR Article 21: Right to object
 * - ISO 27001: Information security management
 * - Healthcare IT Standards (NHS Digital, CQC)
 * 
 * @example
 * ```typescript
 * const orchestrator = new CommunicationOrchestrator(factory, preferenceService);
 * 
 * const result = await orchestrator.sendMessage({
 *   messageId: 'MSG-123',
 *   type: MessageType.TEXT,
 *   content: { text: 'Medication reminder' },
 *   recipient: { userId: 'user-456' },
 *   metadata: { residentId: 'resident-789', category: MessageCategory.MEDICATION }
 * });
 * ```
 */

import { Logger } from '../../utils/Logger.js';
import { CommunicationAdapterFactory } from './CommunicationAdapterFactory.js';
import { UserCommunicationPreferenceService } from './UserCommunicationPreferenceService.js';
import {
  CommunicationMessage,
  MessageDeliveryResult,
  DeliveryStatus,
  CommunicationChannelType,
  MessagePriority,
  Recipient
} from '../../interfaces/communication/ICommunicationAdapter.js';

/**
 * Message send request
 * 
 * @interface MessageSendRequest
 */
export interface MessageSendRequest {
  /** Message to send */
  message: CommunicationMessage;
  
  /** Allow fallback channels */
  allowFallback?: boolean;
  
  /** Override DND window */
  overrideDnd?: boolean;
  
  /** Max retry attempts */
  maxRetries?: number;
}

/**
 * Orchestrator send result
 * 
 * @interface OrchestratorSendResult
 */
export interface OrchestratorSendResult {
  /** Success status */
  success: boolean;
  
  /** Message ID */
  messageId: string;
  
  /** Channel used */
  channelUsed: CommunicationChannelType;
  
  /** Adapter ID used */
  adapterUsed: string;
  
  /** Delivery result */
  deliveryResult: MessageDeliveryResult;
  
  /** Fallback attempts made */
  fallbackAttempts: number;
  
  /** Channels attempted */
  channelsAttempted: CommunicationChannelType[];
  
  /** Reason for failure (if failed) */
  failureReason?: string;
}

/**
 * Communication Orchestrator
 * 
 * @class CommunicationOrchestrator
 */
export class CommunicationOrchestrator {
  /** Logger */
  private logger: Logger;
  
  /** Adapter factory */
  private factory: CommunicationAdapterFactory;
  
  /** Preference service */
  private preferenceService: UserCommunicationPreferenceService;
  
  /** Delivery tracking (in-memory, replace with database) */
  private deliveryLog: Map<string, OrchestratorSendResult[]> = new Map();

  /**
   * Constructor
   * 
   * @param {CommunicationAdapterFactory} factory - Adapter factory
   * @param {UserCommunicationPreferenceService} preferenceService - Preference service
   */
  constructor(
    factory: CommunicationAdapterFactory,
    preferenceService: UserCommunicationPreferenceService
  ) {
    this.factory = factory;
    this.preferenceService = preferenceService;
    this.logger = new Logger('CommunicationOrchestrator');
  }

  /**
   * Send message with routing and fallback
   * 
   * @param {MessageSendRequest} request - Send request
   * @returns {Promise<OrchestratorSendResult>} Send result
   */
  public async sendMessage(request: MessageSendRequest): Promise<OrchestratorSendResult> {
    const { message, allowFallback = true, overrideDnd = false, maxRetries = 3 } = request;
    const userId = message.recipient.userId;

    this.logger.info('Orchestrating message send', {
      messageId: message.messageId,
      userId,
      priority: message.priority
    });

    // Get user routing preferences
    const routing = await this.preferenceService.getUserRoutingPreferences(userId);

    if (!routing) {
      this.logger.error('No routing preferences found', { userId });
      
      return {
        success: false,
        messageId: message.messageId,
        channelUsed: CommunicationChannelType.IN_APP,
        adapterUsed: 'none',
        deliveryResult: this.createFailedResult(message, 'No routing preferences'),
        fallbackAttempts: 0,
        channelsAttempted: [],
        failureReason: 'No routing preferences found for user'
      };
    }

    // Check if user can receive messages
    if (!routing.canReceiveMessages) {
      this.logger.warn('User cannot receive messages', { userId });
      
      return {
        success: false,
        messageId: message.messageId,
        channelUsed: CommunicationChannelType.IN_APP,
        adapterUsed: 'none',
        deliveryResult: this.createFailedResult(message, 'User opted out or no consent'),
        fallbackAttempts: 0,
        channelsAttempted: [],
        failureReason: 'User opted out or no consent given'
      };
    }

    // Check DND window
    if (routing.inDndWindow && !overrideDnd && message.priority !== MessagePriority.EMERGENCY) {
      this.logger.info('User in DND window, deferring non-emergency message', { userId });
      
      return {
        success: false,
        messageId: message.messageId,
        channelUsed: CommunicationChannelType.IN_APP,
        adapterUsed: 'none',
        deliveryResult: this.createFailedResult(message, 'User in DND window'),
        fallbackAttempts: 0,
        channelsAttempted: [],
        failureReason: 'User in do-not-disturb window'
      };
    }

    // Build channel list to attempt
    const channelsToTry: Array<{type: CommunicationChannelType; identifier: string}> = [
      routing.primaryChannel
    ];

    if (allowFallback) {
      channelsToTry.push(...routing.fallbackChannels);
    }

    // Attempt delivery through channels
    const channelsAttempted: CommunicationChannelType[] = [];
    let fallbackAttempts = 0;

    for (const channel of channelsToTry) {
      channelsAttempted.push(channel.type);

      this.logger.debug('Attempting channel', {
        messageId: message.messageId,
        channelType: channel.type,
        attempt: channelsAttempted.length
      });

      // Get adapter for channel
      const adapter = this.factory.getAdapter(routing.userId, this.getAdapterIdForChannel(channel.type));

      if (!adapter) {
        this.logger.warn('No adapter found for channel', { channelType: channel.type });
        fallbackAttempts++;
        continue;
      }

      // Update message recipient with channel identifier
      const messageWithRecipient: CommunicationMessage = {
        ...message,
        recipient: {
          ...message.recipient,
          channelIdentifier: channel.identifier,
          channelType: channel.type,
          preferredLanguage: routing.language
        }
      };

      try {
        // Send message
        const deliveryResult = await adapter.sendMessage(messageWithRecipient);

        if (deliveryResult.success) {
          const result: OrchestratorSendResult = {
            success: true,
            messageId: message.messageId,
            channelUsed: channel.type,
            adapterUsed: adapter.adapterId,
            deliveryResult,
            fallbackAttempts,
            channelsAttempted
          };

          this.logDelivery(userId, result);

          this.logger.info('Message delivered successfully', {
            messageId: message.messageId,
            channelUsed: channel.type,
            fallbackAttempts
          });

          return result;
        }

        // Delivery failed, try fallback
        this.logger.warn('Delivery failed, trying fallback', {
          messageId: message.messageId,
          channelType: channel.type,
          error: deliveryResult.error?.message
        });

        fallbackAttempts++;
      } catch (error) {
        this.logger.error('Error sending through channel', {
          messageId: message.messageId,
          channelType: channel.type,
          error: error instanceof Error ? error.message : String(error)
        });

        fallbackAttempts++;
      }
    }

    // All channels failed
    const result: OrchestratorSendResult = {
      success: false,
      messageId: message.messageId,
      channelUsed: routing.primaryChannel.type,
      adapterUsed: 'none',
      deliveryResult: this.createFailedResult(message, 'All channels failed'),
      fallbackAttempts,
      channelsAttempted,
      failureReason: `All channels failed after ${channelsAttempted.length} attempts`
    };

    this.logDelivery(userId, result);

    this.logger.error('Message delivery failed on all channels', {
      messageId: message.messageId,
      channelsAttempted: channelsAttempted.length
    });

    return result;
  }

  /**
   * Broadcast message to multiple users
   * 
   * @param {CommunicationMessage} message - Message template
   * @param {string[]} userIds - User IDs
   * @returns {Promise<OrchestratorSendResult[]>} Send results
   */
  public async broadcastMessage(
    message: CommunicationMessage,
    userIds: string[]
  ): Promise<OrchestratorSendResult[]> {
    this.logger.info('Broadcasting message', {
      messageId: message.messageId,
      recipientCount: userIds.length
    });

    const results: OrchestratorSendResult[] = [];

    for (const userId of userIds) {
      const userMessage: CommunicationMessage = {
        ...message,
        recipient: {
          ...message.recipient,
          userId
        }
      };

      try {
        const result = await this.sendMessage({ message: userMessage });
        results.push(result);
      } catch (error) {
        this.logger.error('Broadcast to user failed', {
          userId,
          error: error instanceof Error ? error.message : String(error)
        });

        results.push({
          success: false,
          messageId: message.messageId,
          channelUsed: CommunicationChannelType.IN_APP,
          adapterUsed: 'none',
          deliveryResult: this.createFailedResult(userMessage, 'Broadcast error'),
          fallbackAttempts: 0,
          channelsAttempted: [],
          failureReason: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    this.logger.info('Broadcast completed', {
      messageId: message.messageId,
      total: userIds.length,
      successful: successCount,
      failed: userIds.length - successCount
    });

    return results;
  }

  /**
   * Get delivery history for user
   * 
   * @param {string} userId - User ID
   * @param {number} limit - Max results
   * @returns {Promise<OrchestratorSendResult[]>} Delivery history
   */
  public async getDeliveryHistory(userId: string, limit = 50): Promise<OrchestratorSendResult[]> {
    const history = this.deliveryLog.get(userId) || [];
    return history.slice(0, limit);
  }

  /**
   * Get adapter ID for channel type
   * 
   * @private
   * @param {CommunicationChannelType} channelType - Channel type
   * @returns {string} Adapter ID
   */
  private getAdapterIdForChannel(channelType: CommunicationChannelType): string {
    // Map channel types to adapter IDs
    const mapping: Record<CommunicationChannelType, string> = {
      [CommunicationChannelType.INSTANT_MESSAGING]: 'whatsapp-business',
      [CommunicationChannelType.SMS]: 'twilio-sms',
      [CommunicationChannelType.EMAIL]: 'sendgrid-email',
      [CommunicationChannelType.VOICE]: 'voice-adapter',
      [CommunicationChannelType.IN_APP]: 'in-app-notification',
      [CommunicationChannelType.WEBHOOK]: 'generic-webhook',
      [CommunicationChannelType.PUSH_NOTIFICATION]: 'push-notification'
    };

    return mapping[channelType] || 'generic-webhook';
  }

  /**
   * Create failed delivery result
   * 
   * @private
   * @param {CommunicationMessage} message - Message
   * @param {string} reason - Failure reason
   * @returns {MessageDeliveryResult} Failed result
   */
  private createFailedResult(message: CommunicationMessage, reason: string): MessageDeliveryResult {
    return {
      success: false,
      messageId: message.messageId,
      channelType: CommunicationChannelType.IN_APP,
      adapterId: 'orchestrator',
      timestamp: new Date(),
      deliveryStatus: DeliveryStatus.FAILED,
      error: {
        code: 'ORCHESTRATOR_FAILURE',
        message: reason,
        isRetryable: false
      }
    };
  }

  /**
   * Log delivery attempt
   * 
   * @private
   * @param {string} userId - User ID
   * @param {OrchestratorSendResult} result - Send result
   */
  private logDelivery(userId: string, result: OrchestratorSendResult): void {
    const userLog = this.deliveryLog.get(userId) || [];
    userLog.unshift(result); // Add to beginning
    
    // Keep only last 100 entries per user
    if (userLog.length > 100) {
      userLog.pop();
    }
    
    this.deliveryLog.set(userId, userLog);
  }

  /**
   * Get statistics
   * 
   * @returns {Promise<any>} Statistics
   */
  public async getStatistics(): Promise<any> {
    let totalDeliveries = 0;
    let successfulDeliveries = 0;
    let failedDeliveries = 0;
    let totalFallbackAttempts = 0;

    const channelUsage: Record<string, number> = {};

    for (const userLog of this.deliveryLog.values()) {
      for (const result of userLog) {
        totalDeliveries++;
        
        if (result.success) {
          successfulDeliveries++;
        } else {
          failedDeliveries++;
        }
        
        totalFallbackAttempts += result.fallbackAttempts;
        
        channelUsage[result.channelUsed] = (channelUsage[result.channelUsed] || 0) + 1;
      }
    }

    return {
      totalDeliveries,
      successfulDeliveries,
      failedDeliveries,
      successRate: totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0,
      totalFallbackAttempts,
      averageFallbacksPerMessage: totalDeliveries > 0 ? totalFallbackAttempts / totalDeliveries : 0,
      channelUsage
    };
  }
}
