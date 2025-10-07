# Teams Page Visual Guide

## 🎨 Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│  [👥] Teams                                    [🔄 Refresh]  │
│  View and manage all teams in your organization              │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🔍 Search teams by name or timezone...               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  My Team                                                      │
│  The team you are currently assigned to                      │
│                                                               │
│  ┌─────────────────────────────────┐                        │
│  │ [👥] Engineering Team  [Your Team]                       │
│  │                                                           │
│  │ 👥 Members: 12    🕐 Timezone: UTC-5                     │
│  │                                                           │
│  │ 🛡️ 3 Primary  •  4 Backup                                │
│  └─────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Other Teams                                                  │
│  Other teams in your organization                             │
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ DevOps     │  │ Frontend   │  │ Backend    │            │
│  │ Team       │  │ Team       │  │ Team       │            │
│  │            │  │            │  │            │            │
│  │ 👥 8       │  │ 👥 6       │  │ 👥 10      │            │
│  │ 🕐 UTC-8   │  │ 🕐 UTC-5   │  │ 🕐 UTC-5   │            │
│  │            │  │            │  │            │            │
│  │ 🛡️ 2 • 3   │  │ 🛡️ 2 • 2   │  │ 🛡️ 3 • 4   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Component Breakdown

### 1. Header Section
```jsx
┌─────────────────────────────────────────────────────┐
│ [👥 Icon]  Teams                    [🔄 Refresh]   │
│            View and manage all teams...             │
└─────────────────────────────────────────────────────┘
```
- Large title with icon
- Description text
- Refresh button (blue)

### 2. Search Bar (SearchInput Component)
```jsx
┌───────────────────────────────────────────────────┐
│ 🔍 Search teams by name or timezone...        [×] │
└───────────────────────────────────────────────────┘
```
- **Black text** for input ✅
- **Gray placeholder** ✅
- Search icon on left
- Clear button (X) appears when typing
- Blue focus ring

### 3. Team Card - "My Team" (TeamCard Component)
```jsx
┌────────────────────────────────────────────┐
│ 🔵 BLUE BACKGROUND & BORDER                 │
├────────────────────────────────────────────┤
│  [👥] Engineering Team    [Your Team]      │
│                                             │
│  ┌──────────┐  ┌─────────────┐            │
│  │ 👥 12    │  │ 🕐 UTC-5    │            │
│  │ Members  │  │ Timezone    │            │
│  └──────────┘  └─────────────┘            │
│  ─────────────────────────────────         │
│  🛡️ 3 Primary  •  4 Backup                 │
└────────────────────────────────────────────┘
```
- **Blue-50 background** (light blue)
- **Blue-500 border** (medium blue)
- "Your Team" badge
- Statistics grid
- On-call counts

### 4. Team Card - "Other Team" (TeamCard Component)
```jsx
┌────────────────────────────────────────────┐
│ ⚪ WHITE BACKGROUND, GRAY BORDER            │
├────────────────────────────────────────────┤
│  [👥] DevOps Team                          │
│                                             │
│  ┌──────────┐  ┌─────────────┐            │
│  │ 👥 8     │  │ 🕐 UTC-8    │            │
│  │ Members  │  │ Timezone    │            │
│  └──────────┘  └─────────────┘            │
│  ─────────────────────────────────         │
│  🛡️ 2 Primary  •  3 Backup                 │
└────────────────────────────────────────────┘
```
- White background
- Gray border
- Hover effect (border turns blue-300)
- Same stats layout

### 5. Team Details Modal (TeamDetailsModal Component)
```jsx
╔═══════════════════════════════════════════════════╗
║ 🔵 GRADIENT BLUE HEADER                      [×] ║
║ [👥 Icon] Engineering Team                        ║
║            Team Details & Members                 ║
╠═══════════════════════════════════════════════════╣
║                                                    ║
║ ┌─────────┐  ┌─────────┐  ┌─────────┐           ║
║ │ 👥 12   │  │ 🛡️ 3    │  │ 🕐 UTC-5│           ║
║ │ Total   │  │ Primary │  │ Timezone│           ║
║ └─────────┘  └─────────┘  └─────────┘           ║
║                                                    ║
║ Team Members                                       ║
║ ┌────────────────────────────────────────────┐   ║
║ │ 👤 John Doe              [Primary]         │   ║
║ │    📧 john@email.com  📞 555-1234         │   ║
║ └────────────────────────────────────────────┘   ║
║ ┌────────────────────────────────────────────┐   ║
║ │ 👤 Jane Smith            [Backup]          │   ║
║ │    📧 jane@email.com  📞 555-5678         │   ║
║ └────────────────────────────────────────────┘   ║
║                                                    ║
╠═══════════════════════════════════════════════════╣
║                              [Close Button]        ║
╚═══════════════════════════════════════════════════╝
```
- Full-screen overlay (dark background)
- Centered modal with shadow
- Gradient header (blue)
- Statistics cards (colored backgrounds)
- Member cards with contact info
- Role badges (color-coded)
- Scrollable content
- Close button

