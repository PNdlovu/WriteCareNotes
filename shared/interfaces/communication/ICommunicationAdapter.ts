/**
 * @fileoverview Communication Adapter Interface
 * @module ICommunicationAdapter
 * @category Communication
 * @subcategory Interfaces
 * @version 1.0.0
 * @since 2025-10-07
 * @author WriteCareNotes Development Team
 * 
 * @description
 * Defines the standard interface that all communication channel adapters must implement.
 * This interface enables pluggable, channel-agnostic messaging across multiple platforms
 * including WhatsApp, Telegram, SMS, Email, and custom webhooks.
 * 
 * All adapters MUST implement these methods to ensure consistent behavior across
 * the communication system.
 * 
 * @compliance
 * - GDPR Article 25: Data protection by design
 * - ISO 27001: Information security management
 * - Healthcare IT Standards (NHS Digital, CQC requirements)
 * 
 * @example
 * ```typescript
 * export class WhatsAppAdapter implements ICommunicationAdapter {
 *   readonly adapterId = 'whatsapp-business';
 *   readonly channelName = 'WhatsApp Business';
 *   readonly channelType = CommunicationChannelType.INSTANT_MESSAGING;
 * 
 *   async initialize(config: AdapterConfiguration): Promise<void> {
 *     // Initialize WhatsApp Business API
 *   }
 * 
 *   async sendMessage(message: CommunicationMessage): Promise<MessageDeliveryResult> {
 *     // Send message via WhatsApp API
 *   }
 * 
 *   // ... implement other required methods
 * }
 * ```
 */

/**
 * Supported communication channel types
 * 
 * @enum {string}
 * @readonly
 */
export enum CommunicationChannelType {
  /** Instant messaging apps (WhatsApp, Telegram, Signal, etc.) */
  INSTANT_MESSAGING = 'instant_messaging',
  
  /** SMS text messages */
  SMS = 'sms',
  
  /** Email */
  EMAIL = 'email',
  
  /** Voice calls */
  VOICE = 'voice',
  
  /** In-app notifications (WriteCareNotes native) */
  IN_APP = 'in_app',
  
  /** Custom webhook integrations */
  WEBHOOK = 'webhook',
  
  /** Mobile push notifications */
  PUSH_NOTIFICATION = 'push_notification'
}

/**
 * Base interface that all communication adapters must implement
 * 
 * @interface ICommunicationAdapter
 */
export interface ICommunicationAdapter {
  /**
   * Unique identifier for the adapter
   * Format: lowercase-with-hyphens (e.g., 'whatsapp-business', 'twilio-sms')
   * 
   * @readonly
   * @type {string}
   */
  readonly adapterId: string;

  /**
   * Human-readable name of the communication channel
   * 
   * @readonly
   * @type {string}
   * @example 'WhatsApp Business', 'Telegram Bot', 'SMS (Twilio)'
   */
  readonly channelName: string;

  /**
   * Channel type for categorization
   * 
   * @readonly
   * @type {CommunicationChannelType}
   */
  readonly channelType: CommunicationChannelType;

  /**
   * Initialize the adapter with configuration
   * 
   * @param {AdapterConfiguration} config - Adapter configuration including credentials
   * @returns {Promise<void>}
   * @throws {AdapterInitializationError} If initialization fails
   */
  initialize(config: AdapterConfiguration): Promise<void>;

  /**
   * Send a message through this channel
   * 
   * @param {CommunicationMessage} message - Message to send
   * @returns {Promise<MessageDeliveryResult>} Delivery result with status and metadata
   * @throws {MessageSendError} If sending fails
   */
  sendMessage(message: CommunicationMessage): Promise<MessageDeliveryResult>;

  /**
   * Send a message to multiple recipients (broadcast)
   * 
   * @param {CommunicationMessage} message - Message to broadcast
   * @param {Recipient[]} recipients - List of recipients
   * @returns {Promise<BroadcastResult>} Aggregated results for all recipients
   * @throws {BroadcastError} If broadcast fails
   */
  broadcastMessage(
    message: CommunicationMessage,
    recipients: Recipient[]
  ): Promise<BroadcastResult>;

