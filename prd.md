Product Requirements Document (PRD)
NDIS Management MCP Server - MVP
Version: 1.0
 Date: October 18, 2025
 Status: Draft for Review
 Project Code: NDIS-MCP-MVP

Table of Contents
Executive Summary
Product Overview
Goals and Objectives
User Personas
Functional Requirements
Data Models & Schema
MCP Server Specifications
Non-Functional Requirements
Technical Architecture
Success Metrics
Out of Scope (Phase 2)
Assumptions & Constraints
Acceptance Criteria

1. Executive Summary
1.1 Purpose
This document defines the requirements for building an MVP (Minimum Viable Product) MCP (Model Context Protocol) server to manage NDIS (National Disability Insurance Scheme) participant support. The system will track clients, goals, activities, shift notes, and stakeholder involvement.
1.2 Problem Statement
NDIS support workers and coordinators need a streamlined way to:
Track participant goals and progress
Document daily activities and their impact on goals
Record shift observations and handover information
View client progress at a glance through a dashboard
1.3 Solution
An MCP server that provides structured tools for creating, reading, updating, and querying NDIS participant data, enabling AI assistants (like Claude) to help manage support documentation efficiently.
1.4 MVP Scope
In Scope:
Client management
Goal tracking with progress
Activity logging (linked to goals)
Shift notes documentation
Stakeholder management (staff, coordinators, therapists)
Dashboard with summary views
Out of Scope for MVP:
Incident/behavior management
Budget/funding tracking
Scheduling system
Barriers/challenges/opportunities tracking
Skill development tracking
Document attachments
Advanced reporting

2. Product Overview
2.1 Product Description
An MCP server that exposes tools and resources for managing NDIS participant support data. The server acts as a data layer that AI assistants can interact with to help support workers document and track client progress.
2.2 Key Features
Client Management - Store and retrieve participant information
Goal Tracking - Create and monitor SMART goals with progress tracking
Activity Logging - Record activities that support client goals
Shift Documentation - Comprehensive shift notes with observations
Stakeholder Registry - Track staff, coordinators, and therapists
Dashboard - Aggregated view of client progress and recent activity
2.3 Target Users
Support workers (direct care staff)
Team leaders/coordinators
Support coordinators
Therapists
Service managers

3. Goals and Objectives
3.1 Business Goals
Reduce time spent on documentation by 40%
Improve goal progress tracking accuracy
Enable better handover communication between shifts
Provide clear visibility into client progress
3.2 User Goals
Quickly document shift activities and observations
Easily link activities to client goals
View client progress at a glance
Generate shift summaries efficiently
3.3 Technical Goals
Create a robust MCP server architecture
Design scalable data models for future expansion
Ensure data integrity and consistency
Provide intuitive tool interfaces

4. User Personas
4.1 Persona 1: Support Worker (Sarah)
Role: Direct support worker
 Goals:
Document shifts quickly at end of day
Know which goals to focus on during activities
Understand client progress
Pain Points:
Paper forms take too long
Hard to remember what happened during busy shifts
Unclear how activities connect to goals
How MVP Helps:
Quick shift note entry via AI assistant
View active goals before shift
Link activities to goals easily
4.2 Persona 2: Support Coordinator (Marcus)
Role: NDIS support coordinator
 Goals:
Monitor multiple clients' goal progress
Identify clients who need additional support
Prepare for plan reviews
Pain Points:
Manual compilation of progress reports
No single view of client progress
Delayed information from support workers
How MVP Helps:
Dashboard shows all clients at a glance
Goal progress updated in real-time
Easy access to recent activities and notes
4.3 Persona 3: Team Leader (Priya)
Role: Team leader/supervisor
 Goals:
Ensure quality documentation
Monitor team performance
Address client concerns promptly
Pain Points:
Inconsistent documentation quality
Hard to spot patterns or issues
Manual review of all notes
How MVP Helps:
Standardized documentation structure
Quick search across all shift notes
Dashboard highlights recent concerns

5. Functional Requirements
5.1 Client Management
FR-1.1: Create Client
Priority: P0 (Must Have)
 Description: System must allow creation of new client profiles.
Input Requirements:
Full name (required)
Date of birth (required)
NDIS participant number (optional)
Primary contact (optional)
Support requirements/notes (optional)
Active status (default: true)
Validation Rules:
Name must not be empty
Date of birth must be valid date in the past
NDIS number must be unique if provided
Output: Client ID and confirmation
FR-1.2: View Client
Priority: P0 (Must Have)
 Description: Retrieve complete client information including summary statistics.
Input: Client ID
Output:
Full client details
Count of active goals
Count of completed activities (last 30 days)
Most recent shift note date
Stakeholders involved
FR-1.3: Update Client
Priority: P1 (Should Have)
 Description: Modify client information.
Input: Client ID and fields to update
Validation: Cannot change client ID
FR-1.4: List Clients
Priority: P0 (Must Have)
 Description: Retrieve list of all clients with filtering.
Filters:
Active status (active/inactive/all)
Search by name
Output: Array of client summaries with basic info
FR-1.5: Deactivate Client
Priority: P1 (Should Have)
 Description: Mark client as inactive (soft delete).
Input: Client ID, reason (optional)
Validation: Cannot deactivate if has active goals

5.2 Goal Management
FR-2.1: Create Goal
Priority: P0 (Must Have)
 Description: Create a new goal for a client.
Input Requirements:
Client ID (required)
Goal title (required)
Goal description (required)
Category (required) - from predefined list
Target date (required)
Status (default: "Not Started")
Progress percentage (default: 0)
Goal Categories:
Daily Living
Social & Community Participation
Health & Wellbeing
Learning & Education
Employment
Relationships
Home & Living
Validation Rules:
Client must exist
Target date must be in the future
Title must be 5-200 characters
Description must not be empty
Output: Goal ID and confirmation
FR-2.2: View Goal
Priority: P0 (Must Have)
 Description: Retrieve complete goal information.
