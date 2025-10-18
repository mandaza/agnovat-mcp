/**
 * Test Storage Helper
 *
 * In-memory storage implementation for testing.
 * Avoids file system operations during tests.
 */

import { StorageProvider, CollectionName, Filter, QueryOptions } from '../../src/storage/base.js';

/**
 * In-memory storage for testing
 */
export class TestStorage implements StorageProvider {
  private data: Map<CollectionName, Map<string, unknown>>;
  private initialized: boolean;

  constructor() {
    this.data = new Map();
    this.initialized = false;
  }

  async initialize(): Promise<void> {
    this.initialized = true;
    // Initialize all collections
    const collections: CollectionName[] = [
      'clients',
      'goals',
      'activities',
      'stakeholders',
      'shift_notes',
    ];
    for (const collection of collections) {
      this.data.set(collection, new Map());
    }
  }

  async read<T extends { id: string }>(
    collection: CollectionName,
    id: string
  ): Promise<T | null> {
    const collectionData = this.data.get(collection);
    if (!collectionData) return null;
    const record = collectionData.get(id);
    return record ? (record as T) : null;
  }

  async write<T extends { id: string }>(collection: CollectionName, record: T): Promise<void> {
    const collectionData = this.data.get(collection);
    if (!collectionData) {
      throw new Error(`Collection ${collection} not initialized`);
    }
    collectionData.set(record.id, record);
  }

  async delete(collection: CollectionName, id: string): Promise<boolean> {
    const collectionData = this.data.get(collection);
    if (!collectionData) return false;
    return collectionData.delete(id);
  }

  async list<T extends { id: string }>(
    collection: CollectionName,
    filter?: Filter<T>,
    options?: QueryOptions
  ): Promise<T[]> {
    const collectionData = this.data.get(collection);
    if (!collectionData) return [];

    let records = Array.from(collectionData.values()) as T[];

    // Apply filter
    if (filter) {
      records = records.filter((record) => {
        for (const [key, value] of Object.entries(filter)) {
          if (record[key as keyof T] !== value) {
            return false;
          }
        }
        return true;
      });
    }

    // Apply sorting
    if (options?.sortBy) {
      const sortField = options.sortBy;
      const sortOrder = options.sortOrder || 'asc';
      records.sort((a, b) => {
        const aVal = a[sortField as keyof T];
        const bVal = b[sortField as keyof T];

        if (aVal === undefined || aVal === null || bVal === undefined || bVal === null) {
          return 0;
        }

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    if (options?.offset !== undefined) {
      records = records.slice(options.offset);
    }
    if (options?.limit !== undefined) {
      records = records.slice(0, options.limit);
    }

    return records;
  }

  async count(collection: CollectionName, filter?: Filter<unknown>): Promise<number> {
    const records = await this.list(collection, filter);
    return records.length;
  }

  async exists(collection: CollectionName, id: string): Promise<boolean> {
    const record = await this.read(collection, id);
    return record !== null;
  }

  async clear(collection: CollectionName): Promise<void> {
    const collectionData = this.data.get(collection);
    if (collectionData) {
      collectionData.clear();
    }
  }

  async getStats(): Promise<{
    total_records: number;
    records_by_collection: Record<CollectionName, number>;
  }> {
    const stats: Record<CollectionName, number> = {
      clients: 0,
      goals: 0,
      activities: 0,
      stakeholders: 0,
      shift_notes: 0,
    };

    let total = 0;
    for (const [collection, data] of this.data.entries()) {
      const count = data.size;
      stats[collection] = count;
      total += count;
    }

    return {
      total_records: total,
      records_by_collection: stats,
    };
  }

  async backup(): Promise<void> {
    // No-op for test storage
  }

  async restore(): Promise<void> {
    // No-op for test storage
  }

  /**
   * Clear all data (test helper)
   */
  async clearAll(): Promise<void> {
    for (const collection of this.data.keys()) {
      await this.clear(collection);
    }
  }
}

/**
 * Create a fresh test storage instance
 */
export async function createTestStorage(): Promise<TestStorage> {
  const storage = new TestStorage();
  await storage.initialize();
  return storage;
}
