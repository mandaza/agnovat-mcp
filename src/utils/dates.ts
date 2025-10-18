/**
 * Date Utility Functions
 *
 * Provides helper functions for date manipulation, validation,
 * and formatting using date-fns.
 *
 * @module utils/dates
 */

import {
  format,
  parseISO,
  isValid,
  isPast,
  isFuture,
  isToday,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  differenceInDays,
  differenceInMinutes,
  addDays,
  subDays,
  isWithinInterval,
} from 'date-fns';

/**
 * Format a date as ISO 8601 date string (YYYY-MM-DD)
 *
 * @param date - Date to format (Date object or ISO string)
 * @returns ISO 8601 date string
 *
 * @example
 * ```typescript
 * formatISODate(new Date(2025, 0, 15)) // "2025-01-15"
 * ```
 */
export function formatISODate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy-MM-dd');
}

/**
 * Format a date as ISO 8601 datetime string
 *
 * @param date - Date to format (Date object or ISO string)
 * @returns ISO 8601 datetime string
 *
 * @example
 * ```typescript
 * formatISODateTime(new Date()) // "2025-01-15T14:30:00.000Z"
 * ```
 */
export function formatISODateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj.toISOString();
}

/**
 * Get current timestamp as ISO string
 *
 * @returns Current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Get current date as ISO date string
 *
 * @returns Current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  return formatISODate(new Date());
}

/**
 * Validate if a string is a valid ISO date (YYYY-MM-DD)
 *
 * @param dateStr - Date string to validate
 * @returns True if valid ISO date
 *
 * @example
 * ```typescript
 * isValidISODate('2025-01-15') // true
 * isValidISODate('15/01/2025') // false
 * ```
 */
export function isValidISODate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) {
    return false;
  }

  const date = parseISO(dateStr);
  return isValid(date);
}

/**
 * Validate if a date is in the past
 *
 * @param dateStr - Date string to check
 * @returns True if date is in the past
 */
export function isDateInPast(dateStr: string): boolean {
  const date = parseISO(dateStr);
  return isValid(date) && isPast(date);
}

/**
 * Validate if a date is in the future
 *
 * @param dateStr - Date string to check
 * @returns True if date is in the future
 */
export function isDateInFuture(dateStr: string): boolean {
  const date = parseISO(dateStr);
  return isValid(date) && isFuture(date);
}

/**
 * Check if a date is today
 *
 * @param dateStr - Date string to check
 * @returns True if date is today
 */
export function isDateToday(dateStr: string): boolean {
  const date = parseISO(dateStr);
  return isValid(date) && isToday(date);
}

/**
 * Get the start and end of the current week
 *
 * @returns Object with start and end ISO date strings
 */
export function getCurrentWeekRange(): { start: string; end: string } {
  const now = new Date();
  return {
    start: formatISODate(startOfWeek(now, { weekStartsOn: 1 })), // Monday
    end: formatISODate(endOfWeek(now, { weekStartsOn: 1 })), // Sunday
  };
}

/**
 * Get date range for a specific number of days from today
 *
 * @param days - Number of days from today (positive for future, negative for past)
 * @returns Object with start (today) and end ISO date strings
 *
 * @example
 * ```typescript
 * getDateRangeFromToday(7)  // Next 7 days
 * getDateRangeFromToday(-7) // Last 7 days
 * ```
 */
export function getDateRangeFromToday(days: number): { start: string; end: string } {
  const now = new Date();

  if (days >= 0) {
    return {
      start: formatISODate(now),
      end: formatISODate(addDays(now, days)),
    };
  } else {
    return {
      start: formatISODate(addDays(now, days)),
      end: formatISODate(now),
    };
  }
}

/**
 * Calculate days between two dates
 *
 * @param startDate - Start date (ISO string or Date)
 * @param endDate - End date (ISO string or Date)
 * @returns Number of days between dates (can be negative)
 */
export function daysBetween(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  return differenceInDays(end, start);
}

/**
 * Calculate days until a target date from today
 *
 * @param targetDate - Target date (ISO string or Date)
 * @returns Number of days until target (negative if in past)
 */
export function daysUntil(targetDate: string | Date): number {
  const target = typeof targetDate === 'string' ? parseISO(targetDate) : targetDate;
  return differenceInDays(target, new Date());
}

/**
 * Calculate duration in minutes between two times
 *
 * @param startTime - Start time (HH:MM format)
 * @param endTime - End time (HH:MM format)
 * @returns Duration in minutes
 *
 * @example
 * ```typescript
 * calculateDurationMinutes('09:00', '12:30') // 210
 * ```
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  const baseDate = '2000-01-01';
  const start = parseISO(`${baseDate}T${startTime}:00`);
  const end = parseISO(`${baseDate}T${endTime}:00`);
  return differenceInMinutes(end, start);
}

/**
 * Check if a date is within a range (inclusive)
 *
 * @param date - Date to check
 * @param startDate - Range start date
 * @param endDate - Range end date
 * @returns True if date is within range
 */
export function isDateInRange(
  date: string | Date,
  startDate: string | Date,
  endDate: string | Date
): boolean {
  const checkDate = typeof date === 'string' ? parseISO(date) : date;
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

  return isWithinInterval(checkDate, {
    start: startOfDay(start),
    end: endOfDay(end),
  });
}

/**
 * Add days to a date
 *
 * @param date - Base date (ISO string or Date)
 * @param days - Number of days to add
 * @returns New date as ISO string
 */
export function addDaysToDate(date: string | Date, days: number): string {
  const baseDate = typeof date === 'string' ? parseISO(date) : date;
  return formatISODate(addDays(baseDate, days));
}

/**
 * Subtract days from a date
 *
 * @param date - Base date (ISO string or Date)
 * @param days - Number of days to subtract
 * @returns New date as ISO string
 */
export function subtractDaysFromDate(date: string | Date, days: number): string {
  const baseDate = typeof date === 'string' ? parseISO(date) : date;
  return formatISODate(subDays(baseDate, days));
}

/**
 * Format a date for display (human-readable)
 *
 * @param date - Date to format (ISO string or Date)
 * @param formatStr - Format string (defaults to 'PPP')
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * formatDateForDisplay('2025-01-15') // "January 15th, 2025"
 * formatDateForDisplay('2025-01-15', 'dd/MM/yyyy') // "15/01/2025"
 * ```
 */
export function formatDateForDisplay(date: string | Date, formatStr: string = 'PPP'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Parse a date string to Date object
 *
 * @param dateStr - ISO date string
 * @returns Date object or null if invalid
 */
export function parseDate(dateStr: string): Date | null {
  const date = parseISO(dateStr);
  return isValid(date) ? date : null;
}
