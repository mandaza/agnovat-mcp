/**
 * Dashboard Convex Functions
 *
 * Type-safe Convex functions for dashboard metrics and summaries.
 * These functions can be called directly from Flutter via the Convex Dart client.
 *
 * @module convex/dashboard
 */

import { query } from './_generated/server';
import { v } from 'convex/values';
import {
  ValidationError,
  NotFoundError,
  normalizeRecord,
  normalizeRecords,
} from './lib/validation';

/**
 * Get complete dashboard with aggregated metrics
 */
export const getDashboard = query({
  args: {},
  handler: async (ctx) => {
    // Get all clients
    const allClients = await ctx.db.query('clients').collect();
    const activeClients = allClients.filter((c) => c.active);

    // Get all goals
    const allGoals = await ctx.db.query('goals').collect();
    const activeGoals = allGoals.filter((g) => !g.archived);

    // Calculate at-risk goals (target_date within 14 days and progress < 50%)
    const today = new Date();
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);

    const goalsAtRisk = activeGoals
      .filter((goal) => {
        const targetDate = new Date(goal.target_date);
        const daysToTarget = Math.ceil(
          (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        return (
          goal.status !== 'achieved' &&
          daysToTarget <= 14 &&
          daysToTarget >= 0 &&
          goal.progress_percentage < 50
        );
      })
      .map(async (goal) => {
        const client = await ctx.db.get(goal.client_id);
        const targetDate = new Date(goal.target_date);
        const daysToTarget = Math.ceil(
          (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          goal_id: goal._id,
          client_name: client?.name,
          title: goal.title,
          progress: goal.progress_percentage,
          days_to_target: daysToTarget,
        };
      });

    const resolvedGoalsAtRisk = await Promise.all(goalsAtRisk);

    // Get recent activities (last 10)
    const allActivities = await ctx.db.query('activities').collect();
    const recentActivities = allActivities
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 10);

    // Get recent shift notes (last 5)
    const allShiftNotes = await ctx.db.query('shift_notes').collect();
    const recentShiftNotes = allShiftNotes
      .sort((a, b) => b.shift_date.localeCompare(a.shift_date))
      .slice(0, 5);

    // Calculate statistics
    const goalsByStatus: Record<string, number> = {};
    activeGoals.forEach((goal) => {
      goalsByStatus[goal.status] = (goalsByStatus[goal.status] || 0) + 1;
    });

    const activitiesByType: Record<string, number> = {};
    allActivities.forEach((activity) => {
      activitiesByType[activity.activity_type] =
        (activitiesByType[activity.activity_type] || 0) + 1;
    });

    return {
      total_clients: allClients.length,
      active_clients: activeClients.length,
      total_goals: allGoals.length,
      active_goals: activeGoals.length,
      goals_at_risk: resolvedGoalsAtRisk,
      recent_activities: normalizeRecords(recentActivities),
      recent_shift_notes: normalizeRecords(recentShiftNotes),
      statistics: {
        goals_by_status: goalsByStatus,
        activities_by_type: activitiesByType,
      },
    };
  },
});

/**
 * Get client summary with goal progress
 */
export const getClientSummary = query({
  args: {
    client_id: v.id('clients'),
  },
  handler: async (ctx, args) => {
    // Get client
    const client = await ctx.db.get(args.client_id);
    if (!client) {
      throw new NotFoundError(`Client with ID ${args.client_id} not found`);
    }

    // Get goals for this client
    const goals = await ctx.db
      .query('goals')
      .withIndex('by_client', (q) => q.eq('client_id', args.client_id))
      .collect();

    // Get recent activities (last 5)
    const allActivities = await ctx.db
      .query('activities')
      .withIndex('by_client', (q) => q.eq('client_id', args.client_id))
      .collect();

    const recentActivities = allActivities
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 5);

    // Get last shift note
    const shiftNotes = await ctx.db
      .query('shift_notes')
      .withIndex('by_client', (q) => q.eq('client_id', args.client_id))
      .collect();

    const sortedShiftNotes = shiftNotes.sort((a, b) =>
      b.shift_date.localeCompare(a.shift_date)
    );

    const lastShiftNote = sortedShiftNotes[0];

    return {
      client: normalizeRecord(client),
      goals: normalizeRecords(goals),
      recent_activities: normalizeRecords(recentActivities),
      last_shift_note: lastShiftNote ? normalizeRecord(lastShiftNote) : null,
    };
  },
});

/**
 * Get high-level statistics
 */
export const getStatistics = query({
  args: {},
  handler: async (ctx) => {
    // Get counts from all collections
    const clients = await ctx.db.query('clients').collect();
    const goals = await ctx.db.query('goals').collect();
    const activities = await ctx.db.query('activities').collect();
    const shiftNotes = await ctx.db.query('shift_notes').collect();
    const stakeholders = await ctx.db.query('stakeholders').collect();

    // Calculate active counts
    const activeClients = clients.filter((c) => c.active).length;
    const activeGoals = goals.filter((g) => !g.archived).length;

    // Calculate goals achieved this month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayIso = firstDayOfMonth.toISOString();

    const goalsAchievedThisMonth = goals.filter(
      (g) => g.status === 'achieved' && g.achieved_at && g.achieved_at >= firstDayIso
    ).length;

    return {
      total_records:
        clients.length +
        goals.length +
        activities.length +
        shiftNotes.length +
        stakeholders.length,
      records_by_collection: {
        clients: clients.length,
        goals: goals.length,
        activities: activities.length,
        shift_notes: shiftNotes.length,
        stakeholders: stakeholders.length,
      },
      active_clients: activeClients,
      active_goals: activeGoals,
      goals_achieved_this_month: goalsAchievedThisMonth,
    };
  },
});