Input: Goal ID
Output:
Full goal details
List of activities supporting this goal
Progress history (from shift notes)
Days until target date
FR-2.3: Update Goal Progress
Priority: P0 (Must Have)
 Description: Update goal status and progress percentage.
Input:
Goal ID
New status (optional)
New progress percentage (optional)
Progress notes (optional)
Status Options:
Not Started
In Progress
Achieved
Discontinued
On Hold
Validation:
Progress must be 0-100
If status is "Achieved", progress should be 100
Business Rules:
Auto-update last_modified date
If progress reaches 100%, suggest status change to "Achieved"
FR-2.4: List Goals for Client
Priority: P0 (Must Have)
 Description: Retrieve all goals for a specific client.
Input: Client ID
Filters:
Status filter (active, achieved, all)
Category filter
Output: Array of goals sorted by target date
FR-2.5: Archive Goal
Priority: P1 (Should Have)
 Description: Mark goal as achieved or discontinued with reason.
Input: Goal ID, final status, completion notes
Validation: Cannot archive if already archived

5.3 Activity Management
FR-3.1: Create Activity
Priority: P0 (Must Have)
 Description: Log an activity for a client.
Input Requirements:
Client ID (required)
Title (required)
Description (optional)
Activity type (required)
Activity date (required)
Start time (optional)
End time (optional)
Status (required) - "Scheduled" or "Completed"
Goal IDs (optional, array) - which goals this supports
Stakeholder ID (required) - who performed/scheduled it
Outcome notes (required if status is "Completed")
Location (optional)
Activity Types:
Community Access
Life Skills Training
Therapy Session
Recreation/Leisure
Personal Care
Household Tasks
Social Activity
Health Appointment
Other
Validation Rules:
Client must exist
Date cannot be more than 7 days in future for "Completed"
If end time provided, must be after start time
Outcome notes required if status is "Completed"
Goal IDs must exist and belong to the client
Output: Activity ID and confirmation
FR-3.2: View Activity
Priority: P0 (Must Have)
 Description: Retrieve complete activity information.
Input: Activity ID
Output:
Full activity details
Linked goals information
Stakeholder who performed it
Client information
FR-3.3: Update Activity
Priority: P0 (Must Have)
 Description: Modify activity details, particularly marking as completed.
Input: Activity ID and fields to update
Common Update: Change status from "Scheduled" to "Completed" and add outcome notes
Validation: Cannot change client ID
FR-3.4: List Activities
Priority: P0 (Must Have)
 Description: Retrieve activities with various filters.
Filters:
Client ID
Date range (from_date, to_date)
Status (Scheduled, Completed, Cancelled)
Activity type
Stakeholder ID
Goal ID (activities supporting this goal)
Output: Array of activities sorted by date (descending)
FR-3.5: Link Activity to Goal
Priority: P0 (Must Have)
 Description: Associate an activity with one or more goals.
Input: Activity ID, Goal ID(s)
Validation: Goal must belong to same client as activity

5.4 Shift Notes Management
FR-4.1: Create Shift Note
Priority: P0 (Must Have)
 Description: Document a support shift.
Input Requirements:
Client ID (required)
Stakeholder ID (required) - who wrote the note
Shift date (required)
Start time (required)
End time (required)
General observations (required)
Mood/engagement notes (optional)
Activities completed (array of Activity IDs, optional)
Goals progressed (array with Goal ID and progress notes, optional)
Concerns/follow-ups (optional)
Handover notes (optional)
Validation Rules:
Client and stakeholder must exist
End time must be after start time
Shift date cannot be more than 7 days in past
Activity IDs must exist and belong to client
Goal IDs must exist and belong to client
Output: Shift note ID and confirmation
FR-4.2: View Shift Note
Priority: P0 (Must Have)
 Description: Retrieve complete shift note.
Input: Shift note ID
Output:
Full shift note details
Client information
Stakeholder information
Linked activities (full details)
Goals progressed (with context)
FR-4.3: List Shift Notes
Priority: P0 (Must Have)
 Description: Retrieve shift notes with filters.
Filters:
Client ID
Stakeholder ID
Date range (from_date, to_date)
Has concerns (boolean)
Output: Array of shift notes sorted by date (descending)
Default Behavior: Return last 30 days if no date range specified
FR-4.4: Update Shift Note
Priority: P1 (Should Have)
 Description: Edit shift note within 24 hours of creation.
Input: Shift note ID and fields to update
Validation:
Can only edit within 24 hours of creation
Cannot change client or stakeholder

5.5 Stakeholder Management
FR-5.1: Create Stakeholder
Priority: P0 (Must Have)
 Description: Add a new stakeholder to the system.
Input Requirements:
Full name (required)
Role (required)
Contact email (optional)
Contact phone (optional)
Active status (default: true)
Role Options:
Support Worker
Team Leader
Support Coordinator
Therapist (OT, Physio, Speech)
Behavior Support Practitioner
Plan Manager
Other
Validation Rules:
Name must not be empty
Email must be valid format if provided
Role must be from predefined list
Output: Stakeholder ID and confirmation
FR-5.2: View Stakeholder
Priority: P0 (Must Have)
 Description: Retrieve stakeholder information.
Input: Stakeholder ID
Output:
Full stakeholder details
List of clients they support
Recent activities count
Recent shift notes count
FR-5.3: List Stakeholders
Priority: P0 (Must Have)
 Description: Retrieve all stakeholders.
Filters:
Role
Active status
Client ID (stakeholders supporting this client)
Output: Array of stakeholders
FR-5.4: Update Stakeholder
Priority: P1 (Should Have)
 Description: Modify stakeholder information.
Input: Stakeholder ID and fields to update

5.6 Dashboard
FR-6.1: Get Dashboard Data
Priority: P0 (Must Have)
 Description: Retrieve aggregated data for dashboard view.
