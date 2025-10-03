import { Injectable } from '@nestjs/common';
import { EventStreamService } from './EventStreamService';
import { CareNote } from '../../care/entities/CareNote';
import { Resident } from '../../care/entities/Resident';
import { StaffMember } from '../../staff/entities/StaffMember';

export interface VoiceTranscriptionRequest {
  audioData: string; // Base64 encoded audio
  audioFormat: 'wav' | 'mp3' | 'm4a' | 'webm';
  residentId?: string;
  staffMemberId: string;
  sessionId?: string;
  context?: string;
}

export interface VoiceTranscriptionResponse {
  transcription: string;
  confidence: number;
  language: string;
  duration: number;
  wordCount: number;
  timestamp: Date;
}

export interface NoteGenerationRequest {
  transcription: string;
  residentId?: string;
  staffMemberId: string;
  noteType: 'care_note' | 'medication' | 'incident' | 'observation' | 'assessment';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  context?: string;
  additionalData?: any;
}

export interface NoteGenerationResponse {
  noteId: string;
  title: string;
  content: string;
  tags: string[];
  categories: string[];
  priority: string;
  suggestedActions: string[];
  confidence: number;
  requiresReview: boolean;
  generatedAt: Date;
}

export interface AgentCapabilities {
  transcription: boolean;
  noteGeneration: boolean;
  sentimentAnalysis: boolean;
  keywordExtraction: boolean;
  actionItemDetection: boolean;
  riskAssessment: boolean;
  languageDetection: boolean;
  summarization: boolean;
}

@Injectable()
export class VoiceToNoteAgent {
  private eventStream: EventStreamService;
  private capabilities: AgentCapabilities = {
    transcription: true,
    noteGeneration: true,
    sentimentAnalysis: true,
    keywordExtraction: true,
    actionItemDetection: true,
    riskAssessment: true,
    languageDetection: true,
    summarization: true,
  };

  constructor() {
    this.eventStream = EventStreamService.getInstance();
    this.initializeAgent();
  }

  private initializeAgent(): void {
    console.log('🎤 Initializing Voice-to-Note Agent...');
    
    // Subscribe to voice-related events
    this.eventStream.subscribe('voice.audio.received', this.handleVoiceAudio.bind(this));
    this.eventStream.subscribe('care.note.requested', this.handleNoteRequest.bind(this));
    this.eventStream.subscribe('transcription.completed', this.handleTranscriptionComplete.bind(this));
    
    console.log('✅ Voice-to-Note Agent initialized successfully');
  }

