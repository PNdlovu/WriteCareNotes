/**
 * Database Migration: Create Developmental Milestones Table
 * 
 * Tracks early years development for 0-5 year olds
 * Motor skills, language, social-emotional, cognitive, self-care
 */

import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateDevelopmentalMilestones1728518600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'developmental_milestones',
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

          // MILESTONE DETAILS
          {
            name: 'domain',
            type: 'varchar',
            length: '50',
            isNullable: false
          },
          {
            name: 'ageGroup',
            type: 'varchar',
            length: '20',
            isNullable: false
          },
          {
            name: 'milestoneName',
            type: 'varchar',
            length: '200',
            isNullable: false
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'not_assessed'"
          },

          // ASSESSMENT
          {
            name: 'achieved',
            type: 'boolean',
            default: false
          },
          {
            name: 'achievedDate',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'achievedAtAgeMonths',
            type: 'int',
            isNullable: true
          },
          {
            name: 'expectedByDate',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'isDelayed',
            type: 'boolean',
            default: false
          },
          {
            name: 'delayInMonths',
            type: 'int',
            default: 0
          },

          // OBSERVATION
          {
            name: 'lastObservationDate',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'observationNotes',
            type: 'text',
            isNullable: true
          },
          {
            name: 'observedBy',
            type: 'varchar',
            length: '100',
            isNullable: true
          },
          {
            name: 'observationMethod',
            type: 'varchar',
            length: '50',
            isNullable: true
          },

          // INTERVENTION
          {
            name: 'requiresIntervention',
            type: 'boolean',
            default: false
          },
          {
            name: 'interventionPlan',
            type: 'text',
            isNullable: true
          },
          {
            name: 'specialist',
            type: 'varchar',
            length: '200',
            isNullable: true
          },
          {
            name: 'specialistReferralDate',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'interventionStatus',
            type: 'varchar',
            length: '50',
            isNullable: true
          },

          // PROGRESS
          {
            name: 'progressNotes',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'progressScore',
            type: 'int',
            default: 0
          },
          {
            name: 'trend',
            type: 'varchar',
            length: '50',
            isNullable: true
          },

          // NORMS COMPARISON
          {
            name: 'withinNormalRange',
            type: 'boolean',
            default: true
          },
          {
            name: 'normativeComparison',
            type: 'text',
            isNullable: true
          },
          {
            name: 'percentileRank',
            type: 'int',
            default: 50
          },

          // RED FLAGS
          {
            name: 'redFlag',
            type: 'boolean',
            default: false
          },
          {
            name: 'redFlagReason',
            type: 'text',
            isNullable: true
          },
          {
            name: 'redFlagReportedDate',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'redFlagReportedTo',
            type: 'varchar',
            length: '100',
            isNullable: true
          },

          // ACTIVITIES & RESOURCES
          {
            name: 'supportingActivities',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'resources',
            type: 'jsonb',
            isNullable: true
          },

          // AUDIT
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

    // Add foreign key
    await queryRunner.createForeignKey(
      'developmental_milestones',
      new TableForeignKey({
        columnNames: ['childId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'children',
        onDelete: 'CASCADE'
      })
    );

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_dev_milestones_child ON developmental_milestones(childId);
      CREATE INDEX idx_dev_milestones_domain ON developmental_milestones(domain);
      CREATE INDEX idx_dev_milestones_age_group ON developmental_milestones(ageGroup);
      CREATE INDEX idx_dev_milestones_status ON developmental_milestones(status);
      CREATE INDEX idx_dev_milestones_red_flag ON developmental_milestones(redFlag);
      CREATE INDEX idx_dev_milestones_delayed ON developmental_milestones(isDelayed);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('developmental_milestones');
  }
}
