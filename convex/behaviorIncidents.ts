/**
 * Behavior Incident Convex Functions
 *
 * Type-safe Convex functions for managing behavioral incidents and safety events.
 * These functions can be called directly from Flutter via the Convex Dart client.
 *
 * @module convex/behaviorIncidents
 */

import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import {
  isValidDate,
  getCurrentTimestamp,
  ValidationError,
  NotFoundError,
  normalizeRecord,
  normalizeRecords,
} from './lib/validation';

/**
 * Create a new behavior incident
 *
 * @example Flutter usage:
 * ```dart
 * final incident = await convex.mutation('behaviorIncidents:create', {
 *   'client_id': clientId,
 *   'incident_date': '2025-11-23',
 *   'submitted_by': userId,
 *   'submitted_for': 'other',
 *   'submitted_for_name': 'Tavonga',
 *   'location': 'in_the_community',
 *   'activity_before': 'unstructured_time',
 *   'behaviors_displayed': ['wandering', 'withdrawal'],
 *   'duration': '6_10_minutes',
 *   'severity': 'medium',
 *   'self_harm_types': ['no_harm'],
 *   'self_harm_count': 0,
 *   'initial_intervention': 'verbal_redirection',
 *   'second_support_needed': ['ensure_safety'],
 *   'detailed_description': 'Detailed incident notes...',
 * });
 * ```
 */
export const create = mutation({
  args: {
    client_id: v.id('clients'),
    incident_date: v.string(),
    submitted_by: v.id('users'),
    submitted_for: v.string(),
    submitted_for_name: v.optional(v.string()),
    location: v.string(),
    location_other: v.optional(v.string()),
    activity_before: v.string(),
    activity_before_other: v.optional(v.string()),
    behaviors_displayed: v.array(v.string()),
    behaviors_other: v.optional(v.string()),
    duration: v.string(),
    duration_other: v.optional(v.string()),
    severity: v.string(),
    self_harm_types: v.array(v.string()),
    self_harm_other: v.optional(v.string()),
    self_harm_count: v.number(),
    initial_intervention: v.string(),
    intervention_description: v.optional(v.string()),
    second_support_needed: v.array(v.string()),
    second_support_description: v.optional(v.string()),
    detailed_description: v.string(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate incident date
    if (!isValidDate(args.incident_date)) {
      throw new ValidationError('Incident date must be in YYYY-MM-DD format');
    }

    // Validate submitted_for
    if (!['self', 'other'].includes(args.submitted_for)) {
      throw new ValidationError('submitted_for must be either "self" or "other"');
    }

    // Validate behaviors_displayed array
    if (!args.behaviors_displayed || args.behaviors_displayed.length === 0) {
      throw new ValidationError('At least one behavior must be selected');
    }

    // Validate severity
    if (!['low', 'medium', 'high'].includes(args.severity)) {
      throw new ValidationError('Severity must be low, medium, or high');
    }

    // Validate self_harm_count
    if (args.self_harm_count < 0 || args.self_harm_count > 20) {
      throw new ValidationError('Self harm count must be between 0 and 20');
    }

    // Validate detailed_description
    if (!args.detailed_description || args.detailed_description.trim().length === 0) {
      throw new ValidationError('Detailed description is required');
    }

    // Validate status
    if (args.status && !['draft', 'submitted'].includes(args.status)) {
      throw new ValidationError('Status must be "draft" or "submitted"');
    }

    // Verify client exists
    const client = await ctx.db.get(args.client_id);
    if (!client) {
      throw new NotFoundError('Client not found');
    }

    // Verify submitter exists
    const submitter = await ctx.db.get(args.submitted_by);
    if (!submitter) {
      throw new NotFoundError('Submitter (user) not found');
    }

    // Create incident
    const now = getCurrentTimestamp();

    // Set submitted_at if status is 'submitted'
    const submittedAt = args.status === 'submitted' ? now : undefined;

    const incidentId = await ctx.db.insert('behavior_incidents', {
      client_id: args.client_id,
      incident_date: args.incident_date,
      submitted_by: args.submitted_by,
      submitted_for: args.submitted_for,
      submitted_for_name: args.submitted_for_name,
      location: args.location,
      location_other: args.location_other,
      activity_before: args.activity_before,
      activity_before_other: args.activity_before_other,
      behaviors_displayed: args.behaviors_displayed,
      behaviors_other: args.behaviors_other,
      duration: args.duration,
      duration_other: args.duration_other,
      severity: args.severity,
      self_harm_types: args.self_harm_types,
      self_harm_other: args.self_harm_other,
      self_harm_count: args.self_harm_count,
      initial_intervention: args.initial_intervention,
      intervention_description: args.intervention_description,
      second_support_needed: args.second_support_needed,
      second_support_description: args.second_support_description,
      detailed_description: args.detailed_description,
      status: args.status,
      submitted_at: submittedAt,
      created_at: now,
      updated_at: now,
    });

    // Return the created incident with normalized ID
    const incident = await ctx.db.get(incidentId);
    return normalizeRecord(incident!);
  },
});

/**
 * Get a behavior incident by ID
 *
 * @example Flutter usage:
 * ```dart
 * final incident = await convex.query('behaviorIncidents:getById', {
 *   'id': incidentId,
 * });
 * ```
 */
export const getById = query({
  args: {
    id: v.id('behavior_incidents'),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.id);
    if (!incident) {
      throw new NotFoundError('Behavior incident not found');
    }

    // Get client details
    const client = await ctx.db.get(incident.client_id);
    const clientName = client?.name || 'Unknown Client';

    // Get submitter details
    const submitter = await ctx.db.get(incident.submitted_by);
    const submitterName = submitter?.name;

    return {
      ...normalizeRecord(incident),
      client_name: clientName,
      submitter_name: submitterName,
    };
  },
});

