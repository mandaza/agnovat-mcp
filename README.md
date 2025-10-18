# Agnovat MCP Server

**Version:** 1.0.0 MVP
**Project Code:** AGNOVAT-MCP-MVP
**Status:** Phase 4 - MCP Integration Complete ✅

## Overview

A robust Model Context Protocol (MCP) server for NDIS (National Disability Insurance Scheme) participant support management. This server provides 32 comprehensive tools for managing clients, goals, activities, stakeholders, shift notes, and dashboard analytics through MCP-compliant interfaces.

## Mission Statement

Build a scalable MCP server for NDIS participant support management that reduces documentation time by 40% while improving goal tracking accuracy and handover communication.

## Features ✅

### Core Functionality (Complete)
- ✅ **Client Management**: Create, retrieve, update, deactivate, and search client profiles
- ✅ **Goal Tracking**: Manage NDIS participant goals with automated progress tracking and risk detection
- ✅ **Activity Logging**: Document support activities with goal linking and date range queries
- ✅ **Shift Notes**: Comprehensive shift documentation with 24-hour edit window
- ✅ **Stakeholder Management**: Track support workers, coordinators, and other stakeholders
- ✅ **Dashboard**: Real-time overview with aggregated metrics and at-risk goal detection

### MCP Integration (Complete)
- ✅ **32 MCP Tools**: Full CRUD operations across all entities
- ✅ **6 Resource Endpoints**: Direct URI-based entity access
- ✅ **6 Prompt Templates**: Guided workflows for common tasks
- ✅ **MCP Protocol Compliance**: Tools, resources, and prompts fully implemented

### Technical Features (Complete)
- ✅ TypeScript with strict type checking
- ✅ JSON-based data storage with file locking
- ✅ Atomic writes to prevent corruption
- ✅ Backup and restore functionality
- ✅ Comprehensive error handling
- ✅ PII-safe logging

## Project Structure

```
agnovat-mcp-server/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── tools/                # MCP tool implementations
│   ├── resources/            # MCP resource handlers
│   ├── prompts/              # MCP prompt templates
│   ├── storage/              # Data persistence layer
│   ├── models/               # Data models and types
│   ├── validation/           # Zod schemas and validation
│   └── utils/                # Utilities and helpers
├── data/                     # JSON data storage
├── tests/                    # Test suite
├── docs/                     # Documentation
└── plan.md                   # Detailed development plan
```

## Development Setup

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Watch mode for development
- `npm start` - Run the compiled server
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run lint` - Lint code
- `npm run lint:fix` - Lint and auto-fix issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types without emitting

## MCP Tools (32 Total)

### Client Tools (6)
1. `create_client` - Create new client profile with validation
2. `get_client` - Retrieve client with summary statistics
3. `list_clients` - List/search clients with filtering
4. `update_client` - Update client information
5. `deactivate_client` - Soft delete with validation
6. `search_clients` - Full-text name search

### Goal Tools (6)
7. `create_goal` - Create NDIS goal with milestones
8. `get_goal` - Retrieve goal with details
9. `list_goals` - Filter by status, category, client
10. `update_goal` - Update goal properties
11. `update_goal_progress` - Update progress with auto-status suggestion
12. `archive_goal` - Archive completed/discontinued goals

### Activity Tools (6)
13. `create_activity` - Log support activity with goal linking
14. `get_activity` - Retrieve activity with details
15. `list_activities` - Filter by date, status, client, goal
16. `update_activity` - Update activity information
17. `get_activities_by_date_range` - Query by date range
18. `get_upcoming_activities` - Get next N days scheduled

### Stakeholder Tools (6)
19. `create_stakeholder` - Create support worker/coordinator profile
20. `get_stakeholder` - Retrieve with activity summary
21. `list_stakeholders` - Filter by role, active status
22. `update_stakeholder` - Update stakeholder information
23. `deactivate_stakeholder` - Soft delete stakeholder
24. `search_stakeholders` - Full-text name search

### Shift Note Tools (6)
25. `create_shift_note` - Document shift with linked activities/goals
26. `get_shift_note` - Retrieve shift note with details
27. `list_shift_notes` - Filter by client, stakeholder, date
28. `update_shift_note` - Edit within 24-hour window
29. `get_recent_shift_notes` - Get last N shift notes
30. `get_shift_notes_for_week` - Get weekly shift notes

### Dashboard Tools (2)
31. `get_dashboard` - Aggregated metrics, at-risk goals, recent activity
32. `get_client_summary` - Client overview with goal progress
33. `get_statistics` - High-level system statistics

## MCP Resources (6)

Access entities via URI:
- `client:///{client_id}` - Client profile
- `goal:///{goal_id}` - Goal details
- `activity:///{activity_id}` - Activity details
- `shift_note:///{shift_note_id}` - Shift note
- `stakeholder:///{stakeholder_id}` - Stakeholder profile
- `dashboard://summary` - Dashboard data

