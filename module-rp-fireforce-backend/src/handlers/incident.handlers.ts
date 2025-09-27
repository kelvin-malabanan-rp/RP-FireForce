// handlers/incident.handler.ts
import {ApiResponse, CreateIncidentTypes, Env, Incident, IncidentFilters, IncidentStats} from '../types';
import {IncidentService} from "../services/incident.services";

export async function handleGetIncidents(
	url: URL,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	const params: IncidentFilters = {
		timeframe: (url.searchParams.get('timeframe') as '24h' | '7d' | '30d' | 'all') || 'all',
		status: url.searchParams.get('status') || undefined,
		severity: url.searchParams.get('severity') || undefined
	};

	try {
		const incidentService = new IncidentService(env);
		const incidents = await incidentService.getIncidents(params);

		const response: ApiResponse<Incident[]> = {
			httpStatus: "OK",
			message: "Successfully retrieved incidents",
			data: incidents
		};

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: {
				...corsHeaders,
				'Content-Type': 'application/json'
			}
		});
	} catch (error) {
		console.error('Error fetching incidents:', error);

		// Make error response consistent with ApiResponse structure
		const errorResponse: ApiResponse<null> = {
			httpStatus: "ERROR",
			message: "Failed to fetch incidents",
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

export async function handleGetStats(
	url: URL,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	const timeframe = (url.searchParams.get('timeframe') as '24h' | '7d' | '30d' | 'all') || 'all';

	try {
		const incidentService = new IncidentService(env);
		const stats = await incidentService.getStats(timeframe);
		const response: ApiResponse<IncidentStats> = {
			httpStatus: "OK",
			message: "Successfully retrieved incidents",
			data: stats
		};

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});
	} catch (error) {
		console.error('Error fetching incident stats:', error);
		return new Response(JSON.stringify({ error: 'Failed to fetch incident stats' }), {
			status: 500,
			headers: corsHeaders
		});
	}
}

export async function handleTestIncident(
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const incidentService = new IncidentService(env);
		const testAlarm = incidentService.createTestAlarm();
		const result = await incidentService.processCloudWatchAlarm(testAlarm);

		return new Response(JSON.stringify({
			message: 'Test incident created',
			result
		}), {
			status: 200,
			headers: corsHeaders
		});
	} catch (error) {
		console.error('Error creating test incident:', error);
		return new Response(JSON.stringify({ error: 'Failed to create test incident' }), {
			status: 500,
			headers: corsHeaders
		});
	}
}

export async function handleCreateIncident(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		// Validate request method
		if (request.method !== 'POST') {
			const errorResponse: ApiResponse<null> = {
				httpStatus: "ERROR",
				message: 'Method not allowed. Use POST.',
				data: null
			};
			return new Response(JSON.stringify(errorResponse), {
				status: 405,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json'
				}
			});
		}

		// Parse request body
		let requestData: Record<string, any>;
		try {
			requestData = await request.json();
		} catch (error) {
			const errorResponse: ApiResponse<null> = {
				httpStatus: "ERROR",
				message: 'Invalid JSON in request body',
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

		// Validate required fields
		const { title, description, location, reportedBy, severity } = requestData;


		// Construct incident data with proper types
		const incidentData: CreateIncidentTypes = {
			title: title.trim(),
			description: description.trim(),
			location: location || null,
			reportedBy: reportedBy.trim(),
			severity: severity || 'medium'
		};

		// Create incident using the service
		const incidentService = new IncidentService(env);
		const result = await incidentService.createIncident(incidentData);

		// Wrap in ApiResponse structure
		const response: ApiResponse<{
			id: string;
			title: string;
			description: string;
			location: string | null;
			reportedBy: string;
			severity: string;
			status: string;
			timestamp: string;
			changes: number;
		}> = {
			httpStatus: "OK",
			message: "Incident created successfully",
			data: {
				id: result.id,
				...incidentData,
				status: 'open',
				timestamp: new Date().toISOString(),
				changes: result.changes
			}
		};

		return new Response(JSON.stringify(response), {
			status: 201,
			headers: {
				...corsHeaders,
				'Content-Type': 'application/json'
			}
		});

	} catch (error) {
		console.error('Error creating incident:', error);

		// Handle specific error types with consistent ApiResponse structure
		if (error instanceof Error) {
			// User validation errors
			if (error.message.includes('Invalid user')) {
				const errorResponse: ApiResponse<null> = {
					httpStatus: "ERROR",
					message: error.message,
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

			// Database connection errors
			if (error.message.includes('Database connection')) {
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
		}

		// Generic error response with ApiResponse structure
		const errorResponse: ApiResponse<null> = {
			httpStatus: "ERROR",
			message: 'Failed to create incident',
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

export async function handleIncidentResponse(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const { incidentId, action, userId } = (await request.json()) as {
			incidentId: string;
			action: "acknowledge" | "decline";
			userId?: string;
		};

		if (!incidentId || !action) {
			return new Response(
				JSON.stringify({ error: "incidentId and action are required" }),
				{ status: 400, headers: corsHeaders }
			);
		}

		const incidentService = new IncidentService(env);
		const result = await incidentService.respondToIncident(
			incidentId,
			action,
			userId
		);

		return new Response(
			JSON.stringify({
				message: "Incident response recorded",
				object: result,
			}),
			{ status: 200, headers: corsHeaders }
		);
	} catch (err) {
		console.error("Error handling incident response:", err);
		return new Response(
			JSON.stringify({ error: "Failed to record incident response" }),
			{ status: 500, headers: corsHeaders }
		);
	}
}
