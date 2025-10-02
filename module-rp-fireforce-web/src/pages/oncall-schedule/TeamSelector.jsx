import React from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';

const TeamSelector = ({ teams, selectedTeam, onTeamChange, loading }) => {
  return (
    <div className="flex items-center space-x-3">
      <select 
        value={selectedTeam}
        onChange={(e) => onTeamChange(e.target.value)}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
        disabled={loading}
      >
        <option value="">Select a team...</option>
        {teams.map(team => (
          <option key={team.id} value={team.id} className="text-gray-900">
            {team.name} ({team.timezone})
          </option>
        ))}
      </select>
      
      {loading && (
        <div className="flex items-center text-sm text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading...
        </div>
      )}
    </div>
  );
};

export default TeamSelector;
