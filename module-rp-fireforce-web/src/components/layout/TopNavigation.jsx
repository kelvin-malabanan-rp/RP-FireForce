import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  User, 
  Settings, 
  LogOut, 
  Menu,
  Shield,
  MessageSquare,
  HelpCircle,
  Moon,
  Sun,
  ChevronDown,
  Activity,
  Zap,
  Globe,
  Volume2,
  Monitor
} from 'lucide-react';
import useEnhancedNotifications from '../../hooks/useEnhancedNotifications';
import NotificationSettings from '../NotificationSettings';

const TopNavigation = ({ user, onLogout, toggleSidebar, collapsed, onNavigateToSettings, onNavigateToIncident }) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  
  const userDropdownRef = useRef(null);
  const notificationRef = useRef(null);

  // Use enhanced notifications hook with browser notifications and sounds
  const userId = user?.id || localStorage.getItem('userId') || 'user-1';
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    refresh,
    isBrowserNotificationSupported,
    browserPermission,
    requestBrowserPermission,
    soundEnabled,
    toggleSound
  } = useEnhancedNotifications(userId);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for notification clicks from browser notifications
  useEffect(() => {
    const handleNotificationClick = (event) => {
      const { incidentId } = event.detail;
      if (incidentId && onNavigateToIncident) {
        onNavigateToIncident(incidentId);
      }
    };

    window.addEventListener('notificationClick', handleNotificationClick);
    return () => window.removeEventListener('notificationClick', handleNotificationClick);
  }, [onNavigateToIncident]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'critical':
        return <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>;
      case 'warning':
        return <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/50"></div>;
      case 'success':
        return <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>;
      default:
        return <div className="w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>;
    }
  };

  const handleLogout = () => {
    setShowUserDropdown(false);
    onLogout();
  };

  const handleAccountSettings = () => {
    setShowUserDropdown(false);
    if (onNavigateToSettings) {
      onNavigateToSettings();
    }
  };

  // Handle notification click - navigate to incident
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setShowNotifications(false);
    
    // Navigate to the incident details page
    if (onNavigateToIncident && notification.incidentId) {
      onNavigateToIncident(notification.incidentId);
    }
  };

  // Handle mark all as read
  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm relative">
      {/* Alignment indicator with sidebar */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200"></div>
      <div className={`flex items-center justify-between py-4 ${collapsed ? 'pl-20' : 'pl-72'} pr-6`}>
        {/* Left Section */}
        <div className="flex items-center space-x-6">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200 text-gray-600 hover:text-gray-800"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search incidents, teams, or schedules..."
              className="pl-12 pr-6 py-3 w-80 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all duration-200 placeholder:text-gray-400 text-gray-900"
            />
            {searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                <div className="p-4">
                  <p className="text-sm text-gray-500">No results found for "{searchQuery}"</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200 text-gray-600 hover:text-gray-800"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </div>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {/* Notification Status Indicators */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Browser Notification Status */}
                    {isBrowserNotificationSupported && (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        browserPermission === 'granted' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Monitor className="w-3 h-3" />
                        {browserPermission === 'granted' ? 'Desktop On' : 'Desktop Off'}
                      </div>
                    )}
                    {/* Sound Status */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      soundEnabled 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Volume2 className="w-3 h-3" />
                      {soundEnabled ? 'Sound On' : 'Sound Off'}
                    </div>
                    {/* Settings Button */}
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        setShowNotificationSettings(true);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <Settings className="w-3 h-3" />
                      Settings
                    </button>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No notifications yet</p>
                      <p className="text-gray-400 text-xs mt-1">You'll be notified of new incidents and comments</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${
                          notification.unread ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              {notification.category === 'comment' && (
                                <MessageSquare className="w-3 h-3 text-blue-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1 leading-relaxed line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {notification.time}
                            </p>
                          </div>
                          {notification.unread && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <div className="p-4 border-t border-gray-200">
                    <button 
                      onClick={refresh}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 rounded-lg hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <Activity className="w-4 h-4" />
                      Refresh Notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
            >
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              {!collapsed && (
                <div className="text-left min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.name || 'Administrator'}
                  </p>
                  <p className="text-xs text-gray-500 truncate" title={user?.role}>
                    {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                  </p>
                </div>
              )}
              <ChevronDown className="w-4 h-4 text-gray-500 hover:text-gray-700 transition-colors" />
            </button>

            {/* User Dropdown */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.firstName && user?.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user?.name || 'Administrator'}
                      </p>
                      <p className="text-xs text-gray-500 break-all" title={user?.email || 'admin@fireforce.com'}>
                        {user?.email || 'admin@fireforce.com'}
                      </p>
                      <p className="text-xs text-blue-600 font-medium mt-1">
                        {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-green-600">Online</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  <button 
                    onClick={handleAccountSettings}
                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Account Settings
                  </button>
                </div>

                <div className="border-t border-gray-200 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <NotificationSettings
          isBrowserNotificationSupported={isBrowserNotificationSupported}
          browserPermission={browserPermission}
          requestBrowserPermission={requestBrowserPermission}
          soundEnabled={soundEnabled}
          toggleSound={toggleSound}
          onClose={() => setShowNotificationSettings(false)}
        />
      )}
    </header>
  );
};

export default TopNavigation;
  