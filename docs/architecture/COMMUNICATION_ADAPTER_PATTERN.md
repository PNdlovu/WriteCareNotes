# Communication Adapter Pattern Architecture

## 📋 Overview

**Version**: 1.0.0  
**Last Updated**: October 7, 2025  
**Status**: Architecture Design  

### Purpose
Replace single-channel integrations (WhatsApp-only) with a **pluggable, user-configurable communication adapter system** that supports multiple messaging platforms based on user/family/organization preferences.

### Key Principles
- ✅ **Channel Agnostic**: Support any communication platform via adapter pattern
- ✅ **User Preference Driven**: Users choose their preferred channel(s)
- ✅ **Fallback Support**: Automatic fallback to alternative channels if primary fails
- ✅ **GDPR Compliant**: User opt-in/opt-out, data portability, consent management
- ✅ **Extensible**: Add new channels without modifying core system
- ✅ **Healthcare Secure**: End-to-end encryption, audit trails, compliance tracking

---

## 🏗️ Architecture Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   WRITECARENOTES CORE                        │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │         CommsHub Orchestration Layer               │     │
│  │  - Message routing                                  │     │
│  │  - User preference resolution                       │     │
│  │  - Delivery tracking                                │     │
│  │  - Fallback management                              │     │
│  └───────────────────┬────────────────────────────────┘     │
│                      │                                        │
│  ┌───────────────────▼────────────────────────────────┐     │
│  │      Communication Adapter Factory                  │     │
│  │  - Dynamic adapter instantiation                    │     │
│  │  - Adapter registry management                      │     │
│  │  - Health check coordination                        │     │
│  └───────────────────┬────────────────────────────────┘     │
│                      │                                        │
│         ┌────────────┴────────────┬──────────────────┐      │
│         │                         │                   │      │
│  ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐│      │
│  │  Adapter A  │   │  Adapter B  │   │  Adapter C  ││      │
│  │ (WhatsApp)  │   │ (Telegram)  │   │   (SMS)     ││ ...  │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘│      │
│         │                  │                  │       │      │
└─────────┼──────────────────┼──────────────────┼───────┼──────┘
          │                  │                  │       │
          │                  │                  │       │
┌─────────▼─────┐  ┌─────────▼─────┐  ┌────────▼───┐  │
│  WhatsApp     │  │   Telegram    │  │   Twilio   │  │
│  Business API │  │   Bot API     │  │   SMS API  │  │
└───────────────┘  └───────────────┘  └────────────┘  │
                                                        │
                   ┌─────────────────┐  ┌─────────────▼──────┐
                   │   SendGrid      │  │   Custom Webhook   │
                   │   Email API     │  │   (Generic)        │
                   └─────────────────┘  └────────────────────┘
```

---

## 🔌 Adapter Interface Specification

### Base Communication Adapter Interface

```typescript
/**
 * Base interface that all communication adapters must implement
 */
export interface ICommunicationAdapter {
  /**
   * Unique identifier for the adapter
   */
  readonly adapterId: string;

  /**
   * Human-readable name of the communication channel
   */
  readonly channelName: string;

  /**
   * Channel type for categorization
   */
  readonly channelType: CommunicationChannelType;

  /**
   * Initialize the adapter with configuration
   */
  initialize(config: AdapterConfiguration): Promise<void>;

  /**
   * Send a message through this channel
   */
  sendMessage(message: CommunicationMessage): Promise<MessageDeliveryResult>;

  /**
   * Send a message to multiple recipients
   */
  broadcastMessage(
    message: CommunicationMessage,
    recipients: Recipient[]
  ): Promise<BroadcastResult>;

  /**
   * Receive incoming messages (for two-way channels)
   */
  receiveMessage(webhookPayload: any): Promise<IncomingMessage>;

  /**
   * Check delivery status of a sent message
   */
  checkDeliveryStatus(messageId: string): Promise<DeliveryStatus>;

  /**
   * Validate if a recipient identifier is valid for this channel
   */
  validateRecipient(recipientIdentifier: string): boolean;

  /**
   * Check if the adapter is healthy and ready
   */
  healthCheck(): Promise<HealthCheckResult>;

  /**
   * Get adapter capabilities (features supported)
   */
  getCapabilities(): AdapterCapabilities;

  /**
   * Gracefully shutdown the adapter
   */
  shutdown(): Promise<void>;
}

/**
 * Supported communication channel types
 */
export enum CommunicationChannelType {
  INSTANT_MESSAGING = 'instant_messaging',  // WhatsApp, Telegram, Signal
  SMS = 'sms',                               // Text messages
  EMAIL = 'email',                           // Email
  VOICE = 'voice',                           // Phone calls
  IN_APP = 'in_app',                         // WriteCareNotes native notifications
  WEBHOOK = 'webhook',                       // Custom webhooks
  PUSH_NOTIFICATION = 'push_notification'    // Mobile push
}

/**
 * Standard message format across all adapters
 */
