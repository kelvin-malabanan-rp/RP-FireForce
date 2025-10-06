# 🔔 Notification System - Quick Reference

## 🎯 Quick Start (30 seconds)

1. **Enable Desktop Notifications:**
   - Click bell icon 🔔 (top-right)
   - Click "Settings"
   - Click "Enable Desktop Notifications"
   - Allow in browser prompt

2. **Test It:**
   ```bash
   curl -X POST https://incident-webhook-api.rapidresponse.workers.dev/api/incidents \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","severity":"critical","description":"Testing","reportedBy":"test@test.com"}'
   ```

3. **Wait:** Max 30 seconds to see notification

---

## 🎨 Notification Types

| Type | Color | Sound | Auto-Close | Use Case |
|------|-------|-------|------------|----------|
| Critical 🚨 | Red | Alternating beeps | ❌ No | Production down |
| High ⚠️ | Yellow | Two-tone | ✅ 10s | High CPU |
| Medium ℹ️ | Blue | Single tone | ✅ 10s | Deployment |
| Low 📝 | Green | Low tone | ✅ 10s | Info |
| Comment 💬 | Blue | Gentle | ✅ 8s | New comment |

---

## ⚡ Quick Actions

| Action | How |
|--------|-----|
| Enable notifications | Bell → Settings → Enable Desktop |
| Toggle sound | Bell → Settings → Toggle switch |
| Test sound | Bell → Settings → Test buttons |
| View notifications | Click bell icon 🔔 |
| Mark as read | Click notification |
| Mark all read | Bell → "Mark all read" |
| Refresh now | Bell → "Refresh Notifications" |
| Navigate to incident | Click notification |

---

## 🔄 How Triggers Work

```
Someone creates incident
         ↓
    Wait max 30s
         ↓
    Polling detects
         ↓
┌────────┴────────┐
│                 │
Desktop Notif   Sound
     ↓             ↓
   Bell Badge Updates
         ↓
    You click
         ↓
Navigate to incident
```

---

## 🧪 Test Commands

### Create Critical Incident
```bash
curl -X POST https://incident-webhook-api.rapidresponse.workers.dev/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Database Down",
    "severity": "critical",
    "description": "Production DB unreachable",
    "reportedBy": "test@example.com"
  }'
```

### Create High Severity
```bash
curl -X POST https://incident-webhook-api.rapidresponse.workers.dev/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "High CPU Usage",
    "severity": "high",
    "description": "Server CPU at 95%",
    "reportedBy": "monitoring@example.com"
  }'
```

### Add Comment (use different userId)
```bash
curl -X POST https://incident-webhook-api.rapidresponse.workers.dev/api/incidents-comment \
  -H "Content-Type: application/json" \
  -d '{
    "incidentId": "YOUR_INCIDENT_ID",
    "userId": "different-user",
    "comment": "Investigating now"
  }'
```

---

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| No desktop notifications | Check Settings → should show "Enabled" |
| No sound | Bell → Settings → Toggle sound ON |
| Not updating | Click "Refresh Notifications" |
| Duplicates | `localStorage.removeItem('seenNotificationIds')` + refresh |
| Wrong user | Check userId in localStorage |

---

## 🎛️ Settings Location

**Browser Console:**
```javascript
// View current settings
localStorage.getItem('soundAlertsEnabled')
localStorage.getItem('seenNotificationIds')

// Reset
localStorage.removeItem('soundAlertsEnabled')
localStorage.removeItem('seenNotificationIds')
location.reload()
```

---

## 📊 Status Indicators

In notification dropdown header:

| Badge | Meaning |
|-------|---------|
| 🟢 Desktop On | Browser notifications enabled |
| ⚫ Desktop Off | Browser notifications disabled |
| 🔵 Sound On | Sound alerts enabled |
| ⚫ Sound Off | Sound alerts disabled |

---

## ⏱️ Timing

| Action | Time |
|--------|------|
| Polling interval | Every 30 seconds |
| Critical notification | Stays until dismissed |
| High/Medium/Low | Auto-close after 10s |
| Comment | Auto-close after 8s |
| Max wait for new | 30 seconds |

---

## 🔐 Permissions

**Required Permissions:**
1. ✅ Notification permission (browser)
2. ✅ Audio permission (browser)

**To check:**
- Chrome: `chrome://settings/content/notifications`
- Firefox: `about:preferences#privacy`
- Safari: System Preferences → Notifications

---

## 📱 Mobile vs Web Comparison

| Feature | Mobile | Web |
|---------|--------|-----|
| Push notifications | ✅ Expo Push | ✅ Browser API |
| Sound alerts | ✅ Yes | ✅ Yes |
| Action buttons | ✅ Accept/Decline | 🔄 Coming soon |
| Background alerts | ✅ Yes | ⚠️ Tab must be open |
| Vibration | ✅ Yes | ⚠️ Android only |

---

## 🎓 For Developers

### Import Hook:
```javascript
import useEnhancedNotifications from '../hooks/useEnhancedNotifications';

const { 
  notifications, 
  unreadCount,
  requestBrowserPermission,
  toggleSound
} = useEnhancedNotifications(userId);
```

### Key Files:
- `useEnhancedNotifications.js` - Main hook
- `useBrowserNotifications.js` - Desktop notifications
- `soundAlerts.js` - Sound system
- `NotificationSettings.jsx` - Settings UI
- `TopNavigation.jsx` - Bell icon UI

---

## 🔗 Related Documentation

- 📖 [Complete Tutorial](./NOTIFICATION_TUTORIAL.md) - Step-by-step guide
- 📋 [System Guide](./NOTIFICATION_SYSTEM_GUIDE.md) - Technical overview
- 🔧 [Mobile Implementation](../module-rp-fireforce-mobile/hooks/use-push-notifications.ts)

---

## 💡 Pro Tips

1. **Enable notifications FIRST** before testing
2. **Use different userId** when testing comments
3. **Wait 30 seconds** max for polling to detect
4. **Click refresh** if you need it immediately
5. **Critical incidents** don't auto-close (by design)
6. **Check console** for debugging (F12)
7. **Clear localStorage** if things get weird

---

## 🎯 Success Criteria

✅ Bell icon shows badge when new incident created  
✅ Desktop notification appears (if enabled)  
✅ Sound plays (if enabled)  
✅ Can click to navigate to incident  
✅ Notifications marked as read  
✅ Settings work correctly  

---

**Last Updated:** 2025-10-05  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
