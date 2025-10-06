import React, { useState, useEffect } from 'react';
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
  XCircle
} from 'lucide-react';
import { auditTrailService } from '../services/api';

const NotificationHistoryPanel = ({ incidentId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      
      if (response.success !== false && response.notifications) {
        setNotifications(response.notifications);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notification history');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationTypeIcon = (type) => {
    const iconClass = "w-4 h-4";
    
    switch (type?.toLowerCase()) {
      case 'email':
        return <Mail className={iconClass} />;
      case 'sms':
        return <MessageSquare className={iconClass} />;
      case 'push':
      case 'mobile':
        return <Smartphone className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const getStatusIcon = (notification) => {
    if (notification.acknowledged || notification.response_status === 'acknowledged') {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
    if (notification.delivered === false || notification.status === 'failed') {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
    if (notification.delivered || notification.status === 'delivered') {
      return <Clock className="w-5 h-5 text-blue-600" />;
    }
    return <Clock className="w-5 h-5 text-gray-500" />;
  };

  const getStatusText = (notification) => {
    if (notification.acknowledged || notification.response_status === 'acknowledged') {
      return { text: 'Acknowledged', color: 'text-green-600', bg: 'bg-green-100' };
    }
    if (notification.delivered === false || notification.status === 'failed') {
      return { text: 'Failed', color: 'text-red-600', bg: 'bg-red-100' };
    }
    if (notification.delivered || notification.status === 'delivered') {
      return { text: 'Delivered', color: 'text-blue-600', bg: 'bg-blue-100' };
    }
    return { text: 'Pending', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateResponseTime = (sentAt, acknowledgedAt) => {
    if (!sentAt || !acknowledgedAt) return null;
    
    const sent = new Date(sentAt);
    const acked = new Date(acknowledgedAt);
    const diffMs = acked - sent;
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffMins < 1) return `${diffSecs}s`;
    if (diffMins < 60) return `${diffMins}m`;
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading notification history...</span>
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

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-600" />
          Notification History
        </h3>
        <div className="text-center py-12 text-gray-500">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No notifications have been sent for this incident yet.</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalNotifications = notifications.length;
  const acknowledgedCount = notifications.filter(n => n.acknowledged || n.response_status === 'acknowledged').length;
  const deliveredCount = notifications.filter(n => n.delivered || n.status === 'delivered').length;
  const failedCount = notifications.filter(n => n.delivered === false || n.status === 'failed').length;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-600" />
          Notification History
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({totalNotifications} sent)
          </span>
        </h3>
        <button
          onClick={fetchNotifications}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{totalNotifications}</p>
          <p className="text-xs text-gray-600">Total Sent</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{deliveredCount}</p>
          <p className="text-xs text-gray-600">Delivered</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{acknowledgedCount}</p>
          <p className="text-xs text-gray-600">Acknowledged</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{failedCount}</p>
          <p className="text-xs text-gray-600">Failed</p>
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {notifications.map((notif, index) => {
          const status = getStatusText(notif);
          const responseTime = calculateResponseTime(
            notif.sent_at || notif.created_at,
            notif.acknowledged_at || notif.response_at
          );

          return (
            <div
              key={notif.id || index}
              className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(notif)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 truncate">
                        {notif.recipient_name || notif.user_name || 'Unknown User'}
                      </p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                      <span className="flex items-center gap-1">
                        {getNotificationTypeIcon(notif.notification_type || notif.type)}
                        <span className="capitalize">{notif.notification_type || notif.type || 'unknown'}</span>
                      </span>
                      
                      {notif.recipient_email && (
                        <span className="text-gray-400 truncate">
                          {notif.recipient_email}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span title={new Date(notif.sent_at || notif.created_at).toLocaleString()}>
                        Sent: {formatTimestamp(notif.sent_at || notif.created_at)}
                      </span>
                      
                      {notif.acknowledged && notif.acknowledged_at && (
                        <span title={new Date(notif.acknowledged_at).toLocaleString()}>
                          Acked: {formatTimestamp(notif.acknowledged_at)}
                        </span>
                      )}
                      
                      {responseTime && (
                        <span className="text-green-600 font-medium">
                          Response: {responseTime}
                        </span>
                      )}
                    </div>
                    
                    {notif.message && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {notif.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationHistoryPanel;
