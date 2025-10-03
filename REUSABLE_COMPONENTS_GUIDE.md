# 🛠️ Reusable Components Library

## Overview
This document describes all reusable components created for the RP-FireForce application.

---

## 📦 Component List

### 1. **Pagination**
Location: `/src/components/Pagination.jsx`

**Purpose**: Provides pagination controls for large data sets with page navigation and quick jumper.

**Props**:
```javascript
{
  currentPage: number,          // Current active page (1-indexed)
  totalPages: number,            // Total number of pages
  totalItems: number,            // Total number of items
  itemsPerPage: number,          // Items shown per page
  onPageChange: function,        // Callback when page changes
  showQuickJumper: boolean      // Show "Go to page" input (default: true)
}
```

**Usage Example**:
```jsx
import Pagination from '../../components/Pagination';

<Pagination
  currentPage={currentPage}
  totalPages={Math.ceil(items.length / itemsPerPage)}
  totalItems={items.length}
  itemsPerPage={10}
  onPageChange={(page) => setCurrentPage(page)}
  showQuickJumper={true}
/>
```

**Features**:
- ✅ First/Previous/Next/Last page buttons
- ✅ Numbered page buttons with smart ellipsis
- ✅ Quick jump to specific page (for 10+ pages)
- ✅ Disabled states for boundary pages
- ✅ Shows item range (e.g., "Showing 1-10 of 100")
- ✅ Fully responsive design

---

### 2. **StatusBadge**
Location: `/src/components/StatusBadge.jsx`

**Purpose**: Displays incident status with color-coded badge and icon.

**Props**:
```javascript
{
  status: string,    // Status text: 'Open', 'Investigating', 'Resolved', 'Escalated'
  size: string      // Size: 'sm', 'md' (default), 'lg'
}
```

**Usage Example**:
```jsx
import StatusBadge from '../../components/StatusBadge';

<StatusBadge status="Investigating" size="md" />
<StatusBadge status="Resolved" size="sm" />
```

**Features**:
- ✅ Color-coded by status (Red=Open, Blue=Investigating, Green=Resolved, Purple=Escalated)
- ✅ Includes relevant icon for each status
- ✅ Three size variants
- ✅ Consistent styling across app

---

### 3. **SeverityBadge**
Location: `/src/components/SeverityBadge.jsx`

**Purpose**: Displays incident severity level with bold color coding.

**Props**:
```javascript
{
  severity: string,  // Severity: 'Low', 'Medium', 'High', 'Critical'
  size: string      // Size: 'sm', 'md' (default), 'lg'
}
```

**Usage Example**:
```jsx
import SeverityBadge from '../../components/SeverityBadge';

<SeverityBadge severity="Critical" size="md" />
<SeverityBadge severity="High" size="sm" />
```

**Features**:
- ✅ Color-coded: Critical=Red, High=Orange, Medium=Yellow, Low=Green
- ✅ Bold font weight for emphasis
- ✅ Three size variants
- ✅ White text on colored background

---

### 4. **LoadingSpinner**
Location: `/src/components/LoadingSpinner.jsx`

**Purpose**: Shows loading state with animated spinner and optional text.

**Props**:
```javascript
{
  size: string,       // Size: 'sm', 'md' (default), 'lg', 'xl'
  color: string,      // Tailwind color class (default: 'text-blue-600')
  text: string,       // Optional loading text
  fullScreen: boolean // Cover entire screen (default: false)
}
```

**Usage Example**:
```jsx
import LoadingSpinner from '../../components/LoadingSpinner';

// Inline spinner
<LoadingSpinner size="md" text="Loading incidents..." />

// Full screen spinner
<LoadingSpinner size="lg" text="Please wait..." fullScreen={true} />

// Small inline
<LoadingSpinner size="sm" />
```

**Features**:
- ✅ Animated rotation
- ✅ Optional text label
- ✅ Inline or full-screen mode
- ✅ Customizable size and color
- ✅ Lucide React icons

---

### 5. **EmptyState**
Location: `/src/components/EmptyState.jsx`

**Purpose**: Displays friendly empty state when no data is available.

**Props**:
```javascript
{
  icon: Component,     // Lucide icon component (default: AlertTriangle)
  title: string,       // Main heading (default: 'No data found')
  description: string, // Supporting text
  action: ReactNode,   // Optional action button
  iconColor: string   // Icon color class (default: 'text-gray-400')
}
```

**Usage Example**:
```jsx
import EmptyState from '../../components/EmptyState';
import { Inbox, Plus } from 'lucide-react';

<EmptyState
  icon={Inbox}
  title="No incidents found"
  description="Try adjusting your filters or search terms"
  action={
    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
      <Plus className="w-4 h-4 inline mr-2" />
      Create Incident
    </button>
  }
  iconColor="text-blue-400"
/>
```

**Features**:
- ✅ Customizable icon
- ✅ Clean, centered design
- ✅ Optional call-to-action
- ✅ Responsive layout

---

### 6. **Modal**
Location: `/src/components/Modal.jsx`

**Purpose**: Reusable modal/dialog component with header, content, and footer.

