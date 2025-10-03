import {DatabaseService} from "../services/database.service";
import {UserServices} from "../services/user-services";
import {ApiResponse, Env} from '../types';

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
