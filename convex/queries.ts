/**
 * Convex Queries
 *
 * Read operations for all entities.
 */

import { query } from './_generated/server.js';
import { v } from 'convex/values';

/**
 * Get a record by ID
 */
export const getById = query({
  args: {
    id: v.id('clients'), // Generic ID
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id as any);
  },
});

/**
 * List records with filtering
 */
export const list = query({
  args: {
    table: v.string(),
    filter: v.optional(v.any()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let queryBuilder = ctx.db.query(args.table as any);

    // Apply filters if provided
    if (args.filter) {
      queryBuilder = queryBuilder.filter((q) => {
        let result: any = true;
        for (const [key, value] of Object.entries(args.filter)) {
          result = q.and(result, q.eq(q.field(key as any), value));
        }
        return result;
      });
    }

    // Collect results
    let results = await queryBuilder.collect();

    // Apply offset
    if (args.offset !== undefined) {
      results = results.slice(args.offset);
    }

    // Apply limit
    if (args.limit !== undefined) {
      results = results.slice(0, args.limit);
    }

    return results;
  },
});

/**
 * Count records with optional filter
 */
export const count = query({
  args: {
    table: v.string(),
    filter: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    let queryBuilder = ctx.db.query(args.table as any);

    if (args.filter) {
      queryBuilder = queryBuilder.filter((q) => {
        let result: any = true;
        for (const [key, value] of Object.entries(args.filter)) {
          result = q.and(result, q.eq(q.field(key as any), value));
        }
        return result;
      });
    }

    const results = await queryBuilder.collect();
    return results.length;
  },
});

/**
 * Check if a record exists
 */
export const exists = query({
  args: {
    id: v.id('clients'), // Generic ID
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id as any);
    return record !== null;
  },
});

/**
 * Get statistics
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const tables = ['clients', 'goals', 'activities', 'stakeholders', 'shift_notes'];
    const stats: Record<string, number> = {};
    let total = 0;

    for (const table of tables) {
      const records = await ctx.db.query(table as any).collect();
      stats[table] = records.length;
      total += records.length;
    }

    return {
      total_records: total,
      records_by_collection: stats,
    };
  },
});