/**
 * List behavior incidents with optional filtering
 *
 * @example Flutter usage:
 * ```dart
 * final incidents = await convex.query('behaviorIncidents:list', {
 *   'client_id': clientId, // optional
 *   'severity': 'high', // optional
 *   'date_from': '2025-01-01', // optional
 *   'date_to': '2025-12-31', // optional
 *   'limit': 20,
 * });
 * ```
 */
export const list = query({
  args: {
    client_id: v.optional(v.id('clients')),
    severity: v.optional(v.string()),
    date_from: v.optional(v.string()),
    date_to: v.optional(v.string()),
    submitted_by: v.optional(v.id('users')),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let incidents;

    // Filter by client if provided
    if (args.client_id) {
      incidents = await ctx.db
        .query('behavior_incidents')
        .withIndex('by_client', (q) => q.eq('client_id', args.client_id))
        .collect();
    } else if (args.severity) {
      incidents = await ctx.db
        .query('behavior_incidents')
        .withIndex('by_severity', (q) => q.eq('severity', args.severity))
        .collect();
    } else if (args.submitted_by) {
      incidents = await ctx.db
        .query('behavior_incidents')
        .withIndex('by_submitted_by', (q) => q.eq('submitted_by', args.submitted_by))
        .collect();
    } else {
      incidents = await ctx.db.query('behavior_incidents').collect();
    }

    // Apply date range filter
    if (args.date_from) {
      incidents = incidents.filter((i) => i.incident_date >= args.date_from!);
    }
    if (args.date_to) {
      incidents = incidents.filter((i) => i.incident_date <= args.date_to!);
    }

    // Apply additional severity filter if not used in index
    if (args.severity && !args.client_id) {
      incidents = incidents.filter((i) => i.severity === args.severity);
    }

    // Sort by incident date descending, then by created_at
    incidents.sort((a, b) => {
      const dateCompare = b.incident_date.localeCompare(a.incident_date);
      if (dateCompare !== 0) return dateCompare;
      return b.created_at.localeCompare(a.created_at);
    });

    // Apply limit
    const limit = args.limit || 20;
    const limitedIncidents = incidents.slice(0, limit);

    // Enrich with submitter and client names
    const enrichedIncidents = await Promise.all(
      limitedIncidents.map(async (incident) => {
        const submitter = await ctx.db.get(incident.submitted_by);
        const client = await ctx.db.get(incident.client_id);

        return {
          ...normalizeRecord(incident),
          submitter_name: (submitter && 'name' in submitter) ? submitter.name : 'Unknown Worker',
          client_name: (client && 'name' in client) ? client.name : 'Unknown Client',
        };
      })
    );

    return enrichedIncidents;
  },
});

