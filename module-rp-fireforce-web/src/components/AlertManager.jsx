import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Send,
  Activity,
  Settings,
  Shield,
  Zap,
  Info
} from 'lucide-react';
import { 
  registerPushToken, 
  updateAlertSettings, 
  getDeviceAlertStatus, 
  sendTestAlert,
  unregisterDevice,
  checkAlertSystemHealth 
} from '../services/pushNotificationService';
import soundAlertManager from '../utils/soundAlerts';

const AlertManager = ({ userId, userEmail }) => {
  const [settings, setSettings] = useState({
    enableAlerts: true,
    criticalOnly: false,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  const [pushToken, setPushToken] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [registrationStatus, setRegistrationStatus] = useState('pending');
  const [isLoading, setIsLoading] = useState(false);
  const [testAlertSending, setTestAlertSending] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadPersistedData();
    checkBackendHealth();
  }, []);

  const loadPersistedData = () => {
    try {
      // Load saved settings
      const savedSettings = localStorage.getItem('alertSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }

      // Load saved push token
      const savedToken = localStorage.getItem('pushToken');
      if (savedToken) {
        setPushToken(savedToken);
      }

      // Load registration status
      const savedRegStatus = localStorage.getItem('registrationStatus');
      if (savedRegStatus) {
        setRegistrationStatus(savedRegStatus);
      }

      // Check notification permission
      if ('Notification' in window) {
        setPermissionStatus(Notification.permission);
      }
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  };

  const checkBackendHealth = async () => {
    try {
      const health = await checkAlertSystemHealth();
      setBackendStatus(health.status || 'operational');
    } catch (error) {
      console.error('Backend health check failed:', error);
      setBackendStatus('error');
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      return permission === 'granted';
    }

    return false;
  };

  const registerForPushNotifications = async () => {
    setIsLoading(true);
    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        alert('Notification permission is required to receive alerts.');
        setIsLoading(false);
        return;
      }

      // Generate a unique token for web (browser-based)
      const webToken = `web-${userId || userEmail || Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Register with backend
      const registration = {
        token: webToken,
        userId: userId || `web-user-${Date.now()}`,
        userEmail: userEmail || 'unknown@web.user',
        platform: 'web',
        deviceName: navigator.userAgent,
        settings: settings,
      };

      const response = await registerPushToken(registration);
      
      if (response.success) {
        setPushToken(webToken);
        setRegistrationStatus('registered');
        localStorage.setItem('pushToken', webToken);
        localStorage.setItem('registrationStatus', 'registered');
        
        // Show success notification
        new Notification('Alerts Enabled', {
          body: 'You will now receive incident alerts.',
          icon: '/logo.png'
        });
      }
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      setRegistrationStatus('failed');
      alert('Failed to register for notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const unregisterFromNotifications = async () => {
    if (!pushToken) return;

    setIsLoading(true);
    try {
      await unregisterDevice(pushToken);
      
      // Clear local state
      setPushToken(null);
      setRegistrationStatus('pending');
      localStorage.removeItem('pushToken');
      localStorage.removeItem('registrationStatus');
      
      alert('Successfully unregistered from notifications.');
    } catch (error) {
      console.error('Failed to unregister:', error);
      alert('Failed to unregister. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Save to localStorage
    localStorage.setItem('alertSettings', JSON.stringify(newSettings));

    // Update sound manager if sound setting changed
    if (key === 'soundEnabled') {
      soundAlertManager.setEnabled(value);
    }

    // If registered, update backend
    if (pushToken && registrationStatus === 'registered') {
      try {
        await updateAlertSettings(pushToken, newSettings);
      } catch (error) {
        console.error('Failed to update settings on backend:', error);
      }
    }
  };

  const handleSendTestAlert = async (alertType = 'high') => {
    if (!pushToken) {
      alert('Please register for notifications first.');
      return;
    }

    setTestAlertSending(true);
    try {
      // Play sound immediately
      if (settings.soundEnabled) {
        soundAlertManager.playAlert(alertType);
      }

      // Send test alert
      const response = await sendTestAlert(pushToken, alertType);
      
      if (response.success) {
        // Show browser notification
        new Notification(`${alertType.toUpperCase()} Test Alert`, {
          body: 'This is a test notification to verify your alert system is working.',
          icon: '/logo.png',
          tag: 'test-alert',
          requireInteraction: alertType === 'critical'
        });
      }
    } catch (error) {
      console.error('Failed to send test alert:', error);
      alert('Failed to send test alert. Please try again.');
    } finally {
      setTestAlertSending(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
      case 'registered':
      case 'granted':
        return 'text-green-600';
      case 'checking':
      case 'pending':
      case 'default':
        return 'text-yellow-600';
      case 'error':
      case 'failed':
      case 'denied':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
      case 'registered':
      case 'granted':
        return <CheckCircle className="w-5 h-5" />;
      case 'checking':
      case 'pending':
        return <RefreshCw className="w-5 h-5 animate-spin" />;
      case 'error':
      case 'failed':
      case 'denied':
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Bell className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Alert Manager</h3>
              <p className="text-sm text-gray-500">Configure incident alerts and notifications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Section */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className={`${getStatusColor(backendStatus)}`}>
              {getStatusIcon(backendStatus)}
            </div>
            <div>
              <div className="text-xs text-gray-500">Backend Status</div>
              <div className="text-sm font-medium capitalize">{backendStatus}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`${getStatusColor(permissionStatus)}`}>
              {getStatusIcon(permissionStatus)}
            </div>
            <div>
              <div className="text-xs text-gray-500">Browser Permission</div>
              <div className="text-sm font-medium capitalize">{permissionStatus}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`${getStatusColor(registrationStatus)}`}>
              {getStatusIcon(registrationStatus)}
            </div>
            <div>
              <div className="text-xs text-gray-500">Registration</div>
              <div className="text-sm font-medium capitalize">{registrationStatus}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="px-6 py-4 space-y-4">
        {/* Enable Alerts Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            {settings.enableAlerts ? (
              <Bell className="w-5 h-5 text-indigo-600" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <div className="font-medium text-gray-900">Enable Alerts</div>
              <div className="text-sm text-gray-500">Receive incident notifications</div>
            </div>
          </div>
          <button
            onClick={() => handleSettingChange('enableAlerts', !settings.enableAlerts)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enableAlerts ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enableAlerts ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Critical Only Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-red-600" />
            <div>
              <div className="font-medium text-gray-900">Critical Only</div>
              <div className="text-sm text-gray-500">Only receive critical alerts</div>
            </div>
          </div>
          <button
            onClick={() => handleSettingChange('criticalOnly', !settings.criticalOnly)}
            disabled={!settings.enableAlerts}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.criticalOnly && settings.enableAlerts ? 'bg-red-600' : 'bg-gray-300'
            } ${!settings.enableAlerts ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.criticalOnly ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Sound Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            {settings.soundEnabled ? (
              <Volume2 className="w-5 h-5 text-indigo-600" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <div className="font-medium text-gray-900">Sound Alerts</div>
              <div className="text-sm text-gray-500">Play sound on notifications</div>
            </div>
          </div>
          <button
            onClick={() => handleSettingChange('soundEnabled', !settings.soundEnabled)}
            disabled={!settings.enableAlerts}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.soundEnabled && settings.enableAlerts ? 'bg-indigo-600' : 'bg-gray-300'
            } ${!settings.enableAlerts ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Advanced Settings Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Settings className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Advanced Settings</span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-600 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Advanced Settings Content */}
        {showAdvanced && (
          <div className="space-y-3 pl-4 border-l-2 border-gray-200">
            <div className="flex items-start space-x-3 text-sm">
              <Info className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="text-gray-600">
                <p className="font-medium mb-1">Token ID:</p>
                <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                  {pushToken || 'Not registered'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions Section */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 space-y-3">
        {/* Registration Buttons */}
        {registrationStatus !== 'registered' ? (
          <button
            onClick={registerForPushNotifications}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Registering...</span>
              </>
            ) : (
              <>
                <Smartphone className="w-5 h-5" />
                <span>Register for Notifications</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={unregisterFromNotifications}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Unregistering...</span>
              </>
            ) : (
              <>
                <BellOff className="w-5 h-5" />
                <span>Unregister from Notifications</span>
              </>
            )}
          </button>
        )}

        {/* Test Alert Buttons */}
        {registrationStatus === 'registered' && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 mb-2">Test Alerts:</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => handleSendTestAlert('low')}
                disabled={testAlertSending}
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm">Low</span>
              </button>
              <button
                onClick={() => handleSendTestAlert('medium')}
                disabled={testAlertSending}
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm">Medium</span>
              </button>
              <button
                onClick={() => handleSendTestAlert('high')}
                disabled={testAlertSending}
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm">High</span>
              </button>
              <button
                onClick={() => handleSendTestAlert('critical')}
                disabled={testAlertSending}
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm">Critical</span>
              </button>
            </div>
          </div>
        )}

        {/* Refresh Backend Status */}
        <button
          onClick={checkBackendHealth}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Activity className="w-4 h-4" />
          <span className="text-sm">Refresh Status</span>
        </button>
      </div>
    </div>
  );
};

export default AlertManager;
