/**
 * @fileoverview policy-dependency.service
 * @module Policy-governance/Policy-dependency.service
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description policy-dependency.service
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyDependency, DependentType, DependencyStrength } from '../../entities/policy-dependency.entity';
import { PolicyDraft } from '../../entities/policy-draft.entity';
import { User } from '../../entities/user.entity';

/**
 * Dependency Node for Graph Representation
 */
export interface DependencyNode {
  /** Unique identifier of the node */
  id: string;
  
  /** Type of the node (policy, workflow, module, etc.) */
  type: string;
  
  /** Display label for the node */
  label: string;
  
  /** Metadata about the node */
  metadata?: Record<string, any>;
  
  /** Dependencies of this node */
  dependencies?: DependencyEdge[];
  
  /** Depth in the dependency tree (0 = root) */
  depth: number;
}

/**
 * Dependency Edge for Graph Representation
 */
export interface DependencyEdge {
  /** Source node ID */
  from: string;
  
  /** Target node ID */
  to: string;
  
  /** Dependency strength */
  strength: DependencyStrength;
  
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Complete Dependency Graph
 */
export interface DependencyGraph {
  /** Root policy node */
  rootPolicy: DependencyNode;
  
  /** All nodes in the graph */
  nodes: DependencyNode[];
  
  /** All edges in the graph */
  edges: DependencyEdge[];
  
  /** Total dependency count */
  totalDependencies: number;
  
  /** Breakdown by strength */
  strengthBreakdown: {
    strong: number;
    medium: number;
    weak: number;
  };
  
  /** Breakdown by type */
  typeBreakdown: Record<string, number>;
  
  /** Maximum depth of dependency tree */
  maxDepth: number;
}

/**
 * Dependency Analysis Result
 */
export interface DependencyAnalysis {
  /** Policy being analyzed */
  policyId: string;
  
  /** Total dependencies */
  totalCount: number;
  
  /** Dependencies by type */
  byType: Record<DependentType, number>;
  
  /** Dependencies by strength */
  byStrength: Record<DependencyStrength, number>;
  
  /** Critical dependencies (strong) */
  criticalDependencies: PolicyDependency[];
  
  /** All dependencies */
  allDependencies: PolicyDependency[];
  
  /** Overall risk score (0-100) */
  riskScore: number;
}

/**
 * Create Dependency DTO
 */
export interface CreateDependencyDto {
  policyId: string;
  dependentType: DependentType;
  dependentId: string;
  dependencyStrength: DependencyStrength;
  metadata?: Record<string, any>;
  notes?: string;
}

/**
 * PolicyDependencyService
 * 
 * Manages policy dependencies and provides impact analysis capabilities.
 * This service enables administrators to track which system entities depend on
 * each policy, calculate impact scores, and build dependency graphs for visualization.
 * 
 * **Key Capabilities:**
 * - Track dependencies between policies and workflows/modules/templates
 * - Build dependency graphs with recursive traversal
 * - Calculate dependency strength and risk scores
 * - Analyze policy impact before publishing changes
 * - Generate impact reports for change management
 * 
 * @service
 * @author WriteCareNotes Development Team
 * @since Phase 2 TIER 1 - Feature 3
 */
@Injectable()
export class PolicyDependencyService {
  private readonlylogger = new Logger(PolicyDependencyService.name);

  const ructor(
    @InjectRepository(PolicyDependency)
    private readonlydependencyRepository: Repository<PolicyDependency>,
    
    @InjectRepository(PolicyDraft)
    private readonlypolicyRepository: Repository<PolicyDraft>
  ) {}

