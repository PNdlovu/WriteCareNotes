/**
 * @fileoverview User Sessions Table Migration for WriteCareNotes
 * @module UserSessionsMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Creates user_sessions table for session management and security tracking
 * 
 * @compliance
 * - GDPR Article 32 (Security of processing)
 * - NHS Digital Data Security Standards
 * - Healthcare session management requirements
 */

import { Knex } from 'knex';

/**
 * Create user_sessions table
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_sessions', (table) => {
    // Primary key
    table.string('session_id', 100).primary().comment('Unique session identifier');
    
    // User reference
    table.uuid('user_id').notNullable().comment('User ID associated with session');
    
    // Device and location tracking
    table.string('device_id', 100).nullable().comment('Device identifier for session tracking');
    table.string('ip_address', 45).notNullable().comment('IP address of the session');
    table.text('user_agent').notNullable().comment('User agent string from browser');
    
    // Session timing
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).comment('Session creation timestamp');
    table.timestamp('last_activity').notNullable().defaultTo(knex.fn.now()).comment('Last activity timestamp');
    table.timestamp('expires_at').notNullable().comment('Session expiration timestamp');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now()).comment('Last update timestamp');
    
    // Session status
    table.boolean('is_active').notNullable().defaultTo(true).comment('Whether session is active');
    
    // Security and compliance
    table.jsonb('security_context').nullable().comment('Additional security context data');
    table.string('logout_reason', 100).nullable().comment('Reason for session termination');
    
    // Indexes for performance
    table.index(['user_id'], 'idx_user_sessions_user_id');
    table.index(['user_id', 'is_active'], 'idx_user_sessions_user_active');
    table.index(['expires_at'], 'idx_user_sessions_expires_at');
    table.index(['created_at'], 'idx_user_sessions_created_at');
    table.index(['last_activity'], 'idx_user_sessions_last_activity');
    table.index(['ip_address'], 'idx_user_sessions_ip_address');
    
    // Composite indexes for common queries
    table.index(['user_id', 'created_at'], 'idx_user_sessions_user_created');
    table.index(['is_active', 'expires_at'], 'idx_user_sessions_active_expires');
    
    // Table comment
    table.comment('User session management for authentication and security tracking');
  });

  // Create trigger for updated_at
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_user_sessions_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  await knex.raw(`
    CREATE TRIGGER update_user_sessions_updated_at
      BEFORE UPDATE ON user_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_user_sessions_updated_at();
  `);

  // Create function to clean up expired sessions
  await knex.raw(`
    CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
    RETURNS INTEGER AS $$
    DECLARE
      deleted_count INTEGER;
    BEGIN
      -- Mark expired sessions as inactive
      UPDATE user_sessions 
      SET is_active = false, 
          logout_reason = 'expired',
          updated_at = NOW()
      WHERE expires_at < NOW() 
        AND is_active = true;
      
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
      
      -- Log cleanup activity
      INSERT INTO audit_logs (
        table_name, 
        operation, 
        details, 
        created_at
      ) VALUES (
        'user_sessions',
        'CLEANUP',
        jsonb_build_object('expired_sessions_count', deleted_count),
        NOW()
      );
      
      RETURN deleted_count;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create index for session cleanup
  await knex.raw(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_cleanup 
    ON user_sessions (expires_at, is_active) 
    WHERE is_active = true;
  `);
}

/**
 * Drop user_sessions table
 */
export async function down(knex: Knex): Promise<void> {
  // Drop triggers and functions
  await knex.raw('DROP TRIGGER IF EXISTS update_user_sessions_updated_at ON user_sessions;');
  await knex.raw('DROP FUNCTION IF EXISTS update_user_sessions_updated_at();');
  await knex.raw('DROP FUNCTION IF EXISTS cleanup_expired_sessions();');
  
  // Drop table
  await knex.schema.dropTableIfExists('user_sessions');
}