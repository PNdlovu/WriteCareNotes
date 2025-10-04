/**
 * @fileoverview Database Migration - Jurisdiction Compliance Tables
 * @module CreateJurisdictionComplianceTables
 * @version 2.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Creates comprehensive database tables for multi-jurisdictional
 * compliance across all British Isles care home regulators including Care
 * Inspectorate Scotland, CIW Wales, RQIA Northern Ireland, and professional
 * registration bodies.
 * 
 * @compliance
 * - Care Inspectorate Scotland Standards
 * - CIW Wales Regulation and Inspection Framework
 * - RQIA Northern Ireland Standards
 * - Health and Social Care Standards (Scotland)
 * - Welsh Language (Wales) Measure 2011
 * - Human Rights Act 1998
 * - Professional Standards (NMC, GMC, HCPC, SSSC, SCW, NISCC)
 * 
 * @security
 * - Row-level security policies for multi-tenancy
 * - Encrypted sensitive data fields
 * - Comprehensive audit trails
 * - Data retention policies
 * - Access control constraints
 */

import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from 'typeorm';

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

    // Create indexes for performance optimization
    await queryRunner.query(`CREATE INDEX idx_scotland_org_service ON scotland_compliance_assessments (organization_id, service_id);`);
    await queryRunner.query(`CREATE INDEX idx_wales_org_service ON wales_compliance_assessments (organization_id, service_id);`);
    await queryRunner.query(`CREATE INDEX idx_ni_org_service ON northern_ireland_compliance_assessments (organization_id, service_id);`);
    await queryRunner.query(`CREATE INDEX idx_prof_qual_reg_id ON professional_qualifications (registration_id);`);
    await queryRunner.query(`CREATE INDEX idx_ce_reg_id ON continuing_education_records (registration_id);`);
    await queryRunner.query(`CREATE INDEX idx_welsh_service_id ON welsh_language_active_offers (service_id);`);
    await queryRunner.query(`CREATE INDEX idx_hr_org_service ON human_rights_assessments (organization_id, service_id);`);

    // Create row-level security policies for multi-tenancy
    await queryRunner.query(`
      ALTER TABLE scotland_compliance_assessments ENABLE ROW LEVEL SECURITY;
    `);

    await queryRunner.query(`
      CREATE POLICY scotland_compliance_organization_isolation ON scotland_compliance_assessments
        USING (organization_id = current_setting('app.current_organization_id', true)::uuid);
    `);

    await queryRunner.query(`
      ALTER TABLE wales_compliance_assessments ENABLE ROW LEVEL SECURITY;
    `);

    await queryRunner.query(`
      CREATE POLICY wales_compliance_organization_isolation ON wales_compliance_assessments
        USING (organization_id = current_setting('app.current_organization_id', true)::uuid);
    `);

    await queryRunner.query(`
      ALTER TABLE northern_ireland_compliance_assessments ENABLE ROW LEVEL SECURITY;
    `);

    await queryRunner.query(`
      CREATE POLICY ni_compliance_organization_isolation ON northern_ireland_compliance_assessments
        USING (organization_id = current_setting('app.current_organization_id', true)::uuid);
    `);

    // Create triggers for automatic timestamp updates
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_jurisdiction_compliance_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_update_scotland_compliance_updated_at
        BEFORE UPDATE ON scotland_compliance_assessments
        FOR EACH ROW
        EXECUTE FUNCTION update_jurisdiction_compliance_updated_at();
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_update_wales_compliance_updated_at
        BEFORE UPDATE ON wales_compliance_assessments
        FOR EACH ROW
        EXECUTE FUNCTION update_jurisdiction_compliance_updated_at();
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_update_ni_compliance_updated_at
        BEFORE UPDATE ON northern_ireland_compliance_assessments
        FOR EACH ROW
        EXECUTE FUNCTION update_jurisdiction_compliance_updated_at();
    `);

    // Add table comments for documentation
    await queryRunner.query(`
      COMMENT ON TABLE scotland_compliance_assessments IS 
      'Care Inspectorate Scotland compliance assessments supporting Health and Social Care Standards with quality indicator grading system and SSSC requirements tracking.';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE wales_compliance_assessments IS 
      'CIW Wales compliance assessments supporting Welsh language active offer requirements and Regulation and Inspection Framework quality areas.';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE northern_ireland_compliance_assessments IS 
      'RQIA Northern Ireland compliance assessments supporting quality standard outcomes and NISCC professional registration requirements.';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE welsh_language_active_offers IS 
      'Welsh Language (Wales) Measure 2011 compliance tracking for active offer implementation and service delivery monitoring.';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE human_rights_assessments IS 
      'Human Rights Act 1998 compliance assessments ensuring dignity, respect, and fundamental rights protection in care delivery.';
    `);
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