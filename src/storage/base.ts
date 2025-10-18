/**
 * Base Storage Provider Interface
 *
 * Defines the contract for all storage implementations.
 * Follows the Repository pattern for data access abstraction.
 *
 * @module storage/base
 */

import { CollectionName, Filter, QueryOptions } from './types.js';

/**
 * Base storage provider interface
 *
 * Provides CRUD operations and querying capabilities for entity storage.
 * Implementations must handle concurrency, data integrity, and error handling.
 */
export interface StorageProvider {
  /**
   * Initialize the storage provider
   *
   * Sets up necessary resources, creates directories, initializes files, etc.
   *
   * @returns Promise that resolves when initialization is complete
   * @throws {StorageError} If initialization fails
   */
  initialize(): Promise<void>;

  /**
   * Read a single record by ID
   *
   * @template T - The entity type
   * @param collection - Collection name
   * @param id - Record ID (UUID)
   * @returns Promise resolving to the record, or null if not found
   * @throws {StorageError} If read operation fails
   */
  read<T extends { id: string }>(collection: CollectionName, id: string): Promise<T | null>;

  /**
   * Write a single record
   *
   * Creates a new record or updates an existing one.
   *
   * @template T - The entity type
   * @param collection - Collection name
   * @param record - Record to write (must have id property)
   * @returns Promise that resolves when write is complete
   * @throws {StorageError} If write operation fails
   */
  write<T extends { id: string }>(collection: CollectionName, record: T): Promise<void>;

  /**
   * Delete a record by ID
   *
   * Note: This is a hard delete. For soft deletes, update the record
   * with an 'active: false' or 'archived: true' flag.
   *
   * @param collection - Collection name
   * @param id - Record ID to delete
   * @returns Promise resolving to true if deleted, false if not found
   * @throws {StorageError} If delete operation fails
   */
  delete(collection: CollectionName, id: string): Promise<boolean>;

  /**
   * List records with optional filtering
   *
   * @template T - The entity type
   * @param collection - Collection name
   * @param filter - Filter criteria (optional)
   * @param options - Query options (limit, offset, sort)
   * @returns Promise resolving to array of matching records
   * @throws {StorageError} If list operation fails
   */
  list<T extends { id: string }>(
    collection: CollectionName,
    filter?: Filter<T>,
    options?: QueryOptions
  ): Promise<T[]>;

  /**
   * Count records matching filter
   *
   * @template T - The entity type
   * @param collection - Collection name
   * @param filter - Filter criteria (optional)
   * @returns Promise resolving to count of matching records
   * @throws {StorageError} If count operation fails
   */
  count<T>(collection: CollectionName, filter?: Filter<T>): Promise<number>;

  /**
   * Check if a record exists
   *
   * @param collection - Collection name
   * @param id - Record ID to check
   * @returns Promise resolving to true if exists, false otherwise
   * @throws {StorageError} If check operation fails
   */
  exists(collection: CollectionName, id: string): Promise<boolean>;

  /**
   * Find records matching a complex query
   *
   * More flexible than list() for complex filtering needs.
   *
   * @template T - The entity type
   * @param collection - Collection name
   * @param predicate - Function to test each record
   * @param options - Query options (limit, offset)
   * @returns Promise resolving to array of matching records
   * @throws {StorageError} If find operation fails
   */
  find<T extends { id: string }>(
    collection: CollectionName,
    predicate: (record: T) => boolean,
    options?: QueryOptions
  ): Promise<T[]>;

  /**
   * Create a backup of all collections
   *
   * @returns Promise resolving to backup file path
   * @throws {StorageError} If backup creation fails
   */
  createBackup(): Promise<string>;

  /**
   * Restore from a backup file
   *
   * @param backupPath - Path to the backup file
   * @returns Promise that resolves when restore is complete
   * @throws {StorageError} If restore operation fails
   */
  restoreBackup(backupPath: string): Promise<void>;

  /**
   * Get storage statistics
   *
   * @returns Promise resolving to storage stats
   * @throws {StorageError} If stats retrieval fails
   */
  getStats(): Promise<{
    total_records: number;
    records_by_collection: Record<CollectionName, number>;
  }>;

  /**
   * Close/cleanup the storage provider
   *
   * Releases resources, closes file handles, etc.
   *
   * @returns Promise that resolves when cleanup is complete
   */
  close(): Promise<void>;
}
