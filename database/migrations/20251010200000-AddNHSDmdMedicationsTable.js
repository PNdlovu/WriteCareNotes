/**
 * @fileoverview Database Migration - Add NHS dm+d Medications Table
 * @version 1.0.0
 * @since 2025-10-10
 * 
 * @description
 * Creates wcn_nhs_dmd_medications table for storing NHS Dictionary of Medicines and Devices (dm+d) data.
 * Enables standardized medication selection with SNOMED CT codes for UK healthcare interoperability.
 * 
 * @table wcn_nhs_dmd_medications
 * @indexes 7 performance indexes
 * @enums 3 custom enums
 * 
 * @compliance
 * - NHSBSA dm+d standards
 * - SNOMED CT UK Drug Extension
 * - FHIR UK Core Medication Profile
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;

    // ==========================================
    // CREATE ENUMS
    // ==========================================

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        -- Medication product type (VTM/VMP/AMP hierarchy)
        CREATE TYPE dmd_virtual_product_type AS ENUM (
          'VTM',  -- Virtual Therapeutic Moiety (generic concept, e.g., "Paracetamol")
          'VMP',  -- Virtual Medicinal Product (generic product, e.g., "Paracetamol 500mg tablets")
          'AMP'   -- Actual Medicinal Product (branded, e.g., "Panadol 500mg tablets")
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        -- Medication form type
        CREATE TYPE dmd_form_type AS ENUM (
          'TABLET',
          'CAPSULE',
          'ORAL_SOLUTION',
          'ORAL_SUSPENSION',
          'INJECTION',
          'INHALATION',
          'CREAM',
          'OINTMENT',
          'DROPS',
          'PATCH',
          'SUPPOSITORY',
          'PESSARY',
          'SPRAY',
          'GEL'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        -- UK Controlled Drug classification (Misuse of Drugs Act 1971)
        CREATE TYPE dmd_controlled_drug_category AS ENUM (
          'NOT_CONTROLLED',
          'SCHEDULE_1',  -- No therapeutic use (e.g., Cannabis, LSD)
          'SCHEDULE_2',  -- High potential for abuse (e.g., Morphine, Oxycodone, Methadone)
          'SCHEDULE_3',  -- Moderate dependence risk (e.g., Buprenorphine, Temazepam)
          'SCHEDULE_4',  -- Low risk (e.g., Benzodiazepines, Anabolic steroids)
          'SCHEDULE_5'   -- Very low strength preparations (e.g., Low-dose Codeine)
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // ==========================================
    // CREATE TABLE
    // ==========================================

    await queryInterface.createTable('wcn_nhs_dmd_medications', {
      // Primary Key
      id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true
      },

      // SNOMED CT Identifiers (Core interoperability codes)
      snomedCode: {
        type: DataTypes.STRING(18),
        allowNull: false,
        unique: true,
        comment: 'Primary SNOMED CT concept ID (unique identifier for this medication in SNOMED CT)'
      },
      vtmSnomedCode: {
        type: DataTypes.STRING(18),
        allowNull: true,
        comment: 'Virtual Therapeutic Moiety SNOMED code (generic concept, e.g., "Paracetamol")'
      },
      vmpSnomedCode: {
        type: DataTypes.STRING(18),
        allowNull: true,
        comment: 'Virtual Medicinal Product SNOMED code (generic product, e.g., "Paracetamol 500mg tablets")'
      },
      ampSnomedCode: {
        type: DataTypes.STRING(18),
        allowNull: true,
        comment: 'Actual Medicinal Product SNOMED code (branded, e.g., "Panadol 500mg tablets")'
      },

      // Product Type
      productType: {
        type: DataTypes.ENUM('VTM', 'VMP', 'AMP'),
        allowNull: false,
        defaultValue: 'VMP',
        comment: 'Medication product level in dm+d hierarchy'
      },

      // Medication Names
      preferredTerm: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: 'Official NHS dm+d preferred term (full medication name)'
      },
      fullySpecifiedName: {
        type: DataTypes.STRING(1000),
        allowNull: true,
        comment: 'SNOMED CT fully specified name with semantic tag'
      },
      shortName: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: 'Abbreviated medication name for UI display'
      },

      // Product Details
      form: {
        type: DataTypes.ENUM(
          'TABLET', 'CAPSULE', 'ORAL_SOLUTION', 'ORAL_SUSPENSION', 
          'INJECTION', 'INHALATION', 'CREAM', 'OINTMENT', 'DROPS', 
          'PATCH', 'SUPPOSITORY', 'PESSARY', 'SPRAY', 'GEL'
        ),
        allowNull: true,
        comment: 'Pharmaceutical form (tablet, capsule, injection, etc.)'
      },
      strength: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Medication strength (e.g., "500mg", "10mg/ml")'
      },
      unitOfMeasure: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Unit of measurement (mg, ml, mcg, etc.)'
      },
      packSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Number of units in pack'
      },
      manufacturer: {
        type: DataTypes.STRING(300),
        allowNull: true,
        comment: 'Manufacturer name (for AMPs only)'
      },

      // Controlled Drug Classification (UK Misuse of Drugs Act 1971)
      controlledDrugCategory: {
        type: DataTypes.ENUM(
          'NOT_CONTROLLED', 'SCHEDULE_1', 'SCHEDULE_2', 
          'SCHEDULE_3', 'SCHEDULE_4', 'SCHEDULE_5'
        ),
        allowNull: false,
        defaultValue: 'NOT_CONTROLLED',
        comment: 'UK controlled drug schedule (Misuse of Drugs Act)'
      },
      controlledDrugSchedule: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Detailed schedule information'
      },

      // Prescribing Information
      isPrescribable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this medication can be prescribed'
      },
      isPediatricApproved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Approved for use in children (per BNFc)'
      },
      minimumAgeMonths: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Minimum age in months for safe use'
      },
      blackTriangle: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Black triangle drug (intensive monitoring for side effects)'
      },

      // Clinical Information (JSONB arrays for structured data)
      indications: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Medical conditions this medication treats (array of strings)'
      },
      contraindications: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Conditions where this medication should NOT be used (array of strings)'
      },
      cautions: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Warnings and precautions (array of strings)'
      },
      sideEffects: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Known adverse reactions (array of strings)'
      },
      drugInteractions: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Drug-drug interactions with severity levels (array of objects)'
      },

      // Pediatric Dosing Information
      pediatricDosing: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Age/weight-based dosing guidance for children (array of dosing objects)'
      },

      // BNF/BNFc Codes
      bnfCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'British National Formulary classification code'
      },
      bnfcCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'BNF for Children classification code'
      },

      // NHS dm+d Specific Data
      dmdVersion: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Version of dm+d database this record is from (e.g., "2025.10")'
      },
      dmdId: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Original dm+d database ID'
      },
      nhsIndicativePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'NHS indicative price in GBP'
      },
      drugTariffCategory: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'NHS Drug Tariff category for pricing'
      },
      lastDmdSync: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Timestamp of last dm+d database sync'
      },

      // FHIR Interoperability
      fhirMedicationResource: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Complete FHIR R4 Medication resource for interoperability'
      },

      // Status Flags
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether medication is currently active in dm+d'
      },
      discontinuedDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Date medication was discontinued (if inactive)'
      },

      // Timestamps
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // ==========================================
    // CREATE INDEXES
    // ==========================================

    // Primary SNOMED code lookup (unique)
    await queryInterface.addIndex('wcn_nhs_dmd_medications', ['snomedCode'], {
      name: 'idx_dmd_snomed_code',
      unique: true
    });

    // VTM SNOMED code (find all products with same active ingredient)
    await queryInterface.addIndex('wcn_nhs_dmd_medications', ['vtmSnomedCode'], {
      name: 'idx_dmd_vtm_snomed'
    });

    // VMP SNOMED code (find all brands of same generic product)
    await queryInterface.addIndex('wcn_nhs_dmd_medications', ['vmpSnomedCode'], {
      name: 'idx_dmd_vmp_snomed'
    });

    // Medication name autocomplete
    await queryInterface.addIndex('wcn_nhs_dmd_medications', ['preferredTerm'], {
      name: 'idx_dmd_preferred_term'
    });

    // Pediatric medications filter
    await queryInterface.addIndex('wcn_nhs_dmd_medications', ['isPediatricApproved', 'isActive'], {
      name: 'idx_dmd_pediatric_active'
    });

    // Controlled drugs filter
    await queryInterface.addIndex('wcn_nhs_dmd_medications', ['controlledDrugCategory'], {
      name: 'idx_dmd_controlled_category'
    });

    // BNFc code lookup
    await queryInterface.addIndex('wcn_nhs_dmd_medications', ['bnfcCode'], {
      name: 'idx_dmd_bnfc_code'
    });

    console.log('✅ NHS dm+d medications table created successfully');
    console.log('📊 Table: wcn_nhs_dmd_medications');
    console.log('🔢 Enums: 3 (dmd_virtual_product_type, dmd_form_type, dmd_controlled_drug_category)');
    console.log('📇 Indexes: 7 performance indexes');
    console.log('🔗 SNOMED CT integration enabled');
    console.log('🩺 Pediatric dosing support enabled');
    console.log('⚕️ FHIR interoperability enabled');
  },

  down: async (queryInterface, Sequelize) => {
    // Drop table
    await queryInterface.dropTable('wcn_nhs_dmd_medications');

    // Drop enums
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS dmd_virtual_product_type CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS dmd_form_type CASCADE;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS dmd_controlled_drug_category CASCADE;');

    console.log('❌ NHS dm+d medications table dropped');
  }
};
