import {DatabaseService} from "../services/database.service";
import {UserServices} from "../services/user-services";
import {ApiResponse, ChangePasswordRequest, Env, UpdateProfileRequest} from '../types';
import {AuthenticationServices} from "../services/authentication.services";

export async function handleGetAllUsers(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const activeOnly = url.searchParams.get('active') === 'true';

		// Initialize services with shared database connection
		const dbService = new DatabaseService(env);
		const userService = new UserServices(env, dbService);

		// Get users from database
		const users = await userService.getAllUsers(activeOnly);

		const response: ApiResponse<typeof users> = {
			httpStatus: "OK",
			message: `Retrieved ${users.length} users successfully`,
			data: users
		};

		console.log(`Retrieved ${users.length} users${activeOnly ? ' (active only)' : ''}`);

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});

	} catch (error) {
		console.error('Error fetching users:', error);
		return new Response(JSON.stringify({
			httpStatus: "INTERNAL_SERVER_ERROR",
			message: "An error occurred while fetching users",
			data: null
		}), {
			status: 500,
			headers: corsHeaders
		});
	}
}

export async function handleGetUserById(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const userId = url.searchParams.get('userId');

		if (!userId) {
			return new Response(JSON.stringify({
				httpStatus: "BAD_REQUEST",
				message: "userId is required",
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		// Initialize services with shared database connection
		const dbService = new DatabaseService(env);
		const userService = new UserServices(env, dbService);

		// Get user from database
		const user = await userService.getUserById(userId);

		if (!user) {
			return new Response(JSON.stringify({
				httpStatus: "NOT_FOUND",
				message: "User not found",
				data: null
			}), {
				status: 404,
				headers: corsHeaders
			});
		}

		const response: ApiResponse<typeof user> = {
			httpStatus: "OK",
			message: `Retrieved user successfully`,
			data: user
		};

		console.log(`Retrieved user: ${user.email}`);

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});

	} catch (error) {
		console.error('Error fetching user:', error);
		return new Response(JSON.stringify({
			httpStatus: "INTERNAL_SERVER_ERROR",
			message: "An error occurred while fetching user",
			data: null
		}), {
			status: 500,
			headers: corsHeaders
		});
	}
}

/**
 * Helper function to create error response
 */
function createErrorResponse(
	status: number,
	httpStatus: string,
	message: string,
	corsHeaders: Record<string, string>,
	error?: any
): Response {
	console.error(`Error [${httpStatus}]:`, message, error || '');

	return new Response(JSON.stringify({
		success: false,
		httpStatus,
		message,
		data: null
	}), {
		status,
		headers: corsHeaders
	});
}

/**
 * Helper to verify authentication
 */
async function verifyAuthentication(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<{ userId: string; email: string } | Response> {
	const authHeader = request.headers.get('Authorization');

	if (!authHeader) {
		return createErrorResponse(
			401,
			"UNAUTHORIZED",
			"No authorization header provided",
			corsHeaders
		);
	}

	const authService = new AuthenticationServices(env);
	const authResult = await authService.verifyAuthHeader(authHeader);

	if (!authResult) {
		return createErrorResponse(
			401,
			"UNAUTHORIZED",
			"Invalid or expired token",
			corsHeaders
		);
	}

	return authResult;
}

/**
 * GET /api/users/profile
 * Get current user's profile
 */
export async function handleGetUserProfile(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		console.log('📥 GET /api/users/profile');

		// Verify authentication
		const authResult = await verifyAuthentication(request, env, corsHeaders);
		if (authResult instanceof Response) {
			return authResult; // Return error response
		}

		const { userId } = authResult;

		const dbService = new DatabaseService(env);
		const userService = new UserServices(env, dbService);

		const user = await userService.getUserProfile(userId);

		if (!user) {
			return createErrorResponse(
				404,
				"NOT_FOUND",
				"User not found or inactive",
				corsHeaders
			);
		}

		const response: ApiResponse<typeof user> = {
			httpStatus: "OK",
			message: "Profile retrieved successfully",
			data: user
		};

		console.log(`✅ Profile retrieved for: ${user.email}`);

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});

	} catch (error: any) {
		return createErrorResponse(
			500,
			"INTERNAL_SERVER_ERROR",
			"Failed to fetch user profile",
			corsHeaders,
			error
		);
	}
}

/**
 * PUT /api/users/profile
 * Update current user's profile
 */