  /**
   * Receive incoming messages (for two-way channels)
   * Used for webhook endpoints receiving messages from the communication platform
   * 
   * @param {any} webhookPayload - Raw webhook payload from the platform
   * @returns {Promise<IncomingMessage>} Parsed incoming message
   * @throws {WebhookParseError} If payload cannot be parsed
   */
  receiveMessage(webhookPayload: any): Promise<IncomingMessage>;

  /**
   * Check delivery status of a sent message
   * 
   * @param {string} messageId - Internal message ID
   * @returns {Promise<DeliveryStatus>} Current delivery status
   * @throws {StatusCheckError} If status check fails
   */
  checkDeliveryStatus(messageId: string): Promise<DeliveryStatus>;

  /**
   * Validate if a recipient identifier is valid for this channel
   * 
   * @param {string} recipientIdentifier - Phone number, email, username, etc.
   * @returns {boolean} True if valid, false otherwise
   */
  validateRecipient(recipientIdentifier: string): boolean;

  /**
   * Check if the adapter is healthy and ready
   * 
   * @returns {Promise<HealthCheckResult>} Health status with latency and errors
   */
  healthCheck(): Promise<HealthCheckResult>;

  /**
   * Get adapter capabilities (supported features)
   * 
   * @returns {AdapterCapabilities} Supported message types, features, and limits
   */
  getCapabilities(): AdapterCapabilities;

  /**
   * Gracefully shutdown the adapter
   * Close connections, flush queues, cleanup resources
   * 
   * @returns {Promise<void>}
   */
  shutdown(): Promise<void>;
}

/**
 * Message types supported by communication adapters
 * 
 * @enum {string}
 */
export enum MessageType {
  /** Plain text message */
  TEXT = 'text',
  
  /** Rich text with formatting (HTML or Markdown) */
  RICH_TEXT = 'rich_text',
  
  /** Image attachment */
  IMAGE = 'image',
  
  /** Video attachment */
  VIDEO = 'video',
  
  /** Audio/voice message */
  AUDIO = 'audio',
  
  /** Document attachment (PDF, Word, etc.) */
  DOCUMENT = 'document',
  
  /** Location/GPS coordinates */
  LOCATION = 'location',
  
  /** Contact card */
  CONTACT = 'contact',
  
  /** Pre-approved template message (for platforms like WhatsApp Business) */
  TEMPLATE = 'template'
}

/**
 * Message priority levels
 * 
 * @enum {string}
 */
export enum MessagePriority {
  /** Low priority, can be delayed */
  LOW = 'low',
  
  /** Normal priority */
  MEDIUM = 'medium',
  
  /** High priority, send promptly */
  HIGH = 'high',
  
  /** Urgent, requires immediate attention */
  URGENT = 'urgent',
  
  /** Emergency, critical alert */
  EMERGENCY = 'emergency'
}

/**
 * Message categories for routing and filtering
 * 
 * @enum {string}
 */
export enum MessageCategory {
  /** General care update */
  CARE_UPDATE = 'care_update',
  
  /** Medication-related message */
  MEDICATION = 'medication',
  
  /** Incident report */
  INCIDENT = 'incident',
  
  /** Safeguarding alert */
  SAFEGUARDING = 'safeguarding',
  
  /** General communication */
  GENERAL = 'general',
  
  /** Emergency alert */
  EMERGENCY = 'emergency',
  
  /** Staff handover */
  HANDOVER = 'handover',
  
  /** Family engagement */
  FAMILY_ENGAGEMENT = 'family_engagement'
}

/**
 * Delivery status of a message
 * 
 * @enum {string}
 */
export enum DeliveryStatus {
  /** Message queued for sending */
  QUEUED = 'queued',
  
  /** Message sent to recipient */
  SENT = 'sent',
  
  /** Message delivered to recipient's device */
  DELIVERED = 'delivered',
  
  /** Message read by recipient (if supported) */
  READ = 'read',
  
  /** Message failed to send */
  FAILED = 'failed',
  
  /** Message blocked by recipient or platform */
  BLOCKED = 'blocked',
  
  /** Recipient opted out of messages */
  OPTED_OUT = 'opted_out'
}

/**
 * Standard message format across all adapters
 * 
 * @interface CommunicationMessage
 */
