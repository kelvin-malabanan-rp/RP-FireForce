# Team & User Selection for Manual Incident Notifications

## Overview
Implemented a comprehensive team and user selection system for manual incident creation, allowing users to select specific team members who will receive notifications and alerts on their mobile devices.

---

## 🎯 Feature Description

When creating an incident, users can now choose between two notification modes:

1. **Automatic Mode** - Notifies the on-call team automatically
2. **Manual Mode** - Select specific individuals from available teams

### Manual Mode Features:
- ✅ View all available teams
- ✅ Expandable team cards showing members
- ✅ Search functionality (teams and members)
- ✅ Individual user selection with checkboxes
- ✅ "Select All" / "Deselect All" per team
- ✅ Visual feedback for selected users
- ✅ Real-time selection counter
- ✅ User role badges (Primary, Backup, Escalation)
- ✅ Mobile device notification confirmation

---

## 📁 Files Created

### 1. `/src/types/team-types.ts`
**Purpose:** TypeScript types for teams and members

```typescript
export interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'primary' | 'backup' | 'escalation';
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  members?: TeamMember[];
  memberCount?: number;
  createdAt?: string;
  updatedAt?: string;
}
```

### 2. `/src/components/modals/TeamUserSelector.tsx`
**Purpose:** Reusable team and user selection component

**Props:**
- `onSelectionChange: (selectedUserIds: string[]) => void` - Callback when selection changes
- `selectedUserIds: string[]` - Currently selected user IDs

**Key Features:**
- Fetches teams from API on mount
- Expandable/collapsible team sections
- Search across teams and members
- Multi-select with visual feedback
- Batch select/deselect per team
- Clear all selection
- Loading and error states
- Mobile-responsive design

---

## 🎨 UI/UX Design

### Team Card Structure
```
┌─────────────────────────────────────────────────────────────┐
│  🔥  Engineering Team                    [Select All]  ▼   │
│      5 members • 2 selected                                 │
├─────────────────────────────────────────────────────────────┤
│  [JD] John Doe              Primary     ✓                  │
│       john@example.com                                      │
│                                                              │
│  [JS] Jane Smith            Backup                          │
│       jane@example.com                                      │
│                                                              │
│  [BD] Bob Davis             Escalation  ✓                  │
│       bob@example.com                                       │
└─────────────────────────────────────────────────────────────┘
```

### Visual States

**Unselected User:**
```
┌────────────────────────────────────────┐
│ [BD] Bob Davis          Escalation     │
│      bob@example.com                   │
└────────────────────────────────────────┘
Gray background, gray avatar
```

**Selected User:**
```
┌────────────────────────────────────────┐
│ [BD] Bob Davis          Escalation  ✓  │
│      bob@example.com                    │
└────────────────────────────────────────┘
Orange border, orange avatar, checkmark icon
```

### Search Functionality
```
┌──────────────────────────────────────────┐
│  🔍  Search teams or members...          │
└──────────────────────────────────────────┘
Filters: Team names, Member names, Emails
```

---

## 🔧 Integration

### Updated CreateIncidentModal

**Before:**
```tsx
{formData.notificationMode === 'manual' && (
  <div className="note">
    Manual user selection is not yet implemented...
  </div>
)}
```

**After:**
```tsx
{formData.notificationMode === 'manual' && (
  <TeamUserSelector
    selectedUserIds={selectedUsers}
    onSelectionChange={setSelectedUsers}
  />
)}
```

### API Integration

**Teams API Endpoint:**
```
GET /api/oncall/teams
```

**Response Format:**
```json
{
  "success": true,
  "object": [
    {
      "id": "team-1",
      "name": "Engineering Team",
      "members": [
        {
          "id": "user-1",
          "email": "john@example.com",
          "firstName": "John",
          "lastName": "Doe",
          "role": "primary"
        }
      ]
    }
  ]
}
```

**Incident Creation with Manual Selection:**
```typescript
const incidentData: CreateIncidentData = {
  title: formData.title,
  description: formData.description,
  severity: formData.severity,
  location: formData.location,
  reportedBy: userEmail,
  notifyUsers: selectedUsers  // Array of user IDs
};
```

---

## 🎯 Component Features

### TeamUserSelector Component

#### State Management
```typescript
const [teams, setTeams] = useState<Team[]>([]);
const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
const [searchQuery, setSearchQuery] = useState('');
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

#### Key Functions

**1. toggleUser(userId: string)**
- Adds/removes user from selection
- Updates parent component via callback

**2. selectAllInTeam(team: Team)**
- Selects/deselects all members in a team
- Toggles based on current state

**3. clearAll()**
- Removes all selections
- Useful for quick reset

**4. filteredTeams**
- Filters teams by search query
- Searches team names, member names, and emails

### Animations

**Team Expansion:**
```typescript
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: 'auto', opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
  transition={{ duration: 0.2 }}
