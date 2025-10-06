# 🔔 Web Notification System - Complete Guide

## Overview
The web notification system provides real-time alerts for incidents and comments, similar to the mobile app. It includes:
- **In-App Notifications** (Bell icon in TopNavigation)
- **Browser Push Notifications** (Desktop/System notifications)
- **Sound Alerts** for critical incidents
- **Visual Badge** showing unread count

---

## 🎯 Current Implementation

### 1. **In-App Notification Bell** (Already Implemented)
Located in `TopNavigation.jsx`, the bell icon shows:
- Red badge with unread count
- Dropdown with notification list
- Click to view incident details
- Mark as read/Mark all as read

### 2. **Notification Hook** (`useNotifications.js`)
- Polls backend every 30 seconds
- Checks for new incidents
- Checks for new comments
- Maintains unread count
- Persists seen notifications in localStorage

---

## 🚀 How the Current System Works

### **Step 1: Hook Initialization**
```javascript
// In TopNavigation.jsx
const { 
  notifications,      // Array of notification objects
  unreadCount,        // Number of unread notifications
  markAsRead,         // Mark single notification as read
  markAllAsRead,      // Mark all as read
  refresh             // Manual refresh
} = useNotifications(userId);
```

### **Step 2: Polling Mechanism**
The hook automatically polls every 30 seconds:
```javascript
// Runs every 30 seconds
setInterval(pollNotifications, 30000);
```

### **Step 3: Notification Creation**
When a new incident is created, the polling detects it:
```javascript
// New incident detected
{
  id: "incident-123",
  incidentId: "incident-123",
  title: "New Critical Incident",
  message: "Database connection lost",
  time: "Just now",
  type: "critical",        // critical, warning, info, success
  category: "incident",    // incident or comment
  unread: true
}
```

### **Step 4: Display in UI**
```jsx
{/* Bell icon with badge */}
<Bell className="w-5 h-5" />
{unreadCount > 0 && (
  <div className="badge">{unreadCount}</div>
)}
```

---

## 🔔 Browser Push Notifications (Enhancement)

To make it work like mobile with desktop notifications, we need to add Web Push API support.

### **Prerequisites**
1. HTTPS connection (required for service workers)
2. User permission for notifications
3. Service Worker registration

### **Files to Create/Modify**

#### 1. **Service Worker** (`public/sw.js`)
```javascript
// Handles background notifications
self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.message,
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    data: { incidentId: data.incidentId },
    actions: [
      { action: 'view', title: 'View Incident' },
      { action: 'close', title: 'Dismiss' }
    ],
    requireInteraction: data.severity === 'critical'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'view') {
    clients.openWindow('/incidents/' + event.notification.data.incidentId);
  }
});
```

#### 2. **Enhanced Notification Hook** (`useEnhancedNotifications.js`)
```javascript
// Adds browser notification support
const requestPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

const showBrowserNotification = (notification) => {
  if (Notification.permission === 'granted') {
    const n = new Notification(notification.title, {
      body: notification.message,
      icon: '/logo.png',
      tag: notification.id,
      requireInteraction: notification.type === 'critical'
    });
    
    n.onclick = () => {
      window.focus();
      navigate(`/incidents/${notification.incidentId}`);
    };
  }
};
```

#### 3. **Sound Alert System** (`utils/soundAlerts.js`)
```javascript
const playAlertSound = (severity) => {
  const audio = new Audio(`/sounds/${severity}-alert.mp3`);
  audio.volume = 0.5;
  audio.play().catch(err => console.log('Audio play failed:', err));
};
```

---

## 🎬 Triggers for Notifications

### **Trigger 1: New Incident Created**
```javascript
// When someone creates an incident via API
POST /api/incidents
{
  "title": "Database Down",
  "severity": "critical",
  "description": "Production DB unreachable"
}

// Polling detects it within 30 seconds
// Creates notification automatically
// Shows in bell dropdown
```

### **Trigger 2: New Comment on Incident**
```javascript
// When someone comments
POST /api/incidents-comment
{
  "incidentId": "incident-123",
  "userId": "user-1",
  "comment": "I'm investigating this issue"
}

// Detected by polling
// Notification created for other users
```

### **Trigger 3: Incident Status Change**
```javascript
// When status changes (not yet fully implemented)
POST /api/incidents
{
  "incidentId": "incident-123",
  "action": "acknowledge",
  "userId": "user-1"
}

// Could trigger notification to team
```

---

## 📝 Testing the Current System

### **Test 1: Create New Incident**
```bash
# Create incident via API
curl -X POST https://incident-webhook-api.rapidresponse.workers.dev/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Critical Alert",
    "description": "Testing notification system",
    "severity": "critical",
    "location": "Production Server",
    "reportedBy": "admin@test.com"
  }'
```

**Expected Result:**
- Within 30 seconds, bell icon shows badge
- Click bell to see notification
- Click notification to view incident

