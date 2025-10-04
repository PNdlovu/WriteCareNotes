/**
 * @fileoverview Database Migration - Comprehensive Compliance Tables
 * @module CreateComplianceTables
 * @version 2.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Creates comprehensive database tables for enterprise-grade compliance
 * management including clinical risk assessments, safety case reports, DSPT assessments,
 * CQC compliance, professional registrations, and cyber security assessments for care home organizations.
 * 
 * @compliance
 * - CQC Regulation 17 - Good governance
 * - ISO 27001 Information Security Management
 * - DCB0129 Clinical Risk Management
 * - DSPT Data Security and Protection Toolkit
 * - GDPR and Data Protection Act 2018
 * - Professional Standards (GMC, NMC, HCPC)
 * 
 * @security
 * - Row-level security policies
 * - Encrypted sensitive data fields
 * - Comprehensive audit trails
 * - Data retention policies
 * - Access control constraints
 */

import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from 'typeorm';

export class CreateComplianceTables1704067200000 implements MigrationInterface {
  name = 'CreateComplianceTables1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Clinical Risk Assessments table
    await queryRunner.createTable(
      new Table({
        name: 'clinical_risk_assessments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
            comment: 'Unique identifier for clinical risk assessment'
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Risk assessment title'
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
            comment: 'Detailed risk description (encrypted)'
          },
          {
            name: 'category',
            type: 'enum',
            enum: ['catastrophic', 'major', 'moderate', 'minor', 'negligible'],
            isNullable: false,
            comment: 'Risk severity category as per DCB0129'
          },
          {
            name: 'likelihood',
            type: 'enum',
            enum: ['very_high', 'high', 'medium', 'low', 'very_low'],
            isNullable: false,
            comment: 'Likelihood of risk occurrence'
          },
          {
            name: 'risk_score',
            type: 'integer',
            isNullable: false,
            comment: 'Calculated risk score (1-25 scale)'
          },
          {
            name: 'mitigation_measures',
            type: 'jsonb',
            isNullable: false,
            default: "'[]'::jsonb",
            comment: 'Risk mitigation strategies (encrypted JSON)'
          },
          {
            name: 'residual_risk',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: false,
            comment: 'Post-mitigation residual risk score'
          },
          {
            name: 'acceptance_rationale',
            type: 'text',
            isNullable: true,
            comment: 'Rationale for risk acceptance (encrypted)'
          },
          {
            name: 'review_date',
            type: 'timestamp with time zone',
            isNullable: false,
            comment: 'Next scheduled review date'
          },
          {
            name: 'assessed_by',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'ID of clinical safety officer'
          },
          {
            name: 'approved_by',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'ID of approving authority'
          },
          {
            name: 'organization_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Organization identifier for multi-tenancy'
          },
          {
            name: 'system_component',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Affected system component'
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'under_review', 'approved', 'rejected', 'archived'],
            default: "'draft'",
            isNullable: false,
            comment: 'Assessment status'
          },
          {
            name: 'dcb0129_compliance',
            type: 'boolean',
            default: true,
            isNullable: false,
            comment: 'DCB0129 compliance indicator'
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
            comment: 'Soft delete timestamp for audit compliance'
          }
        ],
        checks: [
          {
            name: 'ck_clinical_risk_score_range',
            expression: 'risk_score >= 1 AND risk_score <= 25'
          },
          {
            name: 'ck_clinical_risk_residual_range',
            expression: 'residual_risk >= 0.0 AND residual_risk <= 25.0'
          },
          {
            name: 'ck_clinical_risk_review_future',
            expression: 'review_date > created_at'
          }
        ]
      }),
      true
    );

    // Clinical Safety Case Reports table
    await queryRunner.createTable(
      new Table({
        name: 'clinical_safety_case_reports',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'system_name',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'system_version',
            type: 'varchar',
            length: '50'
          },
          {
            name: 'deployment_scope',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'clinical_safety_officer',
            type: 'json'
          },
          {
            name: 'safety_requirements',
            type: 'json'
          },
          {
            name: 'hazard_analysis',
            type: 'json'
          },
          {
            name: 'clinical_evaluation',
            type: 'json'
          },
          {
            name: 'post_market_surveillance',
            type: 'json'
          },
          {
            name: 'report_date',
            type: 'timestamp'
          },
          {
            name: 'approval_date',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'organization_id',
            type: 'uuid'
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()'
          }
        ]
      }),
      true
    );

    // DSPT Assessments table
    await queryRunner.createTable(
      new Table({
        name: 'dspt_assessments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'organization_id',
            type: 'uuid'
          },
          {
            name: 'assessment_date',
            type: 'timestamp'
          },
          {
            name: 'assessment_version',
            type: 'varchar',
            length: '20'
          },
          {
            name: 'overall_assertion',
            type: 'enum',
            enum: ['standards_met', 'approaching_standards', 'standards_not_met']
          },
          {
            name: 'overall_score',
            type: 'decimal',
            precision: 5,
            scale: 2
          },
          {
            name: 'standard_results',
            type: 'json'
          },
          {
            name: 'evidence_items',
            type: 'json'
          },
          {
            name: 'action_plan',
            type: 'json'
          },
          {
            name: 'submission_date',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'approval_date',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'next_assessment_due',
            type: 'timestamp'
          },
          {
            name: 'assessed_by',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'approved_by',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()'
          }
        ]
      }),
      true
    );

    // CQC Compliance Assessments table
    await queryRunner.createTable(
      new Table({
        name: 'cqc_compliance_assessments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'organization_id',
            type: 'uuid'
          },
          {
            name: 'assessment_date',
            type: 'timestamp'
          },
          {
            name: 'assessment_type',
            type: 'enum',
            enum: ['self_assessment', 'internal_audit', 'mock_inspection', 'preparation']
          },
          {
            name: 'overall_rating',
            type: 'enum',
            enum: ['outstanding', 'good', 'requires_improvement', 'inadequate']
          },
          {
            name: 'kloe_ratings',
            type: 'json'
          },
          {
            name: 'fundamental_standards_compliance',
            type: 'json'
          },
          {
            name: 'digital_records_compliance',
            type: 'json'
          },
          {
            name: 'action_plan',
            type: 'json'
          },
          {
            name: 'assessed_by',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'next_review_date',
            type: 'timestamp'
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()'
          }
        ]
      }),
      true
    );

    // Professional Registrations table
    await queryRunner.createTable(
      new Table({
        name: 'professional_registrations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'staff_id',
            type: 'uuid'
          },
          {
            name: 'professional_body',
            type: 'enum',
            enum: ['nmc', 'gmc', 'hcpc', 'gphc', 'goc', 'gdc']
          },
          {
            name: 'registration_number',
            type: 'varchar',
            length: '50'
          },
          {
            name: 'registration_date',
            type: 'timestamp'
          },
          {
            name: 'expiry_date',
            type: 'timestamp'
          },
          {
            name: 'renewal_date',
            type: 'timestamp'
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'lapsed', 'suspended', 'removed', 'pending']
          },
          {
            name: 'fitness_to_practise',
            type: 'enum',
            enum: ['clear', 'conditions', 'suspension', 'removal', 'interim_order']
          },
          {
            name: 'revalidation_date',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'annotations',
            type: 'json'
          },
          {
            name: 'organization_id',
            type: 'uuid'
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()'
          }
        ]
      }),
      true
    );

    // Cyber Essentials Assessments table
    await queryRunner.createTable(
      new Table({
        name: 'cyber_essentials_assessments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'organization_id',
            type: 'uuid'
          },
          {
            name: 'assessment_type',
            type: 'enum',
            enum: ['cyber_essentials', 'cyber_essentials_plus']
          },
          {
            name: 'assessment_date',
            type: 'timestamp'
          },
          {
            name: 'certification_level',
            type: 'enum',
            enum: ['basic', 'plus']
          },
          {
            name: 'overall_result',
            type: 'enum',
            enum: ['pass', 'fail', 'conditional_pass']
          },
          {
            name: 'overall_score',
            type: 'decimal',
            precision: 5,
            scale: 2
          },
          {
            name: 'control_assessments',
            type: 'json'
          },
          {
            name: 'plus_assessments',
            type: 'json',
            isNullable: true
          },
          {
            name: 'vulnerability_findings',
            type: 'json'
          },
          {
            name: 'penetration_test_results',
            type: 'json',
            isNullable: true
          },
          {
            name: 'certification_status',
            type: 'json'
          },
          {
            name: 'action_plan',
            type: 'json'
          },
          {
            name: 'assessed_by',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'certification_body',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'certification_date',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'expiry_date',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()'
          }
        ]
      }),
      true
    );

    // NICE Guidelines table
    await queryRunner.createTable(
      new Table({
        name: 'nice_guidelines',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'guideline_id',
            type: 'varchar',
            length: '20',
            isUnique: true
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['clinical_guideline', 'nice_guideline', 'technology_appraisal', 'interventional_procedure', 'medical_technology', 'diagnostic_guidance', 'quality_standard']
          },
          {
            name: 'title',
            type: 'varchar',
            length: '500'
          },
          {
            name: 'published_date',
            type: 'timestamp'
          },
          {
            name: 'last_updated',
            type: 'timestamp'
          },
          {
            name: 'next_review_date',
            type: 'timestamp'
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['current', 'updated', 'withdrawn']
          },
          {
            name: 'scope',
            type: 'text'
          },
          {
            name: 'clinical_areas',
            type: 'json'
          },
          {
            name: 'implementation_support',
            type: 'json'
          },
          {
            name: 'cost_impact',
            type: 'text'
          },
          {
            name: 'resource_impact',
            type: 'text'
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()'
          }
        ]
      }),
      true
    );

    // Brexit Trade Documentation table
    await queryRunner.createTable(
      new Table({
        name: 'brexit_trade_documentation',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'organization_id',
            type: 'uuid'
          },
          {
            name: 'documentation_type',
            type: 'enum',
            enum: ['eori_number', 'customs_declaration', 'certificate_of_origin', 'commercial_invoice', 'packing_list', 'export_licence', 'import_licence', 'health_certificate', 'ukca_marking', 'ce_marking']
          },
          {
            name: 'document_number',
            type: 'varchar',
            length: '100'
          },
          {
            name: 'issued_date',
            type: 'timestamp'
          },
          {
            name: 'expiry_date',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'issuing_authority',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['valid', 'expired', 'pending', 'rejected', 'not_required']
          },
          {
            name: 'validation_date',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'document_path',
            type: 'varchar',
            length: '500',
            isNullable: true
          },
          {
            name: 'related_documents',
            type: 'json'
          },
          {
            name: 'compliance_notes',
            type: 'json'
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()'
          }
        ]
      }),
      true
    );

    // EORI Registrations table
    await queryRunner.createTable(
      new Table({
        name: 'eori_registrations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'organization_id',
            type: 'uuid'
          },
          {
            name: 'eori_number',
            type: 'varchar',
            length: '20',
            isUnique: true
          },
          {
            name: 'registration_date',
            type: 'timestamp'
          },
          {
            name: 'organization_name',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'business_address',
            type: 'text'
          },
          {
            name: 'business_type',
            type: 'varchar',
            length: '100'
          },
          {
            name: 'trade_activities',
            type: 'json'
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'suspended', 'cancelled']
          },
          {
            name: 'validation_date',
            type: 'timestamp'
          },
          {
            name: 'hmrc_reference',
            type: 'varchar',
            length: '50'
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()'
          }
        ]
      }),
      true
    );

    // Vulnerability Findings table
    await queryRunner.createTable(
      new Table({
        name: 'vulnerability_findings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'severity',
            type: 'enum',
            enum: ['critical', 'high', 'medium', 'low', 'informational']
          },
          {
            name: 'cvss_score',
            type: 'decimal',
            precision: 3,
            scale: 1
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'description',
            type: 'text'
          },
          {
            name: 'affected_systems',
            type: 'json'
          },
          {
            name: 'impact',
            type: 'text'
          },
          {
            name: 'likelihood',
            type: 'varchar',
            length: '50'
          },
          {
            name: 'remediation',
            type: 'json'
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['open', 'in_progress', 'resolved', 'accepted']
          },
          {
            name: 'discovered_date',
            type: 'timestamp'
          },
          {
            name: 'target_resolution_date',
            type: 'timestamp'
          },
          {
            name: 'actual_resolution_date',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'organization_id',
            type: 'uuid'
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()'
          }
        ]
      }),
      true
    );

    // Create indexes for performance optimization
    await queryRunner.query(`CREATE INDEX idx_clinical_risk_org_id ON clinical_risk_assessments (organization_id);`);
    await queryRunner.query(`CREATE INDEX idx_clinical_risk_category_likelihood ON clinical_risk_assessments (category, likelihood);`);
    await queryRunner.query(`CREATE INDEX idx_clinical_risk_review_date ON clinical_risk_assessments (review_date);`);
    await queryRunner.query(`CREATE INDEX idx_clinical_risk_status ON clinical_risk_assessments (status);`);
    await queryRunner.query(`CREATE INDEX idx_clinical_risk_assessed_by ON clinical_risk_assessments (assessed_by);`);
    await queryRunner.query(`CREATE INDEX idx_clinical_risk_created_at ON clinical_risk_assessments (created_at);`);
    await queryRunner.query(`CREATE INDEX idx_clinical_risk_deleted_at ON clinical_risk_assessments (deleted_at);`);
    
    await queryRunner.query(`CREATE INDEX idx_dspt_org_id ON dspt_assessments (organization_id);`);
    await queryRunner.query(`CREATE INDEX idx_cqc_org_id ON cqc_compliance_assessments (organization_id);`);
    await queryRunner.query(`CREATE INDEX idx_prof_reg_staff_id ON professional_registrations (staff_id);`);
    await queryRunner.query(`CREATE INDEX idx_prof_reg_org_id ON professional_registrations (organization_id);`);
    await queryRunner.query(`CREATE INDEX idx_vuln_org_id ON vulnerability_findings (organization_id);`);
    await queryRunner.query(`CREATE INDEX idx_vuln_severity ON vulnerability_findings (severity);`);
    await queryRunner.query(`CREATE INDEX idx_brexit_doc_org_id ON brexit_trade_documentation (organization_id);`);
    await queryRunner.query(`CREATE INDEX idx_eori_org_id ON eori_registrations (organization_id);`);

    // Create row-level security policies for multi-tenancy
    await queryRunner.query(`
      ALTER TABLE clinical_risk_assessments ENABLE ROW LEVEL SECURITY;
    `);

    await queryRunner.query(`
      CREATE POLICY clinical_risk_organization_isolation ON clinical_risk_assessments
        USING (organization_id = current_setting('app.current_organization_id', true));
    `);

    // Create triggers for automatic timestamp updates
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_compliance_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_update_clinical_risk_updated_at
        BEFORE UPDATE ON clinical_risk_assessments
        FOR EACH ROW
        EXECUTE FUNCTION update_compliance_updated_at();
    `);

    // Create audit trail function for compliance tables
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION create_compliance_audit_trail()
      RETURNS TRIGGER AS $$
      DECLARE
        audit_record jsonb;
      BEGIN
        IF TG_OP = 'INSERT' THEN
          audit_record := jsonb_build_object(
            'table_name', TG_TABLE_NAME,
            'operation', 'INSERT',
            'new_values', to_jsonb(NEW),
            'user_id', current_setting('app.current_user_id', true),
            'timestamp', CURRENT_TIMESTAMP,
            'organization_id', NEW.organization_id
          );
          -- Log to audit system (implementation depends on audit infrastructure)
          PERFORM pg_notify('compliance_audit', audit_record::text);
          RETURN NEW;
        ELSIF TG_OP = 'UPDATE' THEN
          audit_record := jsonb_build_object(
            'table_name', TG_TABLE_NAME,
            'operation', 'UPDATE',
            'old_values', to_jsonb(OLD),
            'new_values', to_jsonb(NEW),
            'user_id', current_setting('app.current_user_id', true),
            'timestamp', CURRENT_TIMESTAMP,
            'organization_id', NEW.organization_id
          );
          PERFORM pg_notify('compliance_audit', audit_record::text);
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          audit_record := jsonb_build_object(
            'table_name', TG_TABLE_NAME,
            'operation', 'DELETE',
            'old_values', to_jsonb(OLD),
            'user_id', current_setting('app.current_user_id', true),
            'timestamp', CURRENT_TIMESTAMP,
            'organization_id', OLD.organization_id
          );
          PERFORM pg_notify('compliance_audit', audit_record::text);
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_clinical_risk_audit_trail
        AFTER INSERT OR UPDATE OR DELETE ON clinical_risk_assessments
        FOR EACH ROW
        EXECUTE FUNCTION create_compliance_audit_trail();
    `);

    // Add table comments for documentation
    await queryRunner.query(`
      COMMENT ON TABLE clinical_risk_assessments IS 
      'Enterprise-grade clinical risk assessments compliant with DCB0129 and CQC Regulation 17. Supports comprehensive risk management for healthcare systems with full audit trail and multi-tenancy.';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('vulnerability_findings');
    await queryRunner.dropTable('eori_registrations');
    await queryRunner.dropTable('brexit_trade_documentation');
    await queryRunner.dropTable('nice_guidelines');
    await queryRunner.dropTable('cyber_essentials_assessments');
    await queryRunner.dropTable('professional_registrations');
    await queryRunner.dropTable('cqc_compliance_assessments');
    await queryRunner.dropTable('dspt_assessments');
    await queryRunner.dropTable('clinical_safety_case_reports');
    await queryRunner.dropTable('clinical_risk_assessments');
  }
}