Input: Optional filters (client_id, date_range)
Output:
{
  "summary": {
    "total_clients": 15,
    "active_clients": 12,
    "total_active_goals": 48,
    "activities_this_week": 127,
    "shift_notes_this_week": 45
  },
  "clients_overview": [
    {
      "client_id": "...",
      "name": "...",
      "active_goals_count": 4,
      "goals_on_track": 3,
      "goals_at_risk": 1,
      "last_activity_date": "...",
      "last_shift_note_date": "..."
    }
  ],
  "recent_activities": [
    // Last 10 activities across all clients
  ],
  "upcoming_activities": [
    // Next 7 days scheduled activities
  ],
  "recent_shift_notes": [
    // Last 10 shift notes
  ],
  "goals_by_status": {
    "not_started": 5,
    "in_progress": 38,
    "achieved": 12,
    "on_hold": 3
  },
  "goals_at_risk": [
    // Goals with target date < 14 days and progress < 50%
  ]
}

FR-6.2: Get Client Summary
Priority: P0 (Must Have)
 Description: Quick summary of a single client.
Input: Client ID
Output:
{
  "client": {/* client details */},
  "goals_summary": {
    "active": 4,
    "achieved_this_month": 1,
    "average_progress": 65
  },
  "recent_activities": [/* last 5 */],
  "latest_shift_note": {/* most recent */},
  "upcoming_activities": [/* next 7 days */]
}


6. Data Models & Schema
6.1 Client Schema
{
  "id": "string (UUID)",
  "name": "string (required)",
  "date_of_birth": "string (ISO date, required)",
  "ndis_number": "string (optional)",
  "primary_contact": "string (optional)",
  "support_notes": "string (optional)",
  "active": "boolean (default: true)",
  "created_at": "string (ISO datetime)",
  "updated_at": "string (ISO datetime)"
}

Example:
{
  "id": "c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
  "name": "John Smith",
  "date_of_birth": "1995-03-15",
  "ndis_number": "43012345678",
  "primary_contact": "Mary Smith (Mother) - 0412 345 678",
  "support_notes": "Non-verbal, uses communication device. Enjoys music and swimming.",
  "active": true,
  "created_at": "2025-01-15T09:30:00Z",
  "updated_at": "2025-01-15T09:30:00Z"
}


6.2 Goal Schema
{
  "id": "string (UUID)",
  "client_id": "string (UUID, required)",
  "title": "string (required, 5-200 chars)",
  "description": "string (required)",
  "category": "string (required, enum)",
  "target_date": "string (ISO date, required)",
  "status": "string (required, enum)",
  "progress_percentage": "number (0-100, default: 0)",
  "created_at": "string (ISO datetime)",
  "updated_at": "string (ISO datetime)",
  "achieved_at": "string (ISO datetime, optional)",
  "archived": "boolean (default: false)"
}

Status Enum:
"not_started"
"in_progress"
"achieved"
"discontinued"
"on_hold"
Category Enum:
"daily_living"
"social_community"
"health_wellbeing"
"learning_education"
"employment"
"relationships"
"home_living"
Example:
{
  "id": "g1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
  "client_id": "c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
  "title": "Independently prepare simple meals",
  "description": "Learn to prepare 3 simple meals (sandwich, pasta, salad) with minimal prompting",
  "category": "daily_living",
  "target_date": "2025-06-30",
  "status": "in_progress",
  "progress_percentage": 45,
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-03-20T14:30:00Z",
  "achieved_at": null,
  "archived": false
}


6.3 Activity Schema
{
  "id": "string (UUID)",
  "client_id": "string (UUID, required)",
  "stakeholder_id": "string (UUID, required)",
  "title": "string (required)",
  "description": "string (optional)",
  "activity_type": "string (required, enum)",
  "activity_date": "string (ISO date, required)",
  "start_time": "string (HH:MM, optional)",
  "end_time": "string (HH:MM, optional)",
  "status": "string (required, enum)",
  "goal_ids": "array of strings (UUIDs, optional)",
  "outcome_notes": "string (required if completed)",
  "location": "string (optional)",
  "created_at": "string (ISO datetime)",
  "updated_at": "string (ISO datetime)"
}

Status Enum:
"scheduled"
"completed"
"cancelled"
Activity Type Enum:
"community_access"
"life_skills"
"therapy"
"recreation"
"personal_care"
"household_tasks"
"social_activity"
"health_appointment"
"other"
Example:
{
  "id": "a1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
  "client_id": "c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
  "stakeholder_id": "s1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
  "title": "Cooking session - making pasta",
  "description": "Practice making pasta with tomato sauce",
  "activity_type": "life_skills",
  "activity_date": "2025-03-20",
  "start_time": "14:00",
  "end_time": "15:30",
  "status": "completed",
  "goal_ids": ["g1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6"],
  "outcome_notes": "John successfully boiled pasta with 2 verbal prompts. Needed hand-over-hand support for sauce. Showed great pride in finished meal!",
  "location": "Client's home",
  "created_at": "2025-03-20T14:00:00Z",
  "updated_at": "2025-03-20T15:35:00Z"
}


6.4 Shift Note Schema
{
  "id": "string (UUID)",
  "client_id": "string (UUID, required)",
  "stakeholder_id": "string (UUID, required)",
  "shift_date": "string (ISO date, required)",
  "start_time": "string (HH:MM, required)",
  "end_time": "string (HH:MM, required)",
  "general_observations": "string (required)",
  "mood_notes": "string (optional)",
  "activity_ids": "array of strings (UUIDs, optional)",
  "goals_progress": "array of objects (optional)",
  "concerns": "string (optional)",
  "handover_notes": "string (optional)",
  "created_at": "string (ISO datetime)",
  "updated_at": "string (ISO datetime)"
}

goals_progress Structure:
{
  "goal_id": "string (UUID)",
  "progress_notes": "string",
  "progress_observed": "number (0-100, optional)"
}

