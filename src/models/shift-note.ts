/**
 * Shift Note Model
 *
 * Represents comprehensive shift documentation for support sessions.
 * Links activities, goals, and observations into a cohesive handover document.
 *
 * HYBRID APPROACH: Shift notes now link to structured activity sessions
 * and behavior incidents, while also maintaining high-level narrative context.
 *
 * @module models/shift-note
 */

import { GoalProgress } from './goal.js';
import { ClientMood } from './enums.js';

/**
 * Shift note entity representing a support shift documentation
 *
 * HYBRID APPROACH FIELDS:
 * - activity_session_ids: Links to structured activity sessions performed during shift
 * - behavior_incident_ids: Links to behavior incidents that occurred during shift
 * - overall_notes: High-level narrative summary (replaces raw_notes in new approach)
 * - client_mood: Overall mood assessment for the shift
 * - notable_achievements: Highlights and wins to celebrate
 * - concerns_raised: Any concerns that need follow-up
 *
 * LEGACY FIELDS (maintained for backward compatibility):
 * - raw_notes, morning_routine, activities, etc. - from old free-form approach
 * - activity_ids, goals_progress - replaced by activity sessions
 *
 * @interface ShiftNote
 * @property {string} id - Unique identifier (UUID v4)
 * @property {string} client_id - ID of the client
 * @property {string} user_id - ID of the user who conducted the shift
 * @property {string} shift_date - Date of the shift (ISO 8601)
 * @property {string} start_time - Shift start time (HH:MM format)
 * @property {string} end_time - Shift end time (HH:MM format)
 * @property {string[]} [primary_locations] - Primary locations visited during shift
 * @property {string[]} [activity_session_ids] - Array of activity session IDs from this shift (NEW)
 * @property {string[]} [behavior_incident_ids] - Array of behavior incident IDs from this shift (NEW)
 * @property {string} [overall_notes] - High-level shift summary and narrative context (NEW)
 * @property {ClientMood} [client_mood] - Overall client mood during shift (NEW)
 * @property {string} [notable_achievements] - Highlights and achievements during shift (NEW)
 * @property {string} [concerns_raised] - Any concerns that need escalation or follow-up (NEW)
 * @property {string} [raw_notes] - Raw unformatted notes from staff (LEGACY - optional now)
 * @property {string} [morning_routine] - Formatted morning routine details (LEGACY)
 * @property {string} [activities] - Formatted activities summary (LEGACY)
 * @property {string} [afternoon_evening] - Formatted afternoon/evening summary (LEGACY)
 * @property {string} [behaviours_of_concern] - Formatted behaviours of concern (LEGACY)
 * @property {string} [behaviour_support_provided] - Formatted support/redirection provided (LEGACY)
 * @property {string} [home_environment] - Formatted home environment description (LEGACY)
 * @property {string} [summary] - Formatted shift summary (LEGACY)
 * @property {string} [formatted_note] - Complete AI-formatted shift note (LEGACY)
 * @property {string[]} [activity_ids] - Array of activity IDs from this shift (LEGACY - replaced by activity_session_ids)
 * @property {GoalProgress[]} [goals_progress] - Progress notes for goals worked on (LEGACY - replaced by activity sessions)
 * @property {string} created_at - Timestamp when shift note was created (ISO 8601)
 * @property {string} updated_at - Timestamp when shift note was last updated (ISO 8601)
 */
export interface ShiftNote {
  id: string;
  client_id: string;
  user_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  primary_locations?: string[];

  // NEW: Hybrid approach fields
  activity_session_ids?: string[];
  behavior_incident_ids?: string[];
  overall_notes?: string;
  client_mood?: ClientMood;
  notable_achievements?: string;
  concerns_raised?: string;

  // LEGACY: Old free-form approach fields (maintained for backward compatibility)
  raw_notes?: string;
  morning_routine?: string;
  activities?: string;
  afternoon_evening?: string;
  behaviours_of_concern?: string;
  behaviour_support_provided?: string;
  home_environment?: string;
  summary?: string;
  formatted_note?: string;
  activity_ids?: string[];
  goals_progress?: GoalProgress[];

  created_at: string;
  updated_at: string;
}

