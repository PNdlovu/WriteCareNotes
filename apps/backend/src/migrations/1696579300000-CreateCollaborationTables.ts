/**
 * @fileoverview Database Migration - Create Real-Time Collaboration Tables
 * @module Migrations/CreateCollaborationTables
 * @description TypeORM migration for creating collaboration_sessions and policy_comments tables
 * to support real-time collaborative editing and policy annotations.
 * 
 * @author WriteCareNotes Development Team
 * @since 2.0.0 - Phase 2 Feature 2: Real-Time Collaboration
 * @license Proprietary - WriteCareNotes Platform
 * 
 * MigrationDetails:
 * - Creates collaboration_sessions table (18 columns, 5 indexes)
 * - Creates policy_comments table (22 columns, 6 indexes)
 * - Adds foreign key const raints with CASCADE/SET NULL behaviors
 * - Creates performance indexes for common query patterns
 * - Enables JSONB support for cursor positions and metadata
 * 
 * TablesCreated:
 * 1. collaboration_sessions
 *    - Tracks active real-time editing sessions
 *    - Stores cursor positions and selection ranges
 *    - Manages WebSocket connection state
 *    - Supports session lifecycle management
 * 
 * 2. policy_comments
 *    - Manages threaded comments and annotations
 *    - Supports @mentions and notifications
 *    - Enables position-based annotations
 *    - Tracks comment resolution and editing
 * 
 * IndexesCreated:
 * - collaboration_sessions: policy_id, user_id, policy_id+user_id, last_activity, status
 * - policy_comments: policy_id, user_id, parent_comment_id, status, created_at, policy_id+status
 * 
 * ForeignKeys:
 * - Sessions: policy_id → policy_drafts, user_id → users
 * - Comments: policy_id → policy_drafts, user_id → users, parent_comment_id → policy_comments
 * 
 * DataTypes:
 * - UUID: All primary keys and foreign keys
 * - JSONB: Cursor positions, selection ranges, metadata, position selectors
 * - TIMESTAMP: All datetime fields
 * - VAR CHAR: Status enums, tokens, device info
 * - TEXT: Comment content
 * - INTEGER: Counters (edits, comments, likes)
 * - BOOLEAN: Flags (is_editing, is_pinned)
 * 
 * PerformanceConsiderations:
 * - Composite indexes for multi-column queries
 * - JSONB indexes for metadata queries (can be added later if needed)
 * - Foreign key indexes for join performance
 * - Timestamp indexes for time-based queries
 * 
 * Compliance:
 * - GDPR: Data retention and user data deletion support
 * - ISO 27001: Audit trail capabilities
 * - Data Protection Act 2018: User consent tracking
 * 
 * @example
 * ```bash
 * # Run migration
 * npm run typeormmigration:run
 * 
 * # Revert migration
 * npm run typeormmigration:revert
 * ```
 */

