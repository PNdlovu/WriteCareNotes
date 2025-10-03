/**
 * @fileoverview AI Agent Tables Migration
 * @module CreateAIAgentTables
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-14
 * 
 * @description Database migration for AI agent sessions, conversations, and analytics
 */

import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from 'typeorm';

export class CreateAIAgentTables1705276800000 implements MigrationInterface {
  name = 'CreateAIAgentTables1705276800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ai_agent_sessions table
    await queryRunner.createTable(
      new Table({
        name: 'ai_agent_sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'sessionType',
            type: 'varchar',
            length: '20',
            isNullable: false,
            comment: 'PUBLIC or TENANT'
          },
          {
            name: 'tenantId',
            type: 'uuid',
            isNullable: true,
            comment: 'NULL for public sessions'
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
            comment: 'NULL for anonymous public sessions'
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'ACTIVE'"
          },
          {
            name: 'sessionData',
            type: 'jsonb',
            isNullable: false,
            default: "'{}'"
          },
          {
            name: 'userRole',
            type: 'varchar',
            length: '50',
            isNullable: true
          },
          {
            name: 'confidentialityLevel',
            type: 'varchar',
            length: '50',
            default: "'STANDARD'"
          },
          {
            name: 'encryptionKeyId',
            type: 'varchar',
            length: '100',
            isNullable: true
          },
          {
            name: 'ipAddress',
            type: 'inet',
            isNullable: true
          },
          {
            name: 'userAgent',
            type: 'text',
            isNullable: true
          },
          {
            name: 'interactionCount',
            type: 'integer',
            default: 0
          },
          {
            name: 'securityViolationCount',
            type: 'integer',
            default: 0
          },
          {
            name: 'escalationRequired',
            type: 'boolean',
            default: false
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: false
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true
          }
        ]
      }),
      true
    );

    // Create ai_agent_conversations table
    await queryRunner.createTable(
      new Table({
        name: 'ai_agent_conversations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'sessionId',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'messageSequence',
            type: 'integer',
            isNullable: false
          },
          {
            name: 'messageType',
            type: 'varchar',
            length: '20',
            default: "'USER_MESSAGE'"
          },
          {
            name: 'userMessage',
            type: 'text',
            isNullable: true
          },
          {
            name: 'agentResponse',
            type: 'text',
            isNullable: true
          },
          {
            name: 'systemMessage',
            type: 'text',
            isNullable: true
          },
          {
            name: 'responseTimeMs',
            type: 'integer',
            default: 0
          },
          {
            name: 'confidenceScore',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: true
          },
          {
            name: 'responseQuality',
            type: 'varchar',
            length: '20',
            isNullable: true
          },
          {
            name: 'knowledgeSources',
            type: 'jsonb',
            default: "'[]'"
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'"
          },
          {
            name: 'escalationRequired',
            type: 'boolean',
            default: false
          },
          {
            name: 'isEncrypted',
            type: 'boolean',
            default: false
          },
          {
            name: 'encryptionKeyId',
            type: 'varchar',
            length: '100',
            isNullable: true
          },
          {
            name: 'confidentialityLevel',
            type: 'varchar',
            length: '50',
            default: "'STANDARD'"
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    );

    // Create ai_agent_analytics table
    await queryRunner.createTable(
      new Table({
        name: 'ai_agent_analytics',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'sessionId',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'agentType',
            type: 'varchar',
            length: '20',
            isNullable: false
          },
          {
            name: 'tenantId',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'interactionCount',
            type: 'integer',
            default: 0
          },
          {
            name: 'avgResponseTimeMs',
            type: 'integer',
            default: 0
          },
          {
            name: 'userSatisfactionScore',
            type: 'decimal',
            precision: 2,
            scale: 1,
            isNullable: true
          },
          {
            name: 'resolvedIssues',
            type: 'integer',
            default: 0
          },
          {
            name: 'escalatedIssues',
            type: 'integer',
            default: 0
          },
          {
            name: 'knowledgeBaseHits',
            type: 'integer',
            default: 0
          },
          {
            name: 'securityViolations',
            type: 'integer',
            default: 0
          },
          {
            name: 'totalTokensUsed',
            type: 'integer',
            default: 0
          },
          {
            name: 'avgConfidenceScore',
            type: 'decimal',
            precision: 3,
            scale: 2,
            default: 0
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    );

    // Create enhanced_knowledge_base_articles table
    await queryRunner.createTable(
      new Table({
        name: 'enhanced_knowledge_base_articles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'tenantId',
            type: 'uuid',
            isNullable: true,
            comment: 'NULL for public articles'
          },
          {
            name: 'title',
            type: 'varchar',
            length: '500',
            isNullable: false
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false
          },
          {
            name: 'articleType',
            type: 'varchar',
            length: '50',
            isNullable: false
          },
          {
            name: 'tags',
            type: 'text',
            array: true,
            default: "'{}'"
          },
          {
            name: 'accessLevel',
            type: 'varchar',
            length: '20',
            default: "'PUBLIC'"
          },
          {
            name: 'aiSearchable',
            type: 'boolean',
            default: true
          },
          {
            name: 'embeddingVector',
            type: 'vector',
            length: '1536',
            isNullable: true,
            comment: 'For semantic search'
          },
          {
            name: 'viewCount',
            type: 'integer',
            default: 0
          },
          {
            name: 'helpfulVotes',
            type: 'integer',
            default: 0
          },
          {
            name: 'lastAccessedAt',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'updatedBy',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex('ai_agent_sessions', new Index('IDX_ai_sessions_tenant_user', ['tenantId', 'userId']));
    await queryRunner.createIndex('ai_agent_sessions', new Index('IDX_ai_sessions_type_created', ['sessionType', 'createdAt']));
    await queryRunner.createIndex('ai_agent_sessions', new Index('IDX_ai_sessions_expires', ['expiresAt']));
    
    await queryRunner.createIndex('ai_agent_conversations', new Index('IDX_ai_conversations_session_sequence', ['sessionId', 'messageSequence']));
    await queryRunner.createIndex('ai_agent_conversations', new Index('IDX_ai_conversations_created', ['createdAt']));
    await queryRunner.createIndex('ai_agent_conversations', new Index('IDX_ai_conversations_confidence', ['confidenceScore']));
    
    await queryRunner.createIndex('ai_agent_analytics', new Index('IDX_ai_analytics_tenant_created', ['tenantId', 'createdAt']));
    await queryRunner.createIndex('ai_agent_analytics', new Index('IDX_ai_analytics_agent_type', ['agentType']));
    
    await queryRunner.createIndex('enhanced_knowledge_base_articles', new Index('IDX_knowledge_tenant_searchable', ['tenantId', 'aiSearchable']));
    await queryRunner.createIndex('enhanced_knowledge_base_articles', new Index('IDX_knowledge_type_access', ['articleType', 'accessLevel']));

    // Create foreign key constraints
    await queryRunner.createForeignKey('ai_agent_conversations', new ForeignKey({
      columnNames: ['sessionId'],
      referencedTableName: 'ai_agent_sessions',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE'
    }));

    await queryRunner.createForeignKey('ai_agent_analytics', new ForeignKey({
      columnNames: ['sessionId'],
      referencedTableName: 'ai_agent_sessions',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE'
    }));

    // Add tenant isolation constraints for enhanced security
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION enforce_ai_tenant_isolation()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Ensure tenant AI sessions can only access tenant data
        IF NEW.sessionType = 'TENANT' AND NEW.tenantId IS NULL THEN
          RAISE EXCEPTION 'Tenant AI sessions must have tenantId';
        END IF;
        
        -- Ensure public sessions cannot access tenant data
        IF NEW.sessionType = 'PUBLIC' AND NEW.tenantId IS NOT NULL THEN
          RAISE EXCEPTION 'Public AI sessions cannot have tenantId';
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER ai_tenant_isolation_trigger
      BEFORE INSERT OR UPDATE ON ai_agent_sessions
      FOR EACH ROW EXECUTE FUNCTION enforce_ai_tenant_isolation();
    `);

    // Create row-level security policies for tenant isolation
    await queryRunner.query(`ALTER TABLE ai_agent_sessions ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`ALTER TABLE ai_agent_conversations ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`ALTER TABLE ai_agent_analytics ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`ALTER TABLE enhanced_knowledge_base_articles ENABLE ROW LEVEL SECURITY;`);

    // Tenant isolation policies
    await queryRunner.query(`
      CREATE POLICY ai_sessions_tenant_isolation ON ai_agent_sessions
      FOR ALL
      USING (
        sessionType = 'PUBLIC' 
        OR (sessionType = 'TENANT' AND tenantId = current_setting('app.current_tenant_id', true)::uuid)
      );
    `);

    await queryRunner.query(`
      CREATE POLICY ai_conversations_tenant_isolation ON ai_agent_conversations
      FOR ALL
      USING (
        sessionId IN (
          SELECT id FROM ai_agent_sessions 
          WHERE sessionType = 'PUBLIC' 
          OR (sessionType = 'TENANT' AND tenantId = current_setting('app.current_tenant_id', true)::uuid)
        )
      );
    `);

    await queryRunner.query(`
      CREATE POLICY knowledge_articles_tenant_isolation ON enhanced_knowledge_base_articles
      FOR ALL
      USING (
        tenantId IS NULL 
        OR tenantId = current_setting('app.current_tenant_id', true)::uuid
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop policies
    await queryRunner.query(`DROP POLICY IF EXISTS ai_sessions_tenant_isolation ON ai_agent_sessions;`);
    await queryRunner.query(`DROP POLICY IF EXISTS ai_conversations_tenant_isolation ON ai_agent_conversations;`);
    await queryRunner.query(`DROP POLICY IF EXISTS knowledge_articles_tenant_isolation ON enhanced_knowledge_base_articles;`);

    // Drop triggers and functions
    await queryRunner.query(`DROP TRIGGER IF EXISTS ai_tenant_isolation_trigger ON ai_agent_sessions;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS enforce_ai_tenant_isolation();`);

    // Drop foreign keys
    const conversationTable = await queryRunner.getTable('ai_agent_conversations');
    const analyticsTable = await queryRunner.getTable('ai_agent_analytics');

    if (conversationTable) {
      const sessionForeignKey = conversationTable.foreignKeys.find(fk => fk.columnNames.indexOf('sessionId') !== -1);
      if (sessionForeignKey) {
        await queryRunner.dropForeignKey('ai_agent_conversations', sessionForeignKey);
      }
    }

    if (analyticsTable) {
      const analyticsForeignKey = analyticsTable.foreignKeys.find(fk => fk.columnNames.indexOf('sessionId') !== -1);
      if (analyticsForeignKey) {
        await queryRunner.dropForeignKey('ai_agent_analytics', analyticsForeignKey);
      }
    }

    // Drop tables
    await queryRunner.dropTable('enhanced_knowledge_base_articles');
    await queryRunner.dropTable('ai_agent_analytics');
    await queryRunner.dropTable('ai_agent_conversations');
    await queryRunner.dropTable('ai_agent_sessions');
  }
}