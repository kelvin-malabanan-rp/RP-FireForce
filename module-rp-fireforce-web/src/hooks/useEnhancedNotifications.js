import { useState, useEffect, useCallback, useRef } from 'react';
import useBrowserNotifications from './useBrowserNotifications';
import { playIncidentAlert, playCommentAlert } from '../utils/soundAlerts';

const API_BASE_URL = 'https://incident-webhook-api.rapidresponse.workers.dev';

/**
 * Enhanced notification hook with browser notifications and sound alerts
 * Similar to mobile push notification experience
 */
export const useEnhancedNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastCheckedRef = useRef(new Date());
  const seenIdsRef = useRef(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Browser notifications
  const {
    isSupported: isBrowserNotificationSupported,
    permission: browserPermission,
    requestPermission: requestBrowserPermission,
    showIncidentNotification,
    showCommentNotification
  } = useBrowserNotifications();

  // Load seen notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('seenNotificationIds');
    if (stored) {
      try {
        const ids = JSON.parse(stored);
        seenIdsRef.current = new Set(ids);
      } catch (e) {
        console.error('Failed to parse stored notification IDs:', e);
      }
    }

    // Load sound preference
    const soundPref = localStorage.getItem('soundAlertsEnabled');
    if (soundPref !== null) {
      setSoundEnabled(JSON.parse(soundPref));
    }
  }, []);

  // Save seen IDs to localStorage
  const saveSeenIds = useCallback(() => {
    const ids = Array.from(seenIdsRef.current);
    localStorage.setItem('seenNotificationIds', JSON.stringify(ids));
  }, []);

  // Transform severity to notification type
  const getNotificationType = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'critical';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'info';
      default: return 'info';
    }
  };

  // Format relative time
  const getRelativeTime = (timestamp) => {
    try {
      const now = new Date();
      const date = new Date(timestamp);
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } catch (e) {
      return 'Recently';
    }
  };

  // Fetch new incidents
  const checkNewIncidents = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/incidents`);
      if (!response.ok) return [];

      const data = await response.json();
      const incidents = data.data || [];

      // Filter incidents created after last check
      const newIncidents = incidents.filter(incident => {
        const incidentDate = new Date(incident.timestamp);
        const isNew = incidentDate > lastCheckedRef.current;
        const notSeen = !seenIdsRef.current.has(`incident-${incident.id}`);
        return isNew && notSeen;
      });

      // Create notifications for new incidents
      const notifications = newIncidents.map(incident => ({
        id: `incident-${incident.id}`,
        incidentId: incident.id,
        title: `New ${incident.severity} Incident`,
        message: incident.title || 'New incident reported',
        time: getRelativeTime(incident.timestamp),
        timestamp: incident.timestamp,
        type: getNotificationType(incident.severity),
        category: 'incident',
        unread: true,
        severity: incident.severity,
        data: {
          incidentId: incident.id,
          severity: incident.severity,
          status: incident.status
        }
      }));

      // Show browser notifications and play sounds for new incidents
      notifications.forEach(notif => {
        // Show browser notification
        if (browserPermission === 'granted') {
          const browserNotif = showIncidentNotification(notif);
          
          // Handle click on browser notification
          if (browserNotif) {
            browserNotif.onclick = () => {
              window.focus();
              // Trigger navigation (will be handled by parent component)
              const event = new CustomEvent('notificationClick', {
                detail: { incidentId: notif.incidentId }
              });
              window.dispatchEvent(event);
              browserNotif.close();
            };
          }
        }

        // Play sound alert
        if (soundEnabled) {
          playIncidentAlert({ severity: notif.severity });
        }
      });

      return notifications;
    } catch (error) {
      console.error('Error fetching incidents:', error);
      return [];
    }
  }, [browserPermission, showIncidentNotification, soundEnabled]);

  // Fetch new comments
  const checkNewComments = useCallback(async () => {
    try {
      // First get all incidents
      const incidentsResponse = await fetch(`${API_BASE_URL}/api/incidents`);
      if (!incidentsResponse.ok) return [];

      const incidentsData = await incidentsResponse.json();
      const incidents = incidentsData.data || [];

      const commentNotifications = [];

      // Check comments for each incident (limit to first 20)
      for (const incident of incidents.slice(0, 20)) {
        try {
          const commentsResponse = await fetch(
            `${API_BASE_URL}/api/incidents-comment?incidentId=${incident.id}`
          );
          
          if (!commentsResponse.ok) continue;

          const commentsData = await commentsResponse.json();
          const comments = commentsData.data || [];

          // Filter comments created after last check and not by current user
          const newComments = comments.filter(comment => {
            const commentDate = new Date(comment.created_at);
            const isNew = commentDate > lastCheckedRef.current;
            const notSeen = !seenIdsRef.current.has(`comment-${comment.id}`);
            const notByMe = comment.user_id !== userId;
            return isNew && notSeen && notByMe;
          });

          // Create notifications for new comments
          newComments.forEach(comment => {
            const notif = {
              id: `comment-${comment.id}`,
              incidentId: incident.id,
              title: 'New Comment',
              message: `${comment.user_id} commented on "${incident.title}"`,
              time: getRelativeTime(comment.created_at),
              timestamp: comment.created_at,
              type: 'info',
              category: 'comment',
              unread: true,
              data: {
                incidentId: incident.id,
                commentId: comment.id,
                userId: comment.user_id
              }
            };

            commentNotifications.push(notif);

            // Show browser notification
            if (browserPermission === 'granted') {
              const browserNotif = showCommentNotification(notif);
              
              if (browserNotif) {
                browserNotif.onclick = () => {
                  window.focus();
                  const event = new CustomEvent('notificationClick', {
                    detail: { incidentId: notif.incidentId }
                  });
                  window.dispatchEvent(event);
                  browserNotif.close();
                };
              }
            }

            // Play sound alert
            if (soundEnabled) {
              playCommentAlert();
            }
          });
        } catch (error) {
          console.error(`Error fetching comments for incident ${incident.id}:`, error);
        }
      }

      return commentNotifications;
    } catch (error) {
      console.error('Error checking comments:', error);
      return [];
    }
  }, [userId, browserPermission, showCommentNotification, soundEnabled]);

  // Poll for new notifications
  const pollNotifications = useCallback(async () => {
    const [incidentNotifs, commentNotifs] = await Promise.all([
      checkNewIncidents(),
      checkNewComments()
    ]);

    const allNewNotifs = [...incidentNotifs, ...commentNotifs];

    if (allNewNotifs.length > 0) {
      // Sort by timestamp (newest first)
      allNewNotifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setNotifications(prev => {
        // Combine with existing, remove duplicates
        const combined = [...allNewNotifs, ...prev];
        const unique = combined.filter((notif, index, self) =>
          index === self.findIndex(n => n.id === notif.id)
        );
        // Keep only last 50 notifications
        return unique.slice(0, 50);
      });

      // Update unread count
      setUnreadCount(prev => prev + allNewNotifs.length);
    }

    // Update last checked timestamp
    lastCheckedRef.current = new Date();
  }, [checkNewIncidents, checkNewComments]);

  // Start polling on mount
  useEffect(() => {
    // Initial load - don't create notifications for existing data
    lastCheckedRef.current = new Date();

    // Poll every 30 seconds
    const interval = setInterval(pollNotifications, 30000);

    // Cleanup
    return () => clearInterval(interval);
  }, [pollNotifications]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, unread: false } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Add to seen IDs
    seenIdsRef.current.add(notificationId);
    saveSeenIds();
  }, [saveSeenIds]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, unread: false }))
    );
    setUnreadCount(0);
    
    // Add all to seen IDs
    notifications.forEach(notif => seenIdsRef.current.add(notif.id));
    saveSeenIds();
  }, [notifications, saveSeenIds]);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Manually trigger a poll
  const refresh = useCallback(() => {
    pollNotifications();
  }, [pollNotifications]);

  // Toggle sound alerts
  const toggleSound = useCallback((enabled) => {
    setSoundEnabled(enabled);
    localStorage.setItem('soundAlertsEnabled', JSON.stringify(enabled));
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    refresh,
    // Browser notification features
    isBrowserNotificationSupported,
    browserPermission,
    requestBrowserPermission,
    // Sound features
    soundEnabled,
    toggleSound
  };
};

export default useEnhancedNotifications;
