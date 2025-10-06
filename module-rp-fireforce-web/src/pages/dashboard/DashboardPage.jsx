import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import DashboardHeader from './components/DashboardHeader';
import StatCard from './components/StatCard';
import IncidentCard from './components/IncidentCard';
import OnCallMember from './components/OnCallMember';
import SystemStatus from './components/SystemStatus';
import EmptyState from './components/EmptyState';
import { incidentService, onCallService } from '../../services/api';

export default function DashboardPage({ onNavigate }) {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [onCallData, setOnCallData] = useState({ teams: [], currentOnCall: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      
      // Fetch incidents and stats (on-call data is optional)
      const [incidentsData, incidentStatsData] = await Promise.all([
        incidentService.getAllIncidents(),
        incidentService.getIncidentStats('24h'),
      ]);

      setIncidents(Array.isArray(incidentsData) ? incidentsData : []);
      setStats(incidentStatsData);
      
      // Try to fetch on-call data (non-critical, gracefully handle errors)
      try {
        const teamsData = await onCallService.getTeams();
        
        if (teamsData && Array.isArray(teamsData) && teamsData.length > 0) {
          // Use the first team's ID to fetch current on-call
          const teamId = teamsData[0].id || teamsData[0].teamId;
          
          if (teamId) {
            const currentOnCall = await onCallService.getCurrentOnCall(teamId);
            setOnCallData({ teams: teamsData, currentOnCall });
          } else {
            setOnCallData({ teams: teamsData, currentOnCall: null });
          }
        } else {
          setOnCallData({ teams: [], currentOnCall: null });
        }
      } catch (onCallError) {
        // On-call data is optional - don't fail the entire page
        console.info('On-call data unavailable:', onCallError.message);
        setOnCallData({ teams: [], currentOnCall: null });
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getDisplayStats = () => {
    if (stats) {
      return {
        total: stats.total || 0,
        active: (stats.open || 0) + (stats.investigating || 0),
        resolved: stats.resolved || 0,
        onCall: onCallData.teams.reduce((sum, team) => sum + (team.members || 0), 0),
        trends: {
          total: { trend: 'up', value: '+12%' },
          active: { trend: stats.open > stats.investigating ? 'up' : 'down', value: `${Math.abs(stats.open - stats.investigating)}` },
          resolved: { trend: 'up', value: '+23%' },
          onCall: { trend: 'neutral', value: '0%' }
        }
      };
    }
    
    return {
      total: 0,
      active: 0,
      resolved: 0,
      onCall: 0,
      trends: {
        total: { trend: 'neutral', value: '0%' },
        active: { trend: 'neutral', value: '0%' },
        resolved: { trend: 'neutral', value: '0%' },
        onCall: { trend: 'neutral', value: '0%' }
      }
    };
  };

  const getRecentIncidents = () => {
    return incidents
      .sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt))
      .slice(0, 5)
      .map(incident => ({
        ...incident,
        time: new Date(incident.timestamp || incident.createdAt).toLocaleString(),
        assignee: incident.assignedTo || 'Unassigned'
      }));
  };

  const getCurrentOnCallMembers = () => {
    const members = [];
    const { currentOnCall } = onCallData;
    
    if (!currentOnCall) return [];

    if (currentOnCall.primary) {
      members.push({
        ...currentOnCall.primary,
        name: `${currentOnCall.primary.firstName} ${currentOnCall.primary.lastName}`,
        team: onCallData.teams[0]?.name || 'Unknown Team',
        status: 'active',
        avatar: currentOnCall.primary.firstName?.charAt(0).toUpperCase() || '?',
        role: 'Primary'
      });
    }

    if (currentOnCall.backup) {
      members.push({
        ...currentOnCall.backup,
        name: `${currentOnCall.backup.firstName} ${currentOnCall.backup.lastName}`,
        team: onCallData.teams[0]?.name || 'Unknown Team',
        status: 'active',
        avatar: currentOnCall.backup.firstName?.charAt(0).toUpperCase() || '?',
        role: 'Backup'
      });
    }

    if (currentOnCall.escalation && Array.isArray(currentOnCall.escalation)) {
      currentOnCall.escalation.forEach((member, index) => {
        members.push({
          ...member,
          name: `${member.firstName} ${member.lastName}`,
          team: onCallData.teams[0]?.name || 'Unknown Team',
          status: 'active',
          avatar: member.firstName?.charAt(0).toUpperCase() || '?',
          role: `Escalation ${index + 1}`
        });
      });
    }

    return members.slice(0, 6);
  };

  const displayStats = getDisplayStats();
  const recentIncidents = getRecentIncidents();
  const onCallMembers = getCurrentOnCallMembers();

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
            </div>
            <div className="h-11 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 h-32 border border-gray-200 animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="space-y-3 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-16"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl p-6 h-96 border border-gray-200 animate-pulse"></div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 h-64 border border-gray-200 animate-pulse"></div>
              <div className="bg-white rounded-xl p-6 h-64 border border-gray-200 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto mt-16">
          <div className="bg-white border border-red-200 rounded-xl p-8 shadow-lg">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Error Loading Dashboard</h3>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
            <button 
              onClick={() => loadDashboardData()}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-md hover:shadow-lg"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <DashboardHeader onRefresh={() => loadDashboardData()} isRefreshing={isRefreshing} />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            label="Total Incidents" 
            value={displayStats.total} 
            icon={Activity} 
            color="text-blue-600" 
            bgColor="bg-blue-50"
            trend={displayStats.trends.total.trend}
            trendValue={displayStats.trends.total.value}
          />
          <StatCard 
            label="Active" 
            value={displayStats.active} 
            icon={AlertTriangle} 
            color="text-orange-600" 
            bgColor="bg-orange-50"
            trend={displayStats.trends.active.trend}
            trendValue={displayStats.trends.active.value}
          />
          <StatCard 
            label="Resolved Today" 
            value={displayStats.resolved} 
            icon={CheckCircle} 
            color="text-green-600" 
            bgColor="bg-green-50"
            trend={displayStats.trends.resolved.trend}
            trendValue={displayStats.trends.resolved.value}
          />
          <StatCard 
            label="On-Call Staff" 
            value={displayStats.onCall} 
            icon={Users} 
            color="text-purple-600" 
            bgColor="bg-purple-50"
            trend={displayStats.trends.onCall.trend}
            trendValue={displayStats.trends.onCall.value}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Incidents */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Recent Incidents</h2>
                <p className="text-sm text-gray-500 mt-0.5">Latest emergency alerts and responses</p>
              </div>
              <button 
                onClick={() => onNavigate && onNavigate('incidents')}
                className="text-blue-600 text-sm hover:text-blue-700 font-semibold hover:underline transition-colors"
              >
                View All →
              </button>
            </div>
            
            <div className="space-y-3">
              {recentIncidents.length > 0 ? (
                recentIncidents.map((incident) => (
                  <IncidentCard 
                    key={incident.id} 
                    incident={incident}
                    onClick={() => console.log('View incident:', incident.id)}
                  />
                ))
              ) : (
                <EmptyState type="incidents" />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* On-Call Team */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">On-Call Team</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{onCallMembers.length} members active</p>
                </div>
                <button 
                  onClick={() => onNavigate && onNavigate('oncall-schedule')}
                  className="text-blue-600 text-sm hover:text-blue-700 font-semibold hover:underline transition-colors"
                >
                  View All →
                </button>
              </div>
          
              <div className="space-y-1">
                {onCallMembers.length > 0 ? (
                  onCallMembers.map((member, index) => (
                    <OnCallMember key={member.id || index} member={member} />
                  ))
                ) : (
                  <EmptyState type="oncall" />
                )}
              </div>
            </div>

            {/* System Status */}
            <SystemStatus />
          </div>
        </div>
      </div>
    </div>
  );
}

