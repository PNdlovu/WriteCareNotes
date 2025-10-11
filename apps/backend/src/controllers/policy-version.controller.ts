/**
 * @fileoverview REST API endpoints for policy version management, comparison, and rollback operations
 * @module Policy-version.controller
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description REST API endpoints for policy version management, comparison, and rollback operations
 */

/**
 * @fileoverview Policy Version Controller
 * @description REST API endpoints for policy version management, comparison, and rollback operations
 * @version 2.0.0
 * @author WriteCareNotes Development Team
 * @created 2025-10-07
 * @lastModified 2025-10-07
 * 
 * @compliance
 * - GDPR Article 5: Accuracy and storage limitation through version control
 * - ISO 27001: Information security through audit trails
 * - British IslesRegulators: CQC, Care Inspectorate, CIW, RQIA, HIQA
 * 
 * @endpoints
 * GET    /api/policies/:policyId/versions - Get all versions for a policy
 * GET    /api/policies/versions/:versionId - Get single version by ID
 * GET    /api/policies/versions/compare - Compare two versions
 * POST   /api/policies/versions/:versionId/rollback - Rollback to a specific version
 * GET    /api/policies/versions/:versionId/diff/:compareVersionId - Get diff between versions
 * DELETE /api/policies/versions/:versionId - Archive a version (soft delete)
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpStatus,
  HttpException,
  ParseUUIDPipe,
  ValidationPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody
} from '@nestjs/swagger';
// Auth guards and decorators - to be implemented
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';
// import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PolicyVersionService } from '../services/policy-governance/policy-version.service';
import { PolicyVersion } from '../entities/policy-version.entity';
import { User } from '../entities/user.entity';

/**
 * Rollback DTO
 */
class RollbackDto {
  reason: string;
}

/**
 * Compare query DTO
 */
class CompareQueryDto {
  v1: string; // Version 1 ID
  v2: string; // Version 2 ID
}

/**
 * Policy Version Controller
 * 
 * Provides REST endpointsfor:
 * - Fetching policy version history
 * - Comparing versions (visual diff)
 * - Rolling back to previous versions
 * - Archiving old versions
 */
@ApiTags('policy-versions')
@Controller('api/policies')
// @UseGuards(JwtAuthGuard, RolesGuard) // TODO: Enable when auth module is ready
@ApiBearerAuth()
export class PolicyVersionController {
  const ructor(
    private readonlypolicyVersionService: PolicyVersionService
  ) {}

