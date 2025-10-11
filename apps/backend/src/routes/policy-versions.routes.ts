/**
 * @fileoverview Policy Version Routes
 * @description REST API routes for policy version management, comparison, and rollback operations
 * @version 2.0.0
 * @author WriteCareNotes Development Team
 * @created 2025-10-07
 * @lastModified 2025-10-07
 * 
 * @compliance
 * - GDPR Article 5: Accuracy and storage limitation through version control
 * - ISO 27001: Information security through audit trails
 * - British Isles Regulators: CQC, Care Inspectorate, CIW, RQIA, HIQA
 */

import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { PolicyVersion } from '../entities/policy-version.entity';
import { PolicyDraft } from '../entities/policy-draft.entity';
import { PolicyVersionService } from '../services/policy-governance/policy-version.service';
import { validate as validateUUID } from 'uuid';

const router = Router();

/**
 * Initialize service (lazy loading to avoid circular dependencies)
 */
let policyVersionService: PolicyVersionService;

const getService = () => {
  if (!policyVersionService) {
    const versionRepository = AppDataSource.getRepository(PolicyVersion);
    const policyRepository = AppDataSource.getRepository(PolicyDraft);
    // Note: AuditTrailService will need to be initialized separately
    policyVersionService = new PolicyVersionService(
      versionRepository,
      policyRepository,
      null as any // TODO: Inject AuditTrailService when available
    );
  }
  return policyVersionService;
};

/**
 * GET /api/policies/:policyId/versions
 * Get all versions for a specific policy
 */
