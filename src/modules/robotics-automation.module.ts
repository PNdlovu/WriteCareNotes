import { EventEmitter2 } from "eventemitter2";

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoboticsController } from '../controllers/robotics.controller';
import { RoboticsService } from '../services/robotics.service';
import { AssistiveRobotService } from '../services/assistive-robot.service';
import { AutomationService } from '../services/automation.service';
import { RobotEntity } from '../entities/robot.entity';
import { AutomationRuleEntity } from '../entities/automation-rule.entity';
import { RobotTaskEntity } from '../entities/robot-task.entity';
import { CompanionRobotService } from '../services/companion-robot.service';
import { MedicalRobotService } from '../services/medical-robot.service';
import { MaintenanceRobotService } from '../services/maintenance-robot.service';
import { DeliveryRobotService } from '../services/delivery-robot.service';

/**
 * Robotics & Automation Module
 * 
 * Provides comprehensive robotics and automation capabilities:
 * - Assistive robots for resident support and mobility aid
 * - Companion robots for social interaction and entertainment
 * - Medical robots for health monitoring and medication delivery
 * - Maintenance robots for facility upkeep and cleaning
 * - Delivery robots for meal and supply distribution
 * - Automated care workflows and task scheduling
 * - Robot fleet management and coordination
 * - Safety monitoring and emergency response
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      RobotEntity,
      AutomationRuleEntity,
      RobotTaskEntity,
    ]),
  ],
  controllers: [RoboticsController],
  providers: [
    RoboticsService,
    AssistiveRobotService,
    AutomationService,
    CompanionRobotService,
    MedicalRobotService,
    MaintenanceRobotService,
    DeliveryRobotService,
  ],
  exports: [
    RoboticsService,
    AssistiveRobotService,
    AutomationService,
    CompanionRobotService,
    MedicalRobotService,
    MaintenanceRobotService,
    DeliveryRobotService,
  ],
})
export class RoboticsAutomationModule {}