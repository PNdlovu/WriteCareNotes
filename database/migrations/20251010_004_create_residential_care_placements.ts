/**
 * Database Migration: Create Residential Care Placements Table
 * 
 * Manages children's home placements (NOT foster care)
 * Room assignments, peer groups, key workers
 */

import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateResidentialCarePlacements1728518700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'residential_care_placements',
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

          // CARE HOME DETAILS
          {
            name: 'careHomeId',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'careHomeName',
            type: 'varchar',
            length: '200',
            isNullable: false
          },
          {
            name: 'careHomeType',
            type: 'varchar',
            length: '50',
            isNullable: false
          },
          {
            name: 'careHomeAddress',
            type: 'text',
            isNullable: false
          },
          {
            name: 'careHomePostcode',
            type: 'varchar',
            length: '50',
            isNullable: true
          },
          {
            name: 'careHomeLocalAuthority',
            type: 'varchar',
            length: '100',
            isNullable: true
          },
          {
            name: 'ofstedRegistrationNumber',
            type: 'varchar',
            length: '50',
            isNullable: true
          },
          {
            name: 'ofstedRating',
            type: 'varchar',
            length: '50',
            isNullable: true
          },

          // ROOM ASSIGNMENT
          {
            name: 'roomNumber',
            type: 'varchar',
            length: '50',
            isNullable: true
          },
          {
            name: 'roomType',
            type: 'varchar',
            length: '50',
            isNullable: true
          },
          {
            name: 'floor',
            type: 'int',
            isNullable: true
          },
          {
            name: 'ensuiteRoom',
            type: 'boolean',
            default: false
          },
          {
            name: 'accessibleRoom',
            type: 'boolean',
            default: false
          },

          // PLACEMENT DATES
          {
            name: 'startDate',
            type: 'timestamptz',
            isNullable: false
          },
          {
            name: 'endDate',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'planned'"
          },
          {
            name: 'isEmergencyPlacement',
            type: 'boolean',
            default: false
          },
          {
            name: 'plannedEndDate',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'endReason',
            type: 'varchar',
            length: '50',
            isNullable: true
          },
          {
            name: 'endReasonDetails',
            type: 'text',
            isNullable: true
          },

          // CAPACITY & STAFFING
          {
            name: 'homeCapacity',
            type: 'int',
            default: 6
          },
          {
            name: 'currentOccupancy',
            type: 'int',
            default: 0
          },
          {
            name: 'staffChildRatio',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 3.0
          },
          {
            name: 'has24HourCare',
            type: 'boolean',
            default: true
          },
          {
            name: 'registeredManager',
            type: 'varchar',
            length: '100',
            isNullable: true
          },
          {
            name: 'registeredManagerContact',
            type: 'varchar',
            length: '100',
            isNullable: true
          },

          // KEY WORKER
          {
            name: 'keyWorkerId',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'keyWorkerName',
            type: 'varchar',
            length: '100',
            isNullable: true
          },
          {
            name: 'keyWorkerEmail',
            type: 'varchar',
            length: '100',
            isNullable: true
          },
          {
            name: 'keyWorkerPhone',
            type: 'varchar',
            length: '50',
            isNullable: true
          },
          {
            name: 'deputyKeyWorkerName',
            type: 'varchar',
            length: '100',
            isNullable: true
          },

          // PEER GROUP
          {
            name: 'peerGroup',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'numberOfPeers',
            type: 'int',
            default: 0
          },
          {
            name: 'peerGroupAgeRange',
            type: 'varchar',
            length: '20',
            isNullable: true
          },
          {
            name: 'mixedGenderHome',
            type: 'boolean',
            default: false
          },

          // PLACEMENT STABILITY
          {
            name: 'numberOfPreviousPlacementBreakdowns',
            type: 'int',
            default: 0
          },
          {
            name: 'placementStabilityRating',
            type: 'varchar',
            length: '50',
            isNullable: true
          },
          {
            name: 'stabilityIndicators',
            type: 'jsonb',
            isNullable: true
          },

          // REGULATIONS
          {
            name: 'regulation25Restriction',
            type: 'boolean',
            default: false
          },
          {
            name: 'regulation25Details',
            type: 'text',
            isNullable: true
          },
          {
            name: 'regulation25ReviewDate',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'secureAccommodationOrder',
            type: 'boolean',
            default: false
          },
          {
            name: 'secureOrderExpiryDate',
            type: 'timestamptz',
            isNullable: true
          },

          // PLACEMENT PLAN
          {
            name: 'placementPurpose',
            type: 'text',
            isNullable: true
          },
          {
            name: 'placementObjectives',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'expectedDuration',
            type: 'varchar',
            length: '50',
            isNullable: true
          },
          {
            name: 'exitStrategy',
            type: 'text',
            isNullable: true
          },

          // CONTACT & VISITS
          {
            name: 'visitingArrangements',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'canHaveOvernightVisitors',
            type: 'boolean',
            default: true
          },
          {
            name: 'canLeaveHomeUnaccompanied',
            type: 'boolean',
            default: true
          },

          // FINANCIAL
          {
            name: 'weeklyPlacementCost',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0
          },
          {
            name: 'weeklyPocketMoney',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0
          },
          {
            name: 'fundingLocalAuthority',
            type: 'varchar',
            length: '100',
            isNullable: true
          },

          // SAFEGUARDING
          {
            name: 'riskAssessment',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'requiresSingleOccupancyHome',
            type: 'boolean',
            default: false
          },
          {
            name: 'specialSupervisionNeeds',
            type: 'text',
            isNullable: true
          },

          // REVIEWS
          {
            name: 'lastReviewDate',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'nextReviewDate',
            type: 'timestamptz',
            isNullable: true
          },
          {
            name: 'reviewOutcome',
            type: 'varchar',
            length: '50',
            isNullable: true
          },
          {
            name: 'reviewNotes',
            type: 'text',
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
      'residential_care_placements',
      new TableForeignKey({
        columnNames: ['childId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'children',
        onDelete: 'CASCADE'
      })
    );

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_residential_placements_child ON residential_care_placements(childId);
      CREATE INDEX idx_residential_placements_care_home ON residential_care_placements(careHomeId);
      CREATE INDEX idx_residential_placements_status ON residential_care_placements(status);
      CREATE INDEX idx_residential_placements_dates ON residential_care_placements(startDate, endDate);
      CREATE INDEX idx_residential_placements_review ON residential_care_placements(nextReviewDate);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('residential_care_placements');
  }
}
