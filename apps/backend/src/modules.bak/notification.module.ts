/**
 * @fileoverview Comprehensive notification module for enterprise communications
 * @module Modules/Notification.module
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Comprehensive notification module for enterprise communications
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Enterprise Notification Module
 * @module NotificationModule
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive notification module for enterprise communications
 * with multi-channel delivery and intelligent routing.
 */

import { Module } from '@nestjs/common';
import { NotificationService } from '../services/notifications/NotificationService';
import { EnterpriseNotificationService } from '../services/notifications/EnterpriseNotificationService';

@Module({
  providers: [
    NotificationService,
    EnterpriseNotificationService
  ],
  exports: [
    NotificationService,
    EnterpriseNotificationService
  ]
})
export class NotificationModule {}