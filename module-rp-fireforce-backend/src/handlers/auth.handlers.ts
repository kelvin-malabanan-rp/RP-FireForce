// handlers/auth.handler.ts
import {ApiResponse, Env, LoginRequest, LoginResponse} from '../types';
import {AuthenticationServices} from "../services/authentication.services";

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

		// Check if email is from @rocketpartners.io domain
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
			// Log failed attempt for security monitoring
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

		// Prepare login response data
		const loginResponse: LoginResponse = {
			id: user.id,
			email: user.email,
			password: "",  // Never return the actual password
			firstName: user.firstName || "",
			lastName: user.lastName || "",
			token: ""  // Empty token for now since JWT is removed
		};

		// Wrap in ApiResponse structure
		const response: ApiResponse<LoginResponse> = {
			httpStatus: "OK",
			message: "Login successful",
			data: loginResponse
		};

		// Log successful login
		console.log(`Successful login: ${user.email} (${user.role})`);

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
