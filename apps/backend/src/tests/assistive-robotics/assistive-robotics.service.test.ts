import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AssistiveRoboticsService } from '../../services/assistive-robotics.service';
import { AuditTrailService } from '../../services/audit/AuditTrailService';
import { AssistiveRobot } from '../../entities/robotics/AssistiveRobot';
import { RobotTask } from '../../entities/robotics/RobotTask';
import { RobotCommand } from '../../entities/robotics/RobotCommand';
import { RobotPerformance } from '../../entities/robotics/RobotPerformance';
import { RobotMaintenance } from '../../entities/robotics/RobotMaintenance';

describe('AssistiveRoboticsService', () => {
  let service: AssistiveRoboticsService;
  let mockRobotRepository: any;
  let mockTaskRepository: any;
  let mockCommandRepository: any;
  let mockPerformanceRepository: any;
  let mockMaintenanceRepository: any;
  let mockEventEmitter: any;
  let mockAuditService: any;

  beforeEach(async () => {
    mockRobotRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    mockTaskRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    mockCommandRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    mockPerformanceRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    mockMaintenanceRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    mockAuditService = {
      logEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssistiveRoboticsService,
        {
          provide: getRepositoryToken(AssistiveRobot),
          useValue: mockRobotRepository,
        },
        {
          provide: getRepositoryToken(RobotTask),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(RobotCommand),
          useValue: mockCommandRepository,
        },
        {
          provide: getRepositoryToken(RobotPerformance),
          useValue: mockPerformanceRepository,
        },
        {
          provide: getRepositoryToken(RobotMaintenance),
          useValue: mockMaintenanceRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<AssistiveRoboticsService>(AssistiveRoboticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerRobot', () => {
    it('should register a new robot successfully', async () => {
      const robotData = {
        name: 'RoboHelper-001',
        type: 'mobility_assistant' as const,
        model: 'RH-2024',
        serialNumber: 'SN123456789',
        status: 'online' as const,
        batteryLevel: 100,
        location: 'Room 101',
        capabilities: ['navigation', 'obstacle_avoidance', 'voice_commands'],
        lastActivity: new Date(),
        robotId: 'robot_001',
        manufacturer: 'RoboTech Inc',
        isActive: true,
      };

      const result = await service.registerRobot(robotData);

      expect(result).toEqual({
        id: expect.any(String),
        ...robotData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockRobotRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
        ...robotData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('assistive.robot.registered', {
        robotId: expect.any(String),
        robotName: robotData.name,
        robotType: robotData.type,
        location: robotData.location.roomName,
        timestamp: expect.any(Date),
      });
    });

    it('should handle robot registration failure', async () => {
      const robotData = {
        name: 'RoboHelper-001',
        type: 'mobility_assistant' as const,
        model: 'RH-2024',
        serialNumber: 'SN123456789',
        status: 'online' as const,
        batteryLevel: 100,
        location: 'Room 101',
        capabilities: ['navigation', 'obstacle_avoidance', 'voice_commands'],
        lastActivity: new Date(),
        robotId: 'robot_001',
        manufacturer: 'RoboTech Inc',
        isActive: true,
      };

      mockRobotRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.registerRobot(robotData)).rejects.toThrow('Failed to register robot');
    });
  });

  describe('assignTask', () => {
    it('should assign a task to a robot successfully', async () => {
      const taskData = {
        robotId: 'robot_001',
        taskType: 'medication_delivery' as const,
        priority: 'high' as const,
        description: 'Deliver medication to Room 101',
        assignedTo: 'resident_001',
        scheduledTime: new Date(),
        estimatedDuration: 15,
        parameters: {
          medicationId: 'med_001',
          dosage: '10mg',
          deliveryTime: new Date(),
        },
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      const result = await service.assignTask(taskData);

      expect(result).toEqual({
        id: expect.any(String),
        ...taskData,
        status: 'pending',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockTaskRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
        ...taskData,
        status: 'pending',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));

      expect(mockRobotRepository.update).toHaveBeenCalledWith(taskData.robotId, {
        currentTask: taskData.description,
        lastActivity: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('assistive.robot.task.assigned', {
        taskId: expect.any(String),
        robotId: taskData.robotId,
        taskType: taskData.taskType,
        priority: taskData.priority,
        assignedTo: taskData.assignedTo,
        timestamp: expect.any(Date),
      });
    });

    it('should handle task assignment failure', async () => {
      const taskData = {
        robotId: 'robot_001',
        taskType: 'medication_delivery' as const,
        priority: 'high' as const,
        description: 'Deliver medication to Room 101',
        assignedTo: 'resident_001',
        scheduledTime: new Date(),
        estimatedDuration: 15,
        parameters: {},
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      mockTaskRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.assignTask(taskData)).rejects.toThrow('Failed to assign task');
    });
  });

  describe('executeCommand', () => {
    it('should execute a command on a robot successfully', async () => {
      const commandData = {
        robotId: 'robot_001',
        commandType: 'move' as const,
        parameters: {
          destination: { x: 10, y: 20, z: 0 },
          speed: 0.5,
        },
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      const result = await service.executeCommand(commandData);

      expect(result).toEqual({
        id: expect.any(String),
        ...commandData,
        status: 'pending',
        timestamp: expect.any(Date),
      });

      expect(mockCommandRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
        ...commandData,
        status: 'pending',
        timestamp: expect.any(Date),
      }));

      expect(mockRobotRepository.update).toHaveBeenCalledWith(commandData.robotId, {
        lastActivity: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('assistive.robot.command.executed', {
        commandId: expect.any(String),
        robotId: commandData.robotId,
        commandType: commandData.commandType,
        timestamp: expect.any(Date),
      });
    });

    it('should handle command execution failure', async () => {
      const commandData = {
        robotId: 'robot_001',
        commandType: 'move' as const,
        parameters: {
          destination: { x: 10, y: 20, z: 0 },
          speed: 0.5,
        },
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      mockCommandRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.executeCommand(commandData)).rejects.toThrow('Failed to execute command');
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status successfully', async () => {
      const taskId = 'task_001';
      const status = 'completed';
      const result = 'Task completed successfully';
      const errorMessage = undefined;

      mockTaskRepository.findOne.mockResolvedValue({
        id: taskId,
        robotId: 'robot_001',
        description: 'Deliver medication',
        createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      });

      const success = await service.updateTaskStatus(taskId, status, result, errorMessage);

      expect(success).toBe(true);
      expect(mockTaskRepository.update).toHaveBeenCalledWith(taskId, {
        status,
        updatedAt: expect.any(Date),
        result,
        actualDuration: 15,
      });

      expect(mockRobotRepository.update).toHaveBeenCalledWith('robot_001', {
        currentTask: undefined,
        lastActivity: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('assistive.robot.task.status_updated', {
        taskId,
        robotId: 'robot_001',
        status,
        result,
        errorMessage,
        timestamp: expect.any(Date),
      });
    });

    it('should handle task status update failure', async () => {
      const taskId = 'task_001';
      const status = 'failed';
      const result = undefined;
      const errorMessage = 'Task failed due to navigation error';

      mockTaskRepository.update.mockRejectedValue(new Error('Database error'));

      const success = await service.updateTaskStatus(taskId, status, result, errorMessage);

      expect(success).toBe(false);
    });
  });

  describe('getRobotPerformance', () => {
    it('should get robot performance metrics successfully', async () => {
      const robotId = 'robot_001';
      const period = 'weekly';

      const mockTasks = [
        {
          id: 'task_001',
          status: 'completed',
          actualDuration: 15,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'task_002',
          status: 'completed',
          actualDuration: 20,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'task_003',
          status: 'failed',
          actualDuration: 10,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      ];

      mockTaskRepository.find.mockResolvedValue(mockTasks);

      const result = await service.getRobotPerformance(robotId, period);

      expect(result).toEqual({
        robotId,
        period,
        tasksCompleted: 2,
        tasksFailed: 1,
        averageTaskDuration: 17.5,
        uptime: 66.67,
        batteryEfficiency: 85,
        errorRate: 33.33,
        userSatisfaction: 4.2,
        maintenanceRequired: true,
        lastMaintenance: expect.any(Date),
        nextMaintenance: expect.any(Date),
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('assistive.robot.performance.accessed', {
        robotId,
        period,
        tasksCompleted: 2,
        tasksFailed: 1,
        uptime: 66.67,
        errorRate: 33.33,
        timestamp: expect.any(Date),
      });
    });

    it('should handle robot performance retrieval failure', async () => {
      const robotId = 'robot_001';
      const period = 'weekly';

      mockTaskRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.getRobotPerformance(robotId, period)).rejects.toThrow('Failed to get robot performance');
    });
  });

  describe('scheduleMaintenance', () => {
    it('should schedule robot maintenance successfully', async () => {
      const maintenanceData = {
        robotId: 'robot_001',
        maintenanceType: 'routine' as const,
        description: 'Routine maintenance check',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        technician: 'tech_001',
        notes: 'Check all sensors and update software',
        partsReplaced: ['battery', 'sensor_array'],
        cost: 500,
        status: 'scheduled' as const,
        type: 'routine' as const,
        title: 'Routine Maintenance',
        isActive: true,
      };

      const result = await service.scheduleMaintenance(maintenanceData);

      expect(result).toEqual({
        id: expect.any(String),
        ...maintenanceData,
        status: 'scheduled',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockMaintenanceRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
        ...maintenanceData,
        status: 'scheduled',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('assistive.robot.maintenance.scheduled', {
        maintenanceId: expect.any(String),
        robotId: maintenanceData.robotId,
        maintenanceType: maintenanceData.maintenanceType,
        scheduledDate: maintenanceData.scheduledDate,
        technician: maintenanceData.technician,
        timestamp: expect.any(Date),
      });
    });

    it('should handle maintenance scheduling failure', async () => {
      const maintenanceData = {
        robotId: 'robot_001',
        maintenanceType: 'routine' as const,
        description: 'Routine maintenance check',
        scheduledDate: new Date(),
        technician: 'tech_001',
        status: 'scheduled' as const,
        type: 'routine' as const,
        title: 'Routine Maintenance',
        isActive: true,
      };

      mockMaintenanceRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.scheduleMaintenance(maintenanceData)).rejects.toThrow('Failed to schedule maintenance');
    });
  });

  describe('getAllRobots', () => {
    it('should get all robots successfully', async () => {
      const mockRobots = [
        {
          id: 'robot_001',
          name: 'RoboHelper-001',
          type: 'mobility_assistant',
          status: 'online',
          batteryLevel: 100,
          location: {
            roomId: 'room_101',
            roomName: 'Room 101',
            coordinates: { x: 10, y: 20, z: 0 },
          },
          capabilities: ['navigation', 'obstacle_avoidance'],
          lastActivity: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'robot_002',
          name: 'MedBot-001',
          type: 'medication_dispenser',
          status: 'online',
          batteryLevel: 85,
          location: {
            roomId: 'room_102',
            roomName: 'Room 102',
            coordinates: { x: 15, y: 25, z: 0 },
          },
          capabilities: ['medication_storage', 'dosage_control'],
          lastActivity: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRobotRepository.find.mockResolvedValue(mockRobots);

      const result = await service.getAllRobots();

      expect(result).toEqual(mockRobots);
      expect(mockRobotRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('assistive.robot.robots.accessed', {
        count: 2,
        timestamp: expect.any(Date),
      });
    });

    it('should handle get all robots failure', async () => {
      mockRobotRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.getAllRobots()).rejects.toThrow('Failed to get robots');
    });
  });

  describe('getRobotById', () => {
    it('should get robot by ID successfully', async () => {
      const robotId = 'robot_001';
      const mockRobot = {
        id: robotId,
        name: 'RoboHelper-001',
        type: 'mobility_assistant',
        status: 'online',
        batteryLevel: 100,
        location: 'Room 101',
        capabilities: ['navigation', 'obstacle_avoidance'],
        lastActivity: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRobotRepository.findOne.mockResolvedValue(mockRobot);

      const result = await service.getRobotById(robotId);

      expect(result).toEqual(mockRobot);
      expect(mockRobotRepository.findOne).toHaveBeenCalledWith({ where: { id: robotId } });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('assistive.robot.accessed', {
        robotId,
        robotName: mockRobot.name,
        robotType: mockRobot.type,
        status: mockRobot.status,
        timestamp: expect.any(Date),
      });
    });

    it('should return null for non-existent robot', async () => {
      const robotId = 'nonexistent_robot';

      mockRobotRepository.findOne.mockResolvedValue(null);

      const result = await service.getRobotById(robotId);

      expect(result).toBeNull();
    });

    it('should handle get robot by ID failure', async () => {
      const robotId = 'robot_001';

      mockRobotRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.getRobotById(robotId)).rejects.toThrow('Failed to get robot');
    });
  });

  describe('getRobotTasks', () => {
    it('should get robot tasks successfully', async () => {
      const robotId = 'robot_001';
      const status = 'pending';
      const mockTasks = [
        {
          id: 'task_001',
          robotId,
          taskType: 'medication_delivery',
          status: 'pending',
          description: 'Deliver medication to Room 101',
          assignedTo: 'resident_001',
          scheduledTime: new Date(),
          estimatedDuration: 15,
          parameters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockTaskRepository.find.mockResolvedValue(mockTasks);

      const result = await service.getRobotTasks(robotId, status);

      expect(result).toEqual(mockTasks);
      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { robotId, status },
        order: { createdAt: 'DESC' },
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('assistive.robot.tasks.accessed', {
        robotId,
        status,
        count: 1,
        timestamp: expect.any(Date),
      });
    });

    it('should get all robot tasks when no status filter', async () => {
      const robotId = 'robot_001';
      const mockTasks = [
        {
          id: 'task_001',
          robotId,
          taskType: 'medication_delivery',
          status: 'pending',
          description: 'Deliver medication to Room 101',
          assignedTo: 'resident_001',
          scheduledTime: new Date(),
          estimatedDuration: 15,
          parameters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'task_002',
          robotId,
          taskType: 'mobility_assistance',
          status: 'completed',
          description: 'Assist resident with walking',
          assignedTo: 'resident_002',
          scheduledTime: new Date(),
          estimatedDuration: 30,
          parameters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockTaskRepository.find.mockResolvedValue(mockTasks);

      const result = await service.getRobotTasks(robotId);

      expect(result).toEqual(mockTasks);
      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { robotId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should handle get robot tasks failure', async () => {
      const robotId = 'robot_001';

      mockTaskRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.getRobotTasks(robotId)).rejects.toThrow('Failed to get robot tasks');
    });
  });

  describe('getRobotMaintenanceHistory', () => {
    it('should get robot maintenance history successfully', async () => {
      const robotId = 'robot_001';
      const mockMaintenance = [
        {
          id: 'maint_001',
          robotId,
          maintenanceType: 'routine',
          description: 'Routine maintenance check',
          scheduledDate: new Date(),
          completedDate: new Date(),
          status: 'completed',
          technician: 'tech_001',
          notes: 'All systems checked',
          partsReplaced: ['battery'],
          cost: 200,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockMaintenanceRepository.find.mockResolvedValue(mockMaintenance);

      const result = await service.getRobotMaintenanceHistory(robotId);

      expect(result).toEqual(mockMaintenance);
      expect(mockMaintenanceRepository.find).toHaveBeenCalledWith({
        where: { robotId },
        order: { scheduledDate: 'DESC' },
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('assistive.robot.maintenance.accessed', {
        robotId,
        count: 1,
        timestamp: expect.any(Date),
      });
    });

    it('should handle get robot maintenance history failure', async () => {
      const robotId = 'robot_001';

      mockMaintenanceRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.getRobotMaintenanceHistory(robotId)).rejects.toThrow('Failed to get robot maintenance history');
    });
  });

  describe('updateRobotStatus', () => {
    it('should update robot status successfully', async () => {
      const robotId = 'robot_001';
      const status = 'maintenance';

      const success = await service.updateRobotStatus(robotId, status);

      expect(success).toBe(true);
      expect(mockRobotRepository.update).toHaveBeenCalledWith(robotId, {
        status,
        lastActivity: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('assistive.robot.status_updated', {
        robotId,
        status,
        timestamp: expect.any(Date),
      });
    });

    it('should handle update robot status failure', async () => {
      const robotId = 'robot_001';
      const status = 'maintenance';

      mockRobotRepository.update.mockRejectedValue(new Error('Database error'));

      const success = await service.updateRobotStatus(robotId, status);

      expect(success).toBe(false);
    });
  });

  describe('getRobotsByType', () => {
    it('should get robots by type successfully', async () => {
      const type = 'mobility_assistant';
      const mockRobots = [
        {
          id: 'robot_001',
          name: 'RoboHelper-001',
          type: 'mobility_assistant',
          status: 'online',
          batteryLevel: 100,
          location: {
            roomId: 'room_101',
            roomName: 'Room 101',
            coordinates: { x: 10, y: 20, z: 0 },
          },
          capabilities: ['navigation', 'obstacle_avoidance'],
          lastActivity: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRobotRepository.find.mockResolvedValue(mockRobots);

      const result = await service.getRobotsByType(type);

      expect(result).toEqual(mockRobots);
      expect(mockRobotRepository.find).toHaveBeenCalledWith({
        where: { type },
        order: { createdAt: 'DESC' },
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('assistive.robot.robots_by_type.accessed', {
        type,
        count: 1,
        timestamp: expect.any(Date),
      });
    });

    it('should handle get robots by type failure', async () => {
      const type = 'mobility_assistant';

      mockRobotRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.getRobotsByType(type)).rejects.toThrow('Failed to get robots by type');
    });
  });

  describe('getRobotsByLocation', () => {
    it('should get robots by location successfully', async () => {
      const roomId = 'room_101';
      const mockRobots = [
        {
          id: 'robot_001',
          name: 'RoboHelper-001',
          type: 'mobility_assistant',
          status: 'online',
          batteryLevel: 100,
          location: {
            roomId: 'room_101',
            roomName: 'Room 101',
            coordinates: { x: 10, y: 20, z: 0 },
          },
          capabilities: ['navigation', 'obstacle_avoidance'],
          lastActivity: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRobotRepository.find.mockResolvedValue(mockRobots);

      const result = await service.getRobotsByLocation(roomId);

      expect(result).toEqual(mockRobots);
      expect(mockRobotRepository.find).toHaveBeenCalledWith({
        where: { location: { roomId } },
        order: { createdAt: 'DESC' },
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('assistive.robot.robots_by_location.accessed', {
        roomId,
        count: 1,
        timestamp: expect.any(Date),
      });
    });

    it('should handle get robots by location failure', async () => {
      const roomId = 'room_101';

      mockRobotRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.getRobotsByLocation(roomId)).rejects.toThrow('Failed to get robots by location');
    });
  });

  describe('getRobotsRequiringMaintenance', () => {
    it('should get robots requiring maintenance successfully', async () => {
      const mockRobots = [
        {
          id: 'robot_001',
          name: 'RoboHelper-001',
          type: 'mobility_assistant',
          status: 'maintenance',
          batteryLevel: 20,
          location: {
            roomId: 'room_101',
            roomName: 'Room 101',
            coordinates: { x: 10, y: 20, z: 0 },
          },
          capabilities: ['navigation', 'obstacle_avoidance'],
          lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRobotRepository.find.mockResolvedValue(mockRobots);

      const result = await service.getRobotsRequiringMaintenance();

      expect(result).toEqual(mockRobots);
      expect(mockRobotRepository.find).toHaveBeenCalledWith({
        where: { status: 'maintenance' },
        order: { lastActivity: 'ASC' },
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('assistive.robot.robots_maintenance.accessed', {
        count: 1,
        timestamp: expect.any(Date),
      });
    });

    it('should handle get robots requiring maintenance failure', async () => {
      mockRobotRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.getRobotsRequiringMaintenance()).rejects.toThrow('Failed to get robots requiring maintenance');
    });
  });

  describe('getAssistiveRoboticsStatistics', () => {
    it('should get assistive robotics statistics successfully', async () => {
      mockRobotRepository.count
        .mockResolvedValueOnce(10) // totalRobots
        .mockResolvedValueOnce(8)  // onlineRobots
        .mockResolvedValueOnce(1)  // offlineRobots
        .mockResolvedValueOnce(1); // maintenanceRobots

      mockTaskRepository.count
        .mockResolvedValueOnce(50)  // totalTasks
        .mockResolvedValueOnce(45)  // completedTasks
        .mockResolvedValueOnce(3)   // failedTasks
        .mockResolvedValueOnce(2);  // pendingTasks

      mockMaintenanceRepository.count
        .mockResolvedValueOnce(15)  // totalMaintenance
        .mockResolvedValueOnce(5)   // scheduledMaintenance
        .mockResolvedValueOnce(10); // completedMaintenance

      const result = await service.getAssistiveRoboticsStatistics();

      expect(result).toEqual({
        robots: {
          total: 10,
          online: 8,
          offline: 1,
          maintenance: 1,
          error: 0,
        },
        tasks: {
          total: 50,
          completed: 45,
          failed: 3,
          pending: 2,
          successRate: 90,
        },
        maintenance: {
          total: 15,
          scheduled: 5,
          completed: 10,
        },
        lastUpdated: expect.any(Date),
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('assistive.robot.statistics.accessed', {
        totalRobots: 10,
        onlineRobots: 8,
        totalTasks: 50,
        completedTasks: 45,
        timestamp: expect.any(Date),
      });
    });

    it('should handle get assistive robotics statistics failure', async () => {
      mockRobotRepository.count.mockRejectedValue(new Error('Database error'));

      await expect(service.getAssistiveRoboticsStatistics()).rejects.toThrow('Failed to get assistive robotics statistics');
    });
  });
});
