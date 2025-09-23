// handlers/health.handler.ts
// @ts-ignore
export async function handleHealth(corsHeaders: Record<string, string>): Promise<Response> {
	const response = {
		status: 'healthy',
		timestamp: new Date().toISOString(),
		environment: 'cloudflare-workers'
	};

	return new Response(JSON.stringify(response), {
		status: 200,
		headers: corsHeaders
	});
}