export interface CommunicationMessage {
  /** Unique message identifier */
  messageId: string;
  
  /** Type of message */
  type: MessageType;
  
  /** Message content */
  content: MessageContent;
  
  /** Message sender */
  sender: Sender;
  
  /** Message recipient */
  recipient: Recipient;
  
  /** Message metadata */
  metadata: MessageMetadata;
  
  /** Message priority */
  priority: MessagePriority;
  
  /** Delivery options (optional) */
  deliveryOptions?: DeliveryOptions;
}

/**
 * Message content container
 * 
 * @interface MessageContent
 */
export interface MessageContent {
  /** Plain text content */
  text?: string;
  
  /** Rich text content (HTML or Markdown) */
  richText?: string;
  
  /** Media URL (for images, videos, documents) */
  mediaUrl?: string;
  
  /** Media MIME type */
  mediaType?: string;
  
  /** Thumbnail URL for media */
  thumbnailUrl?: string;
  
  /** Caption for media */
  caption?: string;
  
  /** Template ID (for template messages) */
  templateId?: string;
  
  /** Template parameters */
  templateParameters?: Record<string, any>;
}

/**
 * Message sender information
 * 
 * @interface Sender
 */
export interface Sender {
  /** User ID */
  userId: string;
  
  /** Display name */
  name: string;
  
  /** Sender role */
  role: 'staff' | 'family' | 'resident' | 'system';
  
  /** Organization ID */
  organizationId: string;
}

/**
 * Message recipient information
 * 
 * @interface Recipient
 */
export interface Recipient {
  /** User ID */
  userId: string;
  
  /** Display name */
  name: string;
  
  /** Channel-specific identifier (phone, email, username, etc.) */
  channelIdentifier: string;
  
  /** Channel type */
  channelType: CommunicationChannelType;
  
  /** Preferred language (ISO 639-1 code) */
  preferredLanguage?: string;
}

/**
 * Message metadata
 * 
 * @interface MessageMetadata
 */
export interface MessageMetadata {
  /** Conversation ID (for threading) */
  conversationId?: string;
  
  /** Resident ID (if message relates to a resident) */
  residentId?: string;
  
  /** Care home ID */
  careHomeId?: string;
  
  /** Message category */
  category: MessageCategory;
  
  /** Message tags */
  tags?: string[];
  
  /** Is message urgent */
  isUrgent: boolean;
  
  /** Requires acknowledgment */
  requiresAcknowledgment: boolean;
  
  /** Message expiration time */
  expiresAt?: Date;
  
  /** Encryption required */
  encryptionRequired: boolean;
}

/**
 * Delivery options
 * 
 * @interface DeliveryOptions
 */
export interface DeliveryOptions {
  /** Number of retry attempts */
  retryCount?: number;
  
  /** Delay between retries (milliseconds) */
  retryDelayMs?: number;
  
  /** Fallback channels to try if primary fails */
  fallbackChannels?: CommunicationChannelType[];
  
  /** Schedule message for future delivery */
  scheduleFor?: Date;
  
  /** Delivery time window */
  deliveryWindow?: {
    /** Start time (HH:mm format) */
    startTime: string;
    
    /** End time (HH:mm format) */
    endTime: string;
  };
}

/**
 * Message delivery result
 * 
 * @interface MessageDeliveryResult
 */
export interface MessageDeliveryResult {
  /** Delivery success */
  success: boolean;
  
  /** Internal message ID */
  messageId: string;
  
  /** External message ID from the platform */
  externalMessageId?: string;
  
  /** Channel type used */
  channelType: CommunicationChannelType;
  
  /** Adapter ID used */
  adapterId: string;
  
  /** Timestamp */
  timestamp: Date;
  
  /** Delivery status */
  deliveryStatus: DeliveryStatus;
  
  /** Error details (if failed) */
  error?: DeliveryError;
  
  /** Message cost */
  cost?: MonetaryCost;
}

/**
 * Delivery error details
 * 
 * @interface DeliveryError
 */
export interface DeliveryError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Is error retryable */
  isRetryable: boolean;
  
  /** Suggested fallback channel */
  suggestedFallback?: CommunicationChannelType;
}

