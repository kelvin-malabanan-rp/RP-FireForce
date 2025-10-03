// controllers/oncallController.ts
import {
    CurrentOnCall,
    OnCallTeam,
    OnCallScheduleResponse,
    OnCallTeamOfUser,
    ApiResponse,
    AllCurrentOnCallResponse
} from '@/types/oncall-types';
import { BASE_URL_DEV } from "@/utils/backend-url";
import {API_RESPONSE} from "@/types/incident-types";
import apiManager from "@/api/api-manager";

type RotationType = 'daily' | 'weekly' | 'biweekly' | 'monthly';

type ScheduleConfig = {
    teamId: string;
    rotationType: RotationType;
    rotationLengthHours: number;
    rotationStartISO: string;
    members: Array<{
        userId: string;
        firstname?: string;     // optional from server
        lastname?: string;     // optional from server
        email?: string;    // optional from server
        role: 'primary' | 'backup' | 'escalation';
        orderIndex: number;
        isActive: boolean;
    }>;
};

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

    // --- internal helpers ------------------------------------------------------

    private async json<T = any>(res: Response): Promise<T> {
        let data: any = null;
        try { data = await res.json(); } catch {}
        if (!res.ok || (data && data.success === false)) {
            const msg = data?.error || data?.message || `HTTP ${res.status}`;
            throw new Error(msg);
        }
        return data as T;
    }

    private withTimeout(ms = 15000): AbortSignal {
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), ms);
        return ctrl.signal;
    }

    // --- existing methods ------------------------------------------------------

    /** Get current on-call personnel for a specific team */
    async getCurrentOnCall(teamId: string): Promise<CurrentOnCall | null> {
        const url = `${this.baseUrl}/api/oncall/current?teamId=${encodeURIComponent(teamId)}`;
        const res = await fetch(url, { signal: this.withTimeout() });
        const data = await this.json<{ success: boolean; object: CurrentOnCall | null }>(res);
        return data.object ?? null;
    }

    /** Get on-call schedule (read-only, for 7-day list UI) */
    async getSchedule(teamId: string, days: number = 7): Promise<OnCallScheduleResponse> {
        const url = `${this.baseUrl}/api/oncall/schedule?teamId=${encodeURIComponent(teamId)}&days=${days}`;
        const res = await fetch(url, { signal: this.withTimeout() });
        const data = await this.json<{ success: boolean; object: { schedule: any[] } }>(res);
        return { schedule: data.object?.schedule || [], teamId, days };
    }

    /** Get all available teams */
    async getTeams(): Promise<OnCallTeam[]> {
        const url = `${this.baseUrl}/api/oncall/teams`;
        const res = await fetch(url, { signal: this.withTimeout() });
        const data = await this.json<{ success: boolean; object: OnCallTeam[] }>(res);
        return data.object || [];
    }

    async getUserTeam(userId: string): Promise<OnCallTeamOfUser | null> {
        try {
            const response = await fetch(`${this.baseUrl}/api/oncall/user/team?userId=${userId}`);
            if (!response.ok) return null;
            const data = await response.json();
            return data.data; // Now returns single object
        } catch (error) {
            console.error('Error fetching user team:', error);
            return null;
        }
    }

    /** Load all on-call shards for the tab */
    async loadAllOnCallData(teamId: string, days: number = 7): Promise<{
        currentOnCall: CurrentOnCall | null;
        schedule: any[];
        teams: OnCallTeam[];
    }> {
        const [currentOnCall, scheduleResponse, teams] = await Promise.all([
            this.getCurrentOnCall(teamId),
            this.getSchedule(teamId, days),
            this.getTeams(),
        ]);
        return { currentOnCall, schedule: scheduleResponse.schedule, teams };
    }

    /** Create an on-call override */
    async createOverride(params: {
        teamId: string;
        startTime: string;
        endTime: string;
        userId: string;
        role: 'primary' | 'backup';
        reason?: string;
        originalUserId?: string;
    }): Promise<any> {
        const url = `${this.baseUrl}/api/oncall/override`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: this.withTimeout(),
            body: JSON.stringify(params),
        });
        return this.json(res);
    }

    /** Escalate an incident */
    async escalateIncident(params: {
        teamId: string;
        incidentId: string;
        reason: string;
        priority?: 'low' | 'medium' | 'high' | 'critical';
        currentLevel?: number;
    }): Promise<any> {
        const url = `${this.baseUrl}/api/oncall/escalate`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: this.withTimeout(),
            body: JSON.stringify(params),
        });
        return this.json(res);
    }

    // --- NEW: Manage Schedule endpoints ---------------------------------------

    /** Read schedule configuration for a team (rotation + ordered members) */
    async getScheduleConfig(teamId: string): Promise<ScheduleConfig> {
        const url = `${this.baseUrl}/api/oncall/schedule/config?teamId=${encodeURIComponent(teamId)}`;
        const res = await fetch(url, { signal: this.withTimeout() });
        const data = await this.json<{ success: boolean; object: ScheduleConfig }>(res);
        return data.object;
    }

    /**
     * Update schedule configuration.
     * Expect the backend to upsert oncall_schedules and oncall_team_members/order.
     */
    async updateScheduleConfig(payload: {
        teamId: string;
        rotationType: RotationType;
        rotationLengthHours: number;
        rotationStartISO: string;
        members: Array<{ userId: string; role: 'primary'|'backup'|'escalation'; orderIndex: number; isActive: boolean }>;
    }): Promise<{ success: boolean }> {  // Changed from true to boolean
        const url = `${this.baseUrl}/api/oncall/schedule/config`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            signal: this.withTimeout(),
            body: JSON.stringify(payload),
        });
        const data = await this.json<{ success: boolean }>(res);
        return { success: !!data.success };
    }
}

// In your api/alert-controller.ts or api/oncall-schedule-controller.ts
export const getAllCurrentOnCall = async (
    teamId?: string
): Promise<API_RESPONSE<AllCurrentOnCallResponse>> => {
    try {
        const url = teamId
            ? `${BASE_URL_DEV}/api/oncall/current/all?teamId=${teamId}`
            : `${BASE_URL_DEV}/api/oncall/current/all`;

        const response = await apiManager.get<API_RESPONSE<AllCurrentOnCallResponse>>(url);
        return response.data;
    } catch (error) {
        console.error("Error fetching current on-call:", error);
        throw error;
    }
};

// Export singleton instance for convenience
export const oncallController = OnCallController.getInstance();