/**
 * Input data for creating a new shift note
 *
 * HYBRID APPROACH: Can provide either structured data (activity_session_ids, overall_notes)
 * or legacy free-form data (raw_notes). For best results, use structured approach.
 *
 * @interface CreateShiftNoteInput
 * @property {string} client_id - ID of the client (required)
 * @property {string} user_id - ID of the user (required)
 * @property {string} shift_date - Date of the shift (required)
 * @property {string} start_time - Shift start time (required)
 * @property {string} end_time - Shift end time (required)
 * @property {string[]} [primary_locations] - Primary locations visited (optional)
 * @property {string[]} [activity_session_ids] - Activity session IDs from shift (NEW - recommended)
 * @property {string[]} [behavior_incident_ids] - Behavior incident IDs from shift (NEW - recommended)
 * @property {string} [overall_notes] - High-level shift summary (NEW - recommended)
 * @property {ClientMood} [client_mood] - Overall client mood (NEW - recommended)
 * @property {string} [notable_achievements] - Highlights and achievements (NEW - optional)
 * @property {string} [concerns_raised] - Concerns needing follow-up (NEW - optional)
 * @property {string} [raw_notes] - Raw unformatted notes from staff (LEGACY - for backward compatibility)
 * @property {string[]} [activity_ids] - Related activity IDs (LEGACY)
 * @property {GoalProgress[]} [goals_progress] - Goal progress entries (LEGACY)
 */
export interface CreateShiftNoteInput {
  client_id: string;
  user_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  primary_locations?: string[];

  // NEW: Hybrid approach fields
  activity_session_ids?: string[];
  behavior_incident_ids?: string[];
  overall_notes?: string;
  client_mood?: ClientMood;
  notable_achievements?: string;
  concerns_raised?: string;

  // LEGACY: For backward compatibility
  raw_notes?: string;
  activity_ids?: string[];
  goals_progress?: GoalProgress[];
}

/**
 * Input data for updating a shift note
 *
 * All fields are optional to allow partial updates.
 * Updates only allowed within 24 hours of shift_date.
 *
 * @interface UpdateShiftNoteInput
 * @property {string[]} [primary_locations] - Updated primary locations
 * @property {string[]} [activity_session_ids] - Updated activity session IDs (NEW)
 * @property {string[]} [behavior_incident_ids] - Updated behavior incident IDs (NEW)
 * @property {string} [overall_notes] - Updated overall shift summary (NEW)
 * @property {ClientMood} [client_mood] - Updated client mood (NEW)
 * @property {string} [notable_achievements] - Updated achievements (NEW)
 * @property {string} [concerns_raised] - Updated concerns (NEW)
 * @property {string} [raw_notes] - Updated raw notes from staff (LEGACY)
 * @property {string[]} [activity_ids] - Updated activity IDs (LEGACY)
 * @property {GoalProgress[]} [goals_progress] - Updated goal progress (LEGACY)
 */
export interface UpdateShiftNoteInput {
  primary_locations?: string[];

  // NEW: Hybrid approach fields
  activity_session_ids?: string[];
  behavior_incident_ids?: string[];
  overall_notes?: string;
  client_mood?: ClientMood;
  notable_achievements?: string;
  concerns_raised?: string;

  // LEGACY: For backward compatibility
  raw_notes?: string;
  activity_ids?: string[];
  goals_progress?: GoalProgress[];
}

/**
 * Shift note with related entity details
 *
 * Extended shift note with client and stakeholder names,
 * and linked activity details.
 *
 * @interface ShiftNoteWithDetails
 * @extends ShiftNote
 * @property {string} client_name - Name of the client
 * @property {string} user_name - Name of the user
 * @property {number} duration_minutes - Calculated shift duration in minutes
 */
export interface ShiftNoteWithDetails extends ShiftNote {
  client_name: string;
  user_name: string;
  duration_minutes: number;
}

/**
 * Filter options for listing shift notes
 *
 * @interface ShiftNoteListFilter
 * @property {string} [client_id] - Filter by client ID
 * @property {string} [user_id] - Filter by user ID
 * @property {string} [date_from] - Filter shifts from this date (ISO 8601)
 * @property {string} [date_to] - Filter shifts to this date (ISO 8601)
 * @property {number} [limit] - Maximum number of results
 * @property {number} [offset] - Number of results to skip
 */
export interface ShiftNoteListFilter {
  client_id?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}
