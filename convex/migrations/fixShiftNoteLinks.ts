/**
 * Migration: Fix two-way links between shift notes and activity sessions
 *
 * Problem: Existing activity sessions reference shift_note_id, but shift notes
 * don't have those sessions in their activity_session_ids array.
 *
 * Solution: Find all activity sessions with shift_note_id and update the corresponding
 * shift notes to include them in activity_session_ids.
 *
 * Run this once via: npx convex run migrations/fixShiftNoteLinks:run
 */

import { internalMutation } from '../_generated/server';

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log('🔧 Starting migration: Fix shift note <-> activity session links');

    // Get all activity sessions
    const allSessions = await ctx.db.query('activity_sessions').collect();
    console.log(`📊 Found ${allSessions.length} total activity sessions`);

    // Group sessions by shift_note_id
    const sessionsByShiftNote = new Map<string, string[]>();
    let sessionsWithShiftNote = 0;

    for (const session of allSessions) {
      if (session.shift_note_id) {
        sessionsWithShiftNote++;
        const existing = sessionsByShiftNote.get(session.shift_note_id) || [];
        sessionsByShiftNote.set(session.shift_note_id, [...existing, session._id]);
      }
    }

    console.log(`📋 Found ${sessionsWithShiftNote} sessions linked to shift notes`);
    console.log(`📝 Found ${sessionsByShiftNote.size} unique shift notes to update`);

    // Update each shift note
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const [shiftNoteId, sessionIds] of sessionsByShiftNote.entries()) {
      try {
        const shiftNote: any = await ctx.db.get(shiftNoteId as any);

        if (!shiftNote) {
          console.warn(`⚠️  Shift note ${shiftNoteId} not found (referenced by ${sessionIds.length} sessions)`);
          errorCount++;
          continue;
        }

        const currentSessionIds = (shiftNote.activity_session_ids || []) as any[];

        // Check if already up to date
        const allPresent = sessionIds.every(id => currentSessionIds.includes(id as any));
        if (allPresent && currentSessionIds.length === sessionIds.length) {
          console.log(`✓ Shift note ${shiftNoteId} already up to date (${sessionIds.length} sessions)`);
          skippedCount++;
          continue;
        }

        // Merge existing and new session IDs (remove duplicates)
        const mergedSessionIds = [...new Set([...currentSessionIds, ...sessionIds])];

        await ctx.db.patch(shiftNoteId as any, {
          activity_session_ids: mergedSessionIds as any,
        });

        console.log(`✓ Updated shift note ${shiftNoteId}: ${currentSessionIds.length} → ${mergedSessionIds.length} sessions`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ Error updating shift note ${shiftNoteId}:`, error);
        errorCount++;
      }
    }

    const summary = {
      totalSessions: allSessions.length,
      sessionsWithShiftNote,
      shiftNotesToUpdate: sessionsByShiftNote.size,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errorCount,
    };

    console.log('═══════════════════════════════════════');
    console.log('📊 Migration Summary:');
    console.log(`   Total activity sessions: ${summary.totalSessions}`);
    console.log(`   Sessions with shift note: ${summary.sessionsWithShiftNote}`);
    console.log(`   Shift notes to update: ${summary.shiftNotesToUpdate}`);
    console.log(`   ✓ Updated: ${summary.updated}`);
    console.log(`   ⊘ Skipped (already OK): ${summary.skipped}`);
    console.log(`   ✗ Errors: ${summary.errors}`);
    console.log('═══════════════════════════════════════');

    return summary;
  },
});
