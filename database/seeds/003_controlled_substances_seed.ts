/**
 * @fileoverview Seed data for controlled substances management
 * @module ControlledSubstancesSeed
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Provides comprehensive seed data for controlled substances
 * testing and development, including register entries, transactions,
 * and reconciliation records across all British Isles jurisdictions.
 * 
 * @compliance
 * - MHRA Controlled Drugs Regulations 2013
 * - Misuse of Drugs Act 1971
 * - CQC, Care Inspectorate, CIW, RQIA Standards
 */

import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('controlled_drug_alerts').del();
  await knex('controlled_drug_reconciliations').del();
  await knex('controlled_drug_destructions').del();
  await knex('controlled_drug_transactions').del();
  await knex('controlled_drug_register').del();

  // Get organization and medication IDs for foreign key references
  const organizations = await knex('organizations').select('id').limit(3);
  const medications = await knex('medications')
    .select('id', 'name')
    .whereIn('controlled_drug_schedule', ['schedule_2', 'schedule_3', 'schedule_4_part_1'])
    .limit(10);

  if (organizations.length === 0 || medications.length === 0) {
    console.log('Skipping controlled substances seed - missing organizations or controlled medications');
    return;
  }

  const orgId = organizations[0].id;
  const tenantId = orgId; // Using same ID for simplicity in development

  // Sample user IDs (these would come from actual user records in production)
  const sampleUsers = [
    'user-cd-officer-001',
    'user-senior-nurse-001',
    'user-doctor-001',
    'user-nurse-001',
    'user-pharmacist-001'
  ];

  // Controlled drug register entries
  const registerEntries = [
    {
      id: 'cd-register-001',
      medication_id: medications[0].id,
      schedule: 'II',
      batch_number: 'MOR2024001',
      expiry_date: new Date('2025-12-31'),
      supplier_name: 'Pharmaceutical Supplies Ltd',
      supplier_license: 'MHRA-PS-001',
      received_date: new Date('2024-01-15'),
      received_quantity: 100.000,
      received_by: sampleUsers[0],
      witnessed_by: sampleUsers[1],
      current_stock: 75.000,
      total_administered: 20.000,
      total_wasted: 3.000,
      total_returned: 2.000,
      last_reconciliation_date: new Date('2024-12-01'),
      next_reconciliation_due: new Date('2025-01-01'),
      is_active: true,
      organization_id: orgId,
      tenant_id: tenantId,
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-12-15')
    },
    {
      id: 'cd-register-002',
      medication_id: medications[1].id,
      schedule: 'III',
      batch_number: 'COD2024001',
      expiry_date: new Date('2025-06-30'),
      supplier_name: 'MediCorp Distribution',
      supplier_license: 'MHRA-MD-002',
      received_date: new Date('2024-02-01'),
      received_quantity: 200.000,
      received_by: sampleUsers[1],
      witnessed_by: sampleUsers[2],
      current_stock: 150.000,
      total_administered: 45.000,
      total_wasted: 3.000,
      total_returned: 2.000,
      last_reconciliation_date: new Date('2024-12-01'),
      next_reconciliation_due: new Date('2025-01-01'),
      is_active: true,
      organization_id: orgId,
      tenant_id: tenantId,
      created_at: new Date('2024-02-01'),
      updated_at: new Date('2024-12-15')
    },
    {
      id: 'cd-register-003',
      medication_id: medications[2].id,
      schedule: 'IV',
      batch_number: 'DIA2024001',
      expiry_date: new Date('2025-09-30'),
      supplier_name: 'Healthcare Solutions PLC',
      supplier_license: 'MHRA-HS-003',
      received_date: new Date('2024-03-01'),
      received_quantity: 500.000,
      received_by: sampleUsers[2],
      witnessed_by: sampleUsers[3],
      current_stock: 425.000,
      total_administered: 70.000,
      total_wasted: 3.000,
      total_returned: 2.000,
      last_reconciliation_date: new Date('2024-12-01'),
      next_reconciliation_due: new Date('2025-01-01'),
      is_active: true,
      organization_id: orgId,
      tenant_id: tenantId,
      created_at: new Date('2024-03-01'),
      updated_at: new Date('2024-12-15')
    }
  ];

  await knex('controlled_drug_register').insert(registerEntries);

  // Controlled drug transactions
  const transactions = [
    // Receipt transactions
    {
      id: 'cd-trans-001',
      register_id: 'cd-register-001',
      transaction_type: 'receipt',
      quantity: 100.000,
      running_balance: 100.000,
      transaction_date: new Date('2024-01-15T10:00:00Z'),
      performed_by: sampleUsers[0],
      witnessed_by: sampleUsers[1],
      notes: 'Initial stock receipt from Pharmaceutical Supplies Ltd',
      hash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
      previous_hash: null,
      organization_id: orgId,
      tenant_id: tenantId,
      created_at: new Date('2024-01-15T10:00:00Z'),
      updated_at: new Date('2024-01-15T10:00:00Z')
    },
    // Administration transactions
    {
      id: 'cd-trans-002',
      register_id: 'cd-register-001',
      transaction_type: 'administration',
      quantity: -10.000,
      running_balance: 90.000,
      transaction_date: new Date('2024-01-16T14:30:00Z'),
      performed_by: sampleUsers[3],
      witnessed_by: sampleUsers[1],
      resident_id: 'resident-001', // Would reference actual resident
      prescription_id: 'prescription-001', // Would reference actual prescription
      notes: 'Administered to resident for pain management',
      hash: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567',
      previous_hash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
      organization_id: orgId,
      tenant_id: tenantId,
      created_at: new Date('2024-01-16T14:30:00Z'),
      updated_at: new Date('2024-01-16T14:30:00Z')
    },
    // Waste transaction
    {
      id: 'cd-trans-003',
      register_id: 'cd-register-001',
      transaction_type: 'waste',
      quantity: -2.000,
      running_balance: 88.000,
      transaction_date: new Date('2024-01-17T09:15:00Z'),
      performed_by: sampleUsers[3],
      witnessed_by: sampleUsers[1],
      notes: 'Medication damaged during preparation - witnessed disposal',
      hash: 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678',
      previous_hash: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567',
      organization_id: orgId,
      tenant_id: tenantId,
      created_at: new Date('2024-01-17T09:15:00Z'),
      updated_at: new Date('2024-01-17T09:15:00Z')
    }
  ];

  await knex('controlled_drug_transactions').insert(transactions);

  // Controlled drug reconciliations
  const reconciliations = [
    {
      id: 'cd-recon-001',
      register_id: 'cd-register-001',
      reconciliation_date: new Date('2024-12-01T10:00:00Z'),
      expected_balance: 75.000,
      actual_balance: 75.000,
      discrepancy: 0.000,
      status: 'balanced',
      performed_by: sampleUsers[0],
      witnessed_by: sampleUsers[1],
      next_reconciliation_due: new Date('2025-01-01T10:00:00Z'),
      requires_investigation: false,
      organization_id: orgId,
      tenant_id: tenantId,
      created_at: new Date('2024-12-01T10:00:00Z'),
      updated_at: new Date('2024-12-01T10:00:00Z')
    },
    {
      id: 'cd-recon-002',
      register_id: 'cd-register-002',
      reconciliation_date: new Date('2024-12-01T11:00:00Z'),
      expected_balance: 150.000,
      actual_balance: 149.000,
      discrepancy: -1.000,
      status: 'under_investigation',
      discrepancy_reason: 'Minor discrepancy detected during monthly reconciliation',
      investigation_notes: 'Reviewing administration records for past week',
      performed_by: sampleUsers[0],
      witnessed_by: sampleUsers[2],
      next_reconciliation_due: new Date('2024-12-15T11:00:00Z'),
      requires_investigation: true,
      organization_id: orgId,
      tenant_id: tenantId,
      created_at: new Date('2024-12-01T11:00:00Z'),
      updated_at: new Date('2024-12-01T11:00:00Z')
    }
  ];

  await knex('controlled_drug_reconciliations').insert(reconciliations);

  // Controlled drug destructions
  const destructions = [
    {
      id: 'cd-dest-001',
      register_id: 'cd-register-003',
      quantity: 5.000,
      destruction_date: new Date('2024-11-15T14:00:00Z'),
      destruction_method: 'incineration',
      reason: 'Expired medication disposal as per MHRA guidelines',
      witness1_id: sampleUsers[0],
      witness2_id: sampleUsers[1],
      certificate_number: 'DEST-2024-001',
      disposal_company: 'Secure Medical Waste Ltd',
      mhra_notification_reference: 'MHRA-NOTIF-2024-001',
      mhra_notification_date: new Date('2024-11-16T09:00:00Z'),
      notes: 'Routine disposal of expired controlled substances',
      organization_id: orgId,
      tenant_id: tenantId,
      created_at: new Date('2024-11-15T14:00:00Z'),
      updated_at: new Date('2024-11-16T09:00:00Z')
    }
  ];

  await knex('controlled_drug_destructions').insert(destructions);

  // Controlled drug alerts
  const alerts = [
    {
      id: 'cd-alert-001',
      register_id: 'cd-register-001',
      alert_type: 'low_stock',
      severity: 'medium',
      title: 'Low Stock Alert - Morphine Sulfate',
      description: 'Current stock level (75 units) is below recommended minimum (100 units)',
      metadata: JSON.stringify({
        current_stock: 75,
        minimum_stock: 100,
        days_supply_remaining: 15,
        average_daily_usage: 5
      }),
      status: 'active',
      created_by: 'system',
      organization_id: orgId,
      tenant_id: tenantId,
      created_at: new Date('2024-12-15T08:00:00Z'),
      updated_at: new Date('2024-12-15T08:00:00Z')
    },
    {
      id: 'cd-alert-002',
      register_id: 'cd-register-002',
      alert_type: 'discrepancy_detected',
      severity: 'high',
      title: 'Stock Discrepancy Detected',
      description: 'Reconciliation shows 1 unit discrepancy requiring investigation',
      metadata: JSON.stringify({
        expected_balance: 150,
        actual_balance: 149,
        discrepancy: -1,
        reconciliation_date: '2024-12-01'
      }),
      status: 'acknowledged',
      created_by: 'system',
      acknowledged_by: sampleUsers[0],
      acknowledged_at: new Date('2024-12-01T12:00:00Z'),
      organization_id: orgId,
      tenant_id: tenantId,
      created_at: new Date('2024-12-01T11:30:00Z'),
      updated_at: new Date('2024-12-01T12:00:00Z')
    },
    {
      id: 'cd-alert-003',
      register_id: 'cd-register-001',
      alert_type: 'reconciliation_due',
      severity: 'medium',
      title: 'Monthly Reconciliation Due',
      description: 'Monthly controlled drug reconciliation is due for Morphine Sulfate',
      metadata: JSON.stringify({
        last_reconciliation: '2024-12-01',
        due_date: '2025-01-01',
        days_overdue: 0
      }),
      status: 'active',
      created_by: 'system',
      organization_id: orgId,
      tenant_id: tenantId,
      created_at: new Date('2024-12-31T08:00:00Z'),
      updated_at: new Date('2024-12-31T08:00:00Z')
    }
  ];

  await knex('controlled_drug_alerts').insert(alerts);

  console.log('Controlled substances seed data inserted successfully');
}