/**
 * @fileoverview communication analytics Service
 * @module Family/CommunicationAnalyticsService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description communication analytics Service
 */

import { DatabaseService } from '../core/DatabaseService';
import { Logger } from '../core/Logger';
import { AIService } from '../core/AIService';

export interface CommunicationAnalytics {
  familyMemberId: string;
  analysisData: AnalysisData;
  insights: CommunicationInsight[];
  recommendations: CommunicationRecommendation[];
  generatedAt: string;
}

export interface AnalysisData {
  messageVolume: MessageVolumeData;
  responsePatterns: ResponsePatternData;
  sentimentAnalysis: SentimentData;
  topicAnalysis: TopicData;
  engagementMetrics: EngagementData;
  satisfactionTrends: SatisfactionTrendData[];
}

export interface MessageVolumeData {
  totalMessages: number;
  outgoingMessages: number;
  incomingMessages: number;
  averagePerWeek: number;
  peakCommunicationTimes: TimeSlot[];
  messagesByType: MessageTypeBreakdown[];
}

export interface ResponsePatternData {
  averageResponseTime: number; // in hours
  responseRate: number; // percentage
  quickResponses: number; // responses within 1 hour
  delayedResponses: number; // responses after 24 hours
  responseTimeByStaff: StaffResponseData[];
}

export interface SentimentData {
  overallSentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // -1 to 1
  positiveMessages: number;
  neutralMessages: number;
  negativeMessages: number;
  sentimentTrend: SentimentTrendPoint[];
  concernIndicators: ConcernIndicator[];
}

export interface TopicData {
  frequentTopics: TopicFrequency[];
  emergingConcerns: EmergingConcern[];
  satisfactionByTopic: TopicSatisfaction[];
  communicationCategories: CategoryBreakdown[];
}

export interface EngagementData {
  readRate: number; // percentage of messages read
  interactionRate: number; // percentage of messages with responses
  proactiveEngagement: number; // family-initiated conversations
  eventParticipation: number; // participation in virtual events
  feedbackProvided: number; // feedback responses given
}

export interface TimeSlot {
  hour: number;
  count: number;
  dayOfWeek?: number;
}

export interface MessageTypeBreakdown {
  type: string;
  count: number;
  percentage: number;
}

export interface StaffResponseData {
  staffId: string;
  staffName: string;
  averageResponseTime: number;
  responseCount: number;
  satisfactionRating: number;
}

export interface SentimentTrendPoint {
  date: string;
  sentiment: number;
  messageCount: number;
}

export interface ConcernIndicator {
  type: 'escalation' | 'frustration' | 'confusion' | 'dissatisfaction';
  severity: 'low' | 'medium' | 'high';
  description: string;
  messageIds: string[];
  detectedAt: string;
}

export interface TopicFrequency {
  topic: string;
  count: number;
  percentage: number;
  averageSentiment: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface EmergingConcern {
  concern: string;
  severity: 'low' | 'medium' | 'high';
  firstDetected: string;
  frequency: number;
  relatedMessages: string[];
}

export interface TopicSatisfaction {
  topic: string;
  satisfactionScore: number;
  responseQuality: number;
  resolutionRate: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  averageResponseTime: number;
  satisfactionScore: number;
}

export interface SatisfactionTrendData {
  period: string;
  satisfactionScore: number;
  responseQuality: number;
  communicationEffectiveness: number;
  trustLevel: number;
}

export interface CommunicationInsight {
  id: string;
  type: 'trend' | 'pattern' | 'concern' | 'opportunity';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  evidence: InsightEvidence[];
  impact: string;
  confidence: number; // 0-1 scale
  generatedAt: string;
}

export interface InsightEvidence {
  type: 'metric' | 'message' | 'pattern';
  description: string;
  value?: number;
  messageId?: string;
  timestamp?: string;
}

export interface CommunicationRecommendation {
  id: string;
  category: 'frequency' | 'timing' | 'content' | 'method' | 'staff_training';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actionItems: string[];
  expectedOutcome: string;
  timeframe: string;
  assignedTo?: string;
  isImplemented: boolean;
}

export class CommunicationAnalyticsService {
  privatedb: DatabaseService;
  privatelogger: Logger;
  privateai: AIService;

