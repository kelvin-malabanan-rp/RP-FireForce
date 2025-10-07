import React from 'react';
import { 
  Users, 
  Clock, 
  MapPin, 
  Shield, 
  Mail, 
  Phone,
  Calendar,
  Activity,
  Star
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Separator } from '../../components/ui/separator';

/**
 * TeamDetailsModalShadcn Component - Official shadcn/ui dark theme
 */
export const TeamDetailsModalShadcn = ({ team, isOpen, onClose }) => {
  if (!team) return null;

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onClose={onClose}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Users className="w-6 h-6" />
            {team.name}
          </DialogTitle>
          {team.description && (
            <DialogDescription>{team.description}</DialogDescription>
          )}
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-3xl font-bold">{members.length}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Shield className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-3xl font-bold">{primaryMembers.length}</p>
                <p className="text-sm text-muted-foreground">Primary</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Activity className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-3xl font-bold">{backupMembers.length}</p>
                <p className="text-sm text-muted-foreground">Backup</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-8 h-8 mx-auto mb-2 bg-green-500 rounded-full" />
                <p className="text-3xl font-bold">{onlineMembers.length}</p>
                <p className="text-sm text-muted-foreground">Online</p>
              </CardContent>
            </Card>
          </div>

          {/* Team Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Team Information
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {team.timezone && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Timezone</p>
                      <p className="font-medium">{team.timezone}</p>
                    </div>
                  </div>
                )}

                {team.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-medium">{team.location}</p>
                    </div>
                  </div>
                )}

                {team.created_at && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {new Date(team.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {team.id && (
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Team ID</p>
                      <p className="font-medium font-mono text-sm">{team.id}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Primary Members */}
          {primaryMembers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Primary On-Call</h3>
                <Badge variant="default">{primaryMembers.length}</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {primaryMembers.map((member, idx) => (
                  <MemberCard 
                    key={idx} 
                    member={member} 
                    isPrimary={true} 
                    getInitials={getInitials} 
                    getMemberName={getMemberName} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Backup Members */}
          {backupMembers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Backup Members</h3>
                <Badge variant="secondary">{backupMembers.length}</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {backupMembers.map((member, idx) => (
                  <MemberCard 
                    key={idx} 
                    member={member} 
                    isPrimary={false} 
                    getInitials={getInitials} 
                    getMemberName={getMemberName} 
                  />
                ))}
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * MemberCard Component - Displays member information
 */
const MemberCard = ({ member, isPrimary, getInitials, getMemberName }) => {
  const isOnline = member.is_online || member.online;
  const memberName = getMemberName(member);

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar className="w-12 h-12">
              <AvatarFallback>
                {getInitials(memberName)}
              </AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold truncate">{memberName}</h4>
              <Badge variant={isPrimary ? "default" : "secondary"} className="text-xs">
                {isPrimary ? "Primary" : "Backup"}
              </Badge>
            </div>

            {member.email && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Mail className="w-3 h-3" />
                <span className="truncate">{member.email}</span>
              </div>
            )}

            {member.phone && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Phone className="w-3 h-3" />
                <span className="truncate">{member.phone}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs mt-2">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-muted-foreground">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamDetailsModalShadcn;
