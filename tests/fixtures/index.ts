/**
 * Test Fixtures
 *
 * Sample data for testing.
 */

import { Client, Goal, Activity, Stakeholder, ShiftNote, GoalStatus, ActivityStatus } from '../../src/models/index.js';

/**
 * Mock Client
 */
export const mockClient: Client = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'John Smith',
  date_of_birth: '1995-03-15',
  ndis_number: '43012345678',
  primary_contact: 'Jane Smith (Mother) - 0400123456',
  support_notes: 'Requires assistance with daily living skills and social participation',
  active: true,
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
};

/**
 * Mock Inactive Client
 */
export const mockInactiveClient: Client = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Sarah Johnson',
  date_of_birth: '1992-07-22',
  ndis_number: '43098765432',
  active: false,
  created_at: '2024-06-01T00:00:00.000Z',
  updated_at: '2025-02-15T00:00:00.000Z',
};

/**
 * Mock Stakeholder
 */
export const mockStakeholder: Stakeholder = {
  id: '660e8400-e29b-41d4-a716-446655440000',
  name: 'Alice Williams',
  role: 'support_worker',
  email: 'alice.williams@example.com',
  phone: '0411223344',
  organization: 'Agnovat Support Services',
  notes: 'Specializes in daily living skills training',
  active: true,
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
};

/**
 * Mock Goal
 */
export const mockGoal: Goal = {
  id: '770e8400-e29b-41d4-a716-446655440000',
  client_id: mockClient.id,
  title: 'Independent meal preparation',
  description: 'Develop skills to prepare simple meals independently',
  category: 'daily_living',
  target_date: '2025-12-31',
  status: GoalStatus.IN_PROGRESS,
  progress_percentage: 40,
  milestones: [
    'Learn basic kitchen safety',
    'Prepare cold meals independently',
    'Cook simple hot meals with guidance',
  ],
  created_at: '2025-01-15T00:00:00.000Z',
  updated_at: '2025-10-01T00:00:00.000Z',
  achieved_at: null,
  archived: false,
};

/**
 * Mock At-Risk Goal
 */
export const mockAtRiskGoal: Goal = {
  id: '770e8400-e29b-41d4-a716-446655440001',
  client_id: mockClient.id,
  title: 'Public transport independence',
  description: 'Use public transport independently for common routes',
  category: 'social_community',
  target_date: '2025-11-01', // Soon + low progress = at risk
  status: GoalStatus.IN_PROGRESS,
  progress_percentage: 25,
  created_at: '2025-05-01T00:00:00.000Z',
  updated_at: '2025-09-15T00:00:00.000Z',
  achieved_at: null,
  archived: false,
};

/**
 * Mock Activity
 */
export const mockActivity: Activity = {
  id: '880e8400-e29b-41d4-a716-446655440000',
  client_id: mockClient.id,
  stakeholder_id: mockStakeholder.id,
  title: 'Cooking session - Pasta preparation',
  description: 'Practice making pasta with tomato sauce',
  activity_type: 'life_skills',
  activity_date: '2025-10-15',
  start_time: '14:00',
  end_time: '16:00',
  duration_minutes: 120,
  status: ActivityStatus.COMPLETED,
  goal_ids: [mockGoal.id],
  outcome_notes: 'Great progress! John successfully prepared pasta with minimal guidance. Needed help with timing.',
  created_at: '2025-10-15T14:00:00.000Z',
  updated_at: '2025-10-15T16:00:00.000Z',
};

/**
 * Mock Scheduled Activity
 */
export const mockScheduledActivity: Activity = {
  id: '880e8400-e29b-41d4-a716-446655440001',
  client_id: mockClient.id,
  stakeholder_id: mockStakeholder.id,
  title: 'Community outing - Shopping',
  description: 'Practice shopping for groceries',
  activity_type: 'social_community',
  activity_date: '2025-10-25',
  start_time: '10:00',
  end_time: '12:00',
  duration_minutes: 120,
  status: ActivityStatus.SCHEDULED,
  goal_ids: [mockGoal.id],
  created_at: '2025-10-18T00:00:00.000Z',
  updated_at: '2025-10-18T00:00:00.000Z',
};

/**
 * Mock Shift Note
 */
export const mockShiftNote: ShiftNote = {
  id: '990e8400-e29b-41d4-a716-446655440000',
  client_id: mockClient.id,
  stakeholder_id: mockStakeholder.id,
  shift_date: '2025-10-15',
  start_time: '14:00',
  end_time: '18:00',
  general_observations: 'John was in good spirits today. Very engaged during the cooking session and showed enthusiasm for learning new skills.',
  activity_ids: [mockActivity.id],
  goals_progress: [
    {
      goal_id: mockGoal.id,
      progress_notes: 'Significant progress in meal preparation. Successfully made pasta with minimal guidance.',
      progress_observed: 5,
    },
  ],
  mood_wellbeing: 'Positive mood throughout shift. Expressed pride in accomplishments.',
  communication_notes: 'Clear communication. Asking appropriate questions when uncertain.',
  health_safety_notes: 'All kitchen safety protocols followed correctly.',
  handover_notes: 'Continue building on today\'s success. Consider introducing more complex recipes.',
  incidents: [],
  created_at: '2025-10-15T18:00:00.000Z',
  updated_at: '2025-10-15T18:00:00.000Z',
};

/**
 * Create input data for testing
 */
export const createClientInput = {
  name: 'Test Client',
  date_of_birth: '1990-01-01',
  ndis_number: '43011111111',
  support_notes: 'Test support notes',
};

export const createGoalInput = {
  client_id: mockClient.id,
  title: 'Test Goal',
  description: 'Test goal description',
  category: 'daily_living' as const,
  target_date: '2026-12-31',
  milestones: ['Milestone 1', 'Milestone 2'],
};

export const createActivityInput = {
  client_id: mockClient.id,
  stakeholder_id: mockStakeholder.id,
  title: 'Test Activity',
  description: 'Test activity description',
  activity_type: 'life_skills' as const,
  activity_date: '2025-10-20',
  start_time: '10:00',
  end_time: '12:00',
  status: 'scheduled' as const,
  goal_ids: [mockGoal.id],
};

export const createStakeholderInput = {
  name: 'Test Stakeholder',
  role: 'support_worker' as const,
  email: 'test@example.com',
  phone: '0400000000',
};

export const createShiftNoteInput = {
  client_id: mockClient.id,
  stakeholder_id: mockStakeholder.id,
  shift_date: '2025-10-18',
  start_time: '09:00',
  end_time: '17:00',
  general_observations: 'Test shift observations',
  mood_wellbeing: 'Positive',
  handover_notes: 'Test handover notes',
};
