/**
 * Behavior Incident Management Tools
 *
 * MCP tools for managing behavioral incidents and safety events.
 * Provides CRUD operations with validation and error handling.
 *
 * @module tools/behavior-incidents
 */

import { v4 as uuidv4 } from 'uuid';
import { StorageProvider } from '../storage/index.js';
import {
  BehaviorIncident,
  BehaviorIncidentWithDetails,
  BehaviorIncidentStats,
  Client,
  Stakeholder,
  BehaviorType,
  IncidentLocation,
} from '../models/index.js';
import {
  createBehaviorIncidentSchema,
  updateBehaviorIncidentSchema,
  behaviorIncidentListFilterSchema,
} from '../validation/index.js';
import {
  ValidationError,
  NotFoundError,
  validateWithSchema,
} from '../utils/index.js';
import { getCurrentTimestamp } from '../utils/dates.js';

/**
 * Create a new behavior incident
 *
 * @param storage - Storage provider
 * @param input - Behavior incident creation data
 * @returns Created behavior incident
 * @throws {ValidationError} If input validation fails
 * @throws {NotFoundError} If client or submitter not found
 * @throws {StorageError} If storage operation fails
 */
export async function createBehaviorIncident(
  storage: StorageProvider,
  input: unknown
): Promise<BehaviorIncident> {
  // Validate input
  const data = validateWithSchema(createBehaviorIncidentSchema, input);

  // Verify client exists
  const client = await storage.read<Client>('clients', data.client_id);
  if (!client) {
    throw new NotFoundError('Client', data.client_id);
  }

  // Verify submitter exists (check stakeholders)
  const submitter = await storage.read<Stakeholder>('stakeholders', data.submitted_by);
  if (!submitter) {
    throw new NotFoundError('Stakeholder (submitter)', data.submitted_by);
  }

  // Create behavior incident entity
  const now = getCurrentTimestamp();

  // Set submitted_at if status is 'submitted'
  const submittedAt = data.status === 'submitted' ? now : undefined;

  const incident: BehaviorIncident = {
    id: uuidv4(),
    client_id: data.client_id,
    incident_date: data.incident_date,
    submitted_by: data.submitted_by,
    submitted_for: data.submitted_for,
    submitted_for_name: data.submitted_for_name,
    location: data.location,
    location_other: data.location_other,
    activity_before: data.activity_before,
    activity_before_other: data.activity_before_other,
    behaviors_displayed: data.behaviors_displayed,
    behaviors_other: data.behaviors_other,
    duration: data.duration,
    duration_other: data.duration_other,
    severity: data.severity,
    self_harm_types: data.self_harm_types,
    self_harm_other: data.self_harm_other,
    self_harm_count: data.self_harm_count,
    initial_intervention: data.initial_intervention,
    intervention_description: data.intervention_description,
    second_support_needed: data.second_support_needed,
    second_support_description: data.second_support_description,
    detailed_description: data.detailed_description,
    status: data.status,
    submitted_at: submittedAt,
    created_at: now,
    updated_at: now,
  };

  // Save to storage
  await storage.write('behavior_incidents', incident);

  return incident;
}

/**
 * Get a behavior incident by ID with details
 *
 * @param storage - Storage provider
 * @param incidentId - Incident ID
 * @returns Behavior incident with details
 * @throws {ValidationError} If incident ID is invalid
 * @throws {NotFoundError} If incident not found
 * @throws {StorageError} If storage operation fails
 */
export async function getBehaviorIncident(
  storage: StorageProvider,
  incidentId: string
): Promise<BehaviorIncidentWithDetails> {
  if (!incidentId || typeof incidentId !== 'string') {
    throw new ValidationError('Incident ID is required', 'incident_id', 'INVALID_INCIDENT_ID');
  }

  // Get incident
  const incident = await storage.read<BehaviorIncident>('behavior_incidents', incidentId);
  if (!incident) {
    throw new NotFoundError('Behavior Incident', incidentId);
  }

  // Get client details
  const client = await storage.read<Client>('clients', incident.client_id);
  const clientName = client?.name || 'Unknown Client';

  // Get submitter details
  const submitter = await storage.read<Stakeholder>('stakeholders', incident.submitted_by);
  const submitterName = submitter?.name;

  // Build incident with details
  const incidentWithDetails: BehaviorIncidentWithDetails = {
    ...incident,
    client_name: clientName,
    submitter_name: submitterName,
  };

  return incidentWithDetails;
}

/**
 * Update a behavior incident
 *
 * @param storage - Storage provider
 * @param incidentId - Incident ID
 * @param input - Update data
 * @returns Updated behavior incident
 * @throws {ValidationError} If input validation fails
 * @throws {NotFoundError} If incident not found
 * @throws {StorageError} If storage operation fails
 */
export async function updateBehaviorIncident(
  storage: StorageProvider,
  incidentId: string,
  input: unknown
): Promise<BehaviorIncident> {
  if (!incidentId || typeof incidentId !== 'string') {
    throw new ValidationError('Incident ID is required', 'incident_id', 'INVALID_INCIDENT_ID');
  }

  // Validate input
  const data = validateWithSchema(updateBehaviorIncidentSchema, input);

  // Get existing incident
  const existing = await storage.read<BehaviorIncident>('behavior_incidents', incidentId);
  if (!existing) {
    throw new NotFoundError('Behavior Incident', incidentId);
  }

  const now = getCurrentTimestamp();

  // If status is changing to 'submitted' and not already submitted, set submitted_at
  let submittedAt = existing.submitted_at;
  if (data.status === 'submitted' && existing.status !== 'submitted') {
    submittedAt = now;
  }

  // Update fields
  const updated: BehaviorIncident = {
    ...existing,
    ...data,
    id: incidentId, // Ensure ID doesn't change
    client_id: existing.client_id, // Client cannot be changed
    created_at: existing.created_at, // Created timestamp doesn't change
    submitted_at: submittedAt,
    updated_at: now,
  };

  // Save to storage
  await storage.write('behavior_incidents', updated);

  return updated;
}