## MCP Prompts (6)

Guided workflows:
1. `create_shift_note_for_client` - Step-by-step shift documentation
2. `review_client_progress` - Comprehensive progress review
3. `plan_activity_for_goal` - Activity planning assistant
4. `handover_summary` - Handover report generation
5. `weekly_report` - Weekly summary for client/organization
6. `goal_risk_review` - At-risk goal analysis with action plans

## Development Phases

### Phase 1: Foundation ✅
- ✅ Project setup and configuration
- ✅ Data models and Zod schemas (7 entities)
- ✅ JSON storage with file locking
- ✅ Utilities and error handling

### Phase 2: Core Tools ✅
- ✅ Client management tools (6 functions)
- ✅ Goal management tools (7 functions)
- ✅ Activity management tools (6 functions)
- ✅ Stakeholder management tools (6 functions)

### Phase 3: Shift Notes & Dashboard ✅
- ✅ Shift note tools (6 functions)
- ✅ Dashboard aggregations (3 functions)
- ✅ Goal risk detection
- ✅ Weekly/daily summaries

### Phase 4: MCP Integration ✅
- ✅ MCP server entry point
- ✅ Tool registration (32 tools)
- ✅ Resource endpoints (6 resources)
- ✅ Prompt templates (6 prompts)

### Phase 5: Testing & Documentation (Next)
- ⏳ Unit tests (target: 80%+ coverage)
- ⏳ Integration tests
- ⏳ E2E tests
- ⏳ API documentation
- ⏳ User guide
- ⏳ UAT with support workers

## Configuration

### Environment Variables

- `STORAGE_TYPE`: Storage backend type (`json` or `convex`, default: `json`)
- `DATA_DIR`: Directory for JSON data storage (default: `./data`)
- `CONVEX_URL`: Convex deployment URL (required if `STORAGE_TYPE=convex`)

### Data Storage Options

#### JSON File Storage (Default)
- Local file-based storage
- Atomic writes to prevent corruption
- File locking for concurrent access
- In-memory caching for performance
- Daily automated backups to `data/backups/`

#### Convex Database (Optional)
- Cloud-based real-time database
- Automatic scaling and replication
- Built-in authentication and file storage
- Type-safe with generated TypeScript types
- Free tier available for development

**See [CONVEX_SETUP.md](./CONVEX_SETUP.md) for detailed Convex integration guide.**

## Example Usage

### Creating a Client

```json
{
  "name": "John Smith",
  "date_of_birth": "1995-03-15",
  "ndis_number": "43012345678",
  "support_notes": "Requires assistance with daily living skills"
}
```

### Creating a Goal

```json
{
  "client_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Independent meal preparation",
  "category": "daily_living",
  "target_date": "2025-12-31",
  "description": "Develop skills to prepare simple meals independently",
  "milestones": [
    "Learn basic kitchen safety",
    "Prepare cold meals independently",
    "Cook simple hot meals with guidance"
  ]
}
```

### Documenting a Shift

