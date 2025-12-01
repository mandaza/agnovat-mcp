/**
 * Activity Session Convex Functions
 *
 * Type-safe Convex functions for managing activity sessions.
 * These functions can be called directly from Flutter via the Convex Dart client.
 *
 * NEW UNIFIED STRUCTURE: Activity sessions now embed behavior incidents
 * instead of referencing them by ID.
 *
 * @module convex/activitySessions
 */

import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import {
  getCurrentTimestamp,
  ValidationError,
  NotFoundError,
  normalizeRecord,
  normalizeRecords,
} from './lib/validation';

/**
 * Behavior incident schema for nested objects
 */
const behaviorIncidentSchema = v.object({
  id: v.string(), // UUID generated on frontend
  behaviors_displayed: v.array(v.string()),
  duration: v.string(),
  severity: v.string(), // 'low', 'medium', 'high'
  self_harm: v.boolean(),
  self_harm_types: v.array(v.string()),
  self_harm_count: v.number(),
  initial_intervention: v.string(),
  intervention_description: v.optional(v.string()),
  second_support_needed: v.array(v.string()),
  second_support_description: v.optional(v.string()),
  description: v.string(),
});

/**
 * Media attachment schema for photos/videos
 */
const mediaAttachmentSchema = v.object({
  storage_id: v.id('_storage'), // Convex file storage ID
  type: v.string(), // 'photo' | 'video'
  caption: v.optional(v.string()),
  uploaded_at: v.string(),
  file_name: v.string(),
  file_size: v.number(),
  mime_type: v.string(),
});

/**
 * Create a new activity session
 */
