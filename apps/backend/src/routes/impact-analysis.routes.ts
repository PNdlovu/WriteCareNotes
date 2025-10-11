import { Router, Request, Response, NextFunction } from 'express';
import { validate as isUUID } from 'uuid';
import { PolicyDependencyService } from '../services/policy-governance/policy-dependency.service';
import { PolicyImpactAnalysisService } from '../services/policy-governance/policy-impact-analysis.service';
import { DependentType, DependencyStrength } from '../entities/policy-dependency.entity';

/**
 * Impact Analysis Routes
 * 
 * REST API endpoints for policy impact analysis and dependency management.
 * 
 * @module ImpactAnalysisRoutes
 * @version 1.0.0
 * @since Phase 2 TIER 1 - Feature 3
 */

const router = Router();

// ============================================================
// IMPACT ANALYSIS ENDPOINTS
// ============================================================

/**
 * GET /api/policy/:policyId/dependencies
 * Get complete dependency graph for a policy
 */
router.get(
  '/policy/:policyId/dependencies',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dependencyService: PolicyDependencyService = req.app.get('dependencyService');
      const { policyId } = req.params;
      const maxDepth = req.query.maxDepth ? parseInt(req.query.maxDepth as string) : 5;

      if (!isUUID(policyId)) {
        return res.status(400).json({ error: 'Invalid policy ID' });
      }

      const graph = await dependencyService.buildDependencyGraph(policyId, maxDepth);

      res.json({ success: true, data: graph });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/policy/:policyId/impact-analysis
 * Get complete impact analysis report
 */
router.get(
  '/policy/:policyId/impact-analysis',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const impactService: PolicyImpactAnalysisService = req.app.get('impactAnalysisService');
      const { policyId } = req.params;

      if (!isUUID(policyId)) {
        return res.status(400).json({ error: 'Invalid policy ID' });
      }

      const analysis = await impactService.analyzeImpact(policyId);

      res.json({ success: true, data: analysis });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/policy/:policyId/affected-workflows
 * Get all workflows affected by this policy
 */
router.get(
  '/policy/:policyId/affected-workflows',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const impactService: PolicyImpactAnalysisService = req.app.get('impactAnalysisService');
      const { policyId } = req.params;

      if (!isUUID(policyId)) {
        return res.status(400).json({ error: 'Invalid policy ID' });
      }

      const workflows = await impactService.getAffectedWorkflows(policyId);

      res.json({ success: true, data: workflows });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/policy/:policyId/affected-modules
 * Get all modules affected by this policy
 */
router.get(
  '/policy/:policyId/affected-modules',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const impactService: PolicyImpactAnalysisService = req.app.get('impactAnalysisService');
      const { policyId } = req.params;

      if (!isUUID(policyId)) {
        return res.status(400).json({ error: 'Invalid policy ID' });
      }

      const modules = await impactService.getAffectedModules(policyId);

      res.json({ success: true, data: modules });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/policy/:policyId/analyze-changes
 * Analyze policy changes before publishing
 */
router.post(
  '/policy/:policyId/analyze-changes',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const impactService: PolicyImpactAnalysisService = req.app.get('impactAnalysisService');
      const { policyId } = req.params;
      const { changes } = req.body;

      if (!isUUID(policyId)) {
        return res.status(400).json({ error: 'Invalid policy ID' });
      }

      const analysis = await impactService.analyzeImpact(policyId);

      let recommendation: 'proceed' | 'review' | 'block';
      if (analysis.riskAssessment.riskLevel === 'critical') {
        recommendation = 'block';
      } else if (analysis.riskAssessment.riskLevel === 'high') {
        recommendation = 'review';
      } else {
        recommendation = 'proceed';
      }

      res.json({
        success: true,
        data: {
          analysis,
          recommendation,
          requiresApproval: analysis.riskAssessment.requiresApproval,
          estimatedImpact: {
            totalAffected: analysis.changeScope.totalAffected,
            riskScore: analysis.riskAssessment.overallRiskScore,
            criticalWorkflows: analysis.affectedWorkflows.criticalWorkflows.length
          },
          changes: changes || 'No change description provided'
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/policy/:policyId/risk-assessment
 * Get risk assessment for policy changes
 */
router.get(
  '/policy/:policyId/risk-assessment',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const impactService: PolicyImpactAnalysisService = req.app.get('impactAnalysisService');
      const { policyId } = req.params;

      if (!isUUID(policyId)) {
        return res.status(400).json({ error: 'Invalid policy ID' });
      }

      const riskAssessment = await impactService.assessRisk(policyId);

      res.json({ success: true, data: riskAssessment });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/policy/:policyId/change-scope
 * Get change scope analysis
 */
router.get(
  '/policy/:policyId/change-scope',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const impactService: PolicyImpactAnalysisService = req.app.get('impactAnalysisService');
      const { policyId } = req.params;

      if (!isUUID(policyId)) {
        return res.status(400).json({ error: 'Invalid policy ID' });
      }

      const changeScope = await impactService.calculateChangeScope(policyId);

      res.json({ success: true, data: changeScope });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/policy/:policyId/impact-report
 * Generate impact report in specified format
 */
router.get(
  '/policy/:policyId/impact-report',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const impactService: PolicyImpactAnalysisService = req.app.get('impactAnalysisService');
      const { policyId } = req.params;
      const format = (req.query.format as 'json' | 'html' | 'pdf') || 'json';

      if (!isUUID(policyId)) {
        return res.status(400).json({ error: 'Invalid policy ID' });
      }

      const report = await impactService.generateImpactReport(policyId, format);

      if (format === 'html') {
        res.setHeader('Content-Type', 'text/html');
        res.send(report);
      } else if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.send(report);
      } else {
        res.json({ success: true, data: report });
      }
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// DEPENDENCY MANAGEMENT ENDPOINTS
// ============================================================

/**
 * POST /api/policy/:policyId/dependencies
 * Create a new dependency relationship
 */
router.post(
  '/policy/:policyId/dependencies',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dependencyService: PolicyDependencyService = req.app.get('dependencyService');
      const { policyId } = req.params;
      const { dependentType, dependentId, dependencyStrength, metadata, notes } = req.body;

      if (!isUUID(policyId) || !isUUID(dependentId)) {
        return res.status(400).json({ error: 'Invalid policy or dependent ID' });
      }

      const dependency = await dependencyService.createDependency({
        policyId,
        dependentType: dependentType as DependentType,
        dependentId,
        dependencyStrength: dependencyStrength as DependencyStrength,
        metadata,
        notes
      });

      res.status(201).json({
        success: true,
        data: dependency,
        message: 'Dependency created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/dependencies/:dependencyId
 * Update an existing dependency
 */
router.put(
  '/dependencies/:dependencyId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dependencyService: PolicyDependencyService = req.app.get('dependencyService');
      const { dependencyId } = req.params;
      const updates = req.body;

      if (!isUUID(dependencyId)) {
        return res.status(400).json({ error: 'Invalid dependency ID' });
      }

      const dependency = await dependencyService.updateDependency(dependencyId, updates);

      res.json({
        success: true,
        data: dependency,
        message: 'Dependency updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/dependencies/:dependencyId
 * Delete a dependency (soft delete by default)
 */
router.delete(
  '/dependencies/:dependencyId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dependencyService: PolicyDependencyService = req.app.get('dependencyService');
      const { dependencyId } = req.params;
      const hardDelete = req.query.hardDelete === 'true';

      if (!isUUID(dependencyId)) {
        return res.status(400).json({ error: 'Invalid dependency ID' });
      }

      await dependencyService.deleteDependency(dependencyId, hardDelete);

      res.json({
        success: true,
        message: `Dependency ${hardDelete ? 'permanently deleted' : 'deactivated'} successfully`
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/dependencies/bulk
 * Bulk create dependencies
 */
router.post(
  '/dependencies/bulk',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dependencyService: PolicyDependencyService = req.app.get('dependencyService');
      const { dependencies } = req.body;

      if (!Array.isArray(dependencies)) {
        return res.status(400).json({ error: 'Dependencies must be an array' });
      }

      const created = await dependencyService.bulkCreateDependencies(dependencies);

      res.status(201).json({
        success: true,
        data: created,
        message: `Successfully created ${created.length}/${dependencies.length} dependencies`
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
