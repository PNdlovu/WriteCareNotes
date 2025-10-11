/**
 * @fileoverview assistive-robotics.controller
 * @module Assistive-robotics/Assistive-robotics.controller
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description assistive-robotics.controller
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../middleware/auth.guard';
import { RbacGuard } from '../../middleware/rbac.guard';
import { AssistiveRoboticsService, AssistiveRobot, RobotTask, RobotCommand, RobotPerformance, RobotMaintenance } from '../../services/assistive-robotics.service';
import { AuditTrailService } from '../../services/audit/AuditTrailService';

@Controller('api/assistive-robotics')
@UseGuards(JwtAuthGuard)
export class AssistiveRoboticsController {
  const ructor(
    private readonlyassistiveRoboticsService: AssistiveRoboticsService,
    private readonlyauditService: AuditService,
  ) {}

  /**
   * Register a new assistive robot
   */
  @Post('robots')
  @UseGuards(RbacGuard)
  async registerRobot(
    @Body() robotData: {
      name: string;
      type: 'mobility_assistant' | 'medication_dispenser' | 'companion_robot' | 'cleaning_robot' | 'security_robot';
      model: string;
      serialNumber: string;
      location: {
        roomId: string;
        roomName: string;
        coordinates: { x: number; y: number; z: number };
      };
      capabilities: string[];
    },
    @Request() req: any,
  ) {
    try {
      const robot = await this.assistiveRoboticsService.registerRobot({
        ...robotData,
        status: 'online',
        batteryLevel: 100,
        lastActivity: new Date(),
      });

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'Robot',
        entityId: robot.id,
        action: 'CREATE',
        details: {
          robotName: robot.name,
          robotType: robot.type,
          model: robot.model,
          serialNumber: robot.serialNumber,
          location: robot.location.roomName,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: robot,
        message: 'Robot registered successfully',
      };
    } catch (error) {
      console.error('Error registeringrobot:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all robots
   */
  @Get('robots')
  @UseGuards(RbacGuard)
  async getAllRobots(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('location') location?: string,
    @Request() req: any,
  ) {
    try {
      let robots: AssistiveRobot[];

      if (type) {
        robots = await this.assistiveRoboticsService.getRobotsByType(type as any);
      } else if (location) {
        robots = await this.assistiveRoboticsService.getRobotsByLocation(location);
      } else {
        robots = await this.assistiveRoboticsService.getAllRobots();
      }

      if (status) {
        robots = robots.filter(robot => robot.status === status);
      }

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'Robots',
        entityId: 'robots_list',
        action: 'READ',
        details: {
          type,
          status,
          location,
          count: robots.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: robots,
        message: 'Robots retrieved successfully',
      };
    } catch (error) {
      console.error('Error gettingrobots:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get robot by ID
   */
  @Get('robots/:robotId')
  @UseGuards(RbacGuard)
  async getRobotById(
    @Param('robotId') robotId: string,
    @Request() req: any,
  ) {
    try {
      const robot = await this.assistiveRoboticsService.getRobotById(robotId);

      if (!robot) {
        return {
          success: false,
          error: 'Robot not found',
        };
      }

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'Robot',
        entityId: robotId,
        action: 'READ',
        details: {
          robotName: robot.name,
          robotType: robot.type,
          status: robot.status,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: robot,
        message: 'Robot retrieved successfully',
      };
    } catch (error) {
      console.error('Error gettingrobot:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update robot status
   */
  @Put('robots/:robotId/status')
  @UseGuards(RbacGuard)
  async updateRobotStatus(
    @Param('robotId') robotId: string,
    @Body() statusData: {
      status: 'online' | 'offline' | 'maintenance' | 'error';
    },
    @Request() req: any,
  ) {
    try {
      const success = await this.assistiveRoboticsService.updateRobotStatus(robotId, statusData.status);

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'Robot',
        entityId: robotId,
        action: 'UPDATE',
        details: {
          status: statusData.status,
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Robot status updated successfully' : 'Failed to update robot status',
      };
    } catch (error) {
      console.error('Error updating robotstatus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Assign a task to a robot
   */
  @Post('tasks')
  @UseGuards(RbacGuard)
  async assignTask(
    @Body() taskData: {
      robotId: string;
      taskType: 'medication_delivery' | 'mobility_assistance' | 'companionship' | 'cleaning' | 'security_patrol' | 'emergency_response';
      priority: 'low' | 'medium' | 'high' | 'urgent';
      description: string;
      assignedTo: string;
      scheduledTime: string;
      estimatedDuration: number;
      parameters: Record<string, any>;
    },
    @Request() req: any,
  ) {
    try {
      const task = await this.assistiveRoboticsService.assignTask({
        ...taskData,
        scheduledTime: new Date(taskData.scheduledTime),
        status: 'pending',
      });

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'RobotTask',
        entityId: task.id,
        action: 'CREATE',
        details: {
          robotId: task.robotId,
          taskType: task.taskType,
          priority: task.priority,
          assignedTo: task.assignedTo,
          scheduledTime: task.scheduledTime,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: task,
        message: 'Task assigned successfully',
      };
    } catch (error) {
      console.error('Error assigningtask:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get robot tasks
   */
  @Get('robots/:robotId/tasks')
  @UseGuards(RbacGuard)
  async getRobotTasks(
    @Param('robotId') robotId: string,
    @Query('status') status?: string,
    @Request() req: any,
  ) {
    try {
      const tasks = await this.assistiveRoboticsService.getRobotTasks(robotId, status as any);

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'RobotTasks',
        entityId: `tasks_${robotId}`,
        action: 'READ',
        details: {
          robotId,
          status,
          count: tasks.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: tasks,
        message: 'Robot tasks retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting robottasks:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update task status
   */
  @Put('tasks/:taskId/status')
  @UseGuards(RbacGuard)
  async updateTaskStatus(
    @Param('taskId') taskId: string,
    @Body() statusData: {
      status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
      result?: string;
      errorMessage?: string;
    },
    @Request() req: any,
  ) {
    try {
      const success = await this.assistiveRoboticsService.updateTaskStatus(
        taskId,
        statusData.status,
        statusData.result,
        statusData.errorMessage,
      );

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'RobotTask',
        entityId: taskId,
        action: 'UPDATE',
        details: {
          status: statusData.status,
          result: statusData.result,
          errorMessage: statusData.errorMessage,
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Task status updated successfully' : 'Failed to update task status',
      };
    } catch (error) {
      console.error('Error updating taskstatus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute a command on a robot
   */
  @Post('robots/:robotId/commands')
  @UseGuards(RbacGuard)
  async executeCommand(
    @Param('robotId') robotId: string,
    @Body() commandData: {
      commandType: 'move' | 'speak' | 'deliver' | 'clean' | 'patrol' | 'emergency' | 'maintenance';
      parameters: Record<string, any>;
    },
    @Request() req: any,
  ) {
    try {
      const command = await this.assistiveRoboticsService.executeCommand({
        robotId,
        ...commandData,
        status: 'pending',
      });

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'RobotCommand',
        entityId: command.id,
        action: 'CREATE',
        details: {
          robotId,
          commandType: command.commandType,
          parameters: command.parameters,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: command,
        message: 'Command executed successfully',
      };
    } catch (error) {
      console.error('Error executingcommand:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get robot performance metrics
   */
  @Get('robots/:robotId/performance')
  @UseGuards(RbacGuard)
  async getRobotPerformance(
    @Param('robotId') robotId: string,
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    @Request() req: any,
  ) {
    try {
      const performance = await this.assistiveRoboticsService.getRobotPerformance(robotId, period);

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'RobotPerformance',
        entityId: `perf_${robotId}`,
        action: 'READ',
        details: {
          robotId,
          period,
          tasksCompleted: performance.tasksCompleted,
          tasksFailed: performance.tasksFailed,
          uptime: performance.uptime,
          errorRate: performance.errorRate,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: performance,
        message: 'Robot performance retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting robotperformance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Schedule robot maintenance
   */
  @Post('maintenance')
  @UseGuards(RbacGuard)
  async scheduleMaintenance(
    @Body() maintenanceData: {
      robotId: string;
      maintenanceType: 'routine' | 'repair' | 'software_update' | 'battery_replacement' | 'calibration';
      description: string;
      scheduledDate: string;
      technician: string;
      notes?: string;
      partsReplaced?: string[];
      cost?: number;
    },
    @Request() req: any,
  ) {
    try {
      const maintenance = await this.assistiveRoboticsService.scheduleMaintenance({
        ...maintenanceData,
        scheduledDate: new Date(maintenanceData.scheduledDate),
        status: 'scheduled',
      });

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'RobotMaintenance',
        entityId: maintenance.id,
        action: 'CREATE',
        details: {
          robotId: maintenance.robotId,
          maintenanceType: maintenance.maintenanceType,
          scheduledDate: maintenance.scheduledDate,
          technician: maintenance.technician,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: maintenance,
        message: 'Maintenance scheduled successfully',
      };
    } catch (error) {
      console.error('Error schedulingmaintenance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get robot maintenance history
   */
  @Get('robots/:robotId/maintenance')
  @UseGuards(RbacGuard)
  async getRobotMaintenanceHistory(
    @Param('robotId') robotId: string,
    @Request() req: any,
  ) {
    try {
      const maintenance = await this.assistiveRoboticsService.getRobotMaintenanceHistory(robotId);

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'RobotMaintenance',
        entityId: `maint_${robotId}`,
        action: 'READ',
        details: {
          robotId,
          count: maintenance.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: maintenance,
        message: 'Robot maintenance history retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting robot maintenancehistory:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get robots requiring maintenance
   */
  @Get('robots/maintenance-required')
  @UseGuards(RbacGuard)
  async getRobotsRequiringMaintenance(@Request() req: any) {
    try {
      const robots = await this.assistiveRoboticsService.getRobotsRequiringMaintenance();

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'Robots',
        entityId: 'robots_maintenance',
        action: 'READ',
        details: {
          count: robots.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: robots,
        message: 'Robots requiring maintenance retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting robots requiringmaintenance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get assistive robotics statistics
   */
  @Get('statistics')
  @UseGuards(RbacGuard)
  async getAssistiveRoboticsStatistics(@Request() req: any) {
    try {
      const statistics = await this.assistiveRoboticsService.getAssistiveRoboticsStatistics();

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'Statistics',
        entityId: 'robotics_stats',
        action: 'READ',
        details: {
          totalRobots: statistics.robots.total,
          onlineRobots: statistics.robots.online,
          totalTasks: statistics.tasks.total,
          completedTasks: statistics.tasks.completed,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: statistics,
        message: 'Assistive robotics statistics retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting assistive roboticsstatistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get robot types and capabilities
   */
  @Get('robot-types')
  @UseGuards(RbacGuard)
  async getRobotTypes(@Request() req: any) {
    try {
      const robotTypes = [
        {
          type: 'mobility_assistant',
          name: 'Mobility Assistant',
          description: 'Assists residents with mobility and movement',
          capabilities: ['navigation', 'obstacle_avoidance', 'voice_commands', 'emergency_stop'],
          useCases: ['wheelchair_assistance', 'walking_support', 'fall_prevention'],
        },
        {
          type: 'medication_dispenser',
          name: 'Medication Dispenser',
          description: 'Automated medication dispensing and reminder system',
          capabilities: ['medication_storage', 'dosage_control', 'reminder_alerts', 'inventory_tracking'],
          useCases: ['medication_management', 'dosage_reminders', 'inventory_control'],
        },
        {
          type: 'companion_robot',
          name: 'Companion Robot',
          description: 'Provides companionship and emotional support',
          capabilities: ['conversation', 'entertainment', 'mood_detection', 'social_interaction'],
          useCases: ['emotional_support', 'social_engagement', 'cognitive_stimulation'],
        },
        {
          type: 'cleaning_robot',
          name: 'Cleaning Robot',
          description: 'Automated cleaning and maintenance of living spaces',
          capabilities: ['vacuuming', 'mopping', 'disinfecting', 'scheduled_cleaning'],
          useCases: ['room_cleaning', 'sanitization', 'maintenance_automation'],
        },
        {
          type: 'security_robot',
          name: 'Security Robot',
          description: 'Patrols and monitors facility security',
          capabilities: ['patrol_routes', 'intrusion_detection', 'emergency_response', 'video_monitoring'],
          useCases: ['facility_security', 'emergency_response', 'monitoring'],
        },
      ];

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'RobotTypes',
        entityId: 'robot_types_list',
        action: 'READ',
        details: {
          count: robotTypes.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: robotTypes,
        message: 'Robot types retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting robottypes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get task types and descriptions
   */
  @Get('task-types')
  @UseGuards(RbacGuard)
  async getTaskTypes(@Request() req: any) {
    try {
      const taskTypes = [
        {
          type: 'medication_delivery',
          name: 'Medication Delivery',
          description: 'Deliver medications to residents at scheduled times',
          priority: 'high',
          estimatedDuration: 15,
          parameters: ['residentId', 'medicationId', 'dosage', 'deliveryTime'],
        },
        {
          type: 'mobility_assistance',
          name: 'Mobility Assistance',
          description: 'Assist residents with movement and mobility',
          priority: 'medium',
          estimatedDuration: 30,
          parameters: ['residentId', 'destination', 'assistanceType', 'duration'],
        },
        {
          type: 'companionship',
          name: 'Companionship',
          description: 'Provide social interaction and emotional support',
          priority: 'low',
          estimatedDuration: 60,
          parameters: ['residentId', 'activityType', 'duration', 'interactionLevel'],
        },
        {
          type: 'cleaning',
          name: 'Cleaning',
          description: 'Clean and sanitize resident rooms and common areas',
          priority: 'medium',
          estimatedDuration: 45,
          parameters: ['roomId', 'cleaningType', 'sanitizationLevel', 'schedule'],
        },
        {
          type: 'security_patrol',
          name: 'Security Patrol',
          description: 'Patrol facility for security and safety monitoring',
          priority: 'high',
          estimatedDuration: 120,
          parameters: ['patrolRoute', 'monitoringAreas', 'alertLevel', 'duration'],
        },
        {
          type: 'emergency_response',
          name: 'Emergency Response',
          description: 'Respond to emergency situations and alerts',
          priority: 'urgent',
          estimatedDuration: 10,
          parameters: ['emergencyType', 'location', 'severity', 'responseActions'],
        },
      ];

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'TaskTypes',
        entityId: 'task_types_list',
        action: 'READ',
        details: {
          count: taskTypes.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: taskTypes,
        message: 'Task types retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting tasktypes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
