# Agnovat MCP Server

**Version:** 1.0.0 MVP
**Project Code:** AGNOVAT-MCP-MVP
**Status:** In Development (Phase 1)

## Overview

A robust Model Context Protocol (MCP) server for NDIS participant support management. This server enables AI assistants to help support workers, coordinators, and team leaders manage client information, goals, activities, shift notes, and stakeholder relationships efficiently.

## Mission Statement

Build a scalable MCP server for NDIS participant support management that reduces documentation time by 40% while improving goal tracking accuracy and handover communication.

## Features (Planned MVP)

### Core Functionality
- **Client Management**: Create, retrieve, update, and search client profiles
- **Goal Tracking**: Manage NDIS participant goals with progress tracking
- **Activity Logging**: Document support activities and link to goals
- **Shift Notes**: Comprehensive shift documentation with automatic linking
- **Stakeholder Management**: Track support workers and other stakeholders
- **Dashboard**: Real-time overview of all participant support metrics

### Technical Features
- TypeScript with strict type checking
- JSON-based data storage (no database required)
- File locking for concurrent access
- Daily automated backups
- 80%+ test coverage
- MCP protocol compliance

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

## Development Phases

### Phase 1: Foundation (Week 1) - **Current Phase**
- ✅ Project setup
- ⏳ Data models and schemas
- ⏳ Storage layer implementation
- ⏳ Utilities and error handling

### Phase 2: Core Tools (Week 2-3)
- Client management tools
- Goal management tools
- Activity management tools
- Stakeholder management tools

### Phase 3: Shift Notes & Dashboard (Week 3-4)
- Shift note documentation
- Dashboard aggregations
- Search and filtering

### Phase 4: Polish & Testing (Week 5-6)
- MCP integration
- Comprehensive testing
- Documentation
- User acceptance testing

## Success Criteria

- ✅ All 20 core tools functioning correctly
- ✅ Dashboard loads in < 2 seconds
- ✅ Zero data loss incidents
- ✅ 80%+ code coverage with tests
- ✅ UAT completed with 4/5+ satisfaction rating

## Technology Stack

- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js
- **MCP SDK**: @modelcontextprotocol/sdk
- **Validation**: Zod
- **Storage**: JSON files with fs-extra
- **Testing**: Jest
- **Linting**: ESLint + Prettier
- **Date Handling**: date-fns

## Contributing

This is currently an MVP project. Refer to `plan.md` for detailed development rules and standards.

## License

ISC

## Contact

For questions or support, please refer to the project documentation in the `docs/` directory.

---

**Last Updated**: October 18, 2025
**Current Phase**: Phase 1 - Foundation