Example:
{
  "id": "sn1a2b3c-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
  "client_id": "c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
  "stakeholder_id": "s1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
  "shift_date": "2025-03-20",
  "start_time": "14:00",
  "end_time": "18:00",
  "general_observations": "John was in a positive mood today. Engaged well in all activities. Communication was clear using his device.",
  "mood_notes": "Happy, engaged, cooperative",
  "activity_ids": [
    "a1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
    "a2b3c4d5-e6f7-g8h9-i0j1-k2l3m4n5o6p7"
  ],
  "goals_progress": [
    {
      "goal_id": "g1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
      "progress_notes": "Made significant progress in meal prep today. Required less prompting than last week.",
      "progress_observed": 5
    }
  ],
  "concerns": null,
  "handover_notes": "John mentioned wanting to try making pizza next session. Low on pasta in pantry.",
  "created_at": "2025-03-20T18:15:00Z",
  "updated_at": "2025-03-20T18:15:00Z"
}


6.5 Stakeholder Schema
{
  "id": "string (UUID)",
  "name": "string (required)",
  "role": "string (required, enum)",
  "email": "string (optional)",
  "phone": "string (optional)",
  "active": "boolean (default: true)",
  "created_at": "string (ISO datetime)",
  "updated_at": "string (ISO datetime)"
}

Role Enum:
"support_worker"
"team_leader"
"support_coordinator"
"therapist"
"behavior_support_practitioner"
"plan_manager"
"other"
Example:
{
  "id": "s1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
  "name": "Sarah Johnson",
  "role": "support_worker",
  "email": "sarah.johnson@example.com",
  "phone": "0412 345 678",
  "active": true,
  "created_at": "2025-01-10T09:00:00Z",
  "updated_at": "2025-01-10T09:00:00Z"
}


6.6 Data Relationships
Client (1) ──has_goal──> (M) Goal
Client (1) ──has_activity──> (M) Activity
Client (1) ──has_shift_note──> (M) Shift Note

Goal (1) <──supports_goal── (M) Activity
Goal (M) <──progressed_in── (M) Shift Note

Activity (M) ──performed_by──> (1) Stakeholder
Activity (M) <──includes_activity── (M) Shift Note

Shift Note (M) ──written_by──> (1) Stakeholder

Stakeholder (1) ──supports──> (M) Client (implicit through activities/notes)


7. MCP Server Specifications
7.1 MCP Server Metadata
{
  "name": "ndis-support-server",
  "version": "1.0.0",
  "description": "MCP server for managing NDIS participant support, goals, activities, and shift notes",
  "author": "Your Organization",
  "capabilities": {
    "tools": true,
    "resources": true,
    "prompts": true
  }
}


7.2 Tools Definition
Tool: create_client
Description: Create a new client profile
Input Schema:
{
  "type": "object",
  "properties": {
    "name": {"type": "string", "minLength": 1},
    "date_of_birth": {"type": "string", "format": "date"},
    "ndis_number": {"type": "string"},
    "primary_contact": {"type": "string"},
    "support_notes": {"type": "string"}
  },
  "required": ["name", "date_of_birth"]
}

Returns: Client object with ID

Tool: get_client
Description: Retrieve client information and summary
Input Schema:
{
  "type": "object",
  "properties": {
    "client_id": {"type": "string", "format": "uuid"}
  },
  "required": ["client_id"]
}

Returns: Client object with summary stats

Tool: list_clients
Description: List all clients with optional filters
Input Schema:
{
  "type": "object",
  "properties": {
    "active_only": {"type": "boolean", "default": true},
    "search": {"type": "string"}
  }
}

Returns: Array of client objects

Tool: update_client
Description: Update client information
Input Schema:
{
  "type": "object",
  "properties": {
    "client_id": {"type": "string", "format": "uuid"},
    "name": {"type": "string"},
    "ndis_number": {"type": "string"},
    "primary_contact": {"type": "string"},
    "support_notes": {"type": "string"}
  },
  "required": ["client_id"]
}

Returns: Updated client object

Tool: create_goal
Description: Create a new goal for a client
Input Schema:
{
  "type": "object",
  "properties": {
    "client_id": {"type": "string", "format": "uuid"},
    "title": {"type": "string", "minLength": 5, "maxLength": 200},
    "description": {"type": "string", "minLength": 1},
    "category": {
      "type": "string",
      "enum": ["daily_living", "social_community", "health_wellbeing", 
               "learning_education", "employment", "relationships", "home_living"]
    },
    "target_date": {"type": "string", "format": "date"}
  },
  "required": ["client_id", "title", "description", "category", "target_date"]
}

Returns: Goal object with ID

Tool: get_goal
Description: Retrieve goal information
Input Schema:
{
  "type": "object",
  "properties": {
    "goal_id": {"type": "string", "format": "uuid"}
  },
  "required": ["goal_id"]
}

Returns: Goal object with related activities

Tool: list_goals
Description: List goals for a client
Input Schema:
{
  "type": "object",
  "properties": {
    "client_id": {"type": "string", "format": "uuid"},
    "status": {
      "type": "string",
      "enum": ["active", "achieved", "all"],
      "default": "active"
    },
    "category": {"type": "string"}
  },
  "required": ["client_id"]
}

Returns: Array of goal objects

Tool: update_goal_progress
Description: Update goal status and progress
Input Schema:
{
  "type": "object",
  "properties": {
    "goal_id": {"type": "string", "format": "uuid"},
    "status": {
      "type": "string",
      "enum": ["not_started", "in_progress", "achieved", "discontinued", "on_hold"]
    },
    "progress_percentage": {"type": "number", "minimum": 0, "maximum": 100},
    "notes": {"type": "string"}
  },
  "required": ["goal_id"]
}

Returns: Updated goal object

Tool: create_activity
Description: Log an activity for a client
Input Schema:
{
  "type": "object",
  "properties": {
    "client_id": {"type": "string", "format": "uuid"},
    "stakeholder_id": {"type": "string", "format": "uuid"},
    "title": {"type": "string", "minLength": 1},
    "description": {"type": "string"},
    "activity_type": {
      "type": "string",
      "enum": ["community_access", "life_skills", "therapy", "recreation",
               "personal_care", "household_tasks", "social_activity", 
               "health_appointment", "other"]
    },
    "activity_date": {"type": "string", "format": "date"},
    "start_time": {"type": "string", "pattern": "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"},
    "end_time": {"type": "string", "pattern": "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"},
    "status": {"type": "string", "enum": ["scheduled", "completed", "cancelled"]},
    "goal_ids": {"type": "array", "items": {"type": "string", "format": "uuid"}},
    "outcome_notes": {"type": "string"},
    "location": {"type": "string"}
  },
  "required": ["client_id", "stakeholder_id", "title", "activity_type", 
               "activity_date", "status"]
}

