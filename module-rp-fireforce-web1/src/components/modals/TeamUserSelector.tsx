import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, CheckCircle, Search, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { onCallService } from "../../services";
import type { Team } from "../../types/team-types";

interface TeamUserSelectorProps {
  onSelectionChange: (selectedUserIds: string[]) => void;
  selectedUserIds: string[];
}

export function TeamUserSelector({ onSelectionChange, selectedUserIds }: TeamUserSelectorProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await onCallService.getTeams();
      
      if (response.success && response.data) {
        // Filter teams to only include those with members
        const teamsWithMembers = response.data.filter((team: any) => 
          team.members && Array.isArray(team.members) && team.members.length > 0
        );
        setTeams(teamsWithMembers);
        
        // Auto-expand first team if available
        if (teamsWithMembers.length > 0) {
          setExpandedTeams(new Set([teamsWithMembers[0].id]));
        }
      }
    } catch (err: any) {
      console.error('Error loading teams:', err);
      setError('Failed to load teams. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTeam = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const toggleUser = (userId: string) => {
    const newSelected = selectedUserIds.includes(userId)
      ? selectedUserIds.filter(id => id !== userId)
      : [...selectedUserIds, userId];
    
    onSelectionChange(newSelected);
  };

  const selectAllInTeam = (team: Team) => {
    if (!team.members) return;
    
    const teamUserIds = team.members.map(m => m.id);
    const allSelected = teamUserIds.every(id => selectedUserIds.includes(id));
    
    if (allSelected) {
      // Deselect all from this team
      onSelectionChange(selectedUserIds.filter(id => !teamUserIds.includes(id)));
    } else {
      // Select all from this team
      const newSelected = [...new Set([...selectedUserIds, ...teamUserIds])];
      onSelectionChange(newSelected);
    }
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const filteredTeams = teams.filter(team => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const teamMatches = team.name.toLowerCase().includes(query);
    const memberMatches = team.members?.some(member =>
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
    
    return teamMatches || memberMatches;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        <span className="ml-2 text-sm text-slate-400">Loading teams...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={loadTeams}
          className="mt-2 text-white"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="p-8 text-center">
        <Users className="h-12 w-12 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-400">No teams available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Search and Actions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-500" />
            <h3 className="text-sm font-medium text-white">
              Select Team Members
            </h3>
            {selectedUserIds.length > 0 && (
              <Badge className="bg-orange-500 text-white">
                {selectedUserIds.length} selected
              </Badge>
            )}
          </div>
          {selectedUserIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-slate-400 hover:text-white h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams or members..."
            className="pl-9 text-white dark:text-white bg-slate-800 border-slate-700"
          />
        </div>
      </div>

      {/* Teams List */}
      <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
        {filteredTeams.map((team) => {
          const isExpanded = expandedTeams.has(team.id);
          const teamUserIds = team.members?.map(m => m.id) || [];
          const selectedInTeam = teamUserIds.filter(id => selectedUserIds.includes(id)).length;
          const allSelected = teamUserIds.length > 0 && teamUserIds.every(id => selectedUserIds.includes(id));

          return (
            <Card
              key={team.id}
              className="border border-slate-700 bg-slate-800/50 overflow-hidden"
            >
              {/* Team Header */}
              <div
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-700/30 transition-colors"
                onClick={() => toggleTeam(team.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{team.name}</h4>
                    <p className="text-xs text-slate-400">
                      {team.members?.length || 0} members
                      {selectedInTeam > 0 && ` • ${selectedInTeam} selected`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {team.members && team.members.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectAllInTeam(team);
                      }}
                      className="h-7 text-xs text-white hover:text-orange-400"
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </Button>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Team Members */}
              <AnimatePresence>
                {isExpanded && team.members && team.members.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-700"
                  >
                    <div className="p-2 space-y-1">
                      {team.members.map((member) => {
                        const isSelected = selectedUserIds.includes(member.id);

                        return (
                          <motion.div
                            key={member.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`p-3 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-orange-500/20 border border-orange-500/50'
                                : 'bg-slate-800/50 border border-slate-700 hover:border-slate-600'
                            }`}
                            onClick={() => toggleUser(member.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                                  isSelected
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-slate-700 text-slate-300'
                                }`}>
                                  {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                                </div>

                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${
                                    isSelected ? 'text-white' : 'text-slate-200'
                                  }`}>
                                    {member.firstName} {member.lastName}
                                  </p>
                                  <p className="text-xs text-slate-400 truncate">
                                    {member.email}
                                  </p>
                                </div>

                                {/* Role Badge */}
                                <Badge
                                  variant="outline"
                                  className={`text-xs capitalize ${
                                    member.role === 'primary'
                                      ? 'border-blue-500 text-blue-400'
                                      : member.role === 'backup'
                                      ? 'border-green-500 text-green-400'
                                      : 'border-purple-500 text-purple-400'
                                  }`}
                                >
                                  {member.role}
                                </Badge>
                              </div>

                              {/* Checkmark */}
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 300 }}
                                >
                                  <CheckCircle className="h-5 w-5 text-orange-500 ml-2" />
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      {selectedUserIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
        >
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <strong>{selectedUserIds.length}</strong> {selectedUserIds.length === 1 ? 'person' : 'people'} will receive notifications and alerts on their mobile devices.
          </p>
        </motion.div>
      )}
    </div>
  );
}
