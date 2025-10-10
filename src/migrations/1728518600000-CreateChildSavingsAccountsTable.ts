import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration: Create Child Savings Accounts & Transactions Tables
 * 
 * Creates tables for tracking children's savings accounts with deposits,
 * withdrawals, interest, and approval workflows.
 * 
 * FEATURES:
 * - Internal savings tracking (pocket money, allowances)
 * - External bank account integration (Junior ISA, Children's Account)
 * - Transaction history with approval workflows
 * - Interest calculation and application
 * - Savings goals tracking
 * - High-value withdrawal controls
 * - 16+ pathway: Trust accounts
 * 
 * COMPLIANCE:
 * - Care Planning Regulations 2010 (England) - Reg 5 (savings)
 * - Looked After Children Regulations 2009 (Scotland)
 * - Care Planning Regulations 2015 (Wales)
 * - Children Order 1995 (Northern Ireland)
 * - Children Act 1989 s22(3) (safeguarding property)
 * - Care Leavers Regulations 2010 (16-25 pathway)
 */
export class CreateChildSavingsAccountsTable1728518600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "savings_account_type_enum" AS ENUM (
        'INTERNAL_POCKET_MONEY',
        'INTERNAL_ALLOWANCE',
        'EXTERNAL_BANK_ACCOUNT',
        'TRUST_ACCOUNT'
      );
    `);

    await queryRunner.query(`
      CREATE TYPE "savings_transaction_type_enum" AS ENUM (
        'DEPOSIT',
        'WITHDRAWAL',
        'INTEREST',
        'TRANSFER_IN',
        'TRANSFER_OUT',
        'CORRECTION'
      );
    `);

    await queryRunner.query(`
      CREATE TYPE "withdrawal_status_enum" AS ENUM (
        'PENDING',
        'APPROVED',
        'REJECTED',
        'COMPLETED',
        'CANCELLED'
      );
    `);

    // ==================== CREATE CHILD_SAVINGS_ACCOUNTS TABLE ====================
    await queryRunner.createTable(
      new Table({
        name: 'child_savings_accounts',
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
          // Account Type
          {
            name: 'accountType',
            type: 'savings_account_type_enum',
            isNullable: false,
          },
          {
            name: 'accountName',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          // Account Status
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'ACTIVE'",
          },
          {
            name: 'openedDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'closedDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'closureReason',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          // Balance
          {
            name: 'currentBalance',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'GBP'",
          },
          {
            name: 'totalDeposits',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'totalWithdrawals',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'totalInterest',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          // External Bank Account
          {
            name: 'bankName',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'accountNumber',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Encrypted',
          },
          {
            name: 'sortCode',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Encrypted',
          },
          {
            name: 'accountHolderName',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'bankAccountOpenedDate',
            type: 'date',
            isNullable: true,
          },
          // Interest
          {
            name: 'interestRate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'interestFrequency',
            type: 'varchar',
            length: '50',
            default: "'MONTHLY'",
          },
          {
            name: 'lastInterestCalculatedDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'accruedInterest',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          // Savings Goal
          {
            name: 'savingsGoalAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'savingsGoalDescription',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'savingsGoalTargetDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'savingsGoalAchieved',
            type: 'boolean',
            default: false,
          },
          // Withdrawal Controls
          {
            name: 'highValueThreshold',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 50,
          },
          {
            name: 'requiresManagerApproval',
            type: 'boolean',
            default: false,
          },
          {
            name: 'pendingWithdrawals',
            type: 'int',
            default: 0,
          },
          // Staff
          {
            name: 'openedByStaffId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'closedByStaffId',
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
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'updatedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // ==================== CREATE CHILD_SAVINGS_TRANSACTIONS TABLE ====================
    await queryRunner.createTable(
      new Table({
        name: 'child_savings_transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          // Account
          {
            name: 'accountId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'childId',
            type: 'uuid',
            isNullable: false,
          },
          // Transaction
          {
            name: 'transactionType',
            type: 'savings_transaction_type_enum',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'GBP'",
          },
          {
            name: 'transactionDate',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '1000',
            isNullable: false,
          },
          // Balance Tracking
          {
            name: 'balanceBefore',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'balanceAfter',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          // Linked Records
          {
            name: 'linkedPocketMoneyTransactionId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'linkedAllowanceExpenditureId',
            type: 'uuid',
            isNullable: true,
          },
          // Withdrawal Approval
          {
            name: 'withdrawalStatus',
            type: 'withdrawal_status_enum',
            isNullable: true,
          },
          {
            name: 'requestedByStaffId',
            type: 'uuid',
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
            type: 'varchar',
            length: '1000',
            isNullable: true,
          },
          {
            name: 'requiresManagerApproval',
            type: 'boolean',
            default: false,
          },
          {
            name: 'managerApprovedByStaffId',
            type: 'uuid',
            isNullable: true,
          },
          // Disbursement
          {
            name: 'disbursementMethod',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'disbursedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'disbursedByStaffId',
            type: 'uuid',
            isNullable: true,
          },
          // Child Acknowledgement
          {
            name: 'childAcknowledged',
            type: 'boolean',
            default: false,
          },
          {
            name: 'childComment',
            type: 'varchar',
            length: '1000',
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
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'updatedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // ==================== CREATE INDEXES - ACCOUNTS ====================
    await queryRunner.createIndex(
      'child_savings_accounts',
      new TableIndex({
        name: 'idx_csa_child_id',
        columnNames: ['childId'],
      }),
    );

    await queryRunner.createIndex(
      'child_savings_accounts',
      new TableIndex({
        name: 'idx_csa_account_type',
        columnNames: ['accountType'],
      }),
    );

    await queryRunner.createIndex(
      'child_savings_accounts',
      new TableIndex({
        name: 'idx_csa_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'child_savings_accounts',
      new TableIndex({
        name: 'idx_csa_opened_date',
        columnNames: ['openedDate'],
      }),
    );

    // ==================== CREATE INDEXES - TRANSACTIONS ====================
    await queryRunner.createIndex(
      'child_savings_transactions',
      new TableIndex({
        name: 'idx_cst_account_id',
        columnNames: ['accountId'],
      }),
    );

    await queryRunner.createIndex(
      'child_savings_transactions',
      new TableIndex({
        name: 'idx_cst_child_id',
        columnNames: ['childId'],
      }),
    );

    await queryRunner.createIndex(
      'child_savings_transactions',
      new TableIndex({
        name: 'idx_cst_transaction_type',
        columnNames: ['transactionType'],
      }),
    );

    await queryRunner.createIndex(
      'child_savings_transactions',
      new TableIndex({
        name: 'idx_cst_transaction_date',
        columnNames: ['transactionDate'],
      }),
    );

    await queryRunner.createIndex(
      'child_savings_transactions',
      new TableIndex({
        name: 'idx_cst_withdrawal_status',
        columnNames: ['withdrawalStatus'],
      }),
    );

    // ==================== CREATE FOREIGN KEYS - ACCOUNTS ====================
    await queryRunner.createForeignKey(
      'child_savings_accounts',
      new TableForeignKey({
        columnNames: ['childId'],
        referencedTableName: 'children',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_csa_child',
      }),
    );

    await queryRunner.createForeignKey(
      'child_savings_accounts',
      new TableForeignKey({
        columnNames: ['openedByStaffId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        name: 'fk_csa_opened_staff',
      }),
    );

    await queryRunner.createForeignKey(
      'child_savings_accounts',
      new TableForeignKey({
        columnNames: ['closedByStaffId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_csa_closed_staff',
      }),
    );

    // ==================== CREATE FOREIGN KEYS - TRANSACTIONS ====================
    await queryRunner.createForeignKey(
      'child_savings_transactions',
      new TableForeignKey({
        columnNames: ['accountId'],
        referencedTableName: 'child_savings_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_cst_account',
      }),
    );

    await queryRunner.createForeignKey(
      'child_savings_transactions',
      new TableForeignKey({
        columnNames: ['childId'],
        referencedTableName: 'children',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_cst_child',
      }),
    );

    await queryRunner.createForeignKey(
      'child_savings_transactions',
      new TableForeignKey({
        columnNames: ['linkedPocketMoneyTransactionId'],
        referencedTableName: 'pocket_money_transactions',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_cst_pocket_money',
      }),
    );

    await queryRunner.createForeignKey(
      'child_savings_transactions',
      new TableForeignKey({
        columnNames: ['linkedAllowanceExpenditureId'],
        referencedTableName: 'allowance_expenditures',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_cst_allowance',
      }),
    );

    await queryRunner.createForeignKey(
      'child_savings_transactions',
      new TableForeignKey({
        columnNames: ['requestedByStaffId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_cst_requested_staff',
      }),
    );

    await queryRunner.createForeignKey(
      'child_savings_transactions',
      new TableForeignKey({
        columnNames: ['approvedByStaffId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_cst_approved_staff',
      }),
    );

    await queryRunner.createForeignKey(
      'child_savings_transactions',
      new TableForeignKey({
        columnNames: ['managerApprovedByStaffId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_cst_manager_staff',
      }),
    );

    await queryRunner.createForeignKey(
      'child_savings_transactions',
      new TableForeignKey({
        columnNames: ['disbursedByStaffId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_cst_disbursed_staff',
      }),
    );

    // ==================== CREATE TRIGGERS ====================
    // Trigger for updatedAt - accounts
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_child_savings_accounts_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_update_child_savings_accounts_updated_at
      BEFORE UPDATE ON child_savings_accounts
      FOR EACH ROW
      EXECUTE FUNCTION update_child_savings_accounts_updated_at();
    `);

    // Trigger for updatedAt - transactions
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_child_savings_transactions_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_update_child_savings_transactions_updated_at
      BEFORE UPDATE ON child_savings_transactions
      FOR EACH ROW
      EXECUTE FUNCTION update_child_savings_transactions_updated_at();
    `);

    // Trigger to prevent negative balance
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION check_savings_balance()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW."balanceAfter" < 0 THEN
          RAISE EXCEPTION 'Savings account balance cannot be negative. Current: %, After: %',
            NEW."balanceBefore", NEW."balanceAfter";
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_check_savings_balance
      BEFORE INSERT OR UPDATE ON child_savings_transactions
      FOR EACH ROW
      EXECUTE FUNCTION check_savings_balance();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_check_savings_balance ON child_savings_transactions;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS check_savings_balance();`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_update_child_savings_transactions_updated_at ON child_savings_transactions;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_child_savings_transactions_updated_at();`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_update_child_savings_accounts_updated_at ON child_savings_accounts;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_child_savings_accounts_updated_at();`);

    // Drop foreign keys - transactions
    await queryRunner.dropForeignKey('child_savings_transactions', 'fk_cst_disbursed_staff');
    await queryRunner.dropForeignKey('child_savings_transactions', 'fk_cst_manager_staff');
    await queryRunner.dropForeignKey('child_savings_transactions', 'fk_cst_approved_staff');
    await queryRunner.dropForeignKey('child_savings_transactions', 'fk_cst_requested_staff');
    await queryRunner.dropForeignKey('child_savings_transactions', 'fk_cst_allowance');
    await queryRunner.dropForeignKey('child_savings_transactions', 'fk_cst_pocket_money');
    await queryRunner.dropForeignKey('child_savings_transactions', 'fk_cst_child');
    await queryRunner.dropForeignKey('child_savings_transactions', 'fk_cst_account');

    // Drop foreign keys - accounts
    await queryRunner.dropForeignKey('child_savings_accounts', 'fk_csa_closed_staff');
    await queryRunner.dropForeignKey('child_savings_accounts', 'fk_csa_opened_staff');
    await queryRunner.dropForeignKey('child_savings_accounts', 'fk_csa_child');

    // Drop indexes - transactions
    await queryRunner.dropIndex('child_savings_transactions', 'idx_cst_withdrawal_status');
    await queryRunner.dropIndex('child_savings_transactions', 'idx_cst_transaction_date');
    await queryRunner.dropIndex('child_savings_transactions', 'idx_cst_transaction_type');
    await queryRunner.dropIndex('child_savings_transactions', 'idx_cst_child_id');
    await queryRunner.dropIndex('child_savings_transactions', 'idx_cst_account_id');

    // Drop indexes - accounts
    await queryRunner.dropIndex('child_savings_accounts', 'idx_csa_opened_date');
    await queryRunner.dropIndex('child_savings_accounts', 'idx_csa_status');
    await queryRunner.dropIndex('child_savings_accounts', 'idx_csa_account_type');
    await queryRunner.dropIndex('child_savings_accounts', 'idx_csa_child_id');

    // Drop tables
    await queryRunner.dropTable('child_savings_transactions');
    await queryRunner.dropTable('child_savings_accounts');

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "withdrawal_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "savings_transaction_type_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "savings_account_type_enum";`);
  }
}
