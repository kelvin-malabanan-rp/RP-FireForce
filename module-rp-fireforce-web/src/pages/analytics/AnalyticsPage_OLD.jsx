import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  ChevronDown,
  MapPin,
  Zap,
  Shield,
  Target,
  TrendingDown,
  Server,
  Database,
  Cloud,
  Cpu,
  HardDrive,
  Wifi,
  Bug,
  AlertCircle,
  Eye,
  LineChart,
  PieChart,
  BarChart2,
  Monitor,
  Gauge,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const AnalyticsPage = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('alerts');
  const [currentPage, setCurrentPage] = useState(1);

  // Mock data for IT/DevOps analytics
  const kpiData = [
    {
      title: 'Active Alerts',
      value: '147',
      change: '+8.2%',
      trend: 'up',
      icon: AlertTriangle,
      color: 'red',
      description: 'Critical & Warning alerts'
    },
    {
      title: 'MTTR',
      value: '12.3 min',
      change: '-15.4%',
      trend: 'down',
      icon: Timer,
      color: 'blue',
      description: 'Mean Time To Resolution'
    },
    {
      title: 'System Uptime',
      value: '99.97%',
      change: '+0.02%',
      trend: 'up',
      icon: CheckCircle,
      color: 'green',
      description: 'Last 30 days availability'
    },
    {
      title: 'On-Call Engineers',
      value: '12',
      change: '0%',
      trend: 'stable',
      icon: Users,
      color: 'purple',
      description: 'Currently available'
    }
  ];

  const alertsBySource = [
    { source: 'Grafana', count: 423, percentage: 35.2, color: 'bg-orange-500', icon: BarChart3 },
    { source: 'AWS CloudWatch', count: 298, percentage: 24.8, color: 'bg-yellow-500', icon: Cloud },
    { source: 'Prometheus', count: 187, percentage: 15.6, color: 'bg-red-500', icon: Activity },
    { source: 'DataDog', count: 154, percentage: 12.8, color: 'bg-purple-500', icon: Monitor },
    { source: 'New Relic', count: 89, percentage: 7.4, color: 'bg-blue-500', icon: Eye },
    { source: 'Other', count: 51, percentage: 4.2, color: 'bg-gray-500', icon: Server }
  ];

  const alertsBySeverity = [
    { severity: 'Critical', count: 23, percentage: 15.6, color: 'bg-red-600' },
    { severity: 'High', count: 45, percentage: 30.6, color: 'bg-red-400' },
    { severity: 'Medium', count: 52, percentage: 35.4, color: 'bg-yellow-500' },
    { severity: 'Low', count: 27, percentage: 18.4, color: 'bg-green-500' }
  ];

  const systemMetrics = [
    { name: 'CPU Usage', current: 68, threshold: 80, status: 'normal', color: 'green' },
    { name: 'Memory Usage', current: 84, threshold: 85, status: 'warning', color: 'yellow' },
    { name: 'Disk I/O', current: 45, threshold: 70, status: 'normal', color: 'green' },
    { name: 'Network Load', current: 92, threshold: 90, status: 'critical', color: 'red' }
  ];

  const alertVolumeData = [
    { time: '00:00', alerts: 12, resolved: 8, critical: 2, warning: 6, info: 4 },
    { time: '04:00', alerts: 8, resolved: 10, critical: 1, warning: 4, info: 3 },
    { time: '08:00', alerts: 24, resolved: 18, critical: 5, warning: 12, info: 7 },
    { time: '12:00', alerts: 31, resolved: 25, critical: 8, warning: 15, info: 8 },
    { time: '16:00', alerts: 28, resolved: 22, critical: 6, warning: 14, info: 8 },
    { time: '20:00', alerts: 19, resolved: 15, critical: 3, warning: 10, info: 6 }
  ];

  const historicalTrends = [
    { date: 'Oct 01', alerts: 145, mttr: 12.3, uptime: 99.97, incidents: 23 },
    { date: 'Sep 30', alerts: 167, mttr: 15.2, uptime: 99.89, incidents: 31 },
    { date: 'Sep 29', alerts: 134, mttr: 11.8, uptime: 99.98, incidents: 18 },
    { date: 'Sep 28', alerts: 189, mttr: 18.4, uptime: 99.76, incidents: 42 },
    { date: 'Sep 27', alerts: 156, mttr: 13.7, uptime: 99.91, incidents: 28 },
    { date: 'Sep 26', alerts: 142, mttr: 10.9, uptime: 99.99, incidents: 15 },
    { date: 'Sep 25', alerts: 178, mttr: 16.8, uptime: 99.82, incidents: 35 }
  ];

  const weeklyComparison = [
    { week: 'This Week', alerts: 1247, resolved: 1168, mttr: 12.3, uptime: 99.94 },
    { week: 'Last Week', alerts: 1389, resolved: 1298, mttr: 15.7, uptime: 99.87 },
    { week: '2 Weeks Ago', alerts: 1156, resolved: 1089, mttr: 11.2, uptime: 99.98 },
    { week: '3 Weeks Ago', alerts: 1423, resolved: 1312, mttr: 17.9, uptime: 99.81 }
  ];

  const alertPatterns = [
    { hour: '00', mon: 8, tue: 12, wed: 6, thu: 9, fri: 15, sat: 4, sun: 3 },
    { hour: '04', mon: 5, tue: 7, wed: 4, thu: 6, fri: 9, sat: 2, sun: 1 },
    { hour: '08', mon: 24, tue: 28, wed: 31, thu: 26, fri: 34, sat: 12, sun: 8 },
    { hour: '12', mon: 35, tue: 42, wed: 38, thu: 41, fri: 45, sat: 18, sun: 14 },
    { hour: '16', mon: 28, tue: 32, wed: 29, thu: 33, fri: 37, sat: 15, sun: 11 },
    { hour: '20', mon: 18, tue: 22, wed: 19, thu: 21, fri: 25, sat: 9, sun: 7 }
  ];

  const responseTimeHistogram = [
    { range: '0-2 min', count: 523, percentage: 42.1 },
    { range: '2-5 min', count: 387, percentage: 31.2 },
    { range: '5-10 min', count: 215, percentage: 17.3 },
    { range: '10-15 min', count: 87, percentage: 7.0 },
    { range: '15+ min', count: 31, percentage: 2.4 }
  ];

  const alertSourceTrends = [
    { source: 'Grafana', day1: 45, day2: 52, day3: 48, day4: 61, day5: 57, day6: 43, day7: 52 },
    { source: 'AWS CloudWatch', day1: 38, day2: 41, day3: 35, day4: 49, day5: 44, day6: 32, day7: 41 },
    { source: 'Prometheus', day1: 28, day2: 33, day3: 31, day4: 37, day5: 35, day6: 25, day7: 32 },
    { source: 'DataDog', day1: 22, day2: 26, day3: 24, day4: 31, day5: 28, day6: 19, day7: 25 }
  ];

  const performanceMetrics = [
    { metric: 'API Response Time', current: '245ms', target: '< 300ms', trend: 'stable' },
    { metric: 'Database Query Time', current: '89ms', target: '< 100ms', trend: 'improving' },
    { metric: 'Error Rate', current: '0.02%', target: '< 0.1%', trend: 'stable' },
    { metric: 'Throughput', current: '1,247 req/min', target: '> 1,000 req/min', trend: 'improving' }
  ];

  const infrastructureHealth = [
    { component: 'Web Servers', status: 'healthy', uptime: '99.99%', instances: 8 },
    { component: 'Database Cluster', status: 'healthy', uptime: '99.97%', instances: 3 },
    { component: 'Load Balancers', status: 'warning', uptime: '99.85%', instances: 2 },
    { component: 'Cache Layer', status: 'healthy', uptime: '99.98%', instances: 4 },
    { component: 'Message Queue', status: 'critical', uptime: '98.45%', instances: 2 }
  ];

  const topAlertEngineers = [
    { name: 'Sarah Chen', alerts: 47, avgResponse: '4.2 min', resolved: 44, rating: 94 },
    { name: 'Mike Rodriguez', alerts: 42, avgResponse: '5.1 min', resolved: 39, rating: 93 },
    { name: 'Alex Kumar', alerts: 38, avgResponse: '3.8 min', resolved: 35, rating: 92 },
    { name: 'Emma Watson', alerts: 35, avgResponse: '6.2 min', resolved: 31, rating: 89 },
    { name: 'David Park', alerts: 33, avgResponse: '4.9 min', resolved: 29, rating: 88 }
  ];

  const criticalServices = [
    { service: 'User Authentication API', status: 'healthy', latency: '23ms', errors: '0.01%' },
    { service: 'Payment Gateway', status: 'healthy', latency: '156ms', errors: '0.03%' },
    { service: 'Notification Service', status: 'warning', latency: '287ms', errors: '0.12%' },
    { service: 'File Storage API', status: 'healthy', latency: '89ms', errors: '0.02%' },
    { service: 'Analytics Engine', status: 'critical', latency: '543ms', errors: '0.45%' }
  ];

  const recentAlerts = [
    { id: 1, type: 'Critical', message: 'High CPU usage detected on prod-web-01 (92%)', source: 'Grafana', time: '2 min ago', status: 'active', engineer: 'Sarah Chen' },
    { id: 2, type: 'Resolved', message: 'Database connection pool exhausted - Auto-scaled', source: 'AWS CloudWatch', time: '8 min ago', status: 'resolved', engineer: 'Mike Rodriguez' },
    { id: 3, type: 'Warning', message: 'Memory usage above threshold on api-server-03', source: 'Prometheus', time: '15 min ago', status: 'investigating', engineer: 'Alex Kumar' },
    { id: 4, type: 'Info', message: 'Scheduled maintenance completed successfully', source: 'DataDog', time: '23 min ago', status: 'resolved', engineer: 'Emma Watson' },
    { id: 5, type: 'Critical', message: 'SSL certificate expires in 7 days', source: 'New Relic', time: '45 min ago', status: 'acknowledged', engineer: 'David Park' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800 border-red-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'alert': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
      return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 space-y-4 lg:space-y-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Real-time monitoring and performance insights</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
          
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  kpi.trend === 'up' ? 'bg-green-100 text-green-800' : 
                  kpi.trend === 'down' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : kpi.trend === 'down' ? (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  ) : (
                    <Activity className="w-3 h-3 mr-1" />
                  )}
                  {kpi.change}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</h3>
                <p className="text-sm text-gray-600">{kpi.title}</p>
                <p className="text-xs text-gray-500 mt-1">{kpi.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Alert Volume Trend Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Alert Volume Trends</h2>
            <div className="flex items-center space-x-2">
              <LineChart className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Last 24 Hours</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {alertsBySource.map((alert, index) => {
              const Icon = alert.icon;
              return (
                <div key={index} className="flex items-center">
                  <div className="flex items-center w-40">
                    <Icon className="w-4 h-4 mr-2 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{alert.source}</span>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${alert.color} transition-all duration-500`}
                        style={{ width: `${alert.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm font-bold text-gray-900">{alert.count}</span>
                    <span className="text-xs text-gray-500 ml-1">({alert.percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Health Metrics */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">System Metrics</h2>
            <Gauge className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            {systemMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{metric.name}</span>
                  <span className={`text-sm font-bold ${
                    metric.status === 'critical' ? 'text-red-600' : 
                    metric.status === 'warning' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {metric.current}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      metric.status === 'critical' ? 'bg-red-500' : 
                      metric.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${metric.current}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span className="border-l border-gray-300 pl-1">Threshold: {metric.threshold}%</span>
                  <span>100%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Volume and Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Alert Volume Over Time */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Alert Volume Trends</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">New Alerts</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Resolved</span>
              </div>
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-between space-x-2">
            {alertVolumeData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                <div className="flex flex-col w-full space-y-1">
                  <div 
                    className="w-full bg-red-500 rounded-t"
                    style={{ height: `${(data.alerts / 35) * 200}px` }}
                  ></div>
                  <div 
                    className="w-full bg-green-500 rounded-b"
                    style={{ height: `${(data.resolved / 35) * 200}px` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 mt-2">{data.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alert Severity Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Alert Severity Distribution</h2>
            <PieChart className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            {alertsBySeverity.map((alert, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${alert.color}`}></div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">{alert.severity}</span>
                    <div className="text-xs text-gray-500">{alert.count} alerts</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${alert.color}`}
                      style={{ width: `${alert.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {alert.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{alertsBySeverity.reduce((sum, alert) => sum + alert.count, 0)}</div>
              <div className="text-sm text-gray-600">Total Active Alerts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Infrastructure Health and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Infrastructure Health */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Infrastructure Health</h2>
            <Server className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            {infrastructureHealth.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    item.status === 'healthy' ? 'bg-green-500 animate-pulse' :
                    item.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'
                  }`}></div>
                  <div>
                    <h3 className="font-medium text-gray-900">{item.component}</h3>
                    <p className="text-sm text-gray-600">{item.instances} instances</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    item.status === 'healthy' ? 'text-green-600' :
                    item.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {item.uptime}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    item.status === 'healthy' ? 'bg-green-100 text-green-800' :
                    item.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {item.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Performance Metrics</h2>
            <LineChart className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">{metric.metric}</h3>
                  <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    metric.trend === 'improving' ? 'bg-green-100 text-green-800' :
                    metric.trend === 'degrading' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {metric.trend === 'improving' ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : metric.trend === 'degrading' ? (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    ) : (
                      <Activity className="w-3 h-3 mr-1" />
                    )}
                    {metric.trend}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900">{metric.current}</div>
                    <div className="text-xs text-gray-500">Target: {metric.target}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Alerts and Critical Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Recent Alerts */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Alerts</h2>
            <Activity className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  alert.type === 'Critical' ? 'bg-red-500 animate-pulse' :
                  alert.type === 'Warning' ? 'bg-yellow-500' :
                  alert.type === 'Resolved' ? 'bg-green-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(alert.status)}`}>
                      {alert.type}
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {alert.source}
                    </div>
                  </div>
                  <p className="text-sm text-gray-900 leading-relaxed">{alert.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">{alert.time}</p>
                    <p className="text-xs text-blue-600 font-medium">{alert.engineer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Services Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Critical Services</h2>
            <Shield className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            {criticalServices.map((service, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 text-sm">{service.service}</h3>
                  <div className={`w-2 h-2 rounded-full ${
                    service.status === 'healthy' ? 'bg-green-500' :
                    service.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'
                  }`}></div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Latency:</span>
                    <span className="font-medium">{service.latency}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Error Rate:</span>
                    <span className="font-medium">{service.errors}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Historical Trends Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 7-Day Historical Trends */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">7-Day Historical Trends</h2>
            <LineChart className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-6">
            {/* Alert Volume Trend Line */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Daily Alert Volume</span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-1 bg-blue-500 rounded mr-2"></div>
                    <span className="text-xs text-gray-600">Alerts</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-1 bg-red-500 rounded mr-2"></div>
                    <span className="text-xs text-gray-600">MTTR</span>
                  </div>
                </div>
              </div>
              <div className="h-32 flex items-end justify-between space-x-1">
                {historicalTrends.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                    <div className="w-full flex flex-col space-y-1">
                      <div 
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${(day.alerts / 200) * 100}px` }}
                      ></div>
                      <div 
                        className="w-full bg-red-400 rounded-b"
                        style={{ height: `${(day.mttr / 20) * 60}px` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 transform -rotate-45">{day.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Uptime Trend */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">System Uptime %</span>
                <span className="text-xs text-green-600 font-medium">Target: 99.9%</span>
              </div>
              <div className="h-16 flex items-end justify-between space-x-1">
                {historicalTrends.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className={`w-full rounded-t ${day.uptime >= 99.9 ? 'bg-green-500' : day.uptime >= 99.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ height: `${((day.uptime - 99) / 1) * 50}px` }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Performance Comparison */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Weekly Performance Comparison</h2>
            <BarChart2 className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            {weeklyComparison.map((week, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-900">{week.week}</h3>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    index === 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {index === 0 ? 'Current' : `${index} week${index > 1 ? 's' : ''} ago`}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Alerts</div>
                    <div className="font-bold text-gray-900">{week.alerts.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">
                      Resolved: {week.resolved.toLocaleString()} ({((week.resolved/week.alerts)*100).toFixed(1)}%)
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">MTTR / Uptime</div>
                    <div className="font-bold text-gray-900">{week.mttr} min</div>
                    <div className="text-xs text-green-600">{week.uptime}% uptime</div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
                      style={{ width: `${(week.resolved/week.alerts)*100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Patterns and Response Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Heat Map - Alert Patterns */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Alert Patterns Heat Map</h2>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Hourly by Day of Week</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="grid grid-cols-8 gap-1 text-xs text-gray-600 mb-2">
              <div></div>
              <div className="text-center">Mon</div>
              <div className="text-center">Tue</div>
              <div className="text-center">Wed</div>
              <div className="text-center">Thu</div>
              <div className="text-center">Fri</div>
              <div className="text-center">Sat</div>
              <div className="text-center">Sun</div>
            </div>
            
            {alertPatterns.map((pattern, index) => (
              <div key={index} className="grid grid-cols-8 gap-1">
                <div className="text-xs text-gray-600 text-right pr-2">{pattern.hour}:00</div>
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                  <div
                    key={day}
                    className={`h-8 rounded flex items-center justify-center text-xs font-medium ${
                      pattern[day] >= 30 ? 'bg-red-500 text-white' :
                      pattern[day] >= 20 ? 'bg-red-300 text-white' :
                      pattern[day] >= 10 ? 'bg-yellow-300 text-gray-800' :
                      pattern[day] >= 5 ? 'bg-green-300 text-gray-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {pattern[day]}
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
            <span>Low Activity</span>
            <div className="flex space-x-1">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <div className="w-4 h-4 bg-green-300 rounded"></div>
              <div className="w-4 h-4 bg-yellow-300 rounded"></div>
              <div className="w-4 h-4 bg-red-300 rounded"></div>
              <div className="w-4 h-4 bg-red-500 rounded"></div>
            </div>
            <span>High Activity</span>
          </div>
        </div>

        {/* Response Time Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Response Time Distribution</h2>
            <Timer className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            {responseTimeHistogram.map((bucket, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{bucket.range}</span>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{bucket.count}</div>
                    <div className="text-xs text-gray-500">{bucket.percentage}%</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      index === 0 ? 'bg-green-500' :
                      index === 1 ? 'bg-blue-500' :
                      index === 2 ? 'bg-yellow-500' :
                      index === 3 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${bucket.percentage * 2}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-900">73.3%</div>
              <div className="text-sm text-blue-700">Alerts resolved within 5 minutes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Source Trends and Top Engineers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Alert Source Trends Over Time */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Alert Source Trends (7 Days)</h2>
            <TrendingUp className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-6">
            {alertSourceTrends.map((source, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">{source.source}</span>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    source.day7 > source.day1 ? 'bg-red-100 text-red-800' : 
                    source.day7 < source.day1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {source.day7 > source.day1 ? '+' : ''}
                    {((source.day7 - source.day1) / source.day1 * 100).toFixed(1)}%
                  </div>
                </div>
                
                <div className="h-16 flex items-end justify-between space-x-1">
                  {[source.day1, source.day2, source.day3, source.day4, source.day5, source.day6, source.day7].map((value, dayIndex) => (
                    <div key={dayIndex} className="flex-1 flex flex-col items-center">
                      <div 
                        className={`w-full rounded-t transition-all duration-300 ${
                          index === 0 ? 'bg-orange-500' :
                          index === 1 ? 'bg-yellow-500' :
                          index === 2 ? 'bg-red-500' : 'bg-purple-500'
                        }`}
                        style={{ height: `${(value / 70) * 50}px` }}
                      ></div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Day 1</span>
                  <span>Day 7</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Alert Engineers */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Top Alert Engineers</h2>
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">Last 30 Days</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {topAlertEngineers.map((engineer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{engineer.name}</h3>
                    <p className="text-sm text-gray-600">{engineer.alerts} alerts • {engineer.avgResponse}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">{engineer.resolved} resolved</div>
                  <div className="flex items-center mt-1">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full"
                        style={{ width: `${engineer.rating}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">{engineer.rating}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-600">Team Average Performance</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">91.2%</div>
              <div className="text-xs text-green-600">+2.3% from last month</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
