/**
 * @fileoverview Migration: Create Policy Versions Table
 * @description Creates the policy_versions table for version history tracking
 * @version 1.0.0
 * @author WriteCareNotes Development Team
 * @created 2025-10-06
 */

import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePolicyVersionsTable1696579200000 implements MigrationInterface {
  name = 'CreatePolicyVersionsTable1696579200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create policy_versions table
    await queryRunner.createTable(
      new Table({
        name: 'policy_versions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'policyId',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'version',
            type: 'varchar',
            length: '20',
            isNullable: false
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 'content',
            type: 'jsonb',
            isNullable: false
          },
          {
            name: 'category',
            type: 'enum',
            enum: [
              'safeguarding',
              'data_protection',
              'complaints',
              'health_safety',
              'medication',
              'infection_control',
              'staff_training',
              'emergency_procedures',
              'dignity_respect',
              'nutrition_hydration',
              'end_of_life',
              'mental_capacity',
              'visitors',
              'transport',
              'accommodation'
            ],
            isNullable: false
          },
          {
            name: 'jurisdiction',
            type: 'enum',
            enum: [
              'england_cqc',
              'scotland_ci',
              'wales_ciw',
              'northern_ireland_rqia',
              'jersey_jcc',
              'guernsey_gcc',
              'isle_of_man_imc',
              'eu_gdpr',
              'uk_data_protection'
            ],
            isArray: true,
            isNullable: false
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'under_review', 'approved', 'published', 'expired', 'archived'],
            isNullable: false
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true
          },
          {
            name: 'tags',
            type: 'varchar',
            isArray: true,
            default: 'ARRAY[]::varchar[]'
          },
          {
            name: 'linkedModules',
            type: 'varchar',
            isArray: true,
            default: 'ARRAY[]::varchar[]'
          },
          {
            name: 'changeDescription',
            type: 'text',
            isNullable: true
          },
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'organizationId',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true
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

    // Create indexes
    await queryRunner.createIndex(
      'policy_versions',
      new TableIndex({
        name: 'IDX_policy_versions_policyId',
        columnNames: ['policyId']
      })
    );

    await queryRunner.createIndex(
      'policy_versions',
      new TableIndex({
        name: 'IDX_policy_versions_policyId_createdAt',
        columnNames: ['policyId', 'createdAt']
      })
    );

    await queryRunner.createIndex(
      'policy_versions',
      new TableIndex({
        name: 'IDX_policy_versions_organizationId',
        columnNames: ['organizationId']
      })
    );

    await queryRunner.createIndex(
      'policy_versions',
      new TableIndex({
        name: 'IDX_policy_versions_organizationId_version',
        columnNames: ['organizationId', 'version']
      })
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'policy_versions',
      new TableForeignKey({
        columnNames: ['policyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'policy_drafts',
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createForeignKey(
      'policy_versions',
      new TableForeignKey({
        columnNames: ['createdBy'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL'
      })
    );

    await queryRunner.createForeignKey(
      'policy_versions',
      new TableForeignKey({
        columnNames: ['organizationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE'
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const table = await queryRunner.getTable('policy_versions');
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('policy_versions', foreignKey);
      }
    }

    // Drop indexes
    await queryRunner.dropIndex('policy_versions', 'IDX_policy_versions_policyId');
    await queryRunner.dropIndex('policy_versions', 'IDX_policy_versions_policyId_createdAt');
    await queryRunner.dropIndex('policy_versions', 'IDX_policy_versions_organizationId');
    await queryRunner.dropIndex('policy_versions', 'IDX_policy_versions_organizationId_version');

    // Drop table
    await queryRunner.dropTable('policy_versions');
  }
}
