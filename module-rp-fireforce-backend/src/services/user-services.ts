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
					role,
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
				role: row.role,
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
}