router.get('/:policyId/versions', async (req: Request, res: Response) => {
  try {
    const { policyId } = req.params;

    // Validate UUID
    if (!validateUUID(policyId)) {
      return res.status(400).json({
        error: 'Invalid policy ID format',
        message: 'Policy ID must be a valid UUID'
      });
    }

    // TODO: Get organizationId from authenticated user
    const organizationId = req.headers['x-organization-id'] as string || '00000000-0000-0000-0000-000000000000';

    const service = getService();
    const versions = await service.getPolicyVersions(policyId, organizationId);

    if (!versions || versions.length === 0) {
      return res.status(404).json({
        error: 'No versions found',
        message: `No versions found for policy ${policyId}`
      });
    }

    res.json({
      success: true,
      count: versions.length,
      data: versions
    });
  } catch (error: any) {
    console.error('Error fetching policy versions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/policies/versions/:versionId
 * Get a single version by ID
 */
router.get('/versions/:versionId', async (req: Request, res: Response) => {
  try {
    const { versionId } = req.params;

    // Validate UUID
    if (!validateUUID(versionId)) {
      return res.status(400).json({
        error: 'Invalid version ID format',
        message: 'Version ID must be a valid UUID'
      });
    }

    const versionRepository = AppDataSource.getRepository(PolicyVersion);
    const version = await versionRepository.findOne({
      where: { id: versionId }
    });

    if (!version) {
      return res.status(404).json({
        error: 'Version not found',
        message: `Version ${versionId} not found`
      });
    }

    res.json({
      success: true,
      data: version
    });
  } catch (error: any) {
    console.error('Error fetching version:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/policies/versions/compare
 * Compare two policy versions
 * Query params: v1=uuid1&v2=uuid2
 */
router.get('/versions/compare', async (req: Request, res: Response) => {
  try {
    const { v1, v2 } = req.query;

    // Validate query parameters
    if (!v1 || !v2) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'Both v1 and v2 version IDs are required'
      });
    }

    // Validate UUIDs
    if (!validateUUID(v1 as string) || !validateUUID(v2 as string)) {
      return res.status(400).json({
        error: 'Invalid version ID format',
        message: 'Version IDs must be valid UUIDs'
      });
    }

    // TODO: Get organizationId from authenticated user
    const organizationId = req.headers['x-organization-id'] as string || '00000000-0000-0000-0000-000000000000';

    const service = getService();
    const comparison = await service.compareVersions(v1 as string, v2 as string, organizationId);

    if (!comparison) {
      return res.status(500).json({
        error: 'Comparison failed',
        message: 'Failed to generate version comparison'
      });
    }

    res.json({
      success: true,
      data: comparison
    });
  } catch (error: any) {
    console.error('Error comparing versions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/policies/versions/:versionId/diff/:compareVersionId
 * Get diff between two versions (RESTful alias)
 */
router.get('/versions/:versionId/diff/:compareVersionId', async (req: Request, res: Response) => {
  try {
    const { versionId, compareVersionId } = req.params;

    // Validate UUIDs
    if (!validateUUID(versionId) || !validateUUID(compareVersionId)) {
      return res.status(400).json({
        error: 'Invalid version ID format',
        message: 'Version IDs must be valid UUIDs'
      });
    }

    // TODO: Get organizationId from authenticated user
    const organizationId = req.headers['x-organization-id'] as string || '00000000-0000-0000-0000-000000000000';

    const service = getService();
    const comparison = await service.compareVersions(versionId, compareVersionId, organizationId);

    if (!comparison) {
      return res.status(500).json({
        error: 'Comparison failed',
        message: 'Failed to generate version comparison'
      });
    }

    res.json({
      success: true,
      data: comparison
    });
  } catch (error: any) {
    console.error('Error getting diff:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/policies/versions/:versionId/rollback
 * Rollback to a previous version
 * Body: { reason: string }
 */
router.post('/versions/:versionId/rollback', async (req: Request, res: Response) => {
  try {
    const { versionId } = req.params;
    const { reason } = req.body;

    // Validate UUID
    if (!validateUUID(versionId)) {
      return res.status(400).json({
        error: 'Invalid version ID format',
        message: 'Version ID must be a valid UUID'
      });
    }

    // Validate reason
    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({
        error: 'Missing reason',
        message: 'Rollback reason is required'
      });
    }

    if (reason.trim().length < 10) {
      return res.status(400).json({
        error: 'Invalid reason',
        message: 'Rollback reason must be at least 10 characters'
      });
    }

    if (reason.length > 500) {
      return res.status(400).json({
        error: 'Invalid reason',
        message: 'Rollback reason must not exceed 500 characters'
      });
    }

    // Get version to find policyId
    const versionRepository = AppDataSource.getRepository(PolicyVersion);
    const version = await versionRepository.findOne({
      where: { id: versionId }
    });

    if (!version) {
      return res.status(404).json({
        error: 'Version not found',
        message: `Version ${versionId} not found`
      });
    }

    // TODO: Get user from authenticated session
    const mockUser = {
      id: req.headers['x-user-id'] as string || '00000000-0000-0000-0000-000000000000'
    } as any;

    const service = getService();
    const result = await service.rollbackToVersion(
      version.policyId,
      versionId,
      mockUser,
      reason
    );

    if (!result || !result.success) {
      return res.status(500).json({
        error: 'Rollback failed',
        message: 'Failed to rollback policy'
      });
    }

    res.json({
      success: true,
      message: result.message,
      data: {
        updatedPolicy: result.newDraft,
        restoredVersion: result.restoredVersion,
        rollbackMetadata: {
          performedBy: mockUser.id,
          performedAt: new Date(),
          reason,
          targetVersionId: versionId
        }
      }
    });
  } catch (error: any) {
    console.error('Error rolling back version:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * DELETE /api/policies/versions/:versionId
 * Archive a policy version (soft delete)
 */
router.delete('/versions/:versionId', async (req: Request, res: Response) => {
  try {
    const { versionId } = req.params;

    // Validate UUID
    if (!validateUUID(versionId)) {
      return res.status(400).json({
        error: 'Invalid version ID format',
        message: 'Version ID must be a valid UUID'
      });
    }

    // Get version to check status
    const versionRepository = AppDataSource.getRepository(PolicyVersion);
    const version = await versionRepository.findOne({
      where: { id: versionId }
    });

    if (!version) {
      return res.status(404).json({
        error: 'Version not found',
        message: `Version ${versionId} not found`
      });
    }

    // Prevent archiving published versions
    if (version.status === 'published') {
      return res.status(403).json({
        error: 'Cannot archive published version',
        message: 'Published versions cannot be archived'
      });
    }

    // Perform soft delete
    await versionRepository.softDelete(versionId);

    res.json({
      success: true,
      message: 'Version archived successfully',
      data: {
        archivedVersionId: versionId,
        archivedAt: new Date()
      }
    });
  } catch (error: any) {
    console.error('Error archiving version:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;
