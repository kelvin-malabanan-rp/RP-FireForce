import React from 'react';
import { 
  Users, 
  Clock, 
  MapPin, 
  Shield, 
  Mail, 
  Phone,
  Star,
  Calendar,
  Activity,
  Wifi,
  WifiOff,
  User
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
import { cn } from '../../lib/utils';

/**
 * TeamDetailsModalEnhanced Component - Modern team details modal using shadcn/ui
 */
export const TeamDetailsModalEnhanced = ({ team, isOpen, onClose }) => {
  if (!team) return null;

  const members = team.members || [];
  const primaryMembers = members.filter(m => m.role === 'primary');
  const backupMembers = members.filter(m => m.role === 'backup');
  const onlineMembers = members.filter(m => m.is_online || m.online);
  const offlineMembers = members.filter(m => !(m.is_online || m.online));

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
      <DialogContent className="max-w-4xl" onClose={onClose}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle>{team.name}</DialogTitle>
              {team.description && (
                <DialogDescription className="mt-1">
                  {team.description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-6">
            {/* Team Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{members.length}</p>
                  <p className="text-sm text-gray-600 font-medium">Total Members</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-4 text-center">
                  <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{primaryMembers.length}</p>
                  <p className="text-sm text-gray-600 font-medium">Primary</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-4 text-center">
                  <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{backupMembers.length}</p>
                  <p className="text-sm text-gray-600 font-medium">Backup</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-cyan-50 to-cyan-100">
                <CardContent className="p-4 text-center">
                  <Wifi className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{onlineMembers.length}</p>
                  <p className="text-sm text-gray-600 font-medium">Online</p>
                </CardContent>
              </Card>
            </div>

            {/* Team Information */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Team Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {team.timezone && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Clock className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Timezone</p>
                        <p className="font-semibold text-gray-900">{team.timezone}</p>
                      </div>
                    </div>
                  )}

                  {team.location && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <MapPin className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Location</p>
                        <p className="font-semibold text-gray-900">{team.location}</p>
                      </div>
                    </div>
                  )}

                  {team.created_at && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Calendar className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Created</p>
                        <p className="font-semibold text-gray-900">
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
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Star className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Team ID</p>
                        <p className="font-semibold text-gray-900 font-mono text-sm">{team.id}</p>
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
                  <Shield className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-bold text-gray-900">Primary On-Call</h3>
                  <Badge variant="success">{primaryMembers.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {primaryMembers.map((member, idx) => (
                    <MemberCard key={idx} member={member} isPrimary={true} getInitials={getInitials} getMemberName={getMemberName} />
                  ))}
                </div>
              </div>
            )}

            {/* Backup Members */}
            {backupMembers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-bold text-gray-900">Backup Members</h3>
                  <Badge variant="purple">{backupMembers.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {backupMembers.map((member, idx) => (
                    <MemberCard key={idx} member={member} isPrimary={false} getInitials={getInitials} getMemberName={getMemberName} />
                  ))}
                </div>
              </div>
            )}
          </div>
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
    <Card className={cn(
      "border-0 shadow-md hover:shadow-lg transition-shadow",
      isPrimary ? "bg-gradient-to-br from-green-50 to-white" : "bg-gradient-to-br from-purple-50 to-white"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar className="w-12 h-12 shadow-md">
              <AvatarFallback className={isPrimary ? "from-green-500 to-green-600" : "from-purple-500 to-purple-600"}>
                {getInitials(memberName)}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm",
              isOnline ? "bg-green-500" : "bg-gray-400"
            )} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900 truncate">{memberName}</h4>
              <Badge variant={isPrimary ? "success" : "purple"} className="text-xs">
                {isPrimary ? "Primary" : "Backup"}
              </Badge>
            </div>

            {member.email && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{member.email}</span>
              </div>
            )}

            {member.phone && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{member.phone}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs mt-2">
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-green-600" />
                  <span className="text-green-600 font-medium">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-500 font-medium">Offline</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamDetailsModalEnhanced;
