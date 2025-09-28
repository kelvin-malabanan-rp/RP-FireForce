
import { Env } from './types';
import { Router } from './router';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const router = new Router(env);
		return router.handleRequest(request, ctx);
	}
};
