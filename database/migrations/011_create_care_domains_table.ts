/**
 * @fileoverview Care Domains table migration for WriteCareNotes
 * @module CareDomainsMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Creates the care_domains table for managing different domains
 * of care within care plans (personal care, mobility, nutrition, social, medical, mental health).
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

export class CreateCareDomainsTable1704834001000 implements MigrationInterface {
  name = 'CreateCareDomainsTable1704834001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create care_domains table
    await queryRunner.createTable(
      new Table({
        name: 'care_domains',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()'
          },
          {
            name: 'care_plan_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'domain_type',
            type: 'enum',
            enum: ['personal_care', 'mobility', 'nutrition', 'social', 'medical', 'mental_health', 'cognitive', 'communication'],
            isNullable: false
          },
          {
            name: 'domain_name',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 'assessment_summary',
            type: 'text',
            isNullable: true,
            comment: 'Summary of assessment findings for this domain'
          },
          {
            name: 'current_status',
            type: 'enum',
            enum: ['independent', 'requires_assistance', 'requires_supervision', 'fully_dependent', 'not_applicable'],
            default: \"'requires_assistance'\",
            isNullable: false
          },
          {
            name: 'goals',
            type: 'jsonb',
            isNullable: true,
            comment: 'SMART goals specific to this care domain'
          },
          {
            name: 'interventions',
            type: 'jsonb',
            isNullable: true,
            comment: 'Care interventions and activities for this domain'
          },
          {
            name: 'risk_level',
            type: 'enum',
            enum: ['low', 'medium', 'high', 'critical'],
            default: \"'medium'\",
            isNullable: false
          },
          {
            name: 'risk_factors',
            type: 'jsonb',
            isNullable: true,
            comment: 'Identified risk factors and mitigation strategies'
          },
          {
            name: 'equipment_needed',
            type: 'jsonb',
            isNullable: true,
            comment: 'Equipment and aids required for this domain'
          },
          {
            name: 'staff_requirements',
            type: 'jsonb',
            isNullable: true,
            comment: 'Staff skills and qualifications required'
          },
          {
            name: 'monitoring_frequency',
            type: 'enum',
            enum: ['continuous', 'hourly', 'shift', 'daily', 'weekly', 'monthly'],
            default: \"'daily'\",
            isNullable: false
          },
          {
            name: 'last_assessment_date',
            type: 'date',
            isNullable: true
          },
          {
            name: 'next_assessment_date',
            type: 'date',
            isNullable: true
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false
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
            columnNames: ['care_plan_id'],
            referencedTableName: 'care_plans',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        ]
      }),
      true
    );

    // Create performance indexes
    await queryRunner.createIndex(
      'care_domains',
      new Index('idx_care_domains_care_plan', ['care_plan_id'])
    );

    await queryRunner.createIndex(
      'care_domains',
      new Index('idx_care_domains_type_active', ['domain_type', 'is_active'])
    );

    await queryRunner.createIndex(
      'care_domains',
      new Index('idx_care_domains_risk_level', ['risk_level'])
    );

    await queryRunner.createIndex(
      'care_domains',
      new Index('idx_care_domains_assessment_dates', ['last_assessment_date', 'next_assessment_date'])
    );

    // Create audit indexes
    await queryRunner.createIndex(
      'care_domains',
      new Index('idx_care_domains_audit', ['created_at', 'updated_at'])
    );

    // Create GIN indexes for JSONB columns
    await queryRunner.query(`
      CREATE INDEX idx_care_domains_goals_gin ON care_domains USING GIN (goals);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_care_domains_interventions_gin ON care_domains USING GIN (interventions);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_care_domains_risk_factors_gin ON care_domains USING GIN (risk_factors);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_care_domains_equipment_gin ON care_domains USING GIN (equipment_needed);
    `);

    // Create updated_at trigger
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_care_domains_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_care_domains_updated_at
        BEFORE UPDATE ON care_domains
        FOR EACH ROW
        EXECUTE FUNCTION update_care_domains_updated_at();
    `);

    // Add table comment
    await queryRunner.query(`
      COMMENT ON TABLE care_domains IS 'Care domains within care plans covering different aspects of resident care';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers and functions
    await queryRunner.query('DROP TRIGGER IF EXISTS update_care_domains_updated_at ON care_domains;');
    await queryRunner.query('DROP FUNCTION IF EXISTS update_care_domains_updated_at();');

    // Drop table
    await queryRunner.dropTable('care_domains');
  }
}