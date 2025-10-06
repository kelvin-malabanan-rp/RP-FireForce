import React, { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw, AlertCircle, Clock, User, MessageSquare, Bell, ArrowUpRight, CheckCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { auditTrailService } from '../services/api';

const IncidentAuditTrail = ({ incidentId }) => {
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'detailed'
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (incidentId) {
      fetchAuditTrail();
    }
  }, [incidentId]);

  const fetchAuditTrail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch full incident audit with all details
      const response = await auditTrailService.getFullIncidentAudit(incidentId);
      
      if (response.success) {
        setAuditData(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch audit trail');
      }
    } catch (err) {
      console.error('Error fetching incident audit trail:', err);
      setError(err.message || 'Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      await auditTrailService.exportIncidentAuditCSV(incidentId);
    } catch (err) {
      console.error('Error exporting audit trail:', err);
      alert('Failed to export audit trail. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const getActionIcon = (action) => {
    if (action.includes('created')) return <AlertCircle className="w-4 h-4 text-blue-500" />;
    if (action.includes('acknowledge')) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (action.includes('resolve')) return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    if (action.includes('escalate')) return <ArrowUpRight className="w-4 h-4 text-orange-500" />;
    if (action.includes('comment')) return <MessageSquare className="w-4 h-4 text-purple-500" />;
    if (action.includes('notification') || action.includes('notified')) return <Bell className="w-4 h-4 text-blue-500" />;
    return <Clock className="w-4 h-4 text-gray-500" />;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const formatAction = (action) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex justify-center items-center">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Audit Trail</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchAuditTrail}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!auditData || !auditData.audit_logs || auditData.audit_logs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Audit Trail Data</h3>
        <p className="text-gray-600">No audit entries found for this incident.</p>
      </div>
    );
  }

  const { audit_logs, notifications, comments, escalations, summary } = auditData;

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Incident Audit Trail</h3>
              <p className="text-sm text-gray-600">{audit_logs.length} total events</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAuditTrail}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <div>
              <p className="text-xs text-gray-600">Notifications Sent</p>
              <p className="text-lg font-semibold text-gray-900">{summary.total_notifications || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Users Notified</p>
              <p className="text-lg font-semibold text-gray-900">{summary.users_notified || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Comments</p>
              <p className="text-lg font-semibold text-gray-900">{summary.total_comments || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Avg Response Time</p>
              <p className="text-lg font-semibold text-gray-900">
                {summary.avg_response_time ? `${Math.round(summary.avg_response_time)}s` : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Timeline View */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-4">
          {audit_logs.map((log, index) => (
            <div key={log.id} className="relative">
              {/* Timeline connector */}
              {index < audit_logs.length - 1 && (
                <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-gray-200" />
              )}
              
              {/* Event item */}
              <div className="flex items-start gap-3">
                <div className="relative z-10 w-6 h-6 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                  {getActionIcon(log.action)}
                </div>
                
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-gray-900">
                          {formatAction(log.action)}
                        </h4>
                        {log.user_id && (
                          <span className="text-sm text-gray-600">
                            by {log.first_name} {log.last_name}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(log.created_at)}
                        </span>
                        {log.ip_address && (
                          <span>IP: {log.ip_address}</span>
                        )}
                      </div>
                      
                      {log.details && (
                        <div className="mt-2 text-sm text-gray-700 bg-gray-50 rounded p-2">
                          {typeof log.details === 'string' ? (
                            <pre className="whitespace-pre-wrap font-mono text-xs">{log.details}</pre>
                          ) : (
                            <pre className="whitespace-pre-wrap font-mono text-xs">
                              {JSON.stringify(JSON.parse(log.details || '{}'), null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Response Summary (if available) */}
      {summary?.responses && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Response Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-green-50 rounded p-3 border border-green-200">
              <p className="text-xs text-green-600 font-medium">Acknowledged</p>
              <p className="text-2xl font-bold text-green-700">{summary.responses.acknowledged || 0}</p>
            </div>
            <div className="bg-red-50 rounded p-3 border border-red-200">
              <p className="text-xs text-red-600 font-medium">Declined</p>
              <p className="text-2xl font-bold text-red-700">{summary.responses.declined || 0}</p>
            </div>
            <div className="bg-emerald-50 rounded p-3 border border-emerald-200">
              <p className="text-xs text-emerald-600 font-medium">Resolved</p>
              <p className="text-2xl font-bold text-emerald-700">{summary.responses.resolved || 0}</p>
            </div>
            <div className="bg-yellow-50 rounded p-3 border border-yellow-200">
              <p className="text-xs text-yellow-600 font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">{summary.responses.pending || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentAuditTrail;
