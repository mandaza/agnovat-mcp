/**
 * Logging Utility
 *
 * Provides structured logging with levels and safety features.
 * Ensures no PII (Personally Identifiable Information) is logged.
 *
 * @module utils/logger
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    code?: string;
    stack?: string;
  };
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Minimum log level to output */
  minLevel?: LogLevel;
  /** Enable console output */
  enableConsole?: boolean;
  /** Custom log handler */
  customHandler?: (entry: LogEntry) => void;
}

/**
 * List of fields that should never be logged (PII protection)
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'ndis_number',
  'email',
  'phone',
  'date_of_birth',
  'address',
];

/**
 * Logger class with structured logging
 */
export class Logger {
  private config: Required<LoggerConfig>;
  private levelPriority: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
  };

  /**
   * Create a new logger instance
   *
   * @param config - Logger configuration
   */
  constructor(config: LoggerConfig = {}) {
    this.config = {
      minLevel: config.minLevel || LogLevel.INFO,
      enableConsole: config.enableConsole ?? true,
      customHandler: config.customHandler || ((): void => {}),
    };
  }

  /**
   * Log a debug message
   *
   * @param message - Log message
   * @param context - Additional context (optional)
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log an info message
   *
   * @param message - Log message
   * @param context - Additional context (optional)
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a warning message
   *
   * @param message - Log message
   * @param context - Additional context (optional)
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an error message
   *
   * @param message - Log message
   * @param error - Error object (optional)
   * @param context - Additional context (optional)
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context: context ? this.sanitizeContext(context) : undefined,
      error: error
        ? {
            name: error.name,
            message: error.message,
            code: (error as { code?: string }).code,
            stack: error.stack,
          }
        : undefined,
    };

    this.output(entry);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    // Check if this log level should be output
    if (this.levelPriority[level] < this.levelPriority[this.config.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ? this.sanitizeContext(context) : undefined,
    };

    this.output(entry);
  }

  /**
   * Output a log entry
   */
  private output(entry: LogEntry): void {
    // Console output
    if (this.config.enableConsole) {
      this.outputToConsole(entry);
    }

    // Custom handler
    this.config.customHandler(entry);
  }

  /**
   * Output to console
   */
  private outputToConsole(entry: LogEntry): void {
    const { timestamp, level, message, context, error } = entry;
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    const errorStr = error ? ` [${error.name}: ${error.message}]` : '';
    const logMessage = `[${timestamp}] ${level}: ${message}${contextStr}${errorStr}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
        console.error(logMessage);
        if (error?.stack) {
          console.error(error.stack);
        }
        break;
    }
  }

  /**
   * Remove sensitive information from context
   *
   * This is critical for NDIS compliance - no PII should be logged.
   */
  private sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const key in context) {
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof context[key] === 'object' && context[key] !== null) {
        sanitized[key] = this.sanitizeContext(context[key] as Record<string, unknown>);
      } else {
        sanitized[key] = context[key];
      }
    }

    return sanitized;
  }

  /**
   * Check if a field name is sensitive
   */
  private isSensitiveField(fieldName: string): boolean {
    const lowerFieldName = fieldName.toLowerCase();
    return SENSITIVE_FIELDS.some((sensitive) => lowerFieldName.includes(sensitive));
  }

  /**
   * Set the minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }

  /**
   * Get the current minimum log level
   */
  getMinLevel(): LogLevel {
    return this.config.minLevel;
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a logger with custom configuration
 *
 * @param config - Logger configuration
 * @returns New logger instance
 */
export function createLogger(config?: LoggerConfig): Logger {
  return new Logger(config);
}
