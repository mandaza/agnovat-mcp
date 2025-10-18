/**
 * Agnovat MCP Server
 *
 * Main entry point for the NDIS Management MCP server.
 * Handles MCP protocol initialization and tool registration.
 *
 * @module index
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { JsonStorage } from './storage/json-storage.js';
import { registerTools } from './mcp/tools.js';
import { registerResources } from './mcp/resources.js';
import { registerPrompts } from './mcp/prompts.js';
import { logger } from './utils/logger.js';
import { ApplicationError } from './utils/errors.js';

/**
 * Initialize and start the MCP server
 */
async function main(): Promise<void> {
  try {
    // Initialize storage
    const dataDir = process.env['DATA_DIR'] || './data';
    const storage = new JsonStorage({ dataDir });
    await storage.initialize();
    logger.info('Storage initialized successfully');

    // Create MCP server instance
    const server = new Server(
      {
        name: 'agnovat-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    // Register all MCP handlers
    registerTools(server, storage);
    registerResources(server, storage);
    registerPrompts(server, storage);

    // Set up error handling
    server.onerror = (error): void => {
      logger.error('Server error:', error);
    };

    process.on('SIGINT', async () => {
      logger.info('Shutting down server...');
      await server.close();
      process.exit(0);
    });

    // Start server with stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info('Agnovat MCP Server started successfully');
  } catch (error) {
    if (error instanceof ApplicationError) {
      logger.error(`Application error: ${error.message}`, error);
    } else if (error instanceof Error) {
      logger.error('Fatal error during server initialization', error);
    } else {
      logger.error('Fatal error during server initialization: ' + String(error));
    }
    process.exit(1);
  }
}

// Start the server
main();
