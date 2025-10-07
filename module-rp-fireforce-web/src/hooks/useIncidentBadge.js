import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = 'https://incident-webhook-api.rapidresponse.workers.dev';

/**
 * Custom hook to track new/unread incidents for the incident tab badge
 * Similar to notification bell, this tracks which incidents the user has already seen
 */
export const useIncidentBadge = (userId) => {
  const [newIncidentsCount, setNewIncidentsCount] = useState(0);
  const seenIncidentsRef = useRef(new Set());
  const lastFetchedIncidentsRef = useRef([]);

  // Load seen incidents from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`seenIncidents_${userId}`);
    if (stored) {
      try {
        const ids = JSON.parse(stored);
        seenIncidentsRef.current = new Set(ids);
        console.log(`[IncidentBadge] Loaded ${ids.length} seen incidents from storage`);
      } catch (e) {
        console.error('[IncidentBadge] Failed to parse stored incident IDs:', e);
      }
    }
  }, [userId]);

  // Save seen incidents to localStorage
  const saveSeenIncidents = useCallback(() => {
    const ids = Array.from(seenIncidentsRef.current);
    localStorage.setItem(`seenIncidents_${userId}`, JSON.stringify(ids));
  }, [userId]);

  // Calculate unread count from current incidents
  const calculateUnreadCount = useCallback((incidents) => {
    const unreadIncidents = incidents.filter(incident => {
      const isNotSeen = !seenIncidentsRef.current.has(incident.id);
      const isActive = incident.status === 'Open' || incident.status === 'Investigating';
      return isNotSeen && isActive;
    });
    
    const count = unreadIncidents.length;
    setNewIncidentsCount(count);
    console.log(`[IncidentBadge] Total: ${incidents.length}, New: ${count}, Seen: ${seenIncidentsRef.current.size}`);
    return count;
  }, []);

  // Fetch incidents and calculate new count
  const fetchIncidents = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/incidents`);
      if (!response.ok) {
        console.error('[IncidentBadge] Failed to fetch incidents:', response.status);
        return;
      }

      const result = await response.json();
      const allIncidents = result.data || [];
      
      // Store for reference
      lastFetchedIncidentsRef.current = allIncidents;
      
      // Calculate unread count
      calculateUnreadCount(allIncidents);
    } catch (error) {
      console.error('[IncidentBadge] Error fetching incidents:', error);
    }
  }, [calculateUnreadCount]);

  // Mark incident as seen
  const markIncidentAsSeen = useCallback((incidentId) => {
    if (!seenIncidentsRef.current.has(incidentId)) {
      seenIncidentsRef.current.add(incidentId);
      saveSeenIncidents();
      
      // Recalculate count with current incidents
      calculateUnreadCount(lastFetchedIncidentsRef.current);
      
      console.log(`[IncidentBadge] Marked incident ${incidentId} as seen`);
    }
  }, [saveSeenIncidents, calculateUnreadCount]);

  // Mark all current incidents as seen
  const markAllAsSeen = useCallback(() => {
    lastFetchedIncidentsRef.current.forEach(incident => {
      seenIncidentsRef.current.add(incident.id);
    });
    saveSeenIncidents();
    setNewIncidentsCount(0);
    console.log(`[IncidentBadge] Marked all incidents as seen`);
  }, [saveSeenIncidents]);

  // Fetch incidents on mount and set up polling
  useEffect(() => {
    // Initial fetch
    fetchIncidents();

    // Poll for new incidents every 10 seconds (similar to notifications)
    const interval = setInterval(fetchIncidents, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchIncidents]);

  // Listen for custom events to refresh the badge
  useEffect(() => {
    const handleRefresh = () => {
      console.log('[IncidentBadge] Refresh event received');
      fetchIncidents();
    };

    const handleIncidentCreated = () => {
      console.log('[IncidentBadge] New incident created event received');
      setTimeout(fetchIncidents, 1000); // Small delay to ensure backend is updated
    };

    window.addEventListener('refreshIncidentBadge', handleRefresh);
    window.addEventListener('incidentCreated', handleIncidentCreated);

    return () => {
      window.removeEventListener('refreshIncidentBadge', handleRefresh);
      window.removeEventListener('incidentCreated', handleIncidentCreated);
    };
  }, [fetchIncidents]);

  return {
    newIncidentsCount,
    markIncidentAsSeen,
    markAllAsSeen,
    refresh: fetchIncidents,
  };
};

export default useIncidentBadge;
