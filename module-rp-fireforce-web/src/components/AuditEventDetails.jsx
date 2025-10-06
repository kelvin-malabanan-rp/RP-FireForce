import React from 'react';
import { X, User, Calendar, AlertCircle, CheckCircle, ArrowUpRight, MessageSquare } from 'lucide-react';

const AuditEventDetails = ({ event, onClose }) => {
  if (!event) return null;

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'alert_sent':
        return <AlertCircle className="w-6 h-6 text-blue-500" />;
      case 'acknowledged':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'resolved':
        return <CheckCircle className="w-6 h-6 text-emerald-600" />;
      case 'escalated':
        return <ArrowUpRight className="w-6 h-6 text-orange-500" />;
      case 'comment_added':
        return <MessageSquare className="w-6 h-6 text-purple-500" />;
      default:
        return <Calendar className="w-6 h-6 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getEventIcon(event.eventType)}
            <div>
              <h2 className="text-xl font-bold text-gray-900">Event Details</h2>
              <p className="text-sm text-gray-500">Event ID: {event.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Event Type & Timestamp */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Event Type</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {event.eventType.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Timestamp</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatTimestamp(event.timestamp)}
                </p>
              </div>
            </div>
          </div>

          {/* User Information */}
          {event.user && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                User Information
              </h3>
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">{event.user.name}</span>
                </div>
                {event.user.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900">{event.user.email}</span>
                  </div>
                )}
                {event.user.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium text-gray-900">{event.user.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">User ID:</span>
                  <span className="font-mono text-sm text-gray-900">{event.user.id}</span>
                </div>
              </div>
            </div>
          )}

          {/* Incident Information */}
          {event.incident && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Incident Information
              </h3>
              <div className="bg-orange-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Title:</span>
                  <span className="font-medium text-gray-900 text-right flex-1 ml-4">
                    {event.incident.title}
                  </span>
                </div>
                {event.incident.severity && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Severity:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      event.incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      event.incident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      event.incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {event.incident.severity}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Incident ID:</span>
                  <span className="font-mono text-sm text-gray-900">{event.incident.id}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notification Details */}
          {(event.notificationType || event.channelId) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Notification Details</h3>
              <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                {event.notificationType && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium text-gray-900 capitalize">{event.notificationType}</span>
                  </div>
                )}
                {event.channelId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Channel:</span>
                    <span className="font-mono text-sm text-gray-900">{event.channelId}</span>
                  </div>
                )}
                {event.deliveryStatus && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      event.deliveryStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                      event.deliveryStatus === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {event.deliveryStatus}
                    </span>
                  </div>
                )}
                {event.responseStatus && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Status:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {event.responseStatus}
                    </span>
                  </div>
                )}
                {event.responseTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Time:</span>
                    <span className="font-medium text-blue-600">
                      {event.responseTime < 60 ? `${event.responseTime}s` :
                       event.responseTime < 3600 ? `${Math.floor(event.responseTime / 60)}m` :
                       `${Math.floor(event.responseTime / 3600)}h ${Math.floor((event.responseTime % 3600) / 60)}m`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technical Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {event.ipAddress && (
                <div className="flex justify-between">
                  <span className="text-gray-600">IP Address:</span>
                  <span className="font-mono text-sm text-gray-900">{event.ipAddress}</span>
                </div>
              )}
              {event.userAgent && (
                <div className="flex flex-col space-y-1">
                  <span className="text-gray-600">User Agent:</span>
                  <span className="font-mono text-xs text-gray-900 bg-white p-2 rounded break-all">
                    {event.userAgent}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Event ID:</span>
                <span className="font-mono text-sm text-gray-900">{event.id}</span>
              </div>
            </div>
          </div>

          {/* Metadata / Additional Information */}
          {event.metadata && typeof event.metadata === 'object' && Object.keys(event.metadata).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditEventDetails;
