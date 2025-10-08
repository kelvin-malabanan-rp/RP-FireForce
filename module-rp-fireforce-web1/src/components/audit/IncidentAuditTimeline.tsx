import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  User,
  Activity,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  MessageSquare,
  Bell,
  XCircle,
  RefreshCw,
  Loader2,
  FileText,
  Edit3,
  UserPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { auditTrailService } from '../../services';

interface AuditLog {
  id: string;
  action: string;
  description?: string;
  details?: any;
  created_at: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface IncidentAuditTimelineProps {
  incidentId: string;
}

export function IncidentAuditTimeline({ incidentId }: IncidentAuditTimelineProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      
      if (response.success && response.data?.audit_logs) {
        setAuditLogs(response.data.audit_logs);
      } else {
        setAuditLogs([]);
      }
    } catch (err: any) {
      console.error('Error fetching audit trail:', err);
      setError(err.message || 'Failed to load audit trail');
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    const iconClass = "h-5 w-5";
    
    switch (action.toLowerCase()) {
      case 'incident_created':
      case 'create_incident':
        return <Activity className={`${iconClass} text-blue-500`} />;
      case 'incident_acknowledged':
      case 'acknowledged':
      case 'accept_incident':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'incident_resolved':
      case 'resolved':
      case 'resolve_incident':
        return <CheckCircle className={`${iconClass} text-emerald-600`} />;
      case 'incident_escalated':
      case 'escalated':
        return <ArrowUpRight className={`${iconClass} text-orange-500`} />;
      case 'comment_added':
        return <MessageSquare className={`${iconClass} text-purple-500`} />;
      case 'notification_sent':
      case 'user_notified':
        return <Bell className={`${iconClass} text-blue-500`} />;
      case 'status_updated':
      case 'update_status':
        return <Edit3 className={`${iconClass} text-indigo-500`} />;
      case 'user_assigned':
        return <UserPlus className={`${iconClass} text-teal-500`} />;
      case 'incident_closed':
        return <XCircle className={`${iconClass} text-gray-500`} />;
      default:
        return <FileText className={`${iconClass} text-gray-500`} />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'incident_created':
      case 'create_incident':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'incident_acknowledged':
      case 'acknowledged':
      case 'accept_incident':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'incident_resolved':
      case 'resolved':
      case 'resolve_incident':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'incident_escalated':
      case 'escalated':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'comment_added':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'notification_sent':
      case 'user_notified':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'status_updated':
      case 'update_status':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getUserName = (log: AuditLog) => {
    if (log.first_name && log.last_name) {
      return `${log.first_name} ${log.last_name}`;
    }
    if (log.email) {
      return log.email;
    }
    if (log.user_id) {
      return log.user_id;
    }
    return 'System';
  };

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <span className="ml-3 text-slate-600 dark:text-slate-400">Loading audit trail...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12 text-red-600 dark:text-red-400">
            <AlertCircle className="h-6 w-6 mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Incident Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No audit trail events found for this incident.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Clock className="h-5 w-5 text-white" />
            </div>
            Incident Timeline
            <Badge variant="secondary" className="ml-2">
              {auditLogs.length} {auditLogs.length === 1 ? 'event' : 'events'}
            </Badge>
          </CardTitle>
          <Button
            onClick={fetchAuditTrail}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <AnimatePresence>
            {auditLogs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-8 pb-4 last:pb-0"
              >
                {/* Timeline line */}
                {index < auditLogs.length - 1 && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                )}

                {/* Timeline dot with icon */}
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                  {getActionIcon(log.action)}
                </div>

                {/* Content */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getActionColor(log.action)}>
                          {formatAction(log.action)}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                        {log.description || formatAction(log.action)}
                      </p>
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatTimestamp(log.created_at)}
                    </span>
                  </div>

                  {/* User info */}
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-600 dark:text-slate-400">
                    <User className="h-3.5 w-3.5" />
                    <span>{getUserName(log)}</span>
                    {log.email && log.first_name && (
                      <span className="text-slate-400 dark:text-slate-500">({log.email})</span>
                    )}
                  </div>

                  {/* Additional details */}
                  {log.details && typeof log.details === 'object' && Object.keys(log.details).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(log.details).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400 capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
