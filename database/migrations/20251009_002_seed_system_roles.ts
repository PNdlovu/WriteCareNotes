/**
 * @fileoverview Seed System Roles with Permissions
 * @module Migrations/Roles
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-09
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description
 * Seeds system roles with permission arrays to support:
 * - Role-based access control (RBAC)
 * - Permission-based data access levels
 * - Compliance level calculations
 * - Multi-tenancy security
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  console.log('🌱 Seeding system roles with permissions...');

  // Check if roles table exists
  const hasRoles = await knex.schema.hasTable('roles');
  if (!hasRoles) {
    console.log('📝 Creating roles table...');
    
    await knex.schema.createTable('roles', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 50).unique().notNullable();
      table.string('display_name', 100).notNullable();
      table.text('description').nullable();
      table.jsonb('permissions').defaultTo('[]');
      table.boolean('is_system_role').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Indexes
      table.index(['name']);
      table.index(['is_system_role']);
    });
    
    console.log('✅ roles table created');
  }

  // Check if roles already seeded
  const existingRoles = await knex('roles').count('* as count');
  if (existingRoles[0].count > 0) {
    console.log('⚠️  Roles already seeded - skipping to avoid duplicates');
    console.log(`   Existing roles: ${existingRoles[0].count}`);
    return;
  }

  // Seed system roles with comprehensive permissions
  const systemRoles = [
    {
      name: 'system_admin',
      display_name: 'System Administrator',
      description: 'Full system access - technical administration and configuration',
      permissions: JSON.stringify([
        'system:admin',
        'system:*',
        '*'
      ]),
      is_system_role: true
    },
    {
      name: 'org_admin',
      display_name: 'Organization Administrator',
      description: 'Full organization access - manage all aspects of their organization',
      permissions: JSON.stringify([
        'organization:admin',
        'organization:*',
        'department:manage',
        'team:manage',
        'user:manage',
        'resident:*',
        'care:*',
        'medication:*',
        'compliance:report',
        'audit:review'
      ]),
      is_system_role: true
    },
    {
      name: 'compliance_officer',
      display_name: 'Compliance Officer',
      description: 'Full compliance oversight - audit, reporting, and compliance management',
      permissions: JSON.stringify([
        'compliance:admin',
        'compliance:*',
        'audit:admin',
        'audit:*',
        'organization:read',
        'resident:read',
        'care:read',
        'medication:read',
        'staff:read'
      ]),
      is_system_role: true
    },
    {
      name: 'manager',
      display_name: 'Care Home Manager',
      description: 'Department/team management - oversee care delivery and team operations',
      permissions: JSON.stringify([
        'department:manage',
        'team:manage',
        'resident:read',
        'resident:create',
        'resident:update',
        'care:read',
        'care:manage',
        'medication:read',
        'medication:review',
        'compliance:manage',
        'audit:create',
        'staff:read',
        'staff:manage'
      ]),
      is_system_role: true
    },
    {
      name: 'senior_nurse',
      display_name: 'Senior Nurse',
      description: 'Senior clinical staff - advanced care delivery and medication management',
      permissions: JSON.stringify([
        'resident:read',
        'care:read',
        'care:manage',
        'medication:read',
        'medication:administer',
        'medication:review',
        'compliance:report',
        'audit:create'
      ]),
      is_system_role: true
    },
    {
      name: 'care_staff',
      display_name: 'Care Staff',
      description: 'Frontline care workers - daily care delivery and record keeping',
      permissions: JSON.stringify([
        'resident:read',
        'care:read',
        'care:create',
        'care:update',
        'medication:read',
        'activity:read',
        'activity:create'
      ]),
      is_system_role: false
    },
    {
      name: 'support_worker',
      display_name: 'Support Worker',
      description: 'Support staff - assist with activities and basic care tasks',
      permissions: JSON.stringify([
        'resident:read',
        'activity:read',
        'activity:create',
        'care:read'
      ]),
      is_system_role: false
    },
    {
      name: 'finance_admin',
      display_name: 'Finance Administrator',
      description: 'Financial management - billing, payments, and financial reporting',
      permissions: JSON.stringify([
        'finance:admin',
        'finance:*',
        'resident:read',
        'organization:read',
        'billing:manage',
        'payment:manage',
        'invoice:create',
        'report:finance'
      ]),
      is_system_role: false
    },
    {
      name: 'receptionist',
      display_name: 'Receptionist',
      description: 'Front desk operations - visitor management and basic information access',
      permissions: JSON.stringify([
        'resident:read',
        'visitor:manage',
        'appointment:manage',
        'communication:create'
      ]),
      is_system_role: false
    },
    {
      name: 'family_member',
      display_name: 'Family Member',
      description: 'Limited access - view information for specific resident(s) only',
      permissions: JSON.stringify([
        'resident:read_assigned',
        'care:read_assigned',
        'communication:create',
        'communication:read'
      ]),
      is_system_role: false
    }
  ];

  // Insert all roles
  await knex('roles').insert(systemRoles);

  console.log(`✅ Seeded ${systemRoles.length} system roles with permissions`);
  console.log('\n📋 Roles created:');
  systemRoles.forEach(role => {
    const permCount = JSON.parse(role.permissions).length;
    console.log(`   - ${role.display_name} (${permCount} permissions)`);
  });

  console.log('\n🎯 Permission-based features enabled:');
  console.log('   ✓ Data access level calculation (0-5)');
  console.log('   ✓ Compliance level calculation (0-5)');
  console.log('   ✓ Role-based authorization');
  console.log('   ✓ Permission-based feature access');
}

export async function down(knex: Knex): Promise<void> {
  console.log('⏪ Rolling back system roles seed...');
  
  // Delete only system roles we created
  await knex('roles')
    .whereIn('name', [
      'system_admin',
      'org_admin',
      'compliance_officer',
      'manager',
      'senior_nurse',
      'care_staff',
      'support_worker',
      'finance_admin',
      'receptionist',
      'family_member'
    ])
    .delete();

  console.log('✅ System roles removed');
}
