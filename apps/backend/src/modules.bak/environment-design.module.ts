/**
 * @fileoverview environment-design.module
 * @module Modules/Environment-design.module
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description environment-design.module
 */

import { EventEmitter2 } from "eventemitter2";

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentController } from '../controllers/environment.controller';
import { EnvironmentService } from '../services/environment.service';
import { SpaceDesignService } from '../services/space-design.service';
import { GardenTherapyService } from '../services/garden-therapy.service';
import { ActivitySpaceService } from '../services/activity-space.service';
import { EnvironmentEntity } from '../entities/environment.entity';
import { SpaceEntity } from '../entities/space.entity';
import { GardenAreaEntity } from '../entities/garden-area.entity';
import { ActivityAreaEntity } from '../entities/activity-area.entity';
import { AmbientControlService } from '../services/ambient-control.service';
import { AccessibilityService } from '../services/accessibility.service';
import { TherapeuticDesignService } from '../services/therapeutic-design.service';

/**
 * Environment & Design Module
 * 
 * Provides comprehensive environment and space designcapabilities:
 * - Homely living space design and optimization
 * - Therapeutic garden areas and outdoor spaces
 * - Activity areas for social engagement and therapy
 * - Ambient environment control (lighting, temperature, sound)
 * - Accessibility features and barrier-free design
 * - Sensory environments for dementia care
 * - Wayfinding and navigation support
 * - Color therapy and mood enhancement
 * - Natural lighting and circadian rhythm support
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      EnvironmentEntity,
      SpaceEntity,
      GardenAreaEntity,
      ActivityAreaEntity,
    ]),
  ],
  controllers: [EnvironmentController],
  providers: [
    EnvironmentService,
    SpaceDesignService,
    GardenTherapyService,
    ActivitySpaceService,
    AmbientControlService,
    AccessibilityService,
    TherapeuticDesignService,
  ],
  exports: [
    EnvironmentService,
    SpaceDesignService,
    GardenTherapyService,
    ActivitySpaceService,
    AmbientControlService,
    AccessibilityService,
    TherapeuticDesignService,
  ],
})
export class EnvironmentDesignModule {}
