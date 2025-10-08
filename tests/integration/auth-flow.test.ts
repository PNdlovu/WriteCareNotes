/**
 * Authentication Flow Integration Test
 * 
 * Tests the complete authentication workflow end-to-end:
 * - User registration (if enabled)
 * - Login with credentials
 * - Token refresh
 * - Password reset flow
 * - Logout
 * - Session revocation
 * 
 * @category Integration Tests
 * @module AuthFlowTest
 */

import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/typeorm.config';
import app from '../../src/app';
import { User } from '../../src/entities/User';
import { Session, SessionStatus } from '../../src/entities/auth/Session';
import { RefreshToken } from '../../src/entities/auth/RefreshToken';
import { PasswordReset } from '../../src/entities/auth/PasswordReset';
import bcrypt from 'bcrypt';

describe('Authentication Flow Integration Tests', () => {
  let connection: DataSource;
  let testUser: User;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      connection = await AppDataSource.initialize();
    } else {
      connection = AppDataSource;
    }

    // Create test user
    const userRepo = connection.getRepository(User);
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    
    testUser = userRepo.create({
      email: 'test-auth@example.com',
      firstName: 'Test',
      lastName: 'User',
      passwordHash: hashedPassword,
      tenantId: '00000000-0000-0000-0000-000000000001',
      isActive: true,
      isVerified: true,
    });

    await userRepo.save(testUser);
  });

  afterAll(async () => {
    // Clean up test data
    const userRepo = connection.getRepository(User);
    const sessionRepo = connection.getRepository(Session);
    const refreshTokenRepo = connection.getRepository(RefreshToken);
    const passwordResetRepo = connection.getRepository(PasswordReset);

    await passwordResetRepo.delete({ userId: testUser.id });
    await refreshTokenRepo.delete({ userId: testUser.id });
    await sessionRepo.delete({ userId: testUser.id });
    await userRepo.delete({ id: testUser.id });

    if (connection.isInitialized) {
      await connection.destroy();
    }
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials and return tokens', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test-auth@example.com',
          password: 'TestPassword123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'test-auth@example.com');
      expect(response.body.user).not.toHaveProperty('password');

      // Store tokens for subsequent tests
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should fail login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test-auth@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should fail login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should create session record on successful login', async () => {
      const sessionRepo = connection.getRepository(Session);
      const sessions = await sessionRepo.find({
        where: { userId: testUser.id },
        order: { createdAt: 'DESC' },
      });

      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions[0].status).toBe(SessionStatus.ACTIVE);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      // Store new tokens
      const newAccessToken = response.body.accessToken;
      const newRefreshToken = response.body.refreshToken;

      expect(newAccessToken).not.toBe(accessToken);
      expect(newRefreshToken).not.toBe(refreshToken);

      // Update for subsequent tests
      accessToken = newAccessToken;
      refreshToken = newRefreshToken;
    });

    it('should fail refresh with invalid token', async () => {
      await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token-12345',
        })
        .expect(401);
    });

    it('should mark old refresh token as used', async () => {
      const refreshTokenRepo = connection.getRepository(RefreshToken);
      const usedTokens = await refreshTokenRepo.find({
        where: { userId: testUser.id, isUsed: true },
      });

      expect(usedTokens.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid access token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should fail without authorization header', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    it('should fail with invalid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect(401);
    });
  });

  describe('POST /api/auth/password-reset/initiate', () => {
    it('should initiate password reset for valid email', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset/initiate')
        .send({
          email: 'test-auth@example.com',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('password reset');
    });

    it('should create password reset record', async () => {
      const passwordResetRepo = connection.getRepository(PasswordReset);
      const resetRecords = await passwordResetRepo.find({
        where: { userId: testUser.id },
        order: { createdAt: 'DESC' },
      });

      expect(resetRecords.length).toBeGreaterThan(0);
      expect(resetRecords[0].isUsed).toBe(false);
    });

    it('should not reveal if email does not exist (security)', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset/initiate')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/password-reset/complete', () => {
    let resetToken: string;

    beforeAll(async () => {
      // Get the latest password reset token
      const passwordResetRepo = connection.getRepository(PasswordReset);
      const resetRecord = await passwordResetRepo.findOne({
        where: { userId: testUser.id, isUsed: false },
        order: { createdAt: 'DESC' },
      });

      expect(resetRecord).toBeDefined();
      resetToken = resetRecord!.token;
    });

    it('should complete password reset with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/password-reset/complete')
        .send({
          token: resetToken,
          newPassword: 'NewPassword123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Password reset successful');
    });

    it('should mark reset token as used', async () => {
      const passwordResetRepo = connection.getRepository(PasswordReset);
      const resetRecord = await passwordResetRepo.findOne({
        where: { token: resetToken },
      });

      expect(resetRecord?.isUsed).toBe(true);
    });

    it('should allow login with new password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test-auth@example.com',
          password: 'NewPassword123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
    });

    it('should fail with expired token', async () => {
      await request(app)
        .post('/api/auth/password-reset/complete')
        .send({
          token: resetToken,
          newPassword: 'AnotherPassword123!',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout and revoke session', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Logged out');
    });

    it('should revoke session in database', async () => {
      const sessionRepo = connection.getRepository(Session);
      const sessions = await sessionRepo.find({
        where: { userId: testUser.id, status: SessionStatus.ACTIVE },
      });

      // Should have no active sessions after logout
      expect(sessions.length).toBe(0);
    });

    it('should fail to access protected routes after logout', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });
  });

  describe('POST /api/auth/revoke-all', () => {
    beforeAll(async () => {
      // Login again to create new sessions
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test-auth@example.com',
          password: 'NewPassword123!',
        });

      accessToken = response.body.accessToken;
    });

    it('should revoke all user sessions', async () => {
      const response = await request(app)
        .post('/api/auth/revoke-all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('All sessions revoked');
    });

    it('should have no active sessions in database', async () => {
      const sessionRepo = connection.getRepository(Session);
      const activeSessions = await sessionRepo.find({
        where: { userId: testUser.id, status: SessionStatus.ACTIVE },
      });

      expect(activeSessions.length).toBe(0);
    });
  });
});
