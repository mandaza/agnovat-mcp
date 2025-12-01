/**
 * Clerk Webhook Handler
 * Syncs user data from Clerk to Convex database
 */

import { httpAction, internalMutation } from './_generated/server.js';
import { internal } from './_generated/api.js';
import { v } from 'convex/values';

export const handleClerkWebhook = httpAction(async (ctx: any, request: any) => {
  const payload = await request.json();
  const eventType = payload.type;

  console.log('📥 Clerk webhook received:', eventType);

  switch (eventType) {
    case 'user.created':
    case 'user.updated':
      // Extract role from Clerk metadata (public_metadata or private_metadata)
      const role = payload.data.public_metadata?.role ||
                   payload.data.private_metadata?.role ||
                   'support_worker'; // Default fallback

      console.log('👤 User data:', {
        clerk_id: payload.data.id,
        email: payload.data.email_addresses[0]?.email_address,
        role: role,
        has_public_metadata: !!payload.data.public_metadata,
        has_private_metadata: !!payload.data.private_metadata,
      });

      await ctx.runMutation(internal.clerk.syncUser, {
        clerk_id: payload.data.id,
        email: payload.data.email_addresses[0]?.email_address || '',
        name: `${payload.data.first_name || ''} ${payload.data.last_name || ''}`.trim(),
        image_url: payload.data.image_url,
        role: role,
      });
      break;

    case 'user.deleted':
      console.log('🗑️ Deleting user:', payload.data.id);
      await ctx.runMutation(internal.clerk.deleteUser, {
        clerk_id: payload.data.id,
      });
      break;

    default:
      console.log('⚠️ Unhandled webhook event:', eventType);
  }

  return new Response(null, { status: 200 });
});

export const syncUser = internalMutation({
  args: {
    clerk_id: v.string(),
    email: v.string(),
    name: v.string(),
    image_url: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    console.log('🔄 syncUser called with:', {
      clerk_id: args.clerk_id,
      email: args.email,
      role: args.role,
    });

    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q: any) => q.eq('clerk_id', args.clerk_id))
      .first();

    console.log('👥 Existing user:', existing ? 'found' : 'not found');

    const now = new Date().toISOString();
    const userRole = args.role || 'support_worker';

    // Roles that require stakeholder profiles
    const stakeholderRoles = ['support_worker', 'support_coordinator', 'therapist', 'manager'];

    console.log('🎯 User role:', userRole, 'Requires stakeholder:', stakeholderRoles.includes(userRole));

    // Auto-create stakeholder if user doesn't exist and role requires it
    let stakeholderId = existing?.stakeholder_id;

    if (!existing && !stakeholderId && stakeholderRoles.includes(userRole)) {
      // Map user roles to stakeholder roles
      const roleMapping: Record<string, string> = {
        'support_worker': 'support_worker',
        'support_coordinator': 'support_coordinator',
        'therapist': 'allied_health',
        'manager': 'team_leader',
      };

      const stakeholderRole = roleMapping[userRole] || 'other';

      console.log('✨ Creating stakeholder with role:', stakeholderRole);

      // Create stakeholder profile
      stakeholderId = await ctx.db.insert('stakeholders', {
        name: args.name,
        role: stakeholderRole,
        email: args.email,
        active: true,
        created_at: now,
        updated_at: now,
      });

      console.log(`✅ Auto-created stakeholder profile for ${args.name} (${args.email}) with role ${stakeholderRole}, ID: ${stakeholderId}`);
    } else {
      console.log('⏭️ Skipping stakeholder creation:', {
        reason: existing ? 'user exists' : !stakeholderRoles.includes(userRole) ? 'role does not require stakeholder' : 'already has stakeholder',
        existing: !!existing,
        hasStakeholder: !!stakeholderId,
        roleRequiresStakeholder: stakeholderRoles.includes(userRole),
      });
    }

    if (existing) {
      const updates: any = {
        email: args.email,
        name: args.name,
        image_url: args.image_url,
        updated_at: now,
      };

      // Update role if provided
      if (args.role) {
        updates.role = userRole;
      }

      // Update stakeholder_id if we just created one
      if (stakeholderId) {
        updates.stakeholder_id = stakeholderId;
      }

      console.log('📝 Updating existing user with:', updates);
      await ctx.db.patch(existing._id, updates);
    } else {
      console.log('➕ Creating new user with stakeholder_id:', stakeholderId);
      const userId = await ctx.db.insert('users', {
        clerk_id: args.clerk_id,
        email: args.email,
        name: args.name,
        image_url: args.image_url,
        role: userRole,
        stakeholder_id: stakeholderId,
        active: true,
        created_at: now,
        updated_at: now,
      });
      console.log('✅ User created with ID:', userId);
    }
  },
});

export const deleteUser = internalMutation({
  args: {
    clerk_id: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q: any) => q.eq('clerk_id', args.clerk_id))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        active: false,
        updated_at: new Date().toISOString(),
      });
    }
  },
});
