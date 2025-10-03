/**
 * @fileoverview Care Observations table migration for WriteCareNotes
 * @module CareObservationsMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Creates the care_observations table for recording
 * care observations, concerns, and monitoring data.
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

export class CreateCareObservationsTable1704834005000 implements MigrationInterface {
  name = 'CreateCareObservationsTable1704834005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create care_observations table
    await queryRunner.createTable(
      new Table({
        name: 'care_observations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()'
          },
          {
            name: 'care_record_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'observation_type',
            type: 'enum',
            enum: ['physical', 'emotional', 'behavioral', 'social', 'medical', 'cognitive', 'environmental'],
            isNullable: false
          },
          {
            name: 'observation_category',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: 'Specific category within the observation type'
          },
          {
            name: 'observation_title',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 'observation_description',
            type: 'text',
            isNullable: false,
            comment: 'Detailed description of the observation'
          },
          {
            name: 'observation_value',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Measured or observed value'
          },
          {
            name: 'measurement_unit',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Unit of measurement (e.g., mmHg, °C, kg)'
          },
          {
            name: 'normal_range',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Normal range for this observation'
          },
          {
            name: 'severity_level',
            type: 'enum',
            enum: ['normal', 'mild', 'moderate', 'severe', 'critical'],
            default: \"'normal'\",
            isNullable: false
          },
          {
            name: 'is_concerning',
            type: 'boolean',
            default: false,
            isNullable: false,
            comment: 'Whether this observation raises concerns'
          },
          {
            name: 'requires_immediate_attention',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'action_taken',
            type: 'text',
            isNullable: true,
            comment: 'Actions taken in response to the observation'
          },
          {
            name: 'follow_up_required',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'follow_up_instructions',
            type: 'text',
            isNullable: true
          },
          {
            name: 'healthcare_professional_notified',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'family_notified',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'observed_by',
            type: 'uuid',
            isNullable: false,
            comment: 'Staff member who made the observation'
          },
          {
            name: 'observed_at',
            type: 'timestamp with time zone',
            isNullable: false
          },
          {
            name: 'verified_by',
            type: 'uuid',
            isNullable: true,
            comment: 'Senior staff member who verified the observation'
          },
          {
            name: 'verified_at',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'photo_attachments',
            type: 'jsonb',
            isNullable: true,
            comment: 'Photo attachments with consent information'
          },
          {
            name: 'related_medications',
            type: 'jsonb',
            isNullable: true,
            comment: 'Related medications that may affect this observation'
          },
          {
            name: 'environmental_factors',
            type: 'jsonb',
            isNullable: true,
            comment: 'Environmental factors that may influence the observation'
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
            columnNames: ['care_record_id'],
            referencedTableName: 'care_records',
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
      'care_observations',
      new Index('idx_care_observations_care_record', ['care_record_id'])
    );

    await queryRunner.createIndex(
      'care_observations',
      new Index('idx_care_observations_type_category', ['observation_type', 'observation_category'])
    );

    await queryRunner.createIndex(
      'care_observations',
      new Index('idx_care_observations_observed_at', ['observed_at'])
    );

    await queryRunner.createIndex(
      'care_observations',
      new Index('idx_care_observations_concerning', ['is_concerning', 'severity_level'])
    );

    await queryRunner.createIndex(
      'care_observations',
      new Index('idx_care_observations_immediate_attention', ['requires_immediate_attention'])
    );

    await queryRunner.createIndex(
      'care_observations',
      new Index('idx_care_observations_follow_up', ['follow_up_required'])
    );

    await queryRunner.createIndex(
      'care_observations',
      new Index('idx_care_observations_notifications', ['healthcare_professional_notified', 'family_notified'])
    );

    // Create audit indexes
    await queryRunner.createIndex(
      'care_observations',
      new Index('idx_care_observations_audit', ['created_at', 'updated_at'])
    );

    await queryRunner.createIndex(
      'care_observations',
      new Index('idx_care_observations_observed_by', ['observed_by'])
    );

    await queryRunner.createIndex(
      'care_observations',
      new Index('idx_care_observations_verified_by', ['verified_by'])
    );

    // Create GIN indexes for JSONB columns
    await queryRunner.query(`
      CREATE INDEX idx_care_observations_photos_gin ON care_observations USING GIN (photo_attachments);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_care_observations_medications_gin ON care_observations USING GIN (related_medications);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_care_observations_environment_gin ON care_observations USING GIN (environmental_factors);
    `);

    // Create updated_at trigger
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_care_observations_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_care_observations_updated_at
        BEFORE UPDATE ON care_observations
        FOR EACH ROW
        EXECUTE FUNCTION update_care_observations_updated_at();
    `);

    // Create full-text search index for observation descriptions
    await queryRunner.query(`
      CREATE INDEX idx_care_observations_description_fts 
      ON care_observations USING GIN (to_tsvector('english', observation_description));
    `);

    await queryRunner.query(`
      CREATE INDEX idx_care_observations_title_fts 
      ON care_observations USING GIN (to_tsvector('english', observation_title));
    `);

    // Add table comment
    await queryRunner.query(`
      COMMENT ON TABLE care_observations IS 'Care observations, concerns, and monitoring data for residents';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers and functions
    await queryRunner.query('DROP TRIGGER IF EXISTS update_care_observations_updated_at ON care_observations;');
    await queryRunner.query('DROP FUNCTION IF EXISTS update_care_observations_updated_at();');

    // Drop table
    await queryRunner.dropTable('care_observations');
  }
}