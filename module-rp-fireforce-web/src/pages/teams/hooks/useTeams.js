import { useState, useEffect, useCallback } from 'react';
import { onCallService } from '../../../services/api';

/**
 * Hook to fetch all teams with user's team separated
 */
export const useTeamsData = () => {
  const [allTeams, setAllTeams] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [otherTeams, setOtherTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = localStorage.getItem('userId');

  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all teams
      const teams = await onCallService.getTeams();
      setAllTeams(teams || []);

      // Find user's team
      if (userId) {
        const userTeam = teams.find(team => 
          team.members?.some(member => member.id === userId || member.userId === userId)
        );
        
        setMyTeam(userTeam || null);
        setOtherTeams(teams.filter(team => team.id !== userTeam?.id));
      } else {
        setMyTeam(null);
        setOtherTeams(teams || []);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError(err.message || 'Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return { 
    allTeams, 
    myTeam, 
    otherTeams, 
    isLoading, 
    error, 
    refetch: fetchTeams 
  };
};

export default useTeamsData;
