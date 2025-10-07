import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardTopNav } from "./DashboardTopNav";
import { DashboardSideNav } from "./DashboardSideNav";
import { cn } from "../../lib/utils";

// Import dashboard pages - using dynamic imports to avoid module resolution issues
import { DashboardOverview } from "../dashboard/DashboardOverview";
import { AnalyticsPage } from "../dashboard/AnalyticsPage";

interface DashboardLayoutProps {
  onLogout: () => void;
}

export function DashboardLayout({ onLogout }: DashboardLayoutProps) {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNavigation = (page: string) => {
    if (page === "logout") {
      // Handle logout logic here
      onLogout();
      return;
    }
    setCurrentPage(page);
    // Keep sidebar open for better UX - only close on mobile/overlay click
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderCurrentPage = () => {
    const pageVariants = {
      initial: { opacity: 0, x: 20 },
      in: { opacity: 1, x: 0 },
      out: { opacity: 0, x: -20 }
    };

    const pageTransition = {
      type: "tween" as const,
      duration: 0.3
    };

    switch (currentPage) {
      case "dashboard":
        return (
          <motion.div
            key="dashboard"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <DashboardOverview />
          </motion.div>
        );
      case "analytics":
        return (
          <motion.div
            key="analytics"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <AnalyticsPage />
          </motion.div>
        );
      case "incidents":
        return (
          <motion.div
            key="incidents"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <div className="p-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Incidents</h1>
              <p className="text-slate-600 dark:text-slate-200 mt-2">Incidents page coming soon...</p>
            </div>
          </motion.div>
        );
      case "on-call":
        return (
          <motion.div
            key="on-call"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <div className="p-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">On-Call</h1>
              <p className="text-slate-600 dark:text-slate-200 mt-2">On-Call page coming soon...</p>
            </div>
          </motion.div>
        );
      case "teams":
        return (
          <motion.div
            key="teams"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <div className="p-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Teams</h1>
              <p className="text-slate-600 dark:text-slate-200 mt-2">Teams page coming soon...</p>
            </div>
          </motion.div>
        );
      case "settings":
        return (
          <motion.div
            key="settings"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <div className="p-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
              <p className="text-slate-600 dark:text-slate-200 mt-2">Settings page coming soon...</p>
            </div>
          </motion.div>
        );
      default:
        return (
          <motion.div
            key="dashboard"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <DashboardOverview />
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <DashboardTopNav 
        onMenuToggle={toggleSidebar} 
        isSidebarOpen={isSidebarOpen} 
      />

      <div className="flex">
        {/* Side Navigation */}
        <DashboardSideNav
          isOpen={isSidebarOpen}
          onNavigate={handleNavigation}
          onToggle={toggleSidebar}
          currentPage={currentPage}
        />

        {/* Main Content */}
        <main className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          <div className="w-full max-w-[1600px] mx-auto p-6 lg:p-8">
            <AnimatePresence mode="wait">
              {renderCurrentPage()}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
