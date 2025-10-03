/**
 * @fileoverview Database migration for medication scheduling and alert system tables
 * @module MedicationSchedulingMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Creates comprehensive medication scheduling and alert system tables
 * for intelligent scheduling with optimization algorithms, real-time alerts,
 * PRN medication management, and mobile-friendly notifications across all
 * British Isles jurisdictions.
 * 
 * @compliance
 * - England: CQC Medication Management Standards, NICE Guidelines
 * - Scotland: Care Inspectorate Medication Guidelines, NHS Scotland Standards
 * - Wales: CIW Medication Administration Requirements, NHS Wales Standards
 * - Northern Ireland: RQIA Medication Management Standards, HSC Standards
 * - Republic of Ireland: HIQA Medication Safety Guidelines, HSE Standards
 * - Isle of Man: DHSC Medication Administration Protocols
 * - Guernsey: Committee for Health & Social Care Standards
 * - Jersey: Care Commission Medication Requirements
 * - RCN Medication Administration Standards
 * - NMC Standards for Medicines Management
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create medication_schedules table
  await knex.schema.createTable('medication_schedules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('prescription_id').notNullable();
    table.uuid('resident_id').notNullable();
    table.uuid('medication_id').notNullable();
    table.string('medication_name', 255).notNullable();
    
    // Dosage information
    table.decimal('dosage_amount', 10, 3).notNullable();
    table.string('dosage_unit', 50).notNullable();
    table.string('route', 100).notNullable();
    
    // Schedule configuration
    table.json('frequency').notNullable(); // ScheduleFrequency object
    table.json('scheduled_times').notNullable(); // Array of Date strings
    table.timestamp('next_due_time').notNullable();
    table.timestamp('last_administered_time');
    table.enum('schedule_type', ['regular', 'prn', 'stat', 'variable']).notNullable();
    
    // PRN specific fields
    table.string('prn_indication', 500);
    table.integer('prn_max_doses');
    table.integer('prn_min_interval'); // minutes
    table.integer('prn_max_daily');
    table.integer('prn_current_daily').defaultTo(0);
    
    // Optimization preferences
    table.json('optimization_preferences').notNullable();
    
    // Alert settings
    table.json('alert_settings').notNullable();
    
    // Status and metadata
    table.enum('status', ['active', 'paused', 'completed', 'discontinued']).notNullable().defaultTo('active');
    table.enum('priority', ['low', 'normal', 'high', 'critical']).notNullable().defaultTo('normal');
    table.text('special_instructions');
    table.uuid('organization_id').notNullable();
    table.uuid('tenant_id').notNullable();
    table.timestamps(true, true);

    // Indexes for performance
    table.index(['prescription_id'], 'idx_med_schedules_prescription');
    table.index(['resident_id'], 'idx_med_schedules_resident');
    table.index(['medication_id'], 'idx_med_schedules_medication');
    table.index(['schedule_type'], 'idx_med_schedules_type');
    table.index(['status'], 'idx_med_schedules_status');
    table.index(['priority'], 'idx_med_schedules_priority');
    table.index(['next_due_time'], 'idx_med_schedules_next_due');
    table.index(['organization_id'], 'idx_med_schedules_org');
    table.index(['tenant_id'], 'idx_med_schedules_tenant');

    // Foreign key constraints
    table.foreign('prescription_id').references('id').inTable('prescriptions').onDelete('CASCADE');
    table.foreign('resident_id').references('id').inTable('residents').onDelete('CASCADE');
    table.foreign('medication_id').references('id').inTable('medications').onDelete('RESTRICT');
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
  });

  // Create medication_alerts table
  await knex.schema.createTable('medication_alerts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('schedule_id').notNullable();
    table.uuid('resident_id').notNullable();
    table.string('medication_name', 255).notNullable();
    
    // Alert details
    table.enum('alert_type', [
      'due', 'overdue', 'pre_alert', 'missed', 'prn_available', 
      'prn_limit_reached', 'interaction_warning', 'schedule_conflict'
    ]).notNullable();
    table.enum('severity', ['info', 'warning', 'urgent', 'critical']).notNullable();
    table.string('title', 255).notNullable();
    table.text('message').notNullable();
    table.timestamp('scheduled_time').notNullable();
    table.timestamp('current_time').notNullable();
    table.integer('minutes_overdue');
    
    // Alert delivery configuration
    table.json('delivery_methods').notNullable(); // Array of delivery methods
    table.json('recipients').notNullable(); // Array of recipient IDs
    table.json('delivery_status').notNullable(); // Object with delivery status per method
    
    // Alert management
    table.enum('status', ['active', 'acknowledged', 'resolved', 'dismissed', 'escalated']).notNullable().defaultTo('active');
    table.uuid('acknowledged_by');
    table.timestamp('acknowledged_at');
    table.uuid('resolved_by');
    table.timestamp('resolved_at');
    table.json('escalated_to'); // Array of escalation recipient IDs
    table.timestamp('escalated_at');
    
    // Metadata
    table.uuid('organization_id').notNullable();
    table.uuid('tenant_id').notNullable();
    table.timestamps(true, true);

    // Indexes for performance
    table.index(['schedule_id'], 'idx_med_alerts_schedule');
    table.index(['resident_id'], 'idx_med_alerts_resident');
    table.index(['alert_type'], 'idx_med_alerts_type');
    table.index(['severity'], 'idx_med_alerts_severity');
    table.index(['status'], 'idx_med_alerts_status');
    table.index(['scheduled_time'], 'idx_med_alerts_scheduled');
    table.index(['current_time'], 'idx_med_alerts_current');
    table.index(['organization_id'], 'idx_med_alerts_org');
    table.index(['tenant_id'], 'idx_med_alerts_tenant');
    table.index(['created_at'], 'idx_med_alerts_created');

    // Foreign key constraints
    table.foreign('schedule_id').references('id').inTable('medication_schedules').onDelete('CASCADE');
    table.foreign('resident_id').references('id').inTable('residents').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
  });

  // Create schedule_optimizations table
  await knex.schema.createTable('schedule_optimizations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('resident_id').notNullable();
    table.timestamp('optimization_date').notNullable();
    
    // Optimization data
    table.json('current_schedules').notNullable(); // Array of current schedule objects
    table.json('optimized_schedules').notNullable(); // Array of optimized schedule objects
    table.json('optimization_rules').notNullable(); // Array of optimization rule objects
    table.json('conflicts').notNullable(); // Array of conflict objects
    table.json('recommendations').notNullable(); // Array of recommendation objects
    table.integer('estimated_time_reduction').notNullable(); // minutes per day
    table.json('administration_windows').notNullable(); // Array of time window objects
    
    // Optimization status
    table.enum('status', ['pending', 'approved', 'implemented', 'rejected']).notNullable().defaultTo('pending');
    table.uuid('optimized_by').notNullable();
    table.uuid('approved_by');
    table.timestamp('approved_at');
    table.uuid('implemented_by');
    table.timestamp('implemented_at');
    table.text('rejection_reason');
    
    // Metadata
    table.uuid('organization_id').notNullable();
    table.uuid('tenant_id').notNullable();
    table.timestamps(true, true);

    // Indexes for performance
    table.index(['resident_id'], 'idx_schedule_opt_resident');
    table.index(['optimization_date'], 'idx_schedule_opt_date');
    table.index(['status'], 'idx_schedule_opt_status');
    table.index(['optimized_by'], 'idx_schedule_opt_optimized_by');
    table.index(['organization_id'], 'idx_schedule_opt_org');
    table.index(['tenant_id'], 'idx_schedule_opt_tenant');

    // Foreign key constraints
    table.foreign('resident_id').references('id').inTable('residents').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
  });

  // Create prn_requests table
  await knex.schema.createTable('prn_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('schedule_id').notNullable();
    table.uuid('resident_id').notNullable();
    table.string('medication_name', 255).notNullable();
    
    // Request details
    table.string('indication', 500).notNullable();
    table.uuid('requested_by').notNullable();
    table.timestamp('requested_at').notNullable();
    table.text('clinical_justification').notNullable();
    table.json('vital_signs'); // Object with vital signs data
    
    // Request evaluation
    table.boolean('approved').notNullable();
    table.text('approval_reason').notNullable();
    table.timestamp('next_available_time');
    table.json('administration_window'); // Object with start and end times
    table.json('clinical_guidance'); // Array of guidance strings
    
    // Request processing
    table.uuid('evaluated_by').notNullable();
    table.timestamp('evaluated_at').notNullable();
    table.uuid('administered_by');
    table.timestamp('administered_at');
    table.enum('status', ['pending', 'approved', 'denied', 'administered', 'expired']).notNullable().defaultTo('pending');
    
    // Metadata
    table.uuid('organization_id').notNullable();
    table.uuid('tenant_id').notNullable();
    table.timestamps(true, true);

    // Indexes for performance
    table.index(['schedule_id'], 'idx_prn_requests_schedule');
    table.index(['resident_id'], 'idx_prn_requests_resident');
    table.index(['requested_by'], 'idx_prn_requests_requested_by');
    table.index(['requested_at'], 'idx_prn_requests_requested_at');
    table.index(['approved'], 'idx_prn_requests_approved');
    table.index(['status'], 'idx_prn_requests_status');
    table.index(['organization_id'], 'idx_prn_requests_org');
    table.index(['tenant_id'], 'idx_prn_requests_tenant');

    // Foreign key constraints
    table.foreign('schedule_id').references('id').inTable('medication_schedules').onDelete('CASCADE');
    table.foreign('resident_id').references('id').inTable('residents').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
  });

  // Create alert_notifications table
  await knex.schema.createTable('alert_notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('alert_id').notNullable();
    table.uuid('recipient_id').notNullable();
    table.string('recipient_name', 255).notNullable();
    table.string('recipient_role', 100).notNullable();
    
    // Notification details
    table.enum('delivery_method', ['push', 'email', 'sms', 'dashboard']).notNullable();
    table.string('delivery_address', 255); // email address, phone number, device token
    table.enum('status', ['pending', 'sent', 'delivered', 'failed', 'read']).notNullable().defaultTo('pending');
    table.timestamp('sent_at');
    table.timestamp('delivered_at');
    table.timestamp('read_at');
    table.text('failure_reason');
    table.integer('retry_count').defaultTo(0);
    table.timestamp('next_retry_at');
    
    // Notification content
    table.string('title', 255).notNullable();
    table.text('message').notNullable();
    table.json('metadata'); // Additional notification data
    
    // Metadata
    table.uuid('organization_id').notNullable();
    table.uuid('tenant_id').notNullable();
    table.timestamps(true, true);

    // Indexes for performance
    table.index(['alert_id'], 'idx_alert_notifications_alert');
    table.index(['recipient_id'], 'idx_alert_notifications_recipient');
    table.index(['delivery_method'], 'idx_alert_notifications_method');
    table.index(['status'], 'idx_alert_notifications_status');
    table.index(['sent_at'], 'idx_alert_notifications_sent');
    table.index(['next_retry_at'], 'idx_alert_notifications_retry');
    table.index(['organization_id'], 'idx_alert_notifications_org');
    table.index(['tenant_id'], 'idx_alert_notifications_tenant');

    // Foreign key constraints
    table.foreign('alert_id').references('id').inTable('medication_alerts').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
  });

  // Create schedule_conflicts table
  await knex.schema.createTable('schedule_conflicts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('resident_id').notNullable();
    table.json('affected_schedules').notNullable(); // Array of schedule IDs
    
    // Conflict details
    table.enum('conflict_type', [
      'time_overlap', 'interaction_risk', 'route_conflict', 
      'staff_unavailable', 'meal_timing'
    ]).notNullable();
    table.enum('severity', ['minor', 'moderate', 'major', 'critical']).notNullable();
    table.text('description').notNullable();
    table.text('suggested_resolution').notNullable();
    table.boolean('auto_resolvable').notNullable().defaultTo(false);
    
    // Conflict resolution
    table.enum('status', ['detected', 'acknowledged', 'resolved', 'ignored']).notNullable().defaultTo('detected');
    table.uuid('detected_by');
    table.timestamp('detected_at').notNullable();
    table.uuid('acknowledged_by');
    table.timestamp('acknowledged_at');
    table.uuid('resolved_by');
    table.timestamp('resolved_at');
    table.text('resolution_notes');
    
    // Metadata
    table.uuid('organization_id').notNullable();
    table.uuid('tenant_id').notNullable();
    table.timestamps(true, true);

    // Indexes for performance
    table.index(['resident_id'], 'idx_schedule_conflicts_resident');
    table.index(['conflict_type'], 'idx_schedule_conflicts_type');
    table.index(['severity'], 'idx_schedule_conflicts_severity');
    table.index(['status'], 'idx_schedule_conflicts_status');
    table.index(['detected_at'], 'idx_schedule_conflicts_detected');
    table.index(['auto_resolvable'], 'idx_schedule_conflicts_auto');
    table.index(['organization_id'], 'idx_schedule_conflicts_org');
    table.index(['tenant_id'], 'idx_schedule_conflicts_tenant');

    // Foreign key constraints
    table.foreign('resident_id').references('id').inTable('residents').onDelete('CASCADE');
    table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order to handle foreign key constraints
  await knex.schema.dropTableIfExists('schedule_conflicts');
  await knex.schema.dropTableIfExists('alert_notifications');
  await knex.schema.dropTableIfExists('prn_requests');
  await knex.schema.dropTableIfExists('schedule_optimizations');
  await knex.schema.dropTableIfExists('medication_alerts');
  await knex.schema.dropTableIfExists('medication_schedules');
}