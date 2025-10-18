/**
 * Client Management Tools
 *
 * MCP tools for managing NDIS participant (client) records.
 * Provides CRUD operations with validation and error handling.
 *
 * @module tools/clients
 */

import { v4 as uuidv4 } from 'uuid';
import { StorageProvider } from '../storage/index.js';
import { Client, ClientWithStats, Goal, Activity, ShiftNote } from '../models/index.js';
import {
  createClientSchema,
  updateClientSchema,
  clientListFilterSchema,
} from '../validation/index.js';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  validateWithSchema,
} from '../utils/index.js';
import { getCurrentTimestamp } from '../utils/dates.js';

/**
 * Create a new client
 *
 * @param storage - Storage provider
 * @param input - Client creation data
 * @returns Created client
 * @throws {ValidationError} If input validation fails
 * @throws {ConflictError} If NDIS number already exists
 * @throws {StorageError} If storage operation fails
 */
export async function createClient(storage: StorageProvider, input: unknown): Promise<Client> {
  // Validate input
  const data = validateWithSchema(createClientSchema, input);

  // Check for duplicate NDIS number if provided
  if (data.ndis_number) {
    const existingClients = await storage.list<Client>('clients');
    const duplicate = existingClients.find((c) => c.ndis_number === data.ndis_number && c.active);

    if (duplicate) {
      throw new ConflictError(
        'A client with this NDIS number already exists',
        'DUPLICATE_NDIS_NUMBER',
        { ndis_number: data.ndis_number }
      );
    }
  }

  // Create client entity
  const now = getCurrentTimestamp();
  const client: Client = {
    id: uuidv4(),
    name: data.name,
    date_of_birth: data.date_of_birth,
    ndis_number: data.ndis_number,
    primary_contact: data.primary_contact,
    support_notes: data.support_notes,
    active: true,
    created_at: now,
    updated_at: now,
  };

  // Save to storage
  await storage.write('clients', client);

  return client;
}

/**
 * Get a client by ID with summary statistics
 *
 * @param storage - Storage provider
 * @param clientId - Client ID
 * @returns Client with stats
 * @throws {ValidationError} If client ID is invalid
 * @throws {NotFoundError} If client not found
 * @throws {StorageError} If storage operation fails
 */
export async function getClient(
  storage: StorageProvider,
  clientId: string
): Promise<ClientWithStats> {
  if (!clientId || typeof clientId !== 'string') {
    throw new ValidationError('Client ID is required', 'client_id', 'INVALID_CLIENT_ID');
  }

  // Get client
  const client = await storage.read<Client>('clients', clientId);
  if (!client) {
    throw new NotFoundError('Client', clientId);
  }

  // Get goals for this client
  const goals = await storage.list<Goal>('goals', { client_id: clientId } as Partial<Goal>);
  const activeGoals = goals.filter((g) => !g.archived);

  // Get activities for this client
  const activities = await storage.list<Activity>('activities', {
    client_id: clientId,
  } as Partial<Activity>);

  // Get last activity date
  const sortedActivities = activities.sort((a, b) =>
    b.activity_date.localeCompare(a.activity_date)
  );
  const lastActivityDate = sortedActivities[0]?.activity_date;

  // Get shift notes for this client
  const shiftNotes = await storage.list<ShiftNote>('shift_notes', {
    client_id: clientId,
  } as Partial<ShiftNote>);
  const sortedShiftNotes = shiftNotes.sort((a, b) => b.shift_date.localeCompare(a.shift_date));
  const lastShiftNoteDate = sortedShiftNotes[0]?.shift_date;

  // Build client with stats
  const clientWithStats: ClientWithStats = {
    ...client,
    total_goals: goals.length,
    active_goals: activeGoals.length,
    total_activities: activities.length,
    last_activity_date: lastActivityDate,
    last_shift_note_date: lastShiftNoteDate,
  };

  return clientWithStats;
}

/**
 * List clients with optional filtering
 *
 * @param storage - Storage provider
 * @param filter - Filter options
 * @returns List of clients
 * @throws {ValidationError} If filter validation fails
 * @throws {StorageError} If storage operation fails
 */
