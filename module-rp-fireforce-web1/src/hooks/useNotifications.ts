import { useState, useEffect, useCallback, useRef } from 'react';
import { incidentService, commentService } from '../services';
import type { Incident, IncidentComment } from '../services';

export interface Notification {
  id: string;
  incidentId?: string;
  title: string;
  message: string;
  time: string;
  timestamp: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  category: 'incident' | 'comment';
  unread: boolean;
  severity?: string;
  data?: any;
  targeted?: boolean;
  recipientId?: string;
}

interface UseNotificationsOptions {
  userId?: string;
  pollingInterval?: number;
  enabled?: boolean;
}

interface CurrentOnCallResponse {
  httpStatus: string;
  message: string;
  data: {
    primary: Array<{
      userId: string;
      fullname: string;
      email: string;
      role: string;
      teamId: string;
      teamName: string;
      timezone: string;
    }>;
    backup: Array<{
      userId: string;
      fullname: string;
      email: string;
      role: string;
      teamId: string;
      teamName: string;
      timezone: string;
    }>;
    escalation: Array<{
      userId: string;
      fullname: string;
      email: string;
      role: string;
      teamId: string;
      teamName: string;
      timezone: string;
    }>;
  };
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { userId, pollingInterval = 30000, enabled = true } = options;
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const lastCheckedRef = useRef(new Date());
  const seenIdsRef = useRef(new Set<string>());

  // Load seen notifications from localStorage
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

