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
 * UUID v4 pattern validation (for JSON storage)
 */
const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Convex ID pattern validation (for Convex storage)
 * Convex IDs are 32 lowercase alphanumeric characters
 */
const convexIdPattern = /^[a-z0-9]{32}$/;

/**
 * Flexible ID schema that accepts both UUID v4 and Convex ID formats
 * This allows the system to work with both JSON and Convex storage backends
 */
const uuidSchema = z
  .string()
  .refine(
    (id) => uuidV4Pattern.test(id) || convexIdPattern.test(id),
    {
      message: 'ID must be either a valid UUID v4 or Convex ID format',
    }
  )
  .describe('Entity identifier (UUID v4 or Convex ID)');

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

// Behavior Incident Enums
export const incidentLocationSchema = z.enum([
  'in_the_home',
  'in_the_community',
  'in_the_car',
  'at_restaurant',
  'in_the_neighborhood',
  'other',
] as const);

export const activityBeforeSchema = z.enum([
  'activity_outdoors',
  'activity_indoors',
  'unstructured_time',
  'transitioning',
  'waiting',
  'structured_activity',
  'other',
] as const);

export const behaviorTypeSchema = z.enum([
  'verbal_aggression',
  'physical_aggression',
  'wandering',
  'withdrawal',
  'harm_to_self',
  'damage_to_property',
  'inappropriate_touching',
  'public_masturbation',
  'shared_lie_or_fiction',
  'risk_of_safety',
  'leaving_home_unsupervised',
  'moving_neighbors_bins',
  'approaching_neighbors_house',
  'attempting_to_kiss_touch',
  'other',
] as const);

export const behaviorDurationSchema = z.enum([
  '0_5_minutes',
  '6_10_minutes',
  '11_15_minutes',
  '16_30_minutes',
  'over_30_minutes',
  'other',
] as const);

export const behaviorSeveritySchema = z.enum(['low', 'medium', 'high'] as const);

export const behaviorIncidentStatusSchema = z.enum(['draft', 'submitted'] as const);

export const selfHarmTypeSchema = z.enum([
  'bite',
  'scratch',
  'hit_head',
  'consuming_non_food',
  'bang_head',
  'no_harm',
  'other',
] as const);

export const interventionTypeSchema = z.enum([
  'verbal_redirection',
  'escape_environment',
  'deflection_with_body',
  'distraction_with_items',
  'no_intervention_required',
  'other',
] as const);

export const secondSupportReasonSchema = z.enum([
  'ensure_safety',
  'prevent_harm_to_others',
  'manage_transitions',
  'all',
  'no_additional_support_needed',
] as const);

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
  status: activityStatusSchema.optional(),
  goal_ids: z.array(uuidSchema).optional(),
  outcome_notes: z.string().max(2000).optional(),
});

export const updateActivitySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  activity_type: activityTypeSchema.optional(),
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

// Client Mood Schema (must be defined before use in shift note schemas)
export const clientMoodSchema = z.enum([
  'positive',
  'neutral',
  'negative',
  'mixed',
  'anxious',
  'withdrawn',
] as const);

export const createShiftNoteSchema = z
  .object({
    client_id: uuidSchema,
    user_id: uuidSchema,
    shift_date: dateSchema,
    start_time: timeSchema,
    end_time: timeSchema,
    primary_locations: z.array(z.string().min(1).max(200)).optional(),

    // NEW: Hybrid approach fields
    activity_session_ids: z.array(uuidSchema).optional().default([]),
    behavior_incident_ids: z.array(uuidSchema).optional().default([]),
    overall_notes: z.string().min(1).max(10000).optional(),
    client_mood: clientMoodSchema.optional(),
    notable_achievements: z.string().max(2000).optional(),
    concerns_raised: z.string().max(2000).optional(),

    // LEGACY: For backward compatibility
    raw_notes: z.string().min(1).max(10000).optional(),
    activity_ids: z.array(uuidSchema).optional(),
    goals_progress: z.array(goalProgressSchema).optional(),
  })
  .refine(
    (data) => data.overall_notes || data.raw_notes,
    {
      message: 'Either overall_notes or raw_notes must be provided',
      path: ['overall_notes'],
    }
  );

export const updateShiftNoteSchema = z.object({
  primary_locations: z.array(z.string().min(1).max(200)).optional(),

  // NEW: Hybrid approach fields
  activity_session_ids: z.array(uuidSchema).optional(),
  behavior_incident_ids: z.array(uuidSchema).optional(),
  overall_notes: z.string().min(1).max(10000).optional(),
  client_mood: clientMoodSchema.optional(),
  notable_achievements: z.string().max(2000).optional(),
  concerns_raised: z.string().max(2000).optional(),

  // LEGACY: For backward compatibility
  raw_notes: z.string().min(1).max(10000).optional(),
  activity_ids: z.array(uuidSchema).optional(),
  goals_progress: z.array(goalProgressSchema).optional(),
});

export const shiftNoteListFilterSchema = z.object({
  client_id: uuidSchema.optional(),
  user_id: uuidSchema.optional(),
  date_from: dateSchema.optional(),
  date_to: dateSchema.optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
  offset: z.number().int().min(0).default(0).optional(),
});

// ============================================================================
// Behavior Incident Schemas
// ============================================================================