  /**
   * Create a new dependency relationship
   * 
   * @param createDto - Dependency creation data
   * @param createdBy - User creating the dependency
   * @returns Created dependency
   * @throws BadRequestException if dependency already exists
   * @throws NotFoundException if policy doesn't exist
   * 
   * @example
   * ```typescript
   * const dependency = await service.createDependency({
   *   policyId: 'policy-uuid',
   *   dependentType: DependentType.WORKFLOW,
   *   dependentId: 'workflow-uuid',
   *   dependencyStrength: DependencyStrength.STRONG
   * }, currentUser);
   * ```
   */
  async createDependency(
    createDto: CreateDependencyDto,
    createdBy?: User
  ): Promise<PolicyDependency> {
    this.logger.log(`Creating dependency: ${createDto.policyId} -> ${createDto.dependentType}:${createDto.dependentId}`);

    // Verify policy exists
    const policy = await this.policyRepository.findOne({
      where: { id: createDto.policyId }
    });

    if (!policy) {
      throw new NotFoundException(`Policy with ID ${createDto.policyId} not found`);
    }

    // Check for existing dependency
    const existing = await this.dependencyRepository.findOne({
      where: {
        policyId: createDto.policyId,
        dependentType: createDto.dependentType,
        dependentId: createDto.dependentId
      }
    });

    if (existing && existing.isActive) {
      throw new BadRequestException('Dependency already exists for this policy and dependent entity');
    }

    // Create new dependency
    const dependency = this.dependencyRepository.create({
      policyId: createDto.policyId,
      policy,
      dependentType: createDto.dependentType,
      dependentId: createDto.dependentId,
      dependencyStrength: createDto.dependencyStrength,
      metadata: createDto.metadata,
      notes: createDto.notes,
      createdBy,
      isActive: true
    });

    const saved = await this.dependencyRepository.save(dependency);
    
    this.logger.log(`Created dependency ${saved.id} with strength ${saved.dependencyStrength}`);
    
    return saved;
  }

  /**
   * Get all dependencies for a specific policy
   * 
   * @param policyId - Policy UUID
   * @param includeInactive - Include inactive dependencies (default: false)
   * @returns Array of dependencies
   * 
   * @example
   * ```typescript
   * const deps = await service.getPolicyDependencies('policy-uuid');
   * console.log(`Policy has ${deps.length} active dependencies`);
   * ```
   */
  async getPolicyDependencies(
    policyId: string,
    includeInactive: boolean = false
  ): Promise<PolicyDependency[]> {
    const whereClause: any = { policyId };
    
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    const dependencies = await this.dependencyRepository.find({
      where: whereClause,
      relations: ['createdBy'],
      order: { dependencyStrength: 'DESC', createdAt: 'ASC' }
    });

    this.logger.log(`Found ${dependencies.length} dependencies for policy ${policyId}`);
    
    return dependencies;
  }

  /**
   * Analyze all dependencies for a policy
   * 
   * Provides comprehensive breakdown of dependencies by type and strength,
   * identifies critical dependencies, and calculates an overall risk score.
   * 
   * @param policyId - Policy UUID
   * @returns Dependency analysis with risk assessment
   * 
   * @example
   * ```typescript
   * const analysis = await service.analyzePolicyDependencies('policy-uuid');
   * if (analysis.riskScore > 70) {
   *   console.warn('High-risk policychange!');
   * }
   * ```
   */
  async analyzePolicyDependencies(policyId: string): Promise<DependencyAnalysis> {
    this.logger.log(`Analyzing dependencies for policy ${policyId}`);

    const allDependencies = await this.getPolicyDependencies(policyId, false);

    // Initialize counters
    const byType: Record<DependentType, number> = {
      [DependentType.WORKFLOW]: 0,
      [DependentType.MODULE]: 0,
      [DependentType.TEMPLATE]: 0,
      [DependentType.ASSESSMENT]: 0,
      [DependentType.TRAINING]: 0,
      [DependentType.DOCUMENT]: 0
    };

    const byStrength: Record<DependencyStrength, number> = {
      [DependencyStrength.STRONG]: 0,
      [DependencyStrength.MEDIUM]: 0,
      [DependencyStrength.WEAK]: 0
    };

    // Count by type and strength
    allDependencies.forEach(dep => {
      byType[dep.dependentType]++;
      byStrength[dep.dependencyStrength]++;
    });

    // Find critical dependencies (strong only)
    const criticalDependencies = allDependencies.filter(
      dep => dep.dependencyStrength === DependencyStrength.STRONG
    );

    // Calculate risk score (0-100)
    // Formula: (strong * 10) + (medium * 5) + (weak * 2), capped at 100
    const riskScore = Math.min(
      100,
      (byStrength[DependencyStrength.STRONG] * 10) +
      (byStrength[DependencyStrength.MEDIUM] * 5) +
      (byStrength[DependencyStrength.WEAK] * 2)
    );

    this.logger.log(`Analysiscomplete: ${allDependencies.length} deps, riskscore: ${riskScore}`);

    return {
      policyId,
      totalCount: allDependencies.length,
      byType,
      byStrength,
      criticalDependencies,
      allDependencies,
      riskScore
    };
  }

