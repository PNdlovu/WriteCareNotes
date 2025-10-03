/**
 * @fileoverview Consent Management Table Migration
 * @module ConsentManagementMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Creates the consent_management table with comprehensive
 * GDPR compliance and capacity assessment capabilities.
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('consent_management', (table) => {
    // Primary identification
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('consent_reference', 50).unique().notNullable();
    
    // Resident relationship
    table.uuid('resident_id').notNullable();
    table.foreign('resident_id').references('id').inTable('residents').onDelete('CASCADE');
    
    // Consent classification
    table.enum('consent_type', [
      'care_treatment',
      'data_processing',
      'photography_video',
      'medical_research',
      'marketing_communications',
      'data_sharing',
      'emergency_contact',
      'family_involvement',
      'social_media',
      'cctv_monitoring',
      'medication_administration',
      'personal_care',
      'mental_health_treatment',
      'end_of_life_care',
      'advance_directives',
      'dnacpr',
      'organ_donation',
      'post_mortem',
      'financial_management',
      'advocacy_services'
    ]).notNullable();
    
    table.enum('status', [
      'given',
      'refused',
      'withdrawn',
      'pending',
      'expired',
      'under_review',
      'conditional',
      'capacity_assessment_required'
    ]).notNullable();
    
    // GDPR legal basis
    table.enum('lawful_basis', [
      'consent',
      'contract',
      'legal_obligation',
      'vital_interests',
      'public_task',
      'legitimate_interests'
    ]).notNullable();
    
    table.enum('special_category_basis', [
      'explicit_consent',
      'employment_law',
      'vital_interests',
      'legitimate_activities',
      'public_disclosure',
      'legal_claims',
      'substantial_public_interest',
      'healthcare',
      'public_health',
      'archiving_research'
    ]).nullable();
    
    // Consent giver details
    table.enum('consent_given_by', [
      'resident',
      'power_of_attorney',
      'court_appointed_deputy',
      'next_of_kin',
      'advocate',
      'best_interests_decision',
      'emergency_consent'
    ]).notNullable();
    
    table.string('consent_given_by_name', 100).notNullable();
    table.string('consent_given_by_relationship', 100).nullable();
    
    // Consent details (encrypted)
    table.text('consent_description').notNullable(); // Encrypted
    table.text('consent_conditions_text').nullable(); // Encrypted
    table.jsonb('consent_conditions').nullable();
    
    // Consent timeline
    table.timestamp('consent_given_date').notNullable();
    table.timestamp('consent_withdrawn_date').nullable();
    table.string('consent_withdrawn_by', 100).nullable();
    table.text('withdrawal_reason').nullable(); // Encrypted
    table.timestamp('expiry_date').nullable();
    table.timestamp('next_review_date').nullable();
    table.boolean('requires_renewal').defaultTo(false);
    
    // GDPR compliance flags
    table.boolean('is_informed').defaultTo(false);
    table.boolean('is_specific').defaultTo(false);
    table.boolean('is_unambiguous').defaultTo(false);
    table.boolean('is_freely_given').defaultTo(false);
    
    // Complex data structures (JSONB)
    table.jsonb('capacity_assessment').notNullable();
    table.jsonb('consent_evidence').notNullable();
    table.jsonb('audit_trail').notNullable();
    table.jsonb('data_processing_details').notNullable();
    
    // Related consents
    table.specificType('related_consents', 'text[]').nullable();
    table.specificType('dependent_consents', 'text[]').nullable();
    table.uuid('parent_consent_id').nullable();
    table.foreign('parent_consent_id').references('id').inTable('consent_management').onDelete('SET NULL');
    
    // Additional notes
    table.text('additional_notes').nullable(); // Encrypted
    
    // Recording details
    table.uuid('recorded_by').notNullable();
    table.string('recorded_by_name', 100).notNullable();
    table.string('recorded_by_role', 50).notNullable();
    
    // Multi-tenancy
    table.uuid('tenant_id').notNullable();
    table.uuid('organization_id').notNullable();
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes for performance and queries
    table.index(['resident_id', 'consent_type']);
    table.index(['status', 'expiry_date']);
    table.index(['tenant_id', 'organization_id']);
    table.index(['lawful_basis', 'special_category_basis']);
    table.index(['consent_given_date']);
    table.index(['next_review_date']);
    table.index(['requires_renewal', 'next_review_date']);
  });

  // Create audit trigger for consent management
  await knex.raw(`
    CREATE OR REPLACE FUNCTION audit_consent_management()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO audit_trail (
        table_name,
        operation,
        record_id,
        old_values,
        new_values,
        changed_by,
        changed_at,
        tenant_id
      ) VALUES (
        'consent_management',
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END,
        current_setting('app.current_user_id', true),
        NOW(),
        COALESCE(NEW.tenant_id, OLD.tenant_id)
      );
      RETURN COALESCE(NEW, OLD);
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER consent_management_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON consent_management
    FOR EACH ROW EXECUTE FUNCTION audit_consent_management();
  `);

  // Create indexes for optimal query performance
  await knex.raw(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consent_gdpr_compliance 
    ON consent_management (is_informed, is_specific, is_unambiguous, is_freely_given) 
    WHERE status = 'given';
  `);

  await knex.raw(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consent_expiry_monitoring 
    ON consent_management (expiry_date, requires_renewal) 
    WHERE status = 'given' AND expiry_date IS NOT NULL;
  `);

  await knex.raw(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consent_capacity_assessment 
    ON consent_management USING GIN (capacity_assessment) 
    WHERE capacity_assessment IS NOT NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS consent_management_audit_trigger ON consent_management;');
  await knex.raw('DROP FUNCTION IF EXISTS audit_consent_management();');
  await knex.raw('DROP INDEX CONCURRENTLY IF EXISTS idx_consent_gdpr_compliance;');
  await knex.raw('DROP INDEX CONCURRENTLY IF EXISTS idx_consent_expiry_monitoring;');
  await knex.raw('DROP INDEX CONCURRENTLY IF EXISTS idx_consent_capacity_assessment;');
  await knex.schema.dropTableIfExists('consent_management');
}