export const createBehaviorIncidentSchema = z.object({
  client_id: uuidSchema,
  incident_date: dateSchema,
  submitted_by: uuidSchema,
  submitted_for: z.enum(['self', 'other']),
  submitted_for_name: z.string().min(1).max(200).optional(),
  location: incidentLocationSchema,
  location_other: z.string().max(500).optional(),
  activity_before: activityBeforeSchema,
  activity_before_other: z.string().max(500).optional(),
  behaviors_displayed: z.array(behaviorTypeSchema).min(1, 'At least one behavior must be selected'),
  behaviors_other: z.string().max(500).optional(),
  duration: behaviorDurationSchema,
  duration_other: z.string().max(200).optional(),
  severity: behaviorSeveritySchema,
  self_harm_types: z.array(selfHarmTypeSchema).default([]),
  self_harm_other: z.string().max(500).optional(),
  self_harm_count: z.number().int().min(0).max(20).default(0),
  initial_intervention: interventionTypeSchema,
  intervention_description: z.string().max(1000).optional(),
  second_support_needed: z.array(secondSupportReasonSchema).default([]),
  second_support_description: z.string().max(1000).optional(),
  detailed_description: z.string().min(1, 'Detailed description is required').max(10000),
  status: behaviorIncidentStatusSchema.optional(),
});

export const updateBehaviorIncidentSchema = z.object({
  incident_date: dateSchema.optional(),
  submitted_by: uuidSchema.optional(),
  submitted_for: z.enum(['self', 'other']).optional(),
  submitted_for_name: z.string().min(1).max(200).optional(),
  location: incidentLocationSchema.optional(),
  location_other: z.string().max(500).optional(),
  activity_before: activityBeforeSchema.optional(),
  activity_before_other: z.string().max(500).optional(),
  behaviors_displayed: z.array(behaviorTypeSchema).min(1).optional(),
  behaviors_other: z.string().max(500).optional(),
  duration: behaviorDurationSchema.optional(),
  duration_other: z.string().max(200).optional(),
  severity: behaviorSeveritySchema.optional(),
  self_harm_types: z.array(selfHarmTypeSchema).optional(),
  self_harm_other: z.string().max(500).optional(),
  self_harm_count: z.number().int().min(0).max(20).optional(),
  initial_intervention: interventionTypeSchema.optional(),
  intervention_description: z.string().max(1000).optional(),
  second_support_needed: z.array(secondSupportReasonSchema).optional(),
  second_support_description: z.string().max(1000).optional(),
  detailed_description: z.string().min(1).max(10000).optional(),
  status: behaviorIncidentStatusSchema.optional(),
});

export const behaviorIncidentListFilterSchema = z.object({
  client_id: uuidSchema.optional(),
  date_from: dateSchema.optional(),
  date_to: dateSchema.optional(),
  severity: behaviorSeveritySchema.optional(),
  location: incidentLocationSchema.optional(),
  has_self_harm: z.boolean().optional(),
  needs_second_support: z.boolean().optional(),
  submitted_by: uuidSchema.optional(),
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

export type CreateBehaviorIncidentInput = z.infer<typeof createBehaviorIncidentSchema>;
export type UpdateBehaviorIncidentInput = z.infer<typeof updateBehaviorIncidentSchema>;
export type BehaviorIncidentListFilter = z.infer<typeof behaviorIncidentListFilterSchema>;

// ============================================================================
// Activity Session Schemas
// ============================================================================

/**
 * Engagement rating (1-5 scale)
 */
const engagementRatingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]).describe('Participant engagement rating (1-5)');

/**
 * Goal progress entry within an activity session
 */
export const goalProgressEntrySchema = z.object({
  goal_id: uuidSchema,
  progress_observed: progressObservedSchema,
  evidence_notes: z.string().min(1, 'Evidence notes are required').max(1000),
});

/**
 * Schema for creating an activity session
 */
export const createActivitySessionSchema = z.object({
  activity_id: uuidSchema,
  client_id: uuidSchema,
  stakeholder_id: uuidSchema,
  shift_note_id: uuidSchema.optional(),
  performed_at: z.string().datetime({ message: 'Must be a valid ISO 8601 datetime' }),
  duration_minutes: z
    .number()
    .int()
    .min(1, 'Duration must be at least 1 minute')
    .max(480, 'Duration cannot exceed 8 hours'),
  session_notes: z.string().min(1, 'Session notes are required').max(5000),
  participant_engagement: engagementRatingSchema,
  goal_progress: z.array(goalProgressEntrySchema).optional().default([]),
  behavior_incident_ids: z.array(uuidSchema).optional().default([]),
});

/**
 * Schema for updating an activity session
 */
export const updateActivitySessionSchema = z.object({
  session_notes: z.string().min(1).max(5000).optional(),
  participant_engagement: engagementRatingSchema.optional(),
  goal_progress: z.array(goalProgressEntrySchema).optional(),
  behavior_incident_ids: z.array(uuidSchema).optional(),
  duration_minutes: z.number().int().min(1).max(480).optional(),
});

/**
 * Schema for listing activity sessions
 */
export const activitySessionListFilterSchema = z.object({
  client_id: uuidSchema.optional(),
  activity_id: uuidSchema.optional(),
  stakeholder_id: uuidSchema.optional(),
  shift_note_id: uuidSchema.optional(),
  goal_id: uuidSchema.optional(),
  date_from: dateSchema.optional(),
  date_to: dateSchema.optional(),
  min_engagement: z.number().int().min(1).max(5).optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
  offset: z.number().int().min(0).default(0).optional(),
});

// Type inference for Activity Session
export type GoalProgressEntry = z.infer<typeof goalProgressEntrySchema>;
export type CreateActivitySessionInput = z.infer<typeof createActivitySessionSchema>;
export type UpdateActivitySessionInput = z.infer<typeof updateActivitySessionSchema>;
export type ActivitySessionListFilter = z.infer<typeof activitySessionListFilterSchema>;
export type ClientMood = z.infer<typeof clientMoodSchema>;