/**
 * Delete a behavior incident
 *
 * @param storage - Storage provider
 * @param incidentId - Incident ID
 * @returns Success status
 * @throws {ValidationError} If incident ID is invalid
 * @throws {NotFoundError} If incident not found
 * @throws {StorageError} If storage operation fails
 */
export async function deleteBehaviorIncident(
  storage: StorageProvider,
  incidentId: string
): Promise<boolean> {
  if (!incidentId || typeof incidentId !== 'string') {
    throw new ValidationError('Incident ID is required', 'incident_id', 'INVALID_INCIDENT_ID');
  }

  // Check if incident exists
  const exists = await storage.exists('behavior_incidents', incidentId);
  if (!exists) {
    throw new NotFoundError('Behavior Incident', incidentId);
  }

  // Delete from storage
  return await storage.delete('behavior_incidents', incidentId);
}

/**
 * List behavior incidents with optional filtering
 *
 * @param storage - Storage provider
 * @param filter - Filter options
 * @returns List of behavior incidents
 * @throws {ValidationError} If filter validation fails
 * @throws {StorageError} If storage operation fails
 */
export async function listBehaviorIncidents(
  storage: StorageProvider,
  filter?: unknown
): Promise<BehaviorIncident[]> {
  // Validate filter
  const validFilter = filter ? validateWithSchema(behaviorIncidentListFilterSchema, filter) : {};

  // Build storage filter
  const storageFilter: Partial<BehaviorIncident> = {};
  if (validFilter.client_id) {
    storageFilter.client_id = validFilter.client_id;
  }
  if (validFilter.severity) {
    storageFilter.severity = validFilter.severity;
  }
  if (validFilter.location) {
    storageFilter.location = validFilter.location;
  }
  if (validFilter.submitted_by) {
    storageFilter.submitted_by = validFilter.submitted_by;
  }

  // Get incidents
  let incidents = await storage.list<BehaviorIncident>('behavior_incidents', storageFilter, {
    sortBy: 'incident_date',
    sortOrder: 'desc',
  });

  // Apply date range filter
  if (validFilter.date_from) {
    incidents = incidents.filter((i) => i.incident_date >= validFilter.date_from!);
  }
  if (validFilter.date_to) {
    incidents = incidents.filter((i) => i.incident_date <= validFilter.date_to!);
  }

  // Apply self-harm filter
  if (validFilter.has_self_harm !== undefined) {
    incidents = incidents.filter((i) => {
      const hasSelfHarm = i.self_harm_types.length > 0 &&
        !i.self_harm_types.every(t => t === 'no_harm');
      return validFilter.has_self_harm ? hasSelfHarm : !hasSelfHarm;
    });
  }

  // Apply second support filter
  if (validFilter.needs_second_support !== undefined) {
    incidents = incidents.filter((i) => {
      const needsSupport = i.second_support_needed.length > 0 &&
        !i.second_support_needed.every(r => r === 'no_additional_support_needed');
      return validFilter.needs_second_support ? needsSupport : !needsSupport;
    });
  }

  // Apply pagination
  const offset = validFilter.offset || 0;
  const limit = validFilter.limit || 20;

  return incidents.slice(offset, offset + limit);
}

/**
 * Get behavior incident statistics
 *
 * @param storage - Storage provider
 * @param clientId - Optional client ID to filter stats
 * @returns Behavior incident statistics
 * @throws {StorageError} If storage operation fails
 */
export async function getBehaviorIncidentStats(
  storage: StorageProvider,
  clientId?: string
): Promise<BehaviorIncidentStats> {
  // Get incidents
  const filter: Partial<BehaviorIncident> = clientId ? { client_id: clientId } : {};
  const incidents = await storage.list<BehaviorIncident>('behavior_incidents', filter);

  // Calculate severity counts
  const bySeverity = {
    low: incidents.filter((i) => i.severity === 'low').length,
    medium: incidents.filter((i) => i.severity === 'medium').length,
    high: incidents.filter((i) => i.severity === 'high').length,
  };

  // Calculate most common behaviors
  const behaviorCounts = new Map<BehaviorType, number>();
  incidents.forEach((incident) => {
    incident.behaviors_displayed.forEach((behavior) => {
      behaviorCounts.set(behavior, (behaviorCounts.get(behavior) || 0) + 1);
    });
  });
  const mostCommonBehaviors = Array.from(behaviorCounts.entries())
    .map(([behavior, count]) => ({ behavior, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5

  // Calculate most common locations
  const locationCounts = new Map<IncidentLocation, number>();
  incidents.forEach((incident) => {
    locationCounts.set(incident.location, (locationCounts.get(incident.location) || 0) + 1);
  });
  const mostCommonLocations = Array.from(locationCounts.entries())
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5

  // Count incidents with self-harm
  const incidentsWithSelfHarm = incidents.filter(
    (i) => i.self_harm_types.length > 0 && !i.self_harm_types.every(t => t === 'no_harm')
  ).length;

  // Count incidents needing second support
  const incidentsNeedingSecondSupport = incidents.filter(
    (i) => i.second_support_needed.length > 0 &&
      !i.second_support_needed.every(r => r === 'no_additional_support_needed')
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
}
