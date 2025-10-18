/**
 * JSON Storage Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { JsonStorage } from '../../../src/storage/json-storage.js';
import { Client } from '../../../src/models/index.js';
import { mockClient } from '../../fixtures/index.js';
import fs from 'fs-extra';
import path from 'path';

describe('JsonStorage', () => {
  const testDataDir = path.join(process.cwd(), 'tests', 'test-data-json');
  let storage: JsonStorage;

  beforeEach(async () => {
    // Ensure test data directory is clean
    await fs.remove(testDataDir);
    await fs.ensureDir(testDataDir);

    storage = new JsonStorage({ dataDir: testDataDir });
    await storage.initialize();
  });

  afterEach(async () => {
    // Clean up
    await fs.remove(testDataDir);
  });

  describe('initialize', () => {
    it('should create all collection files', async () => {
      const collections = ['clients', 'goals', 'activities', 'stakeholders', 'shift_notes'];

      for (const collection of collections) {
        const filePath = path.join(testDataDir, `${collection}.json`);
        const exists = await fs.pathExists(filePath);
        expect(exists).toBe(true);
      }
    });

    it('should initialize empty collections', async () => {
      const stats = await storage.getStats();
      expect(stats.total_records).toBe(0);
      expect(stats.records_by_collection.clients).toBe(0);
    });
  });

  describe('write and read', () => {
    it('should write and read a client', async () => {
      await storage.write('clients', mockClient);

      const retrieved = await storage.read<Client>('clients', mockClient.id);
      expect(retrieved).toEqual(mockClient);
    });

    it('should return null for non-existent record', async () => {
      const retrieved = await storage.read<Client>('clients', 'non-existent-id');
      expect(retrieved).toBeNull();
    });

    it('should overwrite existing record', async () => {
      await storage.write('clients', mockClient);

      const updated = { ...mockClient, name: 'Updated Name' };
      await storage.write('clients', updated);

      const retrieved = await storage.read<Client>('clients', mockClient.id);
      expect(retrieved?.name).toBe('Updated Name');
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      // Add multiple clients
      await storage.write('clients', mockClient);
      await storage.write('clients', {
        ...mockClient,
        id: 'client-2',
        name: 'Second Client',
        active: false,
      });
      await storage.write('clients', {
        ...mockClient,
        id: 'client-3',
        name: 'Third Client',
      });
    });

    it('should list all clients', async () => {
      const clients = await storage.list<Client>('clients');
      expect(clients).toHaveLength(3);
    });

    it('should filter by active status', async () => {
      const activeClients = await storage.list<Client>('clients', { active: true } as Partial<Client>);
      expect(activeClients).toHaveLength(2);
    });

    it('should apply limit', async () => {
      const clients = await storage.list<Client>('clients', undefined, { limit: 2 });
      expect(clients).toHaveLength(2);
    });

    it('should apply offset', async () => {
      const clients = await storage.list<Client>('clients', undefined, { offset: 2 });
      expect(clients).toHaveLength(1);
    });

    it('should sort by field', async () => {
      const clients = await storage.list<Client>('clients', undefined, {
        sortBy: 'name',
        sortOrder: 'asc',
      });
      expect(clients[0].name).toBe('John Smith');
      expect(clients[1].name).toBe('Second Client');
      expect(clients[2].name).toBe('Third Client');
    });
  });

  describe('delete', () => {
    it('should delete a record', async () => {
      await storage.write('clients', mockClient);

      const deleted = await storage.delete('clients', mockClient.id);
      expect(deleted).toBe(true);

      const retrieved = await storage.read<Client>('clients', mockClient.id);
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent record', async () => {
      const deleted = await storage.delete('clients', 'non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing record', async () => {
      await storage.write('clients', mockClient);

      const exists = await storage.exists('clients', mockClient.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent record', async () => {
      const exists = await storage.exists('clients', 'non-existent-id');
      expect(exists).toBe(false);
    });
  });

  describe('count', () => {
    beforeEach(async () => {
      await storage.write('clients', mockClient);
      await storage.write('clients', {
        ...mockClient,
        id: 'client-2',
        active: false,
      });
    });

    it('should count all records', async () => {
      const count = await storage.count('clients');
      expect(count).toBe(2);
    });

    it('should count with filter', async () => {
      const count = await storage.count('clients', { active: true } as Partial<Client>);
      expect(count).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all records in collection', async () => {
      await storage.write('clients', mockClient);
      await storage.write('clients', { ...mockClient, id: 'client-2' });

      await storage.clear('clients');

      const count = await storage.count('clients');
      expect(count).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return accurate statistics', async () => {
      await storage.write('clients', mockClient);
      await storage.write('clients', { ...mockClient, id: 'client-2' });

      const stats = await storage.getStats();
      expect(stats.total_records).toBe(2);
      expect(stats.records_by_collection.clients).toBe(2);
      expect(stats.records_by_collection.goals).toBe(0);
    });
  });
});
