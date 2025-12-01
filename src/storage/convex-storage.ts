/**
 * Convex Storage Implementation
 *
 * StorageProvider implementation using Convex database.
 *
 * Note: Uses type assertions where Convex API requires specific ID types.
 * This is necessary due to Convex's auto-generated type system.
 */

import { ConvexClient } from 'convex/browser';
import { StorageProvider } from './base.js';
import { CollectionName, Filter, QueryOptions } from './types.js';
import { api } from '../../convex/_generated/api.js';
import { logger } from '../utils/logger.js';

// Type for Convex record with _id field
interface ConvexRecord {
  _id: string;
  [key: string]: unknown;
}

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

  async read<T extends { id: string }>(collection: CollectionName, id: string): Promise<T | null> {
    try {
      // Use Convex's _id directly for lookup
      const record = (await this.client.query(api.queries.getById, {
        id: id as never,
      })) as ConvexRecord | null;

      if (!record) return null;

      // Map Convex's _id to our id field
      const { _id, _creationTime, ...rest } = record;
      return { ...rest, id: _id } as T;
    } catch (error) {
      logger.error(`Error reading from ${collection}`, error instanceof Error ? error : undefined);
      return null;
    }
  }

  async write<T extends { id: string }>(collection: CollectionName, record: T): Promise<void> {
    // Try to get existing record by treating record.id as Convex _id
    let existingRecord: ConvexRecord | null = null;
    try {
      existingRecord = (await this.client.query(api.queries.getById, {
        id: record.id as never,
      })) as ConvexRecord | null;
    } catch (error) {
      // Record doesn't exist, that's fine - we'll create it
      existingRecord = null;
    }

    const convexId = existingRecord ? existingRecord._id : undefined;

    // Strip out the id field - Convex will use _id instead
    const { id, ...dataWithoutId } = record;

    // Upsert without the id field
    await this.client.mutation(api.mutations.upsert, {
      table: collection,
      id: convexId as never,
      data: dataWithoutId as never,
    });
  }

  async delete(collection: CollectionName, id: string): Promise<boolean> {
    try {
      // Use Convex's _id directly
      await this.client.mutation(api.mutations.deleteRecord, {
        id: id as never,
      });
      return true;
    } catch (error) {
      logger.error(`Error deleting from ${collection}`, error instanceof Error ? error : undefined);
      return false;
    }
  }

  async list<T extends { id: string }>(
    collection: CollectionName,
    filter?: Filter<T>,
    options?: QueryOptions
  ): Promise<T[]> {
    try {
      const records = (await this.client.query(api.queries.list, {
        table: collection,
        filter: filter as never,
        limit: options?.limit,
        offset: options?.offset,
      })) as ConvexRecord[];

      // Map Convex's _id to our id field
      return records.map((record) => {
        const { _id, _creationTime, ...rest } = record;
        return { ...rest, id: _id } as T;
      });
    } catch (error) {
      logger.error(`Error listing ${collection}`, error instanceof Error ? error : undefined);
      return [];
    }
  }

  async count(collection: CollectionName, filter?: Filter<unknown>): Promise<number> {
    try {
      return await this.client.query(api.queries.count, {
        table: collection,
        filter: filter as never,
      });
    } catch (error) {
      logger.error(`Error counting ${collection}`, error instanceof Error ? error : undefined);
      return 0;
    }
  }

  async exists(collection: CollectionName, id: string): Promise<boolean> {
    try {
      // Use Convex's _id directly
      const record = (await this.client.query(api.queries.getById, {
        id: id as never,
      })) as ConvexRecord | null;

      return record !== null;
    } catch (error) {
      logger.error(
        `Error checking existence in ${collection}`,
        error instanceof Error ? error : undefined
      );
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
      const stats = (await this.client.query(api.queries.getStats, {})) as {
        total_records: number;
        records_by_collection: Record<CollectionName, number>;
      };
      return stats;
    } catch (error) {
      logger.error('Error getting stats', error instanceof Error ? error : undefined);
      return {
        total_records: 0,
        records_by_collection: {
          clients: 0,
          goals: 0,
          activities: 0,
          activity_sessions: 0,
          stakeholders: 0,
          shift_notes: 0,
          behavior_incidents: 0,
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

  createBackup(): Promise<string> {
    // Convex handles backups automatically at the platform level
    const timestamp = new Date().toISOString();
    logger.info(`Convex backups are handled automatically. Timestamp: ${timestamp}`);
    return Promise.resolve(`convex-backup-${timestamp}`);
  }

  restoreBackup(backupPath: string): Promise<void> {
    // Restoration would need to be done via Convex dashboard
    logger.info(`Restoration from ${backupPath} must be done via Convex dashboard`);
    return Promise.reject(new Error('Backup restoration must be performed via Convex dashboard'));
  }

  close(): Promise<void> {
    // Close Convex client connection
    return Promise.resolve(this.client.close());
  }
}
