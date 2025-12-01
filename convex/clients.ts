/**
 * Client Convex Functions
 *
 * Type-safe Convex functions for managing NDIS participant (client) records.
 * These functions can be called directly from Flutter via the Convex Dart client.
 *
 * @module convex/clients
 */

import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import {
  isValidDate,
  isValidNdisNumber,
  getCurrentTimestamp,
  ValidationError,
  NotFoundError,
  ConflictError,
  normalizeRecord,
  normalizeRecords,
} from './lib/validation';

/**
 * Create a new client
 *
 * @example Flutter usage:
 * ```dart
 * final client = await convex.mutation('clients:create', {
 *   'name': 'John Doe',
 *   'date_of_birth': '1990-01-15',
 *   'ndis_number': '12345678901',
 * });
 * ```
 */
export const create = mutation({
  args: {
    name: v.string(),
    date_of_birth: v.string(),
    ndis_number: v.optional(v.string()),
    primary_contact: v.optional(v.string()),
    support_notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate name
    if (!args.name || args.name.trim().length === 0) {
      throw new ValidationError('Name is required');
    }

    // Validate date of birth
    if (!isValidDate(args.date_of_birth)) {
      throw new ValidationError('Date of birth must be in YYYY-MM-DD format');
    }

    // Validate NDIS number if provided
    if (args.ndis_number && !isValidNdisNumber(args.ndis_number)) {
      throw new ValidationError('NDIS number must be exactly 11 digits');
    }

    // Check for duplicate NDIS number
    if (args.ndis_number) {
      const existingClient = await ctx.db
        .query('clients')
        .withIndex('by_ndis_number', (q) => q.eq('ndis_number', args.ndis_number))
        .first();

      if (existingClient && existingClient.active) {
        throw new ConflictError('A client with this NDIS number already exists');
      }
    }

    // Create client
    const now = getCurrentTimestamp();
    const clientId = await ctx.db.insert('clients', {
      name: args.name,
      date_of_birth: args.date_of_birth,
      ndis_number: args.ndis_number,
      primary_contact: args.primary_contact,
      support_notes: args.support_notes,
      active: true,
      created_at: now,
      updated_at: now,
    });

    const client = await ctx.db.get(clientId);
    return normalizeRecord(client!);
  },
});

/**
 * Get a client by ID with summary statistics
 *
 * @example Flutter usage:
 * ```dart
 * final clientWithStats = await convex.query('clients:get', {
 *   'id': 'client-id-here',
 * });
 * ```
 */
export const get = query({
  args: {
    id: v.id('clients'),
  },
  handler: async (ctx, args) => {
    // Get client
    const client = await ctx.db.get(args.id);
    if (!client) {
      throw new NotFoundError(`Client with ID ${args.id} not found`);
    }

    // Get goals for this client
    const allGoals = await ctx.db
      .query('goals')
      .withIndex('by_client', (q) => q.eq('client_id', args.id))
      .collect();

    const totalGoals = allGoals.length;
    const activeGoals = allGoals.filter((g) => !g.archived).length;

    // Get activities for this client
    const activities = await ctx.db
      .query('activities')
      .withIndex('by_client', (q) => q.eq('client_id', args.id))
      .collect();

    const totalActivities = activities.length;

    // Get shift notes for this client
    const shiftNotes = await ctx.db
      .query('shift_notes')
      .withIndex('by_client', (q) => q.eq('client_id', args.id))
      .collect();

    // Sort by shift_date descending
    const sortedShiftNotes = shiftNotes.sort((a, b) =>
      b.shift_date.localeCompare(a.shift_date)
    );
    const lastShiftNoteDate = sortedShiftNotes[0]?.shift_date;

    // Return client with stats
    return {
      ...normalizeRecord(client),
      total_goals: totalGoals,
      active_goals: activeGoals,
      total_activities: totalActivities,
      last_shift_note_date: lastShiftNoteDate,
    };
  },
});

/**
 * List clients with optional filtering
 *
 * @example Flutter usage:
 * ```dart
 * final clients = await convex.query('clients:list', {
 *   'active': true,
 *   'search': 'John',
 *   'limit': 20,
 *   'offset': 0,
 * });
 * ```
 */
