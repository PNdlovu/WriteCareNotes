/**
 * @fileoverview Database Migration - Medication Interaction Tables
 * @module CreateMedicationInteractionTables
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Creates comprehensive database tables for medication interaction checking,
 * allergy management, contraindication warnings, and clinical decision support.
 * 
 * @compliance
 * - MHRA Drug Safety Guidelines
 * - BNF (British National Formulary) Standards
 * - NICE Clinical Guidelines
 * - CQC Regulation 12 - Safe care and treatment
 * - GDPR and Data Protection Act 2018
 * 
 * @security
 * - Field-level encryption for sensitive data
 * - Audit trail columns
 * - Soft delete capability
 * - Organization-level data isolation
 */

import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from 'typeorm';

export class CreateMedicationInteractionTables1704067200008 implements MigrationInterface {
  name = 'CreateMedicationInteractionTables1704067200008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create drug_interactions table
    await queryRunner.createTable(
      new Table({
        name: 'drug_interactions',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            comment: 'Unique identifier for drug interaction'
          },
          {
            name: 'drug1_id',
            type: 'varchar',
            length: '36',
            comment: 'First drug in interaction pair'
          },
          {
            name: 'drug1_name',
            type: 'varchar',
            length: '200',
            comment: 'Name of first drug'
          },
          {
            name: 'drug2_id',
            type: 'varchar',
            length: '36',
            comment: 'Second drug in interaction pair'
          },
          {
            name: 'drug2_name',
            type: 'varchar',
            length: '200',
            comment: 'Name of second drug'
          },
          {
            name: 'interaction_type',
            type: 'enum',
            enum: ['major', 'moderate', 'minor', 'contraindicated'],
            comment: 'Type of drug interaction'
          },
          {
            name: 'severity',
            type: 'enum',
            enum: ['critical', 'high', 'medium', 'low'],
            comment: 'Severity level of interaction'
          },
          {
            name: 'mechanism',
            type: 'text',
            comment: 'Mechanism of interaction'
          },
          {
            name: 'clinical_effect',
            type: 'text',
            comment: 'Clinical effect of interaction'
          },
          {
            name: 'management',
            type: 'text',
            comment: 'Management recommendations'
          },
          {
            name: 'evidence',
            type: 'enum',
            enum: ['established', 'theoretical', 'anecdotal'],
            comment: 'Evidence level for interaction'
          },
          {
            name: 'references',
            type: 'json',
            comment: 'Scientific references for interaction'
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            comment: 'Whether interaction is active'
          },
          {
            name: 'last_updated',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Last update timestamp'
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Record creation timestamp'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            comment: 'Record update timestamp'
          }
        ],
        indices: [
          new Index('idx_drug_interactions_drug1', ['drug1_id']),
          new Index('idx_drug_interactions_drug2', ['drug2_id']),
          new Index('idx_drug_interactions_severity', ['severity']),
          new Index('idx_drug_interactions_type', ['interaction_type']),
          new Index('idx_drug_interactions_active', ['is_active']),
          new Index('idx_drug_interactions_pair', ['drug1_id', 'drug2_id'])
        ]
      }),
      true
    );

    // Create drug_database table
    await queryRunner.createTable(
      new Table({
        name: 'drug_database',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            comment: 'Unique identifier for drug'
          },
          {
            name: 'name',
            type: 'varchar',
            length: '200',
            comment: 'Drug name'
          },
          {
            name: 'active_ingredients',
            type: 'json',
            comment: 'Active ingredients list'
          },
          {
            name: 'therapeutic_class',
            type: 'varchar',
            length: '100',
            comment: 'Therapeutic classification'
          },
          {
            name: 'pharmacological_class',
            type: 'varchar',
            length: '100',
            comment: 'Pharmacological classification'
          },
          {
            name: 'mechanism',
            type: 'text',
            comment: 'Mechanism of action'
          },
          {
            name: 'indications',
            type: 'json',
            comment: 'Drug indications'
          },
          {
            name: 'contraindications',
            type: 'json',
            comment: 'Drug contraindications'
          },
          {
            name: 'warnings',
            type: 'json',
            comment: 'Drug warnings'
          },
          {
            name: 'interactions',
            type: 'json',
            comment: 'Known drug interactions'
          },
          {
            name: 'side_effects',
            type: 'json',
            comment: 'Known side effects'
          },
          {
            name: 'dosage_information',
            type: 'json',
            comment: 'Dosage information'
          },
          {
            name: 'special_populations',
            type: 'json',
            comment: 'Special population considerations'
          },
          {
            name: 'monitoring_parameters',
            type: 'json',
            comment: 'Monitoring parameters'
          },
          {
            name: 'last_updated',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Last update timestamp'
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Record creation timestamp'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            comment: 'Record update timestamp'
          }
        ],
        indices: [
          new Index('idx_drug_database_name', ['name']),
          new Index('idx_drug_database_therapeutic_class', ['therapeutic_class']),
          new Index('idx_drug_database_pharmacological_class', ['pharmacological_class'])
        ]
      }),
      true
    );

    // Create resident_allergies table
    await queryRunner.createTable(
      new Table({
        name: 'resident_allergies',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            comment: 'Unique identifier for allergy alert'
          },
          {
            name: 'resident_id',
            type: 'varchar',
            length: '36',
            comment: 'Reference to resident'
          },
          {
            name: 'allergen',
            type: 'varchar',
            length: '200',
            comment: 'Allergen name'
          },
          {
            name: 'allergen_type',
            type: 'enum',
            enum: ['drug', 'food', 'environmental', 'other'],
            comment: 'Type of allergen'
          },
          {
            name: 'reaction_type',
            type: 'enum',
            enum: ['allergy', 'intolerance', 'adverse_reaction'],
            comment: 'Type of reaction'
          },
          {
            name: 'severity',
            type: 'enum',
            enum: ['mild', 'moderate', 'severe', 'anaphylaxis'],
            comment: 'Severity of reaction'
          },
          {
            name: 'symptoms',
            type: 'json',
            comment: 'Symptoms experienced'
          },
          {
            name: 'onset_date',
            type: 'date',
            isNullable: true,
            comment: 'Date of first reaction'
          },
          {
            name: 'verified_by',
            type: 'varchar',
            length: '36',
            comment: 'Staff member who verified allergy'
          },
          {
            name: 'verification_date',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Date allergy was verified'
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
            comment: 'Additional notes about allergy'
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            comment: 'Whether allergy is active'
          },
          {
            name: 'organization_id',
            type: 'varchar',
            length: '36',
            comment: 'Organization identifier'
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Record creation timestamp'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            comment: 'Record update timestamp'
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Soft delete timestamp'
          }
        ],
        indices: [
          new Index('idx_resident_allergies_resident', ['resident_id']),
          new Index('idx_resident_allergies_organization', ['organization_id']),
          new Index('idx_resident_allergies_allergen', ['allergen']),
          new Index('idx_resident_allergies_type', ['allergen_type']),
          new Index('idx_resident_allergies_severity', ['severity']),
          new Index('idx_resident_allergies_active', ['is_active']),
          new Index('idx_resident_allergies_deleted', ['deleted_at'])
        ]
      }),
      true
    );

    // Create medication_contraindications table
    await queryRunner.createTable(
      new Table({
        name: 'medication_contraindications',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            comment: 'Unique identifier for contraindication'
          },
          {
            name: 'medication_id',
            type: 'varchar',
            length: '36',
            comment: 'Reference to medication'
          },
          {
            name: 'medication_name',
            type: 'varchar',
            length: '200',
            comment: 'Medication name'
          },
          {
            name: 'active_ingredient',
            type: 'varchar',
            length: '200',
            comment: 'Active ingredient'
          },
          {
            name: 'contraindication_type',
            type: 'enum',
            enum: ['absolute', 'relative', 'caution'],
            comment: 'Type of contraindication'
          },
          {
            name: 'condition',
            type: 'varchar',
            length: '200',
            comment: 'Contraindicated condition'
          },
          {
            name: 'reason',
            type: 'text',
            comment: 'Reason for contraindication'
          },
          {
            name: 'severity',
            type: 'enum',
            enum: ['critical', 'high', 'medium', 'low'],
            comment: 'Severity of contraindication'
          },
          {
            name: 'clinical_guidance',
            type: 'text',
            comment: 'Clinical guidance'
          },
          {
            name: 'alternative_options',
            type: 'json',
            comment: 'Alternative medication options'
          },
          {
            name: 'references',
            type: 'json',
            comment: 'Scientific references'
          },
          {
            name: 'last_reviewed',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Last review date'
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Record creation timestamp'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            comment: 'Record update timestamp'
          }
        ],
        indices: [
          new Index('idx_medication_contraindications_medication', ['medication_id']),
          new Index('idx_medication_contraindications_ingredient', ['active_ingredient']),
          new Index('idx_medication_contraindications_condition', ['condition']),
          new Index('idx_medication_contraindications_type', ['contraindication_type']),
          new Index('idx_medication_contraindications_severity', ['severity'])
        ]
      }),
      true
    );

    // Create medication_interaction_checks table
    await queryRunner.createTable(
      new Table({
        name: 'medication_interaction_checks',
        columns: [
          {
            name: 'check_id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            comment: 'Unique identifier for interaction check'
          },
          {
            name: 'resident_id',
            type: 'varchar',
            length: '36',
            comment: 'Reference to resident'
          },
          {
            name: 'check_date',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Date of interaction check'
          },
          {
            name: 'overall_risk',
            type: 'enum',
            enum: ['low', 'medium', 'high', 'critical'],
            comment: 'Overall risk assessment'
          },
          {
            name: 'safety_score',
            type: 'decimal',
            precision: 5,
            scale: 2,
            comment: 'Safety score (0-100)'
          },
          {
            name: 'interactions',
            type: 'json',
            comment: 'Drug interactions found'
          },
          {
            name: 'allergy_alerts',
            type: 'json',
            comment: 'Allergy alerts triggered'
          },
          {
            name: 'contraindication_alerts',
            type: 'json',
            comment: 'Contraindication alerts triggered'
          },
          {
            name: 'clinical_decision_support',
            type: 'json',
            comment: 'Clinical decision support recommendations'
          },
          {
            name: 'medications_checked',
            type: 'json',
            comment: 'Medications included in check'
          },
          {
            name: 'performed_by',
            type: 'varchar',
            length: '36',
            comment: 'Staff member who performed check'
          },
          {
            name: 'organization_id',
            type: 'varchar',
            length: '36',
            comment: 'Organization identifier'
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Record creation timestamp'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            comment: 'Record update timestamp'
          }
        ],
        indices: [
          new Index('idx_interaction_checks_resident', ['resident_id']),
          new Index('idx_interaction_checks_organization', ['organization_id']),
          new Index('idx_interaction_checks_date', ['check_date']),
          new Index('idx_interaction_checks_risk', ['overall_risk']),
          new Index('idx_interaction_checks_score', ['safety_score']),
          new Index('idx_interaction_checks_performed_by', ['performed_by'])
        ]
      }),
      true
    );

    // Create resident_conditions table
    await queryRunner.createTable(
      new Table({
        name: 'resident_conditions',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            comment: 'Unique identifier for condition'
          },
          {
            name: 'resident_id',
            type: 'varchar',
            length: '36',
            comment: 'Reference to resident'
          },
          {
            name: 'condition_name',
            type: 'varchar',
            length: '200',
            comment: 'Medical condition name'
          },
          {
            name: 'condition_code',
            type: 'varchar',
            length: '20',
            isNullable: true,
            comment: 'ICD-10 or SNOMED code'
          },
          {
            name: 'diagnosis_date',
            type: 'date',
            isNullable: true,
            comment: 'Date of diagnosis'
          },
          {
            name: 'severity',
            type: 'enum',
            enum: ['mild', 'moderate', 'severe', 'critical'],
            comment: 'Condition severity'
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'resolved', 'chronic', 'remission'],
            comment: 'Condition status'
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
            comment: 'Additional notes'
          },
          {
            name: 'diagnosed_by',
            type: 'varchar',
            length: '36',
            comment: 'Healthcare provider who diagnosed'
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            comment: 'Whether condition is active'
          },
          {
            name: 'organization_id',
            type: 'varchar',
            length: '36',
            comment: 'Organization identifier'
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Record creation timestamp'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            comment: 'Record update timestamp'
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Soft delete timestamp'
          }
        ],
        indices: [
          new Index('idx_resident_conditions_resident', ['resident_id']),
          new Index('idx_resident_conditions_organization', ['organization_id']),
          new Index('idx_resident_conditions_name', ['condition_name']),
          new Index('idx_resident_conditions_code', ['condition_code']),
          new Index('idx_resident_conditions_status', ['status']),
          new Index('idx_resident_conditions_active', ['is_active']),
          new Index('idx_resident_conditions_deleted', ['deleted_at'])
        ]
      }),
      true
    );

    // Create interaction_reports table
    await queryRunner.createTable(
      new Table({
        name: 'interaction_reports',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            comment: 'Unique identifier for report'
          },
          {
            name: 'report_type',
            type: 'enum',
            enum: ['summary', 'detailed', 'trends'],
            comment: 'Type of report'
          },
          {
            name: 'generated_date',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Report generation date'
          },
          {
            name: 'date_range_start',
            type: 'date',
            comment: 'Report date range start'
          },
          {
            name: 'date_range_end',
            type: 'date',
            comment: 'Report date range end'
          },
          {
            name: 'summary',
            type: 'json',
            comment: 'Report summary data'
          },
          {
            name: 'details',
            type: 'json',
            comment: 'Detailed report data'
          },
          {
            name: 'generated_by',
            type: 'varchar',
            length: '36',
            comment: 'Staff member who generated report'
          },
          {
            name: 'organization_id',
            type: 'varchar',
            length: '36',
            comment: 'Organization identifier'
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Record creation timestamp'
          }
        ],
        indices: [
          new Index('idx_interaction_reports_organization', ['organization_id']),
          new Index('idx_interaction_reports_type', ['report_type']),
          new Index('idx_interaction_reports_date', ['generated_date']),
          new Index('idx_interaction_reports_range', ['date_range_start', 'date_range_end']),
          new Index('idx_interaction_reports_generated_by', ['generated_by'])
        ]
      }),
      true
    );

    // Add foreign key constraints
    await queryRunner.createForeignKey(
      'resident_allergies',
      new ForeignKey({
        columnNames: ['resident_id'],
        referencedTableName: 'residents',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_resident_allergies_resident'
      })
    );

    await queryRunner.createForeignKey(
      'resident_allergies',
      new ForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_resident_allergies_organization'
      })
    );

    await queryRunner.createForeignKey(
      'resident_conditions',
      new ForeignKey({
        columnNames: ['resident_id'],
        referencedTableName: 'residents',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_resident_conditions_resident'
      })
    );

    await queryRunner.createForeignKey(
      'resident_conditions',
      new ForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_resident_conditions_organization'
      })
    );

    await queryRunner.createForeignKey(
      'medication_interaction_checks',
      new ForeignKey({
        columnNames: ['resident_id'],
        referencedTableName: 'residents',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_interaction_checks_resident'
      })
    );

    await queryRunner.createForeignKey(
      'medication_interaction_checks',
      new ForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_interaction_checks_organization'
      })
    );

    await queryRunner.createForeignKey(
      'interaction_reports',
      new ForeignKey({
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_interaction_reports_organization'
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    await queryRunner.dropForeignKey('interaction_reports', 'fk_interaction_reports_organization');
    await queryRunner.dropForeignKey('medication_interaction_checks', 'fk_interaction_checks_organization');
    await queryRunner.dropForeignKey('medication_interaction_checks', 'fk_interaction_checks_resident');
    await queryRunner.dropForeignKey('resident_conditions', 'fk_resident_conditions_organization');
    await queryRunner.dropForeignKey('resident_conditions', 'fk_resident_conditions_resident');
    await queryRunner.dropForeignKey('resident_allergies', 'fk_resident_allergies_organization');
    await queryRunner.dropForeignKey('resident_allergies', 'fk_resident_allergies_resident');

    // Drop tables in reverse order
    await queryRunner.dropTable('interaction_reports');
    await queryRunner.dropTable('resident_conditions');
    await queryRunner.dropTable('medication_interaction_checks');
    await queryRunner.dropTable('medication_contraindications');
    await queryRunner.dropTable('resident_allergies');
    await queryRunner.dropTable('drug_database');
    await queryRunner.dropTable('drug_interactions');
  }
}