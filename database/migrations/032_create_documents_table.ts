/**
 * @fileoverview Documents Table Migration
 * @module DocumentsMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Creates the documents table with comprehensive
 * enterprise document management capabilities including AI analysis,
 * version control, and compliance validation.
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('documents', (table) => {
    // Primary identification
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('document_id', 100).unique().notNullable();
    
    // Document classification
    table.enum('document_type', [
      'care_plan',
      'medical_record',
      'policy',
      'procedure',
      'training_material',
      'regulatory_document',
      'contract',
      'incident_report',
      'risk_assessment',
      'audit_report',
      'quality_report',
      'safeguarding_report',
      'consent_form',
      'family_communication',
      'staff_record',
      'financial_document',
      'compliance_certificate',
      'inspection_report',
      'meeting_minutes',
      'correspondence'
    ]).notNullable();
    
    table.enum('status', [
      'draft',
      'under_review',
      'approved',
      'published',
      'archived',
      'expired'
    ]).defaultTo('draft');
    
    // Document metadata (JSONB for flexibility)
    table.jsonb('metadata').notNullable();
    
    // Version control (JSONB)
    table.jsonb('version_control').notNullable();
    
    // AI analysis results (JSONB)
    table.jsonb('ai_analysis').notNullable();
    
    // Content and file information
    table.text('content').notNullable();
    table.string('file_url', 500).notNullable();
    table.string('file_hash', 128).notNullable();
    table.integer('file_size').notNullable(); // bytes
    table.string('mime_type', 100).notNullable();
    
    // Access control and security
    table.enum('confidentiality_level', ['public', 'internal', 'confidential', 'restricted']).defaultTo('internal');
    table.jsonb('access_controls').notNullable();
    table.boolean('encrypted').defaultTo(false);
    table.string('encryption_key_id', 100).nullable();
    
    // Lifecycle management
    table.timestamp('expiry_date').nullable();
    table.integer('retention_period').notNullable(); // years
    table.timestamp('next_review_date').nullable();
    table.boolean('legal_requirement').defaultTo(false);
    
    // Workflow and approval
    table.jsonb('approval_workflow').nullable();
    table.boolean('requires_approval').defaultTo(false);
    table.uuid('approved_by').nullable();
    table.string('approved_by_name', 100).nullable();
    table.timestamp('approved_at').nullable();
    table.text('approval_comments').nullable();
    
    // Compliance and regulatory
    table.jsonb('compliance_tags').notNullable();
    table.jsonb('regulatory_requirements').notNullable();
    table.boolean('cqc_relevant').defaultTo(false);
    table.boolean('gdpr_relevant').defaultTo(true);
    
    // Analytics and usage
    table.integer('view_count').defaultTo(0);
    table.integer('download_count').defaultTo(0);
    table.timestamp('last_accessed').nullable();
    table.uuid('last_accessed_by').nullable();
    
    // Multi-tenancy
    table.uuid('tenant_id').notNullable();
    table.uuid('organization_id').notNullable();
    
    // Audit fields
    table.uuid('created_by').notNullable();
    table.string('created_by_name', 100).notNullable();
    table.uuid('updated_by').nullable();
    table.string('updated_by_name', 100).nullable();
    table.timestamps(true, true);
    
    // Indexes for performance
    table.index(['document_type', 'status']);
    table.index(['tenant_id', 'organization_id']);
    table.index(['confidentiality_level']);
    table.index(['expiry_date']);
    table.index(['next_review_date']);
    table.index(['created_at']);
    table.index(['file_hash']);
    
    // Full-text search index
    table.index(['content'], 'documents_content_fulltext', 'GIN');
  });

  // Create document_versions table for version history
  await knex.schema.createTable('document_versions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('document_id').notNullable();
    table.foreign('document_id').references('id').inTable('documents').onDelete('CASCADE');
    
    table.string('version_number', 20).notNullable();
    table.uuid('previous_version_id').nullable();
    table.foreign('previous_version_id').references('id').inTable('document_versions');
    
    table.text('change_description').notNullable();
    table.boolean('major_change').defaultTo(false);
    table.text('content_snapshot').notNullable();
    table.jsonb('metadata_snapshot').notNullable();
    
    table.uuid('changed_by').notNullable();
    table.string('changed_by_name', 100).notNullable();
    table.timestamp('change_date').defaultTo(knex.fn.now());
    
    table.uuid('approved_by').nullable();
    table.string('approved_by_name', 100).nullable();
    table.timestamp('approval_date').nullable();
    
    table.uuid('tenant_id').notNullable();
    table.timestamps(true, true);
    
    table.index(['document_id', 'version_number']);
    table.index(['change_date']);
    table.unique(['document_id', 'version_number']);
  });

  // Create document_access_log table for audit trail
  await knex.schema.createTable('document_access_log', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('document_id').notNullable();
    table.foreign('document_id').references('id').inTable('documents').onDelete('CASCADE');
    
    table.uuid('accessed_by').notNullable();
    table.string('accessed_by_name', 100).notNullable();
    table.string('access_type', 50).notNullable(); // view, download, edit, approve, etc.
    table.string('ip_address', 45).nullable();
    table.string('user_agent', 500).nullable();
    table.timestamp('accessed_at').defaultTo(knex.fn.now());
    
    table.uuid('tenant_id').notNullable();
    table.uuid('organization_id').notNullable();
    
    table.index(['document_id', 'accessed_at']);
    table.index(['accessed_by']);
    table.index(['access_type']);
    table.index(['tenant_id', 'organization_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('document_access_log');
  await knex.schema.dropTableIfExists('document_versions');
  await knex.schema.dropTableIfExists('documents');
}