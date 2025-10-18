import { query } from './_generated/server.js';
import { v } from 'convex/values';
export const getById = query({
    args: {
        id: v.id('clients'),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});
export const list = query({
    args: {
        table: v.string(),
        filter: v.optional(v.any()),
        limit: v.optional(v.number()),
        offset: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let queryBuilder = ctx.db.query(args.table);
        if (args.filter) {
            queryBuilder = queryBuilder.filter((q) => {
                let result = true;
                for (const [key, value] of Object.entries(args.filter)) {
                    result = q.and(result, q.eq(q.field(key), value));
                }
                return result;
            });
        }
        let results = await queryBuilder.collect();
        if (args.offset !== undefined) {
            results = results.slice(args.offset);
        }
        if (args.limit !== undefined) {
            results = results.slice(0, args.limit);
        }
        return results;
    },
});
export const count = query({
    args: {
        table: v.string(),
        filter: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        let queryBuilder = ctx.db.query(args.table);
        if (args.filter) {
            queryBuilder = queryBuilder.filter((q) => {
                let result = true;
                for (const [key, value] of Object.entries(args.filter)) {
                    result = q.and(result, q.eq(q.field(key), value));
                }
                return result;
            });
        }
        const results = await queryBuilder.collect();
        return results.length;
    },
});
export const exists = query({
    args: {
        id: v.id('clients'),
    },
    handler: async (ctx, args) => {
        const record = await ctx.db.get(args.id);
        return record !== null;
    },
});
export const getStats = query({
    args: {},
    handler: async (ctx) => {
        const tables = ['clients', 'goals', 'activities', 'stakeholders', 'shift_notes'];
        const stats = {};
        let total = 0;
        for (const table of tables) {
            const records = await ctx.db.query(table).collect();
            stats[table] = records.length;
            total += records.length;
        }
        return {
            total_records: total,
            records_by_collection: stats,
        };
    },
});
//# sourceMappingURL=queries.js.map