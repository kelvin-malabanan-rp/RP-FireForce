# RP-FireForce

A modern emergency response dashboard built with React and Tailwind CSS, designed for fire department and emergency se# RP-FireForce Emergency Response Dashboard

A comprehensive emergency response and alert monitoring system built with React and modern web technologies.

## 🚨 Features

- **Real-time Alert Monitoring** - Track incidents and emergencies as they happen
- **Analytics Dashboard** - Comprehensive metrics and reporting
- **On-Call Management** - Schedule and manage emergency response teams
- **Service Catalog** - Monitor and manage critical services
- **Incident Tracking** - Full incident lifecycle management
- **Responsive Design** - Works on desktop and mobile devices

## 🛠️ Technology Stack

- **React 19.1.1** - Modern UI framework
- **Vite 7.1.7** - Fast build tool and dev server
- **Tailwind CSS 4.0** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Date-fns** - Date manipulation utilities

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── SidebarNavigation.jsx
│   ├── TopNavigation.jsx
│   ├── Charts.jsx
│   ├── AlertModal.jsx
│   └── ...
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── assets/             # Static assets
```perations.

## Features

### � **Emergency Response Ready**
- Modern React architecture with hooks
- TypeScript-ready structure
- Optimized build process with Vite
- Responsive design for all devices
- Performance optimized components

### 🎨 **Professional Design**
- Dark theme optimized for emergency operations
- Professional UI with Tailwind CSS
- Smooth animations and transitions
- Consistent design system
- Modern iconography with Lucide React

### 📊 **Dashboard Features**
- **Real-time Alert Monitoring**: View all system alerts in one place
- **Advanced Filtering**: Filter by type, status, severity, and source
- **Search Functionality**: Real-time search across all alert fields
- **Alert Statistics**: Visual overview with charts and metrics
- **System Health Score**: Real-time system health monitoring
- **Alert Management**: Create, edit, and resolve alerts
- **Pagination**: Efficient handling of large alert datasets

### 🔧 **Technical Features**
- **Responsive Layout**: Mobile-first design that works on all devices
- **Dark/Light Theme Ready**: Easy theme switching capability
- **Local Storage**: Persistent user preferences
- **Export Functionality**: Export alerts to CSV
- **Keyboard Shortcuts**: Improved workflow with keyboard navigation
- **Accessibility**: WCAG 2.1 compliant

## Technology Stack

- **Frontend**: React 18, JSX
- **Styling**: Tailwind CSS v3
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Utilities**: clsx for conditional styling

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd alert-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production build will be created in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
alert-dashboard/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.jsx    # Main dashboard component
│   │   ├── Header.jsx       # Navigation header
│   │   ├── Sidebar.jsx      # Filter sidebar
│   │   ├── AlertList.jsx    # Alert list display
│   │   ├── AlertStats.jsx   # Statistics components
│   │   ├── AlertModal.jsx   # Alert details modal
│   │   └── FilterPanel.jsx  # Advanced filtering
│   ├── hooks/               # Custom React hooks
│   │   └── index.js         # Utility hooks
│   ├── utils/               # Utility functions
│   │   └── helpers.js       # Helper functions
│   ├── App.jsx             # Main App component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── public/                  # Static assets
├── tailwind.config.js      # Tailwind configuration
├── vite.config.js          # Vite configuration
└── package.json           # Dependencies
```

## Customization

### Theme Colors

The dashboard uses a custom blue theme. To modify colors, edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#119fda', // Main blue color
        // ... other shades
      }
    }
  }
}
```

---

**Built with ❤️ using React and Tailwind CSS**+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
