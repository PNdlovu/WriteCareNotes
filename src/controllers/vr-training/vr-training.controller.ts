import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../middleware/auth.guard';
import { RbacGuard } from '../../middleware/rbac.guard';
import { VirtualRealityTrainingService, VRTrainingSession, VRTrainingScenario } from '../../services/vr-training.service';
import { AuditTrailService } from '../../services/audit/AuditTrailService';

@Controller('api/vr-training')
@UseGuards(JwtAuthGuard)
export class VRTrainingController {
  constructor(
    private readonly vrTrainingService: VirtualRealityTrainingService,
    private readonly auditService: AuditTrailService,
  ) {}

  /**
   * Start a VR training session
   */
  @Post('sessions')
  @UseGuards(RbacGuard)
  async startTrainingSession(
    @Body() sessionData: {
      staffMemberId: string;
      scenarioId: string;
      instructorId?: string;
    },
    @Request() req: any,
  ) {
    try {
      const session = await this.vrTrainingService.startVRTrainingSession(
        sessionData.staffMemberId,
        sessionData.scenarioId,
        sessionData.instructorId,
      );

      await this.auditService.logEvent({
        resource: 'VRTraining',
        entityType: 'TrainingSession',
        entityId: session.id,
        action: 'CREATE',
        details: {
          staffMemberId: sessionData.staffMemberId,
          scenarioId: sessionData.scenarioId,
          instructorId: sessionData.instructorId,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: session,
        message: 'VR training session started successfully',
      };
    } catch (error) {
      console.error('Error starting VR training session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Complete a VR training session
   */
  @Put('sessions/:sessionId/complete')
  @UseGuards(RbacGuard)
  async completeTrainingSession(
    @Param('sessionId') sessionId: string,
    @Request() req: any,
  ) {
    try {
      const session = await this.vrTrainingService.completeVRTrainingSession(sessionId);

      await this.auditService.logEvent({
        resource: 'VRTraining',
        entityType: 'TrainingSession',
        entityId: sessionId,
        action: 'UPDATE',
        details: {
          status: 'completed',
          overallScore: session.feedback.overallScore,
          passed: session.feedback.passed,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: session,
        message: 'VR training session completed successfully',
      };
    } catch (error) {
      console.error('Error completing VR training session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process real-time training data
   */
  @Post('sessions/:sessionId/data')
  @UseGuards(RbacGuard)
  async processTrainingData(
    @Param('sessionId') sessionId: string,
    @Body() trainingData: any,
    @Request() req: any,
  ) {
    try {
      await this.vrTrainingService.processTrainingData(sessionId, trainingData);

      await this.auditService.logEvent({
        resource: 'VRTraining',
        entityType: 'TrainingData',
        entityId: sessionId,
        action: 'UPDATE',
        details: {
          dataType: trainingData.type,
          timestamp: new Date(),
        },
        userId: req.user.id,
      });

      return {
        success: true,
        message: 'Training data processed successfully',
      };
    } catch (error) {
      console.error('Error processing training data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create custom VR training scenario
   */
  @Post('scenarios')
  @UseGuards(RbacGuard)
  async createCustomScenario(
    @Body() scenarioData: Partial<VRTrainingScenario>,
    @Request() req: any,
  ) {
    try {
      const scenario = await this.vrTrainingService.createCustomScenario(scenarioData);

      await this.auditService.logEvent({
        resource: 'VRTraining',
        entityType: 'TrainingScenario',
        entityId: scenario.id,
        action: 'CREATE',
        details: {
          title: scenario.title,
          category: scenario.category,
          difficulty: scenario.difficulty,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: scenario,
        message: 'Custom VR scenario created successfully',
      };
    } catch (error) {
      console.error('Error creating custom scenario:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get VR training analytics
   */
  @Get('analytics')
  @UseGuards(RbacGuard)
  async getTrainingAnalytics(
    @Query('timeframe') timeframe: 'week' | 'month' | 'quarter' = 'week',
    @Request() req: any,
  ) {
    try {
      const analytics = await this.vrTrainingService.getVRTrainingAnalytics(timeframe);

      await this.auditService.logEvent({
        resource: 'VRTraining',
        entityType: 'Analytics',
        entityId: 'analytics',
        action: 'READ',
        details: {
          timeframe,
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: analytics,
        message: 'VR training analytics retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting VR training analytics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get VR hardware status
   */
  @Get('hardware')
  @UseGuards(RbacGuard)
  async getHardwareStatus(@Request() req: any) {
    try {
      const hardwareStatus = await this.vrTrainingService.manageVRHardware();

      await this.auditService.logEvent({
        resource: 'VRTraining',
        entityType: 'Hardware',
        entityId: 'hardware_status',
        action: 'READ',
        details: {
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: hardwareStatus,
        message: 'VR hardware status retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting VR hardware status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get available VR scenarios
   */
  @Get('scenarios')
  @UseGuards(RbacGuard)
  async getAvailableScenarios(
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: string,
    @Request() req: any,
  ) {
    try {
      // This would typically fetch from a database
      const scenarios = [
        {
          id: 'emergency_fire_response',
          title: 'Fire Emergency Response',
          description: 'Practice fire evacuation procedures and emergency response protocols',
          category: 'emergency_response',
          difficulty: 'intermediate',
          duration: 45,
        },
        {
          id: 'dementia_communication',
          title: 'Communicating with Dementia Residents',
          description: 'Practice effective communication techniques with residents experiencing dementia',
          category: 'dementia_care',
          difficulty: 'beginner',
          duration: 30,
        },
      ];

      const filteredScenarios = scenarios.filter(scenario => {
        if (category && scenario.category !== category) return false;
        if (difficulty && scenario.difficulty !== difficulty) return false;
        return true;
      });

      await this.auditService.logEvent({
        resource: 'VRTraining',
        entityType: 'Scenarios',
        entityId: 'scenarios_list',
        action: 'READ',
        details: {
          category,
          difficulty,
          count: filteredScenarios.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: filteredScenarios,
        message: 'Available VR scenarios retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting available scenarios:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get training session by ID
   */
  @Get('sessions/:sessionId')
  @UseGuards(RbacGuard)
  async getTrainingSession(
    @Param('sessionId') sessionId: string,
    @Request() req: any,
  ) {
    try {
      // This would typically fetch from a database
      const session = {
        id: sessionId,
        staffMemberId: 'staff_001',
        scenarioId: 'emergency_fire_response',
        startTime: new Date(),
        status: 'in_progress',
        performanceMetrics: {
          reactionTimes: [1200, 1100, 1300],
          accuracyScores: [85, 90, 88],
          decisionQuality: 8.5,
          stressLevel: 6.0,
          confidenceLevel: 7.5,
          completionTime: 0,
          errorsCommitted: [],
          correctActions: ['activated_alarm', 'assisted_residents'],
          hesitationPoints: [],
        },
        assessmentResults: [],
        feedback: {
          overallScore: 0,
          passed: false,
          strengths: [],
          improvementAreas: [],
          recommendedActions: [],
          nextSteps: [],
        },
        technicalIssues: [],
      };

      await this.auditService.logEvent({
        resource: 'VRTraining',
        entityType: 'TrainingSession',
        entityId: sessionId,
        action: 'READ',
        details: {
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: session,
        message: 'VR training session retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting training session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}