export const create = mutation({
  args: {
    activity_id: v.id('activities'),
    client_id: v.id('clients'),
    user_id: v.id('users'),
    shift_note_id: v.optional(v.id('shift_notes')),

    // NEW: Separate start/end times
    session_start_time: v.string(), // ISO 8601
    session_end_time: v.string(),   // ISO 8601
    duration_minutes: v.number(),
    location: v.string(), // Free text location

    session_notes: v.string(),
    participant_engagement: v.number(), // 1-5 rating

    goal_progress: v.array(
      v.object({
        goal_id: v.id('goals'),
        progress_observed: v.number(), // 1-10 rating
        evidence_notes: v.string(),
      })
    ),

    // NEW: Embedded behavior incidents
    behavior_incidents: v.array(behaviorIncidentSchema),

    // NEW: Media attachments (photos/videos)
    media: v.optional(v.array(mediaAttachmentSchema)),
  },
  handler: async (ctx, args) => {
    // Validate required fields
    if (!args.session_notes || args.session_notes.trim().length === 0) {
      throw new ValidationError('Session notes are required');
    }

    if (!args.location || args.location.trim().length === 0) {
      throw new ValidationError('Location is required');
    }

    // Validate activity exists
    const activity = await ctx.db.get(args.activity_id);
    if (!activity) {
      throw new NotFoundError(`Activity with ID ${args.activity_id} not found`);
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

    if (!user.active) {
      throw new ValidationError('Cannot create session for inactive user');
    }

    // Validate shift note if provided
    if (args.shift_note_id) {
      const shiftNote = await ctx.db.get(args.shift_note_id);
      if (!shiftNote) {
        throw new NotFoundError(`Shift note with ID ${args.shift_note_id} not found`);
      }
    }

    // Validate goal IDs in goal_progress
    for (const progress of args.goal_progress) {
      const goal = await ctx.db.get(progress.goal_id);
      if (!goal) {
        throw new NotFoundError(`Goal with ID ${progress.goal_id} not found`);
      }

      // Validate progress_observed is 1-10
      if (progress.progress_observed < 1 || progress.progress_observed > 10) {
        throw new ValidationError('Progress observed must be between 1 and 10');
      }
    }

    // Validate participant_engagement is 1-5
    if (args.participant_engagement < 1 || args.participant_engagement > 5) {
      throw new ValidationError('Participant engagement must be between 1 and 5');
    }

    // Validate duration_minutes is positive
    if (args.duration_minutes <= 0) {
      throw new ValidationError('Duration must be greater than 0');
    }

    // Validate behavior incidents
    const validSeverities = ['low', 'medium', 'high'];
    for (const incident of args.behavior_incidents) {
      if (!validSeverities.includes(incident.severity)) {
        throw new ValidationError(`Severity must be one of: ${validSeverities.join(', ')}`);
      }

      if (incident.self_harm_count < 0) {
        throw new ValidationError('Self harm count cannot be negative');
      }
    }

    // Validate datetime formats (basic check for ISO 8601)
    try {
      new Date(args.session_start_time);
      new Date(args.session_end_time);
    } catch (e) {
      throw new ValidationError('Session start and end times must be valid ISO 8601 datetime strings');
    }

    // Validate end time is after start time
    const startTime = new Date(args.session_start_time);
    const endTime = new Date(args.session_end_time);
    if (endTime <= startTime) {
      throw new ValidationError('Session end time must be after start time');
    }

    // Validate media attachments if provided
    if (args.media) {
      const validMediaTypes = ['photo', 'video'];
      for (const mediaItem of args.media) {
        if (!validMediaTypes.includes(mediaItem.type)) {
          throw new ValidationError(`Media type must be one of: ${validMediaTypes.join(', ')}`);
        }

        // Validate file exists in storage
        try {
          await ctx.storage.getUrl(mediaItem.storage_id);
        } catch (e) {
          throw new ValidationError(`File with storage ID ${mediaItem.storage_id} not found`);
        }
      }
    }

    // Create activity session
    const now = getCurrentTimestamp();
    const sessionId = await ctx.db.insert('activity_sessions', {
      activity_id: args.activity_id,
      client_id: args.client_id,
      user_id: args.user_id,
      shift_note_id: args.shift_note_id,
      session_start_time: args.session_start_time,
      session_end_time: args.session_end_time,
      duration_minutes: args.duration_minutes,
      location: args.location,
      session_notes: args.session_notes,
      participant_engagement: args.participant_engagement,
      goal_progress: args.goal_progress,
      behavior_incidents: args.behavior_incidents,
      media: args.media,
      created_at: now,
      updated_at: now,
    });

    // IMPORTANT: Update the shift note to include this session in its activity_session_ids array
    // This creates the two-way link needed for getWithSessions query
    if (args.shift_note_id) {
      const shiftNote = await ctx.db.get(args.shift_note_id);
      if (shiftNote) {
        const currentSessionIds = shiftNote.activity_session_ids || [];
        await ctx.db.patch(args.shift_note_id, {
          activity_session_ids: [...currentSessionIds, sessionId],
          updated_at: now,
        });
      }
    }

    const session = await ctx.db.get(sessionId);

    if (!session) {
      throw new NotFoundError(`Failed to retrieve created session ${sessionId}`);
    }

    // Get related entities for enriched response (same as get query)
    const activityData = await ctx.db.get(session.activity_id);
    const clientData = await ctx.db.get(session.client_id);
    const userData = await ctx.db.get(session.user_id);

    // Return enriched response with all fields
    // Note: Using empty string '' for optional string fields and empty array [] for optional arrays
    // to avoid null-related type casting issues in clients (especially Flutter)
    const enriched = {
      ...normalizeRecord(session),
      shift_note_id: session.shift_note_id || '',  // Changed from null to ''
      media: session.media || [],  // Changed from null to []
      activity_title: activityData?.title || '',
      activity_type: activityData?.activity_type || '',
      client_name: clientData?.name || '',
      user_name: userData?.name || '',
      user_email: userData?.email || '',
      // Backward compatibility: also include stakeholder fields
      stakeholder_id: session.user_id,
      stakeholder_name: userData?.name || '',
    };

    console.log('📤 Full activity session response:', JSON.stringify(enriched, null, 2));

    return enriched;
  },
});

/**
 * Get an activity session by ID
 */
export const getById = query({
  args: {
    session_id: v.id('activity_sessions'),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.session_id);
    if (!session) {
      throw new NotFoundError(`Activity session with ID ${args.session_id} not found`);
    }

    // Get related entities for enriched response
    const activity = await ctx.db.get(session.activity_id);
    const client = await ctx.db.get(session.client_id);
    const user = await ctx.db.get(session.user_id);

    return {
      ...normalizeRecord(session),
      shift_note_id: session.shift_note_id || '',
      media: session.media || [],
      activity_title: activity?.title || '',
      activity_type: activity?.activity_type || '',
      client_name: client?.name || '',
      user_name: user?.name || '',
      user_email: user?.email || '',
      stakeholder_id: session.user_id,
      stakeholder_name: user?.name || '',
    };
  },
});

/**
 * List activity sessions with optional filtering
 */
