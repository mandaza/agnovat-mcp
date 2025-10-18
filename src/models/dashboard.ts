/**
 * Dashboard Model
 *
 * Represents aggregated data for dashboard views and summaries.
 * Provides quick overview of key metrics and recent activities.
 *
 * @module models/dashboard
 */

import { GoalStatus } from './enums.js';
import { Activity } from './activity.js';
import { ShiftNote } from './shift-note.js';
import { Goal } from './goal.js';

/**
 * Dashboard summary with key metrics
 *
 * @interface DashboardSummary
 * @property {number} total_clients - Total number of clients
 * @property {number} active_clients - Number of active clients
 * @property {number} total_active_goals - Total active goals across all clients
 * @property {number} activities_this_week - Number of activities in current week
 * @property {number} shift_notes_this_week - Number of shift notes in current week
 * @property {GoalsByStatus} goals_by_status - Breakdown of goals by status
 * @property {number} goals_at_risk - Number of goals at risk (< 50% progress, < 14 days)
 */
export interface DashboardSummary {
  total_clients: number;
  active_clients: number;
  total_active_goals: number;
  activities_this_week: number;
  shift_notes_this_week: number;
  goals_by_status: GoalsByStatus;
  goals_at_risk: number;
}

/**
 * Breakdown of goals by status
 *
 * @interface GoalsByStatus
 * @property {number} not_started - Number of not started goals
 * @property {number} in_progress - Number of in progress goals
 * @property {number} achieved - Number of achieved goals
 * @property {number} on_hold - Number of on hold goals
 * @property {number} discontinued - Number of discontinued goals
 */
export interface GoalsByStatus {
  not_started: number;
  in_progress: number;
  achieved: number;
  on_hold: number;
  discontinued: number;
}

/**
 * Complete dashboard data
 *
 * Includes summary metrics and recent activity lists.
 *
 * @interface Dashboard
 * @property {DashboardSummary} summary - Summary statistics
 * @property {Activity[]} recent_activities - Last 10 activities
 * @property {Activity[]} upcoming_activities - Next 7 days of scheduled activities
 * @property {ShiftNote[]} recent_shift_notes - Last 10 shift notes
 * @property {Goal[]} goals_at_risk - Goals at risk of not being achieved
 */
export interface Dashboard {
  summary: DashboardSummary;
  recent_activities: Activity[];
  upcoming_activities: Activity[];
  recent_shift_notes: ShiftNote[];
  goals_at_risk: Goal[];
}

/**
 * Client summary for quick overview
 *
 * @interface ClientSummary
 * @property {string} client_id - Client ID
 * @property {string} client_name - Client name
 * @property {number} active_goals - Number of active goals
 * @property {number} completed_activities_this_week - Activities completed this week
 * @property {string} [last_shift_date] - Date of last shift (ISO 8601)
 * @property {GoalProgress[]} goal_progress - Progress of all active goals
 */
export interface ClientSummary {
  client_id: string;
  client_name: string;
  active_goals: number;
  completed_activities_this_week: number;
  last_shift_date?: string;
  goal_progress: ClientGoalProgress[];
}

/**
 * Goal progress for client summary
 *
 * @interface ClientGoalProgress
 * @property {string} goal_id - Goal ID
 * @property {string} goal_title - Goal title
 * @property {GoalStatus} status - Current status
 * @property {number} progress_percentage - Progress percentage (0-100)
 * @property {string} target_date - Target completion date (ISO 8601)
 * @property {boolean} at_risk - Whether goal is at risk
 */
export interface ClientGoalProgress {
  goal_id: string;
  goal_title: string;
  status: GoalStatus;
  progress_percentage: number;
  target_date: string;
  at_risk: boolean;
}
