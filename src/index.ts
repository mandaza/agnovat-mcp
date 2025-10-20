/**
 * Agnovat MCP Server
 *
 * Main entry point for the NDIS Management MCP server.
 * Handles MCP protocol initialization and tool registration.
 *
 * @module index
 */

// Load environment variables from .env file
import 'dotenv/config';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { JsonStorage } from './storage/json-storage.js';
import { ConvexStorage } from './storage/convex-storage.js';
import { StorageProvider } from './storage/base.js';
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
    // Redirect console methods to stderr to avoid interfering with JSON-RPC on stdout
    // MCP servers use stdio for JSON-RPC, so console.* must go to stderr
    console.log = (...args) => process.stderr.write(args.join(' ') + '\n');
    console.info = (...args) => process.stderr.write('[INFO] ' + args.join(' ') + '\n');
    console.warn = (...args) => process.stderr.write('[WARN] ' + args.join(' ') + '\n');
    console.error = (...args) => process.stderr.write('[ERROR] ' + args.join(' ') + '\n');
    console.debug = (...args) => process.stderr.write('[DEBUG] ' + args.join(' ') + '\n');

    // Initialize storage based on environment
    const storageType = process.env['STORAGE_TYPE'] || 'json';
    let storage: StorageProvider;

    if (storageType === 'convex') {
      const deploymentUrl = process.env['CONVEX_URL'];
      if (!deploymentUrl) {
        throw new Error('CONVEX_URL environment variable is required when using Convex storage');
      }
      storage = new ConvexStorage({ deploymentUrl });
      logger.info('Using Convex storage');
    } else {
      const dataDir = process.env['DATA_DIR'] || './data';
      storage = new JsonStorage({ dataDir });
      logger.info('Using JSON file storage');
    }

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
