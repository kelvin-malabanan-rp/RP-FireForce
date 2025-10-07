# Teams Page Components - Usage Guide

## 🎯 Quick Start

The new Teams Page is ready to use! Here's what you need to know:

## 📦 Available Components

### 1. **SearchInput** - Reusable Search Component
```jsx
import SearchInput from './SearchInput';

<SearchInput 
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Search teams by name or timezone..."
/>
```

**Props:**
- `value` (string) - Current search value
- `onChange` (function) - Callback when value changes
- `placeholder` (string) - Placeholder text (optional)

**Features:**
- ✅ Black text for input
- ✅ Gray-500 placeholder
- Search icon
- Clear button (×)
- Auto-focus support

---

### 2. **TeamCard** - Individual Team Display
```jsx
import TeamCard from './TeamCard';

<TeamCard 
  team={teamObject}
  isMyTeam={true}
  onClick={handleTeamClick}
/>
```

**Props:**
- `team` (object) - Team data object
- `isMyTeam` (boolean) - Whether this is the user's team
- `onClick` (function) - Callback when card is clicked

**Team Object Structure:**
```javascript
{
  id: "team-1",
  name: "Engineering Team",
  timezone: "America/New_York",
  members: [
    {
      id: "user-1",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phoneNumber: "+1-555-1234",
      role: "primary" // or "backup" or "escalation"
    }
  ]
}
```

**Visual Differences:**
- `isMyTeam={true}`: Blue background, blue border, "Your Team" badge
- `isMyTeam={false}`: White background, gray border, hover effect

---

### 3. **TeamSection** - Section Container
```jsx
import TeamSection from './TeamSection';

<TeamSection
  title="My Team"
  subtitle="The team you are currently assigned to"
  teams={[myTeam]}
  isMyTeam={true}
  onTeamClick={handleTeamClick}
  emptyMessage="You are not assigned to any team"
/>
```

**Props:**
- `title` (string) - Section heading
- `subtitle` (string) - Section description (optional)
- `teams` (array) - Array of team objects
- `isMyTeam` (boolean) - Pass to TeamCard components
- `onTeamClick` (function) - Click handler for team cards
- `emptyMessage` (string) - Message when no teams (optional)

**Usage:**
- Use for "My Team" section with `isMyTeam={true}`
- Use for "Other Teams" section with `isMyTeam={false}`

---

### 4. **TeamDetailsModal** - Team Details Popup
```jsx
import TeamDetailsModal from './TeamDetailsModal';

{showModal && (
  <TeamDetailsModal 
    team={selectedTeam}
    onClose={handleCloseModal}
  />
)}
```

**Props:**
- `team` (object) - Full team object with members
- `onClose` (function) - Callback to close modal

**Features:**
- Gradient blue header
- Statistics cards
- Member list with contact info
- Role badges (color-coded)
- Scrollable content
- ESC key to close (future enhancement)
- Click outside to close (future enhancement)

---

## 🔌 API Integration Examples

### Fetching User's Team:
```javascript
import { onCallService } from '../../services/api';

const userId = getCurrentUserId(); // Get from localStorage
const userTeam = await onCallService.getUserTeam(userId);

// Returns:
// {
//   id: "team-1",
//   name: "Engineering Team",
//   timezone: "America/New_York",
//   fullname: "Team description",
//   email: "team@example.com"
// }
```

### Fetching All Teams:
```javascript
import { onCallService } from '../../services/api';

const teams = await onCallService.getTeams();

// Returns array of teams with members:
// [
//   {
//     id: "team-1",
//     name: "Engineering Team",
//     timezone: "America/New_York",
//     members: [...]
//   }
// ]
```

### Complete Data Loading:
```javascript
const loadTeamsData = async () => {
  try {
    // Fetch all teams
    const teams = await onCallService.getTeams();
    
    // Fetch user's team
    const userId = getCurrentUserId();
    let userTeam = null;
    
    if (userId) {
      userTeam = await onCallService.getUserTeam(userId);
      
      // Match with full team data
      if (userTeam?.id) {
        const fullTeam = teams.find(t => t.id === userTeam.id);
        if (fullTeam) userTeam = fullTeam;
      }
    }
    
    setAllTeams(teams);
    setMyTeam(userTeam);
  } catch (error) {
    console.error('Error loading teams:', error);
  }
};
```

---

## 🎨 Styling Guide

### Using Black Text (as requested):
```jsx
// All inputs and text areas
className="... text-black placeholder-gray-500"

// Select dropdowns
className="... text-black"

// Options in dropdowns
<option className="text-black">Option Text</option>
```