Returns: Activity object with ID

Tool: get_activity
Description: Retrieve activity information
Input Schema:
{
  "type": "object",
  "properties": {
    "activity_id": {"type": "string", "format": "uuid"}
  },
  "required": ["activity_id"]
}

Returns: Activity object with linked goals and stakeholder info

Tool: list_activities
Description: List activities with filters
Input Schema:
{
  "type": "object",
  "properties": {
    "client_id": {"type": "string", "format": "uuid"},
    "stakeholder_id": {"type": "string", "format": "uuid"},
    "from_date": {"type": "string", "format": "date"},
    "to_date": {"type": "string", "format": "date"},
    "status": {"type": "string", "enum": ["scheduled", "completed", "cancelled"]},
    "activity_type": {"type": "string"},
    "goal_id": {"type": "string", "format": "uuid"}
  }
}

Returns: Array of activity objects

Tool: update_activity
Description: Update activity details
Input Schema:
{
  "type": "object",
  "properties": {
    "activity_id": {"type": "string", "format": "uuid"},
    "status": {"type": "string", "enum": ["scheduled", "completed", "cancelled"]},
    "outcome_notes": {"type": "string"},
    "goal_ids": {"type": "array", "items": {"type": "string", "format": "uuid"}}
  },
  "required": ["activity_id"]
}

Returns: Updated activity object

Tool: create_shift_note
Description: Create a shift note
Input Schema:
{
  "type": "object",
  "properties": {
    "client_id": {"type": "string", "format": "uuid"},
    "stakeholder_id": {"type": "string", "format": "uuid"},
    "shift_date": {"type": "string", "format": "date"},
    "start_time": {"type": "string", "pattern": "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"},
    "end_time": {"type": "string", "pattern": "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"},
    "general_observations": {"type": "string", "minLength": 1},
    "mood_notes": {"type": "string"},
    "activity_ids": {"type": "array", "items": {"type": "string", "format": "uuid"}},
    "goals_progress": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "goal_id": {"type": "string", "format": "uuid"},
          "progress_notes": {"type": "string"},
          "progress_observed": {"type": "number", "minimum": 0, "maximum": 100}
        },
        "required": ["goal_id", "progress_notes"]
      }
    },
    "concerns": {"type": "string"},
    "handover_notes": {"type": "string"}
  },
  "required": ["client_id", "stakeholder_id", "shift_date", 
               "start_time", "end_time", "general_observations"]
}

Returns: Shift note object with ID

Tool: get_shift_note
Description: Retrieve shift note
Input Schema:
{
  "type": "object",
  "properties": {
    "shift_note_id": {"type": "string", "format": "uuid"}
  },
  "required": ["shift_note_id"]
}

Returns: Shift note object with linked entities

Tool: list_shift_notes
Description: List shift notes with filters
Input Schema:
{
  "type": "object",
  "properties": {
    "client_id": {"type": "string", "format": "uuid"},
    "stakeholder_id": {"type": "string", "format": "uuid"},
    "from_date": {"type": "string", "format": "date"},
    "to_date": {"type": "string", "format": "date"},
    "has_concerns": {"type": "boolean"}
  }
}

Returns: Array of shift note objects

Tool: create_stakeholder
Description: Create a new stakeholder
Input Schema:
{
  "type": "object",
  "properties": {
    "name": {"type": "string", "minLength": 1},
    "role": {
      "type": "string",
      "enum": ["support_worker", "team_leader", "support_coordinator",
               "therapist", "behavior_support_practitioner", "plan_manager", "other"]
    },
    "email": {"type": "string", "format": "email"},
    "phone": {"type": "string"}
  },
  "required": ["name", "role"]
}

Returns: Stakeholder object with ID

Tool: get_stakeholder
Description: Retrieve stakeholder information
Input Schema:
{
  "type": "object",
  "properties": {
    "stakeholder_id": {"type": "string", "format": "uuid"}
  },
  "required": ["stakeholder_id"]
}

Returns: Stakeholder object with activity summary

Tool: list_stakeholders
Description: List all stakeholders
Input Schema:
{
  "type": "object",
  "properties": {
    "role": {"type": "string"},
    "active_only": {"type": "boolean", "default": true}
  }
}

Returns: Array of stakeholder objects

Tool: get_dashboard
Description: Get dashboard summary data
Input Schema:
{
  "type": "object",
  "properties": {
    "client_id": {"type": "string", "format": "uuid"},
    "date_range_days": {"type": "number", "default": 7}
  }
}

Returns: Dashboard data object (see FR-6.1)

Tool: get_client_summary
Description: Get quick summary for a specific client
Input Schema:
{
  "type": "object",
  "properties": {
    "client_id": {"type": "string", "format": "uuid"}
  },
  "required": ["client_id"]
}

Returns: Client summary object (see FR-6.2)

Tool: search_clients
Description: Search clients by name
Input Schema:
{
  "type": "object",
  "properties": {
    "query": {"type": "string", "minLength": 1}
  },
  "required": ["query"]
}

Returns: Array of matching client objects

7.3 Resources Definition
Resources provide read-only access to data entities.
Resource: client:///{client_id}
Description: Client information
 MIME Type: application/json
 Contents: Full client object with summary
Resource: goal:///{goal_id}
Description: Goal information
 MIME Type: application/json
 Contents: Full goal object with linked activities
Resource: activity:///{activity_id}
Description: Activity information
 MIME Type: application/json
 Contents: Full activity object
