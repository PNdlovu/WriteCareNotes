/**
 * @fileoverview Review Participants table migration for WriteCareNotes
 * @module ReviewParticipantsMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Creates the review_participants table for managing
 * participants in care review meetings.
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

export class CreateReviewParticipantsTable1704834007000 implements MigrationInterface {
  name = 'CreateReviewParticipantsTable1704834007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create review_participants table
    await queryRunner.createTable(
      new Table({
        name: 'review_participants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()'
          },
          {
            name: 'care_review_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'participant_type',
            type: 'enum',
            enum: ['staff', 'family', 'external_professional', 'resident', 'advocate', 'interpreter'],
            isNullable: false
          },
          {
            name: 'participant_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Reference to staff, family member, or other entity'
          },
          {
            name: 'participant_name',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 'participant_email',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'participant_phone',
            type: 'varchar',
            length: '50',
            isNullable: true
          },
          {
            name: 'role',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: 'Role in the review (e.g., Care Manager, GP, Family Member)'
          },
          {
            name: 'organization',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Organization the participant represents'
          },
          {
            name: 'professional_registration',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Professional registration number if applicable'
          },
          {
            name: 'invitation_status',
            type: 'enum',
            enum: ['not_invited', 'invited', 'confirmed', 'declined', 'tentative'],
            default: \"'not_invited'\",
            isNullable: false
          },
          {
            name: 'attendance_status',
            type: 'enum',
            enum: ['invited', 'confirmed', 'attended', 'absent', 'late', 'left_early'],
            default: \"'invited'\",
            isNullable: false
          },
          {
            name: 'attendance_method',
            type: 'enum',
            enum: ['in_person', 'video_call', 'phone_call', 'written_input'],
            isNullable: true
          },
          {
            name: 'invited_at',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'responded_at',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'arrived_at',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'left_at',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'contribution',
            type: 'text',
            isNullable: true,
            comment: 'Summary of participant contribution to the review'
          },
          {
            name: 'concerns_raised',
            type: 'text',
            isNullable: true,
            comment: 'Any concerns raised by the participant'
          },
          {
            name: 'recommendations',
            type: 'text',
            isNullable: true,
            comment: 'Recommendations made by the participant'
          },
          {
            name: 'follow_up_actions',
            type: 'jsonb',
            isNullable: true,
            comment: 'Follow-up actions assigned to this participant'
          },
          {
            name: 'contact_preferences',
            type: 'jsonb',
            isNullable: true,
            comment: 'Preferred contact methods and times'
          },
          {
            name: 'accessibility_requirements',
            type: 'jsonb',
            isNullable: true,
            comment: 'Accessibility requirements for participation'
          },
          {
            name: 'consent_to_record',
            type: 'boolean',
            default: false,
            isNullable: false,
            comment: 'Consent to record the meeting'
          },
          {
            name: 'data_sharing_consent',
            type: 'boolean',
            default: false,
            isNullable: false,
            comment: 'Consent to share information with other participants'
          },
          {
            name: 'is_mandatory',
            type: 'boolean',
            default: false,
            isNullable: false,
            comment: 'Whether participation is mandatory for the review'
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
            columnNames: ['care_review_id'],
            referencedTableName: 'care_reviews',
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
      'review_participants',
      new Index('idx_review_participants_care_review', ['care_review_id'])
    );

    await queryRunner.createIndex(
      'review_participants',
      new Index('idx_review_participants_type', ['participant_type'])
    );

    await queryRunner.createIndex(
      'review_participants',
      new Index('idx_review_participants_participant_id', ['participant_id'])
    );

    await queryRunner.createIndex(
      'review_participants',
      new Index('idx_review_participants_invitation_status', ['invitation_status'])
    );

    await queryRunner.createIndex(
      'review_participants',
      new Index('idx_review_participants_attendance_status', ['attendance_status'])
    );

    await queryRunner.createIndex(
      'review_participants',
      new Index('idx_review_participants_mandatory', ['is_mandatory'])
    );

    await queryRunner.createIndex(
      'review_participants',
      new Index('idx_review_participants_email', ['participant_email'])
    );

    // Create audit indexes
    await queryRunner.createIndex(
      'review_participants',
      new Index('idx_review_participants_audit', ['created_at', 'updated_at'])
    );

    await queryRunner.createIndex(
      'review_participants',
      new Index('idx_review_participants_timing', ['invited_at', 'responded_at', 'arrived_at'])
    );

    // Create GIN indexes for JSONB columns
    await queryRunner.query(`
      CREATE INDEX idx_review_participants_actions_gin ON review_participants USING GIN (follow_up_actions);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_review_participants_preferences_gin ON review_participants USING GIN (contact_preferences);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_review_participants_accessibility_gin ON review_participants USING GIN (accessibility_requirements);
    `);

    // Create updated_at trigger
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_review_participants_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_review_participants_updated_at
        BEFORE UPDATE ON review_participants
        FOR EACH ROW
        EXECUTE FUNCTION update_review_participants_updated_at();
    `);

    // Create full-text search indexes
    await queryRunner.query(`
      CREATE INDEX idx_review_participants_contribution_fts 
      ON review_participants USING GIN (to_tsvector('english', contribution));
    `);

    await queryRunner.query(`
      CREATE INDEX idx_review_participants_concerns_fts 
      ON review_participants USING GIN (to_tsvector('english', concerns_raised));
    `);

    await queryRunner.query(`
      CREATE INDEX idx_review_participants_recommendations_fts 
      ON review_participants USING GIN (to_tsvector('english', recommendations));
    `);

    // Add table comment
    await queryRunner.query(`
      COMMENT ON TABLE review_participants IS 'Participants in care review meetings with attendance tracking';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers and functions
    await queryRunner.query('DROP TRIGGER IF EXISTS update_review_participants_updated_at ON review_participants;');
    await queryRunner.query('DROP FUNCTION IF EXISTS update_review_participants_updated_at();');

    // Drop table
    await queryRunner.dropTable('review_participants');
  }
}