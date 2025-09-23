// import {DatabaseService} from "./database.service";
// import {Env, JWTPayload} from "../types";
//
// export class AuthenticationServices {
// 	private dbService: DatabaseService;
// 	private env: Env;
//
// 	constructor(env: Env) {
// 		this.env = env;
// 		this.dbService = new DatabaseService(env);
// 	}
//
// 	/**
// 	 * Validate user credentials
// 	 */
// 	async validateCredentials(email: string, password: string): Promise<User | null> {
// 		try {
// 			// Check if email is from @rocketpartners.io domain
// 			if (!email.endsWith('@rocketpartners.io')) {
// 				console.log('Invalid email domain:', email);
// 				return null;
// 			}
//
// 			// Get user from database
// 			const user = await this.dbService.getUserByEmail(email);
//
// 			if (!user || !user.isActive) {
// 				return null;
// 			}
//
// 			// Verify password
// 			const isValid = await this.verifyPassword(password, user.passwordHash);
//
// 			if (!isValid) {
// 				return null;
// 			}
//
// 			return user;
// 		} catch (error) {
// 			console.error('Credential validation error:', error);
// 			return null;
// 		}
// 	}
// 	/**
// 	 * Verify password
// 	 */
// 	async verifyPassword(password: string, hash: string): Promise<boolean> {
// 		const passwordHash = await this.hashPassword(password);
// 		return passwordHash === hash;
// 	}
// 	/**
// 	 * Hash password using Web Crypto API
// 	 */
// 	async hashPassword(password: string): Promise<string> {
// 		const encoder = new TextEncoder();
// 		const data = encoder.encode(password + this.config.jwtSecret);
// 		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
// 		const hashArray = Array.from(new Uint8Array(hashBuffer));
// 		return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
// 	}
// 	/**
// 	 * Generate JWT token
// 	 */
// 	async generateJWT(user: User): Promise<string> {
// 		const header = {
// 			alg: 'HS256',
// 			typ: 'JWT'
// 		};
//
// 		const payload: JWTPayload = {
// 			sub: user.id,
// 			email: user.email,
// 			role: user.role,
// 			iat: Math.floor(Date.now() / 1000),
// 			exp: Math.floor(Date.now() / 1000) + this.config.jwtExpiresIn
// 		};
//
// 		const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
// 		const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
//
// 		const signature = await this.createSignature(
// 			`${encodedHeader}.${encodedPayload}`,
// 			this.config.jwtSecret
// 		);
//
// 		return `${encodedHeader}.${encodedPayload}.${signature}`;
// 	}
//
// }
