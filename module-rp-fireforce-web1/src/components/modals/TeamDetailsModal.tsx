import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Shield, Mail, Circle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface TeamMember {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  is_online?: boolean;
  avatar?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  timezone?: string;
  location?: string;
  created_at?: string;
  updated_at?: string;
}

interface TeamDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
}

export const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({ isOpen, onClose, team }) => {
  if (!isOpen || !team) return null;

  // Helper to get full name from member
  const getFullName = (member: TeamMember): string => {
    if (member.name) return member.name;
    if (member.firstName && member.lastName) {
      return `${member.firstName} ${member.lastName}`;
    }
    if (member.firstName) return member.firstName;
    if (member.lastName) return member.lastName;
    return member.email || 'Unknown';
  };

  const getInitials = (member: TeamMember): string => {
    // Try to get from firstName and lastName first
    if (member.firstName && member.lastName) {
      return (member.firstName[0] + member.lastName[0]).toUpperCase();
    }
    
    // Fallback to name field
    const name = member.name || member.firstName || member.lastName || member.email || '??';
    
    if (!name || typeof name !== 'string') return '??';
    
    const parts = name.trim().split(' ').filter(n => n.length > 0);
    if (parts.length === 0) return '??';
    
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getMemberRole = (member: TeamMember): string => {
    if (member.role?.toLowerCase().includes('lead') || member.role?.toLowerCase().includes('manager')) {
      return 'Team Lead';
    }
    return member.role || 'Member';
  };

  const sortedMembers = [...(team.members || [])].sort((a, b) => {
    // Team leads first
    const aRole = getMemberRole(a);
    const bRole = getMemberRole(b);
    if (aRole === 'Team Lead' && bRole !== 'Team Lead') return -1;
    if (aRole !== 'Team Lead' && bRole === 'Team Lead') return 1;
    
    // Then by online status
    if (a.is_online && !b.is_online) return -1;
    if (!a.is_online && b.is_online) return 1;
    
    // Then alphabetically
    return getFullName(a).localeCompare(getFullName(b));
  });

  const onlineCount = team.members?.filter(m => m.is_online).length || 0;
  const totalCount = team.members?.length || 0;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{team.name}</h2>
                      {team.description && (
                        <p className="text-blue-100 text-sm mt-1">{team.description}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3">
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      <Users className="h-3 w-3 mr-1" />
                      {totalCount} Members
                    </Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      <Circle className="h-3 w-3 mr-1 fill-green-400 text-green-400" />
                      {onlineCount} Online
                    </Badge>
                    {team.location && (
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {team.location}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/20 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Members List */}
            <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {sortedMembers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full inline-block mb-4">
                    <Users className="h-12 w-12 text-slate-400" />
                  </div>
                  <p className="text-lg font-medium text-slate-900 dark:text-white">No members found</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    This team doesn't have any members yet
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {sortedMembers.map((member, index) => {
                    const isLead = getMemberRole(member) === 'Team Lead';
                    const fullName = getFullName(member);
                    
                    return (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                      >
                        <Card className={`
                          bg-white dark:bg-slate-900 
                          border-slate-200 dark:border-slate-700 
                          hover:shadow-lg hover:border-blue-500/50 dark:hover:border-blue-500/50
                          transition-all duration-200
                          ${isLead ? 'ring-2 ring-blue-500/20' : ''}
                        `}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {/* Avatar with Status */}
                              <div className="relative flex-shrink-0">
                                <Avatar className={`
                                  h-14 w-14 
                                  ${isLead ? 'ring-2 ring-blue-500' : 'ring-2 ring-slate-200 dark:ring-slate-700'}
                                `}>
                                  <AvatarImage src={member.avatar} alt={fullName} />
                                  <AvatarFallback className={`
                                    text-base font-semibold
                                    ${isLead 
                                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                                      : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                                    }
                                  `}>
                                    {getInitials(member)}
                                  </AvatarFallback>
                                </Avatar>
                                
                                {/* Online status indicator */}
                                <div className={`
                                  absolute -bottom-0.5 -right-0.5 
                                  h-4 w-4 rounded-full border-2 border-white dark:border-slate-900
                                  ${member.is_online ? 'bg-green-500' : 'bg-slate-400 dark:bg-slate-600'}
                                `} />
                              </div>

                              {/* Member Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                                    {fullName}
                                  </h3>
                                  {isLead && (
                                    <Badge 
                                      variant="secondary" 
                                      className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 flex-shrink-0"
                                    >
                                      <Shield className="h-3 w-3 mr-1" />
                                      Lead
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="space-y-1.5">
                                  {/* Email */}
                                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="truncate">{member.email}</span>
                                  </div>
                                  
                                  {/* Role */}
                                  {!isLead && member.role && (
                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs border-slate-300 dark:border-slate-600"
                                      >
                                        {member.role}
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {/* Status */}
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className={`
                                      font-medium
                                      ${member.is_online 
                                        ? 'text-green-600 dark:text-green-400' 
                                        : 'text-slate-500 dark:text-slate-500'
                                      }
                                    `}>
                                      {member.is_online ? 'Online' : 'Offline'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>

            {/* Footer */}
            <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Showing {sortedMembers.length} member{sortedMembers.length !== 1 ? 's' : ''}
                </p>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TeamDetailsModal;
