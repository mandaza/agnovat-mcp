/**
 * Client Tools Unit Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  createClient,
  getClient,
  listClients,
  updateClient,
  deactivateClient,
  searchClients,
} from '../../../src/tools/clients.js';
import { createTestStorage } from '../../helpers/test-storage.js';
import { mockClient, createClientInput } from '../../fixtures/index.js';
import { ValidationError, NotFoundError, ConflictError } from '../../../src/utils/errors.js';
import type { StorageProvider } from '../../../src/storage/base.js';

describe('Client Tools', () => {
  let storage: StorageProvider;

  beforeEach(async () => {
    storage = await createTestStorage();
  });

  describe('createClient', () => {
    it('should create a valid client', async () => {
      const client = await createClient(storage, createClientInput);

      expect(client).toHaveProperty('id');
      expect(client.name).toBe(createClientInput.name);
      expect(client.date_of_birth).toBe(createClientInput.date_of_birth);
      expect(client.active).toBe(true);
      expect(client).toHaveProperty('created_at');
      expect(client).toHaveProperty('updated_at');
    });

    it('should throw ValidationError for missing name', async () => {
      const invalidInput = { ...createClientInput, name: '' };

      await expect(createClient(storage, invalidInput)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for future date of birth', async () => {
      const invalidInput = { ...createClientInput, date_of_birth: '2030-01-01' };

      await expect(createClient(storage, invalidInput)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid NDIS number format', async () => {
      const invalidInput = { ...createClientInput, ndis_number: '123' };

      await expect(createClient(storage, invalidInput)).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError for duplicate NDIS number', async () => {
      await createClient(storage, createClientInput);

      const duplicateInput = {
        ...createClientInput,
        name: 'Different Name',
      };

      await expect(createClient(storage, duplicateInput)).rejects.toThrow(ConflictError);
    });

    it('should allow same NDIS number for inactive client', async () => {
      const client1 = await createClient(storage, createClientInput);
      await deactivateClient(storage, client1.id);

      const client2 = await createClient(storage, createClientInput);

      expect(client2.id).not.toBe(client1.id);
      expect(client2.active).toBe(true);
    });
  });

  describe('getClient', () => {
    it('should retrieve client with stats', async () => {
      await storage.write('clients', mockClient);

      const result = await getClient(storage, mockClient.id);

      expect(result.id).toBe(mockClient.id);
      expect(result.name).toBe(mockClient.name);
      expect(result).toHaveProperty('total_goals');
      expect(result).toHaveProperty('active_goals');
      expect(result).toHaveProperty('total_activities');
    });

    it('should throw NotFoundError for non-existent client', async () => {
      await expect(getClient(storage, 'non-existent-id')).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid ID', async () => {
      await expect(getClient(storage, '')).rejects.toThrow(ValidationError);
    });
  });

  describe('listClients', () => {
    beforeEach(async () => {
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
        name: 'Alice Test',
      });
    });

    it('should list all clients', async () => {
      const clients = await listClients(storage);

      expect(clients).toHaveLength(3);
    });

    it('should filter by active status', async () => {
      const activeClients = await listClients(storage, { active: true });

      expect(activeClients).toHaveLength(2);
      expect(activeClients.every((c) => c.active)).toBe(true);
    });

    it('should filter by search term', async () => {
      const results = await listClients(storage, { search: 'alice' });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alice Test');
    });

    it('should apply limit', async () => {
      const clients = await listClients(storage, { limit: 2 });

      expect(clients).toHaveLength(2);
    });

    it('should apply offset', async () => {
      const clients = await listClients(storage, { offset: 2 });

      expect(clients).toHaveLength(1);
    });
  });

  describe('updateClient', () => {
    beforeEach(async () => {
      await storage.write('clients', mockClient);
    });

    it('should update client name', async () => {
      const updated = await updateClient(storage, mockClient.id, { name: 'Updated Name' });

      expect(updated.name).toBe('Updated Name');
      expect(updated.updated_at).not.toBe(mockClient.updated_at);
    });

    it('should throw NotFoundError for non-existent client', async () => {
      await expect(
        updateClient(storage, 'non-existent-id', { name: 'Test' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for empty name', async () => {
      await expect(updateClient(storage, mockClient.id, { name: '' })).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw ConflictError for duplicate NDIS number', async () => {
      await storage.write('clients', {
        ...mockClient,
        id: 'client-2',
        ndis_number: '43099999999',
      });

      await expect(
        updateClient(storage, mockClient.id, { ndis_number: '43099999999' })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('deactivateClient', () => {
    beforeEach(async () => {
      await storage.write('clients', mockClient);
    });

    it('should deactivate client with no active goals', async () => {
      const deactivated = await deactivateClient(storage, mockClient.id);

      expect(deactivated.active).toBe(false);
      expect(deactivated.updated_at).not.toBe(mockClient.updated_at);
    });

    it('should throw NotFoundError for non-existent client', async () => {
      await expect(deactivateClient(storage, 'non-existent-id')).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError if client has active goals', async () => {
      // Add an active goal for the client
      await storage.write('goals', {
        id: 'goal-1',
        client_id: mockClient.id,
        title: 'Test Goal',
        archived: false,
      });

      await expect(deactivateClient(storage, mockClient.id)).rejects.toThrow(ConflictError);
    });
  });

  describe('searchClients', () => {
    beforeEach(async () => {
      await storage.write('clients', mockClient);
      await storage.write('clients', {
        ...mockClient,
        id: 'client-2',
        name: 'Alice Johnson',
      });
      await storage.write('clients', {
        ...mockClient,
        id: 'client-3',
        name: 'Bob Smith',
      });
    });

    it('should search by partial name match', async () => {
      const results = await searchClients(storage, 'john');

      expect(results).toHaveLength(2); // John Smith and Alice Johnson
    });

    it('should search case-insensitively', async () => {
      const results = await searchClients(storage, 'SMITH');

      expect(results).toHaveLength(2); // John Smith and Bob Smith
    });

    it('should throw ValidationError for empty search term', async () => {
      await expect(searchClients(storage, '')).rejects.toThrow(ValidationError);
    });

    it('should return empty array for no matches', async () => {
      const results = await searchClients(storage, 'nonexistent');

      expect(results).toHaveLength(0);
    });
  });
});