  /**
   * Process voice audio and generate care notes
   */
  async processVoiceToNote(request: VoiceTranscriptionRequest): Promise<{
    transcription: VoiceTranscriptionResponse;
    note: NoteGenerationResponse;
  }> {
    try {
      console.log('🎤 Processing voice-to-note request...');

      // Step 1: Transcribe audio
      const transcription = await this.transcribeAudio(request);
      
      // Step 2: Generate care note
      const noteRequest: NoteGenerationRequest = {
        transcription: transcription.transcription,
        residentId: request.residentId,
        staffMemberId: request.staffMemberId,
        noteType: 'care_note',
        priority: 'medium',
        context: request.context,
      };
      
      const note = await this.generateNote(noteRequest);

      // Step 3: Publish events
      this.eventStream.publish({
        type: 'voice.note.generated',
        payload: {
          transcription,
          note,
          request,
        },
        timestamp: new Date(),
        source: 'voice-to-note-agent',
      });

      console.log('✅ Voice-to-note processing completed');

      return { transcription, note };
    } catch (error) {
      console.error('❌ Voice-to-note processing failed:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio to text
   */
  private async transcribeAudio(request: VoiceTranscriptionRequest): Promise<VoiceTranscriptionResponse> {
    console.log('🎧 Transcribing audio...');
    
    // In a real implementation, this would call a speech-to-text service
    // For now, we'll simulate the transcription process
    const mockTranscription = this.simulateTranscription(request);
    
    // Publish transcription event
    this.eventStream.publish({
      type: 'transcription.completed',
      payload: {
        request,
        transcription: mockTranscription,
      },
      timestamp: new Date(),
      source: 'voice-to-note-agent',
    });

    return mockTranscription;
  }

  /**
   * Generate care note from transcription
   */
  private async generateNote(request: NoteGenerationRequest): Promise<NoteGenerationResponse> {
    console.log('📝 Generating care note...');
    
    // Analyze transcription for key information
    const analysis = this.analyzeTranscription(request.transcription);
    
    // Generate structured note content
    const noteContent = this.generateStructuredNote(request, analysis);
    
    // Extract tags and categories
    const tags = this.extractTags(request.transcription, analysis);
    const categories = this.categorizeNote(request.transcription, analysis);
    
    // Assess priority and risk
    const priority = this.assessPriority(request.transcription, analysis);
    const riskAssessment = this.assessRisk(request.transcription, analysis);
    
    // Generate suggested actions
    const suggestedActions = this.generateSuggestedActions(request.transcription, analysis, riskAssessment);
    
    // Determine if review is required
    const requiresReview = this.requiresReview(priority, riskAssessment, analysis);
    
    const note: NoteGenerationResponse = {
      noteId: this.generateNoteId(),
      title: this.generateNoteTitle(request.transcription, analysis),
      content: noteContent,
      tags,
      categories,
      priority,
      suggestedActions,
      confidence: analysis.confidence,
      requiresReview,
      generatedAt: new Date(),
    };

    // Publish note generation event
    this.eventStream.publish({
      type: 'note.generated',
      payload: {
        note,
        request,
        analysis,
      },
      timestamp: new Date(),
      source: 'voice-to-note-agent',
    });

    return note;
  }

  /**
   * Analyze transcription for key information
   */
  private analyzeTranscription(transcription: string): {
    sentiment: 'positive' | 'neutral' | 'negative';
    keywords: string[];
    entities: { type: string; value: string; confidence: number }[];
    actionItems: string[];
    medicalTerms: string[];
    confidence: number;
  } {
    // Simulate NLP analysis
    const words = transcription.toLowerCase().split(/\s+/);
    
    // Sentiment analysis (simplified)
    const positiveWords = ['good', 'better', 'improved', 'well', 'happy', 'comfortable'];
    const negativeWords = ['pain', 'hurt', 'bad', 'worse', 'uncomfortable', 'difficult'];
    
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';
    
    // Extract keywords
    const keywords = words.filter(word => 
      word.length > 3 && 
      !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'man', 'oil', 'sit', 'try', 'use'].includes(word)
    ).slice(0, 10);
    
    // Extract entities (simplified)
    const entities = [
      { type: 'person', value: 'Resident', confidence: 0.9 },
      { type: 'time', value: 'morning', confidence: 0.8 },
      { type: 'location', value: 'room', confidence: 0.7 },
    ];
    
    // Extract action items
    const actionItems = words.filter(word => 
      ['check', 'monitor', 'administer', 'assist', 'help', 'call', 'notify', 'update', 'review'].includes(word)
    );
    
    // Extract medical terms
    const medicalTerms = words.filter(word => 
      ['medication', 'dose', 'pain', 'blood', 'pressure', 'temperature', 'pulse', 'breathing', 'mobility', 'diet', 'sleep'].includes(word)
    );
    
    return {
      sentiment,
      keywords,
      entities,
      actionItems,
      medicalTerms,
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
    };
  }

  /**
   * Generate structured note content
   */
  private generateStructuredNote(request: NoteGenerationRequest, analysis: any): string {
    const timestamp = new Date().toLocaleString();
    const residentInfo = request.residentId ? `Resident ID: ${request.residentId}` : 'General Note';
    
    return `**Care Note - ${timestamp}**
${residentInfo}
Staff Member: ${request.staffMemberId}

**Transcription:**
${request.transcription}

**Analysis:**
- Sentiment: ${analysis.sentiment}
- Key Topics: ${analysis.keywords.join(', ')}
- Medical Terms: ${analysis.medicalTerms.join(', ')}
- Action Items: ${analysis.actionItems.join(', ')}

**Context:**
${request.context || 'No additional context provided'}

**Generated by Voice-to-Note Agent**
Confidence: ${(analysis.confidence * 100).toFixed(1)}%`;
  }

  /**
   * Extract relevant tags
   */
  private extractTags(transcription: string, analysis: any): string[] {
    const tags = new Set<string>();
    
    // Add sentiment tag
    tags.add(`sentiment:${analysis.sentiment}`);
    
    // Add medical terms as tags
    analysis.medicalTerms.forEach(term => tags.add(`medical:${term}`));
    
    // Add action items as tags
    analysis.actionItems.forEach(action => tags.add(`action:${action}`));
    
    // Add priority tag
    if (analysis.medicalTerms.length > 0) tags.add('medical-related');
    if (analysis.actionItems.length > 0) tags.add('action-required');
    
    return Array.from(tags);
  }

  /**
   * Categorize the note
   */
  private categorizeNote(transcription: string, analysis: any): string[] {
    const categories = new Set<string>();
    
    // Medical categories
    if (analysis.medicalTerms.length > 0) {
      categories.add('medical');
      if (analysis.medicalTerms.includes('medication')) categories.add('medication');
      if (analysis.medicalTerms.includes('pain')) categories.add('pain-management');
      if (analysis.medicalTerms.includes('mobility')) categories.add('mobility');
    }
    
    // Care categories
    if (analysis.actionItems.length > 0) categories.add('care-actions');
    if (analysis.sentiment === 'negative') categories.add('concern');
    if (analysis.sentiment === 'positive') categories.add('positive-update');
    
    // General categories
    categories.add('voice-generated');
    categories.add('care-note');
    
    return Array.from(categories);
  }

  /**
   * Assess note priority
   */
  private assessPriority(transcription: string, analysis: any): 'low' | 'medium' | 'high' | 'urgent' {
    let priority = 'low';
    
    // Check for urgent keywords
    const urgentKeywords = ['emergency', 'urgent', 'immediate', 'critical', 'severe', 'danger'];
    if (urgentKeywords.some(keyword => transcription.toLowerCase().includes(keyword))) {
      priority = 'urgent';
    }
    // Check for high priority indicators
    else if (analysis.medicalTerms.length > 2 || analysis.actionItems.length > 1) {
      priority = 'high';
    }
    // Check for medium priority indicators
    else if (analysis.medicalTerms.length > 0 || analysis.actionItems.length > 0) {
      priority = 'medium';
    }
    
    return priority as 'low' | 'medium' | 'high' | 'urgent';
  }

  /**
   * Assess risk level
   */
  private assessRisk(transcription: string, analysis: any): {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    recommendations: string[];
  } {
    const factors: string[] = [];
    const recommendations: string[] = [];
    let level: 'low' | 'medium' | 'high' = 'low';
    
    // Check for risk indicators
    if (analysis.sentiment === 'negative') {
      factors.push('negative sentiment');
      level = 'medium';
    }
    
    if (analysis.medicalTerms.includes('pain')) {
      factors.push('pain reported');
      recommendations.push('Monitor pain levels and consider pain management');
      level = 'medium';
    }
    
    if (analysis.actionItems.length > 2) {
      factors.push('multiple action items');
      level = 'medium';
    }
    
    const riskKeywords = ['fall', 'injury', 'bleeding', 'confusion', 'disorientation'];
    if (riskKeywords.some(keyword => transcription.toLowerCase().includes(keyword))) {
      factors.push('risk keywords detected');
      recommendations.push('Immediate assessment recommended');
      level = 'high';
    }
    
    return { level, factors, recommendations };
  }

  /**
   * Generate suggested actions
   */
  private generateSuggestedActions(transcription: string, analysis: any, riskAssessment: any): string[] {
    const actions: string[] = [];
    
    // Medical actions
    if (analysis.medicalTerms.includes('medication')) {
      actions.push('Review medication schedule');
    }
    
    if (analysis.medicalTerms.includes('pain')) {
      actions.push('Assess pain level and consider pain management');
    }
    
    // Care actions
    if (analysis.actionItems.includes('monitor')) {
      actions.push('Increase monitoring frequency');
    }
    
    if (analysis.actionItems.includes('call')) {
      actions.push('Contact relevant healthcare professional');
    }
    
    // Risk-based actions
    if (riskAssessment.level === 'high') {
      actions.push('Immediate assessment required');
      actions.push('Notify senior staff');
    }
    
    // General actions
    actions.push('Review and validate generated note');
    actions.push('Update care plan if necessary');
    
    return actions;
  }

  /**
   * Determine if note requires review
   */
  private requiresReview(priority: string, riskAssessment: any, analysis: any): boolean {
    return priority === 'urgent' || 
           priority === 'high' || 
           riskAssessment.level === 'high' || 
           analysis.confidence < 0.8 ||
           analysis.medicalTerms.length > 3;
  }

  /**
   * Generate note title
   */
  private generateNoteTitle(transcription: string, analysis: any): string {
    const firstSentence = transcription.split('.')[0];
    const words = firstSentence.split(' ').slice(0, 6);
    return words.join(' ') + (words.length < firstSentence.split(' ').length ? '...' : '');
  }

  /**
   * Generate unique note ID
   */
  private generateNoteId(): string {
    return `V2N-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  /**
   * Simulate transcription (mock implementation)
   */
  private simulateTranscription(request: VoiceTranscriptionRequest): VoiceTranscriptionResponse {
    // Mock transcription based on audio length and format
    const mockTranscriptions = [
      "Resident was comfortable this morning, had breakfast and took morning medication. No complaints of pain. Mobility was good, walked to the common area with assistance.",
      "Patient reported mild discomfort in lower back. Applied heat pack and repositioned. Will monitor throughout the day. Family visited in the afternoon.",
      "Medication administered as scheduled. Resident seemed confused about time and place. Notified nursing staff for assessment. Vital signs stable.",
      "Physical therapy session completed successfully. Resident showed improvement in range of motion. No adverse reactions noted. Next session scheduled for tomorrow.",
      "Incident report: Minor fall in bathroom, no injuries sustained. Resident was assisted back to bed. Family notified. Will increase monitoring frequency."
    ];
    
    const transcription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
    const duration = Math.random() * 60 + 30; // 30-90 seconds
    const wordCount = transcription.split(' ').length;
    
    return {
      transcription,
      confidence: Math.random() * 0.2 + 0.8, // 0.8-1.0
      language: 'en',
      duration,
      wordCount,
      timestamp: new Date(),
    };
  }

  /**
   * Handle voice audio events
   */
  private async handleVoiceAudio(event: any): Promise<void> {
    console.log('🎤 Received voice audio event:', event.type);
    // Process voice audio event
  }

  /**
   * Handle note request events
   */
  private async handleNoteRequest(event: any): Promise<void> {
    console.log('📝 Received note request event:', event.type);
    // Process note request event
  }

  /**
   * Handle transcription complete events
   */
  private async handleTranscriptionComplete(event: any): Promise<void> {
    console.log('✅ Transcription completed:', event.type);
    // Process transcription complete event
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): AgentCapabilities {
    return this.capabilities;
  }

  /**
   * Get agent status
   */
  getStatus(): {
    name: string;
    status: string;
    capabilities: AgentCapabilities;
    lastActivity: Date;
    processedCount: number;
  } {
    return {
      name: 'Voice-to-Note Agent',
      status: 'active',
      capabilities: this.capabilities,
      lastActivity: new Date(),
      processedCount: Math.floor(Math.random() * 1000) + 100, // Mock count
    };
  }
}

export default VoiceToNoteAgent;