### Color Classes Reference:
```css
/* Backgrounds */
bg-white          /* White background */
bg-gray-50        /* Very light gray */
bg-blue-50        /* Very light blue (My Team) */
bg-blue-600       /* Primary blue (buttons) */

/* Text Colors */
text-black        /* Black text (inputs) ✅ */
text-gray-900     /* Near black (headings) */
text-gray-700     /* Dark gray (body) */
text-gray-600     /* Medium gray (secondary) */
text-gray-500     /* Light gray (placeholders) ✅ */

/* Borders */
border-gray-200   /* Light gray border */
border-blue-500   /* Blue border (My Team) */
border-blue-300   /* Light blue (hover) */

/* Role Badges */
bg-green-100 text-green-800  /* Primary */
bg-blue-100 text-blue-800    /* Backup */
bg-purple-100 text-purple-800 /* Escalation */
```

---

## 🔄 Common Patterns

### Pattern 1: Filtering Teams
```javascript
const getFilteredTeams = (teams) => {
  if (!searchTerm) return teams;
  
  return teams.filter(team => 
    team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.timezone?.toLowerCase().includes(searchTerm.toLowerCase())
  );
};
```

### Pattern 2: Separating My Team
```javascript
const getOtherTeams = () => {
  if (!myTeam) return allTeams;
  return allTeams.filter(team => team.id !== myTeam.id);
};
```

### Pattern 3: Getting User ID
```javascript
const getCurrentUserId = () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    const userData = JSON.parse(storedUser);
    return userData.id;
  }
  return null;
};
```

### Pattern 4: Modal Control
```javascript
const [selectedTeam, setSelectedTeam] = useState(null);
const [showModal, setShowModal] = useState(false);

const handleTeamClick = (team) => {
  setSelectedTeam(team);
  setShowModal(true);
};

const handleCloseModal = () => {
  setShowModal(false);
  setSelectedTeam(null);
};
```

---

## 📱 Responsive Grid Setup

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {teams.map(team => (
    <TeamCard key={team.id} team={team} />
  ))}
</div>
```

**Breakpoints:**
- `grid-cols-1`: Mobile (< 768px) - 1 column
- `md:grid-cols-2`: Tablet (≥ 768px) - 2 columns
- `lg:grid-cols-3`: Desktop (≥ 1024px) - 3 columns

---

## 🎯 Complete Example: Custom Implementation

```jsx
import React, { useState, useEffect } from 'react';
import { onCallService } from '../../services/api';
import SearchInput from './SearchInput';
import TeamSection from './TeamSection';
import TeamDetailsModal from './TeamDetailsModal';

const MyCustomTeamsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allTeams, setAllTeams] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      const teams = await onCallService.getTeams();
      const userId = getUserIdFromLocalStorage();
      const userTeam = await onCallService.getUserTeam(userId);
      
      setAllTeams(teams);
      setMyTeam(userTeam);
    };
    
    loadData();
  }, []);

  // Filter teams
  const filteredTeams = allTeams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separate my team from others
  const otherTeams = myTeam 
    ? filteredTeams.filter(t => t.id !== myTeam.id)
    : filteredTeams;

  return (
    <div className="p-6">
      <SearchInput 
        value={searchTerm}
        onChange={setSearchTerm}
      />

      {myTeam && (
        <TeamSection
          title="My Team"
          teams={[myTeam]}
          isMyTeam={true}
          onTeamClick={(team) => {
            setSelectedTeam(team);
            setShowModal(true);
          }}
        />
      )}

      <TeamSection
        title="Other Teams"
        teams={otherTeams}
        onTeamClick={(team) => {
          setSelectedTeam(team);
          setShowModal(true);
        }}
      />

      {showModal && (
        <TeamDetailsModal
          team={selectedTeam}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default MyCustomTeamsPage;
```

---

## ⚠️ Important Notes

1. **User ID**: Always get from localStorage using the pattern shown above
2. **API Errors**: Wrap API calls in try-catch blocks
3. **Loading States**: Show loading spinner while fetching data
4. **Empty States**: Handle cases where user has no team
5. **Search**: Filter both team name and timezone for best UX
6. **Modal**: Only render when showModal is true to avoid performance issues
7. **Team Matching**: Match user's team with full team data from all teams
8. **Black Text**: Always use `text-black` for inputs and `placeholder-gray-500` ✅

---

## 🐛 Troubleshooting

### Problem: User's team not showing
**Solution:** Check that:
- User ID is correctly retrieved from localStorage
- User is assigned to a team in database
- API endpoint `/api/oncall/user/team` is working

### Problem: Teams not loading
**Solution:** Check that:
- API endpoint `/api/oncall/teams` is accessible
- CORS is properly configured
- Network tab shows successful responses

### Problem: Modal not closing
**Solution:** Ensure:
- `onClose` callback is properly wired
- State is being updated correctly
- Click handler is on the close button

### Problem: Search not working
**Solution:** Verify:
- `searchTerm` state is being updated
- Filter function is checking correct fields
- Teams array is not empty

### Problem: Text not black
**Solution:** Add:
- `text-black` class to input elements
- `placeholder-gray-500` for placeholders
- Check Tailwind CSS is compiled correctly

---

## 📚 Additional Resources

- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev/icons
- **React Hooks**: https://react.dev/reference/react

---

**Last Updated**: October 7, 2025
**Components Version**: 1.0
**Status**: Production Ready ✅
