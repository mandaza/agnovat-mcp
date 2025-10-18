/**
 * Activity Management Tools
 *
 * MCP tools for managing support activities.
 * Provides CRUD operations with goal linking and validation.
 *
 * @module tools/activities
 */

import { v4 as uuidv4 } from 'uuid';
import { StorageProvider } from '../storage/index.js';
import {
  Activity,
  ActivityWithDetails,
  ActivityStatus,
  Client,
  Stakeholder,
  Goal,
} from '../models/index.js';
import {
  createActivitySchema,
  updateActivitySchema,
  activityListFilterSchema,
} from '../validation/index.js';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  validateWithSchema,
} from '../utils/index.js';
import { getCurrentTimestamp, calculateDurationMinutes } from '../utils/dates.js';
import { validateActivityDuration } from '../validation/rules.js';

/**
 * Create a new activity
 *
 * @param storage - Storage provider
 * @param input - Activity creation data
 * @returns Created activity
 * @throws {ValidationError} If input validation fails
 * @throws {NotFoundError} If client or stakeholder not found
 * @throws {ConflictError} If client is inactive
 * @throws {StorageError} If storage operation fails
 */
export async function createActivity(storage: StorageProvider, input: unknown): Promise<Activity> {
  // Validate input
  const data = validateWithSchema(createActivitySchema, input);

  // Validate client exists and is active
  const client = await storage.read<Client>('clients', data.client_id);
  if (!client) {
    throw new NotFoundError('Client', data.client_id);
  }

  if (!client.active) {
    throw new ConflictError('Cannot create activity for inactive client', 'CLIENT_INACTIVE', {
      client_id: data.client_id,
    });
  }

  // Validate stakeholder exists and is active
  const stakeholder = await storage.read<Stakeholder>('stakeholders', data.stakeholder_id);
  if (!stakeholder) {
    throw new NotFoundError('Stakeholder', data.stakeholder_id);
  }

  if (!stakeholder.active) {
    throw new ConflictError(
      'Cannot create activity for inactive stakeholder',
      'STAKEHOLDER_INACTIVE',
      { stakeholder_id: data.stakeholder_id }
    );
  }

  // Validate goal IDs if provided
  if (data.goal_ids && data.goal_ids.length > 0) {
    for (const goalId of data.goal_ids) {
      const goal = await storage.read<Goal>('goals', goalId);
      if (!goal) {
        throw new NotFoundError('Goal', goalId);
      }

      // Verify goal belongs to the same client
      if (goal.client_id !== data.client_id) {
        throw new ConflictError(
          'Goal does not belong to the specified client',
          'GOAL_CLIENT_MISMATCH',
          { goal_id: goalId, client_id: data.client_id }
        );
      }
    }
  }

  // Validate duration if times are provided
  if (data.start_time && data.end_time) {
    const durationValidation = validateActivityDuration(
      data.start_time,
      data.end_time,
      data.duration_minutes
    );
    if (!durationValidation.valid) {
      throw new ValidationError(
        durationValidation.message || 'Invalid duration',
        'duration',
        'INVALID_DURATION'
      );
    }

    // Auto-calculate duration if not provided
    if (!data.duration_minutes) {
      data.duration_minutes = calculateDurationMinutes(data.start_time, data.end_time);
    }
  }

  // Create activity entity
  const now = getCurrentTimestamp();
  const activity: Activity = {
    id: uuidv4(),
    client_id: data.client_id,
    stakeholder_id: data.stakeholder_id,
    title: data.title,
    description: data.description,
    activity_type: data.activity_type,
    activity_date: data.activity_date,
    start_time: data.start_time,
    end_time: data.end_time,
    duration_minutes: data.duration_minutes,
    status: data.status || ActivityStatus.SCHEDULED,
    goal_ids: data.goal_ids,
    outcome_notes: data.outcome_notes,
    created_at: now,
    updated_at: now,
  };

  // Save to storage
  await storage.write('activities', activity);

  return activity;
}

/**
 * Get an activity by ID with details
 *
 * @param storage - Storage provider
 * @param activityId - Activity ID
 * @returns Activity with details
 * @throws {ValidationError} If activity ID is invalid
 * @throws {NotFoundError} If activity not found
 * @throws {StorageError} If storage operation fails
 */
export async function getActivity(
  storage: StorageProvider,
  activityId: string
): Promise<ActivityWithDetails> {
  if (!activityId || typeof activityId !== 'string') {
    throw new ValidationError('Activity ID is required', 'activity_id', 'INVALID_ACTIVITY_ID');
  }

  // Get activity
  const activity = await storage.read<Activity>('activities', activityId);
  if (!activity) {
    throw new NotFoundError('Activity', activityId);
  }

  // Get client name
  const client = await storage.read<Client>('clients', activity.client_id);
  const clientName = client?.name || 'Unknown Client';

  // Get stakeholder name
  const stakeholder = await storage.read<Stakeholder>('stakeholders', activity.stakeholder_id);
  const stakeholderName = stakeholder?.name || 'Unknown Stakeholder';

  // Get goal titles if linked
  let goalTitles: string[] | undefined;
  if (activity.goal_ids && activity.goal_ids.length > 0) {
    goalTitles = [];
    for (const goalId of activity.goal_ids) {
      const goal = await storage.read<Goal>('goals', goalId);
      if (goal) {
        goalTitles.push(goal.title);
      }
    }
  }

  // Build activity with details
  const activityWithDetails: ActivityWithDetails = {
    ...activity,
    client_name: clientName,
    stakeholder_name: stakeholderName,
    goal_titles: goalTitles,
  };

  return activityWithDetails;
}