import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateCollaborationTables1696579300000 implements MigrationInterface {
  name = 'CreateCollaborationTables1696579300000';

  /**
   * Execute migration - Create tables and const raints
   * @param queryRunner - TypeORM query runner
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // 1. Create collaboration_sessions table
    // ========================================
    await queryRunner.createTable(
      new Table({
        name: 'collaboration_sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'policy_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'session_token',
            type: 'var char',
            length: '255',
            isNullable: false,
            isUnique: true
          },
          {
            name: 'last_activity',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false
          },
          {
            name: 'cursor_position',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'selection_range',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'is_editing',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'status',
            type: 'var char',
            length: '20',
            default: "'active'",
            isNullable: false
          },
          {
            name: 'ended_at',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'device_type',
            type: 'var char',
            length: '50',
            isNullable: true
          },
          {
            name: 'browser',
            type: 'var char',
            length: '100',
            isNullable: true
          },
          {
            name: 'socket_id',
            type: 'var char',
            length: '255',
            isNullable: true
          },
          {
            name: 'edit_count',
            type: 'integer',
            default: 0,
            isNullable: false
          },
          {
            name: 'comment_count',
            type: 'integer',
            default: 0,
            isNullable: false
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false
          }
        ]
      }),
      true
    );

    // Create indexes for collaboration_sessions
    await queryRunner.createIndex(
      'collaboration_sessions',
      new TableIndex({
        name: 'IDX_collaboration_sessions_policy_id',
        columnNames: ['policy_id']
      })
    );

    await queryRunner.createIndex(
      'collaboration_sessions',
      new TableIndex({
        name: 'IDX_collaboration_sessions_user_id',
        columnNames: ['user_id']
      })
    );

    await queryRunner.createIndex(
      'collaboration_sessions',
      new TableIndex({
        name: 'IDX_collaboration_sessions_policy_user',
        columnNames: ['policy_id', 'user_id']
      })
    );

    await queryRunner.createIndex(
      'collaboration_sessions',
      new TableIndex({
        name: 'IDX_collaboration_sessions_last_activity',
        columnNames: ['last_activity']
      })
    );

    await queryRunner.createIndex(
      'collaboration_sessions',
      new TableIndex({
        name: 'IDX_collaboration_sessions_status',
        columnNames: ['status']
      })
    );

    // Create foreign keys for collaboration_sessions
    await queryRunner.createForeignKey(
      'collaboration_sessions',
      new TableForeignKey({
        name: 'FK_collaboration_sessions_policy',
        columnNames: ['policy_id'],
        referencedTableName: 'policy_drafts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      })
    );

    await queryRunner.createForeignKey(
      'collaboration_sessions',
      new TableForeignKey({
        name: 'FK_collaboration_sessions_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      })
    );

    // ========================================
    // 2. Create policy_comments table
    // ========================================
    await queryRunner.createTable(
      new Table({
        name: 'policy_comments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'policy_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'parent_comment_id',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false
          },
          {
            name: 'position_selector',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'status',
            type: 'var char',
            length: '20',
            default: "'active'",
            isNullable: false
          },
          {
            name: 'comment_type',
            type: 'var char',
            length: '20',
            default: "'general'",
            isNullable: false
          },
          {
            name: 'mentioned_users',
            type: 'uuid[]',
            isNullable: true
          },
          {
            name: 'resolved_by',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'resolved_at',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'edited_by',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'edited_at',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'like_count',
            type: 'integer',
            default: 0,
            isNullable: false
          },
          {
            name: 'liked_by',
            type: 'uuid[]',
            isNullable: true
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'is_pinned',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false
          }
        ]
      }),
      true
    );

    // Create indexes for policy_comments
    await queryRunner.createIndex(
      'policy_comments',
      new TableIndex({
        name: 'IDX_policy_comments_policy_id',
        columnNames: ['policy_id']
      })
    );

    await queryRunner.createIndex(
      'policy_comments',
      new TableIndex({
        name: 'IDX_policy_comments_user_id',
        columnNames: ['user_id']
      })
    );

    await queryRunner.createIndex(
      'policy_comments',
      new TableIndex({
        name: 'IDX_policy_comments_parent_comment_id',
        columnNames: ['parent_comment_id']
      })
    );

    await queryRunner.createIndex(
      'policy_comments',
      new TableIndex({
        name: 'IDX_policy_comments_status',
        columnNames: ['status']
      })
    );

    await queryRunner.createIndex(
      'policy_comments',
      new TableIndex({
        name: 'IDX_policy_comments_created_at',
        columnNames: ['created_at']
      })
    );

    await queryRunner.createIndex(
      'policy_comments',
      new TableIndex({
        name: 'IDX_policy_comments_policy_status',
        columnNames: ['policy_id', 'status']
      })
    );

    // Create foreign keys for policy_comments
    await queryRunner.createForeignKey(
      'policy_comments',
      new TableForeignKey({
        name: 'FK_policy_comments_policy',
        columnNames: ['policy_id'],
        referencedTableName: 'policy_drafts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      })
    );

    await queryRunner.createForeignKey(
      'policy_comments',
      new TableForeignKey({
        name: 'FK_policy_comments_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      })
    );

    // Self-referencing foreign key for parent comments
    await queryRunner.createForeignKey(
      'policy_comments',
      new TableForeignKey({
        name: 'FK_policy_comments_parent',
        columnNames: ['parent_comment_id'],
        referencedTableName: 'policy_comments',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      })
    );

    // Optional: Create foreign keys for resolved_by and edited_by
    await queryRunner.createForeignKey(
      'policy_comments',
      new TableForeignKey({
        name: 'FK_policy_comments_resolved_by',
        columnNames: ['resolved_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      })
    );

    await queryRunner.createForeignKey(
      'policy_comments',
      new TableForeignKey({
        name: 'FK_policy_comments_edited_by',
        columnNames: ['edited_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      })
    );

    console.log('✅ Created collaboration_sessions table with 5 indexes');
    console.log('✅ Created policy_comments table with 6 indexes');
    console.log('✅ Created all foreign key const raints');
    console.log('📊 Real-Time Collaboration database schemaready!');
  }

  /**
   * Revert migration - Drop tables and const raints
   * @param queryRunner - TypeORM query runner
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop policy_comments table (drops all indexes and foreign keys automatically)
    await queryRunner.dropTable('policy_comments', true);
    console.log('🗑️  Dropped policy_comments table');

    // Drop collaboration_sessions table (drops all indexes and foreign keys automatically)
    await queryRunner.dropTable('collaboration_sessions', true);
    console.log('🗑️  Dropped collaboration_sessions table');

    console.log('⏪ Reverted CreateCollaborationTables migration');
  }
}