## 🎨 Color Scheme

### Team Cards:
- **My Team**: `bg-blue-50 border-blue-500`
- **Other Teams**: `bg-white border-gray-200 hover:border-blue-300`

### Role Badges:
```
┌─────────────────────────────────────────┐
│ [Primary]   - Green background          │
│ [Backup]    - Blue background           │
│ [Escalation] - Purple background        │
└─────────────────────────────────────────┘
```

### Status Indicators:
```
● Online  - Green dot
● Away    - Yellow dot
● Offline - Gray dot
```

### Text Colors:
```
- Main headings:   text-gray-900 (black)
- Body text:       text-gray-700
- Muted text:      text-gray-500
- Input text:      text-black ✅
- Placeholder:     text-gray-500 ✅
```

## 📱 Responsive Behavior

### Mobile (< 768px):
```
┌───────────┐
│  My Team  │
└───────────┘
┌───────────┐
│  Team 1   │
└───────────┘
┌───────────┐
│  Team 2   │
└───────────┘
```
**1 column grid**

### Tablet (768px - 1024px):
```
┌───────────┬───────────┐
│  My Team  │           │
└───────────┴───────────┘
┌───────────┬───────────┐
│  Team 1   │  Team 2   │
└───────────┴───────────┘
```
**2 column grid**

### Desktop (> 1024px):
```
┌───────────┬───────────┬───────────┐
│  My Team  │           │           │
└───────────┴───────────┴───────────┘
┌───────────┬───────────┬───────────┐
│  Team 1   │  Team 2   │  Team 3   │
└───────────┴───────────┴───────────┘
```
**3 column grid**

## 🎭 States

### Loading State:
```jsx
┌─────────────────────────────────┐
│                                  │
│         ⟳ Loading teams...      │
│                                  │
└─────────────────────────────────┘
```

### Error State:
```jsx
┌─────────────────────────────────┐
│     ⚠️ Error loading teams       │
│                                  │
│     [Retry Button]              │
└─────────────────────────────────┘
```

### Empty State:
```jsx
┌─────────────────────────────────┐
│         👥                       │
│   No Teams Available            │
│   There are no teams set up...  │
└─────────────────────────────────┘
```

### No Search Results:
```jsx
┌─────────────────────────────────┐
│   No teams match your search    │
└─────────────────────────────────┘
```

## 🔄 Interactions

### 1. Click Team Card:
```
Team Card Click → Modal Opens → Shows Team Details
```

### 2. Search:
```
Type in Search → Real-time Filter → Updates Both Sections
```

### 3. Clear Search:
```
Click [×] → Clears Input → Shows All Teams
```

### 4. Refresh:
```
Click Refresh → Reload Data → Update Display
```

### 5. Close Modal:
```
Click [×] or [Close] → Modal Closes → Return to Main View
```

## 💡 Key Visual Features

1. **Visual Hierarchy**: My Team section is prominent and visually distinct
2. **Consistent Icons**: Same icon style throughout (lucide-react)
3. **Color Coding**: Different colors for roles and status
4. **White Space**: Generous padding and spacing for readability
5. **Hover States**: Interactive elements have hover effects
6. **Focus States**: Form inputs show blue ring on focus
7. **Shadows**: Modal has shadow for depth
8. **Rounded Corners**: All cards and inputs have rounded corners
9. **Transitions**: Smooth color transitions on hover
10. **Responsive**: Adapts seamlessly to all screen sizes

---

**Design System**: Tailwind CSS
**Icon Library**: Lucide React
**Color Palette**: Gray scale + Blue primary + Status colors
**Typography**: System fonts (sans-serif)
