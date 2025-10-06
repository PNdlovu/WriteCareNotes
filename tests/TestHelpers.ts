import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { Application } from 'express';
import { databaseService } from '../services/core/DatabaseService';
import { configService } from '../services/core/ConfigurationService';
import { loggerService } from '../services/core/LoggerService';

// Test utilities and helpers
export class TestHelpers {
  private static app: Application;
  private static testDatabase: string;

  // Initialize test environment
  public static async setupTestEnvironment(app: Application): Promise<void> {
    this.app = app;
    this.testDatabase = `${configService.getDatabase().database}_test`;
    
    // Set up test database
    await this.createTestDatabase();
    await this.runMigrations();
    await this.seedTestData();
    
    loggerService.info('Test environment initialized');
  }

  // Clean up test environment
  public static async teardownTestEnvironment(): Promise<void> {
    await this.cleanupTestDatabase();
    await databaseService.close();
    loggerService.info('Test environment cleaned up');
  }

  // Database helpers
  private static async createTestDatabase(): Promise<void> {
    // Create test database if it doesn't exist
    await databaseService.query(`
      SELECT 'CREATE DATABASE ${this.testDatabase}'
      WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${this.testDatabase}')
    `);
  }

  private static async runMigrations(): Promise<void> {
    // Run database migrations for tests
    // This would typically use a migration tool like Knex.js
    const migrationQueries = [
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
      
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        permissions JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        last_login_at TIMESTAMP,
        login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );`,
      
      // Patients table
      `CREATE TABLE IF NOT EXISTS patients (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        date_of_birth DATE,
        phone VARCHAR(20),
        address JSONB,
        medical_record_number VARCHAR(50) UNIQUE,
        emergency_contact JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );`,
      
      // Care notes table
      `CREATE TABLE IF NOT EXISTS care_notes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        patient_id UUID REFERENCES patients(id),
        author_id UUID REFERENCES users(id),
        title VARCHAR(255),
        content TEXT NOT NULL,
        note_type VARCHAR(50),
        is_private BOOLEAN DEFAULT false,
        tags JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );`,
      
      // Communication sessions table
      `CREATE TABLE IF NOT EXISTS communication_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        patient_id UUID REFERENCES patients(id),
        provider_id UUID REFERENCES users(id),
        session_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        scheduled_at TIMESTAMP,
        started_at TIMESTAMP,
        ended_at TIMESTAMP,
        notes TEXT,
        recording_url VARCHAR(500),
        transcript TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );`
    ];

    for (const query of migrationQueries) {
      await databaseService.query(query);
    }
  }

  private static async seedTestData(): Promise<void> {
    // Create test users
    const testUsers = [
      {
        email: 'patient@test.com',
        passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewlBLKNyQa8VhDjK', // password123
        role: 'patient',
        permissions: '["view_own_profile", "update_own_profile"]'
      },
      {
        email: 'caregiver@test.com',
        passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewlBLKNyQa8VhDjK',
        role: 'caregiver',
        permissions: '["view_assigned_patients", "create_care_notes"]'
      },
      {
        email: 'supervisor@test.com',
        passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewlBLKNyQa8VhDjK',
        role: 'supervisor',
        permissions: '["view_supervision_reports", "manage_caregivers"]'
      }
    ];

    for (const user of testUsers) {
      await databaseService.query(`
        INSERT INTO users (email, password_hash, role, permissions)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO NOTHING
      `, [user.email, user.passwordHash, user.role, user.permissions]);
    }
  }

  private static async cleanupTestDatabase(): Promise<void> {
    // Clean up test data
    const tables = ['communication_sessions', 'care_notes', 'patients', 'users'];
    
    for (const table of tables) {
      await databaseService.query(`TRUNCATE TABLE ${table} CASCADE`);
    }
  }

  // Authentication helpers
  public static async getAuthToken(email: string = 'caregiver@test.com'): Promise<string> {
    const response = await request(this.app)
      .post('/api/auth/login')
      .send({
        email,
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    
    return response.body.token;
  }

  // Data creation helpers
  public static async createTestPatient(overrides: any = {}): Promise<any> {
    const token = await this.getAuthToken();
    
    const patientData = {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1980-01-01',
      phone: '+1234567890',
      address: {
        street: '123 Test St',
        city: 'Test City',
        postalCode: 'T3ST 1NG'
      },
      emergencyContact: {
        name: 'Jane Doe',
        phone: '+1234567891',
        relationship: 'spouse'
      },
      ...overrides
    };

    const response = await request(this.app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send(patientData);

    expect(response.status).toBe(201);
    return response.body;
  }

  public static async createTestCareNote(patientId: string, overrides: any = {}): Promise<any> {
    const token = await this.getAuthToken();
    
    const noteData = {
      patientId,
      title: 'Test Care Note',
      content: 'This is a test care note content.',
      noteType: 'daily_observation',
      tags: ['test', 'observation'],
      ...overrides
    };

    const response = await request(this.app)
      .post('/api/care-notes')
      .set('Authorization', `Bearer ${token}`)
      .send(noteData);

    expect(response.status).toBe(201);
    return response.body;
  }

  public static async createTestSession(patientId: string, overrides: any = {}): Promise<any> {
    const token = await this.getAuthToken();
    
    const sessionData = {
      patientId,
      sessionType: 'video_call',
      scheduledAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      ...overrides
    };

    const response = await request(this.app)
      .post('/api/communication/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(sessionData);

    expect(response.status).toBe(201);
    return response.body;
  }

  // Assertion helpers
  public static expectValidationError(response: any, field?: string): void {
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('VALIDATION_ERROR');
    
    if (field) {
      expect(response.body.message).toContain(field);
    }
  }

  public static expectAuthenticationError(response: any): void {
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('AUTHENTICATION_REQUIRED');
  }

  public static expectAuthorizationError(response: any): void {
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('FORBIDDEN');
  }

  public static expectNotFoundError(response: any): void {
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('NOT_FOUND');
  }

  // Mock helpers
  public static mockAIService(): void {
    const aiService = require('../services/core/AIService').aiService;
    
    // Mock AI service methods
    jest.spyOn(aiService, 'summarizeText').mockResolvedValue('Test summary');
    jest.spyOn(aiService, 'analyzeSentiment').mockResolvedValue({
      sentiment: 'neutral',
      confidence: 0.8,
      emotions: []
    });
    jest.spyOn(aiService, 'analyzeCompliance').mockResolvedValue({
      compliant: true,
      issues: [],
      recommendations: [],
      confidence: 0.9
    });
  }

  public static mockEmailService(): void {
    // Mock email service if it exists
    // This would be implemented based on your email service structure
  }

  public static mockSMSService(): void {
    // Mock SMS service if it exists
    // This would be implemented based on your SMS service structure
  }

  // Test data cleanup
  public static async cleanupTestData(): Promise<void> {
    await this.cleanupTestDatabase();
  }

  // Utility methods
  public static generateTestEmail(): string {
    return `test-${Math.random().toString(36).substring(7)}@example.com`;
  }

  public static generateTestPhone(): string {
    return `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
  }

  public static waitFor(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Jest setup and teardown
export const setupTests = () => {
  beforeAll(async () => {
    // This would be called from your test setup file
    // Example: await TestHelpers.setupTestEnvironment(app);
  });

  afterAll(async () => {
    await TestHelpers.teardownTestEnvironment();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await TestHelpers.cleanupTestData();
  });

  afterEach(async () => {
    // Additional cleanup if needed
    jest.restoreAllMocks();
  });
};

// Example test suites
export const createServiceTestSuite = (serviceName: string, serviceInstance: any) => {
  describe(`${serviceName} Service`, () => {
    test('should be defined', () => {
      expect(serviceInstance).toBeDefined();
    });

    test('should have required methods', () => {
      // This would be customized based on the service
      expect(typeof serviceInstance.healthCheck).toBe('function');
    });
  });
};

export const createAPITestSuite = (routeName: string, basePath: string) => {
  describe(`${routeName} API`, () => {
    test('should require authentication for protected routes', async () => {
      const response = await request(TestHelpers['app'])
        .get(basePath)
        .expect(401);
        
      TestHelpers.expectAuthenticationError(response);
    });

    test('should handle invalid requests gracefully', async () => {
      const token = await TestHelpers.getAuthToken();
      
      const response = await request(TestHelpers['app'])
        .post(basePath)
        .set('Authorization', `Bearer ${token}`)
        .send({});
        
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
};

export default TestHelpers;