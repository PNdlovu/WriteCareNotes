/**
 * @fileoverview policy-impact-analysis.service
 * @module Policy-governance/Policy-impact-analysis.service
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description policy-impact-analysis.service
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyDraft } from '../../entities/policy-draft.entity';
import { PolicyDependency, DependentType, DependencyStrength } from '../../entities/policy-dependency.entity';
import { PolicyDependencyService, DependencyGraph } from './policy-dependency.service';
import { User } from '../../entities/user.entity';

/**
 * Impact Risk Level
 */
export enum ImpactRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Affected Entity Details
 */
export interface AffectedEntity {
  /** Entity ID */
  id: string;
  
  /** Entity type */
  type: DependentType;
  
  /** Entity name/title */
  name: string;
  
  /** Dependency strength */
  dependencyStrength: DependencyStrength;
  
  /** Risk level */
  riskLevel: ImpactRiskLevel;
  
  /** Number of users affected */
  affectedUserCount?: number;
  
  /** Recommended actions */
  recommendedActions: string[];
  
  /** Impact description */
  impactDescription: string;
}

/**
 * Affected Workflows Summary
 */
export interface AffectedWorkflowsSummary {
  /** Total workflow count */
  totalCount: number;
  
  /** Workflows by risk level */
  byRiskLevel: Record<ImpactRiskLevel, number>;
  
  /** All affected workflows */
  workflows: AffectedEntity[];
  
  /** Workflows requiring immediate attention */
  criticalWorkflows: AffectedEntity[];
}

/**
 * Affected Modules Summary
 */
export interface AffectedModulesSummary {
  /** Total module count */
  totalCount: number;
  
  /** Modules by risk level */
  byRiskLevel: Record<ImpactRiskLevel, number>;
  
  /** All affected modules */
  modules: AffectedEntity[];
  
  /** Modules requiring updates */
  criticalModules: AffectedEntity[];
}

/**
 * Change Scope Analysis
 */
export interface ChangeScope {
  /** Total entities affected */
  totalAffected: number;
  
  /** Breakdown by entity type */
  byType: Record<DependentType, number>;
  
  /** Estimated impact radius (0-10) */
  impactRadius: number;
  
  /** Whether change is localized or widespread */
  isLocalized: boolean;
  
  /** Estimated users affected */
  estimatedUserImpact: number;
}

/**
 * Risk Assessment Result
 */
export interface RiskAssessment {
  /** Policy being assessed */
  policyId: string;
  
  /** Overall risk score (0-100) */
  overallRiskScore: number;
  
  /** Risk level */
  riskLevel: ImpactRiskLevel;
  
  /** Risk factors breakdown */
  riskFactors: {
    dependencyCount: number;
    strongDependencies: number;
    criticalWorkflows: number;
    estimatedUserImpact: number;
    changeScope: number;
  };
  
  /** Mitigation recommendations */
  mitigationRecommendations: string[];
  
  /** Approval required */
  requiresApproval: boolean;
}

/**
 * Complete Impact Analysis Report
 */
export interface ImpactAnalysisReport {
  /** Policy being analyzed */
  policy: {
    id: string;
    title: string;
    category: string;
    version: string;
  };
  
  /** Analysis timestamp */
  analyzedAt: Date;
  
  /** Analyzed by user */
  analyzedBy?: {
    id: string;
    name: string;
    email: string;
  };
  
  /** Dependency graph */
  dependencyGraph: DependencyGraph;
  
  /** Risk assessment */
  riskAssessment: RiskAssessment;
  
  /** Affected workflows */
  affectedWorkflows: AffectedWorkflowsSummary;
  
  /** Affected modules */
  affectedModules: AffectedModulesSummary;
  
  /** Change scope */
  changeScope: ChangeScope;
  
  /** Pre-publish checklist */
  prePublishChecklist: {
    item: string;
    completed: boolean;
    required: boolean;
  }[];
  
  /** Change notifications to send */
  notificationsSuggested: {
    recipient: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
  }[];
}

