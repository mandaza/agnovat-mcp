/**
 * Client Model
 *
 * Represents an NDIS participant receiving support services.
 * Contains personal information, NDIS details, and support preferences.
 *
 * @module models/client
 */

/**
 * Client entity representing an NDIS participant
 *
 * @interface Client
 * @property {string} id - Unique identifier (UUID v4)
 * @property {string} name - Full name of the client
 * @property {string} date_of_birth - Date of birth in ISO 8601 format (YYYY-MM-DD)
 * @property {string} [ndis_number] - NDIS participant number (11 digits, optional)
 * @property {string} [primary_contact] - Primary contact person details (optional)
 * @property {string} [support_notes] - General support notes and preferences (optional)
 * @property {boolean} active - Whether the client is currently active
 * @property {string} created_at - Timestamp when client was created (ISO 8601)
 * @property {string} updated_at - Timestamp when client was last updated (ISO 8601)
 */
export interface Client {
  id: string;
  name: string;
  date_of_birth: string;
  ndis_number?: string;
  primary_contact?: string;
  support_notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Input data for creating a new client
 *
 * @interface CreateClientInput
 * @property {string} name - Full name of the client (required)
 * @property {string} date_of_birth - Date of birth in ISO 8601 format (required)
 * @property {string} [ndis_number] - NDIS participant number (optional)
 * @property {string} [primary_contact] - Primary contact person details (optional)
 * @property {string} [support_notes] - General support notes (optional)
 */
export interface CreateClientInput {
  name: string;
  date_of_birth: string;
  ndis_number?: string;
  primary_contact?: string;
  support_notes?: string;
}

/**
 * Input data for updating an existing client
 *
 * All fields are optional to allow partial updates.
 *
 * @interface UpdateClientInput
 * @property {string} [name] - Updated full name
 * @property {string} [date_of_birth] - Updated date of birth
 * @property {string} [ndis_number] - Updated NDIS number
 * @property {string} [primary_contact] - Updated primary contact
 * @property {string} [support_notes] - Updated support notes
 * @property {boolean} [active] - Updated active status
 */
export interface UpdateClientInput {
  name?: string;
  date_of_birth?: string;
  ndis_number?: string;
  primary_contact?: string;
  support_notes?: string;
  active?: boolean;
}

/**
 * Client with summary statistics
 *
 * Extended client information including computed statistics
 * about goals, activities, and recent engagements.
 *
 * @interface ClientWithStats
 * @extends Client
 * @property {number} total_goals - Total number of goals
 * @property {number} active_goals - Number of active (not achieved/discontinued) goals
 * @property {number} total_activities - Total number of activities
 * @property {string} [last_activity_date] - Date of most recent activity (ISO 8601)
 * @property {string} [last_shift_note_date] - Date of most recent shift note (ISO 8601)
 */
export interface ClientWithStats extends Client {
  total_goals: number;
  active_goals: number;
  total_activities: number;
  last_activity_date?: string;
  last_shift_note_date?: string;
}

/**
 * Filter options for listing clients
 *
 * @interface ClientListFilter
 * @property {boolean} [active] - Filter by active status
 * @property {string} [search] - Search term for name matching
 * @property {number} [limit] - Maximum number of results to return
 * @property {number} [offset] - Number of results to skip (for pagination)
 */
export interface ClientListFilter {
  active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}
