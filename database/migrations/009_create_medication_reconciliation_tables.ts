/**
 * @fileoverview Database Migration - Medication Reconciliation Tables
 * @module MedicationReconciliationMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Creates comprehensive database tables for medication reconciliation
 * functionality including reconciliation records, discrepancies, resolutions,
 * and pharmacist reviews with full audit trail support.
 * 
 * @compliance
 * - NICE Clinical Guidelines CG76 - Medicines reconciliation
 * - Royal Pharmaceutical Society Guidelines
 * - CQC Regulation 12 - Safe care and treatment
 * - GDPR and Data Protection Act 2018
 * 
 * @security
 * - Row-level security policies
 * - Audit trail columns
 * - Data encryption for sensitive fields
 * - Comprehensive indexing for performance
 */

import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from 'typeorm';

export class CreateMedicationReconciliationTables1704067200009 implements MigrationInterface {
  name = 'CreateMedicationReconciliationTables1704067200009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create medication_reconciliation_records table
    await queryRunner.createTable(
      new Table({
        name: 'medication_reconciliation_records',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '255',
            isPrimary: true,
            comment: 'Unique identifier for reconciliation record'
          },
          {
            name: 'resident_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Reference to resident'
          },
          {
            name: 'reconciliation_type',
            type: 'enum',
            enum: ['admission', 'discharge', 'transfer', 'periodic_review'],
            isNullable: false,
            comment: 'Type of medication reconciliation'
          },
          {
            name: 'reconciliation_date',
            type: 'timestamp with time zone',
            isNullable: false,
            comment: 'Date and time when reconciliation was performed'
          },
          {
            name: 'performed_by',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'ID of healthcare professional who performed reconciliation'
          },
          {
            name: 'reviewed_by',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'ID of healthcare professional who reviewed reconciliation'
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['in_progress', 'completed', 'requires_review', 'approved'],
            default: "'in_progress'",
            isNullable: false,
            comment: 'Current status of reconciliation process'
          },
          {
            name: 'source_list',
            type: 'jsonb',
            isNullable: false,
            comment: 'Source medication list (encrypted JSON)'
          },
          {
            name: 'target_list',
            type: 'jsonb',
            isNullable: false,
            comment: 'Target medication list (encrypted JSON)'
          },
          {
            name: 'discrepancies',
            type: 'jsonb',
            isNullable: false,
            default: "'[]'::jsonb",
            comment: 'Array of identified discrepancies (encrypted JSON)'
          },
          {
            name: 'resolutions',
            type: 'jsonb',
            isNullable: false,
            default: "'[]'::jsonb",
            comment: 'Array of discrepancy resolutions (encrypted JSON)'
          },
          {
            name: 'clinical_notes',
            type: 'text',
            isNullable: true,
            comment: 'Clinical notes related to reconciliation (encrypted)'
          },
          {
            name: 'pharmacist_review',
            type: 'jsonb',
            isNullable: true,
            comment: 'Pharmacist review details (encrypted JSON)'
          },
          {
            name: 'transfer_details',
            type: 'jsonb',
            isNullable: true,
            comment: 'Transfer-specific details if applicable (encrypted JSON)'
          },
          {
            name: 'organization_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Organization identifier for multi-tenancy'
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Record creation timestamp'
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Record last update timestamp'
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'User who created the record'
          },
          {
            name: 'updated_by',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'User who last updated the record'
          },
          {
            name: 'version',
            type: 'integer',
            default: 1,
            isNullable: false,
            comment: 'Version number for optimistic locking'
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Soft delete timestamp'
          }
        ],
        checks: [
          {
            name: 'ck_reconciliation_status_valid',
            expression: "status IN ('in_progress', 'completed', 'requires_review', 'approved')"
          },
          {
            name: 'ck_reconciliation_type_valid', 
            expression: "reconciliation_type IN ('admission', 'discharge', 'transfer', 'periodic_review')"
          }
        ]
      }),
      true
    );

    // Create medication_reconciliation_audit table for comprehensive audit trail
    await queryRunner.createTable(
      new Table({
        name: 'medication_reconciliation_audit',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
            isPrimary: true,
            comment: 'Unique identifier for audit record'
          },
          {
            name: 'reconciliation_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Reference to reconciliation record'
          },
          {
            name: 'action_type',
            type: 'enum',
            enum: [
              'created', 'updated', 'status_changed', 'discrepancy_identified',
              'discrepancy_resolved', 'pharmacist_review_requested', 'pharmacist_review_completed',
              'approved', 'rejected', 'deleted'
            ],
            isNullable: false,
            comment: 'Type of action performed'
          },
          {
            name: 'action_description',
            type: 'text',
            isNullable: false,
            comment: 'Detailed description of the action'
          },
          {
            name: 'old_values',
            type: 'jsonb',
            isNullable: true,
            comment: 'Previous values before change (encrypted JSON)'
          },
          {
            name: 'new_values',
            type: 'jsonb',
            isNullable: true,
            comment: 'New values after change (encrypted JSON)'
          },
          {
            name: 'performed_by',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'User who performed the action'
          },
          {
            name: 'performed_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Timestamp when action was performed'
          },
          {
            name: 'ip_address',
            type: 'inet',
            isNullable: true,
            comment: 'IP address of the user'
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
            comment: 'User agent string'
          },
          {
            name: 'session_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Session identifier'
          },
          {
            name: 'correlation_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Request correlation identifier'
          },
          {
            name: 'organization_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Organization identifier'
          },
          {
            name: 'compliance_flags',
            type: 'jsonb',
            isNullable: true,
            default: "'[]'::jsonb",
            comment: 'Compliance-related flags and metadata'
          }
        ]
      }),
      true
    );

    // Create medication_reconciliation_metrics table for performance tracking
    await queryRunner.createTable(
      new Table({
        name: 'medication_reconciliation_metrics',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
            isPrimary: true,
            comment: 'Unique identifier for metrics record'
          },
          {
            name: 'reconciliation_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Reference to reconciliation record'
          },
          {
            name: 'metric_type',
            type: 'enum',
            enum: [
              'completion_time', 'discrepancy_count', 'resolution_time',
              'pharmacist_review_time', 'critical_issues_count', 'user_satisfaction'
            ],
            isNullable: false,
            comment: 'Type of metric being recorded'
          },
          {
            name: 'metric_value',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
            comment: 'Numeric value of the metric'
          },
          {
            name: 'metric_unit',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Unit of measurement for the metric'
          },
          {
            name: 'metric_metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Additional metadata about the metric'
          },
          {
            name: 'recorded_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Timestamp when metric was recorded'
          },
          {
            name: 'organization_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Organization identifier'
          }
        ]
      }),
      true
    );

    // Create indexes for all tables
    await queryRunner.query(`CREATE INDEX idx_reconciliation_resident_org ON medication_reconciliation_records (resident_id, organization_id);`);
    await queryRunner.query(`CREATE INDEX idx_reconciliation_type_date ON medication_reconciliation_records (reconciliation_type, reconciliation_date);`);
    await queryRunner.query(`CREATE INDEX idx_reconciliation_status ON medication_reconciliation_records (status);`);
    await queryRunner.query(`CREATE INDEX idx_reconciliation_performed_by ON medication_reconciliation_records (performed_by);`);
    await queryRunner.query(`CREATE INDEX idx_reconciliation_reviewed_by ON medication_reconciliation_records (reviewed_by);`);
    await queryRunner.query(`CREATE INDEX idx_reconciliation_created_at ON medication_reconciliation_records (created_at);`);
    await queryRunner.query(`CREATE INDEX idx_reconciliation_organization ON medication_reconciliation_records (organization_id);`);
    await queryRunner.query(`CREATE INDEX idx_reconciliation_deleted_at ON medication_reconciliation_records (deleted_at);`);
    
    await queryRunner.query(`CREATE INDEX idx_reconciliation_audit_reconciliation_id ON medication_reconciliation_audit (reconciliation_id);`);
    await queryRunner.query(`CREATE INDEX idx_reconciliation_audit_action_type ON medication_reconciliation_audit (action_type);`);
    await queryRunner.query(`CREATE INDEX idx_reconciliation_audit_performed_by ON medication_reconciliation_audit (performed_by);`);
    await queryRunner.query(`CREATE INDEX idx_reconciliation_audit_performed_at ON medication_reconciliation_audit (performed_at);`);
    await queryRunner.query(`CREATE INDEX idx_reconciliation_audit_organization ON medication_reconciliation_audit (organization_id);`);
    await queryRunner.query(`CREATE INDEX idx_reconciliation_audit_correlation_id ON medication_reconciliation_audit (correlation_id);`);
    
    await queryRunner.query(`CREATE INDEX idx_reconciliation_metrics_reconciliation_id ON medication_reconciliation_metrics (reconciliation_id);`);
    await queryRunner.query(`CREATE INDEX idx_reconciliation_metrics_type ON medication_reconciliation_metrics (metric_type);`);
    await queryRunner.query(`CREATE INDEX idx_reconciliation_metrics_recorded_at ON medication_reconciliation_metrics (recorded_at);`);
    await queryRunner.query(`CREATE INDEX idx_reconciliation_metrics_organization ON medication_reconciliation_metrics (organization_id);`);

    // Create foreign key constraints using SQL
    await queryRunner.query(`
      ALTER TABLE medication_reconciliation_records
      ADD CONSTRAINT fk_reconciliation_resident
      FOREIGN KEY (resident_id) REFERENCES residents(id)
      ON DELETE RESTRICT ON UPDATE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE medication_reconciliation_records
      ADD CONSTRAINT fk_reconciliation_organization
      FOREIGN KEY (organization_id) REFERENCES organizations(id)
      ON DELETE RESTRICT ON UPDATE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE medication_reconciliation_audit
      ADD CONSTRAINT fk_reconciliation_audit_reconciliation
      FOREIGN KEY (reconciliation_id) REFERENCES medication_reconciliation_records(id)
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE medication_reconciliation_metrics
      ADD CONSTRAINT fk_reconciliation_metrics_reconciliation
      FOREIGN KEY (reconciliation_id) REFERENCES medication_reconciliation_records(id)
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    // Create triggers for automatic timestamp updates
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_medication_reconciliation_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_update_medication_reconciliation_updated_at
        BEFORE UPDATE ON medication_reconciliation_records
        FOR EACH ROW
        EXECUTE FUNCTION update_medication_reconciliation_updated_at();
    `);

    // Create function for automatic audit trail creation
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION create_reconciliation_audit_trail()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          INSERT INTO medication_reconciliation_audit (
            reconciliation_id, action_type, action_description,
            new_values, performed_by, organization_id
          ) VALUES (
            NEW.id, 'created', 'Medication reconciliation record created',
            to_jsonb(NEW), NEW.created_by, NEW.organization_id
          );
          RETURN NEW;
        ELSIF TG_OP = 'UPDATE' THEN
          INSERT INTO medication_reconciliation_audit (
            reconciliation_id, action_type, action_description,
            old_values, new_values, performed_by, organization_id
          ) VALUES (
            NEW.id, 'updated', 'Medication reconciliation record updated',
            to_jsonb(OLD), to_jsonb(NEW), NEW.updated_by, NEW.organization_id
          );
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          INSERT INTO medication_reconciliation_audit (
            reconciliation_id, action_type, action_description,
            old_values, performed_by, organization_id
          ) VALUES (
            OLD.id, 'deleted', 'Medication reconciliation record deleted',
            to_jsonb(OLD), OLD.updated_by, OLD.organization_id
          );
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_reconciliation_audit_trail
        AFTER INSERT OR UPDATE OR DELETE ON medication_reconciliation_records
        FOR EACH ROW
        EXECUTE FUNCTION create_reconciliation_audit_trail();
    `);

    // Create row-level security policies
    await queryRunner.query(`
      ALTER TABLE medication_reconciliation_records ENABLE ROW LEVEL SECURITY;
    `);

    await queryRunner.query(`
      CREATE POLICY reconciliation_organization_isolation ON medication_reconciliation_records
        USING (organization_id = current_setting('app.current_organization_id', true));
    `);

    await queryRunner.query(`
      ALTER TABLE medication_reconciliation_audit ENABLE ROW LEVEL SECURITY;
    `);

    await queryRunner.query(`
      CREATE POLICY reconciliation_audit_organization_isolation ON medication_reconciliation_audit
        USING (organization_id = current_setting('app.current_organization_id', true));
    `);

    await queryRunner.query(`
      ALTER TABLE medication_reconciliation_metrics ENABLE ROW LEVEL SECURITY;
    `);

    await queryRunner.query(`
      CREATE POLICY reconciliation_metrics_organization_isolation ON medication_reconciliation_metrics
        USING (organization_id = current_setting('app.current_organization_id', true));
    `);

    // Create indexes for JSON fields to improve query performance
    await queryRunner.query(`
      CREATE INDEX idx_reconciliation_source_list_gin ON medication_reconciliation_records 
      USING GIN (source_list);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_reconciliation_target_list_gin ON medication_reconciliation_records 
      USING GIN (target_list);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_reconciliation_discrepancies_gin ON medication_reconciliation_records 
      USING GIN (discrepancies);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_reconciliation_resolutions_gin ON medication_reconciliation_records 
      USING GIN (resolutions);
    `);

    // Create materialized view for reconciliation analytics
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW medication_reconciliation_analytics AS
      SELECT 
        organization_id,
        DATE_TRUNC('day', reconciliation_date) as reconciliation_day,
        reconciliation_type,
        status,
        COUNT(*) as total_reconciliations,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as avg_completion_time_minutes,
        AVG(jsonb_array_length(discrepancies)) as avg_discrepancies,
        SUM(CASE WHEN jsonb_array_length(discrepancies) > 0 THEN 1 ELSE 0 END) as reconciliations_with_discrepancies,
        SUM(CASE WHEN pharmacist_review IS NOT NULL THEN 1 ELSE 0 END) as pharmacist_reviews,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_reconciliations
      FROM medication_reconciliation_records
      WHERE deleted_at IS NULL
      GROUP BY organization_id, DATE_TRUNC('day', reconciliation_date), reconciliation_type, status;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_reconciliation_analytics_unique ON medication_reconciliation_analytics 
      (organization_id, reconciliation_day, reconciliation_type, status);
    `);

    // Create function to refresh the materialized view
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION refresh_reconciliation_analytics()
      RETURNS void AS $$
      BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY medication_reconciliation_analytics;
      END;
      $$ language 'plpgsql';
    `);

    // Add additional enterprise constraints and validations
    await queryRunner.query(`
      ALTER TABLE medication_reconciliation_records
      ADD CONSTRAINT ck_reconciliation_dates_logical
      CHECK (reconciliation_date <= CURRENT_TIMESTAMP AND reconciliation_date >= created_at);
    `);

    await queryRunner.query(`
      ALTER TABLE medication_reconciliation_records
      ADD CONSTRAINT ck_reconciliation_status_transition
      CHECK (
        (status = 'in_progress' AND reviewed_by IS NULL) OR
        (status IN ('completed', 'requires_review', 'approved') AND performed_by IS NOT NULL)
      );
    `);

    // Create materialized view for comprehensive reconciliation reporting
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW medication_reconciliation_dashboard AS
      SELECT 
        organization_id,
        DATE_TRUNC('month', reconciliation_date) as reconciliation_month,
        reconciliation_type,
        status,
        COUNT(*) as total_reconciliations,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN jsonb_array_length(discrepancies) > 0 THEN 1 END) as reconciliations_with_discrepancies,
        COUNT(CASE WHEN pharmacist_review IS NOT NULL THEN 1 END) as pharmacist_reviews,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as avg_completion_time_minutes,
        AVG(jsonb_array_length(discrepancies)) as avg_discrepancies_per_reconciliation,
        MAX(jsonb_array_length(discrepancies)) as max_discrepancies,
        SUM(CASE WHEN status = 'requires_review' THEN 1 ELSE 0 END) as pending_reviews,
        SUM(CASE WHEN review_date < CURRENT_DATE THEN 1 ELSE 0 END) as overdue_reviews
      FROM medication_reconciliation_records
      WHERE deleted_at IS NULL
      GROUP BY organization_id, DATE_TRUNC('month', reconciliation_date), reconciliation_type, status;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_reconciliation_dashboard_unique ON medication_reconciliation_dashboard 
      (organization_id, reconciliation_month, reconciliation_type, status);
    `);

    // Create function for automated compliance checking
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION check_reconciliation_compliance(
        p_organization_id varchar(255),
        p_period_start timestamp with time zone,
        p_period_end timestamp with time zone
      )
      RETURNS jsonb AS $$
      DECLARE
        compliance_report jsonb;
        total_required integer;
        total_completed integer;
        overdue_count integer;
        discrepancy_rate decimal;
      BEGIN
        -- Calculate compliance metrics
        SELECT 
          COUNT(*),
          COUNT(CASE WHEN status IN ('completed', 'approved') THEN 1 END),
          COUNT(CASE WHEN status = 'requires_review' AND review_date < CURRENT_DATE THEN 1 END),
          AVG(jsonb_array_length(discrepancies))
        INTO total_required, total_completed, overdue_count, discrepancy_rate
        FROM medication_reconciliation_records
        WHERE organization_id = p_organization_id
          AND reconciliation_date BETWEEN p_period_start AND p_period_end
          AND deleted_at IS NULL;

        -- Build compliance report
        compliance_report := jsonb_build_object(
          'organization_id', p_organization_id,
          'period_start', p_period_start,
          'period_end', p_period_end,
          'total_reconciliations', COALESCE(total_required, 0),
          'completed_reconciliations', COALESCE(total_completed, 0),
          'completion_rate', CASE WHEN total_required > 0 THEN (total_completed::decimal / total_required * 100) ELSE 0 END,
          'overdue_reviews', COALESCE(overdue_count, 0),
          'average_discrepancies', COALESCE(discrepancy_rate, 0),
          'compliance_status', CASE 
            WHEN total_required = 0 THEN 'no_data'
            WHEN (total_completed::decimal / total_required) >= 0.95 AND overdue_count = 0 THEN 'compliant'
            WHEN (total_completed::decimal / total_required) >= 0.80 THEN 'mostly_compliant'
            ELSE 'non_compliant'
          END,
          'generated_at', CURRENT_TIMESTAMP
        );

        RETURN compliance_report;
      END;
      $$ language 'plpgsql';
    `);

    // Create function for automated quality metrics calculation
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION calculate_reconciliation_quality_metrics(
        p_reconciliation_id varchar(255)
      )
      RETURNS void AS $$
      DECLARE
        rec_record record;
        completion_time_minutes integer;
        discrepancy_count integer;
        critical_issues_count integer;
      BEGIN
        -- Get reconciliation record
        SELECT * INTO rec_record
        FROM medication_reconciliation_records
        WHERE id = p_reconciliation_id;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Reconciliation record not found: %', p_reconciliation_id;
        END IF;

        -- Calculate metrics
        completion_time_minutes := EXTRACT(EPOCH FROM (rec_record.updated_at - rec_record.created_at)) / 60;
        discrepancy_count := jsonb_array_length(rec_record.discrepancies);
        
        -- Count critical issues (high-risk discrepancies)
        SELECT COUNT(*)
        INTO critical_issues_count
        FROM jsonb_array_elements(rec_record.discrepancies) AS d
        WHERE d->>'severity' IN ('high', 'critical');

        -- Insert metrics
        INSERT INTO medication_reconciliation_metrics (
          reconciliation_id, metric_type, metric_value, metric_unit, 
          metric_metadata, organization_id
        ) VALUES
        (p_reconciliation_id, 'completion_time', completion_time_minutes, 'minutes', 
         jsonb_build_object('calculated_at', CURRENT_TIMESTAMP), rec_record.organization_id),
        (p_reconciliation_id, 'discrepancy_count', discrepancy_count, 'count',
         jsonb_build_object('calculated_at', CURRENT_TIMESTAMP), rec_record.organization_id),
        (p_reconciliation_id, 'critical_issues_count', critical_issues_count, 'count',
         jsonb_build_object('calculated_at', CURRENT_TIMESTAMP), rec_record.organization_id)
        ON CONFLICT (reconciliation_id, metric_type) DO UPDATE SET
          metric_value = EXCLUDED.metric_value,
          metric_metadata = EXCLUDED.metric_metadata,
          recorded_at = CURRENT_TIMESTAMP;

      END;
      $$ language 'plpgsql';
    `);

    // Create trigger to automatically calculate quality metrics
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION trigger_calculate_quality_metrics()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'UPDATE' AND NEW.status IN ('completed', 'approved') AND OLD.status != NEW.status THEN
          PERFORM calculate_reconciliation_quality_metrics(NEW.id);
        END IF;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_reconciliation_quality_metrics
        AFTER UPDATE ON medication_reconciliation_records
        FOR EACH ROW
        EXECUTE FUNCTION trigger_calculate_quality_metrics();
    `);

    // Add comprehensive documentation comments
    await queryRunner.query(`
      COMMENT ON TABLE medication_reconciliation_records IS 
      'Enterprise-grade medication reconciliation records supporting admission, discharge, transfer, and periodic review processes with full audit trail, compliance tracking, and automated quality metrics calculation.';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE medication_reconciliation_audit IS 
      'Comprehensive audit trail for all medication reconciliation activities ensuring regulatory compliance, forensic capabilities, and real-time monitoring.';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE medication_reconciliation_metrics IS 
      'Performance metrics and analytics for medication reconciliation processes supporting quality improvement initiatives and compliance reporting.';
    `);

    await queryRunner.query(`
      COMMENT ON MATERIALIZED VIEW medication_reconciliation_analytics IS 
      'Pre-aggregated analytics for medication reconciliation reporting and dashboard functionality with monthly trending and performance indicators.';
    `);

    await queryRunner.query(`
      COMMENT ON MATERIALIZED VIEW medication_reconciliation_dashboard IS 
      'Comprehensive dashboard view providing real-time medication reconciliation compliance and quality metrics for organizational oversight.';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop materialized view and related objects
    await queryRunner.query(`DROP FUNCTION IF EXISTS refresh_reconciliation_analytics();`);
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS medication_reconciliation_analytics;`);

    // Drop triggers and functions
    await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_reconciliation_audit_trail ON medication_reconciliation_records;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS create_reconciliation_audit_trail();`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_update_medication_reconciliation_updated_at ON medication_reconciliation_records;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_medication_reconciliation_updated_at();`);

    // Drop foreign key constraints
    await queryRunner.dropForeignKey('medication_reconciliation_metrics', 'fk_reconciliation_metrics_reconciliation');
    await queryRunner.dropForeignKey('medication_reconciliation_audit', 'fk_reconciliation_audit_reconciliation');
    await queryRunner.dropForeignKey('medication_reconciliation_records', 'fk_reconciliation_organization');
    await queryRunner.dropForeignKey('medication_reconciliation_records', 'fk_reconciliation_resident');

    // Drop tables in reverse order
    await queryRunner.dropTable('medication_reconciliation_metrics');
    await queryRunner.dropTable('medication_reconciliation_audit');
    await queryRunner.dropTable('medication_reconciliation_records');
  }
}