/**
 * Update a behavior incident
 *
 * @example Flutter usage:
 * ```dart
 * final updated = await convex.mutation('behaviorIncidents:update', {
 *   'id': incidentId,
 *   'severity': 'high',
 *   'detailed_description': 'Updated description...',
 * });
 * ```
 */
export const update = mutation({
  args: {
    id: v.id('behavior_incidents'),
    client_id: v.optional(v.id('clients')), // Accept but ignore (immutable)
    submitted_by: v.optional(v.id('users')), // Accept but ignore (immutable)
    submitted_at: v.optional(v.string()), // Accept but ignore (server-managed)
    created_at: v.optional(v.string()), // Accept but ignore (immutable)
    updated_at: v.optional(v.string()), // Accept but ignore (server-managed)
    incident_date: v.optional(v.string()),
    submitted_for: v.optional(v.string()),
    submitted_for_name: v.optional(v.string()),
    location: v.optional(v.string()),
    location_other: v.optional(v.string()),
    activity_before: v.optional(v.string()),
    activity_before_other: v.optional(v.string()),
    behaviors_displayed: v.optional(v.array(v.string())),
    behaviors_other: v.optional(v.string()),
    duration: v.optional(v.string()),
    duration_other: v.optional(v.string()),
    severity: v.optional(v.string()),
    self_harm_types: v.optional(v.array(v.string())),
    self_harm_other: v.optional(v.string()),
    self_harm_count: v.optional(v.number()),
    initial_intervention: v.optional(v.string()),
    intervention_description: v.optional(v.string()),
    second_support_needed: v.optional(v.array(v.string())),
    second_support_description: v.optional(v.string()),
    detailed_description: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, client_id, submitted_by, submitted_at, created_at, updated_at, ...updates } = args;

    // Get existing incident
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new NotFoundError('Behavior incident not found');
    }

    // Validate fields if provided
    if (updates.incident_date && !isValidDate(updates.incident_date)) {
      throw new ValidationError('Incident date must be in YYYY-MM-DD format');
    }

    if (updates.submitted_for && !['self', 'other'].includes(updates.submitted_for)) {
      throw new ValidationError('submitted_for must be either "self" or "other"');
    }

    if (updates.severity && !['low', 'medium', 'high'].includes(updates.severity)) {
      throw new ValidationError('Severity must be low, medium, or high');
    }

    if (updates.self_harm_count !== undefined && (updates.self_harm_count < 0 || updates.self_harm_count > 20)) {
      throw new ValidationError('Self harm count must be between 0 and 20');
    }

    if (updates.behaviors_displayed && updates.behaviors_displayed.length === 0) {
      throw new ValidationError('At least one behavior must be selected');
    }

    if (updates.status && !['draft', 'submitted'].includes(updates.status)) {
      throw new ValidationError('Status must be "draft" or "submitted"');
    }

    // Update incident
    const now = getCurrentTimestamp();

    // If status is changing to 'submitted' and not already submitted, set submitted_at
    const patchData: Record<string, unknown> = {
      ...updates,
      updated_at: now,
    };

    if (updates.status === 'submitted' && existing.status !== 'submitted') {
      patchData.submitted_at = now;
    }

    await ctx.db.patch(id, patchData);

    // Return updated incident
    const updated = await ctx.db.get(id);
    return normalizeRecord(updated!);
  },
});

