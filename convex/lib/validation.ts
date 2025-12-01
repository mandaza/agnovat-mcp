/**
 * Convex Validation Utilities
 *
 * Shared validation logic for Convex functions.
 * These utilities help ensure data integrity before database operations.
 */

/**
 * Validate date string (YYYY-MM-DD format)
 */
export function isValidDate(dateStr: string): boolean {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(dateStr)) {
    return false;
  }

  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validate time string (HH:MM format)
 */
export function isValidTime(timeStr: string): boolean {
  const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timePattern.test(timeStr);
}

/**
 * Validate NDIS number (11 digits)
 */
export function isValidNdisNumber(ndisNumber: string): boolean {
  const ndisPattern = /^\d{11}$/;
  return ndisPattern.test(ndisNumber);
}

/**
 * Validate progress percentage (0-100)
 */
export function isValidProgress(progress: number): boolean {
  return Number.isInteger(progress) && progress >= 0 && progress <= 100;
}

/**
 * Validate progress observed rating (1-10)
 */
export function isValidProgressObserved(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 10;
}

/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Check if date is within 24 hours from now
 */
export function isWithin24Hours(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours <= 24;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

/**
 * Convert Convex ID to standard ID format
 * Convex uses _id internally, but our API uses id
 */
export function normalizeRecord<T extends { _id: any; _creationTime?: number }>(
  record: T
): Omit<T, '_id' | '_creationTime'> & { id: string } {
  const { _id, _creationTime, ...rest } = record;
  return {
    ...rest,
    id: _id,
  };
}

/**
 * Normalize array of records
 */
export function normalizeRecords<T extends { _id: any; _creationTime?: number }>(
  records: T[]
): Array<Omit<T, '_id' | '_creationTime'> & { id: string }> {
  return records.map(normalizeRecord);
}

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}
