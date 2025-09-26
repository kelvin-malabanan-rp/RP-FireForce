import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Calendar, 
  AlertTriangle, 
  Server, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  User
} from 'lucide-react';
import Dashboard from './Dashboard';
import AnalyticsView from './AnalyticsView';
import IncidentsView from './IncidentsView';
import OnCallView from './OnCallView';
import ScheduleView from './ScheduleView';
import ServicesView from './ServicesView';
import SettingsView from './SettingsView';

const AppLayout = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Keyboard shortcut for toggling sidebar (Ctrl/Cmd + B)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, badge: null },
    { id: 'oncall', label: 'On-Call', icon: Users, badge: 3 },
    { id: 'schedule', label: 'Schedule', icon: Calendar, badge: null },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, badge: 12 },
    { id: 'services', label: 'Services', icon: Server, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`
        relative flex flex-col bg-white border-r border-gray-200 transition-all duration-300 shadow-sm
        ${isSidebarCollapsed ? 'w-16' : 'w-64'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isSidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">RP-FireForce</h2>
                <p className="text-xs text-gray-500">Emergency Response</p>
              </div>
            </div>
          )}
          
          {isSidebarCollapsed && (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
          )}
          
          {!isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              title="Collapse sidebar (Ctrl+B)"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Expand Button for Collapsed State */}
        {isSidebarCollapsed && (
          <div className="absolute -right-3 top-4 z-10">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="w-6 h-6 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-md transition-colors"
              title="Expand sidebar (Ctrl+B)"
            >
              <ChevronRight className="h-4 w-4 text-white" />
            </button>
          </div>
        )}
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`
                  w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }
                  ${isSidebarCollapsed ? 'justify-center px-2' : 'justify-start'}
                `}
              >
                <IconComponent className={`
                  h-5 w-5 flex-shrink-0
                  ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'}
                `} />
                
                {!isSidebarCollapsed && (
                  <span className="ml-3 font-medium text-sm">{item.label}</span>
                )}
                
                {!isSidebarCollapsed && item.badge && (
                  <span className="ml-auto bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
                
                {/* Tooltip for collapsed state */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                    {item.label}
                    {item.badge && (
                      <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-gray-200 p-4">
          {!isSidebarCollapsed ? (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">John Smith</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 capitalize">
                  {activeView}
                </h1>
                <p className="text-sm text-gray-600">
                  {activeView === 'dashboard' && 'System Overview & Monitoring'}
                  {activeView === 'analytics' && 'Performance Analytics & Insights'}
                  {activeView === 'oncall' && 'On-Call Schedule Management'}
                  {activeView === 'schedule' && 'Event & Maintenance Calendar'}
                  {activeView === 'incidents' && 'Incident Response Center'}
                  {activeView === 'services' && 'Service Status & Health'}
                  {activeView === 'settings' && 'System Configuration'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Status Indicator */}
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">All Systems Operational</span>
              </div>
              
              {/* Notifications */}
              <button className="relative p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <Bell className="h-5 w-5 text-gray-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
              </button>
              
              {/* User Menu */}
              <button className="flex items-center space-x-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">John Doe</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {activeView === 'dashboard' && <Dashboard />}
            {activeView === 'analytics' && <AnalyticsView />}
            {activeView === 'oncall' && <OnCallView />}
            {activeView === 'schedule' && <ScheduleView />}
            {activeView === 'incidents' && <IncidentsView />}
            {activeView === 'services' && <ServicesView />}
            {activeView === 'settings' && <SettingsView />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
