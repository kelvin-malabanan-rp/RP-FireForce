import React from 'react';
import { Users, Clock, Shield, Star, AlertTriangle, User } from 'lucide-react';

const OnCallTeamDisplay = ({ teamData, teamName = 'Platform Engineering', loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-yellow-800">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm font-medium">No on-call team data available</span>
        </div>
      </div>
    );
  }

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'primary': return 'border-green-500 bg-green-50';
      case 'backup': return 'border-yellow-500 bg-yellow-50';
      case 'escalation': return 'border-red-500 bg-red-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'primary': return <Star className="w-5 h-5 text-green-600" />;
      case 'backup': return <Shield className="w-5 h-5 text-yellow-600" />;
      case 'escalation': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <User className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRoleLabel = (role) => {
    switch (role?.toLowerCase()) {
      case 'primary': return 'Primary On-Call';
      case 'backup': return 'Backup On-Call';
      case 'escalation': return 'Escalation Contact';
      default: return role;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMember = (member, index) => {
    if (!member) return null;

    return (
      <div 
        key={index} 
        className={`border-2 rounded-lg p-4 ${getRoleColor(member.role)}`}
      >
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
          </div>

          {/* Member Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              {getRoleIcon(member.role)}
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {getRoleLabel(member.role)}
              </span>
            </div>
            <h4 className="font-semibold text-gray-900 truncate">
              {member.firstName} {member.lastName}
            </h4>
            <p className="text-sm text-gray-600 truncate">{member.email}</p>
            {member.phoneNumber && (
              <p className="text-sm text-gray-500">{member.phoneNumber}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Prepare escalation array (ensure it's always an array)
  const escalationMembers = Array.isArray(teamData.escalation) 
    ? teamData.escalation 
    : teamData.escalation 
      ? [teamData.escalation] 
      : [];

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Current On-Call Team</h3>
              <p className="text-sm text-indigo-100">{teamName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-white">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Active Now</span>
          </div>
        </div>
      </div>

      {/* Schedule Time Range */}
      {(teamData.startTime || teamData.endTime) && (
        <div className="bg-indigo-50 px-6 py-3 border-b border-indigo-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-gray-700">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span className="font-medium">Schedule:</span>
              <span>{formatDate(teamData.startTime)}</span>
            </div>
            <div className="text-gray-600">
              to <span className="font-medium">{formatDate(teamData.endTime)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="p-6 space-y-4">
        {/* Primary */}
        {teamData.primary && renderMember(teamData.primary, 'primary')}

        {/* Backup */}
        {teamData.backup && renderMember(teamData.backup, 'backup')}

        {/* Escalation */}
        {escalationMembers.length > 0 && (
          <div className="space-y-3">
            {escalationMembers.map((member, index) => 
              renderMember(member, `escalation-${index}`)
            )}
          </div>
        )}

        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Default Notification Routing:</p>
              <p className="text-blue-700">
                These team members will be automatically notified when creating an incident, 
                unless you manually select specific users below.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnCallTeamDisplay;
