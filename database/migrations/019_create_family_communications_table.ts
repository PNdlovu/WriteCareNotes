/**
 * @fileoverview Family Communications table migration for WriteCareNotes
 * @module FamilyCommunicationsMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Creates the family_communications table for managing
 * communications between care staff and family members.
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

export class CreateFamilyCommunicationsTable1704834009000 implements MigrationInterface {
  name = 'CreateFamilyCommunicationsTable1704834009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create family_communications table
    await queryRunner.createTable(
      new Table({
        name: 'family_communications',
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
            name: 'family_member_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Reference to family member if registered in system'
          },
          {
            name: 'family_member_name',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 'family_member_relationship',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Relationship to resident (son, daughter, spouse, etc.)'
          },
          {
            name: 'family_member_email',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'family_member_phone',
            type: 'varchar',
            length: '50',
            isNullable: true
          },
          {
            name: 'communication_type',
            type: 'enum',
            enum: ['care_update', 'review_invitation', 'incident_notification', 'general', 'emergency', 'medication_change', 'health_update', 'social_update'],
            isNullable: false
          },
          {
            name: 'priority',
            type: 'enum',
            enum: ['low', 'normal', 'high', 'urgent'],
            default: \"'normal'\",
            isNullable: false
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '500',
            isNullable: false
          },
          {
            name: 'message',
            type: 'text',
            isNullable: false
          },
          {
            name: 'sent_by',
            type: 'uuid',
            isNullable: false,
            comment: 'Staff member who sent the communication'
          },
          {
            name: 'sent_at',
            type: 'timestamp with time zone',
            isNullable: false
          },
          {
            name: 'delivery_method',
            type: 'enum',
            enum: ['portal', 'email', 'sms', 'phone', 'letter', 'in_person'],
            isNullable: false
          },
          {
            name: 'delivery_status',
            type: 'enum',
            enum: ['pending', 'sent', 'delivered', 'read', 'failed', 'bounced'],
            default: \"'pending'\",
            isNullable: false
          },
          {
            name: 'delivery_attempts',
            type: 'integer',
            default: 0,
            isNullable: false
          },
          {
            name: 'delivered_at',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'read_at',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'response_requested',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'response_deadline',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'response',
            type: 'text',
            isNullable: true,
            comment: 'Response from family member'
          },
          {
            name: 'response_at',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'response_method',
            type: 'enum',
            enum: ['portal', 'email', 'sms', 'phone', 'letter', 'in_person'],
            isNullable: true
          },
          {
            name: 'attachments',
            type: 'jsonb',
            isNullable: true,
            comment: 'File attachments with metadata'
          },
          {
            name: 'related_care_plan_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Related care plan if applicable'
          },
          {
            name: 'related_care_review_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Related care review if applicable'
          },
          {
            name: 'related_incident_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Related incident if applicable'
          },
          {
            name: 'consent_obtained',
            type: 'boolean',
            default: true,
            isNullable: false,
            comment: 'Whether consent was obtained to share information'
          },
          {
            name: 'confidentiality_level',
            type: 'enum',
            enum: ['public', 'family_only', 'restricted', 'confidential'],
            default: \"'family_only'\",
            isNullable: false
          },
          {
            name: 'communication_preferences',
            type: 'jsonb',
            isNullable: true,
            comment: 'Family member communication preferences'
          },
          {
            name: 'follow_up_required',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'follow_up_date',
            type: 'date',
            isNullable: true
          },
          {
            name: 'follow_up_notes',
            type: 'text',
            isNullable: true
          },
          {
            name: 'archived',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'archived_at',
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
            columnNames: ['related_care_plan_id'],
            referencedTableName: 'care_plans',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
          },
          {
            columnNames: ['related_care_review_id'],
            referencedTableName: 'care_reviews',
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
      'family_communications',
      new Index('idx_family_communications_resident', ['resident_id'])
    );

    await queryRunner.createIndex(
      'family_communications',
      new Index('idx_family_communications_family_member', ['family_member_id'])
    );

    await queryRunner.createIndex(
      'family_communications',
      new Index('idx_family_communications_type', ['communication_type'])
    );

    await queryRunner.createIndex(
      'family_communications',
      new Index('idx_family_communications_priority', ['priority'])
    );

    await queryRunner.createIndex(
      'family_communications',
      new Index('idx_family_communications_sent_at', ['sent_at'])
    );

    await queryRunner.createIndex(
      'family_communications',
      new Index('idx_family_communications_delivery_status', ['delivery_status'])
    );

    await queryRunner.createIndex(
      'family_communications',
      new Index('idx_family_communications_response_requested', ['response_requested', 'response_deadline'])
    );

    await queryRunner.createIndex(
      'family_communications',
      new Index('idx_family_communications_follow_up', ['follow_up_required', 'follow_up_date'])
    );

    await queryRunner.createIndex(
      'family_communications',
      new Index('idx_family_communications_unread', ['delivery_status', 'read_at'], {
        where: \"delivery_status = 'delivered' AND read_at IS NULL\"
      })
    );

    // Create audit indexes
    await queryRunner.createIndex(
      'family_communications',
      new Index('idx_family_communications_audit', ['created_at', 'updated_at'])
    );

    await queryRunner.createIndex(
      'family_communications',
      new Index('idx_family_communications_sent_by', ['sent_by'])
    );

    // Create GIN indexes for JSONB columns
    await queryRunner.query(`
      CREATE INDEX idx_family_communications_attachments_gin ON family_communications USING GIN (attachments);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_family_communications_preferences_gin ON family_communications USING GIN (communication_preferences);
    `);

    // Create updated_at trigger
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_family_communications_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_family_communications_updated_at
        BEFORE UPDATE ON family_communications
        FOR EACH ROW
        EXECUTE FUNCTION update_family_communications_updated_at();
    `);

    // Create trigger to automatically set read_at when delivery_status changes to read
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_family_communication_read_at()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.delivery_status = 'read' AND OLD.delivery_status != 'read' AND NEW.read_at IS NULL THEN
          NEW.read_at = CURRENT_TIMESTAMP;
        END IF;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER set_family_communication_read_at
        BEFORE UPDATE ON family_communications
        FOR EACH ROW
        EXECUTE FUNCTION set_family_communication_read_at();
    `);

    // Create full-text search indexes
    await queryRunner.query(`
      CREATE INDEX idx_family_communications_subject_fts 
      ON family_communications USING GIN (to_tsvector('english', subject));
    `);

    await queryRunner.query(`
      CREATE INDEX idx_family_communications_message_fts 
      ON family_communications USING GIN (to_tsvector('english', message));
    `);

    await queryRunner.query(`
      CREATE INDEX idx_family_communications_response_fts 
      ON family_communications USING GIN (to_tsvector('english', response));
    `);

    // Create constraint to ensure delivery attempts is non-negative
    await queryRunner.query(`
      ALTER TABLE family_communications ADD CONSTRAINT chk_family_communications_delivery_attempts 
      CHECK (delivery_attempts >= 0);
    `);

    // Add table comment
    await queryRunner.query(`
      COMMENT ON TABLE family_communications IS 'Communications between care staff and family members';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers and functions
    await queryRunner.query('DROP TRIGGER IF EXISTS update_family_communications_updated_at ON family_communications;');
    await queryRunner.query('DROP TRIGGER IF EXISTS set_family_communication_read_at ON family_communications;');
    await queryRunner.query('DROP FUNCTION IF EXISTS update_family_communications_updated_at();');
    await queryRunner.query('DROP FUNCTION IF EXISTS set_family_communication_read_at();');

    // Drop table
    await queryRunner.dropTable('family_communications');
  }
}