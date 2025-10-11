import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration: Create Pocket Money Transactions Table
 * 
 * Creates table for tracking weekly pocket money disbursements
 * with British Isles age-based rates, variance tracking, and approval workflows.
 * 
 * FEATURES:
 * - 8 British Isles jurisdictions with age-based rates
 * - Weekly disbursement tracking
 * - variance tracking (expected vs actual)
 * - Child receipt confirmation
 * - Refusal tracking
 * - Withholding tracking (manager approval)
 * - Deferral tracking
 * - Savings transfer integration
 * 
 * COMPLIANCE:
 * - Care Planning Regulations 2010 (England)
 * - Looked After Children Regulations 2009 (Scotland)
 * - Care Planning Regulations 2015 (Wales)
 * - Children Order 1995 (Northern Ireland)
 * - Tusla guidance (Ireland)
 */
export class CreatePocketMoneyTransactionsTable1728518400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "british_isles_jurisdiction_enum" AS ENUM (
        'ENGLAND',
        'SCOTLAND',
        'WALES',
        'NORTHERN_IRELAND',
        'IRELAND',
        'JERSEY',
        'GUERNSEY',
        'ISLE_OF_MAN'
      );
    `);

    await queryRunner.query(`
      CREATE TYPE "disbursement_method_enum" AS ENUM (
        'CASH',
        'BANK_TRANSFER',
        'PREPAID_CARD',
        'DIRECT_TO_CHILD',
        'HELD_IN_TRUST'
      );
    `);

    await queryRunner.query(`
      CREATE TYPE "disbursement_status_enum" AS ENUM (
        'PENDING',
        'DISBURSED',
        'REFUSED',
        'WITHHELD',
        'DEFERRED',
        'PARTIALLY_DISBURSED',
        'CANCELLED'
      );
    `);

    // Create table
    await queryRunner.createTable(
      new Table({
        name: 'pocket_money_transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          // Child & Placement
          {
            name: 'childId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'jurisdiction',
            type: 'british_isles_jurisdiction_enum',
            isNullable: false,
          },
          // Week Tracking
          {
            name: 'weekNumber',
            type: 'int',
            isNullable: false,
            comment: 'Week number (1-53)',
          },
          {
            name: 'year',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'weekStartDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'weekEndDate',
            type: 'date',
            isNullable: false,
          },
          // Expected Amount (from rates)
          {
            name: 'expectedAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'ageRange',
            type: 'var char',
            length: '20',
            isNullable: false,
            comment: '5-7, 8-10, 11-15, 16-18',
          },
          {
            name: 'rateSource',
            type: 'var char',
            length: '255',
            isNullable: true,
            comment: 'Source of rate (statutory guidance, LA policy)',
          },
          // Disbursement
          {
            name: 'status',
            type: 'disbursement_status_enum',
            default: "'PENDING'",
          },
          {
            name: 'disbursedAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'disbursementMethod',
            type: 'disbursement_method_enum',
            isNullable: true,
          },
          {
            name: 'disbursedDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'disbursedByStaffId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'disbursementNotes',
            type: 'text',
            isNullable: true,
          },
          // variance Tracking
          {
            name: 'variance',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'hasVariance',
            type: 'boolean',
            default: false,
          },
          {
            name: 'varianceReason',
            type: 'var char',
            length: '1000',
            isNullable: true,
          },
          // Child Receipt
          {
            name: 'receiptConfirmed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'childSignature',
            type: 'var char',
            length: '500',
            isNullable: true,
            comment: 'Digital signature or confirmation',
          },
          {
            name: 'childComment',
            type: 'var char',
            length: '1000',
            isNullable: true,
          },
          // Refusal Tracking
          {
            name: 'wasRefused',
            type: 'boolean',
            default: false,
          },
          {
            name: 'refusalReason',
            type: 'var char',
            length: '1000',
            isNullable: true,
          },
          {
            name: 'refusalTimestamp',
            type: 'timestamp',
            isNullable: true,
          },
          // Withholding (requires manager approval)
          {
            name: 'wasWithheld',
            type: 'boolean',
            default: false,
          },
          {
            name: 'withholdingReason',
            type: 'var char',
            length: '1000',
            isNullable: true,
          },
          {
            name: 'withholdingApprovedByManagerId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'withholdingApprovalDate',
            type: 'timestamp',
            isNullable: true,
          },
          // Deferral (child absent, postpone to next week)
          {
            name: 'wasDeferred',
            type: 'boolean',
            default: false,
          },
          {
            name: 'deferralReason',
            type: 'var char',
            length: '1000',
            isNullable: true,
          },
          {
            name: 'deferToDate',
            type: 'date',
            isNullable: true,
          },
          // Savings Transfer
          {
            name: 'transferredToSavings',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'savingsAccountId',
            type: 'uuid',
            isNullable: true,
          },
          // Currency
          {
            name: 'currency',
            type: 'var char',
            length: '3',
            default: "'GBP'",
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
      'pocket_money_transactions',
      new TableIndex({
        name: 'idx_pmt_child_id',
        columnNames: ['childId'],
      }),
    );

    await queryRunner.createIndex(
      'pocket_money_transactions',
      new TableIndex({
        name: 'idx_pmt_week',
        columnNames: ['weekNumber', 'year'],
      }),
    );

    await queryRunner.createIndex(
      'pocket_money_transactions',
      new TableIndex({
        name: 'idx_pmt_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'pocket_money_transactions',
      new TableIndex({
        name: 'idx_pmt_disbursed_date',
        columnNames: ['disbursedDate'],
      }),
    );

    await queryRunner.createIndex(
      'pocket_money_transactions',
      new TableIndex({
        name: 'idx_pmt_jurisdiction',
        columnNames: ['jurisdiction'],
      }),
    );

    await queryRunner.createIndex(
      'pocket_money_transactions',
      new TableIndex({
        name: 'idx_pmt_child_week',
        columnNames: ['childId', 'weekNumber', 'year'],
        isUnique: true,
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'pocket_money_transactions',
      new TableForeignKey({
        columnNames: ['childId'],
        referencedTableName: 'children',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_pmt_child',
      }),
    );

    await queryRunner.createForeignKey(
      'pocket_money_transactions',
      new TableForeignKey({
        columnNames: ['disbursedByStaffId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_pmt_disbursed_staff',
      }),
    );

    await queryRunner.createForeignKey(
      'pocket_money_transactions',
      new TableForeignKey({
        columnNames: ['withholdingApprovedByManagerId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_pmt_manager',
      }),
    );

    await queryRunner.createForeignKey(
      'pocket_money_transactions',
      new TableForeignKey({
        columnNames: ['savingsAccountId'],
        referencedTableName: 'child_savings_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_pmt_savings_account',
      }),
    );

    // Create trigger for updatedAt
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_pocket_money_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_update_pocket_money_updated_at
      BEFORE UPDATE ON pocket_money_transactions
      FOR EACH ROW
      EXECUTE FUNCTION update_pocket_money_updated_at();
    `);

    // Create trigger to prevent duplicate weekly disbursements
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION check_duplicate_weekly_disbursement()
      RETURNS TRIGGER AS $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pocket_money_transactions
          WHERE "childId" = NEW."childId"
            AND "weekNumber" = NEW."weekNumber"
            AND "year" = NEW."year"
            ANDid != NEW.id
        ) THEN
          RAISE EXCEPTION 'Duplicate pocket money transaction for child % in week % of year %',
            NEW."childId", NEW."weekNumber", NEW."year";
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_check_duplicate_weekly_disbursement
      BEFORE INSERT OR UPDATE ON pocket_money_transactions
      FOR EACH ROW
      EXECUTE FUNCTION check_duplicate_weekly_disbursement();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_check_duplicate_weekly_disbursement ON pocket_money_transactions;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS check_duplicate_weekly_disbursement();`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_update_pocket_money_updated_at ON pocket_money_transactions;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_pocket_money_updated_at();`);

    // Drop foreign keys
    await queryRunner.dropForeignKey('pocket_money_transactions', 'fk_pmt_savings_account');
    await queryRunner.dropForeignKey('pocket_money_transactions', 'fk_pmt_manager');
    await queryRunner.dropForeignKey('pocket_money_transactions', 'fk_pmt_disbursed_staff');
    await queryRunner.dropForeignKey('pocket_money_transactions', 'fk_pmt_child');

    // Drop indexes
    await queryRunner.dropIndex('pocket_money_transactions', 'idx_pmt_child_week');
    await queryRunner.dropIndex('pocket_money_transactions', 'idx_pmt_jurisdiction');
    await queryRunner.dropIndex('pocket_money_transactions', 'idx_pmt_disbursed_date');
    await queryRunner.dropIndex('pocket_money_transactions', 'idx_pmt_status');
    await queryRunner.dropIndex('pocket_money_transactions', 'idx_pmt_week');
    await queryRunner.dropIndex('pocket_money_transactions', 'idx_pmt_child_id');

    // Drop table
    await queryRunner.dropTable('pocket_money_transactions');

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "disbursement_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "disbursement_method_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "british_isles_jurisdiction_enum";`);
  }
}
