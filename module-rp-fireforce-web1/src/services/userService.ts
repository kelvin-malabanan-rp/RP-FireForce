// src/services/userService.ts

import { apiService } from './apiService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UserProfile {
    id: string;
    email: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    phoneNumber: string | null;
    avatarUrl: string | null;
    oauthProvider: string | null;
    oauthId: string | null;
    userRole: string;
    isActive: boolean;
    isVerified: boolean;
    lastLogin: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    displayName?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

// ============================================================================
// USER SERVICE
// ============================================================================

class UserService {

    /**
     * Get current user's profile
     * GET: /api/users/profile
     */
    async getProfile(): Promise<UserProfile> {
        try {
            console.log('📥 Fetching user profile...');

            const response = await apiService.get<any>('/api/users/profile');

            if (response.data?.data) {
                console.log('✅ Profile fetched successfully');
                return response.data.data;
            }

            throw new Error('Invalid response format');
        } catch (error: any) {
            console.error('❌ Failed to fetch profile:', error);
            throw error;
        }
    }

    /**
     * Update current user's profile
     * PUT: /api/users/profile
     */
    async updateProfile(data: UpdateProfileRequest): Promise<any> {
        try {
            console.log('📝 Updating user profile...', data);

            const response = await apiService.put<any>('/api/users/profile', data);

            if (response.data?.data) {
                // Update localStorage with new user data
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const updatedUser = {
                    ...currentUser,
                    firstName: response.data.data.firstName,
                    lastName: response.data.data.lastName,
                    phoneNumber: response.data.data.phoneNumber,
                    displayName: response.data.data.displayName,
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));

                console.log('✅ Profile updated successfully');
                return response.data.data;
            }

            throw new Error('Invalid response format');
        } catch (error: any) {
            console.error('❌ Failed to update profile:', error);
            throw error;
        }
    }

    /**
     * Change password (only for non-OAuth users)
     * PUT: /api/users/password
     */
    async changePassword(data: ChangePasswordRequest): Promise<void> {
        try {
            console.log('🔐 Changing password...');

            const response = await apiService.put<any>('/api/users/password', data);

            if (response.data?.httpStatus === 'OK') {
                console.log('✅ Password changed successfully');
                return;
            }

            throw new Error(response.data?.message || 'Password change failed');
        } catch (error: any) {
            console.error('❌ Failed to change password:', error);
            throw error;
        }
    }

    /**
     * Upload profile picture
     * POST: /api/users/avatar
     */
    async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
        try {
            console.log('📸 Uploading avatar...');

            const formData = new FormData();
            formData.append('avatar', file);

            // Use fetch directly for FormData
            const token = localStorage.getItem('authToken');
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'https://incident-webhook-api.rapidresponse.workers.dev'}/api/users/avatar`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`);
            }

            const result = await response.json();

            if (result.data?.avatarUrl) {
                // Update localStorage
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                currentUser.avatarUrl = result.data.avatarUrl;
                localStorage.setItem('user', JSON.stringify(currentUser));

                console.log('✅ Avatar uploaded successfully');
                return result.data;
            }

            throw new Error('Invalid response format');
        } catch (error: any) {
            console.error('❌ Failed to upload avatar:', error);
            throw error;
        }
    }

    /**
     * Check if user is OAuth user (can't change password)
     */
    isOAuthUser(): boolean {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                return !!user.oauthProvider;
            } catch {
                return false;
            }
        }
        return false;
    }
}

// Export singleton instance
export const userService = new UserService();
export default userService;