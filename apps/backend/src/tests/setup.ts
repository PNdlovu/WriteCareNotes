import { jest } from '@jest/globals';

// Global test setup
beforeAll(() => {
  // Mock console methods to reduce noise in tests
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  // Restore console methods
  jest.restoreAllMocks();
});

// Mock environment variables
process.env['NODE_ENV'] = 'test';
process.env['JWT_SECRET'] = 'test-secret';
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test_db';
