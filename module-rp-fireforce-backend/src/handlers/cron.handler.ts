// handlers/cron.handler.ts
import { Env } from '../types';
import { ReminderService } from '../services/reminder.service';

export async function handleCronReminders(env: Env): Promise<void> {
	try {
		console.log('[cron] ⏰ Processing due reminders at:', new Date().toISOString());

		const reminderService = new ReminderService(env);
		await reminderService.processDueReminders();

		console.log('[cron] ✅ Reminder processing complete');
	} catch (error) {
		console.error('[cron] ❌ Error processing reminders:', error);
	}
}