export interface CommunicationMessage {
  messageId: string;
  type: MessageType;
  content: MessageContent;
  sender: Sender;
  recipient: Recipient;
  metadata: MessageMetadata;
  priority: MessagePriority;
  deliveryOptions?: DeliveryOptions;
}

export enum MessageType {
  TEXT = 'text',
  RICH_TEXT = 'rich_text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  LOCATION = 'location',
  CONTACT = 'contact',
  TEMPLATE = 'template'  // For pre-approved templates (WhatsApp Business)
}

export interface MessageContent {
  text?: string;
  richText?: string;  // HTML or Markdown
  mediaUrl?: string;
  mediaType?: string;
  thumbnailUrl?: string;
  caption?: string;
  templateId?: string;
  templateParameters?: Record<string, any>;
}

export interface Sender {
  userId: string;
  name: string;
  role: 'staff' | 'family' | 'resident' | 'system';
  organizationId: string;
}

export interface Recipient {
  userId: string;
  name: string;
  channelIdentifier: string;  // Phone number, email, username, etc.
  channelType: CommunicationChannelType;
  preferredLanguage?: string;
}

export interface MessageMetadata {
  conversationId?: string;
  residentId?: string;
  careHomeId?: string;
  category: MessageCategory;
  tags?: string[];
  isUrgent: boolean;
  requiresAcknowledgment: boolean;
  expiresAt?: Date;
  encryptionRequired: boolean;
}

export enum MessageCategory {
  CARE_UPDATE = 'care_update',
  MEDICATION = 'medication',
  INCIDENT = 'incident',
  SAFEGUARDING = 'safeguarding',
  GENERAL = 'general',
  EMERGENCY = 'emergency',
  HANDOVER = 'handover',
  FAMILY_ENGAGEMENT = 'family_engagement'
}

export enum MessagePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  EMERGENCY = 'emergency'
}

export interface DeliveryOptions {
  retryCount?: number;
  retryDelayMs?: number;
  fallbackChannels?: CommunicationChannelType[];
  scheduleFor?: Date;
  deliveryWindow?: {
    startTime: string;  // HH:mm format
    endTime: string;
  };
}

/**
 * Delivery result for tracking
 */
export interface MessageDeliveryResult {
  success: boolean;
  messageId: string;
  externalMessageId?: string;  // ID from third-party service
  channelType: CommunicationChannelType;
  adapterId: string;
  timestamp: Date;
  deliveryStatus: DeliveryStatus;
  error?: DeliveryError;
  cost?: MonetaryCost;
}

export enum DeliveryStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  BLOCKED = 'blocked',
  OPTED_OUT = 'opted_out'
}

export interface DeliveryError {
  code: string;
  message: string;
  isRetryable: boolean;
  suggestedFallback?: CommunicationChannelType;
}

export interface MonetaryCost {
  amount: number;
  currency: string;
  provider: string;
}

/**
 * Broadcast result for multiple recipients
 */
export interface BroadcastResult {
  broadcastId: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  results: MessageDeliveryResult[];
  startedAt: Date;
  completedAt: Date;
}

/**
 * Incoming message (for two-way channels)
 */
export interface IncomingMessage {
  externalMessageId: string;
  channelType: CommunicationChannelType;
  adapterId: string;
  sender: {
    identifier: string;  // Phone number, username, etc.
    name?: string;
  };
  content: MessageContent;
  receivedAt: Date;
  conversationId?: string;
}

/**
 * Adapter configuration
 */
export interface AdapterConfiguration {
  adapterId: string;
  enabled: boolean;
  credentials: Record<string, any>;  // API keys, tokens, etc.
  settings: AdapterSettings;
  organizationId?: string;  // For multi-tenant configurations
}

export interface AdapterSettings {
  webhookUrl?: string;
  callbackUrl?: string;
  maxRetries?: number;
  timeoutMs?: number;
  rateLimitPerMinute?: number;
  enableLogging?: boolean;
  enableDeliveryTracking?: boolean;
  customParameters?: Record<string, any>;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  healthy: boolean;
  adapterId: string;
  timestamp: Date;
  latencyMs?: number;
  errors?: string[];
  metadata?: Record<string, any>;
}

/**
 * Adapter capabilities
 */
export interface AdapterCapabilities {
  supportedMessageTypes: MessageType[];
  maxMessageLength?: number;
  supportsMediaUpload: boolean;
  supportedMediaTypes?: string[];
  maxMediaSizeBytes?: number;
  supportsTwoWayMessaging: boolean;
  supportsDeliveryReceipts: boolean;
  supportsReadReceipts: boolean;
  supportsTemplates: boolean;
  supportsGroupMessaging: boolean;
  supportsScheduledMessages: boolean;
  isEncryptedByDefault: boolean;
  costPerMessage?: MonetaryCost;
}
```

---

## 🏭 Adapter Factory Pattern

```typescript
/**
 * Factory for creating and managing communication adapters
 */
export class CommunicationAdapterFactory {
  private adapterRegistry: Map<string, AdapterConstructor> = new Map();
  private activeAdapters: Map<string, ICommunicationAdapter> = new Map();

