# 🔄 Override vs Escalate - Complete Guide

## 📚 What's the Difference?

### 🔀 **OVERRIDE** - Schedule Replacement (Temporary)
**Purpose**: Temporarily replace someone on the on-call schedule

**Real-World Example**:
> Sarah is scheduled for on-call duty this weekend, but she's going on vacation. John volunteers to cover for her. This is an **OVERRIDE** - John temporarily replaces Sarah in the schedule.

**Key Characteristics**:
- ✅ **Planned** in advance
- ✅ **Temporary** replacement
- ✅ **Voluntary** coverage
- ✅ **Prevents** incidents from reaching the original person
- ✅ Automatically reverts after the override period

**Use Cases**:
- 🏖️ Vacation coverage
- 🏥 Medical leave
- 📅 Training/conferences
- 🎉 Personal events
- 🔄 Schedule swaps

---

### 🚨 **ESCALATE** - Emergency Response (Active Incident)
**Purpose**: Escalate an active incident to higher authority or next level of support

**Real-World Example**:
> John is on-call and receives a critical database alert. He tries to fix it for 10 minutes but can't resolve it. He **ESCALATES** the incident to Sarah (the senior database engineer) for help.

**Key Characteristics**:
- 🚨 **Reactive** to active problems
- 🚨 **Urgent** - happening NOW
- 🚨 **Unable to resolve** at current level
- 🚨 **Adds** more people to help
- 🚨 Incident remains active

**Use Cases**:
- ⏰ Person not responding within timeout
- 🔧 Requires specialized expertise
- 🔥 Severity increased
- 🤝 Multiple people needed
- 🆙 Management awareness required

---

## 📊 Side-by-Side Comparison

| Aspect | **Override** | **Escalate** |
|--------|-------------|-------------|
| **When** | Before an incident | During an incident |
| **Why** | Schedule change | Need help/expertise |
| **Status** | Planned | Emergency |
| **Scope** | Future coverage | Current incident |
| **Duration** | Days/weeks | Immediate |
| **Original Person** | Completely replaced | Still involved or notified |
| **Notification** | Informational | Urgent alert |
| **Revert** | Automatic after end time | Manual resolution |

---

## 🔧 How They Work in Your System

### **Override Flow:**

```
1. Manager creates override
   ↓
2. System saves override record
   ↓
3. During override period:
   - Original person: NOT notified
   - Replacement person: Gets all alerts
   ↓
4. After end time:
   - Override expires
   - Original schedule resumes
```

### **Escalate Flow:**

```
1. Incident occurs
   ↓
2. Primary on-call gets alerted
   ↓
3. If no resolution/response:
   - System or user triggers escalation
   ↓
4. Next level person gets alerted
   ↓
5. Both people now aware
   ↓
6. Incident resolved by either person
```

---

## 🎯 Visual Examples

### Override Example:

**Original Schedule (Oct 5-12):**
```
Mon Tue Wed Thu Fri Sat Sun | Mon Tue Wed
[Sarah][Sarah][Sarah][Sarah][Sarah][Sarah][Sarah] | [Sarah][Sarah][Sarah]
```

**With Override (Oct 10-11 for vacation):**
```
Mon Tue Wed Thu Fri Sat Sun | Mon Tue Wed
[Sarah][Sarah][Sarah][Sarah][Sarah][John][John] | [Sarah][Sarah][Sarah]
                                    ↑ Override period ↑
```

### Escalate Example:

**Incident Timeline:**
```
2:00 PM - 🔥 Critical incident occurs
2:01 PM - 🔔 Alert sent to John (Primary)
2:11 PM - ⏰ No response after 10 minutes
2:11 PM - 🚨 AUTO-ESCALATE to Sarah (Backup)
2:12 PM - ✅ Sarah acknowledges
2:15 PM - 🎯 Incident resolved by Sarah
```

---

## 💻 API Implementation

### 1. **Create Override API**

**Endpoint**: `POST /api/oncall/override`

**When to Use**:
- User clicks calendar day and sets different person
- Create Override button in modal
- Manage vacation/leave requests

**Request Body**:
```json
{
  "teamId": "team-1",
  "startTime": "2025-10-10T00:00:00Z",  // Start of override
  "endTime": "2025-10-12T00:00:00Z",    // End of override
  "userId": "user-2",                    // Person covering (John)
  "role": "primary",                     // Role they're covering
  "reason": "Vacation coverage",         // Why override exists
  "originalUserId": "user-4"             // Person being replaced (Sarah)
}
```