```json
{
  "client_id": "550e8400-e29b-41d4-a716-446655440000",
  "stakeholder_id": "660e8400-e29b-41d4-a716-446655440001",
  "shift_date": "2025-10-18",
  "start_time": "14:00",
  "end_time": "18:00",
  "general_observations": "Client was engaged and motivated today. Great progress on meal prep skills.",
  "activity_ids": ["770e8400-e29b-41d4-a716-446655440002"],
  "goals_progress": [
    {
      "goal_id": "880e8400-e29b-41d4-a716-446655440003",
      "progress_notes": "Successfully prepared pasta with minimal guidance. Required help with timing.",
      "progress_observed": 5
    }
  ],
  "mood_wellbeing": "Positive mood, expressed pride in achievements",
  "handover_notes": "Continue working on timing and multitasking in kitchen"
}
```

## Business Rules

### Data Integrity

- All IDs are UUID v4 format
- Timestamps in ISO 8601 format (UTC)
- Foreign key validation on all relationships
- Soft deletes only (no physical deletion)

### Validation Rules

- Cannot create goals for inactive clients
- Cannot deactivate clients with active goals
- Activities must belong to valid client and stakeholder
- Goals and activities must belong to same client
- Shift notes can only be edited within 24 hours of shift date
- NDIS numbers must be unique across active clients

### Goal Risk Detection

Goals are flagged as "at risk" when:
- Progress < 50% AND
- Days until target date ≤ 14

### Auto-Status Suggestions

Goal status is automatically suggested based on progress:
- 0%: `not_started`
- 1-99%: `in_progress`
- 100%: `achieved`

## Performance Targets

- Simple queries: < 500ms
- Dashboard load: < 2 seconds
- Supports 100+ clients, 500+ goals, 5000+ activities
- In-memory caching reduces repeat query time by 80%+

## Security & Privacy

### PII Protection

- Sensitive fields automatically redacted from logs
- No PII in error messages
- Input sanitization on all user data
- NDIS numbers validated and protected

### Sensitive Fields (Never Logged)

- `password`, `token`, `secret`, `apiKey`
- `ndis_number`, `email`, `phone`
- `date_of_birth`, `primary_contact`

### Error Handling

Custom error classes with codes:
- `ValidationError` - Input validation failures
- `NotFoundError` - Entity not found
- `ConflictError` - Business rule violations
- `StorageError` - Data persistence failures
- `AuthorizationError` - Permission denied (e.g., edit window expired)

## Technology Stack

- **Language**: TypeScript 5.9+ (strict mode)
- **Runtime**: Node.js 18+
- **MCP SDK**: @modelcontextprotocol/sdk ^1.20
- **Validation**: Zod ^3.25
- **Storage**: JSON files with fs-extra ^11.3
- **Locking**: proper-lockfile ^4.1
- **Dates**: date-fns ^4.1
- **Testing**: Jest ^30.2
- **Linting**: ESLint ^9.38 + Prettier ^3.6

## Code Quality Standards

- TypeScript strict mode enabled
- No `any` types allowed
- 100% JSDoc coverage for public APIs
- ESLint + Prettier enforcement
- Single Responsibility Principle
- Dependency Injection pattern

## Roadmap

### Phase 5: Testing & Polish (Current)
- Unit tests for all tools
- Integration tests for workflows
- E2E tests for critical paths
- API documentation
- User guide

### Future Enhancements
- PostgreSQL storage option
- Advanced reporting and analytics
- Email/SMS notifications
- Calendar integration
- Mobile app support
- Multi-tenancy
- Role-based access control
- Export to PDF/Excel

## Contributing

This is an MVP project. Refer to `plan.md` for detailed development rules and coding standards.

### Commit Message Format

```
<type>(<scope>): <subject>

Types: feat, fix, docs, test, refactor, perf, chore
```

## License

ISC

## Support

For questions or issues, please refer to the project documentation or contact the development team.

---

**Version**: 1.0.0 MVP
**Last Updated**: October 18, 2025
**Current Phase**: Phase 4 Complete - MCP Integration ✅
**Next Phase**: Phase 5 - Testing & Documentation
