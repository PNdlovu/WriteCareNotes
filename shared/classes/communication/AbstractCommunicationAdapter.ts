/**
 * @fileoverview Abstract Base Communication Adapter
 * @module AbstractCommunicationAdapter
 * @category Communication
 * @subcategory Base Classes
 * @version 1.0.0
 * @since 2025-10-07
 * @author WriteCareNotes Development Team
 * 
 * @description
 * Abstract base class providing common functionality for all communication adapters.
 * Concrete adapter implementations should extend this class to inherit:
 * - Retry logic with exponential backoff
 * - Error handling and logging
 * - Rate limiting
 * - Delivery tracking
 * - Health check scheduling
 * 
 * @compliance
 * - GDPR Article 25: Data protection by design
 * - ISO 27001: Information security management
 * 
 * @example
 * ```typescript
 * export class WhatsAppAdapter extends AbstractCommunicationAdapter {
 *   protected async sendMessageImplementation(
 *     message: CommunicationMessage
 *   ): Promise<MessageDeliveryResult> {
 *     // WhatsApp-specific implementation
 *   }
 * }
 * ```
 */

import {
  ICommunicationAdapter,
  CommunicationChannelType,
  CommunicationMessage,
  MessageDeliveryResult,
  BroadcastResult,
  IncomingMessage,
  DeliveryStatus,
  HealthCheckResult,
  AdapterCapabilities,
  AdapterConfiguration,
  Recipient,
  DeliveryError,
  MessageType
} from '../../interfaces/communication/ICommunicationAdapter.js';
import { Logger } from '../../utils/Logger.js';
import { RateLimiter } from '../../utils/RateLimiter.js';
import { RetryPolicy, ExponentialBackoff } from '../../utils/RetryPolicy.js';

/**
 * Abstract base class for all communication adapters
 * 
 * @abstract
 * @class AbstractCommunicationAdapter
 * @implements {ICommunicationAdapter}
 */
export abstract class AbstractCommunicationAdapter implements ICommunicationAdapter {
  /** Adapter ID (must be set by concrete class) */
  public abstract readonly adapterId: string;
  
  /** Channel name (must be set by concrete class) */
  public abstract readonly channelName: string;
  
  /** Channel type (must be set by concrete class) */
  public abstract readonly channelType: CommunicationChannelType;

  /** Logger instance */
  protected logger: Logger;
  
  /** Rate limiter */
  protected rateLimiter: RateLimiter;
  
  /** Retry policy */
  protected retryPolicy: RetryPolicy;
  
  /** Adapter configuration */
  protected config: AdapterConfiguration | null = null;
  
  /** Initialization status */
  protected initialized = false;
  
  /** Shutdown status */
  protected shuttingDown = false;

  /**
   * Constructor
   */
  constructor() {
    this.logger = new Logger(`Adapter:${this.constructor.name}`);
    this.rateLimiter = new RateLimiter(60, 60000); // 60 requests per minute default
    this.retryPolicy = new ExponentialBackoff({
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2
    });
  }

