/**
 * Shift Note Model
 *
 * Represents comprehensive shift documentation for support sessions.
 * Links activities, goals, and observations into a cohesive handover document.
 *
 * @module models/shift-note
 */

import { GoalProgress } from './goal.js';

/**
 * Shift note entity representing a support shift documentation
 *
 * @interface ShiftNote
 * @property {string} id - Unique identifier (UUID v4)
 * @property {string} client_id - ID of the client
 * @property {string} stakeholder_id - ID of the stakeholder who conducted the shift
 * @property {string} shift_date - Date of the shift (ISO 8601)
 * @property {string} start_time - Shift start time (HH:MM format)
 * @property {string} end_time - Shift end time (HH:MM format)
 * @property {string} general_observations - General observations about the shift
 * @property {string[]} [activity_ids] - Array of activity IDs from this shift
 * @property {GoalProgress[]} [goals_progress] - Progress notes for goals worked on
 * @property {string} [mood_wellbeing] - Notes about participant's mood and wellbeing
 * @property {string} [communication_notes] - Communication-specific observations
 * @property {string} [health_safety_notes] - Health and safety observations
 * @property {string} [handover_notes] - Important information for next shift
 * @property {string} [incidents] - Any incidents or concerns to report
 * @property {string} created_at - Timestamp when shift note was created (ISO 8601)
 * @property {string} updated_at - Timestamp when shift note was last updated (ISO 8601)
 */
export interface ShiftNote {
  id: string;
  client_id: string;
  stakeholder_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  general_observations: string;
  activity_ids?: string[];
  goals_progress?: GoalProgress[];
  mood_wellbeing?: string;
  communication_notes?: string;
  health_safety_notes?: string;
  handover_notes?: string;
  incidents?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Input data for creating a new shift note
 *
 * @interface CreateShiftNoteInput
 * @property {string} client_id - ID of the client (required)
 * @property {string} stakeholder_id - ID of the stakeholder (required)
 * @property {string} shift_date - Date of the shift (required)
 * @property {string} start_time - Shift start time (required)
 * @property {string} end_time - Shift end time (required)
 * @property {string} general_observations - General observations (required)
 * @property {string[]} [activity_ids] - Related activity IDs (optional)
 * @property {GoalProgress[]} [goals_progress] - Goal progress entries (optional)
 * @property {string} [mood_wellbeing] - Mood and wellbeing notes (optional)
 * @property {string} [communication_notes] - Communication notes (optional)
 * @property {string} [health_safety_notes] - Health and safety notes (optional)
 * @property {string} [handover_notes] - Handover notes (optional)
 * @property {string} [incidents] - Incident reports (optional)
 */
export interface CreateShiftNoteInput {
  client_id: string;
  stakeholder_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  general_observations: string;
  activity_ids?: string[];
  goals_progress?: GoalProgress[];
  mood_wellbeing?: string;
  communication_notes?: string;
  health_safety_notes?: string;
  handover_notes?: string;
  incidents?: string;
}

/**
 * Input data for updating a shift note
 *
 * All fields are optional to allow partial updates.
 * Updates only allowed within 24 hours of shift_date.
 *
 * @interface UpdateShiftNoteInput
 * @property {string} [general_observations] - Updated general observations
 * @property {string[]} [activity_ids] - Updated activity IDs
 * @property {GoalProgress[]} [goals_progress] - Updated goal progress
 * @property {string} [mood_wellbeing] - Updated mood notes
 * @property {string} [communication_notes] - Updated communication notes
 * @property {string} [health_safety_notes] - Updated health notes
 * @property {string} [handover_notes] - Updated handover notes
 * @property {string} [incidents] - Updated incident reports
 */
export interface UpdateShiftNoteInput {
  general_observations?: string;
  activity_ids?: string[];
  goals_progress?: GoalProgress[];
  mood_wellbeing?: string;
  communication_notes?: string;
  health_safety_notes?: string;
  handover_notes?: string;
  incidents?: string;
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
 * @property {string} stakeholder_name - Name of the stakeholder
 * @property {number} duration_minutes - Calculated shift duration in minutes
 */
export interface ShiftNoteWithDetails extends ShiftNote {
  client_name: string;
  stakeholder_name: string;
  duration_minutes: number;
}

/**
 * Filter options for listing shift notes
 *
 * @interface ShiftNoteListFilter
 * @property {string} [client_id] - Filter by client ID
 * @property {string} [stakeholder_id] - Filter by stakeholder ID
 * @property {string} [date_from] - Filter shifts from this date (ISO 8601)
 * @property {string} [date_to] - Filter shifts to this date (ISO 8601)
 * @property {number} [limit] - Maximum number of results
 * @property {number} [offset] - Number of results to skip
 */
export interface ShiftNoteListFilter {
  client_id?: string;
  stakeholder_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}
