# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Agnovat MCP Server - Architecture & Design Guide

**Last Updated:** October 2024
**MCP Version:** 1.0.0
**Node.js Target:** 18+

## Overview

Agnovat is an MCP (Model Context Protocol) server for NDIS (National Disability Insurance Scheme) participant support management. It implements a 3-layer architecture with pluggable storage backends and comprehensive tool/resource/prompt registrations.

**Key Stats:**
- 32 MCP Tools (CRUD operations across 5 entity types)
- 6 MCP Resources (URI-based direct entity access)
- 6 MCP Prompts (guided workflows)
- 5 Data Collections (clients, goals, activities, shift_notes, stakeholders)

## Architecture Layers

### Layer 1: MCP Protocol (src/mcp/)

The MCP protocol layer translates between Claude/MCP clients and business logic.

**Key Files:**
- `mcp/tools.ts` - Registers 32 tools with the MCP server. Maps tool names to handler functions.
- `mcp/resources.ts` - Registers URI-based resource access (e.g., `client:///uuid`, `dashboard://summary`)
- `mcp/prompts.ts` - Registers prompt templates for guided workflows

**How It Works:**
1. `registerTools()` sets up MCP request handlers for `ListTools` and `CallTool`
2. Tool definitions array contains MCP schema (input validation)
3. `toolHandlers` map routes requests to business logic functions
4. Response is stringified via `safeStringify()` to handle circular refs

**Critical Detail:** Console is redirected to stderr (lines 31-35 in index.ts) because MCP uses stdout for JSON-RPC protocol.

### Layer 2: Business Logic (src/tools/)

Tool implementations that orchestrate storage and validation.

**Pattern (Example: src/tools/clients.ts):**
```typescript
export async function createClient(storage: StorageProvider, input: unknown): Promise<Client> {
  // 1. Validate input with Zod schema
  const data = validateWithSchema(createClientSchema, input);
  
  // 2. Apply business rules (e.g., check duplicate NDIS)
  if (data.ndis_number) {
    const existingClients = await storage.list<Client>('clients');
    // ...conflict checking
  }
  
  // 3. Generate entity with UUID + timestamps
  const now = getCurrentTimestamp();
  const client: Client = {
    id: uuidv4(),
    ...data,
    created_at: now,
    updated_at: now,
  };
  
  // 4. Persist via storage abstraction
  await storage.write('clients', client);
  return client;
}
```

**Key Traits:**
- Input validation happens FIRST (prevents invalid data from reaching storage)
- Business rule enforcement (e.g., cannot create goal for inactive client)
- Soft deletes: entities have `active`/`archived` flags, not hard deleted
- Temporal data: all entities have `created_at` and `updated_at`

### Layer 3: Storage Abstraction (src/storage/)

Two implementations behind a single interface: JSON files or Convex database.

**Interface: StorageProvider (base.ts)**
```typescript
interface StorageProvider {
  initialize(): Promise<void>
  read<T>(collection: CollectionName, id: string): Promise<T | null>
  write<T>(collection: CollectionName, record: T): Promise<void>
  delete(collection: CollectionName, id: string): Promise<boolean>
  list<T>(collection, filter?, options?): Promise<T[]>
  count<T>(collection, filter?): Promise<number>
  exists(collection, id): Promise<boolean>
  find<T>(collection, predicate, options?): Promise<T[]>
  createBackup(): Promise<string>
  restoreBackup(backupPath): Promise<void>
  getStats(): Promise<{total_records, records_by_collection}>
  close(): Promise<void>
}
```

**Implementation 1: JsonStorage (json-storage.ts)**
- File locking via `proper-lockfile` (prevents concurrent corruption)
- Atomic writes: write to temp file, then rename
- In-memory caching (Map<collection, Map<id, record>>)
- Backup/restore to JSON snapshots
- File structure: `{ version, last_updated, records: [] }`