  /**
   * Register a new adapter type
   */
  registerAdapter(
    channelType: CommunicationChannelType,
    adapterId: string,
    constructor: AdapterConstructor
  ): void {
    const key = `${channelType}:${adapterId}`;
    this.adapterRegistry.set(key, constructor);
  }

  /**
   * Create and initialize an adapter instance
   */
  async createAdapter(
    channelType: CommunicationChannelType,
    adapterId: string,
    config: AdapterConfiguration
  ): Promise<ICommunicationAdapter> {
    const key = `${channelType}:${adapterId}`;
    
    const constructor = this.adapterRegistry.get(key);
    if (!constructor) {
      throw new Error(`Adapter not found: ${key}`);
    }

    const adapter = new constructor();
    await adapter.initialize(config);

    this.activeAdapters.set(key, adapter);
    return adapter;
  }

  /**
   * Get an active adapter
   */
  getAdapter(
    channelType: CommunicationChannelType,
    adapterId: string
  ): ICommunicationAdapter | undefined {
    const key = `${channelType}:${adapterId}`;
    return this.activeAdapters.get(key);
  }

  /**
   * Get all active adapters for a channel type
   */
  getAdaptersByType(
    channelType: CommunicationChannelType
  ): ICommunicationAdapter[] {
    return Array.from(this.activeAdapters.values()).filter(
      adapter => adapter.channelType === channelType
    );
  }

  /**
   * Check health of all adapters
   */
  async healthCheckAll(): Promise<Map<string, HealthCheckResult>> {
    const results = new Map<string, HealthCheckResult>();

    for (const [key, adapter] of this.activeAdapters) {
      try {
        const result = await adapter.healthCheck();
        results.set(key, result);
      } catch (error) {
        results.set(key, {
          healthy: false,
          adapterId: adapter.adapterId,
          timestamp: new Date(),
          errors: [error.message]
        });
      }
    }

    return results;
  }

  /**
   * Shutdown all adapters
   */
  async shutdownAll(): Promise<void> {
    const shutdownPromises = Array.from(this.activeAdapters.values()).map(
      adapter => adapter.shutdown()
    );
    await Promise.all(shutdownPromises);
    this.activeAdapters.clear();
  }
}

type AdapterConstructor = new () => ICommunicationAdapter;
```

---

## 👤 User Preference Management

### Database Schema

```sql
-- User communication preferences
CREATE TABLE user_communication_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Channel preferences
  primary_channel_type VARCHAR(50) NOT NULL,
  primary_channel_identifier VARCHAR(255) NOT NULL, -- Phone, email, username
  
  fallback_channels JSONB DEFAULT '[]', -- Array of {type, identifier}
  
  -- Opt-in/opt-out
  opted_in_channels JSONB DEFAULT '[]', -- Array of channel types user consented to
  opted_out_channels JSONB DEFAULT '[]',
  
  -- Message category preferences
  category_preferences JSONB DEFAULT '{}', -- {category: {channels: [], priority: ''}}
  
  -- Delivery preferences
  do_not_disturb_start TIME,
  do_not_disturb_end TIME,
  timezone VARCHAR(50) DEFAULT 'Europe/London',
  
  -- Language
  preferred_language VARCHAR(10) DEFAULT 'en-GB',
  
  -- Acknowledgment preferences
  require_acknowledgment BOOLEAN DEFAULT false,
  acknowledgment_timeout_hours INTEGER DEFAULT 24,
  
  -- Privacy
  allow_media_messages BOOLEAN DEFAULT true,
  allow_location_sharing BOOLEAN DEFAULT false,
  encryption_required BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, organization_id)
);

-- Channel identifiers for each user (supports multiple per channel type)
CREATE TABLE user_channel_identifiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_type VARCHAR(50) NOT NULL,
  identifier VARCHAR(255) NOT NULL, -- Phone number, email, username, etc.
  is_verified BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  verification_code VARCHAR(10),
  verification_expires_at TIMESTAMP,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, channel_type, identifier)
);

-- Organization-level adapter configurations
CREATE TABLE organization_communication_adapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel_type VARCHAR(50) NOT NULL,
  adapter_id VARCHAR(100) NOT NULL,
  
  enabled BOOLEAN DEFAULT true,
  
  -- Encrypted credentials
  credentials_encrypted TEXT NOT NULL,
  
  -- Settings
  settings JSONB DEFAULT '{}',
  
  -- Usage tracking
  messages_sent_count INTEGER DEFAULT 0,
  total_cost_amount DECIMAL(10, 4) DEFAULT 0,
  total_cost_currency VARCHAR(3) DEFAULT 'GBP',
  
  -- Health
  last_health_check TIMESTAMP,
  is_healthy BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(organization_id, channel_type, adapter_id)
);

