/**
 * Test mutation to create a sample activity session
 * Use this to see exactly what the backend returns
 */

import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const createTestSession = mutation({
  args: {
    activity_id: v.id('activities'),
    client_id: v.id('clients'),
    user_id: v.id('users'),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const sessionId = await ctx.db.insert('activity_sessions', {
      activity_id: args.activity_id,
      client_id: args.client_id,
      user_id: args.user_id,
      session_start_time: now,
      session_end_time: now,
      duration_minutes: 60,
      location: 'Test Location',
      session_notes: 'Test session',
      participant_engagement: 5,
      goal_progress: [],
      behavior_incidents: [],
      created_at: now,
      updated_at: now,
    });

    const session = await ctx.db.get(sessionId);

    // Return raw session to see exact structure
    console.log('🔍 Raw session from DB:', JSON.stringify(session, null, 2));

    // Return normalized
    const normalized = {
      id: session!._id,
      activity_id: session!.activity_id,
      client_id: session!.client_id,
      user_id: session!.user_id,
      shift_note_id: session!.shift_note_id || null,
      session_start_time: session!.session_start_time,
      session_end_time: session!.session_end_time,
      duration_minutes: session!.duration_minutes,
      location: session!.location,
      session_notes: session!.session_notes,
      participant_engagement: session!.participant_engagement,
      goal_progress: session!.goal_progress,
      behavior_incidents: session!.behavior_incidents,
      media: session!.media || null,
      created_at: session!.created_at,
      updated_at: session!.updated_at,
    };

    console.log('🔍 Normalized session:', JSON.stringify(normalized, null, 2));

    return normalized;
  },
});