**Implementation 2: ConvexStorage (convex-storage.ts)**
- Uses Convex auto-generated client from `convex/_generated/api.js`
- Wraps Convex queries/mutations
- Converts Convex `_id` to our `id` field for consistency
- Type assertions needed due to Convex's type generation

**How to Switch Storage:**
```bash
# JSON (default)
STORAGE_TYPE=json DATA_DIR=./data node dist/index.js

# Convex
STORAGE_TYPE=convex CONVEX_URL=https://... node dist/index.js
```

## Data Models (src/models/)

Each entity has 3-4 variants:

1. **Base Model** (e.g., `Client`)
   - The canonical entity shape
   - Used for storage and most operations

2. **Create Input** (e.g., `CreateClientInput`)
   - Omits id, timestamps, computed fields
   - What tools receive from MCP

3. **Update Input** (e.g., `UpdateClientInput`)
   - All fields optional (partial updates)
   - Used by update_* tools

4. **Extended Model** (e.g., `ClientWithStats`)
   - Adds computed fields (goals count, last activity, etc.)
   - Used by get_* and dashboard operations

**Example: Client Model**
```typescript
interface Client {
  id: string;                    // UUID
  name: string;
  date_of_birth: string;         // ISO YYYY-MM-DD
  ndis_number?: string;          // 11 digits
  primary_contact?: string;
  support_notes?: string;
  active: boolean;               // Soft delete flag
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}
```

**Enum Models (enums.ts):**
- `GoalStatus`: 'not_started' | 'in_progress' | 'achieved' | 'on_hold' | 'discontinued'
- `GoalCategory`: 'daily_living' | 'social_community' | 'employment' | 'health_wellbeing' | 'home' | 'lifelong_learning' | 'relationships'
- `ActivityType`: 'life_skills' | 'social_community' | 'transport' | 'health_medical' | 'therapy' | 'coordination' | 'other'
- `ActivityStatus`: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
- `StakeholderRole`: 'support_worker' | 'support_coordinator' | 'plan_manager' | 'allied_health' | 'team_leader' | 'other'

## Validation Layer (src/validation/)

Uses **Zod** for runtime type validation.

**Key Schemas (schemas.ts):**
- `uuidSchema` - UUID v4 validation
- `dateSchema` - ISO YYYY-MM-DD format
- `timeSchema` - HH:MM format (24-hour)
- `ndisNumberSchema` - 11 digits
- `progressPercentageSchema` - 0-100
- `progressObservedSchema` - 1-10 rating

**Pattern:**
```typescript
// In tools/clients.ts
const data = validateWithSchema(createClientSchema, input);
// Throws ValidationError with field-level details if invalid
```

**Helper in utils/validation.ts:**
```typescript
export function validateWithSchema<T>(schema: z.ZodSchema, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.flatten();
    // Format Zod errors into ValidationError
    throw new ValidationError(...);
  }
  return result.data;
}
```

## Error Handling Strategy

**Custom Error Hierarchy (src/utils/errors.ts):**

```
ApplicationError (base)
├── ValidationError        - Input validation failures
├── NotFoundError          - Resource doesn't exist
├── ConflictError          - Business rule violations
├── StorageError           - I/O failures
└── AuthorizationError     - Operation not permitted (e.g., edit after 24h)
```

**Key Feature:** Each error has a `code` field for programmatic handling.

**MCP Tool Response Pattern:**
```typescript
if (error instanceof ApplicationError) {
  return {
    content: [{
      type: 'text',
      text: safeStringify({ error: error.message, code: error.code })
    }],
    isError: true  // MCP protocol flag
  };
}
```

## Logging & Security (src/utils/logger.ts)

Custom logger with **PII protection** - critical for NDIS compliance.

**Sensitive Fields (Auto-redacted):**
- password, token, secret, apiKey
- ndis_number, email, phone
- date_of_birth, address

**Pattern:**
```typescript
import { logger } from './utils/logger.js';

logger.info('Client created', { client_id: 'uuid' }); // OK
// [INFO] Client created {"client_id":"uuid"}

logger.info('Client', { ndis_number: '12345678901' }); // Auto-redacted
// [INFO] Client {"ndis_number":"[REDACTED]"}
```