export async function handleUpdateUserProfile(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		console.log('📝 PUT /api/users/profile');

		// Verify authentication
		const authResult = await verifyAuthentication(request, env, corsHeaders);
		if (authResult instanceof Response) {
			return authResult; // Return error response
		}

		const { userId } = authResult;

		// Parse request body
		let body: UpdateProfileRequest;
		try {
			body = await request.json();
		} catch (parseError) {
			return createErrorResponse(
				400,
				"BAD_REQUEST",
				"Invalid JSON in request body",
				corsHeaders,
				parseError
			);
		}

		const { firstName, lastName, phoneNumber, displayName } = body;

		// Validate at least one field is provided
		if (!firstName && !lastName && !phoneNumber && !displayName) {
			return createErrorResponse(
				400,
				"BAD_REQUEST",
				"At least one field must be provided for update",
				corsHeaders
			);
		}

		// Validate phone number format if provided
		if (phoneNumber && phoneNumber.trim() !== '') {
			const phoneRegex = /^[\d\s\-\+\(\)]+$/;
			if (!phoneRegex.test(phoneNumber)) {
				return createErrorResponse(
					400,
					"BAD_REQUEST",
					"Invalid phone number format",
					corsHeaders
				);
			}
		}

		const dbService = new DatabaseService(env);
		const userService = new UserServices(env, dbService);

		const updatedUser = await userService.updateUserProfile(userId, {
			firstName: firstName?.trim(),
			lastName: lastName?.trim(),
			phoneNumber: phoneNumber?.trim(),
			displayName: displayName?.trim()
		});

		if (!updatedUser) {
			return createErrorResponse(
				404,
				"NOT_FOUND",
				"User not found or update failed",
				corsHeaders
			);
		}

		const response: ApiResponse<typeof updatedUser> = {
			httpStatus: "OK",
			message: "Profile updated successfully",
			data: updatedUser
		};

		console.log(`✅ Profile updated for user: ${userId}`);

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});

	} catch (error: any) {
		return createErrorResponse(
			500,
			"INTERNAL_SERVER_ERROR",
			"Failed to update user profile",
			corsHeaders,
			error
		);
	}
}

/**
 * PUT /api/users/password
 * Change user password
 */
export async function handleChangePassword(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		console.log('🔐 PUT /api/users/password');

		// Verify authentication
		const authResult = await verifyAuthentication(request, env, corsHeaders);
		if (authResult instanceof Response) {
			return authResult; // Return error response
		}

		const { userId } = authResult;

		// Parse request body
		let body: ChangePasswordRequest;
		try {
			body = await request.json();
		} catch (parseError) {
			return createErrorResponse(
				400,
				"BAD_REQUEST",
				"Invalid JSON in request body",
				corsHeaders,
				parseError
			);
		}

		const { currentPassword, newPassword } = body;

		// Validate required fields
		if (!currentPassword || !newPassword) {
			return createErrorResponse(
				400,
				"BAD_REQUEST",
				"Current password and new password are required",
				corsHeaders
			);
		}

		// Validate password strength
		if (newPassword.length < 8) {
			return createErrorResponse(
				400,
				"BAD_REQUEST",
				"New password must be at least 8 characters long",
				corsHeaders
			);
		}

		// Check if new password is different from current
		if (currentPassword === newPassword) {
			return createErrorResponse(
				400,
				"BAD_REQUEST",
				"New password must be different from current password",
				corsHeaders
			);
		}

		const dbService = new DatabaseService(env);
		const userService = new UserServices(env, dbService);

		const result = await userService.changePassword(
			userId,
			currentPassword,
			newPassword
		);

		if (!result.success) {
			let status = 400;
			let httpStatus = "BAD_REQUEST";

			if (result.message === 'Current password is incorrect') {
				status = 401;
				httpStatus = "UNAUTHORIZED";
			} else if (result.message === 'Cannot change password for OAuth users') {
				status = 403;
				httpStatus = "FORBIDDEN";
			} else if (result.message === 'User not found') {
				status = 404;
				httpStatus = "NOT_FOUND";
			}

			return createErrorResponse(
				status,
				httpStatus,
				result.message,
				corsHeaders
			);
		}

		const response: ApiResponse<null> = {
			httpStatus: "OK",
			message: result.message,
			data: null
		};

		console.log(`✅ Password changed successfully for user: ${userId}`);

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});

	} catch (error: any) {
		return createErrorResponse(
			500,
			"INTERNAL_SERVER_ERROR",
			"Failed to change password",
			corsHeaders,
			error
		);
	}
}

/**
 * POST /api/users/avatar
 * Upload user avatar
 */
export async function handleUploadAvatar(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		console.log('📸 POST /api/users/avatar');

		// Verify authentication
		const authResult = await verifyAuthentication(request, env, corsHeaders);
		if (authResult instanceof Response) {
			return authResult; // Return error response
		}

		const { userId } = authResult;

		// TODO: Implement actual file upload to R2 or Cloudflare Images
		const contentType = request.headers.get('content-type') || '';

		if (!contentType.includes('multipart/form-data') &&
			!contentType.includes('application/json')) {
			return createErrorResponse(
				400,
				"BAD_REQUEST",
				"Content-Type must be multipart/form-data or application/json",
				corsHeaders
			);
		}

		const dbService = new DatabaseService(env);
		const userService = new UserServices(env, dbService);

		// Generate placeholder avatar URL
		const avatarUrl = `https://ui-avatars.com/api/?name=${userId}&size=200&background=random`;

		const result = await userService.updateAvatar(userId, avatarUrl);

		if (!result) {
			return createErrorResponse(
				404,
				"NOT_FOUND",
				"User not found or avatar update failed",
				corsHeaders
			);
		}

		const response: ApiResponse<typeof result> = {
			httpStatus: "OK",
			message: "Avatar uploaded successfully",
			data: result
		};

		console.log(`✅ Avatar updated for user: ${userId}`);

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});

	} catch (error: any) {
		return createErrorResponse(
			500,
			"INTERNAL_SERVER_ERROR",
			"Failed to upload avatar",
			corsHeaders,
			error
		);
	}
}