-- Message delivery tracking
CREATE TABLE communication_delivery_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL,
  external_message_id VARCHAR(255),
  
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  
  channel_type VARCHAR(50) NOT NULL,
  adapter_id VARCHAR(100) NOT NULL,
  
  delivery_status VARCHAR(50) NOT NULL,
  
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  failed_at TIMESTAMP,
  
  error_code VARCHAR(100),
  error_message TEXT,
  is_retryable BOOLEAN,
  
  retry_count INTEGER DEFAULT 0,
  fallback_used BOOLEAN DEFAULT false,
  fallback_channel_type VARCHAR(50),
  
  cost_amount DECIMAL(10, 4),
  cost_currency VARCHAR(3) DEFAULT 'GBP',
  
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_message_id (message_id),
  INDEX idx_recipient_id (recipient_id),
  INDEX idx_delivery_status (delivery_status),
  INDEX idx_sent_at (sent_at)
);
```

### User Preference Service

```typescript
export class UserCommunicationPreferenceService {
  /**
   * Get user's communication preferences
   */
  async getUserPreferences(
    userId: string,
    organizationId: string
  ): Promise<UserCommunicationPreferences> {
    // Implementation
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    organizationId: string,
    preferences: Partial<UserCommunicationPreferences>
  ): Promise<void> {
    // Implementation
  }

  /**
   * Add a new channel identifier for user
   */
  async addChannelIdentifier(
    userId: string,
    channelType: CommunicationChannelType,
    identifier: string
  ): Promise<void> {
    // Send verification code
    // Implementation
  }

  /**
   * Verify a channel identifier
   */
  async verifyChannelIdentifier(
    userId: string,
    channelType: CommunicationChannelType,
    identifier: string,
    verificationCode: string
  ): Promise<boolean> {
    // Implementation
  }

  /**
   * Get preferred channel for a message category
   */
  async getPreferredChannel(
    userId: string,
    organizationId: string,
    category: MessageCategory
  ): Promise<{
    channelType: CommunicationChannelType;
    identifier: string;
    fallbacks: Array<{ channelType: CommunicationChannelType; identifier: string }>;
  }> {
    // Implementation
  }

  /**
   * Check if user opted in for a channel
   */
  async hasOptedIn(
    userId: string,
    channelType: CommunicationChannelType
  ): Promise<boolean> {
    // Implementation
  }

  /**
   * Opt user in/out of a channel
   */
  async updateOptInStatus(
    userId: string,
    channelType: CommunicationChannelType,
    optedIn: boolean
  ): Promise<void> {
    // Implementation with GDPR audit trail
  }
}
```

---

## 🔌 Sample Adapter Implementations

### 1. WhatsApp Business API Adapter

```typescript
import { ICommunicationAdapter } from '../interfaces/ICommunicationAdapter';
import axios from 'axios';

export class WhatsAppBusinessAdapter implements ICommunicationAdapter {
  readonly adapterId = 'whatsapp-business';
  readonly channelName = 'WhatsApp Business';
  readonly channelType = CommunicationChannelType.INSTANT_MESSAGING;

  private apiUrl: string;
  private accessToken: string;
  private phoneNumberId: string;

  async initialize(config: AdapterConfiguration): Promise<void> {
    this.apiUrl = 'https://graph.facebook.com/v18.0';
    this.accessToken = config.credentials.accessToken;
    this.phoneNumberId = config.credentials.phoneNumberId;
  }

  async sendMessage(
    message: CommunicationMessage
  ): Promise<MessageDeliveryResult> {
    try {
      const whatsappMessage = this.transformToWhatsAppFormat(message);
      
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        whatsappMessage,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: message.messageId,
        externalMessageId: response.data.messages[0].id,
        channelType: this.channelType,
        adapterId: this.adapterId,
        timestamp: new Date(),
        deliveryStatus: DeliveryStatus.SENT
      };
    } catch (error) {
      return this.handleError(message.messageId, error);
    }
  }

  async receiveMessage(webhookPayload: any): Promise<IncomingMessage> {
    // Parse WhatsApp webhook payload
    const entry = webhookPayload.entry[0];
    const change = entry.changes[0];
    const message = change.value.messages[0];

    return {
      externalMessageId: message.id,
      channelType: this.channelType,
      adapterId: this.adapterId,
      sender: {
        identifier: message.from,
        name: change.value.contacts[0]?.profile?.name
      },
      content: {
        text: message.text?.body,
        mediaUrl: message.image?.id || message.video?.id || message.document?.id
      },
      receivedAt: new Date(message.timestamp * 1000)
    };
  }

  validateRecipient(recipientIdentifier: string): boolean {
    // Validate phone number format (E.164)
    return /^\+[1-9]\d{1,14}$/.test(recipientIdentifier);
  }

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/${this.phoneNumberId}`,
        {
          headers: { 'Authorization': `Bearer ${this.accessToken}` }
        }
      );

      return {
        healthy: true,
        adapterId: this.adapterId,
        timestamp: new Date(),
        metadata: {
          phoneNumber: response.data.display_phone_number,
          verifiedName: response.data.verified_name
        }
      };
    } catch (error) {
      return {
        healthy: false,
        adapterId: this.adapterId,
        timestamp: new Date(),
        errors: [error.message]
      };
    }
  }

  getCapabilities(): AdapterCapabilities {
    return {
      supportedMessageTypes: [
        MessageType.TEXT,
        MessageType.IMAGE,
        MessageType.VIDEO,
        MessageType.AUDIO,
        MessageType.DOCUMENT,
        MessageType.TEMPLATE
      ],
      maxMessageLength: 4096,
      supportsMediaUpload: true,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4', 'application/pdf'],
      maxMediaSizeBytes: 16 * 1024 * 1024, // 16MB
      supportsTwoWayMessaging: true,
      supportsDeliveryReceipts: true,
      supportsReadReceipts: true,
      supportsTemplates: true,
      supportsGroupMessaging: false,
      supportsScheduledMessages: false,
      isEncryptedByDefault: true,
      costPerMessage: { amount: 0.005, currency: 'GBP', provider: 'Meta' }
    };
  }

  private transformToWhatsAppFormat(message: CommunicationMessage): any {
    // Transform generic message to WhatsApp API format
    // Implementation details
  }

  private handleError(messageId: string, error: any): MessageDeliveryResult {
    // Error handling logic
  }

  async broadcastMessage(
    message: CommunicationMessage,
    recipients: Recipient[]
  ): Promise<BroadcastResult> {
    // Implementation
  }

  async checkDeliveryStatus(messageId: string): Promise<DeliveryStatus> {
    // Implementation
  }

  async shutdown(): Promise<void> {
    // Cleanup
  }
}
```

