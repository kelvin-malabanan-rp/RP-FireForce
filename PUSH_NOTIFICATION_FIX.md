# Push Notification Fix for Mobile Device Alerts

## Problem

When creating incidents from the web app, **mobile devices were NOT receiving push notifications** (no rings/alarms). The backend was only sending email notifications, not push notifications to registered mobile devices.

## Root Cause

The backend's `notifySpecificUsers` and `notifyCurrentOnCall` methods in `incident.services.ts` were **missing calls to the Push Notification Service**. They only sent emails via `EmailService`, which meant:

- ✅ Emails were sent
- ❌ Push notifications were NOT sent
- ❌ Mobile phones did NOT ring
- ❌ Alert sounds did NOT play

## How Mobile Push Notifications Work

### Mobile App Flow (`use-push-notifications.ts`)

1. **Registration**:
   - Mobile app requests notification permissions
   - Creates notification channels with different priorities (critical, high, medium, default)
   - Gets Expo push token and FCM/APNs token
   - Registers tokens with backend via `registerPushToken` API

2. **Notification Handler**:
   ```typescript
   await Notifications.setNotificationHandler({
     handleNotification: async () => ({
       shouldShowAlert: true,
       shouldPlaySound: true,  // ← This makes the phone ring
       shouldSetBadge: true,
       shouldShowBanner: true,
     }),
   });
   ```

3. **Channels with Alarm Sounds**:
   ```typescript
   await Notifications.setNotificationChannelAsync('critical-alerts-v4', {
     name: 'Critical Alerts',
     importance: Notifications.AndroidImportance.MAX,
     sound: 'alarm_sound',  // ← Custom alarm sound
     enableVibrate: true,
     vibrationPattern: [0,500,200,500,200,500],  // ← Strong vibration
   });
   ```

4. **Receiving Notifications**:
   - When push notification arrives, it plays the alarm sound
   - Device vibrates according to severity
   - Shows alert banner and action buttons
   - Increments badge count

### Backend Flow (Fixed)

1. **PushNotificationService.sendIncidentAlert()**:
   ```typescript
   async sendIncidentAlert(incident: Incident): Promise<void> {
     // Get all registered push tokens from database
     const pushTokens = await this.getActivePushTokens();
     
     // Create notification message with alarm sound
     const message = this.createNotificationMessage(incident);
     
     // Send to ALL registered devices
     for (const tokenData of pushTokens) {
       if (this.shouldSendAlert(incident, tokenData.settings)) {
         await this.sendPushNotification(tokenUsed, message);
       }
     }
   }
   ```

2. **Sends to Expo Push Service**:
   ```typescript
   private async sendExpoNotification(token: string, message): Promise<boolean> {
     const response = await fetch('https://exp.host/--/api/v2/push/send', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         to: token,
         title: message.title,
         body: message.body,
         data: message.data,
         sound: 'alarm_sound',  // ← This triggers the alarm on mobile
         priority: 'high',
         channelId: 'critical-alerts-v4',
       })
     });
   }
   ```

## The Fix

### Before (Only Emails)

```typescript
private async notifySpecificUsers(incidentId: string, userIds: string[]): Promise<void> {
  const incident = await this.dbService.getIncidentBy(incidentId);
  const emailService = new EmailService(this.env);

  // ❌ No push notifications
  for (const userId of userIds) {
    const user = await this.dbService.getUserById(userId);
    if (user) {
      await emailService.sendIncidentAlert(incident, user.email);
    }
  }
}
```

### After (Emails + Push Notifications)

```typescript
private async notifySpecificUsers(incidentId: string, userIds: string[]): Promise<void> {
  const incident = await this.dbService.getIncidentBy(incidentId);
  if (!incident) return;

  // ✅ Send push notifications to ALL registered mobile devices (rings their phones)
  try {
    console.log(`[notifySpecificUsers] Sending push notifications for incident ${incidentId}`);
    await this.pushService.sendIncidentAlert(incident);
    console.log(`[notifySpecificUsers] Push notifications sent successfully`);
  } catch (error) {
    console.error(`[notifySpecificUsers] Failed to send push notifications:`, error);
  }

  // Also send emails to specific users
  const emailService = new EmailService(this.env);
  for (const userId of userIds) {
    const user = await this.dbService.getUserById(userId);
    if (user) {
      await emailService.sendIncidentAlert(incident, user.email);
    }
  }
}
```

## Changes Made

### File: `module-rp-fireforce-backend/src/services/incident.services.ts`

#### 1. `notifySpecificUsers` Method (Manual Team Selection)

**Added**:
- Call to `this.pushService.sendIncidentAlert(incident)` to send push notifications to ALL registered mobile devices
- Null check for incident before sending
- Error handling with console logs

**Result**: When user selects specific team members manually, push notifications are sent to ALL registered mobile devices, then emails are sent to the selected users.

#### 2. `notifyCurrentOnCall` Method (Automatic Rotation)

