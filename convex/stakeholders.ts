/**
 * Stakeholder Convex Functions
 *
 * Type-safe Convex functions for managing stakeholders (support workers, coordinators, etc.).
 * These functions can be called directly from Flutter via the Convex Dart client.
 *
 * @module convex/stakeholders
 */

import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import {
  getCurrentTimestamp,
  isValidEmail,
  ValidationError,
  NotFoundError,
  normalizeRecord,
  normalizeRecords,
} from './lib/validation';

/**
 * Create a new stakeholder
 */
export const create = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    organization: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate name
    if (!args.name || args.name.trim().length === 0) {
      throw new ValidationError('Name is required');
    }

    // Validate email if provided
    if (args.email && !isValidEmail(args.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validate role
    const validRoles = [
      'support_worker',
      'support_coordinator',
      'team_leader',
      'family',
      'healthcare_provider',
      'plan_manager',
      'ndis_planner',
      'other',
    ];

    if (!validRoles.includes(args.role)) {
      throw new ValidationError(`Role must be one of: ${validRoles.join(', ')}`);
    }

    // Create stakeholder
    const now = getCurrentTimestamp();
    const stakeholderId = await ctx.db.insert('stakeholders', {
      name: args.name,
      role: args.role,
      email: args.email,
      phone: args.phone,
      organization: args.organization,
      notes: args.notes,
      active: true,
      created_at: now,
      updated_at: now,
    });

    const stakeholder = await ctx.db.get(stakeholderId);
    return normalizeRecord(stakeholder!);
  },
});

/**
 * Get a stakeholder by ID with activity summary
 */
export const get = query({
  args: {
    id: v.id('stakeholders'),
  },
  handler: async (ctx, args) => {
    const stakeholder = await ctx.db.get(args.id);
    if (!stakeholder) {
      throw new NotFoundError(`Stakeholder with ID ${args.id} not found`);
    }

    // Get activities for this stakeholder
    const activities = await ctx.db
      .query('activities')
      .withIndex('by_stakeholder', (q) => q.eq('stakeholder_id', args.id))
      .collect();

    return {
      ...normalizeRecord(stakeholder),
      total_activities: activities.length,
    };
  },
});

/**
 * List stakeholders with optional filtering
 */
export const list = query({
  args: {
    role: v.optional(v.string()),
    active: v.optional(v.boolean()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let stakeholders;

    // Use indexes when possible
    if (args.active !== undefined) {
      stakeholders = await ctx.db
        .query('stakeholders')
        .withIndex('by_active', (q) => q.eq('active', args.active!))
        .collect();
    } else if (args.role) {
      stakeholders = await ctx.db
        .query('stakeholders')
        .withIndex('by_role', (q) => q.eq('role', args.role!))
        .collect();
    } else {
      stakeholders = await ctx.db.query('stakeholders').collect();
    }

    // Apply search filter
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      stakeholders = stakeholders.filter((s) =>
        s.name.toLowerCase().includes(searchLower)
      );
    }

    // Sort by name
    stakeholders.sort((a, b) => a.name.localeCompare(b.name));

    // Apply pagination
    const offset = args.offset ?? 0;
    const limit = args.limit;

    if (limit) {
      stakeholders = stakeholders.slice(offset, offset + limit);
    } else if (offset > 0) {
      stakeholders = stakeholders.slice(offset);
    }

    return normalizeRecords(stakeholders);
  },
});

/**
 * Update a stakeholder
 */
export const update = mutation({
  args: {
    id: v.id('stakeholders'),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    organization: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get existing stakeholder
    const existingStakeholder = await ctx.db.get(args.id);
    if (!existingStakeholder) {
      throw new NotFoundError(`Stakeholder with ID ${args.id} not found`);
    }

    // Validate email if provided
    if (args.email && !isValidEmail(args.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Build update object
    const updates: any = {
      updated_at: getCurrentTimestamp(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.role !== undefined) updates.role = args.role;
    if (args.email !== undefined) updates.email = args.email;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.organization !== undefined) updates.organization = args.organization;
    if (args.notes !== undefined) updates.notes = args.notes;

    // Update stakeholder
    await ctx.db.patch(args.id, updates);

    const updatedStakeholder = await ctx.db.get(args.id);
    return normalizeRecord(updatedStakeholder!);
  },
});

/**
 * Deactivate a stakeholder (soft delete)
 */
export const deactivate = mutation({
  args: {
    id: v.id('stakeholders'),
  },
  handler: async (ctx, args) => {
    const stakeholder = await ctx.db.get(args.id);
    if (!stakeholder) {
      throw new NotFoundError(`Stakeholder with ID ${args.id} not found`);
    }

    // Update to inactive
    await ctx.db.patch(args.id, {
      active: false,
      updated_at: getCurrentTimestamp(),
    });

    const updatedStakeholder = await ctx.db.get(args.id);
    return normalizeRecord(updatedStakeholder!);
  },
});

/**
 * Search stakeholders by name
 */
export const search = query({
  args: {
    search_term: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.search_term || args.search_term.trim().length === 0) {
      throw new ValidationError('Search term is required');
    }

    const allStakeholders = await ctx.db.query('stakeholders').collect();

    // Filter by search term
    const searchLower = args.search_term.toLowerCase();
    const matchingStakeholders = allStakeholders.filter((stakeholder) =>
      stakeholder.name.toLowerCase().includes(searchLower)
    );

    // Sort by name
    matchingStakeholders.sort((a, b) => a.name.localeCompare(b.name));

    return normalizeRecords(matchingStakeholders);
  },
});