### 2. Telegram Bot API Adapter

```typescript
export class TelegramBotAdapter implements ICommunicationAdapter {
  readonly adapterId = 'telegram-bot';
  readonly channelName = 'Telegram';
  readonly channelType = CommunicationChannelType.INSTANT_MESSAGING;

  private botToken: string;
  private apiUrl = 'https://api.telegram.org/bot';

  async initialize(config: AdapterConfiguration): Promise<void> {
    this.botToken = config.credentials.botToken;
  }

  async sendMessage(
    message: CommunicationMessage
  ): Promise<MessageDeliveryResult> {
    try {
      const response = await axios.post(
        `${this.apiUrl}${this.botToken}/sendMessage`,
        {
          chat_id: message.recipient.channelIdentifier,
          text: message.content.text,
          parse_mode: 'Markdown'
        }
      );

      return {
        success: true,
        messageId: message.messageId,
        externalMessageId: response.data.result.message_id.toString(),
        channelType: this.channelType,
        adapterId: this.adapterId,
        timestamp: new Date(),
        deliveryStatus: DeliveryStatus.SENT
      };
    } catch (error) {
      return this.handleError(message.messageId, error);
    }
  }

  validateRecipient(recipientIdentifier: string): boolean {
    // Validate Telegram chat ID (numeric)
    return /^\d+$/.test(recipientIdentifier);
  }

  getCapabilities(): AdapterCapabilities {
    return {
      supportedMessageTypes: [
        MessageType.TEXT,
        MessageType.RICH_TEXT,
        MessageType.IMAGE,
        MessageType.VIDEO,
        MessageType.AUDIO,
        MessageType.DOCUMENT
      ],
      maxMessageLength: 4096,
      supportsMediaUpload: true,
      supportedMediaTypes: ['image/*', 'video/*', 'audio/*', 'application/*'],
      maxMediaSizeBytes: 50 * 1024 * 1024, // 50MB
      supportsTwoWayMessaging: true,
      supportsDeliveryReceipts: false,
      supportsReadReceipts: false,
      supportsTemplates: false,
      supportsGroupMessaging: true,
      supportsScheduledMessages: false,
      isEncryptedByDefault: true,
      costPerMessage: { amount: 0, currency: 'GBP', provider: 'Telegram' }
    };
  }

  // ... other required methods
}
```

### 3. SMS (Twilio) Adapter