Resource: shift_note:///{shift_note_id}
Description: Shift note information
 MIME Type: application/json
 Contents: Full shift note object
Resource: stakeholder:///{stakeholder_id}
Description: Stakeholder information
 MIME Type: application/json
 Contents: Full stakeholder object
Resource: dashboard://summary
Description: Dashboard overview
 MIME Type: application/json
 Contents: Dashboard summary data

7.4 Prompts Definition
Prompts are reusable templates for common workflows.
Prompt: create_shift_note_for_client
Description: Guided shift note creation
Arguments:
client_name (required)
shift_date (optional, defaults to today)
Prompt Template:
I'll help you create a shift note for {client_name}. Let me gather the necessary information:

1. First, let me find the client in the system
2. What time did your shift start and end?
3. What were your general observations during the shift?
4. How was {client_name}'s mood and engagement?
5. What activities did you complete together?
6. Did you observe progress on any goals?
7. Are there any concerns or follow-ups needed?
8. Any handover notes for the next shift?

Once I have this information, I'll create the shift note for you.


Prompt: review_client_progress
Description: Generate client progress summary
Arguments:
client_name (required)
time_period (optional, default: "last 30 days")
Prompt Template:
I'll create a progress summary for {client_name} covering {time_period}.

I'll include:
1. Current active goals and progress percentages
2. Recent activities and how they support goals
3. Observations from recent shift notes
4. Goals at risk of missing target dates
5. Achievements and positive developments
6. Recommended focus areas

Let me gather this information now...


Prompt: plan_activity_for_goal
Description: Help plan an activity to support a goal
Arguments:
client_name (required)
goal_description (optional)
Prompt Template:
I'll help you plan an activity for {client_name} to support their goal: {goal_description}.

Let me check:
1. The specific goal details and requirements
2. Activities that have worked well in the past
3. Current progress on this goal
4. {client_name}'s preferences and support needs

Based on this, I'll suggest:
- Activity type and description
- Duration and timing
- Resources or preparation needed
- Expected outcomes
- How to document progress

Would you like me to schedule this activity once we've planned it?


Prompt: handover_summary
Description: Create shift handover summary
Arguments:
client_name (required)
shift_date (optional, defaults to today)
Prompt Template:
I'll create a handover summary for {client_name} from the shift on {shift_date}.

This will include:
1. Key observations from the shift
2. Activities completed
3. Any concerns or incidents
4. Medication/care tasks completed
5. Progress on current goals
6. Important notes for next shift
7. Upcoming scheduled activities

Let me pull together the shift notes now...


8. Non-Functional Requirements
8.1 Performance
NFR-1: Tool calls must respond within 500ms for simple queries
NFR-2: Dashboard data must load within 2 seconds
NFR-3: List operations should support pagination for 100+ records
NFR-4: System should handle 10 concurrent users without degradation
8.2 Data Integrity
NFR-5: All timestamps must be in ISO 8601 format with timezone
NFR-6: UUIDs must be used for all entity IDs
NFR-7: Foreign key references must be validated before creation
NFR-8: Data must be backed up daily
NFR-9: Soft deletes must be used (maintain data history)
8.3 Usability
NFR-10: Error messages must be clear and actionable
NFR-11: Tool input schemas must have helpful descriptions
NFR-12: Enum values must use human-readable labels
NFR-13: Date inputs should accept multiple formats (ISO, DD/MM/YYYY, natural language)
8.4 Security
NFR-14: No personally identifiable information in logs
NFR-15: Data must be stored in local filesystem or secure database
NFR-16: Input validation must prevent injection attacks
NFR-17: Sensitive fields (NDIS numbers) should be stored securely
8.5 Maintainability
NFR-18: Code must follow TypeScript/JavaScript best practices
NFR-19: All functions must have JSDoc comments
NFR-20: Data schemas must be versioned
NFR-21: Migration path must exist for schema changes
8.6 Scalability
NFR-22: Architecture must support future database migration
NFR-23: Data model must accommodate Phase 2 features without breaking changes
NFR-24: System should handle 100 clients, 500 goals, 5000 activities without performance issues

9. Technical Architecture
9.1 Technology Stack
Primary Language: TypeScript/JavaScript (Node.js)
MCP Framework: @modelcontextprotocol/sdk
Data Storage (MVP): JSON files
data/clients.json
data/goals.json
data/activities.json
data/shift_notes.json
data/stakeholders.json
Alternative (Phase 2): SQLite or PostgreSQL
Dependencies:
uuid - Generate unique IDs
zod - Schema validation
date-fns - Date manipulation
fs-extra - File operations
9.2 Project Structure
ndis-mcp-server/
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── tools/
│   │   ├── clients.ts           # Client management tools
│   │   ├── goals.ts             # Goal management tools
│   │   ├── activities.ts        # Activity management tools
│   │   ├── shift-notes.ts       # Shift note tools
│   │   ├── stakeholders.ts      # Stakeholder tools
│   │   └── dashboard.ts         # Dashboard tools
│   ├── resources/
│   │   └── index.ts             # Resource handlers
│   ├── prompts/
│   │   └── index.ts             # Prompt templates
│   ├── storage/
│   │   ├── base.ts              # Base storage interface
│   │   ├── json-storage.ts      # JSON file storage
│   │   └── types.ts             # Storage type definitions
│   ├── models/
│   │   ├── client.ts            # Client data model
│   │   ├── goal.ts              # Goal data model
│   │   ├── activity.ts          # Activity data model
│   │   ├── shift-note.ts        # Shift note data model
│   │   └── stakeholder.ts       # Stakeholder data model
│   ├── validation/
│   │   └── schemas.ts           # Zod validation schemas
│   └── utils/
│       ├── errors.ts            # Error handling
│       ├── dates.ts             # Date utilities
│       └── validation.ts        # Validation helpers
├── data/                        # Data storage directory
├── tests/                       # Test files
├── package.json
├── tsconfig.json
└── README.md

