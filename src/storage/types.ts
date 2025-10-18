/**
 * Storage Layer Type Definitions
 *
 * Defines types and interfaces for the data persistence layer.
 *
 * @module storage/types
 */

/**
 * Collection names for different entity types
 */
export type CollectionName = 'clients' | 'goals' | 'activities' | 'shift_notes' | 'stakeholders';

/**
 * Generic filter type for querying collections
 */
export type Filter<T = Record<string, unknown>> = Partial<T>;

/**
 * Storage file structure
 * Wraps the actual records with metadata
 */
export interface StorageFile<T> {
  /** Schema version for future migrations */
  version: string;
  /** Timestamp of last update */
  last_updated: string;
  /** Array of entity records */
  records: T[];
}

/**
 * Query options for list operations
 */
export interface QueryOptions {
  /** Maximum number of results to return */
  limit?: number;
  /** Number of results to skip (for pagination) */
  offset?: number;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Storage operation result
 */
export interface StorageResult<T> {
  /** Whether the operation succeeded */
  success: boolean;
  /** The data returned (if any) */
  data?: T;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Backup metadata
 */
export interface BackupMetadata {
  /** Timestamp when backup was created */
  timestamp: string;
  /** Collections included in backup */
  collections: CollectionName[];
  /** Backup file path */
  path: string;
  /** Size in bytes */
  size: number;
}

/**
 * Storage statistics
 */
export interface StorageStats {
  /** Total number of records across all collections */
  total_records: number;
  /** Number of records per collection */
  records_by_collection: Record<CollectionName, number>;
  /** Total storage size in bytes */
  total_size_bytes: number;
  /** Last backup timestamp */
  last_backup?: string;
}
