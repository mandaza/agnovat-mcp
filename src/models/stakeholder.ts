/**
 * Stakeholder Model
 *
 * Represents individuals involved in participant support.
 * Includes support workers, coordinators, family members, and other roles.
 *
 * @module models/stakeholder
 */

import { StakeholderRole } from './enums.js';

/**
 * Stakeholder entity representing a person involved in support
 *
 * @interface Stakeholder
 * @property {string} id - Unique identifier (UUID v4)
 * @property {string} name - Full name of the stakeholder
 * @property {StakeholderRole} role - Role of the stakeholder
 * @property {string} [email] - Email address (optional)
 * @property {string} [phone] - Phone number (optional)
 * @property {string} [organization] - Organization or company name (optional)
 * @property {string} [notes] - Additional notes about the stakeholder (optional)
 * @property {boolean} active - Whether the stakeholder is currently active
 * @property {string} created_at - Timestamp when stakeholder was created (ISO 8601)
 * @property {string} updated_at - Timestamp when stakeholder was last updated (ISO 8601)
 */
export interface Stakeholder {
  id: string;
  name: string;
  role: StakeholderRole;
  email?: string;
  phone?: string;
  organization?: string;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Input data for creating a new stakeholder
 *
 * @interface CreateStakeholderInput
 * @property {string} name - Full name (required)
 * @property {StakeholderRole} role - Stakeholder role (required)
 * @property {string} [email] - Email address (optional)
 * @property {string} [phone] - Phone number (optional)
 * @property {string} [organization] - Organization name (optional)
 * @property {string} [notes] - Additional notes (optional)
 */
export interface CreateStakeholderInput {
  name: string;
  role: StakeholderRole;
  email?: string;
  phone?: string;
  organization?: string;
  notes?: string;
}

/**
 * Input data for updating a stakeholder
 *
 * All fields are optional to allow partial updates.
 *
 * @interface UpdateStakeholderInput
 * @property {string} [name] - Updated name
 * @property {StakeholderRole} [role] - Updated role
 * @property {string} [email] - Updated email
 * @property {string} [phone] - Updated phone
 * @property {string} [organization] - Updated organization
 * @property {string} [notes] - Updated notes
 * @property {boolean} [active] - Updated active status
 */
export interface UpdateStakeholderInput {
  name?: string;
  role?: StakeholderRole;
  email?: string;
  phone?: string;
  organization?: string;
  notes?: string;
  active?: boolean;
}

/**
 * Stakeholder with activity summary
 *
 * Extended stakeholder information including activity statistics.
 *
 * @interface StakeholderWithStats
 * @extends Stakeholder
 * @property {number} total_activities - Total number of activities conducted
 * @property {number} total_shift_notes - Total number of shift notes
 * @property {string} [last_activity_date] - Date of most recent activity (ISO 8601)
 */
export interface StakeholderWithStats extends Stakeholder {
  total_activities: number;
  total_shift_notes: number;
  last_activity_date?: string;
}

/**
 * Filter options for listing stakeholders
 *
 * @interface StakeholderListFilter
 * @property {StakeholderRole} [role] - Filter by role
 * @property {boolean} [active] - Filter by active status
 * @property {string} [search] - Search term for name matching
 * @property {number} [limit] - Maximum number of results
 * @property {number} [offset] - Number of results to skip
 */
export interface StakeholderListFilter {
  role?: StakeholderRole;
  active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}
