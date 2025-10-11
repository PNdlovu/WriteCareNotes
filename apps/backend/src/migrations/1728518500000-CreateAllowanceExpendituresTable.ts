import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration: Create Allowance Expenditures Table
 * 
 * Creates table for tracking allowance spending (clothing, birthday, festival, education)
 * with receipt management and approval workflows.
 * 
 * FEATURES:
 * - 25+ allowance types (clothing, birthday, festival, education, cultural, hobbies)
 * - Receipt image upload and verification
 * - Approval workflows (social worker → manager for high value)
 * - Budget vs actual tracking
 * - Quarterly allowance tracking
 * - Cultural/religious needs support (Equality Act 2010)
 * 
 * COMPLIANCE:
 * - Care Planning Regulations 2010 (England)
 * - Looked After Children Regulations 2009 (Scotland)
 * - Care Planning Regulations 2015 (Wales)
 * - Children Order 1995 (Northern Ireland)
 * - Tusla guidance (Ireland)
 * - Equality Act 2010 (cultural/religious needs)
 */
export class CreateAllowanceExpendituresTable1728518500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "allowance_type_enum" AS ENUM (
        'CLOTHING_SEASONAL',
        'CLOTHING_SCHOOL_UNIFORM',
        'CLOTHING_SPORTS',
        'CLOTHING_SPECIAL_OCCASION',
        'FOOTWEAR',
        'BIRTHDAY_GRANT',
        'CHRISTMAS_GRANT',
        'EID_GRANT',
        'DIWALI_GRANT',
        'HANUKKAH_GRANT',
        'FESTIVAL_OTHER',
        'EDUCATION_SCHOOL_TRIP',
        'EDUCATION_EQUIPMENT',
        'EDUCATION_EXAM_FEES',
        'EDUCATION_MUSIC_LESSONS',
        'EDUCATION_TUTORING',
        'CULTURAL_ACTIVITIES',
        'RELIGIOUS_ACTIVITIES',
        'LANGUAGE_CLASSES',
        'HOBBIES_SPORTS',
        'HOBBIES_ARTS',
        'HOBBIES_MUSIC',
        'HOBBIES_OTHER',
        'PERSONAL_CARE_TOILETRIES',
        'PERSONAL_CARE_HAIR',
        'PERSONAL_CARE_OPTICAL',
        'PERSONAL_CARE_DENTAL',
        'TRAVEL_HOME_VISIT',
        'TECHNOLOGY',
        'OTHER'
      );
    `);

    await queryRunner.query(`
      CREATE TYPE "approval_status_enum" AS ENUM (
        'PENDING',
        'APPROVED',
        'REJECTED',
        'ESCALATED'
      );
    `);

    await queryRunner.query(`
      CREATE TYPE "receipt_status_enum" AS ENUM (
        'PENDING',
        'UPLOADED',
        'VERIFIED',
        'REJECTED',
        'MISSING'
      );
    `);

    // Create table
    await queryRunner.createTable(
      new Table({
        name: 'allowance_expenditures',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          // Child
          {
            name: 'childId',
            type: 'uuid',
            isNullable: false,
          },
          // Allowance Type
          {
            name: 'allowanceType',
            type: 'allowance_type_enum',
            isNullable: false,
          },
          {
            name: 'category',
            type: 'var char',
            length: '100',
            isNullable: false,
            comment: 'CLOTHING, BIRTHDAY, FESTIVAL, EDUCATION, etc.',
          },
          // Amount
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'currency',
            type: 'var char',
            length: '3',
            default: "'GBP'",
          },
          // Budget Tracking
          {
            name: 'budgetAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'budgetRemaining',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'exceedsBudget',
            type: 'boolean',
            default: false,
          },
          // Purchase Details
          {
            name: 'itemDescription',
            type: 'var char',
            length: '500',
            isNullable: false,
          },
          {
            name: 'vendor',
            type: 'var char',
            length: '255',
            isNullable: true,
          },
          {
            name: 'purchaseDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'quarter',
            type: 'int',
            isNullable: true,
            comment: '1-4 for quarterly allowances',
          },
          {
            name: 'year',
            type: 'int',
            isNullable: true,
          },
          // Approval Workflow
          {
            name: 'approvalStatus',
            type: 'approval_status_enum',
            default: "'PENDING'",
          },
          {
            name: 'requestedByStaffId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'requestedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'approvedByStaffId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'approvedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'approvalNotes',
            type: 'var char',
            length: '1000',
            isNullable: true,
          },
          // High-value escalation
          {
            name: 'requiresManagerApproval',
            type: 'boolean',
            default: false,
          },
          {
            name: 'escalatedToManagerId',
            type: 'uuid',
            isNullable: true,
          },
          // Receipt Management
          {
            name: 'receiptStatus',
            type: 'receipt_status_enum',
            default: "'PENDING'",
          },
          {
            name: 'receiptImageUrl',
            type: 'var char',
            length: '500',
            isNullable: true,
          },
          {
            name: 'receiptImages',
            type: 'jsonb',
            isNullable: true,
            comment: 'Array of receipt image URLs',
          },
          {
            name: 'receiptUploadedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'receiptUploadedByStaffId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'receiptVerifiedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'receiptVerifiedByStaffId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'receiptRejectionReason',
            type: 'var char',
            length: '1000',
            isNullable: true,
          },
          // Child Involvement
          {
            name: 'childWasPresent',
            type: 'boolean',
            default: false,
          },
          {
            name: 'childChose',
            type: 'boolean',
            default: false,
          },
          {
            name: 'childFeedback',
            type: 'var char',
            length: '1000',
            isNullable: true,
          },
          // Cultural/Religious
          {
            name: 'isCulturalNeed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isReligiousNeed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'culturalReligiousContext',
            type: 'var char',
            length: '500',
            isNullable: true,
          },
          // Linked Transactions
          {
            name: 'linkedPocketMoneyTransactionId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'linkedSavingsWithdrawalId',
            type: 'uuid',
            isNullable: true,
          },
          // Notes & Metadata
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          // Audit Trail
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'createdBy',
            type: 'var char',
            length: '255',
            isNullable: false,
          },
          {
            name: 'updatedBy',
            type: 'var char',
            length: '255',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'allowance_expenditures',
      new TableIndex({
        name: 'idx_ae_child_id',
        columnNames: ['childId'],
      }),
    );

    await queryRunner.createIndex(
      'allowance_expenditures',
      new TableIndex({
        name: 'idx_ae_allowance_type',
        columnNames: ['allowanceType'],
      }),
    );

    await queryRunner.createIndex(
      'allowance_expenditures',
      new TableIndex({
        name: 'idx_ae_approval_status',
        columnNames: ['approvalStatus'],
      }),
    );

    await queryRunner.createIndex(
      'allowance_expenditures',
      new TableIndex({
        name: 'idx_ae_receipt_status',
        columnNames: ['receiptStatus'],
      }),
    );

    await queryRunner.createIndex(
      'allowance_expenditures',
      new TableIndex({
        name: 'idx_ae_purchase_date',
        columnNames: ['purchaseDate'],
      }),
    );

    await queryRunner.createIndex(
      'allowance_expenditures',
      new TableIndex({
        name: 'idx_ae_quarter_year',
        columnNames: ['quarter', 'year'],
      }),
    );

    await queryRunner.createIndex(
      'allowance_expenditures',
      new TableIndex({
        name: 'idx_ae_category',
        columnNames: ['category'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'allowance_expenditures',
      new TableForeignKey({
        columnNames: ['childId'],
        referencedTableName: 'children',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_ae_child',
      }),
    );

    await queryRunner.createForeignKey(
      'allowance_expenditures',
      new TableForeignKey({
        columnNames: ['requestedByStaffId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_ae_requested_staff',
      }),
    );

    await queryRunner.createForeignKey(
      'allowance_expenditures',
      new TableForeignKey({
        columnNames: ['approvedByStaffId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_ae_approved_staff',
      }),
    );

    await queryRunner.createForeignKey(
      'allowance_expenditures',
      new TableForeignKey({
        columnNames: ['escalatedToManagerId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_ae_manager',
      }),
    );

    await queryRunner.createForeignKey(
      'allowance_expenditures',
      new TableForeignKey({
        columnNames: ['receiptUploadedByStaffId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_ae_receipt_uploaded_staff',
      }),
    );

    await queryRunner.createForeignKey(
      'allowance_expenditures',
      new TableForeignKey({
        columnNames: ['receiptVerifiedByStaffId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_ae_receipt_verified_staff',
      }),
    );

    await queryRunner.createForeignKey(
      'allowance_expenditures',
      new TableForeignKey({
        columnNames: ['linkedPocketMoneyTransactionId'],
        referencedTableName: 'pocket_money_transactions',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_ae_pocket_money',
      }),
    );

    await queryRunner.createForeignKey(
      'allowance_expenditures',
      new TableForeignKey({
        columnNames: ['linkedSavingsWithdrawalId'],
        referencedTableName: 'child_savings_transactions',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_ae_savings_withdrawal',
      }),
    );

    // Create trigger for updatedAt
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_allowance_expenditures_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_update_allowance_expenditures_updated_at
      BEFORE UPDATE ON allowance_expenditures
      FOR EACH ROW
      EXECUTE FUNCTION update_allowance_expenditures_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_update_allowance_expenditures_updated_at ON allowance_expenditures;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_allowance_expenditures_updated_at();`);

    // Drop foreign keys
    await queryRunner.dropForeignKey('allowance_expenditures', 'fk_ae_savings_withdrawal');
    await queryRunner.dropForeignKey('allowance_expenditures', 'fk_ae_pocket_money');
    await queryRunner.dropForeignKey('allowance_expenditures', 'fk_ae_receipt_verified_staff');
    await queryRunner.dropForeignKey('allowance_expenditures', 'fk_ae_receipt_uploaded_staff');
    await queryRunner.dropForeignKey('allowance_expenditures', 'fk_ae_manager');
    await queryRunner.dropForeignKey('allowance_expenditures', 'fk_ae_approved_staff');
    await queryRunner.dropForeignKey('allowance_expenditures', 'fk_ae_requested_staff');
    await queryRunner.dropForeignKey('allowance_expenditures', 'fk_ae_child');

    // Drop indexes
    await queryRunner.dropIndex('allowance_expenditures', 'idx_ae_category');
    await queryRunner.dropIndex('allowance_expenditures', 'idx_ae_quarter_year');
    await queryRunner.dropIndex('allowance_expenditures', 'idx_ae_purchase_date');
    await queryRunner.dropIndex('allowance_expenditures', 'idx_ae_receipt_status');
    await queryRunner.dropIndex('allowance_expenditures', 'idx_ae_approval_status');
    await queryRunner.dropIndex('allowance_expenditures', 'idx_ae_allowance_type');
    await queryRunner.dropIndex('allowance_expenditures', 'idx_ae_child_id');

    // Drop table
    await queryRunner.dropTable('allowance_expenditures');

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "receipt_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "approval_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "allowance_type_enum";`);
  }
}
