/**
 * Debug queries to check user-stakeholder relationships
 */

import { query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Check if a user has a stakeholder profile
 */
export const checkUserStakeholder = query({
  args: { user_id: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.user_id);

    if (!user) {
      return { error: 'User not found' };
    }

    let stakeholder = null;
    if (user.stakeholder_id) {
      stakeholder = await ctx.db.get(user.stakeholder_id);
    }

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        stakeholder_id: user.stakeholder_id,
      },
      stakeholder: stakeholder ? {
        id: stakeholder._id,
        name: stakeholder.name,
        role: stakeholder.role,
        email: stakeholder.email,
      } : null,
      has_stakeholder: !!user.stakeholder_id,
      needs_stakeholder: ['support_worker', 'support_coordinator', 'therapist', 'manager'].includes(user.role || ''),
    };
  },
});

/**
 * List all users without stakeholder profiles who need them
 */
export const listUsersWithoutStakeholders = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();

    const staffRoles = ['support_worker', 'support_coordinator', 'therapist', 'manager'];

    const usersNeedingStakeholders = users
      .filter(u => staffRoles.includes(u.role || '') && !u.stakeholder_id)
      .map(u => ({
        id: u._id,
        email: u.email,
        name: u.name,
        role: u.role,
        created_at: u.created_at,
      }));

    return {
      total_users: users.length,
      users_needing_stakeholders: usersNeedingStakeholders.length,
      users: usersNeedingStakeholders,
    };
  },
});
