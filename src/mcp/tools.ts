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
import * as activitySessionTools from '../tools/activity-sessions.js';
import * as stakeholderTools from '../tools/stakeholders.js';
import * as shiftNoteTools from '../tools/shift-notes.js';
import * as dashboardTools from '../tools/dashboard.js';
import * as behaviorIncidentTools from '../tools/behavior-incidents.js';
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
        ndis_number: {
          type: 'string',
          description: 'NDIS participant number (11 digits)',
        },
        primary_contact: {
          type: 'string',
          description: 'Primary contact information',
        },
        support_notes: { type: 'string', description: 'General support notes' },
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
        client_id: { type: 'string', description: 'Client ID (UUID or Convex ID format)' },
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
        active: { type: 'boolean', description: 'Filter by active status' },
        search: { type: 'string', description: 'Search by name' },
        limit: { type: 'number', description: 'Maximum number of results' },
        offset: { type: 'number', description: 'Pagination offset' },
      },
    },
  },
  {
    name: 'update_client',
    description: 'Update client information',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Client ID (UUID or Convex ID)' },
        name: { type: 'string', description: 'Full name' },
        date_of_birth: {
          type: 'string',
          description: 'Date of birth (ISO format)',
        },
        ndis_number: { type: 'string', description: 'NDIS number' },
        primary_contact: { type: 'string', description: 'Primary contact' },
        support_notes: { type: 'string', description: 'Support notes' },
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
        client_id: { type: 'string', description: 'Client ID (UUID or Convex ID)' },
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
        client_id: { type: 'string', description: 'Client ID (UUID or Convex ID)' },
        title: { type: 'string', description: 'Goal title' },
        description: { type: 'string', description: 'Detailed description' },
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
        goal_id: { type: 'string', description: 'Goal ID (UUID or Convex ID)' },
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
        client_id: { type: 'string', description: 'Filter by client ID' },
        status: {
          type: 'string',
          description: 'Filter by status',
          enum: ['not_started', 'in_progress', 'achieved', 'on_hold', 'discontinued'],
        },
        category: { type: 'string', description: 'Filter by category' },
        archived: { type: 'boolean', description: 'Include archived goals' },
        limit: { type: 'number', description: 'Maximum number of results' },
        offset: { type: 'number', description: 'Pagination offset' },
      },
    },
  },
  {
    name: 'update_goal',
    description: 'Update goal information',
    inputSchema: {
      type: 'object',
      properties: {
        goal_id: { type: 'string', description: 'Goal ID (UUID or Convex ID)' },
        title: { type: 'string', description: 'Goal title' },
        description: { type: 'string', description: 'Description' },
        status: { type: 'string', description: 'Goal status' },
        target_date: { type: 'string', description: 'Target date' },
        milestones: { type: 'array', items: { type: 'string' } },
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
        goal_id: { type: 'string', description: 'Goal ID (UUID or Convex ID)' },
        progress_percentage: {
          type: 'number',
          description: 'Progress percentage (0-100)',
        },
        status: { type: 'string', description: 'Goal status' },
        notes: { type: 'string', description: 'Progress notes' },
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
        goal_id: { type: 'string', description: 'Goal ID (UUID or Convex ID)' },
      },
      required: ['goal_id'],
    },
  },

  // Activity Tools
  {
    name: 'create_activity',
    description: 'Create a new activity in the activity pool/catalog (scheduling will be handled separately)',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Client ID (UUID or Convex ID)' },
        stakeholder_id: { type: 'string', description: 'Stakeholder ID (UUID or Convex ID)' },
        title: { type: 'string', description: 'Activity title' },
        description: { type: 'string', description: 'Activity description' },
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
        status: {
          type: 'string',
          description: 'Activity status',
          enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
        },
        goal_ids: {
          type: 'array',
          description: 'Linked goal IDs',
          items: { type: 'string' },
        },
        outcome_notes: { type: 'string', description: 'Outcome notes' },
      },
      required: ['client_id', 'stakeholder_id', 'title', 'activity_type'],
    },
  },
  {
    name: 'get_activity',
    description: 'Retrieve an activity with details',
    inputSchema: {
      type: 'object',
      properties: {
        activity_id: { type: 'string', description: 'Activity ID (UUID or Convex ID)' },
      },
      required: ['activity_id'],
    },
  },
  {
    name: 'list_activities',
    description: 'List activities from the activity pool/catalog with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Filter by client ID' },
        stakeholder_id: { type: 'string', description: 'Filter by stakeholder ID' },
        activity_type: { type: 'string', description: 'Filter by activity type' },
        status: { type: 'string', description: 'Filter by status' },
        goal_id: { type: 'string', description: 'Filter by linked goal' },
        limit: { type: 'number', description: 'Maximum number of results' },
        offset: { type: 'number', description: 'Pagination offset' },
      },
    },
  },
  {
    name: 'update_activity',
    description: 'Update activity information',
    inputSchema: {
      type: 'object',
      properties: {
        activity_id: { type: 'string', description: 'Activity ID (UUID or Convex ID)' },
        title: { type: 'string', description: 'Activity title' },
        description: { type: 'string', description: 'Description' },
        activity_type: { type: 'string', description: 'Activity type' },
        status: { type: 'string', description: 'Activity status' },
        goal_ids: { type: 'array', items: { type: 'string' } },
        outcome_notes: { type: 'string', description: 'Outcome notes' },
      },
      required: ['activity_id'],
    },
  },

  // Activity Session Tools
  {
    name: 'create_activity_session',
    description:
      'Record a completed activity session with engagement tracking, goal progress, and behavior notes',
    inputSchema: {
      type: 'object',
      properties: {
        activity_id: {
          type: 'string',
          description: 'ID of the activity template that was performed',
        },
        client_id: { type: 'string', description: 'Client ID' },
        stakeholder_id: {
          type: 'string',
          description: 'ID of support worker who facilitated the session',
        },
        shift_note_id: {
          type: 'string',
          description: 'Optional: ID of parent shift note',
        },
        performed_at: {
          type: 'string',
          description: 'When the session occurred (ISO datetime, e.g., 2025-11-26T10:00:00Z)',
        },
        duration_minutes: {
          type: 'number',
          description: 'Duration of the session in minutes',
        },
        session_notes: {
          type: 'string',
          description: 'Detailed notes about what happened during the session',
        },
        participant_engagement: {
          type: 'number',
          description: 'Engagement rating from 1 (disengaged) to 5 (highly engaged)',
        },
        goal_progress: {
          type: 'array',
          description: 'Goals that were progressed during this session',
          items: {
            type: 'object',
            properties: {
              goal_id: { type: 'string', description: 'Goal ID' },
              progress_observed: {
                type: 'number',
                description: 'Progress rating 1-10',
              },
              evidence_notes: {
                type: 'string',
                description:
                  'Evidence of progress (e.g., "Independently completed 3/5 steps")',
              },
            },
            required: ['goal_id', 'progress_observed', 'evidence_notes'],
          },
        },
        behavior_incident_ids: {
          type: 'array',
          description: 'IDs of behavior incidents that occurred during session',
          items: { type: 'string' },
        },
      },
      required: [
        'activity_id',
        'client_id',
        'stakeholder_id',
        'performed_at',
        'duration_minutes',
        'session_notes',
        'participant_engagement',
      ],
    },
  },
  {
    name: 'get_activity_session',
    description: 'Retrieve an activity session with full details including related entities',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'Activity session ID' },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'list_activity_sessions',
    description:
      'List activity sessions with filtering by client, activity, date range, or goal',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Filter by client' },
        activity_id: {
          type: 'string',
          description: 'Filter by activity template',
        },
        stakeholder_id: {
          type: 'string',
          description: 'Filter by support worker',
        },
        shift_note_id: { type: 'string', description: 'Filter by shift note' },
        goal_id: {
          type: 'string',
          description: 'Filter sessions that progressed this goal',
        },
        date_from: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)',
        },
        date_to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
        min_engagement: {
          type: 'number',
          description: 'Minimum engagement rating (1-5)',
        },
        limit: { type: 'number', description: 'Maximum results' },
        offset: { type: 'number', description: 'Pagination offset' },
      },
    },
  },
  {
    name: 'update_activity_session',
    description:
      'Update an activity session (notes, engagement rating, goal progress)',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'Session ID' },
        session_notes: { type: 'string', description: 'Updated session notes' },
        participant_engagement: {
          type: 'number',
          description: 'Updated engagement rating (1-5)',
        },
        goal_progress: {
          type: 'array',
          description: 'Updated goal progress entries',
          items: {
            type: 'object',
            properties: {
              goal_id: { type: 'string' },
              progress_observed: { type: 'number' },
              evidence_notes: { type: 'string' },
            },
          },
        },
        behavior_incident_ids: {
          type: 'array',
          items: { type: 'string' },
        },
        duration_minutes: { type: 'number' },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'delete_activity_session',
    description: 'Delete an activity session record',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'Session ID' },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'get_activity_effectiveness_report',
    description:
      'Analyze which activities are most effective for a specific goal based on session data',
    inputSchema: {
      type: 'object',
      properties: {
        goal_id: {
          type: 'string',
          description: 'Goal ID to analyze for activity effectiveness',
        },
      },
      required: ['goal_id'],
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
        email: { type: 'string', description: 'Email address' },
        phone: { type: 'string', description: 'Phone number' },
        organization: { type: 'string', description: 'Organization name' },
        notes: { type: 'string', description: 'Additional notes' },
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
        stakeholder_id: { type: 'string', description: 'Stakeholder ID (UUID or Convex ID)' },
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
        role: { type: 'string', description: 'Filter by role' },
        active: { type: 'boolean', description: 'Filter by active status' },
        search: { type: 'string', description: 'Search by name' },
        limit: { type: 'number', description: 'Maximum number of results' },
        offset: { type: 'number', description: 'Pagination offset' },
      },
    },
  },
  {
    name: 'update_stakeholder',
    description: 'Update stakeholder information',
    inputSchema: {
      type: 'object',
      properties: {
        stakeholder_id: { type: 'string', description: 'Stakeholder ID (UUID or Convex ID)' },
        name: { type: 'string', description: 'Stakeholder name' },
        role: { type: 'string', description: 'Role' },
        email: { type: 'string', description: 'Email' },
        phone: { type: 'string', description: 'Phone' },
        organization: { type: 'string', description: 'Organization' },
        notes: { type: 'string', description: 'Notes' },
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
        stakeholder_id: { type: 'string', description: 'Stakeholder ID (UUID or Convex ID)' },
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
    description:
      'Create a new shift note from raw staff notes. The raw notes will be automatically formatted into a professional NDIS shift report.',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Client ID (UUID or Convex ID)' },
        user_id: { type: 'string', description: 'User ID (UUID or Convex ID)' },
        shift_date: { type: 'string', description: 'Shift date (ISO format YYYY-MM-DD)' },
        start_time: { type: 'string', description: 'Shift start time (HH:MM)' },
        end_time: { type: 'string', description: 'Shift end time (HH:MM)' },
        primary_locations: {
          type: 'array',
          description: 'Primary locations visited during the shift',
          items: { type: 'string' },
        },
        raw_notes: { type: 'string', description: 'Raw unformatted notes from support staff' },
        activity_ids: {
          type: 'array',
          description: 'Linked activity IDs (legacy support)',
          items: { type: 'string' },
        },
        goals_progress: {
          type: 'array',
          description: 'Goal progress entries (legacy support)',
          items: {
            type: 'object',
            properties: {
              goal_id: { type: 'string' },
              progress_notes: { type: 'string' },
              progress_observed: { type: 'number' },
            },
          },
        },
      },
      required: [
        'client_id',
        'user_id',
        'shift_date',
        'start_time',
        'end_time',
        'raw_notes',
      ],
    },
  },
  {
    name: 'get_shift_note',
    description: 'Retrieve a shift note with details',
    inputSchema: {
      type: 'object',
      properties: {
        shift_note_id: { type: 'string', description: 'Shift note ID (UUID or Convex ID)' },
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
        client_id: { type: 'string', description: 'Filter by client ID' },
        user_id: { type: 'string', description: 'Filter by user ID' },
        date_from: {
          type: 'string',
          description: 'Start date filter (ISO format)',
        },
        date_to: { type: 'string', description: 'End date filter (ISO format)' },
        limit: { type: 'number', description: 'Maximum number of results' },
        offset: { type: 'number', description: 'Pagination offset' },
      },
    },
  },
  {
    name: 'update_shift_note',
    description: 'Update a shift note (only within 24 hours of shift date)',
    inputSchema: {
      type: 'object',
      properties: {
        shift_note_id: { type: 'string', description: 'Shift note ID (UUID or Convex ID)' },
        primary_locations: {
          type: 'array',
          description: 'Primary locations visited during the shift',
          items: { type: 'string' },
        },
        raw_notes: {
          type: 'string',
          description: 'Updated raw notes from support staff',
        },
        activity_ids: { type: 'array', items: { type: 'string' } },
        goals_progress: { type: 'array', items: { type: 'object' } },
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
        limit: {
          type: 'number',
          description: 'Number of shift notes (default: 10)',
        },
        client_id: { type: 'string', description: 'Filter by client ID' },
      },
    },
  },
  {
    name: 'get_shift_notes_for_week',
    description: 'Get shift notes for a specific week',
    inputSchema: {
      type: 'object',
      properties: {
        week_start_date: {
          type: 'string',
          description: 'Week start date (ISO format, typically Monday)',
        },
        client_id: { type: 'string', description: 'Filter by client ID' },
      },
      required: ['week_start_date'],
    },
  },
  {
    name: 'format_shift_note',
    description:
      'Generate a formatting prompt for raw shift notes. Returns a prompt that should be sent to an AI model to format the notes professionally.',
    inputSchema: {
      type: 'object',
      properties: {
        shift_note_id: { type: 'string', description: 'Shift note ID to format (UUID)' },
      },
      required: ['shift_note_id'],
    },
  },
  {
    name: 'save_formatted_shift_note',
    description:
      'Save the AI-formatted shift note back to the database. Call this after getting the formatted note from the AI.',
    inputSchema: {
      type: 'object',
      properties: {
        shift_note_id: { type: 'string', description: 'Shift note ID (UUID or Convex ID)' },
        formatted_note: {
          type: 'string',
          description: 'The complete formatted shift note from AI',
        },
      },
      required: ['shift_note_id', 'formatted_note'],
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
        client_id: { type: 'string', description: 'Client ID (UUID or Convex ID)' },
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

  // Behavior Incident Tools
  {
    name: 'create_behavior_incident',
    description: 'Create a new behavior incident report with detailed tracking of behaviors, interventions, and support needs',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Client ID (UUID or Convex ID)' },
        incident_date: { type: 'string', description: 'Date of the incident (ISO format YYYY-MM-DD)' },
        submitted_by: { type: 'string', description: 'ID of person submitting the report (stakeholder/user ID)' },
        submitted_for: {
          type: 'string',
          enum: ['self', 'other'],
          description: 'Who is this report for: "self" or "other"'
        },
        submitted_for_name: { type: 'string', description: 'Name of person if submitted_for is "other"' },
        location: {
          type: 'string',
          enum: ['in_the_home', 'in_the_community', 'in_the_car', 'at_restaurant', 'in_the_neighborhood', 'other'],
          description: 'Location where the behavior occurred'
        },
        location_other: { type: 'string', description: 'Additional details if location is "other"' },
        activity_before: {
          type: 'string',
          enum: ['activity_outdoors', 'activity_indoors', 'unstructured_time', 'transitioning', 'waiting', 'structured_activity', 'other'],
          description: 'Activity or situation before the behavior'
        },
        activity_before_other: { type: 'string', description: 'Additional details if activity_before is "other"' },
        behaviors_displayed: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'verbal_aggression', 'physical_aggression', 'wandering', 'withdrawal', 'harm_to_self',
              'damage_to_property', 'inappropriate_touching', 'public_masturbation', 'shared_lie_or_fiction',
              'risk_of_safety', 'leaving_home_unsupervised', 'moving_neighbors_bins',
              'approaching_neighbors_house', 'attempting_to_kiss_touch', 'other'
            ]
          },
          description: 'List of behaviors displayed (can select multiple)'
        },
        behaviors_other: { type: 'string', description: 'Additional details if behaviors include "other"' },
        duration: {
          type: 'string',
          enum: ['0_5_minutes', '6_10_minutes', '11_15_minutes', '16_30_minutes', 'over_30_minutes', 'other'],
          description: 'Duration of the behavior'
        },
        duration_other: { type: 'string', description: 'Additional details if duration is "other"' },
        severity: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Severity/intensity: low (minor disruption), medium (moderate impact), high (severe risk)'
        },
        self_harm_types: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['bite', 'scratch', 'hit_head', 'consuming_non_food', 'bang_head', 'no_harm', 'other']
          },
          description: 'Types of self-harm (can select multiple)'
        },
        self_harm_other: { type: 'string', description: 'Additional details if self_harm includes "other"' },
        self_harm_count: { type: 'number', description: 'Number of times self-harm occurred (0-10+)' },
        initial_intervention: {
          type: 'string',
          enum: ['verbal_redirection', 'escape_environment', 'deflection_with_body', 'distraction_with_items', 'no_intervention_required', 'other'],
          description: 'Initial intervention strategy used'
        },
        intervention_description: { type: 'string', description: 'Description of intervention if "other" or additional details' },
        second_support_needed: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['ensure_safety', 'prevent_harm_to_others', 'manage_transitions', 'all', 'no_additional_support_needed']
          },
          description: 'Reasons for needing second support person (2:1 support)'
        },
        second_support_description: { type: 'string', description: 'Description of second support needs' },
        detailed_description: { type: 'string', description: 'Detailed description of the behavioral incident' },
      },
      required: ['client_id', 'incident_date', 'submitted_by', 'submitted_for', 'location', 'activity_before', 'behaviors_displayed', 'duration', 'severity', 'detailed_description'],
    },
  },
  {
    name: 'get_behavior_incident',
    description: 'Retrieve a behavior incident with details',
    inputSchema: {
      type: 'object',
      properties: {
        incident_id: { type: 'string', description: 'Incident ID (UUID or Convex ID)' },
      },
      required: ['incident_id'],
    },
  },
  {
    name: 'list_behavior_incidents',
    description: 'List behavior incidents with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Filter by client ID' },
        date_from: { type: 'string', description: 'Start date filter (ISO format)' },
        date_to: { type: 'string', description: 'End date filter (ISO format)' },
        severity: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Filter by severity' },
        location: { type: 'string', description: 'Filter by location' },
        has_self_harm: { type: 'boolean', description: 'Filter incidents with self-harm' },
        needs_second_support: { type: 'boolean', description: 'Filter incidents needing second support' },
        submitted_by: { type: 'string', description: 'Filter by submitter ID' },
        limit: { type: 'number', description: 'Maximum number of results' },
        offset: { type: 'number', description: 'Pagination offset' },
      },
    },
  },
  {
    name: 'update_behavior_incident',
    description: 'Update a behavior incident report',
    inputSchema: {
      type: 'object',
      properties: {
        incident_id: { type: 'string', description: 'Incident ID (UUID or Convex ID)' },
        incident_date: { type: 'string', description: 'Date of the incident' },
        submitted_by: { type: 'string', description: 'ID of person submitting' },
        submitted_for: { type: 'string', enum: ['self', 'other'], description: 'Who is this for' },
        submitted_for_name: { type: 'string', description: 'Name if for other person' },
        location: { type: 'string', description: 'Location where behavior occurred' },
        location_other: { type: 'string', description: 'Other location details' },
        activity_before: { type: 'string', description: 'Activity before behavior' },
        activity_before_other: { type: 'string', description: 'Other activity details' },
        behaviors_displayed: { type: 'array', items: { type: 'string' }, description: 'Behaviors displayed' },
        behaviors_other: { type: 'string', description: 'Other behavior details' },
        duration: { type: 'string', description: 'Behavior duration' },
        duration_other: { type: 'string', description: 'Other duration details' },
        severity: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Severity level' },
        self_harm_types: { type: 'array', items: { type: 'string' }, description: 'Self-harm types' },
        self_harm_other: { type: 'string', description: 'Other self-harm details' },
        self_harm_count: { type: 'number', description: 'Self-harm count' },
        initial_intervention: { type: 'string', description: 'Initial intervention' },
        intervention_description: { type: 'string', description: 'Intervention details' },
        second_support_needed: { type: 'array', items: { type: 'string' }, description: 'Second support reasons' },
        second_support_description: { type: 'string', description: 'Second support details' },
        detailed_description: { type: 'string', description: 'Detailed incident description' },
      },
      required: ['incident_id'],
    },
  },
  {
    name: 'delete_behavior_incident',
    description: 'Delete a behavior incident report',
    inputSchema: {
      type: 'object',
      properties: {
        incident_id: { type: 'string', description: 'Incident ID (UUID or Convex ID)' },
      },
      required: ['incident_id'],
    },
  },
  {
    name: 'get_behavior_incident_stats',
    description: 'Get statistics for behavior incidents (overall or for a specific client)',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Optional client ID to filter stats' },
      },
    },
  },
];

