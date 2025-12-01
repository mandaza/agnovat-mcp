/**
 * User and Authentication Models
 *
 * Represents users, client assignments, and audit logs for RBAC.
 *
 * @module models/user
 */

/**
 * User roles in the system
 */
export type UserRole =
  | 'super_admin'
  | 'manager'
  | 'support_coordinator'
  | 'support_worker'
  | 'therapist'
  | 'family'
  | 'client';

/**
 * User entity (synced from Clerk)
 */
export interface User {
  id: string;
  clerk_id: string; // Clerk user ID
  email: string;
  name: string;
  image_url?: string; // Profile image from Clerk
  role: UserRole;
  stakeholder_id?: string;
  client_id?: string;
  specialty?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

/**
 * Client assignment entity
 */
export interface ClientAssignment {
  id: string;
  user_id: string;
  client_id: string;
  assigned_role: string;
  access_level: 'full' | 'limited';
  assigned_by: string;
  active: boolean;
  created_at: string;
  expires_at?: string;
}

/**
 * Audit log entity
 */
export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  success: boolean;
  error_message?: string;
  timestamp: string;
}

/**
 * Input for creating a user (from Clerk webhook)
 */
export interface CreateUserInput {
  clerk_id: string;
  email: string;
  name: string;
  image_url?: string;
  role?: UserRole; // Optional - defaults to support_worker
  stakeholder_id?: string;
  client_id?: string;
  specialty?: string;
}

/**
 * Input for updating a user
 */
export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: UserRole;
  stakeholder_id?: string;
  client_id?: string;
  specialty?: string;
  active?: boolean;
}

/**
 * Input for creating a client assignment
 */
export interface CreateClientAssignmentInput {
  user_id: string;
  client_id: string;
  assigned_role: string;
  access_level: 'full' | 'limited';
  expires_at?: string;
}
