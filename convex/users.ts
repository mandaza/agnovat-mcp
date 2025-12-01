/**
 * User Management Functions
 */

import { query, mutation } from './_generated/server.js';
import { v } from 'convex/values';
import { normalizeRecord } from './lib/validation.js';

/**
 * Get user by Clerk ID
 */
export const getUserByClerkId = query({
  args: { clerk_id: v.string() },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q: any) => q.eq('clerk_id', args.clerk_id))
      .first();
  },
});

/**
 * Get current user (requires authentication context)
 */
export const getCurrentUser = query({
  args: { clerk_id: v.string() },
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q: any) => q.eq('clerk_id', args.clerk_id))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },
});

/**
 * Create or update user
 * Automatically creates stakeholder profile for roles that require it
 */
export const upsertUser = mutation({
  args: {
    clerk_id: v.string(),
    email: v.string(),
    name: v.string(),
    image_url: v.optional(v.string()),
    role: v.optional(v.string()),
    active: v.optional(v.boolean()),
    stakeholder_id: v.optional(v.id('stakeholders')),
  },
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q: any) => q.eq('clerk_id', args.clerk_id))
      .first();

    const now = new Date().toISOString();
    const userRole = args.role || 'support_worker';

    // Roles that require stakeholder profiles
    const stakeholderRoles = ['support_worker', 'support_coordinator', 'therapist', 'manager'];

    // Auto-create stakeholder if user doesn't exist and role requires it
    let stakeholderId = args.stakeholder_id || existing?.stakeholder_id;

    if (!existing && !stakeholderId && stakeholderRoles.includes(userRole)) {
      // Map user roles to stakeholder roles
      const roleMapping: Record<string, string> = {
        'support_worker': 'support_worker',
        'support_coordinator': 'support_coordinator',
        'therapist': 'allied_health',
        'manager': 'team_leader',
      };

      const stakeholderRole = roleMapping[userRole] || 'other';

      // Create stakeholder profile
      stakeholderId = await ctx.db.insert('stakeholders', {
        name: args.name,
        role: stakeholderRole,
        email: args.email,
        active: true,
        created_at: now,
        updated_at: now,
      });

      console.log(`Auto-created stakeholder profile for user ${args.name} (${args.email})`);
    }

    if (existing) {
      const updates: any = {
        email: args.email,
        name: args.name,
        image_url: args.image_url,
        active: args.active ?? existing.active,
        updated_at: now,
      };

      // Update stakeholder_id if provided
      if (stakeholderId) {
        updates.stakeholder_id = stakeholderId;
      }

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      return await ctx.db.insert('users', {
        clerk_id: args.clerk_id,
        email: args.email,
        name: args.name,
        image_url: args.image_url,
        role: userRole,
        stakeholder_id: stakeholderId,
        active: args.active ?? true,
        created_at: now,
        updated_at: now,
      });
    }
  },
});

/**
 * Get user by ID (simple alias for Flutter compatibility)
 */
export const get = query({
  args: { id: v.id('users') },
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db.get(args.id);
    if (!user) {
      return null;
    }
    return normalizeRecord(user);
  },
});

/**
 * Get user by ID
 */
export const getUserById = query({
  args: { user_id: v.id('users') },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.get(args.user_id);
  },
});

/**
 * Get user by email
 */
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query('users')
      .withIndex('by_email', (q: any) => q.eq('email', args.email))
      .first();
  },
});

/**
 * List all users with optional filters
 */
export const listUsers = query({
  args: {
    role: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx: any, args: any) => {
    let query = ctx.db.query('users');

    if (args.role) {
      const users = await query
        .withIndex('by_role', (q: any) => q.eq('role', args.role!))
        .collect();

      if (args.active !== undefined) {
        return users.filter((u: any) => u.active === args.active);
      }
      return users;
    }

    if (args.active !== undefined) {
      return await query
        .withIndex('by_active', (q: any) => q.eq('active', args.active!))
        .collect();
    }

    return await query.collect();
  },
});

/**
 * Update last login timestamp
 */
export const updateLastLogin = mutation({
  args: { clerk_id: v.string() },
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q: any) => q.eq('clerk_id', args.clerk_id))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        last_login: new Date().toISOString(),
      });
    }
  },
});

/**
 * Update user profile
 */
export const updateUser = mutation({
  args: {
    user_id: v.id('users'),
    name: v.optional(v.string()),
    image_url: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.image_url !== undefined) updates.image_url = args.image_url;
    if (args.email !== undefined) updates.email = args.email;

    await ctx.db.patch(args.user_id, updates);
  },
});

/**
 * Link a user to an existing stakeholder profile
 * Use this when you need to manually connect a user to a stakeholder
 */
export const linkStakeholder = mutation({
  args: {
    user_id: v.id('users'),
    stakeholder_id: v.id('stakeholders'),
  },
  handler: async (ctx: any, args: any) => {
    // Verify stakeholder exists
    const stakeholder = await ctx.db.get(args.stakeholder_id);
    if (!stakeholder) {
      throw new Error('Stakeholder not found');
    }

    // Verify user exists
    const user = await ctx.db.get(args.user_id);
    if (!user) {
      throw new Error('User not found');
    }

    // Link them
    await ctx.db.patch(args.user_id, {
      stakeholder_id: args.stakeholder_id,
      updated_at: new Date().toISOString(),
    });

    return {
      success: true,
      user_id: args.user_id,
      stakeholder_id: args.stakeholder_id,
    };
  },
});

/**
 * Get user with stakeholder details
 * Returns user info along with their stakeholder profile if linked
 */
export const getUserWithStakeholder = query({
  args: { user_id: v.id('users') },
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db.get(args.user_id);
    if (!user) {
      return null;
    }

    let stakeholder = null;
    if (user.stakeholder_id) {
      stakeholder = await ctx.db.get(user.stakeholder_id);
    }

    return {
      ...normalizeRecord(user),
      stakeholder: stakeholder ? normalizeRecord(stakeholder) : null,
    };
  },
});
