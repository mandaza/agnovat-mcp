/**
 * Zod Validation Schemas
 *
 * Comprehensive validation schemas for all data models.
 * Ensures data integrity and type safety at runtime.
 *
 * @module validation/schemas
 */

import { z } from 'zod';
import {
  GoalStatus,
  GoalCategory,
  ActivityType,
  ActivityStatus,
  StakeholderRole,
} from '../models/enums.js';

// ============================================================================
// Common Validation Patterns
// ============================================================================

/**
 * UUID v4 pattern validation
 */
const uuidSchema = z.string().uuid('Invalid UUID format').describe('UUID v4 identifier');

/**
 * ISO 8601 date string (YYYY-MM-DD)
 */
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .describe('ISO 8601 date string');

/**
 * ISO 8601 datetime string
 * Currently unused but available for future use
 */
// const datetimeSchema = z
//   .string()
//   .datetime({ message: 'Must be a valid ISO 8601 datetime' })
//   .describe('ISO 8601 datetime string');

/**
 * Time string (HH:MM format)
 */
const timeSchema = z
  .string()
  .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
  .describe('Time in HH:MM format');

/**
 * NDIS number validation (11 digits)
 */
const ndisNumberSchema = z
  .string()
  .regex(/^\d{11}$/, 'NDIS number must be 11 digits')
  .optional()
  .describe('NDIS participant number');

/**
 * Progress percentage (0-100)
 */
const progressPercentageSchema = z
  .number()
  .int('Progress must be an integer')
  .min(0, 'Progress cannot be negative')
  .max(100, 'Progress cannot exceed 100')
  .describe('Progress percentage (0-100)');

/**
 * Progress observed rating (1-10)
 */
const progressObservedSchema = z
  .number()
  .int('Progress observed must be an integer')
  .min(1, 'Progress observed must be at least 1')
  .max(10, 'Progress observed cannot exceed 10')
  .describe('Progress observed rating (1-10)');

// ============================================================================
// Enum Schemas
// ============================================================================

export const goalStatusSchema = z.nativeEnum(GoalStatus);
export const goalCategorySchema = z.nativeEnum(GoalCategory);
export const activityTypeSchema = z.nativeEnum(ActivityType);
export const activityStatusSchema = z.nativeEnum(ActivityStatus);
export const stakeholderRoleSchema = z.nativeEnum(StakeholderRole);

// ============================================================================
// Client Schemas
// ============================================================================

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  date_of_birth: dateSchema.refine(
    (date) => {
      const dob = new Date(date);
      return dob < new Date();
    },
    { message: 'Date of birth must be in the past' }
  ),
  ndis_number: ndisNumberSchema,
  primary_contact: z.string().max(500, 'Primary contact too long').optional(),
  support_notes: z.string().max(2000, 'Support notes too long').optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  date_of_birth: dateSchema
    .refine((date) => new Date(date) < new Date(), {
      message: 'Date of birth must be in the past',
    })
    .optional(),
  ndis_number: ndisNumberSchema,
  primary_contact: z.string().max(500).optional(),
  support_notes: z.string().max(2000).optional(),
  active: z.boolean().optional(),
});

export const clientListFilterSchema = z.object({
  active: z.boolean().optional(),
  search: z.string().max(200).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
  offset: z.number().int().min(0).default(0).optional(),
});

// ============================================================================
// Goal Schemas
// ============================================================================

export const goalProgressSchema = z.object({
  goal_id: uuidSchema,
  progress_notes: z.string().min(1, 'Progress notes are required').max(1000),
  progress_observed: progressObservedSchema,
});

export const createGoalSchema = z.object({
  client_id: uuidSchema,
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(2000),
  category: goalCategorySchema,
  target_date: dateSchema.refine(
    (date) => {
      const target = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return target >= today;
    },
    { message: 'Target date must be today or in the future' }
  ),
});

export const updateGoalProgressSchema = z.object({
  goal_id: uuidSchema,
  status: goalStatusSchema.optional(),
  progress_percentage: progressPercentageSchema.optional(),
  notes: z.string().max(1000).optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  category: goalCategorySchema.optional(),
  target_date: dateSchema
    .refine((date) => new Date(date) >= new Date(), {
      message: 'Target date must be in the future',
    })
    .optional(),
  status: goalStatusSchema.optional(),
  progress_percentage: progressPercentageSchema.optional(),
  archived: z.boolean().optional(),
});

export const goalListFilterSchema = z.object({
  client_id: uuidSchema.optional(),
  status: goalStatusSchema.optional(),
  category: goalCategorySchema.optional(),
  archived: z.boolean().optional(),
  at_risk: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
  offset: z.number().int().min(0).default(0).optional(),
});