  // Format relative time
  const getRelativeTime = useCallback((timestamp: string): string => {
    try {
      const now = new Date();
      const date = new Date(timestamp);
      const diffMs = now.getTime() - date.getTime();
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
  }, []);

  // Get notification type based on severity
  const getNotificationType = useCallback((severity?: string): Notification['type'] => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'critical';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'info';
      default: return 'info';
    }
  }, []);

  // Resolve current user id
  const getCurrentUserId = useCallback((): string | undefined => {
    if (userId) return userId;
    try {
      const stored = localStorage.getItem('userId');
      return stored || undefined;
    } catch (_) {
      return undefined;
    }
  }, [userId]);

  // Helper to safely parse incident timestamp
  const getIncidentTimestamp = useCallback((incident: Incident): Date => {
    const ts = (incident as any).timestamp || (incident as any).created_at || (incident as any).createdAt;
    const parsed = ts ? new Date(ts) : new Date();
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }, []);

  // ✅ NEW: Get all current on-call user IDs
  const getCurrentOnCallUserIds = useCallback(async (): Promise<Set<string>> => {
    try {
      console.log('[notifications] 📞 Fetching current on-call users...');
      
      const response = await fetch('https://incident-webhook-api.rapidresponse.workers.dev/api/oncall/current');
      
      if (!response.ok) {
        console.warn('[notifications] Failed to fetch on-call users:', response.status);
        return new Set<string>();
      }

      const result: CurrentOnCallResponse = await response.json();
      
      if (result.httpStatus !== 'OK' || !result.data) {
        console.warn('[notifications] Invalid on-call response');
        return new Set<string>();
      }

      // Collect all user IDs from primary, backup, and escalation
      const onCallUserIds = new Set<string>();
      
      result.data.primary.forEach(user => onCallUserIds.add(user.userId));
      result.data.backup.forEach(user => onCallUserIds.add(user.userId));
      result.data.escalation.forEach(user => onCallUserIds.add(user.userId));
      
      console.log('[notifications] ✅ On-call users found:', onCallUserIds.size);
      console.log('[notifications] On-call user IDs:', Array.from(onCallUserIds));
      
      return onCallUserIds;
    } catch (error) {
      console.error('[notifications] ❌ Error fetching on-call users:', error);
      return new Set<string>();
    }
  }, []);

  // Check for new incidents
  const checkNewIncidents = useCallback(async (): Promise<Notification[]> => {
    console.log('[notifications] 🔍 Checking for new incidents...');
    
    try {
      const response = await incidentService.getAllIncidents();
      const incidents = response.data || [];
      const currentUserId = getCurrentUserId();

      console.log('[notifications] Fetched incidents:', incidents.length);
      console.log('[notifications] Current user ID:', currentUserId);

      if (!currentUserId) {
        console.warn('[notifications] No user ID found, skipping incident check');
        return [];
      }

      // ✅ Get current on-call user IDs
      const onCallUserIds = await getCurrentOnCallUserIds();
      
      // ✅ Check if current user is on-call
      const isCurrentUserOnCall = onCallUserIds.has(currentUserId);
      
      console.log('[notifications] Is current user on-call?', isCurrentUserOnCall);

      if (!isCurrentUserOnCall) {
        console.log('[notifications] ⏭️ User is NOT on-call, skipping notifications');
        return [];
      }

      // Filter incidents created after last check
      const recentIncidents = incidents.filter((incident: Incident) => {
        const incidentDate = getIncidentTimestamp(incident);
        const notSeen = !seenIdsRef.current.has(`incident-${incident.id}`);
        
        // Consider incident new if unseen and recent (last 30 minutes)
        const THIRTY_MIN = 30 * 60 * 1000;
        const isRecent = Date.now() - incidentDate.getTime() <= THIRTY_MIN;
        
        return notSeen && isRecent;
      });

      console.log('[notifications] Recent unseen incidents:', recentIncidents.length);

      // ✅ Only show OPEN incidents to on-call users
      const openIncidents = recentIncidents.filter(
        inc => (inc as any).status === 'open'
      );

      console.log('[notifications] ✅ Open incidents to notify:', openIncidents.length);

      // Create notifications
      const finalNotifications = openIncidents.map((incident: Incident) => {
        return {
          id: `incident-${incident.id}`,
          incidentId: incident.id,
          title: `New ${incident.severity} Incident`,
          message: incident.title || 'New incident reported',
          time: getRelativeTime(getIncidentTimestamp(incident).toISOString()),
          timestamp: getIncidentTimestamp(incident).toISOString(),
          type: getNotificationType(incident.severity),
          category: 'incident' as const,
          unread: true,
          severity: incident.severity,
          data: {
            incidentId: incident.id,
            severity: incident.severity,
            status: incident.status,
            location: (incident as any).location,
            reportedBy: (incident as any).reported_by
          },
          recipientId: currentUserId,
          targeted: true
        };
      });
      
      console.log('[notifications] ✅ Created notifications for on-call user:', finalNotifications.length);
      return finalNotifications;
    } catch (error) {
      console.error('[notifications] ❌ Error fetching incidents:', error);
      return [];
    }
  }, [getRelativeTime, getNotificationType, getCurrentUserId, getIncidentTimestamp, getCurrentOnCallUserIds]);

  // Check for new comments
  const checkNewComments = useCallback(async (): Promise<Notification[]> => {
    if (!userId) return [];

    try {
      // Get all incidents first
      const incidentsResponse = await incidentService.getAllIncidents();
      const incidents = incidentsResponse.data || [];

      const commentNotifications: Notification[] = [];

      // Check comments for each incident (limit to first 20)
      for (const incident of incidents.slice(0, 20)) {
        try {
          const commentsResponse = await commentService.getIncidentComments(incident.id);
          const comments = commentsResponse.data || [];

          // Filter new comments not by current user
          const newComments = comments.filter((comment: IncidentComment) => {
            const commentDate = new Date(comment.created_at);
            const isNew = commentDate > lastCheckedRef.current;
            const notSeen = !seenIdsRef.current.has(`comment-${comment.id}`);
            const notByMe = comment.user_id !== userId;
            return isNew && notSeen && notByMe;
          });

          // Create notifications for new comments
          newComments.forEach((comment: IncidentComment) => {
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
  }, [userId, getRelativeTime]);

  // Poll for notifications
  const pollNotifications = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const [incidentNotifs, commentNotifs] = await Promise.all([
        checkNewIncidents(),
        checkNewComments()
      ]);

      const allNewNotifs = [...incidentNotifs, ...commentNotifs];

      if (allNewNotifs.length > 0) {
        // Sort by timestamp (newest first)
        allNewNotifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Add to existing notifications
        setNotifications(prev => [...allNewNotifs, ...prev]);

        // Mark as seen
        allNewNotifs.forEach(notif => seenIdsRef.current.add(notif.id));
        saveSeenIds();
      }

      lastCheckedRef.current = new Date();
    } catch (err: any) {
      console.error('Error polling notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [enabled, checkNewIncidents, checkNewComments, saveSeenIds]);

  // Allow other parts of the app to request an immediate refresh/push
  useEffect(() => {
    const handleRefresh = () => {
      pollNotifications();
    };
    const handlePush = (e: Event) => {
      const custom = e as CustomEvent<Notification>;
      const notif = custom.detail;
      if (!notif || !notif.id) return;
      // prevent duplicates
      if (seenIdsRef.current.has(notif.id)) return;
      // Ensure targeting matches current user to avoid cross-account alerts
      const currentUserId = getCurrentUserId();
      const isTargetedToMe = notif.targeted === true || (notif.recipientId && currentUserId && notif.recipientId === currentUserId);
      if (!isTargetedToMe) return;
      setNotifications(prev => [notif, ...prev]);
      seenIdsRef.current.add(notif.id);
      saveSeenIds();
    };

    window.addEventListener('notifications:refresh', handleRefresh as EventListener);
    window.addEventListener('notifications:push', handlePush as EventListener);
    return () => {
      window.removeEventListener('notifications:refresh', handleRefresh as EventListener);
      window.removeEventListener('notifications:push', handlePush as EventListener);
    };
  }, [pollNotifications, saveSeenIds, getCurrentUserId]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, unread: false } : notif
      )
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, unread: false }))
    );
  }, []);

  // Refresh notifications
  const refresh = useCallback(() => {
    pollNotifications();
  }, [pollNotifications]);

  // Update unread count
  useEffect(() => {
    const count = notifications.filter(n => n.unread).length;
    setUnreadCount(count);
  }, [notifications]);

  // Start polling
  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    pollNotifications();

    // Set up polling interval
    const interval = setInterval(pollNotifications, pollingInterval);

    return () => clearInterval(interval);
  }, [enabled, pollingInterval, pollNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh
  };
}