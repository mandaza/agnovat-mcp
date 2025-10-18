import { mutation } from './_generated/server.js';
import { v } from 'convex/values';
export const upsert = mutation({
    args: {
        table: v.string(),
        id: v.optional(v.id('clients')),
        data: v.any(),
    },
    handler: async (ctx, args) => {
        const { table, id, data } = args;
        if (id) {
            await ctx.db.patch(id, data);
            return id;
        }
        else {
            const newId = await ctx.db.insert(table, data);
            return newId;
        }
    },
});
export const deleteRecord = mutation({
    args: {
        id: v.id('clients'),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
        return true;
    },
});
export const clearTable = mutation({
    args: {
        table: v.string(),
    },
    handler: async (ctx, args) => {
        const records = await ctx.db.query(args.table).collect();
        for (const record of records) {
            await ctx.db.delete(record._id);
        }
        return records.length;
    },
});
export const batchInsert = mutation({
    args: {
        table: v.string(),
        records: v.array(v.any()),
    },
    handler: async (ctx, args) => {
        const ids = [];
        for (const record of args.records) {
            const id = await ctx.db.insert(args.table, record);
            ids.push(id);
        }
        return ids;
    },
});
//# sourceMappingURL=mutations.js.map