**Response**:
```json
{
  "success": true,
  "message": "Override created successfully",
  "object": {
    "id": "override-123",
    "teamId": "team-1",
    "startTime": "2025-10-10T00:00:00Z",
    "endTime": "2025-10-12T00:00:00Z",
    "replacementUser": {
      "id": "user-2",
      "name": "John Doe"
    },
    "originalUser": {
      "id": "user-4",
      "name": "Sarah Chen"
    },
    "status": "active"
  }
}
```

---

### 2. **Escalate Incident API**

**Endpoint**: `POST /api/oncall/escalate`

**When to Use**:
- "Escalate" button on incident details page
- Auto-escalate after timeout (backend)
- Severity increase triggers escalation

**Request Body**:
```json
{
  "teamId": "team-1",
  "incidentId": "incident-123",
  "reason": "Unable to resolve at current level",
  "priority": "critical",
  "currentLevel": 1                      // Escalating from level 1 to 2
}
```

**Response**:
```json
{
  "success": true,
  "message": "Incident escalated successfully",
  "object": {
    "escalationId": "esc-456",
    "incidentId": "incident-123",
    "escalatedTo": {
      "id": "user-2",
      "name": "Sarah Chen",
      "level": 2
    },
    "escalatedFrom": {
      "id": "user-4",
      "name": "John Doe",
      "level": 1
    },
    "notificationsSent": ["push", "email", "sms"],
    "timestamp": "2025-10-05T14:11:00Z"
  }
}
```

---

## 🎨 UI/UX Integration

### Override Feature Locations:

#### 1. **Interactive Calendar** (Already implemented!)
When user clicks a day and changes the assignment, create an override:

```jsx
const handleSaveSchedule = async (newSchedule) => {
  // Check if this is different from scheduled person
  const originalAssignment = await fetchOriginalSchedule(newSchedule.date);
  
  if (originalAssignment.primary.id !== newSchedule.assignment.primary.id) {
    // This is an override! Call the API
    await createOverride({
      teamId: selectedTeam,
      startTime: newSchedule.date + 'T00:00:00Z',
      endTime: getNextDay(newSchedule.date) + 'T00:00:00Z',
      userId: newSchedule.assignment.primary.id,
      role: 'primary',
      reason: 'Manual schedule change',
      originalUserId: originalAssignment.primary.id
    });
  }
};
```

#### 2. **Create Override Modal** (Already exists!)
The `CreateOverrideModal.jsx` is perfect for this - just needs to be wired up:

```jsx
const handleCreateOverride = async (overrideData) => {
  try {
    const response = await fetch(
      'https://incident-webhook-api.rapidresponse.workers.dev/api/oncall/override',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrideData)
      }
    );
    
    const data = await response.json();
    if (data.success) {
      alert('Override created successfully!');
      fetchSchedule(selectedTeam); // Refresh schedule
    }
  } catch (error) {
    alert('Failed to create override');
  }
};
```

---

### Escalate Feature Locations:

#### 1. **Incident Details Page**
Add "Escalate" button in the actions section:

```jsx
<button 
  onClick={handleEscalate}
  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 
             flex items-center gap-2 font-semibold shadow-md"
>
  <AlertTriangle className="w-4 h-4" />
  Escalate Incident
</button>
```

**Modal for Escalation:**
```jsx
function EscalateModal({ incident, onClose, onEscalate }) {
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState('critical');

  const handleSubmit = async () => {
    await onEscalate({
      teamId: incident.teamId,
      incidentId: incident.id,
      reason: reason,
      priority: priority,
      currentLevel: incident.escalationLevel || 1
    });
    onClose();
  };

  return (
    <Modal>
      <h2>Escalate Incident</h2>
      <p>This will alert the next level on-call person</p>
      
      <label>Priority</label>
      <select value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>

      <label>Reason for Escalation</label>
      <textarea 
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Unable to resolve at current level..."
      />

      <button onClick={handleSubmit}>Escalate Now</button>
      <button onClick={onClose}>Cancel</button>
    </Modal>
  );
}
```

#### 2. **Auto-Escalation Banner**
Show when incident has been escalated:

```jsx
{incident.escalationLevel > 1 && (
  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
    <AlertTriangle className="w-5 h-5 text-orange-600" />
    <div>
      <p className="font-bold text-orange-900">
        Escalated to Level {incident.escalationLevel}
      </p>
      <p className="text-sm text-orange-800">
        {incident.escalationReason}
      </p>
    </div>
  </div>
)}
```

---

## 🔔 Notification Behavior

### Override Notifications:
```
When override is created:
✉️ Original person: "You have been replaced by John for Oct 10-11 (Vacation coverage)"
✉️ Replacement person: "You are now covering for Sarah on Oct 10-11"
✉️ Team lead: "Override created: John covering for Sarah Oct 10-11"

During override period:
🔔 Replacement person: Gets ALL alerts (as if they were scheduled)
⛔ Original person: Gets ZERO alerts (completely replaced)

After override expires:
✅ Original person: "Your on-call duty has resumed"
```

