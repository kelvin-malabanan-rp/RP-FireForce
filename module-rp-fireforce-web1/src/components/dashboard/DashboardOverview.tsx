import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import type { Notification } from "@/hooks/useNotifications";
import {
  Flame,
  CheckCircle2,
  Crown,
  TrendingUp,
  Activity,
  AlertCircle,
  UserCheck,
  Sparkles,
  Users,
  Clock,
  Building2,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { incidentService, statsService, onCallService } from "@/services";
import { teamManagementServiceV2, Team } from "@/services/team-management-service.ts";
import type { Incident } from "@/types";

interface DashboardOverviewProps {
  onNavigateToIncident?: (incidentId: string) => void;
}

type TeamFilter = 'all' | 'my-team' | 'others' | string;

const TEAM_ICONS: Record<string, { icon: string; color: string }> = {
  'platform': { icon: '⚙️', color: 'blue' },
  'application': { icon: '🚀', color: 'purple' },
  'database': { icon: '🗄️', color: 'green' },
  'network': { icon: '🌐', color: 'orange' },
  'security': { icon: '🛡️', color: 'red' },
  'storage': { icon: '💾', color: 'cyan' },
  'default': { icon: '👥', color: 'slate' }
};

export function DashboardOverview({ onNavigateToIncident }: DashboardOverviewProps = {}) {
  // Notification Modal State
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [showEscalateReason, setShowEscalateReason] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const alertAudioRef = typeof window !== 'undefined' ? { current: new Audio('/sounds/alert.mp3') } : { current: null };
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);
  const { notifications, refresh, markAsRead } = useNotifications({ enabled: true });

  // Watch for new targeted critical/high incident notifications
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    const latest = notifications[0];
    if (
        latest.unread &&
        latest.category === 'incident' &&
        (latest.type === 'critical' || latest.type === 'warning') &&
        (latest.targeted === true) &&
        !isAlertModalOpen
    ) {
      setActiveNotification(latest);
      setIsAlertModalOpen(true);
    }
  }, [notifications]);

  // Play sound when modal opens
  useEffect(() => {
    if (isAlertModalOpen && alertAudioRef.current) {
      alertAudioRef.current.currentTime = 0;
      alertAudioRef.current.play();
    } else if (!isAlertModalOpen && alertAudioRef.current) {
      alertAudioRef.current.pause();
      alertAudioRef.current.currentTime = 0;
    }
  }, [isAlertModalOpen]);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [onCallData, setOnCallData] = useState<any>({ teams: [], currentOnCall: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Team filtering state
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('all');
  const [currentUserTeam, setCurrentUserTeam] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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

      console.log('📊 Loading dashboard data...');

      // Fetch current user's team
      const currentUser = localStorage.getItem('user');
      if (currentUser) {
        try {
          const userData = JSON.parse(currentUser);
          console.log('👤 Current user:', userData);

          if (userData.teamId || userData.team_id) {
            const userTeamId = userData.teamId || userData.team_id;
            console.log('✅ User team ID:', userTeamId);
            setCurrentUserTeam(userTeamId);

            // Set default filter to "My Team" on initial load
            if (isInitialLoad && !isAutoRefresh) {
              console.log('🎯 Setting default filter to "My Team"');
              setTeamFilter('my-team');
              setIsInitialLoad(false);
            }
          } else {
            console.warn('⚠️ User has no team assigned');
            setCurrentUserTeam(null);
            if (isInitialLoad && !isAutoRefresh) {
              setIsInitialLoad(false);
            }
          }
        } catch (e) {
          console.error('❌ Error parsing user data:', e);
          setCurrentUserTeam(null);
          if (isInitialLoad && !isAutoRefresh) {
            setIsInitialLoad(false);
          }
        }
      } else {
        if (isInitialLoad && !isAutoRefresh) {
          setIsInitialLoad(false);
        }
      }

      // Fetch teams, incidents and stats
      const [teamsResponse, incidentsResponse, statsResponse] = await Promise.all([
        teamManagementServiceV2.getAllTeams(),
        incidentService.getAllIncidents(),
        statsService.getIncidentStats('24h'),
      ]);

      // Set teams data
      if (teamsResponse.success && teamsResponse.data?.data?.teams) {
        const fetchedTeams = teamsResponse.data.data.teams;
        console.log('✅ Teams loaded:', fetchedTeams.length, 'teams');
        setTeams(fetchedTeams);
      } else {
        console.warn('⚠️ No teams data received');
        setTeams([]);
      }

      console.log('✅ Incidents loaded:', incidentsResponse.data);
      console.log('✅ Stats loaded:', statsResponse.data);

      setIncidents(Array.isArray(incidentsResponse.data) ? incidentsResponse.data : []);
      setStats(statsResponse.data);

      // Try to fetch on-call data (non-critical)
      try {
        const teamsResponse = await onCallService.getTeams();

        if (teamsResponse.data && Array.isArray(teamsResponse.data) && teamsResponse.data.length > 0) {
          console.log('✅ Teams loaded:', teamsResponse.data.length, 'teams');

          // Just use teams data without fetching current on-call (endpoint may not exist)
          // The current on-call endpoint returns 404, so we skip it
          setOnCallData({ teams: teamsResponse.data, currentOnCall: null });
        } else {
          console.warn('⚠️ No teams data received');
          setOnCallData({ teams: [], currentOnCall: null });
        }
      } catch (onCallError: any) {
        console.info('⚠️ On-call data unavailable:', onCallError.message);
        setOnCallData({ teams: [], currentOnCall: null });
      }
    } catch (err: any) {
      console.error('❌ Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Build dynamic team config
  const teamConfig = useMemo(() => {
    const config: Record<string, { name: string; icon: string; color: string }> = {};

    teams.forEach(team => {
      const nameLower = team.name.toLowerCase();

      let iconConfig = TEAM_ICONS['default'];
      for (const [key, value] of Object.entries(TEAM_ICONS)) {
        if (nameLower.includes(key)) {
          iconConfig = value;
          break;
        }
      }

      config[team.id] = {
        name: team.name,
        icon: iconConfig.icon,
        color: iconConfig.color
      };
    });

    config['others'] = { name: 'Others', icon: '📋', color: 'slate' };

    return config;
  }, [teams]);

  // Helper to get team ID from incident
  const getTeamId = (incident: any): string | null => {
    return incident.team_id || incident.teamId || incident.team_id_assigned || null;
  };

  // Helper to get team display name
  const getTeamName = (teamId: string | null): string => {
    if (!teamId) return 'Others';
    if (teamId === 'my-team') {
      if (currentUserTeam) {
        return `My Team (${teamConfig[currentUserTeam]?.name || 'Unknown'})`;
      }
      return 'My Team';
    }
    if (teamId === 'others') return 'Others';
    return teamConfig[teamId]?.name || 'Unknown Team';
  };

  // Helper to get team badge
  const getTeamBadge = (teamId: string | null) => {
    const team = teamId && teamConfig[teamId] ? teamConfig[teamId] : teamConfig['others'];

    const colorMap: Record<string, string> = {
      'blue': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      'purple': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      'green': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
      'orange': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
      'red': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
      'cyan': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
      'slate': 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-600'
    };

    return {
      name: team.name,
      icon: team.icon,
      className: `${colorMap[team.color] || colorMap['slate']} border`
    };
  };

  // Filtered incidents by team
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const incidentTeamId = getTeamId(incident);

      if (teamFilter === 'all') return true;
      if (teamFilter === 'my-team') {
        if (!currentUserTeam) return false;
        return incidentTeamId === currentUserTeam;
      }
      if (teamFilter === 'others') return !incidentTeamId;

      return incidentTeamId === teamFilter;
    });
  }, [incidents, teamFilter, currentUserTeam]);

  // Team-based statistics
  const teamStats = useMemo(() => {
    return incidents.reduce((acc, incident) => {
      const teamId = getTeamId(incident);
      const team = teamId || 'others';
      acc[team] = (acc[team] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [incidents]);

  const getDisplayStats = () => {
    // Calculate stats from actual incidents data as fallback
    const calculateFromIncidents = () => {
      const openCount = incidents.filter(i => i.status === 'open').length;
      const investigatingCount = incidents.filter(i => i.status === 'investigating').length;
      const acknowledgedCount = incidents.filter(i => i.status === 'acknowledged').length;
      const resolvedCount = incidents.filter(i => i.status === 'resolved').length;
      const criticalCount = incidents.filter(i => i.severity === 'critical').length;
      const highCount = incidents.filter(i => i.severity === 'high').length;

      return {
        open: openCount,
        investigating: investigatingCount,
        acknowledged: acknowledgedCount,
        resolved: resolvedCount,
        critical: criticalCount,
        high: highCount,
        total: incidents.length
      };
    };

    // If stats API returned data, use it; otherwise calculate from incidents
    const effectiveStats = (!stats ||
        (stats.total === 0 && incidents.length > 0) ||
        (stats.open === 0 && stats.investigating === 0 && stats.acknowledged === 0 && incidents.length > 0))
        ? calculateFromIncidents()
        : stats;

    if (effectiveStats) {
      const activeIncidents = (effectiveStats.open || 0) +
          (effectiveStats.investigating || 0) +
          (effectiveStats.acknowledged || 0);

      // Count total members across all teams
      const totalOnCall = onCallData.teams.reduce((sum: number, team: any) => {
        return sum + (Array.isArray(team.members) ? team.members.length : 0);
      }, 0);

      console.log('📊 Calculated Stats:', {
        active: activeIncidents,
        resolved: effectiveStats.resolved || 0,
        critical: effectiveStats.critical || 0,
        high: effectiveStats.high || 0,
        total: effectiveStats.total || 0,
        source: effectiveStats === stats ? 'API' : 'Calculated from incidents'
      });

      return {
        active: activeIncidents,
        resolved: effectiveStats.resolved || 0,
        total: effectiveStats.total || 0,
        critical: effectiveStats.critical || 0,
        high: effectiveStats.high || 0,
        onCall: totalOnCall,
      };
    }

    return {
      active: 0,
      resolved: 0,
      total: 0,
      critical: 0,
      high: 0,
      onCall: 0,
    };
  };

  const displayStats = getDisplayStats();

  // Helper to get user and team info
  const getUserAndTeamInfo = (userId: string | undefined, teamId: string | undefined): { userName: string; teamName: string } => {
    if (!userId) {
      return { userName: 'Unassigned', teamName: '' };
    }

    // Find the team
    const team = onCallData.teams.find((t: any) => t.id === teamId);
    const teamName = team?.name || '';

    // Find the user in teams
    for (const t of onCallData.teams) {
      if (Array.isArray(t.members)) {
        const member = t.members.find((m: any) => m.id === userId);
        if (member) {
          const userName = member.firstName && member.lastName
              ? `${member.firstName} ${member.lastName}`
              : member.name || userId;
          return { userName, teamName: teamName || t.name || '' };
        }
      }
    }

    // Fallback if user not found in teams
    return { userName: userId, teamName };
  };

  const statsCards = [
    {
      title: "Active Incidents",
      value: displayStats.active.toString(),
      change: `${displayStats.active} requiring attention`,
      icon: Flame,
      color: "text-red-600",
      bgColor: "bg-red-100",
      trending: "neutral"
    },
    {
      title: "Resolved Today",
      value: displayStats.resolved.toString(),
      change: `${displayStats.total} total incidents`,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
      trending: "up"
    },
    {
      title: "Critical Incidents",
      value: (displayStats.critical || 0).toString(),
      change: `${displayStats.high || 0} high priority`,
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      trending: "down"
    },
    {
      title: "On-Call Engineers",
      value: displayStats.onCall.toString(),
      change: `${onCallData.teams.length} team${onCallData.teams.length !== 1 ? 's' : ''}`,
      icon: Crown,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      trending: "neutral"
    }
  ];

  // Get recent incidents from filtered list
  const recentIncidents = filteredIncidents
      .sort((a, b) => new Date(b.timestamp || b.created_at || '').getTime() - new Date(a.timestamp || a.created_at || '').getTime())
      .slice(0, 5);

  // Handle viewing incident details
  const handleViewIncidentDetails = (incidentId: string) => {
    // Store the incident ID in localStorage so IncidentsPage can pick it up
    localStorage.setItem('selectedIncidentId', incidentId);
    // Navigate to incidents page
    localStorage.setItem('currentPage', 'incidents');
    // If a navigation callback is provided, use it
    if (onNavigateToIncident) {
      onNavigateToIncident(incidentId);
    } else {
      // Otherwise, trigger a page reload to navigate
      window.location.reload();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // Helper function to get relative time
  const getRelativeTime = (timestamp: string) => {
    const now = new Date().getTime();
    const time = new Date(timestamp).getTime();
    const diff = now - time;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  if (isLoading) {
    return (
        <div className="space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading dashboard data...</p>
            </div>
          </div>
        </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">Error Loading Dashboard</h3>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                <Button onClick={() => loadDashboardData()} className="mt-3" variant="outline">
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-700 dark:text-slate-200 mt-2 text-lg">Monitor and manage your incidents</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => loadDashboardData(true)} 
            variant="outline"
            disabled={isRefreshing}
            className="gap-2 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Activity className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <Card className="relative overflow-hidden border border-slate-200 dark:border-white/20 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12" />
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{stat.title}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className={`h-4 w-4 ${
                        stat.trending === "up" ? "text-green-600" : 
                        stat.trending === "down" ? "text-red-600 rotate-180" : 
                        "text-slate-500"
                      }`} />
                      <p className={`text-sm font-medium ${
                        stat.trending === "up" ? "text-green-600" : 
                        stat.trending === "down" ? "text-red-600" : 
                        "text-slate-500"
                      }`}>
                        {stat.change}
                      </p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-2xl ${stat.bgColor} shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300`}>
                    <stat.icon className={`h-7 w-7 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Recent Incidents */}
          <motion.div
              className="xl:col-span-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
          >
            <Card className="border border-slate-200 dark:border-white/20 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <Flame className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <span className="text-xl font-semibold text-slate-900 dark:text-white">Recent Incidents</span>
                      <p className="text-sm text-slate-700 dark:text-slate-200 font-normal">Latest critical events requiring attention</p>
                    </div>
                  </CardTitle>

                  {/* Team Filter Dropdown */}
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <Select
                        value={teamFilter}
                        onValueChange={(value: string) => setTeamFilter(value as TeamFilter)}
                    >
                      <SelectTrigger className="w-[240px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder="Filter by team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All Teams ({incidents.length})
                        </SelectItem>

                        {/* My Team option */}
                        {currentUserTeam && (
                            <SelectItem value="my-team">
                              <div className="flex items-center gap-2">
                                <Crown className="h-3 w-3" />
                                My Team ({teamConfig[currentUserTeam]?.name || 'Unknown'})
                                <span className="text-xs text-slate-500">
                              ({incidents.filter(inc => getTeamId(inc) === currentUserTeam).length})
                            </span>
                              </div>
                            </SelectItem>
                        )}

                        {/* Dynamic team options */}
                        {teams.map(team => (
                            <SelectItem key={team.id} value={team.id}>
                              {teamConfig[team.id]?.icon} {team.name} ({teamStats[team.id] || 0})
                            </SelectItem>
                        ))}

                        {/* Others option */}
                        <SelectItem value="others">
                          📋 Others ({teamStats['others'] || 0})
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Active Filter Badge */}
                {teamFilter !== 'all' && (
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                        {teamFilter === 'my-team' && <Crown className="h-3 w-3 mr-1" />}
                        Filtered: {getTeamName(teamFilter === 'others' ? null : teamFilter)} ({filteredIncidents.length})
                      </Badge>
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTeamFilter('all')}
                          className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white h-7"
                      >
                        Clear filter
                      </Button>
                    </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentIncidents.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">
                          {teamFilter === 'all'
                              ? 'No recent incidents'
                              : teamFilter === 'my-team'
                                  ? 'No incidents for your team'
                                  : `No incidents for ${getTeamName(teamFilter === 'others' ? null : teamFilter)}`}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                          {teamFilter === 'all'
                              ? 'All systems operational'
                              : teamFilter === 'my-team' && !currentUserTeam
                                  ? 'You are not assigned to any team'
                                  : 'Try selecting a different team or clear the filter'}
                        </p>
                      </div>
                  ) : (
                      recentIncidents.map((incident, index) => {
                        const teamId = getTeamId(incident);
                        const teamBadge = getTeamBadge(teamId);

                        return (
                            <motion.div
                                key={incident.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * index }}
                                whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                                className="flex items-center justify-between p-5 border border-slate-200 dark:border-white/20 rounded-xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-white dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <Badge className={getStatusColor(incident.status)}>
                                    {incident.status.toUpperCase()}
                                  </Badge>
                                  <Badge className={getStatusColor(incident.severity)} variant="outline">
                                    {incident.severity.toUpperCase()}
                                  </Badge>

                                  {/* Dynamic Team Badge */}
                                  <Badge variant="outline" className={teamBadge.className}>
                                    <Building2 className="h-3 w-3 mr-1" />
                                    <span className="mr-1">{teamBadge.icon}</span>
                                    {teamBadge.name}
                                  </Badge>

                                  <span className="font-medium text-slate-700 dark:text-white">{incident.id}</span>
                                </div>
                                <h3 className="font-semibold mt-2 text-slate-900 dark:text-white">{incident.title}</h3>
                                {incident.description && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">{incident.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-200 mt-2">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getRelativeTime(incident.timestamp || incident.created_at || '')}
                            </span>
                                  {incident.assigned_to && (() => {
                                    const { userName, teamName } = getUserAndTeamInfo(incident.assigned_to, incident.team_id);
                                    return (
                                        <>
                                          <span>•</span>
                                          <span className="flex items-center gap-1.5">
                                    <Users className="h-3 w-3" />
                                    <span className="font-medium">{userName}</span>
                                            {teamName && (
                                                <>
                                                  <span className="text-slate-400 dark:text-slate-500">•</span>
                                                  <Badge variant="outline" className="text-xs py-0 h-5">
                                                    {teamName}
                                                  </Badge>
                                                </>
                                            )}
                                  </span>
                                        </>
                                    );
                                  })()}
                                </div>
                              </div>
                            </motion.div>
                        );
                      })
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Teams Today & Quick Actions */}
        <motion.div
          className="xl:col-span-1 space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Teams Today */}
          <Card className="border border-slate-200 dark:border-white/20 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Crown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">Teams Today</span>
                </CardTitle>
                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  {onCallData.teams?.length || 0} team{(onCallData.teams?.length || 0) !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {onCallData.teams && onCallData.teams.length > 0 ? (
                  onCallData.teams.map((team: any) => {
                    const teamMembers = Array.isArray(team.members) ? team.members : [];
                    const onlineMembers = teamMembers.filter((m: any) => m?.is_online).length;
                    const teamLead = teamMembers.find((m: any) => 
                      m?.role && (m.role.toLowerCase().includes('lead') || m.role.toLowerCase().includes('primary'))
                    );
                    const hasOnlineMembers = onlineMembers > 0;
                    
                    // Helper to get full name from member
                    const getFullName = (member: any): string => {
                      if (member.firstName && member.lastName) {
                        return `${member.firstName} ${member.lastName}`;
                      }
                      if (member.name) {
                        return member.name;
                      }
                      return 'Unknown';
                    };
                    
                    return (
                      <div key={team.id || Math.random()} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`w-3 h-3 rounded-full ${
                              hasOnlineMembers ? "bg-green-500" : "bg-slate-400"
                            }`} />
                            {hasOnlineMembers && (
                              <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75" />
                            )}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{team.name || 'Unnamed Team'}</span>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              {teamLead ? `Lead: ${getFullName(teamLead)}` : `${teamMembers.length} member${teamMembers.length !== 1 ? 's' : ''}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-slate-900 dark:text-white border-slate-200 dark:border-slate-700">
                            <Users className="h-3 w-3 mr-1" />
                            {teamMembers.length}
                          </Badge>
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">
                            {onlineMembers}/{teamMembers.length} online
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No teams available</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Teams will appear here once configured</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
            {/* Quick Actions */}
            <Card className="border border-slate-200 dark:border-white/20 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* My Team Quick Filter Button */}
                  {currentUserTeam && (
                      <Button
                          onClick={() => setTeamFilter('my-team')}
                          disabled={teamFilter === 'my-team'}
                          className="w-full justify-start h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Crown className="h-4 w-4 mr-3" />
                        {teamFilter === 'my-team' ? 'Viewing My Team' : 'View My Team'}
                      </Button>
                  )}

                  <Button
                      disabled
                      className="w-full justify-start h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                    <UserCheck className="h-4 w-4 mr-3" />
                    Update On-Call
                  </Button>
                  <Button
                      disabled
                      className="w-full justify-start h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                    <Activity className="h-4 w-4 mr-3" />
                    Health Check
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Notification/Alert Modal */}
        {isAlertModalOpen && (
          <Dialog open={isAlertModalOpen} onOpenChange={setIsAlertModalOpen}>
            <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md" onInteractOutside={e => e.preventDefault()} onEscapeKeyDown={e => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                  Notification Alert
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="text-slate-400">
                You have a new notification/alert. Please take action below.
              </DialogDescription>
              <div className="space-y-4 py-2">
                <div className="bg-slate-800 rounded-lg p-3 mb-2">
                  <div className="font-semibold text-lg text-red-400 mb-1">
                    {activeNotification ? `Incident: ${activeNotification.title}` : 'Incident Alert'}
                  </div>
                  <div className="text-sm text-slate-300">
                    {activeNotification ? activeNotification.message : 'You have a new incident notification. Please acknowledge or escalate.'}
                  </div>
                </div>
                {!showEscalateReason ? (
                  <div className="flex gap-3 mt-4">
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white flex-1"
                      onClick={() => {
                        if (alertAudioRef.current) {
                          alertAudioRef.current.pause();
                          alertAudioRef.current.currentTime = 0;
                        }
                        setIsAlertModalOpen(false);
                        setShowEscalateReason(false);
                        setEscalateReason('');
                        setCustomReason('');
                        // Mark notification as read
                        if (activeNotification) {
                          markAsRead(activeNotification.id);
                          setActiveNotification(null);
                          refresh();
                        }
                      }}
                    >
                      Acknowledge
                    </Button>
                    <Button
                      className="bg-red-600 hover:bg-red-700 text-white flex-1"
                      onClick={() => {
                        if (alertAudioRef.current) {
                          alertAudioRef.current.pause();
                          alertAudioRef.current.currentTime = 0;
                        }
                        setShowEscalateReason(true);
                      }}
                    >
                      Escalate
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Label className="text-sm text-slate-300">Select Escalation Reason</Label>
                    <Select value={escalateReason} onValueChange={setEscalateReason}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue placeholder="Choose reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High Severity">High Severity</SelectItem>
                        <SelectItem value="No Response">No Response</SelectItem>
                        <SelectItem value="Requires Team Lead">Requires Team Lead</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {escalateReason === 'Other' && (
                      <Input
                        value={customReason}
                        onChange={e => setCustomReason(e.target.value)}
                        placeholder="Enter specific reason..."
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    )}
                    <div className="flex gap-3 mt-2">
                      <Button
                        variant="outline"
                        className="text-white border-slate-600 hover:bg-slate-800 flex-1"
                        onClick={() => {
                          setShowEscalateReason(false);
                          setEscalateReason('');
                          setCustomReason('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="bg-red-600 hover:bg-red-700 text-white flex-1"
                        onClick={() => {
                          if (alertAudioRef.current) {
                            alertAudioRef.current.pause();
                            alertAudioRef.current.currentTime = 0;
                          }
                          // You can add escalate logic here
                          setIsAlertModalOpen(false);
                          setShowEscalateReason(false);
                          setEscalateReason('');
                          setCustomReason('');
                          // Mark notification as read
                          if (activeNotification) {
                            markAsRead(activeNotification.id);
                            setActiveNotification(null);
                            refresh();
                          }
                        }}
                        disabled={!escalateReason || (escalateReason === 'Other' && !customReason)}
                      >
                        Confirm Escalate
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
  );
}