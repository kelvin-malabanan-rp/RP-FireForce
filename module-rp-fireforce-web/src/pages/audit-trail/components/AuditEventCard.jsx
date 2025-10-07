import React from 'react';
import { Clock, User, AlertCircle, CheckCircle, ArrowUpRight, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

const AuditEventCard = ({ event, expanded, onToggle }) => {
  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'alert_sent':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'acknowledged':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'escalated':
        return <ArrowUpRight className="w-5 h-5 text-orange-500" />;
      case 'comment_added':
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getEventTitle = (eventType, userName, metadata) => {
    switch (eventType) {
      case 'alert_sent':
        return `Alert Sent to ${userName}`;
      case 'acknowledged':
        return `Incident Acknowledged by ${userName}`;
      case 'resolved':
        return `Incident Resolved by ${userName}`;
      case 'escalated':
        return `Escalation Alert to ${userName}`;
      case 'comment_added':
        return `Comment Added by ${userName}`;
      default:
        return `Event by ${userName}`;
    }
  };

  const getEventColor = (eventType) => {
    switch (eventType) {
      case 'alert_sent':
        return 'border-l-blue-500 bg-blue-50';
      case 'acknowledged':
        return 'border-l-green-500 bg-green-50';
      case 'resolved':
        return 'border-l-emerald-500 bg-emerald-50';
      case 'escalated':
        return 'border-l-orange-500 bg-orange-50';
      case 'comment_added':
        return 'border-l-purple-500 bg-purple-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDeliveryStatusBadge = (status) => {
    const statusConfig = {
      delivered: { text: 'Delivered', color: 'bg-green-100 text-green-800' },
      sent: { text: 'Sent', color: 'bg-blue-100 text-blue-800' },
      read: { text: 'Read', color: 'bg-purple-100 text-purple-800' },
      failed: { text: 'Failed', color: 'bg-red-100 text-red-800' },
      pending: { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    };

    const config = statusConfig[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const formatResponseTime = (seconds) => {
    if (!seconds) return null;
    
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div className={`bg-white rounded-lg border-l-4 shadow-sm hover:shadow-md transition-shadow ${getEventColor(event.eventType)}`}>
      {/* Main Card Content */}
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="mt-1">{getEventIcon(event.eventType)}</div>
            
            <div className="flex-1 min-w-0">
              {/* Event Title */}
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                {getEventTitle(event.eventType, event.user?.name || 'Unknown User', event.metadata)}
              </h3>
              
              {/* Event Metadata */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-2">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimestamp(event.timestamp)}
                </span>
                
                {event.severity && (
                  <span className={`px-2 py-0.5 rounded-full border ${getSeverityColor(event.severity)}`}>
                    {event.severity}
                  </span>
                )}
                
                {event.notificationType && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                    {event.notificationType}
                  </span>
                )}
                
                {event.responseTime && (
                  <span className="text-blue-600 font-medium">
                    Response Time: {formatResponseTime(event.responseTime)}
                  </span>
                )}
              </div>
              
              {/* Incident Info */}
              {event.incident && (
                <p className="text-sm text-gray-700 mb-2">
                  Incident: <span className="font-medium">{event.incident.title}</span>
                </p>
              )}
              
              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {event.deliveryStatus && getDeliveryStatusBadge(event.deliveryStatus)}
                {event.responseStatus && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.responseStatus === 'acknowledged' ? 'bg-green-100 text-green-800' :
                    event.responseStatus === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {event.responseStatus === 'pending' ? 'Pending Response' : event.responseStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Expand/Collapse Button */}
          <button className="ml-2 text-gray-400 hover:text-gray-600">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>
      
      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* User Details */}
            {event.user && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <User className="w-4 h-4" />
                  User Information
                </h4>
                <div className="text-gray-600 space-y-1">
                  <p>Name: <span className="font-medium">{event.user.name}</span></p>
                  {event.user.email && <p>Email: {event.user.email}</p>}
                  {event.user.phone && <p>Phone: {event.user.phone}</p>}
                </div>
              </div>
            )}
            
            {/* Technical Details */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Technical Details</h4>
              <div className="text-gray-600 space-y-1">
                {event.channelId && <p>Channel: {event.channelId}</p>}
                {event.ipAddress && <p>IP Address: {event.ipAddress}</p>}
                {event.userAgent && (
                  <p className="truncate" title={event.userAgent}>
                    Device: {event.userAgent}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Metadata/Additional Info */}
          {event.metadata && typeof event.metadata === 'object' && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Additional Information</h4>
              <div className="bg-white rounded p-2 text-xs text-gray-600 font-mono overflow-x-auto">
                {event.metadata.comment && (
                  <p className="mb-1"><span className="font-semibold">Comment:</span> {event.metadata.comment}</p>
                )}
                {event.metadata.reason && (
                  <p className="mb-1"><span className="font-semibold">Reason:</span> {event.metadata.reason}</p>
                )}
                {event.metadata.escalationLevel && (
                  <p className="mb-1"><span className="font-semibold">Escalation Level:</span> {event.metadata.escalationLevel}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditEventCard;
