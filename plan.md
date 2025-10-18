# Project Plan & Development Rules
**NDIS Management MCP Server - MVP**
**Project Code:** NDIS-MCP-MVP
**Version:** 1.0
**Date:** October 18, 2025

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Development Phases & Timeline](#development-phases--timeline)
3. [Development Rules & Standards](#development-rules--standards)
4. [Architecture Guidelines](#architecture-guidelines)
5. [Code Organization](#code-organization)
6. [Data Management Rules](#data-management-rules)
7. [Testing Strategy](#testing-strategy)
8. [Security & Privacy Guidelines](#security--privacy-guidelines)
9. [Quality Gates](#quality-gates)
10. [Risk Management](#risk-management)

---

## 1. Project Overview

### 1.1 Mission Statement
Build a robust, scalable MCP server for NDIS participant support management that reduces documentation time by 40% while improving goal tracking accuracy and handover communication.

### 1.2 Success Criteria
- All 20 core tools functioning correctly
- Dashboard loads in < 2 seconds
- Zero data loss incidents
- 80%+ code coverage with tests
- UAT completed with 4/5+ satisfaction rating

### 1.3 Key Constraints
- **Timeline:** 4-6 weeks (MVP delivery)
- **Resources:** Single developer
- **Technology:** Node.js, TypeScript, MCP SDK
- **Storage:** JSON files (no database server)
- **Compliance:** NDIS Practice Standards

---

## 2. Development Phases & Timeline

### Phase 1: Foundation (Week 1)
**Goal:** Establish solid groundwork for the entire project

#### Tasks
1. **Project Setup** (Day 1-2)
   - Initialize Node.js project with TypeScript
   - Configure tsconfig.json with strict mode
   - Install dependencies:
     - `@modelcontextprotocol/sdk`
     - `uuid`
     - `zod`
     - `date-fns`
     - `fs-extra`
   - Set up development dependencies (jest, eslint, prettier)
   - Create project folder structure
   - Initialize Git repository
   - Configure ESLint and Prettier

2. **Data Models & Schemas** (Day 2-3)
   - Define TypeScript interfaces for all entities:
     - Client
     - Goal
     - Activity
     - ShiftNote
     - Stakeholder
   - Create Zod validation schemas
   - Implement enum types (status, categories, roles)
   - Add JSDoc comments to all models

3. **Storage Layer** (Day 3-5)
   - Implement base storage interface
   - Create JSON file storage implementation
   - Add file locking mechanism
   - Implement in-memory indexing
   - Create backup/snapshot functionality
   - Write unit tests for storage layer

4. **Utilities & Error Handling** (Day 5-7)
   - Create custom error classes
   - Implement date utility functions
   - Build validation helpers
   - Create logging utility
   - Write utility tests

#### Deliverables
- ✅ Project scaffolding complete
- ✅ All data models defined with proper types
- ✅ Storage layer working with tests
- ✅ Error handling framework in place
- ✅ 80%+ test coverage for foundation code

---

### Phase 2: Core Tools (Week 2-3)
**Goal:** Implement all CRUD operations for primary entities

#### Week 2: Client & Goal Tools

**Client Tools** (Day 8-10)
- `create_client` - Create new client profile
- `get_client` - Retrieve client with summary stats
- `list_clients` - List with filters (active/inactive, search)
- `update_client` - Modify client information
- `search_clients` - Search by name
- Validation for all client operations
- Unit tests for each tool
- Integration tests for client workflows

**Goal Tools** (Day 11-14)
- `create_goal` - Create goal for client
- `get_goal` - Retrieve goal with activities
- `list_goals` - List goals with filters (status, category)
- `update_goal_progress` - Update status and percentage
- Auto-update logic (suggest "Achieved" when progress = 100%)
- Goal-client relationship validation
- Unit and integration tests

#### Week 3: Activity & Stakeholder Tools

**Activity Tools** (Day 15-17)
- `create_activity` - Log activity for client
- `get_activity` - Retrieve activity with details
- `list_activities` - List with comprehensive filters
- `update_activity` - Modify activity (especially status changes)
- Goal linking functionality
- Activity-goal relationship validation
- Unit and integration tests

**Stakeholder Tools** (Day 18-19)
- `create_stakeholder` - Add stakeholder
- `get_stakeholder` - Retrieve with activity summary
- `list_stakeholders` - List with filters (role, active)
- `update_stakeholder` - Modify stakeholder info
- Unit and integration tests

**Relationship Management** (Day 20-21)
- Implement foreign key validation
- Add cascade logic for related entities
- Create relationship integrity checks
- Test all entity relationships
- Document relationship rules

#### Deliverables
- ✅ All 16 CRUD tools implemented
- ✅ Relationships working correctly
- ✅ Comprehensive error handling
- ✅ 80%+ test coverage
- ✅ All validation rules enforced

---

### Phase 3: Shift Notes & Dashboard (Week 3-4)
**Goal:** Complete advanced features and aggregations

#### Shift Notes Implementation (Day 22-25)
**Tools:**
- `create_shift_note` - Document support shift
- `get_shift_note` - Retrieve with linked entities
- `list_shift_notes` - List with filters
- `update_shift_note` - Edit within 24 hours

**Features:**
- Link activities to shift notes
- Track goal progress in shift notes
- Validate shift time constraints
- Support complex nested data (goals_progress array)
- Unit and integration tests

#### Dashboard Implementation (Day 26-29)
**Tools:**
- `get_dashboard` - Aggregated dashboard data
- `get_client_summary` - Quick client overview

**Aggregations Required:**
- Total and active clients count
- Active goals count
- Activities this week
- Shift notes this week
- Goals by status breakdown
- Goals at risk calculation (< 50% progress, < 14 days)
- Recent activities (last 10)
- Upcoming activities (next 7 days)
- Recent shift notes (last 10)

**Performance:**
- Optimize query performance
- Implement caching for dashboard data
- Ensure < 2 second load time

#### Search & Filters (Day 29-30)
- Implement full-text search for clients
- Add advanced filtering for all list operations
- Optimize search performance (< 500ms)

#### Deliverables
- ✅ Shift notes fully functional
- ✅ Dashboard displays all required data
- ✅ Dashboard loads in < 2 seconds
- ✅ Search operational
- ✅ All tests passing

---

### Phase 4: Polish & Testing (Week 5-6)
**Goal:** Ensure production-readiness

#### MCP Integration (Day 31-33)
- Implement MCP server entry point
- Configure all tools with MCP schemas
- Set up resources endpoints:
  - `client:///{client_id}`
  - `goal:///{goal_id}`
  - `activity:///{activity_id}`
  - `shift_note:///{shift_note_id}`
  - `stakeholder:///{stakeholder_id}`
  - `dashboard://summary`
- Implement prompt templates:
  - `create_shift_note_for_client`
  - `review_client_progress`
  - `plan_activity_for_goal`
  - `handover_summary`
- Test MCP protocol compliance

#### Comprehensive Testing (Day 34-36)
- Complete unit test coverage (target: 80%+)
- Integration tests for all workflows
- End-to-end testing:
  - Create client → goal → activity → shift note
  - Dashboard data accuracy
  - Search functionality
- Performance testing (100 clients, 500 goals, 5000 activities)
- Stress testing (concurrent operations)
- Error scenario testing

#### Bug Fixes & Optimization (Day 37-38)
- Fix all identified bugs
- Optimize slow operations
- Improve error messages
- Refactor complex code
- Code review and cleanup

#### Documentation (Day 39-40)
**Technical Documentation:**
- API reference for all 20 tools
- Data model documentation
- Setup and installation guide
- Configuration guide
- Troubleshooting guide
- Architecture overview

**User Documentation:**
- Quick start guide
- User workflows (step-by-step)
- Best practices
- FAQ
- Example prompts for AI assistant

#### User Acceptance Testing (Day 41-42)
- Recruit 5 test users (support workers, coordinators, team leaders)
- Provide training
- Execute UAT test plans
- Collect feedback
- Make final adjustments
- Obtain sign-off

#### Deliverables
- ✅ All tests passing (80%+ coverage)
- ✅ Documentation complete
- ✅ UAT successful (4/5+ rating)
- ✅ MVP ready for production use
- ✅ Zero critical bugs

---

## 3. Development Rules & Standards

### 3.1 Code Quality Standards

#### TypeScript Configuration
```typescript
// tsconfig.json must include:
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### Naming Conventions
- **Files:** kebab-case (e.g., `shift-notes.ts`)
- **Classes/Interfaces:** PascalCase (e.g., `ShiftNote`, `IStorageProvider`)
- **Functions/Variables:** camelCase (e.g., `createClient`, `clientId`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_CLIENTS`, `DEFAULT_LIMIT`)
- **Enums:** PascalCase for type, UPPER_CASE for values
  ```typescript
  enum GoalStatus {
    NOT_STARTED = 'not_started',
    IN_PROGRESS = 'in_progress',
    ACHIEVED = 'achieved'
  }
  ```

#### Documentation Requirements
**Every function must have JSDoc:**
```typescript
/**
 * Creates a new client profile in the system.
 *
 * @param data - Client creation data
 * @param data.name - Full name of the client (required)
 * @param data.date_of_birth - Client's date of birth in ISO format (required)
 * @param data.ndis_number - NDIS participant number (optional)
 * @returns Promise resolving to created client object with generated ID
 * @throws {ValidationError} If required fields are missing or invalid
 * @throws {ConflictError} If NDIS number already exists
 * @throws {StorageError} If data persistence fails
 *
 * @example
 * const client = await createClient({
 *   name: "John Smith",
 *   date_of_birth: "1995-03-15",
 *   ndis_number: "43012345678"
 * });
 */
async function createClient(data: CreateClientInput): Promise<Client> {
  // Implementation
}
```

#### Error Handling Rules
1. **Always use custom error classes:**
   ```typescript
   class ValidationError extends Error {
     constructor(
       message: string,
       public field?: string,
       public code?: string
     ) {
       super(message);
       this.name = 'ValidationError';
     }
   }
   ```

2. **Never swallow errors silently:**
   ```typescript
   // ❌ BAD
   try {
     await saveData();
   } catch (e) {
     // Silent failure
   }

   // ✅ GOOD
   try {
     await saveData();
   } catch (error) {
     logger.error('Failed to save data', error);
     throw new StorageError('Data persistence failed', error);
   }
   ```

3. **Provide actionable error messages:**
   ```typescript
   // ❌ BAD
   throw new Error('Invalid input');

   // ✅ GOOD
   throw new ValidationError(
     'Date of birth must be in the past',
     'date_of_birth',
     'DATE_IN_FUTURE'
   );
   ```

### 3.2 Code Style Rules

#### Formatting
- Use Prettier with default configuration
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in multi-line structures
- Maximum line length: 100 characters

#### Linting
- ESLint with recommended TypeScript rules
- No `any` types (use `unknown` if type truly unknown)
- Prefer `const` over `let`, never use `var`
- No unused variables or imports
- Explicit return types for functions

#### Import Organization
```typescript
// 1. External dependencies
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// 2. Internal modules
import { StorageProvider } from '../storage/base';
import { Client, CreateClientInput } from '../models/client';

// 3. Types
import type { ValidationResult } from '../types';
```

### 3.3 Git Workflow Rules

#### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding/updating tests
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `chore`: Build process or tooling changes

**Examples:**
```
feat(clients): add search_clients tool

Implements full-text search functionality for clients by name.
Includes partial matching and active status filtering.

Closes #15

---

fix(goals): prevent negative progress percentages

Added validation to ensure progress is between 0-100.

---

test(activities): add integration tests for activity-goal linking
```

#### Branching Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `test/*` - Test additions

#### Pull Request Rules
1. Every PR must have:
   - Clear description of changes
   - Test coverage for new code
   - Updated documentation
   - No linting errors
   - Passing CI/CD checks

2. Code review required before merge
3. Squash commits on merge to keep history clean

---

## 4. Architecture Guidelines

### 4.1 Layered Architecture

```
┌─────────────────────────────────────┐
│        MCP Server Layer             │
│   (Tools, Resources, Prompts)       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│        Business Logic Layer         │
│  (Validation, Relationships, Rules) │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│          Data Access Layer          │
│     (Storage Provider Interface)    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│         Persistence Layer           │
│        (JSON File Storage)          │
└─────────────────────────────────────┘
```

### 4.2 Design Principles

#### Single Responsibility Principle
Each module/class has ONE clear responsibility:
- `clients.ts` - Only client-related operations
- `json-storage.ts` - Only JSON file I/O
- `schemas.ts` - Only validation schemas

#### Dependency Injection
```typescript
// ✅ GOOD - Testable, flexible
class ClientService {
  constructor(private storage: StorageProvider) {}

  async getClient(id: string): Promise<Client> {
    return this.storage.read('clients', id);
  }
}

// ❌ BAD - Tightly coupled
class ClientService {
  async getClient(id: string): Promise<Client> {
    return JSONStorage.read('clients', id); // Hard dependency
  }
}
```

#### Interface Segregation
```typescript
// Storage interface
interface StorageProvider {
  read<T>(collection: string, id: string): Promise<T>;
  write<T>(collection: string, id: string, data: T): Promise<void>;
  list<T>(collection: string, filter?: Filter): Promise<T[]>;
  delete(collection: string, id: string): Promise<void>;
}

// Don't add unnecessary methods
// Create specific interfaces for specific needs
interface SearchableStorage extends StorageProvider {
  search<T>(collection: string, query: string): Promise<T[]>;
}
```

#### Open/Closed Principle
Design for extension without modification:
```typescript
// Base storage - closed for modification
abstract class BaseStorage implements StorageProvider {
  abstract read<T>(collection: string, id: string): Promise<T>;
  // ... other methods
}

// Extended for JSON - open for extension
class JSONStorage extends BaseStorage {
  async read<T>(collection: string, id: string): Promise<T> {
    // JSON-specific implementation
  }
}

// Future: SQLiteStorage extends BaseStorage
```

### 4.3 Module Organization Rules

#### Each tool module exports:
```typescript
// src/tools/clients.ts
export const clientTools = {
  create_client: {
    description: "Create a new client profile",
    inputSchema: createClientSchema,
    handler: handleCreateClient
  },
  get_client: {
    description: "Retrieve client information",
    inputSchema: getClientSchema,
    handler: handleGetClient
  },
  // ... other tools
};
```

#### Separation of Concerns:
- **Tools** (`src/tools/`) - MCP tool definitions and handlers
- **Models** (`src/models/`) - Data structures and types
- **Validation** (`src/validation/`) - Zod schemas
- **Storage** (`src/storage/`) - Data persistence
- **Utils** (`src/utils/`) - Shared utilities

---

## 5. Code Organization

### 5.1 Project Structure
```
ndis-mcp-server/
├── src/
│   ├── index.ts                    # MCP server entry point
│   │
│   ├── tools/
│   │   ├── clients.ts              # Client management tools
│   │   ├── goals.ts                # Goal management tools
│   │   ├── activities.ts           # Activity management tools
│   │   ├── shift-notes.ts          # Shift note tools
│   │   ├── stakeholders.ts         # Stakeholder tools
│   │   ├── dashboard.ts            # Dashboard tools
│   │   └── index.ts                # Tool aggregator
│   │
│   ├── resources/
│   │   └── index.ts                # MCP resource handlers
│   │
│   ├── prompts/
│   │   └── index.ts                # MCP prompt templates
│   │
│   ├── storage/
│   │   ├── base.ts                 # Storage interface
│   │   ├── json-storage.ts         # JSON file implementation
│   │   ├── types.ts                # Storage type definitions
│   │   └── index.ts                # Storage exports
│   │
│   ├── models/
│   │   ├── client.ts               # Client model & types
│   │   ├── goal.ts                 # Goal model & types
│   │   ├── activity.ts             # Activity model & types
│   │   ├── shift-note.ts           # Shift note model & types
│   │   ├── stakeholder.ts          # Stakeholder model & types
│   │   └── index.ts                # Model exports
│   │
│   ├── validation/
│   │   ├── schemas.ts              # Zod validation schemas
│   │   ├── rules.ts                # Business validation rules
│   │   └── index.ts                # Validation exports
│   │
│   └── utils/
│       ├── errors.ts               # Custom error classes
│       ├── dates.ts                # Date utilities
│       ├── validation.ts           # Validation helpers
│       ├── logger.ts               # Logging utility
│       └── index.ts                # Utility exports
│
├── data/                           # Data storage directory
│   ├── clients.json
│   ├── goals.json
│   ├── activities.json
│   ├── shift_notes.json
│   ├── stakeholders.json
│   └── backups/                    # Daily backups
│
├── tests/
│   ├── unit/                       # Unit tests
│   │   ├── tools/
│   │   ├── storage/
│   │   ├── models/
│   │   ├── validation/
│   │   └── utils/
│   │
│   ├── integration/                # Integration tests
│   │   ├── workflows/
│   │   └── tools/
│   │
│   ├── e2e/                        # End-to-end tests
│   └── fixtures/                   # Test data
│
├── docs/
│   ├── api-reference.md            # API documentation
│   ├── architecture.md             # Architecture overview
│   ├── user-guide.md               # User documentation
│   └── examples.md                 # Example prompts
│
├── .eslintrc.json                  # ESLint configuration
├── .prettierrc.json                # Prettier configuration
├── jest.config.js                  # Jest configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies
├── package-lock.json
├── README.md                       # Project overview
└── .gitignore
```

### 5.2 File Size Limits
- Maximum file size: 500 lines
- If exceeding, split into smaller modules
- One tool per file in tools directory
- Group related utilities

### 5.3 Exports Organization
```typescript
// src/models/index.ts
export * from './client';
export * from './goal';
export * from './activity';
export * from './shift-note';
export * from './stakeholder';

// Enables clean imports:
import { Client, Goal, Activity } from '../models';
```

---

## 6. Data Management Rules

### 6.1 Data File Structure
```json
{
  "version": "1.0.0",
  "last_updated": "2025-03-20T18:00:00Z",
  "records": [
    {
      "id": "uuid-here",
      "...": "entity fields"
    }
  ]
}
```

### 6.2 Data Integrity Rules

#### 1. ID Generation
- **ALWAYS** use UUID v4 for entity IDs
- Generate on creation, never modify
- Format: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`

```typescript
import { v4 as uuidv4 } from 'uuid';

const newClient: Client = {
  id: uuidv4(),
  name: data.name,
  // ... other fields
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};
```

#### 2. Timestamps
- Use ISO 8601 format: `2025-03-20T14:30:00Z`
- Always include timezone (Z for UTC)
- Set `created_at` on creation, never modify
- Update `updated_at` on every modification

```typescript
const now = new Date().toISOString(); // "2025-03-20T14:30:00.000Z"
```

#### 3. Foreign Key Validation
**ALWAYS validate before creating relationships:**

```typescript
async function createGoal(data: CreateGoalInput): Promise<Goal> {
  // Validate client exists
  const client = await storage.read<Client>('clients', data.client_id);
  if (!client) {
    throw new NotFoundError('Client not found', 'client_id');
  }

  // Validate client is active
  if (!client.active) {
    throw new ConflictError('Cannot create goal for inactive client');
  }

  // Proceed with creation
  const goal: Goal = {
    id: uuidv4(),
    client_id: data.client_id,
    // ... rest of goal
  };

  return goal;
}
```

#### 4. Soft Deletes
- **NEVER** physically delete records
- Use `active: false` or `archived: true`
- Maintain data history for audit trail

```typescript
async function deactivateClient(id: string, reason?: string): Promise<Client> {
  const client = await storage.read<Client>('clients', id);

  // Check for active goals
  const activeGoals = await storage.list<Goal>('goals', {
    client_id: id,
    archived: false
  });

  if (activeGoals.length > 0) {
    throw new ConflictError('Cannot deactivate client with active goals');
  }

  client.active = false;
  client.updated_at = new Date().toISOString();

  await storage.write('clients', id, client);
  return client;
}
```

### 6.3 Backup Strategy

#### Daily Backups
```typescript
// Run daily at midnight
async function createBackup(): Promise<void> {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const backupDir = path.join(DATA_DIR, 'backups', timestamp);

  await fs.ensureDir(backupDir);

  // Copy all data files
  const collections = ['clients', 'goals', 'activities', 'shift_notes', 'stakeholders'];
  for (const collection of collections) {
    await fs.copy(
      path.join(DATA_DIR, `${collection}.json`),
      path.join(backupDir, `${collection}.json`)
    );
  }

  logger.info(`Backup created: ${backupDir}`);
}
```

#### Retention Policy
- Keep daily backups for 7 days
- Keep weekly backups for 1 month
- Keep monthly backups for 1 year

### 6.4 Concurrency Control

#### File Locking
```typescript
import lockfile from 'proper-lockfile';

async function writeWithLock<T>(
  collection: string,
  id: string,
  data: T
): Promise<void> {
  const filePath = path.join(DATA_DIR, `${collection}.json`);

  // Acquire lock
  const release = await lockfile.lock(filePath, {
    retries: 5,
    retryDelay: 100
  });

  try {
    // Read current data
    const fileData = await fs.readJSON(filePath);

    // Update record
    const index = fileData.records.findIndex((r: any) => r.id === id);
    if (index >= 0) {
      fileData.records[index] = data;
    } else {
      fileData.records.push(data);
    }

    fileData.last_updated = new Date().toISOString();

    // Write back
    await fs.writeJSON(filePath, fileData, { spaces: 2 });
  } finally {
    // Always release lock
    await release();
  }
}
```

---

## 7. Testing Strategy

### 7.1 Testing Pyramid

```
           ┌─────────────┐
          │   E2E Tests   │  (10% - Critical workflows)
         └───────────────┘
        ┌─────────────────┐
       │ Integration Tests │  (30% - Tool interactions)
      └───────────────────┘
     ┌─────────────────────┐
    │     Unit Tests       │  (60% - Individual functions)
   └─────────────────────┘
```

### 7.2 Unit Testing Rules

#### Every function must have tests
```typescript
// src/tools/clients.ts
export async function createClient(data: CreateClientInput): Promise<Client> {
  // Implementation
}

// tests/unit/tools/clients.test.ts
describe('createClient', () => {
  it('should create client with valid data', async () => {
    const input = {
      name: 'John Smith',
      date_of_birth: '1995-03-15'
    };

    const client = await createClient(input);

    expect(client.id).toBeDefined();
    expect(client.name).toBe('John Smith');
    expect(client.active).toBe(true);
  });

  it('should throw ValidationError for empty name', async () => {
    const input = {
      name: '',
      date_of_birth: '1995-03-15'
    };

    await expect(createClient(input)).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError for future date of birth', async () => {
    const input = {
      name: 'John Smith',
      date_of_birth: '2030-01-01'
    };

    await expect(createClient(input)).rejects.toThrow(ValidationError);
  });

  it('should throw ConflictError for duplicate NDIS number', async () => {
    // Test implementation
  });
});
```

#### Test Coverage Requirements
- Minimum 80% code coverage
- 100% coverage for validation logic
- 100% coverage for business rules
- All error paths tested

### 7.3 Integration Testing Rules

#### Test Complete Workflows
```typescript
describe('Goal Management Workflow', () => {
  let client: Client;
  let goal: Goal;

  beforeAll(async () => {
    // Setup: Create test client
    client = await createClient({
      name: 'Test Client',
      date_of_birth: '1995-01-01'
    });
  });

  it('should create goal for client', async () => {
    goal = await createGoal({
      client_id: client.id,
      title: 'Test Goal',
      description: 'Test description',
      category: 'daily_living',
      target_date: '2025-12-31'
    });

    expect(goal.client_id).toBe(client.id);
    expect(goal.status).toBe('not_started');
    expect(goal.progress_percentage).toBe(0);
  });

  it('should update goal progress', async () => {
    const updated = await updateGoalProgress({
      goal_id: goal.id,
      status: 'in_progress',
      progress_percentage: 50
    });

    expect(updated.status).toBe('in_progress');
    expect(updated.progress_percentage).toBe(50);
  });

  it('should list goals for client', async () => {
    const goals = await listGoals({ client_id: client.id });

    expect(goals).toHaveLength(1);
    expect(goals[0].id).toBe(goal.id);
  });

  afterAll(async () => {
    // Cleanup: Remove test data
  });
});
```

### 7.4 E2E Testing Rules

#### Test Critical User Journeys
```typescript
describe('Support Worker Workflow', () => {
  it('should complete full shift documentation', async () => {
    // 1. Create client
    const client = await server.callTool('create_client', {
      name: 'Alex Thompson',
      date_of_birth: '1998-07-22'
    });

    // 2. Create stakeholder (support worker)
    const stakeholder = await server.callTool('create_stakeholder', {
      name: 'Sarah Johnson',
      role: 'support_worker'
    });

    // 3. Create goal
    const goal = await server.callTool('create_goal', {
      client_id: client.id,
      title: 'Meal preparation skills',
      description: 'Independently prepare simple meals',
      category: 'daily_living',
      target_date: '2025-09-30'
    });

    // 4. Create activity
    const activity = await server.callTool('create_activity', {
      client_id: client.id,
      stakeholder_id: stakeholder.id,
      title: 'Cooking pasta',
      activity_type: 'life_skills',
      activity_date: '2025-03-20',
      status: 'completed',
      goal_ids: [goal.id],
      outcome_notes: 'Great progress!'
    });

    // 5. Create shift note
    const shiftNote = await server.callTool('create_shift_note', {
      client_id: client.id,
      stakeholder_id: stakeholder.id,
      shift_date: '2025-03-20',
      start_time: '14:00',
      end_time: '18:00',
      general_observations: 'Positive mood, engaged well',
      activity_ids: [activity.id],
      goals_progress: [{
        goal_id: goal.id,
        progress_notes: 'Significant improvement',
        progress_observed: 5
      }]
    });

    // 6. Verify dashboard shows data
    const dashboard = await server.callTool('get_dashboard', {});

    expect(dashboard.summary.total_clients).toBe(1);
    expect(dashboard.summary.total_active_goals).toBe(1);
    expect(dashboard.recent_activities).toContainEqual(
      expect.objectContaining({ id: activity.id })
    );
  });
});
```

### 7.5 Test Data Management

#### Use Fixtures
```typescript
// tests/fixtures/clients.ts
export const mockClient: Client = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test Client',
  date_of_birth: '1995-01-01',
  ndis_number: '43012345678',
  primary_contact: 'Test Contact',
  support_notes: 'Test notes',
  active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
};

// tests/fixtures/goals.ts
export const mockGoal: Goal = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  client_id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Test Goal',
  description: 'Test description',
  category: 'daily_living',
  target_date: '2025-12-31',
  status: 'in_progress',
  progress_percentage: 50,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  achieved_at: null,
  archived: false
};
```

---

## 8. Security & Privacy Guidelines

### 8.1 Data Protection Rules

#### 1. No PII in Logs
```typescript
// ❌ BAD - Logs PII
logger.info(`Creating client: ${data.name}, DOB: ${data.date_of_birth}`);

// ✅ GOOD - Logs only ID
logger.info(`Creating client with ID: ${clientId}`);
```

#### 2. Secure NDIS Numbers
```typescript
// Consider encryption for sensitive fields in Phase 2
// For MVP, ensure NDIS numbers are:
// - Not logged
// - Not exposed in error messages
// - Validated for uniqueness
```

#### 3. Input Sanitization
```typescript
import { escape } from 'html-escaper';

function sanitizeInput(input: string): string {
  // Remove potentially harmful characters
  return escape(input.trim());
}

// Use in validation schemas
const clientSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .transform(sanitizeInput),
  // ... other fields
});
```

### 8.2 Validation Rules

#### Prevent Injection Attacks
```typescript
// All user inputs MUST be validated with Zod schemas
const createClientSchema = z.object({
  name: z.string().min(1).max(200),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ndis_number: z.string().regex(/^\d{11}$/).optional(),
  primary_contact: z.string().max(500).optional(),
  support_notes: z.string().max(2000).optional()
});

// Validate BEFORE processing
async function createClient(rawInput: unknown): Promise<Client> {
  // Parse and validate
  const data = createClientSchema.parse(rawInput);

  // Now safe to process
  // ...
}
```

#### Date Validation
```typescript
import { parseISO, isValid, isPast, isFuture } from 'date-fns';

function validateDateOfBirth(dateStr: string): boolean {
  const date = parseISO(dateStr);
  return isValid(date) && isPast(date);
}

function validateTargetDate(dateStr: string): boolean {
  const date = parseISO(dateStr);
  return isValid(date) && isFuture(date);
}
```

### 8.3 Error Message Security

#### Never Expose Sensitive Data
```typescript
// ❌ BAD
throw new Error(`Client ${client.name} with NDIS ${client.ndis_number} not found`);

// ✅ GOOD
throw new NotFoundError('Client not found', 'client_id');
```

#### Never Expose Internal Paths
```typescript
// ❌ BAD
throw new Error(`Failed to read /Users/admin/data/clients.json`);

// ✅ GOOD
throw new StorageError('Failed to retrieve client data');
```

---

## 9. Quality Gates

### 9.1 Pre-Commit Checks
Before committing code, ensure:
- ✅ All tests pass (`npm test`)
- ✅ No linting errors (`npm run lint`)
- ✅ Code formatted (`npm run format`)
- ✅ No TypeScript errors (`npm run type-check`)
- ✅ Test coverage maintained (`npm run test:coverage`)

### 9.2 Phase Completion Gates

#### Phase 1 Gate
- [ ] Project structure matches plan
- [ ] All data models defined with JSDoc
- [ ] Storage layer implemented with tests
- [ ] Error handling framework complete
- [ ] 80%+ test coverage for foundation
- [ ] Documentation updated

#### Phase 2 Gate
- [ ] All 16 CRUD tools implemented
- [ ] All tools have input validation
- [ ] All relationships validated
- [ ] Foreign key checks working
- [ ] 80%+ test coverage for tools
- [ ] Integration tests passing

#### Phase 3 Gate
- [ ] Shift notes fully functional
- [ ] Dashboard loads in < 2 seconds
- [ ] All aggregations accurate
- [ ] Search returns results in < 500ms
- [ ] All tests passing
- [ ] Documentation updated

#### Phase 4 Gate (MVP Launch)
- [ ] All 20 tools working correctly
- [ ] MCP protocol compliance verified
- [ ] All resources endpoints functional
- [ ] Prompt templates working
- [ ] 80%+ overall test coverage
- [ ] No critical bugs
- [ ] Performance targets met:
  - Simple queries < 500ms
  - Dashboard < 2 seconds
  - 100 clients, 500 goals, 5000 activities supported
- [ ] Documentation complete
- [ ] UAT passed (4/5+ rating)
- [ ] Stakeholder sign-off obtained

---

## 10. Risk Management

### 10.1 Identified Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **Data corruption** | Low | High | File locking, daily backups, validation |
| **Performance issues** | Medium | Medium | In-memory indexing, caching, performance tests |
| **Scope creep** | High | High | Strict adherence to MVP scope, Phase 2 for extras |
| **Timeline delays** | Medium | Medium | Weekly progress reviews, early risk identification |
| **Data loss** | Low | Critical | Daily backups, atomic writes, transaction safety |
| **Concurrent write conflicts** | Medium | Medium | File locking mechanism, retry logic |
| **Validation gaps** | Low | Medium | Comprehensive Zod schemas, extensive testing |
| **User adoption resistance** | Low | Medium | User training, intuitive prompts, good documentation |

### 10.2 Mitigation Plans

#### Data Safety Plan
1. Implement atomic writes (write to temp file, then rename)
2. Daily automated backups
3. Weekly backup verification
4. File locking for concurrent access
5. Transaction logs for critical operations

#### Performance Monitoring Plan
1. Add timing instrumentation to all tools
2. Log slow queries (> 500ms)
3. Monitor memory usage
4. Performance regression tests in CI/CD
5. Load testing before UAT

#### Scope Management Plan
1. Reference PRD for all decisions
2. Defer non-MVP features to Phase 2
3. Document feature requests for future
4. Weekly scope review with stakeholders

---

## Summary Checklist

### Development Principles
- ✅ Write clean, documented, testable code
- ✅ Follow TypeScript strict mode
- ✅ Use dependency injection
- ✅ Validate all inputs with Zod
- ✅ Handle errors gracefully
- ✅ Test thoroughly (80%+ coverage)
- ✅ Document everything

### Data Safety
- ✅ Use UUIDs for IDs
- ✅ Use ISO 8601 for dates
- ✅ Validate foreign keys
- ✅ Soft delete only
- ✅ Daily backups
- ✅ File locking for concurrency

### Performance
- ✅ Simple queries < 500ms
- ✅ Dashboard < 2 seconds
- ✅ Support 100 clients, 500 goals, 5000 activities
- ✅ In-memory indexing
- ✅ Optimize aggregations

### Security
- ✅ No PII in logs
- ✅ Sanitize all inputs
- ✅ Validate with schemas
- ✅ Safe error messages
- ✅ Secure sensitive fields

### Quality
- ✅ All tests passing
- ✅ No linting errors
- ✅ 80%+ test coverage
- ✅ Documentation complete
- ✅ Code reviewed
- ✅ UAT successful

---

**Last Updated:** October 18, 2025
**Next Review:** End of Phase 1 (Week 1)