export const list = query({
  args: {
    active: v.optional(v.boolean()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let clients;

    // Use index if filtering by active status
    if (args.active !== undefined) {
      clients = await ctx.db
        .query('clients')
        .withIndex('by_active', (q) => q.eq('active', args.active!))
        .collect();
    } else {
      clients = await ctx.db.query('clients').collect();
    }

    // Apply search filter
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      clients = clients.filter((c) =>
        c.name.toLowerCase().includes(searchLower)
      );
    }

    // Sort by name
    clients.sort((a, b) => a.name.localeCompare(b.name));

    // Apply pagination
    const offset = args.offset ?? 0;
    const limit = args.limit;

    if (limit) {
      clients = clients.slice(offset, offset + limit);
    } else if (offset > 0) {
      clients = clients.slice(offset);
    }

    return normalizeRecords(clients);
  },
});

/**
 * Update a client
 *
 * @example Flutter usage:
 * ```dart
 * final updatedClient = await convex.mutation('clients:update', {
 *   'id': 'client-id-here',
 *   'support_notes': 'Updated notes',
 * });
 * ```
 */
export const update = mutation({
  args: {
    id: v.id('clients'),
    name: v.optional(v.string()),
    date_of_birth: v.optional(v.string()),
    ndis_number: v.optional(v.string()),
    primary_contact: v.optional(v.string()),
    support_notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get existing client
    const existingClient = await ctx.db.get(args.id);
    if (!existingClient) {
      throw new NotFoundError(`Client with ID ${args.id} not found`);
    }

    // Validate date of birth if provided
    if (args.date_of_birth && !isValidDate(args.date_of_birth)) {
      throw new ValidationError('Date of birth must be in YYYY-MM-DD format');
    }

    // Validate NDIS number if provided
    if (args.ndis_number && !isValidNdisNumber(args.ndis_number)) {
      throw new ValidationError('NDIS number must be exactly 11 digits');
    }

    // Check for duplicate NDIS number
    if (args.ndis_number && args.ndis_number !== existingClient.ndis_number) {
      const duplicateClient = await ctx.db
        .query('clients')
        .withIndex('by_ndis_number', (q) => q.eq('ndis_number', args.ndis_number!))
        .first();

      if (duplicateClient && duplicateClient._id !== args.id && duplicateClient.active) {
        throw new ConflictError('A client with this NDIS number already exists');
      }
    }

    // Build update object (only include provided fields)
    const updates: any = {
      updated_at: getCurrentTimestamp(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.date_of_birth !== undefined) updates.date_of_birth = args.date_of_birth;
    if (args.ndis_number !== undefined) updates.ndis_number = args.ndis_number;
    if (args.primary_contact !== undefined) updates.primary_contact = args.primary_contact;
    if (args.support_notes !== undefined) updates.support_notes = args.support_notes;

    // Update client
    await ctx.db.patch(args.id, updates);

    const updatedClient = await ctx.db.get(args.id);
    return normalizeRecord(updatedClient!);
  },
});

/**
 * Deactivate a client (soft delete)
 *
 * @example Flutter usage:
 * ```dart
 * final deactivatedClient = await convex.mutation('clients:deactivate', {
 *   'id': 'client-id-here',
 * });
 * ```
 */
export const deactivate = mutation({
  args: {
    id: v.id('clients'),
  },
  handler: async (ctx, args) => {
    // Get client
    const client = await ctx.db.get(args.id);
    if (!client) {
      throw new NotFoundError(`Client with ID ${args.id} not found`);
    }

    // Update to inactive
    await ctx.db.patch(args.id, {
      active: false,
      updated_at: getCurrentTimestamp(),
    });

    const updatedClient = await ctx.db.get(args.id);
    return normalizeRecord(updatedClient!);
  },
});

/**
 * Search clients by name
 *
 * @example Flutter usage:
 * ```dart
 * final clients = await convex.query('clients:search', {
 *   'search_term': 'John',
 * });
 * ```
 */
export const search = query({
  args: {
    search_term: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.search_term || args.search_term.trim().length === 0) {
      throw new ValidationError('Search term is required');
    }

    // Get all clients (could be optimized with full-text search index)
    const allClients = await ctx.db.query('clients').collect();

    // Filter by search term
    const searchLower = args.search_term.toLowerCase();
    const matchingClients = allClients.filter((client) =>
      client.name.toLowerCase().includes(searchLower)
    );

    // Sort by name
    matchingClients.sort((a, b) => a.name.localeCompare(b.name));

    return normalizeRecords(matchingClients);
  },
});
