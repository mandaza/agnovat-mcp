/**
 * Goal Convex Functions
 *
 * Type-safe Convex functions for managing NDIS participant goals.
 * These functions can be called directly from Flutter via the Convex Dart client.
 *
 * @module convex/goals
 */

import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import {
  isValidDate,
  isValidProgress,
  getCurrentTimestamp,
  ValidationError,
  NotFoundError,
  ConflictError,
  normalizeRecord,
  normalizeRecords,
} from './lib/validation';

/**
 * Create a new goal
 *
 * @example Flutter usage:
 * ```dart
 * final goal = await convex.mutation('goals:create', {
 *   'client_id': 'client-id-here',
 *   'title': 'Improve communication skills',
 *   'description': 'Practice daily conversations',
 *   'category': 'social_community',
 *   'target_date': '2025-12-31',
 * });
 * ```
 */
export const create = mutation({
  args: {
    client_id: v.id('clients'),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    target_date: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate title
    if (!args.title || args.title.trim().length === 0) {
      throw new ValidationError('Title is required');
    }

    // Validate description
    if (!args.description || args.description.trim().length === 0) {
      throw new ValidationError('Description is required');
    }

    // Validate target date
    if (!isValidDate(args.target_date)) {
      throw new ValidationError('Target date must be in YYYY-MM-DD format');
    }

    // Check if target date is in the future
    const targetDate = new Date(args.target_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetDate < today) {
      throw new ValidationError('Target date must be in the future');
    }

    // Validate client exists and is active
    const client = await ctx.db.get(args.client_id);
    if (!client) {
      throw new NotFoundError(`Client with ID ${args.client_id} not found`);
    }

    if (!client.active) {
      throw new ConflictError('Cannot create goal for inactive client');
    }

    // Validate category (enum)
    const validCategories = [
      'daily_living',
      'social_community',
      'employment',
      'health_wellbeing',
      'home_living',
      'relationships',
      'choice_control',
      'other',
    ];

    if (!validCategories.includes(args.category)) {
      throw new ValidationError(
        `Category must be one of: ${validCategories.join(', ')}`
      );
    }

    // Create goal
    const now = getCurrentTimestamp();
    const goalId = await ctx.db.insert('goals', {
      client_id: args.client_id,
      title: args.title,
      description: args.description,
      category: args.category,
      target_date: args.target_date,
      status: 'not_started',
      progress_percentage: 0,
      achieved_at: null,
      archived: false,
      created_at: now,
      updated_at: now,
    });

    const goal = await ctx.db.get(goalId);
    return normalizeRecord(goal!);
  },
});

/**
 * Get a goal by ID with linked activities
 *
 * @example Flutter usage:
 * ```dart
 * final goalWithActivities = await convex.query('goals:get', {
 *   'id': 'goal-id-here',
 * });
 * ```
 */
export const get = query({
  args: {
    id: v.id('goals'),
  },
  handler: async (ctx, args) => {
    // Get goal
    const goal = await ctx.db.get(args.id);
    if (!goal) {
      throw new NotFoundError(`Goal with ID ${args.id} not found`);
    }

    // Get client info
    const client = await ctx.db.get(goal.client_id);

    // Get activities linked to this goal
    const allActivities = await ctx.db.query('activities').collect();
    const linkedActivities = allActivities.filter(
      (activity) =>
        activity.goal_ids && activity.goal_ids.includes(args.id)
    );

    return {
      ...normalizeRecord(goal),
      client_name: client?.name,
      linked_activities: normalizeRecords(linkedActivities),
    };
  },
});

/**
 * List goals with optional filtering
 *
 * @example Flutter usage:
 * ```dart
 * final goals = await convex.query('goals:list', {
 *   'client_id': 'client-id-here',
 *   'status': 'in_progress',
 *   'archived': false,
 *   'limit': 20,
 * });
 * ```
 */
export const list = query({
  args: {
    client_id: v.optional(v.id('clients')),
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    archived: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let goals;

    // Use indexes when possible
    if (args.client_id) {
      goals = await ctx.db
        .query('goals')
        .withIndex('by_client', (q) => q.eq('client_id', args.client_id!))
        .collect();
    } else if (args.status) {
      goals = await ctx.db
        .query('goals')
        .withIndex('by_status', (q) => q.eq('status', args.status!))
        .collect();
    } else if (args.archived !== undefined) {
      goals = await ctx.db
        .query('goals')
        .withIndex('by_archived', (q) => q.eq('archived', args.archived!))
        .collect();
    } else {
      goals = await ctx.db.query('goals').collect();
    }

    // Apply additional filters
    if (args.status && !args.client_id) {
      goals = goals.filter((g) => g.status === args.status);
    }

    if (args.category) {
      goals = goals.filter((g) => g.category === args.category);
    }

    if (args.archived !== undefined && !args.client_id && !args.status) {
      goals = goals.filter((g) => g.archived === args.archived);
    }

    // Sort by target_date ascending
    goals.sort((a, b) => a.target_date.localeCompare(b.target_date));

    // Apply pagination
    const offset = args.offset ?? 0;
    const limit = args.limit;

    if (limit) {
      goals = goals.slice(offset, offset + limit);
    } else if (offset > 0) {
      goals = goals.slice(offset);
    }

    return normalizeRecords(goals);
  },
});

