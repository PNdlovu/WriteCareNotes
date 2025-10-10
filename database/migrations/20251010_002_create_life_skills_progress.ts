/**
 * Database Migration: Create Life Skills Progress Table
 * 
 * Tracks independent living skills development for care leavers
 * Cooking, budgeting, job search, independent living
 */

import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateLifeSkillsProgress1728518500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'life_skills_progress',
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

          // SKILL DETAILS
          {
            name: 'skillName',
            type: 'varchar',
            length: '100',
            isNullable: false
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
            isNullable: false
          },
          {
            name: 'skillLevel',
            type: 'varchar',
            length: '50',
            default: "'not_started'"
          },
          {
            name: 'priority',
            type: 'int',
            default: 0
          },

          // PROGRESS
          {
            name: 'completed',
            type: 'boolean',
            default: false
          },
          {
            name: 'completedDate',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'progressPercentage',
            type: 'int',
            default: 0
          },
          {
            name: 'startedDate',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'targetCompletionDate',
            type: 'timestamptz',
            isNullable: true
          },

          // TRAINING
          {
            name: 'trainingProvided',
            type: 'boolean',
            default: false
          },
          {
            name: 'trainingProvider',
            type: 'varchar',
            length: '200',
            isNullable: true
          },
          {
            name: 'trainingDate',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'trainingCertificate',
            type: 'varchar',
            length: '200',
            isNullable: true
          },
          {
            name: 'supportWorker',
            type: 'varchar',
            length: '200',
            isNullable: true
          },

          // ASSESSMENT
          {
            name: 'assessmentMethod',
            type: 'varchar',
            length: '50',
            isNullable: true
          },
          {
            name: 'lastAssessmentDate',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'assessmentNotes',
            type: 'text',
            isNullable: true
          },
          {
            name: 'assessmentScore',
            type: 'int',
            default: 0
          },

          // PRACTICE
          {
            name: 'practiceCount',
            type: 'int',
            default: 0
          },
          {
            name: 'lastPracticeDate',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'practiceRecords',
            type: 'jsonb',
            isNullable: true
          },

          // YOUNG PERSON NOTES
          {
            name: 'notes',
            type: 'text',
            isNullable: true
          },
          {
            name: 'challenges',
            type: 'text',
            isNullable: true
          },
          {
            name: 'achievements',
            type: 'text',
            isNullable: true
          },
          {
            name: 'confidenceLevel',
            type: 'int',
            default: 5
          },

          // RESOURCES
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
      'life_skills_progress',
      new TableForeignKey({
        columnNames: ['childId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'children',
        onDelete: 'CASCADE'
      })
    );

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_life_skills_child ON life_skills_progress(childId);
      CREATE INDEX idx_life_skills_category ON life_skills_progress(category);
      CREATE INDEX idx_life_skills_completed ON life_skills_progress(completed);
      CREATE INDEX idx_life_skills_target_date ON life_skills_progress(targetCompletionDate);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('life_skills_progress');
  }
}
