/**
 * Migration: Add ChildBilling table for children's residential care financial management
 * 
 * This creates a comprehensive billing system for children in residential care across
 * all 8 British Isles jurisdictions (England, Scotland, Wales, NI, Ireland, Jersey, 
 * Guernsey, Isle of Man).
 * 
 * Key features:
 * - Jurisdiction-specific compliance tracking
 * - Local authority invoicing with proper rates
 * - Personal allowances tracking (pocket money, clothing, education)
 * - Service charges breakdown
 * - Multi-funder support (jointly funded placements)
 * - Payment history and arrears tracking
 * - Dispute management
 * - Transition to LeavingCareFinances at 16+
 * 
 * Created: October 10, 2025
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    // Create British Isles jurisdiction enum
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE british_isles_jurisdiction AS ENUM (
          'ENGLAND',
          'SCOTLAND',
          'WALES',
          'NORTHERN_IRELAND',
          'IRELAND',
          'JERSEY',
          'GUERNSEY',
          'ISLE_OF_MAN'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create child funding source enum
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE child_funding_source AS ENUM (
          'LOCAL_AUTHORITY',
          'HEALTH_AUTHORITY',
          'JOINTLY_FUNDED',
          'PARENTAL_CONTRIBUTION',
          'CONTINUING_CARE',
          'EDUCATION_AUTHORITY',
          'YOUTH_JUSTICE',
          'ASYLUM_HOME_OFFICE',
          'OTHER'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create billing frequency enum
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE billing_frequency AS ENUM (
          'WEEKLY',
          'FORTNIGHTLY',
          'MONTHLY',
          'QUARTERLY',
          'ANNUAL',
          'SESSIONAL',
          'DAILY'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create child_billing table
    await queryInterface.createTable('child_billing', {
      id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },

      // Child reference
      childId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'child_id',
        references: {
          model: 'children',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Don't delete billing if child is deleted
      },

      // Jurisdiction
      jurisdiction: {
        type: 'british_isles_jurisdiction',
        allowNull: false,
        defaultValue: 'ENGLAND',
      },

      // Primary funding details
      primaryFundingSource: {
        type: 'child_funding_source',
        allowNull: false,
        defaultValue: 'LOCAL_AUTHORITY',
        field: 'primary_funding_source',
      },

      primaryFunderName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        field: 'primary_funder_name',
      },

      localAuthorityCode: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'local_authority_code',
      },

      // Placement costs
      dailyRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'daily_rate',
      },

      weeklyRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'weekly_rate',
      },

      monthlyRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'monthly_rate',
      },

      annualRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'annual_rate',
      },

      // Service charges breakdown (JSONB)
      serviceCharges: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        field: 'service_charges',
      },

      totalWeeklyServiceCharges: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'total_weekly_service_charges',
      },

      // Funding allocations (JSONB)
      fundingAllocations: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        field: 'funding_allocations',
      },

      // Personal allowances (JSONB)
      personalAllowances: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
          weeklyPocketMoney: 0,
          clothingAllowanceQuarterly: 0,
          birthdayGrant: 0,
          festivalGrants: 0,
          savingsContribution: 0,
          educationAllowance: 0,
          totalMonthly: 0,
        },
        field: 'personal_allowances',
      },

      // Billing configuration
      billingFrequency: {
        type: 'billing_frequency',
        allowNull: false,
        defaultValue: 'MONTHLY',
        field: 'billing_frequency',
      },

      paymentTermsDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
        field: 'payment_terms_days',
      },

      isRecurring: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_recurring',
      },

      nextInvoiceDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'next_invoice_date',
      },

      lastInvoiceDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_invoice_date',
      },

      // Financial tracking
      totalInvoiced: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'total_invoiced',
      },

      totalPaid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'total_paid',
      },

      currentArrears: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'current_arrears',
      },

      paymentHistory: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        field: 'payment_history',
      },

      // Contract details
      placementStartDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'placement_start_date',
      },

      placementEndDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'placement_end_date',
      },

      purchaseOrderNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'purchase_order_number',
      },

      contractReference: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'contract_reference',
      },

      // Contact details
      socialWorkerName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        field: 'social_worker_name',
      },

      socialWorkerEmail: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'social_worker_email',
      },

      socialWorkerPhone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'social_worker_phone',
      },

      commissioningOfficerName: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'commissioning_officer_name',
      },

      commissioningOfficerEmail: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'commissioning_officer_email',
      },

      commissioningOfficerPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'commissioning_officer_phone',
      },

      financeContactName: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'finance_contact_name',
      },

      financeContactEmail: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'finance_contact_email',
      },

      financeContactPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'finance_contact_phone',
      },

      // Invoicing address
      invoiceAddress: {
        type: DataTypes.STRING(300),
        allowNull: false,
        field: 'invoice_address',
      },

      invoicePostcode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'invoice_postcode',
      },

      invoiceEmail: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'invoice_email',
      },

      invoicePortalUrl: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'invoice_portal_url',
      },

      // Status
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },

      hasDispute: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'has_dispute',
      },

      disputeDetails: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'dispute_details',
      },

      disputeRaisedDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'dispute_raised_date',
      },

      // Transition tracking
      transitionedToLeavingCare: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'transitioned_to_leaving_care',
      },

      leavingCareFinanceId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'leaving_care_finance_id',
        references: {
          model: 'leaving_care_finances',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      transitionDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'transition_date',
      },

      // Notes and compliance
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      complianceChecks: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        field: 'compliance_checks',
      },

      // Audit fields
      createdBy: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'created_by',
      },

      updatedBy: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'updated_by',
      },

      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'created_at',
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'updated_at',
      },
    });

    // Create indexes for performance
    await queryInterface.addIndex('child_billing', ['child_id'], {
      name: 'idx_child_billing_child_id',
    });

    await queryInterface.addIndex('child_billing', ['jurisdiction'], {
      name: 'idx_child_billing_jurisdiction',
    });

    await queryInterface.addIndex('child_billing', ['primary_funding_source'], {
      name: 'idx_child_billing_funding_source',
    });

    await queryInterface.addIndex('child_billing', ['local_authority_code'], {
      name: 'idx_child_billing_la_code',
    });

    await queryInterface.addIndex('child_billing', ['next_invoice_date'], {
      name: 'idx_child_billing_next_invoice_date',
      where: {
        is_recurring: true,
        is_active: true,
      },
    });

    await queryInterface.addIndex('child_billing', ['is_active'], {
      name: 'idx_child_billing_is_active',
    });

    await queryInterface.addIndex('child_billing', ['has_dispute'], {
      name: 'idx_child_billing_has_dispute',
      where: {
        has_dispute: true,
      },
    });

    await queryInterface.addIndex('child_billing', ['current_arrears'], {
      name: 'idx_child_billing_current_arrears',
      where: {
        current_arrears: {
          [Sequelize.Op.gt]: 0,
        },
      },
    });

    await queryInterface.addIndex('child_billing', ['placement_start_date', 'placement_end_date'], {
      name: 'idx_child_billing_placement_dates',
    });

    await queryInterface.addIndex('child_billing', ['transitioned_to_leaving_care'], {
      name: 'idx_child_billing_transitioned',
    });

    await queryInterface.addIndex('child_billing', ['leaving_care_finance_id'], {
      name: 'idx_child_billing_leaving_care_finance_id',
    });

    // Add constraint to ensure child_id is unique (one active billing record per child)
    await queryInterface.addConstraint('child_billing', {
      fields: ['child_id'],
      type: 'unique',
      name: 'unique_active_child_billing',
      where: {
        is_active: true,
      },
    });

    // Add check constraint to ensure positive rates
    await queryInterface.sequelize.query(`
      ALTER TABLE child_billing
      ADD CONSTRAINT check_positive_rates
      CHECK (
        daily_rate >= 0 AND
        weekly_rate >= 0 AND
        monthly_rate >= 0 AND
        annual_rate >= 0 AND
        total_weekly_service_charges >= 0
      );
    `);

    // Add check constraint to ensure financial totals are consistent
    await queryInterface.sequelize.query(`
      ALTER TABLE child_billing
      ADD CONSTRAINT check_financial_consistency
      CHECK (
        total_invoiced >= 0 AND
        total_paid >= 0 AND
        current_arrears >= 0 AND
        total_paid <= total_invoiced
      );
    `);

    // Add check constraint to ensure placement dates are logical
    await queryInterface.sequelize.query(`
      ALTER TABLE child_billing
      ADD CONSTRAINT check_placement_dates
      CHECK (
        placement_end_date IS NULL OR
        placement_end_date >= placement_start_date
      );
    `);

    // Add trigger to automatically calculate current_arrears
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION calculate_child_billing_arrears()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.current_arrears := NEW.total_invoiced - NEW.total_paid;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trigger_calculate_child_billing_arrears
      BEFORE INSERT OR UPDATE OF total_invoiced, total_paid
      ON child_billing
      FOR EACH ROW
      EXECUTE FUNCTION calculate_child_billing_arrears();
    `);

    // Add trigger to update updated_at timestamp
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_child_billing_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at := CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trigger_update_child_billing_timestamp
      BEFORE UPDATE ON child_billing
      FOR EACH ROW
      EXECUTE FUNCTION update_child_billing_timestamp();
    `);

    // Add comment to table
    await queryInterface.sequelize.query(`
      COMMENT ON TABLE child_billing IS 
      'Financial management for children in residential care across all 8 British Isles jurisdictions. 
      Tracks local authority invoicing, personal allowances, service charges, payment history, 
      and compliance with jurisdiction-specific regulations. Supports transition to leaving care 
      finances at age 16+.';
    `);

    console.log('✅ ChildBilling table created successfully with 11 indexes, 4 constraints, and 2 triggers');
  },

  async down(queryInterface, Sequelize) {
    // Drop triggers
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trigger_calculate_child_billing_arrears ON child_billing;
      DROP FUNCTION IF EXISTS calculate_child_billing_arrears();
      DROP TRIGGER IF EXISTS trigger_update_child_billing_timestamp ON child_billing;
      DROP FUNCTION IF EXISTS update_child_billing_timestamp();
    `);

    // Drop table
    await queryInterface.dropTable('child_billing');

    // Drop enums
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS british_isles_jurisdiction;
      DROP TYPE IF EXISTS child_funding_source;
      DROP TYPE IF EXISTS billing_frequency;
    `);

    console.log('✅ ChildBilling table and related enums dropped successfully');
  },
};
