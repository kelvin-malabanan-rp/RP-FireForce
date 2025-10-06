# BACKEND FIX REQUIRED: Mobile Push Notifications Not Sent on Incident Creation

## Issue
When incidents are created from the **web app**, mobile devices are NOT receiving push notifications and phones are NOT ringing/alerting, even though:
- ✅ Push notification system exists in backend
- ✅ Users have registered their mobile devices
- ✅ Push tokens are stored in database
- ✅ Email notifications ARE working
- ❌ Push notifications are NOT being triggered

## Root Cause
The backend's `notifySpecificUsers()` and `notifyCurrentOnCall()` methods in `incident.services.ts` are **only sending emails**, they are **NOT calling the Push Notification Service**.

## Files to Modify
- `module-rp-fireforce-backend/src/services/incident.services.ts`

## Required Changes

### Change 1: Fix `notifySpecificUsers` Method

**Location:** Line ~198-215

**Current Code (BROKEN):**
```typescript
private async notifySpecificUsers(incidentId: string, userIds: string[]): Promise<void> {
    const incident = await this.dbService.getIncidentBy(incidentId);
    const emailService = new EmailService(this.env);

    for (const userId of userIds) {
        const user = await this.dbService.getUserById(userId);
        if (user) {
            try {
                await emailService.sendIncidentAlert(incident, user.email);
                await this.trackNotification(incidentId, userId, 'initial');
            } catch (error) {
                console.error(`Failed to notify user ${userId}:`, error);
            }
        }
    }
}
```

**Fixed Code (ADD PUSH NOTIFICATIONS):**
```typescript
private async notifySpecificUsers(incidentId: string, userIds: string[]): Promise<void> {
    const incident = await this.dbService.getIncidentBy(incidentId);
    if (!incident) {
        console.error(`[notifySpecificUsers] Incident ${incidentId} not found`);
        return;
    }

    const emailService = new EmailService(this.env);

    // ✅ ADD THIS: Send push notifications to ALL registered mobile devices
    try {
        console.log(`[notifySpecificUsers] Sending push notifications for incident ${incidentId}`);
        await this.pushService.sendIncidentAlert(incident);
        console.log(`[notifySpecificUsers] Push notifications sent successfully`);
    } catch (error) {
        console.error(`[notifySpecificUsers] Failed to send push notifications:`, error);
    }

    // Also send emails to specific users
    for (const userId of userIds) {
        const user = await this.dbService.getUserById(userId);
        if (user) {
            try {
                await emailService.sendIncidentAlert(incident, user.email);
                await this.trackNotification(incidentId, userId, 'initial');
            } catch (error) {
                console.error(`Failed to notify user ${userId}:`, error);
            }
        }
    }
}
```

### Change 2: Fix `notifyCurrentOnCall` Method

**Location:** Line ~217-245

**Current Code (BROKEN):**
```typescript
private async notifyCurrentOnCall(incidentId: string): Promise<void> {
    const incident = await this.dbService.getIncidentBy(incidentId);
    const emailService = new EmailService(this.env);

    // Get all teams and their current on-call members
    const oncallService = new OnCallService(this.env);
    const teams = await oncallService.getOnCallTeams();

    for (const team of teams) {
        const currentOnCall = await oncallService.getCurrentOnCall(team.id);

        if (currentOnCall) {
            // Notify primary
            if (currentOnCall.primary) {
                try {
                    await emailService.sendIncidentAlert(incident, currentOnCall.primary.email);
                    await this.trackNotification(incidentId, currentOnCall.primary.id, 'initial');
                } catch (error) {
                    console.error(`Failed to notify primary:`, error);
                }
            }

            // Notify backup
            if (currentOnCall.backup) {
                try {
                    await emailService.sendIncidentAlert(incident, currentOnCall.backup.email);
                    await this.trackNotification(incidentId, currentOnCall.backup.id, 'initial');
                } catch (error) {
                    console.error(`Failed to notify backup:`, error);
                }
            }
        }
    }
}
```

**Fixed Code (ADD PUSH NOTIFICATIONS):**
```typescript
private async notifyCurrentOnCall(incidentId: string): Promise<void> {
    const incident = await this.dbService.getIncidentBy(incidentId);
    if (!incident) {
        console.error(`[notifyCurrentOnCall] Incident ${incidentId} not found`);
        return;
    }

    const emailService = new EmailService(this.env);

    // ✅ ADD THIS: Send push notifications to ALL registered mobile devices
    try {
        console.log(`[notifyCurrentOnCall] Sending push notifications for incident ${incidentId}`);
        await this.pushService.sendIncidentAlert(incident);
        console.log(`[notifyCurrentOnCall] Push notifications sent successfully`);
    } catch (error) {
        console.error(`[notifyCurrentOnCall] Failed to send push notifications:`, error);
    }

    // Also send emails to current on-call team members
    const oncallService = new OnCallService(this.env);
    const teams = await oncallService.getOnCallTeams();

    for (const team of teams) {
        const currentOnCall = await oncallService.getCurrentOnCall(team.id);

        if (currentOnCall) {
            // Notify primary
            if (currentOnCall.primary) {
                try {
                    await emailService.sendIncidentAlert(incident, currentOnCall.primary.email);
                    await this.trackNotification(incidentId, currentOnCall.primary.id, 'initial');
                } catch (error) {
                    console.error(`Failed to notify primary:`, error);
                }
            }

            // Notify backup
            if (currentOnCall.backup) {
                try {
                    await emailService.sendIncidentAlert(incident, currentOnCall.backup.email);
                    await this.trackNotification(incidentId, currentOnCall.backup.id, 'initial');
                } catch (error) {
                    console.error(`Failed to notify backup:`, error);
                }
            }
        }
    }
}
```

