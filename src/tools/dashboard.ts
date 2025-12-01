/**
 * Dashboard Tools
 *
 * MCP tools for aggregated data and analytics.
 * Provides dashboard views and client summaries.
 *
 * @module tools/dashboard
 */

import { StorageProvider } from '../storage/index.js';
import {
  Dashboard,
  DashboardSummary,
  GoalsByStatus,
  ClientSummary,
  ClientGoalProgress,
  Client,
  Goal,
  Activity,
  ShiftNote,
  BehaviorIncident,
  GoalStatus,
  ActivityStatus,
} from '../models/index.js';
import { getCurrentWeekRange } from '../utils/dates.js';
import { isGoalAtRisk } from '../validation/rules.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Get complete dashboard data
 *
 * Returns aggregated metrics and recent activity lists.
 *
 * @param storage - Storage provider
 * @returns Dashboard with all metrics
 * @throws {StorageError} If storage operation fails
 */
export async function getDashboard(storage: StorageProvider): Promise<Dashboard> {
  // Get all entities
  const allClients = await storage.list<Client>('clients');
  const allGoals = await storage.list<Goal>('goals');
  const allActivities = await storage.list<Activity>('activities');
  const allShiftNotes = await storage.list<ShiftNote>('shift_notes');
  const allBehaviorIncidents = await storage.list<BehaviorIncident>('behavior_incidents');

  // Calculate summary statistics
  const activeClients = allClients.filter((c) => c.active);
  const activeGoals = allGoals.filter((g) => !g.archived);

  // Get current week range
  const weekRange = getCurrentWeekRange();

  // Shift notes this week
  const shiftNotesThisWeek = allShiftNotes.filter(
    (sn) => sn.shift_date >= weekRange.start && sn.shift_date <= weekRange.end
  );

  // Note: Activities no longer have dates - count total in pool instead
  const totalActivitiesInPool = allActivities.length;

  // Goals by status
  const goalsByStatus: GoalsByStatus = {
    not_started: 0,
    in_progress: 0,
    achieved: 0,
    on_hold: 0,
    discontinued: 0,
  };

  for (const goal of activeGoals) {
    switch (goal.status) {
      case GoalStatus.NOT_STARTED:
        goalsByStatus.not_started++;
        break;
      case GoalStatus.IN_PROGRESS:
        goalsByStatus.in_progress++;
        break;
      case GoalStatus.ACHIEVED:
        goalsByStatus.achieved++;
        break;
      case GoalStatus.ON_HOLD:
        goalsByStatus.on_hold++;
        break;
      case GoalStatus.DISCONTINUED:
        goalsByStatus.discontinued++;
        break;
    }
  }

  // Goals at risk
  const goalsAtRisk = activeGoals.filter((g) => isGoalAtRisk(g));

  // Behavior incidents - high severity this month
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0] || '';
  const highSeverityThisMonth = allBehaviorIncidents.filter(
    (bi) => bi.severity === 'high' && bi.incident_date >= thirtyDaysAgoStr
  );

  // Summary
  const summary: DashboardSummary = {
    total_clients: allClients.length,
    active_clients: activeClients.length,
    total_active_goals: activeGoals.length,
    total_activities_in_pool: totalActivitiesInPool,
    shift_notes_this_week: shiftNotesThisWeek.length,
    goals_by_status: goalsByStatus,
    goals_at_risk: goalsAtRisk.length,
    total_behavior_incidents: allBehaviorIncidents.length,
    high_severity_incidents_this_month: highSeverityThisMonth.length,
  };

  // Recent activities (last 10 created)
  const recentActivities = [...allActivities]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10);

  // Note: Upcoming activities removed - activities no longer have dates

  // Recent shift notes (last 10)
  const recentShiftNotes = [...allShiftNotes]
    .sort((a, b) => {
      const dateCompare = b.shift_date.localeCompare(a.shift_date);
      if (dateCompare !== 0) return dateCompare;
      return b.created_at.localeCompare(a.created_at);
    })
    .slice(0, 10);

  // Recent behavior incidents (last 10)
  const recentBehaviorIncidents = [...allBehaviorIncidents]
    .sort((a, b) => {
      const dateCompare = b.incident_date.localeCompare(a.incident_date);
      if (dateCompare !== 0) return dateCompare;
      return b.created_at.localeCompare(a.created_at);
    })
    .slice(0, 10);

  // Build dashboard
  const dashboard: Dashboard = {
    summary,
    recent_activities: recentActivities,
    recent_shift_notes: recentShiftNotes,
    goals_at_risk: goalsAtRisk,
    recent_behavior_incidents: recentBehaviorIncidents,
  };

  return dashboard;
}

