/**
 * @fileoverview family-communication.module
 * @module Modules/Family-communication.module
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description family-communication.module
 */

import { EventEmitter2 } from "eventemitter2";

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamilyCommunicationController } from '../controllers/family-communication.controller';
import { FamilyCommunicationService } from '../services/family-communication.service';
import { FamilyPortalService } from '../services/family-portal.service';
import { VideoCallService } from '../services/video-call.service';
import { FeedbackManagementService } from '../services/feedback-management.service';
import { CommunicationEntity } from '../entities/communication.entity';
import { FamilyMemberEntity } from '../entities/family-member.entity';
import { FeedbackEntity } from '../entities/feedback.entity';
import { VideoCallEntity } from '../entities/video-call.entity';
import { NotificationService } from '../services/notification.service';
import { DocumentSharingService } from '../services/document-sharing.service';
import { EventStreamingService } from '../services/event-streaming.service';
import { MobileAppService } from '../services/mobile-app.service';

/**
 * Family Communication Platform Module
 * 
 * Provides comprehensive family engagement and communication:
 * - Secure family portal with real-time updates
 * - Video calling and virtual visits
 * - Care plan sharing and collaboration
 * - Photo and memory sharing
 * - Feedback and satisfaction surveys
 * - Mobile app for on-the-go access
 * - Event and activity updates
 * - Emergency notifications and alerts
 * - Document sharing and consent management
 * - Family meeting scheduling and coordination
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommunicationEntity,
      FamilyMemberEntity,
      FeedbackEntity,
      VideoCallEntity,
    ]),
  ],
  controllers: [FamilyCommunicationController],
  providers: [
    FamilyCommunicationService,
    FamilyPortalService,
    VideoCallService,
    FeedbackManagementService,
    NotificationService,
    DocumentSharingService,
    EventStreamingService,
    MobileAppService,
  ],
  exports: [
    FamilyCommunicationService,
    FamilyPortalService,
    VideoCallService,
    FeedbackManagementService,
    NotificationService,
    DocumentSharingService,
    EventStreamingService,
    MobileAppService,
  ],
})
export class FamilyCommunicationModule {}