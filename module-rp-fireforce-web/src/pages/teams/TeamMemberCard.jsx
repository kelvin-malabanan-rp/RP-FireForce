import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MoreVertical, 
  Edit, 
  UserCheck, 
  UserX, 
  Shield,
  Star,
  Settings,
  Trash2
} from 'lucide-react';

const TeamMemberCard = ({ member, onEdit, onDelete, onContact, onToggleOnCall }) => {
  const [showActions, setShowActions] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getPerformanceColor = (performance) => {
    if (performance >= 95) return 'text-green-600 bg-green-100';
    if (performance >= 90) return 'text-blue-600 bg-blue-100';
    if (performance >= 85) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const handleActionClick = (action, e) => {
    e.stopPropagation();
    setShowActions(false);
    
    switch (action) {
      case 'edit':
        onEdit?.(member);
        break;
      case 'delete':
        onDelete?.(member);
        break;
      case 'contact':
        onContact?.(member);
        break;
      case 'toggleOnCall':
        onToggleOnCall?.(member);
        break;
      default:
        break;
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors border border-gray-200 relative">
      {/* Header with Avatar and Actions */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">{member.avatar || member.name?.charAt(0)}</span>
            </div>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(member.status)} rounded-full border-2 border-white`}></div>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{member.name}</h3>
            <p className="text-sm text-gray-600">{member.role}</p>
            <p className="text-xs text-gray-500">{member.team}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {member.isOnCall && (
            <div className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center">
              <Shield className="w-3 h-3 mr-1" />
              On-Call
            </div>
          )}
          {member.isTeamLead && (
            <div className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center">
              <Star className="w-3 h-3 mr-1" />
              Lead
            </div>
          )}
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
            
            {/* Actions Dropdown */}
            {showActions && (
              <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                <button 
                  onClick={(e) => handleActionClick('contact', e)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Message
                </button>
                <button 
                  onClick={(e) => handleActionClick('edit', e)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
                <button 
                  onClick={(e) => handleActionClick('toggleOnCall', e)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  {member.isOnCall ? <UserX className="w-4 h-4 mr-2" /> : <UserCheck className="w-4 h-4 mr-2" />}
                  {member.isOnCall ? 'Remove On-Call' : 'Set On-Call'}
                </button>
                <hr className="my-2" />
                <button 
                  onClick={(e) => handleActionClick('delete', e)}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Member
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="truncate">{member.email}</span>
        </div>
        {member.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{member.phone}</span>
          </div>
        )}
        {member.location && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{member.location}</span>
          </div>
        )}
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>Last active: {member.lastActive || 'Unknown'}</span>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="border-t border-gray-200 pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <div className="text-gray-600">Alerts Handled</div>
            <div className="font-bold text-gray-900">{member.alertsHandled || 0}</div>
          </div>
          <div>
            <div className="text-gray-600">Avg Response</div>
            <div className="font-bold text-gray-900">{member.avgResponseTime || 'N/A'}</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">Performance</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(member.performance || 0)}`}>
            {member.performance || 0}%
          </span>
        </div>

        {/* Specialties */}
        {member.specialties && member.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {member.specialties.slice(0, 3).map((specialty, idx) => (
              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                {specialty}
              </span>
            ))}
            {member.specialties.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                +{member.specialties.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button 
            onClick={() => onContact?.(member)}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Mail className="w-4 h-4 mr-1" />
            Contact
          </button>
          <button 
            onClick={() => onEdit?.(member)}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </button>
        </div>
      </div>

      {/* Click outside to close actions */}
      {showActions && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
};

export default TeamMemberCard;
