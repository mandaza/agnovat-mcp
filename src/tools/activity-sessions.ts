/**
 * Activity Session Tools
 *
 * Business logic for managing activity sessions.
 * Activity sessions represent individual occurrences of performing activities with clients.
 *
 * @module tools/activity-sessions
 */

import { v4 as uuidv4 } from 'uuid';
import { StorageProvider } from '../storage/base.js';
import {
  ActivitySession,
  ActivitySessionWithDetails,
  CreateActivitySessionInput,
  UpdateActivitySessionInput,
  ActivitySessionListFilter,
} from '../models/activity-session.js';
import { Client } from '../models/client.js';
import { Activity } from '../models/activity.js';
import { Stakeholder } from '../models/stakeholder.js';
import { Goal } from '../models/goal.js';
import { BehaviorIncident } from '../models/behavior-incident.js';
import {
  createActivitySessionSchema,
  updateActivitySessionSchema,
  activitySessionListFilterSchema,
} from '../validation/schemas.js';
import { validateWithSchema } from '../utils/validation.js';
import { getCurrentTimestamp } from '../utils/dates.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new activity session
 *
 * Validates that all referenced entities exist and creates a session record.
 * This is the core function for recording what happened during an activity.
 *
 * @param storage - Storage provider instance
 * @param input - Activity session creation data
 * @returns Created activity session
 * @throws {ValidationError} If input validation fails or referenced entities don't exist
 * @throws {NotFoundError} If client, activity, stakeholder, or goals not found
 */
export async function createActivitySession(
  storage: StorageProvider,
  input: unknown
): Promise<ActivitySession> {
  // Validate input
  const data = validateWithSchema<CreateActivitySessionInput>(
    createActivitySessionSchema,
    input
  );

  logger.info('Creating activity session', {
    activity_id: data.activity_id,
    client_id: data.client_id,
  });

  // Validate client exists and is active
  const client = await storage.read<Client>('clients', data.client_id);
  if (!client) {
    throw new NotFoundError('Client', data.client_id);
  }
  if (!client.active) {
    throw new ValidationError(
      'Cannot create session for inactive client'
    );
  }

  // Validate activity exists
  const activity = await storage.read<Activity>('activities', data.activity_id);
  if (!activity) {
    throw new NotFoundError('Activity', data.activity_id);
  }

  // Validate stakeholder exists and is active
  const stakeholder = await storage.read<Stakeholder>(
    'stakeholders',
    data.stakeholder_id
  );
  if (!stakeholder) {
    throw new NotFoundError('Stakeholder', data.stakeholder_id);
  }
  if (!stakeholder.active) {
    throw new ValidationError(
      'Cannot assign session to inactive stakeholder'
    );
  }

  // Validate goals exist and belong to client
  if (data.goal_progress && data.goal_progress.length > 0) {
    for (const gp of data.goal_progress) {
      const goal = await storage.read<Goal>('goals', gp.goal_id);
      if (!goal) {
        throw new NotFoundError('Goal', gp.goal_id);
      }
      if (goal.client_id !== data.client_id) {
        throw new ValidationError(
          `Goal ${gp.goal_id} does not belong to client`
        );
      }
      if (goal.archived) {
        throw new ValidationError(
          `Goal ${gp.goal_id} is archived - cannot track progress`
        );
      }
    }
  }

  // Validate behavior incidents exist and belong to client
  if (data.behavior_incident_ids && data.behavior_incident_ids.length > 0) {
    for (const incidentId of data.behavior_incident_ids) {
      const incident = await storage.read<BehaviorIncident>(
        'behavior_incidents',
        incidentId
      );
      if (!incident) {
        throw new NotFoundError('Behavior incident', incidentId);
      }
      if (incident.client_id !== data.client_id) {
        throw new ValidationError(
          `Behavior incident ${incidentId} does not belong to client`
        );
      }
    }
  }

  // Create session
  const now = getCurrentTimestamp();
  const session: ActivitySession = {
    id: uuidv4(),
    ...data,
    goal_progress: data.goal_progress || [],
    behavior_incident_ids: data.behavior_incident_ids || [],
    created_at: now,
    updated_at: now,
  };

  await storage.write('activity_sessions', session);

  logger.info('Activity session created successfully', {
    session_id: session.id,
    activity_id: session.activity_id,
  });

  return session;
}