### Escalation Notifications:
```
When escalation happens:
🚨 Next level person: "URGENT: Escalated incident requires your attention"
📧 Original person: "Incident has been escalated to Sarah"
👔 Management: "Incident escalated to Level 2"

Notification content includes:
- Incident details
- Escalation reason
- Current severity
- Time since original alert
- Link to incident page
```

---

## 🏗️ Implementation Plan

### Phase 1: Override Integration
1. ✅ Wire up `CreateOverrideModal` to POST API
2. ✅ Update `handleSaveSchedule` to detect overrides
3. ✅ Show override badges on calendar
4. ✅ List active overrides in sidebar
5. ✅ Allow deleting/editing overrides

### Phase 2: Escalate Integration
1. ✅ Create `EscalateModal` component
2. ✅ Add escalate button to incident details
3. ✅ Show escalation level badge
4. ✅ Display escalation history
5. ✅ Auto-escalate timer (backend)

### Phase 3: Visual Indicators
1. ✅ Override icon on calendar days
2. ✅ Escalation badges on incidents
3. ✅ Timeline showing escalation events
4. ✅ Color coding by level

---

## 📋 Quick Decision Guide

**Ask yourself:**

### "Should I create an OVERRIDE?"
- [ ] Is this BEFORE an incident occurs?
- [ ] Do I need to change who's on-call for specific dates?
- [ ] Is someone unavailable (vacation, sick, etc.)?
- [ ] Do I want to prevent alerts from reaching someone?

**If YES → Use Override**

### "Should I ESCALATE?"
- [ ] Is there an ACTIVE incident right now?
- [ ] Has the primary person not responded?
- [ ] Do we need more expertise/authority?
- [ ] Is the situation getting worse?
- [ ] Has timeout period elapsed?

**If YES → Use Escalate**

---

## 🎓 Examples from Real Life

### Override Examples:

1. **Vacation Coverage**:
   - Sarah: "I'm on vacation Oct 10-12"
   - Action: Create override with John covering
   - Result: John gets all alerts during vacation

2. **Doctor Appointment**:
   - John: "I have surgery Thursday 2-5 PM"
   - Action: Create 3-hour override
   - Result: Marcus covers that specific timeframe

3. **Training Conference**:
   - Team member at 3-day conference
   - Action: Override entire conference period
   - Result: Backup team handles on-call

### Escalate Examples:

1. **No Response**:
   - 2:00 AM: Database crash, alert sent to primary
   - 2:15 AM: No acknowledgment
   - Action: Auto-escalate to backup
   - Result: Backup woken up, fixes issue

2. **Requires Expertise**:
   - Junior dev can't fix memory leak
   - Action: Manual escalate to senior dev
   - Result: Senior helps debug and resolve

3. **Executive Awareness**:
   - Major customer-facing outage
   - Action: Escalate to VP level
   - Result: All hands on deck, management aware

---

## 🚀 Quick Start Implementation

### 1. Add Override Function:

```jsx
// In OnCallSchedulePage.jsx
const createOverride = async (overrideData) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/oncall/override`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrideData)
      }
    );
    
    const data = await response.json();
    if (data.success) {
      console.log('Override created:', data.object);
      fetchSchedule(selectedTeam); // Refresh
      return data.object;
    }
  } catch (error) {
    console.error('Failed to create override:', error);
    throw error;
  }
};
```

### 2. Add Escalate Function:

```jsx
// In IncidentDetailsPage.jsx
const escalateIncident = async (escalationData) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/oncall/escalate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(escalationData)
      }
    );
    
    const data = await response.json();
    if (data.success) {
      console.log('Incident escalated:', data.object);
      // Refresh incident details
      fetchIncident(incidentId);
      return data.object;
    }
  } catch (error) {
    console.error('Failed to escalate:', error);
    throw error;
  }
};
```

---

## ✅ Testing Scenarios

### Override Tests:
- [ ] Create override for future date
- [ ] Override replaces person on calendar
- [ ] Original person not notified during override
- [ ] Replacement person gets alerts
- [ ] Override expires automatically
- [ ] Can delete override before it starts

### Escalate Tests:
- [ ] Escalate from incident details page
- [ ] Next level person gets urgent notification
- [ ] Escalation level increases
- [ ] History shows escalation event
- [ ] Can escalate multiple times
- [ ] Executive level notified on critical

---

**Remember**: 
- **Override** = Proactive schedule management
- **Escalate** = Reactive incident response

Both are essential for robust on-call management! 🎯
