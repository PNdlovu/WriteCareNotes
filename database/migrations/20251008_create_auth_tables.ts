/**
 * @fileoverview Authentication Tables Migration
 * @module Migrations/Auth
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Creates sessions, refresh_tokens, and password_resets tables
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create sessions table
  await knex.schema.createTable('sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('refresh_token', 500).unique().notNullable();
    table.string('refresh_token_hash', 500).notNullable();
    table.enum('status', ['active', 'expired', 'revoked', 'logout']).defaultTo('active');
    table.string('ip_address', 45);
    table.text('user_agent');
    table.jsonb('device_info');
    table.jsonb('location');
    table.timestamp('last_activity').notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('revoked_at');
    table.uuid('revoked_by');
    table.string('revocation_reason', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['user_id', 'status']);
    table.index(['refresh_token']);
    table.index(['expires_at']);
  });

  // Create refresh_tokens table
  await knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token', 500).unique().notNullable();
    table.string('token_hash', 500).notNullable();
    table.enum('status', ['active', 'used', 'revoked', 'expired']).defaultTo('active');
    table.uuid('parent_token_id').references('id').inTable('refresh_tokens').onDelete('SET NULL');
    table.uuid('family_id').notNullable();
    table.integer('rotation_count').defaultTo(0);
    table.string('ip_address', 45);
    table.text('user_agent');
    table.timestamp('expires_at').notNullable();
    table.timestamp('used_at');
    table.timestamp('revoked_at');
    table.uuid('revoked_by');
    table.string('revocation_reason', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['user_id', 'status']);
    table.index(['token']);
    table.index(['expires_at']);
    table.index(['parent_token_id']);
    table.index(['family_id']);
  });

  // Create password_resets table
  await knex.schema.createTable('password_resets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token', 500).unique().notNullable();
    table.string('token_hash', 500).notNullable();
    table.enum('status', ['pending', 'used', 'expired', 'revoked']).defaultTo('pending');
    table.string('ip_address', 45);
    table.text('user_agent');
    table.timestamp('expires_at').notNullable();
    table.timestamp('used_at');
    table.timestamp('revoked_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['user_id', 'status']);
    table.index(['token']);
    table.index(['expires_at']);
  });

  console.log('✅ Created authentication tables (sessions, refresh_tokens, password_resets)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('password_resets');
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('sessions');

  console.log('❌ Dropped authentication tables');
}
