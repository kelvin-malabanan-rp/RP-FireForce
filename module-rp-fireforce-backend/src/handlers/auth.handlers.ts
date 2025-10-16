// handlers/auth.handler.ts
import { ApiResponse, Env, LoginRequest, LoginResponse } from '../types';
import { AuthenticationServices } from "../services/authentication.services";

export async function handleLogin(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		// Parse request body
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

		// Validate request body
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

		// Validate email format
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

		// Restrict to @rocketpartners.io domain
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

		// Initialize auth service
		const authService = new AuthenticationServices(env);

		// Validate credentials
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

		// Generate JWT token
		const token = await authService.generateJWT(user);

		// Prepare login response with team info
		const loginResponse: LoginResponse = {
			id: user.id,
			email: user.email,
			password: "",
			firstName: user.firstName || "",
			lastName: user.lastName || "",
			teamId: user.teamId || null,
			teamRole: user.teamRole || null,
			token: token
		};

		const response: ApiResponse<LoginResponse> = {
			httpStatus: "OK",
			message: "Login successful",
			data: loginResponse
		};

		console.log(`Successful login: ${user.email} — Team: ${user.teamId}, Team Role: ${user.teamRole}`);

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

export async function handleGoogleCallback(
	request: Request,
	env: Env
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const code = url.searchParams.get("code");
		const error = url.searchParams.get("error");

		// Determine frontend URL based on environment
		const frontendUrl = env.FRONTEND_URL || 'http://localhost:5173';

		if (error) {
			return Response.redirect(
				`${frontendUrl}/auth/error?error=${encodeURIComponent(error)}`
			);
		}

		if (!code) {
			return Response.redirect(
				`${frontendUrl}/auth/error?error=no_code`
			);
		}

		const authService = new AuthenticationServices(env);
		const result = await authService.handleGoogleOAuth(code);

		if (!result) {
			return Response.redirect(
				`${frontendUrl}/auth/error?error=authentication_failed`
			);
		}

		// Redirect to web success page with token in URL fragment (more secure)
		const params = new URLSearchParams({
			token: result.token,
			userId: result.user.id,
			email: result.user.email,
			displayName: result.user.display_name || result.user.email || "",
			avatarUrl: result.user.avatar_url || "",
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

		// Determine frontend URL based on environment
		const frontendUrl = env.FRONTEND_URL || 'http://localhost:5173';

		if (error) {
			return Response.redirect(
				`${frontendUrl}/auth/error?error=${encodeURIComponent(error)}`
			);
		}

		if (!code) {
			return Response.redirect(
				`${frontendUrl}/auth/error?error=no_code`
			);
		}

		const authService = new AuthenticationServices(env);
		const result = await authService.handleGithubOAuth(code);

		if (!result) {
			return Response.redirect(
				`${frontendUrl}/auth/error?error=authentication_failed`
			);
		}

		// Redirect to web success page with token in URL fragment
		const params = new URLSearchParams({
			token: result.token,
			userId: result.user.id,
			email: result.user.email,
			displayName: result.user.display_name || result.user.email || "",
			avatarUrl: result.user.avatar_url || "",
		}).toString();

		return Response.redirect(`${frontendUrl}/auth/success#${params}`);
	} catch (error) {
		console.error("GitHub OAuth error:", error);
		return Response.redirect(
			`${frontendUrl}/auth/error?error=server_error`
		);
	}
}


export async function handleLogout(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	// Simple logout for now - just return success
	return new Response(JSON.stringify({
		httpStatus: "OK",
		message: "Logged out successfully",
		data: null
	}), {
		status: 200,
		headers: corsHeaders
	});
}
