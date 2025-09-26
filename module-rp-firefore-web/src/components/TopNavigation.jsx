import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  User, 
  Settings, 
  ChevronDown,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  HelpCircle,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';

const TopNavigation = ({ activeView }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const notifications = [
    {
      id: 1,
      type: 'alert',
      title: 'Database connection pool exhausted',
      time: '2 minutes ago',
      severity: 'critical'
    },
    {
      id: 2,
      type: 'resolved',
      title: 'SSL certificate renewed successfully',
      time: '15 minutes ago',
      severity: 'success'
    },
    {
      id: 3,
      type: 'warning',
      title: 'High CPU usage on server-01',
      time: '1 hour ago',
      severity: 'warning'
    }
  ];

  const getViewTitle = (view) => {
    const titles = {
      dashboard: 'Dashboard Overview',
      analytics: 'Analytics & Insights',
      oncall: 'On-Call Management',
      schedule: 'Schedule Management',
      incidents: 'Incident Management',
      services: 'Service Health',
      settings: 'System Settings'
    };
    return titles[view] || 'Dashboard';
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Bell className="w-4 h-4 text-surface-500" />;
    }
  };

  return (
    <header className="bg-white border-b border-surface-200 px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Left Section - Page Title */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-semibold text-surface-900">{getViewTitle(activeView)}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-2 h-2 bg-success-500 rounded-full"></div>
              <span className="text-sm text-surface-600">All systems operational</span>
            </div>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="w-5 h-5 text-surface-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search alerts, services, or incidents..."
              className="w-full pl-10 pr-4 py-2.5 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>
        </div>

        {/* Right Section - Actions and Profile */}
        <div className="flex items-center space-x-4">
          {/* Quick Action Button */}
          <button className="bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Alert</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 hover:bg-surface-100 rounded-xl transition-colors relative"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-surface-600" />
            ) : (
              <Moon className="w-5 h-5 text-surface-600" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 hover:bg-surface-100 rounded-xl transition-colors relative"
            >
              <Bell className="w-5 h-5 text-surface-600" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications.length}
              </div>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-surface-200 rounded-xl shadow-lg z-50">
                <div className="p-4 border-b border-surface-200">
                  <h3 className="font-semibold text-surface-900">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="p-4 border-b border-surface-100 hover:bg-surface-50 transition-colors">
                      <div className="flex items-start space-x-3">
                        {getSeverityIcon(notification.severity)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-surface-900">{notification.title}</p>
                          <p className="text-xs text-surface-500 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-surface-200">
                  <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 hover:bg-surface-100 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-surface-900">John Doe</div>
                <div className="text-xs text-surface-500">Admin</div>
              </div>
              <ChevronDown className="w-4 h-4 text-surface-500" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-surface-200 rounded-xl shadow-lg z-50">
                <div className="p-4 border-b border-surface-200">
                  <div className="font-medium text-surface-900">John Doe</div>
                  <div className="text-sm text-surface-500">john.doe@company.com</div>
                </div>
                <div className="py-2">
                  <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors">
                    <Settings className="w-4 h-4" />
                    <span>Preferences</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors">
                    <HelpCircle className="w-4 h-4" />
                    <span>Help & Support</span>
                  </button>
                </div>
                <div className="border-t border-surface-200 py-2">
                  <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavigation;