```typescript
export class TwilioSMSAdapter implements ICommunicationAdapter {
  readonly adapterId = 'twilio-sms';
  readonly channelName = 'SMS (Twilio)';
  readonly channelType = CommunicationChannelType.SMS;

  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  async initialize(config: AdapterConfiguration): Promise<void> {
    this.accountSid = config.credentials.accountSid;
    this.authToken = config.credentials.authToken;
    this.fromNumber = config.credentials.fromNumber;
  }

  async sendMessage(
    message: CommunicationMessage
  ): Promise<MessageDeliveryResult> {
    const client = require('twilio')(this.accountSid, this.authToken);

    try {
      const twilioMessage = await client.messages.create({
        body: message.content.text,
        from: this.fromNumber,
        to: message.recipient.channelIdentifier
      });

      return {
        success: true,
        messageId: message.messageId,
        externalMessageId: twilioMessage.sid,
        channelType: this.channelType,
        adapterId: this.adapterId,
        timestamp: new Date(),
        deliveryStatus: this.mapTwilioStatus(twilioMessage.status),
        cost: {
          amount: parseFloat(twilioMessage.price) * -1, // Twilio returns negative
          currency: twilioMessage.priceUnit,
          provider: 'Twilio'
        }
      };
    } catch (error) {
      return this.handleError(message.messageId, error);
    }
  }

  validateRecipient(recipientIdentifier: string): boolean {
    // Validate E.164 phone number format
    return /^\+[1-9]\d{1,14}$/.test(recipientIdentifier);
  }

  getCapabilities(): AdapterCapabilities {
    return {
      supportedMessageTypes: [MessageType.TEXT],
      maxMessageLength: 1600, // SMS concatenation
      supportsMediaUpload: false,
      supportsTwoWayMessaging: true,
      supportsDeliveryReceipts: true,
      supportsReadReceipts: false,
      supportsTemplates: false,
      supportsGroupMessaging: false,
      supportsScheduledMessages: true,
      isEncryptedByDefault: false, // SMS is not encrypted
      costPerMessage: { amount: 0.04, currency: 'GBP', provider: 'Twilio' }
    };
  }

  private mapTwilioStatus(twilioStatus: string): DeliveryStatus {
    const statusMap = {
      'queued': DeliveryStatus.QUEUED,
      'sent': DeliveryStatus.SENT,
      'delivered': DeliveryStatus.DELIVERED,
      'failed': DeliveryStatus.FAILED,
      'undelivered': DeliveryStatus.FAILED
    };
    return statusMap[twilioStatus] || DeliveryStatus.QUEUED;
  }

  // ... other required methods
}
```

### 4. Email (SendGrid) Adapter

```typescript
export class SendGridEmailAdapter implements ICommunicationAdapter {
  readonly adapterId = 'sendgrid-email';
  readonly channelName = 'Email (SendGrid)';
  readonly channelType = CommunicationChannelType.EMAIL;

  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  async initialize(config: AdapterConfiguration): Promise<void> {
    this.apiKey = config.credentials.apiKey;
    this.fromEmail = config.credentials.fromEmail;
    this.fromName = config.credentials.fromName || 'WriteCareNotes';
  }

  async sendMessage(
    message: CommunicationMessage
  ): Promise<MessageDeliveryResult> {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(this.apiKey);

    try {
      const msg = {
        to: message.recipient.channelIdentifier,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: message.metadata.category.replace('_', ' ').toUpperCase(),
        text: message.content.text,
        html: message.content.richText || this.textToHtml(message.content.text)
      };

      const response = await sgMail.send(msg);

      return {
        success: true,
        messageId: message.messageId,
        externalMessageId: response[0].headers['x-message-id'],
        channelType: this.channelType,
        adapterId: this.adapterId,
        timestamp: new Date(),
        deliveryStatus: DeliveryStatus.SENT
      };
    } catch (error) {
      return this.handleError(message.messageId, error);
    }
  }

  validateRecipient(recipientIdentifier: string): boolean {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(recipientIdentifier);
  }

  getCapabilities(): AdapterCapabilities {
    return {
      supportedMessageTypes: [
        MessageType.TEXT,
        MessageType.RICH_TEXT,
        MessageType.DOCUMENT
      ],
      maxMessageLength: 100000,
      supportsMediaUpload: true,
      supportedMediaTypes: ['application/pdf', 'image/*'],
      maxMediaSizeBytes: 30 * 1024 * 1024, // 30MB
      supportsTwoWayMessaging: false,
      supportsDeliveryReceipts: true,
      supportsReadReceipts: false,
      supportsTemplates: true,
      supportsGroupMessaging: true,
      supportsScheduledMessages: true,
      isEncryptedByDefault: false, // TLS in transit only
      costPerMessage: { amount: 0.001, currency: 'GBP', provider: 'SendGrid' }
    };
  }

  private textToHtml(text: string): string {
    return `<html><body>${text.replace(/\n/g, '<br>')}</body></html>`;
  }

  // ... other required methods
}
```

### 5. Generic Webhook Adapter

