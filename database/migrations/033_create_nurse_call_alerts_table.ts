/**
 * @fileoverview Nurse Call Alerts Table Migration
 * @module NurseCallAlertsMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Creates the nurse_call_alerts table with comprehensive
 * modern nurse call system capabilities.
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('nurse_call_alerts', (table) => {
    // Primary identification
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('call_reference', 50).unique().notNullable();
    
    // Resident relationship
    table.uuid('resident_id').notNullable();
    table.foreign('resident_id').references('id').inTable('residents').onDelete('CASCADE');
    
    // Call classification
    table.enum('call_type', [
      'assistance_request',
      'medical_emergency',
      'bathroom_assistance',
      'medication_request',
      'pain_management',
      'comfort_assistance',
      'mobility_assistance',
      'emotional_support',
      'technical_issue',
      'safety_concern',
      'fall_alert',
      'wandering_alert',
      'medication_overdue',
      'vital_signs_alert',
      'behavioral_concern'
    ]).notNullable();
    
    table.enum('priority', ['routine', 'standard', 'high', 'urgent', 'emergency']).notNullable();
    table.enum('status', ['active', 'acknowledged', 'responding', 'resolved', 'escalated', 'cancelled']).defaultTo('active');
    table.enum('source', [
      'call_button',
      'mobile_app', 
      'voice_command',
      'wearable_device',
      'sensor_automatic',
      'family_request',
      'staff_initiated',
      'ai_detection'
    ]).notNullable();
    
    // Location and device information
    table.string('location', 100).notNullable();
    table.text('description').nullable();
    table.string('device_id', 100).nullable();
    
    // Timing information
    table.timestamp('triggered_at').notNullable();
    table.string('triggered_by', 100).notNullable();
    table.bigInteger('response_time').nullable(); // milliseconds
    
    // Staff response tracking
    table.uuid('acknowledged_by').nullable();
    table.string('acknowledged_by_name', 100).nullable();
    table.timestamp('acknowledged_at').nullable();
    table.uuid('responding_staff').nullable();
    table.string('responding_staff_name', 100).nullable();
    table.timestamp('response_started').nullable();
    table.uuid('resolved_by').nullable();
    table.string('resolved_by_name', 100).nullable();
    table.timestamp('resolved_at').nullable();
    
    // Escalation management
    table.integer('escalation_level').defaultTo(1);
    table.jsonb('escalation_history').notNullable();
    table.jsonb('response_notes').notNullable();
    table.jsonb('call_metrics').notNullable();
    
    // External notifications
    table.boolean('family_notified').defaultTo(false);
    table.timestamp('family_notified_at').nullable();
    table.boolean('external_services_involved').defaultTo(false);
    table.specificType('external_services', 'text[]').nullable();
    
    // Quality and feedback
    table.integer('resident_satisfaction').nullable().checkBetween([1, 5]);
    table.text('resident_feedback').nullable();
    table.text('follow_up_required').nullable();
    table.timestamp('follow_up_date').nullable();
    
    // Multi-tenancy
    table.uuid('tenant_id').notNullable();
    table.uuid('organization_id').notNullable();
    
    // Audit fields
    table.timestamps(true, true);
    
    // Indexes for performance
    table.index(['resident_id', 'call_type']);
    table.index(['priority', 'status']);
    table.index(['triggered_at']);
    table.index(['tenant_id', 'organization_id']);
    table.index(['location']);
    table.index(['status', 'escalation_level']);
    table.index(['acknowledged_by']);
    table.index(['resolved_by']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('nurse_call_alerts');
}