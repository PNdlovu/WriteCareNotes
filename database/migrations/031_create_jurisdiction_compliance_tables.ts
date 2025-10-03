import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateJurisdictionComplianceTables1704067800000 implements MigrationInterface {
  name = 'CreateJurisdictionComplianceTables1704067800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Scotland Compliance Assessments table
    await queryRunner.createTable(
      new Table({
        name: 'scotland_compliance_assessments',
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
            name: 'service_id',
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
            name: 'quality_indicator_grades',
            type: 'json'
          },
          {
            name: 'health_social_care_standards_compliance',
            type: 'json'
          },
          {
            name: 'sssc_requirements_compliance',
            type: 'json'
          },
          {
            name: 'digital_records_compliance',
            type: 'json'
          },
          {
            name: 'overall_grade',
            type: 'enum',
            enum: ['excellent', 'very_good', 'good', 'adequate', 'weak', 'unsatisfactory']
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

    // Scotland Service Registrations table
    await queryRunner.createTable(
      new Table({
        name: 'scotland_service_registrations',
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
            name: 'service_type',
            type: 'enum',
            enum: ['care_home_adults', 'nursing_home', 'housing_support', 'care_at_home']
          },
          {
            name: 'service_name',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'registration_number',
            type: 'varchar',
            length: '50',
            isUnique: true
          },
          {
            name: 'registration_date',
            type: 'timestamp'
          },
          {
            name: 'conditions',
            type: 'json'
          },
          {
            name: 'max_capacity',
            type: 'integer'
          },
          {
            name: 'current_capacity',
            type: 'integer'
          },
          {
            name: 'manager_details',
            type: 'json'
          },
          {
            name: 'registration_status',
            type: 'enum',
            enum: ['active', 'suspended', 'cancelled', 'pending']
          },
          {
            name: 'next_inspection_due',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'last_inspection_date',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'last_inspection_grade',
            type: 'enum',
            enum: ['excellent', 'very_good', 'good', 'adequate', 'weak', 'unsatisfactory'],
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

    // Wales Compliance Assessments table
    await queryRunner.createTable(
      new Table({
        name: 'wales_compliance_assessments',
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
            name: 'service_id',
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
            name: 'quality_area_judgements',
            type: 'json'
          },
          {
            name: 'welsh_language_compliance',
            type: 'json'
          },
          {
            name: 'scw_requirements_compliance',
            type: 'json'
          },
          {
            name: 'riscaw_requirements_compliance',
            type: 'json'
          },
          {
            name: 'digital_records_compliance',
            type: 'json'
          },
          {
            name: 'overall_judgement',
            type: 'enum',
            enum: ['excellent', 'good', 'adequate', 'poor']
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

    // CIW Service Registrations table
    await queryRunner.createTable(
      new Table({
        name: 'ciw_service_registrations',
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
            name: 'service_type',
            type: 'enum',
            enum: ['care_home_adults', 'domiciliary_care', 'adult_placement', 'advocacy']
          },
          {
            name: 'service_name',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'registration_number',
            type: 'varchar',
            length: '50',
            isUnique: true
          },
          {
            name: 'registration_date',
            type: 'timestamp'
          },
          {
            name: 'conditions',
            type: 'json'
          },
          {
            name: 'max_capacity',
            type: 'integer'
          },
          {
            name: 'current_capacity',
            type: 'integer'
          },
          {
            name: 'manager_details',
            type: 'json'
          },
          {
            name: 'welsh_language_provision',
            type: 'boolean',
            default: true
          },
          {
            name: 'registration_status',
            type: 'enum',
            enum: ['active', 'suspended', 'cancelled', 'pending']
          },
          {
            name: 'next_inspection_due',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'last_inspection_date',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'last_inspection_judgement',
            type: 'enum',
            enum: ['excellent', 'good', 'adequate', 'poor'],
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

    // Welsh Language Active Offers table
    await queryRunner.createTable(
      new Table({
        name: 'welsh_language_active_offers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'service_id',
            type: 'uuid'
          },
          {
            name: 'implementation_date',
            type: 'timestamp'
          },
          {
            name: 'active_offer_policy',
            type: 'json'
          },
          {
            name: 'staff_training',
            type: 'json'
          },
          {
            name: 'service_delivery',
            type: 'json'
          },
          {
            name: 'quality_monitoring',
            type: 'json'
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true
          },
          {
            name: 'compliance_score',
            type: 'decimal',
            precision: 5,
            scale: 2
          },
          {
            name: 'last_review_date',
            type: 'timestamp'
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

    // Northern Ireland Compliance Assessments table
    await queryRunner.createTable(
      new Table({
        name: 'northern_ireland_compliance_assessments',
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
            name: 'service_id',
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
            name: 'quality_standard_outcomes',
            type: 'json'
          },
          {
            name: 'standards_criteria_compliance',
            type: 'json'
          },
          {
            name: 'niscc_requirements_compliance',
            type: 'json'
          },
          {
            name: 'hscani_requirements_compliance',
            type: 'json'
          },
          {
            name: 'digital_records_compliance',
            type: 'json'
          },
          {
            name: 'overall_outcome',
            type: 'enum',
            enum: ['compliant', 'substantially_compliant', 'moving_towards_compliance', 'not_compliant']
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

    // RQIA Service Registrations table
    await queryRunner.createTable(
      new Table({
        name: 'rqia_service_registrations',
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
            name: 'service_type',
            type: 'enum',
            enum: ['residential_care', 'nursing_home', 'domiciliary_care', 'supported_living']
          },
          {
            name: 'service_name',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'registration_number',
            type: 'varchar',
            length: '50',
            isUnique: true
          },
          {
            name: 'registration_date',
            type: 'timestamp'
          },
          {
            name: 'conditions',
            type: 'json'
          },
          {
            name: 'max_capacity',
            type: 'integer'
          },
          {
            name: 'current_capacity',
            type: 'integer'
          },
          {
            name: 'manager_details',
            type: 'json'
          },
          {
            name: 'registration_status',
            type: 'enum',
            enum: ['active', 'suspended', 'cancelled', 'pending']
          },
          {
            name: 'next_inspection_due',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'last_inspection_date',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'last_inspection_outcome',
            type: 'enum',
            enum: ['compliant', 'substantially_compliant', 'moving_towards_compliance', 'not_compliant'],
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

    // Human Rights Assessments table
    await queryRunner.createTable(
      new Table({
        name: 'human_rights_assessments',
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
            name: 'service_id',
            type: 'uuid'
          },
          {
            name: 'assessment_date',
            type: 'timestamp'
          },
          {
            name: 'rights_assessment',
            type: 'json'
          },
          {
            name: 'overall_compliance',
            type: 'boolean'
          },
          {
            name: 'compliance_score',
            type: 'decimal',
            precision: 5,
            scale: 2
          },
          {
            name: 'gaps',
            type: 'json'
          },
          {
            name: 'recommendations',
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

    // Professional Qualifications table
    await queryRunner.createTable(
      new Table({
        name: 'professional_qualifications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'qualification_type',
            type: 'varchar',
            length: '100'
          },
          {
            name: 'qualification_name',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'awarding_body',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'date_awarded',
            type: 'timestamp'
          },
          {
            name: 'expiry_date',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'verification_status',
            type: 'enum',
            enum: ['verified', 'pending', 'unverified']
          },
          {
            name: 'certificate_number',
            type: 'varchar',
            length: '100',
            isNullable: true
          },
          {
            name: 'registration_id',
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

    // Continuing Education Records table
    await queryRunner.createTable(
      new Table({
        name: 'continuing_education_records',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'activity_type',
            type: 'varchar',
            length: '100'
          },
          {
            name: 'activity_name',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'provider',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'completion_date',
            type: 'timestamp'
          },
          {
            name: 'hours_completed',
            type: 'decimal',
            precision: 5,
            scale: 2
          },
          {
            name: 'relevance_to_role',
            type: 'text'
          },
          {
            name: 'reflection_notes',
            type: 'text'
          },
          {
            name: 'evidence_documents',
            type: 'json'
          },
          {
            name: 'registration_id',
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

    // Professional Standards Assessments table
    await queryRunner.createTable(
      new Table({
        name: 'professional_standards_assessments',
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
            name: 'staff_assessments',
            type: 'json'
          },
          {
            name: 'overall_compliance',
            type: 'boolean'
          },
          {
            name: 'compliance_by_body',
            type: 'json'
          },
          {
            name: 'critical_issues',
            type: 'json'
          },
          {
            name: 'recommendations',
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

    // NICE Compliance Assessments table
    await queryRunner.createTable(
      new Table({
        name: 'nice_compliance_assessments',
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
            name: 'guidelines_assessed',
            type: 'json'
          },
          {
            name: 'overall_compliance',
            type: 'boolean'
          },
          {
            name: 'compliance_score',
            type: 'decimal',
            precision: 5,
            scale: 2
          },
          {
            name: 'guideline_compliance',
            type: 'json'
          },
          {
            name: 'implementation_gaps',
            type: 'json'
          },
          {
            name: 'clinical_impact',
            type: 'json'
          },
          {
            name: 'recommendations',
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
    await queryRunner.createIndex('scotland_compliance_assessments', new Index('idx_scotland_org_service', ['organization_id', 'service_id']));
    await queryRunner.createIndex('wales_compliance_assessments', new Index('idx_wales_org_service', ['organization_id', 'service_id']));
    await queryRunner.createIndex('northern_ireland_compliance_assessments', new Index('idx_ni_org_service', ['organization_id', 'service_id']));
    await queryRunner.createIndex('professional_qualifications', new Index('idx_prof_qual_reg_id', ['registration_id']));
    await queryRunner.createIndex('continuing_education_records', new Index('idx_ce_reg_id', ['registration_id']));
    await queryRunner.createIndex('welsh_language_active_offers', new Index('idx_welsh_service_id', ['service_id']));
    await queryRunner.createIndex('human_rights_assessments', new Index('idx_hr_org_service', ['organization_id', 'service_id']));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('nice_compliance_assessments');
    await queryRunner.dropTable('professional_standards_assessments');
    await queryRunner.dropTable('continuing_education_records');
    await queryRunner.dropTable('professional_qualifications');
    await queryRunner.dropTable('human_rights_assessments');
    await queryRunner.dropTable('welsh_language_active_offers');
    await queryRunner.dropTable('ciw_service_registrations');
    await queryRunner.dropTable('wales_compliance_assessments');
    await queryRunner.dropTable('rqia_service_registrations');
    await queryRunner.dropTable('northern_ireland_compliance_assessments');
    await queryRunner.dropTable('scotland_service_registrations');
    await queryRunner.dropTable('scotland_compliance_assessments');
  }
}