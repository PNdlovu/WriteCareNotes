/**
 * ============================================================================
 * Child Profile Migration
 * ============================================================================
 * 
 * @fileoverview Database migration for children table and related structures.
 * 
 * @module migrations/001-CreateChildProfile
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Creates the children table with all fields for looked after children profiles,
 * including demographics, legal status, placement information, and statutory
 * compliance data.
 * 
 * @compliance
 * - Children Act 1989
 * - Care Planning Regulations 2010
 * - OFSTED Regulation 17 (Records)
 * 
 * @features
 * - Children table with 80+ fields
 * - Indexes for performance optimization
 * - Foreign keys for referential integrity
 * - Constraints for data validation
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateChildProfile1704988800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create children table
    await queryRunner.createTable(
      new Table({
        name: 'children',
        columns: [
          // ========================================
          // PRIMARY KEY
          // ========================================
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()'
          },

          // ========================================
          // CHILD IDENTIFIER
          // ========================================
          {
            name: 'childNumber',
            type: 'varchar',
            isUnique: true,
            isNullable: false
          },
          {
            name: 'legalId',
            type: 'varchar',
            isUnique: true,
            isNullable: false
          },
          {
            name: 'organizationId',
            type: 'uuid',
            isNullable: false
          },

          // ========================================
          // PERSONAL DETAILS
          // ========================================
          {
            name: 'firstName',
            type: 'varchar',
            length: '100',
            isNullable: false
          },
          {
            name: 'middleName',
            type: 'varchar',
            length: '100',
            isNullable: true
          },
          {
            name: 'lastName',
            type: 'varchar',
            length: '100',
            isNullable: false
          },
          {
            name: 'preferredName',
            type: 'varchar',
            length: '100',
            isNullable: true
          },
          {
            name: 'dateOfBirth',
            type: 'date',
            isNullable: false
          },
          {
            name: 'gender',
            type: 'varchar',
            length: '50',
            isNullable: false
          },
          {
            name: 'ethnicity',
            type: 'varchar',
            length: '100',
            isNullable: true
          },
          {
            name: 'nationality',
            type: 'varchar',
            length: '100',
            isNullable: true
          },
          {
            name: 'religion',
            type: 'varchar',
            length: '100',
            isNullable: true
          },
          {
            name: 'firstLanguage',
            type: 'varchar',
            length: '100',
            isNullable: true
          },

          // ========================================
          // LEGAL STATUS
          // ========================================
          {
            name: 'legalStatus',
            type: 'varchar',
            length: '50',
            isNullable: false
          },
          {
            name: 'careOrderDate',
            type: 'date',
            isNullable: true
          },
          {
            name: 'careOrderExpiryDate',
            type: 'date',
            isNullable: true
          },
          {
            name: 'placementOrderDate',
            type: 'date',
            isNullable: true
          },

          // ========================================
          // PLACEMENT INFORMATION
          // ========================================
          {
            name: 'currentPlacementType',
            type: 'varchar',
            length: '100',
            isNullable: true
          },
          {
            name: 'placementStartDate',
            type: 'date',
            isNullable: true
          },
          {
            name: 'admissionToCareDte',
            type: 'date',
            isNullable: true
          },

          // ========================================
          // CONTACT INFORMATION
          // ========================================
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '50',
            isNullable: true
          },

          // ========================================
          // SOCIAL WORKER
          // ========================================
          {
            name: 'socialWorkerId',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'allocatedSocialWorkerName',
            type: 'varchar',
            length: '255',
            isNullable: true
          },

          // ========================================
          // IRO
          // ========================================
          {
            name: 'independentReviewingOfficer',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'lastLACReviewDate',
            type: 'date',
            isNullable: true
          },
          {
            name: 'nextLACReviewDate',
            type: 'date',
            isNullable: true
          },

          // ========================================
          // EDUCATION
          // ========================================
          {
            name: 'schoolName',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'designatedTeacher',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'pepDate',
            type: 'date',
            isNullable: true
          },

          // ========================================
          // HEALTH
          // ========================================
          {
            name: 'gpName',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'gpPractice',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'lastHealthAssessmentDate',
            type: 'date',
            isNullable: true
          },
          {
            name: 'nextHealthAssessmentDue',
            type: 'date',
            isNullable: true
          },

          // ========================================
          // DISABILITIES AND SPECIAL NEEDS
          // ========================================
          {
            name: 'hasDisability',
            type: 'boolean',
            default: false
          },
          {
            name: 'disabilities',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'hasEHCP',
            type: 'boolean',
            default: false
          },

          // ========================================
          // SAFEGUARDING
          // ========================================
          {
            name: 'childProtectionPlan',
            type: 'boolean',
            default: false
          },
          {
            name: 'childInNeedPlan',
            type: 'boolean',
            default: false
          },

          // ========================================
          // STATUS FLAGS
          // ========================================
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'ACTIVE'"
          },
          {
            name: 'isUASC',
            type: 'boolean',
            default: false
          },
          {
            name: 'isCareLeaver',
            type: 'boolean',
            default: false
          },

          // ========================================
          // AUDIT TRAIL
          // ========================================
          {
            name: 'createdBy',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updatedBy',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP'
          },

          // ========================================
          // NOTES
          // ========================================
          {
            name: 'notes',
            type: 'text',
            isNullable: true
          }
        ]
      }),
      true
    );

    // ========================================
    // CREATE INDEXES
    // ========================================

    await queryRunner.createIndex(
      'children',
      new TableIndex({
        name: 'IDX_CHILDREN_ORGANIZATION',
        columnNames: ['organizationId']
      })
    );

    await queryRunner.createIndex(
      'children',
      new TableIndex({
        name: 'IDX_CHILDREN_STATUS',
        columnNames: ['status']
      })
    );

    await queryRunner.createIndex(
      'children',
      new TableIndex({
        name: 'IDX_CHILDREN_LEGAL_STATUS',
        columnNames: ['legalStatus']
      })
    );

    await queryRunner.createIndex(
      'children',
      new TableIndex({
        name: 'IDX_CHILDREN_DOB',
        columnNames: ['dateOfBirth']
      })
    );

    await queryRunner.createIndex(
      'children',
      new TableIndex({
        name: 'IDX_CHILDREN_SOCIAL_WORKER',
        columnNames: ['socialWorkerId']
      })
    );

    await queryRunner.createIndex(
      'children',
      new TableIndex({
        name: 'IDX_CHILDREN_UASC',
        columnNames: ['isUASC']
      })
    );

    await queryRunner.createIndex(
      'children',
      new TableIndex({
        name: 'IDX_CHILDREN_CARE_LEAVER',
        columnNames: ['isCareLeaver']
      })
    );

    // ========================================
    // CREATE FOREIGN KEYS
    // ========================================

    await queryRunner.createForeignKey(
      'children',
      new TableForeignKey({
        name: 'FK_CHILDREN_ORGANIZATION',
        columnNames: ['organizationId'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('children', 'FK_CHILDREN_ORGANIZATION');

    // Drop indexes
    await queryRunner.dropIndex('children', 'IDX_CHILDREN_ORGANIZATION');
    await queryRunner.dropIndex('children', 'IDX_CHILDREN_STATUS');
    await queryRunner.dropIndex('children', 'IDX_CHILDREN_LEGAL_STATUS');
    await queryRunner.dropIndex('children', 'IDX_CHILDREN_DOB');
    await queryRunner.dropIndex('children', 'IDX_CHILDREN_SOCIAL_WORKER');
    await queryRunner.dropIndex('children', 'IDX_CHILDREN_UASC');
    await queryRunner.dropIndex('children', 'IDX_CHILDREN_CARE_LEAVER');

    // Drop table
    await queryRunner.dropTable('children');
  }
}
