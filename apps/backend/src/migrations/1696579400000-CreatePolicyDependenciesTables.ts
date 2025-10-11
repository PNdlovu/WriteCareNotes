import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * CreatePolicyDependenciesTables Migration
 * 
 * Creates the database schema for tracking dependencies between policies and other system entities.
 * This migration supports the Policy Impact Analysis feature (Phase 2 TIER 1 Feature 3).
 * 
 * **Tables Created:**
 * 1. policy_dependencies - Core dependency tracking
 * 2. policy_impact_cache - Performance optimization cache for impact analysis
 * 
 * **Indexes:**
 * - Fast lookup by policy (impact analysis queries)
 * - Fast lookup by dependent entity (reverse dependency lookup)
 * - Dependency strength filtering
 * - Cache expiration queries
 * 
 * @migration
 * @version 1696579400000
 * @phase Phase 2 TIER 1
 * @feature Feature 3 - Policy Impact Analysis
 */
export class CreatePolicyDependenciesTables1696579400000 implements MigrationInterface {
  name = 'CreatePolicyDependenciesTables1696579400000';

  /**
   * Run the migration - create tables and indexes
   * @param queryRunner TypeORM query runner
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // 1. CREATE policy_dependencies TABLE
    // ============================================================
    
    await queryRunner.createTable(
      new Table({
        name: 'policy_dependencies',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()'
          },
          {
            name: 'policy_id',
            type: 'uuid',
            isNullable: false,
            comment: 'Foreign key to the policy being depended upon'
          },
          {
            name: 'dependent_type',
            type: 'var char',
            length: '50',
            isNullable: false,
            comment: 'Type of dependententity: workflow, module, template, assessment, training, document'
          },
          {
            name: 'dependent_id',
            type: 'uuid',
            isNullable: false,
            comment: 'UUID of the dependent entity'
          },
          {
            name: 'dependency_strength',
            type: 'var char',
            length: '20',
            isNullable: false,
            default: "'medium'",
            comment: 'Strength ofdependency: strong, medium, weak'
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Additional dependency metadata (impact description, affected sections, auto-update flag, migration path)'
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
            comment: 'User who created this dependency relationship'
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
            comment: 'Optional administrator notes about this dependency'
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
            comment: 'Whether this dependency is currently active (inactive dependencies preserved for history)'
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'NOW()',
            isNullable: false
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'NOW()',
            isNullable: false
          }
        ]
      }),
      true // ifNotExists
    );

    // ============================================================
    // 2. CREATE INDEXES for policy_dependencies
    // ============================================================

    // Index for fast policy lookup (primary usecase: "what depends on thispolicy?")
    await queryRunner.createIndex(
      'policy_dependencies',
      new TableIndex({
        name: 'idx_policy_dependencies_policy',
        columnNames: ['policy_id']
      })
    );

    // Composite index for dependent entity lookup (use case: "which policies does this workflow dependon?")
    await queryRunner.createIndex(
      'policy_dependencies',
      new TableIndex({
        name: 'idx_policy_dependencies_dependent',
        columnNames: ['dependent_type', 'dependent_id']
      })
    );

    // Index for filtering by dependency strength
    await queryRunner.createIndex(
      'policy_dependencies',
      new TableIndex({
        name: 'idx_policy_dependencies_strength',
        columnNames: ['dependency_strength']
      })
    );

    // Index for active dependencies (excludes historical inactive ones)
    await queryRunner.createIndex(
      'policy_dependencies',
      new TableIndex({
        name: 'idx_policy_dependencies_active',
        columnNames: ['is_active']
      })
    );

    // Composite index for policy + strength queries
    await queryRunner.createIndex(
      'policy_dependencies',
      new TableIndex({
        name: 'idx_policy_dependencies_policy_strength',
        columnNames: ['policy_id', 'dependency_strength']
      })
    );

    // Unique const raint to prevent duplicate dependencies
    await queryRunner.createIndex(
      'policy_dependencies',
      new TableIndex({
        name: 'uq_policy_dependencies_unique',
        columnNames: ['policy_id', 'dependent_type', 'dependent_id'],
        isUnique: true
      })
    );

    // ============================================================
    // 3. CREATE FOREIGN KEYS for policy_dependencies
    // ============================================================

    // Foreign key to policy_drafts (CASCADE delete)
    await queryRunner.createForeignKey(
      'policy_dependencies',
      new TableForeignKey({
        name: 'fk_policy_dependencies_policy',
        columnNames: ['policy_id'],
        referencedTableName: 'policy_drafts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE', // Delete dependencies when policy is deleted
        onUpdate: 'CASCADE'
      })
    );

    // Foreign key to users (SET NULL on delete)
    await queryRunner.createForeignKey(
      'policy_dependencies',
      new TableForeignKey({
        name: 'fk_policy_dependencies_created_by',
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL', // Preserve dependency even if creator is deleted
        onUpdate: 'CASCADE'
      })
    );

    // ============================================================
    // 4. CREATE policy_impact_cache TABLE
    // ============================================================

    await queryRunner.createTable(
      new Table({
        name: 'policy_impact_cache',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()'
          },
          {
            name: 'policy_id',
            type: 'uuid',
            isNullable: false,
            comment: 'Policy for which impact analysis is cached'
          },
          {
            name: 'impact_data',
            type: 'jsonb',
            isNullable: false,
            comment: 'Cached impact analysis results (dependency graph, affected entities, risk scores)'
          },
          {
            name: 'risk_score',
            type: 'integer',
            isNullable: true,
            comment: 'Overall risk score (0-100) for policy changes'
          },
          {
            name: 'affected_count',
            type: 'integer',
            default: 0,
            isNullable: false,
            comment: 'Total number of entities affected by this policy'
          },
          {
            name: 'calculated_at',
            type: 'timestamp',
            default: 'NOW()',
            isNullable: false,
            comment: 'When this impact analysis was calculated'
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'When this cache entry expires (NULL = never expires)'
          }
        ]
      }),
      true // ifNotExists
    );

    // ============================================================
    // 5. CREATE INDEXES for policy_impact_cache
    // ============================================================

    // Index for policy lookup
    await queryRunner.createIndex(
      'policy_impact_cache',
      new TableIndex({
        name: 'idx_impact_cache_policy',
        columnNames: ['policy_id']
      })
    );

    // Index for cache expiration cleanup queries
    await queryRunner.createIndex(
      'policy_impact_cache',
      new TableIndex({
        name: 'idx_impact_cache_expiry',
        columnNames: ['expires_at']
      })
    );

    // Index for risk score queries (finding high-risk policies)
    await queryRunner.createIndex(
      'policy_impact_cache',
      new TableIndex({
        name: 'idx_impact_cache_risk_score',
        columnNames: ['risk_score']
      })
    );

    // ============================================================
    // 6. CREATE FOREIGN KEYS for policy_impact_cache
    // ============================================================

    // Foreign key to policy_drafts (CASCADE delete)
    await queryRunner.createForeignKey(
      'policy_impact_cache',
      new TableForeignKey({
        name: 'fk_impact_cache_policy',
        columnNames: ['policy_id'],
        referencedTableName: 'policy_drafts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE', // Delete cache when policy is deleted
        onUpdate: 'CASCADE'
      })
    );

    // ============================================================
    // 7. ADD CHECK CONST RAINTS
    // ============================================================

    // Ensure risk_score is in valid range (0-100)
    await queryRunner.query(`
      ALTER TABLE policy_impact_cache
      ADD CONST RAINT chk_impact_cache_risk_score 
      CHECK (risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100))
    `);

    // Ensure affected_count is non-negative
    await queryRunner.query(`
      ALTER TABLE policy_impact_cache
      ADD CONST RAINT chk_impact_cache_affected_count 
      CHECK (affected_count >= 0)
    `);

    // Ensure dependency_strength is valid
    await queryRunner.query(`
      ALTER TABLE policy_dependencies
      ADD CONST RAINT chk_dependencies_strength 
      CHECK (dependency_strength IN ('strong', 'medium', 'weak'))
    `);

    // Ensure dependent_type is valid
    await queryRunner.query(`
      ALTER TABLE policy_dependencies
      ADD CONST RAINT chk_dependencies_type 
      CHECK (dependent_type IN ('workflow', 'module', 'template', 'assessment', 'training', 'document'))
    `);

    // ============================================================
    // 8. CREATE TRIGGERS for automatic updated_at
    // ============================================================

    // Create updated_at trigger function (if it doesn't exist)
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Apply trigger to policy_dependencies
    await queryRunner.query(`
      CREATE TRIGGER trigger_policy_dependencies_updated_at
      BEFORE UPDATE ON policy_dependencies
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    // ============================================================
    // 9. CREATE HELPER FUNCTIONS for impact analysis
    // ============================================================

    // Function to get all dependencies for a policy (recursive)
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION get_policy_dependencies(p_policy_id UUID)
      RETURNS TABLE (
        dependency_id UUID,
        policy_id UUID,
        dependent_type VAR CHAR,
        dependent_id UUID,
        dependency_strength VAR CHAR,
        depth INTEGER
      ) AS $$
      WITH RECURSIVE dependency_tree AS (
        -- Basecase: direct dependencies
        SELECT 
          id AS dependency_id,
          policy_id,
          dependent_type,
          dependent_id,
          dependency_strength,
          1 AS depth
        FROM policy_dependencies
        WHERE policy_id = p_policy_id AND is_active = true
        
        UNION ALL
        
        -- Recursivecase: dependencies of dependencies (for policies that are templates)
        SELECT 
          pd.id AS dependency_id,
          pd.policy_id,
          pd.dependent_type,
          pd.dependent_id,
          pd.dependency_strength,
          dt.depth + 1
        FROM policy_dependencies pd
        INNER JOIN dependency_tree dt 
          ON pd.policy_id = dt.dependent_id 
          AND dt.dependent_type IN ('policy', 'template')
        WHERE pd.is_active = true AND dt.depth < 10 -- Prevent infinite recursion
      )
      SELECT * FROM dependency_tree;
      $$ LANGUAGE SQL STABLE;
    `);

    // Function to calculate impact score for a policy
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION calculate_policy_impact_score(p_policy_id UUID)
      RETURNS INTEGER AS $$
      DECLARE
        v_strong_count INTEGER;
        v_medium_count INTEGER;
        v_weak_count INTEGER;
        v_total_score INTEGER;
      BEGIN
        -- Count dependencies by strength
        SELECT 
          COUNT(*) FILTER (WHERE dependency_strength = 'strong'),
          COUNT(*) FILTER (WHERE dependency_strength = 'medium'),
          COUNT(*) FILTER (WHERE dependency_strength = 'weak')
        INTO v_strong_count, v_medium_count, v_weak_count
        FROM policy_dependencies
        WHERE policy_id = p_policy_id AND is_active = true;
        
        -- Calculate weighted score (strong=10, medium=5, weak=2)
        v_total_score := (v_strong_count * 10) + (v_medium_count * 5) + (v_weak_count * 2);
        
        -- Cap at 100
        IF v_total_score > 100 THEN
          v_total_score := 100;
        END IF;
        
        RETURN v_total_score;
      END;
      $$ LANGUAGE plpgsql STABLE;
    `);

    console.log('✅ Created policy_dependencies table with 6 indexes');
    console.log('✅ Created policy_impact_cache table with 3 indexes');
    console.log('✅ Created 4 check const raints for data validation');
    console.log('✅ Created 1 trigger for automatic updated_at');
    console.log('✅ Created 2 helper functions for impact analysis');
    console.log('✅ Migrationcomplete: Policy Impact Analysis schema ready');
  }

  /**
   * Rollback the migration - drop tables and indexes
   * @param queryRunner TypeORM query runner
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop helper functions
    await queryRunner.query(`DROP FUNCTION IF EXISTS calculate_policy_impact_score(UUID)`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS get_policy_dependencies(UUID)`);

    // Drop triggers
    await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_policy_dependencies_updated_at ON policy_dependencies`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column()`);

    // Drop policy_impact_cache table (includes all foreign keys and indexes)
    await queryRunner.dropTable('policy_impact_cache', true);

    // Drop policy_dependencies table (includes all foreign keys and indexes)
    await queryRunner.dropTable('policy_dependencies', true);

    console.log('✅ Rolledback: Dropped policy_dependencies and policy_impact_cache tables');
  }
}