/**
 * Update a goal
 *
 * @example Flutter usage:
 * ```dart
 * final updatedGoal = await convex.mutation('goals:update', {
 *   'id': 'goal-id-here',
 *   'title': 'Updated title',
 *   'status': 'in_progress',
 * });
 * ```
 */
export const update = mutation({
  args: {
    id: v.id('goals'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    target_date: v.optional(v.string()),
    milestones: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Get existing goal
    const existingGoal = await ctx.db.get(args.id);
    if (!existingGoal) {
      throw new NotFoundError(`Goal with ID ${args.id} not found`);
    }

    // Validate target date if provided
    if (args.target_date && !isValidDate(args.target_date)) {
      throw new ValidationError('Target date must be in YYYY-MM-DD format');
    }

    // Validate status if provided
    if (args.status) {
      const validStatuses = [
        'not_started',
        'in_progress',
        'achieved',
        'on_hold',
        'discontinued',
      ];

      if (!validStatuses.includes(args.status)) {
        throw new ValidationError(
          `Status must be one of: ${validStatuses.join(', ')}`
        );
      }
    }

    // Build update object
    const updates: any = {
      updated_at: getCurrentTimestamp(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.status !== undefined) updates.status = args.status;
    if (args.target_date !== undefined) updates.target_date = args.target_date;
    if (args.milestones !== undefined) updates.milestones = args.milestones;

    // Set achieved_at timestamp if status is changing to 'achieved'
    if (args.status === 'achieved' && existingGoal.status !== 'achieved') {
      updates.achieved_at = getCurrentTimestamp();
    }

    // Update goal
    await ctx.db.patch(args.id, updates);

    const updatedGoal = await ctx.db.get(args.id);
    return normalizeRecord(updatedGoal!);
  },
});

/**
 * Update goal progress
 *
 * @example Flutter usage:
 * ```dart
 * final updatedGoal = await convex.mutation('goals:updateProgress', {
 *   'id': 'goal-id-here',
 *   'progress_percentage': 75,
 *   'status': 'in_progress',
 * });
 * ```
 */
export const updateProgress = mutation({
  args: {
    id: v.id('goals'),
    progress_percentage: v.optional(v.number()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get existing goal
    const existingGoal = await ctx.db.get(args.id);
    if (!existingGoal) {
      throw new NotFoundError(`Goal with ID ${args.id} not found`);
    }

    // Validate progress percentage if provided
    if (args.progress_percentage !== undefined && !isValidProgress(args.progress_percentage)) {
      throw new ValidationError('Progress percentage must be between 0 and 100');
    }

    // Validate status if provided
    if (args.status) {
      const validStatuses = [
        'not_started',
        'in_progress',
        'achieved',
        'on_hold',
        'discontinued',
      ];

      if (!validStatuses.includes(args.status)) {
        throw new ValidationError(
          `Status must be one of: ${validStatuses.join(', ')}`
        );
      }
    }

    // Build update object
    const updates: any = {
      updated_at: getCurrentTimestamp(),
    };

    if (args.progress_percentage !== undefined) {
      updates.progress_percentage = args.progress_percentage;

      // Auto-set status to 'achieved' if progress reaches 100%
      if (args.progress_percentage === 100) {
        updates.status = 'achieved';
        updates.achieved_at = getCurrentTimestamp();
      }
    }

    if (args.status !== undefined) {
      updates.status = args.status;

      // Set achieved_at if status is changing to 'achieved'
      if (args.status === 'achieved' && existingGoal.status !== 'achieved') {
        updates.achieved_at = getCurrentTimestamp();
      }
    }

    // Update goal
    await ctx.db.patch(args.id, updates);

    const updatedGoal = await ctx.db.get(args.id);
    return normalizeRecord(updatedGoal!);
  },
});

/**
 * Archive a goal (soft delete)
 *
 * @example Flutter usage:
 * ```dart
 * final archivedGoal = await convex.mutation('goals:archive', {
 *   'id': 'goal-id-here',
 * });
 * ```
 */
export const archive = mutation({
  args: {
    id: v.id('goals'),
  },
  handler: async (ctx, args) => {
    // Get goal
    const goal = await ctx.db.get(args.id);
    if (!goal) {
      throw new NotFoundError(`Goal with ID ${args.id} not found`);
    }

    // Update to archived
    await ctx.db.patch(args.id, {
      archived: true,
      updated_at: getCurrentTimestamp(),
    });

    const updatedGoal = await ctx.db.get(args.id);
    return normalizeRecord(updatedGoal!);
  },
});