export async function listClients(storage: StorageProvider, filter?: unknown): Promise<Client[]> {
  // Validate filter
  const validFilter = filter ? validateWithSchema(clientListFilterSchema, filter) : {};

  // Build storage filter
  const storageFilter: Partial<Client> = {};
  if (validFilter.active !== undefined) {
    storageFilter.active = validFilter.active;
  }

  // Get clients
  let clients = await storage.list<Client>('clients', storageFilter, {
    sortBy: 'name',
    sortOrder: 'asc',
    limit: validFilter.limit,
    offset: validFilter.offset,
  });

  // Apply search filter if provided
  if (validFilter.search) {
    const searchLower = validFilter.search.toLowerCase();
    clients = clients.filter((client) => client.name.toLowerCase().includes(searchLower));
  }

  return clients;
}

/**
 * Update a client
 *
 * @param storage - Storage provider
 * @param clientId - Client ID
 * @param input - Update data
 * @returns Updated client
 * @throws {ValidationError} If validation fails
 * @throws {NotFoundError} If client not found
 * @throws {ConflictError} If NDIS number conflict
 * @throws {StorageError} If storage operation fails
 */
export async function updateClient(
  storage: StorageProvider,
  clientId: string,
  input: unknown
): Promise<Client> {
  if (!clientId || typeof clientId !== 'string') {
    throw new ValidationError('Client ID is required', 'client_id', 'INVALID_CLIENT_ID');
  }

  // Validate input
  const data = validateWithSchema(updateClientSchema, input);

  // Get existing client
  const client = await storage.read<Client>('clients', clientId);
  if (!client) {
    throw new NotFoundError('Client', clientId);
  }

  // Check for NDIS number conflict if changing
  if (data.ndis_number && data.ndis_number !== client.ndis_number) {
    const existingClients = await storage.list<Client>('clients');
    const duplicate = existingClients.find(
      (c) => c.id !== clientId && c.ndis_number === data.ndis_number && c.active
    );

    if (duplicate) {
      throw new ConflictError(
        'Another client with this NDIS number already exists',
        'DUPLICATE_NDIS_NUMBER',
        { ndis_number: data.ndis_number }
      );
    }
  }

  // Apply updates
  const updatedClient: Client = {
    ...client,
    ...data,
    updated_at: getCurrentTimestamp(),
  };

  // Save to storage
  await storage.write('clients', updatedClient);

  return updatedClient;
}

/**
 * Search clients by name
 *
 * This is a convenience function that uses listClients with search filter.
 *
 * @param storage - Storage provider
 * @param searchTerm - Search term
 * @returns List of matching clients
 * @throws {ValidationError} If search term is invalid
 * @throws {StorageError} If storage operation fails
 */
export async function searchClients(
  storage: StorageProvider,
  searchTerm: string
): Promise<Client[]> {
  if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
    throw new ValidationError(
      'Search term is required and must be non-empty',
      'search_term',
      'INVALID_SEARCH_TERM'
    );
  }

  return listClients(storage, { search: searchTerm.trim() });
}

/**
 * Deactivate a client
 *
 * Soft delete - sets active flag to false.
 * Prevents deactivation if client has active goals.
 *
 * @param storage - Storage provider
 * @param clientId - Client ID
 * @returns Deactivated client
 * @throws {ValidationError} If client ID is invalid
 * @throws {NotFoundError} If client not found
 * @throws {ConflictError} If client has active goals
 * @throws {StorageError} If storage operation fails
 */
export async function deactivateClient(
  storage: StorageProvider,
  clientId: string
): Promise<Client> {
  if (!clientId || typeof clientId !== 'string') {
    throw new ValidationError('Client ID is required', 'client_id', 'INVALID_CLIENT_ID');
  }

  // Get client
  const client = await storage.read<Client>('clients', clientId);
  if (!client) {
    throw new NotFoundError('Client', clientId);
  }

  // Check for active goals
  const goals = await storage.list<Goal>('goals', { client_id: clientId } as Partial<Goal>);
  const activeGoals = goals.filter((g) => !g.archived);

  if (activeGoals.length > 0) {
    throw new ConflictError(
      'Cannot deactivate client with active goals',
      'CLIENT_HAS_ACTIVE_GOALS',
      { active_goals_count: activeGoals.length }
    );
  }

  // Deactivate
  const deactivatedClient: Client = {
    ...client,
    active: false,
    updated_at: getCurrentTimestamp(),
  };

  await storage.write('clients', deactivatedClient);

  return deactivatedClient;
}
