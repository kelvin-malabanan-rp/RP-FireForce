import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  TrendingUp,
  Activity,
  Shield,
  Clock,
  User,
  Settings,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Eye,
  BarChart3,
  Zap,
  Target,
  Calendar,
  Archive,
  Download,
  RefreshCw,
  ChevronDown,
  Sparkles,
  Layers3,
  Gauge,
  Server,
  Database,
  Network,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import AlertModal from './AlertModal';

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Enhanced mock data with more sophisticated structure
  const mockAlerts = useMemo(() => [
    {
      id: 1,
      title: "Database Connection Pool Exhausted",
      message: "The primary database connection pool has reached its maximum capacity. This may cause application slowdowns and timeouts for end users. Immediate attention required to prevent service degradation.",
      type: "critical",
      severity: 5,
      status: "active",
      source: "Database",
      assignee: "Sarah Chen",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      priority: "urgent",
      tags: ["performance", "database", "production"],
      impact: "high",
      category: "infrastructure"
    },
    {
      id: 2,
      title: "SSL Certificate Expiring Soon",
      message: "The SSL certificate for api.company.com will expire in 7 days. Please renew the certificate to maintain secure connections and prevent service disruptions.",
      type: "warning",
      severity: 3,
      status: "active",
      source: "Security",
      assignee: "Michael Rodriguez",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      priority: "medium",
      tags: ["security", "certificates", "ssl"],
      impact: "medium",
      category: "security"
    },
    {
      id: 3,
      title: "Successful Backup Completion",
      message: "Daily backup of production database completed successfully. All data integrity checks passed. Backup size: 2.4GB, Duration: 45 minutes.",
      type: "success",
      severity: 1,
      status: "resolved",
      source: "Server",
      assignee: null,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      priority: "low",
      tags: ["backup", "database", "success"],
      impact: "low",
      category: "operations"
    },
    {
      id: 4,
      title: "High CPU Usage Detected",
      message: "Server app-prod-01 is experiencing sustained high CPU usage (>85%) for the past 20 minutes. This may indicate a resource-intensive process or potential performance bottleneck.",
      type: "warning",
      severity: 4,
      status: "active",
      source: "Server",
      assignee: "David Kim",
      timestamp: new Date(Date.now() - 20 * 60 * 1000),
      priority: "high",
      tags: ["performance", "cpu", "monitoring"],
      impact: "medium",
      category: "performance"
    },
    {
      id: 5,
      title: "New User Registration Spike",
      message: "Unusual increase in user registrations detected. 300% above average in the last hour. Please verify if this is legitimate traffic or potential bot activity.",
      type: "info",
      severity: 2,
      status: "active",
      source: "Application",
      assignee: "Emma Thompson",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      priority: "medium",
      tags: ["users", "analytics", "traffic"],
      impact: "low",
      category: "analytics"
    },
    {
      id: 6,
      title: "Network Latency Threshold Exceeded",
      message: "Network latency between primary and secondary data centers has exceeded 200ms threshold. This may impact real-time data synchronization and user experience.",
      type: "critical",
      severity: 4,
      status: "active",
      source: "Network",
      assignee: "Alex Johnson",
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      priority: "urgent",
      tags: ["network", "latency", "infrastructure"],
      impact: "high",
      category: "infrastructure"
    }
  ], []);

  // Enhanced statistics with more comprehensive metrics
  const stats = useMemo(() => {
    const totalAlerts = mockAlerts.length;
    const activeAlerts = mockAlerts.filter(alert => alert.status === 'active').length;
    const criticalAlerts = mockAlerts.filter(alert => alert.type === 'critical' && alert.status === 'active').length;
    const resolvedToday = mockAlerts.filter(alert => {
      const today = new Date();
      const alertDate = new Date(alert.timestamp);
      return alert.status === 'resolved' && 
             alertDate.toDateString() === today.toDateString();
    }).length;
    
    const urgentAlerts = mockAlerts.filter(alert => alert.priority === 'urgent' && alert.status === 'active').length;
    const highImpactAlerts = mockAlerts.filter(alert => alert.impact === 'high' && alert.status === 'active').length;
    
    const systemsAffected = [...new Set(mockAlerts.filter(alert => alert.status === 'active').map(alert => alert.source))].length;
    
    // Health Score calculation (more sophisticated)
    const healthScore = Math.max(0, 100 - (criticalAlerts * 20) - (urgentAlerts * 15) - (activeAlerts * 5));
    
    return {
      totalAlerts,
      activeAlerts,
      criticalAlerts,
      resolvedToday,
      urgentAlerts,
      highImpactAlerts,
      systemsAffected,
      healthScore,
      trends: {
        alerts: activeAlerts > 3 ? 'increasing' : 'stable',
        performance: healthScore > 80 ? 'good' : healthScore > 60 ? 'fair' : 'poor'
      }
    };
  }, [mockAlerts]);

  // Enhanced filtering logic
  const filteredAlerts = useMemo(() => {
    return mockAlerts
      .filter(alert => {
        const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (alert.assignee && alert.assignee.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesType = selectedType === 'all' || alert.type === selectedType;
        const matchesStatus = selectedStatus === 'all' || alert.status === selectedStatus;
        const matchesSeverity = selectedSeverity === 'all' || alert.severity.toString() === selectedSeverity;
        
        return matchesSearch && matchesType && matchesStatus && matchesSeverity;
      })
      .sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'severity':
            aValue = a.severity;
            bValue = b.severity;
            break;
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          default:
            aValue = new Date(a.timestamp).getTime();
            bValue = new Date(b.timestamp).getTime();
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
  }, [mockAlerts, searchQuery, selectedType, selectedStatus, selectedSeverity, sortBy, sortOrder]);

  // Handler for creating new alerts
  const handleCreateAlert = () => {
    // This could open a modal or navigate to a create alert form
    alert('Create Alert functionality - This would typically open a form modal or navigate to a creation page.');
  };

  // Handler for clicking on an alert
  const handleAlertClick = (alert) => {
    console.log('Alert clicked:', alert);
    try {
      setSelectedAlert(alert);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error opening alert modal:', error);
    }
  };

  // Handler for closing the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAlert(null);
  };

  const getAlertIcon = (type) => {
    const iconMap = {
      critical: AlertTriangle,
      warning: AlertCircle,
      success: CheckCircle,
      info: Info
    };
    return iconMap[type] || Info;
  };

  const getAlertColors = (type) => {
    const colorMap = {
      critical: 'from-danger-500 to-danger-600 text-white',
      warning: 'from-warning-400 to-warning-500 text-white',
      success: 'from-success-500 to-success-600 text-white',
      info: 'from-primary-500 to-primary-600 text-white'
    };
    return colorMap[type] || colorMap.info;
  };

  const getPriorityColor = (priority) => {
    const colorMap = {
      urgent: 'bg-danger-100 text-danger-800 border-danger-200',
      high: 'bg-warning-100 text-warning-800 border-warning-200',
      medium: 'bg-primary-100 text-primary-800 border-primary-200',
      low: 'bg-surface-100 text-surface-600 border-surface-200'
    };
    return colorMap[priority] || colorMap.medium;
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'Database':
        return Database;
      case 'Network':
        return Network;
      case 'Security':
        return Shield;
      case 'Application':
        return Activity;
      default:
        return Server;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-primary-50 to-accent-50">
      {/* Enhanced Header */}
      <header className="bg-white border-b border-surface-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-8xl mx-auto px-4 md:px-8 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 md:space-x-6">
              <div className="flex items-center space-x-3 md:space-x-4">
                <div className="relative">
                  <div className="w-10 md:w-12 h-10 md:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Layers3 className="w-5 md:w-6 h-5 md:h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-success-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gradient">AlertGuard Pro</h1>
                  <p className="text-xs md:text-sm text-surface-600 font-medium">Advanced Monitoring Suite</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 md:space-x-6">
              {/* Quick Actions - Hidden on mobile */}
              <div className="hidden lg:flex items-center space-x-3">
                <button className="px-4 py-3 bg-surface-100 hover:bg-surface-200 rounded-xl text-sm font-medium text-surface-700 hover:text-primary-600 flex items-center space-x-2 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                <button className="px-4 py-3 bg-surface-100 hover:bg-surface-200 rounded-xl text-sm font-medium text-surface-700 hover:text-primary-600 flex items-center space-x-2 transition-colors">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              </div>
              
              {/* Create Alert Button */}
              <button
                onClick={handleCreateAlert}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold flex items-center space-x-2 md:space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                <Plus className="w-4 md:w-5 h-4 md:h-5" />
                <span className="hidden sm:inline">Create Alert</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-8xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {/* Enhanced Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-8 md:mb-12">
          {/* System Health Score */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-surface-200 animate-fade-in-up relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-success-100 to-success-200 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Gauge className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-surface-800">{stats.healthScore}%</div>
                  <div className="text-sm text-surface-600 font-medium">System Health</div>
                </div>
              </div>
              <div className="w-full bg-surface-200 rounded-full h-3 mb-3">
                <div 
                  className="bg-gradient-to-r from-success-400 to-success-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-inner"
                  style={{ width: `${stats.healthScore}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs text-surface-600">
                <span>Poor</span>
                <span>Excellent</span>
              </div>
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-surface-200 animate-fade-in-up delay-100 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  stats.trends.alerts === 'increasing' ? 'bg-warning-100 text-warning-800' : 'bg-success-100 text-success-800'
                }`}>
                  {stats.trends.alerts === 'increasing' ? '↗ Rising' : '→ Stable'}
                </div>
              </div>
              <div className="text-3xl font-bold text-surface-800 mb-1">{stats.activeAlerts}</div>
              <div className="text-sm text-surface-600 font-medium mb-3">Active Alerts</div>
              <div className="flex items-center space-x-2 text-xs text-surface-500">
                <Clock className="w-3 h-3" />
                <span>Last updated just now</span>
              </div>
            </div>
          </div>

          {/* Critical Alerts */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-surface-200 animate-fade-in-up delay-200 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-danger-100 to-danger-200 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-danger-500 to-danger-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                {stats.criticalAlerts > 0 && (
                  <div className="w-3 h-3 bg-danger-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <div className="text-3xl font-bold text-surface-800 mb-1">{stats.criticalAlerts}</div>
              <div className="text-sm text-surface-600 font-medium mb-3">Critical Issues</div>
              <div className="text-xs text-danger-600 font-semibold">
                {stats.criticalAlerts > 0 ? 'Requires immediate attention' : 'All systems stable'}
              </div>
            </div>
          </div>

          {/* Systems Affected */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-surface-200 animate-fade-in-up delay-300 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-100 to-accent-200 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <div className="text-xs text-surface-500 font-medium">of 8 systems</div>
              </div>
              <div className="text-3xl font-bold text-surface-800 mb-1">{stats.systemsAffected}</div>
              <div className="text-sm text-surface-600 font-medium mb-3">Systems Affected</div>
              <div className="flex space-x-1">
                {Array.from({ length: 8 }, (_, i) => (
                  <div 
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < stats.systemsAffected ? 'bg-accent-500' : 'bg-surface-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Section */}
        <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 mb-6 md:mb-8 border border-surface-200 shadow-sm">
          <div className="flex flex-col space-y-6">
            {/* Search Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-surface-800">Search & Filter</h3>
                <p className="text-sm text-surface-600">Find and organize your alerts</p>
              </div>
              <div className="text-sm text-surface-500">
                {filteredAlerts.length} of {mockAlerts.length} alerts
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
              {/* Enhanced Search */}
              <div className="lg:col-span-5">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <Search className="w-5 h-5 text-surface-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search alerts, assignees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 md:py-4 bg-surface-50 border border-surface-200 rounded-xl text-surface-800 placeholder-surface-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
                    >
                      <X className="w-4 h-4 text-surface-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Enhanced Filters */}
              <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                {/* Type Filter */}
                <div className="relative group">
                  <label className="text-xs font-medium text-surface-600 mb-2 block">Type</label>
                  <div className="relative">
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="appearance-none w-full px-4 py-3 pr-10 bg-surface-50 border border-surface-200 rounded-xl text-sm font-medium cursor-pointer focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    >
                      <option value="all">All Types</option>
                      <option value="critical">🔴 Critical</option>
                      <option value="warning">🟡 Warning</option>
                      <option value="info">🔵 Info</option>
                      <option value="success">🟢 Success</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none group-hover:text-primary-500 transition-colors" />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="relative group">
                  <label className="text-xs font-medium text-surface-600 mb-2 block">Status</label>
                  <div className="relative">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="appearance-none w-full px-4 py-3 pr-10 bg-surface-50 border border-surface-200 rounded-xl text-sm font-medium cursor-pointer focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    >
                      <option value="all">All Status</option>
                      <option value="active">⚡ Active</option>
                      <option value="resolved">✅ Resolved</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none group-hover:text-primary-500 transition-colors" />
                  </div>
                </div>

                {/* Severity Filter */}
                <div className="relative group">
                  <label className="text-xs font-medium text-surface-600 mb-2 block">Severity</label>
                  <div className="relative">
                    <select
                      value={selectedSeverity}
                      onChange={(e) => setSelectedSeverity(e.target.value)}
                      className="appearance-none w-full px-4 py-3 pr-10 bg-surface-50 border border-surface-200 rounded-xl text-sm font-medium cursor-pointer focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    >
                      <option value="all">All Levels</option>
                      <option value="5">Level 5 (Max)</option>
                      <option value="4">Level 4 (High)</option>
                      <option value="3">Level 3 (Med)</option>
                      <option value="2">Level 2 (Low)</option>
                      <option value="1">Level 1 (Min)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none group-hover:text-primary-500 transition-colors" />
                  </div>
                </div>

                {/* Sort & Actions */}
                <div className="relative group">
                  <label className="text-xs font-medium text-surface-600 mb-2 block">Sort & Actions</label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                          const [newSortBy, newSortOrder] = e.target.value.split('-');
                          setSortBy(newSortBy);
                          setSortOrder(newSortOrder);
                        }}
                        className="appearance-none w-full px-3 py-3 pr-8 bg-surface-50 border border-surface-200 rounded-xl text-sm font-medium cursor-pointer focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      >
                        <option value="timestamp-desc">🕐 Latest</option>
                        <option value="timestamp-asc">🕐 Oldest</option>
                        <option value="severity-desc">⚠️ High Severity</option>
                        <option value="title-asc">🔤 A-Z</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-surface-400 pointer-events-none" />
                    </div>
                    <button className="p-3 bg-surface-100 hover:bg-surface-200 rounded-xl text-surface-700 hover:text-primary-600 transition-all duration-300 hover:scale-105">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Filter Pills */}
            <div className="flex flex-wrap gap-3">
              <span className="text-xs font-medium text-surface-600">Quick filters:</span>
              {[
                { label: 'Critical Only', action: () => setSelectedType('critical') },
                { label: 'Active Alerts', action: () => setSelectedStatus('active') },
                { label: 'Unassigned', action: () => setSearchQuery('null') },
                { label: 'Last Hour', action: () => {/* Add time filter */} },
              ].map((filter) => (
                <button
                  key={filter.label}
                  onClick={filter.action}
                  className="px-3 py-1 text-xs font-medium bg-surface-100 hover:bg-primary-100 text-surface-600 hover:text-primary-700 rounded-full border border-surface-200 hover:border-primary-200 transition-all duration-200 hover:scale-105"
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Alerts Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-surface-800">
              Alert Overview
              <span className="ml-3 text-base font-normal text-surface-500">
                ({filteredAlerts.length} {filteredAlerts.length === 1 ? 'alert' : 'alerts'})
              </span>
            </h2>
          </div>

          {filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-2xl md:rounded-3xl p-12 md:p-16 text-center border border-surface-200 shadow-sm">
              <div className="w-20 h-20 bg-gradient-to-br from-surface-100 to-surface-200 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Archive className="w-8 h-8 text-surface-400" />
              </div>
              <h3 className="text-xl font-semibold text-surface-700 mb-3">No alerts found</h3>
              <p className="text-surface-500 max-w-md mx-auto leading-relaxed">
                {searchQuery || selectedType !== 'all' || selectedStatus !== 'all' || selectedSeverity !== 'all'
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : "Great news! No alerts are currently active in your system."}
              </p>
              {(searchQuery || selectedType !== 'all' || selectedStatus !== 'all' || selectedSeverity !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('all');
                    setSelectedStatus('all');
                    setSelectedSeverity('all');
                  }}
                  className="mt-6 btn-primary px-6 py-3 rounded-xl font-medium text-white hover:scale-105 transition-transform duration-300"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
              {filteredAlerts.map((alert, index) => {
                const Icon = getAlertIcon(alert.type);
                const colors = getAlertColors(alert.type);
                const SourceIcon = getSourceIcon(alert.source);
                
                return (
                  <div
                    key={alert.id}
                    className={`bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-surface-200 hover:border-primary-200 cursor-pointer group animate-fade-in-up shadow-sm hover:shadow-md transition-all duration-300`}
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => handleAlertClick(alert)}
                  >
                    {/* Alert Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="relative">
                        <div className={`w-16 h-16 bg-gradient-to-br ${colors} rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="w-8 h-8" />
                        </div>
                        {alert.status === 'active' && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-warning-400 rounded-full border-2 border-white animate-pulse"></div>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold border backdrop-blur-sm ${getPriorityColor(alert.priority)}`}>
                          {alert.priority.toUpperCase()}
                        </span>
                        <button className="p-2 text-surface-400 hover:text-surface-600 rounded-lg hover:bg-surface-100 transition-all duration-200 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Alert Content */}
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-surface-800 mb-3 line-clamp-2 group-hover:text-primary-700 transition-colors">
                        {alert.title}
                      </h3>
                      <p className="text-surface-600 text-sm leading-relaxed line-clamp-3 mb-4">
                        {alert.message}
                      </p>
                      
                      {/* Enhanced Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {alert.tags?.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 rounded-lg text-xs font-medium border border-primary-200 hover:from-primary-100 hover:to-primary-200 transition-all duration-200 cursor-pointer"
                            style={{ animationDelay: `${(index * 100) + (tagIndex * 50)}ms` }}
                          >
                            #{tag}
                          </span>
                        ))}
                        {alert.tags?.length > 3 && (
                          <span className="px-2 py-1 bg-surface-100 text-surface-500 rounded-lg text-xs font-medium">
                            +{alert.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Alert Footer */}
                    <div className="space-y-4">
                      {/* Time and Source Info */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2 text-surface-500">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{format(new Date(alert.timestamp), 'MMM dd, HH:mm')}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-surface-500">
                          <SourceIcon className="w-4 h-4" />
                          <span className="font-medium">{alert.source}</span>
                        </div>
                      </div>
                      
                      {/* Assignee Info */}
                      {alert.assignee ? (
                        <div className="flex items-center justify-between p-3 bg-surface-50 rounded-xl border border-surface-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-accent-400 to-accent-500 rounded-lg flex items-center justify-center shadow-sm">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-surface-700">{alert.assignee}</p>
                              <p className="text-xs text-surface-500">Assigned</p>
                            </div>
                          </div>
                          <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-warning-50 rounded-xl border border-warning-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-warning-400 to-warning-500 rounded-lg flex items-center justify-center shadow-sm">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-warning-800">Unassigned</p>
                              <p className="text-xs text-warning-600">Needs attention</p>
                            </div>
                          </div>
                          <div className="w-2 h-2 bg-warning-400 rounded-full animate-pulse"></div>
                        </div>
                      )}

                      {/* Enhanced Severity Indicator */}
                      <div className="flex items-center justify-between p-3 bg-surface-50 rounded-xl border border-surface-200">
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-semibold text-surface-700 uppercase tracking-wide">Severity Level</span>
                          <div className="flex space-x-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <div
                                key={i}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                  i < alert.severity
                                    ? alert.severity <= 2 ? 'bg-success-400 shadow-sm' :
                                      alert.severity <= 3 ? 'bg-warning-400 shadow-sm' :
                                      'bg-danger-400 shadow-sm animate-pulse'
                                    : 'bg-surface-200'
                                } ${i < alert.severity ? 'scale-110' : ''}`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`w-3 h-3 rounded-full shadow-sm ${
                            alert.status === 'resolved' ? 'bg-success-400' : 
                            alert.status === 'active' ? 'bg-danger-400 animate-pulse' : 'bg-warning-400'
                          }`}></span>
                          <span className="text-xs font-medium text-surface-600 capitalize">{alert.status}</span>
                        </div>
                      </div>

                      {/* Hover Action Button */}
                      <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button className="w-full py-2.5 bg-surface-100 hover:bg-primary-50 rounded-xl text-sm font-medium text-surface-700 hover:text-primary-600 transition-all duration-200">
                          View Details →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Enhanced Modal */}
      {isModalOpen && (
        <AlertModal
          isOpen={isModalOpen}
          alert={selectedAlert}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Dashboard;
