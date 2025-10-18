export declare const upsert: import("convex/server").RegisteredMutation<"public", {
    id?: import("convex/values").GenericId<"clients"> | undefined;
    table: string;
    data: any;
}, Promise<import("convex/values").GenericId<any>>>;
export declare const deleteRecord: import("convex/server").RegisteredMutation<"public", {
    id: import("convex/values").GenericId<"clients">;
}, Promise<boolean>>;
export declare const clearTable: import("convex/server").RegisteredMutation<"public", {
    table: string;
}, Promise<number>>;
export declare const batchInsert: import("convex/server").RegisteredMutation<"public", {
    table: string;
    records: any[];
}, Promise<import("convex/values").GenericId<any>[]>>;
//# sourceMappingURL=mutations.d.ts.map