import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  Globe, 
  Layers3,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Activity,
  BarChart3,
  Settings,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Zap,
  Shield,
  Network
} from 'lucide-react';

const ServicesView = () => {
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [filterStatus, setFilterStatus] = useState('all');

  const services = [
    {
      id: 'user-auth',
      name: 'User Authentication',
      description: 'OAuth and SSO service',
      status: 'healthy',
      uptime: '99.95%',
      responseTime: '125ms',
      type: 'api',
      version: 'v2.1.4',
      dependencies: ['Database', 'Redis Cache'],
      incidents: 0,
      alerts: 2,
      owner: 'Security Team',
      lastDeployment: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'payment-api',
      name: 'Payment Gateway',
      description: 'Payment processing service',
      status: 'degraded',
      uptime: '98.2%',
      responseTime: '850ms',
      type: 'api',
      version: 'v1.8.2',
      dependencies: ['Database', 'External Payment API'],
      incidents: 1,
      alerts: 5,
      owner: 'Payments Team',
      lastDeployment: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'notification-service',
      name: 'Notification Service',
      description: 'Email and push notifications',
      status: 'healthy',
      uptime: '99.8%',
      responseTime: '95ms',
      type: 'service',
      version: 'v3.2.1',
      dependencies: ['Message Queue', 'Email Provider'],
      incidents: 0,
      alerts: 1,
      owner: 'Platform Team',
      lastDeployment: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'web-frontend',
      name: 'Web Application',
      description: 'Main customer-facing web app',
      status: 'healthy',
      uptime: '99.99%',
      responseTime: '200ms',
      type: 'frontend',
      version: 'v4.1.0',
      dependencies: ['CDN', 'API Gateway'],
      incidents: 0,
      alerts: 0,
      owner: 'Frontend Team',
      lastDeployment: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'database-primary',
      name: 'Primary Database',
      description: 'PostgreSQL primary instance',
      status: 'critical',
      uptime: '97.1%',
      responseTime: '45ms',
      type: 'database',
      version: 'PostgreSQL 15.2',
      dependencies: ['Storage', 'Monitoring'],
      incidents: 2,
      alerts: 8,
      owner: 'Database Team',
      lastDeployment: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'api-gateway',
      name: 'API Gateway',
      description: 'Central API routing and management',
      status: 'healthy',
      uptime: '99.92%',
      responseTime: '75ms',
      type: 'gateway',
      version: 'v2.5.1',
      dependencies: ['Load Balancer', 'Authentication'],
      incidents: 0,
      alerts: 1,
      owner: 'Platform Team',
      lastDeployment: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'degraded': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-surface-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      healthy: 'bg-success-100 text-success-700',
      degraded: 'bg-yellow-100 text-yellow-700',
      critical: 'bg-red-100 text-red-700',
      unknown: 'bg-surface-100 text-surface-700'
    };
    return `px-3 py-1 rounded-full text-xs font-medium ${colors[status]}`;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'api': return <Server className="w-5 h-5" />;
      case 'database': return <Database className="w-5 h-5" />;
      case 'frontend': return <Globe className="w-5 h-5" />;
      case 'service': return <Layers3 className="w-5 h-5" />;
      case 'gateway': return <Network className="w-5 h-5" />;
      default: return <Server className="w-5 h-5" />;
    }
  };

  const filteredServices = filterStatus === 'all' 
    ? services 
    : services.filter(service => service.status === filterStatus);

  const ServiceCard = ({ service }) => (
    <div className="bg-white border border-surface-200 rounded-xl p-6 hover:border-surface-300 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-surface-100 rounded-lg">
            {getTypeIcon(service.type)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-surface-900">{service.name}</h3>
            <p className="text-surface-600 text-sm">{service.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(service.status)}
          <button className="p-2 hover:bg-surface-100 rounded-lg transition-colors">
            <MoreVertical className="w-4 h-4 text-surface-400" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-surface-600 text-sm">Status</span>
          <span className={getStatusBadge(service.status)}>{service.status}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-surface-600 text-sm">Uptime</span>
          <span className="text-surface-900 font-medium">{service.uptime}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-surface-600 text-sm">Response Time</span>
          <span className="text-surface-900 font-medium">{service.responseTime}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-surface-600 text-sm">Version</span>
          <span className="text-surface-900 font-medium">{service.version}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-surface-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span>{service.alerts}</span>
            </div>
            <div className="flex items-center space-x-1">
              <XCircle className="w-4 h-4 text-red-500" />
              <span>{service.incidents}</span>
            </div>
          </div>
          <span className="text-surface-500">{service.owner}</span>
        </div>
      </div>
    </div>
  );

  const ServiceListItem = ({ service }) => (
    <div className="bg-white border border-surface-200 rounded-xl p-6 hover:border-surface-300 transition-colors">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-surface-100 rounded-lg">
            {getTypeIcon(service.type)}
          </div>
          <div>
            <h3 className="font-semibold text-surface-900">{service.name}</h3>
            <p className="text-surface-600 text-sm">{service.description}</p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-6 gap-4 text-sm">
          <div className="text-center">
            <div className="text-surface-500 mb-1">Status</div>
            <span className={getStatusBadge(service.status)}>{service.status}</span>
          </div>
          <div className="text-center">
            <div className="text-surface-500 mb-1">Uptime</div>
            <div className="text-surface-900 font-medium">{service.uptime}</div>
          </div>
          <div className="text-center">
            <div className="text-surface-500 mb-1">Response</div>
            <div className="text-surface-900 font-medium">{service.responseTime}</div>
          </div>
          <div className="text-center">
            <div className="text-surface-500 mb-1">Alerts</div>
            <div className="text-surface-900 font-medium">{service.alerts}</div>
          </div>
          <div className="text-center">
            <div className="text-surface-500 mb-1">Incidents</div>
            <div className="text-surface-900 font-medium">{service.incidents}</div>
          </div>
          <div className="text-center">
            <div className="text-surface-500 mb-1">Owner</div>
            <div className="text-surface-900 font-medium">{service.owner}</div>
          </div>
        </div>

        <button className="p-2 hover:bg-surface-100 rounded-lg transition-colors">
          <MoreVertical className="w-4 h-4 text-surface-400" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-surface-900">Services</h1>
          <p className="text-surface-600 mt-1">Monitor service health and performance</p>
        </div>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Service</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-surface-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-surface-500 text-sm font-medium">Total Services</p>
              <p className="text-3xl font-bold text-surface-900 mt-2">{services.length}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Layers3 className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-surface-500 text-sm font-medium">Healthy</p>
              <p className="text-3xl font-bold text-success-600 mt-2">
                {services.filter(s => s.status === 'healthy').length}
              </p>
            </div>
            <div className="p-3 bg-success-50 text-success-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-surface-500 text-sm font-medium">Degraded</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {services.filter(s => s.status === 'degraded').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-surface-500 text-sm font-medium">Critical</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {services.filter(s => s.status === 'critical').length}
              </p>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-surface-500" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-surface-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Services</option>
              <option value="healthy">Healthy</option>
              <option value="degraded">Degraded</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-surface-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search services..."
              className="pl-10 pr-4 py-2 border border-surface-300 rounded-lg text-sm w-64"
            />
          </div>
        </div>
        
        <div className="border border-surface-300 rounded-lg p-1 flex">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              viewMode === 'grid' 
                ? 'bg-primary-600 text-white' 
                : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              viewMode === 'list' 
                ? 'bg-primary-600 text-white' 
                : 'text-surface-600 hover:text-surface-900'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Services */}
      <div>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredServices.map((service) => (
              <ServiceListItem key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesView;
