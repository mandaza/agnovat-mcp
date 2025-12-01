/**
 * Shift Note Convex Functions
 *
 * Type-safe Convex functions for managing shift notes with AI formatting support.
 * These functions can be called directly from Flutter via the Convex Dart client.
 *
 * @module convex/shiftNotes
 */

import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import {
  isValidDate,
  isValidTime,
  isWithin24Hours,
  isValidProgressObserved,
  getCurrentTimestamp,
  ValidationError,
  NotFoundError,
  AuthorizationError,
  normalizeRecord,
  normalizeRecords,
} from './lib/validation';

/**
 * Create a new shift note (defaults to draft status)
 */
export const create = mutation({
  args: {
    client_id: v.id('clients'),
    user_id: v.id('users'),
    shift_date: v.string(),
    start_time: v.string(),
    end_time: v.string(),
    primary_locations: v.optional(v.array(v.string())),
    raw_notes: v.string(),
    activity_ids: v.optional(v.array(v.id('activities'))),
    goals_progress: v.optional(
      v.array(
        v.object({
          goal_id: v.id('goals'),
          progress_notes: v.string(),
          progress_observed: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    // Validate shift date
    if (!isValidDate(args.shift_date)) {
      throw new ValidationError('Shift date must be in YYYY-MM-DD format');
    }

    // Validate times
    if (!isValidTime(args.start_time)) {
      throw new ValidationError('Start time must be in HH:MM format');
    }

    if (!isValidTime(args.end_time)) {
      throw new ValidationError('End time must be in HH:MM format');
    }

    // Validate raw notes
    if (!args.raw_notes || args.raw_notes.trim().length === 0) {
      throw new ValidationError('Raw notes are required');
    }

    // Validate client exists
    const client = await ctx.db.get(args.client_id);
    if (!client) {
      throw new NotFoundError(`Client with ID ${args.client_id} not found`);
    }

    // Validate user exists
    const user = await ctx.db.get(args.user_id);
    if (!user) {
      throw new NotFoundError(`User with ID ${args.user_id} not found`);
    }

    // Validate goals_progress if provided
    if (args.goals_progress) {
      for (const gp of args.goals_progress) {
        const goal = await ctx.db.get(gp.goal_id);
        if (!goal) {
          throw new NotFoundError(`Goal with ID ${gp.goal_id} not found`);
        }

        if (!isValidProgressObserved(gp.progress_observed)) {
          throw new ValidationError('Progress observed must be between 1 and 10');
        }
      }
    }

    // Create shift note with draft status
    const now = getCurrentTimestamp();
    const shiftNoteId = await ctx.db.insert('shift_notes', {
      client_id: args.client_id,
      user_id: args.user_id,
      shift_date: args.shift_date,
      start_time: args.start_time,
      end_time: args.end_time,
      status: 'draft', // Default to draft
      primary_locations: args.primary_locations,
      raw_notes: args.raw_notes,
      activity_ids: args.activity_ids,
      goals_progress: args.goals_progress,
      created_at: now,
      updated_at: now,
    });

    const shiftNote = await ctx.db.get(shiftNoteId);
    return normalizeRecord(shiftNote!);
  },
});

/**
 * Get a shift note by ID
 */
export const get = query({
  args: {
    id: v.id('shift_notes'),
  },
  handler: async (ctx, args) => {
    const shiftNote = await ctx.db.get(args.id);
    if (!shiftNote) {
      throw new NotFoundError(`Shift note with ID ${args.id} not found`);
    }

    // Get client and user names
    const client = await ctx.db.get(shiftNote.client_id);
    const user = await ctx.db.get(shiftNote.user_id);

    return {
      ...normalizeRecord(shiftNote),
      client_name: client?.name,
      user_name: user?.name,
    };
  },
});

/**
 * List shift notes with optional filtering
 */
export const list = query({
  args: {
    client_id: v.optional(v.id('clients')),
    user_id: v.optional(v.id('users')),
    status: v.optional(v.string()), // 'draft' or 'submitted'
    date_from: v.optional(v.string()),
    date_to: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let shiftNotes;

    // Use indexes when possible
    if (args.client_id) {
      shiftNotes = await ctx.db
        .query('shift_notes')
        .withIndex('by_client', (q) => q.eq('client_id', args.client_id!))
        .collect();
    } else if (args.user_id) {
      shiftNotes = await ctx.db
        .query('shift_notes')
        .withIndex('by_user', (q) => q.eq('user_id', args.user_id!))
        .collect();
    } else {
      shiftNotes = await ctx.db.query('shift_notes').collect();
    }

    // Apply status filter (status is optional, defaults to 'draft' if missing)
    if (args.status) {
      shiftNotes = shiftNotes.filter((sn) => (sn.status || 'draft') === args.status);
    }

    // Apply additional filters
    if (args.client_id && args.user_id) {
      shiftNotes = shiftNotes.filter((sn) => sn.user_id === args.user_id);
    }

    // Apply date filters
    if (args.date_from) {
      shiftNotes = shiftNotes.filter((sn) => sn.shift_date >= args.date_from!);
    }

    if (args.date_to) {
      shiftNotes = shiftNotes.filter((sn) => sn.shift_date <= args.date_to!);
    }

    // Sort by shift_date descending
    shiftNotes.sort((a, b) => b.shift_date.localeCompare(a.shift_date));

    // Apply pagination
    const offset = args.offset ?? 0;
    const limit = args.limit;

    if (limit) {
      shiftNotes = shiftNotes.slice(offset, offset + limit);
    } else if (offset > 0) {
      shiftNotes = shiftNotes.slice(offset);
    }

    return normalizeRecords(shiftNotes);
  },
});

/**
 * Update a shift note
 * - Drafts can be updated anytime
 * - Submitted notes can only be updated within 24 hours of shift date
 */
export const update = mutation({
  args: {
    id: v.id('shift_notes'),
    primary_locations: v.optional(v.array(v.string())),
    raw_notes: v.optional(v.string()),
    activity_ids: v.optional(v.array(v.id('activities'))),
    goals_progress: v.optional(
      v.array(
        v.object({
          goal_id: v.id('goals'),
          progress_notes: v.string(),
          progress_observed: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    // Get existing shift note
    const existingShiftNote = await ctx.db.get(args.id);
    if (!existingShiftNote) {
      throw new NotFoundError(`Shift note with ID ${args.id} not found`);
    }

    // Check restrictions only for submitted notes
    // Note: status is optional for backwards compatibility, treat missing as 'draft'
    const status = existingShiftNote.status || 'draft';
    if (status === 'submitted') {
      if (!isWithin24Hours(existingShiftNote.shift_date)) {
        throw new AuthorizationError('Cannot edit submitted shift note after 24 hours');
      }
    }

    // Build update object
    const updates: any = {
      updated_at: getCurrentTimestamp(),
    };

    if (args.primary_locations !== undefined) updates.primary_locations = args.primary_locations;
    if (args.raw_notes !== undefined) updates.raw_notes = args.raw_notes;
    if (args.activity_ids !== undefined) updates.activity_ids = args.activity_ids;
    if (args.goals_progress !== undefined) updates.goals_progress = args.goals_progress;

    // Update shift note
    await ctx.db.patch(args.id, updates);

    const updatedShiftNote = await ctx.db.get(args.id);
    return normalizeRecord(updatedShiftNote!);
  },
});

/**
 * Save formatted shift note (from AI)
 */
export const saveFormatted = mutation({
  args: {
    id: v.id('shift_notes'),
    formatted_note: v.string(),
  },
  handler: async (ctx, args) => {
    // Get existing shift note
    const existingShiftNote = await ctx.db.get(args.id);
    if (!existingShiftNote) {
      throw new NotFoundError(`Shift note with ID ${args.id} not found`);
    }

    // Validate formatted note
    if (!args.formatted_note || args.formatted_note.trim().length === 0) {
      throw new ValidationError('Formatted note cannot be empty');
    }

    // Update shift note with formatted content
    await ctx.db.patch(args.id, {
      formatted_note: args.formatted_note,
      updated_at: getCurrentTimestamp(),
    });

    const updatedShiftNote = await ctx.db.get(args.id);
    return normalizeRecord(updatedShiftNote!);
  },
});

/**
 * Get recent shift notes
 */
export const getRecent = query({
  args: {
    limit: v.optional(v.number()),
    client_id: v.optional(v.id('clients')),
  },
  handler: async (ctx, args) => {
    let shiftNotes;

    if (args.client_id) {
      shiftNotes = await ctx.db
        .query('shift_notes')
        .withIndex('by_client', (q) => q.eq('client_id', args.client_id!))
        .collect();
    } else {
      shiftNotes = await ctx.db.query('shift_notes').collect();
    }

    // Sort by shift_date descending
    shiftNotes.sort((a, b) => b.shift_date.localeCompare(a.shift_date));

    // Apply limit
    const limit = args.limit ?? 10;
    const recentShiftNotes = shiftNotes.slice(0, limit);

    return normalizeRecords(recentShiftNotes);
  },
});

/**
 * Get shift notes for a specific week
 */
export const getForWeek = query({
  args: {
    week_start_date: v.string(),
    client_id: v.optional(v.id('clients')),
  },
  handler: async (ctx, args) => {
    // Validate week start date
    if (!isValidDate(args.week_start_date)) {
      throw new ValidationError('Week start date must be in YYYY-MM-DD format');
    }

    // Calculate week end date (7 days later)
    const startDate = new Date(args.week_start_date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    const weekEndDate = endDate.toISOString().split('T')[0];

    // Get shift notes
    let shiftNotes;

    if (args.client_id) {
      shiftNotes = await ctx.db
        .query('shift_notes')
        .withIndex('by_client', (q) => q.eq('client_id', args.client_id!))
        .collect();
    } else {
      shiftNotes = await ctx.db.query('shift_notes').collect();
    }

    // Filter by date range
    const weekShiftNotes = shiftNotes.filter(
      (sn) => sn.shift_date >= args.week_start_date && sn.shift_date < weekEndDate
    );

    // Sort by shift_date ascending
    weekShiftNotes.sort((a, b) => a.shift_date.localeCompare(b.shift_date));

    return normalizeRecords(weekShiftNotes);
  },
});

/**
 * Generate formatting prompt for AI
 * Returns a prompt that can be sent to Claude or other AI to format the shift note
 */
export const getFormattingPrompt = query({
  args: {
    id: v.id('shift_notes'),
  },
  handler: async (ctx, args) => {
    // Get shift note
    const shiftNote = await ctx.db.get(args.id);
    if (!shiftNote) {
      throw new NotFoundError(`Shift note with ID ${args.id} not found`);
    }

    // Get client details
    const client = await ctx.db.get(shiftNote.client_id);
    if (!client) {
      throw new NotFoundError(`Client with ID ${shiftNote.client_id} not found`);
    }

    // Get user details
    const user = await ctx.db.get(shiftNote.user_id);
    if (!user) {
      throw new NotFoundError(`User with ID ${shiftNote.user_id} not found`);
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
${client.name} lives in a tidy, supportive family home. They have access to all shared living areas and their own bedroom, which is organized and personalized. Their family provides consistent care and support.

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

    return {
      prompt,
      shift_note_id: args.id,
      client_name: client.name,
      user_name: user.name,
      shift_date: shiftNote.shift_date,
    };
  },
});

/**
 * Format shift note using AI prompt
 * This returns a prompt that should be sent to an AI service (like Claude)
 * The formatted result should then be saved using saveFormatted
 */
export const format = query({
  args: {
    id: v.optional(v.id('shift_notes')),
    raw_notes: v.optional(v.string()),
    client_id: v.optional(v.id('clients')),
    user_id: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    let shiftNote, client, user;

    if (args.id) {
      // Get existing shift note
      shiftNote = await ctx.db.get(args.id);
      if (!shiftNote) {
        throw new NotFoundError(`Shift note with ID ${args.id} not found`);
      }

      client = await ctx.db.get(shiftNote.client_id);
      user = await ctx.db.get(shiftNote.user_id);
    } else {
      // Use provided data
      if (!args.raw_notes || !args.client_id || !args.user_id) {
        throw new ValidationError('Either id or (raw_notes, client_id, user_id) must be provided');
      }

      client = await ctx.db.get(args.client_id);
      user = await ctx.db.get(args.user_id);

      // Create a temporary shift note object
      shiftNote = {
        raw_notes: args.raw_notes,
        shift_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '17:00',
        primary_locations: [],
        client_id: args.client_id,
        user_id: args.user_id,
      };
    }

    if (!client || !user) {
      throw new NotFoundError('Client or user not found');
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
${client.name} lives in a tidy, supportive family home. They have access to all shared living areas and their own bedroom, which is organized and personalized. Their family provides consistent care and support.

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

    // Return the prompt for the Flutter app to send to Claude
    return {
      formatting_prompt: prompt,
      shift_note_id: args.id,
      client_name: client.name,
      user_name: user.name,
    };
  },
});

/**
 * Delete a shift note
 * - Drafts can be deleted anytime
 * - Submitted notes can only be deleted within 24 hours of shift date
 */
export const remove = mutation({
  args: {
    id: v.id('shift_notes'),
  },
  handler: async (ctx, args) => {
    // Get existing shift note
    const existingShiftNote = await ctx.db.get(args.id);
    if (!existingShiftNote) {
      throw new NotFoundError(`Shift note with ID ${args.id} not found`);
    }

    // Check restrictions only for submitted notes
    // Note: status is optional for backwards compatibility, treat missing as 'draft'
    const status = existingShiftNote.status || 'draft';
    if (status === 'submitted') {
      if (!isWithin24Hours(existingShiftNote.shift_date)) {
        throw new AuthorizationError('Cannot delete submitted shift note after 24 hours');
      }
    }

    // Delete shift note
    await ctx.db.delete(args.id);

    return { success: true, id: args.id };
  },
});

/**
 * Add activity session to a shift note
 * This creates the link between shift notes and activity sessions
 */
export const addActivitySession = mutation({
  args: {
    shift_note_id: v.id('shift_notes'),
    activity_session_id: v.id('activity_sessions'),
  },
  handler: async (ctx, args) => {
    // Get existing shift note
    const shiftNote = await ctx.db.get(args.shift_note_id);
    if (!shiftNote) {
      throw new NotFoundError(`Shift note with ID ${args.shift_note_id} not found`);
    }

    // Verify activity session exists
    const activitySession = await ctx.db.get(args.activity_session_id);
    if (!activitySession) {
      throw new NotFoundError(`Activity session with ID ${args.activity_session_id} not found`);
    }

    // Get current activity_session_ids or initialize empty array
    const currentSessions = shiftNote.activity_session_ids || [];

    // Add new session if not already present
    if (!currentSessions.includes(args.activity_session_id)) {
      await ctx.db.patch(args.shift_note_id, {
        activity_session_ids: [...currentSessions, args.activity_session_id],
        updated_at: getCurrentTimestamp(),
      });
    }

    const updatedShiftNote = await ctx.db.get(args.shift_note_id);
    return normalizeRecord(updatedShiftNote!);
  },
});

/**
 * Get shift note with all related activity sessions and their behavior incidents
 * This returns the complete shift note data including nested sessions and behaviors
 */
export const getWithSessions = query({
  args: {
    id: v.id('shift_notes'),
  },
  handler: async (ctx, args) => {
    // Get shift note
    const shiftNote = await ctx.db.get(args.id);
    if (!shiftNote) {
      throw new NotFoundError(`Shift note with ID ${args.id} not found`);
    }

    // Get client and user names
    const client = await ctx.db.get(shiftNote.client_id);
    const user = await ctx.db.get(shiftNote.user_id);

    // Get all activity sessions for this shift note
    const activitySessions = [];
    if (shiftNote.activity_session_ids && shiftNote.activity_session_ids.length > 0) {
      for (const sessionId of shiftNote.activity_session_ids) {
        const session = await ctx.db.get(sessionId);
        if (session) {
          // Get activity details
          const activity = await ctx.db.get(session.activity_id);
          const sessionUser = await ctx.db.get(session.user_id);

          activitySessions.push({
            ...normalizeRecord(session),
            shift_note_id: session.shift_note_id || '',
            media: session.media || [],
            activity_title: activity?.title || '',
            activity_type: activity?.activity_type || '',
            user_name: sessionUser?.name || '',
            user_email: sessionUser?.email || '',
            stakeholder_id: session.user_id,
            stakeholder_name: sessionUser?.name || '',
            // goal_progress and behavior_incidents are already embedded in the session
          });
        }
      }
    }

    return {
      ...normalizeRecord(shiftNote),
      client_name: client?.name,
      user_name: user?.name,
      activity_sessions: activitySessions,
    };
  },
});

/**
 * Submit a shift note (transition from draft to submitted)
 * Once submitted, the 24-hour edit/delete window begins
 */
export const submit = mutation({
  args: {
    id: v.id('shift_notes'),
  },
  handler: async (ctx, args) => {
    // Get existing shift note
    const existingShiftNote = await ctx.db.get(args.id);
    if (!existingShiftNote) {
      throw new NotFoundError(`Shift note with ID ${args.id} not found`);
    }

    // Can only submit drafts
    // Note: status is optional for backwards compatibility, treat missing as 'draft'
    const status = existingShiftNote.status || 'draft';
    if (status !== 'draft') {
      throw new ValidationError('Only draft shift notes can be submitted');
    }

    // Validate required fields are complete
    if (!existingShiftNote.raw_notes || existingShiftNote.raw_notes.trim().length === 0) {
      throw new ValidationError('Raw notes are required before submission');
    }

    // Update status to submitted
    const now = getCurrentTimestamp();
    await ctx.db.patch(args.id, {
      status: 'submitted',
      submitted_at: now,
      updated_at: now,
    });

    const updatedShiftNote = await ctx.db.get(args.id);
    return normalizeRecord(updatedShiftNote!);
  },
});
