import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview British Isles Multi-Jurisdictional Compliance Migration
 * @module BritishIslesMultiJurisdictionalComplianceMigration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Database migration for comprehensive British Isles compliance
 * covering all 7 jurisdictions with cultural and heritage requirements.
 */

import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from 'typeorm';

export class BritishIslesMultiJurisdictionalCompliance1704067200000 implements MigrationInterface {
  name = 'BritishIslesMultiJurisdictionalCompliance1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // British Isles Compliance Master Table
    await queryRunner.createTable(new Table({
      name: 'british_isles_compliance',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'organizationId',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'assessmentDate',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'overallScore',
          type: 'decimal',
          precision: 5,
          scale: 2,
          isNullable: false,
        },
        {
          name: 'jurisdictionData',
          type: 'jsonb',
          isNullable: false,
        },
        {
          name: 'crossJurisdictionalRisks',
          type: 'text',
          isArray: true,
          default: 'ARRAY[]::text[]',
        },
        {
          name: 'recommendations',
          type: 'text',
          isArray: true,
          default: 'ARRAY[]::text[]',
        },
        {
          name: 'harmonizedMetrics',
          type: 'jsonb',
          isNullable: false,
          default: '{}',
        },
        {
          name: 'jurisdictionSpecificMetrics',
          type: 'jsonb',
          isNullable: false,
          default: '{}',
        },
        {
          name: 'assessmentNotes',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'assessedBy',
          type: 'uuid',
          isNullable: true,
        },
        {
          name: 'nextReviewDate',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'isActive',
          type: 'boolean',
          default: true,
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updatedAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Jersey Compliance Table
    await queryRunner.createTable(new Table({
      name: 'jersey_compliance',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'organizationId',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'assessmentDate',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'overallScore',
          type: 'decimal',
          precision: 5,
          scale: 2,
          isNullable: false,
        },
        {
          name: 'rating',
          type: 'var char',
          length: '50',
          isNullable: false,
        },
        {
          name: 'careStandardsScores',
          type: 'jsonb',
          isNullable: false,
          default: '{}',
        },
        {
          name: 'complianceGaps',
          type: 'text',
          isArray: true,
          default: 'ARRAY[]::text[]',
        },
        {
          name: 'recommendations',
          type: 'text',
          isArray: true,
          default: 'ARRAY[]::text[]',
        },
        {
          name: 'lastInspection',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'nextInspection',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'inspectionNotes',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'assessedBy',
          type: 'uuid',
          isNullable: true,
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updatedAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Guernsey Compliance Table
    await queryRunner.createTable(new Table({
      name: 'guernsey_compliance',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'organizationId',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'assessmentDate',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'overallScore',
          type: 'decimal',
          precision: 5,
          scale: 2,
          isNullable: false,
        },
        {
          name: 'rating',
          type: 'var char',
          length: '50',
          isNullable: false,
        },
        {
          name: 'standardsScores',
          type: 'jsonb',
          isNullable: false,
          default: '{}',
        },
        {
          name: 'guernseySpecificCompliance',
          type: 'jsonb',
          isNullable: false,
          default: '{}',
        },
        {
          name: 'complianceGaps',
          type: 'text',
          isArray: true,
          default: 'ARRAY[]::text[]',
        },
        {
          name: 'recommendations',
          type: 'text',
          isArray: true,
          default: 'ARRAY[]::text[]',
        },
        {
          name: 'lastInspection',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'nextInspection',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'inspectionNotes',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'assessedBy',
          type: 'uuid',
          isNullable: true,
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updatedAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Isle of Man Compliance Table
    await queryRunner.createTable(new Table({
      name: 'isle_of_man_compliance',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'organizationId',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'assessmentDate',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'overallScore',
          type: 'decimal',
          precision: 5,
          scale: 2,
          isNullable: false,
        },
        {
          name: 'rating',
          type: 'var char',
          length: '50',
          isNullable: false,
        },
        {
          name: 'careStandardsScores',
          type: 'jsonb',
          isNullable: false,
          default: '{}',
        },
        {
          name: 'manxCulturalCompliance',
          type: 'jsonb',
          isNullable: false,
          default: '{}',
        },
        {
          name: 'communityIntegrationScore',
          type: 'decimal',
          precision: 5,
          scale: 2,
          isNullable: false,
          default: '0',
        },
        {
          name: 'complianceGaps',
          type: 'text',
          isArray: true,
          default: 'ARRAY[]::text[]',
        },
        {
          name: 'recommendations',
          type: 'text',
          isArray: true,
          default: 'ARRAY[]::text[]',
        },
        {
          name: 'manxSpecificRecommendations',
          type: 'text',
          isArray: true,
          default: 'ARRAY[]::text[]',
        },
        {
          name: 'lastInspection',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'nextInspection',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'inspectionNotes',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'manxCulturalNotes',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'assessedBy',
          type: 'uuid',
          isNullable: true,
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updatedAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Regulatory Updates Table (Enhanced for all jurisdictions)
    await queryRunner.createTable(new Table({
      name: 'regulatory_updates',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'jurisdiction',
          type: 'var char',
          length: '50',
          isNullable: false,
        },
        {
          name: 'regulatoryBody',
          type: 'var char',
          length: '100',
          isNullable: false,
        },
        {
          name: 'title',
          type: 'var char',
          length: '255',
          isNullable: false,
        },
        {
          name: 'summary',
          type: 'text',
          isNullable: false,
        },
        {
          name: 'fullDescription',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'effectiveDate',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'impact',
          type: 'var char',
          length: '50',
          isNullable: false,
        },
        {
          name: 'actionRequired',
          type: 'boolean',
          default: false,
        },
        {
          name: 'affectedStandards',
          type: 'text',
          isArray: true,
          default: 'ARRAY[]::text[]',
        },
        {
          name: 'documentUrl',
          type: 'var char',
          length: '500',
          isNullable: true,
        },
        {
          name: 'notificationsSent',
          type: 'boolean',
          default: false,
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updatedAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Create indexes for performance
    await queryRunner.createIndex('british_isles_compliance', new Index({
      name: 'IDX_BRITISH_ISLES_COMPLIANCE_ORG_DATE',
      columnNames: ['organizationId', 'assessmentDate'],
    }));

    await queryRunner.createIndex('jersey_compliance', new Index({
      name: 'IDX_JERSEY_COMPLIANCE_ORG_DATE',
      columnNames: ['organizationId', 'assessmentDate'],
    }));

    await queryRunner.createIndex('guernsey_compliance', new Index({
      name: 'IDX_GUERNSEY_COMPLIANCE_ORG_DATE',
      columnNames: ['organizationId', 'assessmentDate'],
    }));

    await queryRunner.createIndex('isle_of_man_compliance', new Index({
      name: 'IDX_IOM_COMPLIANCE_ORG_DATE',
      columnNames: ['organizationId', 'assessmentDate'],
    }));

    await queryRunner.createIndex('regulatory_updates', new Index({
      name: 'IDX_REGULATORY_UPDATES_JURISDICTION_DATE',
      columnNames: ['jurisdiction', 'effectiveDate'],
    }));

    // Create foreign key const raints
    await queryRunner.createForeignKey('british_isles_compliance', new ForeignKey({
      columnNames: ['organizationId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('jersey_compliance', new ForeignKey({
      columnNames: ['organizationId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('guernsey_compliance', new ForeignKey({
      columnNames: ['organizationId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('isle_of_man_compliance', new ForeignKey({
      columnNames: ['organizationId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'CASCADE',
    }));

    // Insert sample regulatory updates for all jurisdictions
    await queryRunner.query(`
      INSERT INTO regulatory_updates (jurisdiction, regulatoryBody, title, summary, effectiveDate, impact, actionRequired, affectedStandards) VALUES
      ('england', 'CQC', 'Single Assessment Framework Update 2025', 'Updated assessment criteria focusing on person-centred outcomes', '2025-04-01', 'medium', true, ARRAY['safe', 'effective', 'caring']),
      ('scotland', 'Care Inspectorate', 'Quality Indicator Framework Enhancement', 'Enhanced quality indicators with digital integration', '2025-03-15', 'medium', true, ARRAY['wellbeing', 'leadership']),
      ('wales', 'CIW', 'Welsh Language Standards Update', 'Updated requirements for active offer of Welsh language services', '2025-05-01', 'high', true, ARRAY['wellbeing', 'care_support']),
      ('northern_ireland', 'RQIA', 'Cross-Border Care Coordination Framework', 'New framework for cross-border care coordination', '2025-06-01', 'medium', true, ARRAY['safety', 'effectiveness']),
      ('jersey', 'Jersey Care Commission', 'Community Integration Standards', 'Enhanced requirements for community integration and heritage preservation', '2025-04-15', 'medium', true, ARRAY['person_centred_care', 'quality_assurance']),
      ('guernsey', 'Committee for Health & Social Care', 'Environmental Sustainability Requirements', 'New environmental protection and sustainability standards', '2025-07-01', 'high', true, ARRAY['suitable_environment', 'effective_leadership']),
      ('isle_of_man', 'Department of Health & Social Care', 'Manx Cultural Heritage Framework', 'Enhanced requirements for Manx cultural heritage and language support', '2025-05-15', 'medium', true, ARRAY['manx_heritage', 'community_integration'])
    `);

    // Create jurisdiction mapping table for organizations
    await queryRunner.createTable(new Table({
      name: 'organization_jurisdictions',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'organizationId',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'jurisdiction',
          type: 'var char',
          length: '50',
          isNullable: false,
        },
        {
          name: 'regulatoryBody',
          type: 'var char',
          length: '100',
          isNullable: false,
        },
        {
          name: 'registrationNumber',
          type: 'var char',
          length: '100',
          isNullable: true,
        },
        {
          name: 'registrationDate',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'lastInspection',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'nextInspection',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'currentRating',
          type: 'var char',
          length: '50',
          isNullable: true,
        },
        {
          name: 'isActive',
          type: 'boolean',
          default: true,
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updatedAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Create index for organization jurisdictions
    await queryRunner.createIndex('organization_jurisdictions', new Index({
      name: 'IDX_ORG_JURISDICTIONS_ORG_JURISDICTION',
      columnNames: ['organizationId', 'jurisdiction'],
      isUnique: true,
    }));

    // Create foreign key for organization jurisdictions
    await queryRunner.createForeignKey('organization_jurisdictions', new ForeignKey({
      columnNames: ['organizationId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'CASCADE',
    }));

    // Cultural compliance tracking table
    await queryRunner.createTable(new Table({
      name: 'cultural_compliance',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'uuid_generate_v4()',
        },
        {
          name: 'organizationId',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'jurisdiction',
          type: 'var char',
          length: '50',
          isNullable: false,
        },
        {
          name: 'culturalRequirements',
          type: 'jsonb',
          isNullable: false,
          default: '{}',
        },
        {
          name: 'languageSupport',
          type: 'jsonb',
          isNullable: false,
          default: '{}',
        },
        {
          name: 'heritagePreservation',
          type: 'jsonb',
          isNullable: false,
          default: '{}',
        },
        {
          name: 'communityIntegration',
          type: 'jsonb',
          isNullable: false,
          default: '{}',
        },
        {
          name: 'overallCulturalScore',
          type: 'decimal',
          precision: 5,
          scale: 2,
          isNullable: false,
          default: '0',
        },
        {
          name: 'assessmentDate',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'assessedBy',
          type: 'uuid',
          isNullable: true,
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
        {
          name: 'updatedAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
        },
      ],
    }));

    // Create index for cultural compliance
    await queryRunner.createIndex('cultural_compliance', new Index({
      name: 'IDX_CULTURAL_COMPLIANCE_ORG_JURISDICTION',
      columnNames: ['organizationId', 'jurisdiction'],
    }));

    // Create foreign key for cultural compliance
    await queryRunner.createForeignKey('cultural_compliance', new ForeignKey({
      columnNames: ['organizationId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'CASCADE',
    }));

    console.log('✅ British Isles Multi-Jurisdictional Compliance migration completed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('cultural_compliance');
    await queryRunner.dropTable('organization_jurisdictions');
    await queryRunner.dropTable('regulatory_updates');
    await queryRunner.dropTable('isle_of_man_compliance');
    await queryRunner.dropTable('guernsey_compliance');
    await queryRunner.dropTable('jersey_compliance');
    await queryRunner.dropTable('british_isles_compliance');

    console.log('✅ British Isles Multi-Jurisdictional Compliance migration rolled back');
  }
}
