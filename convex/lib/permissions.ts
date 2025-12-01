/**
 * Permission and Authorization Helpers
 */

import { Doc, Id } from '../_generated/dataModel.js';
import { QueryCtx, MutationCtx } from '../_generated/server.js';

export type UserRole =
  | 'super_admin'
  | 'manager'
  | 'support_coordinator'
  | 'support_worker'
  | 'therapist'
  | 'family'
  | 'client';

/**
 * Get user by Clerk ID
 */
export async function getUserByClerkId(
  ctx: QueryCtx | MutationCtx,
  clerkId: string
): Promise<Doc<'users'>> {
  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q: any) => q.eq('clerk_id', clerkId))
    .first();

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.active) {
    throw new Error('User account is inactive');
  }

  return user;
}

/**
 * Get current authenticated user
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx,
  clerkId: string
): Promise<Doc<'users'>> {
  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q: any) => q.eq('clerk_id', clerkId))
    .first();

  if (!user) {
    throw new Error('Authentication required');
  }

  if (!user.active) {
    throw new Error('User account is inactive');
  }

  return user;
}

/**
 * Check if user has required role
 */
export function requireRole(user: Doc<'users'>, allowedRoles: UserRole[]): void {
  if (!allowedRoles.includes(user.role as UserRole)) {
    throw new Error(
      `Unauthorized: Requires one of [${allowedRoles.join(', ')}] but user has role ${user.role}`
    );
  }
}

/**
 * Check if user can access a specific client
 */
export async function canAccessClient(
  _ctx: QueryCtx | MutationCtx,
  user: Doc<'users'>,
  clientId: Id<'clients'>
): Promise<boolean> {
  // Super admin and managers can access all clients
  if (user.role === 'super_admin' || user.role === 'manager') {
    return true;
  }

  // If user is linked to this client
  if (user.role === 'client') {
    return user.client_id === clientId;
  }

  // Support coordinators can access all clients (for MVP)
  if (user.role === 'support_coordinator') {
    return true;
  }

  // For support workers and therapists, check if they have activities/notes for this client
  // This is a simplified check for MVP
  return true;
}

/**
 * Get list of clients user can access
 */
export async function getAccessibleClientIds(
  ctx: QueryCtx | MutationCtx,
  user: Doc<'users'>
): Promise<Id<'clients'>[]> {
  // Super admin and managers can see all
  if (user.role === 'super_admin' || user.role === 'manager') {
    const allClients = await ctx.db.query('clients').collect();
    return allClients.map((c: any) => c._id);
  }

  // Client role can only see their own
  if (user.role === 'client' && user.client_id) {
    return [user.client_id];
  }

  // For MVP, support workers and coordinators can see all
  // In Phase 2, implement proper assignment-based filtering
  const allClients = await ctx.db.query('clients').collect();
  return allClients.map((c: any) => c._id);
}

/**
 * Log audit event
 */
export async function logAudit(
  ctx: MutationCtx,
  params: {
    user?: Doc<'users'>;
    action: string;
    resource_type: string;
    resource_id?: string;
    details?: string;
    success: boolean;
    error_message?: string;
    ip_address?: string;
  }
): Promise<Id<'audit_logs'>> {
  return await ctx.db.insert('audit_logs', {
    user_id: params.user?._id,
    user_email: params.user?.email,
    action: params.action,
    resource_type: params.resource_type,
    resource_id: params.resource_id,
    details: params.details,
    ip_address: params.ip_address,
    success: params.success,
    error_message: params.error_message,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Check if user can perform action on resource
 */
export function canPerformAction(
  user: Doc<'users'>,
  action: 'create' | 'read' | 'update' | 'delete',
  resource: 'client' | 'goal' | 'activity' | 'shift_note' | 'stakeholder'
): boolean {
  const role = user.role as UserRole;

  // Super admins can do everything
  if (role === 'super_admin' || role === 'manager') {
    return true;
  }

  // Support coordinators have full access
  if (role === 'support_coordinator') {
    return true;
  }

  // Support workers can create and read everything, update their own
  if (role === 'support_worker') {
    if (action === 'delete') return false;
    return true;
  }

  // Therapists similar to support workers
  if (role === 'therapist') {
    if (action === 'delete') return false;
    if (resource === 'stakeholder' && action !== 'read') return false;
    return true;
  }

  // Family and clients can only read
  if (role === 'family' || role === 'client') {
    return action === 'read';
  }

  return false;
}
