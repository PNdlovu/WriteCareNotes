/**
 * @fileoverview Policy Intelligence Database Migration
 * @module PolicyIntelligenceMigration
 * @version 1.0.0
 * @since 2025-10-07
 * 
 * @description
 * Creates database schema for Policy Intelligence features:
 * - Policy gaps tracking
 * - Risk assessments and alerts
 * - Analytics and effectiveness metrics
 * - Violation patterns
 * - ROI tracking
 * 
 * @compliance
 * - GDPR Article 32 - Data security
 * - ISO 27001 - Information management
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ============================================================================
  // POLICY GAPS TABLE
  // ============================================================================
  
  await knex.schema.createTable('policy_gaps', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organizationId').notNullable();
    table.string('policyName', 255).notNullable();
    table.string('category', 100).notNullable();
    table.enu('priority', ['critical', 'high', 'medium', 'low']).notNullable();
    table.string('jurisdiction', 50).notNullable();
    table.string('serviceType', 50).notNullable();
    table.text('regulatoryRequirement').notNullable();
    table.string('regulator', 100).notNullable();
    table.text('description').notNullable();
    table.specificType('consequences', 'text[]').notNullable();
    table.string('recommendedTemplate', 255).nullable();
    table.decimal('benchmarkCoverage', 5, 2).notNullable(); // Percentage: 0-100
    table.boolean('isAddressed').defaultTo(false);
    table.uuid('addressedByPolicyId').nullable();
    table.timestamp('addressedAt').nullable();
    table.string('addressedBy', 255).nullable(); // User ID
    table.timestamps(true, true);
    
    table.index(['organizationId']);
    table.index(['jurisdiction']);
    table.index(['serviceType']);
    table.index(['priority']);
    table.index(['category']);
    table.index(['isAddressed']);
  });

  // ============================================================================
  // POLICY RISKS TABLE
  // ============================================================================
  
  await knex.schema.createTable('policy_risks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('policyId').notNullable();
    table.uuid('organizationId').notNullable();
    table.string('policyName', 255).notNullable();
    table.string('category', 100).notNullable();
    table.decimal('overallRisk', 5, 2).notNullable(); // 0-100
    table.enu('riskLevel', ['critical', 'high', 'medium', 'low', 'minimal']).notNullable();
    table.decimal('ageScore', 5, 2).notNullable(); // 0-100
    table.decimal('acknowledgmentScore', 5, 2).notNullable(); // 0-100
    table.decimal('violationScore', 5, 2).notNullable(); // 0-100
    table.decimal('updateFrequencyScore', 5, 2).notNullable(); // 0-100
    table.enu('trend', ['increasing', 'decreasing', 'stable']).notNullable();
    table.timestamp('lastReviewDate').notNullable();
    table.timestamp('nextReviewDate').notNullable();
    table.decimal('acknowledgmentRate', 5, 2).notNullable(); // 0-100
    table.integer('violationCount').defaultTo(0);
    table.specificType('recommendedActions', 'text[]').nullable();
    table.timestamps(true, true);
    
    table.index(['policyId']);
    table.index(['organizationId']);
    table.index(['riskLevel']);
    table.index(['category']);
    table.index(['overallRisk']);
    table.foreign('policyId').references('id').inTable('policies').onDelete('CASCADE');
  });

  // ============================================================================
  // RISK ALERTS TABLE
  // ============================================================================
  
  await knex.schema.createTable('risk_alerts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('policyId').notNullable();
    table.uuid('organizationId').notNullable();
    table.string('policyName', 255).notNullable();
    table.enu('severity', ['critical', 'high', 'medium', 'low', 'minimal']).notNullable();
    table.text('message').notNullable();
    table.boolean('acknowledged').defaultTo(false);
    table.timestamp('acknowledgedAt').nullable();
    table.string('acknowledgedBy', 255).nullable(); // User ID
    table.text('acknowledgmentNotes').nullable();
    table.timestamps(true, true);
    
    table.index(['policyId']);
    table.index(['organizationId']);
    table.index(['severity']);
    table.index(['acknowledged']);
    table.index(['createdAt']);
    table.foreign('policyId').references('id').inTable('policies').onDelete('CASCADE');
  });

  // ============================================================================
  // RISK TRENDS TABLE
  // ============================================================================
  
  await knex.schema.createTable('risk_trends', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organizationId').notNullable();
    table.date('date').notNullable();
    table.decimal('averageRisk', 5, 2).notNullable(); // 0-100
    table.integer('criticalPolicies').defaultTo(0);
    table.integer('highRiskPolicies').defaultTo(0);
    table.integer('mediumRiskPolicies').defaultTo(0);
    table.integer('lowRiskPolicies').defaultTo(0);
    table.integer('minimalRiskPolicies').defaultTo(0);
    table.timestamps(true, true);
    
    table.index(['organizationId']);
    table.index(['date']);
    table.unique(['organizationId', 'date']);
  });

  // ============================================================================
  // POLICY EFFECTIVENESS TABLE
  // ============================================================================
  
  await knex.schema.createTable('policy_effectiveness', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('policyId').notNullable();
    table.uuid('organizationId').notNullable();
    table.string('policyName', 255).notNullable();
    table.string('category', 100).notNullable();
    table.decimal('effectivenessScore', 5, 2).notNullable(); // 0-100
    table.decimal('acknowledgmentRate', 5, 2).notNullable(); // 0-100
    table.decimal('avgTimeToAcknowledge', 10, 2).notNullable(); // hours
    table.decimal('violationRate', 10, 4).notNullable(); // violations per 1000 acknowledgments
    table.decimal('complianceImprovement', 5, 2).notNullable(); // percentage change
    table.decimal('forecastedAcknowledgment', 5, 2).nullable(); // 7-day prediction
    table.date('periodStart').notNullable();
    table.date('periodEnd').notNullable();
    table.timestamps(true, true);
    
    table.index(['policyId']);
    table.index(['organizationId']);
    table.index(['category']);
    table.index(['periodStart', 'periodEnd']);
    table.foreign('policyId').references('id').inTable('policies').onDelete('CASCADE');
  });

  // ============================================================================
  // POLICY VIOLATIONS TABLE
  // ============================================================================
  
  await knex.schema.createTable('policy_violations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('policyId').notNullable();
    table.uuid('organizationId').notNullable();
    table.string('policyName', 255).notNullable();
    table.string('category', 100).notNullable();
    table.text('description').notNullable();
    table.string('cause', 255).nullable();
    table.enu('severity', ['critical', 'high', 'medium', 'low']).notNullable();
    table.string('reportedBy', 255).notNullable(); // User ID
    table.timestamp('occurredAt').notNullable();
    table.boolean('resolved').defaultTo(false);
    table.timestamp('resolvedAt').nullable();
    table.string('resolvedBy', 255).nullable(); // User ID
    table.text('resolution').nullable();
    table.timestamps(true, true);
    
    table.index(['policyId']);
    table.index(['organizationId']);
    table.index(['category']);
    table.index(['severity']);
    table.index(['resolved']);
    table.index(['occurredAt']);
    table.foreign('policyId').references('id').inTable('policies').onDelete('CASCADE');
  });

  // ============================================================================
  // VIOLATION PATTERNS TABLE
  // ============================================================================
  
  await knex.schema.createTable('violation_patterns', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organizationId').notNullable();
    table.string('category', 100).notNullable();
    table.integer('violationCount').notNullable();
    table.enu('trend', ['increasing', 'decreasing', 'stable']).notNullable();
    table.jsonb('commonCauses').notNullable(); // Array of { cause, frequency, percentage }
    table.jsonb('topPolicies').notNullable(); // Array of { policyId, policyName, violationCount }
    table.specificType('recommendations', 'text[]').notNullable();
    table.date('periodStart').notNullable();
    table.date('periodEnd').notNullable();
    table.timestamps(true, true);
    
    table.index(['organizationId']);
    table.index(['category']);
    table.index(['periodStart', 'periodEnd']);
  });

  // ============================================================================
  // ROI METRICS TABLE
  // ============================================================================
  
  await knex.schema.createTable('roi_metrics', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organizationId').notNullable();
    table.decimal('timeSavedHours', 10, 2).notNullable();
    table.decimal('timeSavedValue', 10, 2).notNullable(); // Monetary value
    table.integer('violationsPrevented').notNullable();
    table.decimal('potentialFines', 10, 2).notNullable();
    table.decimal('totalCostAvoidance', 10, 2).notNullable();
    table.decimal('regulatoryFines', 10, 2).notNullable();
    table.decimal('staffTime', 10, 2).notNullable();
    table.decimal('rework', 10, 2).notNullable();
    table.decimal('automation', 10, 2).notNullable();
    table.decimal('complianceImprovement', 5, 2).notNullable(); // percentage
    table.decimal('staffProductivityGain', 5, 2).notNullable(); // percentage
    table.date('periodStart').notNullable();
    table.date('periodEnd').notNullable();
    table.timestamps(true, true);
    
    table.index(['organizationId']);
    table.index(['periodStart', 'periodEnd']);
    table.unique(['organizationId', 'periodStart', 'periodEnd']);
  });

  // ============================================================================
  // ACKNOWLEDGMENT FORECAST TABLE
  // ============================================================================
  
  await knex.schema.createTable('acknowledgment_forecasts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organizationId').notNullable();
    table.uuid('policyId').nullable(); // Null for organization-wide forecast
    table.date('forecastDate').notNullable();
    table.decimal('predictedRate', 5, 2).notNullable(); // 0-100
    table.decimal('confidence', 5, 2).notNullable(); // 0-100
    table.string('modelVersion', 50).notNullable();
    table.jsonb('modelMetadata').nullable(); // ML model details
    table.timestamps(true, true);
    
    table.index(['organizationId']);
    table.index(['policyId']);
    table.index(['forecastDate']);
    table.foreign('policyId').references('id').inTable('policies').onDelete('CASCADE');
  });

  // ============================================================================
  // REPORT SCHEDULES TABLE
  // ============================================================================
  
  await knex.schema.createTable('report_schedules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organizationId').notNullable();
    table.enu('reportType', ['gap_analysis', 'risk', 'analytics']).notNullable();
    table.enu('frequency', ['daily', 'weekly', 'monthly']).notNullable();
    table.enu('format', ['pdf', 'excel', 'csv']).notNullable();
    table.specificType('recipients', 'text[]').notNullable();
    table.string('period', 20).defaultTo('30days');
    table.boolean('active').defaultTo(true);
    table.timestamp('lastRun').nullable();
    table.timestamp('nextRun').notNullable();
    table.string('createdBy', 255).notNullable(); // User ID
    table.timestamps(true, true);
    
    table.index(['organizationId']);
    table.index(['reportType']);
    table.index(['active']);
    table.index(['nextRun']);
  });

  // ============================================================================
  // CATEGORY PERFORMANCE TABLE
  // ============================================================================
  
  await knex.schema.createTable('category_performance', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organizationId').notNullable();
    table.string('category', 100).notNullable();
    table.decimal('effectiveness', 5, 2).notNullable(); // 0-100
    table.decimal('acknowledgmentRate', 5, 2).notNullable(); // 0-100
    table.integer('violationCount').defaultTo(0);
    table.decimal('improvement', 5, 2).notNullable(); // percentage change
    table.date('periodStart').notNullable();
    table.date('periodEnd').notNullable();
    table.timestamps(true, true);
    
    table.index(['organizationId']);
    table.index(['category']);
    table.index(['periodStart', 'periodEnd']);
    table.unique(['organizationId', 'category', 'periodStart', 'periodEnd']);
  });

  // ============================================================================
  // GAP REMEDIATION HISTORY TABLE
  // ============================================================================
  
  await knex.schema.createTable('gap_remediation_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('gapId').notNullable();
    table.uuid('organizationId').notNullable();
    table.string('gapName', 255).notNullable();
    table.uuid('policyId').notNullable();
    table.string('policyName', 255).notNullable();
    table.string('addressedBy', 255).notNullable(); // User ID
    table.timestamp('addressedDate').notNullable();
    table.text('notes').nullable();
    table.timestamps(true, true);
    
    table.index(['organizationId']);
    table.index(['gapId']);
    table.index(['policyId']);
    table.index(['addressedDate']);
    table.foreign('gapId').references('id').inTable('policy_gaps').onDelete('CASCADE');
    table.foreign('policyId').references('id').inTable('policies').onDelete('CASCADE');
  });

  // ============================================================================
  // RISK THRESHOLD CONFIG TABLE
  // ============================================================================
  
  await knex.schema.createTable('risk_threshold_config', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organizationId').notNullable().unique();
    table.integer('criticalThreshold').defaultTo(80); // >= 80 = Critical
    table.integer('highThreshold').defaultTo(60); // >= 60 = High
    table.integer('mediumThreshold').defaultTo(40); // >= 40 = Medium
    table.integer('lowThreshold').defaultTo(20); // >= 20 = Low
    table.integer('alertThreshold').defaultTo(70); // Trigger alerts at this score
    table.boolean('autoAlerts').defaultTo(true);
    table.string('updatedBy', 255).notNullable(); // User ID
    table.timestamps(true, true);
    
    table.index(['organizationId']);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order to handle foreign keys
  await knex.schema.dropTableIfExists('risk_threshold_config');
  await knex.schema.dropTableIfExists('gap_remediation_history');
  await knex.schema.dropTableIfExists('category_performance');
  await knex.schema.dropTableIfExists('report_schedules');
  await knex.schema.dropTableIfExists('acknowledgment_forecasts');
  await knex.schema.dropTableIfExists('roi_metrics');
  await knex.schema.dropTableIfExists('violation_patterns');
  await knex.schema.dropTableIfExists('policy_violations');
  await knex.schema.dropTableIfExists('policy_effectiveness');
  await knex.schema.dropTableIfExists('risk_trends');
  await knex.schema.dropTableIfExists('risk_alerts');
  await knex.schema.dropTableIfExists('policy_risks');
  await knex.schema.dropTableIfExists('policy_gaps');
}
