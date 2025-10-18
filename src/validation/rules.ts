/**
 * Business Validation Rules
 *
 * Contains business logic validation functions that go beyond
 * simple schema validation. These rules enforce domain-specific
 * constraints and relationships.
 *
 * @module validation/rules
 */

import { parseISO, differenceInCalendarDays, isBefore, addHours } from 'date-fns';
import { Goal } from '../models/goal.js';
import { GoalStatus } from '../models/enums.js';
import { ShiftNote } from '../models/shift-note.js';

/**
 * Validates that a goal's progress percentage aligns with its status
 *
 * @param status - Goal status
 * @param progressPercentage - Progress percentage
 * @returns True if valid, error message if invalid
 */
export function validateGoalProgressAlignment(
  status: GoalStatus,
  progressPercentage: number
): { valid: boolean; message?: string } {
  if (status === GoalStatus.ACHIEVED && progressPercentage < 100) {
    return {
      valid: false,
      message: 'Achieved goals must have 100% progress',
    };
  }

  if (status === GoalStatus.NOT_STARTED && progressPercentage > 0) {
    return {
      valid: false,
      message: 'Not started goals cannot have progress > 0%',
    };
  }

  return { valid: true };
}

/**
 * Checks if a goal is at risk of not being achieved
 *
 * A goal is at risk if:
 * - Status is NOT_STARTED or IN_PROGRESS
 * - Progress is less than 50%
 * - Target date is within 14 days
 *
 * @param goal - Goal to check
 * @returns True if goal is at risk
 */
export function isGoalAtRisk(goal: Goal): boolean {
  if (goal.status === GoalStatus.ACHIEVED || goal.status === GoalStatus.DISCONTINUED) {
    return false;
  }

  if (goal.progress_percentage >= 50) {
    return false;
  }

  const targetDate = parseISO(goal.target_date);
  const today = new Date();
  const daysRemaining = differenceInCalendarDays(targetDate, today);

  return daysRemaining <= 14 && daysRemaining >= 0;
}

/**
 * Validates that shift note times are logical
 *
 * @param startTime - Start time (HH:MM)
 * @param endTime - End time (HH:MM)
 * @returns True if valid, error message if invalid
 */
export function validateShiftTimes(
  startTime: string,
  endTime: string
): { valid: boolean; message?: string } {
  const startParts = startTime.split(':').map(Number);
  const endParts = endTime.split(':').map(Number);

  const startHour = startParts[0] ?? 0;
  const startMinute = startParts[1] ?? 0;
  const endHour = endParts[0] ?? 0;
  const endMinute = endParts[1] ?? 0;

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  if (endMinutes <= startMinutes) {
    return {
      valid: false,
      message: 'End time must be after start time',
    };
  }

  const duration = endMinutes - startMinutes;
  if (duration > 720) {
    // 12 hours
    return {
      valid: false,
      message: 'Shift duration cannot exceed 12 hours',
    };
  }

  return { valid: true };
}

/**
 * Checks if a shift note can still be edited
 *
 * Shift notes can only be edited within 24 hours of the shift date.
 *
 * @param shiftNote - Shift note to check
 * @returns True if editable, error message if not
 */
export function canEditShiftNote(shiftNote: ShiftNote): {
  valid: boolean;
  message?: string;
} {
  const shiftDate = parseISO(shiftNote.shift_date);
  const now = new Date();
  const deadline = addHours(shiftDate, 24);

  if (isBefore(now, deadline)) {
    return { valid: true };
  }

  return {
    valid: false,
    message: 'Shift notes can only be edited within 24 hours of the shift date',
  };
}

/**
 * Validates that activity duration matches start and end times
 *
 * @param startTime - Start time (HH:MM, optional)
 * @param endTime - End time (HH:MM, optional)
 * @param durationMinutes - Duration in minutes (optional)
 * @returns True if valid, error message if invalid
 */
export function validateActivityDuration(
  startTime?: string,
  endTime?: string,
  durationMinutes?: number
): { valid: boolean; message?: string } {
  if (!startTime || !endTime) {
    return { valid: true }; // Optional fields, no validation needed
  }

  const startParts = startTime.split(':').map(Number);
  const endParts = endTime.split(':').map(Number);

  const startHour = startParts[0] ?? 0;
  const startMinute = startParts[1] ?? 0;
  const endHour = endParts[0] ?? 0;
  const endMinute = endParts[1] ?? 0;

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  const calculatedDuration = endMinutes - startMinutes;

  if (durationMinutes && Math.abs(calculatedDuration - durationMinutes) > 5) {
    return {
      valid: false,
      message: 'Duration does not match start and end times (tolerance: 5 minutes)',
    };
  }

  return { valid: true };
}

/**
 * Validates that a date is not too far in the past
 *
 * @param dateStr - Date string (ISO 8601)
 * @param maxDaysInPast - Maximum number of days in the past allowed
 * @returns True if valid, error message if invalid
 */
export function validateDateNotTooOld(
  dateStr: string,
  maxDaysInPast: number
): { valid: boolean; message?: string } {
  const date = parseISO(dateStr);
  const today = new Date();
  const daysDifference = differenceInCalendarDays(today, date);

  if (daysDifference > maxDaysInPast) {
    return {
      valid: false,
      message: `Date cannot be more than ${maxDaysInPast} days in the past`,
    };
  }

  return { valid: true };
}

/**
 * Suggests a goal status based on progress percentage
 *
 * @param progressPercentage - Current progress percentage
 * @returns Suggested goal status
 */
export function suggestGoalStatus(progressPercentage: number): GoalStatus {
  if (progressPercentage === 0) {
    return GoalStatus.NOT_STARTED;
  } else if (progressPercentage === 100) {
    return GoalStatus.ACHIEVED;
  } else {
    return GoalStatus.IN_PROGRESS;
  }
}
