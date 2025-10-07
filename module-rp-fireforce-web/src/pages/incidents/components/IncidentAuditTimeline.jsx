import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  User, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  ArrowUpRight, 
  MessageSquare, 
  Edit3,
  UserPlus,
  Bell,
  XCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { auditTrailService } from '../../../services/api';

const IncidentAuditTimeline = ({ incidentId }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (incidentId) {
      fetchAuditTrail();
    }
  }, [incidentId]);

  const fetchAuditTrail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await auditTrailService.getIncidentAuditTrail(incidentId);
      
      if (response.success !== false && response.audit_logs) {
        setAuditLogs(response.audit_logs);
      } else {
        setAuditLogs([]);
      }
    } catch (err) {
      console.error('Error fetching audit trail:', err);
      setError(err.message || 'Failed to load audit trail');
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const iconClass = "w-5 h-5";
    
    switch (action) {
      case 'incident_created':
        return <Activity className={`${iconClass} text-blue-500`} />;
      case 'incident_acknowledged':
      case 'acknowledged':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'incident_resolved':
      case 'resolved':
        return <CheckCircle className={`${iconClass} text-emerald-600`} />;
      case 'incident_escalated':
      case 'escalated':
        return <ArrowUpRight className={`${iconClass} text-orange-500`} />;
      case 'comment_added':
        return <MessageSquare className={`${iconClass} text-purple-500`} />;
      case 'status_updated':
        return <Edit3 className={`${iconClass} text-indigo-500`} />;
      case 'assigned':
        return <UserPlus className={`${iconClass} text-teal-500`} />;
      case 'alert_sent':
        return <Bell className={`${iconClass} text-yellow-500`} />;
      case 'incident_closed':
        return <XCircle className={`${iconClass} text-gray-500`} />;
      case 'incident_reopened':
        return <RefreshCw className={`${iconClass} text-blue-500`} />;
      default:
        return <Clock className={`${iconClass} text-gray-500`} />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'incident_created':
        return 'border-blue-500 bg-blue-50';
      case 'incident_acknowledged':
      case 'acknowledged':
        return 'border-green-500 bg-green-50';
      case 'incident_resolved':
      case 'resolved':
        return 'border-emerald-500 bg-emerald-50';
      case 'incident_escalated':
      case 'escalated':
        return 'border-orange-500 bg-orange-50';
      case 'comment_added':
        return 'border-purple-500 bg-purple-50';
      case 'status_updated':
        return 'border-indigo-500 bg-indigo-50';
      case 'assigned':
        return 'border-teal-500 bg-teal-50';
      case 'alert_sent':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const formatAction = (action) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserName = (log) => {
    if (log.first_name && log.last_name) {
      return `${log.first_name} ${log.last_name}`;
    }
    if (log.email) {
      return log.email;
    }
    return 'System';
  };

  const renderDetails = (details) => {
    if (!details) return null;
    
    // If details is a string, just display it
    if (typeof details === 'string') {
      return <p className="text-sm text-gray-600 mt-1">{details}</p>;
    }
    
    // If details is an object, format it nicely
    if (typeof details === 'object') {
      return (
        <div className="text-sm text-gray-600 mt-2 space-y-1">
          {Object.entries(details).map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
              <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
            </div>
          ))}
        </div>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading audit trail...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12 text-red-600">
          <AlertCircle className="w-6 h-6 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          Incident Timeline
        </h3>
        <div className="text-center py-12 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No audit trail events found for this incident.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          Incident Timeline
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({auditLogs.length} {auditLogs.length === 1 ? 'event' : 'events'})
          </span>
        </h3>
        <button
          onClick={fetchAuditTrail}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
      
      <div className="space-y-4">
        {auditLogs.map((log, index) => (
          <div
            key={log.id || index}
            className={`border-l-4 rounded-lg p-4 ${getActionColor(log.action)}`}
          >
            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-0.5">
                {getActionIcon(log.action)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {formatAction(log.action)}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <User className="w-3.5 h-3.5" />
                      <span>{getUserName(log)}</span>
                      {log.email && (
                        <span className="text-gray-400">({log.email})</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm text-gray-500" title={new Date(log.created_at).toLocaleString()}>
                      {formatTimestamp(log.created_at)}
                    </p>
                  </div>
                </div>
                
                {log.details && renderDetails(log.details)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncidentAuditTimeline;