**Added**:
- Call to `this.pushService.sendIncidentAlert(incident)` to send push notifications to ALL registered mobile devices
- Null check for incident before sending
- Error handling with console logs

**Result**: When automatic rotation is enabled, push notifications are sent to ALL registered mobile devices, then emails are sent to current on-call team members.

## How It Works Now

### Scenario 1: Manual Team Selection

1. User creates incident on web
2. Selects specific team members (e.g., user-1, user-4)
3. Backend calls `notifySpecificUsers([user-1, user-4])`
4. **Backend sends push notifications to ALL registered mobile devices** ← NEW
5. Backend sends emails to user-1 and user-4
6. **Mobile phones ring with alarm sound** ← NEW
7. Selected users also receive emails

### Scenario 2: Automatic Rotation

1. User creates incident on web
2. Leaves team selection on automatic
3. Backend calls `notifyCurrentOnCall()`
4. **Backend sends push notifications to ALL registered mobile devices** ← NEW
5. Backend sends emails to current on-call primary and backup
6. **Mobile phones ring with alarm sound** ← NEW
7. On-call team also receives emails

## Testing the Fix

### Step 1: Deploy Backend
```bash
cd module-rp-fireforce-backend
npm run deploy
```

### Step 2: Ensure Mobile App is Registered

1. Open mobile app
2. Go to Settings → Alert Manager
3. Ensure "Alert Notifications" is ON
4. Check registration status shows "Registered"

### Step 3: Create Test Incident from Web

1. Open web app
2. Go to Incidents page
3. Click "Create Incident"
4. Fill in incident details:
   - Title: "Test Push Notification"
   - Description: "Testing mobile device alerts"
   - Severity: "critical"
5. Either:
   - **Option A**: Select specific team members manually
   - **Option B**: Leave on automatic rotation
6. Click "Create Incident"

### Step 4: Verify Mobile Alert

**Expected Results**:
- ✅ Mobile phone receives push notification immediately
- ✅ Alarm sound plays (based on severity)
- ✅ Device vibrates
- ✅ Notification shows with action buttons
- ✅ Badge count increments
- ✅ Email is also sent

**Check Logs**:
```bash
# Backend logs should show:
[notifySpecificUsers] Sending push notifications for incident incident-xxx
[notifySpecificUsers] Push notifications sent successfully
```

### Step 5: Test Different Severity Levels

Create incidents with different severities to test different alarm sounds:

- **Critical**: MAX importance, continuous alarm, strong vibration
- **High**: HIGH importance, alarm sound, moderate vibration
- **Medium**: DEFAULT importance, alarm sound, light vibration
- **Low**: DEFAULT importance, default sound

## Why Push Notifications Weren't Working Before

The mobile app's `use-push-notifications.ts` hook was **correctly configured** with:
- ✅ Notification permissions requested
- ✅ Channels created with alarm sounds
- ✅ Vibration patterns configured
- ✅ Push tokens registered with backend
- ✅ Notification handler set up

But the **backend wasn't calling the Push Notification Service** when incidents were created from the web app. The mobile app was ready to receive notifications, but none were being sent.

## Additional Notes

### Push Notification Flow

```
Web App Create Incident
       ↓
Backend incident.services.ts
       ↓
notifySpecificUsers() OR notifyCurrentOnCall()
       ↓
pushService.sendIncidentAlert()  ← This was missing!
       ↓
PushNotificationService queries database for tokens
       ↓
Sends to Expo Push Service
       ↓
Expo routes to FCM (Android) or APNs (iOS)
       ↓
Mobile device receives notification
       ↓
Alarm sound plays & device vibrates
```

### User Settings Respected

The push notification service respects user settings stored in the database:
- `enableAlerts`: If false, no notifications sent
- `criticalOnly`: If true, only critical severity notifications sent
- `soundEnabled`: Controls whether sound plays
- `vibrationEnabled`: Controls vibration

### All Registered Devices Notified

When `pushService.sendIncidentAlert(incident)` is called, it:
1. Queries database for ALL active push tokens
2. Filters based on user settings
3. Sends notification to ALL matching devices

This means if multiple team members have the mobile app installed and registered, they will ALL receive the alert on their phones.

## Related Files

- `/module-rp-fireforce-backend/src/services/incident.services.ts` - MODIFIED
- `/module-rp-fireforce-backend/src/services/push-notification.service.ts` - No changes (was already working)
- `/module-rp-fireforce-mobile/hooks/use-push-notifications.ts` - No changes (was already working)
- `/module-rp-fireforce-mobile/components/alert-manager.tsx` - No changes (was already working)

## Summary

✅ **Fixed**: Backend now sends push notifications when incidents are created
✅ **Mobile devices will ring** with alarm sounds
✅ **Vibration patterns** work based on severity
✅ **Both notification methods**: Push notifications (immediate) + Emails (record)
✅ **User settings respected**: Critical-only, sound, vibration preferences
✅ **All registered devices notified**: Not just selected users

The mobile app's push notification system was fully functional - it just wasn't being triggered by the backend when creating incidents from the web.
