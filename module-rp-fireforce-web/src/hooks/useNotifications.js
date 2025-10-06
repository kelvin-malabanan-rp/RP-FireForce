import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = 'https://incident-webhook-api.rapidresponse.workers.dev';

/**
 * Custom hook to manage real-time notifications for incidents and comments
 * Polls the backend every 30 seconds for new incidents and comments
 */
export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastCheckedRef = useRef(new Date());
  const seenIdsRef = useRef(new Set());

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
      return newIncidents.map(incident => ({
        id: `incident-${incident.id}`,
        incidentId: incident.id,
        title: `New ${incident.severity} Incident`,
        message: incident.title || 'New incident reported',
        time: getRelativeTime(incident.timestamp),
        timestamp: incident.timestamp,
        type: getNotificationType(incident.severity),
        category: 'incident',
        unread: true,
        data: {
          incidentId: incident.id,
          severity: incident.severity,
          status: incident.status
        }
      }));
    } catch (error) {
      console.error('Error fetching incidents:', error);
      return [];
    }
  }, []);

  // Fetch new comments for all incidents
  const checkNewComments = useCallback(async () => {
    try {
      // First get all incidents
      const incidentsResponse = await fetch(`${API_BASE_URL}/api/incidents`);
      if (!incidentsResponse.ok) return [];

      const incidentsData = await incidentsResponse.json();
      const incidents = incidentsData.data || [];

      const commentNotifications = [];

      // Check comments for each incident
      for (const incident of incidents.slice(0, 20)) { // Limit to first 20 to avoid too many requests
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
            commentNotifications.push({
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
            });
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
  }, [userId]);

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

  // Manually trigger a poll (useful for refresh)
  const refresh = useCallback(() => {
    pollNotifications();
  }, [pollNotifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    refresh
  };
};

export default useNotifications;
