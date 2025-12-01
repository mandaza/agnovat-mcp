/**
 * Activity Convex Functions
 *
 * Type-safe Convex functions for managing activities in the activity pool/catalog.
 * These functions can be called directly from Flutter via the Convex Dart client.
 *
 * @module convex/activities
 */

import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import {
  getCurrentTimestamp,
  ValidationError,
  NotFoundError,
  normalizeRecord,
  normalizeRecords,
} from './lib/validation';

/**
 * Create a new activity
 */
export const create = mutation({
  args: {
    client_id: v.id('clients'),
    stakeholder_id: v.id('stakeholders'),
    title: v.string(),
    description: v.optional(v.string()),
    activity_type: v.string(),
    status: v.optional(v.string()),
    goal_ids: v.optional(v.array(v.id('goals'))),
    outcome_notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate title
    if (!args.title || args.title.trim().length === 0) {
      throw new ValidationError('Title is required');
    }

    // Validate client exists
    const client = await ctx.db.get(args.client_id);
    if (!client) {
      throw new NotFoundError(`Client with ID ${args.client_id} not found`);
    }

    // Validate stakeholder exists
    const stakeholder = await ctx.db.get(args.stakeholder_id);
    if (!stakeholder) {
      throw new NotFoundError(`Stakeholder with ID ${args.stakeholder_id} not found`);
    }

    // Validate goal IDs if provided
    if (args.goal_ids) {
      for (const goalId of args.goal_ids) {
        const goal = await ctx.db.get(goalId);
        if (!goal) {
          throw new NotFoundError(`Goal with ID ${goalId} not found`);
        }
      }
    }

    // Validate activity type
    const validTypes = [
      'life_skills',
      'social_recreation',
      'personal_care',
      'community_access',
      'transport',
      'therapy',
      'household_tasks',
      'employment_education',
      'communication',
      'other',
    ];

    if (!validTypes.includes(args.activity_type)) {
      throw new ValidationError(`Activity type must be one of: ${validTypes.join(', ')}`);
    }

    // Validate status if provided
    const status = args.status || 'scheduled';
    const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'];

    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    // Create activity
    const now = getCurrentTimestamp();
    const activityId = await ctx.db.insert('activities', {
      client_id: args.client_id,
      stakeholder_id: args.stakeholder_id,
      title: args.title,
      description: args.description,
      activity_type: args.activity_type,
      status,
      goal_ids: args.goal_ids,
      outcome_notes: args.outcome_notes,
      created_at: now,
      updated_at: now,
    });

    const activity = await ctx.db.get(activityId);
    return normalizeRecord(activity!);
  },
});

/**
 * Get an activity by ID
 */
export const get = query({
  args: {
    id: v.id('activities'),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.id);
    if (!activity) {
      throw new NotFoundError(`Activity with ID ${args.id} not found`);
    }

    // Get client and stakeholder names
    const client = await ctx.db.get(activity.client_id);
    const stakeholder = await ctx.db.get(activity.stakeholder_id);

    return {
      ...normalizeRecord(activity),
      client_name: client?.name,
      stakeholder_name: stakeholder?.name,
    };
  },
});

/**
 * List activities with optional filtering
 */
export const list = query({
  args: {
    client_id: v.optional(v.id('clients')),
    stakeholder_id: v.optional(v.id('stakeholders')),
    activity_type: v.optional(v.string()),
    status: v.optional(v.string()),
    goal_id: v.optional(v.id('goals')),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let activities;

    // Use indexes when possible
    if (args.client_id) {
      activities = await ctx.db
        .query('activities')
        .withIndex('by_client', (q) => q.eq('client_id', args.client_id!))
        .collect();
    } else if (args.stakeholder_id) {
      activities = await ctx.db
        .query('activities')
        .withIndex('by_stakeholder', (q) => q.eq('stakeholder_id', args.stakeholder_id!))
        .collect();
    } else if (args.status) {
      activities = await ctx.db
        .query('activities')
        .withIndex('by_status', (q) => q.eq('status', args.status!))
        .collect();
    } else {
      activities = await ctx.db.query('activities').collect();
    }

    // Apply additional filters
    if (args.activity_type) {
      activities = activities.filter((a) => a.activity_type === args.activity_type);
    }

    if (args.goal_id) {
      activities = activities.filter(
        (a) => a.goal_ids && a.goal_ids.includes(args.goal_id!)
      );
    }

    // Sort by created_at descending
    activities.sort((a, b) => b.created_at.localeCompare(a.created_at));

    // Apply pagination
    const offset = args.offset ?? 0;
    const limit = args.limit;

    if (limit) {
      activities = activities.slice(offset, offset + limit);
    } else if (offset > 0) {
      activities = activities.slice(offset);
    }

    return normalizeRecords(activities);
  },
});

/**
 * Update an activity
 */
export const update = mutation({
  args: {
    id: v.id('activities'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    activity_type: v.optional(v.string()),
    status: v.optional(v.string()),
    goal_ids: v.optional(v.array(v.id('goals'))),
    outcome_notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get existing activity
    const existingActivity = await ctx.db.get(args.id);
    if (!existingActivity) {
      throw new NotFoundError(`Activity with ID ${args.id} not found`);
    }

    // Build update object
    const updates: any = {
      updated_at: getCurrentTimestamp(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.activity_type !== undefined) updates.activity_type = args.activity_type;
    if (args.status !== undefined) updates.status = args.status;
    if (args.goal_ids !== undefined) updates.goal_ids = args.goal_ids;
    if (args.outcome_notes !== undefined) updates.outcome_notes = args.outcome_notes;

    // Update activity
    await ctx.db.patch(args.id, updates);

    const updatedActivity = await ctx.db.get(args.id);
    return normalizeRecord(updatedActivity!);
  },
});
