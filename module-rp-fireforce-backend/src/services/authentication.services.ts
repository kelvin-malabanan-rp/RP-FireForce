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

			if (!email.endsWith('@rocketpartners.io')) {
				console.log('Invalid email domain:', email);
				return null;
			}

			const user = await this.dbService.getUserByEmail(email);
			console.log('User found:', user ? 'Yes' : 'No');

			if (!user || !user.isActive) {
				console.log('User not found or inactive');
				return null;
			}

			const isValid = await this.verifyPassword(password, user.passwordHash);
			console.log('Password valid:', isValid);

			if (!isValid) {
				console.log('Invalid password');
				return null;
			}

			await this.updateLastLogin(user.id);

			return user;
		} catch (error) {
			console.error('Credential validation error:', error);
			return null;
		}
	}

	// --- WEB OAUTH HANDLERS (Fixed redirect URI for web) ---

	/**
	 * Handle Google OAuth authentication (Web Flow)
	 */
	async handleGoogleOAuth(code: string): Promise<OAuthResult | null> {
		return this.handleGoogleOAuthWithRedirect(
			code,
			'https://incident-webhook-api.rapidresponse.workers.dev/auth/google/callback'
		);
	}

	/**
	 * Handle GitHub OAuth authentication (Web Flow)
	 */
	async handleGithubOAuth(code: string): Promise<OAuthResult | null> {
		return this.handleGithubOAuthWithRedirect(
			code,
			'https://incident-webhook-api.rapidresponse.workers.dev/auth/github/callback'
		);
	}

	// --- MOBILE OAUTH HANDLERS (Dynamic redirect URI for mobile) ---

	/**
	 * Handle Google OAuth authentication (Mobile Flow)
	 */
	async handleGoogleOAuthMobile(code: string, redirectUri: string): Promise<OAuthResult | null> {
		console.log('🔵 Starting Mobile Google OAuth flow...');
		console.log('📱 Mobile Redirect URI:', redirectUri);
		return this.handleGoogleOAuthWithRedirect(code, redirectUri);
	}

	/**
	 * Handle GitHub OAuth authentication (Mobile Flow)
	 */
	async handleGithubOAuthMobile(code: string, redirectUri: string): Promise<OAuthResult | null> {
		console.log('🔵 Starting Mobile GitHub OAuth flow...');
		console.log('📱 Mobile Redirect URI:', redirectUri);
		return this.handleGithubOAuthWithRedirect(code, redirectUri);
	}

	// --- PRIVATE OAUTH IMPLEMENTATION ---

	/**
	 * Generic Google OAuth handler with custom redirect URI
	 */
	private async handleGoogleOAuthWithRedirect(code: string, redirectUri: string): Promise<OAuthResult | null> {
		try {
			console.log('🔵 Processing Google OAuth...');
			console.log('📍 Using Redirect URI:', redirectUri);

			const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					code,
					client_id: this.env.GOOGLE_CLIENT_ID,
					client_secret: this.env.GOOGLE_CLIENT_SECRET,
					redirect_uri: redirectUri,
					grant_type: 'authorization_code'
				})
			});

			const tokens = await tokenResponse.json();

			if (tokens.error) {
				console.error('❌ Google token exchange error:', tokens.error);
				console.error('Error details:', tokens.error_description);
				return null;
			}

			console.log('✅ Token exchange successful');

			const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
				headers: { 'Authorization': `Bearer ${tokens.access_token}` }
			});

			const userInfo: OAuthUserInfo = await userResponse.json();
			console.log('✅ User info retrieved:', userInfo.email);

			if (!userInfo.email.endsWith('@rocketpartners.io')) {
				console.error('❌ Invalid email domain:', userInfo.email);
				return null;
			}

			const user = await this.findOrCreateOAuthUser('google', userInfo);

			if (!user) {
				console.error('❌ Failed to find/create user');
				return null;
			}

			console.log('✅ User ready:', user.email);

			// ✅ NEW: Enrich user with team information
			const enrichedUser = await this.enrichUserWithTeamInfo(user);

			const token = await this.generateJWT(enrichedUser);

			return { user: enrichedUser, token };

		} catch (error) {
			console.error('❌ Google OAuth error:', error);
			return null;
		}
	}

	/**
	 * Generic GitHub OAuth handler with custom redirect URI
	 */
	private async handleGithubOAuthWithRedirect(code: string, redirectUri: string): Promise<OAuthResult | null> {
		try {
			console.log('🔵 Processing GitHub OAuth...');
			console.log('📍 Using Redirect URI:', redirectUri);

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
					redirect_uri: redirectUri
				})
			});

			const tokens = await tokenResponse.json();

			if (tokens.error) {
				console.error('❌ GitHub token exchange error:', tokens.error);
				console.error('Error details:', tokens.error_description);
				return null;
			}

			console.log('✅ Token exchange successful');

			const userResponse = await fetch('https://api.github.com/user', {
				headers: {
					'Authorization': `Bearer ${tokens.access_token}`,
					'Accept': 'application/vnd.github.v3+json',
					'User-Agent': 'RP-FireForce'
				}
			});

			const userInfo: OAuthUserInfo = await userResponse.json();

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

			if (!userInfo.email.endsWith('@rocketpartners.io')) {
				console.error('❌ Invalid email domain:', userInfo.email);
				return null;
			}

			const user = await this.findOrCreateOAuthUser('github', userInfo);

			if (!user) {
				console.error('❌ Failed to find/create user');
				return null;
			}

			console.log('✅ User ready:', user.email);

			// ✅ NEW: Enrich user with team information
			const enrichedUser = await this.enrichUserWithTeamInfo(user);

			const token = await this.generateJWT(enrichedUser);

			return { user: enrichedUser, token };

		} catch (error) {
			console.error('❌ GitHub OAuth error:', error);
			return null;
		}
	}

	// --- UTILITY FUNCTIONS ---

	/**
	 * ✅ NEW: Enrich user object with team information
	 * Queries oncall_team_members to add team_id, team_role, and team_name
	 */
	async enrichUserWithTeamInfo(user: any): Promise<any> {
		try {
			console.log('🔍 Fetching team info for user:', user.id);

			const teamMembership = await this.env.DB.prepare(`
				SELECT
					otm.team_id,
					otm.role as team_role,
					ot.name as team_name
				FROM oncall_team_members otm
						 JOIN oncall_teams ot ON otm.team_id = ot.id
				WHERE otm.user_id = ?
				  AND otm.is_active = 1
				  AND ot.is_active = 1
				LIMIT 1
			`).bind(user.id).first();

			if (teamMembership) {
				console.log('✅ Team found:', teamMembership.team_name, '| Role:', teamMembership.team_role);

				return {
					...user,
					team_id: teamMembership.team_id,
					team_role: teamMembership.team_role,
					team_name: teamMembership.team_name
				};
			} else {
				console.log('⚠️ No team membership found for user');
				return {
					...user,
					team_id: null,
					team_role: null,
					team_name: null
				};
			}
		} catch (error) {
			console.error('❌ Error enriching user with team info:', error);
			return {
				...user,
				team_id: null,
				team_role: null,
				team_name: null
			};
		}
	}

	/**
	 * Find or create OAuth user (safe against duplicate email constraint)
	 */
	private async findOrCreateOAuthUser(provider: 'google' | 'github', userInfo: OAuthUserInfo): Promise<any | null> {
		try {
			const oauthId = provider === 'google'
				? (userInfo.id?.toString() || userInfo.sub)
				: userInfo.id?.toString();

			console.log('🔑 OAuth ID:', oauthId);
			console.log('🔑 Provider:', provider);

			if (!oauthId || !userInfo.email) {
				console.error('❌ Missing required OAuth info');
				return null;
			}

			let user = await this.env.DB.prepare(
				`SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?`
			).bind(provider, oauthId).first();

			if (user) {
				console.log('✅ Existing OAuth user found');
				await this.updateLastLogin(user.id);
				return user;
			}

			const existingByEmail = await this.env.DB.prepare(
				`SELECT * FROM users WHERE email = ?`
			).bind(userInfo.email).first();

			if (existingByEmail) {
				console.log('🔁 Found existing user with same email. Linking OAuth account...');

				await this.env.DB.prepare(`
					UPDATE users
					SET oauth_provider = ?,
						oauth_id       = ?,
						display_name   = ?,
						avatar_url     = ?,
						updated_at     = CURRENT_TIMESTAMP
					WHERE email = ?
				`).bind(
					provider,
					oauthId,
					userInfo.name || userInfo.login || existingByEmail.display_name,
					userInfo.picture || userInfo.avatar_url || existingByEmail.avatar_url,
					userInfo.email
				).run();

				await this.updateLastLogin(existingByEmail.id);

				user = await this.env.DB.prepare(
					`SELECT * FROM users WHERE email = ?`
				).bind(userInfo.email).first();

				return user;
			}

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

			const username = this.generateUsername(firstName || 'user', lastName || 'name');
			console.log('Generated username:', username);

			const defaultPassword = 'password123';
			const passwordHash = await this.hashPassword(defaultPassword);
			console.log('Default password set for OAuth user');

			await this.env.DB.prepare(`
				INSERT INTO users (id, email, username, password_hash, first_name, last_name, display_name,
								   avatar_url, oauth_provider, oauth_id, is_verified, is_active,
								   created_at, updated_at, last_login)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			`).bind(
				userId,
				userInfo.email,
				username,
				passwordHash,
				firstName,
				lastName,
				displayName,
				avatarUrl || '',
				provider,
				oauthId
			).run();

			user = await this.env.DB.prepare(
				`SELECT * FROM users WHERE id = ?`
			).bind(userId).first();

			console.log(`✅ Created new ${provider} user:`, userInfo.email);
			console.log(`✅ Username: ${username}, Default password: ${defaultPassword}`);
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
		const hashedInput = await this.hashPassword(password);
		return hashedInput === hash;
	}

	/**
	 * Hash password using Web Crypto API
	 */
	private async hashPassword(password: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(password + 'rp-fire-force-salt');
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	}

	/**
	 * Verify JWT token and extract payload
	 */
	async verifyJWT(token: string): Promise<{ userId: string; email: string } | null> {
		try {
			console.log('🔐 Verifying JWT token...');

			const parts = token.split('.');
			if (parts.length !== 3) {
				console.error('❌ Invalid token format');
				return null;
			}

			const [headerB64, payloadB64, signatureB64] = parts;

			const payloadJson = atob(payloadB64);
			const payload = JSON.parse(payloadJson);

			const now = Math.floor(Date.now() / 1000);
			if (payload.exp && payload.exp < now) {
				console.error('❌ Token has expired');
				return null;
			}

			const data = `${headerB64}.${payloadB64}`;
			const encoder = new TextEncoder();
			const keyData = encoder.encode(this.env.JWT_SECRET);
			const dataToSign = encoder.encode(data);

			const key = await crypto.subtle.importKey(
				'raw',
				keyData,
				{ name: 'HMAC', hash: 'SHA-256' },
				false,
				['verify']
			);

			const signatureBytes = Uint8Array.from(
				atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
				c => c.charCodeAt(0)
			);

			const isValid = await crypto.subtle.verify(
				'HMAC',
				key,
				signatureBytes,
				dataToSign
			);

			if (!isValid) {
				console.error('❌ Invalid token signature');
				return null;
			}

			if (!payload.userId || !payload.email) {
				console.error('❌ Invalid token payload - missing userId or email');
				return null;
			}

			console.log('✅ Token verified for user:', payload.email);

			return {
				userId: payload.userId,
				email: payload.email
			};

		} catch (error: any) {
			console.error('❌ JWT verification error:', error.message);
			return null;
		}
	}

	/**
	 * Extract and verify JWT from Authorization header
	 */
	async verifyAuthHeader(authHeader: string | null): Promise<{ userId: string; email: string } | null> {
		if (!authHeader) {
			console.log('❌ No Authorization header');
			return null;
		}

		if (!authHeader.startsWith('Bearer ')) {
			console.log('❌ Invalid Authorization header format');
			return null;
		}

		const token = authHeader.substring(7);

		if (!token || token.trim() === '') {
			console.log('❌ Empty token');
			return null;
		}

		return this.verifyJWT(token);
	}

	/**
	 * Generate username from name (first letter of first name + last name)
	 */
	private generateUsername(firstName: string, lastName: string): string {
		const firstInitial = firstName.charAt(0).toLowerCase();
		const cleanLastName = lastName.toLowerCase().replace(/\s+/g, '');
		return `${firstInitial}${cleanLastName}`;
	}
}
