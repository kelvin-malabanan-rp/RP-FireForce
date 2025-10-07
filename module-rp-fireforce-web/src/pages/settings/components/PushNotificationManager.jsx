import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Volume2, VolumeX, Smartphone, CheckCircle, XCircle, Send, Settings as SettingsIcon } from 'lucide-react';
import {
  initializeWebPushNotifications,
  updateAlertSettings,
  sendTestAlert,
  getDeviceAlertStatus,
  unregisterDevice,
  isPushNotificationInitialized,
  getCurrentPushToken,
} from '../../../services/pushNotificationService';

export default function PushNotificationManager({ userId, onClose }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [pushToken, setPushToken] = useState(null);
  const [permission, setPermission] = useState('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Alert settings
  const [settings, setSettings] = useState({
    enableAlerts: true,
    criticalOnly: false,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  const [deviceStatus, setDeviceStatus] = useState(null);

  useEffect(() => {
    loadInitialState();
  }, []);

  const loadInitialState = async () => {
    try {
      // Check if already initialized
      const initialized = isPushNotificationInitialized();
      setIsInitialized(initialized);

      if (initialized) {
        const token = getCurrentPushToken();
        setPushToken(token);

        // Load saved settings
        const savedSettings = JSON.parse(
          localStorage.getItem('alertSettings') || '{}'
        );
        if (Object.keys(savedSettings).length > 0) {
          setSettings(savedSettings);
        }

        // Fetch device status
        if (token) {
          try {
            const status = await getDeviceAlertStatus(token);
            setDeviceStatus(status);
          } catch (err) {
            console.warn('Could not fetch device status:', err);
          }
        }
      }

      // Get browser permission
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
    } catch (err) {
      console.error('Error loading initial state:', err);
    }
  };

  const handleInitialize = async () => {
    if (!userId) {
      setError('User ID is required. Please log in first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await initializeWebPushNotifications(userId);
      
      setIsInitialized(true);
      setPushToken(result.token);
      setPermission(result.permission);
      setSuccessMessage('Push notifications enabled successfully! 🎉');
      
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err.message || 'Failed to enable push notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async (newSettings) => {
    if (!pushToken) {
      setError('No push token found. Please initialize notifications first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await updateAlertSettings(pushToken, newSettings);
      
      setSettings(newSettings);
      localStorage.setItem('alertSettings', JSON.stringify(newSettings));
      setSuccessMessage('Settings updated successfully! ✅');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update settings: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestAlert = async (alertType = 'high') => {
    if (!pushToken) {
      setError('No push token found. Please initialize notifications first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await sendTestAlert(pushToken, alertType);
      setSuccessMessage(`Test ${alertType} alert sent! Check your notifications.`);
      
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError('Failed to send test alert: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!pushToken) return;

    if (!confirm('Are you sure you want to disable push notifications?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await unregisterDevice(pushToken);
      
      // Clear local storage
      localStorage.removeItem('webPushToken');
      localStorage.removeItem('pushRegistrationStatus');
      localStorage.removeItem('alertSettings');
      
      setIsInitialized(false);
      setPushToken(null);
      setDeviceStatus(null);
      setSuccessMessage('Push notifications disabled');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to disable notifications: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSetting = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    handleUpdateSettings(newSettings);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Push Notifications</h2>
                <p className="text-blue-100 text-sm">Manage your alert preferences</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Browser Permission Status */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-semibold text-gray-900">Browser Permission</p>
                  <p className="text-sm text-gray-600">
                    Status: <span className={`font-semibold ${
                      permission === 'granted' ? 'text-green-600' : 
                      permission === 'denied' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {permission.charAt(0).toUpperCase() + permission.slice(1)}
                    </span>
                  </p>
                </div>
              </div>
              {permission === 'granted' ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-gray-400" />
              )}
            </div>
          </div>

          {/* Initialize or Settings */}
          {!isInitialized ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Enable Push Notifications
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Stay updated with real-time alerts for incidents. You'll receive notifications
                for new incidents, updates, and critical alerts.
              </p>
              <button
                onClick={handleInitialize}
                disabled={isLoading || !userId}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
              >
                <Bell className="w-5 h-5" />
                {isLoading ? 'Initializing...' : 'Enable Notifications'}
              </button>
              {!userId && (
                <p className="text-sm text-red-600 mt-3">Please log in to enable notifications</p>
              )}
            </div>
          ) : (
            <>
              {/* Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5" />
                  Alert Settings
                </h3>

                {/* Enable Alerts */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    {settings.enableAlerts ? (
                      <Bell className="w-5 h-5 text-blue-600" />
                    ) : (
                      <BellOff className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">Enable Alerts</p>
                      <p className="text-sm text-gray-600">Receive all incident notifications</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('enableAlerts')}
                    disabled={isLoading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.enableAlerts ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.enableAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Critical Only */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Critical Only</p>
                      <p className="text-sm text-gray-600">Only receive critical severity alerts</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('criticalOnly')}
                    disabled={isLoading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.criticalOnly ? 'bg-red-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.criticalOnly ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Sound Enabled */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    {settings.soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">Sound</p>
                      <p className="text-sm text-gray-600">Play sound for notifications</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('soundEnabled')}
                    disabled={isLoading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.soundEnabled ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Vibration Enabled */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Vibration</p>
                      <p className="text-sm text-gray-600">Vibrate on notifications (mobile)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('vibrationEnabled')}
                    disabled={isLoading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.vibrationEnabled ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.vibrationEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Test Alerts */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Test Alerts
                </h3>
                <p className="text-sm text-gray-600">
                  Send a test notification to verify your settings
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['low', 'medium', 'high', 'critical'].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleSendTestAlert(type)}
                      disabled={isLoading}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        type === 'critical'
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : type === 'high'
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : type === 'medium'
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Device Info */}
              {pushToken && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Device Token</p>
                  <p className="text-xs text-gray-600 font-mono break-all bg-white p-2 rounded border border-gray-200">
                    {pushToken}
                  </p>
                </div>
              )}

              {/* Disable Button */}
              <button
                onClick={handleDisable}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-semibold border border-red-200 transition-all"
              >
                Disable Push Notifications
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