Console is redirected to stderr to avoid interfering with MCP's stdout-based JSON-RPC.

## Key Patterns & Conventions

### 1. Entity ID Generation
All entity IDs are UUID v4 (`uuidv4()` from uuid package). No sequential or predictable IDs.

### 2. Timestamps
- Format: ISO 8601 strings (`new Date().toISOString()`)
- Stored as strings, not Date objects (for JSON/Convex compatibility)
- All records auto-update `updated_at` on writes
- Helper: `getCurrentTimestamp()` from `utils/dates.ts`

### 3. Soft Deletes
Entities have `active` (clients, stakeholders) or `archived` (goals) flags. Never hard-delete.

Reason: Maintains referential integrity with shift notes, activities, etc.

### 4. Pagination
Tools support `limit` and `offset` options:
```typescript
list_clients: {
  limit: { type: 'number', optional: true },
  offset: { type: 'number', optional: true }
}
```

### 5. Date Filtering
Activities/shift notes have `date_from` and `date_to` filters (ISO YYYY-MM-DD format).

### 6. Atomic Writes (JSON Storage)
1. Write to temp file in same directory
2. Acquire lock on temp file
3. Rename temp -> actual (atomic on most filesystems)
4. Release lock
5. Handles crash recovery: temp files cleaned up on restart

### 7. In-Memory Caching (JSON Storage)
- Cache enabled by default: `enableCache: true`
- Cache is a `Map<collection, Map<id, record>>`
- Updated on every write
- Not cleared automatically (survives multiple reads)
- Improves performance for repeated lookups

### 8. Resource URI Pattern
```
client:///[uuid]              -> Get client with stats
goal:///[uuid]                -> Get goal with details
activity:///[uuid]            -> Get activity with details
shift_note:///[uuid]          -> Get shift note with details
stakeholder:///[uuid]         -> Get stakeholder with activity summary
dashboard://summary           -> Get full dashboard
```

## Build & Development Workflow

### TypeScript Compilation
```bash
npm run build
# Outputs to: dist/
# Deletes compiled Convex files (kept in convex/_generated/)
```

**tsconfig.json Highlights:**
- Target: ES2022, Module: Node16
- Strict mode: ALL checks enabled
- Source maps: Yes (for debugging)
- Declaration maps: Yes (for consumers)

### Development Mode
```bash
npm run dev
# Runs: tsc --watch
# Auto-recompiles on src/ changes
```

### Testing
```bash
npm test                    # Run tests once
npm run test:watch         # Watch mode
npm run test:coverage      # Generate coverage report
```

Uses Jest with TypeScript support (`ts-jest`).

### Linting & Formatting
```bash
npm run lint               # Check code style
npm run lint:fix           # Auto-fix issues
npm run format             # Prettier formatting
npm run format:check       # Check if formatted
npm run type-check         # TypeScript check (no emit)
```

ESLint config: `eslint.config.js` (flat config format)

### Running the Server

**Local JSON Storage:**
```bash
npm run build
npm start
# Listens on stdin/stdout (MCP protocol)
# Data stored in ./data/*.json
```

**With Convex:**
```bash
npm run build
STORAGE_TYPE=convex CONVEX_URL=https://... npm start
```

**MCP Inspector (Debugging):**
```bash
npm run build
npm run inspector
# Opens interactive UI on localhost:5000
```

## MCP Integration Points

### 1. Server Creation (index.ts)
```typescript
const server = new Server(
  { name: 'agnovat-mcp-server', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {}, prompts: {} } }
);
```

### 2. Tool Registration
- `registerTools()`: Sets handlers for `ListToolsRequest` and `CallToolRequest`
- Returns 32 tool definitions with schemas
- Handlers call business logic from `src/tools/`