```typescript
export class GenericWebhookAdapter implements ICommunicationAdapter {
  readonly adapterId = 'generic-webhook';
  readonly channelName = 'Custom Webhook';
  readonly channelType = CommunicationChannelType.WEBHOOK;

  private webhookUrl: string;
  private authMethod: 'bearer' | 'basic' | 'api_key' | 'none';
  private authCredentials: any;

  async initialize(config: AdapterConfiguration): Promise<void> {
    this.webhookUrl = config.settings.webhookUrl;
    this.authMethod = config.settings.authMethod || 'none';
    this.authCredentials = config.credentials;
  }

  async sendMessage(
    message: CommunicationMessage
  ): Promise<MessageDeliveryResult> {
    try {
      const headers = this.buildAuthHeaders();
      
      const response = await axios.post(
        this.webhookUrl,
        {
          message: message,
          timestamp: new Date().toISOString()
        },
        { headers }
      );

      return {
        success: response.status >= 200 && response.status < 300,
        messageId: message.messageId,
        externalMessageId: response.data.messageId || message.messageId,
        channelType: this.channelType,
        adapterId: this.adapterId,
        timestamp: new Date(),
        deliveryStatus: DeliveryStatus.SENT
      };
    } catch (error) {
      return this.handleError(message.messageId, error);
    }
  }

  validateRecipient(recipientIdentifier: string): boolean {
    // For webhooks, identifier could be anything (user ID, endpoint, etc.)
    return recipientIdentifier.length > 0;
  }

  getCapabilities(): AdapterCapabilities {
    return {
      supportedMessageTypes: Object.values(MessageType),
      supportsMediaUpload: true,
      supportsTwoWayMessaging: false,
      supportsDeliveryReceipts: false,
      supportsReadReceipts: false,
      supportsTemplates: false,
      supportsGroupMessaging: false,
      supportsScheduledMessages: false,
      isEncryptedByDefault: false
    };
  }

  private buildAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    switch (this.authMethod) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${this.authCredentials.token}`;
        break;
      case 'basic':
        const basic = Buffer.from(
          `${this.authCredentials.username}:${this.authCredentials.password}`
        ).toString('base64');
        headers['Authorization'] = `Basic ${basic}`;
        break;
      case 'api_key':
        headers[this.authCredentials.headerName] = this.authCredentials.apiKey;
        break;
    }

    return headers;
  }

  // ... other required methods
}
```

---

## 🎯 Usage Examples

### Example 1: Send message using user's preferred channel

```typescript
import { CommunicationOrchestrator } from './services/CommunicationOrchestrator';

const orchestrator = new CommunicationOrchestrator(
  adapterFactory,
  userPreferenceService,
  deliveryLogService
);

// Send care update to family member
await orchestrator.sendToUser({
  recipientUserId: 'family-member-123',
  organizationId: 'care-home-456',
  message: {
    type: MessageType.TEXT,
    content: {
      text: 'Your mother had a wonderful day at our gardening activity. She enjoyed planting flowers and had lunch with friends.'
    },
    category: MessageCategory.CARE_UPDATE,
    priority: MessagePriority.MEDIUM
  }
});

// Orchestrator automatically:
// 1. Looks up user's preferred channel (e.g., WhatsApp)
// 2. Gets user's WhatsApp number
// 3. Selects appropriate adapter
// 4. Sends message
// 5. Tracks delivery
// 6. Falls back to SMS if WhatsApp fails
```

### Example 2: Emergency broadcast with priority routing

```typescript
// Send emergency alert to all staff on duty
await orchestrator.broadcastToGroup({
  groupType: 'staff_on_duty',
  organizationId: 'care-home-456',
  message: {
    type: MessageType.TEXT,
    content: {
      text: 'URGENT: Medical emergency in Room 12. All available staff respond immediately.'
    },
    category: MessageCategory.EMERGENCY,
    priority: MessagePriority.EMERGENCY
  },
  deliveryOptions: {
    // Try multiple channels simultaneously for emergencies
    fallbackChannels: [
      CommunicationChannelType.SMS,
      CommunicationChannelType.PUSH_NOTIFICATION,
      CommunicationChannelType.VOICE
    ]
  }
});
```

### Example 3: User configures their preferences

```typescript
// Family member sets WhatsApp as primary, SMS as fallback
await userPreferenceService.updatePreferences(
  'family-member-123',
  'care-home-456',
  {
    primaryChannelType: CommunicationChannelType.INSTANT_MESSAGING,
    primaryChannelIdentifier: '+447700900123', // WhatsApp number
    fallbackChannels: [
      {
        type: CommunicationChannelType.SMS,
        identifier: '+447700900123'
      },
      {
        type: CommunicationChannelType.EMAIL,
        identifier: 'family@example.com'
      }
    ],
    categoryPreferences: {
      [MessageCategory.EMERGENCY]: {
        channels: [
          CommunicationChannelType.SMS, // Emergency = SMS immediately
          CommunicationChannelType.INSTANT_MESSAGING
        ],
        priority: MessagePriority.URGENT
      },
      [MessageCategory.CARE_UPDATE]: {
        channels: [CommunicationChannelType.INSTANT_MESSAGING],
        priority: MessagePriority.MEDIUM
      }
    },
    doNotDisturbStart: '22:00',
    doNotDisturbEnd: '08:00',
    timezone: 'Europe/London'
  }
);
```

---

## 🔐 GDPR Compliance Features

### 1. Consent Management

```typescript
export class ConsentManagementService {
  /**
   * Record user consent for a communication channel
   */
  async recordConsent(
    userId: string,
    channelType: CommunicationChannelType,
    consentData: {
      purpose: string;
      consentedAt: Date;
      ipAddress: string;
      userAgent: string;
      consentText: string;
    }
  ): Promise<void> {
    // Store consent with full audit trail
  }

  /**
   * Revoke consent (right to be forgotten)
   */
  async revokeConsent(
    userId: string,
    channelType: CommunicationChannelType
  ): Promise<void> {
    // Immediately stop messages
    // Anonymize historical data
    // Notify adapters to remove user data
  }

