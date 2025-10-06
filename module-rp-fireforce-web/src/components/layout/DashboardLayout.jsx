import React, { useState, useEffect, useCallback } from 'react';
import SideNavigation from './SideNavigation';
import TopNavigation from './TopNavigation';
import useIncidentBadge from '../../hooks/useIncidentBadge';

// Import pages
import DashboardPage from '../../pages/dashboard/DashboardPage';
import AnalyticsPage from '../../pages/analytics/AnalyticsPage';
import IncidentsPage from '../../pages/incidents/IncidentsPage';
import IncidentDetailsPage from '../../pages/incidents/IncidentDetailsPage';
import OnCallSchedulePage from '../../pages/oncall-schedule/OnCallSchedulePage';
import TeamsPage from '../../pages/teams/TeamsPage';
import SettingsPage from '../../pages/settings/SettingsPage';
import AuditTrailPage from '../../pages/audit-trail/AuditTrailPage';

const DashboardLayout = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState(() => {
    // Restore active tab from localStorage on initial load
    return localStorage.getItem('activeTab') || 'dashboard';
  });
  const [selectedIncidentId, setSelectedIncidentId] = useState(() => {
    // Restore selected incident ID from localStorage on initial load
    return localStorage.getItem('selectedIncidentId') || null;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Use incident badge hook to track new/unread incidents
  const userId = user?.id || localStorage.getItem('userId') || 'user-1';
  const { 
    newIncidentsCount, 
    markAllAsSeen, 
    markIncidentAsSeen 
  } = useIncidentBadge(userId);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Custom setActiveTab function that also persists to localStorage
  const handleSetActiveTab = useCallback((tabName, incidentId = null) => {
    setActiveTab(tabName);
    localStorage.setItem('activeTab', tabName);
    
    // Mark all incidents as seen when user navigates to incidents page
    if (tabName === 'incidents') {
      markAllAsSeen();
    }
    
    // If navigating to incident details, mark that specific incident as seen
    if (tabName === 'incident-details' && incidentId) {
      setSelectedIncidentId(incidentId);
      localStorage.setItem('selectedIncidentId', incidentId);
      markIncidentAsSeen(incidentId);
    } else if (tabName !== 'incident-details') {
      setSelectedIncidentId(null);
      localStorage.removeItem('selectedIncidentId');
    }
  }, [markAllAsSeen, markIncidentAsSeen]);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleSetActiveTab} />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'incidents':
        return <IncidentsPage onViewIncident={(incidentId) => handleSetActiveTab('incident-details', incidentId)} />;
      case 'incident-details':
        return <IncidentDetailsPage incidentId={selectedIncidentId} onBack={() => handleSetActiveTab('incidents')} />;
      case 'oncall-schedule':
        return <OnCallSchedulePage />;
      case 'teams':
        return <TeamsPage />;
      case 'audit-trail':
        return <AuditTrailPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={handleSetActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${isMobile && !sidebarCollapsed ? 'fixed inset-0 z-50' : ''}`}>
        {isMobile && !sidebarCollapsed && (
          <div 
            className="absolute inset-0 bg-black bg-opacity-50" 
            onClick={() => setSidebarCollapsed(true)}
          />
        )}
        <div className={`${isMobile ? 'absolute left-0 top-0 h-full z-10' : 'relative'}`}>
          <SideNavigation
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            openIncidentsCount={newIncidentsCount}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNavigation
          user={user}
          onLogout={onLogout}
          toggleSidebar={toggleSidebar}
          collapsed={sidebarCollapsed}
          onNavigateToSettings={() => handleSetActiveTab('settings')}
          onNavigateToIncident={(incidentId) => handleSetActiveTab('incident-details', incidentId)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            {renderActivePage()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
