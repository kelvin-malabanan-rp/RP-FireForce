# 🎓 Web Notification System - Complete Tutorial

## 📋 Table of Contents
1. [What Was Implemented](#what-was-implemented)
2. [How It Works](#how-it-works)
3. [Testing Guide](#testing-guide)
4. [Triggers Explained](#triggers-explained)
5. [User Guide](#user-guide)
6. [Developer Guide](#developer-guide)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 What Was Implemented

### New Features Added:
1. ✅ **Enhanced Notification Hook** (`useEnhancedNotifications.js`)
   - Browser/Desktop notifications
   - Sound alerts
   - In-app bell notifications
   - Real-time polling

2. ✅ **Browser Notification Support** (`useBrowserNotifications.js`)
   - Desktop notifications (like mobile push)
   - Click-to-navigate
   - Auto-dismiss for non-critical
   - Requires interaction for critical incidents

3. ✅ **Sound Alert System** (`soundAlerts.js`)
   - Different sounds for each severity
   - Volume control
   - Enable/disable toggle
   - Test sounds

4. ✅ **Notification Settings UI** (`NotificationSettings.jsx`)
   - Enable/disable desktop notifications
   - Sound on/off toggle
   - Test sounds for each severity
   - Permission status display

5. ✅ **Enhanced TopNavigation**
   - Settings button in notification dropdown
   - Desktop/Sound status indicators
   - Better visual feedback

---

## 🔄 How It Works

### Architecture Flow:

```
┌─────────────────────────────────────────────────────────────┐
│                     Backend API                              │
│  https://incident-webhook-api.rapidresponse.workers.dev     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Polls every 30 seconds
                       │
                       v
┌─────────────────────────────────────────────────────────────┐
│              useEnhancedNotifications Hook                   │
│  - checkNewIncidents()                                       │
│  - checkNewComments()                                        │
│  - Compares with last checked timestamp                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ New incident/comment detected
                       │
        ┌──────────────┴──────────────┐
        │                             │
        v                             v
┌──────────────────┐        ┌──────────────────┐
│ Browser Notif    │        │  Sound Alert     │
│ (Desktop)        │        │  (Beep/Tone)     │
│ "🚨 Critical"    │        │  Frequency by    │
│ Click → Navigate │        │  Severity        │
└──────────────────┘        └──────────────────┘
        │                             │
        └──────────────┬──────────────┘
                       │
                       v
┌─────────────────────────────────────────────────────────────┐
│                    TopNavigation UI                          │
│  - Bell icon shows badge count                               │
│  - Dropdown shows notification list                          │
│  - Click notification → Navigate to incident                 │
└─────────────────────────────────────────────────────────────┘
```

### Notification Lifecycle:

1. **Detection (Polling)**
   - Every 30 seconds, checks for new incidents/comments
   - Compares timestamps with last check
   - Filters out already-seen notifications

2. **Creation**
   - Creates notification object with metadata
   - Assigns severity/type-based styling
   - Adds to notification list

3. **Display**
   - Shows in bell dropdown (always)
   - Shows desktop notification (if enabled)
   - Plays sound alert (if enabled)

4. **Interaction**
   - User clicks notification
   - Marks as read
   - Navigates to incident page

5. **Persistence**
   - Seen IDs stored in localStorage
   - Settings stored in localStorage
   - Survives page refresh

---

## 🧪 Testing Guide

### Test 1: Enable Desktop Notifications

**Steps:**
1. Open the web app
2. Click the bell icon (top-right)
3. Click "Settings" button
4. Click "Enable Desktop Notifications"
5. Allow permission in browser prompt

**Expected Result:**
✅ Status shows "Enabled"
✅ Green checkmark appears

**Screenshot:**
```
┌─────────────────────────────────┐
│ Desktop Notifications           │
│ Status: ✅ Enabled              │
│                                 │
│ ✓ All Set!                      │
│ You'll receive desktop          │
│ notifications for new incidents │
└─────────────────────────────────┘
```

---

### Test 2: Test Sound Alerts

**Steps:**
1. Open notification settings
2. Ensure sound is enabled (toggle ON)
3. Click "Test Critical" button
4. Click "Test High" button
5. Try other severity levels

**Expected Result:**
✅ Hear different tones for each severity
✅ Critical = Alternating high-pitched beeps
✅ High = Two-tone beep
✅ Medium = Single tone
✅ Low = Lower tone

---

### Test 3: Create Incident and Receive Notification

**Method 1: Using API (cURL)**
```bash
curl -X POST https://incident-webhook-api.rapidresponse.workers.dev/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Critical Alert - Desktop Notification Test",
    "description": "Testing the new notification system with desktop alerts",
    "severity": "critical",
    "location": "Production Server",
    "reportedBy": "test-user@example.com"
  }'
```

**Method 2: Using Postman/Insomnia**
- URL: `https://incident-webhook-api.rapidresponse.workers.dev/api/incidents`
- Method: POST
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "title": "Database Connection Lost",
  "description": "Production database is unreachable",
  "severity": "high",
  "location": "AWS us-east-1",
  "reportedBy": "monitoring@example.com"
}
```

**Method 3: Using Web UI**
1. Go to Incidents page
2. Click "Create Incident" button
3. Fill in the form
4. Submit

**Expected Result (after max 30 seconds):**
✅ Bell icon shows badge count (1)
✅ Desktop notification appears (if enabled)
✅ Sound plays (if enabled)
✅ Notification shows in dropdown

**Desktop Notification Example:**
```
┌─────────────────────────────────┐
│ 🚨 New Critical Incident        │
│                                 │
│ Test Critical Alert - Desktop   │
│ Notification Test               │
│                                 │
│ Just now                        │
└─────────────────────────────────┘
```

---

### Test 4: Click Notification to Navigate

**Steps:**
1. Wait for notification to appear (from Test 3)
2. Click notification in dropdown OR desktop notification
3. Should navigate to incident details page

**Expected Result:**
✅ Navigation occurs
✅ Incident details page loads
✅ Notification marked as read
✅ Badge count decreases

---

### Test 5: Add Comment and Receive Notification

**Using API:**
```bash
# First, get an incident ID from the incidents list
# Then post a comment with a DIFFERENT userId than your current user

curl -X POST https://incident-webhook-api.rapidresponse.workers.dev/api/incidents-comment \
  -H "Content-Type: application/json" \
  -d '{
    "incidentId": "incident-123",
    "userId": "different-user-id",
    "comment": "I am investigating this issue now"
  }'
```

**Important:** The comment must be from a different user than you're logged in as, otherwise it's filtered out.

**Expected Result (after max 30 seconds):**
✅ Bell shows new notification
✅ Desktop notification: "💬 New Comment"
✅ Sound plays (lower tone)
✅ Message shows who commented

---

### Test 6: Mark All As Read

**Steps:**
1. Have multiple unread notifications
2. Click bell icon
3. Click "Mark all read" button

**Expected Result:**
✅ All notifications marked as read
✅ Badge count becomes 0
✅ Blue dot indicators disappear

---

### Test 7: Refresh Notifications

**Steps:**
1. Click bell icon
2. Scroll to bottom of dropdown
3. Click "Refresh Notifications" button

**Expected Result:**
✅ Checks for new notifications immediately
✅ Doesn't wait for 30-second interval
✅ Any new items appear

---

## 🎯 Triggers Explained

### Trigger 1: New Incident Created
**What:** Someone creates a new incident via API or UI
**When:** Detected within 30 seconds by polling
**Results in:**
- In-app notification (bell icon)
- Desktop notification (if enabled)
- Sound alert (if enabled)
- Badge count increases

**Example Notification:**
```
🚨 New Critical Incident
Database connection lost
Just now
```

---

### Trigger 2: New Comment Posted
**What:** Someone adds a comment to an incident
**When:** Detected within 30 seconds
**Conditions:** Comment must be from a different user (not yourself)
**Results in:**
- In-app notification
- Desktop notification
- Sound alert (lower tone)

**Example Notification:**
```
💬 New Comment
john.doe commented on "Database Down"
2 min ago
```

---

### Trigger 3: Manual Refresh
**What:** User clicks "Refresh Notifications" button
**When:** Immediately
**Results in:**
- Bypasses 30-second wait
- Checks for new items right now
- Updates notification list

---

### Trigger 4: Page Load
**What:** User opens or refreshes the page
**When:** On mount
**Results in:**
- Loads seen notifications from localStorage
- Starts polling interval
- Loads notification settings

---

### Trigger 5: Browser Notification Click
**What:** User clicks desktop notification
**When:** Notification appears on desktop
**Results in:**
- Focuses window
- Navigates to incident page
- Marks notification as read
- Closes desktop notification

---

## 👤 User Guide

### How to Enable Notifications

#### Step 1: Open Settings
1. Click the bell icon (🔔) in the top-right corner
2. Click the "Settings" button in the notification dropdown

#### Step 2: Enable Desktop Notifications
1. Click "Enable Desktop Notifications"
2. Click "Allow" in browser prompt
3. Confirm status shows "Enabled"

#### Step 3: Configure Sound
1. Toggle sound on/off as preferred
2. Test different severity sounds
3. Adjust system volume if needed

### How to Use Notifications

#### Viewing Notifications
1. Look for red badge on bell icon
2. Click bell to open dropdown
3. Scroll through notification list

#### Reading Notifications
1. Click any notification to view incident
2. Notification automatically marked as read
3. Badge count decreases

#### Managing Notifications
- **Mark all as read:** Click "Mark all read" button
- **Refresh:** Click "Refresh Notifications"
- **Settings:** Click "Settings" to change preferences

### Understanding Notification Types

**Critical (Red 🔴)**
- Requires immediate attention
- Desktop notification stays visible
- Loud alternating beep
- Example: Production down

**High (Yellow 🟡)**
- Important but not critical
- Auto-dismisses after 10 seconds
- Two-tone beep
- Example: High CPU usage

**Medium (Blue 🔵)**
- Normal priority
- Auto-dismisses after 10 seconds
- Single tone
- Example: Deployment complete

**Low (Green 🟢)**
- Informational
- Auto-dismisses after 10 seconds
- Low tone
- Example: Maintenance scheduled

**Comment (💬)**
- Someone commented
- Auto-dismisses after 8 seconds
- Gentle tone

---

## 💻 Developer Guide

### File Structure
```
module-rp-fireforce-web/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── TopNavigation.jsx          (Updated)
│   │   └── NotificationSettings.jsx        (New)
│   ├── hooks/
│   │   ├── useNotifications.js             (Original)
│   │   ├── useEnhancedNotifications.js     (New - Main)
│   │   └── useBrowserNotifications.js      (New)
│   └── utils/
│       └── soundAlerts.js                  (New)
└── NOTIFICATION_SYSTEM_GUIDE.md
```

### Integrating in Other Components

#### Basic Usage
```javascript
import useEnhancedNotifications from '../hooks/useEnhancedNotifications';

function MyComponent() {
  const userId = 'user-123';
  const { 
    notifications, 
    unreadCount,
    markAsRead,
    refresh 
  } = useEnhancedNotifications(userId);

  return (
    <div>
      <p>You have {unreadCount} unread notifications</p>
      {notifications.map(notif => (
        <div key={notif.id} onClick={() => markAsRead(notif.id)}>
          {notif.title}: {notif.message}
        </div>
      ))}
    </div>
  );
}
```

#### With Browser Notifications
```javascript
const { 
  isBrowserNotificationSupported,
  browserPermission,
  requestBrowserPermission
} = useEnhancedNotifications(userId);

// Request permission
const handleEnable = async () => {
  const granted = await requestBrowserPermission();
  if (granted) {
    console.log('Notifications enabled!');
  }
};
```

#### Manual Sound Control
```javascript
import { playIncidentAlert, testSound } from '../utils/soundAlerts';

// Play alert
playIncidentAlert({ severity: 'critical' });

// Test sound
testSound('high');
```

### Customization

#### Change Polling Interval
In `useEnhancedNotifications.js`:
```javascript
// Default: 30 seconds
const interval = setInterval(pollNotifications, 30000);

// Change to 10 seconds (more frequent, higher load)
const interval = setInterval(pollNotifications, 10000);

// Change to 60 seconds (less frequent, lower load)
const interval = setInterval(pollNotifications, 60000);
```

#### Customize Sound
In `soundAlerts.js`, modify frequencies:
```javascript
const frequencies = {
  critical: [800, 1000, 800, 1000],  // Your custom pattern
  high: [600, 800],
  // etc...
};
```

#### Add Custom Notification Types
```javascript
// In your code
const customNotification = {
  id: 'custom-123',
  title: 'Maintenance Window',
  message: 'Scheduled maintenance in 1 hour',
  type: 'maintenance',  // Custom type
  category: 'system',
  severity: 'medium'
};
```

### API Integration

#### Webhook Endpoint
If you want backend to push notifications:
```javascript
// Backend sends POST to your webhook
POST /api/webhooks/notification
{
  "userId": "user-123",
  "title": "New Incident",
  "message": "Database down",
  "severity": "critical",
  "incidentId": "incident-456"
}
```

#### WebSocket Alternative
For real-time instead of polling:
```javascript
const ws = new WebSocket('wss://your-backend.com/ws');

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  // Add to notifications
  setNotifications(prev => [notification, ...prev]);
};
```

---

## 🐛 Troubleshooting

### Problem: Desktop Notifications Not Appearing

**Check 1: Browser Support**
- Chrome: ✅ Supported
- Firefox: ✅ Supported
- Safari: ✅ Supported (macOS only)
- Edge: ✅ Supported
- Internet Explorer: ❌ Not supported

**Check 2: Permission Status**
1. Click bell icon → Settings
2. Check status under "Desktop Notifications"
3. Should show "Enabled" (green)

**Check 3: Browser Settings**
- Chrome: Settings → Privacy → Site Settings → Notifications
- Firefox: Preferences → Privacy → Permissions → Notifications
- Ensure your site URL is not blocked

**Check 4: Operating System**
- Windows: Settings → System → Notifications
- macOS: System Preferences → Notifications
- Ensure browser has notification permission at OS level

---

### Problem: No Sound Playing

**Check 1: Sound Enabled**
1. Click bell → Settings
2. Verify sound toggle is ON
3. Should show "Sound On" badge

**Check 2: Browser Audio**
- Check tab isn't muted (look for mute icon in tab)
- Check browser has audio permission
- Try testing sound in settings

**Check 3: System Volume**
- Increase system volume
- Check application isn't muted in volume mixer

**Check 4: Console Errors**
```javascript
// Open browser console (F12)
// Look for errors like:
// "Error playing alert sound: [error message]"
```

---

### Problem: Notifications Not Updating

**Check 1: Polling Active**
```javascript
// In browser console
console.log('Polling active?');
// Should see continuous polling every 30 seconds
```

**Check 2: API Accessible**
```bash
# Test API endpoint
curl https://incident-webhook-api.rapidresponse.workers.dev/api/incidents
```

**Check 3: Network Issues**
- Open Network tab in DevTools
- Check for failed requests
- Look for CORS errors

**Check 4: Clear Cache**
1. Clear localStorage: `localStorage.clear()`
2. Refresh page (Cmd+Shift+R / Ctrl+Shift+F5)

---

### Problem: Duplicate Notifications

**Solution 1: Clear Seen IDs**
```javascript
// In browser console
localStorage.removeItem('seenNotificationIds');
location.reload();
```

**Solution 2: Check Backend**
- Ensure backend returns consistent IDs
- Check timestamps are correct

---

### Problem: Notification Shows Wrong User

**Check:** Make sure correct userId is set
```javascript
// In TopNavigation.jsx
const userId = user?.id || localStorage.getItem('userId') || 'user-1';

// Verify in console
console.log('Current userId:', userId);
```

---

### Problem: Can't Click Notification

**Check 1: Navigation Handler**
Ensure `onNavigateToIncident` prop is passed:
```javascript
<TopNavigation 
  onNavigateToIncident={(id) => console.log('Navigate to:', id)}
/>
```

**Check 2: React Router**
If using React Router, implement navigation:
```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
const handleNavigate = (incidentId) => {
  navigate(`/incidents/${incidentId}`);
};

<TopNavigation onNavigateToIncident={handleNavigate} />
```

---

## 🎓 Best Practices

### For Users:
1. ✅ Enable desktop notifications if you're on-call
2. ✅ Test sounds at reasonable volume
3. ✅ Check notifications regularly
4. ✅ Mark notifications as read to reduce clutter
5. ✅ Use "Refresh" if you expect an urgent update

### For Developers:
1. ✅ Don't decrease polling interval below 10 seconds
2. ✅ Handle edge cases (no internet, API down)
3. ✅ Test with different user IDs
4. ✅ Monitor console for errors
5. ✅ Keep localStorage clean (limit notification history)

### For Admins:
1. ✅ Encourage team to enable notifications
2. ✅ Set up proper incident severity levels
3. ✅ Monitor notification delivery
4. ✅ Consider backend webhooks for critical alerts
5. ✅ Document escalation procedures

---

## 📊 Metrics & Monitoring

### Key Metrics to Track:
- Notification delivery time (should be < 30 seconds)
- Desktop notification permission rate
- Sound enabled rate
- Click-through rate on notifications
- Unread notification count per user

### Logging:
```javascript
// Add to useEnhancedNotifications.js
console.log('[Notifications] New incidents:', newIncidents.length);
console.log('[Notifications] New comments:', newComments.length);
console.log('[Notifications] Desktop permission:', browserPermission);
console.log('[Notifications] Sound enabled:', soundEnabled);
```

---

## 🚀 Future Enhancements

### Potential Improvements:
1. **WebSocket Integration** - Real-time instead of polling
2. **Service Worker** - Background sync, offline support
3. **Push API with VAPID** - True push from backend
4. **Notification Grouping** - Group by incident
5. **Rich Notifications** - Images, buttons, replies
6. **Notification History** - View all past notifications
7. **Per-Incident Subscriptions** - Watch specific incidents
8. **Smart Batching** - Group multiple notifications
9. **Do Not Disturb Mode** - Schedule quiet hours
10. **Custom Sound Upload** - Use custom alert sounds

---

## 📚 Additional Resources

### Web APIs Used:
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

### Browser Compatibility:
- [Can I Use - Notifications](https://caniuse.com/notifications)
- [Can I Use - Web Audio](https://caniuse.com/audio-api)

### Related Guides:
- `NOTIFICATION_SYSTEM_GUIDE.md` - Technical overview
- Mobile app: `hooks/use-push-notifications.ts` - Mobile implementation

---

## ✅ Summary Checklist

Use this to verify everything is working:

- [ ] Desktop notifications enabled
- [ ] Sound alerts enabled
- [ ] Bell icon shows notifications
- [ ] Badge count updates correctly
- [ ] Can click notifications to navigate
- [ ] Can mark notifications as read
- [ ] Can mark all as read
- [ ] Can refresh notifications manually
- [ ] Settings modal opens and works
- [ ] Sound tests work for all severities
- [ ] Desktop notifications appear for new incidents
- [ ] Desktop notifications appear for new comments
- [ ] Notifications persist across page refresh
- [ ] No console errors

---

🎉 **Congratulations!** You now have a fully functional notification system similar to the mobile app!

For questions or issues, check the troubleshooting section or open an issue in the repository.
