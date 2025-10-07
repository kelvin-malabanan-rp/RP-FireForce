import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp,
  Shield,
  Users,
  Cog,
  LogOut,
  Flame,
  Activity,
  Command,
  Radar,
  Crown,
  Sparkles
} from "lucide-react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { cn } from "../../lib/utils";

interface SideNavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  isActive?: boolean;
}

interface DashboardSideNavProps {
  isOpen: boolean;
  onNavigate: (page: string) => void;
  onToggle: () => void;
  currentPage: string;
}

export function DashboardSideNav({ isOpen, onNavigate, onToggle, currentPage }: DashboardSideNavProps) {
  const navigationItems: SideNavItem[] = [
    {
      title: "Dashboard",
      icon: Command,
      href: "dashboard",
      isActive: currentPage === "dashboard"
    },
    {
      title: "Analytics",
      icon: TrendingUp,
      href: "analytics",
      isActive: currentPage === "analytics"
    },
    {
      title: "Incidents",
      icon: Flame,
      href: "incidents",
      isActive: currentPage === "incidents"
    },
    {
      title: "On-Call",
      icon: Shield,
      href: "on-call",
      isActive: currentPage === "on-call"
    },
    {
      title: "Teams",
      icon: Users,
      href: "teams",
      isActive: currentPage === "teams"
    }
  ];

  const bottomItems: SideNavItem[] = [
    {
      title: "Settings",
      icon: Cog,
      href: "settings",
      isActive: currentPage === "settings"
    },
    {
      title: "Logout",
      icon: LogOut,
      href: "logout",
      isActive: false
    }
  ];

  const sidebarVariants = {
    open: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 40
      }
    },
    closed: {
      x: "-100%",
      opacity: 0,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 40
      }
    }
  };

  const itemVariants = {
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.2
      }
    },
    closed: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <>
      <AnimatePresence>
        {/* Overlay */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => onToggle()} // Close sidebar on overlay click
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* Sidebar */}
        {isOpen && (
          <motion.aside
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className={cn(
              "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 border-r",
              "bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800",
              "shadow-lg border-slate-200 dark:border-slate-700"
            )}
          >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            {isOpen ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800 dark:text-white">FireForce</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-200">Incident Management</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
          </div>
          
          {/* Navigation Items */}
          <div className="flex-1 space-y-2 p-4">
            {navigationItems.map((item, index) => (
              <motion.div
                key={item.href}
                variants={itemVariants}
                animate={isOpen ? "open" : "closed"}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-4 h-12 rounded-xl font-medium transition-all duration-200",
                    "hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:shadow-sm",
                    "dark:hover:from-orange-950 dark:hover:to-red-950",
                    item.isActive && [
                      "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg",
                      "hover:from-orange-600 hover:to-red-700",
                      "transform scale-105"
                    ],
                    !isOpen && "md:justify-center md:gap-0 md:w-12 md:h-12"
                  )}
                  onClick={() => onNavigate(item.href)}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-all duration-200",
                    item.isActive 
                      ? "bg-white/20" 
                      : "group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30"
                  )}>
                    <item.icon className={cn(
                      "h-5 w-5 flex-shrink-0 transition-all duration-200",
                      item.isActive ? "text-white" : "text-slate-600 dark:text-white"
                    )} />
                  </div>
                  {isOpen && (
                    <span className={cn(
                      "truncate transition-all duration-200",
                      item.isActive ? "text-white" : "text-slate-700 dark:text-white"
                    )}>
                      {item.title}
                    </span>
                  )}
                  {item.isActive && isOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="ml-auto"
                    >
                      <Sparkles className="h-4 w-4 text-white/80" />
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            ))}
          </div>

          <Separator />

          {/* Bottom Items */}
          <div className="space-y-1 p-4">
            {bottomItems.map((item, index) => (
              <motion.div
                key={item.href}
                variants={itemVariants}
                animate={isOpen ? "open" : "closed"}
                transition={{ delay: (navigationItems.length + index) * 0.1 }}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-4 h-12 rounded-xl font-medium transition-all duration-200",
                    "hover:bg-gradient-to-r hover:shadow-sm",
                    item.href === "logout" 
                      ? "hover:from-red-50 hover:to-pink-50 text-red-600 hover:text-red-700 dark:hover:from-red-950 dark:hover:to-pink-950" 
                      : "hover:from-slate-50 hover:to-slate-100 dark:hover:from-slate-800 dark:hover:to-slate-700",
                    item.isActive && [
                      "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg",
                      "hover:from-orange-600 hover:to-red-700"
                    ],
                    !isOpen && "md:justify-center md:gap-0 md:w-12 md:h-12"
                  )}
                  onClick={() => onNavigate(item.href)}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-all duration-200",
                    item.isActive 
                      ? "bg-white/20" 
                      : item.href === "logout"
                        ? "group-hover:bg-red-100 dark:group-hover:bg-red-900/30"
                        : "group-hover:bg-slate-100 dark:group-hover:bg-slate-700"
                  )}>
                    <item.icon className={cn(
                      "h-5 w-5 flex-shrink-0 transition-all duration-200",
                      item.isActive 
                        ? "text-white" 
                        : item.href === "logout"
                          ? "text-red-600 dark:text-red-400"
                          : "text-slate-600 dark:text-white"
                    )} />
                  </div>
                  {isOpen && (
                    <span className={cn(
                      "truncate transition-all duration-200",
                      item.isActive 
                        ? "text-white" 
                        : item.href === "logout"
                          ? "text-red-600 dark:text-red-400"
                          : "text-slate-700 dark:text-white"
                    )}>
                      {item.title}
                    </span>
                  )}
                </Button>
              </motion.div>
            ))}
          </div>

          {/* User Info */}
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border-t border-slate-200 dark:border-slate-700"
            >
              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 rounded-xl p-3 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-3 h-3 bg-orange-500 rounded-full" />
                    <div className="absolute inset-0 w-3 h-3 bg-orange-500 rounded-full animate-ping opacity-75" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">John Doe</p>
                    <p className="text-xs text-orange-600 dark:text-orange-300">Senior SRE Engineer</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
