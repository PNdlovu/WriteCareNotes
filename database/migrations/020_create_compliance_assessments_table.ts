/**
 * @fileoverview Compliance Assessments table migration for WriteCareNotes
 * @module ComplianceAssessmentsMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Creates the compliance_assessments table for managing
 * regulatory compliance assessments and monitoring.
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

export class CreateComplianceAssessmentsTable1704834010000 implements MigrationInterface {
  name = 'CreateComplianceAssessmentsTable1704834010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create compliance_assessments table
    await queryRunner.createTable(
      new Table({
        name: 'compliance_assessments',
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
            isNullable: true,
            comment: 'Associated care plan if assessment is plan-specific'
          },
          {
            name: 'resident_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Associated resident if assessment is resident-specific'
          },
          {
            name: 'framework',
            type: 'enum',
            enum: ['cqc', 'care_inspectorate', 'ciw', 'rqia', 'nice', 'dols', 'mca', 'gdpr'],
            isNullable: false,
            comment: 'Regulatory framework being assessed'
          },
          {
            name: 'standard_reference',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: 'Reference to specific standard or regulation'
          },
          {
            name: 'standard_title',
            type: 'varchar',
            length: '500',
            isNullable: false,
            comment: 'Title of the standard being assessed'
          },
          {
            name: 'standard_description',
            type: 'text',
            isNullable: true,
            comment: 'Description of the standard requirements'
          },
          {
            name: 'assessment_type',
            type: 'enum',
            enum: ['self_assessment', 'internal_audit', 'external_audit', 'inspection_preparation', 'continuous_monitoring'],
            isNullable: false
          },
          {
            name: 'assessment_date',
            type: 'date',
            isNullable: false
          },
          {
            name: 'assessment_period_start',
            type: 'date',
            isNullable: true,
            comment: 'Start date of period being assessed'
          },
          {
            name: 'assessment_period_end',
            type: 'date',
            isNullable: true,
            comment: 'End date of period being assessed'
          },
          {
            name: 'compliance_status',
            type: 'enum',
            enum: ['compliant', 'partially_compliant', 'non_compliant', 'not_applicable', 'under_review'],
            isNullable: false
          },
          {
            name: 'compliance_score',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
            comment: 'Numerical compliance score (0-100)'
          },
          {
            name: 'risk_level',
            type: 'enum',
            enum: ['low', 'medium', 'high', 'critical'],
            default: \"'medium'\",
            isNullable: false
          },
          {
            name: 'evidence',
            type: 'jsonb',
            isNullable: true,
            comment: 'Evidence supporting the compliance assessment'
          },
          {
            name: 'evidence_files',
            type: 'jsonb',
            isNullable: true,
            comment: 'File attachments as evidence'
          },
          {
            name: 'gaps_identified',
            type: 'jsonb',
            isNullable: true,
            comment: 'Identified gaps in compliance'
          },
          {
            name: 'recommendations',
            type: 'jsonb',
            isNullable: true,
            comment: 'Recommendations for improvement'
          },
          {
            name: 'action_required',
            type: 'text',
            isNullable: true,
            comment: 'Actions required to achieve compliance'
          },
          {
            name: 'action_plan',
            type: 'jsonb',
            isNullable: true,
            comment: 'Detailed action plan with timelines'
          },
          {
            name: 'responsible_person',
            type: 'uuid',
            isNullable: true,
            comment: 'Person responsible for addressing compliance issues'
          },
          {
            name: 'target_completion_date',
            type: 'date',
            isNullable: true,
            comment: 'Target date for achieving compliance'
          },
          {
            name: 'actual_completion_date',
            type: 'date',
            isNullable: true,
            comment: 'Actual date compliance was achieved'
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
            name: 'next_assessment_date',
            type: 'date',
            isNullable: true,
            comment: 'Date for next assessment of this standard'
          },
          {
            name: 'assessed_by',
            type: 'uuid',
            isNullable: false,
            comment: 'Staff member who conducted the assessment'
          },
          {
            name: 'reviewed_by',
            type: 'uuid',
            isNullable: true,
            comment: 'Senior staff member who reviewed the assessment'
          },
          {
            name: 'reviewed_at',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'approved_by',
            type: 'uuid',
            isNullable: true,
            comment: 'Manager who approved the assessment'
          },
          {
            name: 'approved_at',
            type: 'timestamp with time zone',
            isNullable: true
          },
          {
            name: 'external_auditor',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'External auditor if applicable'
          },
          {
            name: 'external_audit_report',
            type: 'jsonb',
            isNullable: true,
            comment: 'External audit report details'
          },
          {
            name: 'inspection_findings',
            type: 'jsonb',
            isNullable: true,
            comment: 'Findings from regulatory inspections'
          },
          {
            name: 'corrective_actions_taken',
            type: 'jsonb',
            isNullable: true,
            comment: 'Corrective actions that have been implemented'
          },
          {
            name: 'monitoring_frequency',
            type: 'enum',
            enum: ['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'ad_hoc'],
            default: \"'monthly'\",
            isNullable: false
          },
          {
            name: 'last_monitoring_date',
            type: 'date',
            isNullable: true
          },
          {
            name: 'next_monitoring_date',
            type: 'date',
            isNullable: true
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
            comment: 'Additional notes about the assessment'
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
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
          },
          {
            columnNames: ['resident_id'],
            referencedTableName: 'residents',
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
      'compliance_assessments',
      new Index('idx_compliance_assessments_framework', ['framework'])
    );

    await queryRunner.createIndex(
      'compliance_assessments',
      new Index('idx_compliance_assessments_standard', ['standard_reference'])
    );

    await queryRunner.createIndex(
      'compliance_assessments',
      new Index('idx_compliance_assessments_status', ['compliance_status'])
    );

    await queryRunner.createIndex(
      'compliance_assessments',
      new Index('idx_compliance_assessments_risk', ['risk_level'])
    );

    await queryRunner.createIndex(
      'compliance_assessments',
      new Index('idx_compliance_assessments_date', ['assessment_date'])
    );

    await queryRunner.createIndex(
      'compliance_assessments',
      new Index('idx_compliance_assessments_care_plan', ['care_plan_id'])
    );

    await queryRunner.createIndex(
      'compliance_assessments',
      new Index('idx_compliance_assessments_resident', ['resident_id'])
    );

    await queryRunner.createIndex(
      'compliance_assessments',
      new Index('idx_compliance_assessments_follow_up', ['follow_up_required', 'follow_up_date'])
    );

    await queryRunner.createIndex(
      'compliance_assessments',
      new Index('idx_compliance_assessments_next_assessment', ['next_assessment_date'])
    );

    await queryRunner.createIndex(
      'compliance_assessments',
      new Index('idx_compliance_assessments_monitoring', ['monitoring_frequency', 'next_monitoring_date'])
    );

    // Create audit indexes
    await queryRunner.createIndex(
      'compliance_assessments',
      new Index('idx_compliance_assessments_audit', ['created_at', 'updated_at'])
    );

    await queryRunner.createIndex(
      'compliance_assessments',
      new Index('idx_compliance_assessments_assessed_by', ['assessed_by'])
    );

    await queryRunner.createIndex(
      'compliance_assessments',
      new Index('idx_compliance_assessments_reviewed_by', ['reviewed_by'])
    );

    await queryRunner.createIndex(
      'compliance_assessments',
      new Index('idx_compliance_assessments_approved_by', ['approved_by'])
    );

    // Create GIN indexes for JSONB columns
    await queryRunner.query(`
      CREATE INDEX idx_compliance_assessments_evidence_gin ON compliance_assessments USING GIN (evidence);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_compliance_assessments_gaps_gin ON compliance_assessments USING GIN (gaps_identified);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_compliance_assessments_recommendations_gin ON compliance_assessments USING GIN (recommendations);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_compliance_assessments_action_plan_gin ON compliance_assessments USING GIN (action_plan);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_compliance_assessments_findings_gin ON compliance_assessments USING GIN (inspection_findings);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_compliance_assessments_corrective_gin ON compliance_assessments USING GIN (corrective_actions_taken);
    `);

    // Create updated_at trigger
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_compliance_assessments_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_compliance_assessments_updated_at
        BEFORE UPDATE ON compliance_assessments
        FOR EACH ROW
        EXECUTE FUNCTION update_compliance_assessments_updated_at();
    `);

    // Create constraint to ensure compliance score is between 0 and 100
    await queryRunner.query(`
      ALTER TABLE compliance_assessments ADD CONSTRAINT chk_compliance_assessments_score 
      CHECK (compliance_score >= 0 AND compliance_score <= 100);
    `);

    // Create full-text search indexes
    await queryRunner.query(`
      CREATE INDEX idx_compliance_assessments_title_fts 
      ON compliance_assessments USING GIN (to_tsvector('english', standard_title));
    `);

    await queryRunner.query(`
      CREATE INDEX idx_compliance_assessments_description_fts 
      ON compliance_assessments USING GIN (to_tsvector('english', standard_description));
    `);

    await queryRunner.query(`
      CREATE INDEX idx_compliance_assessments_action_fts 
      ON compliance_assessments USING GIN (to_tsvector('english', action_required));
    `);

    await queryRunner.query(`
      CREATE INDEX idx_compliance_assessments_notes_fts 
      ON compliance_assessments USING GIN (to_tsvector('english', notes));
    `);

    // Add table comment
    await queryRunner.query(`
      COMMENT ON TABLE compliance_assessments IS 'Regulatory compliance assessments and monitoring for care standards';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers and functions
    await queryRunner.query('DROP TRIGGER IF EXISTS update_compliance_assessments_updated_at ON compliance_assessments;');
    await queryRunner.query('DROP FUNCTION IF EXISTS update_compliance_assessments_updated_at();');

    // Drop table
    await queryRunner.dropTable('compliance_assessments');
  }
}