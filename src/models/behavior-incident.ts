/**
 * Behavior Incident Model
 *
 * Tracks behavioral incidents and safety events for NDIS participants.
 * Includes detailed tracking of behaviors, interventions, and support needs.
 */

/**
 * Location where the behavior occurred
 */
export type IncidentLocation =
  | 'in_the_home'
  | 'in_the_community'
  | 'in_the_car'
  | 'at_restaurant'
  | 'in_the_neighborhood'
  | 'other';

/**
 * Activity or situation before the behavior
 */
export type ActivityBefore =
  | 'activity_outdoors'
  | 'activity_indoors'
  | 'unstructured_time'
  | 'transitioning'
  | 'waiting'
  | 'structured_activity'
  | 'other';

/**
 * Types of behaviors that can be displayed
 */
export type BehaviorType =
  | 'verbal_aggression'
  | 'physical_aggression'
  | 'wandering'
  | 'withdrawal'
  | 'harm_to_self'
  | 'damage_to_property'
  | 'inappropriate_touching'
  | 'public_masturbation'
  | 'shared_lie_or_fiction'
  | 'risk_of_safety'
  | 'leaving_home_unsupervised'
  | 'moving_neighbors_bins'
  | 'approaching_neighbors_house'
  | 'attempting_to_kiss_touch'
  | 'other';

/**
 * Duration of the behavior
 */
export type BehaviorDuration =
  | '0_5_minutes'
  | '6_10_minutes'
  | '11_15_minutes'
  | '16_30_minutes'
  | 'over_30_minutes'
  | 'other';

/**
 * Severity/intensity of the behavior
 */
export type BehaviorSeverity =
  | 'low'      // Minor disruption
  | 'medium'   // Moderate impact on safety or environment
  | 'high';    // Severe risk to safety or significant disruption

/**
 * Status of the behavior incident report
 */
export type BehaviorIncidentStatus =
  | 'draft'      // Incident report is still being drafted
  | 'submitted'; // Incident report has been submitted

/**
 * Types of self-harm behaviors
 */
export type SelfHarmType =
  | 'bite'
  | 'scratch'
  | 'hit_head'
  | 'consuming_non_food'
  | 'bang_head'
  | 'no_harm'
  | 'other';

/**
 * Initial intervention strategies used
 */
export type InterventionType =
  | 'verbal_redirection'
  | 'escape_environment'
  | 'deflection_with_body'
  | 'distraction_with_items'
  | 'no_intervention_required'
  | 'other';

/**
 * Reasons for needing second support person (2:1 support)
 */
export type SecondSupportReason =
  | 'ensure_safety'
  | 'prevent_harm_to_others'
  | 'manage_transitions'
  | 'all'
  | 'no_additional_support_needed';

/**
 * Core behavior incident entity
 */
export interface BehaviorIncident {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Client this incident relates to */
  client_id: string;

  /** Date when the incident occurred (ISO YYYY-MM-DD) */
  incident_date: string;

  /** ID of the person submitting the report (stakeholder/user ID) */
  submitted_by: string;

  /** Who is this report for: 'self' or 'other' */
  submitted_for: 'self' | 'other';

  /** Name of person if submitted_for is 'other' */
  submitted_for_name?: string;

  /** Location where behavior occurred */
  location: IncidentLocation;

  /** Additional details if location is 'other' */
  location_other?: string;

  /** Activity/situation before the behavior */
  activity_before: ActivityBefore;

  /** Additional details if activity_before is 'other' */
  activity_before_other?: string;

  /** List of behaviors displayed (can be multiple) */
  behaviors_displayed: BehaviorType[];

  /** Additional details if behaviors include 'other' */
  behaviors_other?: string;

  /** Duration of the behavior */
  duration: BehaviorDuration;

  /** Additional details if duration is 'other' */
  duration_other?: string;

  /** Severity/intensity of the behavior */
  severity: BehaviorSeverity;

  /** Types of self-harm (can be multiple) */
  self_harm_types: SelfHarmType[];

  /** Additional details if self_harm includes 'other' */
  self_harm_other?: string;

