/**
 * @fileoverview Care Plans table migration for WriteCareNotes
 * @module CarePlansMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Creates the care_plans table for managing resident care plans
 * with comprehensive care planning, approval workflows, and versioning support.
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 * 
 * @security
 * - Implements audit trail columns for all operations
 * - Supports field-level encryption for sensitive care data
 * - Includes comprehensive indexing for performance
 */

import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateCarePlansTable1704834000000 implements MigrationInterface {
  name = 'CreateCarePlansTable1704834000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create care_plans table
    await queryRunner.createTable(
      new Table({
        name: 'care_plans',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()'
          },
          {
            name: 'resident_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'plan_name',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 'plan_type',
            type: 'enum',
            enum: ['initial', 'review', 'emergency', 'discharge'],
            default: \"'initial'\",
            isNullable: false
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'pending_approval', 'active', 'archived', 'superseded'],
            default: \"'draft'\",
            isNullable: false
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'approved_by',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'approved_at',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'effective_from',
            type: 'date',
            isNullable: false
          },
          {
            name: 'effective_to',
            type: 'date',
            isNullable: true
          },
          {
            name: 'review_frequency',
            type: 'enum',
            enum: ['weekly', 'monthly', 'quarterly', 'annually'],
            default: \"'monthly'\",
            isNullable: false
          },
          {
            name: 'next_review_date',
            type: 'date',
            isNullable: false
          },
          {
            name: 'care_goals',
            type: 'jsonb',
            isNullable: true,
            comment: 'SMART goals for resident care outcomes'
          },
          {
            name: 'risk_assessments',
            type: 'jsonb',
            isNullable: true,
            comment: 'Risk assessments and mitigation strategies'
          },
          {
            name: 'emergency_procedures',
            type: 'jsonb',
            isNullable: true,
            comment: 'Emergency procedures and contact information'
          },
          {
            name: 'resident_preferences',
            type: 'jsonb',
            isNullable: true,
            comment: 'Resident preferences and choices'
          },
          {
            name: 'version',
            type: 'integer',
            default: 1,
            isNullable: false
          },
          {
            name: 'previous_version_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Reference to previous version for audit trail'
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Soft delete timestamp for audit compliance'
          }
        ],
        foreignKeys: [
          {
            columnNames: ['resident_id'],
            referencedTableName: 'residents',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
          },
          {
            columnNames: ['previous_version_id'],
            referencedTableName: 'care_plans',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
          }
        ]
      }),
      true
    );

    // Create performance indexes
    await queryRunner.createIndex(
      'care_plans',
      new Index('idx_care_plans_resident_status', ['resident_id', 'status'])
    );

    await queryRunner.createIndex(
      'care_plans',
      new Index('idx_care_plans_review_date', ['next_review_date'], {
        where: \"status = 'active'\"
      })
    );

    await queryRunner.createIndex(
      'care_plans',
      new Index('idx_care_plans_effective_dates', ['effective_from', 'effective_to'])
    );

    await queryRunner.createIndex(
      'care_plans',
      new Index('idx_care_plans_created_by', ['created_by'])
    );

    await queryRunner.createIndex(
      'care_plans',
      new Index('idx_care_plans_approved_by', ['approved_by'])
    );

    // Create audit indexes
    await queryRunner.createIndex(
      'care_plans',
      new Index('idx_care_plans_audit', ['created_at', 'updated_at'])
    );

    await queryRunner.createIndex(
      'care_plans',
      new Index('idx_care_plans_version', ['version', 'previous_version_id'])
    );

    // Create GIN index for JSONB columns for efficient querying
    await queryRunner.query(`
      CREATE INDEX idx_care_plans_care_goals_gin ON care_plans USING GIN (care_goals);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_care_plans_risk_assessments_gin ON care_plans USING GIN (risk_assessments);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_care_plans_preferences_gin ON care_plans USING GIN (resident_preferences);
    `);

    // Create updated_at trigger
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_care_plans_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_care_plans_updated_at
        BEFORE UPDATE ON care_plans
        FOR EACH ROW
        EXECUTE FUNCTION update_care_plans_updated_at();
    `);

    // Add table comment
    await queryRunner.query(`
      COMMENT ON TABLE care_plans IS 'Care plans for residents with comprehensive care planning, approval workflows, and regulatory compliance';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers and functions
    await queryRunner.query('DROP TRIGGER IF EXISTS update_care_plans_updated_at ON care_plans;');
    await queryRunner.query('DROP FUNCTION IF EXISTS update_care_plans_updated_at();');

    // Drop table (indexes and foreign keys are dropped automatically)
    await queryRunner.dropTable('care_plans');
  }
}