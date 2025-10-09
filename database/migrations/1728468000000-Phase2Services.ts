import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

/**
 * Phase 2 Services Database Migration
 * 
 * Creates tables for:
 * - Service #8: Document Management
 * - Service #9: Family Communication
 * - Service #10: Incident Management
 * - Service #11: Health Monitoring
 * - Service #12: Activity & Wellbeing
 * - Service #14: Reporting & Analytics (uses existing tables)
 * 
 * Production Ready: October 9, 2025
 * Git Commit: 241bb8c
 */
export class Phase2Services1728468000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // SERVICE #8: DOCUMENT MANAGEMENT
    // ============================================================

    await queryRunner.createTable(
      new Table({
        name: 'documents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'document_number',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'document_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'version',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'draft'",
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'file_path',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'file_size',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
          },
          {
            name: 'approved_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'approved_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'published_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'expiry_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'compliance_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'IDX_DOCUMENTS_ORGANIZATION',
            columnNames: ['organization_id'],
          },
          {
            name: 'IDX_DOCUMENTS_TYPE',
            columnNames: ['document_type'],
          },
          {
            name: 'IDX_DOCUMENTS_STATUS',
            columnNames: ['status'],
          },
          {
            name: 'IDX_DOCUMENTS_EXPIRY',
            columnNames: ['expiry_date'],
          },
        ],
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: 'document_versions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'document_id',
            type: 'uuid',
          },
          {
            name: 'version_number',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'file_path',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'change_summary',
            type: 'text',
          },
          {
            name: 'created_by',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_DOCUMENT_VERSIONS_DOCUMENT',
            columnNames: ['document_id'],
          },
        ],
      }),
      true
    );

    // ============================================================
    // SERVICE #9: FAMILY COMMUNICATION
    // ============================================================

    await queryRunner.createTable(
      new Table({
        name: 'family_members',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'resident_id',
            type: 'uuid',
          },
          {
            name: 'first_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'last_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'relationship',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'access_level',
            type: 'varchar',
            length: '50',
            default: "'view_only'",
          },
          {
            name: 'is_emergency_contact',
            type: 'boolean',
            default: false,
          },
          {
            name: 'preferences',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'IDX_FAMILY_MEMBERS_RESIDENT',
            columnNames: ['resident_id'],
          },
          {
            name: 'IDX_FAMILY_MEMBERS_ORGANIZATION',
            columnNames: ['organization_id'],
          },
        ],
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: 'family_messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'resident_id',
            type: 'uuid',
          },
          {
            name: 'family_member_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'message_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'message',
            type: 'text',
          },
          {
            name: 'priority',
            type: 'varchar',
            length: '20',
            default: "'normal'",
          },
          {
            name: 'is_encrypted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'sent_by',
            type: 'uuid',
          },
          {
            name: 'sent_by_type',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'read_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'acknowledged_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'attachments',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'IDX_FAMILY_MESSAGES_RESIDENT',
            columnNames: ['resident_id'],
          },
          {
            name: 'IDX_FAMILY_MESSAGES_FAMILY_MEMBER',
            columnNames: ['family_member_id'],
          },
          {
            name: 'IDX_FAMILY_MESSAGES_ORGANIZATION',
            columnNames: ['organization_id'],
          },
        ],
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: 'family_visits',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'resident_id',
            type: 'uuid',
          },
          {
            name: 'family_member_id',
            type: 'uuid',
          },
          {
            name: 'visit_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'scheduled_date',
            type: 'timestamp',
          },
          {
            name: 'duration_minutes',
            type: 'integer',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
          },
          {
            name: 'approved_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'approved_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'IDX_FAMILY_VISITS_RESIDENT',
            columnNames: ['resident_id'],
          },
          {
            name: 'IDX_FAMILY_VISITS_FAMILY_MEMBER',
            columnNames: ['family_member_id'],
          },
          {
            name: 'IDX_FAMILY_VISITS_SCHEDULED',
            columnNames: ['scheduled_date'],
          },
        ],
      }),
      true
    );

    // ============================================================
    // SERVICE #10: INCIDENT MANAGEMENT
    // ============================================================

    await queryRunner.createTable(
      new Table({
        name: 'incident_reports',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'incident_number',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'incident_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'severity',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'reported'",
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'incident_date_time',
            type: 'timestamp',
          },
          {
            name: 'reported_by',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'location',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'affected_persons',
            type: 'integer',
            default: 0,
          },
          {
            name: 'witness_statements',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'immediate_actions',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'root_cause_analysis',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'corrective_actions',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'cqc_reporting',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'ai_analysis',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'quality_assurance',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'IDX_INCIDENT_REPORTS_ORGANIZATION',
            columnNames: ['organization_id'],
          },
          {
            name: 'IDX_INCIDENT_REPORTS_TYPE',
            columnNames: ['incident_type'],
          },
          {
            name: 'IDX_INCIDENT_REPORTS_SEVERITY',
            columnNames: ['severity'],
          },
          {
            name: 'IDX_INCIDENT_REPORTS_STATUS',
            columnNames: ['status'],
          },
          {
            name: 'IDX_INCIDENT_REPORTS_DATE',
            columnNames: ['incident_date_time'],
          },
        ],
      }),
      true
    );

    // ============================================================
    // SERVICE #11: HEALTH MONITORING
    // ============================================================

    await queryRunner.createTable(
      new Table({
        name: 'vital_signs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'resident_id',
            type: 'uuid',
          },
          {
            name: 'recorded_at',
            type: 'timestamp',
          },
          {
            name: 'systolic_bp',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'diastolic_bp',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'heart_rate',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'temperature',
            type: 'decimal',
            precision: 4,
            scale: 1,
            isNullable: true,
          },
          {
            name: 'oxygen_saturation',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'respiratory_rate',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'blood_glucose',
            type: 'decimal',
            precision: 5,
            scale: 1,
            isNullable: true,
          },
          {
            name: 'news2_score',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'clinical_response',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'concerns',
            type: 'boolean',
            default: false,
          },
          {
            name: 'recorded_by',
            type: 'uuid',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_VITAL_SIGNS_RESIDENT',
            columnNames: ['resident_id'],
          },
          {
            name: 'IDX_VITAL_SIGNS_RECORDED_AT',
            columnNames: ['recorded_at'],
          },
          {
            name: 'IDX_VITAL_SIGNS_ORGANIZATION',
            columnNames: ['organization_id'],
          },
        ],
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: 'weight_records',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'resident_id',
            type: 'uuid',
          },
          {
            name: 'recorded_at',
            type: 'timestamp',
          },
          {
            name: 'weight_kg',
            type: 'decimal',
            precision: 5,
            scale: 2,
          },
          {
            name: 'height_cm',
            type: 'decimal',
            precision: 5,
            scale: 1,
            isNullable: true,
          },
          {
            name: 'bmi',
            type: 'decimal',
            precision: 4,
            scale: 1,
            isNullable: true,
          },
          {
            name: 'trend',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'recorded_by',
            type: 'uuid',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_WEIGHT_RECORDS_RESIDENT',
            columnNames: ['resident_id'],
          },
          {
            name: 'IDX_WEIGHT_RECORDS_RECORDED_AT',
            columnNames: ['recorded_at'],
          },
        ],
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: 'health_assessments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'resident_id',
            type: 'uuid',
          },
          {
            name: 'assessment_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'assessment_date',
            type: 'timestamp',
          },
          {
            name: 'findings',
            type: 'text',
          },
          {
            name: 'risk_score',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'recommendations',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'review_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
          },
          {
            name: 'completed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'assessed_by',
            type: 'uuid',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'IDX_HEALTH_ASSESSMENTS_RESIDENT',
            columnNames: ['resident_id'],
          },
          {
            name: 'IDX_HEALTH_ASSESSMENTS_TYPE',
            columnNames: ['assessment_type'],
          },
          {
            name: 'IDX_HEALTH_ASSESSMENTS_DATE',
            columnNames: ['assessment_date'],
          },
        ],
      }),
      true
    );

    // ============================================================
    // SERVICE #12: ACTIVITY & WELLBEING
    // ============================================================

    await queryRunner.createTable(
      new Table({
        name: 'activities',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'activity_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'activity_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'scheduled_date',
            type: 'timestamp',
          },
          {
            name: 'duration_minutes',
            type: 'integer',
          },
          {
            name: 'location',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'capacity',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'staff_assigned',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'resources_required',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'scheduled'",
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'IDX_ACTIVITIES_ORGANIZATION',
            columnNames: ['organization_id'],
          },
          {
            name: 'IDX_ACTIVITIES_TYPE',
            columnNames: ['activity_type'],
          },
          {
            name: 'IDX_ACTIVITIES_SCHEDULED',
            columnNames: ['scheduled_date'],
          },
        ],
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: 'activity_attendance',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'activity_id',
            type: 'uuid',
          },
          {
            name: 'resident_id',
            type: 'uuid',
          },
          {
            name: 'participation_level',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'enjoyment_rating',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'engagement_rating',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'recorded_by',
            type: 'uuid',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_ACTIVITY_ATTENDANCE_ACTIVITY',
            columnNames: ['activity_id'],
          },
          {
            name: 'IDX_ACTIVITY_ATTENDANCE_RESIDENT',
            columnNames: ['resident_id'],
          },
        ],
      }),
      true
    );

    // ============================================================
    // FOREIGN KEY CONSTRAINTS
    // ============================================================

    // Document versions -> Documents
    await queryRunner.createForeignKey(
      'document_versions',
      new TableForeignKey({
        columnNames: ['document_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'documents',
        onDelete: 'CASCADE',
      })
    );

    // Activity attendance -> Activities
    await queryRunner.createForeignKey(
      'activity_attendance',
      new TableForeignKey({
        columnNames: ['activity_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'activities',
        onDelete: 'CASCADE',
      })
    );

    console.log('✅ Phase 2 Services migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (respecting foreign keys)
    await queryRunner.dropTable('activity_attendance', true);
    await queryRunner.dropTable('activities', true);
    await queryRunner.dropTable('health_assessments', true);
    await queryRunner.dropTable('weight_records', true);
    await queryRunner.dropTable('vital_signs', true);
    await queryRunner.dropTable('incident_reports', true);
    await queryRunner.dropTable('family_visits', true);
    await queryRunner.dropTable('family_messages', true);
    await queryRunner.dropTable('family_members', true);
    await queryRunner.dropTable('document_versions', true);
    await queryRunner.dropTable('documents', true);

    console.log('✅ Phase 2 Services migration rolled back successfully');
  }
}
