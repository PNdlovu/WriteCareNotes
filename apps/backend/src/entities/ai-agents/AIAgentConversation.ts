import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview AI Agent Conversation Entity
 * @module AIAgentConversation
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-14
 * 
 * @description Entity for tracking AI agent conversation history with encryption support
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AIAgentSession } from './AIAgentSession';

export type MessageType = 'USER_MESSAGE' | 'AGENT_RESPONSE' | 'SYSTEM_MESSAGE';
export type ResponseQuality = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

@Entity('ai_agent_conversations')
@Index(['sessionId', 'messageSequence'])
@Index(['createdAt'])
@Index(['confidenceScore'])
export class AIAgentConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AIAgentSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: AIAgentSession;

  @Column({
    type: 'uuid',
    nullable: false
  })
  sessionId: string;

  @Column({
    type: 'integer',
    nullable: false
  })
  messageSequence: number;

  @Column({
    type: 'var char',
    length: 20,
    default: 'USER_MESSAGE'
  })
  messageType: MessageType;

  @Column({
    type: 'text',
    nullable: true
  })
  userMessage: string | null;

  @Column({
    type: 'text',
    nullable: true
  })
  agentResponse: string | null;

  @Column({
    type: 'text',
    nullable: true
  })
  systemMessage: string | null;

  @Column({
    type: 'integer',
    default: 0
  })
  responseTimeMs: number;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: true
  })
  confidenceScore: number | null;

  @Column({
    type: 'var char',
    length: 20,
    nullable: true
  })
  responseQuality: ResponseQuality | null;

  @Column({
    type: 'jsonb',
    default: '[]'
  })
  knowledgeSources: string[];

  @Column({
    type: 'jsonb',
    default: '{}'
  })
  metadata: {
    userFeedback?: {
      helpful: boolean;
      rating: number;
      comments: string;
    };
    careRecommendations?: any[];
    complianceAlerts?: any[];
    actionItems?: any[];
    escalationReason?: string;
    securityFlags?: string[];
  };

  @Column({
    type: 'boolean',
    default: false
  })
  escalationRequired: boolean;

  @Column({
    type: 'boolean',
    default: false
  })
  isEncrypted: boolean;

  @Column({
    type: 'var char',
    length: 100,
    nullable: true
  })
  encryptionKeyId: string | null;

  @Column({
    type: 'var char',
    length: 50,
    default: 'STANDARD'
  })
  confidentialityLevel: string;

  @CreateDateColumn()
  createdAt: Date;

  /**
   * Check if message contains sensitive information
   */
  containsSensitiveInfo(): boolean {
    const sensitivePatterns = [
      /nhs\s+number/i,
      /date\s+of\s+birth/i,
      /medical\s+record/i,
      /prescription/i,
      /diagnosis/i,
      /family\s+contact/i
    ];

    const allText = `${this.userMessage || ''} ${this.agentResponse || ''}`.toLowerCase();
    
    return sensitivePatterns.some(pattern => pattern.test(allText));
  }

  /**
   * Get response time in seconds
   */
  getResponseTimeSeconds(): number {
    return Math.round(this.responseTimeMs / 1000);
  }

  /**
   * Check if response quality is acceptable
   */
  isQualityAcceptable(): boolean {
    return this.responseQuality === 'EXCELLENT' || this.responseQuality === 'GOOD';
  }

  /**
   * Add user feedback
   */
  addUserFeedback(helpful: boolean, rating: number, comments?: string): void {
    this.metadata = {
      ...this.metadata,
      userFeedback: {
        helpful,
        rating,
        comments: comments || ''
      }
    };
  }

  /**
   * Mark for escalation with reason
   */
  markForEscalation(reason: string): void {
    this.escalationRequired = true;
    this.metadata = {
      ...this.metadata,
      escalationReason: reason
    };
  }

  /**
   * Add security flag
   */
  addSecurityFlag(flag: string): void {
    if (!this.metadata.securityFlags) {
      this.metadata.securityFlags = [];
    }
    this.metadata.securityFlags.push(flag);
  }

  /**
   * Set response quality based on confidence and feedback
   */
  calculateResponseQuality(): ResponseQuality {
    if (this.confidenceScore >= 0.9) {
      return 'EXCELLENT';
    } else if (this.confidenceScore >= 0.7) {
      return 'GOOD';
    } else if (this.confidenceScore >= 0.5) {
      return 'FAIR';
    } else {
      return 'POOR';
    }
  }

  /**
   * Check if conversation requires encryption
   */
  requiresEncryption(): boolean {
    return this.confidentialityLevel === 'SENSITIVE' || 
           this.confidentialityLevel === 'HIGHLY_SENSITIVE' ||
           this.containsSensitiveInfo();
  }

  /**
   * Get conversation summary for analytics
   */
  getSummary(): {
    messageType: MessageType;
    responseTime: number;
    confidence: number;
    quality: ResponseQuality;
    escalated: boolean;
    encrypted: boolean;
    knowledgeSourcesCount: number;
  } {
    return {
      messageType: this.messageType,
      responseTime: this.responseTimeMs,
      confidence: this.confidenceScore || 0,
      quality: this.responseQuality || this.calculateResponseQuality(),
      escalated: this.escalationRequired,
      encrypted: this.isEncrypted,
      knowledgeSourcesCount: this.knowledgeSources.length
    };
  }
}

export default AIAgentConversation;
