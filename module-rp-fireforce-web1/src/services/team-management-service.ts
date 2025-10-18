// services/team.management.service.ts  (renamed to avoid conflict)

import {ApiResponse} from "@/types";
import {apiService} from "@/services/apiService.ts";

export interface CreateTeamRequest {
    name: string;
    description?: string;
    createdBy: string;
}

export interface AddMemberRequest {
    userId: string;
    teamId: string;
    teamRole: 'primary' | 'backup' | 'escalation';
}

export interface RemoveMemberRequest {
    userId: string;
    teamId: string;
}

export interface ChangeRoleRequest {
    userId: string;
    teamId: string;
    newRole: 'primary' | 'backup' | 'escalation';
}

export interface TransferMemberRequest {
    userId: string;
    fromTeamId: string;
    toTeamId: string;
    newRole: 'primary' | 'backup' | 'escalation';
}

export interface Team {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    createdAt: string;
    createdBy: string;
}

export interface TeamMember {
    id: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    avatarUrl: string;
    role: string;
    orderIndex: number;
    isActive: boolean;
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    avatarUrl: string;
    isActive: boolean;
}

class TeamManagementServiceV2 {
    /**
     * Create a new team
     */
    async createTeam(data: CreateTeamRequest): Promise<ApiResponse<{ teamId: string; name: string }>> {
        console.log('🏗️ Creating team:', data.name);

        try {
            const response = await apiService.post('/api/teams/create', data);

            if (response.success) {
                console.log('✅ Team created successfully:', response.data);
            }

            return response;
        } catch (error: any) {
            console.error('❌ Failed to create team:', error.message);
            throw error;
        }
    }

    /**
     * Get all teams
     */
    async getAllTeams(): Promise<ApiResponse<{ teamCount: number; teams: Team[] }>> {
        console.log('📋 Fetching all teams');

        try {
            const response = await apiService.get('/api/teams/all');

            if (response.success) {
                console.log('✅ Teams fetched:', response.data?.data?.teams?.length || 0);
            }

            return response;
        } catch (error: any) {
            console.error('❌ Failed to fetch teams:', error.message);
            throw error;
        }
    }

    /**
     * Get a specific team by ID
     */
    async getTeamById(teamId: string): Promise<ApiResponse<Team>> {
        console.log('🔍 Fetching team:', teamId);

        try {
            const response = await apiService.get(`/api/teams/by-id?teamId=${teamId}`);
            return response;
        } catch (error: any) {
            console.error('❌ Failed to fetch team:', error.message);
            throw error;
        }
    }

    /**
     * Get team members
     */
    async getTeamMembers(teamId: string): Promise<ApiResponse<{ teamId: string; memberCount: number; members: TeamMember[] }>> {
        console.log('👥 Fetching team members for:', teamId);

        try {
            const response = await apiService.get(`/api/teams/members?teamId=${teamId}`);

            if (response.success) {
                console.log('✅ Found', response.data?.data?.members?.length || 0, 'members');
            }

            return response;
        } catch (error: any) {
            console.error('❌ Failed to fetch team members:', error.message);
            throw error;
        }
    }

    /**
     * Get available users (not in any team)
     */
    async getAvailableUsers(): Promise<ApiResponse<{ userCount: number; users: User[] }>> {
        console.log('👥 Fetching available users');

        try {
            const response = await apiService.get('/api/teams/available-users');

            if (response.success) {
                console.log('✅ Found', response.data?.data?.users?.length || 0, 'available users');
            }

            return response;
        } catch (error: any) {
            console.error('❌ Failed to fetch available users:', error.message);
            throw error;
        }
    }

    /**
     * Add a member to a team
     * Note: Automatically creates entries in oncall_team_members, escalation_chains, and oncall_assignments
     */
    async addMemberToTeam(data: AddMemberRequest): Promise<ApiResponse<{ userId: string; teamId: string; teamRole: string }>> {
        console.log('➕ Adding member to team:', data);

        try {
            const response = await apiService.post('/api/teams/members/add', data);

            if (response.success) {
                console.log('✅ Member added successfully');
            }

            return response;
        } catch (error: any) {
            console.error('❌ Failed to add member:', error.message);
            throw error;
        }
    }

    /**
     * Remove a member from a team
     * Note: Soft deletes from oncall_team_members, escalation_chains, and oncall_assignments
     */
    async removeMemberFromTeam(data: RemoveMemberRequest): Promise<ApiResponse<{ userId: string; teamId: string }>> {
        console.log('➖ Removing member from team:', data);

        try {
            const response = await apiService.post('/api/teams/members/remove', data);

            if (response.success) {
                console.log('✅ Member removed successfully');
            }

            return response;
        } catch (error: any) {
            console.error('❌ Failed to remove member:', error.message);
            throw error;
        }
    }

    /**
     * Change a member's role in their team
     * IMPORTANT: Automatically swaps roles when changing between Primary ↔ Backup
     *
     * Example: If Kelvin is Primary and you change Keannu from Backup to Primary,
     * the system automatically makes Kelvin the Backup to prevent conflicts.
     */
    async changeTeamRole(data: ChangeRoleRequest): Promise<ApiResponse<{ userId: string; teamId: string; newRole: string; wasSwapped: boolean }>> {
        console.log('🔄 Changing member role:', data);

        try {
            const response = await apiService.put('/api/teams/members/role', data);

            if (response.success) {
                console.log('✅ Role changed successfully');

                // Check if it was a swap
                if (response.data?.data?.wasSwapped) {
                    console.log('🔄 Roles were automatically swapped');
                }
            }

            return response;
        } catch (error: any) {
            console.error('❌ Failed to change role:', error.message);
            throw error;
        }
    }

    /**
     * Transfer a member from one team to another
     * Note: Updates oncall_team_members, escalation_chains, and oncall_assignments
     */
    async transferMember(data: TransferMemberRequest): Promise<ApiResponse<{ userId: string; fromTeamId: string; toTeamId: string; newRole: string }>> {
        console.log('🔀 Transferring member between teams:', data);

        try {
            const response = await apiService.post('/api/teams/members/transfer', data);

            if (response.success) {
                console.log('✅ Member transferred successfully');
            }

            return response;
        } catch (error: any) {
            console.error('❌ Failed to transfer member:', error.message);
            throw error;
        }
    }
}

// Create and export a singleton instance with NEW name
export const teamManagementServiceV2 = new TeamManagementServiceV2();

// Export the class for testing or custom instances
export default TeamManagementServiceV2;