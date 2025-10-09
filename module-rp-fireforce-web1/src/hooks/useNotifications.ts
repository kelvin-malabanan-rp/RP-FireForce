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
  // True if the notification is specifically relevant to the current user (e.g., assigned)
  targeted?: boolean;
  // Optional recipient id if provided by the backend
  recipientId?: string;
}

interface UseNotificationsOptions {
  userId?: string;
  pollingInterval?: number;
  enabled?: boolean;
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

  // Resolve current user id (options override, fallback to localStorage)
  const getCurrentUserId = useCallback((): string | undefined => {
    if (userId) return userId;
    try {
      const stored = localStorage.getItem('userId');
      return stored || undefined;
    } catch (_) {
      return undefined;
    }
  }, [userId]);

  // Helper to safely parse incident timestamp (supports multiple fields)
  const getIncidentTimestamp = useCallback((incident: Incident): Date => {
    const ts = (incident as any).timestamp || (incident as any).created_at || (incident as any).createdAt;
    const parsed = ts ? new Date(ts) : new Date();
    return isNaN(parsed.getTime()) ? new Date() : parsed;
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

      // Filter incidents created after last check
      const recentIncidents = incidents.filter((incident: Incident) => {
        const incidentDate = getIncidentTimestamp(incident);
        const notSeen = !seenIdsRef.current.has(`incident-${incident.id}`);
        
        // Consider incident new if unseen and recent (last 30 minutes)
        const THIRTY_MIN = 30 * 60 * 1000;
        const isRecent = Date.now() - incidentDate.getTime() <= THIRTY_MIN;
        
        return notSeen && isRecent;
      });

      // ✅ NEW: Filter by targeting
      const targetedIncidents: Incident[] = [];
      const incidentsToCheckOnCall: Incident[] = [];

      console.log('[notifications] Recent incidents to process:', recentIncidents.length);

      for (const incident of recentIncidents) {
        // Check if directly assigned
        const isAssignedToMe = (incident as any).assigned_to === currentUserId;
        
        // Check if in manual notify list - check multiple possible field names
        const notifyUsers = (incident as any).notifyUsers || 
                           (incident as any).notify_users || 
                           (incident as any).notified_users ||
                           [];
        const isManuallyNotified = Array.isArray(notifyUsers) && notifyUsers.includes(currentUserId);
        
        // ✅ Check if there are ANY manual selections
        const hasManualSelections = Array.isArray(notifyUsers) && notifyUsers.length > 0;
        
        // ✅ IMPORTANT: If manual selections exist, ONLY show to selected users
        const hasTeamId = !!(incident as any).team_id;
        
        console.log(`[notifications] Incident ${incident.id}:`, {
          assigned: isAssignedToMe,
          manuallyNotified: isManuallyNotified,
          notifyUsersArray: notifyUsers,
          hasManualSelections: hasManualSelections,
          teamId: (incident as any).team_id,
          hasTeamId
        });
        
        // Priority 1: If manually notified, always include
        if (isManuallyNotified) {
          targetedIncidents.push(incident);
        }
        // Priority 2: If assigned to me, include
        else if (isAssignedToMe) {
          targetedIncidents.push(incident);
        }
        // Priority 3: Only check on-call if NO manual selections exist
        else if (!hasManualSelections) {
          if (hasTeamId) {
            incidentsToCheckOnCall.push(incident);
          } else if ((incident as any).status === 'open') {
            // No teamId and no manual selection - add to on-call check list
            incidentsToCheckOnCall.push(incident);
          }
        }
        // If has manual selections but we're not in the list, skip it
      }

      // ✅ TEMPORARY WORKAROUND: Since backend doesn't save notifyUsers or teamId,
      // show all recent open incidents to users who are currently on-call
      console.log('[notifications] Applying temporary workaround - checking if user is on-call');
      
      try {
        // Dynamically import to avoid circular dependency
        const { onCallService } = await import('../services/oncallService');
        
        // Get user's team
        const userTeamResponse = await onCallService.getUserTeam(currentUserId);
        
        console.log('[notifications] User team response:', userTeamResponse);
        
        if (userTeamResponse?.httpStatus === 'OK' && userTeamResponse.data) {
          const userTeamId = userTeamResponse.data.id;
          console.log('[notifications] User team ID:', userTeamId);
          
          // Get current on-call for user's team
          const onCallResponse = await onCallService.getCurrentOnCallByTeam(userTeamId);
          
          console.log('[notifications] On-call response:', onCallResponse);
          
          if (onCallResponse?.httpStatus === 'OK' && onCallResponse.data) {
            const onCallAssignment = onCallResponse.data;
            
            // Check if current user is primary, backup, or escalation
            const isPrimary = onCallAssignment.primary?.id === currentUserId;
            const isBackup = onCallAssignment.backup?.id === currentUserId;
            const isEscalation = onCallAssignment.escalation?.some(e => e.id === currentUserId);
            
            const isOnCall = isPrimary || isBackup || isEscalation;
            
            console.log('[notifications] On-call check:', { isPrimary, isBackup, isEscalation, isOnCall });
            
            if (isOnCall) {
              // Show all recent open incidents since backend doesn't provide targeting
              const openIncidents = recentIncidents.filter(
                inc => (inc as any).status === 'open'
              );
              console.log('[notifications] User is on-call! Adding', openIncidents.length, 'open incidents');
              targetedIncidents.push(...openIncidents);
            } else {
              console.log('[notifications] User is NOT on-call, no incidents to show');
            }
          }
        }
      } catch (err) {
        console.warn('[notifications] Failed to check on-call status:', err);
      }

      console.log('[notifications] Targeted incidents (direct):', targetedIncidents.length);
      console.log('[notifications] Incidents to check on-call:', incidentsToCheckOnCall.length);

      // Create notifications only for targeted incidents
      console.log('[notifications] 📊 Final targeted incidents:', targetedIncidents.length);
      
      const finalNotifications = targetedIncidents.map((incident: Incident) => {
        const isAssigned = (incident as any).assigned_to === currentUserId;
        const notifyUsers = (incident as any).notifyUsers || (incident as any).notify_users || [];
        const isManuallyNotified = Array.isArray(notifyUsers) && notifyUsers.includes(currentUserId);
        
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
          targeted: isAssigned || isManuallyNotified
        };
      });
      
      console.log('[notifications] ✅ Created notifications:', finalNotifications.length);
      return finalNotifications;
    } catch (error) {
      console.error('Error fetching incidents:', error);
      return [];
    }
  }, [getRelativeTime, getNotificationType, getCurrentUserId, getIncidentTimestamp]);

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