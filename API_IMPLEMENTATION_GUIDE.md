# RP-FireForce On-Call Schedule API Implementation

## 📋 API Overview & Implementation Status

### ✅ **Implemented APIs**

#### 1. GET All Teams
**Endpoint:** `/api/oncall/teams`  
**Purpose:** Retrieve all on-call teams with their members  
**Implementation:** ✅ Used in OnCallSchedulePage for team selector  
**Features:**
- Displays team list in dropdown
- Shows team members for each team
- Auto-selects first team on page load

#### 2. GET Current On-Call
**Endpoint:** `/api/oncall/current?teamId={{teamId}}`  
**Purpose:** Get currently active on-call assignments for a team  
**Implementation:** ✅ CurrentOnCallSection component  
**Features:**
- Shows Primary, Backup, and Escalation contacts
- Displays user info cards with contact details
- Quick action buttons (Call, Message)
- Shows active schedule period

#### 3. GET On-Call Schedule
**Endpoint:** `/api/oncall/schedule?teamId={{teamId}}&days=7`  
**Purpose:** Get schedule assignments for specified number of days  
**Implementation:** ✅ ScheduleCalendar component  
**Features:**
- Monthly calendar view
- Color-coded assignments (Primary=Green, Backup=Blue, Escalation=Orange)
- Today highlighting
- Weekend styling
- Navigation between months

#### 4. POST Create Override
**Endpoint:** `/api/oncall/override`  
**Purpose:** Create temporary schedule changes (vacation, shift swaps)  
**Implementation:** ✅ CreateOverrideModal component  
**Features:**
- Modal form for creating overrides
- Team selection
- Role selection (Primary/Backup/Escalation)
- Replacement user selection from team members
- Original user specification (optional)
- Date/time range picker
- Reason text field
- Form validation
- Success feedback

---

### 🔄 **APIs Ready for Implementation**

#### 5. GET On-call Team by User ID
**Endpoint:** `/api/oncall/user/team?userId=user-4`  
**Purpose:** Get the team that a specific user belongs to  
**Potential Use Cases:**
- Show "My Team" view for logged-in users
- Personalize dashboard with user's team info
- Quick navigation to user's own team schedule

**Suggested Implementation:**
```javascript
const fetchMyTeam = async (userId) => {
  const response = await fetch(`${BASE_URL}/api/oncall/user/team?userId=${userId}`);
  const data = await response.json();
  // Auto-select user's team in dropdown
  setSelectedTeam(data.data.id);
};
```

#### 6. PUT Update Schedule Config
**Endpoint:** `/api/oncall/schedule/config`  
**Purpose:** Configure rotation settings and member ordering  
**Potential Use Cases:**
- Admin panel for schedule configuration
- Set rotation type (daily/weekly/biweekly/monthly)
- Define rotation length in hours
- Order team members in rotation sequence
- Set rotation start date

**Suggested Implementation:**
- Create "Schedule Configuration" admin panel
- Form with rotation settings
- Drag-and-drop interface for member ordering
- Preview of how rotation will work

#### 7. POST Escalate Incident
**Endpoint:** `/api/oncall/escalate`  
**Purpose:** Escalate an incident to next level  
**Potential Use Cases:**
- Escalation button on incident details page
- Automatic escalation after timeout
- Manual escalation with reason

**Suggested Implementation:**
- Add to incidents page
- "Escalate" button on each incident card
- Shows current escalation level
- Confirms before escalating
- Notifies next level personnel

---

## 🎨 **Current Design Implementation**

### Design Principles
✅ **Simple & Clean** - Plain solid colors, no gradients  
✅ **Professional** - Consistent typography and spacing  
✅ **Functional** - Clear visual hierarchy  
✅ **Accessible** - Good contrast ratios  

### Color Scheme
- **Primary** (Green): `bg-green-100`, `text-green-800`, `border-green-200`
- **Backup** (Blue): `bg-blue-100`, `text-blue-800`, `border-blue-200`
- **Escalation** (Orange): `bg-orange-100`, `text-orange-800`, `border-orange-200`
- **Today** (Blue Highlight): `bg-blue-50`, `border-blue-500`
- **Weekends**: `bg-gray-50`
- **Weekdays**: `bg-white`

---

## 🚀 **Features Implemented**

### On-Call Schedule Page
1. **Team Selector** - Dropdown to select teams
2. **Current On-Call Cards** - Shows Primary, Backup, Escalation
3. **Monthly Calendar** - Visual schedule representation
4. **Create Override** - Modal form for schedule changes
5. **Month Navigation** - Browse past/future months
6. **Auto-team Selection** - Automatically selects first team
7. **Real-time API Integration** - All data from your backend
8. **Loading States** - Professional loading indicators
9. **Error Handling** - User-friendly error messages

### User Experience Features
- Responsive design (works on mobile/desktop)
- Form validation with helpful error messages
- Success feedback after actions
- Hover states for better interactivity
- Clear visual indicators (Today, Weekend, etc.)
- Contact quick actions (Call, Message buttons)

---

## 📝 **Suggested Next Steps**

### 1. User's Team View
- Add "My Team" button that uses user ID to fetch and display their team
- Show logged-in user's role within their team
- Highlight user's own on-call shifts in calendar

### 2. Schedule Configuration Panel
- Admin-only page for configuring rotations
- Set rotation type and frequency
- Manage team member order in rotation
- Preview how schedule will look

### 3. Incident Escalation Integration
- Add escalation functionality to incidents page
- Show escalation chain visually
- Track escalation history
- Send notifications on escalation

### 4. Override Management
- List view of all active/upcoming overrides
- Edit/cancel existing overrides
- Filter by team/user/date range
- Export override schedule

### 5. Enhanced Calendar Features
- Click on day to see full day details
- Multi-day view option (week view, list view)
- Export calendar to .ics format
- Print-friendly version

---

## 💡 **API Usage Examples**

### Create Override (Now Working!)
```javascript
const override = {
  teamId: "team-1",
  startTime: "2025-02-01T00:00:00Z",
  endTime: "2025-02-02T00:00:00Z",
  userId: "user-2", // Replacement user
  role: "primary",
  reason: "Vacation coverage",
  originalUserId: "user-4" // Optional: who is being replaced
};

const response = await fetch('${BASE_URL}/api/oncall/override', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(override)
});
```

### Get User's Team
```javascript
const userId = 'user-4';
const response = await fetch(`${BASE_URL}/api/oncall/user/team?userId=${userId}`);
const data = await response.json();
// data.data contains: { id, name, timezone, fullname }
```

### Update Schedule Config
```javascript
const config = {
  teamId: "team-1",
  rotationType: "weekly", // daily, weekly, biweekly, monthly
  rotationLengthHours: 168, // 1 week
  rotationStartISO: "2025-01-01T00:00:00Z",
  members: [
    { userId: "user-1", role: "primary", orderIndex: 0, isActive: true },
    { userId: "user-2", role: "backup", orderIndex: 1, isActive: true }
  ]
};

const response = await fetch('${BASE_URL}/api/oncall/schedule/config', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(config)
});
```

---

## ✨ **Summary**

**What's Working Now:**
- ✅ View all teams
- ✅ See current on-call assignments
- ✅ Browse monthly calendar with assignments
- ✅ Create schedule overrides
- ✅ Clean, simple design with plain colors
- ✅ Full API integration

**Ready to Implement:**
- 📋 User's team personalization
- ⚙️ Schedule configuration panel
- 🚨 Incident escalation features
- 📊 Override management dashboard

All the core functionality is working with real API data!
