// services/oncallService.ts

const BASE_URL = 'https://incident-webhook-api.rapidresponse.workers.dev';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  role: 'primary' | 'backup' | 'escalation';
  avatarUrl?: string;
}

export interface Assignment {
  scheduleId: string;
  teamId: string;
  startTime: string;
  endTime: string;
  primary?: TeamMember;
  backup?: TeamMember;
  escalation: TeamMember[];
}

export interface ScheduleDay {
  date: string;
  dayOfWeek: string;
  assignment: Assignment | null;
}

export interface Team {
  teamId: string;
  teamName: string;
  timezone: string;
  members: TeamMember[];
  schedule: ScheduleDay[];
}

export interface SimpleTeam {
  id: string;
  name: string;
  timezone: string;
  members: TeamMember[];
}

export interface CalendarResponse {
  success: boolean;
  httpStatus: string;
  data: Team[];
  metadata: {
    totalTeams: number;
    days: number;
    generatedAt: string;
  };
}

export interface TeamInfo {
  id: string;
  name: string;
  timezone: string;
  memberCount: number;
}

export interface ScheduleConfig {
  id: string;
  rotationType: 'daily' | 'weekly' | 'custom';
  rotationLengthHours: number;
  rotationStartISO: string;
}

export interface ScheduleMember {
  userId: string;
  role: 'primary' | 'backup' | 'escalation';
  firstName: string;
  lastName: string;
  orderIndex: number;
  isActive: boolean;
}

export interface TeamScheduleConfig {
  teamId: string;
  schedule: ScheduleConfig;
  members: ScheduleMember[];
}

export interface TeamDetails {
  team: TeamInfo;
  members: TeamMember[];
  currentOnCall: Assignment | null;
  scheduleConfig: TeamScheduleConfig;
}

export interface TeamDetailsResponse {
  success: boolean;
  httpStatus: string;
  data: TeamDetails;
}

export interface CreateSchedulePayload {
  teamId: string;
  name: string;
  rotationType: 'daily' | 'weekly' | 'custom';
  rotationLengthHours: number;
  rotationStartISO: string;
  members: {
    userId: string;
    role: 'primary' | 'backup' | 'escalation';
    orderIndex: number;
    isActive: boolean;
  }[];
}

export interface UpdateSchedulePayload {
  scheduleId: string;
  teamId: string;
  name?: string;
  assignments: Array<{
    userId: string;
    role: 'primary' | 'backup' | 'escalation';
    dates: string[];
  }>;
  clearDate?: string;
}

export interface Schedule {
  id: string;
  team_id: string;
  name: string;
  rotation_type: string;
  rotation_start: string;
  rotation_length_hours: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  team_name: string;
  timezone: string;
  member_count: number;
}

export interface AllSchedulesResponse {
  success: boolean;
  httpStatus: string;
  data: Schedule[];
  count: number;
}

export interface EscalationStep {
  step: number;
  notify: ('primary' | 'backup' | 'escalation')[];
  wait_minutes: number;
}

export interface EscalationPolicy {
  id: string;
  team_id: string;
  name: string;
  steps: EscalationStep[];
  timeout_minutes: number;
  is_active: number;
  created_at: string;
}

export interface EscalationPolicyResponse {
  success: boolean;
  httpStatus: string;
  data: EscalationPolicy;
}

export interface CurrentOnCallUser {
  userId: string;
  fullname: string;
  email: string;
  teamId: string;
  teamName: string;
  timezone: string;
  startTime: string;
  endTime: string;
  pushTokenId: string | null;
  pushToken: string | null;
  fcmToken: string | null;
  deviceType: string | null;
}

export interface CurrentOnCallResponse {
  httpStatus: string;
  message: string;
  data: {
    primary: CurrentOnCallUser[];
    backup: CurrentOnCallUser[];
    escalation: CurrentOnCallUser[];
  };
}

export interface TeamScheduleResponse {
  success: boolean;
  object: {
    schedule: ScheduleDay[];
    teamId: string;
    days: number;
  };
}

export interface CurrentOnCallByTeamResponse {
  httpStatus: string;
  message: string;
  data: Assignment;
}

export interface AllTeamsResponse {
  success: boolean;
  object: SimpleTeam[];
}

export interface ScheduleConfigResponse {
  success: boolean;
  object: TeamScheduleConfig;
}

export interface UpdateScheduleConfigPayload {
  teamId: string;
  rotationType: 'daily' | 'weekly' | 'custom';
  rotationLengthHours: number;
  rotationStartISO: string;
  members: {
    userId: string;
    role: 'primary' | 'backup' | 'escalation';
    orderIndex: number;
    isActive: boolean;
  }[];
}

export interface CreateOverridePayload {
  teamId: string;
  scheduleId?: string;
  startTime: string;
  endTime: string;
  userId: string;  // This is the replacement user
  role: 'primary' | 'backup' | 'escalation';
  reason: string;
  originalUserId?: string;
  status?: string;
  createdBy?: string;
}

