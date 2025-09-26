import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  User,
  Calendar,
  MoreVertical,
  Eye,
  MessageSquare,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Zap,
  Filter,
  Search,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';

const IncidentsView = () => {
  const [filterStatus, setFilterStatus] = useState('all');

  const incidents = [
    {
      id: 'INC-001',
      title: 'Database Connection Pool Exhausted',
      description: 'Primary database connection pool has reached maximum capacity',
      severity: 'critical',
      status: 'open',
      assignee: 'Sarah Chen',
      reporter: 'System Monitor',
      created: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updated: new Date(Date.now() - 15 * 60 * 1000),
      affectedServices: ['User Authentication', 'Order Processing'],
      updates: 3
    },
    {
      id: 'INC-002', 
      title: 'API Response Time Degradation',
      description: 'Average API response time increased to 2.5s',
      severity: 'major',
      status: 'investigating',
      assignee: 'Mike Rodriguez',
      reporter: 'Performance Monitor',
      created: new Date(Date.now() - 4 * 60 * 60 * 1000),
      updated: new Date(Date.now() - 30 * 60 * 1000),
      affectedServices: ['API Gateway', 'Mobile App'],
      updates: 5
    },
    {
      id: 'INC-003',
      title: 'SSL Certificate Renewal Failed',
      description: 'Automated renewal process failed for api.company.com',
      severity: 'minor',
      status: 'resolved',
      assignee: 'Alex Kim',
      reporter: 'Certificate Monitor',
      created: new Date(Date.now() - 6 * 60 * 60 * 1000),
      updated: new Date(Date.now() - 1 * 60 * 60 * 1000),
      affectedServices: ['API Gateway'],
      updates: 2
    }
  ];

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'major': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'minor': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-surface-500" />;
    }
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-700',
      major: 'bg-orange-100 text-orange-700',
      minor: 'bg-blue-100 text-blue-700'
    };
    return `px-3 py-1 rounded-full text-xs font-medium ${colors[severity]}`;
  };

  const getStatusBadge = (status) => {
    const colors = {
      open: 'bg-red-100 text-red-700',
      investigating: 'bg-yellow-100 text-yellow-700', 
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-surface-100 text-surface-700'
    };
    return `px-3 py-1 rounded-full text-xs font-medium ${colors[status]}`;
  };

  const filteredIncidents = filterStatus === 'all' 
    ? incidents 
    : incidents.filter(incident => incident.status === filterStatus);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-surface-900">Incidents</h1>
          <p className="text-surface-600 mt-1">Track and manage active incidents</p>
        </div>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create Incident</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-surface-500" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-surface-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Incidents</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-surface-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search incidents..."
            className="pl-10 pr-4 py-2 border border-surface-300 rounded-lg text-sm w-64"
          />
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {filteredIncidents.map((incident) => (
          <div key={incident.id} className="bg-white border border-surface-200 rounded-xl p-6 hover:border-surface-300 transition-colors">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                {getSeverityIcon(incident.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-surface-900">{incident.title}</h3>
                  <span className="text-sm text-surface-500">#{incident.id}</span>
                  <span className={getSeverityBadge(incident.severity)}>
                    {incident.severity}
                  </span>
                  <span className={getStatusBadge(incident.status)}>
                    {incident.status}
                  </span>
                </div>
                <p className="text-surface-600 mb-4">{incident.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-surface-500 mb-1">Assignee</div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-surface-400" />
                      <span className="text-surface-900">{incident.assignee}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-surface-500 mb-1">Created</div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-surface-400" />
                      <span className="text-surface-900">{format(incident.created, 'MMM d, HH:mm')}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-surface-500 mb-1">Last Update</div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-surface-400" />
                      <span className="text-surface-900">{format(incident.updated, 'MMM d, HH:mm')}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-surface-500 mb-1">Updates</div>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-surface-400" />
                      <span className="text-surface-900">{incident.updates}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-surface-500 text-sm mb-2">Affected Services</div>
                  <div className="flex flex-wrap gap-2">
                    {incident.affectedServices.map((service, index) => (
                      <span key={index} className="px-2 py-1 bg-surface-100 text-surface-700 rounded text-xs">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <button className="p-2 hover:bg-surface-100 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4 text-surface-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncidentsView;
