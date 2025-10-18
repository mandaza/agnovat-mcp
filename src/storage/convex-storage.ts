/**
 * Convex Storage Implementation
 *
 * StorageProvider implementation using Convex database.
 */

import { ConvexClient } from 'convex/browser';
import { StorageProvider } from './base.js';
import { CollectionName, Filter, QueryOptions } from './types.js';
// import { Id } from '../../convex/_generated/dataModel.js';
// import { api } from '../../convex/_generated/api.js';

// Type placeholders until Convex is initialized
type ConvexId = string;
const api = {
  queries: {
    getById: null as any,
    list: null as any,
    count: null as any,
    exists: null as any,
    getStats: null as any,
  },
  mutations: {
    upsert: null as any,
    deleteRecord: null as any,
    clearTable: null as any,
  },
};

export interface ConvexStorageConfig {
  /** Convex deployment URL */
  deploymentUrl: string;
}

/**
 * Convex database storage provider
 */
export class ConvexStorage implements StorageProvider {
  private client: ConvexClient;

  constructor(config: ConvexStorageConfig) {
    this.client = new ConvexClient(config.deploymentUrl);
  }

  async initialize(): Promise<void> {
    // Set authentication if needed
    // await this.client.setAuth(authToken);
    // Convex client is ready to use immediately
  }

  async read<T extends { id: string }>(
    collection: CollectionName,
    id: string
  ): Promise<T | null> {
    try {
      const record = await this.client.query(api.queries.getById, {
        id: id as ConvexId, // Type cast for Convex ID
      });

      if (!record) return null;

      // Convert Convex _id to our id field
      return {
        ...record,
        id: record._id,
      } as T;
    } catch (error) {
      console.error(`Error reading from ${collection}:`, error);
      return null;
    }
  }

  async write<T extends { id: string }>(
    collection: CollectionName,
    record: T
  ): Promise<void> {
    const { id, ...data } = record;

    // Check if record exists
    const existing = await this.read(collection, id);
    const convexId = existing ? (id as ConvexId) : undefined;

    await this.client.mutation(api.mutations.upsert, {
      table: collection,
      id: convexId,
      data,
    });
  }

  async delete(collection: CollectionName, id: string): Promise<boolean> {
    try {
      await this.client.mutation(api.mutations.deleteRecord, {
        id: id as ConvexId,
      });
      return true;
    } catch (error) {
      console.error(`Error deleting from ${collection}:`, error);
      return false;
    }
  }

  async list<T extends { id: string }>(
    collection: CollectionName,
    filter?: Filter<T>,
    options?: QueryOptions
  ): Promise<T[]> {
    try {
      const records = await this.client.query(api.queries.list, {
        table: collection,
        filter: filter as any,
        limit: options?.limit,
        offset: options?.offset,
      });

      // Convert Convex records to our format
      return records.map((record: any) => ({
        ...record,
        id: record._id,
      })) as T[];
    } catch (error) {
      console.error(`Error listing ${collection}:`, error);
      return [];
    }
  }

  async count(collection: CollectionName, filter?: Filter<unknown>): Promise<number> {
    try {
      return await this.client.query(api.queries.count, {
        table: collection,
        filter: filter as any,
      });
    } catch (error) {
      console.error(`Error counting ${collection}:`, error);
      return 0;
    }
  }

  async exists(collection: CollectionName, id: string): Promise<boolean> {
    try {
      return await this.client.query(api.queries.exists, {
        id: id as ConvexId,
      });
    } catch (error) {
      console.error(`Error checking existence in ${collection}:`, error);
      return false;
    }
  }

  async clear(collection: CollectionName): Promise<void> {
    await this.client.mutation(api.mutations.clearTable, {
      table: collection,
    });
  }

  async getStats(): Promise<{
    total_records: number;
    records_by_collection: Record<CollectionName, number>;
  }> {
    try {
      const stats = await this.client.query(api.queries.getStats, {});
      return stats as {
        total_records: number;
        records_by_collection: Record<CollectionName, number>;
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        total_records: 0,
        records_by_collection: {
          clients: 0,
          goals: 0,
          activities: 0,
          stakeholders: 0,
          shift_notes: 0,
        },
      };
    }
  }

  async find<T extends { id: string }>(
    collection: CollectionName,
    predicate: (record: T) => boolean,
    options?: QueryOptions
  ): Promise<T[]> {
    // Get all records and filter with predicate
    const allRecords = await this.list<T>(collection, undefined, options);
    return allRecords.filter(predicate);
  }

  async createBackup(): Promise<string> {
    // Convex handles backups automatically at the platform level
    const timestamp = new Date().toISOString();
    console.log(`Convex backups are handled automatically. Timestamp: ${timestamp}`);
    return `convex-backup-${timestamp}`;
  }

  async restoreBackup(backupPath: string): Promise<void> {
    // Restoration would need to be done via Convex dashboard
    console.log(`Restoration from ${backupPath} must be done via Convex dashboard`);
    throw new Error('Backup restoration must be performed via Convex dashboard');
  }

  async close(): Promise<void> {
    // Close Convex client connection
    this.client.close();
  }
}
