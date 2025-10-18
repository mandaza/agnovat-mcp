/**
 * Stakeholder Management Tools
 *
 * MCP tools for managing stakeholders (support workers, coordinators, etc.).
 * Provides CRUD operations with activity tracking.
 *
 * @module tools/stakeholders
 */

import { v4 as uuidv4 } from 'uuid';
import { StorageProvider } from '../storage/index.js';
import { Stakeholder, StakeholderWithStats, Activity, ShiftNote } from '../models/index.js';
import {
  createStakeholderSchema,
  updateStakeholderSchema,
  stakeholderListFilterSchema,
} from '../validation/index.js';
import { ValidationError, NotFoundError, validateWithSchema } from '../utils/index.js';
import { getCurrentTimestamp } from '../utils/dates.js';

/**
 * Create a new stakeholder
 *
 * @param storage - Storage provider
 * @param input - Stakeholder creation data
 * @returns Created stakeholder
 * @throws {ValidationError} If input validation fails
 * @throws {StorageError} If storage operation fails
 */
export async function createStakeholder(
  storage: StorageProvider,
  input: unknown
): Promise<Stakeholder> {
  // Validate input
  const data = validateWithSchema(createStakeholderSchema, input);

  // Create stakeholder entity
  const now = getCurrentTimestamp();
  const stakeholder: Stakeholder = {
    id: uuidv4(),
    name: data.name,
    role: data.role,
    email: data.email,
    phone: data.phone,
    organization: data.organization,
    notes: data.notes,
    active: true,
    created_at: now,
    updated_at: now,
  };

  // Save to storage
  await storage.write('stakeholders', stakeholder);

  return stakeholder;
}

/**
 * Get a stakeholder by ID with activity summary
 *
 * @param storage - Storage provider
 * @param stakeholderId - Stakeholder ID
 * @returns Stakeholder with stats
 * @throws {ValidationError} If stakeholder ID is invalid
 * @throws {NotFoundError} If stakeholder not found
 * @throws {StorageError} If storage operation fails
 */
export async function getStakeholder(
  storage: StorageProvider,
  stakeholderId: string
): Promise<StakeholderWithStats> {
  if (!stakeholderId || typeof stakeholderId !== 'string') {
    throw new ValidationError(
      'Stakeholder ID is required',
      'stakeholder_id',
      'INVALID_STAKEHOLDER_ID'
    );
  }

  // Get stakeholder
  const stakeholder = await storage.read<Stakeholder>('stakeholders', stakeholderId);
  if (!stakeholder) {
    throw new NotFoundError('Stakeholder', stakeholderId);
  }

  // Get activities for this stakeholder
  const activities = await storage.list<Activity>('activities', {
    stakeholder_id: stakeholderId,
  } as Partial<Activity>);

  // Get last activity date
  const sortedActivities = activities.sort((a, b) =>
    b.activity_date.localeCompare(a.activity_date)
  );
  const lastActivityDate = sortedActivities[0]?.activity_date;

  // Get shift notes for this stakeholder
  const shiftNotes = await storage.list<ShiftNote>('shift_notes', {
    stakeholder_id: stakeholderId,
  } as Partial<ShiftNote>);

  // Build stakeholder with stats
  const stakeholderWithStats: StakeholderWithStats = {
    ...stakeholder,
    total_activities: activities.length,
    total_shift_notes: shiftNotes.length,
    last_activity_date: lastActivityDate,
  };

  return stakeholderWithStats;
}

/**
 * List stakeholders with optional filtering
 *
 * @param storage - Storage provider
 * @param filter - Filter options
 * @returns List of stakeholders
 * @throws {ValidationError} If filter validation fails
 * @throws {StorageError} If storage operation fails
 */
