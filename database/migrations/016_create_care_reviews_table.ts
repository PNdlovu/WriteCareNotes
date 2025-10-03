/**
 * @fileoverview Care Reviews table migration for WriteCareNotes
 * @module CareReviewsMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Creates the care_reviews table for managing
 * care plan reviews and multidisciplinary team meetings.
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

export class CreateCareReviewsTable1704834006000 implements MigrationInterface {
  name = 'CreateCareReviewsTable1704834006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create care_reviews table
    await queryRunner.createTable(
      new Table({
        name: 'care_reviews',
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
            name: 'review_type',
            type: 'enum',
            enum: ['scheduled', 'triggered', 'emergency', 'annual', 'discharge', 'safeguarding'],
            isNullable: false
          },
          {
            name: 'review_title',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 'review_date',
            type: 'date',
            isNullable: false
          },
          {
            name: 'review_time',
            type: 'time',
            isNullable: true
          },
          {
            name: 'review_status',
            type: 'enum',
            enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'],
            default: \"'scheduled'\",
            isNullable: false
          },
          {
            name: 'chair_person',
            type: 'uuid',
            isNullable: false,
            comment: 'Staff member chairing the review'
          },
          {
            name: 'location',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Location where review is conducted'
          },
          {
            name: 'meeting_type',
            type: 'enum',
            enum: ['in_person', 'virtual', 'hybrid'],
            default: \"'in_person'\",
            isNullable: false
          },
          {
            name: 'family_invited',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'family_attended',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'family_feedback',
            type: 'text',
            isNullable: true,
            comment: 'Feedback provided by family members'
          },
          {
            name: 'resident_involved',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'resident_capacity_assessment',
            type: 'jsonb',
            isNullable: true,
            comment: 'Assessment of resident capacity to participate'
          },
          {
            name: 'review_agenda',
            type: 'jsonb',
            isNullable: true,
            comment: 'Structured agenda for the review meeting'
          },
          {
            name: 'review_summary',
            type: 'text',
            isNullable: true,
            comment: 'Summary of the review discussion and findings'
          },
          {
            name: 'care_plan_changes',
            type: 'jsonb',
            isNullable: true,
            comment: 'Changes made to the care plan as a result of review'
          },
          {
            name: 'outcomes',
            type: 'jsonb',
            isNullable: true,
            comment: 'Review outcomes and decisions made'
          },
          {
            name: 'action_plan',
            type: 'jsonb',
            isNullable: true,
            comment: 'Action plan with responsibilities and timelines'
          },
          {
            name: 'quality_indicators_reviewed',
            type: 'jsonb',
            isNullable: true,
            comment: 'Quality indicators and metrics reviewed'
          },
          {
            name: 'risk_assessments_updated',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'medication_review_conducted',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'next_review_date',
            type: 'date',
            isNullable: true
          },
          {
            name: 'next_review_type',
            type: 'enum',
            enum: ['scheduled', 'triggered', 'emergency', 'annual', 'discharge', 'safeguarding'],
            isNullable: true
          },
          {
            name: 'review_duration_minutes',
            type: 'integer',
            isNullable: true
          },
          {
            name: 'started_at',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'completed_at',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'cancelled_reason',
            type: 'text',
            isNullable: true
          },
          {
            name: 'postponed_to',
            type: 'date',
            isNullable: true
          },
          {
            name: 'postponed_reason',
            type: 'text',
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
            columnNames: ['care_plan_id'],
            referencedTableName: 'care_plans',
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
      'care_reviews',
      new Index('idx_care_reviews_care_plan', ['care_plan_id'])
    );

    await queryRunner.createIndex(
      'care_reviews',
      new Index('idx_care_reviews_date_status', ['review_date', 'review_status'])
    );

    await queryRunner.createIndex(
      'care_reviews',
      new Index('idx_care_reviews_type', ['review_type'])
    );

    await queryRunner.createIndex(
      'care_reviews',
      new Index('idx_care_reviews_chair_person', ['chair_person'])
    );

    await queryRunner.createIndex(
      'care_reviews',
      new Index('idx_care_reviews_next_review', ['next_review_date'])
    );

    await queryRunner.createIndex(
      'care_reviews',
      new Index('idx_care_reviews_family_involvement', ['family_invited', 'family_attended'])
    );

    await queryRunner.createIndex(
      'care_reviews',
      new Index('idx_care_reviews_overdue', ['review_date', 'review_status'], {
        where: \"review_status = 'scheduled' AND review_date < CURRENT_DATE\"
      })
    );

    // Create audit indexes
    await queryRunner.createIndex(
      'care_reviews',
      new Index('idx_care_reviews_audit', ['created_at', 'updated_at'])
    );

    await queryRunner.createIndex(
      'care_reviews',
      new Index('idx_care_reviews_completion', ['started_at', 'completed_at'])
    );

    // Create GIN indexes for JSONB columns
    await queryRunner.query(`
      CREATE INDEX idx_care_reviews_agenda_gin ON care_reviews USING GIN (review_agenda);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_care_reviews_outcomes_gin ON care_reviews USING GIN (outcomes);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_care_reviews_action_plan_gin ON care_reviews USING GIN (action_plan);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_care_reviews_changes_gin ON care_reviews USING GIN (care_plan_changes);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_care_reviews_quality_gin ON care_reviews USING GIN (quality_indicators_reviewed);
    `);

    // Create updated_at trigger
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_care_reviews_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_care_reviews_updated_at
        BEFORE UPDATE ON care_reviews
        FOR EACH ROW
        EXECUTE FUNCTION update_care_reviews_updated_at();
    `);

    // Create trigger to automatically set started_at when status changes to in_progress
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_care_review_started_at()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.review_status = 'in_progress' AND OLD.review_status != 'in_progress' AND NEW.started_at IS NULL THEN
          NEW.started_at = CURRENT_TIMESTAMP;
        END IF;
        IF NEW.review_status = 'completed' AND OLD.review_status != 'completed' AND NEW.completed_at IS NULL THEN
          NEW.completed_at = CURRENT_TIMESTAMP;
        END IF;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER set_care_review_started_at
        BEFORE UPDATE ON care_reviews
        FOR EACH ROW
        EXECUTE FUNCTION set_care_review_started_at();
    `);

    // Create constraint to ensure review duration is positive
    await queryRunner.query(`
      ALTER TABLE care_reviews ADD CONSTRAINT chk_care_reviews_duration 
      CHECK (review_duration_minutes >= 0);
    `);

    // Create full-text search index for review summary
    await queryRunner.query(`
      CREATE INDEX idx_care_reviews_summary_fts 
      ON care_reviews USING GIN (to_tsvector('english', review_summary));
    `);

    // Add table comment
    await queryRunner.query(`
      COMMENT ON TABLE care_reviews IS 'Care plan reviews and multidisciplinary team meetings';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers and functions
    await queryRunner.query('DROP TRIGGER IF EXISTS update_care_reviews_updated_at ON care_reviews;');
    await queryRunner.query('DROP TRIGGER IF EXISTS set_care_review_started_at ON care_reviews;');
    await queryRunner.query('DROP FUNCTION IF EXISTS update_care_reviews_updated_at();');
    await queryRunner.query('DROP FUNCTION IF EXISTS set_care_review_started_at();');

    // Drop table
    await queryRunner.dropTable('care_reviews');
  }
}