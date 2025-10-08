import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique
} from 'typeorm';
import { PolicyDraft } from './policy-draft.entity';
import { User } from './user.entity';

/**
 * Dependency type enumeration
 * Defines the types of entities that can depend on a policy
 */
export enum DependentType {
  /** Care workflow that references this policy */
  WORKFLOW = 'workflow',
  
  /** System module that uses this policy */
  MODULE = 'module',
  
  /** Policy template derived from this policy */
  TEMPLATE = 'template',
  
  /** Assessment form that references this policy */
  ASSESSMENT = 'assessment',
  
  /** Training module linked to this policy */
  TRAINING = 'training',
  
  /** Document template that includes this policy */
  DOCUMENT = 'document'
}

/**
 * Dependency strength enumeration
 * Indicates how tightly coupled the dependent entity is to the policy
 */
export enum DependencyStrength {
  /** Critical dependency - changes will break functionality */
  STRONG = 'strong',
  
  /** Moderate dependency - changes may require adjustments */
  MEDIUM = 'medium',
  
  /** Weak dependency - changes have minimal impact */
  WEAK = 'weak'
}

/**
 * PolicyDependency Entity
 * 
 * Tracks dependencies between policies and other system entities (workflows, modules, templates, etc.).
 * This enables impact analysis before publishing policy changes, helping administrators understand
 * the ripple effects of policy modifications.
 * 
 * @example
 * ```typescript
 * // Creating a strong workflow dependency
 * const dependency = new PolicyDependency();
 * dependency.policy = medicationPolicy;
 * dependency.dependentType = DependentType.WORKFLOW;
 * dependency.dependentId = 'medication-administration-workflow-uuid';
 * dependency.dependencyStrength = DependencyStrength.STRONG;
 * dependency.createdBy = currentUser;
 * await dependencyRepository.save(dependency);
 * ```
 * 
 * @entity policy_dependencies
 */
@Entity('policy_dependencies')
@Unique(['policy', 'dependentType', 'dependentId']) // Prevent duplicate dependencies
@Index(['policy']) // Fast lookup by policy
@Index(['dependentType', 'dependentId']) // Fast lookup by dependent entity
@Index(['dependencyStrength']) // Filter by strength
export class PolicyDependency {
  /**
   * Unique identifier for this dependency relationship
   * @primary
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The policy being depended upon
   * @relation PolicyDraft
   * @cascade on delete (remove dependency when policy is deleted)
   */
  @ManyToOne(() => PolicyDraft, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'policy_id' })
  policy: PolicyDraft;

  /**
   * Foreign key to the policy
   * @indexed
   */
  @Column('uuid')
  @Index()
  policyId: string;

  /**
   * Type of the dependent entity
   * @enum DependentType
   * @required
   * 
   * Determines what kind of entity depends on this policy.
   * Used for targeted impact analysis and categorization.
   */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: false
  })
  dependentType: DependentType;

  /**
   * Unique identifier of the dependent entity
   * @required
   * 
   * UUID of the workflow, module, template, etc. that depends on this policy.
   * Combined with dependentType to uniquely identify the dependent entity.
   */
  @Column({
    type: 'uuid',
    nullable: false
  })
  @Index()
  dependentId: string;

  /**
   * Strength of the dependency relationship
   * @enum DependencyStrength
   * @default DependencyStrength.MEDIUM
   * 
   * Indicates how critical this dependency is:
   * - STRONG: Changes to the policy will break the dependent entity
   * - MEDIUM: Changes may require adjustments to the dependent entity
   * - WEAK: Changes have minimal impact on the dependent entity
   */
  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: DependencyStrength.MEDIUM
  })
  dependencyStrength: DependencyStrength;

  /**
   * Additional metadata about the dependency
   * @optional
   * 
   * JSON object storing additional information:
   * - impactDescription: Human-readable description of the impact
   * - affectedSections: Which policy sections are referenced
   * - automaticUpdate: Whether dependent can auto-update on policy change
   * - migrationPath: Steps to update dependent when policy changes
   */
  @Column({
    type: 'jsonb',
    nullable: true
  })
  metadata?: {
    impactDescription?: string;
    affectedSections?: string[];
    automaticUpdate?: boolean;
    migrationPath?: string;
    [key: string]: any;
  };

  /**
   * User who created this dependency relationship
   * @relation User
   * @optional
   */
  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'created_by' })
  createdBy?: User;

  /**
   * Foreign key to the creating user
   */
  @Column({ type: 'uuid', nullable: true })
  createdById?: string;

  /**
   * Timestamp when the dependency was created
   * @auto-generated
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when the dependency was last updated
   * @auto-generated
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Optional notes about this dependency
   * @optional
   * 
   * Free-text field for administrators to document why this dependency
   * exists, special considerations, or migration notes.
   */
  @Column({
    type: 'text',
    nullable: true
  })
  notes?: string;

  /**
   * Whether this dependency is currently active
   * @default true
   * 
   * Inactive dependencies are preserved for historical tracking but
   * excluded from impact analysis calculations.
   */
  @Column({
    type: 'boolean',
    default: true
  })
  isActive: boolean;

  /**
   * Risk level associated with modifying the policy given this dependency
   * @computed
   * 
   * Calculated based on dependencyStrength and other factors.
   * Values: 'low' | 'medium' | 'high' | 'critical'
   */
  getRiskLevel(): 'low' | 'medium' | 'high' | 'critical' {
    switch (this.dependencyStrength) {
      case DependencyStrength.STRONG:
        return 'critical';
      case DependencyStrength.MEDIUM:
        return 'high';
      case DependencyStrength.WEAK:
        return 'medium';
      default:
        return 'low';
    }
  }

  /**
   * Get a human-readable description of this dependency
   * @returns Description string
   */
  getDescription(): string {
    const typeLabel = this.dependentType.charAt(0).toUpperCase() + this.dependentType.slice(1);
    const strengthLabel = this.dependencyStrength.toUpperCase();
    return `${strengthLabel} dependency: ${typeLabel} (${this.dependentId})`;
  }

  /**
   * Check if this dependency allows automatic updates
   * @returns Whether dependent entity can auto-update when policy changes
   */
  allowsAutomaticUpdate(): boolean {
    return this.metadata?.automaticUpdate === true && 
           this.dependencyStrength !== DependencyStrength.STRONG;
  }

  /**
   * Get the impact description for this dependency
   * @returns Impact description or default message
   */
  getImpactDescription(): string {
    return this.metadata?.impactDescription || 
           `Changes to this policy may affect the ${this.dependentType}`;
  }

  /**
   * Convert entity to JSON for API responses
   * @returns JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      policyId: this.policyId,
      dependentType: this.dependentType,
      dependentId: this.dependentId,
      dependencyStrength: this.dependencyStrength,
      riskLevel: this.getRiskLevel(),
      metadata: this.metadata,
      notes: this.notes,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy ? {
        id: this.createdBy.id,
        name: `${this.createdBy.firstName} ${this.createdBy.lastName}`,
        email: this.createdBy.email
      } : undefined
    };
  }
}
