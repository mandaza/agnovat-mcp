/**
 * Validation Helper Functions
 *
 * Provides utility functions for input validation, sanitization,
 * and type checking.
 *
 * @module utils/validation
 */

import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from './errors.js';

/**
 * Validate data against a Zod schema
 *
 * @template T - The expected type after validation
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated and typed data
 * @throws {ValidationError} If validation fails
 *
 * @example
 * ```typescript
 * const input = validateWithSchema(createClientSchema, rawInput);
 * ```
 */
export function validateWithSchema<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      const field = firstError?.path.join('.') || undefined;
      const message = firstError?.message || 'Validation failed';

      throw new ValidationError(message, field, 'SCHEMA_VALIDATION_FAILED', {
        errors: error.errors,
      });
    }
    throw error;
  }
}

/**
 * Validate data and return result without throwing
 *
 * @template T - The expected type after validation
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with success flag
 */
export function validateWithSchemaSafe<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}

/**
 * Sanitize a string by removing potentially dangerous characters
 *
 * Removes or escapes characters that could be used for injection attacks.
 * Note: This is a basic sanitization. For HTML context, use a proper
 * HTML sanitization library.
 *
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  return (
    input
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1F\x7F]/g, '')
  ); // Remove control characters
}

/**
 * Validate an email address format
 *
 * @param email - Email address to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate a UUID v4 format
 *
 * @param uuid - UUID string to validate
 * @returns True if valid UUID v4
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate NDIS number format (11 digits)
 *
 * @param ndisNumber - NDIS number to validate
 * @returns True if valid NDIS number format
 */
export function isValidNDISNumber(ndisNumber: string): boolean {
  const ndisRegex = /^\d{11}$/;
  return ndisRegex.test(ndisNumber);
}

/**
 * Validate time format (HH:MM)
 *
 * @param time - Time string to validate
 * @returns True if valid time format
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Validate ISO date format (YYYY-MM-DD)
 *
 * @param date - Date string to validate
 * @returns True if valid ISO date format
 */
export function isValidISODateFormat(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(date);
}

/**
 * Check if a value is a non-empty string
 *
 * @param value - Value to check
 * @returns True if non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if a value is a valid number
 *
 * @param value - Value to check
 * @returns True if valid number (not NaN or Infinity)
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Check if a value is a valid integer
 *
 * @param value - Value to check
 * @returns True if valid integer
 */
export function isValidInteger(value: unknown): value is number {
  return isValidNumber(value) && Number.isInteger(value);
}

/**
 * Check if a value is within a range (inclusive)
 *
 * @param value - Value to check
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns True if value is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Truncate a string to a maximum length
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add when truncated (defaults to '...')
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Normalize whitespace in a string
 *
 * Replaces multiple spaces/tabs/newlines with single space and trims.
 *
 * @param str - String to normalize
 * @returns Normalized string
 */
export function normalizeWhitespace(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Parse a comma-separated list into an array
 *
 * @param str - Comma-separated string
 * @returns Array of trimmed strings
 */
export function parseCommaSeparated(str: string): string[] {
  return str
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Check if an object has all required properties
 *
 * @param obj - Object to check
 * @param requiredProps - Array of required property names
 * @returns True if all required properties exist
 */
export function hasRequiredProperties(obj: unknown, requiredProps: string[]): boolean {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  return requiredProps.every((prop) => prop in obj);
}

/**
 * Remove undefined and null values from an object
 *
 * @param obj - Object to clean
 * @returns New object with undefined/null values removed
 */
export function removeNullishValues<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};

  for (const key in obj) {
    if (obj[key] !== undefined && obj[key] !== null) {
      result[key] = obj[key];
    }
  }

  return result;
}

/**
 * Deep clone an object (simple implementation)
 *
 * Note: This uses JSON parse/stringify, so it won't handle
 * functions, dates, or circular references properly.
 *
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/**
 * Format validation errors for display
 *
 * @param error - Zod error or ValidationError
 * @returns Formatted error messages
 */
export function formatValidationErrors(error: ZodError | ValidationError): {
  field?: string;
  message: string;
}[] {
  if (error instanceof ZodError) {
    return error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
  }

  return [
    {
      field: error.field,
      message: error.message,
    },
  ];
}