  /**
   * Build a complete dependency graph for visualization
   * 
   * Creates a graph structure with nodes and edges suitable for visualization
   * libraries like D3.js or react-flow. Includes recursive traversal for
   * nested dependencies.
   * 
   * @param policyId - Root policy UUID
   * @param maxDepth - Maximum recursion depth (default: 5)
   * @returns Complete dependency graph
   * 
   * @example
   * ```typescript
   * const graph = await service.buildDependencyGraph('policy-uuid', 3);
   * renderGraph(graph.nodes, graph.edges);
   * ```
   */
  async buildDependencyGraph(
    policyId: string,
    maxDepth: number = 5
  ): Promise<DependencyGraph> {
    this.logger.log(`Building dependency graph for policy ${policyId}, max depth ${maxDepth}`);

    // Get root policy
    const rootPolicy = await this.policyRepository.findOne({
      where: { id: policyId }
    });

    if (!rootPolicy) {
      throw new NotFoundException(`Policy with ID ${policyId} not found`);
    }

    // Initialize graph structures
    const nodes: DependencyNode[] = [];
    const edges: DependencyEdge[] = [];
    const visited = new Set<string>();
    const strengthBreakdown = { strong: 0, medium: 0, weak: 0 };
    const typeBreakdown: Record<string, number> = {};
    let actualMaxDepth = 0;

    // Create root node
    const rootNode: DependencyNode = {
      id: rootPolicy.id,
      type: 'policy',
      label: rootPolicy.title,
      metadata: {
        category: rootPolicy.category,
        status: rootPolicy.status,
        version: rootPolicy.version
      },
      depth: 0
    };

    nodes.push(rootNode);
    visited.add(rootPolicy.id);

    // Recursive function to traverse dependencies
    const traverse = async (
      nodeId: string,
      nodeType: string,
      currentDepth: number
    ): Promise<void> => {
      if (currentDepth >= maxDepth) return;

      // Only traverse policy nodes (workflows/modules don't have dependencies)
      if (nodeType !== 'policy') return;

      const dependencies = await this.getPolicyDependencies(nodeId, false);

      for (const dep of dependencies) {
        const childId = dep.dependentId;
        const childType = dep.dependentType;

        // Update statistics
        strengthBreakdown[dep.dependencyStrength]++;
        typeBreakdown[childType] = (typeBreakdown[childType] || 0) + 1;
        actualMaxDepth = Math.max(actualMaxDepth, currentDepth + 1);

        // Create edge
        edges.push({
          from: nodeId,
          to: childId,
          strength: dep.dependencyStrength,
          riskLevel: dep.getRiskLevel(),
          metadata: dep.metadata
        });

        // Create node if not visited
        if (!visited.has(childId)) {
          visited.add(childId);

          const childNode: DependencyNode = {
            id: childId,
            type: childType,
            label: `${childType.charAt(0).toUpperCase()}${childType.slice(1)} ${childId.substring(0, 8)}`,
            metadata: dep.metadata,
            depth: currentDepth + 1
          };

          nodes.push(childNode);

          // Recursively traverse if this is also a policy
          if (childType === DependentType.TEMPLATE) {
            await traverse(childId, 'policy', currentDepth + 1);
          }
        }
      }
    };

    // Start traversal from root
    await traverse(policyId, 'policy', 0);

    this.logger.log(`Graph built: ${nodes.length} nodes, ${edges.length} edges, max depth ${actualMaxDepth}`);

    return {
      rootPolicy: rootNode,
      nodes,
      edges,
      totalDependencies: edges.length,
      strengthBreakdown,
      typeBreakdown,
      maxDepth: actualMaxDepth
    };
  }