// ============================================================================
// Activity Schemas
// ============================================================================

export const createActivitySchema = z.object({
  client_id: uuidSchema,
  stakeholder_id: uuidSchema,
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(2000).optional(),
  activity_type: activityTypeSchema,
  activity_date: dateSchema,
  start_time: timeSchema.optional(),
  end_time: timeSchema.optional(),
  duration_minutes: z.number().int().min(1).max(1440).optional(),
  status: activityStatusSchema.default(ActivityStatus.SCHEDULED),
  goal_ids: z.array(uuidSchema).optional(),
  outcome_notes: z.string().max(2000).optional(),
});

export const updateActivitySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  activity_type: activityTypeSchema.optional(),
  activity_date: dateSchema.optional(),
  start_time: timeSchema.optional(),
  end_time: timeSchema.optional(),
  duration_minutes: z.number().int().min(1).max(1440).optional(),
  status: activityStatusSchema.optional(),
  goal_ids: z.array(uuidSchema).optional(),
  outcome_notes: z.string().max(2000).optional(),
});

export const activityListFilterSchema = z.object({
  client_id: uuidSchema.optional(),
  stakeholder_id: uuidSchema.optional(),
  goal_id: uuidSchema.optional(),
  activity_type: activityTypeSchema.optional(),
  status: activityStatusSchema.optional(),
  date_from: dateSchema.optional(),
  date_to: dateSchema.optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
  offset: z.number().int().min(0).default(0).optional(),
});

// ============================================================================
// Stakeholder Schemas
// ============================================================================

export const createStakeholderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  role: stakeholderRoleSchema,
  email: z.string().email('Invalid email format').max(200).optional(),
  phone: z.string().max(50).optional(),
  organization: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateStakeholderSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  role: stakeholderRoleSchema.optional(),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(50).optional(),
  organization: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  active: z.boolean().optional(),
});

export const stakeholderListFilterSchema = z.object({
  role: stakeholderRoleSchema.optional(),
  active: z.boolean().optional(),
  search: z.string().max(200).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
  offset: z.number().int().min(0).default(0).optional(),
});

// ============================================================================
// Shift Note Schemas
// ============================================================================

export const createShiftNoteSchema = z.object({
  client_id: uuidSchema,
  stakeholder_id: uuidSchema,
  shift_date: dateSchema,
  start_time: timeSchema,
  end_time: timeSchema,
  general_observations: z.string().min(1, 'General observations are required').max(5000),
  activity_ids: z.array(uuidSchema).optional(),
  goals_progress: z.array(goalProgressSchema).optional(),
  mood_wellbeing: z.string().max(2000).optional(),
  communication_notes: z.string().max(2000).optional(),
  health_safety_notes: z.string().max(2000).optional(),
  handover_notes: z.string().max(2000).optional(),
  incidents: z.string().max(2000).optional(),
});

export const updateShiftNoteSchema = z.object({
  general_observations: z.string().min(1).max(5000).optional(),
  activity_ids: z.array(uuidSchema).optional(),
  goals_progress: z.array(goalProgressSchema).optional(),
  mood_wellbeing: z.string().max(2000).optional(),
  communication_notes: z.string().max(2000).optional(),
  health_safety_notes: z.string().max(2000).optional(),
  handover_notes: z.string().max(2000).optional(),
  incidents: z.string().max(2000).optional(),
});

export const shiftNoteListFilterSchema = z.object({
  client_id: uuidSchema.optional(),
  stakeholder_id: uuidSchema.optional(),
  date_from: dateSchema.optional(),
  date_to: dateSchema.optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
  offset: z.number().int().min(0).default(0).optional(),
});

// ============================================================================
// Type Inference
// ============================================================================

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientListFilter = z.infer<typeof clientListFilterSchema>;

export type GoalProgress = z.infer<typeof goalProgressSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalProgressInput = z.infer<typeof updateGoalProgressSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type GoalListFilter = z.infer<typeof goalListFilterSchema>;

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type ActivityListFilter = z.infer<typeof activityListFilterSchema>;

export type CreateStakeholderInput = z.infer<typeof createStakeholderSchema>;
export type UpdateStakeholderInput = z.infer<typeof updateStakeholderSchema>;
export type StakeholderListFilter = z.infer<typeof stakeholderListFilterSchema>;

export type CreateShiftNoteInput = z.infer<typeof createShiftNoteSchema>;
export type UpdateShiftNoteInput = z.infer<typeof updateShiftNoteSchema>;
export type ShiftNoteListFilter = z.infer<typeof shiftNoteListFilterSchema>;
