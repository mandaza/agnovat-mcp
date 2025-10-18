/**
 * Goal Management Tools
 *
 * MCP tools for managing NDIS participant goals.
 * Provides CRUD operations with progress tracking and validation.
 *
 * @module tools/goals
 */

import { v4 as uuidv4 } from 'uuid';
import { StorageProvider } from '../storage/index.js';
import { Goal, GoalWithActivities, GoalStatus, Client, Activity } from '../models/index.js';
import {
  createGoalSchema,
  updateGoalProgressSchema,
  updateGoalSchema,
  goalListFilterSchema,
} from '../validation/index.js';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  validateWithSchema,
} from '../utils/index.js';
import { getCurrentTimestamp } from '../utils/dates.js';
import {
  validateGoalProgressAlignment,
  isGoalAtRisk,
  suggestGoalStatus,
} from '../validation/rules.js';

/**
 * Create a new goal
 *
 * @param storage - Storage provider
 * @param input - Goal creation data
 * @returns Created goal
 * @throws {ValidationError} If input validation fails
 * @throws {NotFoundError} If client not found
 * @throws {ConflictError} If client is inactive
 * @throws {StorageError} If storage operation fails
 */
export async function createGoal(storage: StorageProvider, input: unknown): Promise<Goal> {
  // Validate input
  const data = validateWithSchema(createGoalSchema, input);

  // Validate client exists and is active
  const client = await storage.read<Client>('clients', data.client_id);
  if (!client) {
    throw new NotFoundError('Client', data.client_id);
  }

  if (!client.active) {
    throw new ConflictError('Cannot create goal for inactive client', 'CLIENT_INACTIVE', {
      client_id: data.client_id,
    });
  }

  // Create goal entity
  const now = getCurrentTimestamp();
  const goal: Goal = {
    id: uuidv4(),
    client_id: data.client_id,
    title: data.title,
    description: data.description,
    category: data.category,
    target_date: data.target_date,
    status: GoalStatus.NOT_STARTED,
    progress_percentage: 0,
    created_at: now,
    updated_at: now,
    archived: false,
  };

  // Save to storage
  await storage.write('goals', goal);

  return goal;
}

/**
 * Get a goal by ID with activity information
 *
 * @param storage - Storage provider
 * @param goalId - Goal ID
 * @returns Goal with activities
 * @throws {ValidationError} If goal ID is invalid
 * @throws {NotFoundError} If goal not found
 * @throws {StorageError} If storage operation fails
 */
export async function getGoal(
  storage: StorageProvider,
  goalId: string
): Promise<GoalWithActivities> {
  if (!goalId || typeof goalId !== 'string') {
    throw new ValidationError('Goal ID is required', 'goal_id', 'INVALID_GOAL_ID');
  }

  // Get goal
  const goal = await storage.read<Goal>('goals', goalId);
  if (!goal) {
    throw new NotFoundError('Goal', goalId);
  }

  // Find activities linked to this goal
  const allActivities = await storage.list<Activity>('activities');
  const linkedActivities = allActivities.filter((activity) => activity.goal_ids?.includes(goalId));

  // Get last activity date
  const sortedActivities = linkedActivities.sort((a, b) =>
    b.activity_date.localeCompare(a.activity_date)
  );
  const lastActivityDate = sortedActivities[0]?.activity_date;

  // Build goal with activities
  const goalWithActivities: GoalWithActivities = {
    ...goal,
    activity_count: linkedActivities.length,
    last_activity_date: lastActivityDate,
  };

  return goalWithActivities;
}

/**
 * List goals with optional filtering
 *
 * @param storage - Storage provider
 * @param filter - Filter options
 * @returns List of goals
 * @throws {ValidationError} If filter validation fails
 * @throws {StorageError} If storage operation fails
 */
export async function listGoals(storage: StorageProvider, filter?: unknown): Promise<Goal[]> {
  // Validate filter
  const validFilter = filter ? validateWithSchema(goalListFilterSchema, filter) : {};

  // Build storage filter
  const storageFilter: Partial<Goal> = {};
  if (validFilter.client_id) {
    storageFilter.client_id = validFilter.client_id;
  }
  if (validFilter.status) {
    storageFilter.status = validFilter.status;
  }
  if (validFilter.category) {
    storageFilter.category = validFilter.category;
  }
  if (validFilter.archived !== undefined) {
    storageFilter.archived = validFilter.archived;
  }

  // Get goals
  let goals = await storage.list<Goal>('goals', storageFilter, {
    sortBy: 'created_at',
    sortOrder: 'desc',
    limit: validFilter.limit,
    offset: validFilter.offset,
  });

  // Apply at-risk filter if requested
  if (validFilter.at_risk === true) {
    goals = goals.filter((goal) => isGoalAtRisk(goal));
  }

  return goals;
}

/**
 * Update goal progress
 *
 * Updates status and/or progress percentage with automatic status suggestion.
 *
 * @param storage - Storage provider
 * @param input - Progress update data
 * @returns Updated goal
 * @throws {ValidationError} If validation fails
 * @throws {NotFoundError} If goal not found
 * @throws {StorageError} If storage operation fails
 */
