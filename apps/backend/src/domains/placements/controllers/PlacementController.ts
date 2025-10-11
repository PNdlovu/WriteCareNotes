/**
 * Placement Controller
 * REST API endpoints for placement management
 * OFSTED compliant, production-ready
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  Request
} from '@nestjs/common';
import { PlacementService } from '../services/PlacementService';
import { PlacementMatchingService } from '../services/PlacementMatchingService';
import { PlacementStatus, PlacementEndReason } from '../entities/Placement';
import { PlacementRequestStatus, PlacementRequestUrgency } from '../entities/PlacementRequest';
import { PlacementReviewType } from '../entities/PlacementReview';

@Controller('api/v1/placements')
export class PlacementController {
  constructor(
    private readonly placementService: PlacementService,
    private readonly matchingService: PlacementMatchingService
  ) {}

  /**
   * POST /api/v1/placements
   * Create a new placement
   */
  @Post()
  async createPlacement(@Body() dto: any, @Request() req: any): Promise<any> {
    try {
      const user = req.user?.id || 'system';
      const placement = await this.placementService.createPlacement(dto, user);
      return placement;
    } catch (error) {
      if (error.name === 'NotFoundException') {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error.name === 'ConflictException') {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        'Failed to create placement',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/v1/placements/:id
   * Get placement details
   */
  @Get(':id')
  async getPlacement(@Param('id') id: string): Promise<any> {
    try {
      return await this.placementService.getPlacement(id);
    } catch (error) {
      if (error.name === 'NotFoundException') {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Failed to retrieve placement',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * PUT /api/v1/placements/:id
   * Update placement
   */
  @Put(':id')
  async updatePlacement(
    @Param('id') id: string,
    @Body() dto: any,
    @Request() req: any
  ): Promise<any> {
    try {
      const user = req.user?.id || 'system';
      return await this.placementService.updatePlacement(id, dto, user);
    } catch (error) {
      if (error.name === 'NotFoundException') {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Failed to update placement',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/v1/placements/:id/activate
   * Activate placement (child has arrived)
   */
  @Post(':id/activate')
  async activatePlacement(@Param('id') id: string, @Request() req: any): Promise<any> {
    try {
      const user = req.user?.id || 'system';
      return await this.placementService.activatePlacement(id, user);
    } catch (error) {
      if (error.name === 'BadRequestException') {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        'Failed to activate placement',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/v1/placements/:id/end
   * End placement
   */
  @Post(':id/end')
  async endPlacement(
    @Param('id') id: string,
    @Body() dto: any,
    @Request() req: any
  ): Promise<any> {
    try {
      const user = req.user?.id || 'system';
      return await this.placementService.endPlacement(id, dto, user);
    } catch (error) {
      if (error.name === 'BadRequestException') {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        'Failed to end placement',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/v1/placements/:id/breakdown
   * Mark placement as breakdown
   */
  @Post(':id/breakdown')
  async markAsBreakdown(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req: any
  ): Promise<any> {
    try {
      const user = req.user?.id || 'system';
      return await this.placementService.markAsBreakdown(id, body.reason, user);
    } catch (error) {
      throw new HttpException(
        'Failed to mark placement as breakdown',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/v1/placements/child/:childId
   * Get all placements for a child
   */
  @Get('child/:childId')
  async getPlacementsByChild(@Param('childId') childId: string): Promise<any> {
    try {
      return await this.placementService.getPlacementsByChild(childId);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve child placements',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/v1/placements/organization/:orgId/active
   * Get active placements for organization
   */
  @Get('organization/:orgId/active')
  async getActivePlacements(@Param('orgId') orgId: string): Promise<any> {
    try {
      return await this.placementService.getActivePlacementsByOrganization(orgId);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve active placements',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/v1/placements/organization/:orgId/overdue-72hr-reviews
   * Get placements with overdue 72-hour reviews
   */
  @Get('organization/:orgId/overdue-72hr-reviews')
  async getOverdue72HourReviews(@Param('orgId') orgId: string): Promise<any> {
    try {
      return await this.placementService.getOverdue72HourReviews(orgId);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve overdue 72-hour reviews',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/v1/placements/organization/:orgId/overdue-reviews
   * Get placements with overdue placement reviews
   */
  @Get('organization/:orgId/overdue-reviews')
  async getOverduePlacementReviews(@Param('orgId') orgId: string): Promise<any> {
    try {
      return await this.placementService.getOverduePlacementReviews(orgId);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve overdue placement reviews',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/v1/placements/organization/:orgId/at-risk
   * Get placements at risk of breakdown
   */
  @Get('organization/:orgId/at-risk')
  async getPlacementsAtRisk(@Param('orgId') orgId: string): Promise<any> {
    try {
      return await this.placementService.getPlacementsAtRisk(orgId);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve at-risk placements',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/v1/placements/organization/:orgId/statistics
   * Get placement statistics
   */
  @Get('organization/:orgId/statistics')
  async getPlacementStatistics(@Param('orgId') orgId: string): Promise<any> {
    try {
      return await this.placementService.getPlacementStatistics(orgId);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve placement statistics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ========================================
  // PLACEMENT REQUESTS
  // ========================================

  /**
   * POST /api/v1/placements/requests
   * Create placement request
   */
  @Post('requests')
  async createPlacementRequest(@Body() dto: any, @Request() req: any): Promise<any> {
    try {
      const user = req.user?.id || 'system';
      return await this.placementService.createPlacementRequest(dto, user);
    } catch (error) {
      throw new HttpException(
        'Failed to create placement request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/v1/placements/requests/:id
   * Get placement request details
   */
  @Get('requests/:id')
  async getPlacementRequest(@Param('id') id: string): Promise<any> {
    try {
      return await this.placementService.getPlacementRequest(id);
    } catch (error) {
      if (error.name === 'NotFoundException') {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Failed to retrieve placement request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * PUT /api/v1/placements/requests/:id/status
   * Update placement request status
   */
  @Put('requests/:id/status')
  async updateRequestStatus(
    @Param('id') id: string,
    @Body() body: { status: PlacementRequestStatus; reason?: string },
    @Request() req: any
  ): Promise<any> {
    try {
      const user = req.user?.id || 'system';
      return await this.placementService.updatePlacementRequestStatus(
        id,
        body.status,
        user,
        body.reason
      );
    } catch (error) {
      throw new HttpException(
        'Failed to update placement request status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/v1/placements/requests/:id/match
   * Match placement request to organization
   */
  @Post('requests/:id/match')
  async matchPlacementRequest(
    @Param('id') id: string,
    @Body() body: { organizationId: string },
    @Request() req: any
  ): Promise<any> {
    try {
      const user = req.user?.id || 'system';
      return await this.placementService.matchPlacementRequest(
        id,
        body.organizationId,
        user
      );
    } catch (error) {
      if (error.name === 'ConflictException') {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        'Failed to match placement request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/v1/placements/requests/:id/find-matches
   * Find suitable placements for request
   */
  @Get('requests/:id/find-matches')
  async findMatches(@Param('id') id: string): Promise<any> {
    try {
      return await this.matchingService.findSuitablePlacements(id);
    } catch (error) {
      throw new HttpException(
        'Failed to find placement matches',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/v1/placements/requests/urgent
   * Get urgent placement requests
   */
  @Get('requests/urgent')
  async getUrgentRequests(): Promise<any> {
    try {
      return await this.placementService.getUrgentPlacementRequests();
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve urgent requests',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/v1/placements/requests/overdue
   * Get overdue placement requests
   */
  @Get('requests/overdue')
  async getOverdueRequests(): Promise<any> {
    try {
      return await this.placementService.getOverduePlacementRequests();
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve overdue requests',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ========================================
  // PLACEMENT REVIEWS
  // ========================================

  /**
   * POST /api/v1/placements/:id/reviews
   * Create placement review
   */
  @Post(':id/reviews')
  async createReview(
    @Param('id') id: string,
    @Body() body: { reviewType: PlacementReviewType; scheduledDate: Date },
    @Request() req: any
  ): Promise<any> {
    try {
      const user = req.user?.id || 'system';
      return await this.placementService.createPlacementReview(
        id,
        body.reviewType,
        body.scheduledDate,
        user
      );
    } catch (error) {
      throw new HttpException(
        'Failed to create placement review',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * PUT /api/v1/placements/reviews/:reviewId/complete
   * Complete placement review
   */
  @Put('reviews/:reviewId/complete')
  async completeReview(
    @Param('reviewId') reviewId: string,
    @Body() reviewData: any,
    @Request() req: any
  ): Promise<any> {
    try {
      const user = req.user?.id || 'system';
      return await this.placementService.completePlacementReview(
        reviewId,
        reviewData,
        user
      );
    } catch (error) {
      if (error.name === 'BadRequestException') {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        'Failed to complete placement review',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
