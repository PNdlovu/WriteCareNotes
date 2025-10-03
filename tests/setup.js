"use strict";
/**
 * @fileoverview Jest test setup configuration
 * @module TestSetup
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 */
// Global test setup
beforeAll(() => {
    // Set test environment
    process.env['NODE_ENV'] = 'test';
});
afterAll(() => {
    // Cleanup after all tests
});
//# sourceMappingURL=setup.js.map