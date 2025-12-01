/**
 * Custom Authentication Functions
 *
 * These functions support custom authentication UI in Flutter
 * while using Clerk as the backend authentication provider.
 *
 * @module convex/auth
 */

import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import {
  getCurrentTimestamp,
  isValidEmail,
  ValidationError,
  NotFoundError,
  normalizeRecord,
} from './lib/validation';

/**
 * Sign in or create user with email (custom UI flow)
 *
 * This function is called AFTER Clerk authentication succeeds.
 * Flutter handles Clerk sign-in, then calls this to sync user to Convex.
 *
 * @example Flutter usage:
 * ```dart
 * // 1. Authenticate with Clerk (headless)
 * final clerkUser = await clerk.signIn.create(
 *   identifier: email,
 *   password: password,
 * );
 *
 * // 2. Sync to Convex with this function
 * final convexUser = await convex.mutation('auth:syncUserFromClerk', {
 *   'clerk_id': clerkUser.id,
 *   'email': clerkUser.emailAddresses[0].emailAddress,
 *   'name': '${clerkUser.firstName} ${clerkUser.lastName}',
 *   'image_url': clerkUser.imageUrl,
 * });
 * ```
 */
export const syncUserFromClerk = mutation({
  args: {
    clerk_id: v.string(),
    email: v.string(),
    name: v.string(),
    image_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate email
    if (!isValidEmail(args.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerk_id', args.clerk_id))
      .first();

    const now = getCurrentTimestamp();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        image_url: args.image_url,
        last_login: now,
        updated_at: now,
      });

      return normalizeRecord(await ctx.db.get(existingUser._id)!);
    } else {
      // Create new user with default role
      const userId = await ctx.db.insert('users', {
        clerk_id: args.clerk_id,
        email: args.email,
        name: args.name,
        image_url: args.image_url,
        role: 'support_worker', // Default role
        active: true,
        created_at: now,
        updated_at: now,
        last_login: now,
      });

      return normalizeRecord(await ctx.db.get(userId)!);
    }
  },
});

/**
 * Get current authenticated user
 *
 * Call this after Clerk authentication to get user profile from Convex
 *
 * @example Flutter usage:
 * ```dart
 * final clerkUser = await clerk.user;
 * final convexUser = await convex.query('auth:getCurrentUser', {
 *   'clerk_id': clerkUser.id,
 * });
 * ```
 */
export const getCurrentUser = query({
  args: {
    clerk_id: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerk_id', args.clerk_id))
      .first();

    if (!user) {
      throw new NotFoundError(`User with Clerk ID ${args.clerk_id} not found`);
    }

    return normalizeRecord(user);
  },
});

/**
 * Update user profile
 *
 * @example Flutter usage:
 * ```dart
 * final updatedUser = await convex.mutation('auth:updateProfile', {
 *   'clerk_id': currentUser.clerkId,
 *   'name': 'New Name',
 *   'image_url': 'https://...',
 * });
 * ```
 */
export const updateProfile = mutation({
  args: {
    clerk_id: v.string(),
    name: v.optional(v.string()),
    image_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find user
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerk_id', args.clerk_id))
      .first();

    if (!user) {
      throw new NotFoundError(`User with Clerk ID ${args.clerk_id} not found`);
    }

    // Build updates
    const updates: any = {
      updated_at: getCurrentTimestamp(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.image_url !== undefined) updates.image_url = args.image_url;

    // Update user
    await ctx.db.patch(user._id, updates);

    return normalizeRecord(await ctx.db.get(user._id)!);
  },
});

/**
 * Update last login timestamp
 *
 * Call this every time user opens the app
 *
 * @example Flutter usage:
 * ```dart
 * await convex.mutation('auth:updateLastLogin', {
 *   'clerk_id': currentUser.clerkId,
 * });
 * ```
 */
export const updateLastLogin = mutation({
  args: {
    clerk_id: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerk_id', args.clerk_id))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        last_login: getCurrentTimestamp(),
      });

      return normalizeRecord(await ctx.db.get(user._id)!);
    }

    throw new NotFoundError(`User with Clerk ID ${args.clerk_id} not found`);
  },
});

/**
 * Check if email exists (for sign-up validation)
 *
 * @example Flutter usage:
 * ```dart
 * final exists = await convex.query('auth:emailExists', {
 *   'email': 'user@example.com',
 * });
 *
 * if (exists) {
 *   showError('Email already registered');
 * }
 * ```
 */
export const emailExists = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isValidEmail(args.email)) {
      throw new ValidationError('Invalid email format');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email.toLowerCase()))
      .first();

    return user !== null;
  },
});

/**
 * Link user to stakeholder profile
 *
 * Call this when a user profile should be linked to a stakeholder
 *
 * @example Flutter usage:
 * ```dart
 * await convex.mutation('auth:linkStakeholder', {
 *   'clerk_id': currentUser.clerkId,
 *   'stakeholder_id': stakeholderId,
 * });
 * ```
 */
export const linkStakeholder = mutation({
  args: {
    clerk_id: v.string(),
    stakeholder_id: v.id('stakeholders'),
  },
  handler: async (ctx, args) => {
    // Find user
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerk_id', args.clerk_id))
      .first();

    if (!user) {
      throw new NotFoundError(`User with Clerk ID ${args.clerk_id} not found`);
    }

    // Verify stakeholder exists
    const stakeholder = await ctx.db.get(args.stakeholder_id);
    if (!stakeholder) {
      throw new NotFoundError(`Stakeholder with ID ${args.stakeholder_id} not found`);
    }

    // Link stakeholder
    await ctx.db.patch(user._id, {
      stakeholder_id: args.stakeholder_id,
      updated_at: getCurrentTimestamp(),
    });

    return normalizeRecord(await ctx.db.get(user._id)!);
  },
});

/**
 * Get user with stakeholder details
 *
 * @example Flutter usage:
 * ```dart
 * final userProfile = await convex.query('auth:getUserProfile', {
 *   'clerk_id': currentUser.clerkId,
 * });
 *
 * print('Role: ${userProfile['role']}');
 * print('Stakeholder: ${userProfile['stakeholder_name']}');
 * ```
 */
export const getUserProfile = query({
  args: {
    clerk_id: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerk_id', args.clerk_id))
      .first();

    if (!user) {
      throw new NotFoundError(`User with Clerk ID ${args.clerk_id} not found`);
    }

    // Get stakeholder if linked
    let stakeholderName = null;
    if (user.stakeholder_id) {
      const stakeholder = await ctx.db.get(user.stakeholder_id);
      stakeholderName = stakeholder?.name;
    }

    return {
      ...normalizeRecord(user),
      stakeholder_name: stakeholderName,
    };
  },
});
