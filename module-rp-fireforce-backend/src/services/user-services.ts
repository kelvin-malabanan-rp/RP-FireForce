import { Env, User } from "../types";
import { DatabaseService } from "./database.service";

export class UserServices {
	private env: Env;
	private dbService: DatabaseService;

	constructor(env: Env, dbService: DatabaseService) {
		this.env = env;
		this.dbService = dbService; // ← Use the passed instance, don't create new one
	}

	async getAllUsers(activeOnly: boolean = false): Promise<User[]> {
		try {
			console.log('Fetching all users from database', activeOnly ? '(active only)' : '');

			const query = `
				SELECT
					id,
					email,
					username,
					first_name,
					last_name,
					phone_number,
					user_role,
					is_active,
					is_verified,
					last_login,
					created_at,
					updated_at
				FROM users
						 ${activeOnly ? 'WHERE is_active = 1' : ''}
				ORDER BY created_at DESC
			`;

			const result = await this.dbService.db.prepare(query).all();

			if (!result.results || result.results.length === 0) {
				console.log('No users found');
				return [];
			}

			const users: User[] = result.results.map((row: any) => ({
				id: row.id,
				email: row.email,
				username: row.username,
				passwordHash: '', // Don't expose password hash
				firstName: row.first_name,
				lastName: row.last_name,
				phoneNumber: row.phone_number,
				role: row.user_role,
				isActive: !!row.is_active,
				isVerified: !!row.is_verified,
				lastLogin: row.last_login,
				createdAt: row.created_at,
				updatedAt: row.updated_at,
			}));

			console.log(`Found ${users.length} users`);
			return users;
		} catch (error) {
			console.error('Error fetching all users:', error);
			throw error;
		}
	}

	async getUserById(userId: string): Promise<User | null> {
		try {
			console.log('Fetching user by ID:', userId);

			const query = `
            SELECT
                id,
                email,
                username,
                first_name,
                last_name,
                phone_number,
				user_role,
                is_active,
                is_verified,
                last_login,
                created_at,
                updated_at
            FROM users
            WHERE id = ?
            LIMIT 1
        `;

			const result = await this.dbService.db.prepare(query).bind(userId).first();

			if (!result) {
				console.log('User not found:', userId);
				return null;
			}

			const user: User = {
				id: result.id as string,
				email: result.email as string,
				passwordHash: '',
				firstName: result.first_name as string,
				lastName: result.last_name as string,
				phoneNumber: result.phone_number as string,
				role: result.user_role as "admin" | "operator" | "viewer",
				isActive: !!result.is_active,
				isVerified: !!result.is_verified,
				lastLogin: result.last_login as string,
				createdAt: result.created_at as string,
				updatedAt: result.updated_at as string,
			};

			console.log('Found user:', user.email);
			return user;
		} catch (error) {
			console.error('Error fetching user by ID:', error);
			throw error;
		}
	}

	/**
	 * Get user profile with additional fields
	 */
	async getUserProfile(userId: string): Promise<any | null> {
		try {
			console.log('Fetching user profile:', userId);

			const query = `
             SELECT
                id,
                email,
                username,
                first_name as firstName,
                last_name as lastName,
                display_name as displayName,
                phone_number as phoneNumber,
                avatar_url as avatarUrl,
                oauth_provider as oauthProvider,
                oauth_id as oauthId,
                user_role as userRole,
                is_active as isActive,
                is_verified as isVerified,
                last_login as lastLogin,
                created_at as createdAt,
                updated_at as updatedAt
             FROM users
             WHERE id = ? AND is_active = 1
             LIMIT 1
          `;

			const result = await this.dbService.db.prepare(query).bind(userId).first();

			if (!result) {
				console.log('User not found:', userId);
				return null;
			}

			return {
				...result,
				isActive: !!result.isActive,
				isVerified: !!result.isVerified,
			};
		} catch (error) {
			console.error('Error fetching user profile:', error);
			throw error;
		}
	}

	/**
	 * Update user profile
	 */
	async updateUserProfile(
		userId: string,
		updates: {
			firstName?: string;
			lastName?: string;
			phoneNumber?: string;
			displayName?: string;
		}
	): Promise<any> {
		try {
			console.log('Updating user profile:', userId, updates);

			const updateQuery = `
             UPDATE users
             SET
                first_name = COALESCE(?, first_name),
                last_name = COALESCE(?, last_name),
                phone_number = COALESCE(?, phone_number),
                display_name = COALESCE(?, display_name),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND is_active = 1
          `;

			await this.dbService.db.prepare(updateQuery).bind(
				updates.firstName || null,
				updates.lastName || null,
				updates.phoneNumber || null,
				updates.displayName || null,
				userId
			).run();

			// Get updated user
			const updatedUser = await this.dbService.db.prepare(`
             SELECT
                id,
                email,
                first_name as firstName,
                last_name as lastName,
                phone_number as phoneNumber,
                display_name as displayName,
                updated_at as updatedAt
             FROM users
             WHERE id = ?
          `).bind(userId).first();

			console.log('Profile updated successfully');
			return updatedUser;
		} catch (error) {
			console.error('Error updating user profile:', error);
			throw error;
		}
	}

	/**
	 * Change user password
	 */
	async changePassword(
		userId: string,
		currentPassword: string,
		newPassword: string
	): Promise<{ success: boolean; message: string }> {
		try {
			console.log('Attempting password change for user:', userId);

			// Check if user is OAuth user
			const user = await this.dbService.db.prepare(`
             SELECT oauth_provider, password_hash
             FROM users
             WHERE id = ? AND is_active = 1
          `).bind(userId).first();

			if (!user) {
				return { success: false, message: 'User not found' };
			}

			if (user.oauth_provider) {
				return {
					success: false,
					message: 'Cannot change password for OAuth users'
				};
			}

			// Verify current password using hashPassword
			const currentHash = await this.hashPassword(currentPassword);
			if (currentHash !== user.password_hash) {
				return {
					success: false,
					message: 'Current password is incorrect'
				};
			}

			// Hash new password using hashPassword
			const newPasswordHash = await this.hashPassword(newPassword);

			// Update password
			await this.dbService.db.prepare(`
             UPDATE users
             SET
                password_hash = ?,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = ?
          `).bind(newPasswordHash, userId).run();

			console.log('Password changed successfully');
			return {
				success: true,
				message: 'Password changed successfully'
			};
		} catch (error) {
			console.error('Error changing password:', error);
			throw error;
		}
	}

	/**
	 * Update user avatar URL
	 */
	async updateAvatar(userId: string, avatarUrl: string): Promise<any> {
		try {
			console.log('Updating avatar for user:', userId);

			await this.dbService.db.prepare(`
             UPDATE users
             SET
                avatar_url = ?,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND is_active = 1
          `).bind(avatarUrl, userId).run();

			return { avatarUrl };
		} catch (error) {
			console.error('Error updating avatar:', error);
			throw error;
		}
	}

	/**
	 * Hash password using Web Crypto API
	 */
	private async hashPassword(password: string): Promise<string> {
		const encoder = new TextEncoder();
		// Using a simple salt for now - replace with proper bcrypt in production
		const data = encoder.encode(password + 'rp-fire-force-salt');
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	}
}
