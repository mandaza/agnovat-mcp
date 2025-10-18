declare const _default: import("convex/server").SchemaDefinition<{
    clients: import("convex/server").TableDefinition<import("convex/values").VObject<{
        ndis_number?: string | undefined;
        primary_contact?: string | undefined;
        support_notes?: string | undefined;
        name: string;
        date_of_birth: string;
        active: boolean;
        created_at: string;
        updated_at: string;
    }, {
        name: import("convex/values").VString<string, "required">;
        date_of_birth: import("convex/values").VString<string, "required">;
        ndis_number: import("convex/values").VString<string | undefined, "optional">;
        primary_contact: import("convex/values").VString<string | undefined, "optional">;
        support_notes: import("convex/values").VString<string | undefined, "optional">;
        active: import("convex/values").VBoolean<boolean, "required">;
        created_at: import("convex/values").VString<string, "required">;
        updated_at: import("convex/values").VString<string, "required">;
    }, "required", "name" | "date_of_birth" | "ndis_number" | "primary_contact" | "support_notes" | "active" | "created_at" | "updated_at">, {
        by_active: ["active", "_creationTime"];
        by_ndis_number: ["ndis_number", "_creationTime"];
        by_created_at: ["created_at", "_creationTime"];
    }, {}, {}>;
    goals: import("convex/server").TableDefinition<import("convex/values").VObject<{
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
    }, {
        client_id: import("convex/values").VId<import("convex/values").GenericId<"clients">, "required">;
        title: import("convex/values").VString<string, "required">;
        description: import("convex/values").VString<string | undefined, "optional">;
        category: import("convex/values").VString<string, "required">;
        target_date: import("convex/values").VString<string, "required">;
        status: import("convex/values").VString<string, "required">;
        progress_percentage: import("convex/values").VFloat64<number, "required">;
        milestones: import("convex/values").VArray<string[] | undefined, import("convex/values").VString<string, "required">, "optional">;
        created_at: import("convex/values").VString<string, "required">;
        updated_at: import("convex/values").VString<string, "required">;
        achieved_at: import("convex/values").VUnion<string | null, [import("convex/values").VString<string, "required">, import("convex/values").VNull<null, "required">], "required", never>;
        archived: import("convex/values").VBoolean<boolean, "required">;
    }, "required", "created_at" | "updated_at" | "client_id" | "title" | "description" | "category" | "target_date" | "status" | "progress_percentage" | "milestones" | "achieved_at" | "archived">, {
        by_client: ["client_id", "_creationTime"];
        by_status: ["status", "_creationTime"];
        by_archived: ["archived", "_creationTime"];
        by_category: ["category", "_creationTime"];
        by_target_date: ["target_date", "_creationTime"];
    }, {}, {}>;
    activities: import("convex/server").TableDefinition<import("convex/values").VObject<{
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
    }, {
        client_id: import("convex/values").VId<import("convex/values").GenericId<"clients">, "required">;
        stakeholder_id: import("convex/values").VId<import("convex/values").GenericId<"stakeholders">, "required">;
        title: import("convex/values").VString<string, "required">;
        description: import("convex/values").VString<string | undefined, "optional">;
        activity_type: import("convex/values").VString<string, "required">;
        activity_date: import("convex/values").VString<string, "required">;
        start_time: import("convex/values").VString<string | undefined, "optional">;
        end_time: import("convex/values").VString<string | undefined, "optional">;
        duration_minutes: import("convex/values").VFloat64<number | undefined, "optional">;
        status: import("convex/values").VString<string, "required">;
        goal_ids: import("convex/values").VArray<import("convex/values").GenericId<"goals">[] | undefined, import("convex/values").VId<import("convex/values").GenericId<"goals">, "required">, "optional">;
        outcome_notes: import("convex/values").VString<string | undefined, "optional">;
        created_at: import("convex/values").VString<string, "required">;
        updated_at: import("convex/values").VString<string, "required">;
    }, "required", "created_at" | "updated_at" | "client_id" | "title" | "description" | "status" | "stakeholder_id" | "activity_type" | "activity_date" | "start_time" | "end_time" | "duration_minutes" | "goal_ids" | "outcome_notes">, {
        by_client: ["client_id", "_creationTime"];
        by_stakeholder: ["stakeholder_id", "_creationTime"];
        by_activity_date: ["activity_date", "_creationTime"];
        by_status: ["status", "_creationTime"];
        by_type: ["activity_type", "_creationTime"];
    }, {}, {}>;
    stakeholders: import("convex/server").TableDefinition<import("convex/values").VObject<{
        email?: string | undefined;
        phone?: string | undefined;
        organization?: string | undefined;
        notes?: string | undefined;
        name: string;
        active: boolean;
        created_at: string;
        updated_at: string;
        role: string;
    }, {
        name: import("convex/values").VString<string, "required">;
        role: import("convex/values").VString<string, "required">;
        email: import("convex/values").VString<string | undefined, "optional">;
        phone: import("convex/values").VString<string | undefined, "optional">;
        organization: import("convex/values").VString<string | undefined, "optional">;
        notes: import("convex/values").VString<string | undefined, "optional">;
        active: import("convex/values").VBoolean<boolean, "required">;
        created_at: import("convex/values").VString<string, "required">;
        updated_at: import("convex/values").VString<string, "required">;
    }, "required", "name" | "active" | "created_at" | "updated_at" | "role" | "email" | "phone" | "organization" | "notes">, {
        by_active: ["active", "_creationTime"];
        by_role: ["role", "_creationTime"];
        by_name: ["name", "_creationTime"];
    }, {}, {}>;
    shift_notes: import("convex/server").TableDefinition<import("convex/values").VObject<{
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
    }, {
        client_id: import("convex/values").VId<import("convex/values").GenericId<"clients">, "required">;
        stakeholder_id: import("convex/values").VId<import("convex/values").GenericId<"stakeholders">, "required">;
        shift_date: import("convex/values").VString<string, "required">;
        start_time: import("convex/values").VString<string, "required">;
        end_time: import("convex/values").VString<string, "required">;
        general_observations: import("convex/values").VString<string, "required">;
        activity_ids: import("convex/values").VArray<import("convex/values").GenericId<"activities">[] | undefined, import("convex/values").VId<import("convex/values").GenericId<"activities">, "required">, "optional">;
        goals_progress: import("convex/values").VArray<{
            goal_id: import("convex/values").GenericId<"goals">;
            progress_notes: string;
            progress_observed: number;
        }[] | undefined, import("convex/values").VObject<{
            goal_id: import("convex/values").GenericId<"goals">;
            progress_notes: string;
            progress_observed: number;
        }, {
            goal_id: import("convex/values").VId<import("convex/values").GenericId<"goals">, "required">;
            progress_notes: import("convex/values").VString<string, "required">;
            progress_observed: import("convex/values").VFloat64<number, "required">;
        }, "required", "goal_id" | "progress_notes" | "progress_observed">, "optional">;
        mood_wellbeing: import("convex/values").VString<string | undefined, "optional">;
        communication_notes: import("convex/values").VString<string | undefined, "optional">;
        health_safety_notes: import("convex/values").VString<string | undefined, "optional">;
        handover_notes: import("convex/values").VString<string | undefined, "optional">;
        incidents: import("convex/values").VArray<{
            description: string;
            action_taken: string;
            severity: string;
        }[] | undefined, import("convex/values").VObject<{
            description: string;
            action_taken: string;
            severity: string;
        }, {
            description: import("convex/values").VString<string, "required">;
            action_taken: import("convex/values").VString<string, "required">;
            severity: import("convex/values").VString<string, "required">;
        }, "required", "description" | "action_taken" | "severity">, "optional">;
        created_at: import("convex/values").VString<string, "required">;
        updated_at: import("convex/values").VString<string, "required">;
    }, "required", "created_at" | "updated_at" | "client_id" | "stakeholder_id" | "start_time" | "end_time" | "shift_date" | "general_observations" | "activity_ids" | "goals_progress" | "mood_wellbeing" | "communication_notes" | "health_safety_notes" | "handover_notes" | "incidents">, {
        by_client: ["client_id", "_creationTime"];
        by_stakeholder: ["stakeholder_id", "_creationTime"];
        by_shift_date: ["shift_date", "_creationTime"];
    }, {}, {}>;
}, true>;
export default _default;
//# sourceMappingURL=schema.d.ts.map