/**
 * Update an existing activity session
 *
 * @param storage - Storage provider instance
 * @param sessionId - ID of the session to update
 * @param input - Updated session data
 * @returns Updated activity session
 * @throws {NotFoundError} If session or referenced goals not found
 * @throws {ValidationError} If validation fails
 */
export async function updateActivitySession(
  storage: StorageProvider,
  sessionId: string,
  input: unknown
): Promise<ActivitySession> {
  const data = validateWithSchema<UpdateActivitySessionInput>(
    updateActivitySessionSchema,
    input
  );

  logger.info('Updating activity session', { session_id: sessionId });

  const session = await storage.read<ActivitySession>(
    'activity_sessions',
    sessionId
  );
  if (!session) {
    throw new NotFoundError('Activity session', sessionId);
  }

  // Validate goals if provided
  if (data.goal_progress && data.goal_progress.length > 0) {
    for (const gp of data.goal_progress) {
      const goal = await storage.read<Goal>('goals', gp.goal_id);
      if (!goal) {
        throw new NotFoundError('Goal', gp.goal_id);
      }
      if (goal.client_id !== session.client_id) {
        throw new ValidationError(
          `Goal ${gp.goal_id} does not belong to client`
        );
      }
    }
  }

  // Update session
  const updatedSession: ActivitySession = {
    ...session,
    ...data,
    updated_at: getCurrentTimestamp(),
  };

  await storage.write('activity_sessions', updatedSession);

  logger.info('Activity session updated successfully', {
    session_id: sessionId,
  });

  return updatedSession;
}

/**
 * Get activity session by ID with enriched details
 *
 * @param storage - Storage provider instance
 * @param sessionId - ID of the session to retrieve
 * @returns Activity session with related entity details
 * @throws {NotFoundError} If session not found
 */
export async function getActivitySession(
  storage: StorageProvider,
  sessionId: string
): Promise<ActivitySessionWithDetails> {
  logger.info('Fetching activity session', { session_id: sessionId });

  const session = await storage.read<ActivitySession>(
    'activity_sessions',
    sessionId
  );
  if (!session) {
    throw new NotFoundError('Activity session', sessionId);
  }

  // Fetch related entities
  const activity = await storage.read<Activity>(
    'activities',
    session.activity_id
  );
  const client = await storage.read<Client>('clients', session.client_id);
  const stakeholder = await storage.read<Stakeholder>(
    'stakeholders',
    session.stakeholder_id
  );

  // Fetch goal titles
  const goalTitles: string[] = [];
  for (const gp of session.goal_progress) {
    const goal = await storage.read<Goal>('goals', gp.goal_id);
    if (goal) {
      goalTitles.push(goal.title);
    }
  }

  return {
    ...session,
    activity_title: activity?.title || 'Unknown Activity',
    activity_type: activity?.activity_type || 'other',
    client_name: client?.name || 'Unknown Client',
    stakeholder_name: stakeholder?.name || 'Unknown Stakeholder',
    goal_titles: goalTitles,
    behavior_incident_count: session.behavior_incident_ids.length,
  };
}

/**
 * List activity sessions with filtering
 *
 * Supports filtering by client, activity, stakeholder, goal, date range, and engagement level.
 *
 * @param storage - Storage provider instance
 * @param filter - Filter criteria
 * @returns Array of activity sessions
 */
export async function listActivitySessions(
  storage: StorageProvider,
  filter: unknown
): Promise<ActivitySession[]> {
  const validFilter = validateWithSchema<ActivitySessionListFilter>(
    activitySessionListFilterSchema,
    filter || {}
  );

  logger.info('Listing activity sessions', { filter: validFilter });

  let sessions = await storage.list<ActivitySession>('activity_sessions');

  // Apply filters
  if (validFilter.client_id) {
    sessions = sessions.filter((s) => s.client_id === validFilter.client_id);
  }

  if (validFilter.activity_id) {
    sessions = sessions.filter(
      (s) => s.activity_id === validFilter.activity_id
    );
  }

  if (validFilter.stakeholder_id) {
    sessions = sessions.filter(
      (s) => s.stakeholder_id === validFilter.stakeholder_id
    );
  }

  if (validFilter.shift_note_id) {
    sessions = sessions.filter(
      (s) => s.shift_note_id === validFilter.shift_note_id
    );
  }

  if (validFilter.goal_id) {
    sessions = sessions.filter((s) =>
      s.goal_progress.some((gp) => gp.goal_id === validFilter.goal_id)
    );
  }

  if (validFilter.date_from) {
    sessions = sessions.filter(
      (s) => s.performed_at >= validFilter.date_from!
    );
  }

  if (validFilter.date_to) {
    sessions = sessions.filter(
      (s) => s.performed_at <= validFilter.date_to! + 'T23:59:59.999Z'
    );
  }

  if (validFilter.min_engagement) {
    sessions = sessions.filter(
      (s) => s.participant_engagement >= validFilter.min_engagement!
    );
  }

  // Sort by performed_at (newest first)
  sessions.sort(
    (a, b) =>
      new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime()
  );

  // Apply pagination
  const offset = validFilter.offset || 0;
  const limit = validFilter.limit || 20;

  logger.info('Activity sessions listed successfully', {
    total_count: sessions.length,
    returned_count: Math.min(limit, sessions.length - offset),
  });

  return sessions.slice(offset, offset + limit);
}

