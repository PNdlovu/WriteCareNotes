/**
 * @fileoverview Database migration for prescriptions table
 * @module PrescriptionsMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Creates the prescriptions table with comprehensive prescribing fields,
 * proper relationships, and compliance with UK healthcare prescribing standards.
 * 
 * @compliance
 * - MHRA Prescription Requirements
 * - GMC Prescribing Guidelines
 * - CQC Medication Management Standards
 * - GDPR Data Protection Regulation
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('prescriptions', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Relationships
    table.uuid('resident_id').notNullable().references('id').inTable('residents').onDelete('CASCADE');
    table.uuid('medication_id').notNullable().references('id').inTable('medications').onDelete('RESTRICT');

    // Prescriber Information (stored as JSONB for flexibility)
    table.jsonb('prescriber_info').notNullable();

    // Prescription Details
    table.enum('prescription_type', [
      'regular', 'prn', 'stat', 'variable', 'titration'
    ]).defaultTo('regular');

    table.enum('status', [
      'active', 'completed', 'discontinued', 'expired', 'suspended', 'cancelled'
    ]).defaultTo('active');

    // Dosage and Administration (stored as JSONB for complex dosing schedules)
    table.jsonb('dosage').notNullable();

    table.enum('route', [
      'oral', 'sublingual', 'buccal', 'topical', 'transdermal', 'intravenous', 
      'intramuscular', 'subcutaneous', 'intradermal', 'inhalation', 'nasal', 
      'ophthalmic', 'otic', 'rectal', 'vaginal', 'urethral'
    ]).notNullable();

    table.string('indication', 500).notNullable();
    table.text('clinical_notes').nullable();

    // Timing and Duration
    table.date('start_date').notNullable();
    table.date('end_date').nullable();
    table.integer('duration_days').nullable();

    // Review Information
    table.date('review_date').nullable();
    table.jsonb('review_schedule').nullable();
    table.date('last_reviewed_date').nullable();
    table.uuid('last_reviewed_by').nullable();

    // Safety and Monitoring
    table.decimal('max_dose_per_day', 10, 3).nullable();
    table.integer('min_interval_hours').nullable();
    table.boolean('requires_monitoring').defaultTo(false);
    table.specificType('monitoring_instructions', 'text[]').nullable();

    // Discontinuation Information
    table.string('discontinuation_reason', 500).nullable();
    table.uuid('discontinued_by').nullable();
    table.timestamp('discontinuation_date').nullable();

    // Organization and Tenant Information
    table.uuid('organization_id').notNullable();
    table.uuid('tenant_id').notNullable();

    // Audit Trail
    table.timestamps(true, true); // created_at, updated_at
    table.timestamp('deleted_at').nullable();
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').nullable();

    // Indexes for performance
    table.index(['resident_id', 'status'], 'idx_prescriptions_resident_status');
    table.index(['medication_id', 'status'], 'idx_prescriptions_medication_status');
    table.index(['start_date', 'end_date'], 'idx_prescriptions_date_range');
    table.index(['review_date'], 'idx_prescriptions_review_date');
    table.index(['status', 'organization_id'], 'idx_prescriptions_status_org');
    table.index(['prescription_type'], 'idx_prescriptions_type');
    table.index(['created_at'], 'idx_prescriptions_created');
    table.index(['tenant_id'], 'idx_prescriptions_tenant');

    // Partial indexes for active prescriptions
    table.index(['resident_id'], 'idx_prescriptions_active_resident', {
      predicate: knex.whereRaw("status = 'active' AND deleted_at IS NULL")
    });

    // Check constraints
    table.check('end_date IS NULL OR end_date >= start_date', [], 'chk_prescriptions_end_after_start');
    table.check('duration_days IS NULL OR duration_days > 0', [], 'chk_prescriptions_duration_positive');
    table.check('max_dose_per_day IS NULL OR max_dose_per_day > 0', [], 'chk_prescriptions_max_dose_positive');
    table.check('min_interval_hours IS NULL OR min_interval_hours > 0', [], 'chk_prescriptions_min_interval_positive');
    table.check('review_date IS NULL OR review_date >= start_date', [], 'chk_prescriptions_review_after_start');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('prescriptions');
}