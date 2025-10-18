/**
 * Enum Types for NDIS MCP Server
 *
 * Defines all enumeration types used across the application.
 * These enums ensure type safety and consistency in status tracking,
 * categorization, and role management.
 *
 * @module models/enums
 */

/**
 * Goal status enumeration
 * Tracks the current state of a participant's goal
 */
export enum GoalStatus {
  /** Goal has been created but work hasn't started */
  NOT_STARTED = 'not_started',
  /** Goal is actively being worked on */
  IN_PROGRESS = 'in_progress',
  /** Goal has been successfully achieved */
  ACHIEVED = 'achieved',
  /** Goal is on hold or paused */
  ON_HOLD = 'on_hold',
  /** Goal has been discontinued */
  DISCONTINUED = 'discontinued',
}

/**
 * Goal category enumeration
 * Categorizes goals based on NDIS support areas
 */
export enum GoalCategory {
  /** Daily living skills and activities */
  DAILY_LIVING = 'daily_living',
  /** Social and community participation */
  SOCIAL_COMMUNITY = 'social_community',
  /** Employment and education goals */
  EMPLOYMENT = 'employment',
  /** Health and wellbeing objectives */
  HEALTH_WELLBEING = 'health_wellbeing',
  /** Home and living arrangements */
  HOME_LIVING = 'home_living',
  /** Relationships and social connections */
  RELATIONSHIPS = 'relationships',
  /** Choice and control over supports */
  CHOICE_CONTROL = 'choice_control',
  /** Other goals not fitting above categories */
  OTHER = 'other',
}

/**
 * Activity type enumeration
 * Classifies the type of support activity provided
 */
export enum ActivityType {
  /** Life skills training and development */
  LIFE_SKILLS = 'life_skills',
  /** Social and recreational activities */
  SOCIAL_RECREATION = 'social_recreation',
  /** Personal care and assistance */
  PERSONAL_CARE = 'personal_care',
  /** Community access and participation */
  COMMUNITY_ACCESS = 'community_access',
  /** Transportation and mobility support */
  TRANSPORT = 'transport',
  /** Therapy or clinical services */
  THERAPY = 'therapy',
  /** Household tasks and maintenance */
  HOUSEHOLD_TASKS = 'household_tasks',
  /** Employment or education support */
  EMPLOYMENT_EDUCATION = 'employment_education',
  /** Communication and technology assistance */
  COMMUNICATION = 'communication',
  /** Other support activities */
  OTHER = 'other',
}

/**
 * Activity status enumeration
 * Tracks completion state of activities
 */
export enum ActivityStatus {
  /** Activity is scheduled for future */
  SCHEDULED = 'scheduled',
  /** Activity is currently happening */
  IN_PROGRESS = 'in_progress',
  /** Activity has been completed */
  COMPLETED = 'completed',
  /** Activity was cancelled */
  CANCELLED = 'cancelled',
  /** Participant did not attend */
  NO_SHOW = 'no_show',
}

/**
 * Stakeholder role enumeration
 * Defines roles of people involved in participant support
 */
export enum StakeholderRole {
  /** Direct support worker */
  SUPPORT_WORKER = 'support_worker',
  /** Support coordination professional */
  SUPPORT_COORDINATOR = 'support_coordinator',
  /** Team leader or supervisor */
  TEAM_LEADER = 'team_leader',
  /** Family member */
  FAMILY = 'family',
  /** Healthcare professional */
  HEALTHCARE_PROVIDER = 'healthcare_provider',
  /** Plan manager */
  PLAN_MANAGER = 'plan_manager',
  /** NDIS planner or LAC */
  NDIS_PLANNER = 'ndis_planner',
  /** Other stakeholder type */
  OTHER = 'other',
}

/**
 * Type guard to check if a value is a valid GoalStatus
 */
export function isGoalStatus(value: string): value is GoalStatus {
  return Object.values(GoalStatus).includes(value as GoalStatus);
}

/**
 * Type guard to check if a value is a valid GoalCategory
 */
export function isGoalCategory(value: string): value is GoalCategory {
  return Object.values(GoalCategory).includes(value as GoalCategory);
}

/**
 * Type guard to check if a value is a valid ActivityType
 */
export function isActivityType(value: string): value is ActivityType {
  return Object.values(ActivityType).includes(value as ActivityType);
}

/**
 * Type guard to check if a value is a valid ActivityStatus
 */
export function isActivityStatus(value: string): value is ActivityStatus {
  return Object.values(ActivityStatus).includes(value as ActivityStatus);
}

/**
 * Type guard to check if a value is a valid StakeholderRole
 */
export function isStakeholderRole(value: string): value is StakeholderRole {
  return Object.values(StakeholderRole).includes(value as StakeholderRole);
}
