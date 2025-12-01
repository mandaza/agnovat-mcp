/**
 * Activity Session Model
 *
 * Represents a single occurrence of performing an activity with a client.
 * This is the core of the hybrid approach: Activities are templates/definitions,
 * while ActivitySessions are historical records of what actually happened.
 *
 * @module models/activity-session
 */

/**
 * Goal progress entry within an activity session
 *
 * Tracks how a specific goal was progressed during this session.
 * Includes evidence-based notes for NDIS compliance and reporting.
 *
 * @interface GoalProgressEntry
 * @property {string} goal_id - ID of the goal that was progressed
 * @property {number} progress_observed - Progress rating from 1-10
 * @property {string} evidence_notes - Concrete evidence of progress (e.g., "Independently completed 3/5 steps")
 */
export interface GoalProgressEntry {
  goal_id: string;
  progress_observed: number;
  evidence_notes: string;
}

/**
 * Activity Session entity - represents a single occurrence of an activity
 *
 * This is a historical record of performing an activity with a client.
 * Links to the activity template, tracks engagement, goal progress, and behaviors.
 *
 * @interface ActivitySession
 * @property {string} id - Unique identifier (UUID v4 or Convex ID)
 * @property {string} activity_id - ID of the activity template that was performed
 * @property {string} client_id - ID of the client who participated
 * @property {string} stakeholder_id - ID of the support worker who facilitated
 * @property {string} [shift_note_id] - Optional ID of parent shift note
 * @property {string} performed_at - ISO timestamp when session occurred
 * @property {number} duration_minutes - Duration of the session in minutes
 * @property {string} session_notes - Detailed notes about what happened during the session
 * @property {number} participant_engagement - Engagement rating from 1 (disengaged) to 5 (highly engaged)
 * @property {GoalProgressEntry[]} goal_progress - Goals that were progressed during this session
 * @property {string[]} behavior_incident_ids - IDs of behavior incidents that occurred during session
 * @property {string} created_at - Timestamp when session record was created (ISO 8601)
 * @property {string} updated_at - Timestamp when session record was last updated (ISO 8601)
 */
export interface ActivitySession {
  id: string;
  activity_id: string;
  client_id: string;
  stakeholder_id: string;
  shift_note_id?: string;
  performed_at: string;
  duration_minutes: number;
  session_notes: string;
  participant_engagement: 1 | 2 | 3 | 4 | 5;
  goal_progress: GoalProgressEntry[];
  behavior_incident_ids: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Input data for creating a new activity session
 *
 * @interface CreateActivitySessionInput
 * @property {string} activity_id - ID of the activity template (required)
 * @property {string} client_id - ID of the client (required)
 * @property {string} stakeholder_id - ID of support worker who facilitated (required)
 * @property {string} [shift_note_id] - Optional ID of parent shift note
 * @property {string} performed_at - When the session occurred, ISO datetime (required)
 * @property {number} duration_minutes - Duration in minutes (required)
 * @property {string} session_notes - Detailed notes about the session (required)
 * @property {number} participant_engagement - Engagement rating 1-5 (required)
 * @property {GoalProgressEntry[]} [goal_progress] - Goals progressed during session (optional)
 * @property {string[]} [behavior_incident_ids] - Behavior incidents that occurred (optional)
 */
export interface CreateActivitySessionInput {
  activity_id: string;
  client_id: string;
  stakeholder_id: string;
  shift_note_id?: string;
  performed_at: string;
  duration_minutes: number;
  session_notes: string;
  participant_engagement: 1 | 2 | 3 | 4 | 5;
  goal_progress?: GoalProgressEntry[];
  behavior_incident_ids?: string[];
}

/**
 * Input data for updating an activity session
 *
 * All fields are optional to allow partial updates.
 *
 * @interface UpdateActivitySessionInput
 * @property {string} [session_notes] - Updated session notes
 * @property {number} [participant_engagement] - Updated engagement rating
 * @property {GoalProgressEntry[]} [goal_progress] - Updated goal progress entries
 * @property {string[]} [behavior_incident_ids] - Updated behavior incident IDs
 * @property {number} [duration_minutes] - Updated duration
 */
export interface UpdateActivitySessionInput {
  session_notes?: string;
  participant_engagement?: 1 | 2 | 3 | 4 | 5;
  goal_progress?: GoalProgressEntry[];
  behavior_incident_ids?: string[];
  duration_minutes?: number;
}

/**
 * Activity session with enriched details
 *
 * Extended activity session including related entity names and computed fields.
 *
 * @interface ActivitySessionWithDetails
 * @extends ActivitySession
 * @property {string} activity_title - Title of the activity template
 * @property {string} activity_type - Type of the activity
 * @property {string} client_name - Name of the client
 * @property {string} stakeholder_name - Name of the support worker
 * @property {string[]} goal_titles - Titles of goals that were progressed
 * @property {number} behavior_incident_count - Number of behavior incidents
 */
export interface ActivitySessionWithDetails extends ActivitySession {
  activity_title: string;
  activity_type: string;
  client_name: string;
  stakeholder_name: string;
  goal_titles: string[];
  behavior_incident_count: number;
}

/**
 * Filter options for listing activity sessions
 *
 * @interface ActivitySessionListFilter
 * @property {string} [client_id] - Filter by client ID
 * @property {string} [activity_id] - Filter by activity template ID
 * @property {string} [stakeholder_id] - Filter by support worker ID
 * @property {string} [shift_note_id] - Filter by shift note ID
 * @property {string} [goal_id] - Filter sessions that progressed this goal
 * @property {string} [date_from] - Filter sessions from this date (YYYY-MM-DD)
 * @property {string} [date_to] - Filter sessions to this date (YYYY-MM-DD)
 * @property {number} [min_engagement] - Filter by minimum engagement rating (1-5)
 * @property {number} [limit] - Maximum number of results
 * @property {number} [offset] - Number of results to skip
 */
export interface ActivitySessionListFilter {
  client_id?: string;
  activity_id?: string;
  stakeholder_id?: string;
  shift_note_id?: string;
  goal_id?: string;
  date_from?: string;
  date_to?: string;
  min_engagement?: number;
  limit?: number;
  offset?: number;
}
