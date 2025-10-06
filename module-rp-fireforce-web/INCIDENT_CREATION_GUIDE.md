# Incident Creation with Team Alerting - Implementation Guide

## 📋 Overview

Successfully implemented the mobile app's incident creation feature with team alerting capabilities in the web application. This allows users to create incidents and automatically notify the current on-call team or manually select specific team members.

---

## ✨ Features Implemented

### 1. **Create Incident Modal** (`CreateIncidentModal.jsx`)
A two-step modal for creating incidents with advanced team notification options.

**Step 1: Incident Details**
- Title (required)
- Description (required)
- Severity Level (Low, Medium, High, Critical)
- Location (optional)

**Step 2: Team Selection**
- Displays current on-call team
- Toggle between automatic rotation and manual selection
- Search and filter team members
- Select specific users to notify

### 2. **On-Call Team Display** (`OnCallTeamDisplay.jsx`)
Shows the current on-call team with:
- Primary on-call member
- Backup on-call member
- Escalation contacts
- Schedule time range
- Role badges and avatars

### 3. **Team Member Selector** (`TeamMemberSelector.jsx`)
Advanced user selection interface with:
- Search by name or email
- Filter by role (Primary, Backup, Escalation)
- Select all / Deselect all
- Visual selection indicators
- Selected count display

---

## 🎯 How It Works

### Default Behavior (Automatic Rotation):
1. User creates an incident
2. System automatically notifies current on-call team
3. Notifications sent to:
   - Primary on-call member
   - Backup on-call member
   - Escalation contacts (if applicable)

### Manual Selection (Bypass Rotation):
1. User toggles "Manual Team Selection"
2. System displays all available team members
3. User searches/filters and selects specific members
4. Only selected members receive notifications

---

## 🔌 API Integration

### Endpoints Used:

#### 1. Get Current On-Call Team
```http
GET {{baseUrl}}/api/oncall/current?teamId={{teamId}}
```

**Response:**
```json
{
  "success": true,
  "object": {
    "scheduleId": "schedule-1",
    "teamId": "team-1",
    "startTime": "2025-10-02T13:35:46.000Z",
    "endTime": "2025-10-09T13:35:46.000Z",
    "primary": {
      "id": "user-4",
      "email": "kelvin.malabanan@rocketpartners.io",
      "firstName": "Kelvin",
      "lastName": "Malabanan",
      "role": "primary"
    },
    "backup": { ... },
    "escalation": [ ... ]
  }
}
```

#### 2. Get All Teams
```http
GET {{baseUrl}}/api/oncall/teams
```

**Response:**
```json
{
  "success": true,
  "object": [
    {
      "id": "team-1",
      "name": "Platform Engineering",
      "timezone": "America/New_York",
      "members": [
        {
          "id": "user-4",
          "email": "kelvin.malabanan@rocketpartners.io",
          "firstName": "Kelvin",
          "lastName": "Malabanan",
          "role": "primary"
        }
      ]
    }
  ]
}
```

#### 3. Create Incident
```http
POST {{baseUrl}}/api/incidents
Content-Type: application/json

{
  "title": "Database Connection Issues",
  "description": "Production database is experiencing connection timeouts",
  "severity": "high",
  "location": "us-east-1",
  "reportedBy": "user@example.com",
  "notify_users": ["user-1", "user-2"]  // Optional: only if manual selection
}
```

**Response:**
```json
{
  "httpStatus": "OK",
  "message": "Incident created successfully",
  "data": {
    "id": "incident-123",
    "title": "Database Connection Issues",
    "severity": "high",
    "status": "Open",
    "timestamp": "2025-10-06T10:30:00.000Z"
  }
}
```

---

## 📂 File Structure

```
src/pages/incidents/
├── IncidentsPage.jsx              # Main incidents page (updated)
└── components/
    ├── CreateIncidentModal.jsx    # NEW - Main modal component
    ├── OnCallTeamDisplay.jsx      # NEW - Shows current on-call team
    └── TeamMemberSelector.jsx     # NEW - User selection interface
```

---

## 🚀 Usage Instructions

### For Users:

1. **Navigate to Incidents Page:**
   - Click on "Incidents" in the side navigation

2. **Click "Create Incident" Button:**
   - Located in the top-right corner of the page

3. **Fill in Incident Details (Step 1):**
   - Enter a descriptive title
   - Provide detailed description
   - Select severity level (Low, Medium, High, Critical)
   - Optionally add location/service name
   - Click "Next: Select Team"