  constructor() {
    this.db = new DatabaseService();
    this.logger = new Logger('CommunicationAnalyticsService');
    this.ai = new AIService();
  }

  /**
   * Generate comprehensive communication analytics for a family member
   */
  async generateAnalytics(
    tenantId: string,
    familyMemberId: string,
    timeframe: string = '90d'
  ): Promise<CommunicationAnalytics> {
    try {
      const days = this.parseTimeframe(timeframe);

      // Gather all communication data
      const [
        messageVolume,
        responsePatterns,
        sentimentAnalysis,
        topicAnalysis,
        engagementMetrics,
        satisfactionTrends
      ] = await Promise.all([
        this.analyzeMessageVolume(tenantId, familyMemberId, days),
        this.analyzeResponsePatterns(tenantId, familyMemberId, days),
        this.analyzeSentiment(tenantId, familyMemberId, days),
        this.analyzeTopics(tenantId, familyMemberId, days),
        this.analyzeEngagement(tenantId, familyMemberId, days),
        this.analyzeSatisfactionTrends(tenantId, familyMemberId, days)
      ]);

      constanalysisData: AnalysisData = {
        messageVolume,
        responsePatterns,
        sentimentAnalysis,
        topicAnalysis,
        engagementMetrics,
        satisfactionTrends
      };

      // Generate AI-powered insights
      const insights = await this.generateInsights(analysisData, familyMemberId);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(analysisData, insights, familyMemberId);

      this.logger.info('Communication analytics generated', {
        familyMemberId,
        timeframe,
        insightCount: insights.length,
        recommendationCount: recommendations.length
      });

      return {
        familyMemberId,
        analysisData,
        insights,
        recommendations,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Failed to generate communication analytics', error);
      throw error;
    }
  }

  private async analyzeMessageVolume(
    tenantId: string,
    familyMemberId: string,
    days: number
  ): Promise<MessageVolumeData> {
    // Get message counts
    const volumeQuery = `
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN sender_type = 'family' THEN 1 END) as outgoing_messages,
        COUNT(CASE WHEN sender_type = 'staff' THEN 1 END) as incoming_messages,
        message_type,
        COUNT(*) as type_count
      FROM family_communications 
      WHERE family_member_id = $1 AND tenant_id = $2
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY message_type
    `;

    const volumeResult = await this.db.query(volumeQuery, [familyMemberId, tenantId]);

    // Get peak communication times
    const peakTimesQuery = `
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        EXTRACT(DOW FROM created_at) as day_of_week,
        COUNT(*) as count
      FROM family_communications 
      WHERE family_member_id = $1 AND tenant_id = $2
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY EXTRACT(HOUR FROM created_at), EXTRACT(DOW FROM created_at)
      ORDER BY count DESC
      LIMIT 10
    `;

    const peakTimesResult = await this.db.query(peakTimesQuery, [familyMemberId, tenantId]);

    const totalMessages = volumeResult.rows.reduce((sum, row) => sum + parseInt(row.type_count), 0);
    const outgoingMessages = volumeResult.rows
      .filter(row => row.sender_type === 'family')
      .reduce((sum, row) => sum + parseInt(row.type_count), 0);

    return {
      totalMessages,
      outgoingMessages,
      incomingMessages: totalMessages - outgoingMessages,
      averagePerWeek: Math.round((totalMessages / days) * 7 * 10) / 10,
      peakCommunicationTimes: peakTimesResult.rows.map(row => ({
        hour: parseInt(row.hour),
        count: parseInt(row.count),
        dayOfWeek: parseInt(row.day_of_week)
      })),
      messagesByType: volumeResult.rows.map(row => ({
        type: row.message_type,
        count: parseInt(row.type_count),
        percentage: Math.round((parseInt(row.type_count) / totalMessages) * 100)
      }))
    };
  }

  private async analyzeResponsePatterns(
    tenantId: string,
    familyMemberId: string,
    days: number
  ): Promise<ResponsePatternData> {
    const responseQuery = `
      SELECT 
        AVG(EXTRACT(EPOCH FROM response_time - created_at) / 3600) as avg_response_hours,
        COUNT(CASE WHEN response_time IS NOT NULL THEN 1 END) as responded_count,
        COUNT(*) as total_count,
        COUNT(CASE WHEN response_time <= created_at + INTERVAL '1 hour' THEN 1 END) as quick_responses,
        COUNT(CASE WHEN response_time > created_at + INTERVAL '24 hours' THEN 1 END) as delayed_responses,
        staff_id,
        staff_name,
        COUNT(*) as staff_response_count,
        AVG(satisfaction_rating) as staff_satisfaction
      FROM family_communications 
      WHERE family_member_id = $1 AND tenant_id = $2
        AND created_at >= NOW() - INTERVAL '${days} days'
        AND sender_type = 'family'
      GROUP BY staff_id, staff_name
    `;

    const responseResult = await this.db.query(responseQuery, [familyMemberId, tenantId]);
    const data = responseResult.rows[0] || {};

    return {
      averageResponseTime: parseFloat(data.avg_response_hours || '0'),
      responseRate: data.total_count > 0 ? 
        Math.round((parseInt(data.responded_count) / parseInt(data.total_count)) * 100) : 0,
      quickResponses: parseInt(data.quick_responses || '0'),
      delayedResponses: parseInt(data.delayed_responses || '0'),
      responseTimeByStaff: responseResult.rows.map(row => ({
        staffId: row.staff_id,
        staffName: row.staff_name,
        averageResponseTime: parseFloat(row.avg_response_hours || '0'),
        responseCount: parseInt(row.staff_response_count),
        satisfactionRating: parseFloat(row.staff_satisfaction || '0')
      }))
    };
  }

  private async analyzeSentiment(
    tenantId: string,
    familyMemberId: string,
    days: number
  ): Promise<SentimentData> {
    // Get messages for sentiment analysis
    const messagesQuery = `
      SELECT id, content, sentiment_score, created_at
      FROM family_communications 
      WHERE family_member_id = $1 AND tenant_id = $2
        AND created_at >= NOW() - INTERVAL '${days} days'
        AND sender_type = 'family'
      ORDER BY created_at DESC
    `;

    const messagesResult = await this.db.query(messagesQuery, [familyMemberId, tenantId]);

    // Perform AI sentiment analysis on messages without scores
    const messagesToAnalyze = messagesResult.rows.filter(row => !row.sentiment_score);
    if (messagesToAnalyze.length > 0) {
      await this.performSentimentAnalysis(messagesToAnalyze);
    }

    // Calculate sentiment metrics
    const sentiments = messagesResult.rows.map(row => row.sentiment_score || 0);
    const averageSentiment = sentiments.length > 0 ? 
      sentiments.reduce((sum, score) => sum + score, 0) / sentiments.length : 0;

    const positiveCount = sentiments.filter(score => score > 0.1).length;
    const negativeCount = sentiments.filter(score => score < -0.1).length;
    const neutralCount = sentiments.length - positiveCount - negativeCount;

    // Create sentiment trend
    const sentimentTrend = await this.createSentimentTrend(messagesResult.rows, days);

    // Detect concern indicators
    const concernIndicators = await this.detectConcernIndicators(messagesResult.rows);

    letoverallSentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (averageSentiment > 0.1) overallSentiment = 'positive';
    else if (averageSentiment < -0.1) overallSentiment = 'negative';

    return {
      overallSentiment,
      sentimentScore: Math.round(averageSentiment * 100) / 100,
      positiveMessages: positiveCount,
      neutralMessages: neutralCount,
      negativeMessages: negativeCount,
      sentimentTrend,
      concernIndicators
    };
  }

  private async analyzeTopics(
    tenantId: string,
    familyMemberId: string,
    days: number
  ): Promise<TopicData> {
    // Get messages for topic analysis
    const topicsQuery = `
      SELECT content, topics, created_at
      FROM family_communications 
      WHERE family_member_id = $1 AND tenant_id = $2
        AND created_at >= NOW() - INTERVAL '${days} days'
      ORDER BY created_at DESC
    `;

    const topicsResult = await this.db.query(topicsQuery, [familyMemberId, tenantId]);

    // Perform AI topic extraction if needed
    const messagesToAnalyze = topicsResult.rows.filter(row => !row.topics);
    if (messagesToAnalyze.length > 0) {
      await this.performTopicAnalysis(messagesToAnalyze);
    }

    // Extract and count topics
    consttopicCounts: Record<string, number> = {};
    constcategoryMap: Record<string, { count: number; responseTime: number; satisfaction: number }> = {};

    topicsResult.rows.forEach(row => {
      const topics = row.topics ? JSON.parse(row.topics) : [];
      topics.forEach((topic: string) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });

    const totalTopics = Object.values(topicCounts).reduce((sum, count) => sum + count, 0);
    
    constfrequentTopics: TopicFrequency[] = Object.entries(topicCounts)
      .map(([topic, count]) => ({
        topic,
        count,
        percentage: Math.round((count / totalTopics) * 100),
        averageSentiment: 0, // Would be calculated from sentiment scores
        trend: 'stable' as const // Would be calculated from historical data
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      frequentTopics,
      emergingConcerns: [], // Would be detected using AI analysis
      satisfactionByTopic: [], // Would be calculated from satisfaction ratings
      communicationCategories: Object.entries(categoryMap).map(([category, data]) => ({
        category,
        count: data.count,
        averageResponseTime: data.responseTime,
        satisfactionScore: data.satisfaction
      }))
    };
  }

  private async analyzeEngagement(
    tenantId: string,
    familyMemberId: string,
    days: number
  ): Promise<EngagementData> {
    const engagementQuery = `
      SELECT 
        COUNT(CASE WHEN read_at IS NOT NULL THEN 1 END) as read_messages,
        COUNT(CASE WHEN response_time IS NOT NULL THEN 1 END) as responded_messages,
        COUNT(CASE WHEN sender_type = 'family' THEN 1 END) as proactive_messages,
        COUNT(*) as total_messages
      FROM family_communications 
      WHERE family_member_id = $1 AND tenant_id = $2
        AND created_at >= NOW() - INTERVAL '${days} days'
    `;

    const engagementResult = await this.db.query(engagementQuery, [familyMemberId, tenantId]);
    const data = engagementResult.rows[0] || {};

    // Get event participation
    const eventQuery = `
      SELECT 
        COUNT(CASE WHEN attended = true THEN 1 END) as attended_events,
        COUNT(*) as total_events
      FROM family_event_participation 
      WHERE family_member_id = $1 AND tenant_id = $2
        AND event_date >= NOW() - INTERVAL '${days} days'
    `;

    const eventResult = await this.db.query(eventQuery, [familyMemberId, tenantId]);
    const eventData = eventResult.rows[0] || {};

    // Get feedback count
    const feedbackQuery = `
      SELECT COUNT(*) as feedback_count
      FROM family_feedback 
      WHERE family_member_id = $1 AND tenant_id = $2
        AND created_at >= NOW() - INTERVAL '${days} days'
    `;

    const feedbackResult = await this.db.query(feedbackQuery, [familyMemberId, tenantId]);
    const feedbackCount = parseInt(feedbackResult.rows[0]?.feedback_count || '0');

    const totalMessages = parseInt(data.total_messages || '0');
    const readMessages = parseInt(data.read_messages || '0');
    const respondedMessages = parseInt(data.responded_messages || '0');
    const proactiveMessages = parseInt(data.proactive_messages || '0');

    const totalEvents = parseInt(eventData.total_events || '0');
    const attendedEvents = parseInt(eventData.attended_events || '0');

    return {
      readRate: totalMessages > 0 ? Math.round((readMessages / totalMessages) * 100) : 0,
      interactionRate: totalMessages > 0 ? Math.round((respondedMessages / totalMessages) * 100) : 0,
      proactiveEngagement: Math.round((proactiveMessages / Math.max(totalMessages, 1)) * 100),
      eventParticipation: totalEvents > 0 ? Math.round((attendedEvents / totalEvents) * 100) : 0,
      feedbackProvided: feedbackCount
    };
  }

  private async analyzeSatisfactionTrends(
    tenantId: string,
    familyMemberId: string,
    days: number
  ): Promise<SatisfactionTrendData[]> {
    const trendQuery = `
      SELECT 
        DATE_TRUNC('week', created_at) as period,
        AVG(satisfaction_rating) as satisfaction_score,
        AVG(response_quality_rating) as response_quality,
        AVG(communication_effectiveness_rating) as communication_effectiveness
      FROM family_feedback 
      WHERE family_member_id = $1 AND tenant_id = $2
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY period
    `;

    const trendResult = await this.db.query(trendQuery, [familyMemberId, tenantId]);

    return trendResult.rows.map(row => ({
      period: row.period,
      satisfactionScore: parseFloat(row.satisfaction_score || '0'),
      responseQuality: parseFloat(row.response_quality || '0'),
      communicationEffectiveness: parseFloat(row.communication_effectiveness || '0'),
      trustLevel: 0 // Would be calculated from trust metrics
    }));
  }

  private async generateInsights(
    analysisData: AnalysisData,
    familyMemberId: string
  ): Promise<CommunicationInsight[]> {
    constinsights: CommunicationInsight[] = [];

    // Check for response time issues
    if (analysisData.responsePatterns.averageResponseTime > 24) {
      insights.push({
        id: uuidv4(),
        type: 'concern',
        priority: 'high',
        title: 'Slow Response Times Detected',
        description: `Average response time of ${analysisData.responsePatterns.averageResponseTime.toFixed(1)} hours exceeds recommended 24-hour standard`,
        evidence: [
          {
            type: 'metric',
            description: 'Average response time',
            value: analysisData.responsePatterns.averageResponseTime
          }
        ],
        impact: 'May reduce family satisfaction and trust',
        confidence: 0.9,
        generatedAt: new Date().toISOString()
      });
    }

    // Check for sentiment decline
    if (analysisData.sentimentAnalysis.overallSentiment === 'negative') {
      insights.push({
        id: uuidv4(),
        type: 'concern',
        priority: 'urgent',
        title: 'Negative Communication Sentiment',
        description: 'Overall sentiment analysis indicates family dissatisfaction',
        evidence: [
          {
            type: 'metric',
            description: 'Sentiment score',
            value: analysisData.sentimentAnalysis.sentimentScore
          }
        ],
        impact: 'Risk of family complaint or relationship breakdown',
        confidence: 0.85,
        generatedAt: new Date().toISOString()
      });
    }

    // Use AI to generate additional insights
    const aiInsights = await this.ai.generateCommunicationInsights({
      analysisData,
      familyMemberId
    });

    insights.push(...aiInsights);

    return insights;
  }

  private async generateRecommendations(
    analysisData: AnalysisData,
    insights: CommunicationInsight[],
    familyMemberId: string
  ): Promise<CommunicationRecommendation[]> {
    constrecommendations: CommunicationRecommendation[] = [];

    // Response time improvement
    if (analysisData.responsePatterns.averageResponseTime > 24) {
      recommendations.push({
        id: uuidv4(),
        category: 'timing',
        priority: 'high',
        title: 'Implement Response Time Standards',
        description: 'Establish and monitor response time targets for family communications',
        actionItems: [
          'Set 4-hour response target for urgent messages',
          'Implement automated escalation for delayed responses',
          'Train staff on communication priorities',
          'Create response time dashboard for monitoring'
        ],
        expectedOutcome: 'Reduce average response time to under 8 hours',
        timeframe: '2 weeks',
        isImplemented: false
      });
    }

    // Communication frequency optimization
    if (analysisData.messageVolume.averagePerWeek < 2) {
      recommendations.push({
        id: uuidv4(),
        category: 'frequency',
        priority: 'medium',
        title: 'Increase Proactive Communication',
        description: 'Family shows low engagement, increase proactive updates',
        actionItems: [
          'Schedule weekly care updates',
          'Send photo updates of resident activities',
          'Implement daily wellness check-ins',
          'Create monthly care plan reviews'
        ],
        expectedOutcome: 'Increase family engagement and satisfaction',
        timeframe: '1 month',
        isImplemented: false
      });
    }

    return recommendations;
  }

  private async performSentimentAnalysis(messages: any[]): Promise<void> {
    // Use AI service to analyze sentiment for messages
    for (const message of messages) {
      const sentiment = await this.ai.analyzeSentiment(message.content);
      await this.db.query(`
        UPDATE family_communications 
        SET sentiment_score = $1 
        WHERE id = $2
      `, [sentiment.score, message.id]);
    }
  }

  private async performTopicAnalysis(messages: any[]): Promise<void> {
    // Use AI service to extract topics from messages
    for (const message of messages) {
      const topics = await this.ai.extractTopics(message.content);
      await this.db.query(`
        UPDATE family_communications 
        SET topics = $1 
        WHERE id = $2
      `, [JSON.stringify(topics), message.id]);
    }
  }

  private createSentimentTrend(messages: any[], days: number): SentimentTrendPoint[] {
    // Group messages by week and calculate average sentiment
    constweeklyData: Record<string, { sentiment: number; count: number }> = {};
    
    messages.forEach(message => {
      const weekStart = new Date(message.created_at);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { sentiment: 0, count: 0 };
      }
      
      weeklyData[weekKey].sentiment += message.sentiment_score || 0;
      weeklyData[weekKey].count += 1;
    });

    return Object.entries(weeklyData).map(([date, data]) => ({
      date,
      sentiment: data.count > 0 ? data.sentiment / data.count : 0,
      messageCount: data.count
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private async detectConcernIndicators(messages: any[]): Promise<ConcernIndicator[]> {
    constindicators: ConcernIndicator[] = [];
    
    // Simple keyword-based concern detection
    const concernKeywords = {
      frustration: ['frustrated', 'angry', 'upset', 'annoyed'],
      confusion: ['confused', 'unclear', 'don\'t understand'],
      dissatisfaction: ['disappointed', 'unsatisfied', 'unhappy'],
      escalation: ['complaint', 'supervisor', 'manager', 'escalate']
    };

    messages.forEach(message => {
      const content = message.content.toLowerCase();
      
      Object.entries(concernKeywords).forEach(([type, keywords]) => {
        const foundKeywords = keywords.filter(keyword => content.includes(keyword));
        
        if (foundKeywords.length > 0) {
          indicators.push({
            type: type as any,
            severity: foundKeywords.length > 2 ? 'high' : foundKeywords.length > 1 ? 'medium' : 'low',
            description: `Detected ${type} indicators: ${foundKeywords.join(', ')}`,
            messageIds: [message.id],
            detectedAt: message.created_at
          });
        }
      });
    });

    return indicators;
  }

  private parseTimeframe(timeframe: string): number {
    consttimeframeMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '6m': 180,
      '1y': 365
    };
    
    return timeframeMap[timeframe] || 90;
  }
}
