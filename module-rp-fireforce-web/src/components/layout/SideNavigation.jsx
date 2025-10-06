import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  AlertTriangle, 
  Calendar, 
  Users, 
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Flame,
  Menu
} from 'lucide-react';

const SideNavigation = ({ activeTab, setActiveTab, collapsed, setCollapsed }) => {
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      path: '/analytics'
    },
    {
      id: 'incidents',
      label: 'Incidents',
      icon: AlertTriangle,
      path: '/incidents',
      badge: 3
    },
    {
      id: 'oncall-schedule',
      label: 'On-Call Schedule',
      icon: Calendar,
      path: '/oncall-schedule'
    },
    {
      id: 'teams',
      label: 'Teams',
      icon: Users,
      path: '/teams'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings'
    }
  ];

  const handleItemClick = (item) => {
    setActiveTab(item.id);
  };

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-64'} flex flex-col h-screen relative shadow-lg`}>
      {/* Header */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-4 border-b border-gray-200`}>
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md p-1 border border-gray-200">
              <img 
                src="/logo.png" 
                alt="FireForce Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback to flame icon if logo doesn't load
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded items-center justify-center hidden">
                <Flame className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">FireForce</h1>
              <p className="text-xs text-gray-500">Emergency Response</p>
            </div>
          </div>
        )}
        
        {collapsed && (
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md p-1 border border-gray-200">
            <img 
              src="/logo.png" 
              alt="FireForce Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback to flame icon if logo doesn't load
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded items-center justify-center hidden">
              <Flame className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <div className={`p-4 ${collapsed ? 'px-2' : 'px-4'}`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center justify-center p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200 text-gray-600 hover:text-gray-800 ${collapsed ? 'px-2' : 'px-3'}`}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <Menu className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Menu</span>
            </>
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-3'}`}>
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id} className="relative group">
                <button
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center ${collapsed ? 'justify-center px-2 py-3' : 'px-3 py-3'} rounded-lg text-left transition-all duration-200 relative ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-blue-50'
                  }`}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full"></div>
                  )}
                  
                  {/* Icon */}
                  <div className={`flex items-center justify-center ${collapsed ? 'w-6 h-6' : 'w-6 h-6 mr-3'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  {!collapsed && (
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {item.label}
                      </span>
                      
                      {item.badge && (
                        <div className="flex items-center justify-center min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full px-2">
                          {item.badge}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {collapsed && item.badge && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{item.badge}</span>
                    </div>
                  )}
                </button>
                
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap shadow-lg">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className={`${collapsed ? 'p-2' : 'p-4'} border-t border-gray-200 mt-auto`}>
        {!collapsed ? (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 p-2 bg-green-50 rounded-lg border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-600">System Online</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Version 2.1.0</p>
              <p className="text-xs text-gray-400">© 2025 FireForce</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SideNavigation;
