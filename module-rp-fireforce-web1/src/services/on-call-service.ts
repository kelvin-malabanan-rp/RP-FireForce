// services/on-call-service.ts

const BASE_URL = 'https://incident-webhook-api.rapidresponse.workers.dev';

// ==================== TYPE DEFINITIONS ====================

export interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  role: 'primary' | 'backup' | 'escalation';
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

export interface CalendarMetadata {
  totalTeams: number;
  days: number;
  generatedAt: string;
}

export interface CalendarResponse {
  success: boolean;
  httpStatus: string;
  data: Team[];
  metadata: CalendarMetadata;
}

export interface ApiResponse<T = any> {
  success: boolean;
  httpStatus?: string;
  data: T;
  message?: string;
  status?: number;
}

export interface ScheduleAssignment {
  userId: string;
  role: 'primary' | 'backup' | 'escalation';
  dates: string[]; // Array of dates in YYYY-MM-DD format
}

export interface UpdateSchedulePayload {
  scheduleId: string;
  teamId: string;
  name?: string;
  assignments: ScheduleAssignment[];
}

export interface UpdateScheduleResponse {
  success: boolean;
  httpStatus: string;
  message: string;
}

// ==================== ON-CALL SERVICE ====================

class OnCallService {
  /**
   * GET: Calendar Data for all teams
   * API: /api/oncall/calendar?days={days}
   * @param days - Number of days to fetch (default: 30)
   * @returns Calendar data with all teams and their schedules
   */
  async getCalendarData(days: number = 30): Promise<ApiResponse<Team[]>> {
    try {
      console.log(`📅 Fetching calendar data for ${days} days...`);
      
      const response = await fetch(`${BASE_URL}/api/oncall/calendar?days=${days}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: CalendarResponse = await response.json();
      
      console.log('✅ Calendar data loaded:', {
        totalTeams: result.metadata.totalTeams,
        days: result.metadata.days,
        generatedAt: result.metadata.generatedAt
      });

      return {
        success: result.success,
        httpStatus: result.httpStatus,
        data: result.data,
        status: 200
      };
    } catch (error) {
      console.error('❌ Error fetching calendar data:', error);
      return {
        success: false,
        data: [],
        status: 500,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * GET: Get all teams (without schedule details)
   * Extracts just the team information from calendar data
   */
  async getAllTeams(): Promise<ApiResponse<Team[]>> {
    try {
      const calendarData = await this.getCalendarData(1); // Only need 1 day for team list
      
      if (!calendarData.success) {
        throw new Error('Failed to fetch teams');
      }

      return calendarData;
    } catch (error) {
      console.error('❌ Error fetching teams:', error);
      return {
        success: false,
        data: [],
        status: 500,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * GET: Get schedule for a specific team
   * @param teamId - The team ID to fetch schedule for
   * @param days - Number of days to fetch (default: 30)
   */
  async getTeamSchedule(teamId: string, days: number = 30): Promise<ApiResponse<Team | null>> {
    try {
      console.log(`📅 Fetching schedule for team ${teamId}...`);
      
      const calendarData = await this.getCalendarData(days);
      
      if (!calendarData.success) {
        throw new Error('Failed to fetch calendar data');
      }

      const team = calendarData.data.find(t => t.teamId === teamId);
      
      if (!team) {
        console.warn(`⚠️ Team ${teamId} not found`);
        return {
          success: false,
          data: null,
          status: 404,
          message: 'Team not found'
        };
      }

      console.log(`✅ Schedule loaded for team: ${team.teamName}`);
      
      return {
        success: true,
        data: team,
        status: 200
      };
    } catch (error) {
      console.error('❌ Error fetching team schedule:', error);
      return {
        success: false,
        data: null,
        status: 500,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * GET: Get current on-call person for a specific team
   * Returns today's assignment for the team
   */
  async getCurrentOnCallByTeam(teamId: string): Promise<ApiResponse<Assignment | null>> {
    try {
      const teamSchedule = await this.getTeamSchedule(teamId, 1);
      
      if (!teamSchedule.success || !teamSchedule.data) {
        throw new Error('Failed to fetch team schedule');
      }

      const today = new Date().toISOString().split('T')[0];
      const todayAssignment = teamSchedule.data.schedule.find(
        day => day.date === today
      )?.assignment || null;

      return {
        success: true,
        data: todayAssignment,
        status: 200
      };
    } catch (error) {
      console.error('❌ Error fetching current on-call:', error);
      return {
        success: false,
        data: null,
        status: 500,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * GET: Get all current on-call people across all teams
   */
  async getAllCurrentOnCall(): Promise<ApiResponse<{ [teamId: string]: Assignment | null }>> {
    try {
      const calendarData = await this.getCalendarData(1);
      
      if (!calendarData.success) {
        throw new Error('Failed to fetch calendar data');
      }

      const today = new Date().toISOString().split('T')[0];
      const currentOnCall: { [teamId: string]: Assignment | null } = {};

      calendarData.data.forEach(team => {
        const todayAssignment = team.schedule.find(
          day => day.date === today
        )?.assignment || null;
        
        currentOnCall[team.teamId] = todayAssignment;
      });

      return {
        success: true,
        data: currentOnCall,
        status: 200
      };
    } catch (error) {
      console.error('❌ Error fetching all current on-call:', error);
      return {
        success: false,
        data: {},
        status: 500,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * PUT: Update Schedule
   * API: /api/oncall/schedule
   * @param payload - Schedule update data including scheduleId, teamId, name, and assignments
   * @returns Success response with message
   */
  async updateSchedule(payload: UpdateSchedulePayload): Promise<UpdateScheduleResponse> {
    try {
      console.log('📝 Updating schedule:', payload);
      
      const response = await fetch(`${BASE_URL}/api/oncall/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
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
      return {
        success: false,
        httpStatus: 'ERROR',
        message: error instanceof Error ? error.message : 'Failed to update schedule'
      };
    }
  }
}

// ==================== ONCALL SERVICE OBJECT ====================

/**
 * Unified on-call service object
 * This is what you import in your components
 */
export const onCallService = {
  // Calendar & Team Data
  getCalendarData: (days?: number) => new OnCallService().getCalendarData(days),
  getAllTeams: () => new OnCallService().getAllTeams(),
  getTeamSchedule: (teamId: string, days?: number) => new OnCallService().getTeamSchedule(teamId, days),
  
  // Current On-Call
  getCurrentOnCallByTeam: (teamId: string) => new OnCallService().getCurrentOnCallByTeam(teamId),
  getAllCurrentOnCall: () => new OnCallService().getAllCurrentOnCall(),
  
  // Schedule Management
  updateSchedule: (payload: UpdateSchedulePayload) => new OnCallService().updateSchedule(payload),
};

// Default export
export default onCallService;