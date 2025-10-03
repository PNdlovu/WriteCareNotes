/**
 * @fileoverview Safeguarding Alerts Table Migration
 * @module SafeguardingAlertsMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Creates the safeguarding_alerts table with comprehensive
 * enterprise-grade safeguarding management capabilities.
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('safeguarding_alerts', (table) => {
    // Primary identification
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('alert_reference', 50).unique().notNullable();
    
    // Resident relationship
    table.uuid('resident_id').notNullable();
    table.foreign('resident_id').references('id').inTable('residents').onDelete('CASCADE');
    
    // Alert classification
    table.enum('alert_type', [
      'physical_abuse',
      'emotional_abuse', 
      'sexual_abuse',
      'financial_abuse',
      'neglect',
      'discrimination',
      'institutional_abuse',
      'domestic_violence',
      'modern_slavery',
      'self_neglect',
      'cyberbullying',
      'mate_crime'
    ]).notNullable();
    
    table.enum('severity', ['low', 'medium', 'high', 'critical', 'emergency']).notNullable();
    table.enum('status', [
      'reported',
      'acknowledged', 
      'investigating',
      'action_taken',
      'resolved',
      'unfounded',
      'referred_external',
      'monitoring'
    ]).defaultTo('reported');
    
    table.enum('source', [
      'staff_observation',
      'resident_disclosure',
      'family_concern',
      'visitor_report',
      'healthcare_professional',
      'external_agency',
      'automated_detection',
      'whistleblower',
      'anonymous_report'
    ]).notNullable();
    
    // Incident details (encrypted)
    table.text('description').notNullable(); // Encrypted
    table.text('circumstances').nullable(); // Encrypted
    table.timestamp('incident_date_time').notNullable();
    table.string('incident_location', 200).nullable();
    
    // Reporting details
    table.uuid('reported_by').notNullable();
    table.string('reported_by_name', 100).notNullable();
    table.string('reported_by_role', 50).notNullable();
    table.timestamp('reported_at').notNullable();
    
    // Investigation details
    table.uuid('investigated_by').nullable();
    table.string('investigated_by_name', 100).nullable();
    table.text('investigation_notes').nullable(); // Encrypted
    table.timestamp('investigation_started').nullable();
    table.timestamp('investigation_completed').nullable();
    
    // Witnesses
    table.specificType('witness_ids', 'text[]').nullable();
    table.specificType('witness_names', 'text[]').nullable();
    
    // Evidence and reporting (JSONB for complex data)
    table.jsonb('evidence').defaultTo('[]');
    table.jsonb('external_reporting').notNullable();
    table.jsonb('risk_assessment').notNullable();
    table.jsonb('action_plan').notNullable();
    table.jsonb('ai_analysis').notNullable();
    
    // Service involvement flags
    table.boolean('police_involved').defaultTo(false);
    table.boolean('emergency_services').defaultTo(false);
    table.boolean('medical_attention').defaultTo(false);
    table.boolean('family_notified').defaultTo(false);
    table.timestamp('family_notified_at').nullable();
    table.boolean('advocate_involved').defaultTo(false);
    table.string('advocate_name', 100).nullable();
    table.boolean('mental_capacity_assessment').defaultTo(false);
    
    // Outcome
    table.text('outcome_description').nullable(); // Encrypted
    table.specificType('lessons_learned', 'text[]').nullable();
    table.specificType('preventive_measures', 'text[]').nullable();
    table.timestamp('review_date').nullable();
    
    // Multi-tenancy
    table.uuid('tenant_id').notNullable();
    table.uuid('organization_id').notNullable();
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes for performance
    table.index(['resident_id', 'alert_type']);
    table.index(['severity', 'status']);
    table.index(['reported_at']);
    table.index(['tenant_id', 'organization_id']);
    table.index(['status', 'investigation_started']);
    table.index(['alert_type', 'severity']);
  });

  // Create audit trigger for safeguarding alerts
  await knex.raw(`
    CREATE OR REPLACE FUNCTION audit_safeguarding_alerts()
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
        'safeguarding_alerts',
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
    CREATE TRIGGER safeguarding_alerts_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON safeguarding_alerts
    FOR EACH ROW EXECUTE FUNCTION audit_safeguarding_alerts();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS safeguarding_alerts_audit_trigger ON safeguarding_alerts;');
  await knex.raw('DROP FUNCTION IF EXISTS audit_safeguarding_alerts();');
  await knex.schema.dropTableIfExists('safeguarding_alerts');
}