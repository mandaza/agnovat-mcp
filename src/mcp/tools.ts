/**
 * MCP Tool Registration
 *
 * Registers all NDIS management tools with the MCP server.
 * Maps tool handlers to MCP protocol schemas.
 *
 * @module mcp/tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { StorageProvider } from '../storage/index.js';
import * as clientTools from '../tools/clients.js';
import * as goalTools from '../tools/goals.js';
import * as activityTools from '../tools/activities.js';
import * as stakeholderTools from '../tools/stakeholders.js';
import * as shiftNoteTools from '../tools/shift-notes.js';
import * as dashboardTools from '../tools/dashboard.js';
import { logger } from '../utils/logger.js';
import { ApplicationError } from '../utils/errors.js';

/**
 * Tool definitions with MCP schemas
 */
const toolDefinitions = [
  // Client Tools
  {
    name: 'create_client',
    description: 'Create a new client profile with personal details and support information',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Full name of the client' },
        date_of_birth: { type: 'string', description: 'Date of birth (ISO format YYYY-MM-DD)' },
        ndis_number: { type: 'string', description: 'NDIS participant number (11 digits)', optional: true },
        primary_contact: { type: 'string', description: 'Primary contact information', optional: true },
        support_notes: { type: 'string', description: 'General support notes', optional: true },
      },
      required: ['name', 'date_of_birth'],
    },
  },
  {
    name: 'get_client',
    description: 'Retrieve a client profile with summary statistics',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Client ID (UUID)' },
      },
      required: ['client_id'],
    },
  },
  {
    name: 'list_clients',
    description: 'List all clients with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        active: { type: 'boolean', description: 'Filter by active status', optional: true },
        search: { type: 'string', description: 'Search by name', optional: true },
        limit: { type: 'number', description: 'Maximum number of results', optional: true },
        offset: { type: 'number', description: 'Pagination offset', optional: true },
      },
    },
  },
  {
    name: 'update_client',
    description: 'Update client information',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Client ID (UUID)' },
        name: { type: 'string', description: 'Full name', optional: true },
        date_of_birth: { type: 'string', description: 'Date of birth (ISO format)', optional: true },
        ndis_number: { type: 'string', description: 'NDIS number', optional: true },
        primary_contact: { type: 'string', description: 'Primary contact', optional: true },
        support_notes: { type: 'string', description: 'Support notes', optional: true },
      },
      required: ['client_id'],
    },
  },
  {
    name: 'deactivate_client',
    description: 'Deactivate a client (soft delete)',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Client ID (UUID)' },
      },
      required: ['client_id'],
    },
  },
  {
    name: 'search_clients',
    description: 'Search clients by name',
    inputSchema: {
      type: 'object',
      properties: {
        search_term: { type: 'string', description: 'Search term' },
      },
      required: ['search_term'],
    },
  },

  // Goal Tools
  {
    name: 'create_goal',
    description: 'Create a new goal for a client',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Client ID (UUID)' },
        title: { type: 'string', description: 'Goal title' },
        description: { type: 'string', description: 'Detailed description', optional: true },
        category: {
          type: 'string',
          description: 'Goal category',
          enum: [
            'daily_living',
            'social_community',
            'employment',
            'health_wellbeing',
            'home',
            'lifelong_learning',
            'relationships',
          ],
        },
        target_date: { type: 'string', description: 'Target completion date (ISO format)' },
        milestones: {
          type: 'array',
          description: 'List of milestones',
          items: { type: 'string' },
          optional: true,
        },
      },
      required: ['client_id', 'title', 'category', 'target_date'],
    },
  },
  {
    name: 'get_goal',
    description: 'Retrieve a goal with details',
    inputSchema: {
      type: 'object',
      properties: {
        goal_id: { type: 'string', description: 'Goal ID (UUID)' },
      },
      required: ['goal_id'],
    },
  },
  {
    name: 'list_goals',
    description: 'List goals with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Filter by client ID', optional: true },
        status: {
          type: 'string',
          description: 'Filter by status',
          enum: ['not_started', 'in_progress', 'achieved', 'on_hold', 'discontinued'],
          optional: true,
        },
        category: { type: 'string', description: 'Filter by category', optional: true },
        archived: { type: 'boolean', description: 'Include archived goals', optional: true },
        limit: { type: 'number', description: 'Maximum number of results', optional: true },
        offset: { type: 'number', description: 'Pagination offset', optional: true },
      },
    },
  },
  {
    name: 'update_goal',
    description: 'Update goal information',
    inputSchema: {
      type: 'object',
      properties: {
        goal_id: { type: 'string', description: 'Goal ID (UUID)' },
        title: { type: 'string', description: 'Goal title', optional: true },
        description: { type: 'string', description: 'Description', optional: true },
        status: { type: 'string', description: 'Goal status', optional: true },
        target_date: { type: 'string', description: 'Target date', optional: true },
        milestones: { type: 'array', items: { type: 'string' }, optional: true },
      },
      required: ['goal_id'],
    },
  },
  {
    name: 'update_goal_progress',
    description: 'Update goal progress and status',
    inputSchema: {
      type: 'object',
      properties: {
        goal_id: { type: 'string', description: 'Goal ID (UUID)' },
        progress_percentage: {
          type: 'number',
          description: 'Progress percentage (0-100)',
          optional: true,
        },
        status: { type: 'string', description: 'Goal status', optional: true },
        notes: { type: 'string', description: 'Progress notes', optional: true },
      },
      required: ['goal_id'],
    },
  },
  {
    name: 'archive_goal',
    description: 'Archive a goal (soft delete)',
    inputSchema: {
      type: 'object',
      properties: {
        goal_id: { type: 'string', description: 'Goal ID (UUID)' },
      },
      required: ['goal_id'],
    },
  },

  // Activity Tools
  {
    name: 'create_activity',
    description: 'Create a new activity for a client',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Client ID (UUID)' },
        stakeholder_id: { type: 'string', description: 'Stakeholder ID (UUID)' },
        title: { type: 'string', description: 'Activity title' },
        description: { type: 'string', description: 'Activity description', optional: true },
        activity_type: {
          type: 'string',
          description: 'Activity type',
          enum: [
            'life_skills',
            'social_community',
            'transport',
            'health_medical',
            'therapy',
            'coordination',
            'other',
          ],
        },
        activity_date: { type: 'string', description: 'Activity date (ISO format YYYY-MM-DD)' },
        start_time: { type: 'string', description: 'Start time (HH:MM)', optional: true },
        end_time: { type: 'string', description: 'End time (HH:MM)', optional: true },
        duration_minutes: { type: 'number', description: 'Duration in minutes', optional: true },
        status: {
          type: 'string',
          description: 'Activity status',
          enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
          optional: true,
        },
        goal_ids: {
          type: 'array',
          description: 'Linked goal IDs',
          items: { type: 'string' },
          optional: true,
        },
        outcome_notes: { type: 'string', description: 'Outcome notes', optional: true },
      },
      required: ['client_id', 'stakeholder_id', 'title', 'activity_type', 'activity_date'],
    },
  },
  {
    name: 'get_activity',
    description: 'Retrieve an activity with details',
    inputSchema: {
      type: 'object',
      properties: {
        activity_id: { type: 'string', description: 'Activity ID (UUID)' },
      },
      required: ['activity_id'],
    },
  },
  {
    name: 'list_activities',
    description: 'List activities with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Filter by client ID', optional: true },
        stakeholder_id: { type: 'string', description: 'Filter by stakeholder ID', optional: true },
        activity_type: { type: 'string', description: 'Filter by activity type', optional: true },
        status: { type: 'string', description: 'Filter by status', optional: true },
        goal_id: { type: 'string', description: 'Filter by linked goal', optional: true },
        date_from: { type: 'string', description: 'Start date filter (ISO format)', optional: true },
        date_to: { type: 'string', description: 'End date filter (ISO format)', optional: true },
        limit: { type: 'number', description: 'Maximum number of results', optional: true },
        offset: { type: 'number', description: 'Pagination offset', optional: true },
      },
    },
  },
  {
    name: 'update_activity',
    description: 'Update activity information',
    inputSchema: {
      type: 'object',
      properties: {
        activity_id: { type: 'string', description: 'Activity ID (UUID)' },
        title: { type: 'string', description: 'Activity title', optional: true },
        description: { type: 'string', description: 'Description', optional: true },
        status: { type: 'string', description: 'Activity status', optional: true },
        start_time: { type: 'string', description: 'Start time', optional: true },
        end_time: { type: 'string', description: 'End time', optional: true },
        duration_minutes: { type: 'number', description: 'Duration in minutes', optional: true },
        goal_ids: { type: 'array', items: { type: 'string' }, optional: true },
        outcome_notes: { type: 'string', description: 'Outcome notes', optional: true },
      },
      required: ['activity_id'],
    },
  },
  {
    name: 'get_activities_by_date_range',
    description: 'Get activities within a date range',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'Start date (ISO format)' },
        end_date: { type: 'string', description: 'End date (ISO format)' },
        client_id: { type: 'string', description: 'Filter by client ID', optional: true },
      },
      required: ['start_date', 'end_date'],
    },
  },
  {
    name: 'get_upcoming_activities',
    description: 'Get upcoming scheduled activities',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Number of days to look ahead (default: 7)', optional: true },
        client_id: { type: 'string', description: 'Filter by client ID', optional: true },
      },
    },
  },

  // Stakeholder Tools
  {
    name: 'create_stakeholder',
    description: 'Create a new stakeholder (support worker, coordinator, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Stakeholder name' },
        role: {
          type: 'string',
          description: 'Stakeholder role',
          enum: [
            'support_worker',
            'support_coordinator',
            'plan_manager',
            'allied_health',
            'team_leader',
            'other',
          ],
        },
        email: { type: 'string', description: 'Email address', optional: true },
        phone: { type: 'string', description: 'Phone number', optional: true },
        organization: { type: 'string', description: 'Organization name', optional: true },
        notes: { type: 'string', description: 'Additional notes', optional: true },
      },
      required: ['name', 'role'],
    },
  },
  {
    name: 'get_stakeholder',
    description: 'Retrieve stakeholder with activity summary',
    inputSchema: {
      type: 'object',
      properties: {
        stakeholder_id: { type: 'string', description: 'Stakeholder ID (UUID)' },
      },
      required: ['stakeholder_id'],
    },
  },
  {
    name: 'list_stakeholders',
    description: 'List stakeholders with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        role: { type: 'string', description: 'Filter by role', optional: true },
        active: { type: 'boolean', description: 'Filter by active status', optional: true },
        search: { type: 'string', description: 'Search by name', optional: true },
        limit: { type: 'number', description: 'Maximum number of results', optional: true },
        offset: { type: 'number', description: 'Pagination offset', optional: true },
      },
    },
  },
  {
    name: 'update_stakeholder',
    description: 'Update stakeholder information',
    inputSchema: {
      type: 'object',
      properties: {
        stakeholder_id: { type: 'string', description: 'Stakeholder ID (UUID)' },
        name: { type: 'string', description: 'Stakeholder name', optional: true },
        role: { type: 'string', description: 'Role', optional: true },
        email: { type: 'string', description: 'Email', optional: true },
        phone: { type: 'string', description: 'Phone', optional: true },
        organization: { type: 'string', description: 'Organization', optional: true },
        notes: { type: 'string', description: 'Notes', optional: true },
      },
      required: ['stakeholder_id'],
    },
  },
  {
    name: 'deactivate_stakeholder',
    description: 'Deactivate a stakeholder (soft delete)',
    inputSchema: {
      type: 'object',
      properties: {
        stakeholder_id: { type: 'string', description: 'Stakeholder ID (UUID)' },
      },
      required: ['stakeholder_id'],
    },
  },
  {
    name: 'search_stakeholders',
    description: 'Search stakeholders by name',
    inputSchema: {
      type: 'object',
      properties: {
        search_term: { type: 'string', description: 'Search term' },
      },
      required: ['search_term'],
    },
  },

  // Shift Note Tools
  {
    name: 'create_shift_note',
    description: 'Create a new shift note with activity and goal progress documentation',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Client ID (UUID)' },
        stakeholder_id: { type: 'string', description: 'Stakeholder ID (UUID)' },
        shift_date: { type: 'string', description: 'Shift date (ISO format YYYY-MM-DD)' },
        start_time: { type: 'string', description: 'Shift start time (HH:MM)' },
        end_time: { type: 'string', description: 'Shift end time (HH:MM)' },
        general_observations: { type: 'string', description: 'General observations' },
        activity_ids: {
          type: 'array',
          description: 'Linked activity IDs',
          items: { type: 'string' },
          optional: true,
        },
        goals_progress: {
          type: 'array',
          description: 'Goal progress entries',
          items: {
            type: 'object',
            properties: {
              goal_id: { type: 'string' },
              progress_notes: { type: 'string' },
              progress_observed: { type: 'number' },
            },
          },
          optional: true,
        },
        mood_wellbeing: { type: 'string', description: 'Mood and wellbeing notes', optional: true },
        communication_notes: { type: 'string', description: 'Communication notes', optional: true },
        health_safety_notes: { type: 'string', description: 'Health and safety notes', optional: true },
        handover_notes: { type: 'string', description: 'Handover notes', optional: true },
        incidents: {
          type: 'array',
          description: 'Incident reports',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              action_taken: { type: 'string' },
              severity: { type: 'string' },
            },
          },
          optional: true,
        },
      },
      required: ['client_id', 'stakeholder_id', 'shift_date', 'start_time', 'end_time', 'general_observations'],
    },
  },
  {
    name: 'get_shift_note',
    description: 'Retrieve a shift note with details',
    inputSchema: {
      type: 'object',
      properties: {
        shift_note_id: { type: 'string', description: 'Shift note ID (UUID)' },
      },
      required: ['shift_note_id'],
    },
  },
  {
    name: 'list_shift_notes',
    description: 'List shift notes with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Filter by client ID', optional: true },
        stakeholder_id: { type: 'string', description: 'Filter by stakeholder ID', optional: true },
        date_from: { type: 'string', description: 'Start date filter (ISO format)', optional: true },
        date_to: { type: 'string', description: 'End date filter (ISO format)', optional: true },
        limit: { type: 'number', description: 'Maximum number of results', optional: true },
        offset: { type: 'number', description: 'Pagination offset', optional: true },
      },
    },
  },
  {
    name: 'update_shift_note',
    description: 'Update a shift note (only within 24 hours)',
    inputSchema: {
      type: 'object',
      properties: {
        shift_note_id: { type: 'string', description: 'Shift note ID (UUID)' },
        general_observations: { type: 'string', description: 'General observations', optional: true },
        activity_ids: { type: 'array', items: { type: 'string' }, optional: true },
        goals_progress: { type: 'array', items: { type: 'object' }, optional: true },
        mood_wellbeing: { type: 'string', description: 'Mood and wellbeing notes', optional: true },
        communication_notes: { type: 'string', description: 'Communication notes', optional: true },
        health_safety_notes: { type: 'string', description: 'Health and safety notes', optional: true },
        handover_notes: { type: 'string', description: 'Handover notes', optional: true },
        incidents: { type: 'array', items: { type: 'object' }, optional: true },
      },
      required: ['shift_note_id'],
    },
  },
  {
    name: 'get_recent_shift_notes',
    description: 'Get recent shift notes',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of shift notes (default: 10)', optional: true },
        client_id: { type: 'string', description: 'Filter by client ID', optional: true },
      },
    },
  },
  {
    name: 'get_shift_notes_for_week',
    description: 'Get shift notes for a specific week',
    inputSchema: {
      type: 'object',
      properties: {
        week_start_date: { type: 'string', description: 'Week start date (ISO format, typically Monday)' },
        client_id: { type: 'string', description: 'Filter by client ID', optional: true },
      },
      required: ['week_start_date'],
    },
  },

  // Dashboard Tools
  {
    name: 'get_dashboard',
    description: 'Get complete dashboard with aggregated metrics and recent activity',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_client_summary',
    description: 'Get quick overview of a client with goal progress',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Client ID (UUID)' },
      },
      required: ['client_id'],
    },
  },
  {
    name: 'get_statistics',
    description: 'Get high-level statistics overview',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * Tool handler mapping
 */
const toolHandlers: Record<string, (storage: StorageProvider, args: unknown) => Promise<unknown>> = {
  // Client handlers
  create_client: async (storage, args) => clientTools.createClient(storage, args),
  get_client: async (storage, args) =>
    clientTools.getClient(storage, (args as { client_id: string }).client_id),
  list_clients: async (storage, args) => clientTools.listClients(storage, args),
  update_client: async (storage, args) =>
    clientTools.updateClient(storage, (args as { client_id: string }).client_id, args),
  deactivate_client: async (storage, args) =>
    clientTools.deactivateClient(storage, (args as { client_id: string }).client_id),
  search_clients: async (storage, args) =>
    clientTools.searchClients(storage, (args as { search_term: string }).search_term),

  // Goal handlers
  create_goal: async (storage, args) => goalTools.createGoal(storage, args),
  get_goal: async (storage, args) => goalTools.getGoal(storage, (args as { goal_id: string }).goal_id),
  list_goals: async (storage, args) => goalTools.listGoals(storage, args),
  update_goal: async (storage, args) =>
    goalTools.updateGoal(storage, (args as { goal_id: string }).goal_id, args),
  update_goal_progress: async (storage, args) => goalTools.updateGoalProgress(storage, args),
  archive_goal: async (storage, args) => goalTools.archiveGoal(storage, (args as { goal_id: string }).goal_id),

  // Activity handlers
  create_activity: async (storage, args) => activityTools.createActivity(storage, args),
  get_activity: async (storage, args) =>
    activityTools.getActivity(storage, (args as { activity_id: string }).activity_id),
  list_activities: async (storage, args) => activityTools.listActivities(storage, args),
  update_activity: async (storage, args) =>
    activityTools.updateActivity(storage, (args as { activity_id: string }).activity_id, args),
  get_activities_by_date_range: async (storage, args) => {
    const { start_date, end_date, client_id } = args as {
      start_date: string;
      end_date: string;
      client_id?: string;
    };
    return activityTools.getActivitiesByDateRange(storage, start_date, end_date, client_id);
  },
  get_upcoming_activities: async (storage, args) => {
    const { days, client_id } = args as { days?: number; client_id?: string };
    return activityTools.getUpcomingActivities(storage, days, client_id);
  },

  // Stakeholder handlers
  create_stakeholder: async (storage, args) => stakeholderTools.createStakeholder(storage, args),
  get_stakeholder: async (storage, args) =>
    stakeholderTools.getStakeholder(storage, (args as { stakeholder_id: string }).stakeholder_id),
  list_stakeholders: async (storage, args) => stakeholderTools.listStakeholders(storage, args),
  update_stakeholder: async (storage, args) =>
    stakeholderTools.updateStakeholder(storage, (args as { stakeholder_id: string }).stakeholder_id, args),
  deactivate_stakeholder: async (storage, args) =>
    stakeholderTools.deactivateStakeholder(storage, (args as { stakeholder_id: string }).stakeholder_id),
  search_stakeholders: async (storage, args) =>
    stakeholderTools.searchStakeholders(storage, (args as { search_term: string }).search_term),

  // Shift note handlers
  create_shift_note: async (storage, args) => shiftNoteTools.createShiftNote(storage, args),
  get_shift_note: async (storage, args) =>
    shiftNoteTools.getShiftNote(storage, (args as { shift_note_id: string }).shift_note_id),
  list_shift_notes: async (storage, args) => shiftNoteTools.listShiftNotes(storage, args),
  update_shift_note: async (storage, args) =>
    shiftNoteTools.updateShiftNote(storage, (args as { shift_note_id: string }).shift_note_id, args),
  get_recent_shift_notes: async (storage, args) => {
    const { limit, client_id } = args as { limit?: number; client_id?: string };
    return shiftNoteTools.getRecentShiftNotes(storage, limit, client_id);
  },
  get_shift_notes_for_week: async (storage, args) => {
    const { week_start_date, client_id } = args as { week_start_date: string; client_id?: string };
    return shiftNoteTools.getShiftNotesForWeek(storage, week_start_date, client_id);
  },

  // Dashboard handlers
  get_dashboard: async (storage) => dashboardTools.getDashboard(storage),
  get_client_summary: async (storage, args) =>
    dashboardTools.getClientSummary(storage, (args as { client_id: string }).client_id),
  get_statistics: async (storage) => dashboardTools.getStatistics(storage),
};

/**
 * Safely stringify data for JSON-RPC transport
 * Handles circular references and ensures valid JSON
 */
function safeStringify(data: unknown): string {
  try {
    const seen = new WeakSet();
    const replacer = (_key: string, value: unknown): unknown => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    };

    return JSON.stringify(data, replacer, 2);
  } catch (error) {
    // Fallback: return a simple error object
    return JSON.stringify({ error: 'Unable to serialize result' }, null, 2);
  }
}

/**
 * Register all tools with the MCP server
 *
 * @param server - MCP server instance
 * @param storage - Storage provider
 */
export function registerTools(server: Server, storage: StorageProvider): void {
  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: toolDefinitions,
  }));

  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const handler = toolHandlers[name];
      if (!handler) {
        throw new ApplicationError(`Unknown tool: ${name}`, 'UNKNOWN_TOOL');
      }

      logger.info(`Executing tool: ${name}`);
      const result = await handler(storage, args || {});

      return {
        content: [
          {
            type: 'text',
            text: safeStringify(result),
          },
        ],
      };
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Tool execution error for ${name}`, error);
      } else {
        logger.error(`Tool execution error for ${name}: ` + String(error));
      }

      let errorMessage = 'An error occurred';
      let errorCode = 'INTERNAL_ERROR';

      if (error instanceof ApplicationError) {
        errorMessage = error.message;
        errorCode = error.code;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        content: [
          {
            type: 'text',
            text: safeStringify({
              error: errorMessage,
              code: errorCode,
            }),
          },
        ],
        isError: true,
      };
    }
  });

  logger.info(`Registered ${toolDefinitions.length} tools with MCP server`);
}
