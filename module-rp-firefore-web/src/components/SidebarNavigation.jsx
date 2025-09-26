import React from 'react';
import { 
  BarChart3, 
  Calendar, 
  Settings, 
  Users, 
  ChevronLeft,
  ChevronRight,
  Home,
  AlertTriangle,
  Layers3
} from 'lucide-react';

const SidebarNavigation = ({ activeView, setActiveView, isCollapsed, setIsCollapsed }) => {
  const navigationItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: Home
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: BarChart3
    },
    { 
      id: 'incidents', 
      label: 'Incidents', 
      icon: AlertTriangle
    },
    { 
      id: 'services', 
      label: 'Services', 
      icon: Layers3
    },
    { 
      id: 'on-call', 
      label: 'On-Call', 
      icon: Users
    },
    { 
      id: 'schedule', 
      label: 'Schedule', 
      icon: Calendar
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings
    }
  ];

  return (
    <div className={`
      ${isCollapsed ? 'w-20' : 'w-64'} 
      bg-slate-900 
      text-white 
      h-screen 
      transition-all 
      duration-300 
      flex 
      flex-col
      border-r
      border-slate-700
    `}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <AlertTriangle size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">RP-FireForce</h1>
                <p className="text-xs text-slate-400">Emergency Response</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
              <AlertTriangle size={18} className="text-white" />
            </div>
          )}
        </div>
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mt-4 w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight size={20} className="text-slate-400" />
          ) : (
            <ChevronLeft size={20} className="text-slate-400" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`
                  w-full
                  flex
                  items-center
                  p-3
                  rounded-lg
                  transition-all
                  duration-200
                  group
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center' : 'justify-start space-x-3'}
                `}
              >
                <IconComponent size={20} className="flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800">
            <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">JS</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">John Smith</p>
              <p className="text-xs text-slate-400 truncate">Administrator</p>
            </div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">JS</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarNavigation;