  /**
   * Export all user communication data (data portability)
   */
  async exportUserData(userId: string): Promise<CommunicationDataExport> {
    // Collect all messages, preferences, delivery logs
    // Return in portable format (JSON)
  }
}
```

### 2. Data Minimization

- Only store necessary identifiers
- Auto-delete delivery logs after 90 days (configurable)
- Encrypt all channel credentials at rest
- Redact sensitive content from logs

### 3. Audit Trail

Every communication action logged:
- Who sent the message
- To whom
- Via which channel
- Delivery status
- User consent status at time of send
- Retention policy applied

---

## 📊 Monitoring & Analytics

### Adapter Health Dashboard

```typescript
export class AdapterHealthMonitor {
  /**
   * Real-time health metrics for all adapters
   */
  async getHealthMetrics(): Promise<AdapterHealthMetrics> {
    return {
      adapters: [
        {
          adapterId: 'whatsapp-business',
          healthy: true,
          uptime: '99.8%',
          avgLatencyMs: 245,
          messagesLast24h: 1243,
          errorRate: '0.2%',
          costLast24h: { amount: 6.22, currency: 'GBP' }
        },
        {
          adapterId: 'telegram-bot',
          healthy: true,
          uptime: '100%',
          avgLatencyMs: 180,
          messagesLast24h: 523,
          errorRate: '0%',
          costLast24h: { amount: 0, currency: 'GBP' }
        },
        {
          adapterId: 'twilio-sms',
          healthy: false,
          uptime: '95.2%',
          avgLatencyMs: 1200,
          messagesLast24h: 89,
          errorRate: '4.8%',
          costLast24h: { amount: 3.56, currency: 'GBP' },
          errors: ['Rate limit exceeded', 'Invalid recipient number']
        }
      ],
      totalMessages: 1855,
      totalCost: { amount: 9.78, currency: 'GBP' },
      avgDeliveryRate: '97.6%'
    };
  }

  /**
   * Alert on adapter failures
   */
  async monitorAndAlert(): Promise<void> {
    // Check health every 5 minutes
    // Alert ops team if adapter down
    // Auto-failover to backup adapters
  }
}
```

---

## 🚀 Migration Strategy

### Phase 1: Foundation (Week 1-2)
- ✅ Define interfaces and base classes
- ✅ Build adapter factory
- ✅ Create database schema
- ✅ Implement user preference service

### Phase 2: Core Adapters (Week 3-4)
- ✅ Implement WhatsApp Business adapter
- ✅ Implement SMS (Twilio) adapter
- ✅ Implement Email (SendGrid) adapter
- ✅ Build orchestration service

### Phase 3: Advanced Features (Week 5-6)
- ✅ Add Telegram adapter
- ✅ Add generic webhook adapter
- ✅ Implement fallback logic
- ✅ Build preference UI

### Phase 4: Testing & Rollout (Week 7-8)
- ✅ Integration testing
- ✅ Load testing
- ✅ User acceptance testing
- ✅ Gradual rollout to care homes

---

## 📈 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Delivery Rate** | >95% | Messages delivered / sent |
| **Fallback Success** | >90% | Fallbacks successful / triggered |
| **User Adoption** | >70% | Users who set preferences |
| **Response Time** | <500ms | Adapter selection to send |
| **Cost Efficiency** | <£0.01/msg | Average cost per message |
| **Uptime** | >99.5% | Adapter availability |

---

## 🔒 Security Considerations

1. **Credential Encryption**: All API keys/tokens encrypted at rest (AES-256)
2. **Rate Limiting**: Per-adapter rate limits to prevent abuse
3. **Input Validation**: Sanitize all message content
4. **Webhook Verification**: Verify webhook signatures (WhatsApp, Telegram)
5. **Audit Logging**: All adapter operations logged
6. **Secrets Rotation**: Automated credential rotation every 90 days
7. **Network Isolation**: Adapters run in isolated network segments
8. **Failure Isolation**: One adapter failure doesn't affect others

---

## 📚 Documentation Requirements

1. **Adapter Development Guide**: How to create new adapters
2. **User Preference Guide**: How users configure channels
3. **Admin Guide**: How to configure org-level adapters
4. **API Reference**: Complete API documentation
5. **Troubleshooting Guide**: Common issues and solutions
6. **Cost Management Guide**: Optimize communication costs

---

## ✅ Conclusion

This **Generic Communication Adapter Pattern** provides:

✅ **Flexibility**: Support any communication channel  
✅ **User Choice**: Users control how they're contacted  
✅ **Reliability**: Automatic fallback prevents message loss  
✅ **Scalability**: Add new channels without core changes  
✅ **Compliance**: GDPR-ready with consent and audit  
✅ **Cost Optimization**: Route via cheapest available channel  
✅ **Future-Proof**: Ready for emerging channels (Signal, Matrix, etc.)  

This architecture transforms communication from a single-channel feature into a **flexible, user-centric platform** that adapts to each user's preferences and needs.

---

**Next Steps:**
1. Review and approve architecture
2. Prioritize adapter implementations
3. Build POC with WhatsApp + SMS adapters
4. Test with pilot care home
5. Iterate based on feedback
6. Roll out to production
