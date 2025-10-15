
import { Env } from './types';
import { Router } from './router';
import {handleCronReminders} from "./handlers/cron.handler";

export default {
	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
		ctx.waitUntil(handleCronReminders(env));
	},
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const router = new Router(env);
		return router.handleRequest(request, ctx);
	}
};
