import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  X,
  Clock,
  Mail,
  Smartphone,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { auditTrailService } from '../../services';

interface Notification {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  kind: string;
  status: string;
  response?: string;
  response_time?: number;
  delivered_at: string;
  read_at?: string;
  responded_at?: string;
  delivery_error?: string;
  fcm_token?: string;
}

interface NotificationHistoryPanelProps {
  incidentId: string;
}

export function NotificationHistoryPanel({ incidentId }: NotificationHistoryPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (incidentId) {
      fetchNotifications();
    }
  }, [incidentId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await auditTrailService.getIncidentNotifications(incidentId);
      
      if (response.success && response.data?.notifications) {
        setNotifications(response.data.notifications);
      } else {
        setNotifications([]);
      }
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notification history');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (kind: string) => {
    switch (kind.toLowerCase()) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'push':
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'web':
        return <Globe className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string, response?: string) => {
    if (response) {
      if (response === 'acknowledged' || response === 'accepted') {
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Acknowledged
          </Badge>
        );
      }
      if (response === 'resolved') {
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            <Check className="h-3 w-3 mr-1" />
            Resolved
          </Badge>
        );
      }
      if (response === 'declined') {
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Declined
          </Badge>
        );
      }
    }

    switch (status.toLowerCase()) {
      case 'sent':
      case 'delivered':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Check className="h-3 w-3 mr-1" />
            Delivered
          </Badge>
        );
      case 'read':
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            <Check className="h-3 w-3 mr-1" />
            Read
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <X className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatResponseTime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getStats = () => {
    const total = notifications.length;
    const delivered = notifications.filter(n => n.status === 'sent' || n.status === 'delivered' || n.read_at).length;
    const responded = notifications.filter(n => n.response).length;
    const avgResponseTime = notifications
      .filter(n => n.response_time)
      .reduce((acc, n) => acc + (n.response_time || 0), 0) / (responded || 1);

    return { total, delivered, responded, avgResponseTime };
  };

  const stats = getStats();

  if (loading) {
    return (
      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
            <span className="ml-3 text-slate-600 dark:text-slate-400">Loading notifications...</span>
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

  if (notifications.length === 0) {
    return (
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Notification History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No notifications sent for this incident yet.</p>
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
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Bell className="h-5 w-5 text-white" />
            </div>
            Notification History
            <Badge variant="secondary" className="ml-2">
              {notifications.length}
            </Badge>
          </CardTitle>
          <Button
            onClick={fetchNotifications}
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
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Sent</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Delivered</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.delivered}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Responded</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.responded}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Avg Response</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatResponseTime(stats.avgResponseTime)}
            </p>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          <AnimatePresence>
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
                      {getNotificationIcon(notification.kind)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {notification.user_name || notification.user_email || notification.user_id}
                        </span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {notification.kind}
                        </Badge>
                      </div>
                      {notification.user_email && notification.user_name && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                          {notification.user_email}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(notification.delivered_at)}
                        </div>
                        {notification.response_time && (
                          <div className="flex items-center gap-1">
                            • Response: {formatResponseTime(notification.response_time)}
                          </div>
                        )}
                      </div>

                      {notification.delivery_error && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                          Error: {notification.delivery_error}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    {getStatusBadge(notification.status, notification.response)}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