export const list = query({
  args: {
    client_id: v.optional(v.id('clients')),
    activity_id: v.optional(v.id('activities')),
    user_id: v.optional(v.id('users')),
    shift_note_id: v.optional(v.id('shift_notes')),
    date_from: v.optional(v.string()), // ISO date string
    date_to: v.optional(v.string()),   // ISO date string
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let sessions;

    // Use indexes when possible
    if (args.client_id) {
      sessions = await ctx.db
        .query('activity_sessions')
        .withIndex('by_client', (q) => q.eq('client_id', args.client_id!))
        .collect();
    } else if (args.activity_id) {
      sessions = await ctx.db
        .query('activity_sessions')
        .withIndex('by_activity', (q) => q.eq('activity_id', args.activity_id!))
        .collect();
    } else if (args.user_id) {
      sessions = await ctx.db
        .query('activity_sessions')
        .withIndex('by_user', (q) => q.eq('user_id', args.user_id!))
        .collect();
    } else if (args.shift_note_id) {
      sessions = await ctx.db
        .query('activity_sessions')
        .withIndex('by_shift_note', (q) => q.eq('shift_note_id', args.shift_note_id!))
        .collect();
    } else {
      sessions = await ctx.db.query('activity_sessions').collect();
    }

    // Apply date range filters
    if (args.date_from) {
      sessions = sessions.filter((s) => s.session_start_time >= args.date_from!);
    }
    if (args.date_to) {
      sessions = sessions.filter((s) => s.session_start_time <= args.date_to!);
    }

    // Sort by session_start_time descending (most recent first)
    sessions.sort((a, b) => b.session_start_time.localeCompare(a.session_start_time));

    // Apply pagination
    const offset = args.offset ?? 0;
    const limit = args.limit;

    if (limit) {
      sessions = sessions.slice(offset, offset + limit);
    } else if (offset > 0) {
      sessions = sessions.slice(offset);
    }

    return normalizeRecords(sessions);
  },
});

/**
 * Update an activity session
 */
export const update = mutation({
  args: {
    session_id: v.id('activity_sessions'),
    // Allow activity_id to be passed but ignore it (cannot change activity after creation)
    activity_id: v.optional(v.id('activities')),
    session_start_time: v.optional(v.string()),
    session_end_time: v.optional(v.string()),
    duration_minutes: v.optional(v.number()),
    location: v.optional(v.string()),
    session_notes: v.optional(v.string()),
    participant_engagement: v.optional(v.number()),
    goal_progress: v.optional(
      v.array(
        v.object({
          goal_id: v.id('goals'),
          progress_observed: v.number(),
          evidence_notes: v.string(),
        })
      )
    ),
    behavior_incidents: v.optional(v.array(behaviorIncidentSchema)),
    media: v.optional(v.array(mediaAttachmentSchema)),
  },
  handler: async (ctx, args) => {
    // Get existing session
    const existingSession = await ctx.db.get(args.session_id);
    if (!existingSession) {
      throw new NotFoundError(`Activity session with ID ${args.session_id} not found`);
    }

    // Build update object
    const updates: any = {
      updated_at: getCurrentTimestamp(),
    };

    if (args.session_start_time !== undefined) {
      updates.session_start_time = args.session_start_time;
    }
    if (args.session_end_time !== undefined) {
      updates.session_end_time = args.session_end_time;
    }
    if (args.duration_minutes !== undefined) {
      updates.duration_minutes = args.duration_minutes;
    }
    if (args.location !== undefined) {
      updates.location = args.location;
    }
    if (args.session_notes !== undefined) {
      updates.session_notes = args.session_notes;
    }
    if (args.participant_engagement !== undefined) {
      // Validate engagement rating
      if (args.participant_engagement < 1 || args.participant_engagement > 5) {
        throw new ValidationError('Participant engagement must be between 1 and 5');
      }
      updates.participant_engagement = args.participant_engagement;
    }
    if (args.goal_progress !== undefined) {
      // Validate goal progress
      for (const progress of args.goal_progress) {
        if (progress.progress_observed < 1 || progress.progress_observed > 10) {
          throw new ValidationError('Progress observed must be between 1 and 10');
        }
      }
      updates.goal_progress = args.goal_progress;
    }
    if (args.behavior_incidents !== undefined) {
      // Validate behavior incidents
      const validSeverities = ['low', 'medium', 'high'];
      for (const incident of args.behavior_incidents) {
        if (!validSeverities.includes(incident.severity)) {
          throw new ValidationError(`Severity must be one of: ${validSeverities.join(', ')}`);
        }
      }
      updates.behavior_incidents = args.behavior_incidents;
    }
    if (args.media !== undefined) {
      // Validate media attachments
      const validMediaTypes = ['photo', 'video'];
      for (const mediaItem of args.media) {
        if (!validMediaTypes.includes(mediaItem.type)) {
          throw new ValidationError(`Media type must be one of: ${validMediaTypes.join(', ')}`);
        }
      }
      updates.media = args.media;
    }

    // Update session
    await ctx.db.patch(args.session_id, updates);

    const updatedSession = await ctx.db.get(args.session_id);
    return normalizeRecord(updatedSession!);
  },
});