/**
 * List activities with optional filtering
 *
 * @param storage - Storage provider
 * @param filter - Filter options
 * @returns List of activities
 * @throws {ValidationError} If filter validation fails
 * @throws {StorageError} If storage operation fails
 */
export async function listActivities(
  storage: StorageProvider,
  filter?: unknown
): Promise<Activity[]> {
  // Validate filter
  const validFilter = filter ? validateWithSchema(activityListFilterSchema, filter) : {};

  // Build storage filter
  const storageFilter: Partial<Activity> = {};
  if (validFilter.client_id) {
    storageFilter.client_id = validFilter.client_id;
  }
  if (validFilter.stakeholder_id) {
    storageFilter.stakeholder_id = validFilter.stakeholder_id;
  }
  if (validFilter.activity_type) {
    storageFilter.activity_type = validFilter.activity_type;
  }
  if (validFilter.status) {
    storageFilter.status = validFilter.status;
  }

  // Get activities
  let activities = await storage.list<Activity>('activities', storageFilter, {
    sortBy: 'activity_date',
    sortOrder: 'desc',
    limit: validFilter.limit,
    offset: validFilter.offset,
  });

  // Apply date range filter if provided
  if (validFilter.date_from) {
    activities = activities.filter((a) => a.activity_date >= validFilter.date_from!);
  }
  if (validFilter.date_to) {
    activities = activities.filter((a) => a.activity_date <= validFilter.date_to!);
  }

  // Apply goal filter if provided
  if (validFilter.goal_id) {
    activities = activities.filter((a) => a.goal_ids?.includes(validFilter.goal_id!));
  }

  return activities;
}

/**
 * Update an activity
 *
 * @param storage - Storage provider
 * @param activityId - Activity ID
 * @param input - Update data
 * @returns Updated activity
 * @throws {ValidationError} If validation fails
 * @throws {NotFoundError} If activity not found
 * @throws {StorageError} If storage operation fails
 */
export async function updateActivity(
  storage: StorageProvider,
  activityId: string,
  input: unknown
): Promise<Activity> {
  if (!activityId || typeof activityId !== 'string') {
    throw new ValidationError('Activity ID is required', 'activity_id', 'INVALID_ACTIVITY_ID');
  }

  // Validate input
  const data = validateWithSchema(updateActivitySchema, input);

  // Get existing activity
  const activity = await storage.read<Activity>('activities', activityId);
  if (!activity) {
    throw new NotFoundError('Activity', activityId);
  }

  // Validate goal IDs if being updated
  if (data.goal_ids && data.goal_ids.length > 0) {
    for (const goalId of data.goal_ids) {
      const goal = await storage.read<Goal>('goals', goalId);
      if (!goal) {
        throw new NotFoundError('Goal', goalId);
      }

      // Verify goal belongs to the same client
      if (goal.client_id !== activity.client_id) {
        throw new ConflictError(
          'Goal does not belong to the activity client',
          'GOAL_CLIENT_MISMATCH',
          { goal_id: goalId, client_id: activity.client_id }
        );
      }
    }
  }

  // Validate duration if times are being updated
  const newStartTime = data.start_time ?? activity.start_time;
  const newEndTime = data.end_time ?? activity.end_time;
  const newDuration = data.duration_minutes ?? activity.duration_minutes;

  if (newStartTime && newEndTime) {
    const durationValidation = validateActivityDuration(newStartTime, newEndTime, newDuration);
    if (!durationValidation.valid) {
      throw new ValidationError(
        durationValidation.message || 'Invalid duration',
        'duration',
        'INVALID_DURATION'
      );
    }
  }

  // Apply updates
  const updatedActivity: Activity = {
    ...activity,
    ...data,
    updated_at: getCurrentTimestamp(),
  };

  // Save to storage
  await storage.write('activities', updatedActivity);

  return updatedActivity;
}

/**
 * Get activities for a specific date range
 *
 * Convenience function for date-based queries.
 *
 * @param storage - Storage provider
 * @param startDate - Start date (ISO format)
 * @param endDate - End date (ISO format)
 * @param clientId - Optional client ID filter
 * @returns List of activities in date range
 * @throws {ValidationError} If dates are invalid
 * @throws {StorageError} If storage operation fails
 */
export async function getActivitiesByDateRange(
  storage: StorageProvider,
  startDate: string,
  endDate: string,
  clientId?: string
): Promise<Activity[]> {
  const filter: {
    date_from: string;
    date_to: string;
    client_id?: string;
  } = {
    date_from: startDate,
    date_to: endDate,
  };

  if (clientId) {
    filter.client_id = clientId;
  }

  return listActivities(storage, filter);
}

/**
 * Get upcoming activities
 *
 * Returns scheduled activities in the next N days.
 *
 * @param storage - Storage provider
 * @param days - Number of days to look ahead (default: 7)
 * @param clientId - Optional client ID filter
 * @returns List of upcoming activities
 * @throws {StorageError} If storage operation fails
 */
export async function getUpcomingActivities(
  storage: StorageProvider,
  days: number = 7,
  clientId?: string
): Promise<Activity[]> {
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  const futureDateStr = futureDate.toISOString().split('T')[0];

  const filter: {
    date_from: string;
    date_to: string;
    status: ActivityStatus;
    client_id?: string;
  } = {
    date_from: today!,
    date_to: futureDateStr!,
    status: ActivityStatus.SCHEDULED,
  };

  if (clientId) {
    filter.client_id = clientId;
  }

  return listActivities(storage, filter);
}