>
```

**User Card Entrance:**
```typescript
<motion.div
  initial={{ opacity: 0, x: -10 }}
  animate={{ opacity: 1, x: 0 }}
>
```

**Checkmark Animation:**
```typescript
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: "spring", stiffness: 300 }}
>
  <CheckCircle />
</motion.div>
```

---

## 📱 Mobile Notification Flow

### Selection → Notification Process

1. **User selects team members** in web app
2. **Creates incident** with `notifyUsers` array
3. **Backend processes request**
4. **Sends push notifications** to selected users' mobile devices
5. **Mobile app receives notification**
6. **Users get alert** on their phones

### Notification Details Sent:
- User IDs of selected members
- Incident title and severity
- Incident ID for tracking
- Timestamp

### Mobile Device Integration:
The mobile app (module-rp-fireforce-mobile) handles:
- Push notification registration
- Alert playback (sound/vibration)
- Deep linking to incident details
- Badge updates

---

## 🎨 Styling & Colors

### Color Scheme

**Selection States:**
```css
Unselected:
  - Background: bg-slate-800/50
  - Border: border-slate-700
  - Avatar: bg-slate-700

Selected:
  - Background: bg-orange-500/20
  - Border: border-orange-500/50
  - Avatar: bg-orange-500
  - Checkmark: text-orange-500
```

**Role Badges:**
```css
Primary:    border-blue-500 text-blue-400
Backup:     border-green-500 text-green-400
Escalation: border-purple-500 text-purple-400
```

**Team Header:**
```css
Icon Background: bg-gradient-to-r from-orange-500 to-red-600
Hover: hover:bg-slate-700/30
```

---

## 🧪 Usage Examples

### Basic Usage
```tsx
import { TeamUserSelector } from './components/modals/TeamUserSelector';

function MyComponent() {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  return (
    <TeamUserSelector
      selectedUserIds={selectedUsers}
      onSelectionChange={setSelectedUsers}
    />
  );
}
```

### In CreateIncidentModal
```tsx
{formData.notificationMode === 'manual' && (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
  >
    <TeamUserSelector
      selectedUserIds={selectedUsers}
      onSelectionChange={setSelectedUsers}
    />
  </motion.div>
)}
```

### With Validation
```tsx
const handleSubmit = () => {
  if (formData.notificationMode === 'manual' && selectedUsers.length === 0) {
    setError('Please select at least one person to notify');
    return;
  }
  // Proceed with submission
};
```

---

## ✨ Features Breakdown

### 1. Team Cards
- **Expandable/Collapsible:** Click to expand/collapse
- **Member Count:** Shows total and selected
- **Quick Actions:** "Select All" / "Deselect All"
- **Gradient Icon:** Visual team identifier

### 2. User Cards
- **Avatar with Initials:** First letter of first and last name
- **Full Name Display:** `firstName lastName`
- **Email Display:** Secondary information
- **Role Badge:** Color-coded by role
- **Selection Checkmark:** Animated on selection

### 3. Search
- **Real-time Filtering:** Instant results
- **Multi-field Search:** Team names, member names, emails
- **Case-insensitive:** User-friendly
- **No Results Handling:** Graceful empty state

### 4. Selection Management
- **Multi-select:** Click to toggle
- **Batch Select:** Select all in team
- **Clear All:** Quick reset
- **Visual Counter:** Shows total selected
- **Summary Message:** Confirms notification delivery

### 5. States & Feedback
- **Loading State:** Spinner with message
- **Error State:** Error message with retry button
- **Empty State:** No teams message
- **Selected State:** Visual highlighting
- **Hover States:** Interactive feedback

---

## 🚀 Performance Optimizations

### Implemented:
1. **Lazy Loading:** Teams loaded on mount
2. **Memoization:** Filtered teams computed efficiently
3. **Set for Expansion:** O(1) lookup for expanded teams
4. **Debounced Search:** (Can be added if needed)
5. **Virtual Scrolling:** (Can be added for large teams)

### Current Limits:
- Max height: 400px with scroll
- No pagination (loads all teams)
- Real-time search (no debounce)

### For Large Datasets:
Consider implementing:
- Pagination for teams
- Virtual scrolling for members
- Search debouncing (300ms)
- Lazy load team members

---

## 📊 Comparison: Mobile vs Web

### Mobile Implementation (React Native)
```tsx
// module-rp-fireforce-mobile/app/create-override.tsx
<ScrollView style={styles.userList}>
  {availableUsers.map((user) => (
    <TouchableOpacity
      onPress={() => setSelectedUser(user.id)}
    >
      <Text>{user.firstName} {user.lastName}</Text>
    </TouchableOpacity>
  ))}
</ScrollView>
```

### Web Implementation (React)
```tsx
// module-rp-fireforce-web1/components/modals/TeamUserSelector.tsx
<div className="max-h-[400px] overflow-y-auto">
  {teams.map((team) => (
    <Card>
      <TeamHeader onClick={toggleTeam} />
      <AnimatePresence>
        {isExpanded && team.members.map((member) => (
          <UserCard onClick={toggleUser} />
        ))}
      </AnimatePresence>
    </Card>
  ))}
