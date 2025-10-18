/**
 * Shift Note Management Tools
 *
 * MCP tools for managing shift documentation.
 * Provides CRUD operations with activity linking and 24-hour edit window.
 *
 * @module tools/shift-notes
 */

import { v4 as uuidv4 } from 'uuid';
import { StorageProvider } from '../storage/index.js';
import {
  ShiftNote,
  ShiftNoteWithDetails,
  Client,
  Stakeholder,
  Activity,
  Goal,
} from '../models/index.js';
import {
  createShiftNoteSchema,
  updateShiftNoteSchema,
  shiftNoteListFilterSchema,
} from '../validation/index.js';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError,
  validateWithSchema,
} from '../utils/index.js';
import { getCurrentTimestamp, calculateDurationMinutes } from '../utils/dates.js';
import { validateShiftTimes, canEditShiftNote } from '../validation/rules.js';

/**
 * Create a new shift note
 *
 * @param storage - Storage provider
 * @param input - Shift note creation data
 * @returns Created shift note
 * @throws {ValidationError} If input validation fails
 * @throws {NotFoundError} If client, stakeholder, activities, or goals not found
 * @throws {ConflictError} If client is inactive
 * @throws {StorageError} If storage operation fails
 */
export async function createShiftNote(
  storage: StorageProvider,
  input: unknown
): Promise<ShiftNote> {
  // Validate input
  const data = validateWithSchema(createShiftNoteSchema, input);

  // Validate client exists and is active
  const client = await storage.read<Client>('clients', data.client_id);
  if (!client) {
    throw new NotFoundError('Client', data.client_id);
  }

  if (!client.active) {
    throw new ConflictError('Cannot create shift note for inactive client', 'CLIENT_INACTIVE', {
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
      'Cannot create shift note for inactive stakeholder',
      'STAKEHOLDER_INACTIVE',
      { stakeholder_id: data.stakeholder_id }
    );
  }

  // Validate shift times
  const timeValidation = validateShiftTimes(data.start_time, data.end_time);
  if (!timeValidation.valid) {
    throw new ValidationError(
      timeValidation.message || 'Invalid shift times',
      'times',
      'INVALID_SHIFT_TIMES'
    );
  }

  // Validate activity IDs if provided
  if (data.activity_ids && data.activity_ids.length > 0) {
    for (const activityId of data.activity_ids) {
      const activity = await storage.read<Activity>('activities', activityId);
      if (!activity) {
        throw new NotFoundError('Activity', activityId);
      }

      // Verify activity belongs to the same client
      if (activity.client_id !== data.client_id) {
        throw new ConflictError(
          'Activity does not belong to the specified client',
          'ACTIVITY_CLIENT_MISMATCH',
          { activity_id: activityId, client_id: data.client_id }
        );
      }
    }
  }

  // Validate goal progress entries if provided
  if (data.goals_progress && data.goals_progress.length > 0) {
    for (const goalProgress of data.goals_progress) {
      const goal = await storage.read<Goal>('goals', goalProgress.goal_id);
      if (!goal) {
        throw new NotFoundError('Goal', goalProgress.goal_id);
      }

      // Verify goal belongs to the same client
      if (goal.client_id !== data.client_id) {
        throw new ConflictError(
          'Goal does not belong to the specified client',
          'GOAL_CLIENT_MISMATCH',
          { goal_id: goalProgress.goal_id, client_id: data.client_id }
        );
      }
    }
  }

  // Create shift note entity
  const now = getCurrentTimestamp();
  const shiftNote: ShiftNote = {
    id: uuidv4(),
    client_id: data.client_id,
    stakeholder_id: data.stakeholder_id,
    shift_date: data.shift_date,
    start_time: data.start_time,
    end_time: data.end_time,
    general_observations: data.general_observations,
    activity_ids: data.activity_ids,
    goals_progress: data.goals_progress,
    mood_wellbeing: data.mood_wellbeing,
    communication_notes: data.communication_notes,
    health_safety_notes: data.health_safety_notes,
    handover_notes: data.handover_notes,
    incidents: data.incidents,
    created_at: now,
    updated_at: now,
  };

  // Save to storage
  await storage.write('shift_notes', shiftNote);

  return shiftNote;
}

/**
 * Get a shift note by ID with details
 *
 * @param storage - Storage provider
 * @param shiftNoteId - Shift note ID
 * @returns Shift note with details
 * @throws {ValidationError} If shift note ID is invalid
 * @throws {NotFoundError} If shift note not found
 * @throws {StorageError} If storage operation fails
 */
export async function getShiftNote(
  storage: StorageProvider,
  shiftNoteId: string
): Promise<ShiftNoteWithDetails> {
  if (!shiftNoteId || typeof shiftNoteId !== 'string') {
    throw new ValidationError(
      'Shift note ID is required',
      'shift_note_id',
      'INVALID_SHIFT_NOTE_ID'
    );
  }

  // Get shift note
  const shiftNote = await storage.read<ShiftNote>('shift_notes', shiftNoteId);
  if (!shiftNote) {
    throw new NotFoundError('ShiftNote', shiftNoteId);
  }

  // Get client name
  const client = await storage.read<Client>('clients', shiftNote.client_id);
  const clientName = client?.name || 'Unknown Client';

  // Get stakeholder name
  const stakeholder = await storage.read<Stakeholder>('stakeholders', shiftNote.stakeholder_id);
  const stakeholderName = stakeholder?.name || 'Unknown Stakeholder';

  // Calculate duration
  const durationMinutes = calculateDurationMinutes(shiftNote.start_time, shiftNote.end_time);

  // Build shift note with details
  const shiftNoteWithDetails: ShiftNoteWithDetails = {
    ...shiftNote,
    client_name: clientName,
    stakeholder_name: stakeholderName,
    duration_minutes: durationMinutes,
  };

  return shiftNoteWithDetails;
}

/**
 * List shift notes with optional filtering
 *
 * @param storage - Storage provider
 * @param filter - Filter options
 * @returns List of shift notes
 * @throws {ValidationError} If filter validation fails
 * @throws {StorageError} If storage operation fails
 */
export async function listShiftNotes(
  storage: StorageProvider,
  filter?: unknown
): Promise<ShiftNote[]> {
  // Validate filter
  const validFilter = filter ? validateWithSchema(shiftNoteListFilterSchema, filter) : {};

  // Build storage filter
  const storageFilter: Partial<ShiftNote> = {};
  if (validFilter.client_id) {
    storageFilter.client_id = validFilter.client_id;
  }
  if (validFilter.stakeholder_id) {
    storageFilter.stakeholder_id = validFilter.stakeholder_id;
  }

  // Get shift notes
  let shiftNotes = await storage.list<ShiftNote>('shift_notes', storageFilter, {
    sortBy: 'shift_date',
    sortOrder: 'desc',
    limit: validFilter.limit,
    offset: validFilter.offset,
  });

  // Apply date range filter if provided
  if (validFilter.date_from) {
    shiftNotes = shiftNotes.filter((sn) => sn.shift_date >= validFilter.date_from!);
  }
  if (validFilter.date_to) {
    shiftNotes = shiftNotes.filter((sn) => sn.shift_date <= validFilter.date_to!);
  }

  return shiftNotes;
}

/**
 * Update a shift note
 *
 * Can only update within 24 hours of the shift date.
 *
 * @param storage - Storage provider
 * @param shiftNoteId - Shift note ID
 * @param input - Update data
 * @returns Updated shift note
 * @throws {ValidationError} If validation fails
 * @throws {NotFoundError} If shift note not found
 * @throws {AuthorizationError} If outside 24-hour edit window
 * @throws {StorageError} If storage operation fails
 */
export async function updateShiftNote(
  storage: StorageProvider,
  shiftNoteId: string,
  input: unknown
): Promise<ShiftNote> {
  if (!shiftNoteId || typeof shiftNoteId !== 'string') {
    throw new ValidationError(
      'Shift note ID is required',
      'shift_note_id',
      'INVALID_SHIFT_NOTE_ID'
    );
  }

  // Validate input
  const data = validateWithSchema(updateShiftNoteSchema, input);

  // Get existing shift note
  const shiftNote = await storage.read<ShiftNote>('shift_notes', shiftNoteId);
  if (!shiftNote) {
    throw new NotFoundError('ShiftNote', shiftNoteId);
  }

  // Check 24-hour edit window
  const editCheck = canEditShiftNote(shiftNote);
  if (!editCheck.valid) {
    throw new AuthorizationError(
      editCheck.message || 'Cannot edit shift note',
      'EDIT_WINDOW_EXPIRED',
      { shift_date: shiftNote.shift_date }
    );
  }

  // Validate activity IDs if being updated
  if (data.activity_ids && data.activity_ids.length > 0) {
    for (const activityId of data.activity_ids) {
      const activity = await storage.read<Activity>('activities', activityId);
      if (!activity) {
        throw new NotFoundError('Activity', activityId);
      }

      // Verify activity belongs to the same client
      if (activity.client_id !== shiftNote.client_id) {
        throw new ConflictError(
          'Activity does not belong to the shift note client',
          'ACTIVITY_CLIENT_MISMATCH',
          { activity_id: activityId, client_id: shiftNote.client_id }
        );
      }
    }
  }

  // Validate goal progress entries if being updated
  if (data.goals_progress && data.goals_progress.length > 0) {
    for (const goalProgress of data.goals_progress) {
      const goal = await storage.read<Goal>('goals', goalProgress.goal_id);
      if (!goal) {
        throw new NotFoundError('Goal', goalProgress.goal_id);
      }

      // Verify goal belongs to the same client
      if (goal.client_id !== shiftNote.client_id) {
        throw new ConflictError(
          'Goal does not belong to the shift note client',
          'GOAL_CLIENT_MISMATCH',
          { goal_id: goalProgress.goal_id, client_id: shiftNote.client_id }
        );
      }
    }
  }

  // Apply updates
  const updatedShiftNote: ShiftNote = {
    ...shiftNote,
    ...data,
    updated_at: getCurrentTimestamp(),
  };

  // Save to storage
  await storage.write('shift_notes', updatedShiftNote);

  return updatedShiftNote;
}

/**
 * Get recent shift notes
 *
 * Returns the most recent shift notes, optionally filtered by client.
 *
 * @param storage - Storage provider
 * @param limit - Number of shift notes to return (default: 10)
 * @param clientId - Optional client ID filter
 * @returns List of recent shift notes
 * @throws {StorageError} If storage operation fails
 */
export async function getRecentShiftNotes(
  storage: StorageProvider,
  limit: number = 10,
  clientId?: string
): Promise<ShiftNote[]> {
  const filter: {
    limit: number;
    client_id?: string;
  } = {
    limit,
  };

  if (clientId) {
    filter.client_id = clientId;
  }

  return listShiftNotes(storage, filter);
}

/**
 * Get shift notes for a specific week
 *
 * @param storage - Storage provider
 * @param weekStartDate - Week start date (ISO format, typically Monday)
 * @param clientId - Optional client ID filter
 * @returns List of shift notes for the week
 * @throws {ValidationError} If date is invalid
 * @throws {StorageError} If storage operation fails
 */
export async function getShiftNotesForWeek(
  storage: StorageProvider,
  weekStartDate: string,
  clientId?: string
): Promise<ShiftNote[]> {
  // Calculate week end date (6 days later)
  const startDate = new Date(weekStartDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const filter: {
    date_from: string;
    date_to: string;
    client_id?: string;
  } = {
    date_from: weekStartDate,
    date_to: endDate.toISOString().split('T')[0]!,
  };

  if (clientId) {
    filter.client_id = clientId;
  }

  return listShiftNotes(storage, filter);
}
