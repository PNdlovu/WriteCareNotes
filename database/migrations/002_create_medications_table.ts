/**
 * @fileoverview Database migration for medications table
 * @module MedicationsMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Creates the medications table with comprehensive pharmaceutical fields,
 * proper indexing, and compliance with UK healthcare data standards.
 * 
 * @compliance
 * - MHRA Medication Standards
 * - BNF Classification System
 * - NHS Digital Data Standards
 * - GDPR Data Protection Regulation
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('medications', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Basic Medication Information
    table.string('generic_name', 255).notNullable();
    table.string('brand_name', 255).nullable();
    table.specificType('alternative_names', 'text[]').nullable();
    table.specificType('active_ingredients', 'text[]').notNullable();
    table.string('strength', 100).notNullable();
    table.string('strength_unit', 50).notNullable();

    // Form and Route
    table.enum('form', [
      'tablet', 'capsule', 'liquid', 'injection', 'cream', 'ointment', 'gel', 
      'patch', 'inhaler', 'drops', 'spray', 'suppository', 'pessary', 'powder', 'granules'
    ]).notNullable();
    
    table.enum('route', [
      'oral', 'sublingual', 'buccal', 'topical', 'transdermal', 'intravenous', 
      'intramuscular', 'subcutaneous', 'intradermal', 'inhalation', 'nasal', 
      'ophthalmic', 'otic', 'rectal', 'vaginal', 'urethral'
    ]).notNullable();

    // Classification
    table.enum('therapeutic_class', [
      'analgesic', 'antibiotic', 'anticoagulant', 'antidepressant', 'antidiabetic',
      'antiepileptic', 'antihypertensive', 'antiinflammatory', 'antipsychotic',
      'bronchodilator', 'cardiac', 'diuretic', 'hormone', 'immunosuppressant',
      'laxative', 'sedative', 'vitamin', 'mineral', 'other'
    ]).notNullable();

    table.enum('controlled_drug_schedule', [
      'schedule_1', 'schedule_2', 'schedule_3', 'schedule_4_part_1', 
      'schedule_4_part_2', 'schedule_5', 'not_controlled'
    ]).defaultTo('not_controlled');

    // Medical Coding Systems
    table.string('snomed_code', 20).nullable();
    table.string('dmd_code', 20).nullable(); // Dictionary of medicines and devices
    table.string('bnf_code', 20).nullable(); // British National Formulary
    table.string('atc_code', 10).nullable(); // Anatomical Therapeutic Chemical

    // Manufacturer Information
    table.string('manufacturer', 255).nullable();
    table.string('marketing_authorization_holder', 255).nullable();
    table.string('license_number', 100).nullable();

    // Clinical Information
    table.specificType('indications', 'text[]').nullable();
    table.jsonb('contraindications').nullable();
    table.jsonb('side_effects').nullable();
    table.jsonb('drug_interactions').nullable();
    table.jsonb('monitoring_requirements').nullable();

    // Dosage Information
    table.string('standard_dose_adult', 255).nullable();
    table.string('standard_dose_elderly', 255).nullable();
    table.decimal('maximum_daily_dose', 10, 3).nullable();
    table.integer('minimum_interval_hours').nullable();

    // Storage and Handling
    table.jsonb('storage_requirements').nullable();
    table.integer('shelf_life_months').nullable();
    table.specificType('special_precautions', 'text[]').nullable();

    // Regulatory Status
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_prescription_only').defaultTo(true);
    table.boolean('is_black_triangle').defaultTo(false); // Additional monitoring required
    table.date('discontinuation_date').nullable();

    // Cost Information
    table.decimal('nhs_indicative_price', 10, 2).nullable();
    table.string('drug_tariff_category', 50).nullable();

    // Audit Trail
    table.timestamps(true, true); // created_at, updated_at
    table.timestamp('deleted_at').nullable();
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').nullable();

    // Indexes for performance
    table.index(['generic_name', 'strength'], 'idx_medications_generic_strength');
    table.index(['brand_name'], 'idx_medications_brand');
    table.index(['therapeutic_class'], 'idx_medications_therapeutic_class');
    table.index(['controlled_drug_schedule'], 'idx_medications_controlled_schedule');
    table.index(['bnf_code'], 'idx_medications_bnf');
    table.index(['snomed_code'], 'idx_medications_snomed');
    table.index(['is_active'], 'idx_medications_active');
    table.index(['form', 'route'], 'idx_medications_form_route');
    table.index(['created_at'], 'idx_medications_created');

    // Check constraints
    table.check('maximum_daily_dose IS NULL OR maximum_daily_dose > 0', [], 'chk_medications_max_dose_positive');
    table.check('minimum_interval_hours IS NULL OR minimum_interval_hours > 0', [], 'chk_medications_min_interval_positive');
    table.check('shelf_life_months IS NULL OR shelf_life_months > 0', [], 'chk_medications_shelf_life_positive');
    table.check('nhs_indicative_price IS NULL OR nhs_indicative_price >= 0', [], 'chk_medications_price_non_negative');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('medications');
}