/**
 * Get client summary
 *
 * Returns quick overview of a client's goals and recent activity.
 *
 * @param storage - Storage provider
 * @param clientId - Client ID
 * @returns Client summary with goal progress
 * @throws {NotFoundError} If client not found
 * @throws {StorageError} If storage operation fails
 */
export async function getClientSummary(
  storage: StorageProvider,
  clientId: string
): Promise<ClientSummary> {
  // Get client
  const client = await storage.read<Client>('clients', clientId);
  if (!client) {
    throw new NotFoundError('Client', clientId);
  }

  // Get client's goals
  const allGoals = await storage.list<Goal>('goals', { client_id: clientId } as Partial<Goal>);
  const activeGoals = allGoals.filter((g) => !g.archived);

  // Get client's activities
  const allActivities = await storage.list<Activity>('activities', {
    client_id: clientId,
  } as Partial<Activity>);

  // Activities no longer have dates - count total completed
  const completedActivities = allActivities.filter(
    (a) => a.status === ActivityStatus.COMPLETED
  );

  // Get client's shift notes
  const allShiftNotes = await storage.list<ShiftNote>('shift_notes', {
    client_id: clientId,
  } as Partial<ShiftNote>);

  // Last shift date
  const sortedShiftNotes = [...allShiftNotes].sort((a, b) =>
    b.shift_date.localeCompare(a.shift_date)
  );
  const lastShiftDate = sortedShiftNotes[0]?.shift_date;

  // Build goal progress list
  const goalProgress: ClientGoalProgress[] = activeGoals.map((goal) => {
    const atRisk = isGoalAtRisk(goal);
    return {
      goal_id: goal.id,
      goal_title: goal.title,
      status: goal.status,
      progress_percentage: goal.progress_percentage,
      target_date: goal.target_date,
      at_risk: atRisk,
    };
  });

  // Build client summary
  const summary: ClientSummary = {
    client_id: client.id,
    client_name: client.name,
    active_goals: activeGoals.length,
    total_completed_activities: completedActivities.length,
    last_shift_date: lastShiftDate,
    goal_progress: goalProgress,
  };

  return summary;
}

/**
 * Get statistics overview
 *
 * Returns high-level statistics without detailed lists.
 *
 * @param storage - Storage provider
 * @returns Statistics object
 * @throws {StorageError} If storage operation fails
 */
export async function getStatistics(storage: StorageProvider): Promise<{
  total_clients: number;
  active_clients: number;
  total_goals: number;
  active_goals: number;
  total_activities: number;
  total_shift_notes: number;
  total_behavior_incidents: number;
  goals_at_risk: number;
}> {
  const stats = await storage.getStats();

  const allClients = await storage.list<Client>('clients');
  const activeClients = allClients.filter((c) => c.active);

  const allGoals = await storage.list<Goal>('goals');
  const activeGoals = allGoals.filter((g) => !g.archived);
  const goalsAtRisk = activeGoals.filter((g) => isGoalAtRisk(g));

  return {
    total_clients: stats.records_by_collection.clients,
    active_clients: activeClients.length,
    total_goals: stats.records_by_collection.goals,
    active_goals: activeGoals.length,
    total_activities: stats.records_by_collection.activities,
    total_shift_notes: stats.records_by_collection.shift_notes,
    total_behavior_incidents: stats.records_by_collection.behavior_incidents || 0,
    goals_at_risk: goalsAtRisk.length,
  };
}