4. **Configure Team Notification (Step 2):**

   **Option A: Automatic (Default)**
   - Leave "Automatic Rotation" enabled
   - Current on-call team displayed
   - These members will be automatically notified
   - Click "Create Incident"

   **Option B: Manual Selection**
   - Toggle "Manual Team Selection"
   - Search for team members by name or email
   - Filter by role (Primary, Backup, Escalation)
   - Click on members to select/deselect
   - Use "Select All" or "Deselect All" for quick selection
   - Click "Create Incident"

5. **Confirmation:**
   - Success message shows how many members will be notified
   - Incident appears in the incidents list
   - Notifications sent to selected team members

---

## 🐛 Troubleshooting

### Issue: "Failed to create incident"

**Possible Causes & Solutions:**

1. **Server Error (500):**
   - Check browser console for detailed error logs
   - Verify the API endpoint is correct: `https://incident-webhook-api.rapidresponse.workers.dev`
   - Check if backend server is running
   - Verify the request payload format matches API expectations

2. **Missing Required Fields:**
   - Ensure title and description are filled
   - Check that severity is selected

3. **Manual Selection Error:**
   - If "Manual Team Selection" is enabled, at least one user must be selected
   - Toggle back to "Automatic Rotation" if no specific users needed

4. **Authentication Issues:**
   - Verify user is logged in
   - Check localStorage has valid user data
   - Reporter email/username should be available

### Debug Steps:

1. **Open Browser Console (F12)**
   - Look for console.log messages showing:
     - "Creating incident with data: {...}"
     - "Response status: 200" (or error code)
     - "Success response: {...}" (if successful)
     - Error details (if failed)

2. **Check Network Tab:**
   - Find the POST request to `/api/incidents`
   - Check Request Payload
   - Check Response body for error details

3. **Verify API Response:**
   ```javascript
   // Expected successful response format:
   {
     "httpStatus": "OK",
     "message": "Incident created successfully",
     "data": { /* incident object */ }
   }
   ```

### Common Error Messages:

| Error | Cause | Solution |
|-------|-------|----------|
| "Please enter an incident title" | Title field empty | Fill in the title |
| "Please enter an incident description" | Description field empty | Fill in the description |
| "Please select at least one team member" | Manual mode with no users selected | Select users or switch to automatic |
| "Failed to load on-call team data" | API error fetching on-call team | Check API endpoint, refresh page |
| "Failed to create incident" | Server error (500) | Check server logs, verify API is working |

---

## 🔧 Technical Implementation Details

### Component Architecture:

```
CreateIncidentModal
    │
    ├── Step 1: Form Inputs
    │   ├── Title input
    │   ├── Description textarea
    │   ├── Severity buttons
    │   └── Location input
    │
    └── Step 2: Team Notification
        ├── OnCallTeamDisplay
        │   ├── Fetches current on-call team
        │   ├── Displays primary/backup/escalation
        │   └── Shows schedule time range
        │
        └── Team Selection Toggle
            └── TeamMemberSelector (if manual)
                ├── Fetches all team members
                ├── Search functionality
                ├── Role filtering
                └── Selection management
```

### State Management:

```javascript
// Form Data
{
  title: string,
  description: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  location: string,
  bypassRotation: boolean
}

// Team Data
{
  selectedUsers: string[],        // Array of user IDs
  availableUsers: TeamMember[],   // All team members
  onCallTeam: OnCallTeam,         // Current on-call team
}

// UI State
{
  currentStep: 1 | 2,
  isLoading: boolean,
  isLoadingTeams: boolean,
  error: string
}
```

### API Request Format:

```javascript
// Automatic Rotation (default)
{
  "title": "Incident title",
  "description": "Incident description",
  "severity": "high",
  "location": "service-name",
  "reportedBy": "user@example.com"
  // notify_users NOT included - backend uses default rotation
}

// Manual Selection
{
  "title": "Incident title",
  "description": "Incident description",
  "severity": "critical",
  "location": "database-server",
  "reportedBy": "user@example.com",
  "notify_users": ["user-1", "user-2", "user-3"]  // Specific users
}
```

---

## 🎨 UI/UX Features

### Visual Design:
- ✅ Two-step wizard interface
- ✅ Progress indicator
- ✅ Gradient header with icons
- ✅ Color-coded severity buttons
- ✅ Role-based badges (Primary, Backup, Escalation)
- ✅ Avatar initials for team members
- ✅ Search with clear button
- ✅ Filter chips for roles
- ✅ Selection checkboxes with visual feedback
- ✅ Summary counter for selected users
- ✅ Error messages with icon
- ✅ Loading states with spinners
- ✅ Responsive layout

