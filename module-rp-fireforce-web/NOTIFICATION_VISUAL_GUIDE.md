# 🎨 Notification System - Visual Guide

## 🎯 Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                          BACKEND API                                    │
│       https://incident-webhook-api.rapidresponse.workers.dev           │
│                                                                         │
│  • POST /api/incidents          (Create incident)                      │
│  • GET  /api/incidents          (Get all incidents)                    │
│  • POST /api/incidents-comment  (Add comment)                          │
│  • GET  /api/incidents-comment  (Get comments)                         │
│                                                                         │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ HTTP Polling (every 30s)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                 useEnhancedNotifications Hook                           │
│                 (Main Notification Engine)                              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────┐          │
│  │ checkNewIncidents()                                      │          │
│  │  • Fetches all incidents                                │          │
│  │  • Compares with lastCheckedRef                         │          │
│  │  • Filters by timestamp & seen IDs                      │          │
│  │  • Creates notification objects                         │          │
│  └─────────────────────────────────────────────────────────┘          │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────┐          │
│  │ checkNewComments()                                       │          │
│  │  • Fetches comments for recent incidents                │          │
│  │  • Excludes own comments                                │          │
│  │  • Creates comment notifications                        │          │
│  └─────────────────────────────────────────────────────────┘          │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────┐          │
│  │ State Management                                         │          │
│  │  • notifications[] - Array of notification objects      │          │
│  │  • unreadCount - Number of unread                       │          │
│  │  • seenIdsRef - Set of seen notification IDs            │          │
│  │  • lastCheckedRef - Last polling timestamp              │          │
│  └─────────────────────────────────────────────────────────┘          │
│                                                                         │
└────────────────┬────────────────────────┬─────────────────────────────┘
                 │                        │
                 │                        │
        ┌────────┴────────┐      ┌────────┴────────┐
        │                 │      │                 │
        ▼                 ▼      ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│              │  │              │  │              │  │              │
│  Browser     │  │   Sound      │  │   Bell Icon  │  │  LocalStorage│
│  Notification│  │   Alert      │  │   Update     │  │   Persist    │
│              │  │              │  │              │  │              │
│ Desktop OS   │  │ Web Audio    │  │ Badge Count  │  │ Seen IDs     │
│ notification │  │ Beeps/Tones  │  │ Dropdown UI  │  │ Settings     │
│ Click →      │  │ Severity-    │  │ List of      │  │ User prefs   │
│ Navigate     │  │ based        │  │ notifications│  │              │
│              │  │              │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
        │                 │                 │                 │
        └─────────────────┴─────────────────┴─────────────────┘
                                  │
                                  ▼
                        ┌─────────────────┐
                        │                 │
                        │   User Sees     │
                        │  & Interacts    │
                        │                 │
                        └─────────────────┘
```

---

## 🔄 Notification Flow (Step by Step)

```
STEP 1: Someone Creates Incident
┌────────────────────────────────────┐
│ POST /api/incidents                │
│ {                                  │
│   "title": "Database Down",        │
│   "severity": "critical"           │
│ }                                  │
└────────────────────────────────────┘
                  │
                  │ Stored in backend
                  │
                  ▼
        ┌──────────────────┐
        │ Backend Database │
        │ incident-123     │
        │ timestamp: 14:30 │
        └──────────────────┘


STEP 2: Polling Detects New Incident (within 30s)
┌────────────────────────────────────┐
│ GET /api/incidents                 │
│ Response: [                        │
│   {                                │
│     id: "incident-123",            │
│     timestamp: "14:30:00",         │
│     severity: "critical"           │
│   }                                │
│ ]                                  │
└────────────────────────────────────┘
                  │
                  │ Compare timestamp
                  ▼
        ┌──────────────────┐
        │ lastCheckedRef   │
        │ was: 14:25:00    │
        │ incident: 14:30  │
        │ ✓ NEW!           │
        └──────────────────┘


STEP 3: Create Notification Object
┌────────────────────────────────────┐
│ {                                  │
│   id: "incident-123",              │
│   title: "🚨 New Critical",        │
│   message: "Database Down",        │
│   time: "Just now",                │
│   type: "critical",                │
│   unread: true,                    │
│   severity: "critical"             │
│ }                                  │
└────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌──────────────┐    ┌──────────────┐
│ Add to       │    │ Increment    │
│ notifications│    │ unreadCount  │
│ array        │    │ by 1         │
└──────────────┘    └──────────────┘


