import {IncidentService} from "../services/incident.services";
import {ApiResponse, Env, IncidentCommentResponse} from "../types";

export async function handleFetchIncidentComment(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const incidentId = url.searchParams.get('incidentId');

		if (!incidentId) {
			const errorResponse: ApiResponse<null> = {
				httpStatus: "ERROR",
				message: "incidentId query parameter is required",
				data: null
			};
			return new Response(JSON.stringify(errorResponse), {
				status: 400,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json'
				}
			});
		}

		const incidentService = new IncidentService(env);
		const comments = await incidentService.fetchIncidentComments(incidentId);

		const successResponse: ApiResponse<IncidentCommentResponse[]> = {
			httpStatus: "OK",
			message: "Comments retrieved successfully",
			data: comments
		};

		return new Response(JSON.stringify(successResponse), {
			status: 200,
			headers: {
				...corsHeaders,
				'Content-Type': 'application/json'
			}
		});

	} catch (err) {
		console.error("Error fetching incident comment:", err);

		if (err instanceof Error && err.message.includes('Failed to retrieve')) {
			const notFoundResponse: ApiResponse<null> = {
				httpStatus: "ERROR",
				message: "Incident comment not found",
				data: null
			};
			return new Response(JSON.stringify(notFoundResponse), {
				status: 404,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json'
				}
			});
		}

		if (err instanceof Error && err.message.includes('Database connection')) {
			const errorResponse: ApiResponse<null> = {
				httpStatus: "ERROR",
				message: 'Database service unavailable',
				data: null
			};
			return new Response(JSON.stringify(errorResponse), {
				status: 503,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json'
				}
			});
		}

		const errorResponse: ApiResponse<null> = {
			httpStatus: "ERROR",
			message: "Failed to retrieve comment",
			data: null
		};

		return new Response(JSON.stringify(errorResponse), {
			status: 500,
			headers: {
				...corsHeaders,
				'Content-Type': 'application/json'
			}
		});
	}
}