## What These Changes Do

### 1. Add Push Notifications
- Calls `this.pushService.sendIncidentAlert(incident)` 
- Sends push notifications to ALL registered mobile devices
- Makes phones ring with alarm sounds
- Respects user settings (enable/disable, critical-only, sound, vibration)

### 2. Keep Email Notifications
- Still sends emails to specific users (manual selection)
- Still sends emails to on-call team (automatic rotation)
- Provides email record of incidents

### 3. Error Handling
- Adds null checks for incident
- Wraps push notification calls in try-catch
- Logs errors without breaking email notifications
- Adds console logs for debugging

## How Push Notifications Work

### Backend Flow
```
1. pushService.sendIncidentAlert(incident)
2. Query database for ALL registered push tokens
3. Filter by user settings (enableAlerts, criticalOnly)
4. For each token:
   - Send to Expo Push Service (ExponentPushToken[...])
   - OR send to FCM directly (Android tokens)
5. Expo/FCM delivers to mobile devices
6. Mobile app plays alarm sound based on severity
7. Device vibrates based on channel settings
```

### Mobile Device Requirements
For a device to receive push notifications:
- ✅ Mobile app installed
- ✅ Notifications enabled in app settings
- ✅ Push token registered via POST /api/push-token
- ✅ User settings enableAlerts = true
- ✅ Token stored in database push_tokens table

## Testing After Fix

### 1. Deploy Backend
```bash
cd module-rp-fireforce-backend
npx wrangler deploy
```

### 2. Verify Mobile Device Registered
Check if user has registered device:
```
GET {{baseUrl}}/api/push-tokens
```

Should return devices with:
- userId: "user-4", "user-11", etc.
- token: "ExponentPushToken[...]"
- fcmToken: Android FCM token
- settings.enableAlerts: true

### 3. Create Test Incident from Web
1. Go to web app → Incidents page
2. Click "Create Incident"
3. Fill in details:
   - Title: "Test Mobile Alert"
   - Description: "Testing push notifications"
   - Severity: "critical"
4. Select specific users (e.g., user-4, user-11)
5. Click "Create Incident"

### 4. Verify Results

**Mobile Device (IMMEDIATE):**
- ✅ Push notification appears
- ✅ Alarm sound plays
- ✅ Device vibrates
- ✅ Action buttons shown
- ✅ Tapping opens incident details

**Email (WITHIN MINUTES):**
- ✅ Email sent to selected users
- ✅ Email contains incident details

**Backend Logs (CHECK CLOUDFLARE):**
```
[notifySpecificUsers] Sending push notifications for incident incident-xxx
Sent incident alert to X/Y device(s)
[notifySpecificUsers] Push notifications sent successfully
```

## Why This Was Missing

The push notification system was fully implemented:
- ✅ PushNotificationService exists
- ✅ sendIncidentAlert() method works
- ✅ Mobile app configured correctly
- ✅ Users can register devices
- ✅ Expo/FCM integration working

But it was **never called** when incidents were created from the web app. The mobile app was ready to receive notifications, but the backend wasn't sending them.

## Comparison with AWS CloudWatch Integration

**AWS CloudWatch incidents (WORKING):**
```typescript
// In handleAlarm method - line ~113
await this.pushService.sendIncidentAlert({
    ...incident,
    id: result.id
} as Incident);
```
✅ Push notifications ARE sent for AWS alarms

**Web-created incidents (BROKEN):**
```typescript
// In notifySpecificUsers and notifyCurrentOnCall
// ❌ Missing: await this.pushService.sendIncidentAlert(incident);
```
❌ Push notifications are NOT sent for web-created incidents

This fix makes web-created incidents work the same way as AWS CloudWatch incidents.

## Impact

**Before Fix:**
- Web creates incident → Only emails sent → No mobile alerts → Phones don't ring

**After Fix:**
- Web creates incident → Push notifications + emails sent → Mobile alerts → Phones ring with alarm

## Notes

- Push notifications go to ALL registered devices (not just selected users)
- This is by design - alerts everyone on-call
- User settings control whether they receive notifications
- Email notifications are still sent to specific users for record-keeping
- Both notification methods work together

## Questions?

Contact the mobile app developer or check:
- `/module-rp-fireforce-mobile/hooks/use-push-notifications.ts` - Mobile push setup
- `/module-rp-fireforce-backend/src/services/push-notification.service.ts` - Backend push service
- `/module-rp-fireforce-web/PUSH_NOTIFICATION_FIX.md` - Detailed explanation
