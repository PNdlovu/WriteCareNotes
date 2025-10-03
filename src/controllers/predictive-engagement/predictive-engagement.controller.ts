import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../middleware/auth.guard';
import { RbacGuard } from '../../middleware/rbac.guard';
import { PredictiveEngagementService, EngagementPrediction, EngagementModel, EngagementEvent, EngagementInsight, EngagementCampaign, EngagementAnalytics } from '../../services/predictive-engagement.service';
import { AuditTrailService } from '../../services/audit/AuditTrailService';

@Controller('api/predictive-engagement')
@UseGuards(JwtAuthGuard)
export class PredictiveEngagementController {
  constructor(
    private readonly predictiveEngagementService: PredictiveEngagementService,
    private readonly auditService: AuditTrailService,
  ) {}

  /**
   * Generate engagement prediction for a resident
   */
  @Post('predictions')
  @UseGuards(RbacGuard)
  async generatePrediction(
    @Body() predictionData: {
      residentId: string;
      predictionType: 'social_engagement' | 'activity_participation' | 'health_improvement' | 'mood_enhancement' | 'cognitive_stimulation' | 'physical_activity';
      timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
    },
    @Request() req: any,
  ) {
    try {
      const prediction = await this.predictiveEngagementService.generatePrediction(
        predictionData.residentId,
        predictionData.predictionType,
        predictionData.timeframe,
      );

      await this.auditService.logEvent({
        resource: 'PredictiveEngagement',
        entityType: 'Prediction',
        entityId: prediction.id,
        action: 'CREATE',
        details: {
          residentId: predictionData.residentId,
          predictionType: predictionData.predictionType,
          confidence: prediction.confidence,
          predictedValue: prediction.predictedValue,
          timeframe: predictionData.timeframe,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: prediction,
        message: 'Engagement prediction generated successfully',
      };
    } catch (error) {
      console.error('Error generating prediction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get predictions for a resident
   */
  @Get('predictions/:residentId')
  @UseGuards(RbacGuard)
  async getPredictions(
    @Param('residentId') residentId: string,
    @Query('status') status?: string,
    @Request() req: any,
  ) {
    try {
      const predictions = await this.predictiveEngagementService.getPredictions(residentId, status);

      await this.auditService.logEvent({
        resource: 'PredictiveEngagement',
        entityType: 'Predictions',
        entityId: `predictions_${residentId}`,
        action: 'READ',
        details: {
          residentId,
          status,
          count: predictions.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: predictions,
        message: 'Predictions retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting predictions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create or update engagement model
   */
  @Post('models')
  @UseGuards(RbacGuard)
  async createModel(
    @Body() modelData: {
      name: string;
      description: string;
      predictionType: string;
      algorithm: 'linear_regression' | 'random_forest' | 'neural_network' | 'svm' | 'ensemble';
      features: string[];
      parameters: Record<string, any>;
      accuracy: number;
    },
    @Request() req: any,
  ) {
    try {
      const model = await this.predictiveEngagementService.createModel({
        ...modelData,
        version: '1.0.0',
        isActive: true,
        lastTrained: new Date(),
        performance: {
          accuracy: modelData.accuracy,
          precision: 0.85,
          recall: 0.80,
          f1Score: 0.82,
          auc: 0.88,
          mse: 0.15,
          mae: 0.12,
          r2Score: 0.75,
          lastEvaluated: new Date(),
        },
      });

      await this.auditService.logEvent({
        resource: 'PredictiveEngagement',
        entityType: 'Model',
        entityId: model.id,
        action: 'CREATE',
        details: {
          modelName: model.name,
          algorithm: model.algorithm,
          version: model.version,
          accuracy: model.accuracy,
          featureCount: model.features.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: model,
        message: 'Engagement model created successfully',
      };
    } catch (error) {
      console.error('Error creating model:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Record engagement event
   */
  @Post('events')
  @UseGuards(RbacGuard)
  async recordEvent(
    @Body() eventData: {
      residentId: string;
      eventType: 'activity_completed' | 'social_interaction' | 'health_change' | 'mood_change' | 'behavior_change' | 'environment_change';
      eventData: Record<string, any>;
      source: 'manual' | 'sensor' | 'system' | 'external';
      confidence: number;
    },
    @Request() req: any,
  ) {
    try {
      const event = await this.predictiveEngagementService.recordEvent({
        ...eventData,
        timestamp: new Date(),
        processed: false,
      });

      await this.auditService.logEvent({
        resource: 'PredictiveEngagement',
        entityType: 'Event',
        entityId: event.id,
        action: 'CREATE',
        details: {
          residentId: event.residentId,
          eventType: event.eventType,
          source: event.source,
          confidence: event.confidence,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: event,
        message: 'Engagement event recorded successfully',
      };
    } catch (error) {
      console.error('Error recording event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate engagement insights
   */
  @Post('insights/:residentId')
  @UseGuards(RbacGuard)
  async generateInsights(
    @Param('residentId') residentId: string,
    @Request() req: any,
  ) {
    try {
      const insights = await this.predictiveEngagementService.generateInsights(residentId);

      await this.auditService.logEvent({
        resource: 'PredictiveEngagement',
        entityType: 'Insights',
        entityId: `insights_${residentId}`,
        action: 'CREATE',
        details: {
          residentId,
          insightCount: insights.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: insights,
        message: 'Engagement insights generated successfully',
      };
    } catch (error) {
      console.error('Error generating insights:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get insights for a resident
   */
  @Get('insights/:residentId')
  @UseGuards(RbacGuard)
  async getInsights(
    @Param('residentId') residentId: string,
    @Query('insightType') insightType?: string,
    @Request() req: any,
  ) {
    try {
      const insights = await this.predictiveEngagementService.getInsights(residentId, insightType);

      await this.auditService.logEvent({
        resource: 'PredictiveEngagement',
        entityType: 'Insights',
        entityId: `insights_${residentId}`,
        action: 'READ',
        details: {
          residentId,
          insightType,
          count: insights.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: insights,
        message: 'Insights retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting insights:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create engagement campaign
   */
  @Post('campaigns')
  @UseGuards(RbacGuard)
  async createCampaign(
    @Body() campaignData: {
      name: string;
      description: string;
      targetResidents: string[];
      campaignType: 'social' | 'health' | 'activity' | 'wellness' | 'cognitive' | 'physical';
      objectives: string[];
      strategies: Array<{
        name: string;
        type: 'activity' | 'intervention' | 'environment' | 'social' | 'medical' | 'therapeutic';
        description: string;
        targetAudience: string[];
        implementation: string;
        resources: string[];
        timeline: string;
        successCriteria: string[];
        expectedOutcome: string;
      }>;
      startDate: string;
      endDate: string;
    },
    @Request() req: any,
  ) {
    try {
      const campaign = await this.predictiveEngagementService.createCampaign({
        ...campaignData,
        startDate: new Date(campaignData.startDate),
        endDate: new Date(campaignData.endDate),
        status: 'planned',
      });

      await this.auditService.logEvent({
        resource: 'PredictiveEngagement',
        entityType: 'Campaign',
        entityId: campaign.id,
        action: 'CREATE',
        details: {
          campaignName: campaign.name,
          campaignType: campaign.campaignType,
          targetResidentCount: campaign.targetResidents.length,
          strategyCount: campaign.strategies.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: campaign,
        message: 'Engagement campaign created successfully',
      };
    } catch (error) {
      console.error('Error creating campaign:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all campaigns
   */
  @Get('campaigns')
  @UseGuards(RbacGuard)
  async getCampaigns(
    @Query('status') status?: string,
    @Request() req: any,
  ) {
    try {
      const campaigns = await this.predictiveEngagementService.getCampaigns(status);

      await this.auditService.logEvent({
        resource: 'PredictiveEngagement',
        entityType: 'Campaigns',
        entityId: 'campaigns_list',
        action: 'READ',
        details: {
          status,
          count: campaigns.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: campaigns,
        message: 'Campaigns retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting campaigns:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get engagement analytics for a resident
   */
  @Get('analytics/:residentId')
  @UseGuards(RbacGuard)
  async getEngagementAnalytics(
    @Param('residentId') residentId: string,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'monthly',
    @Request() req: any,
  ) {
    try {
      const analytics = await this.predictiveEngagementService.getEngagementAnalytics(residentId, period);

      await this.auditService.logEvent({
        resource: 'PredictiveEngagement',
        entityType: 'Analytics',
        entityId: `analytics_${residentId}`,
        action: 'READ',
        details: {
          residentId,
          period,
          engagementScore: analytics.engagementScore,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: analytics,
        message: 'Engagement analytics retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting engagement analytics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get predictive engagement statistics
   */
  @Get('statistics')
  @UseGuards(RbacGuard)
  async getPredictiveEngagementStatistics(@Request() req: any) {
    try {
      const statistics = await this.predictiveEngagementService.getPredictiveEngagementStatistics();

      await this.auditService.logEvent({
        resource: 'PredictiveEngagement',
        entityType: 'Statistics',
        entityId: 'predictive_engagement_stats',
        action: 'READ',
        details: {
          totalPredictions: statistics.predictions.total,
          activePredictions: statistics.predictions.active,
          totalModels: statistics.models.total,
          activeModels: statistics.models.active,
          totalEvents: statistics.events.total,
          totalInsights: statistics.insights.total,
          totalCampaigns: statistics.campaigns.total,
          activeCampaigns: statistics.campaigns.active,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: statistics,
        message: 'Predictive engagement statistics retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting predictive engagement statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get prediction types
   */
  @Get('prediction-types')
  @UseGuards(RbacGuard)
  async getPredictionTypes(@Request() req: any) {
    try {
      const predictionTypes = [
        {
          type: 'social_engagement',
          name: 'Social Engagement',
          description: 'Predicts social interaction and engagement levels',
          icon: 'users',
          color: '#4CAF50',
          metrics: ['social_interactions', 'group_activities', 'conversations'],
        },
        {
          type: 'activity_participation',
          name: 'Activity Participation',
          description: 'Predicts participation in activities and programs',
          icon: 'activity',
          color: '#2196F3',
          metrics: ['activity_attendance', 'participation_rate', 'engagement_level'],
        },
        {
          type: 'health_improvement',
          name: 'Health Improvement',
          description: 'Predicts health outcomes and improvements',
          icon: 'heart',
          color: '#F44336',
          metrics: ['vital_signs', 'health_scores', 'wellness_indicators'],
        },
        {
          type: 'mood_enhancement',
          name: 'Mood Enhancement',
          description: 'Predicts mood and emotional well-being',
          icon: 'smile',
          color: '#FF9800',
          metrics: ['mood_scores', 'emotional_state', 'happiness_level'],
        },
        {
          type: 'cognitive_stimulation',
          name: 'Cognitive Stimulation',
          description: 'Predicts cognitive function and stimulation needs',
          icon: 'brain',
          color: '#9C27B0',
          metrics: ['cognitive_tests', 'memory_scores', 'attention_span'],
        },
        {
          type: 'physical_activity',
          name: 'Physical Activity',
          description: 'Predicts physical activity and mobility levels',
          icon: 'zap',
          color: '#00BCD4',
          metrics: ['mobility_scores', 'exercise_participation', 'physical_fitness'],
        },
      ];

      await this.auditService.logEvent({
        resource: 'PredictiveEngagement',
        entityType: 'PredictionTypes',
        entityId: 'prediction_types_list',
        action: 'READ',
        details: {
          count: predictionTypes.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: predictionTypes,
        message: 'Prediction types retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting prediction types:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get event types
   */
  @Get('event-types')
  @UseGuards(RbacGuard)
  async getEventTypes(@Request() req: any) {
    try {
      const eventTypes = [
        {
          type: 'activity_completed',
          name: 'Activity Completed',
          description: 'Resident completed an activity or program',
          icon: 'check-circle',
          color: '#4CAF50',
          dataFields: ['activity_id', 'duration', 'satisfaction', 'notes'],
        },
        {
          type: 'social_interaction',
          name: 'Social Interaction',
          description: 'Resident engaged in social interaction',
          icon: 'users',
          color: '#2196F3',
          dataFields: ['interaction_type', 'participants', 'duration', 'quality'],
        },
        {
          type: 'health_change',
          name: 'Health Change',
          description: 'Significant change in health status',
          icon: 'heart',
          color: '#F44336',
          dataFields: ['health_metric', 'previous_value', 'current_value', 'change_type'],
        },
        {
          type: 'mood_change',
          name: 'Mood Change',
          description: 'Change in mood or emotional state',
          icon: 'smile',
          color: '#FF9800',
          dataFields: ['mood_score', 'previous_mood', 'triggers', 'duration'],
        },
        {
          type: 'behavior_change',
          name: 'Behavior Change',
          description: 'Change in behavior patterns',
          icon: 'eye',
          color: '#9C27B0',
          dataFields: ['behavior_type', 'previous_pattern', 'new_pattern', 'frequency'],
        },
        {
          type: 'environment_change',
          name: 'Environment Change',
          description: 'Change in living environment or conditions',
          icon: 'home',
          color: '#00BCD4',
          dataFields: ['environment_type', 'change_description', 'impact_level', 'duration'],
        },
      ];

      await this.auditService.logEvent({
        resource: 'PredictiveEngagement',
        entityType: 'EventTypes',
        entityId: 'event_types_list',
        action: 'READ',
        details: {
          count: eventTypes.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: eventTypes,
        message: 'Event types retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting event types:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get insight types
   */
  @Get('insight-types')
  @UseGuards(RbacGuard)
  async getInsightTypes(@Request() req: any) {
    try {
      const insightTypes = [
        {
          type: 'pattern',
          name: 'Pattern',
          description: 'Recurring patterns in resident behavior or engagement',
          icon: 'repeat',
          color: '#4CAF50',
          examples: ['Daily routine patterns', 'Weekly activity patterns', 'Seasonal trends'],
        },
        {
          type: 'trend',
          name: 'Trend',
          description: 'Long-term trends in resident engagement or health',
          icon: 'trending-up',
          color: '#2196F3',
          examples: ['Improving health trends', 'Declining engagement trends', 'Stable patterns'],
        },
        {
          type: 'anomaly',
          name: 'Anomaly',
          description: 'Unusual or unexpected events or behaviors',
          icon: 'alert-triangle',
          color: '#F44336',
          examples: ['Sudden mood changes', 'Unusual activity patterns', 'Health anomalies'],
        },
        {
          type: 'correlation',
          name: 'Correlation',
          description: 'Relationships between different factors or events',
          icon: 'link',
          color: '#FF9800',
          examples: ['Activity and mood correlation', 'Social interaction and health', 'Environment and behavior'],
        },
        {
          type: 'prediction',
          name: 'Prediction',
          description: 'Future predictions based on current data',
          icon: 'crystal-ball',
          color: '#9C27B0',
          examples: ['Engagement predictions', 'Health outcome predictions', 'Risk assessments'],
        },
        {
          type: 'recommendation',
          name: 'Recommendation',
          description: 'Actionable recommendations for improvement',
          icon: 'lightbulb',
          color: '#00BCD4',
          examples: ['Activity recommendations', 'Intervention suggestions', 'Care plan adjustments'],
        },
      ];

      await this.auditService.logEvent({
        resource: 'PredictiveEngagement',
        entityType: 'InsightTypes',
        entityId: 'insight_types_list',
        action: 'READ',
        details: {
          count: insightTypes.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: insightTypes,
        message: 'Insight types retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting insight types:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get campaign types
   */
  @Get('campaign-types')
  @UseGuards(RbacGuard)
  async getCampaignTypes(@Request() req: any) {
    try {
      const campaignTypes = [
        {
          type: 'social',
          name: 'Social Engagement',
          description: 'Campaigns focused on increasing social interaction',
          icon: 'users',
          color: '#4CAF50',
          objectives: ['Increase social connections', 'Improve social skills', 'Reduce isolation'],
        },
        {
          type: 'health',
          name: 'Health & Wellness',
          description: 'Campaigns focused on improving health outcomes',
          icon: 'heart',
          color: '#F44336',
          objectives: ['Improve physical health', 'Manage chronic conditions', 'Prevent health decline'],
        },
        {
          type: 'activity',
          name: 'Activity Participation',
          description: 'Campaigns focused on increasing activity participation',
          icon: 'activity',
          color: '#2196F3',
          objectives: ['Increase activity levels', 'Improve participation', 'Enhance engagement'],
        },
        {
          type: 'wellness',
          name: 'Wellness & Self-Care',
          description: 'Campaigns focused on overall wellness and self-care',
          icon: 'sun',
          color: '#FF9800',
          objectives: ['Improve well-being', 'Promote self-care', 'Enhance quality of life'],
        },
        {
          type: 'cognitive',
          name: 'Cognitive Stimulation',
          description: 'Campaigns focused on cognitive health and stimulation',
          icon: 'brain',
          color: '#9C27B0',
          objectives: ['Maintain cognitive function', 'Improve memory', 'Enhance mental acuity'],
        },
        {
          type: 'physical',
          name: 'Physical Activity',
          description: 'Campaigns focused on physical activity and mobility',
          icon: 'zap',
          color: '#00BCD4',
          objectives: ['Improve mobility', 'Increase strength', 'Enhance physical fitness'],
        },
      ];

      await this.auditService.logEvent({
        resource: 'PredictiveEngagement',
        entityType: 'CampaignTypes',
        entityId: 'campaign_types_list',
        action: 'READ',
        details: {
          count: campaignTypes.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: campaignTypes,
        message: 'Campaign types retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting campaign types:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}