9.3 Data Storage Strategy
For MVP (JSON Files):
Each entity type stored in separate JSON file:
{
  "version": "1.0.0",
  "last_updated": "2025-03-20T18:00:00Z",
  "records": [
    {/* entity object */},
    {/* entity object */}
  ]
}

File Locking: Use simple file locking to prevent concurrent write conflicts
Indexing: In-memory indexes built on server start for quick lookups
Backup: Daily JSON file snapshots

9.4 Error Handling
Error Types:
ValidationError - Invalid input data
NotFoundError - Entity not found
ConflictError - Business rule violation (e.g., duplicate, constraint)
StorageError - Data storage issues
AuthorizationError - Permission denied (Phase 2)
Error Response Format:
{
  "error": {
    "type": "ValidationError",
    "message": "Invalid date format for target_date",
    "field": "target_date",
    "code": "INVALID_DATE"
  }
}


9.5 Validation Strategy
Input Validation: All tool inputs validated using Zod schemas
Business Rules Validation:
Client must exist before creating related entities
Dates must be logical (end after start, target in future)
Status transitions must be valid
Required fields enforced based on status
Data Integrity Validation:
Foreign key references validated
Enum values checked against allowed list
Date/time formats verified
String length constraints enforced

10. Success Metrics
10.1 MVP Launch Criteria
Must Have: ✅ All P0 functional requirements implemented
 ✅ 5 sample clients with goals and activities created
 ✅ Dashboard displays correctly
 ✅ All 20 core tools functioning
 ✅ Input validation working
 ✅ Basic error handling implemented
 ✅ Data persists correctly
 ✅ Can create complete workflow: Client → Goal → Activity → Shift Note
Should Have: ✅ All P1 functional requirements implemented
 ✅ 3 prompt templates working
 ✅ Resource endpoints functioning
 ✅ Search functionality working
10.2 Success Metrics (Post-Launch)
Usage Metrics:
10+ clients actively tracked within first month
50+ shift notes created per week
80% of activities linked to goals
Dashboard accessed daily by team leaders
Quality Metrics:
Zero data loss incidents
95% of tool calls succeed
Average response time < 500ms
User satisfaction score > 4/5
Efficiency Metrics:
40% reduction in documentation time
60% faster shift handovers
Goal progress updated within 24 hours of activities

11. Out of Scope (Phase 2)
11.1 Deferred Features
Incident & Behavior Management:
Incident logging and tracking
Behavior type classification
De-escalation strategy tracking
Incident trend analysis
Mandatory reporting workflows
Advanced Goal Tracking:
Barriers and challenges tracking
Opportunities identification
Skills development tracking
Requirements management
Achievement archiving
Scheduling System:
Activity templates
Recurring schedules
Planned activity generation
Calendar integration
Rostering
NDIS-Specific:
Plan management
Budget tracking
Funding category allocation
Service agreements
Claim preparation
Collaboration Features:
Team chat/messaging
Task assignment
Approval workflows
Notifications/alerts
Email integration
Advanced Features:
Document attachments
Photo uploads
Multi-language support
Mobile app
Offline mode
Role-based access control
Audit logs
Advanced analytics
Report generation
Export to PDF/Excel

12. Assumptions & Constraints
12.1 Assumptions
Single Organization: MVP designed for one organization/team
Trust Model: All users trusted, no auth required for MVP
Internet Connection: Server runs locally or in trusted environment
Data Volume: Maximum 100 clients in MVP phase
Concurrent Users: Maximum 10 simultaneous users
English Only: All text in English for MVP
Desktop Use: Primarily accessed via desktop AI assistant
Training Provided: Users will receive training on using the system
Data Migration: No existing data to migrate for MVP
Backup Responsibility: Organization responsible for data backups
12.2 Constraints
Timeline: MVP must be delivered in 4-6 weeks
Budget: Limited budget, using open-source tools only
Resources: Single developer for MVP
Technology: Must use MCP protocol, Node.js environment
Storage: File-based storage only (no database server)
Compliance: Must not violate NDIS Practice Standards
Privacy: Must protect participant information
Accessibility: Should follow WCAG 2.1 guidelines where applicable
12.3 Dependencies
MCP SDK: Requires @modelcontextprotocol/sdk package
Node.js: Requires Node.js v18 or higher
AI Assistant: Designed to work with Claude or compatible AI
File System: Requires read/write access to local filesystem
Operating System: Cross-platform (Windows, macOS, Linux)

13. Acceptance Criteria
13.1 User Story Acceptance Criteria
US-1: As a support worker, I want to document my shift activities so that other team members know what happened
Acceptance Criteria:
✅ Can create a shift note with all required fields
✅ Can link activities completed during shift
✅ Can note progress on specific goals
✅ Can add concerns or handover notes
✅ Shift note is immediately visible to other users
✅ Takes less than 5 minutes to complete

US-2: As a support coordinator, I want to track client goal progress so that I can prepare plan reviews
Acceptance Criteria:
✅ Can view all active goals for a client
✅ Can see progress percentage for each goal
✅ Can view activities supporting each goal
✅ Can update goal progress based on observations
✅ Can identify goals at risk (< 50% progress with < 30 days to target)
✅ Can see trend of progress over time

US-3: As a team leader, I want to see a dashboard of all clients so that I can monitor overall service delivery
Acceptance Criteria:
✅ Dashboard loads within 2 seconds
✅ Shows summary statistics (clients, goals, activities)
✅ Lists all active clients with key metrics
✅ Shows recent activities across all clients
✅ Shows upcoming scheduled activities
✅ Highlights clients with concerns noted
✅ Identifies goals at risk

US-4: As a support worker, I want to link activities to goals so that we can track what's working
Acceptance Criteria:
✅ Can select one or more goals when creating an activity
✅ Can add goals to existing activities
✅ Can view all activities for a specific goal
✅ Activity outcome notes capture progress toward goal
✅ Goal progress can be updated based on activity outcomes

US-5: As any user, I want to search for clients quickly so that I can access their information
Acceptance Criteria:
✅ Can search by client name (partial match)
✅ Search returns results within 500ms
✅ Results show basic client info
✅ Can navigate directly to client details from results

