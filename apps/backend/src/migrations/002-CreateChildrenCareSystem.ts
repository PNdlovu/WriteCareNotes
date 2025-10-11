/**
 * ============================================================================
 * Complete Children's Care System Migration
 * ============================================================================
 * 
 * @fileoverview Comprehensive database migration for all children's care entities.
 * 
 * @module migrations/002-CreateChildrenCareSystem
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Creates all tables, indexes, and foreign keys for the complete children's care
 * system including placements, safeguarding, education, health, family contact,
 * care planning, leaving care, and UASC management.
 * 
 * @compliance
 * - Children Act 1989
 * - Care Planning Regulations 2010
 * - Children (Leaving Care) Act 2000
 * - Immigration Act 2016
 * - OFSTED Regulations
 * 
 * @features
 * - All entity tables (Placements, Safeguarding, Education, Health, etc.)
 * - Performance indexes on frequently queried columns
 * - Foreign key const raints for data integrity
 * - JSON columns for complex data structures
 * - Audit trail columns on all tables
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChildrenCareSystem1704988900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ========================================
    // PLACEMENTS TABLE
    // ========================================
    await queryRunner.query(`
      CREATE TABLE placements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        placement_number VAR CHAR UNIQUE NOT NULL,
        child_id UUID NOT NULL REFERENCES children(id) ON DELETE RESTRICT,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
        placement_type VAR CHAR(100) NOT NULL,
        placement_start_date DATE NOT NULL,
        planned_end_date DATE,
        actual_end_date DATE,
        placement_status VAR CHAR(50) DEFAULT 'ACTIVE',
        carer_name VAR CHAR(255),
        carer_address TEXT,
        carer_phone VAR CHAR(50),
        carer_email VAR CHAR(255),
        emergency_contact_name VAR CHAR(255),
        emergency_contact_phone VAR CHAR(50),
        placement_address TEXT,
        legal_basis VAR CHAR(100),
        placement_plan TEXT,
        ending_reason VAR CHAR(100),
        ending_type VAR CHAR(50),
        created_by VAR CHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VAR CHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );

      CREATE INDEX IDX_PLACEMENTS_CHILD ON placements(child_id);
      CREATE INDEX IDX_PLACEMENTS_ORGANIZATION ON placements(organization_id);
      CREATE INDEX IDX_PLACEMENTS_STATUS ON placements(placement_status);
      CREATE INDEX IDX_PLACEMENTS_TYPE ON placements(placement_type);
      CREATE INDEX IDX_PLACEMENTS_START_DATE ON placements(placement_start_date);
    `);

    // ========================================
    // SAFEGUARDING INCIDENTS TABLE
    // ========================================
    await queryRunner.query(`
      CREATE TABLE safeguarding_incidents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        incident_number VAR CHAR UNIQUE NOT NULL,
        child_id UUID NOT NULL REFERENCES children(id) ON DELETE RESTRICT,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
        incident_date TIMESTAMP NOT NULL,
        incident_type VAR CHAR(100) NOT NULL,
        severity VAR CHAR(50) NOT NULL,
        category VAR CHAR(100) NOT NULL,
        location VAR CHAR(255),
        description TEXT NOT NULL,
        immediate_action TEXT,
        police_involved BOOLEAN DEFAULT FALSE,
        police_reference VAR CHAR(255),
        reported_to_lado BOOLEAN DEFAULT FALSE,
        lado_reference VAR CHAR(255),
        reported_to_ofsted BOOLEAN DEFAULT FALSE,
        ofsted_reference VAR CHAR(255),
        investigation_status VAR CHAR(50) DEFAULT 'PENDING',
        outcome VAR CHAR(100),
        lessons_learned TEXT,
        created_by VAR CHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VAR CHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );

      CREATE INDEX IDX_SAFEGUARDING_CHILD ON safeguarding_incidents(child_id);
      CREATE INDEX IDX_SAFEGUARDING_ORGANIZATION ON safeguarding_incidents(organization_id);
      CREATE INDEX IDX_SAFEGUARDING_TYPE ON safeguarding_incidents(incident_type);
      CREATE INDEX IDX_SAFEGUARDING_SEVERITY ON safeguarding_incidents(severity);
      CREATE INDEX IDX_SAFEGUARDING_STATUS ON safeguarding_incidents(investigation_status);
      CREATE INDEX IDX_SAFEGUARDING_DATE ON safeguarding_incidents(incident_date);
    `);

    // ========================================
    // PERSONAL EDUCATION PLANS TABLE
    // ========================================
    await queryRunner.query(`
      CREATE TABLE personal_education_plans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        pep_number VAR CHAR UNIQUE NOT NULL,
        child_id UUID NOT NULL REFERENCES children(id) ON DELETE RESTRICT,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
        academic_year VAR CHAR(20) NOT NULL,
        pep_meeting_date DATE NOT NULL,
        next_pep_date DATE,
        school_name VAR CHAR(255),
        school_type VAR CHAR(100),
        year_group VAR CHAR(50),
        attendance_percentage DECIMAL(5,2),
        exclusions_count INT DEFAULT 0,
        current_attainment TEXT,
        targets_agreed TEXT,
        interventions_planned TEXT,
        pp_plus_amount DECIMAL(10,2),
        status VAR CHAR(50) DEFAULT 'ACTIVE',
        created_by VAR CHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VAR CHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );

      CREATE INDEX IDX_PEP_CHILD ON personal_education_plans(child_id);
      CREATE INDEX IDX_PEP_ORGANIZATION ON personal_education_plans(organization_id);
      CREATE INDEX IDX_PEP_STATUS ON personal_education_plans(status);
      CREATE INDEX IDX_PEP_MEETING_DATE ON personal_education_plans(pep_meeting_date);
      CREATE INDEX IDX_PEP_NEXT_DATE ON personal_education_plans(next_pep_date);
    `);

    // ========================================
    // HEALTH ASSESSMENTS TABLE
    // ========================================
    await queryRunner.query(`
      CREATE TABLE health_assessments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        assessment_number VAR CHAR UNIQUE NOT NULL,
        child_id UUID NOT NULL REFERENCES children(id) ON DELETE RESTRICT,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
        assessment_type VAR CHAR(100) NOT NULL,
        assessment_date DATE NOT NULL,
        next_assessment_due DATE,
        health_professional VAR CHAR(255),
        physical_health_summary TEXT,
        mental_health_summary TEXT,
        immunizations_up_to_date BOOLEAN DEFAULT TRUE,
        dental_health_assessment TEXT,
        health_plan TEXT,
        status VAR CHAR(50) DEFAULT 'COMPLETED',
        created_by VAR CHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VAR CHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );

      CREATE INDEX IDX_HEALTH_CHILD ON health_assessments(child_id);
      CREATE INDEX IDX_HEALTH_ORGANIZATION ON health_assessments(organization_id);
      CREATE INDEX IDX_HEALTH_TYPE ON health_assessments(assessment_type);
      CREATE INDEX IDX_HEALTH_DATE ON health_assessments(assessment_date);
      CREATE INDEX IDX_HEALTH_NEXT_DUE ON health_assessments(next_assessment_due);
    `);

    // ========================================
    // FAMILY MEMBERS TABLE
    // ========================================
    await queryRunner.query(`
      CREATE TABLE family_members (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        family_member_number VAR CHAR UNIQUE NOT NULL,
        child_id UUID NOT NULL REFERENCES children(id) ON DELETE RESTRICT,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
        relationship_type VAR CHAR(100) NOT NULL,
        first_name VAR CHAR(100) NOT NULL,
        last_name VAR CHAR(100) NOT NULL,
        date_of_birth DATE,
        parental_responsibility BOOLEAN DEFAULT FALSE,
        contact_restrictions BOOLEAN DEFAULT FALSE,
        contact_restrictions_details TEXT,
        dbs_check_date DATE,
        dbs_check_status VAR CHAR(50),
        safeguarding_concerns BOOLEAN DEFAULT FALSE,
        safeguarding_details TEXT,
        is_primary_contact BOOLEAN DEFAULT FALSE,
        created_by VAR CHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VAR CHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );

      CREATE INDEX IDX_FAMILY_CHILD ON family_members(child_id);
      CREATE INDEX IDX_FAMILY_ORGANIZATION ON family_members(organization_id);
      CREATE INDEX IDX_FAMILY_RELATIONSHIP ON family_members(relationship_type);
      CREATE INDEX IDX_FAMILY_PARENTAL_RESP ON family_members(parental_responsibility);
    `);

    // ========================================
    // CONTACT SCHEDULES TABLE
    // ========================================
    await queryRunner.query(`
      CREATE TABLE contact_schedules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        schedule_number VAR CHAR UNIQUE NOT NULL,
        child_id UUID NOT NULL REFERENCES children(id) ON DELETE RESTRICT,
        family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE RESTRICT,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
        contact_type VAR CHAR(100) NOT NULL,
        frequency VAR CHAR(50) NOT NULL,
        duration_minutes INT,
        supervision_level VAR CHAR(50),
        location_type VAR CHAR(100),
        court_ordered BOOLEAN DEFAULT FALSE,
        court_order_details TEXT,
        start_date DATE NOT NULL,
        end_date DATE,
        status VAR CHAR(50) DEFAULT 'ACTIVE',
        created_by VAR CHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VAR CHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );

      CREATE INDEX IDX_CONTACT_SCHEDULE_CHILD ON contact_schedules(child_id);
      CREATE INDEX IDX_CONTACT_SCHEDULE_FAMILY ON contact_schedules(family_member_id);
      CREATE INDEX IDX_CONTACT_SCHEDULE_ORGANIZATION ON contact_schedules(organization_id);
      CREATE INDEX IDX_CONTACT_SCHEDULE_STATUS ON contact_schedules(status);
    `);

    // ========================================
    // CARE PLANS TABLE
    // ========================================
    await queryRunner.query(`
      CREATE TABLE care_plans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        plan_number VAR CHAR UNIQUE NOT NULL,
        child_id UUID NOT NULL REFERENCES children(id) ON DELETE RESTRICT,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
        plan_type VAR CHAR(50) NOT NULL,
        plan_status VAR CHAR(50) DEFAULT 'DRAFT',
        start_date DATE NOT NULL,
        review_date DATE,
        permanence_goal VAR CHAR(100),
        child_views TEXT,
        parents_views TEXT,
        health_plan TEXT,
        education_plan TEXT,
        approved BOOLEAN DEFAULT FALSE,
        approved_by VAR CHAR(255),
        approved_date DATE,
        iro_name VAR CHAR(255),
        created_by VAR CHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VAR CHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );

      CREATE INDEX IDX_CARE_PLAN_CHILD ON care_plans(child_id);
      CREATE INDEX IDX_CARE_PLAN_ORGANIZATION ON care_plans(organization_id);
      CREATE INDEX IDX_CARE_PLAN_TYPE ON care_plans(plan_type);
      CREATE INDEX IDX_CARE_PLAN_STATUS ON care_plans(plan_status);
      CREATE INDEX IDX_CARE_PLAN_REVIEW_DATE ON care_plans(review_date);
    `);

    // ========================================
    // CARE PLAN REVIEWS TABLE
    // ========================================
    await queryRunner.query(`
      CREATE TABLE care_plan_reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        review_number VAR CHAR UNIQUE NOT NULL,
        care_plan_id UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
        child_id UUID NOT NULL REFERENCES children(id) ON DELETE RESTRICT,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
        review_type VAR CHAR(50) NOT NULL,
        review_date DATE NOT NULL,
        next_review_date DATE,
        review_status VAR CHAR(50) DEFAULT 'SCHEDULED',
        review_outcome VAR CHAR(100),
        child_attended BOOLEAN DEFAULT FALSE,
        child_views TEXT,
        iro_name VAR CHAR(255),
        iro_recommendations TEXT,
        decisions_made TEXT,
        created_by VAR CHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VAR CHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );

      CREATE INDEX IDX_REVIEW_CARE_PLAN ON care_plan_reviews(care_plan_id);
      CREATE INDEX IDX_REVIEW_CHILD ON care_plan_reviews(child_id);
      CREATE INDEX IDX_REVIEW_ORGANIZATION ON care_plan_reviews(organization_id);
      CREATE INDEX IDX_REVIEW_TYPE ON care_plan_reviews(review_type);
      CREATE INDEX IDX_REVIEW_DATE ON care_plan_reviews(review_date);
      CREATE INDEX IDX_REVIEW_STATUS ON care_plan_reviews(review_status);
    `);

    // ========================================
    // PATHWAY PLANS TABLE (LEAVING CARE)
    // ========================================
    await queryRunner.query(`
      CREATE TABLE pathway_plans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        plan_number VAR CHAR UNIQUE NOT NULL,
        child_id UUID NOT NULL REFERENCES children(id) ON DELETE RESTRICT,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
        plan_status VAR CHAR(50) DEFAULT 'DRAFT',
        leaving_care_status VAR CHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        last_review_date DATE,
        next_review_date DATE,
        personal_advisor_name VAR CHAR(255),
        accommodation_type VAR CHAR(100),
        eet_status VAR CHAR(100),
        financial_support_details TEXT,
        created_by VAR CHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VAR CHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );

      CREATE INDEX IDX_PATHWAY_CHILD ON pathway_plans(child_id);
      CREATE INDEX IDX_PATHWAY_ORGANIZATION ON pathway_plans(organization_id);
      CREATE INDEX IDX_PATHWAY_STATUS ON pathway_plans(plan_status);
      CREATE INDEX IDX_PATHWAY_LEAVING_STATUS ON pathway_plans(leaving_care_status);
      CREATE INDEX IDX_PATHWAY_EET ON pathway_plans(eet_status);
    `);

    // ========================================
    // UASC PROFILES TABLE
    // ========================================
    await queryRunner.query(`
      CREATE TABLE uasc_profiles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        uasc_number VAR CHAR UNIQUE NOT NULL,
        child_id UUID NOT NULL REFERENCES children(id) ON DELETE RESTRICT,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
        status VAR CHAR(50) DEFAULT 'ACTIVE',
        arrival_date DATE NOT NULL,
        arrival_location VAR CHAR(255),
        arrival_route VAR CHAR(50),
        referral_source VAR CHAR(100) NOT NULL,
        referral_date DATE NOT NULL,
        country_of_origin VAR CHAR(100) NOT NULL,
        nationality VAR CHAR(100),
        first_language VAR CHAR(100) NOT NULL,
        interpreter_required BOOLEAN DEFAULT TRUE,
        home_office_reference VAR CHAR(255),
        asylum_claim_date DATE,
        age_disputed BOOLEAN DEFAULT FALSE,
        trafficking_risk VAR CHAR(50) DEFAULT 'LOW',
        nrm_referral_made BOOLEAN DEFAULT FALSE,
        created_by VAR CHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VAR CHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );

      CREATE INDEX IDX_UASC_CHILD ON uasc_profiles(child_id);
      CREATE INDEX IDX_UASC_ORGANIZATION ON uasc_profiles(organization_id);
      CREATE INDEX IDX_UASC_STATUS ON uasc_profiles(status);
      CREATE INDEX IDX_UASC_ARRIVAL_DATE ON uasc_profiles(arrival_date);
      CREATE INDEX IDX_UASC_TRAFFICKING_RISK ON uasc_profiles(trafficking_risk);
    `);

    // ========================================
    // AGE ASSESSMENTS TABLE
    // ========================================
    await queryRunner.query(`
      CREATE TABLE age_assessments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        assessment_number VAR CHAR UNIQUE NOT NULL,
        uasc_profile_id UUID NOT NULL REFERENCES uasc_profiles(id) ON DELETE CASCADE,
        status VAR CHAR(50) DEFAULT 'SCHEDULED',
        scheduled_date DATE NOT NULL,
        completed_date DATE,
        claimed_date_of_birth DATE NOT NULL,
        claimed_age INT NOT NULL,
        assessed_date_of_birth DATE,
        assessed_age INT,
        outcome VAR CHAR(100),
        reasoning_for_decision TEXT,
        merton_compliant BOOLEAN DEFAULT FALSE,
        two_assessors_used BOOLEAN DEFAULT FALSE,
        created_by VAR CHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VAR CHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );

      CREATE INDEX IDX_AGE_ASSESSMENT_UASC ON age_assessments(uasc_profile_id);
      CREATE INDEX IDX_AGE_ASSESSMENT_STATUS ON age_assessments(status);
      CREATE INDEX IDX_AGE_ASSESSMENT_DATE ON age_assessments(scheduled_date);
    `);

    // ========================================
    // IMMIGRATION STATUSES TABLE
    // ========================================
    await queryRunner.query(`
      CREATE TABLE immigration_statuses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        status_number VAR CHAR UNIQUE NOT NULL,
        uasc_profile_id UUID NOT NULL REFERENCES uasc_profiles(id) ON DELETE CASCADE,
        status_date DATE NOT NULL,
        status_type VAR CHAR(100) NOT NULL,
        is_current BOOLEAN DEFAULT TRUE,
        asylum_claim_status VAR CHAR(100) DEFAULT 'NOT_YET_SUBMITTED',
        leave_to_remain_type VAR CHAR(100),
        leave_granted_date DATE,
        leave_expiry_date DATE,
        brp_number VAR CHAR(255),
        brp_expiry_date DATE,
        appeal_status VAR CHAR(50) DEFAULT 'NOT_APPEALED',
        appeal_deadline DATE,
        created_by VAR CHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VAR CHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );

      CREATE INDEX IDX_IMMIGRATION_UASC ON immigration_statuses(uasc_profile_id);
      CREATE INDEX IDX_IMMIGRATION_TYPE ON immigration_statuses(status_type);
      CREATE INDEX IDX_IMMIGRATION_CURRENT ON immigration_statuses(is_current);
      CREATE INDEX IDX_IMMIGRATION_LEAVE_EXPIRY ON immigration_statuses(leave_expiry_date);
    `);

    // ========================================
    // HOME OFFICE CORRESPONDENCE TABLE
    // ========================================
    await queryRunner.query(`
      CREATE TABLE home_office_correspondence (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        correspondence_number VAR CHAR UNIQUE NOT NULL,
        uasc_profile_id UUID NOT NULL REFERENCES uasc_profiles(id) ON DELETE CASCADE,
        correspondence_type VAR CHAR(100) NOT NULL,
        direction VAR CHAR(50) NOT NULL,
        status VAR CHAR(50) DEFAULT 'DRAFT',
        subject VAR CHAR(255) NOT NULL,
        correspondence_date DATE NOT NULL,
        sent_date DATE,
        response_deadline DATE,
        response_received BOOLEAN DEFAULT FALSE,
        response_received_date DATE,
        created_by VAR CHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VAR CHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );

      CREATE INDEX IDX_CORRESPONDENCE_UASC ON home_office_correspondence(uasc_profile_id);
      CREATE INDEX IDX_CORRESPONDENCE_TYPE ON home_office_correspondence(correspondence_type);
      CREATE INDEX IDX_CORRESPONDENCE_STATUS ON home_office_correspondence(status);
      CREATE INDEX IDX_CORRESPONDENCE_DEADLINE ON home_office_correspondence(response_deadline);
    `);

    // ========================================
    // AUDIT LOG
    // ========================================
    await queryRunner.query(`
      CREATE TABLE audit_log (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        entity_type VAR CHAR(100) NOT NULL,
        entity_id UUID NOT NULL,
        action VAR CHAR(50) NOT NULL,
        user_id VAR CHAR(255) NOT NULL,
        changes JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IDX_AUDIT_ENTITY ON audit_log(entity_type, entity_id);
      CREATE INDEX IDX_AUDIT_USER ON audit_log(user_id);
      CREATE INDEX IDX_AUDIT_TIMESTAMP ON audit_log(timestamp);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order to respect foreign key const raints
    await queryRunner.query(`DROP TABLE IF EXISTS audit_log CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS home_office_correspondence CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS immigration_statuses CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS age_assessments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS uasc_profiles CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS pathway_plans CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS care_plan_reviews CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS care_plans CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS contact_schedules CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS family_members CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS health_assessments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS personal_education_plans CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS safeguarding_incidents CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS placements CASCADE`);
  }
}