### **Test 2: Add Comment**
```bash
# Add comment via API
curl -X POST https://incident-webhook-api.rapidresponse.workers.dev/api/incidents-comment \
  -H "Content-Type: application/json" \
  -d '{
    "incidentId": "incident-123",
    "userId": "user-2",
    "comment": "I can help with this"
  }'
```

**Expected Result:**
- User 1 sees notification about User 2's comment
- Excludes own comments

### **Test 3: Manual Refresh**
```javascript
// Click "Refresh Notifications" button in dropdown
// Or trigger programmatically
refresh();
```

---

## 🔧 Configuration Options

### **Polling Interval**
Change in `useNotifications.js`:
```javascript
// Default: 30 seconds
setInterval(pollNotifications, 30000);

// More frequent (10 seconds) - higher server load
setInterval(pollNotifications, 10000);

// Less frequent (60 seconds) - lower server load
setInterval(pollNotifications, 60000);
```

### **Notification Limit**
```javascript
// Keep last 50 notifications
return unique.slice(0, 50);

// Keep last 100
return unique.slice(0, 100);
```

### **Seen Notifications Persistence**
```javascript
// Stored in localStorage
localStorage.getItem('seenNotificationIds');

// Clear all seen notifications
localStorage.removeItem('seenNotificationIds');
```

---

## 🐛 Troubleshooting

### **Problem: Not receiving notifications**
1. Check browser console for errors
2. Verify userId is set correctly
3. Check API is returning data
4. Ensure polling interval is running

```javascript
// Debug mode
console.log('Notifications:', notifications);
console.log('Unread count:', unreadCount);
console.log('User ID:', userId);
```

### **Problem: Notifications not clearing**
1. Check localStorage quota
2. Clear seen notifications: `localStorage.removeItem('seenNotificationIds')`
3. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+F5)

### **Problem: Duplicate notifications**
- The system filters by ID, but if backend returns same incident with different timestamp
- Check backend API responses

---

## 🎨 Customization

### **Change Notification Colors**
```jsx
// In TopNavigation.jsx
const getNotificationIcon = (type) => {
  switch (type) {
    case 'critical':
      return <div className="w-3 h-3 bg-red-500 ..."></div>;
    case 'warning':
      return <div className="w-3 h-3 bg-yellow-500 ..."></div>;
    // Customize colors here
  }
};
```

### **Change Notification Sound**
```javascript
// Add audio element
const audio = new Audio('/sounds/alert.mp3');
audio.play();
```

### **Custom Notification Types**
```javascript
// Add new type
type: 'maintenance',  // New type
// Add case in getNotificationIcon()
case 'maintenance':
  return <div className="w-3 h-3 bg-purple-500 ..."></div>;
```

---

## 📊 Notification Flow Diagram

```
┌─────────────────┐
│   Backend API   │
│  /api/incidents │
└────────┬────────┘
         │
         │ New incident created
         │
         v
┌─────────────────┐
│ useNotifications│ ←── Polls every 30s
│      Hook       │
└────────┬────────┘
         │
         │ Detects new incident
         │
         v
┌─────────────────┐
│  setNotifications│
│   + unreadCount │
└────────┬────────┘
         │
         │ React updates UI
         │
         v
┌─────────────────┐
│  TopNavigation  │
│   Bell Icon 🔔  │
│   Badge: (1)    │
└─────────────────┘
         │
         │ User clicks
         │
         v
┌─────────────────┐
│   Dropdown UI   │
│ "New Critical   │
│   Incident"     │
└─────────────────┘
         │
         │ User clicks notification
         │
         v
┌─────────────────┐
│ Navigate to     │
│ Incident Page   │
└─────────────────┘
```

---

## 🚀 Future Enhancements (Optional)

1. **WebSocket Integration** - Real-time instead of polling
2. **Push Subscription** - Backend push via VAPID keys
3. **Notification Groups** - Group by incident
4. **Notification History** - Persistent storage
5. **Notification Preferences** - Per-user settings
6. **Rich Notifications** - Images, actions, replies
7. **Desktop Integration** - OS-level notifications

---

## 📚 Related Files

- `src/components/layout/TopNavigation.jsx` - UI component
- `src/hooks/useNotifications.js` - Notification logic
- `src/pages/incidents/IncidentDetailsPage.jsx` - Target page

---

## 🎓 Summary

**How to use notifications:**
1. System automatically polls every 30 seconds
2. New incidents/comments appear in bell dropdown
3. Click notification to view incident
4. Mark as read or mark all as read
5. Notifications persist in localStorage

**How to trigger notifications:**
1. Create new incident via API or UI
2. Add comment to incident
3. Wait max 30 seconds for polling
4. Or click "Refresh Notifications" button

**Key concepts:**
- Polling-based (every 30s)
- LocalStorage for persistence
- Severity-based colors (critical=red, high=yellow, etc.)
- Click-to-navigate functionality
- Unread count badge
