/**
 * @fileoverview Database migration for controlled substances management tables
 * @module ControlledSubstancesMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Creates comprehensive controlled substances management tables
 * for dual witness verification, custody chain tracking, stock reconciliation,
 * and regulatory compliance across all British Isles jurisdictions.
 * 
 * @compliance
 * - MHRA Controlled Drugs Regulations 2013
 * - Misuse of Drugs Act 1971
 * - Controlled Drugs (Supervision of Management and Use) Regulations 2013
 * - CQC, Care Inspectorate, CIW, RQIA Standards
 * - GMC Controlled Drugs Guidance
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create controlled_drug_register table
  await knex.schema.createTable('controlled_drug_register', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('medication_id').notNullable();
    table.enum('schedule', ['I', 'II', 'III', 'IV', 'V']).notNullable();
    table.string('batch_number', 100).notNullable();
    table.date('expiry_date').notNullable();
    table.string('supplier_name', 255).notNullable();
    table.string('supplier_license', 100).notNullable();
    table.timestamp('received_date').notNullable();
    table.decimal('received_quantity', 10, 3).notNullable();
    table.uuid('received_by').notNullable();
    table.uuid('witnessed_by').notNullable();
    table.decimal('current_stock', 10, 3).notNullable().defaultTo(0);
    table.decimal('total_administered', 10, 3).notNullable().defaultTo(0);
    table.decimal('total_wasted', 10, 3).notNullable().defaultTo(0);
    table.decimal('total_returned', 10, 3).notNullable().defaultTo(0);
    table.timestamp('last_reconciliation_date');
    table.timestamp('next_reconciliation_due');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.uuid('organization_id').notNullable();
    table.uuid('tenant_id').notNullable();
    table.timestamps(true, true);

    // Indexes for performance
    table.index(['medication_id'], 'idx_cd_register_medication');
    table.index(['schedule'], 'idx_cd_register_schedule');
    table.index(['organization_id'], 'idx_cd_register_org');
    table.index(['tenant_id'], 'idx_cd_register_tenant');
    table.index(['is_active'], 'idx_cd_register_active');
    table.index(['expiry_date'], 'idx_cd_register_expiry');
    table.index(['next_reconciliation_due'], 'idx_cd_register_reconciliation');

    // Foreign key constraints
    table.foreign('medication_id').references('id').inTable('medications').onDelete('RESTRICT');
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
  });

  // Create controlled_drug_transactions table
  await knex.schema.createTable('controlled_drug_transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('register_id').notNullable();
    table.enum('transaction_type', [
      'receipt', 'administration', 'waste', 'return', 'destruction', 'adjustment'
    ]).notNullable();
    table.decimal('quantity', 10, 3).notNullable();
    table.decimal('running_balance', 10, 3).notNullable();
    table.timestamp('transaction_date').notNullable();
    table.uuid('performed_by').notNullable();
    table.uuid('witnessed_by').notNullable();
    table.uuid('resident_id'); // For administration transactions
    table.uuid('prescription_id'); // For administration transactions
    table.text('notes');
    table.string('hash', 64).notNullable(); // SHA-256 hash for custody chain
    table.string('previous_hash', 64); // Previous transaction hash for chain integrity
    table.uuid('organization_id').notNullable();
    table.uuid('tenant_id').notNullable();
    table.timestamps(true, true);

    // Indexes for performance
    table.index(['register_id'], 'idx_cd_transactions_register');
    table.index(['transaction_type'], 'idx_cd_transactions_type');
    table.index(['transaction_date'], 'idx_cd_transactions_date');
    table.index(['performed_by'], 'idx_cd_transactions_performer');
    table.index(['resident_id'], 'idx_cd_transactions_resident');
    table.index(['prescription_id'], 'idx_cd_transactions_prescription');
    table.index(['organization_id'], 'idx_cd_transactions_org');
    table.index(['tenant_id'], 'idx_cd_transactions_tenant');
    table.index(['hash'], 'idx_cd_transactions_hash');

    // Foreign key constraints
    table.foreign('register_id').references('id').inTable('controlled_drug_register').onDelete('CASCADE');
    table.foreign('resident_id').references('id').inTable('residents').onDelete('SET NULL');
    table.foreign('prescription_id').references('id').inTable('prescriptions').onDelete('SET NULL');
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
  });

  // Create controlled_drug_destructions table
  await knex.schema.createTable('controlled_drug_destructions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('register_id').notNullable();
    table.decimal('quantity', 10, 3).notNullable();
    table.timestamp('destruction_date').notNullable();
    table.enum('destruction_method', [
      'incineration', 'chemical_treatment', 'authorized_disposal', 'return_to_supplier'
    ]).notNullable();
    table.text('reason').notNullable();
    table.uuid('witness1_id').notNullable();
    table.uuid('witness2_id').notNullable();
    table.string('certificate_number', 100);
    table.string('disposal_company', 255);
    table.text('mhra_notification_reference');
    table.timestamp('mhra_notification_date');
    table.text('notes');
    table.uuid('organization_id').notNullable();
    table.uuid('tenant_id').notNullable();
    table.timestamps(true, true);

    // Indexes for performance
    table.index(['register_id'], 'idx_cd_destructions_register');
    table.index(['destruction_date'], 'idx_cd_destructions_date');
    table.index(['destruction_method'], 'idx_cd_destructions_method');
    table.index(['witness1_id'], 'idx_cd_destructions_witness1');
    table.index(['witness2_id'], 'idx_cd_destructions_witness2');
    table.index(['organization_id'], 'idx_cd_destructions_org');
    table.index(['tenant_id'], 'idx_cd_destructions_tenant');
    table.index(['mhra_notification_date'], 'idx_cd_destructions_mhra');

    // Foreign key constraints
    table.foreign('register_id').references('id').inTable('controlled_drug_register').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');

    // Ensure different witnesses
    table.check('witness1_id != witness2_id', 'chk_cd_destructions_different_witnesses');
  });

  // Create controlled_drug_reconciliations table
  await knex.schema.createTable('controlled_drug_reconciliations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('register_id').notNullable();
    table.timestamp('reconciliation_date').notNullable();
    table.decimal('expected_balance', 10, 3).notNullable();
    table.decimal('actual_balance', 10, 3).notNullable();
    table.decimal('discrepancy', 10, 3).notNullable().defaultTo(0);
    table.enum('status', ['balanced', 'discrepancy', 'under_investigation', 'resolved']).notNullable();
    table.text('discrepancy_reason');
    table.text('investigation_notes');
    table.uuid('performed_by').notNullable();
    table.uuid('witnessed_by').notNullable();
    table.timestamp('next_reconciliation_due');
    table.boolean('requires_investigation').notNullable().defaultTo(false);
    table.uuid('organization_id').notNullable();
    table.uuid('tenant_id').notNullable();
    table.timestamps(true, true);

    // Indexes for performance
    table.index(['register_id'], 'idx_cd_reconciliations_register');
    table.index(['reconciliation_date'], 'idx_cd_reconciliations_date');
    table.index(['status'], 'idx_cd_reconciliations_status');
    table.index(['requires_investigation'], 'idx_cd_reconciliations_investigation');
    table.index(['next_reconciliation_due'], 'idx_cd_reconciliations_next');
    table.index(['organization_id'], 'idx_cd_reconciliations_org');
    table.index(['tenant_id'], 'idx_cd_reconciliations_tenant');

    // Foreign key constraints
    table.foreign('register_id').references('id').inTable('controlled_drug_register').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');

    // Ensure different witnesses
    table.check('performed_by != witnessed_by', 'chk_cd_reconciliations_different_witnesses');
  });

  // Create controlled_drug_alerts table
  await knex.schema.createTable('controlled_drug_alerts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('register_id');
    table.enum('alert_type', [
      'low_stock', 'expiry_warning', 'reconciliation_due', 'discrepancy_detected',
      'unauthorized_access', 'missing_witness', 'regulatory_notification'
    ]).notNullable();
    table.enum('severity', ['low', 'medium', 'high', 'critical']).notNullable();
    table.string('title', 255).notNullable();
    table.text('description').notNullable();
    table.json('metadata'); // Additional alert-specific data
    table.enum('status', ['active', 'acknowledged', 'resolved', 'dismissed']).notNullable().defaultTo('active');
    table.uuid('created_by');
    table.uuid('acknowledged_by');
    table.timestamp('acknowledged_at');
    table.uuid('resolved_by');
    table.timestamp('resolved_at');
    table.text('resolution_notes');
    table.uuid('organization_id').notNullable();
    table.uuid('tenant_id').notNullable();
    table.timestamps(true, true);

    // Indexes for performance
    table.index(['register_id'], 'idx_cd_alerts_register');
    table.index(['alert_type'], 'idx_cd_alerts_type');
    table.index(['severity'], 'idx_cd_alerts_severity');
    table.index(['status'], 'idx_cd_alerts_status');
    table.index(['created_at'], 'idx_cd_alerts_created');
    table.index(['organization_id'], 'idx_cd_alerts_org');
    table.index(['tenant_id'], 'idx_cd_alerts_tenant');

    // Foreign key constraints
    table.foreign('register_id').references('id').inTable('controlled_drug_register').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order to handle foreign key constraints
  await knex.schema.dropTableIfExists('controlled_drug_alerts');
  await knex.schema.dropTableIfExists('controlled_drug_reconciliations');
  await knex.schema.dropTableIfExists('controlled_drug_destructions');
  await knex.schema.dropTableIfExists('controlled_drug_transactions');
  await knex.schema.dropTableIfExists('controlled_drug_register');
}