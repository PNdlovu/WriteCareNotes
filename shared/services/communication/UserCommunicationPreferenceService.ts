/**
 * @fileoverview User Communication Preference Service
 * @module UserCommunicationPreferenceService
 * @category Communication
 * @subcategory Services
 * @version 1.0.0
 * @since 2025-10-07
 * @author WriteCareNotes Development Team
 * 
 * @description
 * Service for managing user communication preferences, channel identifiers,
 * opt-in/opt-out management, and consent tracking for GDPR compliance.
 * 
 * Features:
 * - User preference CRUD operations
 * - Channel identifier verification
 * - Opt-in/opt-out management with audit trail
 * - Fallback channel configuration
 * - GDPR consent tracking
 * - Preferred language settings
 * - Do-not-disturb schedules
 * 
 * @compliance
 * - GDPR Article 6: Lawful basis for processing
 * - GDPR Article 7: Conditions for consent
 * - GDPR Article 21: Right to object
 * - ISO 27001: Information security management
 * - Healthcare IT Standards (NHS Digital, CQC)
 * 
 * @example
 * ```typescript
 * const service = new UserCommunicationPreferenceService(db);
 * 
 * // Set user preferences
 * await service.setUserPreference('user-123', {
 *   primaryChannel: CommunicationChannelType.INSTANT_MESSAGING,
 *   primaryIdentifier: '+447700900123',
 *   fallbackChannels: [CommunicationChannelType.SMS, CommunicationChannelType.EMAIL],
 *   language: 'en',
 *   consentGiven: true
 * });
 * 
 * // Get routing preferences
 * const routing = await service.getUserRoutingPreferences('user-123');
 * ```
 */

import { Logger } from '../../utils/Logger.js';
import { CommunicationChannelType } from '../../interfaces/communication/ICommunicationAdapter.js';

/**
 * User communication preference
 * 
 * @interface UserCommunicationPreference
 */
export interface UserCommunicationPreference {
  /** User ID */
  userId: string;
  
  /** Organization ID */
  organizationId: string;
  
  /** Primary communication channel */
  primaryChannel: CommunicationChannelType;
  
  /** Primary channel identifier */
  primaryIdentifier: string;
  
  /** Fallback channels in order of preference */
  fallbackChannels: CommunicationChannelType[];
  
  /** Preferred language (ISO 639-1) */
  language: string;
  
  /** Consent given for communication */
  consentGiven: boolean;
  
  /** Consent timestamp */
  consentTimestamp?: Date;
  
  /** Opt-out status */
  optedOut: boolean;
  
  /** Opt-out timestamp */
  optOutTimestamp?: Date;
  
  /** Do-not-disturb start hour (0-23) */
  dndStartHour?: number;
  
  /** Do-not-disturb end hour (0-23) */
  dndEndHour?: number;
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Channel identifier
 * 
 * @interface ChannelIdentifier
 */
export interface ChannelIdentifier {
  /** User ID */
  userId: string;
  
  /** Channel type */
  channelType: CommunicationChannelType;
  
  /** Channel identifier (phone, email, username) */
  identifier: string;
  
  /** Verified status */
  verified: boolean;
  
  /** Verification timestamp */
  verifiedAt?: Date;
  
  /** Active status */
  active: boolean;
  
  /** Created timestamp */
  createdAt: Date;
}

/**
 * User routing preferences (resolved from preferences)
 * 
 * @interface UserRoutingPreferences
 */
export interface UserRoutingPreferences {
  /** User ID */
  userId: string;
  
  /** Can receive messages */
  canReceiveMessages: boolean;
  
  /** Primary channel */
  primaryChannel: {
    type: CommunicationChannelType;
    identifier: string;
    verified: boolean;
  };
  
  /** Fallback channels */
  fallbackChannels: Array<{
    type: CommunicationChannelType;
    identifier: string;
    verified: boolean;
  }>;
  
  /** Preferred language */
  language: string;
  
  /** Currently in do-not-disturb window */
  inDndWindow: boolean;
}

/**
 * User Communication Preference Service
 * 
 * @class UserCommunicationPreferenceService
 */
export class UserCommunicationPreferenceService {
  /** Logger */
  private logger: Logger;
  
  /** In-memory storage (replace with database in production) */
  private preferences: Map<string, UserCommunicationPreference> = new Map();
  private channelIdentifiers: Map<string, ChannelIdentifier[]> = new Map();

  /**
   * Constructor
   */
  constructor() {
    this.logger = new Logger('UserCommunicationPreferenceService');
  }

