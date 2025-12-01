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
 * @throws {NotFoundError} If client, user, activities, or goals not found
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

  // Validate user exists and is active
  const user = await storage.read<Stakeholder>('stakeholders', data.user_id);
  if (!user) {
    throw new NotFoundError('User', data.user_id);
  }

  if (!user.active) {
    throw new ConflictError(
      'Cannot create shift note for inactive user',
      'USER_INACTIVE',
      { user_id: data.user_id }
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
    user_id: data.user_id,
    shift_date: data.shift_date,
    start_time: data.start_time,
    end_time: data.end_time,
    primary_locations: data.primary_locations,
    raw_notes: data.raw_notes,
    activity_ids: data.activity_ids,
    goals_progress: data.goals_progress,
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

  // Get user name
  const user = await storage.read<Stakeholder>('stakeholders', shiftNote.user_id);
  const userName = user?.name || 'Unknown User';

  // Calculate duration
  const durationMinutes = calculateDurationMinutes(shiftNote.start_time, shiftNote.end_time);

  // Build shift note with details
  const shiftNoteWithDetails: ShiftNoteWithDetails = {
    ...shiftNote,
    client_name: clientName,
    user_name: userName,
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
  if (validFilter.user_id) {
    storageFilter.user_id = validFilter.user_id;
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

/**
 * Format shift note using AI
 *
 * Generates a formatting prompt for the raw notes. The actual AI formatting
 * should be done by the MCP client. This function prepares the prompt and
 * returns it so the client can use it with their AI model.
 *
 * @param storage - Storage provider
 * @param shiftNoteId - Shift note ID to format
 * @returns Formatting prompt for AI processing
 * @throws {NotFoundError} If shift note, client, or user not found
 */
export async function generateShiftNoteFormattingPrompt(
  storage: StorageProvider,
  shiftNoteId: string
): Promise<string> {
  if (!shiftNoteId || typeof shiftNoteId !== 'string') {
    throw new ValidationError(
      'Shift note ID is required',
      'shift_note_id',
      'INVALID_SHIFT_NOTE_ID'
    );
  }

  // Get the shift note
  const shiftNote = await storage.read<ShiftNote>('shift_notes', shiftNoteId);
  if (!shiftNote) {
    throw new NotFoundError('ShiftNote', shiftNoteId);
  }

  // Get client details
  const client = await storage.read<Client>('clients', shiftNote.client_id);
  if (!client) {
    throw new NotFoundError('Client', shiftNote.client_id);
  }

  // Get user details
  const user = await storage.read<Stakeholder>('stakeholders', shiftNote.user_id);
  if (!user) {
    throw new NotFoundError('User', shiftNote.user_id);
  }

  // Generate the formatting prompt
  const prompt = `You are a professional NDIS support documentation specialist. Please rewrite the following raw shift notes into a well-formatted, grammatically correct shift note while maintaining the original context and details.

Format the notes according to this structure:

**Date:** ${shiftNote.shift_date}
**Shift Time:** ${shiftNote.start_time} – ${shiftNote.end_time}
**Support Staff:** ${user.name}
**Primary Locations:** ${shiftNote.primary_locations?.join(', ') || 'Not specified'}

**Details of Support Provided**

**Morning Routine:**
[Summarize what ${client.name} did first thing in the morning - breakfast, cleaning, preparing for activities, etc. Use proper grammar and professional language.]

**Activities:**
[Summarize the key activities during the shift - work activities, outings, lunch, social interactions, etc. Be specific but concise.]

**Afternoon/Evening:**
[Summarize the end of shift activities - relaxing, watching TV, dinner, medication support, etc.]

**Behaviours of Concern Observed**
[Note any challenging behaviors observed - fixations, distractions, refusals, agitation, etc. If none, state "No significant behaviours of concern were observed during this shift."]

[If behaviours were observed, mention how staff supported or redirected ${client.name}.]

**Home Environment Description**
${client.name} lives in a tidy, supportive family home. They have access to all shared living areas and their own bedroom, which is organized and personalized. Their father and family provide consistent care and support.

**Summary**
${client.name} [describe participation level] in the planned activities with [add positive highlights]. [If behaviours of concern were observed, add: "While some behaviours of concern were observed, these were managed with redirection and reassurance."] The shift ended calmly with ${client.name} settled at home.

---

**Raw Notes from Staff:**
${shiftNote.raw_notes}

**Instructions:**
1. Rewrite the raw notes into the format above
2. Use proper English grammar and professional language
3. Do NOT change the context, facts, or details provided
4. Do NOT add information that wasn't in the raw notes
5. Fill in each section based on what was mentioned in the raw notes
6. If a section has no relevant information in the raw notes, note that briefly
7. Ensure the client's name (${client.name}) is used consistently
8. Keep the tone professional but warm and person-centered

Please provide ONLY the formatted shift note without any preamble or explanation.`;

  return prompt;
}

/**
 * Save formatted shift note sections
 *
 * Updates a shift note with the AI-formatted content. This should be called
 * after the MCP client has received the formatted note from the AI.
 *
 * @param storage - Storage provider
 * @param shiftNoteId - Shift note ID
 * @param formattedNote - The complete formatted note from AI
 * @returns Updated shift note
 * @throws {NotFoundError} If shift note not found
 */
export async function saveFormattedShiftNote(
  storage: StorageProvider,
  shiftNoteId: string,
  formattedNote: string
): Promise<ShiftNote> {
  if (!shiftNoteId || typeof shiftNoteId !== 'string') {
    throw new ValidationError(
      'Shift note ID is required',
      'shift_note_id',
      'INVALID_SHIFT_NOTE_ID'
    );
  }

  if (!formattedNote || typeof formattedNote !== 'string') {
    throw new ValidationError(
      'Formatted note is required',
      'formatted_note',
      'INVALID_FORMATTED_NOTE'
    );
  }

  // Get existing shift note
  const shiftNote = await storage.read<ShiftNote>('shift_notes', shiftNoteId);
  if (!shiftNote) {
    throw new NotFoundError('ShiftNote', shiftNoteId);
  }

  // Parse sections from formatted note
  const sections = parseFormattedSections(formattedNote);

  // Update shift note with formatted sections
  const updatedShiftNote: ShiftNote = {
    ...shiftNote,
    ...sections,
    formatted_note: formattedNote,
    updated_at: getCurrentTimestamp(),
  };

  // Save to storage
  await storage.write('shift_notes', updatedShiftNote);

  return updatedShiftNote;
}

/**
 * Parse formatted shift note into sections
 *
 * @param formattedNote - The complete formatted note
 * @returns Object with individual sections
 */
function parseFormattedSections(formattedNote: string): {
  morning_routine?: string;
  activities?: string;
  afternoon_evening?: string;
  behaviours_of_concern?: string;
  behaviour_support_provided?: string;
  home_environment?: string;
  summary?: string;
} {
  const sections: {
    morning_routine?: string;
    activities?: string;
    afternoon_evening?: string;
    behaviours_of_concern?: string;
    behaviour_support_provided?: string;
    home_environment?: string;
    summary?: string;
  } = {};

  // Extract morning routine
  const morningMatch = formattedNote.match(
    /\*\*Morning Routine:\*\*\s*([\s\S]*?)(?=\n\*\*Activities:|$)/i
  );
  if (morningMatch && morningMatch[1]) {
    sections.morning_routine = morningMatch[1].trim();
  }

  // Extract activities
  const activitiesMatch = formattedNote.match(
    /\*\*Activities:\*\*\s*([\s\S]*?)(?=\n\*\*Afternoon\/Evening:|$)/i
  );
  if (activitiesMatch && activitiesMatch[1]) {
    sections.activities = activitiesMatch[1].trim();
  }

  // Extract afternoon/evening
  const afternoonMatch = formattedNote.match(
    /\*\*Afternoon\/Evening:\*\*\s*([\s\S]*?)(?=\n\*\*Behaviours of Concern|$)/i
  );
  if (afternoonMatch && afternoonMatch[1]) {
    sections.afternoon_evening = afternoonMatch[1].trim();
  }

  // Extract behaviours of concern section
  const behavioursMatch = formattedNote.match(
    /\*\*Behaviours of Concern Observed\*\*\s*([\s\S]*?)(?=\n\*\*Home Environment|$)/i
  );
  if (behavioursMatch && behavioursMatch[1]) {
    const behavioursText = behavioursMatch[1].trim();
    const paragraphs = behavioursText.split(/\n\n+/);

    if (paragraphs.length >= 1 && paragraphs[0]) {
      sections.behaviours_of_concern = paragraphs[0].trim();
    }
    if (paragraphs.length >= 2 && paragraphs[1]) {
      sections.behaviour_support_provided = paragraphs[1].trim();
    }
  }

  // Extract home environment
  const homeMatch = formattedNote.match(
    /\*\*Home Environment Description\*\*\s*([\s\S]*?)(?=\n\*\*Summary|$)/i
  );
  if (homeMatch && homeMatch[1]) {
    sections.home_environment = homeMatch[1].trim();
  }

  // Extract summary
  const summaryMatch = formattedNote.match(/\*\*Summary\*\*\s*([\s\S]*?)$/i);
  if (summaryMatch && summaryMatch[1]) {
    sections.summary = summaryMatch[1].trim();
  }

  return sections;
}
