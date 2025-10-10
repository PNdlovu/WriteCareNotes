/**
 * Database Migration: Create Leaving Care Finances Table
 * 
 * Tracks financial support for 16+ care leavers
 * Grants, allowances, savings, budgeting
 */

import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateLeavingCareFinances1728518400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'leaving_care_finances',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'childId',
            type: 'uuid',
            isNullable: false
          },

          // GRANTS
          {
            name: 'settingUpHomeGrant',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0
          },
          {
            name: 'settingUpHomeGrantDate',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'educationGrant',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0
          },
          {
            name: 'educationGrantDate',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'drivingLessonsGrant',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0
          },
          {
            name: 'drivingLessonsGrantDate',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'birthdayAllowance',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0
          },
          {
            name: 'christmasAllowance',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0
          },
          {
            name: 'totalGrantsReceived',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0
          },

          // MONTHLY ALLOWANCE
          {
            name: 'monthlyAllowance',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0
          },
          {
            name: 'allowanceFrequency',
            type: 'varchar',
            length: '50',
            default: "'monthly'"
          },
          {
            name: 'lastPaymentDate',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'nextPaymentDate',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'paymentMethod',
            type: 'varchar',
            length: '100',
            isNullable: true
          },
          {
            name: 'bankAccountNumber',
            type: 'varchar',
            length: '100',
            isNullable: true
          },
          {
            name: 'bankSortCode',
            type: 'varchar',
            length: '20',
            isNullable: true
          },

          // SAVINGS
          {
            name: 'savingsBalance',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0
          },
          {
            name: 'savingsInterestRate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0
          },
          {
            name: 'savingsAccountProvider',
            type: 'varchar',
            length: '100',
            isNullable: true
          },

          // BUDGETING
          {
            name: 'estimatedMonthlyExpenses',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0
          },
          {
            name: 'budgetBreakdown',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'monthlySurplus',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0
          },

          // DEBTS
          {
            name: 'totalDebts',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0
          },
          {
            name: 'debts',
            type: 'jsonb',
            isNullable: true
          },

          // EMPLOYMENT
          {
            name: 'employmentIncome',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0
          },
          {
            name: 'employer',
            type: 'varchar',
            length: '100',
            isNullable: true
          },
          {
            name: 'employmentStatus',
            type: 'varchar',
            length: '50',
            isNullable: true
          },

          // BENEFITS
          {
            name: 'benefits',
            type: 'jsonb',
            isNullable: true
          },

          // FINANCIAL LITERACY
          {
            name: 'hasBankAccount',
            type: 'boolean',
            default: false
          },
          {
            name: 'hasBudgetPlan',
            type: 'boolean',
            default: false
          },
          {
            name: 'attendedFinancialLiteracyTraining',
            type: 'boolean',
            default: false
          },
          {
            name: 'financialLiteracyTrainingDate',
            type: 'timestamptz',
            isNullable: true
          },

          // AUDIT
          {
            name: 'currency',
            type: 'varchar',
            length: '100',
            default: "'GBP'"
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true
          },
          {
            name: 'managedBy',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP'
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
          }
        ]
      }),
      true
    );

    // Add foreign key to children table
    await queryRunner.createForeignKey(
      'leaving_care_finances',
      new TableForeignKey({
        columnNames: ['childId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'children',
        onDelete: 'CASCADE'
      })
    );

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_leaving_care_finances_child ON leaving_care_finances(childId);
      CREATE INDEX idx_leaving_care_finances_payment_date ON leaving_care_finances(nextPaymentDate);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('leaving_care_finances');
  }
}
