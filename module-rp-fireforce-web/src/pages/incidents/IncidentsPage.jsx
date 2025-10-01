import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Filter, 
  Search,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  Timer,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUp,
  Grid3X3,
  List,
  SortAsc,
  Download,
  RefreshCw,
  Zap,
  Server,
  Database,
  Bug,
  BarChart3,
  Activity,
  Monitor,
  Flame,
  TrendingUp,
  Shield,
  Bell,
  Users,
  Settings,
  PlayCircle,
  PauseCircle,
  Star,
  Bookmark,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react';

const IncidentsPage = () => {
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'list'
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created');

  // Mock incident data
  const incidents = [
    {
      id: 'INC-2025-001',
      title: 'Database Connection Pool Exhausted',
      description: 'Production database connection pool has reached maximum capacity causing application timeouts',
      status: 'Open',
      severity: 'Critical',
      assignee: 'Sarah Chen',
      reporter: 'System Monitor',
      created: '2025-10-01 14:23:00',
      updated: '2025-10-01 14:45:00',
      source: 'AWS CloudWatch',
      affectedServices: ['User API', 'Payment Service'],
      tags: ['database', 'performance', 'production'],
      estimatedResolution: '2 hours',
      priority: 1
    },
    {
      id: 'INC-2025-002',
      title: 'High CPU Usage on Web Server',
      description: 'Web server prod-web-01 showing consistently high CPU usage above 90%',
      status: 'Investigating',
      severity: 'High',
      assignee: 'Mike Rodriguez',
      reporter: 'Grafana Alert',
      created: '2025-10-01 13:15:00',
      updated: '2025-10-01 14:30:00',
      source: 'Grafana',
      affectedServices: ['Web Frontend'],
      tags: ['cpu', 'performance', 'web-server'],
      estimatedResolution: '1 hour',
      priority: 2
    },
    {
      id: 'INC-2025-003',
      title: 'SSL Certificate Expiration Warning',
      description: 'SSL certificate for api.company.com expires in 7 days',
      status: 'Open',
      severity: 'Medium',
      assignee: 'Alex Kumar',
      reporter: 'Certificate Monitor',
      created: '2025-10-01 12:00:00',
      updated: '2025-10-01 12:00:00',
      source: 'New Relic',
      affectedServices: ['API Gateway'],
      tags: ['ssl', 'certificate', 'security'],
      estimatedResolution: '4 hours',
      priority: 3
    },
    {
      id: 'INC-2025-004',
      title: 'Memory Leak in Background Service',
      description: 'Background processing service showing gradual memory increase over 24 hours',
      status: 'Escalated',
      severity: 'High',
      assignee: 'Emma Watson',
      reporter: 'David Park',
      created: '2025-10-01 10:30:00',
      updated: '2025-10-01 14:15:00',
      source: 'Prometheus',
      affectedServices: ['Background Processor'],
      tags: ['memory-leak', 'background-service'],
      estimatedResolution: '3 hours',
      priority: 2
    },
    {
      id: 'INC-2025-005',
      title: 'Disk Space Warning',
      description: 'Disk usage on /var/log partition has reached 85% capacity',
      status: 'Resolved',
      severity: 'Low',
      assignee: 'Jordan Smith',
      reporter: 'System Monitor',
      created: '2025-10-01 09:45:00',
      updated: '2025-10-01 11:20:00',
      source: 'DataDog',
      affectedServices: ['Log Server'],
      tags: ['disk-space', 'maintenance'],
      estimatedResolution: 'Resolved',
      priority: 4
    },
    {
      id: 'INC-2025-006',
      title: 'API Rate Limit Exceeded',
      description: 'Third-party API service is returning 429 errors due to rate limiting',
      status: 'Investigating',
      severity: 'Medium',
      assignee: 'Taylor Brown',
      reporter: 'Application Monitor',
      created: '2025-10-01 08:20:00',
      updated: '2025-10-01 13:50:00',
      source: 'Application Logs',
      affectedServices: ['External Integrations'],
      tags: ['api', 'rate-limit', 'third-party'],
      estimatedResolution: '2 hours',
      priority: 3
    }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status', count: incidents.length },
    { value: 'Open', label: 'Open', count: incidents.filter(i => i.status === 'Open').length },
    { value: 'Investigating', label: 'Investigating', count: incidents.filter(i => i.status === 'Investigating').length },
    { value: 'Resolved', label: 'Resolved', count: incidents.filter(i => i.status === 'Resolved').length },
    { value: 'Escalated', label: 'Escalated', count: incidents.filter(i => i.status === 'Escalated').length }
  ];

  const severityOptions = [
    { value: 'all', label: 'All Severity', count: incidents.length },
    { value: 'Critical', label: 'Critical', count: incidents.filter(i => i.severity === 'Critical').length },
    { value: 'High', label: 'High', count: incidents.filter(i => i.severity === 'High').length },
    { value: 'Medium', label: 'Medium', count: incidents.filter(i => i.severity === 'Medium').length },
    { value: 'Low', label: 'Low', count: incidents.filter(i => i.severity === 'Low').length }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-900 border-red-200';
      case 'Investigating': return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'Resolved': return 'bg-green-100 text-green-900 border-green-200';
      case 'Escalated': return 'bg-purple-100 text-purple-900 border-purple-200';
      default: return 'bg-gray-100 text-gray-900 border-gray-200';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-600 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-white';
      case 'Low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Open': return <AlertCircle className="w-6 h-6" />;
      case 'Investigating': return <Eye className="w-6 h-6" />;
      case 'Resolved': return <CheckCircle className="w-6 h-6" />;
      case 'Escalated': return <ArrowUp className="w-6 h-6" />;
      default: return <AlertTriangle className="w-6 h-6" />;
    }
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'AWS CloudWatch': return <Database className="w-4 h-4" />;
      case 'Grafana': return <BarChart3 className="w-4 h-4" />;
      case 'Prometheus': return <Activity className="w-4 h-4" />;
      case 'DataDog': return <Monitor className="w-4 h-4" />;
      case 'New Relic': return <Eye className="w-4 h-4" />;
      default: return <Server className="w-4 h-4" />;
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesStatus = selectedStatus === 'all' || incident.status === selectedStatus;
    const matchesSeverity = selectedSeverity === 'all' || incident.severity === selectedSeverity;
    const matchesSearch = searchQuery === '' || 
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSeverity && matchesSearch;
  });

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Enhanced Header */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 rounded-2xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 via-red-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Flame className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-xs font-bold text-white">{incidents.filter(i => i.status === 'Open').length}</span>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 mb-2">Incident Command</h1>
                <p className="text-lg text-gray-600 font-medium">Real-time incident tracking and emergency response management</p>
                <div className="flex items-center space-x-4 mt-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-700">System Monitoring Active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Last updated: {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="hidden lg:flex items-center space-x-2 px-4 py-3 bg-blue-50 rounded-xl border border-blue-200">
                <Shield className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm font-bold text-blue-900">SLA Status</div>
                  <div className="text-xs text-blue-700">98.5% Compliance</div>
                </div>
              </div>
              <button className="flex items-center px-4 py-3 bg-white/50 border border-gray-200 rounded-xl hover:bg-white/80 transition-all duration-200 text-gray-700 font-medium shadow-lg">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              <button className="flex items-center px-4 py-3 bg-white/50 border border-gray-200 rounded-xl hover:bg-white/80 transition-all duration-200 text-gray-700 font-medium shadow-lg">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <button className="flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-bold shadow-xl transform hover:scale-105">
                <Plus className="w-5 h-5 mr-2" />
                Create Incident
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statusOptions.slice(1).map((status, index) => (
          <div key={status.value} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                status.value === 'Open' ? 'bg-red-100' :
                status.value === 'Investigating' ? 'bg-blue-100' :
                status.value === 'Resolved' ? 'bg-green-100' : 'bg-purple-100'
              }`}>
                <div className={`${
                  status.value === 'Open' ? 'text-red-600' :
                  status.value === 'Investigating' ? 'text-blue-600' :
                  status.value === 'Resolved' ? 'text-green-600' : 'text-purple-600'
                }`}>
                  {getStatusIcon(status.value)}
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(status.value)}`}>
                {status.label}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h3 className="text-3xl font-bold text-gray-900">{status.count}</h3>
                <div className={`flex items-center text-xs font-medium ${
                  status.value === 'Open' ? 'text-red-600' :
                  status.value === 'Investigating' ? 'text-blue-600' :
                  status.value === 'Resolved' ? 'text-green-600' : 'text-purple-600'
                }`}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{Math.floor(Math.random() * 20)}%
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600">{status.label} Incidents</p>
              <div className={`w-full h-2 rounded-full ${
                status.value === 'Open' ? 'bg-red-100' :
                status.value === 'Investigating' ? 'bg-blue-100' :
                status.value === 'Resolved' ? 'bg-green-100' : 'bg-purple-100'
              }`}>
                <div className={`h-2 rounded-full transition-all duration-1000 ${
                  status.value === 'Open' ? 'bg-red-500' :
                  status.value === 'Investigating' ? 'bg-blue-500' :
                  status.value === 'Resolved' ? 'bg-green-500' : 'bg-purple-500'
                }`} style={{ width: `${Math.min((status.count / Math.max(...statusOptions.slice(1).map(s => s.count))) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Filters and Controls */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl"></div>
        <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Enhanced Search */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search incidents, IDs, descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 w-96 bg-white/50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-900 font-medium placeholder:text-gray-500 shadow-lg backdrop-blur-sm transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                  >
                    <XCircle className="w-4 h-4 text-gray-600" />
                  </button>
                )}
              </div>

              {/* Enhanced Status Filter */}
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-3 pr-10 bg-white/70 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-900 font-bold shadow-lg backdrop-blur-sm transition-all duration-200 cursor-pointer"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value} className="text-gray-900 font-medium">
                      {option.label} ({option.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Enhanced Severity Filter */}
              <div className="relative">
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="px-4 py-3 pr-10 bg-white/70 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-900 font-bold shadow-lg backdrop-blur-sm transition-all duration-200 cursor-pointer"
                >
                  {severityOptions.map(option => (
                    <option key={option.value} value={option.value} className="text-gray-900 font-medium">
                      {option.label} ({option.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Enhanced Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 pr-10 bg-white/70 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-900 font-bold shadow-lg backdrop-blur-sm transition-all duration-200 cursor-pointer"
                >
                  <option value="created" className="text-gray-900">Sort by Created</option>
                  <option value="updated" className="text-gray-900">Sort by Updated</option>
                  <option value="priority" className="text-gray-900">Sort by Priority</option>
                  <option value="severity" className="text-gray-900">Sort by Severity</option>
                </select>
              </div>

              {/* Enhanced View Toggle */}
              <div className="flex bg-white/50 border-2 border-gray-200 rounded-xl shadow-lg backdrop-blur-sm">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-3 rounded-l-xl transition-all duration-200 ${
                    viewMode === 'cards' 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg transform scale-105' 
                      : 'text-gray-600 hover:bg-white/70 hover:text-gray-800'
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-r-xl transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg transform scale-105' 
                      : 'text-gray-600 hover:bg-white/70 hover:text-gray-800'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* Results Counter */}
              <div className="px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl shadow-lg">
                <span className="text-sm font-bold text-blue-900">
                  {filteredIncidents.length} result{filteredIncidents.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Incidents Display */}
      {viewMode === 'cards' ? (
        /* Enhanced Card View */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredIncidents.map((incident, index) => (
            <div key={incident.id} className="group relative overflow-hidden">
              <div className={`absolute inset-0 rounded-2xl opacity-5 ${
                incident.severity === 'Critical' ? 'bg-gradient-to-br from-red-500 to-red-700' :
                incident.severity === 'High' ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                incident.severity === 'Medium' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 'bg-gradient-to-br from-green-400 to-green-600'
              }`}></div>
              <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
                {/* Enhanced Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={`px-4 py-2 rounded-xl text-xs font-black shadow-lg ${getSeverityColor(incident.severity)} transform hover:scale-110 transition-transform`}>
                      {incident.severity}
                    </div>
                    <div className={`flex items-center px-4 py-2 rounded-xl text-xs font-black border-2 ${getStatusColor(incident.status)} shadow-lg backdrop-blur-sm`}>
                      {incident.status === 'Open' && <AlertCircle className="w-4 h-4 mr-2" />}
                      {incident.status === 'Investigating' && <Eye className="w-4 h-4 mr-2" />}
                      {incident.status === 'Resolved' && <CheckCircle className="w-4 h-4 mr-2" />}
                      {incident.status === 'Escalated' && <ArrowUp className="w-4 h-4 mr-2" />}
                      <span>{incident.status}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 transform hover:scale-110">
                      <Bookmark className="w-4 h-4 text-gray-500 hover:text-yellow-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 transform hover:scale-110">
                      <MoreHorizontal className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Enhanced Content */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-600 font-bold bg-gray-100 px-3 py-1 rounded-lg">{incident.id}</div>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${
                        incident.priority === 1 ? 'bg-red-100 text-red-700' :
                        incident.priority === 2 ? 'bg-orange-100 text-orange-700' :
                        incident.priority === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>
                        <Star className="w-3 h-3" />
                        <span className="text-xs font-bold">P{incident.priority}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 leading-tight mb-3">{incident.title}</h3>
                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{incident.description}</p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        incident.source === 'AWS CloudWatch' ? 'bg-orange-100' :
                        incident.source === 'Grafana' ? 'bg-red-100' :
                        incident.source === 'Prometheus' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {getSourceIcon(incident.source)}
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 font-medium">Source</div>
                        <div className="font-bold text-gray-900">{incident.source}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600 font-medium">Created</div>
                      <div className="font-bold text-gray-900">{formatTimeAgo(incident.created)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-sm font-bold">{incident.assignee.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 font-medium">Assigned to</div>
                        <div className="font-bold text-gray-900">{incident.assignee}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600 font-medium">ETA</div>
                      <div className="font-bold text-blue-700">{incident.estimatedResolution}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-gray-600 font-medium">Affected Services</div>
                    <div className="flex flex-wrap gap-2">
                      {incident.affectedServices.map((service, serviceIndex) => (
                        <span key={serviceIndex} className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-lg">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-gray-600 font-medium">Tags</div>
                    <div className="flex flex-wrap gap-2">
                      {incident.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="px-3 py-1 bg-gray-200 text-gray-800 text-xs font-medium rounded-lg hover:bg-gray-300 transition-colors cursor-pointer">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Enhanced Actions */}
                <div className="flex space-x-3 mt-6 pt-6 border-t-2 border-gray-100">
                  <button className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-bold shadow-lg transform hover:scale-105">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </button>
                  <button className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-bold shadow-lg transform hover:scale-105">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                  <button className="p-3 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg transform hover:scale-105">
                    <Share2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-bold text-gray-900">Incident</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-900">Status</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-900">Severity</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-900">Assignee</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-900">Source</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-900">Created</th>
                  <th className="text-left py-4 px-6 font-bold text-gray-900">ETA</th>
                  <th className="text-center py-4 px-6 font-bold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((incident, index) => (
                  <tr key={incident.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="py-4 px-6">
                      <div>
                        <div className="text-sm text-gray-600 font-medium mb-1">{incident.id}</div>
                        <div className="font-bold text-gray-900">{incident.title}</div>
                        <div className="text-sm text-gray-700 mt-1 truncate max-w-xs">{incident.description}</div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {incident.tags.slice(0, 2).map((tag, tagIndex) => (
                            <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                              #{tag}
                            </span>
                          ))}
                          {incident.tags.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                              +{incident.tags.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(incident.status)}`}>
                        <div className="w-4 h-4 mr-1">
                          {React.cloneElement(getStatusIcon(incident.status), { className: "w-4 h-4" })}
                        </div>
                        <span>{incident.status}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{incident.assignee.split(' ').map(n => n[0]).join('')}</span>
                        </div>
                        <span className="font-medium text-gray-900">{incident.assignee}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        {getSourceIcon(incident.source)}
                        <span className="font-medium text-gray-900">{incident.source}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium text-gray-900">{formatTimeAgo(incident.created)}</div>
                      <div className="text-xs text-gray-600">{new Date(incident.created).toLocaleDateString()}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium text-gray-900">{incident.estimatedResolution}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center space-x-2">
                        <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enhanced Empty State */}
      {filteredIncidents.length === 0 && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-500/5 to-blue-500/5 rounded-2xl"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-16 border border-white/50 shadow-xl text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <AlertTriangle className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-4">No Incidents Found</h3>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              No incidents match your current filters. Try adjusting your search criteria or create a new incident.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <button className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-bold shadow-xl transform hover:scale-105">
                <Plus className="w-5 h-5 mr-2 inline" />
                Create New Incident
              </button>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('all');
                  setSelectedSeverity('all');
                }}
                className="px-8 py-4 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 font-bold shadow-xl transform hover:scale-105 text-gray-700"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentsPage;
