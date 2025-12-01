/**
 * Convex Mutations
 *
 * Write operations for all entities.
 */

import { mutation } from './_generated/server.js';
import { v } from 'convex/values';

/**
 * Insert or update a record
 */
export const upsert = mutation({
  args: {
    table: v.string(),
    // Accept IDs from any table using v.union of all possible table IDs
    id: v.optional(
      v.union(
        v.id('clients'),
        v.id('goals'),
        v.id('activities'),
        v.id('stakeholders'),
        v.id('shift_notes'),
        v.id('users'),
        v.id('audit_logs')
      )
    ),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const { table, id, data } = args;

    if (id) {
      // Update existing record
      await ctx.db.patch(id as any, data);
      return id;
    } else {
      // Insert new record
      const newId = await ctx.db.insert(table as any, data);
      return newId;
    }
  },
});

/**
 * Delete a record
 */
export const deleteRecord = mutation({
  args: {
    // Accept IDs from any table
    id: v.union(
      v.id('clients'),
      v.id('goals'),
      v.id('activities'),
      v.id('stakeholders'),
      v.id('shift_notes'),
      v.id('users'),
      v.id('audit_logs')
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id as any);
    return true;
  },
});

/**
 * Clear all records in a table
 */
export const clearTable = mutation({
  args: {
    table: v.string(),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db.query(args.table as any).collect();
    for (const record of records) {
      await ctx.db.delete(record._id);
    }
    return records.length;
  },
});

/**
 * Batch insert records
 */
export const batchInsert = mutation({
  args: {
    table: v.string(),
    records: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const record of args.records) {
      const id = await ctx.db.insert(args.table as any, record);
      ids.push(id);
    }
    return ids;
  },
});
