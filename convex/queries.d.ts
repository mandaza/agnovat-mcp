export declare const getById: import("convex/server").RegisteredQuery<"public", {
    id: import("convex/values").GenericId<"clients">;
}, Promise<{
    _id: import("convex/values").GenericId<"clients">;
    _creationTime: number;
    ndis_number?: string | undefined;
    primary_contact?: string | undefined;
    support_notes?: string | undefined;
    name: string;
    date_of_birth: string;
    active: boolean;
    created_at: string;
    updated_at: string;
} | {
    _id: import("convex/values").GenericId<"goals">;
    _creationTime: number;
    description?: string | undefined;
    milestones?: string[] | undefined;
    created_at: string;
    updated_at: string;
    client_id: import("convex/values").GenericId<"clients">;
    title: string;
    category: string;
    target_date: string;
    status: string;
    progress_percentage: number;
    achieved_at: string | null;
    archived: boolean;
} | {
    _id: import("convex/values").GenericId<"activities">;
    _creationTime: number;
    description?: string | undefined;
    start_time?: string | undefined;
    end_time?: string | undefined;
    duration_minutes?: number | undefined;
    goal_ids?: import("convex/values").GenericId<"goals">[] | undefined;
    outcome_notes?: string | undefined;
    created_at: string;
    updated_at: string;
    client_id: import("convex/values").GenericId<"clients">;
    title: string;
    status: string;
    stakeholder_id: import("convex/values").GenericId<"stakeholders">;
    activity_type: string;
    activity_date: string;
} | {
    _id: import("convex/values").GenericId<"shift_notes">;
    _creationTime: number;
    activity_ids?: import("convex/values").GenericId<"activities">[] | undefined;
    goals_progress?: {
        goal_id: import("convex/values").GenericId<"goals">;
        progress_notes: string;
        progress_observed: number;
    }[] | undefined;
    mood_wellbeing?: string | undefined;
    communication_notes?: string | undefined;
    health_safety_notes?: string | undefined;
    handover_notes?: string | undefined;
    incidents?: {
        description: string;
        action_taken: string;
        severity: string;
    }[] | undefined;
    created_at: string;
    updated_at: string;
    client_id: import("convex/values").GenericId<"clients">;
    stakeholder_id: import("convex/values").GenericId<"stakeholders">;
    start_time: string;
    end_time: string;
    shift_date: string;
    general_observations: string;
} | {
    _id: import("convex/values").GenericId<"stakeholders">;
    _creationTime: number;
    email?: string | undefined;
    phone?: string | undefined;
    organization?: string | undefined;
    notes?: string | undefined;
    name: string;
    active: boolean;
    created_at: string;
    updated_at: string;
    role: string;
} | null>>;
export declare const list: import("convex/server").RegisteredQuery<"public", {
    filter?: any;
    limit?: number | undefined;
    offset?: number | undefined;
    table: string;
}, Promise<any[]>>;
export declare const count: import("convex/server").RegisteredQuery<"public", {
    filter?: any;
    table: string;
}, Promise<number>>;
export declare const exists: import("convex/server").RegisteredQuery<"public", {
    id: import("convex/values").GenericId<"clients">;
}, Promise<boolean>>;
export declare const getStats: import("convex/server").RegisteredQuery<"public", {}, Promise<{
    total_records: number;
    records_by_collection: Record<string, number>;
}>>;
//# sourceMappingURL=queries.d.ts.map