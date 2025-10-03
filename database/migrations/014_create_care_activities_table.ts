/**
 * @fileoverview Care Activities table migration for WriteCareNotes
 * @module CareActivitiesMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Creates the care_activities table for tracking completion
 * of specific care interventions and activities.
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

export class CreateCareActivitiesTable1704834004000 implements MigrationInterface {
  name = 'CreateCareActivitiesTable1704834004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create care_activities table
    await queryRunner.createTable(
      new Table({
        name: 'care_activities',
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
            name: 'intervention_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'scheduled_time',
            type: 'timestamp with time zone',
            isNullable: false
          },
          {
            name: 'completed_time',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'completed_by',
            type: 'uuid',
            isNullable: true,
            comment: 'Staff member who completed the activity'
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['scheduled', 'in_progress', 'completed', 'missed', 'refused', 'not_applicable', 'deferred'],
            default: \"'scheduled'\",
            isNullable: false
          },
          {
            name: 'completion_notes',
            type: 'text',
            isNullable: true,
            comment: 'Notes about the completion of the activity'
          },
          {
            name: 'resident_response',
            type: 'enum',
            enum: ['cooperative', 'reluctant', 'refused', 'unable', 'not_assessed'],
            isNullable: true
          },
          {
            name: 'duration_minutes',
            type: 'integer',
            isNullable: true,
            comment: 'Actual duration taken to complete the activity'
          },
          {
            name: 'quality_rating',
            type: 'integer',
            isNullable: true,
            comment: 'Quality rating on 1-5 scale'
          },
          {
            name: 'outcome_achieved',
            type: 'boolean',
            isNullable: true,
            comment: 'Whether the intended outcome was achieved'
          },
          {
            name: 'complications',
            type: 'text',
            isNullable: true,
            comment: 'Any complications or issues encountered'
          },
          {
            name: 'equipment_used',
            type: 'jsonb',
            isNullable: true,
            comment: 'Equipment and supplies used'
          },
          {
            name: 'vital_signs',
            type: 'jsonb',
            isNullable: true,
            comment: 'Vital signs recorded during activity'
          },
          {
            name: 'pain_assessment',
            type: 'jsonb',
            isNullable: true,
            comment: 'Pain assessment before/during/after activity'
          },
          {
            name: 'safety_incidents',
            type: 'jsonb',
            isNullable: true,
            comment: 'Any safety incidents or near misses'
          },
          {
            name: 'follow_up_required',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'follow_up_notes',
            type: 'text',
            isNullable: true
          },
          {
            name: 'deferred_to',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'When activity was deferred to'
          },
          {
            name: 'deferred_reason',
            type: 'text',
            isNullable: true
          },
          {
            name: 'witness_staff_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Witness staff for activities requiring dual witness'
          },
          {
            name: 'electronic_signature',
            type: 'jsonb',
            isNullable: true,
            comment: 'Electronic signature data for completed activity'
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
          },
          {
            columnNames: ['intervention_id'],
            referencedTableName: 'care_interventions',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
          }
        ]
      }),
      true
    );

    // Create performance indexes
    await queryRunner.createIndex(
      'care_activities',
      new Index('idx_care_activities_care_record', ['care_record_id'])
    );

    await queryRunner.createIndex(
      'care_activities',
      new Index('idx_care_activities_intervention', ['intervention_id'])
    );

    await queryRunner.createIndex(
      'care_activities',
      new Index('idx_care_activities_scheduled_time', ['scheduled_time'])
    );

    await queryRunner.createIndex(
      'care_activities',
      new Index('idx_care_activities_status', ['status'])
    );

    await queryRunner.createIndex(
      'care_activities',
      new Index('idx_care_activities_completed', ['completed_time', 'completed_by'])
    );

    await queryRunner.createIndex(
      'care_activities',
      new Index('idx_care_activities_overdue', ['scheduled_time', 'status'], {
        where: \"status IN ('scheduled', 'in_progress') AND scheduled_time < NOW()\"
      })
    );

    await queryRunner.createIndex(
      'care_activities',
      new Index('idx_care_activities_follow_up', ['follow_up_required'])
    );

    await queryRunner.createIndex(
      'care_activities',
      new Index('idx_care_activities_deferred', ['deferred_to'])
    );

    // Create audit indexes
    await queryRunner.createIndex(
      'care_activities',
      new Index('idx_care_activities_audit', ['created_at', 'updated_at'])
    );

    await queryRunner.createIndex(
      'care_activities',
      new Index('idx_care_activities_witness', ['witness_staff_id'])
    );

    // Create GIN indexes for JSONB columns
    await queryRunner.query(`
      CREATE INDEX idx_care_activities_equipment_gin ON care_activities USING GIN (equipment_used);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_care_activities_vitals_gin ON care_activities USING GIN (vital_signs);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_care_activities_pain_gin ON care_activities USING GIN (pain_assessment);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_care_activities_incidents_gin ON care_activities USING GIN (safety_incidents);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_care_activities_signature_gin ON care_activities USING GIN (electronic_signature);
    `);

    // Create updated_at trigger
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_care_activities_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_care_activities_updated_at
        BEFORE UPDATE ON care_activities
        FOR EACH ROW
        EXECUTE FUNCTION update_care_activities_updated_at();
    `);

    // Create constraints
    await queryRunner.query(`
      ALTER TABLE care_activities ADD CONSTRAINT chk_care_activities_quality_rating 
      CHECK (quality_rating >= 1 AND quality_rating <= 5);
    `);

    await queryRunner.query(`
      ALTER TABLE care_activities ADD CONSTRAINT chk_care_activities_duration 
      CHECK (duration_minutes >= 0);
    `);

    // Create trigger to automatically set completed_time when status changes to completed
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_care_activity_completed_time()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.completed_time IS NULL THEN
          NEW.completed_time = CURRENT_TIMESTAMP;
        END IF;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER set_care_activity_completed_time
        BEFORE UPDATE ON care_activities
        FOR EACH ROW
        EXECUTE FUNCTION set_care_activity_completed_time();
    `);

    // Add table comment
    await queryRunner.query(`
      COMMENT ON TABLE care_activities IS 'Tracking of specific care intervention activities and their completion';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers and functions
    await queryRunner.query('DROP TRIGGER IF EXISTS update_care_activities_updated_at ON care_activities;');
    await queryRunner.query('DROP TRIGGER IF EXISTS set_care_activity_completed_time ON care_activities;');
    await queryRunner.query('DROP FUNCTION IF EXISTS update_care_activities_updated_at();');
    await queryRunner.query('DROP FUNCTION IF EXISTS set_care_activity_completed_time();');

    // Drop table
    await queryRunner.dropTable('care_activities');
  }
}