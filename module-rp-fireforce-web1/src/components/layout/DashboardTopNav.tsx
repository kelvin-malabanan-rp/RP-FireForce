import { motion } from "framer-motion";
import { useState } from "react";
import { 
  BellRing, 
  SearchCheck, 
  UserCircle2, 
  ChevronDown,
  PanelLeftOpen,
  PanelLeftClose,
  Sparkles
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
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

interface DashboardTopNavProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

export function DashboardTopNav({ onMenuToggle, isSidebarOpen }: DashboardTopNavProps) {
  const [notificationCount] = useState(3);

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
          className="flex items-center space-x-3 mr-6"
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

        {/* Search Bar */}
        <div className="flex-1 max-w-md mr-4">
          <div className="relative">
            <SearchCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 h-4 w-4" />
            <Input
              type="search"
              placeholder="Search incidents, teams, alerts..."
              className="pl-10 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Right side items */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-950 dark:hover:to-red-950 rounded-xl transition-all duration-200"
            >
              <BellRing className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              {notificationCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg animate-pulse"
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>
          </motion.div>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-950 dark:hover:to-red-950 transition-all duration-200">
                <Avatar className="h-10 w-10 shadow-lg">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                  <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold">
                    JD
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 border-slate-200 dark:border-slate-700 shadow-lg bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900" align="end" forceMount>
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12 shadow-lg">
                    <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                    <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none text-slate-800 dark:text-slate-200">John Doe</p>
                    <p className="text-xs leading-none text-slate-600 dark:text-slate-400">
                      john.doe@fireforce.com
                    </p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      Senior SRE
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-slate-700 dark:text-white">
                <UserCircle2 className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-700 dark:text-white">
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 dark:text-red-400">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}