### 3. Resource Registration
- `registerResources()`: Sets handlers for `ListResourcesRequest` and `ReadResourceRequest`
- Parses URI pattern: `type:///path`
- Calls get functions to build responses

### 4. Prompt Registration
- `registerPrompts()`: Sets handlers for `ListPromptsRequest` and `GetPromptRequest`
- Returns prompt templates with argument schemas
- Can reference dynamic data (e.g., recent client list)

### 5. Transport
```typescript
const transport = new StdioServerTransport();
await server.connect(transport);
```

Stdio transport handles JSON-RPC framing on stdin/stdout.

## Convex Integration (convex/)

### Schema Definition (schema.ts)
- 5 tables: clients, goals, activities, shift_notes, stakeholders
- Indexes for common queries (by_client, by_status, by_date, etc.)
- Types use Convex validators (`v.string()`, `v.id()`, etc.)

### Generated API (convex/_generated/api.ts)
Auto-generated from schema. Contains:
- `api.queries.*` - Query function types
- `api.mutations.*` - Mutation function types

NOT committed to git. Regenerated via `convex dev` or `convex deploy`.

### Queries (queries.ts)
- `getById()` - Fetch single record
- `list()` - List with filtering
- Other query functions

### Mutations (mutations.ts)
- `upsert()` - Create or update
- `deleteRecord()` - Hard delete
- Other mutation functions

### Build Cleanup
The build script removes compiled Convex files (but NOT `_generated/`):
```bash
find convex -type f \( -name '*.js' -o -name '*.js.map' -o -name '*.d.ts' -o -name '*.d.ts.map' \) ! -path 'convex/_generated/*' -delete
```

This ensures only source files are in Git.

## Entity Relationships

```
Client (1) ------- (many) Goals
  |
  +------- (many) Activities ------ (many) Goals
  |
  +------- (many) Shift Notes ------ (many) Goals

Stakeholder (1) ------- (many) Activities
  |
  +------- (many) Shift Notes
```

**Key Rules:**
- Goal must reference existing client_id
- Activity must reference existing client_id and stakeholder_id
- Activity can link multiple goals
- Shift note must reference existing client_id and user_id
- Shift note can track progress on multiple goals
- Cannot create goal for inactive client
- Cannot create activity for archived goal (business rule)

## Environment Variables

**Required (Convex mode):**
- `CONVEX_URL` - Convex deployment URL

**Optional (JSON mode):**
- `STORAGE_TYPE` - 'json' (default) or 'convex'
- `DATA_DIR` - Directory for JSON files (default: './data')

**Configured in Claude Desktop:**
See `claude_desktop_config.json`:
```json
{
  "agnovat": {
    "command": "node",
    "args": ["/path/to/dist/index.js"],
    "env": {
      "STORAGE_TYPE": "convex",
      "CONVEX_URL": "https://..."
    }
  }
}
```

## Testing Approach

**Unit Tests:** Located in `tests/` directory using Jest.

**Integration Testing:** Use MCP Inspector to test full request-response flow:
```bash
npm run build
npm run inspector
# Opens http://localhost:5000
# Can manually call tools with sample inputs
```

**Manual Testing with Claude:** Configure claude_desktop_config.json and restart Claude Desktop.

## Common Operations Flow

### Creating a Client with Goals and Activities

1. `create_client` tool
   - Validates input (name, DOB)
   - Checks NDIS number uniqueness
   - Generates UUID, timestamps
   - Saves to storage

2. `create_goal` tool
   - Validates goal data
   - Confirms client exists and is active
   - Links to client_id
   - Saves to storage

3. `create_activity` tool
   - Validates activity data
   - Confirms client and stakeholder exist
   - Optionally links to goals
   - Saves to storage

4. `create_shift_note` tool
   - Captures raw notes from staff
   - Can reference activities and goals
   - Includes location and time tracking

5. `get_dashboard` tool
   - Aggregates client count, active goals, recent activities
   - Identifies at-risk goals
   - Returns high-level metrics

### Updating Records

