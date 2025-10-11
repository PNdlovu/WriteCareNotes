/**
 * @fileoverview ai-analytics.module
 * @module Modules/Ai-analytics.module
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description ai-analytics.module
 */

import { EventEmitter2 } from "eventemitter2";

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIAnalyticsController } from '../controllers/ai-analytics.controller';
import { AIAnalyticsService } from '../services/ai-analytics.service';
import { PredictiveHealthService } from '../services/predictive-health.service';
import { PersonalizedCareService } from '../services/personalized-care.service';
import { HealthPredictionEntity } from '../entities/health-prediction.entity';
import { CareRecommendationEntity } from '../entities/care-recommendation.entity';
import { AnalyticsReportEntity } from '../entities/analytics-report.entity';
import { MachineLearningService } from '../services/machine-learning.service';
import { DataAnalyticsService } from '../services/data-analytics.service';
import { RiskAssessmentService } from '../services/risk-assessment.service';

/**
 * AI & Analytics Module
 * 
 * Provides comprehensive artificial intelligence and analyticscapabilities:
 * - Predictive health analytics using machine learning
 * - Personalized care recommendations
 * - Risk assessment and early warning systems
 * - Advanced data analytics and reporting
 * - Real-time health monitoring and alerts
 * - Pattern recognition and anomaly detection
 * - Care outcome prediction and optimization
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      HealthPredictionEntity,
      CareRecommendationEntity,
      AnalyticsReportEntity,
    ]),
  ],
  controllers: [AIAnalyticsController],
  providers: [
    AIAnalyticsService,
    PredictiveHealthService,
    PersonalizedCareService,
    MachineLearningService,
    DataAnalyticsService,
    RiskAssessmentService,
  ],
  exports: [
    AIAnalyticsService,
    PredictiveHealthService,
    PersonalizedCareService,
    MachineLearningService,
    DataAnalyticsService,
    RiskAssessmentService,
  ],
})
export class AIAnalyticsModule {}
