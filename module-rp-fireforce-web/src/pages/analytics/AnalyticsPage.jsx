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
  Download,
  Filter,
  RefreshCw,
  Server,
  Database,
  Cloud,
  Cpu,
  HardDrive,
  LineChart,
  PieChart,
  BarChart2,
  Monitor,
  Gauge,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Shield,
  Zap,
  Target
} from 'lucide-react';
import AuditStatisticsPanel from './components/AuditStatisticsPanel';

const AnalyticsPage = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedChart, setSelectedChart] = useState('overview');

  // Mock data for charts
  const kpiData = [
    {
      title: 'Total Alerts',
      value: '2,847',
      change: '+12.3%',
      trend: 'up',
      icon: AlertTriangle,
      description: 'Last 7 days'
    },
    {
      title: 'Response Time',
      value: '4.2m',
      change: '-8.1%',
      trend: 'down',
      icon: Timer,
      description: 'Average MTTR'
    },
    {
      title: 'System Uptime',
      value: '99.97%',
      change: '+0.02%',
      trend: 'up',
      icon: CheckCircle,
      description: 'Last 30 days'
    },
    {
      title: 'Active Engineers',
      value: '24',
      change: '+2',
      trend: 'up',
      icon: Users,
      description: 'On-call team'
    }
  ];

  const alertVolumeData = [
    { time: '00:00', critical: 8, warning: 15, info: 12, total: 35 },
    { time: '04:00', critical: 3, warning: 8, info: 6, total: 17 },
    { time: '08:00', critical: 12, warning: 24, info: 18, total: 54 },
    { time: '12:00', critical: 18, warning: 32, info: 25, total: 75 },
    { time: '16:00', critical: 15, warning: 28, info: 22, total: 65 },
    { time: '20:00', critical: 9, warning: 19, info: 14, total: 42 }
  ];

  const systemMetrics = [
    { name: 'CPU Usage', value: 78, max: 100, color: 'bg-blue-500', status: 'normal' },
    { name: 'Memory', value: 84, max: 100, color: 'bg-yellow-500', status: 'warning' },
    { name: 'Disk I/O', value: 45, max: 100, color: 'bg-green-500', status: 'good' },
    { name: 'Network', value: 92, max: 100, color: 'bg-red-500', status: 'critical' }
  ];

  const alertsBySource = [
    { name: 'Grafana', count: 847, percentage: 35.2, color: 'bg-orange-500' },
    { name: 'AWS CloudWatch', count: 623, percentage: 25.9, color: 'bg-blue-500' },
    { name: 'Prometheus', count: 456, percentage: 18.9, color: 'bg-green-500' },
    { name: 'DataDog', count: 321, percentage: 13.3, color: 'bg-purple-500' },
    { name: 'New Relic', count: 167, percentage: 6.9, color: 'bg-red-500' }
  ];

  const responseTimeDistribution = [
    { range: '0-2 min', count: 1247, percentage: 45.2 },
    { range: '2-5 min', count: 856, percentage: 31.0 },
    { range: '5-10 min', count: 423, percentage: 15.3 },
    { range: '10-15 min', count: 167, percentage: 6.0 },
    { range: '15+ min', count: 69, percentage: 2.5 }
  ];

  const weeklyTrends = [
    { day: 'Mon', alerts: 345, resolved: 312, avgTime: 4.2 },
    { day: 'Tue', alerts: 287, resolved: 269, avgTime: 3.8 },
    { day: 'Wed', alerts: 412, resolved: 389, avgTime: 5.1 },
    { day: 'Thu', alerts: 356, resolved: 334, avgTime: 4.7 },
    { day: 'Fri', alerts: 423, resolved: 398, avgTime: 4.3 },
    { day: 'Sat', attempts: 198, resolved: 186, avgTime: 3.2 },
    { day: 'Sun', alerts: 167, resolved: 158, avgTime: 2.9 }
  ];

  const serviceHealth = [
    { service: 'Web Server', status: 'healthy', latency: '45ms', uptime: '99.99%' },
    { service: 'Database', status: 'healthy', latency: '12ms', uptime: '99.97%' },
    { service: 'API Gateway', status: 'warning', latency: '156ms', uptime: '99.89%' },
    { service: 'Cache Layer', status: 'healthy', latency: '8ms', uptime: '99.98%' },
    { service: 'Message Queue', status: 'critical', latency: '234ms', uptime: '98.45%' }
  ];

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
            <Filter className="w-4 h-4 mr-2 text-gray-600" />
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

      {/* Audit Statistics Section */}
      <div className="mb-8">
        <AuditStatisticsPanel className="shadow-sm" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Alert Volume Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Alert Volume Trends</h2>
            <div className="flex items-center space-x-2">
              <LineChart className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Last 24 Hours</span>
            </div>
          </div>
          
          <div className="h-80 mb-4">
            <div className="relative h-full bg-gray-50 rounded-lg p-4">
              <div className="absolute inset-4">
                {/* Y-axis */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 w-8">
                  <span>80</span>
                  <span>60</span>
                  <span>40</span>
                  <span>20</span>
                  <span>0</span>
                </div>
                
                {/* Chart area */}
                <div className="ml-12 mr-4 h-full relative">
                  {/* Grid lines */}
                  <div className="absolute inset-0">
                    {[0, 25, 50, 75, 100].map((y) => (
                      <div key={y} className="absolute w-full border-t border-gray-200" style={{ bottom: `${y}%` }}></div>
                    ))}
                  </div>
                  
                  {/* Bars */}
                  <div className="relative h-full flex items-end justify-between">
                    {alertVolumeData.map((data, index) => (
                      <div key={index} className="flex flex-col items-center w-16">
                        <div className="relative w-full h-full flex flex-col justify-end">
                          <div className="w-full flex flex-col space-y-0.5">
                            <div 
                              className="bg-red-500 rounded-t-sm w-full" 
                              style={{ height: `${(data.critical / 20) * 100}%` }}
                              title={`Critical: ${data.critical}`}
                            ></div>
                            <div 
                              className="bg-yellow-500 w-full" 
                              style={{ height: `${(data.warning / 35) * 100}%` }}
                              title={`Warning: ${data.warning}`}
                            ></div>
                            <div 
                              className="bg-blue-500 rounded-b-sm w-full" 
                              style={{ height: `${(data.info / 25) * 100}%` }}
                              title={`Info: ${data.info}`}
                            ></div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 mt-2">{data.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center space-x-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Critical</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Warning</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Info</span>
            </div>
          </div>
        </div>

        {/* System Metrics Gauge */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">System Metrics</h2>
            <Gauge className="w-4 h-4 text-gray-500" />
          </div>
          
          <div className="space-y-6">
            {systemMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{metric.name}</span>
                  <span className="text-sm font-bold text-gray-900">{metric.value}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${metric.color} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${metric.value}%` }}
                  ></div>
                </div>
                <div className={`text-xs font-medium ${
                  metric.status === 'critical' ? 'text-red-600' :
                  metric.status === 'warning' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {metric.status.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Alert Sources Pie Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Alerts by Source</h2>
            <PieChart className="w-4 h-4 text-gray-500" />
          </div>
          
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              {/* Pie chart visualization */}
              <div className="w-full h-full rounded-full bg-gradient-to-r from-orange-400 via-blue-400 via-green-400 via-purple-400 to-red-400"></div>
              <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">2,414</div>
                  <div className="text-sm text-gray-600">Total Alerts</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {alertsBySource.map((source, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 ${source.color} rounded mr-3`}></div>
                  <span className="text-sm font-medium text-gray-700">{source.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">{source.count}</div>
                  <div className="text-xs text-gray-500">{source.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Response Time Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Response Time Distribution</h2>
            <BarChart2 className="w-4 h-4 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            {responseTimeDistribution.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{item.range}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{item.count}</span>
                    <span className="text-xs text-gray-500 ml-2">({item.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${item.percentage * 2}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Weekly Trends */}
        <div className="xl:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Weekly Alert Trends</h2>
            <BarChart3 className="w-4 h-4 text-gray-500" />
          </div>
          
          <div className="h-64">
            <div className="relative h-full bg-gray-50 rounded-lg p-4">
              <div className="absolute inset-4">
                {/* Y-axis */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 w-12">
                  <span>500</span>
                  <span>400</span>
                  <span>300</span>
                  <span>200</span>
                  <span>100</span>
                  <span>0</span>
                </div>
                
                {/* Chart area */}
                <div className="ml-16 mr-4 h-full relative">
                  {/* Grid lines */}
                  <div className="absolute inset-0">
                    {[0, 20, 40, 60, 80, 100].map((y) => (
                      <div key={y} className="absolute w-full border-t border-gray-200" style={{ bottom: `${y}%` }}></div>
                    ))}
                  </div>
                  
                  {/* Bars */}
                  <div className="relative h-full flex items-end justify-between">
                    {weeklyTrends.map((day, index) => (
                      <div key={index} className="flex flex-col items-center w-16">
                        <div className="relative w-full h-full flex flex-col justify-end space-y-1">
                          <div 
                            className="bg-blue-500 rounded-t-sm w-8 mx-auto" 
                            style={{ height: `${(day.alerts / 500) * 100}%` }}
                            title={`Alerts: ${day.alerts}`}
                          ></div>
                          <div 
                            className="bg-green-500 rounded-t-sm w-8 mx-auto" 
                            style={{ height: `${(day.resolved / 500) * 100}%` }}
                            title={`Resolved: ${day.resolved}`}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 mt-2">{day.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center space-x-6 mt-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Alerts</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Resolved</span>
            </div>
          </div>
        </div>

        {/* Service Health */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Service Health</h2>
            <Monitor className="w-4 h-4 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            {serviceHealth.map((service, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{service.service}</span>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    service.status === 'healthy' ? 'bg-green-100 text-green-800' :
                    service.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {service.status.toUpperCase()}
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Latency:</span>
                    <span className="font-medium text-gray-900">{service.latency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uptime:</span>
                    <span className="font-medium text-gray-900">{service.uptime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
