import React from 'react';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Server,
  Database,
  Network,
  Users,
  Target,
  Gauge,
  BarChart3,
  PieChart,
  Calendar,
  Download
} from 'lucide-react';
import { LineChart, BarChart, DonutChart, MetricCard, ServiceStatusGrid, AreaChart } from './Charts';

const AnalyticsView = () => {
  // Mock data for charts
  const alertTrendData = [
    { label: '00:00', value: 12 },
    { label: '04:00', value: 8 },
    { label: '08:00', value: 24 },
    { label: '12:00', value: 18 },
    { label: '16:00', value: 32 },
    { label: '20:00', value: 15 },
    { label: '24:00', value: 9 }
  ];

  const responseTimeData = [
    { label: '< 5min', value: 45 },
    { label: '5-15min', value: 32 },
    { label: '15-30min', value: 18 },
    { label: '30min+', value: 5 }
  ];

  const alertTypeDistribution = [
    { label: 'Infrastructure', value: 35 },
    { label: 'Application', value: 28 },
    { label: 'Security', value: 15 },
    { label: 'Database', value: 12 },
    { label: 'Network', value: 10 }
  ];

  const serviceStatusData = Array.from({ length: 64 }, (_, i) => ({
    name: `Service-${i + 1}`,
    status: ['healthy', 'warning', 'critical', 'unknown'][Math.floor(Math.random() * 4)]
  }));

  const resolutionTimeData = [
    { label: 'Mon', value: 25 },
    { label: 'Tue', value: 18 },
    { label: 'Wed', value: 32 },
    { label: 'Thu', value: 21 },
    { label: 'Fri', value: 28 },
    { label: 'Sat', value: 14 },
    { label: 'Sun', value: 16 }
  ];

  const uptimeData = [
    { label: 'Week 1', value: 99.95 },
    { label: 'Week 2', value: 99.87 },
    { label: 'Week 3', value: 99.99 },
    { label: 'Week 4', value: 99.92 },
    { label: 'Week 5', value: 99.98 },
    { label: 'Week 6', value: 99.96 }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-surface-900">Analytics Dashboard</h1>
          <p className="text-surface-600 mt-1">Performance insights and system metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select className="border border-surface-300 rounded-lg px-3 py-2 text-sm">
            <option>Last 24 hours</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Alerts"
          value="2,847"
          change="+12.5%"
          changeType="increase"
          icon={AlertTriangle}
          color="warning"
        />
        <MetricCard
          title="Resolved Alerts"
          value="2,445"
          change="+8.3%"
          changeType="increase"
          icon={CheckCircle}
          color="success"
        />
        <MetricCard
          title="Avg Response Time"
          value="8.2m"
          change="-15.2%"
          changeType="decrease"
          icon={Clock}
          color="primary"
        />
        <MetricCard
          title="System Uptime"
          value="99.97%"
          change="+0.02%"
          changeType="increase"
          icon={Activity}
          color="success"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart
          data={alertTrendData}
          title="Alert Volume (24 Hours)"
          color="warning"
          height={250}
        />
        <BarChart
          data={responseTimeData}
          title="Response Time Distribution"
          color="primary"
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DonutChart
          data={alertTypeDistribution}
          title="Alert Types"
          centerText="Total"
        />
        <AreaChart
          data={uptimeData}
          title="System Uptime Trend"
          color="success"
        />
        <ServiceStatusGrid
          services={serviceStatusData}
          title="Service Health"
        />
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-surface-900">Performance Metrics</h3>
          <div className="flex items-center space-x-2 text-sm text-surface-500">
            <Calendar className="w-4 h-4" />
            <span>Updated 5 minutes ago</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-full mx-auto mb-3">
              <Gauge className="w-8 h-8" />
            </div>
            <div className="text-2xl font-bold text-surface-900">94.2%</div>
            <div className="text-sm text-surface-600">Alert Accuracy</div>
            <div className="text-xs text-success-600 mt-1">+2.1% vs last week</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-green-50 text-green-600 rounded-full mx-auto mb-3">
              <Target className="w-8 h-8" />
            </div>
            <div className="text-2xl font-bold text-surface-900">96.8%</div>
            <div className="text-sm text-surface-600">SLA Compliance</div>
            <div className="text-xs text-success-600 mt-1">+0.5% vs last week</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-50 text-purple-600 rounded-full mx-auto mb-3">
              <Users className="w-8 h-8" />
            </div>
            <div className="text-2xl font-bold text-surface-900">23</div>
            <div className="text-sm text-surface-600">Active Responders</div>
            <div className="text-xs text-surface-500 mt-1">Across 8 teams</div>
          </div>
        </div>
      </div>

      {/* Resolution Trends */}
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <h3 className="text-xl font-semibold text-surface-900 mb-4">Resolution Trends</h3>
        <LineChart
          data={resolutionTimeData}
          title="Average Resolution Time (Minutes)"
          color="success"
          height={200}
        />
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-surface-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-semibold text-surface-900">Infrastructure</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-surface-600">Servers</span>
              <span className="font-medium text-surface-900">142/150</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-surface-600">Load Balancers</span>
              <span className="font-medium text-success-600">8/8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-surface-600">Storage</span>
              <span className="font-medium text-yellow-600">85% Used</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-semibold text-surface-900">Databases</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-surface-600">Primary DB</span>
              <span className="font-medium text-success-600">Healthy</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-surface-600">Read Replicas</span>
              <span className="font-medium text-success-600">5/5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-surface-600">Connections</span>
              <span className="font-medium text-surface-900">67/100</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Network className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-semibold text-surface-900">Network</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-surface-600">Bandwidth</span>
              <span className="font-medium text-surface-900">2.4 Gbps</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-surface-600">Latency</span>
              <span className="font-medium text-success-600">12ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-surface-600">Packet Loss</span>
              <span className="font-medium text-success-600">0.01%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