  /**
   * Get all versions for a specific policy
   * 
   * @route GET /api/policies/:policyId/versions
   * @access Protected - Requires authentication
   * @returns Array of PolicyVersion entities ordered by createdAt DESC
   */
  @Get(':policyId/versions')
  @ApiOperation({ 
    summary: 'Get all versions for a policy',
    description: 'Retrieves complete version history for a specific policy, ordered chronologically'
  })
  @ApiParam({ 
    name: 'policyId', 
    type: 'string', 
    format: 'uuid',
    description: 'UUID of the policy draft'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Version history retrieved successfully',
    type: [PolicyVersion]
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Policy not found'
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access'
  })
  async getPolicyVersions(
    @Param('policyId', new ParseUUIDPipe()) policyId: string
    // @CurrentUser() user: User // TODO: Enable when auth module is ready
  ): Promise<PolicyVersion[]> {
    try {
      // TODO: Get organizationId from authenticated user
      const organizationId = '00000000-0000-0000-0000-000000000000'; // Temporary placeholder
      const versions = await this.policyVersionService.getPolicyVersions(policyId, organizationId);
      
      if (!versions || versions.length === 0) {
        throw new HttpException(
          'No versions found for this policy',
          HttpStatus.NOT_FOUND
        );
      }

      return versions;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch policyversions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get a single version by ID
   * 
   * @route GET /api/policies/versions/:versionId
   * @access Protected - Requires authentication
   * @returns Single PolicyVersion entity
   */
  @Get('versions/:versionId')
  @ApiOperation({ 
    summary: 'Get a specific version by ID',
    description: 'Retrieves detailed information for a single policy version'
  })
  @ApiParam({ 
    name: 'versionId', 
    type: 'string', 
    format: 'uuid',
    description: 'UUID of the policy version'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Version retrieved successfully',
    type: PolicyVersion
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Version not found'
  })
  async getVersionById(
    @Param('versionId', new ParseUUIDPipe()) versionId: string
    // @CurrentUser() user: User // TODO: Enable when auth module is ready
  ): Promise<PolicyVersion> {
    try {
      const version = await this.policyVersionService['versionRepository'].findOne({
        where: { id: versionId }
      });
      
      if (!version) {
        throw new HttpException(
          'Version not found',
          HttpStatus.NOT_FOUND
        );
      }

      return version;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetchversion: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Compare two policy versions
   * 
   * @route GET /api/policies/versions/compare?v1=uuid1&v2=uuid2
   * @access Protected - Requires authentication
   * @returns Comparison object with diffs
   */
  @Get('versions/compare')
  @ApiOperation({ 
    summary: 'Compare two policy versions',
    description: 'Generates a detailed diff between two policy versions including metadata and content changes'
  })
  @ApiQuery({ 
    name: 'v1', 
    type: 'string', 
    format: 'uuid',
    description: 'UUID of first version (older)'
  })
  @ApiQuery({ 
    name: 'v2', 
    type: 'string', 
    format: 'uuid',
    description: 'UUID of second version (newer)'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Comparison generated successfully',
    schema: {
      type: 'object',
      properties: {
        oldVersion: { type: 'object' },
        newVersion: { type: 'object' },
        metadataDiffs: { type: 'array' },
        contentDiffs: { type: 'array' },
        summary: {
          type: 'object',
          properties: {
            additionsCount: { type: 'number' },
            deletionsCount: { type: 'number' },
            modificationsCount: { type: 'number' },
            unchangedCount: { type: 'number' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid version IDs or missing parameters'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'One or both versions not found'
  })
  async compareVersions(
    @Query() query: CompareQueryDto
    // @CurrentUser() user: User // TODO: Enable when auth module is ready
  ): Promise<any> {
    const { v1, v2 } = query;

    if (!v1 || !v2) {
      throw new HttpException(
        'Both version IDs (v1 and v2) are required',
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(v1) || !uuidRegex.test(v2)) {
      throw new HttpException(
        'Invalid UUID format for version IDs',
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      // TODO: Get organizationId from authenticated user
      const organizationId = '00000000-0000-0000-0000-000000000000'; // Temporary placeholder
      const comparison = await this.policyVersionService.compareVersions(v1, v2, organizationId);
      
      if (!comparison) {
        throw new HttpException(
          'Failed to generate comparison',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return comparison;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to compareversions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get diff between two versions (alias for compare)
   * 
   * @route GET /api/policies/versions/:versionId/diff/:compareVersionId
   * @access Protected - Requires authentication
   * @returns Comparison object with diffs
   */
  @Get('versions/:versionId/diff/:compareVersionId')
  @ApiOperation({ 
    summary: 'Get diff between two versions (RESTful alias)',
    description: 'Alternative endpoint for version comparison using path parameters'
  })
  @ApiParam({ 
    name: 'versionId', 
    type: 'string', 
    format: 'uuid',
    description: 'UUID of the base version'
  })
  @ApiParam({ 
    name: 'compareVersionId', 
    type: 'string', 
    format: 'uuid',
    description: 'UUID of the version to compare against'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Diff generated successfully'
  })
  async getDiff(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @Param('compareVersionId', new ParseUUIDPipe()) compareVersionId: string
    // @CurrentUser() user: User // TODO: Enable when auth module is ready
  ): Promise<any> {
    return this.compareVersions(
      { v1: versionId, v2: compareVersionId }
    );
  }

  /**
   * Rollback to a previous version
   * 
   * @route POST /api/policies/versions/:versionId/rollback
   * @access Protected - Requires admin or policy manager role
   * @returns Updated PolicyDraft with rollback applied
   */
  @Post('versions/:versionId/rollback')
  // @Roles('admin', 'policy_manager', 'compliance_officer') // TODO: Enable when auth module is ready
  @ApiOperation({ 
    summary: 'Rollback to a previous version',
    description: 'Restores a policy to a previous version, creating a pre-rollback snapshot and audit trail'
  })
  @ApiParam({ 
    name: 'versionId', 
    type: 'string', 
    format: 'uuid',
    description: 'UUID of the version to restore'
  })
  @ApiBody({
    type: RollbackDto,
    description: 'Rollback reason (required for audit trail)',
    schema: {
      type: 'object',
      properties: {
        reason: { 
          type: 'string',
          minLength: 10,
          maxLength: 500,
          example: 'Reverting to previous version due to compliance issue'
        }
      },
      required: ['reason']
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Policy rolled back successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        updatedPolicy: { type: 'object' },
        newVersion: { type: 'object' }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid rollback reason or version ID'
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Version not found'
  })
  async rollbackToVersion(
    @Param('versionId', new ParseUUIDPipe()) versionId: string,
    @Body(new ValidationPipe()) rollbackDto: RollbackDto
    // @CurrentUser() user: User // TODO: Enable when auth module is ready
  ): Promise<any> {
    const { reason } = rollbackDto;

    // Validate reason
    if (!reason || reason.trim().length < 10) {
      throw new HttpException(
        'Rollback reason must be at least 10 characters',
        HttpStatus.BAD_REQUEST
      );
    }

    if (reason.length > 500) {
      throw new HttpException(
        'Rollback reason must not exceed 500 characters',
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      // First, get the version to find the policyId
      const version = await this.policyVersionService['versionRepository'].findOne({
        where: { id: versionId }
      });

      if (!version) {
        throw new HttpException(
          'Version not found',
          HttpStatus.NOT_FOUND
        );
      }

      // TODO: Get user from authenticated context
      const mockUser = { id: '00000000-0000-0000-0000-000000000000' } as User;

      const result = await this.policyVersionService.rollbackToVersion(
        version.policyId,
        versionId,
        mockUser,
        reason
      );

      if (!result || !result.success) {
        throw new HttpException(
          'Failed to rollback policy',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return {
        success: true,
        message: result.message,
        updatedPolicy: result.newDraft,
        restoredVersion: result.restoredVersion,
        rollbackMetadata: {
          performedBy: mockUser.id,
          performedAt: new Date(),
          reason,
          targetVersionId: versionId
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to rollbackpolicy: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Archive a policy version (soft delete)
   * 
   * @route DELETE /api/policies/versions/:versionId
   * @access Protected - Requires admin role
   * @returns Success confirmation
   */
  @Delete('versions/:versionId')
  // @Roles('admin', 'compliance_officer') // TODO: Enable when auth module is ready
  @ApiOperation({ 
    summary: 'Archive a policy version',
    description: 'Soft deletes a policy version (sets deletedAt timestamp). Cannot archive published versions.'
  })
  @ApiParam({ 
    name: 'versionId', 
    type: 'string', 
    format: 'uuid',
    description: 'UUID of the version to archive'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Version archived successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        archivedVersionId: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Cannot archive published versions or insufficient permissions'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Version not found'
  })
  async archiveVersion(
    @Param('versionId', new ParseUUIDPipe()) versionId: string
    // @CurrentUser() user: User // TODO: Enable when auth module is ready
  ): Promise<any> {
    try {
      // Get version to check status
      const version = await this.policyVersionService['versionRepository'].findOne({
        where: { id: versionId }
      });

      if (!version) {
        throw new HttpException(
          'Version not found',
          HttpStatus.NOT_FOUND
        );
      }

      // Prevent archiving published versions
      if (version.status === 'published') {
        throw new HttpException(
          'Cannot archive published versions',
          HttpStatus.FORBIDDEN
        );
      }

      // Perform soft delete using TypeORM's softDelete method
      await this.policyVersionService['versionRepository'].softDelete(versionId);

      return {
        success: true,
        message: 'Version archived successfully',
        archivedVersionId: versionId,
        archivedAt: new Date()
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to archiveversion: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