  /**
   * Calculate dependency strength based on usage patterns
   * 
   * Analyzes how a dependent entity uses the policy to automatically
   * determine appropriate dependency strength.
   * 
   * @param policyId - Policy UUID
   * @param dependentType - Type of dependent entity
   * @param dependentId - Dependent entity UUID
   * @returns Recommended dependency strength
   * 
   * @example
   * ```typescript
   * const strength = await service.calculateDependencyStrength(
   *   'policy-uuid',
   *   DependentType.WORKFLOW,
   *   'workflow-uuid'
   * );
   * // Returns: DependencyStrength.STRONG
   * ```
   */
  async calculateDependencyStrength(
    policyId: string,
    dependentType: DependentType,
    dependentId: string
  ): Promise<DependencyStrength> {
    // TODO: Implement actual analysis based on usage patterns
    // For now, return heuristic-based strength:
    // - Workflows that enforcepolicies: STRONG
    // - Modules that referencepolicies: MEDIUM
    // - Templates derived frompolicies: MEDIUM
    // - Documents that linkpolicies: WEAK
    // - Assessments that checkpolicies: MEDIUM
    // - Training modules aboutpolicies: WEAK

    const strengthMap: Record<DependentType, DependencyStrength> = {
      [DependentType.WORKFLOW]: DependencyStrength.STRONG,
      [DependentType.MODULE]: DependencyStrength.MEDIUM,
      [DependentType.TEMPLATE]: DependencyStrength.MEDIUM,
      [DependentType.ASSESSMENT]: DependencyStrength.MEDIUM,
      [DependentType.TRAINING]: DependencyStrength.WEAK,
      [DependentType.DOCUMENT]: DependencyStrength.WEAK
    };

    return strengthMap[dependentType] || DependencyStrength.MEDIUM;
  }

  /**
   * Update an existing dependency
   * 
   * @param dependencyId - Dependency UUID
   * @param updates - Fields to update
   * @returns Updated dependency
   * @throws NotFoundException if dependency doesn't exist
   * 
   * @example
   * ```typescript
   * const updated = await service.updateDependency('dep-uuid', {
   *   dependencyStrength: DependencyStrength.WEAK,
   *   notes: 'Reduced impact after workflow redesign'
   * });
   * ```
   */
  async updateDependency(
    dependencyId: string,
    updates: Partial<PolicyDependency>
  ): Promise<PolicyDependency> {
    const dependency = await this.dependencyRepository.findOne({
      where: { id: dependencyId }
    });

    if (!dependency) {
      throw new NotFoundException(`Dependency with ID ${dependencyId} not found`);
    }

    Object.assign(dependency, updates);
    
    const saved = await this.dependencyRepository.save(dependency);
    
    this.logger.log(`Updated dependency ${dependencyId}`);
    
    return saved;
  }

  /**
   * Delete a dependency (soft delete by marking inactive)
   * 
   * @param dependencyId - Dependency UUID
   * @param hardDelete - Permanently delete instead of soft delete (default: false)
   * @returns Success boolean
   * @throws NotFoundException if dependency doesn't exist
   * 
   * @example
   * ```typescript
   * await service.deleteDependency('dep-uuid', false); // Soft delete
   * await service.deleteDependency('dep-uuid', true);  // Hard delete
   * ```
   */
  async deleteDependency(
    dependencyId: string,
    hardDelete: boolean = false
  ): Promise<boolean> {
    const dependency = await this.dependencyRepository.findOne({
      where: { id: dependencyId }
    });

    if (!dependency) {
      throw new NotFoundException(`Dependency with ID ${dependencyId} not found`);
    }

    if (hardDelete) {
      await this.dependencyRepository.remove(dependency);
      this.logger.log(`Hard deleted dependency ${dependencyId}`);
    } else {
      dependency.isActive = false;
      await this.dependencyRepository.save(dependency);
      this.logger.log(`Soft deleted dependency ${dependencyId}`);
    }

    return true;
  }

  /**
   * Bulk create dependencies
   * 
   * @param dependencies - Array of dependency creation DTOs
   * @param createdBy - User creating the dependencies
   * @returns Array of created dependencies
   * 
   * @example
   * ```typescript
   * const deps = await service.bulkCreateDependencies([
   *   { policyId: 'p1', dependentType: 'workflow', dependentId: 'w1', dependencyStrength: 'strong' },
   *   { policyId: 'p1', dependentType: 'module', dependentId: 'm1', dependencyStrength: 'medium' }
   * ], currentUser);
   * ```
   */
  async bulkCreateDependencies(
    dependencies: CreateDependencyDto[],
    createdBy?: User
  ): Promise<PolicyDependency[]> {
    this.logger.log(`Bulk creating ${dependencies.length} dependencies`);

    const created: PolicyDependency[] = [];

    for (const dto of dependencies) {
      try {
        const dep = await this.createDependency(dto, createdBy);
        created.push(dep);
      } catch (error) {
        this.logger.warn(`Failed to createdependency: ${error.message}`);
        // Continue with other dependencies
      }
    }

    this.logger.log(`Successfully created ${created.length}/${dependencies.length} dependencies`);

    return created;
  }
}
