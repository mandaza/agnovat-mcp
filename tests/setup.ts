/**
 * Jest Test Setup
 *
 * Global test configuration and setup.
 */

// Set test environment variables
process.env['NODE_ENV'] = 'test';
process.env['DATA_DIR'] = './tests/test-data';

// Global test timeout
jest.setTimeout(10000);
