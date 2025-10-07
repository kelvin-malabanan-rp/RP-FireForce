import React, { useState } from 'react';
import { Bell, X, Smartphone, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function SendAlertModal({ recipient, onClose, onSend }) {
  const [alertType, setAlertType] = useState('high');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState(null);

  const severityOptions = [
    { value: 'low', label: 'Low Priority', color: 'bg-blue-100 text-blue-800 border-blue-300', selectedColor: 'bg-blue-600 text-white border-blue-700', icon: '🔵' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', selectedColor: 'bg-yellow-600 text-white border-yellow-700', icon: '🟡' },
    { value: 'high', label: 'High Priority', color: 'bg-orange-100 text-orange-800 border-orange-300', selectedColor: 'bg-orange-600 text-white border-orange-700', icon: '🟠' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800 border-red-300', selectedColor: 'bg-red-600 text-white border-red-700', icon: '🔴' }
  ];

  const getChannelId = (type) => {
    const channels = {
      critical: 'critical-alerts-v4',
      high: 'high-priority-v4',
      medium: 'medium-priority-v4',
      low: 'default-v4'
    };
    return channels[type] || channels.high;
  };

  const handleSend = async () => {
    setIsSending(true);
    setResult(null);
    
    try {
      // Backend expects: { token: string, alertType?: string }
      const response = await fetch(
        'https://incident-webhook-api.rapidresponse.workers.dev/api/test/send-alert',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: recipient.pushToken || recipient.token || `web-${recipient.id}`,
            alertType: alertType
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({ success: true, message: 'Alert sent successfully!' });
        onSend?.({ success: true, recipient, alertType });
        
        // Auto close after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error(data.error || data.message || 'Failed to send alert');
      }
    } catch (error) {
      console.error('Error sending alert:', error);
      setResult({ success: false, message: error.message || 'Failed to send alert. Please try again.' });
      onSend?.({ success: false, error: error.message });
    } finally {
      setIsSending(false);
    }
  };

  const selectedOption = severityOptions.find(opt => opt.value === alertType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-t-xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Send Alert Notification</h2>
                <p className="text-orange-100 text-sm">
                  {recipient?.name || `${recipient?.firstName} ${recipient?.lastName}` || 'Team Member'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              disabled={isSending}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Result Message */}
          {result && (
            <div className={`rounded-lg p-4 flex items-start gap-3 ${
              result.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`font-semibold ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                  {result.success ? 'Success!' : 'Error'}
                </p>
                <p className={`text-sm ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.message}
                </p>
              </div>
            </div>
          )}

          {/* Recipient Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                {(recipient?.firstName?.charAt(0) || recipient?.name?.charAt(0) || '?').toUpperCase()}
                {(recipient?.lastName?.charAt(0) || '').toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-lg">
                  {recipient?.name || `${recipient?.firstName} ${recipient?.lastName}` || 'Unknown'}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                  <Smartphone className="w-4 h-4" />
                  <span className="font-medium">
                    {recipient?.email || recipient?.phoneNumber || 'No contact info'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Type Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Select Alert Severity Level
            </label>
            <div className="grid grid-cols-2 gap-3">
              {severityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setAlertType(option.value)}
                  disabled={isSending}
                  className={`p-4 rounded-lg border-2 transition-all transform hover:scale-105 ${
                    alertType === option.value
                      ? option.selectedColor + ' shadow-lg'
                      : option.color + ' hover:shadow-md'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">{option.icon}</span>
                    <span className="font-bold text-sm">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Custom Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter custom alert message... (Leave empty for default message)"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500"
              rows="3"
              disabled={isSending}
            />
            <p className="text-xs text-gray-600 mt-1">
              This message will be sent as a push notification to the recipient's device
            </p>
          </div>

          {/* Warning for Critical */}
          {alertType === 'critical' && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-900 font-bold">Critical Alert Warning</p>
                <p className="text-sm text-red-800 mt-1">
                  This will trigger a <strong>maximum priority notification</strong> on the 
                  recipient's device with loud sound, vibration, and persistent display.
                </p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-semibold mb-1">
              📱 Multi-Platform Delivery
            </p>
            <p className="text-sm text-blue-800">
              This alert will be sent to both <strong>mobile devices</strong> (iOS/Android) 
              and <strong>web browsers</strong> where the recipient has enabled notifications.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-bold transition-colors"
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 font-bold disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              {isSending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Bell className="w-5 h-5" />
                  Send {selectedOption?.icon} Alert
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
