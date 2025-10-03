/**
 * @fileoverview Care Interventions table migration for WriteCareNotes
 * @module CareInterventionsMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Creates the care_interventions table for managing specific
 * care interventions and activities within care domains.
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

export class CreateCareInterventionsTable1704834002000 implements MigrationInterface {
  name = 'CreateCareInterventionsTable1704834002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create care_interventions table
    await queryRunner.createTable(
      new Table({
        name: 'care_interventions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()'
          },
          {
            name: 'care_domain_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'intervention_name',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 'intervention_code',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Standardized intervention code (SNOMED CT or local)'
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Detailed description of the intervention'
          },
          {
            name: 'intervention_type',
            type: 'enum',
            enum: ['direct_care', 'monitoring', 'assessment', 'medication', 'therapy', 'social', 'environmental'],
            default: \"'direct_care'\",
            isNullable: false
          },
          {
            name: 'frequency',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: 'Frequency of intervention (e.g., twice daily, PRN)'
          },
          {
            name: 'timing',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Specific timing requirements (e.g., 08:00, 20:00)'
          },
          {
            name: 'duration_minutes',
            type: 'integer',
            isNullable: true,
            comment: 'Expected duration in minutes'
          },
          {
            name: 'priority',
            type: 'enum',
            enum: ['low', 'medium', 'high', 'critical'],
            default: \"'medium'\",
            isNullable: false
          },
          {
            name: 'required_skills',
            type: 'jsonb',
            isNullable: true,
            comment: 'Required staff skills and qualifications'
          },
          {
            name: 'equipment_needed',
            type: 'jsonb',
            isNullable: true,
            comment: 'Equipment and supplies needed'
          },
          {
            name: 'safety_considerations',
            type: 'jsonb',
            isNullable: true,
            comment: 'Safety considerations and precautions'
          },
          {
            name: 'outcome_measures',
            type: 'jsonb',
            isNullable: true,
            comment: 'Expected outcomes and success criteria'
          },
          {
            name: 'documentation_requirements',
            type: 'jsonb',
            isNullable: true,
            comment: 'Required documentation and observations'
          },
          {
            name: 'contraindications',
            type: 'jsonb',
            isNullable: true,
            comment: 'Contraindications and when not to perform'
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
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false
          },
          {
            name: 'is_prn',
            type: 'boolean',
            default: false,
            isNullable: false,
            comment: 'Pro re nata (as needed) intervention'
          },
          {
            name: 'created_by',
            type: 'uuid',
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
            columnNames: ['care_domain_id'],
            referencedTableName: 'care_domains',
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
      'care_interventions',
      new Index('idx_care_interventions_domain', ['care_domain_id'])
    );

    await queryRunner.createIndex(
      'care_interventions',
      new Index('idx_care_interventions_type_active', ['intervention_type', 'is_active'])
    );

    await queryRunner.createIndex(
      'care_interventions',
      new Index('idx_care_interventions_priority', ['priority'])
    );

    await queryRunner.createIndex(
      'care_interventions',
      new Index('idx_care_interventions_effective_dates', ['effective_from', 'effective_to'])
    );

    await queryRunner.createIndex(
      'care_interventions',
      new Index('idx_care_interventions_prn', ['is_prn'])
    );

    await queryRunner.createIndex(
      'care_interventions',
      new Index('idx_care_interventions_code', ['intervention_code'])
    );

    // Create audit indexes
    await queryRunner.createIndex(
      'care_interventions',
      new Index('idx_care_interventions_audit', ['created_at', 'updated_at'])
    );

    await queryRunner.createIndex(
      'care_interventions',
      new Index('idx_care_interventions_created_by', ['created_by'])
    );

    // Create GIN indexes for JSONB columns
    await queryRunner.query(`
      CREATE INDEX idx_care_interventions_skills_gin ON care_interventions USING GIN (required_skills);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_care_interventions_equipment_gin ON care_interventions USING GIN (equipment_needed);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_care_interventions_safety_gin ON care_interventions USING GIN (safety_considerations);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_care_interventions_outcomes_gin ON care_interventions USING GIN (outcome_measures);
    `);

    // Create updated_at trigger
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_care_interventions_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_care_interventions_updated_at
        BEFORE UPDATE ON care_interventions
        FOR EACH ROW
        EXECUTE FUNCTION update_care_interventions_updated_at();
    `);

    // Add table comment
    await queryRunner.query(`
      COMMENT ON TABLE care_interventions IS 'Specific care interventions and activities within care domains';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers and functions
    await queryRunner.query('DROP TRIGGER IF EXISTS update_care_interventions_updated_at ON care_interventions;');
    await queryRunner.query('DROP FUNCTION IF EXISTS update_care_interventions_updated_at();');

    // Drop table
    await queryRunner.dropTable('care_interventions');
  }
}