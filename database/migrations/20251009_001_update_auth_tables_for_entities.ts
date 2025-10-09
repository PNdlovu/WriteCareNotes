/**
 * @fileoverview Update Authentication Tables for TypeORM Entities
 * @module Migrations/Auth
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-09
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description
 * Updates authentication tables to match TypeORM entity definitions:
 * - Simplifies refresh_tokens table (removes token rotation tracking for now)
 * - Creates password_reset_tokens table (simpler than password_resets)
 * - Ensures compatibility with RefreshTokenRepository and PasswordResetTokenRepository
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  console.log('🔄 Updating authentication tables for TypeORM entities...');

  // Check if refresh_tokens table exists from previous migration
  const hasRefreshTokens = await knex.schema.hasTable('refresh_tokens');
  
  if (hasRefreshTokens) {
    console.log('⚠️  refresh_tokens table already exists - checking schema compatibility...');
    
    // Check if it has the complex schema (token_hash, status, family_id, etc.)
    const columns = await knex('information_schema.columns')
      .select('column_name')
      .where({ table_name: 'refresh_tokens' });
    
    const columnNames = columns.map(c => c.column_name);
    const hasComplexSchema = columnNames.includes('token_hash') || 
                             columnNames.includes('status') || 
                             columnNames.includes('family_id');
    
    if (hasComplexSchema) {
      console.log('📝 Simplifying refresh_tokens table to match entities...');
      
      // Drop and recreate with simple schema
      await knex.schema.dropTableIfExists('refresh_tokens');
      
      await knex.schema.createTable('refresh_tokens', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable()
          .references('id').inTable('users').onDelete('CASCADE');
        table.string('token', 500).unique().notNullable();
        table.timestamp('expires_at').notNullable();
        table.boolean('is_revoked').defaultTo(false);
        table.timestamp('revoked_at').nullable();
        table.uuid('revoked_by').nullable();
        table.string('revocation_reason', 255).nullable();
        table.string('ip_address', 45).nullable();
        table.string('user_agent', 500).nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());

        // Indexes for performance
        table.index(['user_id']);
        table.index(['token']);
        table.index(['expires_at']);
        table.index(['is_revoked']);
      });
      
      console.log('✅ refresh_tokens table simplified');
    } else {
      console.log('✅ refresh_tokens table already matches entity schema');
    }
  } else {
    // Create fresh refresh_tokens table
    console.log('📝 Creating refresh_tokens table...');
    
    await knex.schema.createTable('refresh_tokens', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').notNullable()
        .references('id').inTable('users').onDelete('CASCADE');
      table.string('token', 500).unique().notNullable();
      table.timestamp('expires_at').notNullable();
      table.boolean('is_revoked').defaultTo(false);
      table.timestamp('revoked_at').nullable();
      table.uuid('revoked_by').nullable();
      table.string('revocation_reason', 255).nullable();
      table.string('ip_address', 45).nullable();
      table.string('user_agent', 500).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());

      // Indexes for performance
      table.index(['user_id']);
      table.index(['token']);
      table.index(['expires_at']);
      table.index(['is_revoked']);
    });
    
    console.log('✅ refresh_tokens table created');
  }

  // Check if password_reset_tokens table exists
  const hasPasswordResetTokens = await knex.schema.hasTable('password_reset_tokens');
  
  if (hasPasswordResetTokens) {
    console.log('✅ password_reset_tokens table already exists');
  } else {
    // Check if old password_resets table exists
    const hasPasswordResets = await knex.schema.hasTable('password_resets');
    
    if (hasPasswordResets) {
      console.log('📝 Renaming password_resets to password_reset_tokens...');
      await knex.schema.renameTable('password_resets', 'password_reset_tokens');
      
      // Check and update schema if needed
      const columns = await knex('information_schema.columns')
        .select('column_name')
        .where({ table_name: 'password_reset_tokens' });
      
      const columnNames = columns.map(c => c.column_name);
      
      // If has 'status' column, we need to simplify
      if (columnNames.includes('status') || columnNames.includes('token_hash')) {
        console.log('📝 Simplifying password_reset_tokens schema...');
        
        await knex.schema.dropTableIfExists('password_reset_tokens');
        
        await knex.schema.createTable('password_reset_tokens', (table) => {
          table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
          table.uuid('user_id').notNullable()
            .references('id').inTable('users').onDelete('CASCADE');
          table.string('token', 255).unique().notNullable();
          table.timestamp('expires_at').notNullable();
          table.boolean('used').defaultTo(false);
          table.timestamp('used_at').nullable();
          table.string('ip_address', 45).nullable();
          table.string('user_agent', 500).nullable();
          table.timestamp('created_at').defaultTo(knex.fn.now());

          // Indexes for performance
          table.index(['user_id']);
          table.index(['token']);
          table.index(['expires_at']);
          table.index(['used']);
        });
      }
      
      console.log('✅ password_reset_tokens table updated');
    } else {
      // Create fresh password_reset_tokens table
      console.log('📝 Creating password_reset_tokens table...');
      
      await knex.schema.createTable('password_reset_tokens', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable()
          .references('id').inTable('users').onDelete('CASCADE');
        table.string('token', 255).unique().notNullable();
        table.timestamp('expires_at').notNullable();
        table.boolean('used').defaultTo(false);
        table.timestamp('used_at').nullable();
        table.string('ip_address', 45).nullable();
        table.string('user_agent', 500).nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());

        // Indexes for performance
        table.index(['user_id']);
        table.index(['token']);
        table.index(['expires_at']);
        table.index(['used']);
      });
      
      console.log('✅ password_reset_tokens table created');
    }
  }

  console.log('🎉 Authentication tables updated successfully!');
}

export async function down(knex: Knex): Promise<void> {
  console.log('⏪ Rolling back authentication table updates...');
  
  // Drop tables in reverse order (to handle foreign keys)
  await knex.schema.dropTableIfExists('password_reset_tokens');
  await knex.schema.dropTableIfExists('refresh_tokens');
  
  console.log('✅ Rollback complete');
}
