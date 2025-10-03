/**
 * @fileoverview On-Call Rota Table Migration
 * @module OnCallRotaMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Creates the on_call_rota table with comprehensive
 * 24/7 staffing and emergency response management.
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('on_call_rota', (table) => {
    // Primary identification
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('rota_reference', 50).unique().notNullable();
    
    // Staff information
    table.uuid('staff_id').notNullable();
    table.string('staff_name', 100).notNullable();
    
    // Role and status
    table.enum('role', [
      'primary',
      'secondary', 
      'manager',
      'senior_nurse',
      'registered_nurse',
      'senior_carer',
      'maintenance',
      'security',
      'clinical_lead'
    ]).notNullable();
    
    table.enum('status', [
      'scheduled',
      'active',
      'responding',
      'unavailable',
      'completed',
      'cancelled'
    ]).defaultTo('scheduled');
    
    // Shift timing
    table.date('shift_date').notNullable();
    table.timestamp('shift_start').notNullable();
    table.timestamp('shift_end').notNullable();
    table.integer('shift_duration').notNullable(); // hours
    
    // Contact and capabilities (JSONB for flexibility)
    table.jsonb('contact_details').notNullable();
    table.jsonb('capabilities').notNullable();
    table.jsonb('shift_metrics').notNullable();
    table.jsonb('preferences').notNullable();
    
    // Availability tracking
    table.boolean('available').defaultTo(true);
    table.text('unavailable_reason').nullable();
    table.timestamp('last_contact_attempt').nullable();
    table.timestamp('last_response_time').nullable();
    
    // Workload management
    table.integer('current_call_load').defaultTo(0);
    table.integer('max_concurrent_calls').defaultTo(5);
    table.string('current_location', 100).nullable();
    table.boolean('on_site').defaultTo(false);
    table.integer('estimated_response_time').nullable(); // minutes
    table.specificType('current_assignments', 'text[]').nullable(); // Active call IDs
    
    // Emergency contacts
    table.jsonb('emergency_contacts').nullable();
    table.text('special_instructions').nullable();
    
    // Training and compliance
    table.boolean('training_required').defaultTo(false);
    table.specificType('required_training', 'text[]').nullable();
    table.timestamp('last_training_update').nullable();
    table.jsonb('performance_metrics').nullable();
    
    // Multi-tenancy
    table.uuid('tenant_id').notNullable();
    table.uuid('organization_id').notNullable();
    
    // Scheduling audit
    table.uuid('scheduled_by').notNullable();
    table.string('scheduled_by_name', 100).notNullable();
    
    // Audit fields
    table.timestamps(true, true);
    
    // Indexes for performance
    table.index(['staff_id', 'shift_date']);
    table.index(['status', 'shift_start']);
    table.index(['role', 'status']);
    table.index(['tenant_id', 'organization_id']);
    table.index(['shift_start', 'shift_end']);
    table.index(['available', 'current_call_load']);
    table.index(['role', 'available']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('on_call_rota');
}