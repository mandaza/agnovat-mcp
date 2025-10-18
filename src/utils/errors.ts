/**
 * Custom Error Classes
 *
 * Defines application-specific error types for better error handling
 * and debugging. All errors extend the base ApplicationError class.
 *
 * @module utils/errors
 */

/**
 * Base application error class
 *
 * All custom errors extend this class to provide consistent
 * error handling and stack trace preservation.
 */
export class ApplicationError extends Error {
  /**
   * Error code for programmatic handling
   */
  public readonly code: string;

  /**
   * Additional context data
   */
  public readonly context?: Record<string, unknown>;

  /**
   * Create an application error
   *
   * @param message - Human-readable error message
   * @param code - Error code for programmatic handling
   * @param context - Additional context data (optional)
   */
  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Validation Error
 *
 * Thrown when input validation fails.
 * Use this for schema validation, business rule violations, etc.
 *
 * @example
 * ```typescript
 * throw new ValidationError(
 *   'Date of birth must be in the past',
 *   'date_of_birth',
 *   'DATE_IN_FUTURE'
 * );
 * ```
 */
export class ValidationError extends ApplicationError {
  /**
   * The field that failed validation (optional)
   */
  public readonly field?: string;

  /**
   * Create a validation error
   *
   * @param message - Description of the validation failure
   * @param field - Field name that failed validation (optional)
   * @param code - Specific error code (defaults to VALIDATION_ERROR)
   * @param context - Additional context (optional)
   */
  constructor(
    message: string,
    field?: string,
    code: string = 'VALIDATION_ERROR',
    context?: Record<string, unknown>
  ) {
    super(message, code, { ...context, field });
    this.field = field;
  }
}

/**
 * Not Found Error
 *
 * Thrown when a requested resource doesn't exist.
 *
 * @example
 * ```typescript
 * const client = await storage.read('clients', id);
 * if (!client) {
 *   throw new NotFoundError('Client', id);
 * }
 * ```
 */
export class NotFoundError extends ApplicationError {
  /**
   * Type of resource that wasn't found
   */
  public readonly resourceType: string;

  /**
   * ID of the resource that wasn't found
   */
  public readonly resourceId: string;

  /**
   * Create a not found error
   *
   * @param resourceType - Type of resource (e.g., 'Client', 'Goal')
   * @param resourceId - ID of the resource
   * @param code - Specific error code (defaults to NOT_FOUND)
   */
  constructor(resourceType: string, resourceId: string, code: string = 'NOT_FOUND') {
    super(`${resourceType} not found: ${resourceId}`, code, {
      resourceType,
      resourceId,
    });
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

/**
 * Conflict Error
 *
 * Thrown when an operation conflicts with the current state.
 * Examples: duplicate NDIS number, creating goal for inactive client, etc.
 *
 * @example
 * ```typescript
 * if (!client.active) {
 *   throw new ConflictError(
 *     'Cannot create goal for inactive client',
 *     'CLIENT_INACTIVE'
 *   );
 * }
 * ```
 */
export class ConflictError extends ApplicationError {
  /**
   * Create a conflict error
   *
   * @param message - Description of the conflict
   * @param code - Specific error code (defaults to CONFLICT)
   * @param context - Additional context (optional)
   */
  constructor(message: string, code: string = 'CONFLICT', context?: Record<string, unknown>) {
    super(message, code, context);
  }
}

/**
 * Storage Error
 *
 * Thrown when storage operations fail.
 * Examples: file read/write errors, lock acquisition failures, etc.
 *
 * @example
 * ```typescript
 * try {
 *   await fs.writeJson(filePath, data);
 * } catch (error) {
 *   throw new StorageError(
 *     'Failed to write data',
 *     'WRITE_FAILED',
 *     { filePath, originalError: error }
 *   );
 * }
 * ```
 */
export class StorageError extends ApplicationError {
  /**
   * The underlying error that caused the storage failure (optional)
   */
  public override readonly cause?: Error;

  /**
   * Create a storage error
   *
   * @param message - Description of the storage failure
   * @param code - Specific error code (defaults to STORAGE_ERROR)
   * @param context - Additional context (optional)
   * @param cause - Original error that caused this (optional)
   */
  constructor(
    message: string,
    code: string = 'STORAGE_ERROR',
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    super(message, code, context);
    this.cause = cause;
  }
}

/**
 * Authorization Error
 *
 * Thrown when an operation is not permitted.
 * Examples: editing shift note after 24 hours, accessing archived records, etc.
 *
 * @example
 * ```typescript
 * if (!canEditShiftNote(shiftNote)) {
 *   throw new AuthorizationError(
 *     'Shift notes can only be edited within 24 hours',
 *     'EDIT_WINDOW_EXPIRED'
 *   );
 * }
 * ```
 */
export class AuthorizationError extends ApplicationError {
  /**
   * Create an authorization error
   *
   * @param message - Description of why the operation is not permitted
   * @param code - Specific error code (defaults to UNAUTHORIZED)
   * @param context - Additional context (optional)
   */
  constructor(message: string, code: string = 'UNAUTHORIZED', context?: Record<string, unknown>) {
    super(message, code, context);
  }
}

/**
 * Type guard to check if an error is an ApplicationError
 */
export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}

/**
 * Type guard to check if an error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Type guard to check if an error is a NotFoundError
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

/**
 * Type guard to check if an error is a ConflictError
 */
export function isConflictError(error: unknown): error is ConflictError {
  return error instanceof ConflictError;
}

/**
 * Type guard to check if an error is a StorageError
 */
export function isStorageError(error: unknown): error is StorageError {
  return error instanceof StorageError;
}

/**
 * Type guard to check if an error is an AuthorizationError
 */
export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

/**
 * Format an error for safe display (removes sensitive information)
 *
 * @param error - Error to format
 * @returns Safe error object for display
 */
export function formatErrorForDisplay(error: unknown): {
  message: string;
  code?: string;
  field?: string;
} {
  if (isApplicationError(error)) {
    return {
      message: error.message,
      code: error.code,
      field: isValidationError(error) ? error.field : undefined,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: 'An unknown error occurred',
  };
}
