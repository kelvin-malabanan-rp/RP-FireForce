// Push Notification Service for Web
// Handles browser push notifications registration and management

const BASE_URL = 'https://incident-webhook-api.rapidresponse.workers.dev';

/**
 * Register browser push notification token
 * @param {Object} registration - Registration data
 * @returns {Promise<Object>} Registration response
 */
export async function registerPushToken(registration) {
  try {
    const response = await fetch(`${BASE_URL}/api/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registration),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error registering push token:', error);
    throw error;
  }
}

/**
 * Update alert settings for a device
 * @param {string} token - Push token
 * @param {Object} settings - Alert settings
 * @returns {Promise<Object>} Update response
 */
export async function updateAlertSettings(token, settings) {
  try {
    const response = await fetch(
      `${BASE_URL}/api/push-token/${encodeURIComponent(token)}/settings`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error updating alert settings:', error);
    throw error;
  }
}

/**
 * Get device alert status
 * @param {string} token - Push token
 * @returns {Promise<Object>} Device status
 */
export async function getDeviceAlertStatus(token) {
  try {
    const response = await fetch(
      `${BASE_URL}/api/push-token/${encodeURIComponent(token)}/status`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error getting device status:', error);
    throw error;
  }
}

/**
 * Unregister device from push notifications
 * @param {string} token - Push token
 * @returns {Promise<Object>} Unregister response
 */
export async function unregisterDevice(token) {
  try {
    const response = await fetch(
      `${BASE_URL}/api/push-token/${encodeURIComponent(token)}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error unregistering device:', error);
    throw error;
  }
}

/**
 * Send test alert to device
 * @param {string} token - Push token
 * @param {string} alertType - Alert severity (low, medium, high, critical)
 * @returns {Promise<Object>} Test alert response
 */
export async function sendTestAlert(token, alertType = 'high') {
  try {
    const channelMap = {
      critical: 'critical-alerts-v4',
      high: 'high-priority-v4',
      medium: 'medium-priority-v4',
      low: 'default-v4',
    };

    const channelId = channelMap[alertType] || channelMap.high;

    const response = await fetch(`${BASE_URL}/api/test/send-alert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        alertType,
        channelId,
        message: {
          title: `${alertType.toUpperCase()} Test Alert`,
          body: 'This is a test notification to verify your alert system is working.',
          channelId,
          data: {
            type: 'test',
            severity: alertType,
            timestamp: new Date().toISOString(),
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending test alert:', error);
    throw error;
  }
}

/**
 * Check alert system health
 * @returns {Promise<Object>} Health status
 */
export async function checkAlertSystemHealth() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    
    if (!response.ok) {
      return { status: 'error', message: 'Backend unreachable' };
    }

    const data = await response.json();
    return { status: 'operational', ...data };
  } catch (error) {
    console.error('Error checking backend health:', error);
    return { status: 'error', message: error.message };
  }
}

/**
 * Request browser notification permission
 * @returns {Promise<string>} Permission status
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Generate a unique device token for web
 * (In production, you'd use Service Worker Push API to get a real subscription)
 * @returns {string} Unique device token
 */
export function generateWebDeviceToken() {
  // For now, generate a unique identifier
  // In production, you'd use service worker push subscription
  const existingToken = localStorage.getItem('webPushToken');
  if (existingToken) {
    return existingToken;
  }

  const token = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('webPushToken', token);
  return token;
}

/**
 * Initialize web push notifications
 * @param {string} userId - Current user ID
 * @returns {Promise<Object>} Registration result
 */
export async function initializeWebPushNotifications(userId) {
  try {
    // Request permission
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    // Generate or retrieve device token
    const token = generateWebDeviceToken();

    // Get existing settings or use defaults
    const existingSettings = JSON.parse(
      localStorage.getItem('alertSettings') || '{}'
    );

    const settings = {
      enableAlerts: existingSettings.enableAlerts ?? true,
      criticalOnly: existingSettings.criticalOnly ?? false,
      soundEnabled: existingSettings.soundEnabled ?? true,
      vibrationEnabled: existingSettings.vibrationEnabled ?? true,
      channelPreferences: {
        critical: 'critical-alerts-v4',
        high: 'high-priority-v4',
        medium: 'medium-priority-v4',
        low: 'default-v4',
      },
    };

    // Register with backend
    const result = await registerPushToken({
      userId,
      token,
      deviceType: 'web',
      settings,
    });

    // Save settings
    localStorage.setItem('alertSettings', JSON.stringify(settings));
    localStorage.setItem('pushRegistrationStatus', 'registered');

    return {
      success: true,
      token,
      permission,
      ...result,
    };
  } catch (error) {
    console.error('Error initializing web push:', error);
    localStorage.setItem('pushRegistrationStatus', 'failed');
    throw error;
  }
}

/**
 * Check if push notifications are initialized
 * @returns {boolean}
 */
export function isPushNotificationInitialized() {
  return (
    localStorage.getItem('pushRegistrationStatus') === 'registered' &&
    localStorage.getItem('webPushToken') !== null
  );
}

/**
 * Get current push token
 * @returns {string|null}
 */
export function getCurrentPushToken() {
  return localStorage.getItem('webPushToken');
}

export default {
  registerPushToken,
  updateAlertSettings,
  getDeviceAlertStatus,
  unregisterDevice,
  sendTestAlert,
  checkAlertSystemHealth,
  requestNotificationPermission,
  generateWebDeviceToken,
  initializeWebPushNotifications,
  isPushNotificationInitialized,
  getCurrentPushToken,
};
