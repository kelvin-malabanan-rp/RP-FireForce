import React from 'react';
import { Users, Clock, MapPin, Star, Shield, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Separator } from '../../components/ui/separator';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';

/**
 * TeamCardShadcn Component - Official shadcn/ui dark theme
 */
export const TeamCardShadcn = ({ team, isMyTeam = false, onClick, viewMode = 'grid' }) => {
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
        className="hover:bg-accent/50 transition-colors cursor-pointer"
        onClick={() => onClick(team)}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold truncate">
                    {team.name}
                  </h3>
                  {isMyTeam && (
                    <Badge variant="default">
                      <Star className="w-3 h-3 mr-1" />
                      My Team
                    </Badge>
                  )}
                </div>
                {team.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">{team.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{members.length}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{primaryMembers.length}</p>
                <p className="text-xs text-muted-foreground">Primary</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{onlineMembers.length}</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "hover:bg-accent/50 transition-colors cursor-pointer",
        isMyTeam && "border-primary"
      )}
      onClick={() => onClick(team)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate mb-2">{team.name}</CardTitle>
            {isMyTeam && (
              <Badge variant="default" className="mb-2">
                <Star className="w-3 h-3 mr-1" />
                My Team
              </Badge>
            )}
            {team.description && (
              <CardDescription className="line-clamp-2">
                {team.description}
              </CardDescription>
            )}
          </div>
          <div className="p-2 bg-primary/10 rounded-lg ml-3">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{members.length}</p>
            <p className="text-xs text-muted-foreground">Members</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{primaryMembers.length}</p>
            <p className="text-xs text-muted-foreground">Primary</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{backupMembers.length}</p>
            <p className="text-xs text-muted-foreground">Backup</p>
          </div>
        </div>

        <Separator />

        {/* Team Info */}
        <div className="space-y-2 text-sm">
          {team.timezone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="truncate">{team.timezone}</span>
            </div>
          )}
          
          {team.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{team.location}</span>
            </div>
          )}

          {onlineMembers.length > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>{onlineMembers.length} member{onlineMembers.length !== 1 ? 's' : ''} online</span>
            </div>
          )}
        </div>

        {/* Member Avatars */}
        {members.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">TEAM MEMBERS</p>
              <div className="flex items-center -space-x-2">
                {members.slice(0, 5).map((member, idx) => (
                  <Avatar key={idx} className="border-2 border-background w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(getMemberName(member))}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {members.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-xs font-semibold">+{members.length - 5}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* View Details Button */}
        <Button variant="secondary" className="w-full">
          View Details
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default TeamCardShadcn;
