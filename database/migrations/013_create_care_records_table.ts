/**
 * @fileoverview Care Records table migration for WriteCareNotes
 * @module CareRecordsMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Creates the care_records table for daily care documentation
 * and shift-based care record management.
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

export class CreateCareRecordsTable1704834003000 implements MigrationInterface {
  name = 'CreateCareRecordsTable1704834003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create care_records table
    await queryRunner.createTable(
      new Table({
        name: 'care_records',
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
            name: 'care_plan_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'record_date',
            type: 'date',
            isNullable: false
          },
          {
            name: 'shift_type',
            type: 'enum',
            enum: ['day', 'evening', 'night', 'long_day'],
            isNullable: false
          },
          {
            name: 'shift_start_time',
            type: 'time',
            isNullable: true
          },
          {
            name: 'shift_end_time',
            type: 'time',
            isNullable: true
          },
          {
            name: 'documented_by',
            type: 'uuid',
            isNullable: false,
            comment: 'Staff member who documented the care'
          },
          {
            name: 'overall_wellbeing',
            type: 'enum',
            enum: ['excellent', 'good', 'fair', 'poor', 'concerning'],
            isNullable: true
          },
          {
            name: 'mood_assessment',
            type: 'enum',
            enum: ['very_positive', 'positive', 'neutral', 'low', 'very_low', 'agitated', 'confused'],
            isNullable: true
          },
          {
            name: 'appetite_assessment',
            type: 'enum',
            enum: ['excellent', 'good', 'fair', 'poor', 'refused'],
            isNullable: true
          },
          {
            name: 'sleep_quality',
            type: 'enum',
            enum: ['excellent', 'good', 'fair', 'poor', 'very_poor', 'not_applicable'],
            isNullable: true
          },
          {
            name: 'mobility_status',
            type: 'enum',
            enum: ['independent', 'assisted', 'wheelchair', 'bed_bound', 'not_assessed'],
            isNullable: true
          },
          {
            name: 'pain_level',
            type: 'integer',
            isNullable: true,
            comment: 'Pain level on 0-10 scale'
          },
          {
            name: 'general_notes',
            type: 'text',
            isNullable: true,
            comment: 'General observations and notes for the shift'
          },
          {
            name: 'handover_notes',
            type: 'text',
            isNullable: true,
            comment: 'Notes for next shift handover'
          },
          {
            name: 'family_contact',
            type: 'jsonb',
            isNullable: true,
            comment: 'Family contact details and communications'
          },
          {
            name: 'incidents_reported',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'concerns_raised',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'gp_contacted',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'emergency_services_called',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'record_status',
            type: 'enum',
            enum: ['draft', 'completed', 'reviewed', 'locked'],
            default: \"'draft'\",
            isNullable: false
          },
          {
            name: 'completed_at',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'reviewed_by',
            type: 'uuid',
            isNullable: true,
            comment: 'Senior staff member who reviewed the record'
          },
          {
            name: 'reviewed_at',
            type: 'timestamp with time zone',
            isNullable: true
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
            columnNames: ['care_plan_id'],
            referencedTableName: 'care_plans',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
          }
        ],
        uniques: [
          {
            columnNames: ['resident_id', 'record_date', 'shift_type'],
            name: 'uk_care_records_resident_date_shift'
          }
        ]
      }),
      true
    );

    // Create performance indexes
    await queryRunner.createIndex(
      'care_records',
      new Index('idx_care_records_resident_date', ['resident_id', 'record_date'])
    );

    await queryRunner.createIndex(
      'care_records',
      new Index('idx_care_records_care_plan', ['care_plan_id'])
    );

    await queryRunner.createIndex(
      'care_records',
      new Index('idx_care_records_shift', ['shift_type', 'record_date'])
    );

    await queryRunner.createIndex(
      'care_records',
      new Index('idx_care_records_status', ['record_status'])
    );

    await queryRunner.createIndex(
      'care_records',
      new Index('idx_care_records_wellbeing', ['overall_wellbeing'])
    );

    await queryRunner.createIndex(
      'care_records',
      new Index('idx_care_records_concerns', ['concerns_raised', 'incidents_reported'])
    );

    // Create audit indexes
    await queryRunner.createIndex(
      'care_records',
      new Index('idx_care_records_audit', ['created_at', 'updated_at'])
    );

    await queryRunner.createIndex(
      'care_records',
      new Index('idx_care_records_documented_by', ['documented_by'])
    );

    await queryRunner.createIndex(
      'care_records',
      new Index('idx_care_records_reviewed_by', ['reviewed_by'])
    );

    // Create GIN index for JSONB columns
    await queryRunner.query(`
      CREATE INDEX idx_care_records_family_contact_gin ON care_records USING GIN (family_contact);
    `);

    // Create updated_at trigger
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_care_records_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_care_records_updated_at
        BEFORE UPDATE ON care_records
        FOR EACH ROW
        EXECUTE FUNCTION update_care_records_updated_at();
    `);

    // Create constraint to ensure pain level is between 0 and 10
    await queryRunner.query(`
      ALTER TABLE care_records ADD CONSTRAINT chk_care_records_pain_level 
      CHECK (pain_level >= 0 AND pain_level <= 10);
    `);

    // Add table comment
    await queryRunner.query(`
      COMMENT ON TABLE care_records IS 'Daily care documentation records for residents by shift';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers and functions
    await queryRunner.query('DROP TRIGGER IF EXISTS update_care_records_updated_at ON care_records;');
    await queryRunner.query('DROP FUNCTION IF EXISTS update_care_records_updated_at();');

    // Drop table
    await queryRunner.dropTable('care_records');
  }
}