  /**
   * Initialize the adapter with configuration
   * 
   * @param {AdapterConfiguration} config - Adapter configuration
   * @returns {Promise<void>}
   * @throws {Error} If initialization fails
   */
  public async initialize(config: AdapterConfiguration): Promise<void> {
    this.logger.info('Initializing adapter', { adapterId: this.adapterId });

    try {
      this.validateConfiguration(config);
      this.config = config;

      // Configure rate limiter if specified
      if (config.settings.rateLimitPerMinute) {
        this.rateLimiter = new RateLimiter(
          config.settings.rateLimitPerMinute,
          60000
        );
      }

      // Configure retry policy if specified
      if (config.settings.maxRetries) {
        this.retryPolicy = new ExponentialBackoff({
          maxRetries: config.settings.maxRetries,
          initialDelayMs: 1000,
          maxDelayMs: 30000,
          backoffMultiplier: 2
        });
      }

      // Call concrete implementation
      await this.initializeImplementation(config);

      this.initialized = true;
      this.logger.info('Adapter initialized successfully', { adapterId: this.adapterId });
    } catch (error) {
      this.logger.error('Failed to initialize adapter', {
        adapterId: this.adapterId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Adapter initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Send a message through this channel
   * 
   * @param {CommunicationMessage} message - Message to send
   * @returns {Promise<MessageDeliveryResult>} Delivery result
   */
  public async sendMessage(message: CommunicationMessage): Promise<MessageDeliveryResult> {
    this.ensureInitialized();
    this.ensureNotShuttingDown();

    this.logger.debug('Sending message', {
      messageId: message.messageId,
      adapterId: this.adapterId,
      recipientId: message.recipient.userId
    });

    try {
      // Validate message
      this.validateMessage(message);

      // Check rate limit
      await this.rateLimiter.acquire();

      // Send with retry logic
      const result = await this.retryPolicy.execute(async () => {
        return await this.sendMessageImplementation(message);
      });

      this.logger.info('Message sent successfully', {
        messageId: message.messageId,
        adapterId: this.adapterId,
        deliveryStatus: result.deliveryStatus
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to send message', {
        messageId: message.messageId,
        adapterId: this.adapterId,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        messageId: message.messageId,
        channelType: this.channelType,
        adapterId: this.adapterId,
        timestamp: new Date(),
        deliveryStatus: DeliveryStatus.FAILED,
        error: {
          code: 'SEND_FAILED',
          message: error instanceof Error ? error.message : String(error),
          isRetryable: this.isRetryableError(error)
        }
      };
    }
  }

  /**
   * Broadcast message to multiple recipients
   * 
   * @param {CommunicationMessage} message - Message to broadcast
   * @param {Recipient[]} recipients - List of recipients
   * @returns {Promise<BroadcastResult>} Broadcast result
   */
  public async broadcastMessage(
    message: CommunicationMessage,
    recipients: Recipient[]
  ): Promise<BroadcastResult> {
    this.ensureInitialized();
    this.ensureNotShuttingDown();

    this.logger.info('Broadcasting message', {
      messageId: message.messageId,
      adapterId: this.adapterId,
      recipientCount: recipients.length
    });

    const broadcastId = `BCAST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startedAt = new Date();
    const results: MessageDeliveryResult[] = [];

    for (const recipient of recipients) {
      try {
        const individualMessage: CommunicationMessage = {
          ...message,
          recipient
        };

        const result = await this.sendMessage(individualMessage);
        results.push(result);
      } catch (error) {
        this.logger.error('Failed to send to recipient', {
          recipientId: recipient.userId,
          error: error instanceof Error ? error.message : String(error)
        });

        results.push({
          success: false,
          messageId: message.messageId,
          channelType: this.channelType,
          adapterId: this.adapterId,
          timestamp: new Date(),
          deliveryStatus: DeliveryStatus.FAILED,
          error: {
            code: 'BROADCAST_RECIPIENT_FAILED',
            message: error instanceof Error ? error.message : String(error),
            isRetryable: false
          }
        });
      }
    }

    const completedAt = new Date();
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    this.logger.info('Broadcast completed', {
      broadcastId,
      totalRecipients: recipients.length,
      successCount,
      failureCount
    });

    return {
      broadcastId,
      totalRecipients: recipients.length,
      successCount,
      failureCount,
      results,
      startedAt,
      completedAt
    };
  }

  /**
   * Receive incoming message (for two-way channels)
   * Default implementation throws error - override in concrete class if supported
   * 
   * @param {any} webhookPayload - Webhook payload
   * @returns {Promise<IncomingMessage>} Parsed message
   */
  public async receiveMessage(webhookPayload: any): Promise<IncomingMessage> {
    throw new Error(`Adapter ${this.adapterId} does not support receiving messages`);
  }

  /**
   * Check delivery status
   * Default implementation returns current status - override if adapter supports status tracking
   * 
   * @param {string} messageId - Message ID
   * @returns {Promise<DeliveryStatus>} Delivery status
   */
  public async checkDeliveryStatus(messageId: string): Promise<DeliveryStatus> {
    this.ensureInitialized();
    
    this.logger.debug('Checking delivery status', {
      messageId,
      adapterId: this.adapterId
    });

    return await this.checkDeliveryStatusImplementation(messageId);
  }

  /**
   * Validate recipient identifier
   * Must be implemented by concrete class
   * 
   * @param {string} recipientIdentifier - Recipient identifier
   * @returns {boolean} True if valid
   */
  public abstract validateRecipient(recipientIdentifier: string): boolean;

  /**
   * Health check
   * 
   * @returns {Promise<HealthCheckResult>} Health status
   */
  public async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const result = await this.healthCheckImplementation();
      const latencyMs = Date.now() - startTime;

      return {
        ...result,
        latencyMs,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        healthy: false,
        adapterId: this.adapterId,
        timestamp: new Date(),
        latencyMs: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Get adapter capabilities
   * Must be implemented by concrete class
   * 
   * @returns {AdapterCapabilities} Capabilities
   */
  public abstract getCapabilities(): AdapterCapabilities;

  /**
   * Graceful shutdown
   * 
   * @returns {Promise<void>}
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down adapter', { adapterId: this.adapterId });
    
    this.shuttingDown = true;

    try {
      await this.shutdownImplementation();
      this.initialized = false;
      
      this.logger.info('Adapter shut down successfully', { adapterId: this.adapterId });
    } catch (error) {
      this.logger.error('Error during shutdown', {
        adapterId: this.adapterId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Validate configuration
   * Override in concrete class for adapter-specific validation
   * 
   * @protected
   * @param {AdapterConfiguration} config - Configuration to validate
   * @throws {Error} If configuration is invalid
   */
  protected validateConfiguration(config: AdapterConfiguration): void {
    if (!config.adapterId) {
      throw new Error('Adapter ID is required');
    }

    if (!config.credentials || typeof config.credentials !== 'object') {
      throw new Error('Credentials are required');
    }

    if (!config.settings || typeof config.settings !== 'object') {
      throw new Error('Settings are required');
    }
  }

  /**
   * Validate message
   * 
   * @protected
   * @param {CommunicationMessage} message - Message to validate
   * @throws {Error} If message is invalid
   */
  protected validateMessage(message: CommunicationMessage): void {
    if (!message.messageId) {
      throw new Error('Message ID is required');
    }

    if (!message.recipient || !message.recipient.channelIdentifier) {
      throw new Error('Recipient identifier is required');
    }

    if (!this.validateRecipient(message.recipient.channelIdentifier)) {
      throw new Error('Invalid recipient identifier');
    }

    const capabilities = this.getCapabilities();

    if (!capabilities.supportedMessageTypes.includes(message.type)) {
      throw new Error(`Message type ${message.type} not supported by ${this.adapterId}`);
    }

    if (message.content.text && capabilities.maxMessageLength) {
      if (message.content.text.length > capabilities.maxMessageLength) {
        throw new Error(`Message exceeds maximum length of ${capabilities.maxMessageLength} characters`);
      }
    }
  }

  /**
   * Ensure adapter is initialized
   * 
   * @protected
   * @throws {Error} If not initialized
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`Adapter ${this.adapterId} is not initialized`);
    }
  }

  /**
   * Ensure adapter is not shutting down
   * 
   * @protected
   * @throws {Error} If shutting down
   */
  protected ensureNotShuttingDown(): void {
    if (this.shuttingDown) {
      throw new Error(`Adapter ${this.adapterId} is shutting down`);
    }
  }

  /**
   * Determine if error is retryable
   * 
   * @protected
   * @param {any} error - Error to check
   * @returns {boolean} True if retryable
   */
  protected isRetryableError(error: any): boolean {
    // Network errors are generally retryable
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return true;
    }

    // Rate limit errors are retryable
    if (error.response && error.response.status === 429) {
      return true;
    }

    // Server errors (5xx) are retryable
    if (error.response && error.response.status >= 500) {
      return true;
    }

    // Client errors (4xx except 429) are not retryable
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      return false;
    }

    // Default to not retryable
    return false;
  }

  /**
   * Initialize implementation (concrete class must implement)
   * 
   * @protected
   * @abstract
   * @param {AdapterConfiguration} config - Configuration
   * @returns {Promise<void>}
   */
  protected abstract initializeImplementation(config: AdapterConfiguration): Promise<void>;

  /**
   * Send message implementation (concrete class must implement)
   * 
   * @protected
   * @abstract
   * @param {CommunicationMessage} message - Message to send
   * @returns {Promise<MessageDeliveryResult>} Delivery result
   */
  protected abstract sendMessageImplementation(
    message: CommunicationMessage
  ): Promise<MessageDeliveryResult>;

  /**
   * Check delivery status implementation (override if supported)
   * 
   * @protected
   * @param {string} messageId - Message ID
   * @returns {Promise<DeliveryStatus>} Delivery status
   */
  protected async checkDeliveryStatusImplementation(messageId: string): Promise<DeliveryStatus> {
    return DeliveryStatus.SENT; // Default implementation
  }

  /**
   * Health check implementation (concrete class must implement)
   * 
   * @protected
   * @abstract
   * @returns {Promise<HealthCheckResult>} Health result
   */
  protected abstract healthCheckImplementation(): Promise<HealthCheckResult>;

  /**
   * Shutdown implementation (override if cleanup needed)
   * 
   * @protected
   * @returns {Promise<void>}
   */
  protected async shutdownImplementation(): Promise<void> {
    // Default: no cleanup needed
  }
}
