/**
 * @fileoverview assistive-robotics.service
 * @module Assistive-robotics.service
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description assistive-robotics.service
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditTrailService } from './audit/AuditTrailService';
import { AssistiveRobot } from '../entities/robotics/AssistiveRobot';
import { RobotTask } from '../entities/robotics/RobotTask';
import { RobotCommand } from '../entities/robotics/RobotCommand';
import { RobotPerformance } from '../entities/robotics/RobotPerformance';
import { RobotMaintenance } from '../entities/robotics/RobotMaintenance';

export interface AssistiveRobot {
  id: string;
  name: string;
  type: 'mobility_assistant' | 'medication_dispenser' | 'companion_robot' | 'cleaning_robot' | 'security_robot';
  model: string;
  serialNumber: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  batteryLevel: number;
  location: {
    roomId: string;
    roomName: string;
    coordinates: { x: number; y: number; z: number };
  };
  capabilities: string[];
  currentTask?: string;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RobotTask {
  id: string;
  robotId: string;
  taskType: 'medication_delivery' | 'mobility_assistance' | 'companionship' | 'cleaning' | 'security_patrol' | 'emergency_response';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  description: string;
  assignedTo: string; // residentId or staffId
  scheduledTime: Date;
  estimatedDuration: number; // minutes
  actualDuration?: number; // minutes
  parameters: Record<string, any>;
  result?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RobotCommand {
  id: string;
  robotId: string;
  commandType: 'move' | 'speak' | 'deliver' | 'clean' | 'patrol' | 'emergency' | 'maintenance';
  parameters: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: string;
  errorMessage?: string;
  timestamp: Date;
}

export interface RobotPerformance {
  robotId: string;
  period: 'daily' | 'weekly' | 'monthly';
  tasksCompleted: number;
  tasksFailed: number;
  averageTaskDuration: number;
  uptime: number; // percentage
  batteryEfficiency: number; // percentage
  errorRate: number; // percentage
  userSatisfaction: number; // 1-5 scale
  maintenanceRequired: boolean;
  lastMaintenance: Date;
  nextMaintenance: Date;
}

export interface RobotMaintenance {
  id: string;
  robotId: string;
  maintenanceType: 'routine' | 'repair' | 'software_update' | 'battery_replacement' | 'calibration';
  description: string;
  scheduledDate: Date;
  completedDate?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  technician: string;
  notes?: string;
  partsReplaced?: string[];
  cost?: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AssistiveRoboticsService {
  const ructor(
    @InjectRepository(AssistiveRobot)
    privaterobotRepository: Repository<AssistiveRobot>,
    @InjectRepository(RobotTask)
    privatetaskRepository: Repository<RobotTask>,
    @InjectRepository(RobotCommand)
    privatecommandRepository: Repository<RobotCommand>,
    @InjectRepository(RobotPerformance)
    privateperformanceRepository: Repository<RobotPerformance>,
    @InjectRepository(RobotMaintenance)
    privatemaintenanceRepository: Repository<RobotMaintenance>,
    privateeventEmitter: EventEmitter2,
    privateauditService: AuditService,
  ) {}

  /**
   * Register a new assistive robot
   */
  async registerRobot(robotData: Omit<AssistiveRobot, 'id' | 'createdAt' | 'updatedAt'>): Promise<AssistiveRobot> {
    try {
      const robot: AssistiveRobot = {
        id: `robot_${Date.now()}`,
        ...robotData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.robotRepository.save(robot);

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
        userId: 'system',
      });

      this.eventEmitter.emit('assistive.robot.registered', {
        robotId: robot.id,
        robotName: robot.name,
        robotType: robot.type,
        location: robot.location.roomName,
        timestamp: new Date(),
      });

      return robot;
    } catch (error) {
      console.error('Error registeringrobot:', error);
      throw new Error('Failed to register robot');
    }
  }

  /**
   * Assign a task to a robot
   */
  async assignTask(taskData: Omit<RobotTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<RobotTask> {
    try {
      const task: RobotTask = {
        id: `task_${Date.now()}`,
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.taskRepository.save(task);

      // Update robot status
      await this.robotRepository.update(task.robotId, {
        currentTask: task.description,
        lastActivity: new Date(),
        updatedAt: new Date(),
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
        userId: 'system',
      });

      this.eventEmitter.emit('assistive.robot.task.assigned', {
        taskId: task.id,
        robotId: task.robotId,
        taskType: task.taskType,
        priority: task.priority,
        assignedTo: task.assignedTo,
        timestamp: new Date(),
      });

      return task;
    } catch (error) {
      console.error('Error assigningtask:', error);
      throw new Error('Failed to assign task');
    }
  }

  /**
   * Execute a command on a robot
   */
  async executeCommand(commandData: Omit<RobotCommand, 'id' | 'timestamp'>): Promise<RobotCommand> {
    try {
      const command: RobotCommand = {
        id: `cmd_${Date.now()}`,
        ...commandData,
        timestamp: new Date(),
      };

      await this.commandRepository.save(command);

      // Update robot status
      await this.robotRepository.update(command.robotId, {
        lastActivity: new Date(),
        updatedAt: new Date(),
      });

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'RobotCommand',
        entityId: command.id,
        action: 'CREATE',
        details: {
          robotId: command.robotId,
          commandType: command.commandType,
          parameters: command.parameters,
        },
        userId: 'system',
      });

      this.eventEmitter.emit('assistive.robot.command.executed', {
        commandId: command.id,
        robotId: command.robotId,
        commandType: command.commandType,
        timestamp: new Date(),
      });

      return command;
    } catch (error) {
      console.error('Error executingcommand:', error);
      throw new Error('Failed to execute command');
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: RobotTask['status'], result?: string, errorMessage?: string): Promise<boolean> {
    try {
      const updateData: Partial<RobotTask> = {
        status,
        updatedAt: new Date(),
      };

      if (result) {
        updateData.result = result;
      }

      if (errorMessage) {
        updateData.errorMessage = errorMessage;
      }

      if (status === 'completed' || status === 'failed') {
        const task = await this.taskRepository.findOne({ where: { id: taskId } });
        if (task) {
          updateData.actualDuration = Math.floor((Date.now() - task.createdAt.getTime()) / (1000 * 60));
        }
      }

      await this.taskRepository.update(taskId, updateData);

      const task = await this.taskRepository.findOne({ where: { id: taskId } });
      if (task) {
        // Update robot status
        await this.robotRepository.update(task.robotId, {
          currentTask: status === 'completed' ? undefined : task.description,
          lastActivity: new Date(),
          updatedAt: new Date(),
        });

        await this.auditService.logEvent({
          resource: 'AssistiveRobotics',
          entityType: 'RobotTask',
          entityId: taskId,
          action: 'UPDATE',
          details: {
            robotId: task.robotId,
            taskType: task.taskType,
            status,
            result,
            errorMessage,
          },
          userId: 'system',
        });

        this.eventEmitter.emit('assistive.robot.task.status_updated', {
          taskId,
          robotId: task.robotId,
          status,
          result,
          errorMessage,
          timestamp: new Date(),
        });
      }

      return true;
    } catch (error) {
      console.error('Error updating taskstatus:', error);
      return false;
    }
  }

  /**
   * Get robot performance metrics
   */
  async getRobotPerformance(robotId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<RobotPerformance> {
    try {
      const startDate = this.getPeriodStartDate(period);
      const endDate = new Date();

      const tasks = await this.taskRepository.find({
        where: {
          robotId,
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          } as any,
        },
      });

      const completedTasks = tasks.filter(task => task.status === 'completed');
      const failedTasks = tasks.filter(task => task.status === 'failed');
      const totalTasks = tasks.length;

      const averageTaskDuration = completedTasks.length > 0
        ? completedTasks.reduce((sum, task) => sum + (task.actualDuration || 0), 0) / completedTasks.length
        : 0;

      const uptime = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 100;
      const errorRate = totalTasks > 0 ? (failedTasks.length / totalTasks) * 100 : 0;

      const performance: RobotPerformance = {
        robotId,
        period,
        tasksCompleted: completedTasks.length,
        tasksFailed: failedTasks.length,
        averageTaskDuration,
        uptime,
        batteryEfficiency: 85, // This would be calculated from actual battery usage data
        errorRate,
        userSatisfaction: 4.2, // This would be calculated from user feedback
        maintenanceRequired: errorRate > 10 || uptime < 90,
        lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        nextMaintenance: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      };

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
        userId: 'system',
      });

      return performance;
    } catch (error) {
      console.error('Error getting robotperformance:', error);
      throw new Error('Failed to get robot performance');
    }
  }

  /**
   * Schedule robot maintenance
   */
  async scheduleMaintenance(maintenanceData: Omit<RobotMaintenance, 'id' | 'createdAt' | 'updatedAt'>): Promise<RobotMaintenance> {
    try {
      const maintenance: RobotMaintenance = {
        id: `maint_${Date.now()}`,
        ...maintenanceData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.maintenanceRepository.save(maintenance);

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
        userId: 'system',
      });

      this.eventEmitter.emit('assistive.robot.maintenance.scheduled', {
        maintenanceId: maintenance.id,
        robotId: maintenance.robotId,
        maintenanceType: maintenance.maintenanceType,
        scheduledDate: maintenance.scheduledDate,
        technician: maintenance.technician,
        timestamp: new Date(),
      });

      return maintenance;
    } catch (error) {
      console.error('Error schedulingmaintenance:', error);
      throw new Error('Failed to schedule maintenance');
    }
  }

  /**
   * Get all robots
   */
  async getAllRobots(): Promise<AssistiveRobot[]> {
    try {
      const robots = await this.robotRepository.find({
        order: { createdAt: 'DESC' },
      });

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'Robots',
        entityId: 'robots_list',
        action: 'READ',
        details: {
          count: robots.length,
        },
        userId: 'system',
      });

      return robots;
    } catch (error) {
      console.error('Error getting allrobots:', error);
      throw new Error('Failed to get robots');
    }
  }

  /**
   * Get robot by ID
   */
  async getRobotById(robotId: string): Promise<AssistiveRobot | null> {
    try {
      const robot = await this.robotRepository.findOne({ where: { id: robotId } });

      if (robot) {
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
          userId: 'system',
        });
      }

      return robot;
    } catch (error) {
      console.error('Error getting robot byID:', error);
      throw new Error('Failed to get robot');
    }
  }

  /**
   * Get robot tasks
   */
  async getRobotTasks(robotId: string, status?: RobotTask['status']): Promise<RobotTask[]> {
    try {
      const whereCondition: any = { robotId };
      if (status) {
        whereCondition.status = status;
      }

      const tasks = await this.taskRepository.find({
        where: whereCondition,
        order: { createdAt: 'DESC' },
      });

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
        userId: 'system',
      });

      return tasks;
    } catch (error) {
      console.error('Error getting robottasks:', error);
      throw new Error('Failed to get robot tasks');
    }
  }

  /**
   * Get robot maintenance history
   */
  async getRobotMaintenanceHistory(robotId: string): Promise<RobotMaintenance[]> {
    try {
      const maintenance = await this.maintenanceRepository.find({
        where: { robotId },
        order: { scheduledDate: 'DESC' },
      });

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'RobotMaintenance',
        entityId: `maint_${robotId}`,
        action: 'READ',
        details: {
          robotId,
          count: maintenance.length,
        },
        userId: 'system',
      });

      return maintenance;
    } catch (error) {
      console.error('Error getting robot maintenancehistory:', error);
      throw new Error('Failed to get robot maintenance history');
    }
  }

  /**
   * Update robot status
   */
  async updateRobotStatus(robotId: string, status: AssistiveRobot['status']): Promise<boolean> {
    try {
      await this.robotRepository.update(robotId, {
        status,
        lastActivity: new Date(),
        updatedAt: new Date(),
      });

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'Robot',
        entityId: robotId,
        action: 'UPDATE',
        details: {
          status,
        },
        userId: 'system',
      });

      this.eventEmitter.emit('assistive.robot.status_updated', {
        robotId,
        status,
        timestamp: new Date(),
      });

      return true;
    } catch (error) {
      console.error('Error updating robotstatus:', error);
      return false;
    }
  }

  /**
   * Get robots by type
   */
  async getRobotsByType(type: AssistiveRobot['type']): Promise<AssistiveRobot[]> {
    try {
      const robots = await this.robotRepository.find({
        where: { type },
        order: { createdAt: 'DESC' },
      });

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'Robots',
        entityId: `robots_${type}`,
        action: 'READ',
        details: {
          type,
          count: robots.length,
        },
        userId: 'system',
      });

      return robots;
    } catch (error) {
      console.error('Error getting robots bytype:', error);
      throw new Error('Failed to get robots by type');
    }
  }

  /**
   * Get robots by location
   */
  async getRobotsByLocation(roomId: string): Promise<AssistiveRobot[]> {
    try {
      const robots = await this.robotRepository.find({
        where: { location: { roomId } } as any,
        order: { createdAt: 'DESC' },
      });

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'Robots',
        entityId: `robots_${roomId}`,
        action: 'READ',
        details: {
          roomId,
          count: robots.length,
        },
        userId: 'system',
      });

      return robots;
    } catch (error) {
      console.error('Error getting robots bylocation:', error);
      throw new Error('Failed to get robots by location');
    }
  }

  /**
   * Get robots requiring maintenance
   */
  async getRobotsRequiringMaintenance(): Promise<AssistiveRobot[]> {
    try {
      const robots = await this.robotRepository.find({
        where: { status: 'maintenance' },
        order: { lastActivity: 'ASC' },
      });

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'Robots',
        entityId: 'robots_maintenance',
        action: 'READ',
        details: {
          count: robots.length,
        },
        userId: 'system',
      });

      return robots;
    } catch (error) {
      console.error('Error getting robots requiringmaintenance:', error);
      throw new Error('Failed to get robots requiring maintenance');
    }
  }

  /**
   * Get assistive robotics statistics
   */
  async getAssistiveRoboticsStatistics(): Promise<any> {
    try {
      const totalRobots = await this.robotRepository.count();
      const onlineRobots = await this.robotRepository.count({ where: { status: 'online' } });
      const offlineRobots = await this.robotRepository.count({ where: { status: 'offline' } });
      const maintenanceRobots = await this.robotRepository.count({ where: { status: 'maintenance' } });
      const errorRobots = await this.robotRepository.count({ where: { status: 'error' } });

      const totalTasks = await this.taskRepository.count();
      const completedTasks = await this.taskRepository.count({ where: { status: 'completed' } });
      const failedTasks = await this.taskRepository.count({ where: { status: 'failed' } });
      const pendingTasks = await this.taskRepository.count({ where: { status: 'pending' } });

      const totalMaintenance = await this.maintenanceRepository.count();
      const scheduledMaintenance = await this.maintenanceRepository.count({ where: { status: 'scheduled' } });
      const completedMaintenance = await this.maintenanceRepository.count({ where: { status: 'completed' } });

      const statistics = {
        robots: {
          total: totalRobots,
          online: onlineRobots,
          offline: offlineRobots,
          maintenance: maintenanceRobots,
          error: errorRobots,
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          failed: failedTasks,
          pending: pendingTasks,
          successRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        },
        maintenance: {
          total: totalMaintenance,
          scheduled: scheduledMaintenance,
          completed: completedMaintenance,
        },
        lastUpdated: new Date(),
      };

      await this.auditService.logEvent({
        resource: 'AssistiveRobotics',
        entityType: 'Statistics',
        entityId: 'robotics_stats',
        action: 'READ',
        details: {
          totalRobots,
          onlineRobots,
          totalTasks,
          completedTasks,
        },
        userId: 'system',
      });

      return statistics;
    } catch (error) {
      console.error('Error getting assistive roboticsstatistics:', error);
      throw new Error('Failed to get assistive robotics statistics');
    }
  }

  /**
   * Helper method to get period start date
   */
  private getPeriodStartDate(period: 'daily' | 'weekly' | 'monthly'): Date {
    const now = new Date();
    switch (period) {
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
  }
}
