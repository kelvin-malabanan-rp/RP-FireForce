import React from 'react';
import { X, Clock, User, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

const AlertModal = ({ isOpen, onClose, alert }) => {
  if (!isOpen || !alert) return null;

  const formatDate = (date) => {
    try {
      if (!date) return 'Unknown';
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'resolved': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return <AlertTriangle className="h-5 w-5" />;
      case 'warning': return <AlertCircle className="h-5 w-5" />;
      case 'info': return <Info className="h-5 w-5" />;
      case 'resolved': return <CheckCircle className="h-5 w-5" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Alert Details</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(alert.severity)}`}>
              {getSeverityIcon(alert.severity)}
              <span className="ml-2">{alert.severity || 'Unknown'}</span>
            </span>
            <span className="text-sm text-gray-500">#{alert.id || 'N/A'}</span>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{alert.title || 'Untitled Alert'}</h3>
            <p className="text-gray-700">{alert.description || 'No description available'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Service</label>
              <p className="mt-1 text-sm text-gray-900">{alert.service || 'Unknown'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Status</label>
              <p className="mt-1 text-sm text-gray-900">{alert.status || 'Unknown'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Assigned To</label>
              <div className="mt-1 flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">{alert.assignedTo || 'Unassigned'}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Created</label>
              <div className="mt-1 flex items-center">
                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">{formatDate(alert.timestamp)}</span>
              </div>
            </div>
          </div>

          {alert.details && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Additional Details</label>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{alert.details}</pre>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={() => {
              console.log('Acknowledge alert:', alert.id);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