- `update_client`, `update_goal`, `update_activity`, `update_shift_note`
- All fields optional (partial updates)
- Only shift notes have time restrictions (24-hour edit window)
- All updates refresh `updated_at` timestamp

### Deactivating vs. Archiving

- Clients: soft delete via `deactivate_client` (sets `active: false`)
- Goals: soft delete via `archive_goal` (sets `archived: true`)
- Stakeholders: soft delete via `deactivate_stakeholder` (sets `active: false`)
- Activities/shift notes: no built-in deactivate (are immutable after creation mostly)

## Performance Considerations

### JSON Storage
- In-memory cache improves repeated reads significantly
- File locking adds ~10ms per write (depends on filesystem)
- No index support: list/find operations scan all records
- Good for <10k records per collection

### Convex Storage
- Indexes via `by_client`, `by_status`, `by_date`, etc.
- Cloud-based: latency depends on network
- Better for large datasets (100k+ records)
- Automatic scaling, backup, and sync

## Security & Compliance

### NDIS Considerations
- **PII Protection:** Logger auto-redacts sensitive fields
- **Soft Deletes:** Maintains audit trail (no permanent deletion)
- **Timestamps:** All operations timestamped
- **No Encryption:** At-rest encryption depends on storage backend (Convex handles this)

### Input Validation
- All MCP tool inputs validated with Zod schemas
- Business rules enforced (e.g., client must exist before creating goal)
- File locking prevents concurrent corruption (JSON backend)

### Error Handling
- Errors sent back to MCP client with code + message
- No stack traces exposed in MCP responses
- Detailed logging internally (with PII redaction)

## Extending the Codebase

### Adding a New Tool

1. **Create input/output models** (src/models/newentity.ts)
   ```typescript
   export interface NewEntity { id: string; /* ... */ }
   export interface CreateNewEntityInput { /* without id/timestamps */ }
   ```

2. **Add Zod schema** (src/validation/schemas.ts)
   ```typescript
   export const createNewEntitySchema = z.object({ /* ... */ });
   ```

3. **Implement tool function** (src/tools/newentity.ts)
   ```typescript
   export async function createNewEntity(storage, input) {
     const data = validateWithSchema(createNewEntitySchema, input);
     // Business logic + storage.write()
   }
   ```

4. **Register with MCP** (src/mcp/tools.ts)
   ```typescript
   {
     name: 'create_new_entity',
     description: '...',
     inputSchema: { /* Zod to JSON Schema conversion */ }
   },
   // In toolHandlers:
   create_new_entity: (storage, args) => createNewEntity(storage, args),
   ```

5. **Add to Convex schema** (convex/schema.ts) if using Convex backend

### Adding a New Collection

1. Update `CollectionName` type (src/storage/types.ts)
2. Create model file (src/models/*)
3. Add initialization in JsonStorage.initialize()
4. Add Convex table definition
5. Implement CRUD tools

## Documentation & References

- `README.md` - Project overview and setup
- `TESTING_GUIDE.md` - How to test MCP server
- `MCP_INSPECTOR_GUIDE.md` - Using MCP Inspector for debugging
- `RESOURCE_TESTING.md` - Testing resources and prompts
- Official MCP Docs: https://modelcontextprotocol.io
- Convex Docs: https://docs.convex.dev
- Zod Documentation: https://zod.dev

## Known Limitations & Future Improvements

### Current Limitations
1. **No multi-tenancy** - Single-instance server (no org isolation)
2. **No real-time sync** - Changes not pushed to clients
3. **No offline support** - Requires active connection
4. **File locking latency** - JSON storage can be slow under high concurrency
5. **No search indexing** - Text search is linear scan

### Planned Improvements
1. Add full-text search capability
2. Add data export (PDF, Excel formats)
3. Add webhook notifications
4. Add role-based access control (RBAC)
5. Add audit logging (separate from regular logs)
6. Add bulk operations (batch create, batch update)
7. Add metrics/analytics dashboard

