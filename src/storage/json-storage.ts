/**
 * JSON File Storage Implementation
 *
 * Implements the StorageProvider interface using JSON files for persistence.
 * Includes file locking, in-memory indexing, and backup functionality.
 *
 * @module storage/json-storage
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as lockfile from 'proper-lockfile';
import { StorageProvider } from './base.js';
import { CollectionName, Filter, QueryOptions, StorageFile } from './types.js';

/**
 * Configuration for JSON storage
 */
export interface JsonStorageConfig {
  /** Base directory for data files */
  dataDir: string;
  /** Enable in-memory caching */
  enableCache?: boolean;
  /** Backup directory */
  backupDir?: string;
  /** Schema version */
  version?: string;
}

/**
 * JSON file storage implementation
 *
 * Features:
 * - File locking for concurrent access
 * - In-memory caching for performance
 * - Automatic backup functionality
 * - Atomic writes (write to temp, then rename)
 */
export class JsonStorage implements StorageProvider {
  private dataDir: string;
  private backupDir: string;
  private version: string;
  private enableCache: boolean;
  private cache: Map<string, Map<string, unknown>>;
  private initialized: boolean;

  /**
   * Create a new JSON storage instance
   *
   * @param config - Storage configuration
   */
  constructor(config: JsonStorageConfig) {
    this.dataDir = config.dataDir;
    this.backupDir = config.backupDir || path.join(config.dataDir, 'backups');
    this.version = config.version || '1.0.0';
    this.enableCache = config.enableCache ?? true;
    this.cache = new Map();
    this.initialized = false;
  }

  /**
   * Initialize storage
   * Creates necessary directories and empty collection files if needed
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Create data directory
    await fs.ensureDir(this.dataDir);

    // Create backup directory
    await fs.ensureDir(this.backupDir);

    // Initialize collection files
    const collections: CollectionName[] = [
      'clients',
      'goals',
      'activities',
      'shift_notes',
      'stakeholders',
    ];

    for (const collection of collections) {
      const filePath = this.getCollectionPath(collection);
      const exists = await fs.pathExists(filePath);

      if (!exists) {
        const emptyFile: StorageFile<unknown> = {
          version: this.version,
          last_updated: new Date().toISOString(),
          records: [],
        };
        await fs.writeJson(filePath, emptyFile, { spaces: 2 });
      }

      // Initialize cache for this collection
      if (this.enableCache) {
        this.cache.set(collection, new Map());
      }
    }

    this.initialized = true;
  }

  /**
   * Read a single record by ID
   */
  async read<T extends { id: string }>(collection: CollectionName, id: string): Promise<T | null> {
    this.ensureInitialized();

    // Check cache first
    if (this.enableCache) {
      const collectionCache = this.cache.get(collection);
      if (collectionCache?.has(id)) {
        return collectionCache.get(id) as T;
      }
    }

    // Read from file
    const records = await this.readCollection<T>(collection);
    const record = records.find((r) => r.id === id);

    // Update cache
    if (record && this.enableCache) {
      const collectionCache = this.cache.get(collection);
      collectionCache?.set(id, record);
    }

    return record || null;
  }