  /**
   * Set user communication preference
   * 
   * @param {string} userId - User ID
   * @param {Partial<UserCommunicationPreference>} preference - Preference data
   * @returns {Promise<UserCommunicationPreference>} Saved preference
   */
  public async setUserPreference(
    userId: string,
    preference: Partial<UserCommunicationPreference>
  ): Promise<UserCommunicationPreference> {
    this.logger.info('Setting user preference', { userId });

    const existingPreference = this.preferences.get(userId);
    const now = new Date();

    const updatedPreference: UserCommunicationPreference = {
      userId,
      organizationId: preference.organizationId || existingPreference?.organizationId || '',
      primaryChannel: preference.primaryChannel || existingPreference?.primaryChannel || CommunicationChannelType.IN_APP,
      primaryIdentifier: preference.primaryIdentifier || existingPreference?.primaryIdentifier || '',
      fallbackChannels: preference.fallbackChannels || existingPreference?.fallbackChannels || [],
      language: preference.language || existingPreference?.language || 'en',
      consentGiven: preference.consentGiven !== undefined ? preference.consentGiven : existingPreference?.consentGiven || false,
      consentTimestamp: preference.consentGiven ? now : existingPreference?.consentTimestamp,
      optedOut: preference.optedOut !== undefined ? preference.optedOut : existingPreference?.optedOut || false,
      optOutTimestamp: preference.optedOut ? now : existingPreference?.optOutTimestamp,
      dndStartHour: preference.dndStartHour !== undefined ? preference.dndStartHour : existingPreference?.dndStartHour,
      dndEndHour: preference.dndEndHour !== undefined ? preference.dndEndHour : existingPreference?.dndEndHour,
      createdAt: existingPreference?.createdAt || now,
      updatedAt: now
    };

    this.preferences.set(userId, updatedPreference);

    this.logger.info('User preference saved', {
      userId,
      primaryChannel: updatedPreference.primaryChannel,
      consentGiven: updatedPreference.consentGiven
    });

    return updatedPreference;
  }

  /**
   * Get user preference
   * 
   * @param {string} userId - User ID
   * @returns {Promise<UserCommunicationPreference | null>} Preference or null
   */
  public async getUserPreference(userId: string): Promise<UserCommunicationPreference | null> {
    return this.preferences.get(userId) || null;
  }

  /**
   * Add channel identifier for user
   * 
   * @param {string} userId - User ID
   * @param {CommunicationChannelType} channelType - Channel type
   * @param {string} identifier - Channel identifier
   * @param {boolean} verified - Verified status
   * @returns {Promise<ChannelIdentifier>} Created identifier
   */
  public async addChannelIdentifier(
    userId: string,
    channelType: CommunicationChannelType,
    identifier: string,
    verified = false
  ): Promise<ChannelIdentifier> {
    this.logger.info('Adding channel identifier', {
      userId,
      channelType,
      identifier: this.maskIdentifier(identifier)
    });

    const userIdentifiers = this.channelIdentifiers.get(userId) || [];
    
    // Check if identifier already exists
    const existing = userIdentifiers.find(
      ci => ci.channelType === channelType && ci.identifier === identifier
    );

    if (existing) {
      this.logger.warn('Channel identifier already exists', { userId, channelType });
      return existing;
    }

    const channelIdentifier: ChannelIdentifier = {
      userId,
      channelType,
      identifier,
      verified,
      verifiedAt: verified ? new Date() : undefined,
      active: true,
      createdAt: new Date()
    };

    userIdentifiers.push(channelIdentifier);
    this.channelIdentifiers.set(userId, userIdentifiers);

    this.logger.info('Channel identifier added', {
      userId,
      channelType,
      verified
    });

    return channelIdentifier;
  }

  /**
   * Verify channel identifier
   * 
   * @param {string} userId - User ID
   * @param {CommunicationChannelType} channelType - Channel type
   * @param {string} identifier - Channel identifier
   * @returns {Promise<boolean>} Success status
   */
  public async verifyChannelIdentifier(
    userId: string,
    channelType: CommunicationChannelType,
    identifier: string
  ): Promise<boolean> {
    this.logger.info('Verifying channel identifier', {
      userId,
      channelType,
      identifier: this.maskIdentifier(identifier)
    });

    const userIdentifiers = this.channelIdentifiers.get(userId) || [];
    const channelIdentifier = userIdentifiers.find(
      ci => ci.channelType === channelType && ci.identifier === identifier
    );

    if (!channelIdentifier) {
      this.logger.error('Channel identifier not found', { userId, channelType });
      return false;
    }

    channelIdentifier.verified = true;
    channelIdentifier.verifiedAt = new Date();

    this.logger.info('Channel identifier verified', { userId, channelType });
    return true;
  }

  /**
   * Get user routing preferences (resolved)
   * 
   * @param {string} userId - User ID
   * @returns {Promise<UserRoutingPreferences | null>} Routing preferences
   */
  public async getUserRoutingPreferences(userId: string): Promise<UserRoutingPreferences | null> {
    const preference = await this.getUserPreference(userId);
    
    if (!preference) {
      return null;
    }

    const userIdentifiers = this.channelIdentifiers.get(userId) || [];

    // Check if user can receive messages
    const canReceiveMessages = preference.consentGiven && !preference.optedOut;

    // Get primary channel identifier
    const primaryChannelIdentifier = userIdentifiers.find(
      ci => ci.channelType === preference.primaryChannel && ci.identifier === preference.primaryIdentifier
    );

    if (!primaryChannelIdentifier) {
      this.logger.warn('Primary channel identifier not found', {
        userId,
        primaryChannel: preference.primaryChannel
      });
    }

    // Get fallback channel identifiers
    const fallbackChannels = preference.fallbackChannels
      .map(channelType => {
        const identifier = userIdentifiers.find(
          ci => ci.channelType === channelType && ci.active
        );
        
        return identifier ? {
          type: channelType,
          identifier: identifier.identifier,
          verified: identifier.verified
        } : null;
      })
      .filter((ch): ch is NonNullable<typeof ch> => ch !== null);

    // Check if currently in DND window
    const inDndWindow = this.isInDndWindow(preference);

    return {
      userId,
      canReceiveMessages,
      primaryChannel: {
        type: preference.primaryChannel,
        identifier: preference.primaryIdentifier,
        verified: primaryChannelIdentifier?.verified || false
      },
      fallbackChannels,
      language: preference.language,
      inDndWindow
    };
  }

