import React, { useState } from 'react';
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
  Eye
} from 'lucide-react';

const DashboardPage = () => {
  const [timeRange, setTimeRange] = useState('24h');

  // Mock data
  const stats = [
    {
      title: 'Active Incidents',
      value: '3',
      change: '+2',
      changeType: 'increase',
      icon: AlertTriangle,
      color: 'red',
      description: 'Requiring immediate attention'
    },
    {
      title: 'Resolved Today',
      value: '12',
      change: '+4',
      changeType: 'increase',
      icon: CheckCircle,
      color: 'green',
      description: 'Successfully resolved incidents'
    },
    {
      title: 'On-Call Members',
      value: '8',
      change: '0',
      changeType: 'neutral',
      icon: Users,
      color: 'blue',
      description: 'Currently available'
    },
    {
      title: 'Avg Response Time',
      value: '4.2m',
      change: '-0.3m',
      changeType: 'decrease',
      icon: Clock,
      color: 'purple',
      description: 'Improvement from yesterday'
    }
  ];

  const recentIncidents = [
    {
      id: 1,
      title: 'Database Connection Timeout',
      severity: 'critical',
      status: 'active',
      time: '2 minutes ago',
      assignee: 'John Doe',
      description: 'Primary database experiencing connection timeouts'
    },
    {
      id: 2,
      title: 'API Rate Limit Exceeded',
      severity: 'high',
      status: 'investigating',
      time: '15 minutes ago',
      assignee: 'Jane Smith',
      description: 'Third-party API rate limits being exceeded'
    },
    {
      id: 3,
      title: 'Memory Usage Warning',
      severity: 'medium',
      status: 'resolved',
      time: '1 hour ago',
      assignee: 'Mike Johnson',
      description: 'Server memory usage returned to normal levels'
    },
    {
      id: 4,
      title: 'SSL Certificate Expiry',
      severity: 'low',
      status: 'monitoring',
      time: '2 hours ago',
      assignee: 'Sarah Wilson',
      description: 'SSL certificate expires in 30 days'
    }
  ];

  const onCallSchedule = [
    {
      name: 'John Doe',
      role: 'Primary',
      time: 'Now - 6:00 PM',
      avatar: 'JD',
      status: 'active'
    },
    {
      name: 'Jane Smith',
      role: 'Secondary',
      time: '6:00 PM - 12:00 AM',
      avatar: 'JS',
      status: 'upcoming'
    },
    {
      name: 'Mike Johnson',
      role: 'Primary',
      time: '12:00 AM - 8:00 AM',
      avatar: 'MJ',
      status: 'upcoming'
    }
  ];

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
      case 'active':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'investigating':
        return <Activity className="w-4 h-4 text-orange-500" />;
      case 'monitoring':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Monitor and manage your emergency response system</p>
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
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${getIconBgColor(stat.color)} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    {stat.changeType === 'increase' && <TrendingUp className="w-4 h-4 text-red-500" />}
                    {stat.changeType === 'decrease' && <TrendingDown className="w-4 h-4 text-green-500" />}
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'increase' ? 'text-red-600' : 
                      stat.changeType === 'decrease' ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Incidents */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Recent Incidents
              </h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {recentIncidents.map((incident) => (
              <div key={incident.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {getStatusIcon(incident.status)}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {incident.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {incident.description}
                      </p>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
                          {incident.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          Assigned to {incident.assignee}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{incident.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* On-Call Schedule */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              On-Call Schedule
            </h2>
          </div>
          
          <div className="p-6 space-y-4">
            {onCallSchedule.map((person, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  person.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {person.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">{person.name}</p>
                    {person.status === 'active' && (
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{person.role}</p>
                  <p className="text-xs text-gray-400 mt-1">{person.time}</p>
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t border-gray-200">
              <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
                View Full Schedule
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">API Response</span>
              <span className="text-sm font-medium text-green-600">98.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Database</span>
              <span className="text-sm font-medium text-green-600">99.2%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Monitoring</span>
              <span className="text-sm font-medium text-green-600">100%</span>
            </div>
          </div>
        </div>

        {/* Response Metrics */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Mean Time to Acknowledge</span>
              <span className="text-sm font-medium text-blue-600">2.1m</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Mean Time to Resolve</span>
              <span className="text-sm font-medium text-blue-600">18.5m</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Escalation Rate</span>
              <span className="text-sm font-medium text-yellow-600">12%</span>
            </div>
          </div>
        </div>

        {/* Team Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Members</span>
              <span className="text-sm font-medium text-green-600">8/10</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Incidents Handled</span>
              <span className="text-sm font-medium text-blue-600">47</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg. Workload</span>
              <span className="text-sm font-medium text-purple-600">6.2h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