### User Experience:
- ✅ Form validation on each step
- ✅ Can go back to edit previous step
- ✅ Auto-populates reporter from logged-in user
- ✅ Shows current on-call team for context
- ✅ Quick select/deselect all options
- ✅ Real-time search filtering
- ✅ Clear visual indication of selection
- ✅ Informative help text and tooltips
- ✅ Success/error feedback
- ✅ Modal can be closed anytime (ESC key or X button)

---

## 📊 Testing Checklist

### Basic Functionality:
- [ ] Open create incident modal
- [ ] Fill in all required fields
- [ ] Select each severity level
- [ ] Add optional location
- [ ] Proceed to step 2
- [ ] View current on-call team
- [ ] Create incident with automatic rotation
- [ ] Verify success message
- [ ] Check incident appears in list

### Manual Selection:
- [ ] Toggle "Manual Team Selection"
- [ ] View all available team members
- [ ] Search for specific user
- [ ] Filter by role (Primary, Backup, Escalation)
- [ ] Select multiple users
- [ ] Use "Select All"
- [ ] Use "Deselect All"
- [ ] Create incident with manual selection
- [ ] Verify correct users in payload

### Edge Cases:
- [ ] Submit with empty title (should show error)
- [ ] Submit with empty description (should show error)
- [ ] Manual mode with no users selected (should show error)
- [ ] Very long title/description
- [ ] Special characters in title/description
- [ ] No on-call team data available
- [ ] API error handling
- [ ] Network timeout
- [ ] Close modal and reopen (should reset)
- [ ] Multiple rapid clicks on create button

### Browser Compatibility:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile responsive view

---

## 🔐 Security Considerations

- User authentication required
- Reporter automatically set from logged-in user
- User IDs validated on backend
- Input sanitization for title/description
- CORS configured for API endpoints
- No sensitive data in console logs (production)

---

## 📈 Future Enhancements

Potential improvements:
1. **Multi-team Selection:** Allow selecting from multiple teams
2. **Saved Templates:** Save incident templates for quick creation
3. **Attachment Support:** Upload files/screenshots
4. **Draft Incidents:** Save incomplete incidents as drafts
5. **Scheduled Incidents:** Create incidents for future time
6. **Incident Categories:** Add categories/tags
7. **Priority Override:** Override system-determined priority
8. **Custom Notification Message:** Add custom message for notifications
9. **Bulk Creation:** Create multiple related incidents
10. **Integration with Slack/Teams:** Direct integration for notifications

---

## 📝 Code Examples

### Basic Usage in Parent Component:

```jsx
import CreateIncidentModal from './components/CreateIncidentModal';

function IncidentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleIncidentCreated = (newIncident) => {
    console.log('New incident created:', newIncident);
    // Refresh incidents list
    fetchIncidents();
  };

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Create Incident
      </button>

      <CreateIncidentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onIncidentCreated={handleIncidentCreated}
      />
    </>
  );
}
```

### Fetching On-Call Team Manually:

```javascript
const fetchOnCallTeam = async (teamId = 'team-1') => {
  const response = await fetch(
    `https://incident-webhook-api.rapidresponse.workers.dev/api/oncall/current?teamId=${teamId}`
  );
  const data = await response.json();
  return data.object;
};
```

### Creating Incident with API:

```javascript
const createIncident = async (incidentData) => {
  const response = await fetch(
    'https://incident-webhook-api.rapidresponse.workers.dev/api/incidents',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incidentData)
    }
  );
  return await response.json();
};
```

---

## ✅ Implementation Status

**Status:** ✅ **COMPLETE with Enhanced Error Logging**

All components implemented and integrated:
- ✅ CreateIncidentModal with two-step wizard
- ✅ OnCallTeamDisplay component
- ✅ TeamMemberSelector with search/filter
- ✅ Integration with IncidentsPage
- ✅ API integration for on-call team
- ✅ API integration for all teams
- ✅ API integration for incident creation
- ✅ Enhanced error logging and debugging
- ✅ Form validation
- ✅ Error handling

---

## 📅 Implementation Date
October 6, 2025

## 👥 Developed By
GitHub Copilot

---

## 🆘 Support

For issues or questions:
1. Check browser console for error details
2. Verify API endpoints are accessible
3. Check backend server logs
4. Review this documentation
5. Contact development team

**API Base URL:** `https://incident-webhook-api.rapidresponse.workers.dev`

---

**Happy Incident Creating! 🚀**