STEP 4: Trigger All Notification Types
        ┌──────────────────┐
        │ New Notification │
        └────────┬─────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐  ┌──────────────┐
│   Desktop    │  │    Sound     │
│              │  │              │
│ ┌──────────┐ │  │  ♪♪♪♪♪♪♪♪   │
│ │ 🚨       │ │  │  Alternating │
│ │ Critical │ │  │  High-Pitched│
│ │ Database │ │  │  Beeps       │
│ │ Down     │ │  │              │
│ └──────────┘ │  └──────────────┘
└──────────────┘
        │
        │ AND
        │
        ▼
┌──────────────────────────────────┐
│     TopNavigation (Bell)         │
│                                  │
│  🔔 (1) ← Red badge             │
│                                  │
│  Click to see:                   │
│  ┌────────────────────────┐     │
│  │ 🔴 New Critical        │     │
│  │ Database Down          │     │
│  │ Just now              │     │
│  └────────────────────────┘     │
└──────────────────────────────────┘


STEP 5: User Interaction
┌────────────────────────────────────┐
│ User clicks notification           │
└────────────────┬───────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Mark as read │  │ Navigate to  │
│ unread: false│  │ /incidents/  │
│ Badge: (0)   │  │ incident-123 │
└──────────────┘  └──────────────┘
        │                 │
        └────────┬────────┘
                 │
                 ▼
        ┌──────────────────┐
        │ Add to seenIdsRef│
        │ Save to          │
        │ localStorage     │
        └──────────────────┘


STEP 6: Persistence
┌────────────────────────────────────┐
│ localStorage                       │
│                                    │
│ seenNotificationIds:               │
│ ["incident-123", "comment-456"]    │
│                                    │
│ soundAlertsEnabled: true           │
│                                    │
└────────────────────────────────────┘
        │
        │ Survives page refresh
        │
        ▼
┌────────────────────────────────────┐
│ Next page load: don't show         │
│ incident-123 again                 │
└────────────────────────────────────┘
```

---

## 🎨 UI Components

### TopNavigation Bell Icon
```
┌─────────────────────────────────────────┐
│                    🔔 (3)               │ ← Badge shows count
│                     │                   │
│                     │ Click to open     │
│                     ▼                   │
│ ┌───────────────────────────────────┐  │
│ │ 🔔 Notifications                  │  │
│ │ ────────────────────────────────  │  │
│ │ 🟢 Desktop On  🔵 Sound On  ⚙️   │  │ ← Status indicators
│ │ ────────────────────────────────  │  │
│ │                                   │  │
│ │ 🔴 New Critical Incident          │  │ ← Critical (red)
│ │    Database connection lost       │  │
│ │    Just now                   ● ← │  │   Unread dot
│ │                                   │  │
│ │ 🟡 New High Incident              │  │ ← High (yellow)
│ │    High CPU usage detected        │  │
│ │    2 min ago                      │  │
│ │                                   │  │
│ │ 💬 New Comment                    │  │ ← Comment
│ │    john.doe commented on...       │  │
│ │    5 min ago                      │  │
│ │                                   │  │
│ │ ────────────────────────────────  │  │
│ │ 🔄 Refresh Notifications          │  │ ← Manual refresh
│ └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Desktop Notification (Browser)
```
┌─────────────────────────────────────┐
│ FireForce                    [X]    │ ← App name
├─────────────────────────────────────┤
│                                     │
│  🚨 New Critical Incident           │ ← Title
│                                     │
│  Database connection lost           │ ← Body
│  Just now                           │ ← Time
│                                     │
│  [Click to view incident]           │ ← Action
│                                     │
└─────────────────────────────────────┘
     │
     │ Click
     │
     ▼
┌─────────────────────────────────────┐
│ Browser focuses window              │
│ Navigates to incident page          │
│ Notification closes                 │
└─────────────────────────────────────┘
```