/**
 * PolicyImpactAnalysisService
 * 
 * Provides comprehensive impact analysis for policy changes. This service helps
 * administrators understand the ripple effects of policy modifications before
 * publishing, enabling better change management and risk mitigation.
 * 
 * **Key Capabilities:**
 * - Analyze policy impact on workflows, modules, and other entities
 * - Calculate risk scores and risk levels
 * - Identify affected users and estimate impact scope
 * - Generate pre-publish impact reports
 * - Recommend mitigation strategies
 * - Suggest change notifications
 * 
 * @service
 * @author WriteCareNotes Development Team
 * @since Phase 2 TIER 1 - Feature 3
 */
@Injectable()
export class PolicyImpactAnalysisService {
  private readonly logger = new Logger(PolicyImpactAnalysisService.name);

  constructor(
    @InjectRepository(PolicyDraft)
    private readonly policyRepository: Repository<PolicyDraft>,
    
    @InjectRepository(PolicyDependency)
    private readonly dependencyRepository: Repository<PolicyDependency>,
    
    private readonly dependencyService: PolicyDependencyService
  ) {}

  /**
   * Analyze complete impact of policy changes
   * 
   * Generates a comprehensive impact analysis report including dependency graph,
   * risk assessment, affected entities, and recommended actions.
   * 
   * @param policyId - Policy UUID
   * @param analyzedBy - User performing the analysis (optional)
   * @returns Complete impact analysis report
   * @throws NotFoundException if policy doesn't exist
   * 
   * @example
   * ```typescript
   * const report = await service.analyzeImpact('policy-uuid', currentUser);
   * if (report.riskAssessment.riskLevel === ImpactRiskLevel.CRITICAL) {
   *   console.warn('High-risk change requires approval!');
   * }
   * ```
   */
  async analyzeImpact(
    policyId: string,
    analyzedBy?: User
  ): Promise<ImpactAnalysisReport> {
    this.logger.log(`Analyzing impact for policy ${policyId}`);

    // Get policy
    const policy = await this.policyRepository.findOne({
      where: { id: policyId }
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${policyId} not found`);
    }

    // Build dependency graph
    const dependencyGraph = await this.dependencyService.buildDependencyGraph(policyId);

    // Perform risk assessment
    const riskAssessment = await this.assessRisk(policyId);

    // Get affected workflows
    const affectedWorkflows = await this.getAffectedWorkflows(policyId);

    // Get affected modules
    const affectedModules = await this.getAffectedModules(policyId);

    // Calculate change scope
    const changeScope = await this.calculateChangeScope(policyId);

    // Generate pre-publish checklist
    const prePublishChecklist = this.generatePrePublishChecklist(
      riskAssessment,
      affectedWorkflows,
      affectedModules
    );

    // Suggest change notifications
    const notificationsSuggested = this.suggestNotifications(
      affectedWorkflows,
      affectedModules,
      riskAssessment
    );

    constreport: ImpactAnalysisReport = {
      policy: {
        id: policy.id,
        title: policy.title,
        category: policy.category,
        version: policy.version
      },
      analyzedAt: new Date(),
      analyzedBy: analyzedBy ? {
        id: analyzedBy.id,
        name: `${analyzedBy.firstName} ${analyzedBy.lastName}`,
        email: analyzedBy.email
      } : undefined,
      dependencyGraph,
      riskAssessment,
      affectedWorkflows,
      affectedModules,
      changeScope,
      prePublishChecklist,
      notificationsSuggested
    };

    this.logger.log(`Impact analysis complete: ${changeScope.totalAffected} entities affected, risk level ${riskAssessment.riskLevel}`);

    return report;
  }

  /**
   * Assess risk level for policy changes
   * 
   * Calculates an overall risk score (0-100) and determines risk level
   * based on multiple factors including dependency count, strength,
   * affected users, and change scope.
   * 
   * @param policyId - Policy UUID
   * @returns Risk assessment with score and recommendations
   * 
   * @example
   * ```typescript
   * const assessment = await service.assessRisk('policy-uuid');
   * console.log(`Risk Score: ${assessment.overallRiskScore}/100`);
   * console.log(`Mitigation: ${assessment.mitigationRecommendations.join(', ')}`);
   * ```
   */
  async assessRisk(policyId: string): Promise<RiskAssessment> {
    this.logger.log(`Assessing risk for policy ${policyId}`);

    // Get dependency analysis
    const depAnalysis = await this.dependencyService.analyzePolicyDependencies(policyId);

    // Count critical dependencies
    const strongDependencies = depAnalysis.byStrength[DependencyStrength.STRONG];
    const criticalWorkflows = depAnalysis.allDependencies.filter(
      dep => dep.dependentType === DependentType.WORKFLOW && 
             dep.dependencyStrength === DependencyStrength.STRONG
    ).length;

    // Estimate user impact (mocked for now - TODO: integrate with actual user data)
    const estimatedUserImpact = criticalWorkflows * 20; // Assume 20 users per workflow

    // Calculate change scope
    const scope = await this.calculateChangeScope(policyId);

    // Calculate overall risk score (0-100)
    let riskScore = 0;
    riskScore += Math.min(30, strongDependencies * 10); // Strong deps: up to 30 points
    riskScore += Math.min(20, depAnalysis.totalCount * 2); // Total deps: up to 20 points
    riskScore += Math.min(25, criticalWorkflows * 5); // Critical workflows: up to 25 points
    riskScore += Math.min(15, scope.impactRadius * 1.5); // Impact radius: up to 15 points
    riskScore += Math.min(10, estimatedUserImpact / 10); // User impact: up to 10 points

    // Determine risk level
    letriskLevel: ImpactRiskLevel;
    if (riskScore >= 80) {
      riskLevel = ImpactRiskLevel.CRITICAL;
    } else if (riskScore >= 60) {
      riskLevel = ImpactRiskLevel.HIGH;
    } else if (riskScore >= 30) {
      riskLevel = ImpactRiskLevel.MEDIUM;
    } else {
      riskLevel = ImpactRiskLevel.LOW;
    }

    // Generate mitigation recommendations
    const mitigationRecommendations = this.generateMitigationRecommendations(
      riskLevel,
      strongDependencies,
      criticalWorkflows,
      scope
    );

    // Determine if approval required
    const requiresApproval = riskLevel === ImpactRiskLevel.CRITICAL || 
                            riskLevel === ImpactRiskLevel.HIGH;

    return {
      policyId,
      overallRiskScore: Math.round(riskScore),
      riskLevel,
      riskFactors: {
        dependencyCount: depAnalysis.totalCount,
        strongDependencies,
        criticalWorkflows,
        estimatedUserImpact,
        changeScope: scope.impactRadius
      },
      mitigationRecommendations,
      requiresApproval
    };
  }

  /**
   * Get all workflows affected by this policy
   * 
   * @param policyId - Policy UUID
   * @returns Summary of affected workflows
   * 
   * @example
   * ```typescript
   * const summary = await service.getAffectedWorkflows('policy-uuid');
   * console.log(`${summary.totalCount} workflows affected`);
   * summary.criticalWorkflows.forEach(wf => console.log(`Critical: ${wf.name}`));
   * ```
   */
  async getAffectedWorkflows(policyId: string): Promise<AffectedWorkflowsSummary> {
    this.logger.log(`Getting affected workflows for policy ${policyId}`);

    const dependencies = await this.dependencyService.getPolicyDependencies(policyId);

    const workflowDependencies = dependencies.filter(
      dep => dep.dependentType === DependentType.WORKFLOW
    );

    constworkflows: AffectedEntity[] = workflowDependencies.map(dep => ({
      id: dep.dependentId,
      type: DependentType.WORKFLOW,
      name: `Workflow ${dep.dependentId.substring(0, 8)}`, // TODO: Fetch actual workflow name
      dependencyStrength: dep.dependencyStrength,
      riskLevel: this.mapStrengthToRisk(dep.dependencyStrength),
      affectedUserCount: 20, // TODO: Calculate actual user count
      recommendedActions: this.getRecommendedActions(dep),
      impactDescription: dep.getImpactDescription()
    }));

    const criticalWorkflows = workflows.filter(
      wf => wf.riskLevel === ImpactRiskLevel.CRITICAL || wf.riskLevel === ImpactRiskLevel.HIGH
    );

    constbyRiskLevel: Record<ImpactRiskLevel, number> = {
      [ImpactRiskLevel.LOW]: workflows.filter(w => w.riskLevel === ImpactRiskLevel.LOW).length,
      [ImpactRiskLevel.MEDIUM]: workflows.filter(w => w.riskLevel === ImpactRiskLevel.MEDIUM).length,
      [ImpactRiskLevel.HIGH]: workflows.filter(w => w.riskLevel === ImpactRiskLevel.HIGH).length,
      [ImpactRiskLevel.CRITICAL]: workflows.filter(w => w.riskLevel === ImpactRiskLevel.CRITICAL).length
    };

    return {
      totalCount: workflows.length,
      byRiskLevel,
      workflows,
      criticalWorkflows
    };
  }

  /**
   * Get all modules affected by this policy
   * 
   * @param policyId - Policy UUID
   * @returns Summary of affected modules
   * 
   * @example
   * ```typescript
   * const summary = await service.getAffectedModules('policy-uuid');
   * summary.criticalModules.forEach(mod => 
   *   console.log(`Update required: ${mod.name}`)
   * );
   * ```
   */
  async getAffectedModules(policyId: string): Promise<AffectedModulesSummary> {
    this.logger.log(`Getting affected modules for policy ${policyId}`);

    const dependencies = await this.dependencyService.getPolicyDependencies(policyId);

    const moduleDependencies = dependencies.filter(
      dep => dep.dependentType === DependentType.MODULE
    );

    constmodules: AffectedEntity[] = moduleDependencies.map(dep => ({
      id: dep.dependentId,
      type: DependentType.MODULE,
      name: `Module ${dep.dependentId.substring(0, 8)}`, // TODO: Fetch actual module name
      dependencyStrength: dep.dependencyStrength,
      riskLevel: this.mapStrengthToRisk(dep.dependencyStrength),
      recommendedActions: this.getRecommendedActions(dep),
      impactDescription: dep.getImpactDescription()
    }));

    const criticalModules = modules.filter(
      mod => mod.riskLevel === ImpactRiskLevel.CRITICAL || mod.riskLevel === ImpactRiskLevel.HIGH
    );

    constbyRiskLevel: Record<ImpactRiskLevel, number> = {
      [ImpactRiskLevel.LOW]: modules.filter(m => m.riskLevel === ImpactRiskLevel.LOW).length,
      [ImpactRiskLevel.MEDIUM]: modules.filter(m => m.riskLevel === ImpactRiskLevel.MEDIUM).length,
      [ImpactRiskLevel.HIGH]: modules.filter(m => m.riskLevel === ImpactRiskLevel.HIGH).length,
      [ImpactRiskLevel.CRITICAL]: modules.filter(m => m.riskLevel === ImpactRiskLevel.CRITICAL).length
    };

    return {
      totalCount: modules.length,
      byRiskLevel,
      modules,
      criticalModules
    };
  }

  /**
   * Calculate the scope/breadth of policy changes
   * 
   * Determines how widespread the impact of policy changes will be,
   * including impact radius and whether changes are localized or system-wide.
   * 
   * @param policyId - Policy UUID
   * @returns Change scope analysis
   * 
   * @example
   * ```typescript
   * const scope = await service.calculateChangeScope('policy-uuid');
   * if (!scope.isLocalized) {
   *   console.warn('System-wide impact detected!');
   * }
   * ```
   */
  async calculateChangeScope(policyId: string): Promise<ChangeScope> {
    this.logger.log(`Calculating change scope for policy ${policyId}`);

    const dependencyGraph = await this.dependencyService.buildDependencyGraph(policyId);

    const totalAffected = dependencyGraph.totalDependencies;

    constbyType: Record<DependentType, number> = {
      [DependentType.WORKFLOW]: 0,
      [DependentType.MODULE]: 0,
      [DependentType.TEMPLATE]: 0,
      [DependentType.ASSESSMENT]: 0,
      [DependentType.TRAINING]: 0,
      [DependentType.DOCUMENT]: 0
    };

    dependencyGraph.nodes.forEach(node => {
      if (node.type !== 'policy' && byType[node.type as DependentType] !== undefined) {
        byType[node.type as DependentType]++;
      }
    });

    // Calculate impact radius (0-10)
    // Based on max depth and total affected entities
    const impactRadius = Math.min(
      10,
      Math.round((dependencyGraph.maxDepth * 2) + (totalAffected / 5))
    );

    // Determine if change is localized (impact radius < 3 and total < 5)
    const isLocalized = impactRadius < 3 && totalAffected < 5;

    // Estimate user impact (TODO: integrate with actual user data)
    const estimatedUserImpact = byType[DependentType.WORKFLOW] * 20 + 
                                byType[DependentType.MODULE] * 10;

    return {
      totalAffected,
      byType,
      impactRadius,
      isLocalized,
      estimatedUserImpact
    };
  }

  /**
   * Generate impact report in specified format
   * 
   * @param policyId - Policy UUID
   * @param format - Report format ('json' | 'html' | 'pdf')
   * @param analyzedBy - User generating the report
   * @returns Report content
   * 
   * @example
   * ```typescript
   * const htmlReport = await service.generateImpactReport('policy-uuid', 'html', currentUser);
   * res.send(htmlReport);
   * ```
   */
  async generateImpactReport(
    policyId: string,
    format: 'json' | 'html' | 'pdf',
    analyzedBy?: User
  ): Promise<string | object> {
    this.logger.log(`Generating ${format} impact report for policy ${policyId}`);

    const analysis = await this.analyzeImpact(policyId, analyzedBy);

    if (format === 'json') {
      return analysis;
    }

    if (format === 'html') {
      return this.generateHtmlReport(analysis);
    }

    if (format === 'pdf') {
      // TODO: Implement PDF generation
      throw new Error('PDF generation not yet implemented');
    }

    throw new Error(`Unsupported format: ${format}`);
  }

  // ============================================================
  // PRIVATE HELPER METHODS
  // ============================================================

  /**
   * Map dependency strength to risk level
   */
  private mapStrengthToRisk(strength: DependencyStrength): ImpactRiskLevel {
    switch (strength) {
      case DependencyStrength.STRONG:
        return ImpactRiskLevel.CRITICAL;
      case DependencyStrength.MEDIUM:
        return ImpactRiskLevel.HIGH;
      case DependencyStrength.WEAK:
        return ImpactRiskLevel.MEDIUM;
      default:
        return ImpactRiskLevel.LOW;
    }
  }

  /**
   * Get recommended actions for a dependency
   */
  private getRecommendedActions(dependency: PolicyDependency): string[] {
    constactions: string[] = [];

    if (dependency.dependencyStrength === DependencyStrength.STRONG) {
      actions.push('Test thoroughly before publishing');
      actions.push('Notify all affected users');
      actions.push('Create rollback plan');
    }

    if (dependency.dependencyStrength === DependencyStrength.MEDIUM) {
      actions.push('Review dependent entity');
      actions.push('Notify team leads');
    }

    if (dependency.metadata?.automaticUpdate) {
      actions.push('Will auto-update on policy change');
    } else {
      actions.push('Manual update required');
    }

    return actions;
  }

  /**
   * Generate mitigation recommendations based on risk factors
   */
  private generateMitigationRecommendations(
    riskLevel: ImpactRiskLevel,
    strongDeps: number,
    criticalWorkflows: number,
    scope: ChangeScope
  ): string[] {
    constrecommendations: string[] = [];

    if (riskLevel === ImpactRiskLevel.CRITICAL || riskLevel === ImpactRiskLevel.HIGH) {
      recommendations.push('Obtain approval from senior management before publishing');
      recommendations.push('Create comprehensive rollback plan');
      recommendations.push('Schedule change during low-usage period');
      recommendations.push('Notify all affected users 48 hours in advance');
    }

    if (strongDeps > 0) {
      recommendations.push(`Review ${strongDeps} critical dependencies carefully`);
      recommendations.push('Test all strongly-coupled workflows');
    }

    if (criticalWorkflows > 0) {
      recommendations.push(`Test ${criticalWorkflows} critical workflows before publishing`);
    }

    if (!scope.isLocalized) {
      recommendations.push('System-wide impact detected - consider phased rollout');
      recommendations.push('Monitor system health closely after deployment');
    }

    if (recommendations.length === 0) {
      recommendations.push('Low-risk change - standard review process sufficient');
    }

    return recommendations;
  }

  /**
   * Generate pre-publish checklist
   */
  private generatePrePublishChecklist(
    risk: RiskAssessment,
    workflows: AffectedWorkflowsSummary,
    modules: AffectedModulesSummary
  ): { item: string; completed: boolean; required: boolean }[] {
    constchecklist: { item: string; completed: boolean; required: boolean }[] = [];

    // Always required
    checklist.push({
      item: 'Review all policy changes',
      completed: false,
      required: true
    });

    checklist.push({
      item: 'Verify regulatory compliance',
      completed: false,
      required: true
    });

    // Risk-based requirements
    if (risk.requiresApproval) {
      checklist.push({
        item: 'Obtain management approval',
        completed: false,
        required: true
      });
    }

    if (workflows.criticalWorkflows.length > 0) {
      checklist.push({
        item: `Test ${workflows.criticalWorkflows.length} critical workflows`,
        completed: false,
        required: true
      });
    }

    if (modules.criticalModules.length > 0) {
      checklist.push({
        item: `Update ${modules.criticalModules.length} dependent modules`,
        completed: false,
        required: true
      });
    }

    if (risk.overallRiskScore > 50) {
      checklist.push({
        item: 'Create rollback plan',
        completed: false,
        required: true
      });

      checklist.push({
        item: 'Schedule change notification',
        completed: false,
        required: true
      });
    }

    // Optional items
    checklist.push({
      item: 'Review with stakeholders',
      completed: false,
      required: false
    });

    checklist.push({
      item: 'Update training materials',
      completed: false,
      required: false
    });

    return checklist;
  }

  /**
   * Suggest change notifications
   */
  private suggestNotifications(
    workflows: AffectedWorkflowsSummary,
    modules: AffectedModulesSummary,
    risk: RiskAssessment
  ): { recipient: string; message: string; priority: 'low' | 'medium' | 'high' }[] {
    constnotifications: { recipient: string; message: string; priority: 'low' | 'medium' | 'high' }[] = [];

    if (risk.riskLevel === ImpactRiskLevel.CRITICAL) {
      notifications.push({
        recipient: 'All Staff',
        message: 'Critical policy update affecting core workflows - review required',
        priority: 'high'
      });
    }

    if (workflows.criticalWorkflows.length > 0) {
      notifications.push({
        recipient: 'Workflow Owners',
        message: `${workflows.criticalWorkflows.length} workflows require attention`,
        priority: 'high'
      });
    }

    if (modules.criticalModules.length > 0) {
      notifications.push({
        recipient: 'Module Administrators',
        message: `${modules.criticalModules.length} modules need updates`,
        priority: 'medium'
      });
    }

    if (risk.overallRiskScore > 30) {
      notifications.push({
        recipient: 'Compliance Team',
        message: 'Policy change for review and approval',
        priority: 'medium'
      });
    }

    return notifications;
  }

  /**
   * Generate HTML report
   */
  private generateHtmlReport(analysis: ImpactAnalysisReport): string {
    // TODO: Implement proper HTML template
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Policy Impact Analysis Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .risk-critical { color: red; font-weight: bold; }
            .risk-high { color: orange; font-weight: bold; }
            .risk-medium { color: #ff9900; }
            .risk-low { color: green; }
          </style>
        </head>
        <body>
          <h1>Policy Impact Analysis Report</h1>
          <p><strong>Policy:</strong> ${analysis.policy.title}</p>
          <p><strong>Analyzed At:</strong> ${analysis.analyzedAt.toISOString()}</p>
          <p><strong>Risk Level:</strong> <span class="risk-${analysis.riskAssessment.riskLevel}">${analysis.riskAssessment.riskLevel.toUpperCase()}</span></p>
          <p><strong>Risk Score:</strong> ${analysis.riskAssessment.overallRiskScore}/100</p>
          <p><strong>Total Affected:</strong> ${analysis.changeScope.totalAffected} entities</p>
          
          <h2>Affected Workflows: ${analysis.affectedWorkflows.totalCount}</h2>
          <ul>
            ${analysis.affectedWorkflows.workflows.map(wf => `<li>${wf.name} (${wf.riskLevel})</li>`).join('')}
          </ul>
          
          <h2>Mitigation Recommendations</h2>
          <ul>
            ${analysis.riskAssessment.mitigationRecommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </body>
      </html>
    `;
  }
}