/**
 * Delete a behavior incident
 *
 * @example Flutter usage:
 * ```dart
 * await convex.mutation('behaviorIncidents:remove', {
 *   'id': incidentId,
 * });
 * ```
 */
export const remove = mutation({
  args: {
    id: v.id('behavior_incidents'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new NotFoundError('Behavior incident not found');
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Get behavior incident statistics
 *
 * @example Flutter usage:
 * ```dart
 * final stats = await convex.query('behaviorIncidents:getStats', {
 *   'client_id': clientId, // optional
 * });
 * ```
 */
export const getStats = query({
  args: {
    client_id: v.optional(v.id('clients')),
  },
  handler: async (ctx, args) => {
    // Get incidents
    let incidents;
    if (args.client_id) {
      incidents = await ctx.db
        .query('behavior_incidents')
        .withIndex('by_client', (q) => q.eq('client_id', args.client_id!))
        .collect();
    } else {
      incidents = await ctx.db.query('behavior_incidents').collect();
    }

    // Calculate severity counts
    const bySeverity = {
      low: incidents.filter((i) => i.severity === 'low').length,
      medium: incidents.filter((i) => i.severity === 'medium').length,
      high: incidents.filter((i) => i.severity === 'high').length,
    };

    // Calculate most common behaviors
    const behaviorCounts = new Map<string, number>();
    incidents.forEach((incident) => {
      incident.behaviors_displayed.forEach((behavior) => {
        behaviorCounts.set(behavior, (behaviorCounts.get(behavior) || 0) + 1);
      });
    });
    const mostCommonBehaviors = Array.from(behaviorCounts.entries())
      .map(([behavior, count]) => ({ behavior, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate most common locations
    const locationCounts = new Map<string, number>();
    incidents.forEach((incident) => {
      locationCounts.set(incident.location, (locationCounts.get(incident.location) || 0) + 1);
    });
    const mostCommonLocations = Array.from(locationCounts.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Count incidents with self-harm
    const incidentsWithSelfHarm = incidents.filter(
      (i) => i.self_harm_types.length > 0 && !i.self_harm_types.every((t) => t === 'no_harm')
    ).length;

    // Count incidents needing second support
    const incidentsNeedingSecondSupport = incidents.filter(
      (i) =>
        i.second_support_needed.length > 0 &&
        !i.second_support_needed.every((r) => r === 'no_additional_support_needed')
    ).length;

    // Count recent high-severity incidents (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0] || '';
    const recentHighSeverity = incidents.filter(
      (i) => i.severity === 'high' && i.incident_date >= thirtyDaysAgoStr
    ).length;

    return {
      total_incidents: incidents.length,
      by_severity: bySeverity,
      most_common_behaviors: mostCommonBehaviors,
      most_common_locations: mostCommonLocations,
      incidents_with_self_harm: incidentsWithSelfHarm,
      incidents_needing_second_support: incidentsNeedingSecondSupport,
      recent_high_severity: recentHighSeverity,
    };
  },
});

/**
 * Get recent high-severity incidents
 *
 * @example Flutter usage:
 * ```dart
 * final recentIncidents = await convex.query('behaviorIncidents:getRecentHighSeverity', {
 *   'days': 30,
 *   'limit': 10,
 * });
 * ```
 */
export const getRecentHighSeverity = query({
  args: {
    days: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const limit = args.limit || 10;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    const daysAgoStr = daysAgo.toISOString().split('T')[0] || '';

    const incidents = await ctx.db
      .query('behavior_incidents')
      .withIndex('by_severity', (q) => q.eq('severity', 'high'))
      .collect();

    // Filter by date
    const recentIncidents = incidents
      .filter((i) => i.incident_date >= daysAgoStr)
      .sort((a, b) => {
        const dateCompare = b.incident_date.localeCompare(a.incident_date);
        if (dateCompare !== 0) return dateCompare;
        return b.created_at.localeCompare(a.created_at);
      })
      .slice(0, limit);

    return normalizeRecords(recentIncidents);
  },
});
