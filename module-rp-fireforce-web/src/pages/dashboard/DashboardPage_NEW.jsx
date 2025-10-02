import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  Shield,
  Activity,
  Zap,
  Eye,
  RefreshCw,
  Flame,
  Target,
  Timer
} from 'lucide-react';

const DashboardPage = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // API Data States
  const [incidents, setIncidents] = useState([]);
  const [incidentStats, setIncidentStats] = useState({});
  const [onCallTeams, setOnCallTeams] = useState([]);
  const [currentOnCall, setCurrentOnCall] = useState([]);

  // API Configuration
  const API_BASE_URL = 'https://incident-webhook-api.rapidresponse.workers.dev';

  // Fetch Incidents
  const fetchIncidents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/incidents`);
      if (!response.ok) throw new Error('Failed to fetch incidents');
      const data = await response.json();
      const incidentsData = data.response_data?.data || data.data || [];
      setIncidents(Array.isArray(incidentsData) ? incidentsData : []);
    } catch (err) {
      console.error('Error fetching incidents:', err);
      setIncidents([]);
    }
  };

  // Fetch Incident Statistics
  const fetchIncidentStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/incidents/stats`);
      if (!response.ok) throw new Error('Failed to fetch incident stats');
      const data = await response.json();
      setIncidentStats(data.response_data?.data || data.data || {});
    } catch (err) {
      console.error('Error fetching incident stats:', err);
      setIncidentStats({});
    }
  };

  // Fetch OnCall Teams
  const fetchOnCallTeams = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/oncall/teams`);
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data = await response.json();
      const teams = data.object || data.response_data?.data || data.data || [];
      setOnCallTeams(Array.isArray(teams) ? teams : []);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setOnCallTeams([]);
    }
  };

  // Fetch Current OnCall
  const fetchCurrentOnCall = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/oncall/current`);
      if (!response.ok) throw new Error('Failed to fetch current on-call');
      const data = await response.json();
      const current = data.response_data?.data || data.data || [];
      setCurrentOnCall(Array.isArray(current) ? current : []);
    } catch (err) {
      console.error('Error fetching current on-call:', err);
      setCurrentOnCall([]);
    }
  };

  // Load all dashboard data
  const loadDashboardData = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      await Promise.all([
        fetchIncidents(),
        fetchIncidentStats(),
        fetchOnCallTeams(),
        fetchCurrentOnCall()
      ]);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Calculate dashboard statistics from real data
  const calculateStats = () => {
    const activeIncidents = incidents.filter(incident => 
      incident.status === 'open' || incident.status === 'active' || incident.status === 'investigating'
    ).length;

    const resolvedToday = incidents.filter(incident => {
      const today = new Date().toDateString();
      const incidentDate = new Date(incident.resolved_at || incident.updated_at).toDateString();
      return incident.status === 'resolved' && incidentDate === today;
    }).length;

    const totalOnCallMembers = onCallTeams.reduce((sum, team) => 
      sum + (team.members?.length || 0), 0
    );

    const avgResponseTime = incidentStats.average_response_time || '4.2m';

    return [
      {
        title: 'Active Incidents',
        value: activeIncidents.toString(),
        change: activeIncidents > 0 ? `+${activeIncidents}` : '0',
        changeType: activeIncidents > 0 ? 'increase' : 'neutral',
        icon: AlertTriangle,
        color: activeIncidents > 0 ? 'red' : 'green',
        description: activeIncidents > 0 ? 'Requiring immediate attention' : 'All clear!'
      },
      {
        title: 'Resolved Today',
        value: resolvedToday.toString(),
        change: resolvedToday > 0 ? `+${resolvedToday}` : '0',
        changeType: 'increase',
        icon: CheckCircle,
        color: 'green',
        description: 'Successfully resolved incidents'
      },
      {
        title: 'On-Call Members',
        value: totalOnCallMembers.toString(),
        change: '0',
        changeType: 'neutral',
        icon: Users,
        color: 'blue',
        description: 'Currently available'
      },
      {
        title: 'Avg Response Time',
        value: avgResponseTime,
        change: '-0.3m',
        changeType: 'decrease',
        icon: Clock,
        color: 'purple',
        description: 'System performance'
      }
    ];
  };

  // Get recent incidents (latest 5)
  const getRecentIncidents = () => {
    return incidents
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(incident => ({
        id: incident.id,
        title: incident.title || incident.description || 'Untitled Incident',
        severity: incident.severity || 'medium',
        status: incident.status || 'open',
        time: getTimeAgo(incident.created_at),
        assignee: incident.assigned_to || 'Unassigned',
        description: incident.description || 'No description available'
      }));
  };

  // Get current on-call schedule
  const getCurrentOnCallSchedule = () => {
    const schedule = [];
    
    onCallTeams.forEach(team => {
      if (team.members && team.members.length > 0) {
        team.members.forEach(member => {
          schedule.push({
            name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unnamed',
            role: member.role === 'primary' ? 'Primary' : member.role === 'backup' ? 'Backup' : 'Member',
            team: team.name,
            time: 'Active',
            avatar: `${member.firstName?.charAt(0) || ''}${member.lastName?.charAt(0) || ''}` || 'U',
            status: member.role === 'primary' ? 'active' : 'standby'
          });
        });
      }
    });

    return schedule.slice(0, 6); // Show top 6
  };

  // Helper function to calculate time ago
  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Utility functions
  const getColorClasses = (color) => {
    const colors = {
      red: 'bg-red-50 border-red-200 text-red-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700'
    };
    return colors[color] || colors.blue;
  };

  const getIconBgColor = (color) => {
    const colors = {
      red: 'bg-red-100',
      green: 'bg-green-100',
      blue: 'bg-blue-100',
      purple: 'bg-purple-100',
      yellow: 'bg-yellow-100'
    };
    return colors[color] || colors.blue;
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
      case 'active':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'investigating':
        return <Activity className="w-4 h-4 text-orange-500" />;
      case 'monitoring':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const stats = calculateStats();
  const recentIncidents = getRecentIncidents();
  const onCallSchedule = getCurrentOnCallSchedule();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">Error loading dashboard: {error}</span>
          </div>
          <button 
            onClick={() => loadDashboardData()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            FireForce Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Real-time emergency response monitoring</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button 
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getIconBgColor(stat.color)}`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getColorClasses(stat.color)}`}>
                  {stat.changeType === 'increase' && <TrendingUp className="w-3 h-3 inline mr-1" />}
                  {stat.changeType === 'decrease' && <TrendingDown className="w-3 h-3 inline mr-1" />}
                  {stat.change}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-sm font-medium text-gray-900">{stat.title}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Incidents */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Incidents</h2>
            <div className="flex items-center text-sm text-gray-500">
              <Activity className="w-4 h-4 mr-1" />
              {incidents.length} total
            </div>
          </div>
          
          <div className="space-y-4">
            {recentIncidents.length > 0 ? recentIncidents.map((incident) => (
              <div key={incident.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(incident.status)}
                      <h3 className="font-semibold text-gray-900">{incident.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {incident.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {incident.assignee}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No recent incidents</p>
              </div>
            )}
          </div>
        </div>

        {/* On-Call Schedule */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">On-Call Schedule</h2>
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          
          <div className="space-y-4">
            {onCallSchedule.length > 0 ? onCallSchedule.map((member, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">{member.avatar}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{member.team}</p>
                  <p className="text-xs text-gray-500">{member.time}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  member.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No on-call schedule available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
