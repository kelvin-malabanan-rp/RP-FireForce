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
		const code = url.searchParams.get('code');
		const error = url.searchParams.get('error');

		if (error) {
			return Response.redirect(
				`rpfireforcepager://auth/callback?error=${encodeURIComponent(error)}`
			);
		}

		if (!code) {
			return Response.redirect(
				'rpfireforcepager://auth/callback?error=no_code'
			);
		}

		// Initialize auth service
		const authService = new AuthenticationServices(env);

		// Exchange code for user info and create/find user
		const result = await authService.handleGoogleOAuth(code);

		if (!result) {
			return Response.redirect(
				'rpfireforcepager://auth/callback?error=authentication_failed'
			);
		}

		// Return HTML page that redirects to app
		return new Response(`
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>Authentication Successful</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 100vh;
			margin: 0;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			text-align: center;
			padding: 20px;
		}
		.container {
			max-width: 400px;
		}
		h1 { font-size: 24px; margin-bottom: 16px; }
		p { font-size: 16px; opacity: 0.9; }
	</style>
</head>
<body>
	<div class="container">
		<h1>✓ Authentication Successful</h1>
		<p>Redirecting back to RP FireForce...</p>
	</div>
	<script>
		const params = {
			token: '${result.token}',
			userId: '${result.user.id}',
			email: '${result.user.email}',
			displayName: '${result.user.display_name || result.user.email || ''}',
			avatarUrl: '${result.user.avatar_url || ''}'
		};
		const paramString = new URLSearchParams(params).toString();
		window.location.href = 'rpfireforcepager://auth/callback?' + paramString;

		setTimeout(() => {
			document.body.innerHTML = \`
				<div class="container">
					<h1>Authentication Complete!</h1>
					<p>Please return to the RP FireForce app.</p>
					<p style="margin-top: 20px; font-size: 14px;">If the app didn't open automatically, please close this window and reopen RP FireForce.</p>
				</div>
			\`;
		}, 2000);
	</script>
</body>
</html>
		`, {
			headers: {
				'Content-Type': 'text/html'
			}
		});

	} catch (error) {
		console.error('Google OAuth error:', error);
		return Response.redirect(
			`rpfireforcepager://auth/callback?error=${encodeURIComponent('server_error')}`
		);
	}
}

export async function handleGithubCallback(
	request: Request,
	env: Env
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const code = url.searchParams.get('code');
		const error = url.searchParams.get('error');

		if (error) {
			return Response.redirect(
				`rpfireforcepager://auth/callback?error=${encodeURIComponent(error)}`
			);
		}

		if (!code) {
			return Response.redirect(
				'rpfireforcepager://auth/callback?error=no_code'
			);
		}

		// Initialize auth service
		const authService = new AuthenticationServices(env);

		// Exchange code for user info and create/find user
		const result = await authService.handleGithubOAuth(code);

		if (!result) {
			return Response.redirect(
				'rpfireforcepager://auth/callback?error=authentication_failed'
			);
		}

		// Return HTML page that redirects to app
		return new Response(`
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>Authentication Successful</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 100vh;
			margin: 0;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			text-align: center;
			padding: 20px;
		}
		.container {
			max-width: 400px;
		}
		h1 { font-size: 24px; margin-bottom: 16px; }
		p { font-size: 16px; opacity: 0.9; }
	</style>
</head>
<body>
	<div class="container">
		<h1>✓ Authentication Successful</h1>
		<p>Redirecting back to RP FireForce...</p>
	</div>
	<script>
		const params = {
			token: '${result.token}',
			userId: '${result.user.id}',
			email: '${result.user.email}',
			displayName: '${result.user.display_name || result.user.email || ''}',
			avatarUrl: '${result.user.avatar_url || ''}'
		};
		const paramString = new URLSearchParams(params).toString();
		window.location.href = 'rpfireforcepager://auth/callback?' + paramString;

		setTimeout(() => {
			document.body.innerHTML = \`
				<div class="container">
					<h1>Authentication Complete!</h1>
					<p>Please return to the RP FireForce app.</p>
					<p style="margin-top: 20px; font-size: 14px;">If the app didn't open automatically, please close this window and reopen RP FireForce.</p>
				</div>
			\`;
		}, 2000);
	</script>
</body>
</html>
		`, {
			headers: {
				'Content-Type': 'text/html'
			}
		});

	} catch (error) {
		console.error('GitHub OAuth error:', error);
		return Response.redirect(
			`rpfireforcepager://auth/callback?error=${encodeURIComponent('server_error')}`
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
