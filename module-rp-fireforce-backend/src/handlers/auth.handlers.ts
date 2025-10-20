import { ApiResponse, Env, LoginRequest, LoginResponse } from '../types';
import { AuthenticationServices } from "../services/authentication.services";

export async function handleLogin(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		let body: LoginRequest;
		try {
			body = await request.json() as LoginRequest;
		} catch (error) {
			return new Response(JSON.stringify({
				httpStatus: "BAD_REQUEST",
				message: "Invalid request body",
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		if (!body.email || !body.password) {
			return new Response(JSON.stringify({
				httpStatus: "BAD_REQUEST",
				message: "Email and password are required",
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(body.email)) {
			return new Response(JSON.stringify({
				httpStatus: "BAD_REQUEST",
				message: "Invalid email format",
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		if (!body.email.endsWith('@rocketpartners.io')) {
			return new Response(JSON.stringify({
				httpStatus: "FORBIDDEN",
				message: "Access restricted to @rocketpartners.io email addresses",
				data: null
			}), {
				status: 403,
				headers: corsHeaders
			});
		}

		const authService = new AuthenticationServices(env);
		const user = await authService.validateCredentials(body.email, body.password);

		if (!user) {
			console.log('Failed login attempt for email:', body.email);
			return new Response(JSON.stringify({
				httpStatus: "UNAUTHORIZED",
				message: "Invalid email or password",
				data: null
			}), {
				status: 401,
				headers: corsHeaders
			});
		}

		const token = await authService.generateJWT(user);

		const loginResponse: LoginResponse = {
			id: user.id,
			email: user.email,
			password: "",
			firstName: user.firstName || "",
			lastName: user.lastName || "",
			teamId: user.teamId || null,
			teamRole: user.teamRole || null,
			token: token,
			role: user.role || "user",
		};

		const response: ApiResponse<LoginResponse> = {
			httpStatus: "OK",
			message: "Login successful",
			data: loginResponse
		};

		console.log(`✅ Successful login: ${user.email} — Team: ${user.teamId}, Team Role: ${user.teamRole}`);

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});

	} catch (error) {
		console.error('Login error:', error);
		return new Response(JSON.stringify({
			httpStatus: "INTERNAL_SERVER_ERROR",
			message: "An error occurred during login. Please try again.",
			data: null
		}), {
			status: 500,
			headers: corsHeaders
		});
	}
}

// ============================================================================
// WEB OAUTH HANDLERS (For web app with redirects)
// ============================================================================

export async function handleGoogleCallback(
	request: Request,
	env: Env
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const code = url.searchParams.get("code");
		const error = url.searchParams.get("error");
		const frontendUrl = env.FRONTEND_URL || 'http://localhost:5173';

		if (error) {
			return Response.redirect(`${frontendUrl}/auth/error?error=${encodeURIComponent(error)}`);
		}

		if (!code) {
			return Response.redirect(`${frontendUrl}/auth/error?error=no_code`);
		}

		const authService = new AuthenticationServices(env);
		const result = await authService.handleGoogleOAuth(code);

		if (!result) {
			return Response.redirect(`${frontendUrl}/auth/error?error=authentication_failed`);
		}

		// ✅ FIXED: result.user is already enriched by the service
		const params = new URLSearchParams({
			token: result.token,
			userId: result.user.id,
			email: result.user.email,
			displayName: result.user.display_name || result.user.email || "",
			avatarUrl: result.user.avatar_url || "",
			firstName: result.user.first_name || "",
			lastName: result.user.last_name || "",
			teamId: result.user.team_id || "",
			teamRole: result.user.team_role || ""
		}).toString();

		return Response.redirect(`${frontendUrl}/auth/success#${params}`);
	} catch (error) {
		console.error("Google OAuth error:", error);
		return Response.redirect(
			`${env.FRONTEND_URL || 'http://localhost:5173'}/auth/error?error=server_error`
		);
	}
}

export async function handleGithubCallback(
	request: Request,
	env: Env
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const code = url.searchParams.get("code");
		const error = url.searchParams.get("error");
		const frontendUrl = env.FRONTEND_URL || 'http://localhost:5173';

		if (error) {
			return Response.redirect(`${frontendUrl}/auth/error?error=${encodeURIComponent(error)}`);
		}

		if (!code) {
			return Response.redirect(`${frontendUrl}/auth/error?error=no_code`);
		}

		const authService = new AuthenticationServices(env);
		const result = await authService.handleGithubOAuth(code);

		if (!result) {
			return Response.redirect(`${frontendUrl}/auth/error?error=authentication_failed`);
		}

		// ✅ FIXED: result.user is already enriched by the service
		const params = new URLSearchParams({
			token: result.token,
			userId: result.user.id,
			email: result.user.email,
			displayName: result.user.display_name || result.user.email || "",
			avatarUrl: result.user.avatar_url || "",
			firstName: result.user.first_name || "",
			lastName: result.user.last_name || "",
			teamId: result.user.team_id || "",
			teamRole: result.user.team_role || ""
		}).toString();

		return Response.redirect(`${frontendUrl}/auth/success#${params}`);
	} catch (error) {
		console.error("GitHub OAuth error:", error);
		return Response.redirect(
			`${env.FRONTEND_URL || 'http://localhost:5173'}/auth/error?error=server_error`
		);
	}
}

// ============================================================================
// MOBILE OAUTH HANDLERS (For mobile app with JSON responses)
// ============================================================================

export async function handleMobileGoogleAuth(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const body = await request.json() as {
			code: string;
			redirectUri: string;
		};

		if (!body.code) {
			return new Response(JSON.stringify({
				httpStatus: "BAD_REQUEST",
				message: "Authorization code is required",
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		if (!body.redirectUri) {
			return new Response(JSON.stringify({
				httpStatus: "BAD_REQUEST",
				message: "Redirect URI is required",
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		const authService = new AuthenticationServices(env);
		const result = await authService.handleGoogleOAuthMobile(body.code, body.redirectUri);

		if (!result) {
			console.error('❌ Mobile Google OAuth failed');
			return new Response(JSON.stringify({
				httpStatus: "UNAUTHORIZED",
				message: "OAuth authentication failed",
				data: null
			}), {
				status: 401,
				headers: corsHeaders
			});
		}

		// ✅ FIXED: result.user is already enriched by the service
		const response = {
			httpStatus: "OK",
			message: "Login successful",
			data: {
				id: result.user.id,
				email: result.user.email,
				firstName: result.user.first_name || "",
				lastName: result.user.last_name || "",
				displayName: result.user.display_name || "",
				avatarUrl: result.user.avatar_url || "",
				role: result.user.user_role || "user",
				teamId: result.user.team_id || null,
				teamRole: result.user.team_role || null,
				token: result.token
			}
		};

		console.log('✅ Mobile Google OAuth login successful for:', result.user.email);
		console.log('👥 Team:', result.user.team_id, '| Role:', result.user.team_role);

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});

	} catch (error) {
		console.error('❌ Mobile Google OAuth error:', error);
		return new Response(JSON.stringify({
			httpStatus: "INTERNAL_SERVER_ERROR",
			message: error instanceof Error ? error.message : "OAuth authentication failed",
			data: null
		}), {
			status: 500,
			headers: corsHeaders
		});
	}
}

export async function handleMobileGithubAuth(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const body = await request.json() as {
			code: string;
			redirectUri: string;
		};

		if (!body.code) {
			return new Response(JSON.stringify({
				httpStatus: "BAD_REQUEST",
				message: "Authorization code is required",
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		if (!body.redirectUri) {
			return new Response(JSON.stringify({
				httpStatus: "BAD_REQUEST",
				message: "Redirect URI is required",
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		const authService = new AuthenticationServices(env);
		const result = await authService.handleGithubOAuthMobile(body.code, body.redirectUri);

		if (!result) {
			console.error('❌ Mobile GitHub OAuth failed');
			return new Response(JSON.stringify({
				httpStatus: "UNAUTHORIZED",
				message: "OAuth authentication failed",
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		// ✅ FIXED: result.user is already enriched by the service
		const response = {
			httpStatus: "OK",
			message: "Login successful",
			data: {
				id: result.user.id,
				email: result.user.email,
				firstName: result.user.first_name || "",
				lastName: result.user.last_name || "",
				displayName: result.user.display_name || "",
				avatarUrl: result.user.avatar_url || "",
				role: result.user.user_role || "user",
				teamId: result.user.team_id || null,
				teamRole: result.user.team_role || null,
				token: result.token
			}
		};

		console.log('✅ Mobile GitHub OAuth login successful for:', result.user.email);
		console.log('👥 Team:', result.user.team_id, '| Role:', result.user.team_role);

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});

	} catch (error) {
		console.error('❌ Mobile GitHub OAuth error:', error);
		return new Response(JSON.stringify({
			httpStatus: "INTERNAL_SERVER_ERROR",
			message: error instanceof Error ? error.message : "OAuth authentication failed",
			data: null
		}), {
			status: 500,
			headers: corsHeaders
		});
	}
}

export async function handleLogout(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	return new Response(JSON.stringify({
		httpStatus: "OK",
		message: "Logged out successfully",
		data: null
	}), {
		status: 200,
		headers: corsHeaders
	});
}
