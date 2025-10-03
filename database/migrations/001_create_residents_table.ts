/**
 * @fileoverview Database migration for residents table
 * @module ResidentsMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Creates the residents table with comprehensive healthcare fields,
 * proper indexing, and compliance with UK healthcare data standards.
 * 
 * @compliance
 * - GDPR Article 6 (Lawfulness of processing)
 * - NHS Digital Data Security Standards
 * - CQC Fundamental Standards
 * - Data Protection Act 2018
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('residents', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Basic Information
    table.string('first_name', 100).notNullable();
    table.string('middle_name', 100).nullable();
    table.string('last_name', 100).notNullable();
    table.string('preferred_name', 100).nullable();
    table.date('date_of_birth').notNullable();
    table.enum('gender', ['male', 'female', 'other', 'not_specified', 'not_known']).notNullable();
    table.enum('marital_status', [
      'single', 'married', 'divorced', 'widowed', 'separated', 'civil_partnership', 'unknown'
    ]).defaultTo('unknown');

    // NHS and Medical Information (Encrypted)
    table.text('nhs_number').nullable().unique(); // Encrypted
    table.text('medical_information').nullable(); // Encrypted JSON

    // Contact Information (Encrypted)
    table.text('phone_number').nullable(); // Encrypted
    table.text('email').nullable(); // Encrypted
    table.text('address').nullable(); // Encrypted JSON
    table.text('emergency_contacts').nullable(); // Encrypted JSON

    // Care Information
    table.enum('care_level', [
      'residential', 'nursing', 'dementia', 'mental_health', 
      'learning_disability', 'physical_disability', 'palliative'
    ]).notNullable();
    table.enum('status', [
      'active', 'discharged', 'deceased', 'transferred', 'temporary_absence', 'hospital'
    ]).defaultTo('active');
    table.date('admission_date').notNullable();
    table.date('discharge_date').nullable();
    table.string('room_number', 20).nullable();

    // Care Preferences (Encrypted)
    table.text('care_preferences').nullable(); // Encrypted JSON

    // Financial Information (Encrypted)
    table.text('financial_information').nullable(); // Encrypted JSON

    // Legal Information (Encrypted)
    table.text('legal_information').nullable(); // Encrypted JSON

    // Risk Assessment
    table.integer('risk_level').defaultTo(1).checkBetween([1, 5]);
    table.specificType('risk_factors', 'text[]').nullable();

    // Organization and Tenant Information
    table.uuid('organization_id').notNullable();
    table.uuid('tenant_id').notNullable();

    // GDPR and Consent Management
    table.timestamp('gdpr_consent_date').nullable();
    table.string('gdpr_lawful_basis', 50).nullable();
    table.integer('data_retention_period').defaultTo(2555); // 7 years in days
    table.boolean('consent_to_treatment').defaultTo(false);
    table.boolean('consent_to_photography').defaultTo(false);
    table.boolean('consent_to_data_sharing').defaultTo(false);

    // Audit Trail
    table.timestamps(true, true); // created_at, updated_at
    table.timestamp('deleted_at').nullable();
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').nullable();

    // Indexes for performance
    table.index(['organization_id', 'status'], 'idx_residents_org_status');
    table.index(['date_of_birth', 'last_name'], 'idx_residents_dob_name');
    table.index(['care_level'], 'idx_residents_care_level');
    table.index(['admission_date'], 'idx_residents_admission');
    table.index(['room_number'], 'idx_residents_room');
    table.index(['tenant_id'], 'idx_residents_tenant');
    table.index(['created_at'], 'idx_residents_created');
    table.index(['updated_at'], 'idx_residents_updated');

    // Partial index for active residents
    table.index(['status'], 'idx_residents_active', {
      predicate: knex.whereRaw("status = 'active' AND deleted_at IS NULL")
    });

    // Check constraints
    table.check('date_of_birth <= CURRENT_DATE', [], 'chk_residents_dob_not_future');
    table.check('admission_date <= CURRENT_DATE', [], 'chk_residents_admission_not_future');
    table.check('discharge_date IS NULL OR discharge_date >= admission_date', [], 'chk_residents_discharge_after_admission');
    table.check('risk_level >= 1 AND risk_level <= 5', [], 'chk_residents_risk_level_range');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('residents');
}