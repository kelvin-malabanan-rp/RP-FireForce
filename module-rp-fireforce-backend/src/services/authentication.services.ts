import {DatabaseService} from "./database.service";
import {Env, User} from "../types";

export class AuthenticationServices {
	private dbService: DatabaseService;
	private env: Env;

	constructor(env: Env) {
		this.env = env;
		this.dbService = new DatabaseService(env);
	}

	/**
	 * Validate user credentials and return user if valid
	 */
	async validateCredentials(email: string, password: string): Promise<User | null> {
		try {
			console.log('Validating credentials for:', email);

			// Check if email is from @rocketpartners.io domain
			if (!email.endsWith('@rocketpartners.io')) {
				console.log('Invalid email domain:', email);
				return null;
			}

			// Get user from database
			const user = await this.dbService.getUserByEmail(email);
			console.log('User found:', user ? 'Yes' : 'No');

			if (!user || !user.isActive) {
				console.log('User not found or inactive');
				return null;
			}

			// Verify password
			const isValid = await this.verifyPassword(password, user.passwordHash);
			console.log('Password valid:', isValid);

			if (!isValid) {
				console.log('Invalid password');
				return null;
			}

			return user;
		} catch (error) {
			console.error('Credential validation error:', error);
			return null;
		}
	}

	/**
	 * Verify password against hash
	 */
	private async verifyPassword(password: string, hash: string): Promise<boolean> {
		console.log('Verifying password...');
		console.log('Hash from DB:', hash);
		console.log('Password provided:', password);

		// For testing with sample data
		if (hash === '$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe') {
			const isValid = password === 'password123';
			console.log('Using test validation, result:', isValid);
			return isValid;
		}

		// Simple hash comparison for now
		const passwordHash = await this.hashPassword(password);
		console.log('Generated hash:', passwordHash);
		return passwordHash === hash;
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
