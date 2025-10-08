import { motion } from "framer-motion";
import { useState } from "react";
import { 
  BellRing, 
  UserCircle2, 
  ChevronDown,
  PanelLeftOpen,
  PanelLeftClose,
  Sparkles,
  Settings,
  LogOut,
  Bell
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useNotifications } from "../../hooks/useNotifications";
import { authService } from "../../services";

interface DashboardTopNavProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
  onNavigate?: (page: string) => void;
}

export function DashboardTopNav({ onMenuToggle, isSidebarOpen, onNavigate }: DashboardTopNavProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const user = authService.getCurrentUser();
  const userId = user?.id || localStorage.getItem('userId');
  
  // Debug: Log user data
  console.log('👤 Current user data:', user);
  
  // Get display name from user object
  const getDisplayName = () => {
    if (!user) return 'User';
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    if (user.name) return user.name;
    return user.email?.split('@')[0] || 'User';
  };
  
  // Get user initials from name
  const getUserInitials = () => {
    if (!user) {
      console.log('⚠️ No user found, returning U');
      return 'U';
    }
    
    // Try to get name from user object
    let name = '';
    if (user.firstName && user.lastName) {
      name = `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      name = user.firstName;
    } else if (user.lastName) {
      name = user.lastName;
    } else if (user.name) {
      name = user.name;
    } else {
      name = user.email?.split('@')[0] || 'User';
    }
    
    console.log('📝 Name for initials:', name);
    
    // Split name into words
    const names = name.trim().split(/\s+/).filter(n => n.length > 0);
    
    if (names.length === 0) {
      console.log('⚠️ No valid names, returning U');
      return 'U';
    }
    if (names.length === 1) {
      // Single name: take first 2 characters
      const initials = names[0].slice(0, 2).toUpperCase();
      console.log('✅ Single name initials:', initials);
      return initials;
    }
    
    // Multiple names: take first letter of first and last name
    const firstInitial = names[0][0];
    const lastInitial = names[names.length - 1][0];
    const initials = (firstInitial + lastInitial).toUpperCase();
    console.log('✅ Multi-name initials:', initials, 'from names:', names);
    return initials;
  };
  
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications({ 
    userId: userId || undefined,
    enabled: true 
  });

  const handleNotificationClick = (notificationId: string, incidentId?: string) => {
    markAsRead(notificationId);
    setShowNotifications(false);
    
    if (incidentId && onNavigate) {
      onNavigate(`incident-${incidentId}`);
    }
  };

  const getNotificationIcon = (type: string) => {
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

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Hamburger menu button - visible on all screens */}
        <Button
          variant="ghost"
          size="sm"
          className="mr-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-950 dark:hover:to-red-950 rounded-xl transition-all duration-200"
          onClick={onMenuToggle}
        >
          {isSidebarOpen ? <PanelLeftClose className="h-5 w-5 text-slate-700 dark:text-slate-300" /> : <PanelLeftOpen className="h-5 w-5 text-slate-700 dark:text-slate-300" />}
        </Button>

        {/* FireForce Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center space-x-3"
        >
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-xl bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              FireForce
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">Incident Control</p>
          </div>
        </motion.div>

        {/* Spacer to push right side items to the far right */}
        <div className="flex-1"></div>

        {/* Right side items */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-950 dark:hover:to-red-950 rounded-xl transition-all duration-200"
              >
                <BellRing className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg animate-pulse"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </motion.div>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                      >
                        Mark all read
                      </button>
                    )}
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
                        onClick={() => handleNotificationClick(notification.id, notification.incidentId)}
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
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-11 w-11 rounded-full hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-950 dark:hover:to-red-950 transition-all duration-200">
                <Avatar className="h-11 w-11 shadow-lg border-2 border-orange-500/20">
                  <AvatarImage src={user?.avatar} alt={user?.name || "User"} />
                  <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-base">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-96 border-slate-200 dark:border-slate-700 shadow-xl bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900" align="end" forceMount>
              <DropdownMenuLabel className="font-normal p-5">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16 shadow-lg border-2 border-orange-500/30 ring-2 ring-orange-100 dark:ring-orange-900/30">
                    <AvatarImage src={user?.avatar} alt={user?.name || "User"} />
                    <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-xl">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-2 flex-1">
                    <p className="text-base font-bold leading-tight text-slate-900 dark:text-slate-100 break-words">
                      {getDisplayName()}
                    </p>
                    <p className="text-sm leading-tight text-slate-600 dark:text-slate-400 break-all">
                      {user?.email || 'No email'}
                    </p>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 w-fit">
                      {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-slate-700 dark:text-white">
                <UserCircle2 className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-slate-700 dark:text-white cursor-pointer"
                onClick={() => onNavigate?.('settings')}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 dark:text-red-400 cursor-pointer"
                onClick={() => onNavigate?.('logout')}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}