/**
 * Delete an activity session
 */
export const deleteSession = mutation({
  args: {
    id: v.id('activity_sessions'),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new NotFoundError(`Activity session with ID ${args.id} not found`);
    }

    // Remove this session from the shift note's activity_session_ids array
    if (session.shift_note_id) {
      const shiftNote = await ctx.db.get(session.shift_note_id);
      if (shiftNote && shiftNote.activity_session_ids) {
        const updatedSessionIds = shiftNote.activity_session_ids.filter(
          (id) => id !== args.id
        );
        await ctx.db.patch(session.shift_note_id, {
          activity_session_ids: updatedSessionIds,
          updated_at: getCurrentTimestamp(),
        });
      }
    }

    // Optional: Delete associated files from storage
    if (session.media && session.media.length > 0) {
      for (const mediaItem of session.media) {
        try {
          await ctx.storage.delete(mediaItem.storage_id);
        } catch (e) {
          // File might already be deleted, continue
        }
      }
    }

    await ctx.db.delete(args.id);
    return { success: true, id: args.id };
  },
});

/**
 * Generate upload URL for media files
 * This must be called before uploading a file to get a signed URL
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Generate a signed upload URL
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get file URL for a storage ID
 * Returns a URL that can be used to display/download the file
 */
export const getFileUrl = query({
  args: {
    storage_id: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storage_id);
    return url;
  },
});

/**
 * Add media to an existing activity session
 * Use this after uploading files via generateUploadUrl
 */
export const addMedia = mutation({
  args: {
    session_id: v.id('activity_sessions'),
    storage_id: v.id('_storage'),
    type: v.string(), // 'photo' | 'video'
    caption: v.optional(v.string()),
    file_name: v.string(),
    file_size: v.number(),
    mime_type: v.string(),
  },
  handler: async (ctx, args) => {
    // Get existing session
    const session = await ctx.db.get(args.session_id);
    if (!session) {
      throw new NotFoundError(`Activity session with ID ${args.session_id} not found`);
    }

    // Validate media type
    const validMediaTypes = ['photo', 'video'];
    if (!validMediaTypes.includes(args.type)) {
      throw new ValidationError(`Media type must be one of: ${validMediaTypes.join(', ')}`);
    }

    // Verify file exists in storage
    try {
      await ctx.storage.getUrl(args.storage_id);
    } catch (e) {
      throw new ValidationError(`File with storage ID ${args.storage_id} not found`);
    }

    // Create media object
    const mediaItem = {
      storage_id: args.storage_id,
      type: args.type,
      caption: args.caption,
      uploaded_at: getCurrentTimestamp(),
      file_name: args.file_name,
      file_size: args.file_size,
      mime_type: args.mime_type,
    };

    // Add to session's media array
    const currentMedia = session.media || [];
    await ctx.db.patch(args.session_id, {
      media: [...currentMedia, mediaItem],
      updated_at: getCurrentTimestamp(),
    });

    const updatedSession = await ctx.db.get(args.session_id);
    return normalizeRecord(updatedSession!);
  },
});

/**
 * Remove media from an activity session
 */
export const removeMedia = mutation({
  args: {
    session_id: v.id('activity_sessions'),
    storage_id: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    // Get existing session
    const session = await ctx.db.get(args.session_id);
    if (!session) {
      throw new NotFoundError(`Activity session with ID ${args.session_id} not found`);
    }

    // Remove media item from array
    const currentMedia = session.media || [];
    const updatedMedia = currentMedia.filter((m) => m.storage_id !== args.storage_id);

    await ctx.db.patch(args.session_id, {
      media: updatedMedia,
      updated_at: getCurrentTimestamp(),
    });

    // Delete file from storage
    try {
      await ctx.storage.delete(args.storage_id);
    } catch (e) {
      // File might already be deleted, continue
    }

    const updatedSession = await ctx.db.get(args.session_id);
    return normalizeRecord(updatedSession!);
  },
});
