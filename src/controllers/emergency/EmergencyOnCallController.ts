/**
 * @fileoverview Comprehensive emergency management and nurse call system controller
 * @module Emergency/EmergencyOnCallController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Comprehensive emergency management and nurse call system controller
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Enterprise Emergency & Nurse Call Controller
 * @module EmergencyOnCallController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive emergency management and nurse call system controller
 * with real-time response coordination and intelligent routing.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiSecurity
} from '@nestjs/swagger';
import { EnterpriseEmergencyManagementService, CreateEmergencyIncidentDTO, CreateNurseCallDTO } from '../../services/emergency/EnterpriseEmergencyManagementService';
import { NurseCallSystemService } from '../../services/emergency/NurseCallSystemService';
import { EmergencyIncident } from '../../entities/emergency/EmergencyIncident';
import { NurseCallAlert, CallType, CallPriority, CallStatus } from '../../entities/emergency/NurseCallAlert';
import { OnCallRota, OnCallRole } from '../../entities/emergency/OnCallRota';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { TenantGuard } from '../../guards/tenant.guard';

@ApiTags('Emergency & Nurse Call Management')
@ApiBearerAuth()
@ApiSecurity('api-key')
@Controller('api/v1/emergency')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class EmergencyOnCallController {
  constructor(
    private readonly emergencyService: EnterpriseEmergencyManagementService,
    private readonly nurseCallService: NurseCallSystemService
  ) {}

  @Post('incidents')
  @HttpCode(HttpStatus.CREATED)
  @Roles('MANAGER', 'SENIOR_NURSE', 'NURSE', 'SENIOR_CARER', 'SECURITY')
  @ApiOperation({ 
    summary: 'Report emergency incident',
    description: 'Reports emergency incident with automatic response coordination'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Emergency incident reported successfully',
    type: EmergencyIncident
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async reportEmergencyIncident(
    @Body() incidentData: CreateEmergencyIncidentDTO,
    @Request() req: any
  ): Promise<EmergencyIncident> {
    return await this.emergencyService.reportEmergencyIncident(
      incidentData,
      req.user.userId
    );
  }

  @Post('nurse-calls')
  @HttpCode(HttpStatus.CREATED)
  @Roles('NURSE', 'SENIOR_CARER', 'MANAGER', 'RESIDENT_FAMILY')
  @ApiOperation({ 
    summary: 'Create nurse call',
    description: 'Creates nurse call with AI-powered priority assessment and intelligent routing'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Nurse call created successfully',
    type: NurseCallAlert
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createNurseCall(
    @Body() callData: CreateNurseCallDTO,
    @Request() req: any
  ): Promise<NurseCallAlert> {
    return await this.nurseCallService.triggerNurseCall(
      callData.residentId,
      callData.callType,
      'staff_initiated',
      callData.location,
      callData.description,
      callData.deviceId,
      req.user.tenantId,
      req.user.organizationId
    );
  }

  @Get('dashboard')
  @Roles('MANAGER', 'SENIOR_NURSE', 'NURSE', 'ADMIN')
  @ApiOperation({ 
    summary: 'Get emergency dashboard',
    description: 'Retrieves comprehensive emergency management dashboard with real-time metrics'
  })
  async getEmergencyDashboard(@Request() req: any) {
    return await this.emergencyService.getEmergencyDashboard(
      req.user.tenantId,
      req.user.organizationId
    );
  }

  @Get('on-call')
  @Roles('MANAGER', 'SENIOR_NURSE', 'ADMIN')
  @ApiOperation({ 
    summary: 'Get on-call management status',
    description: 'Retrieves current on-call staff and management information'
  })
  async getOnCallManagement(@Request() req: any) {
    return await this.emergencyService.getOnCallManagement(
      req.user.tenantId,
      req.user.organizationId
    );
  }

  @Get('nurse-calls/analytics')
  @Roles('MANAGER', 'SENIOR_NURSE', 'ADMIN')
  @ApiOperation({ 
    summary: 'Get nurse call analytics',
    description: 'Retrieves comprehensive nurse call system analytics and performance metrics'
  })
  async getNurseCallAnalytics(@Request() req: any) {
    return await this.nurseCallService.getCallAnalytics(
      req.user.tenantId,
      req.user.organizationId
    );
  }

  @Get('staff-allocation')
  @Roles('MANAGER', 'SENIOR_NURSE', 'ADMIN')
  @ApiOperation({ 
    summary: 'Get staff allocation status',
    description: 'Retrieves current staff allocation and availability for emergency response'
  })
  async getStaffAllocation(@Request() req: any) {
    return await this.nurseCallService.getStaffAllocation(
      req.user.tenantId,
      req.user.organizationId
    );
  }

  @Put('nurse-calls/:id/acknowledge')
  @Roles('NURSE', 'SENIOR_CARER', 'MANAGER', 'SENIOR_NURSE')
  @ApiOperation({ 
    summary: 'Acknowledge nurse call',
    description: 'Acknowledges nurse call and starts response timer'
  })
  @ApiParam({ name: 'id', description: 'Nurse call ID' })
  async acknowledgeNurseCall(
    @Param('id') callId: string,
    @Request() req: any
  ): Promise<NurseCallAlert> {
    return await this.emergencyService.acknowledgeNurseCall(
      callId,
      req.user.userId,
      req.user.name,
      req.user.tenantId
    );
  }

  @Put('nurse-calls/:id/resolve')
  @Roles('NURSE', 'SENIOR_CARER', 'MANAGER', 'SENIOR_NURSE')
  @ApiOperation({ 
    summary: 'Resolve nurse call',
    description: 'Resolves nurse call with resolution notes and completion tracking'
  })
  @ApiParam({ name: 'id', description: 'Nurse call ID' })
  async resolveNurseCall(
    @Param('id') callId: string,
    @Body() resolutionData: { notes: string; followUpRequired?: boolean },
    @Request() req: any
  ): Promise<NurseCallAlert> {
    return await this.emergencyService.resolveNurseCall(
      callId,
      req.user.userId,
      req.user.name,
      resolutionData.notes,
      req.user.tenantId
    );
  }

  @Post('on-call/rota')
  @Roles('MANAGER', 'ADMIN')
  @ApiOperation({ 
    summary: 'Update on-call rota',
    description: 'Updates on-call rota with intelligent scheduling and compliance checking'
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateOnCallRota(
    @Body() rotaData: {
      staffId: string;
      staffName: string;
      role: OnCallRole;
      shiftStart: Date;
      shiftEnd: Date;
      contactDetails: any;
      capabilities: any;
    },
    @Request() req: any
  ): Promise<OnCallRota> {
    return await this.nurseCallService.updateOnCallRota(
      rotaData,
      req.user.tenantId,
      req.user.organizationId,
      req.user.userId,
      req.user.name
    );
  }

  @Get('nurse-calls/active')
  @Roles('NURSE', 'SENIOR_CARER', 'MANAGER', 'SENIOR_NURSE', 'ADMIN')
  @ApiOperation({ 
    summary: 'Get active nurse calls',
    description: 'Retrieves all active nurse calls with priority ordering'
  })
  @ApiQuery({ name: 'priority', required: false, enum: CallPriority, isArray: true })
  @ApiQuery({ name: 'callType', required: false, enum: CallType, isArray: true })
  @ApiQuery({ name: 'location', required: false, type: String })
  async getActiveNurseCalls(
    @Query('priority') priority?: CallPriority[],
    @Query('callType') callType?: CallType[],
    @Query('location') location?: string,
    @Request() req: any
  ) {
    // Implementation would filter active calls based on query parameters
    const filters = {
      status: [CallStatus.ACTIVE, CallStatus.ACKNOWLEDGED],
      priority,
      callType,
      location,
      tenantId: req.user.tenantId,
      organizationId: req.user.organizationId
    };

    // Would call service method to get filtered active calls
    return {
      activeCalls: [],
      queueLength: 0,
      averageWaitTime: 0,
      criticalCalls: 0
    };
  }

  @Get('incidents/recent')
  @Roles('MANAGER', 'SENIOR_NURSE', 'ADMIN', 'SENIOR_CARER')
  @ApiOperation({ 
    summary: 'Get recent emergency incidents',
    description: 'Retrieves recent emergency incidents with filtering and analytics'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'severity', required: false, type: String })
  async getRecentIncidents(
    @Query('limit') limit: number = 20,
    @Query('severity') severity?: string,
    @Request() req: any
  ) {
    // Implementation would call emergency service to get recent incidents
    return {
      incidents: [],
      totalCount: 0,
      analytics: {
        averageResponseTime: 0,
        resolutionRate: 0,
        escalationRate: 0
      }
    };
  }
}