export async function updateGoalProgress(storage: StorageProvider, input: unknown): Promise<Goal> {
  // Validate input
  const data = validateWithSchema(updateGoalProgressSchema, input);

  // Get existing goal
  const goal = await storage.read<Goal>('goals', data.goal_id);
  if (!goal) {
    throw new NotFoundError('Goal', data.goal_id);
  }

  // Determine new progress percentage and status
  const newProgress = data.progress_percentage ?? goal.progress_percentage;
  let newStatus = data.status ?? goal.status;

  // Auto-suggest status if progress is being updated but status isn't
  if (data.progress_percentage !== undefined && data.status === undefined) {
    const suggested = suggestGoalStatus(newProgress);
    if (suggested !== goal.status) {
      newStatus = suggested;
    }
  }

  // Validate progress/status alignment
  const alignment = validateGoalProgressAlignment(newStatus, newProgress);
  if (!alignment.valid) {
    throw new ValidationError(
      alignment.message || 'Invalid progress/status combination',
      'progress',
      'INVALID_PROGRESS_STATUS_ALIGNMENT'
    );
  }

  // Check if goal is being achieved
  const achievedAt =
    newStatus === GoalStatus.ACHIEVED && goal.status !== GoalStatus.ACHIEVED
      ? getCurrentTimestamp()
      : goal.achieved_at;

  // Apply updates
  const updatedGoal: Goal = {
    ...goal,
    status: newStatus,
    progress_percentage: newProgress,
    achieved_at: achievedAt,
    updated_at: getCurrentTimestamp(),
  };

  // Save to storage
  await storage.write('goals', updatedGoal);

  return updatedGoal;
}

/**
 * Update a goal
 *
 * @param storage - Storage provider
 * @param goalId - Goal ID
 * @param input - Update data
 * @returns Updated goal
 * @throws {ValidationError} If validation fails
 * @throws {NotFoundError} If goal not found
 * @throws {StorageError} If storage operation fails
 */
export async function updateGoal(
  storage: StorageProvider,
  goalId: string,
  input: unknown
): Promise<Goal> {
  if (!goalId || typeof goalId !== 'string') {
    throw new ValidationError('Goal ID is required', 'goal_id', 'INVALID_GOAL_ID');
  }

  // Validate input
  const data = validateWithSchema(updateGoalSchema, input);

  // Get existing goal
  const goal = await storage.read<Goal>('goals', goalId);
  if (!goal) {
    throw new NotFoundError('Goal', goalId);
  }

  // If both status and progress are being updated, validate alignment
  if (data.status !== undefined && data.progress_percentage !== undefined) {
    const alignment = validateGoalProgressAlignment(data.status, data.progress_percentage);
    if (!alignment.valid) {
      throw new ValidationError(
        alignment.message || 'Invalid progress/status combination',
        'progress',
        'INVALID_PROGRESS_STATUS_ALIGNMENT'
      );
    }
  }

  // Check if goal is being achieved
  const achievedAt =
    data.status === GoalStatus.ACHIEVED && goal.status !== GoalStatus.ACHIEVED
      ? getCurrentTimestamp()
      : data.status !== GoalStatus.ACHIEVED && goal.status === GoalStatus.ACHIEVED
        ? undefined // Clearing achieved status
        : goal.achieved_at;

  // Apply updates
  const updatedGoal: Goal = {
    ...goal,
    ...data,
    achieved_at: achievedAt,
    updated_at: getCurrentTimestamp(),
  };

  // Save to storage
  await storage.write('goals', updatedGoal);

  return updatedGoal;
}

/**
 * Archive a goal
 *
 * Soft archive - sets archived flag to true.
 *
 * @param storage - Storage provider
 * @param goalId - Goal ID
 * @returns Archived goal
 * @throws {ValidationError} If goal ID is invalid
 * @throws {NotFoundError} If goal not found
 * @throws {StorageError} If storage operation fails
 */
export async function archiveGoal(storage: StorageProvider, goalId: string): Promise<Goal> {
  if (!goalId || typeof goalId !== 'string') {
    throw new ValidationError('Goal ID is required', 'goal_id', 'INVALID_GOAL_ID');
  }

  // Get goal
  const goal = await storage.read<Goal>('goals', goalId);
  if (!goal) {
    throw new NotFoundError('Goal', goalId);
  }

  // Archive
  const archivedGoal: Goal = {
    ...goal,
    archived: true,
    updated_at: getCurrentTimestamp(),
  };

  await storage.write('goals', archivedGoal);

  return archivedGoal;
}

/**
 * Get goals at risk for a client
 *
 * Returns goals that are at risk of not being achieved
 * (< 50% progress with < 14 days remaining).
 *
 * @param storage - Storage provider
 * @param clientId - Client ID (optional, returns all if not specified)
 * @returns List of goals at risk
 * @throws {StorageError} If storage operation fails
 */
export async function getGoalsAtRisk(storage: StorageProvider, clientId?: string): Promise<Goal[]> {
  const filter: Partial<Goal> = { archived: false };
  if (clientId) {
    filter.client_id = clientId;
  }

  const goals = await storage.list<Goal>('goals', filter);

  return goals.filter((goal) => isGoalAtRisk(goal));
}
