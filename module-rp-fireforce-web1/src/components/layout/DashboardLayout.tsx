import { useState, useEffect } from "react";
import { OnCallPage } from '../dashboard/OnCallPageClean';
import { motion, AnimatePresence } from "framer-motion";
import { DashboardTopNav } from "./DashboardTopNav";
import { DashboardSideNav } from "./DashboardSideNav";
// import { cn } from "../../lib/utils";

// Import dashboard pages - using dynamic imports to avoid module resolution issues
import { DashboardOverview } from "../dashboard/DashboardOverview";
import { AnalyticsPage } from "../dashboard/AnalyticsPage";
import { IncidentsPage } from "../dashboard/IncidentsPage";
import { SettingsPage } from "../dashboard/SettingsPage";
import { TeamsPage } from "../dashboard/TeamsPage";
import { AuditTrailPage } from "../dashboard/AuditTrailPage";
import { GlobalAlertModal } from "../modals/GlobalAlertModal";



interface DashboardLayoutProps {
  onLogout: () => void;
}

export function DashboardLayout({ onLogout }: DashboardLayoutProps) {
  // Load current page from localStorage or default to dashboard
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('currentPage') || 'dashboard';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Save current page to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  const handleNavigation = (page: string) => {
    if (page === "logout") {
      // Clear stored page on logout
      localStorage.removeItem('currentPage');
      localStorage.removeItem('selectedIncidentId');
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
            <DashboardOverview onNavigateToIncident={() => setCurrentPage('incidents')} />
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
            <IncidentsPage />
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
            <OnCallPage />
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
            <TeamsPage />
          </motion.div>
        );
      case "audit-trail":
        return (
          <motion.div
            key="audit-trail"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <AuditTrailPage />
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
            <SettingsPage />
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
      {/* Global alert modal */}
      <GlobalAlertModal />
      {/* Top Navigation */}
      <DashboardTopNav 
        onMenuToggle={toggleSidebar} 
        isSidebarOpen={isSidebarOpen}
        onNavigate={handleNavigation}
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