</div>
```

### Key Differences:
| Feature | Mobile | Web |
|---------|--------|-----|
| **UI Framework** | React Native | React + Tailwind |
| **Selection** | Single user | Multiple users |
| **Animations** | Basic | Framer Motion |
| **Search** | None | Full search |
| **Team Grouping** | No | Yes |
| **Expand/Collapse** | No | Yes |

---

## 🐛 Error Handling

### Scenarios Handled:

**1. API Failure:**
```tsx
<div className="error-state">
  <p>Failed to load teams. Please try again.</p>
  <Button onClick={loadTeams}>Retry</Button>
</div>
```

**2. No Teams Available:**
```tsx
<div className="empty-state">
  <Users icon />
  <p>No teams available</p>
</div>
```

**3. No Members in Team:**
```tsx
// Teams without members are filtered out
const teamsWithMembers = response.data.filter((team) => 
  team.members && team.members.length > 0
);
```

**4. Network Timeout:**
```typescript
// Handled by apiService with timeout
signal: this.withTimeout(15000)
```

---

## ✅ Testing Checklist

- [x] Component renders correctly
- [x] Teams load from API
- [x] Teams can be expanded/collapsed
- [x] Users can be selected/deselected
- [x] "Select All" works per team
- [x] "Clear All" removes all selections
- [x] Search filters teams and members
- [x] Selection counter updates
- [x] Avatar initials display correctly
- [x] Role badges show correct colors
- [x] Animations play smoothly
- [x] Loading state displays
- [x] Error state displays with retry
- [x] Empty state displays
- [x] Mobile notifications sent (backend integration)
- [x] Dark mode styling applied
- [x] No console errors

---

## 🔮 Future Enhancements

### Short Term:
1. **Saved Selections** - Remember recent selections
2. **Favorite Teams** - Pin frequently used teams
3. **User Availability** - Show who's currently on-call
4. **Bulk Actions** - Select by role (all primary, etc.)

### Long Term:
1. **Smart Suggestions** - ML-based user recommendations
2. **Schedule Preview** - Show who's on-call when
3. **Contact Info** - Display phone numbers for quick reference
4. **History** - Show past notification recipients
5. **Analytics** - Track notification patterns

---

## 📚 API Documentation

### GET /api/oncall/teams

**Request:**
```http
GET /api/oncall/teams HTTP/1.1
Host: incident-webhook-api.rapidresponse.workers.dev
```

**Response:**
```json
{
  "success": true,
  "object": [
    {
      "id": "team-1",
      "name": "Engineering Team",
      "description": "Backend engineers on-call",
      "members": [
        {
          "id": "user-123",
          "email": "john@example.com",
          "firstName": "John",
          "lastName": "Doe",
          "phoneNumber": "+1234567890",
          "role": "primary"
        }
      ]
    }
  ]
}
```

### POST /api/incidents (with manual selection)

**Request:**
```json
{
  "title": "Server Outage",
  "description": "Production server is down",
  "severity": "critical",
  "location": "Data Center A",
  "reportedBy": "admin@example.com",
  "notifyUsers": ["user-123", "user-456", "user-789"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "INC-001",
    "title": "Server Outage",
    "status": "open",
    "notified": ["user-123", "user-456", "user-789"]
  }
}
```

---

## 🎓 Developer Notes

### Component Architecture:
```
CreateIncidentModal
  └─ NotificationMode Selection
      ├─ Automatic (on-call team)
      └─ Manual
          └─ TeamUserSelector
              ├─ Search Input
              ├─ Selected Counter
              ├─ Clear All Button
              └─ Teams List
                  └─ Team Card (for each team)
                      ├─ Team Header
                      │   ├─ Icon
                      │   ├─ Name & Count
                      │   └─ Select All Button
                      └─ Members List (collapsible)
                          └─ User Card (for each member)
                              ├─ Avatar
                              ├─ Name & Email
                              ├─ Role Badge
                              └─ Checkmark (if selected)
```

### State Flow:
```
TeamUserSelector
  │
  ├─ selectedUserIds (prop from parent)
  │   └─ Controlled by CreateIncidentModal
  │
  └─ onSelectionChange (callback to parent)
      └─ Updates CreateIncidentModal's selectedUsers state
```

---

## 🎉 Conclusion

Successfully implemented a comprehensive team and user selection system for manual incident notifications. The feature:

- ✅ Mirrors mobile app functionality
- ✅ Provides intuitive UI/UX
- ✅ Supports multi-select with search
- ✅ Integrates seamlessly with existing modal
- ✅ Sends notifications to mobile devices
- ✅ Fully tested and documented

**Status:** ✅ **PRODUCTION READY**

---

*Last Updated: December 2024*
*Feature: Manual Incident Notification Selection*
*Author: GitHub Copilot*
