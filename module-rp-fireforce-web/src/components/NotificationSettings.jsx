import React, { useState } from 'react';
import { Bell, Volume2, VolumeX, Monitor, Check, X, Info } from 'lucide-react';
import { testSound } from '../utils/soundAlerts';

/**
 * Notification Settings Component
 * Allows users to configure notification preferences
 */
const NotificationSettings = ({ 
  isBrowserNotificationSupported,
  browserPermission,
  requestBrowserPermission,
  soundEnabled,
  toggleSound,
  onClose 
}) => {
  const [testing, setTesting] = useState(false);

  const handleRequestPermission = async () => {
    const granted = await requestBrowserPermission();
    if (granted) {
      alert('Browser notifications enabled! You will now receive desktop alerts.');
    } else {
      alert('Permission denied. You can enable it later in your browser settings.');
    }
  };

  const handleTestSound = (severity) => {
    setTesting(true);
    testSound(severity);
    setTimeout(() => setTesting(false), 1000);
  };

  const getPermissionStatus = () => {
    switch (browserPermission) {
      case 'granted':
        return { text: 'Enabled', color: 'text-green-600', bg: 'bg-green-100' };
      case 'denied':
        return { text: 'Blocked', color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { text: 'Not Set', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const status = getPermissionStatus();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Notification Settings</h2>
              <p className="text-sm text-gray-500">Configure your alert preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Browser Notifications */}
          <div className="border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-gray-700" />
                <div>
                  <h3 className="font-semibold text-gray-900">Desktop Notifications</h3>
                  <p className="text-sm text-gray-500">Get notified even when you're in another tab</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                {status.text}
              </span>
            </div>

            {!isBrowserNotificationSupported ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-800 font-medium">Not Supported</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Your browser doesn't support desktop notifications. Try Chrome, Firefox, or Edge.
                  </p>
                </div>
              </div>
            ) : browserPermission === 'default' ? (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Enable desktop notifications to receive alerts even when the app is not active.
                </p>
                <button
                  onClick={handleRequestPermission}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  Enable Desktop Notifications
                </button>
              </div>
            ) : browserPermission === 'granted' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-green-800 font-medium">All Set!</p>
                  <p className="text-xs text-green-700 mt-1">
                    You'll receive desktop notifications for new incidents and comments.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium mb-2">Permission Denied</p>
                <p className="text-xs text-red-700">
                  To enable notifications, you need to allow them in your browser settings:
                </p>
                <ul className="text-xs text-red-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Click the lock icon in the address bar</li>
                  <li>Find "Notifications" and change to "Allow"</li>
                  <li>Refresh the page</li>
                </ul>
              </div>
            )}
          </div>

          {/* Sound Alerts */}
          <div className="border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-gray-700" />
                ) : (
                  <VolumeX className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">Sound Alerts</h3>
                  <p className="text-sm text-gray-500">Play audio for new incidents</p>
                </div>
              </div>
              <button
                onClick={() => toggleSound(!soundEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  soundEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {soundEnabled && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">
                  Test different severity sounds:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {['critical', 'high', 'medium', 'low'].map(severity => (
                    <button
                      key={severity}
                      onClick={() => handleTestSound(severity)}
                      disabled={testing}
                      className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
                        testing
                          ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                          : severity === 'critical'
                          ? 'border-red-300 text-red-700 hover:bg-red-50'
                          : severity === 'high'
                          ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                          : severity === 'medium'
                          ? 'border-blue-300 text-blue-700 hover:bg-blue-50'
                          : 'border-green-300 text-green-700 hover:bg-green-50'
                      }`}
                    >
                      Test {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">How Notifications Work</p>
                <ul className="space-y-1 text-xs">
                  <li>• The system checks for new incidents every 30 seconds</li>
                  <li>• You'll see notifications in the bell icon and desktop (if enabled)</li>
                  <li>• Critical incidents require interaction and won't auto-dismiss</li>
                  <li>• Click any notification to view the incident details</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
