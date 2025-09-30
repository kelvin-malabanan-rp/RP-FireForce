// controllers/oncallController.ts
import { CurrentOnCall, OnCallTeam, OnCallScheduleResponse } from '@/types/oncall-types';
import { BASE_URL_DEV } from "@/utils/backend-url";

export class OnCallController {
    private static instance: OnCallController;
    private baseUrl: string;

    private constructor() {
        this.baseUrl = BASE_URL_DEV;
    }

    public static getInstance(): OnCallController {
        if (!OnCallController.instance) {
            OnCallController.instance = new OnCallController();
        }
        return OnCallController.instance;
    }

    /**
     * Get current on-call personnel for a specific team
     */
    async getCurrentOnCall(teamId: string): Promise<CurrentOnCall | null> {
        try {
            const url = `${this.baseUrl}/api/oncall/current?teamId=${teamId}`;
            console.log('Fetching current on-call from:', url);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.object;
        } catch (error) {
            console.error('Error loading current on-call:', error);
            throw error;
        }
    }

    /**
     * Get on-call schedule for a specific team
     */
    async getSchedule(teamId: string, days: number = 7): Promise<OnCallScheduleResponse> {
        try {
            const url = `${this.baseUrl}/api/oncall/schedule?teamId=${teamId}&days=${days}`;
            console.log('Fetching schedule from:', url);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return {
                schedule: data.object?.schedule || [],
                teamId: teamId,
                days: days
            };
        } catch (error) {
            console.error('Error loading schedule:', error);
            throw error;
        }
    }

    /**
     * Get all available teams
     */
    async getTeams(): Promise<OnCallTeam[]> {
        try {
            const url = `${this.baseUrl}/api/oncall/teams`;
            console.log('Fetching teams from:', url);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.object || [];
        } catch (error) {
            console.error('Error loading teams:', error);
            throw error;
        }
    }

    /**
     * Load all on-call data (current, schedule, and teams)
     */
    async loadAllOnCallData(teamId: string, days: number = 7): Promise<{
        currentOnCall: CurrentOnCall | null;
        schedule: any[];
        teams: OnCallTeam[];
    }> {
        try {
            const [currentOnCall, scheduleResponse, teams] = await Promise.all([
                this.getCurrentOnCall(teamId),
                this.getSchedule(teamId, days),
                this.getTeams()
            ]);

            return {
                currentOnCall,
                schedule: scheduleResponse.schedule,
                teams
            };
        } catch (error) {
            console.error('Error loading on-call data:', error);
            throw error;
        }
    }

    /**
     * Create an on-call override
     */
    async createOverride(params: {
        teamId: string;
        startTime: string;
        endTime: string;
        userId: string;
        role: 'primary' | 'backup';
        reason?: string;
        originalUserId?: string;
    }): Promise<any> {
        try {
            const url = `${this.baseUrl}/api/oncall/override`;
            console.log('Creating override at:', url);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating override:', error);
            throw error;
        }
    }

    /**
     * Escalate an incident
     */
    async escalateIncident(params: {
        teamId: string;
        incidentId: string;
        reason: string;
        priority?: 'low' | 'medium' | 'high' | 'critical';
        currentLevel?: number;
    }): Promise<any> {
        try {
            const url = `${this.baseUrl}/api/oncall/escalate`;
            console.log('Escalating incident at:', url);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error escalating incident:', error);
            throw error;
        }
    }
}

// Export singleton instance for convenience
export const oncallController = OnCallController.getInstance();