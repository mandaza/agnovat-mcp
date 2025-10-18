/**
 * Goal Model
 *
 * Represents NDIS participant goals with progress tracking.
 * Goals are linked to clients and can be associated with activities.
 *
 * @module models/goal
 */

import { GoalStatus, GoalCategory } from './enums.js';

/**
 * Goal entity representing a participant's objective
 *
 * @interface Goal
 * @property {string} id - Unique identifier (UUID v4)
 * @property {string} client_id - ID of the client this goal belongs to
 * @property {string} title - Short title of the goal
 * @property {string} description - Detailed description of the goal
 * @property {GoalCategory} category - Category of the goal
 * @property {string} target_date - Target completion date (ISO 8601)
 * @property {GoalStatus} status - Current status of the goal
 * @property {number} progress_percentage - Progress towards goal (0-100)
 * @property {string} created_at - Timestamp when goal was created (ISO 8601)
 * @property {string} updated_at - Timestamp when goal was last updated (ISO 8601)
 * @property {string} [achieved_at] - Timestamp when goal was achieved (ISO 8601, optional)
 * @property {boolean} archived - Whether the goal is archived
 */
export interface Goal {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: GoalCategory;
  target_date: string;
  status: GoalStatus;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  achieved_at?: string;
  archived: boolean;
}

/**
 * Input data for creating a new goal
 *
 * @interface CreateGoalInput
 * @property {string} client_id - ID of the client (required)
 * @property {string} title - Goal title (required)
 * @property {string} description - Goal description (required)
 * @property {GoalCategory} category - Goal category (required)
 * @property {string} target_date - Target completion date (required)
 */
export interface CreateGoalInput {
  client_id: string;
  title: string;
  description: string;
  category: GoalCategory;
  target_date: string;
}

/**
 * Input data for updating goal progress
 *
 * @interface UpdateGoalProgressInput
 * @property {string} goal_id - ID of the goal to update (required)
 * @property {GoalStatus} [status] - Updated status
 * @property {number} [progress_percentage] - Updated progress (0-100)
 * @property {string} [notes] - Progress notes (optional)
 */
export interface UpdateGoalProgressInput {
  goal_id: string;
  status?: GoalStatus;
  progress_percentage?: number;
  notes?: string;
}

/**
 * Input data for updating a goal
 *
 * All fields are optional to allow partial updates.
 *
 * @interface UpdateGoalInput
 * @property {string} [title] - Updated title
 * @property {string} [description] - Updated description
 * @property {GoalCategory} [category] - Updated category
 * @property {string} [target_date] - Updated target date
 * @property {GoalStatus} [status] - Updated status
 * @property {number} [progress_percentage] - Updated progress
 * @property {boolean} [archived] - Updated archived status
 */
export interface UpdateGoalInput {
  title?: string;
  description?: string;
  category?: GoalCategory;
  target_date?: string;
  status?: GoalStatus;
  progress_percentage?: number;
  archived?: boolean;
}

/**
 * Goal with linked activities
 *
 * Extended goal information including associated activities.
 *
 * @interface GoalWithActivities
 * @extends Goal
 * @property {number} activity_count - Number of linked activities
 * @property {string} [last_activity_date] - Date of most recent activity (ISO 8601)
 */
export interface GoalWithActivities extends Goal {
  activity_count: number;
  last_activity_date?: string;
}

/**
 * Filter options for listing goals
 *
 * @interface GoalListFilter
 * @property {string} [client_id] - Filter by client ID
 * @property {GoalStatus} [status] - Filter by goal status
 * @property {GoalCategory} [category] - Filter by category
 * @property {boolean} [archived] - Filter by archived status
 * @property {boolean} [at_risk] - Filter goals at risk (< 50% progress, < 14 days to target)
 * @property {number} [limit] - Maximum number of results
 * @property {number} [offset] - Number of results to skip
 */
export interface GoalListFilter {
  client_id?: string;
  status?: GoalStatus;
  category?: GoalCategory;
  archived?: boolean;
  at_risk?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Goal progress entry for shift notes
 *
 * @interface GoalProgress
 * @property {string} goal_id - ID of the goal
 * @property {string} progress_notes - Notes about progress observed
 * @property {number} progress_observed - Progress rating (1-10)
 */
export interface GoalProgress {
  goal_id: string;
  progress_notes: string;
  progress_observed: number;
}