13.2 Technical Acceptance Criteria
Data Persistence:
✅ All data survives server restart
✅ Concurrent writes don't corrupt data
✅ Data files are human-readable JSON
Validation:
✅ Invalid inputs rejected with clear error messages
✅ Foreign key references validated
✅ Date formats accepted in multiple formats
✅ Required fields enforced
Performance:
✅ Simple queries respond in < 500ms
✅ Dashboard loads in < 2 seconds
✅ Can handle 100 clients without slowdown
✅ Memory usage remains stable over time
Error Handling:
✅ Errors return structured error objects
✅ Errors include helpful messages
✅ No crashes from invalid inputs
✅ Network errors handled gracefully
MCP Compliance:
✅ Server implements MCP protocol correctly
✅ All tools have proper input schemas
✅ Resources are accessible via URI
✅ Prompts work as expected

13.3 Testing Acceptance Criteria
Unit Tests:
✅ 80%+ code coverage
✅ All data models tested
✅ All validation rules tested
✅ All business logic tested
Integration Tests:
✅ All tool endpoints tested end-to-end
✅ Data persistence verified
✅ Relationship integrity tested
✅ Error scenarios covered
User Acceptance Testing:
✅ 5 users successfully complete workflows
✅ Users can create client, goal, activity, shift note
✅ Dashboard displays accurate data
✅ Search returns expected results
✅ No data loss during testing
✅ Users rate ease of use 4/5 or higher

14. Development Phases
Phase 1: Foundation (Week 1)
Set up project structure
Implement data models
Create JSON storage layer
Build basic CRUD operations
Implement validation
Deliverables:
Project scaffolding complete
Data models defined
Storage working
Basic tests passing

Phase 2: Core Tools (Week 2-3)
Implement client tools
Implement goal tools
Implement activity tools
Implement stakeholder tools
Add relationship management
Deliverables:
All CRUD tools working
Relationships functioning
Error handling complete
Tool tests passing

Phase 3: Shift Notes & Dashboard (Week 3-4)
Implement shift note tools
Build dashboard aggregations
Create search functionality
Implement prompts
Deliverables:
Shift notes working
Dashboard functional
Search operational
Prompts available

Phase 4: Polish & Testing (Week 5-6)
Complete testing
Fix bugs
Optimize performance
Write documentation
User acceptance testing
Deliverables:
All tests passing
Documentation complete
UAT successful
MVP ready for use

15. Documentation Requirements
15.1 Technical Documentation
API reference for all tools
Data model documentation
Setup and installation guide
Configuration guide
Troubleshooting guide
15.2 User Documentation
Quick start guide
User workflows (step-by-step)
Best practices
FAQ
Example prompts for AI assistant
15.3 Developer Documentation
Architecture overview
Code organization
Testing strategy
Deployment guide
Contribution guidelines

16. Approval & Sign-off
16.1 Stakeholder Review
[ ] Product Owner
[ ] Technical Lead
[ ] Support Coordinator (User Representative)
[ ] Support Worker (User Representative)
[ ] Team Leader (User Representative)
16.2 Sign-off Criteria
All stakeholders have reviewed PRD
MVP scope is agreed upon
Success criteria are clear
Timeline is realistic
Resources are allocated

Appendix A: Glossary
NDIS: National Disability Insurance Scheme - Australian government program supporting people with disability
Participant: Person receiving NDIS support (also called "client" in this system)
Support Worker: Staff member providing direct support to participants
Support Coordinator: Professional who helps participants understand and implement their NDIS plan
MCP: Model Context Protocol - Protocol for AI assistants to interact with external tools and data
Stakeholder: Anyone involved in supporting a participant (staff, coordinators, therapists, etc.)
SMART Goal: Specific, Measurable, Achievable, Relevant, Time-bound goal
Shift Note: Documentation of a support shift, including activities and observations
Activity: Any task, outing, or support provided to a participant
Dashboard: Summary view showing key metrics and recent activity across all clients

Appendix B: Sample Data
Sample Client
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Alex Thompson",
  "date_of_birth": "1998-07-22",
  "ndis_number": "43012345678",
  "primary_contact": "Jennifer Thompson (Mother) - 0412 345 678",
  "support_notes": "Uses wheelchair. Enjoys art and music. Non-verbal, uses communication device (Proloquo2Go). Allergic to peanuts.",
  "active": true,
  "created_at": "2025-01-15T09:00:00Z",
  "updated_at": "2025-01-15T09:00:00Z"
}

Sample Goal
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "client_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Develop independent meal preparation skills",
  "description": "Alex will independently prepare 3 simple meals (toast with spread, sandwich, pasta with sauce) with no more than 2 verbal prompts",
  "category": "daily_living",
  "target_date": "2025-09-30",
  "status": "in_progress",
  "progress_percentage": 35,
  "created_at": "2025-01-20T10:00:00Z",
  "updated_at": "2025-03-15T14:30:00Z",
  "achieved_at": null,
  "archived": false
}

Sample Activity
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "client_id": "550e8400-e29b-41d4-a716-446655440000",
  "stakeholder_id": "880e8400-e29b-41d4-a716-446655440003",
  "title": "Cooking session - making pasta",
  "description": "Practice boiling pasta and heating premade sauce",
  "activity_type": "life_skills",
  "activity_date": "2025-03-15",
  "start_time": "14:00",
  "end_time": "15:30",
  "status": "completed",
  "goal_ids": ["660e8400-e29b-41d4-a716-446655440001"],
  "outcome_notes": "Alex successfully measured pasta using the cup measure. Required hand-over-hand support to lift pot. Independently stirred sauce with verbal prompts for safety. Very proud of finished meal and ate it all!",
  "location": "Alex's home kitchen",
  "created_at": "2025-03-15T14:00:00Z",
  "updated_at": "2025-03-15T15:35:00Z"
}


Document History
Version
Date
Author
Changes
1.0
2025-10-18
Team
Initial MVP PRD created


End of Product Requirements Document