/**
 * Monetary cost information
 * 
 * @interface MonetaryCost
 */
export interface MonetaryCost {
  /** Cost amount */
  amount: number;
  
  /** Currency code (ISO 4217) */
  currency: string;
  
  /** Provider name */
  provider: string;
}

/**
 * Broadcast result for multiple recipients
 * 
 * @interface BroadcastResult
 */
export interface BroadcastResult {
  /** Broadcast ID */
  broadcastId: string;
  
  /** Total recipients */
  totalRecipients: number;
  
  /** Successful deliveries */
  successCount: number;
  
  /** Failed deliveries */
  failureCount: number;
  
  /** Individual results */
  results: MessageDeliveryResult[];
  
  /** Broadcast start time */
  startedAt: Date;
  
  /** Broadcast completion time */
  completedAt: Date;
}

/**
 * Incoming message from a two-way channel
 * 
 * @interface IncomingMessage
 */
export interface IncomingMessage {
  /** External message ID from the platform */
  externalMessageId: string;
  
  /** Channel type */
  channelType: CommunicationChannelType;
  
  /** Adapter ID */
  adapterId: string;
  
  /** Sender information */
  sender: {
    /** Sender identifier (phone, username, etc.) */
    identifier: string;
    
    /** Sender name (if available) */
    name?: string;
  };
  
  /** Message content */
  content: MessageContent;
  
  /** Received timestamp */
  receivedAt: Date;
  
  /** Conversation ID (if available) */
  conversationId?: string;
}

/**
 * Adapter configuration
 * 
 * @interface AdapterConfiguration
 */
export interface AdapterConfiguration {
  /** Adapter ID */
  adapterId: string;
  
  /** Enabled status */
  enabled: boolean;
  
  /** Credentials (API keys, tokens, etc.) */
  credentials: Record<string, any>;
  
  /** Adapter settings */
  settings: AdapterSettings;
  
  /** Organization ID (for multi-tenant) */
  organizationId?: string;
}

/**
 * Adapter settings
 * 
 * @interface AdapterSettings
 */
export interface AdapterSettings {
  /** Webhook URL for incoming messages */
  webhookUrl?: string;
  
  /** Callback URL for delivery receipts */
  callbackUrl?: string;
  
  /** Maximum retry attempts */
  maxRetries?: number;
  
  /** Timeout in milliseconds */
  timeoutMs?: number;
  
  /** Rate limit per minute */
  rateLimitPerMinute?: number;
  
  /** Enable logging */
  enableLogging?: boolean;
  
  /** Enable delivery tracking */
  enableDeliveryTracking?: boolean;
  
  /** Custom parameters */
  customParameters?: Record<string, any>;
}

/**
 * Health check result
 * 
 * @interface HealthCheckResult
 */
export interface HealthCheckResult {
  /** Health status */
  healthy: boolean;
  
  /** Adapter ID */
  adapterId: string;
  
  /** Check timestamp */
  timestamp: Date;
  
  /** Latency in milliseconds */
  latencyMs?: number;
  
  /** Error messages */
  errors?: string[];
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Adapter capabilities
 * 
 * @interface AdapterCapabilities
 */
export interface AdapterCapabilities {
  /** Supported message types */
  supportedMessageTypes: MessageType[];
  
  /** Maximum message length (characters) */
  maxMessageLength?: number;
  
  /** Supports media upload */
  supportsMediaUpload: boolean;
  
  /** Supported media MIME types */
  supportedMediaTypes?: string[];
  
  /** Maximum media size in bytes */
  maxMediaSizeBytes?: number;
  
  /** Supports two-way messaging */
  supportsTwoWayMessaging: boolean;
  
  /** Supports delivery receipts */
  supportsDeliveryReceipts: boolean;
  
  /** Supports read receipts */
  supportsReadReceipts: boolean;
  
  /** Supports templates */
  supportsTemplates: boolean;
  
  /** Supports group messaging */
  supportsGroupMessaging: boolean;
  
  /** Supports scheduled messages */
  supportsScheduledMessages: boolean;
  
  /** Encrypted by default */
  isEncryptedByDefault: boolean;
  
  /** Cost per message */
  costPerMessage?: MonetaryCost;
}