/**
 * Delete an activity session
 *
 * @param storage - Storage provider instance
 * @param sessionId - ID of the session to delete
 * @returns True if deleted successfully
 * @throws {NotFoundError} If session not found
 */
export async function deleteActivitySession(
  storage: StorageProvider,
  sessionId: string
): Promise<boolean> {
  logger.info('Deleting activity session', { session_id: sessionId });

  const session = await storage.read<ActivitySession>(
    'activity_sessions',
    sessionId
  );
  if (!session) {
    throw new NotFoundError('Activity session', sessionId);
  }

  const result = await storage.delete('activity_sessions', sessionId);

  logger.info('Activity session deleted successfully', {
    session_id: sessionId,
  });

  return result;
}

/**
 * Get activity effectiveness report for a goal
 *
 * Analyzes which activities are most effective for progressing a specific goal.
 * Returns statistics showing session count, average progress, and average engagement.
 *
 * @param storage - Storage provider instance
 * @param goalId - ID of the goal to analyze
 * @returns Report showing activity effectiveness for the goal
 * @throws {NotFoundError} If goal not found
 */
export async function getActivityEffectivenessReport(
  storage: StorageProvider,
  goalId: string
): Promise<{
  goal: Goal;
  activity_stats: Array<{
    activity_id: string;
    activity_title: string;
    session_count: number;
    avg_progress: number;
    avg_engagement: number;
  }>;
}> {
  logger.info('Generating activity effectiveness report', { goal_id: goalId });

  const goal = await storage.read<Goal>('goals', goalId);
  if (!goal) {
    throw new NotFoundError('Goal', goalId);
  }

  // Get all sessions that progressed this goal
  const allSessions = await storage.list<ActivitySession>('activity_sessions');
  const relevantSessions = allSessions.filter((s) =>
    s.goal_progress.some((gp) => gp.goal_id === goalId)
  );

  // Group by activity
  const activityMap = new Map<
    string,
    {
      activity_id: string;
      activity_title: string;
      progress_scores: number[];
      engagement_scores: number[];
    }
  >();

  for (const session of relevantSessions) {
    const goalProgress = session.goal_progress.find(
      (gp) => gp.goal_id === goalId
    );
    if (!goalProgress) continue;

    if (!activityMap.has(session.activity_id)) {
      const activity = await storage.read<Activity>(
        'activities',
        session.activity_id
      );
      activityMap.set(session.activity_id, {
        activity_id: session.activity_id,
        activity_title: activity?.title || 'Unknown',
        progress_scores: [],
        engagement_scores: [],
      });
    }

    const stats = activityMap.get(session.activity_id)!;
    stats.progress_scores.push(goalProgress.progress_observed);
    stats.engagement_scores.push(session.participant_engagement);
  }

  // Calculate averages
  const activity_stats = Array.from(activityMap.values()).map((stats) => ({
    activity_id: stats.activity_id,
    activity_title: stats.activity_title,
    session_count: stats.progress_scores.length,
    avg_progress:
      stats.progress_scores.reduce((a, b) => a + b, 0) /
      stats.progress_scores.length,
    avg_engagement:
      stats.engagement_scores.reduce((a, b) => a + b, 0) /
      stats.engagement_scores.length,
  }));

  // Sort by average progress (highest first)
  activity_stats.sort((a, b) => b.avg_progress - a.avg_progress);

  logger.info('Activity effectiveness report generated', {
    goal_id: goalId,
    activities_analyzed: activity_stats.length,
  });

  return {
    goal,
    activity_stats,
  };
}
