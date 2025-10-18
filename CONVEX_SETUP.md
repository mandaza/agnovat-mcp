# Convex Database Integration Guide

This guide explains how to set up and use Convex as the database backend for the Agnovat MCP Server.

## Overview

The Agnovat MCP Server supports two storage backends:
- **JSON File Storage** (default) - Local file-based storage
- **Convex** - Cloud-based real-time database

## Why Convex?

- **Real-time sync** - Automatic real-time updates across clients
- **Serverless** - No database servers to manage
- **Type-safe** - Full TypeScript support with generated types
- **Scalable** - Handles production workloads automatically
- **Built-in features** - Authentication, file storage, scheduled jobs
- **Free tier** - Generous free tier for development and small deployments

## Setup Instructions

### 1. Create a Convex Account

```bash
# Sign up at https://www.convex.dev/
# Or use the CLI
npx convex dev
```

### 2. Initialize Convex Project

```bash
# This creates convex.json and generates types
npx convex dev
```

Follow the prompts to:
1. Create a new project or connect to existing
2. Choose a project name
3. Select your team

This will:
- Create `convex.json` configuration file
- Generate TypeScript types in `convex/_generated/`
- Deploy your schema and functions
- Provide you with a deployment URL

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Storage configuration
STORAGE_TYPE=convex

# Convex deployment URL (from previous step)
CONVEX_URL=https://your-project.convex.cloud

# Optional: Convex auth token for server-side operations
# CONVEX_AUTH_TOKEN=your-auth-token
```

### 4. Deploy Convex Functions

```bash
# Deploy schema and functions to Convex
npx convex deploy
```

This deploys:
- `convex/schema.ts` - Database schema
- `convex/queries.ts` - Read operations
- `convex/mutations.ts` - Write operations

### 5. Start the MCP Server

```bash
# Build the project
npm run build

# Start with Convex storage
STORAGE_TYPE=convex CONVEX_URL=your-url npm start
```

## Project Structure

```
agnovat-mcp/
├── convex/
│   ├── schema.ts           # Database schema definition
│   ├── queries.ts          # Read operations (queries)
│   ├── mutations.ts        # Write operations (mutations)
│   ├── _generated/         # Auto-generated types (git-ignored)
│   └── convex.json         # Convex project configuration
├── src/
│   └── storage/
│       ├── convex-storage.ts   # Convex storage implementation
│       ├── json-storage.ts     # JSON storage implementation
│       └── base.ts             # Storage interface
└── .env                    # Environment variables
```

## Schema Overview

The Convex schema includes five main tables:

### clients
- Stores NDIS participant information
- Indexes: `by_active`, `by_ndis_number`, `by_created_at`

### goals
- Participant goals with progress tracking
- Indexes: `by_client`, `by_status`, `by_archived`, `by_category`, `by_target_date`

### activities
- Support activities and sessions
- Indexes: `by_client`, `by_stakeholder`, `by_activity_date`, `by_status`, `by_type`

### stakeholders
- Support workers, coordinators, etc.
- Indexes: `by_active`, `by_role`, `by_name`

### shift_notes
- Shift documentation with linked activities and goals
- Indexes: `by_client`, `by_stakeholder`, `by_shift_date`

## Convex Dashboard

Access your Convex dashboard at: https://dashboard.convex.dev

Features:
- **Data Browser** - View and edit data directly
- **Functions** - Monitor query and mutation execution
- **Logs** - Real-time function logs
- **Deployments** - Manage production and dev environments
- **Settings** - Configure environment variables, auth, etc.

## Development Workflow

### Local Development

```bash
# Terminal 1: Watch for changes and auto-deploy
npx convex dev

# Terminal 2: Run MCP server
npm run dev
```

### Production Deployment

```bash
# Deploy to production
npx convex deploy --prod

# Start server with production Convex URL
STORAGE_TYPE=convex CONVEX_URL=your-prod-url npm start
```

## Switching Between Storage Types

### Use JSON Storage (default)

```bash
# Don't set STORAGE_TYPE, or set it to 'json'
npm start
```

### Use Convex Storage

```bash
# Set environment variables
export STORAGE_TYPE=convex
export CONVEX_URL=https://your-project.convex.cloud
npm start
```

## Migration from JSON to Convex

To migrate existing JSON data to Convex:

```bash
# 1. Export JSON data to migration script
node scripts/export-json.js

# 2. Import to Convex
node scripts/import-to-convex.js
```

(Note: Migration scripts to be implemented in Phase 6)

## Advanced Features

### Real-time Updates

Convex supports real-time subscriptions:

```typescript
// Subscribe to changes
const unsubscribe = client.onUpdate(
  api.queries.list,
  { table: 'clients' },
  (result) => {
    console.log('Clients updated:', result);
  }
);
```

### Scheduled Jobs

Define cron jobs in `convex/cron.ts`:

```typescript
import { cronJobs } from 'convex/server';

const crons = cronJobs();

crons.daily(
  'daily backup',
  { hourUTC: 2, minuteUTC: 0 },
  async (ctx) => {
    // Perform daily backup
  }
);

export default crons;
```

### File Storage

Convex includes file storage:

```typescript
import { mutation } from './_generated/server';

export const uploadFile = mutation({
  handler: async (ctx, { file }) => {
    return await ctx.storage.store(file);
  },
});
```

## Troubleshooting

### "CONVEX_URL is required"

**Problem**: Server fails to start with Convex storage

**Solution**: Ensure `.env` file has `CONVEX_URL` set:
```bash
CONVEX_URL=https://your-project.convex.cloud
```

### "Failed to connect to Convex"

**Problem**: Cannot connect to Convex deployment

**Solutions**:
1. Verify URL is correct
2. Check internet connection
3. Ensure Convex deployment is active
4. Check Convex dashboard for deployment status

### "Schema mismatch"

**Problem**: Schema changes not reflected

**Solution**: Redeploy schema:
```bash
npx convex deploy
```

### Type errors in `_generated/`

**Problem**: TypeScript errors in generated files

**Solution**: Regenerate types:
```bash
npx convex dev --codegen force
```

## Performance Optimization

### Indexes

Ensure queries use indexes defined in schema:

```typescript
// Good - uses index
.filter((q) => q.eq(q.field('client_id'), clientId))

// Bad - table scan
.filter((q) => q.eq(q.field('custom_field'), value))
```

### Pagination

Use limit and offset for large result sets:

```typescript
const results = await ctx.db
  .query('activities')
  .withIndex('by_client', (q) => q.eq('client_id', clientId))
  .paginate({ numItems: 50, cursor: null });
```

## Security

### Environment Variables

Never commit sensitive data:

```bash
# .gitignore
.env
.env.local
convex/_generated/
```

### Authentication

Add auth to Convex functions:

```typescript
import { mutation } from './_generated/server';

export const secureOperation = mutation({
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized');
    }
    // Perform operation
  },
});
```

## Cost Considerations

**Convex Free Tier** (as of 2025):
- 1M function calls/month
- 1 GB database storage
- 1 GB file storage
- Unlimited development deployments

**Paid Plans**: Scale as needed with usage-based pricing

## Resources

- **Convex Docs**: https://docs.convex.dev/
- **Convex Discord**: https://convex.dev/community
- **Dashboard**: https://dashboard.convex.dev/
- **Examples**: https://github.com/get-convex/convex-examples

## Support

For issues specific to Convex integration:
1. Check Convex documentation
2. Review Convex dashboard logs
3. Join Convex Discord community
4. Open issue in project repository

---

**Last Updated**: October 18, 2025
**Convex Version**: 1.28.0
**Status**: Production Ready ✅
