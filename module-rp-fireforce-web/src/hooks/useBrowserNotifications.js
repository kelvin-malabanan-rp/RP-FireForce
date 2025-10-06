import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage browser (desktop) notifications
 * Similar to mobile push notifications
 */
export const useBrowserNotifications = () => {
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if browser supports notifications
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Request permission from user
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      console.warn('Browser notifications not supported');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  // Show browser notification
  const showNotification = useCallback((title, options = {}) => {
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
        ...options,
      });

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, [permission]);

  // Show incident notification with custom styling
  const showIncidentNotification = useCallback((incident) => {
    const severityEmojis = {
      critical: '🚨',
      high: '⚠️',
      medium: 'ℹ️',
      low: '📝'
    };

    const emoji = severityEmojis[incident.severity?.toLowerCase()] || '📢';
    const title = `${emoji} New ${incident.severity || 'Medium'} Incident`;
    
    const options = {
      body: incident.title || incident.message,
      tag: incident.id || `incident-${Date.now()}`,
      requireInteraction: incident.severity?.toLowerCase() === 'critical',
      data: {
        incidentId: incident.incidentId || incident.id,
        type: 'incident',
        severity: incident.severity
      },
      timestamp: incident.timestamp ? new Date(incident.timestamp).getTime() : Date.now(),
    };

    const notification = showNotification(title, options);

    // Auto-close after 10 seconds for non-critical
    if (notification && incident.severity?.toLowerCase() !== 'critical') {
      setTimeout(() => notification.close(), 10000);
    }

    return notification;
  }, [showNotification]);

  // Show comment notification
  const showCommentNotification = useCallback((comment) => {
    const title = '💬 New Comment';
    const options = {
      body: comment.message || comment.comment,
      tag: comment.id || `comment-${Date.now()}`,
      data: {
        incidentId: comment.incidentId,
        commentId: comment.id,
        type: 'comment'
      }
    };

    const notification = showNotification(title, options);

    // Auto-close after 8 seconds
    if (notification) {
      setTimeout(() => notification.close(), 8000);
    }

    return notification;
  }, [showNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    showIncidentNotification,
    showCommentNotification
  };
};

export default useBrowserNotifications;