export async function listStakeholders(
  storage: StorageProvider,
  filter?: unknown
): Promise<Stakeholder[]> {
  // Validate filter
  const validFilter = filter ? validateWithSchema(stakeholderListFilterSchema, filter) : {};

  // Build storage filter
  const storageFilter: Partial<Stakeholder> = {};
  if (validFilter.role) {
    storageFilter.role = validFilter.role;
  }
  if (validFilter.active !== undefined) {
    storageFilter.active = validFilter.active;
  }

  // Get stakeholders
  let stakeholders = await storage.list<Stakeholder>('stakeholders', storageFilter, {
    sortBy: 'name',
    sortOrder: 'asc',
    limit: validFilter.limit,
    offset: validFilter.offset,
  });

  // Apply search filter if provided
  if (validFilter.search) {
    const searchLower = validFilter.search.toLowerCase();
    stakeholders = stakeholders.filter((stakeholder) =>
      stakeholder.name.toLowerCase().includes(searchLower)
    );
  }

  return stakeholders;
}

/**
 * Update a stakeholder
 *
 * @param storage - Storage provider
 * @param stakeholderId - Stakeholder ID
 * @param input - Update data
 * @returns Updated stakeholder
 * @throws {ValidationError} If validation fails
 * @throws {NotFoundError} If stakeholder not found
 * @throws {StorageError} If storage operation fails
 */
export async function updateStakeholder(
  storage: StorageProvider,
  stakeholderId: string,
  input: unknown
): Promise<Stakeholder> {
  if (!stakeholderId || typeof stakeholderId !== 'string') {
    throw new ValidationError(
      'Stakeholder ID is required',
      'stakeholder_id',
      'INVALID_STAKEHOLDER_ID'
    );
  }

  // Validate input
  const data = validateWithSchema(updateStakeholderSchema, input);

  // Get existing stakeholder
  const stakeholder = await storage.read<Stakeholder>('stakeholders', stakeholderId);
  if (!stakeholder) {
    throw new NotFoundError('Stakeholder', stakeholderId);
  }

  // Apply updates
  const updatedStakeholder: Stakeholder = {
    ...stakeholder,
    ...data,
    updated_at: getCurrentTimestamp(),
  };

  // Save to storage
  await storage.write('stakeholders', updatedStakeholder);

  return updatedStakeholder;
}

/**
 * Deactivate a stakeholder
 *
 * Soft delete - sets active flag to false.
 *
 * @param storage - Storage provider
 * @param stakeholderId - Stakeholder ID
 * @returns Deactivated stakeholder
 * @throws {ValidationError} If stakeholder ID is invalid
 * @throws {NotFoundError} If stakeholder not found
 * @throws {StorageError} If storage operation fails
 */
export async function deactivateStakeholder(
  storage: StorageProvider,
  stakeholderId: string
): Promise<Stakeholder> {
  if (!stakeholderId || typeof stakeholderId !== 'string') {
    throw new ValidationError(
      'Stakeholder ID is required',
      'stakeholder_id',
      'INVALID_STAKEHOLDER_ID'
    );
  }

  // Get stakeholder
  const stakeholder = await storage.read<Stakeholder>('stakeholders', stakeholderId);
  if (!stakeholder) {
    throw new NotFoundError('Stakeholder', stakeholderId);
  }

  // Deactivate
  const deactivatedStakeholder: Stakeholder = {
    ...stakeholder,
    active: false,
    updated_at: getCurrentTimestamp(),
  };

  await storage.write('stakeholders', deactivatedStakeholder);

  return deactivatedStakeholder;
}

/**
 * Search stakeholders by name
 *
 * Convenience function that uses listStakeholders with search filter.
 *
 * @param storage - Storage provider
 * @param searchTerm - Search term
 * @returns List of matching stakeholders
 * @throws {ValidationError} If search term is invalid
 * @throws {StorageError} If storage operation fails
 */
export async function searchStakeholders(
  storage: StorageProvider,
  searchTerm: string
): Promise<Stakeholder[]> {
  if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
    throw new ValidationError(
      'Search term is required and must be non-empty',
      'search_term',
      'INVALID_SEARCH_TERM'
    );
  }

  return listStakeholders(storage, { search: searchTerm.trim() });
}
