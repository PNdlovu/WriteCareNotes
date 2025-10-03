/**
 * @fileoverview Database migration for administration_records table
 * @module AdministrationRecordsMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Creates the administration_records table with comprehensive
 * medication administration tracking, electronic signatures, and audit trails.
 * 
 * @compliance
 * - MHRA Administration Requirements
 * - CQC Medication Management Standards
 * - NMC Professional Standards
 * - GDPR Data Protection Regulation
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('administration_records', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Relationships
    table.uuid('prescription_id').notNullable().references('id').inTable('prescriptions').onDelete('CASCADE');
    table.uuid('resident_id').notNullable().references('id').inTable('residents').onDelete('CASCADE');
    table.uuid('medication_id').notNullable().references('id').inTable('medications').onDelete('RESTRICT');

    // Administration Details
    table.timestamp('scheduled_time').notNullable();
    table.timestamp('administration_time').notNullable();

    table.enum('status', [
      'given', 'refused', 'omitted', 'delayed', 'withheld', 'not_available'
    ]).notNullable();

    // Dosage Information (stored as JSONB for complex dosing)
    table.jsonb('dosage_given').notNullable();

    table.enum('route_used', [
      'oral', 'sublingual', 'buccal', 'topical', 'transdermal', 'intravenous', 
      'intramuscular', 'subcutaneous', 'intradermal', 'inhalation', 'nasal', 
      'ophthalmic', 'otic', 'rectal', 'vaginal', 'urethral'
    ]).notNullable();

    // Staff Information
    table.uuid('administered_by').notNullable();
    table.string('administrator_name', 255).notNullable();
    table.string('administrator_role', 100).notNullable();
    table.jsonb('electronic_signature').notNullable();

    // Witness Information (for controlled substances)
    table.boolean('witness_required').defaultTo(false);
    table.jsonb('witness_info').nullable();
    table.jsonb('second_witness_info').nullable();

    // Clinical Information
    table.text('clinical_notes').nullable();
    table.text('administration_notes').nullable();

    // Refusal Information
    table.enum('refusal_reason', [
      'patient_refused', 'nausea_vomiting', 'swallowing_difficulty', 'asleep',
      'absent_from_unit', 'clinical_decision', 'allergic_reaction', 'other'
    ]).nullable();

    table.text('refusal_notes').nullable();
    table.boolean('prescriber_notified').defaultTo(false);
    table.timestamp('prescriber_notification_time').nullable();

    // Side Effects and Observations
    table.jsonb('side_effects_observed').nullable();
    table.jsonb('vital_signs_before').nullable();
    table.jsonb('vital_signs_after').nullable();

    // Timing Information
    table.boolean('is_late_administration').defaultTo(false);
    table.text('late_administration_reason').nullable();
    table.integer('delay_minutes').nullable();

    // Quality Assurance
    table.boolean('double_checked').defaultTo(false);
    table.uuid('double_checked_by').nullable();
    table.boolean('barcode_scanned').defaultTo(false);
    table.boolean('patient_identified').defaultTo(true);
    table.string('identification_method', 100).nullable();

    // Organization and Tenant Information
    table.uuid('organization_id').notNullable();
    table.uuid('tenant_id').notNullable();

    // Audit Trail
    table.timestamps(true, true); // created_at, updated_at

    // Indexes for performance
    table.index(['prescription_id', 'scheduled_time'], 'idx_admin_records_prescription_time');
    table.index(['resident_id', 'administration_time'], 'idx_admin_records_resident_time');
    table.index(['medication_id', 'administration_time'], 'idx_admin_records_medication_time');
    table.index(['administered_by', 'administration_time'], 'idx_admin_records_admin_time');
    table.index(['status', 'administration_time'], 'idx_admin_records_status_time');
    table.index(['organization_id', 'administration_time'], 'idx_admin_records_org_time');
    table.index(['tenant_id'], 'idx_admin_records_tenant');
    table.index(['witness_required'], 'idx_admin_records_witness_required');
    table.index(['is_late_administration'], 'idx_admin_records_late');
    table.index(['double_checked'], 'idx_admin_records_double_checked');

    // Partial indexes for specific scenarios
    table.index(['prescription_id'], 'idx_admin_records_given', {
      predicate: knex.whereRaw("status = 'given'")
    });

    table.index(['resident_id'], 'idx_admin_records_refused', {
      predicate: knex.whereRaw("status = 'refused'")
    });

    table.index(['medication_id'], 'idx_admin_records_controlled', {
      predicate: knex.whereRaw("witness_required = true")
    });

    // Check constraints
    table.check('administration_time >= scheduled_time - INTERVAL \'2 hours\'', [], 'chk_admin_records_time_reasonable');
    table.check('delay_minutes IS NULL OR delay_minutes >= 0', [], 'chk_admin_records_delay_non_negative');
    table.check('(status = \'refused\' AND refusal_reason IS NOT NULL) OR status != \'refused\'', [], 'chk_admin_records_refusal_reason');
    table.check('(witness_required = true AND witness_info IS NOT NULL) OR witness_required = false', [], 'chk_admin_records_witness_info');
    table.check('(prescriber_notified = true AND prescriber_notification_time IS NOT NULL) OR prescriber_notified = false', [], 'chk_admin_records_prescriber_notification');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('administration_records');
}