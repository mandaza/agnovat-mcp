/**
 * MCP Prompt Registration
 *
 * Registers prompt templates for common workflows.
 * Provides guided interactions for support workers and coordinators.
 *
 * @module mcp/prompts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListPromptsRequestSchema, GetPromptRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { StorageProvider } from '../storage/index.js';
import { logger } from '../utils/logger.js';
import { ApplicationError } from '../utils/errors.js';

/**
 * Prompt template definitions
 */
const promptTemplates = [
  {
    name: 'create_shift_note_for_client',
    description: 'Guide through creating a comprehensive shift note for a client',
    arguments: [
      {
        name: 'client_id',
        description: 'ID of the client for the shift note',
        required: true,
      },
    ],
  },
  {
    name: 'review_client_progress',
    description: 'Review a client\'s progress across all goals with recent activities',
    arguments: [
      {
        name: 'client_id',
        description: 'ID of the client to review',
        required: true,
      },
      {
        name: 'period_days',
        description: 'Number of days to review (default: 7)',
        required: false,
      },
    ],
  },
  {
    name: 'plan_activity_for_goal',
    description: 'Plan an activity to work towards a specific goal',
    arguments: [
      {
        name: 'goal_id',
        description: 'ID of the goal',
        required: true,
      },
      {
        name: 'stakeholder_id',
        description: 'ID of the stakeholder who will conduct the activity',
        required: true,
      },
    ],
  },
  {
    name: 'handover_summary',
    description: 'Generate a handover summary for a client',
    arguments: [
      {
        name: 'client_id',
        description: 'ID of the client',
        required: true,
      },
    ],
  },
  {
    name: 'weekly_report',
    description: 'Generate a weekly report for a client or all clients',
    arguments: [
      {
        name: 'client_id',
        description: 'ID of the client (optional, if omitted generates for all clients)',
        required: false,
      },
      {
        name: 'week_start_date',
        description: 'Start date of the week (ISO format, typically Monday)',
        required: false,
      },
    ],
  },
  {
    name: 'goal_risk_review',
    description: 'Review all goals at risk and suggest action plans',
    arguments: [],
  },
];

/**
 * Generate prompt content based on template name and arguments
 *
 * @param name - Prompt template name
 * @param args - Prompt arguments
 * @returns Prompt messages
 * @throws {ApplicationError} If template not found
 */
function generatePrompt(
  name: string,
  args?: Record<string, string>
): Array<{ role: string; content: { type: string; text: string } }> {
  switch (name) {
    case 'create_shift_note_for_client':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `I need to create a shift note for client ${args?.['client_id'] || '[CLIENT_ID]'}.

Please help me document:
1. Shift details (date, start time, end time)
2. General observations about the client's mood and engagement
3. Activities completed during the shift
4. Progress observed on their goals
5. Any health, safety, or communication notes
6. Handover notes for the next support worker

Ask me for each piece of information step by step, and use the appropriate tools to create the shift note with all activities and goal progress properly linked.`,
          },
        },
      ];

    case 'review_client_progress':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `I need to review the progress for client ${args?.['client_id'] || '[CLIENT_ID]'} over the last ${args?.['period_days'] || '7'} days.

Please provide:
1. Client summary with current goal status
2. All activities completed in the period
3. Progress updates on each active goal
4. Recent shift notes
5. Any goals at risk
6. Recommendations for next steps

Use the get_client_summary, list_activities, list_shift_notes, and related tools to gather comprehensive information.`,
          },
        },
      ];

    case 'plan_activity_for_goal':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `I want to plan an activity to work towards goal ${args?.['goal_id'] || '[GOAL_ID]'} with stakeholder ${args?.['stakeholder_id'] || '[STAKEHOLDER_ID]'}.

Please help me:
1. Review the goal details and current progress
2. Suggest appropriate activity types based on the goal category
3. Create the activity with proper linking to the goal
4. Consider the client's preferences and support needs

Use get_goal to review the goal, then guide me through creating an appropriate activity.`,
          },
        },
      ];

    case 'handover_summary':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `I need a handover summary for client ${args?.['client_id'] || '[CLIENT_ID]'}.

Please provide:
1. Client overview (name, key details)
2. Current active goals and their status
3. Recent activities from the last 2 days
4. Latest shift note highlights
5. Any important health, safety, or communication notes
6. Scheduled upcoming activities

Use get_client, list_goals, list_activities, and get_recent_shift_notes to compile a comprehensive handover.`,
          },
        },
      ];

    case 'weekly_report':
      if (args?.['client_id']) {
        return [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Generate a weekly report for client ${args['client_id']} for the week starting ${args?.['week_start_date'] || '[CURRENT_WEEK]'}.

Please include:
1. Client name and overview
2. Goals worked on during the week
3. All activities completed
4. Shift notes from the week
5. Progress made on goals (percentage and status changes)
6. Upcoming activities for next week
7. Overall assessment and recommendations

Use get_client_summary, list_activities with date filters, and get_shift_notes_for_week to compile the report.`,
            },
          },
        ];
      } else {
        return [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Generate a weekly report for all clients for the week starting ${args?.['week_start_date'] || '[CURRENT_WEEK]'}.

Please include:
1. Dashboard summary (total clients, goals, activities)
2. Goals achieved this week
3. Goals at risk
4. Total shift notes documented
5. Activity completion rate
6. Client-by-client highlights
7. Overall team performance

Use get_dashboard and get_statistics to compile the organization-wide report.`,
            },
          },
        ];
      }

    case 'goal_risk_review':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `I need to review all goals that are currently at risk.

Please provide:
1. Complete list of at-risk goals from the dashboard
2. For each at-risk goal:
   - Client name
   - Goal title and category
   - Current progress percentage
   - Target date and days remaining
   - Recent activities related to this goal
   - Last shift note mentioning this goal
3. Suggested action plans for each goal (e.g., increase activity frequency, revise milestones, discuss with client)

Use get_dashboard to get at-risk goals, then get details for each goal, its client, and recent related activities.`,
          },
        },
      ];

    default:
      throw new ApplicationError(`Unknown prompt template: ${name}`, 'UNKNOWN_PROMPT');
  }
}

/**
 * Register prompt templates with the MCP server
 *
 * @param server - MCP server instance
 * @param _storage - Storage provider (for future use if prompts need data)
 */
export function registerPrompts(server: Server, _storage: StorageProvider): void {
  // List prompts handler
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: promptTemplates,
  }));

  // Get prompt handler
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      logger.info(`Generating prompt: ${name}`);
      const messages = generatePrompt(name, args);

      return {
        messages,
      };
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Prompt generation error for ${name}`, error);
      } else {
        logger.error(`Prompt generation error for ${name}: ` + String(error));
      }

      let errorMessage = 'Failed to generate prompt';
      let errorCode = 'PROMPT_GENERATION_ERROR';

      if (error instanceof ApplicationError) {
        errorMessage = error.message;
        errorCode = error.code;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      throw new ApplicationError(errorMessage, errorCode);
    }
  });

  logger.info(`Registered ${promptTemplates.length} prompt templates with MCP server`);
}