**Props**:
```javascript
{
  isOpen: boolean,        // Controls visibility
  onClose: function,      // Close callback
  title: string,          // Modal title
  subtitle: string,       // Optional subtitle
  children: ReactNode,    // Modal content
  footer: ReactNode,      // Optional footer buttons
  size: string,           // Size: 'sm', 'md', 'lg' (default), 'xl', 'full'
  closeOnOverlay: boolean,// Close on background click (default: true)
  headerColor: string    // Header background color (default: 'bg-gray-50')
}
```

**Usage Example**:
```jsx
import Modal from '../../components/Modal';

<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Edit Incident"
  subtitle="Update incident details"
  size="lg"
  footer={
    <>
      <button onClick={() => setIsModalOpen(false)}>Cancel</button>
      <button onClick={handleSave}>Save Changes</button>
    </>
  }
>
  <form>
    {/* Form content */}
  </form>
</Modal>
```

**Features**:
- ✅ Backdrop overlay with blur
- ✅ Close on overlay click (optional)
- ✅ Close button in header
- ✅ Five size options
- ✅ Optional footer
- ✅ Scrollable content
- ✅ Responsive design

---

## 🎨 Component Usage Guidelines

### **When to Use Each Component**

#### **Pagination**
- Lists with more than 10-20 items
- Tables with many rows
- Search results
- Any large data set that needs to be split into pages

#### **StatusBadge**
- Incident status display
- Workflow status indicators
- Any state that needs visual emphasis with an icon

#### **SeverityBadge**
- Priority levels
- Alert levels
- Risk indicators
- Any severity/urgency classification

#### **LoadingSpinner**
- API calls in progress
- Data fetching
- Form submissions
- Page transitions

#### **EmptyState**
- Empty lists or tables
- No search results
- Filtered data with no matches
- First-time user experiences

#### **Modal**
- Forms that need focus
- Confirmation dialogs
- Detail views
- Multi-step workflows

---

## 🔧 Integration with Incidents Page

### **Current Implementation**

The incidents page now uses:

1. **Pagination** - Bottom of card/list views
   - Shows 9 incidents per page (3x3 grid for cards)
   - Smart page numbers with ellipsis
   - First/Last/Prev/Next navigation
   - Quick jumper for 10+ pages

2. **StatusBadge** - Incident cards and list rows
   - Consistent status display
   - Icon + text combination

3. **SeverityBadge** - Incident cards and list rows
   - Clear severity indication
   - High contrast colors

4. **LoadingSpinner** - Main loading state
   - Shown while fetching incidents
   - Centered with descriptive text

5. **EmptyState** - No incidents found
   - Friendly message
   - Helpful suggestions

---

## 🚀 Future Component Ideas

### **Suggested Additional Components**

1. **SearchBar** - Reusable search input with icon
2. **FilterDropdown** - Multi-select filter component
3. **StatCard** - Dashboard statistics cards
4. **ActionMenu** - Dropdown menu for row actions
5. **Toast/Notification** - Success/error messages
6. **Tabs** - Tab navigation component
7. **DatePicker** - Date range selector
8. **FileUpload** - Drag-and-drop file upload
9. **Avatar** - User avatar with fallback initials
10. **Breadcrumb** - Navigation breadcrumb trail

---

## 📝 Best Practices

### **Component Design Principles**

✅ **Single Responsibility**: Each component does one thing well
✅ **Prop Flexibility**: Accept props for customization
✅ **Default Values**: Provide sensible defaults
✅ **Documentation**: Clear prop descriptions and examples
✅ **Accessibility**: Keyboard navigation, ARIA labels
✅ **Responsive**: Mobile-first, works on all screen sizes
✅ **Consistent**: Follow design system colors and spacing
✅ **Reusable**: Can be used in multiple contexts

### **Naming Conventions**

- Components: **PascalCase** (e.g., `StatusBadge`)
- Props: **camelCase** (e.g., `isOpen`, `onClose`)
- Files: **PascalCase.jsx** (e.g., `LoadingSpinner.jsx`)
- CSS Classes: **kebab-case** (e.g., `bg-blue-600`)

### **File Organization**

```
src/
├── components/          # Reusable components
│   ├── Pagination.jsx
│   ├── StatusBadge.jsx
│   ├── SeverityBadge.jsx
│   ├── LoadingSpinner.jsx
│   ├── EmptyState.jsx
│   └── Modal.jsx
├── pages/              # Page components
│   ├── incidents/
│   ├── oncall/
│   └── settings/
└── utils/              # Helper functions
```

---

## 🎯 Testing Your Components

### **Quick Test Checklist**

For each component, verify:

- [ ] Renders correctly with default props
- [ ] Handles all prop variations
- [ ] Responds to user interactions
- [ ] Works on mobile/tablet/desktop
- [ ] Handles edge cases (null, empty, large data)
- [ ] No console errors or warnings
- [ ] Accessible (keyboard, screen readers)

---

## 📚 Additional Resources

- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev/icons
- **React Docs**: https://react.dev

---

**Last Updated**: October 4, 2025
**Version**: 1.0.0