/**
 * Tool handler mapping
 */
const toolHandlers: Record<string, (storage: StorageProvider, args: unknown) => Promise<unknown>> =
  {
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
    get_goal: async (storage, args) =>
      goalTools.getGoal(storage, (args as { goal_id: string }).goal_id),
    list_goals: async (storage, args) => goalTools.listGoals(storage, args),
    update_goal: async (storage, args) =>
      goalTools.updateGoal(storage, (args as { goal_id: string }).goal_id, args),
    update_goal_progress: async (storage, args) => goalTools.updateGoalProgress(storage, args),
    archive_goal: async (storage, args) =>
      goalTools.archiveGoal(storage, (args as { goal_id: string }).goal_id),

    // Activity handlers
    create_activity: async (storage, args) => activityTools.createActivity(storage, args),
    get_activity: async (storage, args) =>
      activityTools.getActivity(storage, (args as { activity_id: string }).activity_id),
    list_activities: async (storage, args) => activityTools.listActivities(storage, args),
    update_activity: async (storage, args) =>
      activityTools.updateActivity(storage, (args as { activity_id: string }).activity_id, args),

    // Activity Session handlers
    create_activity_session: async (storage, args) =>
      activitySessionTools.createActivitySession(storage, args),
    get_activity_session: async (storage, args) =>
      activitySessionTools.getActivitySession(storage, (args as { session_id: string }).session_id),
    list_activity_sessions: async (storage, args) =>
      activitySessionTools.listActivitySessions(storage, args),
    update_activity_session: async (storage, args) =>
      activitySessionTools.updateActivitySession(
        storage,
        (args as { session_id: string }).session_id,
        args
      ),
    delete_activity_session: async (storage, args) =>
      activitySessionTools.deleteActivitySession(
        storage,
        (args as { session_id: string }).session_id
      ),
    get_activity_effectiveness_report: async (storage, args) =>
      activitySessionTools.getActivityEffectivenessReport(
        storage,
        (args as { goal_id: string }).goal_id
      ),

    // Stakeholder handlers
    create_stakeholder: async (storage, args) => stakeholderTools.createStakeholder(storage, args),
    get_stakeholder: async (storage, args) =>
      stakeholderTools.getStakeholder(storage, (args as { stakeholder_id: string }).stakeholder_id),
    list_stakeholders: async (storage, args) => stakeholderTools.listStakeholders(storage, args),
    update_stakeholder: async (storage, args) =>
      stakeholderTools.updateStakeholder(
        storage,
        (args as { stakeholder_id: string }).stakeholder_id,
        args
      ),
    deactivate_stakeholder: async (storage, args) =>
      stakeholderTools.deactivateStakeholder(
        storage,
        (args as { stakeholder_id: string }).stakeholder_id
      ),
    search_stakeholders: async (storage, args) =>
      stakeholderTools.searchStakeholders(storage, (args as { search_term: string }).search_term),

    // Shift note handlers
    create_shift_note: async (storage, args) => shiftNoteTools.createShiftNote(storage, args),
    get_shift_note: async (storage, args) =>
      shiftNoteTools.getShiftNote(storage, (args as { shift_note_id: string }).shift_note_id),
    list_shift_notes: async (storage, args) => shiftNoteTools.listShiftNotes(storage, args),
    update_shift_note: async (storage, args) =>
      shiftNoteTools.updateShiftNote(
        storage,
        (args as { shift_note_id: string }).shift_note_id,
        args
      ),
    get_recent_shift_notes: async (storage, args) => {
      const { limit, client_id } = args as { limit?: number; client_id?: string };
      return shiftNoteTools.getRecentShiftNotes(storage, limit, client_id);
    },
    get_shift_notes_for_week: async (storage, args) => {
      const { week_start_date, client_id } = args as {
        week_start_date: string;
        client_id?: string;
      };
      return shiftNoteTools.getShiftNotesForWeek(storage, week_start_date, client_id);
    },
    format_shift_note: async (storage, args) => {
      const { shift_note_id } = args as { shift_note_id: string };
      return shiftNoteTools.generateShiftNoteFormattingPrompt(storage, shift_note_id);
    },
    save_formatted_shift_note: async (storage, args) => {
      const { shift_note_id, formatted_note } = args as {
        shift_note_id: string;
        formatted_note: string;
      };
      return shiftNoteTools.saveFormattedShiftNote(storage, shift_note_id, formatted_note);
    },

    // Dashboard handlers
    get_dashboard: async (storage) => dashboardTools.getDashboard(storage),
    get_client_summary: async (storage, args) =>
      dashboardTools.getClientSummary(storage, (args as { client_id: string }).client_id),
    get_statistics: async (storage) => dashboardTools.getStatistics(storage),

    // Behavior Incident handlers
    create_behavior_incident: async (storage, args) =>
      behaviorIncidentTools.createBehaviorIncident(storage, args),
    get_behavior_incident: async (storage, args) =>
      behaviorIncidentTools.getBehaviorIncident(storage, (args as { incident_id: string }).incident_id),
    list_behavior_incidents: async (storage, args) =>
      behaviorIncidentTools.listBehaviorIncidents(storage, args),
    update_behavior_incident: async (storage, args) =>
      behaviorIncidentTools.updateBehaviorIncident(
        storage,
        (args as { incident_id: string }).incident_id,
        args
      ),
    delete_behavior_incident: async (storage, args) =>
      behaviorIncidentTools.deleteBehaviorIncident(storage, (args as { incident_id: string }).incident_id),
    get_behavior_incident_stats: async (storage, args) => {
      const { client_id } = args as { client_id?: string };
      return behaviorIncidentTools.getBehaviorIncidentStats(storage, client_id);
    },
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
  } catch {
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
  server.setRequestHandler(ListToolsRequestSchema, () => ({
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
