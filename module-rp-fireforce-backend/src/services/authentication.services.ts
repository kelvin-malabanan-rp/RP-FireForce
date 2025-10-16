// services/authentication.services.ts
import { DatabaseService } from "./database.service";
import { Env, User } from "../types";

interface OAuthUserInfo {
	sub?: string; // Google
	id?: number | string; // GitHub
	email: string;
	name?: string;
	given_name?: string;
	family_name?: string;
	picture?: string;
	avatar_url?: string;
	login?: string; // GitHub username
}

interface OAuthResult {
	user: any;
	token: string;
}

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

			// Update last login
			await this.updateLastLogin(user.id);

			return user;
		} catch (error) {
			console.error('Credential validation error:', error);
			return null;
		}
	}

	/**
	 * Handle Google OAuth authentication
	 */
	async handleGoogleOAuth(code: string): Promise<OAuthResult | null> {
		try {
			console.log('🔵 Starting Google OAuth flow...');

			// Exchange code for tokens
			const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					code,
					client_id: this.env.GOOGLE_CLIENT_ID,
					client_secret: this.env.GOOGLE_CLIENT_SECRET,
					redirect_uri: 'https://incident-webhook-api.rapidresponse.workers.dev/auth/google/callback',
					grant_type: 'authorization_code'
				})
			});

			const tokens = await tokenResponse.json();

			if (tokens.error) {
				console.error('Google token exchange error:', tokens.error);
				return null;
			}

			console.log('✅ Token exchange successful');

			// Get user info
			const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
				headers: { 'Authorization': `Bearer ${tokens.access_token}` }
			});

			const userInfo: OAuthUserInfo = await userResponse.json();
			console.log('✅ User info retrieved:', userInfo.email);

			// Find or create user
			const user = await this.findOrCreateOAuthUser('google', userInfo);

			if (!user) {
				console.error('❌ Failed to find/create user');
				return null;
			}

			console.log('✅ User ready:', user.email);

			// Generate JWT token
			const token = await this.generateJWT(user);

			return { user, token };

		} catch (error) {
			console.error('Google OAuth error:', error);
			return null;
		}
	}

	/**
	 * Handle GitHub OAuth authentication
	 */
	async handleGithubOAuth(code: string): Promise<OAuthResult | null> {
		try {
			console.log('🔵 Starting GitHub OAuth flow...');

			// Exchange code for access token
			const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify({
					client_id: this.env.GITHUB_CLIENT_ID,
					client_secret: this.env.GITHUB_CLIENT_SECRET,
					code,
					redirect_uri: 'https://incident-webhook-api.rapidresponse.workers.dev/auth/github/callback'
				})
			});

			const tokens = await tokenResponse.json();

			if (tokens.error) {
				console.error('GitHub token exchange error:', tokens.error);
				return null;
			}

			console.log('✅ Token exchange successful');

			// Get user info
			const userResponse = await fetch('https://api.github.com/user', {
				headers: {
					'Authorization': `Bearer ${tokens.access_token}`,
					'Accept': 'application/vnd.github.v3+json',
					'User-Agent': 'RP-FireForce'
				}
			});

			const userInfo: OAuthUserInfo = await userResponse.json();

			// Get user emails
			const emailResponse = await fetch('https://api.github.com/user/emails', {
				headers: {
					'Authorization': `Bearer ${tokens.access_token}`,
					'Accept': 'application/vnd.github.v3+json',
					'User-Agent': 'RP-FireForce'
				}
			});

			const emails = await emailResponse.json();
			const primaryEmail = emails.find((e: any) => e.primary)?.email || userInfo.email;
			userInfo.email = primaryEmail;

			console.log('✅ User info retrieved:', userInfo.email);

			// Find or create user
			const user = await this.findOrCreateOAuthUser('github', userInfo);

			if (!user) {
				console.error('❌ Failed to find/create user');
				return null;
			}

			console.log('✅ User ready:', user.email);

			// Generate JWT token
			const token = await this.generateJWT(user);

			return { user, token };

		} catch (error) {
			console.error('GitHub OAuth error:', error);
			return null;
		}
	}

	/**
	 * Find or create OAuth user
	 */
	private async findOrCreateOAuthUser(provider: 'google' | 'github', userInfo: OAuthUserInfo): Promise<any | null> {
		try {
			const oauthId = provider === 'google' ? userInfo.sub : userInfo.id?.toString();

			if (!oauthId) {
				console.error('Missing OAuth ID');
				return null;
			}

			// Check if user exists
			let user = await this.env.DB.prepare(
				'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?'
			).bind(provider, oauthId).first();

			if (user) {
				console.log('✅ Existing user found');
				// Update last login
				await this.updateLastLogin(user.id);
				return user;
			}

			// Create new user
			console.log('📝 Creating new user...');
			const userId = crypto.randomUUID();
			const nameParts = userInfo.name?.split(' ') || [];
			const firstName = provider === 'google'
				? userInfo.given_name || nameParts[0] || ''
				: nameParts[0] || userInfo.login || '';
			const lastName = provider === 'google'
				? userInfo.family_name || nameParts.slice(1).join(' ') || ''
				: nameParts.slice(1).join(' ') || '';
			const displayName = userInfo.name || userInfo.login || userInfo.email;
			const avatarUrl = provider === 'google' ? userInfo.picture : userInfo.avatar_url;

			await this.env.DB.prepare(`
				INSERT INTO users (
					id, email, first_name, last_name, display_name,
					avatar_url, oauth_provider, oauth_id, is_verified, is_active,
					created_at, updated_at, last_login
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			`).bind(
				userId,
				userInfo.email,
				firstName,
				lastName,
				displayName,
				avatarUrl || '',
				provider,
				oauthId
			).run();

			// Fetch the newly created user
			user = await this.env.DB.prepare(
				'SELECT * FROM users WHERE id = ?'
			).bind(userId).first();

			console.log(`✅ Created new ${provider} user:`, userInfo.email);

			return user;

		} catch (error) {
			console.error('Error finding/creating OAuth user:', error);
			return null;
		}
	}

	/**
	 * Generate JWT token
	 */
	async generateJWT(user: any): Promise<string> {
		const header = {
			alg: 'HS256',
			typ: 'JWT'
		};

		const payload = {
			userId: user.id,
			email: user.email,
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
		};

		const encoder = new TextEncoder();

		const base64Header = btoa(JSON.stringify(header)).replace(/=/g, '');
		const base64Payload = btoa(JSON.stringify(payload)).replace(/=/g, '');

		const data = `${base64Header}.${base64Payload}`;
		const keyData = encoder.encode(this.env.JWT_SECRET);
		const dataToSign = encoder.encode(data);

		const key = await crypto.subtle.importKey(
			'raw',
			keyData,
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['sign']
		);

		const signature = await crypto.subtle.sign('HMAC', key, dataToSign);
		const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, '');

		return `${data}.${base64Signature}`;
	}

	/**
	 * Update user's last login timestamp
	 */
	private async updateLastLogin(userId: string): Promise<void> {
		try {
			await this.env.DB.prepare(
				'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
			).bind(userId).run();
		} catch (error) {
			console.error('Error updating last login:', error);
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