### Notification Settings Modal
```
┌─────────────────────────────────────────────────┐
│ 🔔 Notification Settings              [X]       │
│ Configure your alert preferences                │
├─────────────────────────────────────────────────┤
│                                                 │
│ 🖥️ Desktop Notifications                       │
│ Get notified even when you're in another tab   │
│                                                 │
│ Status: ✅ Enabled                              │
│                                                 │
│ ✓ All Set!                                      │
│ You'll receive desktop notifications for       │
│ new incidents and comments.                     │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│ 🔊 Sound Alerts                    [ON  OFF]   │ ← Toggle
│ Play audio for new incidents                   │
│                                                 │
│ Test different severity sounds:                │
│                                                 │
│ [Test Critical]  [Test High]                   │ ← Test buttons
│ [Test Medium]    [Test Low]                    │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│ ℹ️ How Notifications Work                      │
│ • The system checks for new incidents every    │
│   30 seconds                                   │
│ • You'll see notifications in the bell icon    │
│   and desktop (if enabled)                     │
│ • Critical incidents require interaction       │
│                                                 │
├─────────────────────────────────────────────────┤
│                    [Done]                       │
└─────────────────────────────────────────────────┘
```

---

## 📊 State Management

```
┌─────────────────────────────────────┐
│  useEnhancedNotifications Hook      │
│                                     │
│  State:                             │
│  ┌───────────────────────────────┐ │
│  │ notifications: [              │ │
│  │   {                           │ │
│  │     id: "incident-123",       │ │
│  │     title: "New Critical",    │ │
│  │     unread: true,             │ │
│  │     timestamp: "2024-..."     │ │
│  │   },                          │ │
│  │   ...                         │ │
│  │ ]                             │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ unreadCount: 3                │ │
│  └───────────────────────────────┘ │
│                                     │
│  Refs:                              │
│  ┌───────────────────────────────┐ │
│  │ lastCheckedRef:               │ │
│  │   2024-10-05T14:30:00Z        │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ seenIdsRef: Set([             │ │
│  │   "incident-123",             │ │
│  │   "comment-456"               │ │
│  │ ])                            │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
         │
         │ Updates trigger re-render
         │
         ▼
┌─────────────────────────────────────┐
│      TopNavigation Component        │
│                                     │
│      {unreadCount} → Badge          │
│      {notifications} → List         │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎭 Severity Types Visual

```
┌──────────────────────────────────────────────────────────┐
│                     CRITICAL 🚨                          │
│  Color: #DC2626 (Red)                                    │
│  Sound: ♪♪ ♪♪ ♪♪ ♪♪ (Alternating beeps)                │
│  Desktop: Requires interaction (doesn't auto-close)      │
│  Use: Production down, data loss, security breach        │
│                                                          │
│  Badge: ●                                                │
│  ────────────────────────────────────                   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                       HIGH ⚠️                            │
│  Color: #F59E0B (Yellow)                                 │
│  Sound: ♪♪ ♪  (Two-tone beep)                           │
│  Desktop: Auto-closes after 10 seconds                   │
│  Use: High CPU, memory issues, service degradation       │
│                                                          │
│  Badge: ●                                                │
│  ────────────────────────────────────                   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                      MEDIUM ℹ️                           │
│  Color: #3B82F6 (Blue)                                   │
│  Sound: ♪  (Single tone)                                 │
│  Desktop: Auto-closes after 10 seconds                   │
│  Use: Deployments, config changes, warnings              │
│                                                          │
│  Badge: ●                                                │
│  ────────────────────────────────────                   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                       LOW 📝                             │
│  Color: #10B981 (Green)                                  │
│  Sound: ♪  (Low tone)                                    │
│  Desktop: Auto-closes after 10 seconds                   │
│  Use: Informational, status updates, maintenance         │
│                                                          │
│  Badge: ●                                                │
│  ────────────────────────────────────────                │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                     COMMENT 💬                           │
│  Color: #3B82F6 (Blue)                                   │
│  Sound: ♪  (Gentle tone)                                 │
│  Desktop: Auto-closes after 8 seconds                    │
│  Use: New comments on incidents                          │
│                                                          │
│  Badge: ●                                                │
│  ────────────────────────────────────────                │
└──────────────────────────────────────────────────────────┘
```

---

## 🔧 Hook API Reference

```javascript
const {
  // Core notification data
  notifications,        // Array<Notification>
  unreadCount,         // number
  
  // Actions
  markAsRead,          // (notificationId: string) => void
  markAllAsRead,       // () => void
  clearAll,            // () => void
  refresh,             // () => void - Manual poll
  
  // Browser notifications
  isBrowserNotificationSupported,  // boolean
  browserPermission,               // 'default' | 'granted' | 'denied'
  requestBrowserPermission,        // () => Promise<boolean>
  
  // Sound
  soundEnabled,        // boolean
  toggleSound,         // (enabled: boolean) => void
  
} = useEnhancedNotifications(userId);
```

---

## 📱 Mobile vs Web Side-by-Side

```
┌──────────────────────────┬──────────────────────────┐
│         MOBILE           │           WEB            │
├──────────────────────────┼──────────────────────────┤
│                          │                          │
│  📱 Push Notifications   │  🖥️  Browser API         │
│  Via Expo                │  Via Notification API    │
│                          │                          │
│  Works in background     │  Tab must be open*       │
│  ✅ Full background      │  ⚠️  Partial background  │
│                          │                          │
│  Action buttons:         │  Desktop notification:   │
│  "I've got this ✅"      │  Click to view           │
│  "I can't ❌"            │  (Actions: Coming soon)  │
│                          │                          │
│  Vibration: ✅           │  Vibration: Android only │
│                          │                          │
│  Sound: Native           │  Sound: Web Audio API    │
│  Device sounds           │  Generated tones         │
│                          │                          │
│  Registration:           │  Permission:             │
│  Push token + FCM        │  Browser permission      │
│                          │                          │
│  Real-time:              │  Polling:                │
│  Push from backend       │  Check every 30s         │
│                          │                          │
└──────────────────────────┴──────────────────────────┘

* Note: Service Workers can enable true background for web
```

---

## ⏱️ Timeline Example

```
Time    | Event                           | Result
--------+---------------------------------+--------------------------------
14:25:00| Last poll checked               | lastCheckedRef = 14:25:00
14:27:30| User creates incident via API   | Backend stores incident-123
14:27:31| Incident in database            | timestamp = 14:27:30
14:30:00| Next poll cycle                 | GET /api/incidents
14:30:01| Hook receives data              | Finds incident-123
14:30:02| Timestamp comparison            | 14:27:30 > 14:25:00 ✓ NEW
14:30:03| Create notification object      | id: "incident-123"
14:30:04| Show desktop notification       | OS notification appears
14:30:04| Play sound alert                | ♪♪ Beep beep
14:30:04| Update bell badge               | Badge shows (1)
14:30:05| Add to notifications array      | notifications.push(...)
14:30:30| User clicks desktop notif       | Window focuses
14:30:31| Navigate to incident            | /incidents/incident-123
14:30:32| Mark as read                    | unread = false
14:30:33| Add to seenIdsRef               | Set.add("incident-123")
14:30:34| Save to localStorage            | Persist seen IDs
15:00:00| Next poll                       | incident-123 filtered out
```

---

## 🎯 Decision Tree

```
                    New Incident Detected
                            │
                            ▼
                    ┌───────────────┐
                    │ Severity?     │
                    └───────┬───────┘
                            │
        ┌───────────┬───────┼───────┬───────────┐
        │           │       │       │           │
        ▼           ▼       ▼       ▼           ▼
    Critical      High   Medium   Low      Comment
        │           │       │       │           │
        ▼           ▼       ▼       ▼           ▼
    ┌──────┐    ┌──────┐ ┌──────┐ ┌──────┐  ┌──────┐
    │ Red  │    │Yellow│ │ Blue │ │Green │  │ Blue │
    │ ♪♪♪♪ │    │ ♪♪   │ │  ♪   │ │  ♪   │  │  ♪   │
    │ Stay │    │ 10s  │ │ 10s  │ │ 10s  │  │  8s  │
    └──────┘    └──────┘ └──────┘ └──────┘  └──────┘
        │           │       │       │           │
        └───────────┴───────┴───────┴───────────┘
                            │
                            ▼
                    Show to user
                            │
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
              Bell badge      Desktop notif
                    │               │
                    └───────┬───────┘
                            │
                            ▼
                      User clicks
                            │
                            ▼
                    Mark as read
                            │
                            ▼
                    Navigate to page
```

---

**Visual guide complete! 🎉**

For interactive tutorials, see:
- [Complete Tutorial](./NOTIFICATION_TUTORIAL.md)
- [Quick Reference](./NOTIFICATION_QUICK_REFERENCE.md)