export interface OverrideResponse {
  success: boolean;
  message?: string;
  object: {
    id: string;
    teamId: string;
    startTime: string;
    endTime: string;
    userId: string;
    role: string;
    reason: string;
    originalUserId: string;
  };
}

export interface EscalateIncidentPayload {
  teamId: string;
  incidentId: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  currentLevel: number;
}

export interface EscalateIncidentResponse {
  success: boolean;
  object: {
    id: string;
    incidentId: string;
    teamId: string;
    escalatedTo: {
      userId: string;
      email: string;
      name: string;
      level: number;
    };
    reason: string;
    priority: string;
    timestamp: string;
    status: string;
    escalationPolicy: EscalationPolicy;
  };
}

export interface UserTeamResponse {
  httpStatus: string;
  message: string;
  data: {
    id: string;
    name: string;
    timezone: string;
    fullname: string;
  };
}

export interface UpdateScheduleResponse {
  success: boolean;
  httpStatus: string;
  message: string;
}

// ============================================================================
// ONCALL SERVICE
// ============================================================================

class OnCallService {
  // ========================================
  // BASIC TEAM DATA
  // ========================================

  /**
   * GET: All Teams (Simple list with members)
   * API: /api/oncall/teams
   * Backend: getOnCallTeams()
   */
  async getAllTeams(): Promise<AllTeamsResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/oncall/teams`);
      if (!response.ok) throw new Error(`Failed to fetch teams: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  }

  // ========================================
  // CURRENT ON-CALL QUERIES
  // ========================================

  /**
   * GET: Current On-Call Users (All Teams)
   * API: /api/oncall/current
   * Backend: getAllCurrentOnCall()
   * Returns all current on-call people grouped by role
   */
  async getCurrentOnCall(): Promise<CurrentOnCallResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/oncall/current`);
      if (!response.ok) throw new Error(`Failed to fetch current on-call: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching current on-call:', error);
      throw error;
    }
  }

  /**
   * GET: Current On-Call by Team
   * API: /api/oncall/team?teamId={teamId}
   * Backend: getCurrentOnCallByTeamId()
   * Returns who's currently on-call for a specific team
   */
  async getCurrentOnCallByTeam(teamId: string): Promise<CurrentOnCallByTeamResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/oncall/team?teamId=${teamId}`);
      if (!response.ok) throw new Error(`Failed to fetch team on-call: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching team on-call:', error);
      throw error;
    }
  }

  /**
   * GET: On-Call Team by User ID
   * API: /api/oncall/user/team?userId={userId}
   * Backend: getUserTeam()
   * Find which team a user belongs to
   */
  async getUserTeam(userId: string): Promise<UserTeamResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/oncall/user/team?userId=${userId}`);
      if (!response.ok) throw new Error(`Failed to fetch user team: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching user team:', error);
      throw error;
    }
  }

  // ========================================
  // CALENDAR & SCHEDULE QUERIES
  // ========================================

  /**
   * GET: Calendar Data (All Teams or Specific Team)
   * API: /api/oncall/calendar?days={days}&teamId={teamId}
   * Backend: getCalendarData(days, teamId?)
   * Returns calendar data with team schedules
   */
  async getCalendarData(days: number = 30, teamId?: string): Promise<CalendarResponse> {
    try {
      let url = `${BASE_URL}/api/oncall/calendar?days=${days}`;
      if (teamId) {
        url += `&teamId=${teamId}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch calendar: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching calendar:', error);
      throw error;
    }
  }

  /**
   * GET: On-Call Schedule for Team
   * API: /api/oncall/schedule?teamId={teamId}&days={days}
   * Backend: getOnCallSchedule()
   * Get schedule for specific team and date range
   */
  async getTeamSchedule(teamId: string, days: number = 30): Promise<TeamScheduleResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/oncall/schedule?teamId=${teamId}&days=${days}`);
      if (!response.ok) throw new Error(`Failed to fetch schedule: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching schedule:', error);
      throw error;
    }
  }

  /**
   * GET: Schedule Configuration
   * API: /api/oncall/schedule/config?teamId={teamId}
   * Backend: getScheduleConfig()
   * Get rotation configuration (type, length, members order)
   */
  async getScheduleConfig(teamId: string): Promise<ScheduleConfigResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/oncall/schedule/config?teamId=${teamId}`);
      if (!response.ok) throw new Error(`Failed to fetch schedule config: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching schedule config:', error);
      throw error;
    }
  }

  /**
   * PUT: Update Schedule Configuration
   * API: /api/oncall/schedule/config
   * Backend: updateScheduleConfig()
   * Update rotation settings and member order
   */
  async updateScheduleConfig(payload: UpdateScheduleConfigPayload): Promise<any> {
    try {
      const response = await fetch(`${BASE_URL}/api/oncall/schedule/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Failed to update schedule config: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error updating schedule config:', error);
      throw error;
    }
  }

  // ========================================
  // SCHEDULE MANAGEMENT (BULK OPERATIONS)
  // ========================================

  /**
   * PUT: Update Schedule (Bulk Assignments with Dates Array)
   * API: /api/oncall/schedule
   * Backend: updateScheduleAssignments()
   *
   * This handles BOTH:
   * - Adding/updating assignments (pass assignments array with dates)
   * - Clearing a specific date (pass clearDate with empty assignments)
   */
  async updateSchedule(payload: UpdateSchedulePayload): Promise<UpdateScheduleResponse> {
    try {
      console.log('📝 Updating schedule:', payload);

      const response = await fetch(`${BASE_URL}/api/oncall/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result: UpdateScheduleResponse = await response.json();
      console.log('✅ Schedule updated successfully:', result.message);

      return result;
    } catch (error) {
      console.error('❌ Error updating schedule:', error);
      throw error;
    }
  }

  /**
   * POST: Create Schedule with Dates
   * API: /api/oncall/schedule
   * Backend: createScheduleWithDates()
   * Create a new schedule with initial assignments
   */
  async createSchedule(payload: {
    teamId: string;
    name: string;
    assignments: Array<{
      userId: string;
      role: 'primary' | 'backup' | 'escalation';
      dates: string[];
    }>;
  }): Promise<any> {
    try {
      const response = await fetch(`${BASE_URL}/api/oncall/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Failed to create schedule: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  }

  /**
   * DELETE: Delete Schedule
   * API: /api/oncall/schedule?scheduleId={scheduleId}
   * Backend: deleteSchedule()
   * Deactivates a schedule (soft delete)
   */
  async deleteSchedule(scheduleId: string): Promise<any> {
    try {
      const response = await fetch(`${BASE_URL}/api/oncall/schedule?scheduleId=${scheduleId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`Failed to delete schedule: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    }
  }

  /**
   * GET: All Schedules
   * API: /api/oncall/schedules/all?includeInactive=false
   * Backend: getAllSchedules()
   * Get all schedules, optionally including inactive ones
   */
  async getAllSchedules(includeInactive: boolean = false): Promise<AllSchedulesResponse> {
    try {
      const response = await fetch(
          `${BASE_URL}/api/oncall/schedules/all?includeInactive=${includeInactive}`
      );
      if (!response.ok) throw new Error(`Failed to fetch schedules: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching schedules:', error);
      throw error;
    }
  }

  // ========================================
  // OVERRIDE MANAGEMENT
  // ========================================

  /**
   * POST: Create Override
   * API: /api/oncall/override
   * Backend: createOverride()
   * Temporarily replace someone in the schedule (vacation, sick leave, etc.)
   */
  async createOverride(payload: CreateOverridePayload): Promise<OverrideResponse> {
    try {
      console.log('🔄 Creating override:', payload);

      const response = await fetch(`${BASE_URL}/api/oncall/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || `Failed to create override: ${response.status}`);
        } catch {
          throw new Error(`Failed to create override: ${response.status} - ${responseText}`);
        }
      }

      const result = JSON.parse(responseText);
      console.log('✅ Override created:', result);
      return result;
    } catch (error) {
      console.error('❌ Error creating override:', error);
      throw error;
    }
  }

  // ========================================
  // ESCALATION
  // ========================================

  /**
   * GET: Escalation Policy
   * API: /api/oncall/escalation-policy?teamId={teamId}
   * Backend: getEscalationPolicy()
   */
  async getEscalationPolicy(teamId: string): Promise<EscalationPolicyResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/oncall/escalation-policy?teamId=${teamId}`);
      if (!response.ok) throw new Error(`Failed to fetch escalation policy: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching escalation policy:', error);
      throw error;
    }
  }

  /**
   * POST: Escalate Incident
   * API: /api/oncall/escalate
   * Backend: escalateIncident()
   * Escalate an unresolved incident to the next level
   */
  async escalateIncident(payload: EscalateIncidentPayload): Promise<EscalateIncidentResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/oncall/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Failed to escalate incident: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error escalating incident:', error);
      throw error;
    }
  }

  // ========================================
  // LEGACY/DEPRECATED
  // ========================================

  /**
   * @deprecated Use getCurrentOnCallByTeam() instead
   * GET: Team Details (with current on-call and config)
   * API: /api/oncall/team/details?teamId={teamId}
   */
  async getTeamDetails(teamId: string): Promise<TeamDetailsResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/oncall/team/details?teamId=${teamId}`);
      if (!response.ok) throw new Error(`Failed to fetch team details: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching team details:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const onCallService = new OnCallService();
export default onCallService;