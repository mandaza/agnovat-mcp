/**
 * MCP Resource Registration
 *
 * Registers resource endpoints for direct entity access.
 * Provides URI-based access to clients, goals, activities, shift notes, and stakeholders.
 *
 * @module mcp/resources
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { StorageProvider } from '../storage/index.js';
import { getClient } from '../tools/clients.js';
import { getGoal } from '../tools/goals.js';
import { getActivity } from '../tools/activities.js';
import { getShiftNote } from '../tools/shift-notes.js';
import { getStakeholder } from '../tools/stakeholders.js';
import { getDashboard } from '../tools/dashboard.js';
import { logger } from '../utils/logger.js';
import { ApplicationError, NotFoundError } from '../utils/errors.js';

/**
 * Resource definitions
 */
const resourceTemplates = [
  {
    uriTemplate: 'client:///{client_id}',
    name: 'Client Profile',
    description: 'Access individual client profiles with statistics',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'goal:///{goal_id}',
    name: 'Goal Details',
    description: 'Access individual goal details with progress information',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'activity:///{activity_id}',
    name: 'Activity Details',
    description: 'Access individual activity details with linked information',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'shift_note:///{shift_note_id}',
    name: 'Shift Note',
    description: 'Access individual shift note with full documentation',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'stakeholder:///{stakeholder_id}',
    name: 'Stakeholder Profile',
    description: 'Access individual stakeholder profiles with activity summary',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'dashboard://summary',
    name: 'Dashboard Summary',
    description: 'Access complete dashboard with aggregated metrics',
    mimeType: 'application/json',
  },
];

/**
 * Parse resource URI and extract entity type and ID
 *
 * @param uri - Resource URI
 * @returns Parsed entity type and ID
 * @throws {ApplicationError} If URI format is invalid
 */
function parseResourceUri(uri: string): { type: string; id: string } {
  const match = uri.match(/^([a-z_]+):\/\/\/(.+)$/);
  if (!match) {
    throw new ApplicationError(`Invalid resource URI format: ${uri}`, 'INVALID_URI');
  }

  const [, type, path] = match;
  return { type: type || '', id: path || '' };
}

/**
 * Fetch resource data based on URI
 *
 * @param storage - Storage provider
 * @param uri - Resource URI
 * @returns Resource data
 * @throws {NotFoundError} If resource not found
 * @throws {ApplicationError} If URI type is unknown
 */
async function fetchResource(storage: StorageProvider, uri: string): Promise<unknown> {
  const { type, id } = parseResourceUri(uri);

  switch (type) {
    case 'client':
      return getClient(storage, id);

    case 'goal':
      return getGoal(storage, id);

    case 'activity':
      return getActivity(storage, id);

    case 'shift_note':
      return getShiftNote(storage, id);

    case 'stakeholder':
      return getStakeholder(storage, id);

    case 'dashboard':
      if (id !== 'summary') {
        throw new ApplicationError('Invalid dashboard path, use: dashboard://summary', 'INVALID_PATH');
      }
      return getDashboard(storage);

    default:
      throw new ApplicationError(`Unknown resource type: ${type}`, 'UNKNOWN_RESOURCE_TYPE');
  }
}

/**
 * Register resource endpoints with the MCP server
 *
 * @param server - MCP server instance
 * @param storage - Storage provider
 */
export function registerResources(server: Server, storage: StorageProvider): void {
  // List resources handler
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: resourceTemplates,
  }));

  // Read resource handler
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    try {
      logger.info(`Reading resource: ${uri}`);
      const data = await fetchResource(storage, uri);

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Resource read error for ${uri}`, error);
      } else {
        logger.error(`Resource read error for ${uri}: ` + String(error));
      }

      let errorMessage = 'Failed to read resource';
      let errorCode = 'RESOURCE_READ_ERROR';

      if (error instanceof NotFoundError) {
        errorMessage = error.message;
        errorCode = 'RESOURCE_NOT_FOUND';
      } else if (error instanceof ApplicationError) {
        errorMessage = error.message;
        errorCode = error.code;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      throw new ApplicationError(errorMessage, errorCode);
    }
  });

  logger.info(`Registered ${resourceTemplates.length} resource endpoints with MCP server`);
}
