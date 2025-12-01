/**
 * Convex Database Schema
 *
 * Defines the schema for all NDIS management entities.
 */

import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  /**
   * Clients (NDIS Participants)
   */
  clients: defineTable({
    name: v.string(),
    date_of_birth: v.string(),
    ndis_number: v.optional(v.string()),
    primary_contact: v.optional(v.string()),
    support_notes: v.optional(v.string()),
    active: v.boolean(),
    created_at: v.string(),
    updated_at: v.string(),
  }).index('by_active', ['active'])
    .index('by_ndis_number', ['ndis_number'])
    .index('by_created_at', ['created_at']),

  /**
   * Goals
   */
  goals: defineTable({
    client_id: v.id('clients'),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    target_date: v.string(),
    status: v.string(),
    progress_percentage: v.number(),
    milestones: v.optional(v.array(v.string())),
    created_at: v.string(),
    updated_at: v.string(),
    achieved_at: v.union(v.string(), v.null()),
    archived: v.boolean(),
  }).index('by_client', ['client_id'])
    .index('by_status', ['status'])
    .index('by_archived', ['archived'])
    .index('by_category', ['category'])
    .index('by_target_date', ['target_date']),

  /**
   * Activities (Catalog/Pool - scheduling handled separately)
   */
  activities: defineTable({
    client_id: v.id('clients'),
    stakeholder_id: v.id('stakeholders'),
    title: v.string(),
    description: v.optional(v.string()),
    activity_type: v.string(),
    status: v.string(),
    goal_ids: v.optional(v.array(v.id('goals'))),
    outcome_notes: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  }).index('by_client', ['client_id'])
    .index('by_stakeholder', ['stakeholder_id'])
    .index('by_status', ['status'])
    .index('by_type', ['activity_type']),

  /**
   * Activity Sessions (Individual occurrences of activities)
   * NEW UNIFIED STRUCTURE: Embedded behavior incidents within sessions
   */
  activity_sessions: defineTable({
    activity_id: v.id('activities'),
    client_id: v.id('clients'),
    user_id: v.id('users'), // User who performed the activity
    shift_note_id: v.optional(v.id('shift_notes')),

    // NEW: Separate start/end times instead of single performed_at
    session_start_time: v.string(), // ISO 8601 datetime
    session_end_time: v.string(),   // ISO 8601 datetime
    duration_minutes: v.number(),
    location: v.string(), // NEW: Free text location field

    session_notes: v.string(),
    participant_engagement: v.number(), // 1-5 rating
    goal_progress: v.array(
      v.object({
        goal_id: v.id('goals'),
        progress_observed: v.number(), // 1-10 rating
        evidence_notes: v.string(),
      })
    ),

    // NEW: Embedded behavior incidents (not IDs!)
    behavior_incidents: v.array(
      v.object({
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
      })
    ),

    // NEW: Media attachments (photos/videos)
    media: v.optional(
      v.array(
        v.object({
          storage_id: v.id('_storage'), // Convex file storage ID
          type: v.string(), // 'photo' | 'video'
          caption: v.optional(v.string()), // Optional description
          uploaded_at: v.string(), // ISO timestamp
          file_name: v.string(), // Original filename
          file_size: v.number(), // Size in bytes
          mime_type: v.string(), // e.g., 'image/jpeg', 'video/mp4'
        })
      )
    ),

    created_at: v.string(),
    updated_at: v.string(),
  }).index('by_client', ['client_id'])
    .index('by_activity', ['activity_id'])
    .index('by_user', ['user_id'])
    .index('by_shift_note', ['shift_note_id'])
    .index('by_session_start', ['session_start_time'])
    .index('by_client_and_date', ['client_id', 'session_start_time']),

  /**
   * Stakeholders (Support Workers, Coordinators, etc.)
   */
  stakeholders: defineTable({
    name: v.string(),
    role: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    organization: v.optional(v.string()),
    notes: v.optional(v.string()),
    active: v.boolean(),
    created_at: v.string(),
    updated_at: v.string(),
  }).index('by_active', ['active'])
    .index('by_role', ['role'])
    .index('by_name', ['name']),

  /**
   * Shift Notes (HYBRID APPROACH: Structured sessions + narrative context)
   */
  shift_notes: defineTable({
    client_id: v.id('clients'),
    user_id: v.id('users'),
    shift_date: v.string(),
    start_time: v.string(),
    end_time: v.string(),
    status: v.optional(v.string()), // 'draft' or 'submitted' (optional for backwards compatibility)
    submitted_at: v.optional(v.string()), // Timestamp when submitted
    primary_locations: v.optional(v.array(v.string())),

    // NEW: Unified approach fields
    activity_session_ids: v.optional(v.array(v.id('activity_sessions'))),
    // Note: behavior_incident_ids REMOVED - behaviors are now embedded in activity_sessions
    overall_notes: v.optional(v.string()),
    client_mood: v.optional(v.string()), // 'positive', 'neutral', 'negative', 'mixed', 'anxious', 'withdrawn'
    notable_achievements: v.optional(v.string()),
    concerns_raised: v.optional(v.string()),

    // LEGACY: Old free-form approach (maintained for backward compatibility)
    raw_notes: v.optional(v.string()),
    morning_routine: v.optional(v.string()),
    activities: v.optional(v.string()),
    afternoon_evening: v.optional(v.string()),
    behaviours_of_concern: v.optional(v.string()),
    behaviour_support_provided: v.optional(v.string()),
    home_environment: v.optional(v.string()),
    summary: v.optional(v.string()),
    formatted_note: v.optional(v.string()),
    activity_ids: v.optional(v.array(v.id('activities'))),
    goals_progress: v.optional(
      v.array(
        v.object({
          goal_id: v.id('goals'),
          progress_notes: v.string(),
          progress_observed: v.number(),
        })
      )
    ),

    created_at: v.string(),
    updated_at: v.string(),
  }).index('by_client', ['client_id'])
    .index('by_user', ['user_id'])
    .index('by_shift_date', ['shift_date'])
    .index('by_client_and_date', ['client_id', 'shift_date']),

  /**
   * Behavior Incidents (Track behavioral events and interventions)
   */
  behavior_incidents: defineTable({
    client_id: v.id('clients'),
    incident_date: v.string(),
    submitted_by: v.id('users'),
    submitted_for: v.string(), // 'self' or 'other'
    submitted_for_name: v.optional(v.string()),
    location: v.string(),
    location_other: v.optional(v.string()),
    activity_before: v.string(),
    activity_before_other: v.optional(v.string()),
    behaviors_displayed: v.array(v.string()),
    behaviors_other: v.optional(v.string()),
    duration: v.string(),
    duration_other: v.optional(v.string()),
    severity: v.string(), // 'low', 'medium', 'high'
    self_harm_types: v.array(v.string()),
    self_harm_other: v.optional(v.string()),
    self_harm_count: v.number(),
    initial_intervention: v.string(),
    intervention_description: v.optional(v.string()),
    second_support_needed: v.array(v.string()),
    second_support_description: v.optional(v.string()),
    detailed_description: v.string(),
    status: v.optional(v.string()), // 'draft' or 'submitted'
    submitted_at: v.optional(v.string()), // Timestamp when submitted
    created_at: v.string(),
    updated_at: v.string(),
  }).index('by_client', ['client_id'])
    .index('by_incident_date', ['incident_date'])
    .index('by_severity', ['severity'])
    .index('by_submitted_by', ['submitted_by'])
    .index('by_location', ['location'])
    .index('by_status', ['status']),

  /**
   * Users (Authentication via Clerk)
   */
  users: defineTable({
    clerk_id: v.string(),
    email: v.string(),
    name: v.string(),
    image_url: v.optional(v.string()),
    role: v.string(),
    stakeholder_id: v.optional(v.id('stakeholders')),
    client_id: v.optional(v.id('clients')),
    specialty: v.optional(v.string()),
    active: v.boolean(),
    created_at: v.string(),
    updated_at: v.string(),
    last_login: v.optional(v.string()),
  }).index('by_clerk_id', ['clerk_id'])
    .index('by_email', ['email'])
    .index('by_role', ['role'])
    .index('by_active', ['active']),

  /**
   * Audit Logs (Security and Compliance)
   */
  audit_logs: defineTable({
    user_id: v.optional(v.id('users')),
    user_email: v.optional(v.string()),
    action: v.string(),
    resource_type: v.string(),
    resource_id: v.optional(v.string()),
    details: v.optional(v.string()),
    ip_address: v.optional(v.string()),
    success: v.boolean(),
    error_message: v.optional(v.string()),
    timestamp: v.string(),
  }).index('by_user', ['user_id'])
    .index('by_timestamp', ['timestamp'])
    .index('by_resource', ['resource_type', 'resource_id'])
    .index('by_action', ['action']),
});
