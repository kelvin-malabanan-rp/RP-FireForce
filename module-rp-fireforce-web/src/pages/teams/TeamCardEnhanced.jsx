import React from 'react';
import { Users, Clock, MapPin, Star, Shield, TrendingUp, ChevronRight, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Separator } from '../../components/ui/separator';
import { cn } from '../../lib/utils';

/**
 * TeamCardEnhanced Component - Modern team card using shadcn/ui
 */
export const TeamCardEnhanced = ({ team, isMyTeam = false, onClick, viewMode = 'grid' }) => {
  const members = team.members || [];
  const primaryMembers = members.filter(m => m.role === 'primary');
  const backupMembers = members.filter(m => m.role === 'backup');
  const onlineMembers = members.filter(m => m.is_online || m.online);

  // Helper to get member name
  const getMemberName = (member) => {
    if (member.name) return member.name;
    if (member.firstName && member.lastName) return `${member.firstName} ${member.lastName}`;
    if (member.firstName) return member.firstName;
    if (member.lastName) return member.lastName;
    return member.email || 'Unknown';
  };

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (viewMode === 'list') {
    return (
      <Card 
        className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-md group"
        onClick={() => onClick(team)}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                    {team.name}
                  </h3>
                  {isMyTeam && (
                    <Badge variant="warning" icon={Star}>
                      My Team
                    </Badge>
                  )}
                </div>
                {team.description && (
                  <p className="text-sm text-gray-600 line-clamp-1">{team.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 flex-shrink-0">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                  <p className="text-xs text-gray-500">Members</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{primaryMembers.length}</p>
                  <p className="text-xs text-gray-500">Primary</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-cyan-600">{onlineMembers.length}</p>
                  <p className="text-xs text-gray-500">Online</p>
                </div>
              </div>
              
              <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 shadow-lg group overflow-hidden",
        isMyTeam && "ring-2 ring-yellow-400 ring-offset-2"
      )}
      onClick={() => onClick(team)}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full transform translate-x-12 -translate-y-12 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform duration-300 opacity-50" />
      
      <CardHeader className="relative pb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl mb-2 group-hover:text-blue-600 transition-colors truncate">
              {team.name}
            </CardTitle>
            {isMyTeam && (
              <Badge variant="warning" icon={Star}>
                My Team
              </Badge>
            )}
          </div>
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md flex-shrink-0 ml-3">
            <Users className="w-5 h-5 text-white" />
          </div>
        </div>
        
        {team.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mt-2">{team.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <div className="flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xl font-bold text-gray-900">{members.length}</p>
            <p className="text-xs text-gray-600 font-medium">Members</p>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-xl">
            <div className="flex items-center justify-center mb-1">
              <Shield className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-xl font-bold text-gray-900">{primaryMembers.length}</p>
            <p className="text-xs text-gray-600 font-medium">Primary</p>
          </div>

          <div className="text-center p-3 bg-purple-50 rounded-xl">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xl font-bold text-gray-900">{backupMembers.length}</p>
            <p className="text-xs text-gray-600 font-medium">Backup</p>
          </div>
        </div>

        <Separator />

        {/* Team Info */}
        <div className="space-y-2">
          {team.timezone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="truncate">{team.timezone}</span>
            </div>
          )}
          
          {team.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="truncate">{team.location}</span>
            </div>
          )}

          {onlineMembers.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Wifi className="w-4 h-4 text-green-500" />
              <span>{onlineMembers.length} member{onlineMembers.length !== 1 ? 's' : ''} online</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Member Avatars */}
        {members.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Team Members</p>
            <div className="flex items-center -space-x-2">
              {members.slice(0, 5).map((member, idx) => (
                <Avatar key={idx} className="border-2 border-white shadow-md w-9 h-9">
                  <AvatarFallback className="text-xs">
                    {getInitials(getMemberName(member))}
                  </AvatarFallback>
                </Avatar>
              ))}
              {members.length > 5 && (
                <div className="w-9 h-9 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center shadow-md">
                  <span className="text-xs font-semibold text-gray-700">+{members.length - 5}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Details Button */}
        <button className="w-full mt-2 py-2.5 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl text-blue-700 font-semibold text-sm transition-all flex items-center justify-center gap-2 group/btn">
          <span>View Details</span>
          <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </CardContent>
    </Card>
  );
};

export default TeamCardEnhanced;