  /** Number of times self-harm occurred (0-10+) */
  self_harm_count: number;

  /** Initial intervention used */
  initial_intervention: InterventionType;

  /** Description of intervention if 'other' or additional details */
  intervention_description?: string;

  /** Reasons for needing second support person (can be multiple) */
  second_support_needed: SecondSupportReason[];

  /** Description of second support needs */
  second_support_description?: string;

  /** Detailed description of the incident */
  detailed_description: string;

  /** Status of the report: 'draft' or 'submitted' */
  status?: BehaviorIncidentStatus;

  /** Timestamp when report was submitted */
  submitted_at?: string;

  /** Timestamp when record was created */
  created_at: string;

  /** Timestamp when record was last updated */
  updated_at: string;
}

/**
 * Input for creating a new behavior incident
 * Omits auto-generated fields
 */
export interface CreateBehaviorIncidentInput {
  client_id: string;
  incident_date: string;
  submitted_by: string;
  submitted_for: 'self' | 'other';
  submitted_for_name?: string;
  location: IncidentLocation;
  location_other?: string;
  activity_before: ActivityBefore;
  activity_before_other?: string;
  behaviors_displayed: BehaviorType[];
  behaviors_other?: string;
  duration: BehaviorDuration;
  duration_other?: string;
  severity: BehaviorSeverity;
  self_harm_types: SelfHarmType[];
  self_harm_other?: string;
  self_harm_count: number;
  initial_intervention: InterventionType;
  intervention_description?: string;
  second_support_needed: SecondSupportReason[];
  second_support_description?: string;
  detailed_description: string;
  status?: BehaviorIncidentStatus;
}

/**
 * Input for updating a behavior incident
 * All fields optional for partial updates
 */
export interface UpdateBehaviorIncidentInput {
  incident_date?: string;
  submitted_by?: string;
  submitted_for?: 'self' | 'other';
  submitted_for_name?: string;
  location?: IncidentLocation;
  location_other?: string;
  activity_before?: ActivityBefore;
  activity_before_other?: string;
  behaviors_displayed?: BehaviorType[];
  behaviors_other?: string;
  duration?: BehaviorDuration;
  duration_other?: string;
  severity?: BehaviorSeverity;
  self_harm_types?: SelfHarmType[];
  self_harm_other?: string;
  self_harm_count?: number;
  initial_intervention?: InterventionType;
  intervention_description?: string;
  second_support_needed?: SecondSupportReason[];
  second_support_description?: string;
  detailed_description?: string;
  status?: BehaviorIncidentStatus;
}

/**
 * Extended incident with client details
 */
export interface BehaviorIncidentWithDetails extends BehaviorIncident {
  /** Client name */
  client_name: string;

  /** Submitter name (stakeholder/user) */
  submitter_name?: string;
}

/**
 * Statistics for behavior incidents
 */
export interface BehaviorIncidentStats {
  /** Total incidents */
  total_incidents: number;

  /** Incidents by severity */
  by_severity: {
    low: number;
    medium: number;
    high: number;
  };

  /** Most common behaviors */
  most_common_behaviors: Array<{
    behavior: BehaviorType;
    count: number;
  }>;

  /** Most common locations */
  most_common_locations: Array<{
    location: IncidentLocation;
    count: number;
  }>;

  /** Incidents with self-harm */
  incidents_with_self_harm: number;

  /** Incidents requiring second support */
  incidents_needing_second_support: number;

  /** Recent high-severity incidents */
  recent_high_severity: number;
}

/**
 * Filter options for listing behavior incidents
 */
export interface BehaviorIncidentFilter {
  /** Filter by client ID */
  client_id?: string;

  /** Filter by date range - start date (inclusive) */
  date_from?: string;

  /** Filter by date range - end date (inclusive) */
  date_to?: string;

  /** Filter by severity */
  severity?: BehaviorSeverity;

  /** Filter by location */
  location?: IncidentLocation;

  /** Filter incidents with self-harm */
  has_self_harm?: boolean;

  /** Filter incidents needing second support */
  needs_second_support?: boolean;

  /** Submitted by specific person */
  submitted_by?: string;
}
