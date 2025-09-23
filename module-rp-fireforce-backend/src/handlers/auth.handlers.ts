// // handlers/auth.handler.ts
// import {Env, LoginRequest, LoginResponse} from '../types';
// import {AuthenticationServices} from "../services/authentication.services";
//
// export async function handleLogin(
// 	request: Request,
// 	env: Env,
// 	corsHeaders: Record<string, string>
// ): Promise<Response> {
// 	try {
// 		// Parse request body
// 		let body: LoginRequest;
// 		try {
// 			body = await request.json() as LoginRequest;
// 		} catch (error) {
// 			return new Response(JSON.stringify({
// 				success: false,
// 				error: 'Invalid request body'
// 			}), {
// 				status: 400,
// 				headers: corsHeaders
// 			});
// 		}
//
// 		// Validate request body
// 		if (!body.email || !body.password) {
// 			return new Response(JSON.stringify({
// 				success: false,
// 				error: 'Email and password are required'
// 			}), {
// 				status: 400,
// 				headers: corsHeaders
// 			});
// 		}
//
// 		// Validate email format
// 		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// 		if (!emailRegex.test(body.email)) {
// 			return new Response(JSON.stringify({
// 				success: false,
// 				error: 'Invalid email format'
// 			}), {
// 				status: 400,
// 				headers: corsHeaders
// 			});
// 		}
//
// 		// Check if email is from @rocketpartners.io domain
// 		if (!body.email.endsWith('@rocketpartners.io')) {
// 			return new Response(JSON.stringify({
// 				success: false,
// 				error: 'Access restricted to @rocketpartners.io email addresses'
// 			}), {
// 				status: 403,
// 				headers: corsHeaders
// 			});
// 		}
//
// 		// Initialize auth service
// 		const authService = new AuthenticationServices(env);
//
// 		// Validate credentials
// 		const user = await authService.validateCredentials(body.email, body.password);
//
// 		if (!user) {
// 			// Log failed attempt for security monitoring
// 			console.log('Failed login attempt for email:', body.email);
//
// 			return new Response(JSON.stringify({
// 				success: false,
// 				error: 'Invalid email or password'
// 			}), {
// 				status: 401,
// 				headers: corsHeaders
// 			});
// 		}
//
// 		// Generate tokens
// 		const token = await authService.generateJWT(user);
//
// 		// Prepare response
// 		// @ts-ignore
// 		const response: LoginResponse = {
// 			id: user.id,
// 			email: user.email,
// 			password: "",
// 			firstName: user.firstName,
// 			lastName: user.lastName,
// 			token
// 		};
//
// 		// Log successful login
// 		console.log(`Successful login: ${user.email} (${user.role})`);
//
// 		return new Response(JSON.stringify(response), {
// 			status: 200,
// 			headers: corsHeaders
// 		});
//
// 	} catch (error) {
// 		console.error('Login error:', error);
// 		return new Response(JSON.stringify({
// 			success: false,
// 			error: 'An error occurred during login. Please try again.'
// 		}), {
// 			status: 500,
// 			headers: corsHeaders
// 		});
// 	}
// }
//
// export async function handleLogout(
// 	request: Request,
// 	env: Env,
// 	corsHeaders: Record<string, string>
// ): Promise<Response> {
// 	try {
// 		// Get authorization header
// 		const authHeader = request.headers.get('Authorization');
//
// 		if (!authHeader || !authHeader.startsWith('Bearer ')) {
// 			return new Response(JSON.stringify({
// 				success: false,
// 				error: 'Authorization header required'
// 			}), {
// 				status: 401,
// 				headers: corsHeaders
// 			});
// 		}
//
// 		const token = authHeader.substring(7);
// 		const authService = new AuthenticationServices(env);
//
// 		// Verify token
//
// 		if (!payload) {
// 			return new Response(JSON.stringify({
// 				success: false,
// 				error: 'Invalid token'
// 			}), {
// 				status: 401,
// 				headers: corsHeaders
// 			});
// 		}
//
// 		// Invalidate refresh tokens for this user
// 		const dbService = new (await import('../services/database.service')).DatabaseService(env);
//
// 		return new Response(JSON.stringify({
// 			success: true,
// 			message: 'Logged out successfully'
// 		}), {
// 			status: 200,
// 			headers: corsHeaders
// 		});
//
// 	} catch (error) {
// 		console.error('Logout error:', error);
// 		return new Response(JSON.stringify({
// 			success: false,
// 			error: 'Failed to logout'
// 		}), {
// 			status: 500,
// 			headers: corsHeaders
// 		});
// 	}
// }
