/**
 * Organization CRUD Integration Test
 * 
 * Tests complete organization management workflow end-to-end:
 * - Create organization
 * - Read organization (single & list)
 * - Update organization
 * - Update settings
 * - Update compliance status
 * - Soft delete organization
 * - Tenant isolation verification
 * 
 * @category Integration Tests
 * @module OrganizationCRUDTest
 */

import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/typeorm.config';
import app from '../../src/app';
import { User } from '../../src/entities/User';
import { Organization, OrganizationType } from '../../src/entities/Organization';
import { Tenant } from '../../src/entities/Tenant';
import bcrypt from 'bcrypt';

describe('Organization CRUD Integration Tests', () => {
  let connection: DataSource;
  let tenant1: Tenant;
  let tenant2: Tenant;
  let user1: User;
  let user2: User;
  let accessToken1: string;
  let accessToken2: string;
  let organization1Id: string;
  let organization2Id: string;

  beforeAll(async () => {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      connection = await AppDataSource.initialize();
    } else {
      connection = AppDataSource;
    }

    const tenantRepo = connection.getRepository(Tenant);
    const userRepo = connection.getRepository(User);

    // Create Tenant 1
    tenant1 = tenantRepo.create({
      name: 'Test Tenant 1',
      subdomain: 'test-tenant-1',
      isActive: true,
    });
    await tenantRepo.save(tenant1);

    // Create Tenant 2
    tenant2 = tenantRepo.create({
      name: 'Test Tenant 2',
      subdomain: 'test-tenant-2',
      isActive: true,
    });
    await tenantRepo.save(tenant2);

    // Create User 1 (Tenant 1)
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    user1 = userRepo.create({
      email: 'user1@test-tenant-1.com',
      firstName: 'User',
      lastName: 'One',
      passwordHash: hashedPassword,
      tenantId: tenant1.id,
      isActive: true,
      isVerified: true,
    });
    await userRepo.save(user1);

    // Create User 2 (Tenant 2)
    user2 = userRepo.create({
      email: 'user2@test-tenant-2.com',
      firstName: 'User',
      lastName: 'Two',
      passwordHash: hashedPassword,
      tenantId: tenant2.id,
      isActive: true,
      isVerified: true,
    });
    await userRepo.save(user2);

    // Login User 1
    const login1 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user1@test-tenant-1.com',
        password: 'TestPassword123!',
      });
    accessToken1 = login1.body.accessToken;

    // Login User 2
    const login2 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user2@test-tenant-2.com',
        password: 'TestPassword123!',
      });
    accessToken2 = login2.body.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    const organizationRepo = connection.getRepository(Organization);
    const userRepo = connection.getRepository(User);
    const tenantRepo = connection.getRepository(Tenant);

    await organizationRepo.delete({ tenantId: tenant1.id });
    await organizationRepo.delete({ tenantId: tenant2.id });
    await userRepo.delete({ id: user1.id });
    await userRepo.delete({ id: user2.id });
    await tenantRepo.delete({ id: tenant1.id });
    await tenantRepo.delete({ id: tenant2.id });

    if (connection.isInitialized) {
      await connection.destroy();
    }
  });

  describe('POST /api/organizations - Create Organization', () => {
    it('should create organization for tenant 1', async () => {
      const response = await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          name: 'Care Home Alpha',
          type: OrganizationType.CARE_HOME,
          address: {
            street: '123 Care Street',
            city: 'London',
            postcode: 'SW1A 1AA',
            country: 'United Kingdom',
          },
          contactEmail: 'admin@carehome-alpha.com',
          contactPhone: '+44 20 1234 5678',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Care Home Alpha');
      expect(response.body).toHaveProperty('type', OrganizationType.CARE_HOME);
      expect(response.body).toHaveProperty('tenantId', tenant1.id);

      organization1Id = response.body.id;
    });

    it('should create organization for tenant 2', async () => {
      const response = await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          name: 'Nursing Home Beta',
          type: OrganizationType.NURSING_HOME,
          address: {
            street: '456 Nursing Lane',
            city: 'Manchester',
            postcode: 'M1 1AA',
            country: 'United Kingdom',
          },
          contactEmail: 'admin@nursinghome-beta.com',
          contactPhone: '+44 161 234 5678',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Nursing Home Beta');
      expect(response.body).toHaveProperty('tenantId', tenant2.id);

      organization2Id = response.body.id;
    });

    it('should have default settings based on organization type', async () => {
      const response = await request(app)
        .get(`/api/organizations/${organization1Id}`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(200);

      expect(response.body).toHaveProperty('settings');
      expect(response.body.settings).toHaveProperty('staffToResidentRatio');
      expect(response.body.settings).toHaveProperty('maxResidents');
    });

    it('should fail without authentication', async () => {
      await request(app)
        .post('/api/organizations')
        .send({
          name: 'Unauthorized Org',
          type: OrganizationType.CARE_HOME,
        })
        .expect(401);
    });

    it('should fail with invalid organization type', async () => {
      await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          name: 'Invalid Org',
          type: 'INVALID_TYPE',
        })
        .expect(400);
    });
  });

  describe('GET /api/organizations - List Organizations', () => {
    it('should return organizations for tenant 1 only', async () => {
      const response = await request(app)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // All organizations should belong to tenant 1
      response.body.forEach((org: any) => {
        expect(org.tenantId).toBe(tenant1.id);
      });
    });

    it('should return organizations for tenant 2 only', async () => {
      const response = await request(app)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // All organizations should belong to tenant 2
      response.body.forEach((org: any) => {
        expect(org.tenantId).toBe(tenant2.id);
      });
    });

    it('should enforce tenant isolation (tenant 1 cannot see tenant 2 orgs)', async () => {
      const response = await request(app)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(200);

      // Should not contain tenant 2's organization
      const tenant2OrgFound = response.body.find((org: any) => org.id === organization2Id);
      expect(tenant2OrgFound).toBeUndefined();
    });
  });

  describe('GET /api/organizations/:id - Get Single Organization', () => {
    it('should return organization by ID for authorized tenant', async () => {
      const response = await request(app)
        .get(`/api/organizations/${organization1Id}`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', organization1Id);
      expect(response.body).toHaveProperty('name', 'Care Home Alpha');
    });

    it('should fail to access organization from different tenant', async () => {
      await request(app)
        .get(`/api/organizations/${organization1Id}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(404);
    });

    it('should fail with invalid organization ID', async () => {
      await request(app)
        .get('/api/organizations/invalid-uuid-12345')
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(400);
    });
  });

  describe('PUT /api/organizations/:id - Update Organization', () => {
    it('should update organization details', async () => {
      const response = await request(app)
        .put(`/api/organizations/${organization1Id}`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          name: 'Care Home Alpha Updated',
          contactEmail: 'new-admin@carehome-alpha.com',
        })
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Care Home Alpha Updated');
      expect(response.body).toHaveProperty('contactEmail', 'new-admin@carehome-alpha.com');
    });

    it('should fail to update organization from different tenant', async () => {
      await request(app)
        .put(`/api/organizations/${organization1Id}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          name: 'Hacked Name',
        })
        .expect(404);
    });

    it('should persist updated data', async () => {
      const response = await request(app)
        .get(`/api/organizations/${organization1Id}`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Care Home Alpha Updated');
    });
  });

  describe('PUT /api/organizations/:id/settings - Update Settings', () => {
    it('should update organization settings', async () => {
      const response = await request(app)
        .put(`/api/organizations/${organization1Id}/settings`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          staffToResidentRatio: '1:5',
          maxResidents: 40,
          enableMedicationManagement: true,
        })
        .expect(200);

      expect(response.body.settings).toHaveProperty('staffToResidentRatio', '1:5');
      expect(response.body.settings).toHaveProperty('maxResidents', 40);
    });

    it('should fail to update settings from different tenant', async () => {
      await request(app)
        .put(`/api/organizations/${organization1Id}/settings`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          maxResidents: 100,
        })
        .expect(404);
    });
  });

  describe('PUT /api/organizations/:id/compliance - Update Compliance Status', () => {
    it('should update compliance status', async () => {
      const response = await request(app)
        .put(`/api/organizations/${organization1Id}/compliance`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          cqcRegistered: true,
          cqcRating: 'Good',
          lastInspectionDate: '2024-01-15',
        })
        .expect(200);

      expect(response.body.complianceStatus).toHaveProperty('cqcRegistered', true);
      expect(response.body.complianceStatus).toHaveProperty('cqcRating', 'Good');
    });

    it('should fail to update compliance from different tenant', async () => {
      await request(app)
        .put(`/api/organizations/${organization1Id}/compliance`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          cqcRating: 'Outstanding',
        })
        .expect(404);
    });
  });

  describe('DELETE /api/organizations/:id - Soft Delete Organization', () => {
    it('should soft delete organization', async () => {
      const response = await request(app)
        .delete(`/api/organizations/${organization1Id}`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted');
    });

    it('should not return soft-deleted organization in list', async () => {
      const response = await request(app)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(200);

      const deletedOrg = response.body.find((org: any) => org.id === organization1Id);
      expect(deletedOrg).toBeUndefined();
    });

    it('should fail to access soft-deleted organization', async () => {
      await request(app)
        .get(`/api/organizations/${organization1Id}`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(404);
    });

    it('should fail to delete organization from different tenant', async () => {
      await request(app)
        .delete(`/api/organizations/${organization2Id}`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(404);
    });
  });

  describe('Tenant Isolation Security Tests', () => {
    it('should never leak tenant IDs in error messages', async () => {
      const response = await request(app)
        .get(`/api/organizations/${organization2Id}`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(404);

      // Should not expose tenant details
      const bodyStr = JSON.stringify(response.body);
      expect(bodyStr).not.toContain(tenant2.id);
    });

    it('should prevent cross-tenant data access via query manipulation', async () => {
      // Attempt to access tenant 2 data from tenant 1 context
      const response = await request(app)
        .get('/api/organizations')
        .query({ tenantId: tenant2.id })
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(200);

      // Should still only return tenant 1 data
      response.body.forEach((org: any) => {
        expect(org.tenantId).toBe(tenant1.id);
      });
    });
  });
});
