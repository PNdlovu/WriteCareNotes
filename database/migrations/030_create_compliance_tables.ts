import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

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
            default: 'uuid_generate_v4()'
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
            name: 'category',
            type: 'enum',
            enum: ['catastrophic', 'major', 'moderate', 'minor', 'negligible']
          },
          {
            name: 'likelihood',
            type: 'enum',
            enum: ['very_high', 'high', 'medium', 'low', 'very_low']
          },
          {
            name: 'risk_score',
            type: 'integer'
          },
          {
            name: 'mitigation_measures',
            type: 'json'
          },
          {
            name: 'residual_risk',
            type: 'decimal',
            precision: 5,
            scale: 2
          },
          {
            name: 'acceptance_rationale',
            type: 'text',
            isNullable: true
          },
          {
            name: 'review_date',
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
            length: '255'
          },
          {
            name: 'organization_id',
            type: 'uuid'
          },
          {
            name: 'system_component',
            type: 'varchar',
            length: '255'
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

    // Create indexes for performance
    await queryRunner.createIndex('clinical_risk_assessments', new Index('idx_clinical_risk_org_id', ['organization_id']));
    await queryRunner.createIndex('dspt_assessments', new Index('idx_dspt_org_id', ['organization_id']));
    await queryRunner.createIndex('cqc_compliance_assessments', new Index('idx_cqc_org_id', ['organization_id']));
    await queryRunner.createIndex('professional_registrations', new Index('idx_prof_reg_staff_id', ['staff_id']));
    await queryRunner.createIndex('professional_registrations', new Index('idx_prof_reg_org_id', ['organization_id']));
    await queryRunner.createIndex('vulnerability_findings', new Index('idx_vuln_org_id', ['organization_id']));
    await queryRunner.createIndex('vulnerability_findings', new Index('idx_vuln_severity', ['severity']));
    await queryRunner.createIndex('brexit_trade_documentation', new Index('idx_brexit_doc_org_id', ['organization_id']));
    await queryRunner.createIndex('eori_registrations', new Index('idx_eori_org_id', ['organization_id']));
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