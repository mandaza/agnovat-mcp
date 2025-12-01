/**
 * Activity Model
 *
 * Represents support activities performed with or for participants.
 * Activities can be linked to goals and stakeholders.
 *
 * @module models/activity
 */

import { ActivityType, ActivityStatus } from './enums.js';

/**
 * Activity entity representing a support activity (catalog/pool)
 *
 * Note: Activities are now a pool/catalog. Scheduling with dates/times
 * will be handled separately in a future scheduling system.
 *
 * @interface Activity
 * @property {string} id - Unique identifier (UUID v4 or Convex ID)
 * @property {string} client_id - ID of the client
 * @property {string} stakeholder_id - ID of the stakeholder who conducts this activity
 * @property {string} title - Short title of the activity
 * @property {string} [description] - Detailed description (optional)
 * @property {ActivityType} activity_type - Type of activity
 * @property {ActivityStatus} status - Status of the activity
 * @property {string[]} [goal_ids] - Array of goal IDs this activity relates to
 * @property {string} [outcome_notes] - Notes about outcomes and observations
 * @property {string} created_at - Timestamp when activity was created (ISO 8601)
 * @property {string} updated_at - Timestamp when activity was last updated (ISO 8601)
 */
export interface Activity {
  id: string;
  client_id: string;
  stakeholder_id: string;
  title: string;
  description?: string;
  activity_type: ActivityType;
  status: ActivityStatus;
  goal_ids?: string[];
  outcome_notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Input data for creating a new activity
 *
 * @interface CreateActivityInput
 * @property {string} client_id - ID of the client (required)
 * @property {string} stakeholder_id - ID of the stakeholder (required)
 * @property {string} title - Activity title (required)
 * @property {string} [description] - Activity description (optional)
 * @property {ActivityType} activity_type - Type of activity (required)
 * @property {ActivityStatus} [status] - Activity status (optional)
 * @property {string[]} [goal_ids] - Related goal IDs (optional)
 * @property {string} [outcome_notes] - Outcome notes (optional)
 */
export interface CreateActivityInput {
  client_id: string;
  stakeholder_id: string;
  title: string;
  description?: string;
  activity_type: ActivityType;
  status?: ActivityStatus;
  goal_ids?: string[];
  outcome_notes?: string;
}

/**
 * Input data for updating an activity
 *
 * All fields are optional to allow partial updates.
 *
 * @interface UpdateActivityInput
 * @property {string} [title] - Updated title
 * @property {string} [description] - Updated description
 * @property {ActivityType} [activity_type] - Updated activity type
 * @property {ActivityStatus} [status] - Updated status
 * @property {string[]} [goal_ids] - Updated goal IDs
 * @property {string} [outcome_notes] - Updated outcome notes
 */
export interface UpdateActivityInput {
  title?: string;
  description?: string;
  activity_type?: ActivityType;
  status?: ActivityStatus;
  goal_ids?: string[];
  outcome_notes?: string;
}

/**
 * Activity with related entity details
 *
 * Extended activity information including client and stakeholder names.
 *
 * @interface ActivityWithDetails
 * @extends Activity
 * @property {string} client_name - Name of the client
 * @property {string} stakeholder_name - Name of the stakeholder
 * @property {string[]} [goal_titles] - Titles of linked goals
 */
export interface ActivityWithDetails extends Activity {
  client_name: string;
  stakeholder_name: string;
  goal_titles?: string[];
}

/**
 * Filter options for listing activities
 *
 * @interface ActivityListFilter
 * @property {string} [client_id] - Filter by client ID
 * @property {string} [stakeholder_id] - Filter by stakeholder ID
 * @property {string} [goal_id] - Filter by goal ID
 * @property {ActivityType} [activity_type] - Filter by activity type
 * @property {ActivityStatus} [status] - Filter by status
 * @property {number} [limit] - Maximum number of results
 * @property {number} [offset] - Number of results to skip
 */
export interface ActivityListFilter {
  client_id?: string;
  stakeholder_id?: string;
  goal_id?: string;
  activity_type?: ActivityType;
  status?: ActivityStatus;
  limit?: number;
  offset?: number;
}