  /**
   * Record consent
   * 
   * @param {string} userId - User ID
   * @param {boolean} consentGiven - Consent status
   * @returns {Promise<void>}
   */
  public async recordConsent(userId: string, consentGiven: boolean): Promise<void> {
    this.logger.info('Recording consent', { userId, consentGiven });

    await this.setUserPreference(userId, {
      consentGiven,
      consentTimestamp: consentGiven ? new Date() : undefined
    });

    this.logger.info('Consent recorded', { userId, consentGiven });
  }

  /**
   * Opt out user
   * 
   * @param {string} userId - User ID
   * @param {string} reason - Opt-out reason
   * @returns {Promise<void>}
   */
  public async optOutUser(userId: string, reason?: string): Promise<void> {
    this.logger.info('Opting out user', { userId, reason });

    await this.setUserPreference(userId, {
      optedOut: true,
      optOutTimestamp: new Date()
    });

    this.logger.info('User opted out', { userId });
  }

  /**
   * Opt in user
   * 
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  public async optInUser(userId: string): Promise<void> {
    this.logger.info('Opting in user', { userId });

    await this.setUserPreference(userId, {
      optedOut: false,
      optOutTimestamp: undefined
    });

    this.logger.info('User opted in', { userId });
  }

  /**
   * Get all channel identifiers for user
   * 
   * @param {string} userId - User ID
   * @returns {Promise<ChannelIdentifier[]>} Channel identifiers
   */
  public async getUserChannelIdentifiers(userId: string): Promise<ChannelIdentifier[]> {
    return this.channelIdentifiers.get(userId) || [];
  }

  /**
   * Remove channel identifier
   * 
   * @param {string} userId - User ID
   * @param {CommunicationChannelType} channelType - Channel type
   * @param {string} identifier - Channel identifier
   * @returns {Promise<boolean>} Success status
   */
  public async removeChannelIdentifier(
    userId: string,
    channelType: CommunicationChannelType,
    identifier: string
  ): Promise<boolean> {
    this.logger.info('Removing channel identifier', { userId, channelType });

    const userIdentifiers = this.channelIdentifiers.get(userId) || [];
    const index = userIdentifiers.findIndex(
      ci => ci.channelType === channelType && ci.identifier === identifier
    );

    if (index === -1) {
      this.logger.warn('Channel identifier not found', { userId, channelType });
      return false;
    }

    userIdentifiers.splice(index, 1);
    this.channelIdentifiers.set(userId, userIdentifiers);

    this.logger.info('Channel identifier removed', { userId, channelType });
    return true;
  }

  /**
   * Check if currently in do-not-disturb window
   * 
   * @private
   * @param {UserCommunicationPreference} preference - User preference
   * @returns {boolean} True if in DND window
   */
  private isInDndWindow(preference: UserCommunicationPreference): boolean {
    if (preference.dndStartHour === undefined || preference.dndEndHour === undefined) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();

    // Handle DND window that crosses midnight
    if (preference.dndStartHour > preference.dndEndHour) {
      return currentHour >= preference.dndStartHour || currentHour < preference.dndEndHour;
    }

    return currentHour >= preference.dndStartHour && currentHour < preference.dndEndHour;
  }

  /**
   * Mask identifier for logging (privacy)
   * 
   * @private
   * @param {string} identifier - Identifier to mask
   * @returns {string} Masked identifier
   */
  private maskIdentifier(identifier: string): string {
    if (identifier.length <= 4) {
      return '****';
    }
    return identifier.substring(0, 2) + '****' + identifier.substring(identifier.length - 2);
  }

  /**
   * Get statistics
   * 
   * @returns {Promise<any>} Statistics
   */
  public async getStatistics(): Promise<any> {
    const totalUsers = this.preferences.size;
    const consentedUsers = Array.from(this.preferences.values()).filter(p => p.consentGiven).length;
    const optedOutUsers = Array.from(this.preferences.values()).filter(p => p.optedOut).length;
    
    const channelDistribution: Record<string, number> = {};
    for (const preference of this.preferences.values()) {
      channelDistribution[preference.primaryChannel] = (channelDistribution[preference.primaryChannel] || 0) + 1;
    }

    return {
      totalUsers,
      consentedUsers,
      optedOutUsers,
      channelDistribution,
      totalChannelIdentifiers: Array.from(this.channelIdentifiers.values()).reduce((sum, ids) => sum + ids.length, 0)
    };
  }
}