  /**
   * Write a single record
   * Uses atomic write (temp file + rename) for safety
   */
  async write<T extends { id: string }>(collection: CollectionName, record: T): Promise<void> {
    this.ensureInitialized();

    const filePath = this.getCollectionPath(collection);

    // Acquire lock
    const release = await lockfile.lock(filePath, {
      retries: {
        retries: 5,
        minTimeout: 100,
        maxTimeout: 1000,
      },
    });

    try {
      // Read current data
      const fileData = (await fs.readJson(filePath)) as StorageFile<T>;
      const records = fileData.records;

      // Find existing record index
      const index = records.findIndex((r) => r.id === record.id);

      if (index >= 0) {
        // Update existing
        records[index] = record;
      } else {
        // Add new
        records.push(record);
      }

      // Update metadata
      fileData.records = records;
      fileData.last_updated = new Date().toISOString();

      // Atomic write: write to temp file, then rename
      const tempPath = `${filePath}.tmp`;
      await fs.writeJson(tempPath, fileData, { spaces: 2 });
      await fs.move(tempPath, filePath, { overwrite: true });

      // Update cache
      if (this.enableCache) {
        const collectionCache = this.cache.get(collection);
        collectionCache?.set(record.id, record);
      }
    } finally {
      // Always release lock
      await release();
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(collection: CollectionName, id: string): Promise<boolean> {
    this.ensureInitialized();

    const filePath = this.getCollectionPath(collection);

    // Acquire lock
    const release = await lockfile.lock(filePath, {
      retries: {
        retries: 5,
        minTimeout: 100,
        maxTimeout: 1000,
      },
    });

    try {
      // Read current data
      const fileData = (await fs.readJson(filePath)) as StorageFile<{ id: string }>;
      const records = fileData.records;

      // Find record
      const index = records.findIndex((r) => r.id === id);

      if (index < 0) {
        return false; // Not found
      }

      // Remove record
      records.splice(index, 1);

      // Update metadata
      fileData.records = records;
      fileData.last_updated = new Date().toISOString();

      // Atomic write
      const tempPath = `${filePath}.tmp`;
      await fs.writeJson(tempPath, fileData, { spaces: 2 });
      await fs.move(tempPath, filePath, { overwrite: true });

      // Update cache
      if (this.enableCache) {
        const collectionCache = this.cache.get(collection);
        collectionCache?.delete(id);
      }

      return true;
    } finally {
      await release();
    }
  }

  /**
   * List records with optional filtering
   */
  async list<T extends { id: string }>(
    collection: CollectionName,
    filter?: Filter<T>,
    options?: QueryOptions
  ): Promise<T[]> {
    this.ensureInitialized();

    let records = await this.readCollection<T>(collection);

    // Apply filter
    if (filter) {
      records = records.filter((record) => this.matchesFilter(record, filter));
    }

    // Apply sorting
    if (options?.sortBy) {
      records.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[options.sortBy!];
        const bVal = (b as Record<string, unknown>)[options.sortBy!];

        if (aVal === undefined || aVal === null || bVal === undefined || bVal === null) {
          return 0;
        }

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return options.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit;

    if (limit) {
      records = records.slice(offset, offset + limit);
    } else if (offset > 0) {
      records = records.slice(offset);
    }

    return records;
  }

  /**
   * Count records matching filter
   */
  async count<T>(collection: CollectionName, filter?: Filter<T>): Promise<number> {
    this.ensureInitialized();

    const records = await this.readCollection<T>(collection);

    if (!filter) {
      return records.length;
    }

    return records.filter((record) => this.matchesFilter(record, filter)).length;
  }

  /**
   * Check if a record exists
   */
  async exists(collection: CollectionName, id: string): Promise<boolean> {
    this.ensureInitialized();

    const record = await this.read(collection, id);
    return record !== null;
  }

  /**
   * Find records matching a predicate
   */
  async find<T extends { id: string }>(
    collection: CollectionName,
    predicate: (record: T) => boolean,
    options?: QueryOptions
  ): Promise<T[]> {
    this.ensureInitialized();

    let records = await this.readCollection<T>(collection);

    // Apply predicate
    records = records.filter(predicate);

    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit;

    if (limit) {
      records = records.slice(offset, offset + limit);
    } else if (offset > 0) {
      records = records.slice(offset);
    }

    return records;
  }

  /**
   * Create a backup of all collections
   */
  async createBackup(): Promise<string> {
    this.ensureInitialized();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, timestamp);

    await fs.ensureDir(backupPath);

    const collections: CollectionName[] = [
      'clients',
      'goals',
      'activities',
      'shift_notes',
      'stakeholders',
    ];

    for (const collection of collections) {
      const sourcePath = this.getCollectionPath(collection);
      const destPath = path.join(backupPath, `${collection}.json`);
      await fs.copy(sourcePath, destPath);
    }

    return backupPath;
  }

  /**
   * Restore from a backup
   */
  async restoreBackup(backupPath: string): Promise<void> {
    this.ensureInitialized();

    const collections: CollectionName[] = [
      'clients',
      'goals',
      'activities',
      'shift_notes',
      'stakeholders',
    ];

    for (const collection of collections) {
      const sourcePath = path.join(backupPath, `${collection}.json`);
      const destPath = this.getCollectionPath(collection);

      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, destPath, { overwrite: true });
      }
    }

    // Clear cache after restore
    if (this.enableCache) {
      this.cache.clear();
      for (const collection of collections) {
        this.cache.set(collection, new Map());
      }
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    total_records: number;
    records_by_collection: Record<CollectionName, number>;
  }> {
    this.ensureInitialized();

    const collections: CollectionName[] = [
      'clients',
      'goals',
      'activities',
      'shift_notes',
      'stakeholders',
    ];

    const records_by_collection: Record<CollectionName, number> = {} as Record<
      CollectionName,
      number
    >;
    let total_records = 0;

    for (const collection of collections) {
      const count = await this.count(collection);
      records_by_collection[collection] = count;
      total_records += count;
    }

    return {
      total_records,
      records_by_collection,
    };
  }

  /**
   * Close storage and cleanup resources
   */
  async close(): Promise<void> {
    // Cleanup cache
    this.cache.clear();
    this.initialized = false;

    // Await to satisfy async requirement
    await Promise.resolve();
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  /**
   * Get file path for a collection
   */
  private getCollectionPath(collection: CollectionName): string {
    return path.join(this.dataDir, `${collection}.json`);
  }

  /**
   * Read entire collection from file
   */
  private async readCollection<T>(collection: CollectionName): Promise<T[]> {
    const filePath = this.getCollectionPath(collection);
    const fileData = (await fs.readJson(filePath)) as StorageFile<T>;
    return fileData.records || [];
  }

  /**
   * Check if a record matches a filter
   */
  private matchesFilter<T>(record: T, filter: Filter<T>): boolean {
    for (const key in filter) {
      const filterValue = filter[key];
      const recordValue = (record as Record<string, unknown>)[key];

      if (filterValue !== undefined && recordValue !== filterValue) {
        return false;
      }
    }
    return true;
  }

  /**
   * Ensure storage is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Storage not initialized. Call initialize() first.');
    }
  }
}
