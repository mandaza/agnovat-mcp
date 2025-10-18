# Testing Guide for Agnovat MCP Server

This guide explains how to test the Agnovat MCP Server with Claude Desktop and other AI applications without needing a frontend.

## Overview

The Model Context Protocol (MCP) allows AI assistants like Claude to use your server's tools directly. You can test all 32 tools interactively through natural conversation.

## Option 1: Testing with Claude Desktop (Recommended)

Claude Desktop is the easiest way to test your MCP server interactively.

### Prerequisites

- Claude Desktop installed ([Download here](https://claude.ai/download))
- Your MCP server built and ready (`npm run build`)
- Node.js 18+ installed

### Configuration Steps

#### 1. Locate Claude Desktop Configuration File

The configuration file location depends on your operating system:

**macOS**:
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows**:
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux**:
```bash
~/.config/Claude/claude_desktop_config.json
```

#### 2. Add Your MCP Server

Edit the configuration file to add your server:

```json
{
  "mcpServers": {
    "agnovat": {
      "command": "node",
      "args": [
        "/Users/mandaza/Documents/Project/agnovat-mcp/dist/index.js"
      ],
      "env": {
        "STORAGE_TYPE": "json",
        "DATA_DIR": "/Users/mandaza/Documents/Project/agnovat-mcp/data"
      }
    }
  }
}
```

**For Convex Storage**:
```json
{
  "mcpServers": {
    "agnovat": {
      "command": "node",
      "args": [
        "/Users/mandaza/Documents/Project/agnovat-mcp/dist/index.js"
      ],
      "env": {
        "STORAGE_TYPE": "convex",
        "CONVEX_URL": "https://your-project.convex.cloud"
      }
    }
  }
}
```

**Important**: Replace `/Users/mandaza/Documents/Project/agnovat-mcp` with your actual project path.

#### 3. Restart Claude Desktop

After saving the configuration:
1. Quit Claude Desktop completely
2. Restart the application
3. Your MCP server will be loaded automatically

#### 4. Verify Connection

In Claude Desktop, you should see:
- A small indicator showing MCP servers are connected
- You can ask: "What tools do you have available?"
- Claude should list all 32 Agnovat tools

### Testing Your Tools

Once connected, you can test tools through natural conversation:

**Example 1: Create a Client**
```
You: Can you create a new client for me?
Name: Sarah Johnson
Date of Birth: 1990-05-15
NDIS Number: 43098765432
Support Notes: Requires mobility assistance
```

**Example 2: Create a Goal**
```
You: Create a goal for Sarah Johnson to improve independent living skills.
Category: Daily Living
Target Date: 2025-12-31
Description: Learn to prepare simple meals independently
Milestones:
- Master kitchen safety
- Prepare cold meals
- Cook simple hot meals
```

**Example 3: Get Dashboard**
```
You: Show me the current dashboard overview
```

**Example 4: Create Shift Note**
```
You: I need to document a shift for Sarah Johnson today from 2pm to 6pm.
General observations: Client was engaged and motivated
Mood: Positive, expressed pride in achievements
Handover notes: Continue working on kitchen timing skills
```

### Using MCP Resources

You can also access resources directly by URI:

```
You: Can you show me the client with ID 550e8400-e29b-41d4-a716-446655440000?

You: Show me the dashboard summary

You: Retrieve goal 880e8400-e29b-41d4-a716-446655440003
```

### Using MCP Prompts

The server provides 6 guided prompt templates:

```
You: Use the "create_shift_note_for_client" prompt to help me document a shift

You: Use the "review_client_progress" prompt for Sarah Johnson

You: Help me plan an activity for a specific goal using the planning prompt

You: Generate a handover summary for the current shift

You: Create a weekly report for this week

You: Review at-risk goals and suggest action plans
```

## Option 2: MCP Inspector (Development Tool)

The MCP Inspector is a debugging tool for testing MCP servers.

### Installation

```bash
npm install -g @modelcontextprotocol/inspector
```

### Running the Inspector

```bash
# Start your MCP server
cd /Users/mandaza/Documents/Project/agnovat-mcp
STORAGE_TYPE=json DATA_DIR=./data mcp-inspector dist/index.js
```

This opens a web interface where you can:
- See all available tools, resources, and prompts
- Test individual tools with JSON inputs
- Inspect tool responses
- Debug connection issues

### Using the Inspector

1. **Select a Tool**: Choose from the list of 32 tools
2. **Enter Parameters**: Fill in the JSON input fields
3. **Execute**: Run the tool and see the response
4. **Inspect**: View detailed request/response data

**Example Tool Test**:
```json
{
  "name": "John Smith",
  "date_of_birth": "1995-03-15",
  "ndis_number": "43012345678",
  "support_notes": "Requires assistance with daily living skills"
}
```

## Option 3: Direct Node.js Testing

You can test the server programmatically using Node.js.

### Create a Test Script

Create `test-client.js`:

```javascript
import { ConvexClient } from 'convex/browser';

const client = new ConvexClient('https://your-project.convex.cloud');

// Test creating a client
async function testCreateClient() {
  const result = await client.mutation('mutations.upsert', {
    table: 'clients',
    data: {
      name: 'Test Client',
      date_of_birth: '1990-01-01',
      ndis_number: '43099999999',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  });
  console.log('Created client:', result);
}

testCreateClient();
```

### Run the Test

```bash
node test-client.js
```

## Option 4: Other MCP-Compatible Applications

### 1. **Continue.dev** (VS Code Extension)
- AI coding assistant with MCP support
- Configure in `.continue/config.json`
- Test tools while coding

### 2. **Cody** (Sourcegraph)
- AI code assistant
- Supports MCP servers
- Good for development workflows

### 3. **Custom Integration**
- Build your own client using `@modelcontextprotocol/sdk`
- Full control over testing scenarios

## Troubleshooting

### Server Not Connecting

**Check Claude Desktop logs** (macOS):
```bash
tail -f ~/Library/Logs/Claude/mcp*.log
```

**Common Issues**:
1. **Wrong path**: Verify the absolute path to `dist/index.js` (not `build/`)
2. **Build not updated**: Run `npm run build` again
3. **Environment variables**: Check STORAGE_TYPE and paths
4. **Node version**: Ensure Node.js 18+ is installed

### Tools Not Appearing

**Verify server starts**:
```bash
node dist/index.js
```

Should see:
```
Using JSON file storage
Storage initialized successfully
Agnovat MCP Server started successfully
```

**Check tool registration**:
- All 32 tools should be registered in `src/mcp/tools.ts`
- Resources and prompts in their respective files
- No TypeScript errors in build

### Permission Errors

**JSON Storage**:
```bash
# Ensure data directory exists and is writable
mkdir -p data
chmod 755 data
```

**Convex Storage**:
- Verify CONVEX_URL is correct
- Check Convex dashboard for deployment status
- Ensure network connectivity

### Testing Specific Scenarios

**Test CRUD Operations**:
1. Create a client
2. Retrieve the client
3. Update the client
4. List all clients
5. Search for clients
6. Deactivate the client

**Test Business Rules**:
1. Try creating goal for inactive client (should fail)
2. Try deactivating client with active goals (should fail)
3. Update shift note after 24 hours (should fail)
4. Create activity with mismatched client IDs (should fail)

**Test Dashboard**:
1. Create multiple clients with goals
2. Add activities and shift notes
3. Request dashboard
4. Verify aggregated statistics
5. Check at-risk goal detection

## Performance Testing

### Load Testing

Create multiple entities to test performance:

```javascript
// In Claude Desktop
You: Create 50 test clients with sequential names and NDIS numbers
You: Create 10 goals for each client
You: Generate 100 activities across all clients
You: Show me the dashboard (should load in < 2 seconds)
```

### Query Performance

Test complex queries:
```
You: List all activities for the past 30 days
You: Show me all at-risk goals across all clients
You: Get weekly report for this week
```

## Production Testing Checklist

Before deploying to production, verify:

- [ ] All 32 tools execute successfully
- [ ] Resources accessible via URIs
- [ ] Prompts provide proper guidance
- [ ] Business rules enforced correctly
- [ ] Error handling works properly
- [ ] PII not logged or exposed
- [ ] Dashboard loads within performance targets
- [ ] Concurrent operations don't corrupt data
- [ ] Backup and restore functions (JSON storage)
- [ ] Convex connection stable (Convex storage)

## Next Steps

1. **Start with Claude Desktop**: Easiest interactive testing
2. **Test all 32 tools**: Go through each category systematically
3. **Test workflows**: Create complete shift documentation flows
4. **Test edge cases**: Invalid inputs, business rule violations
5. **Performance test**: Create realistic data volumes
6. **User acceptance**: Have support workers test real scenarios

## Resources

- **Claude Desktop**: https://claude.ai/download
- **MCP Inspector**: https://github.com/modelcontextprotocol/inspector
- **MCP SDK Docs**: https://modelcontextprotocol.io/
- **Convex Dashboard**: https://dashboard.convex.dev/

---

**Ready to Test!** Start with Claude Desktop for the best interactive experience.
