import React from 'react';
import { Users, UserX, AlertCircle } from 'lucide-react';
import TeamMemberCard from './TeamMemberCard';

const TeamMembersGrid = ({ 
  members, 
  isLoading = false, 
  error = null,
  viewMode = 'grid',
  onEditMember,
  onDeleteMember,
  onContactMember,
  onToggleOnCall,
  emptyStateMessage = 'No team members found'
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="w-48 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="w-24 h-4 bg-gray-200 rounded"></div>
                      <div className="w-32 h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="w-8 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="w-full h-3 bg-gray-200 rounded"></div>
                  <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
                  <div className="w-5/6 h-3 bg-gray-200 rounded"></div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex space-x-2">
                    <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                    <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load team members</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!members || members.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-8 text-center">
          <UserX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members found</h3>
          <p className="text-gray-600 mb-4">{emptyStateMessage}</p>
          <p className="text-sm text-gray-500">Try adjusting your search filters or add new team members.</p>
        </div>
      </div>
    );
  }

  // List view rendering
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{members.length} members</span>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {members.map((member) => (
            <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{member.avatar || member.name?.charAt(0)}</span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${
                      member.status === 'online' ? 'bg-green-500' : 
                      member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                    } rounded-full border-2 border-white`}></div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-bold text-gray-900">{member.name}</h3>
                      {member.isOnCall && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          On-Call
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{member.role}</p>
                    <p className="text-xs text-gray-500">{member.team}</p>
                  </div>
                  
                  <div className="hidden sm:flex items-center space-x-6 text-sm text-gray-600">
                    <div>
                      <div className="font-medium">{member.alertsHandled || 0}</div>
                      <div className="text-xs">Alerts</div>
                    </div>
                    <div>
                      <div className="font-medium">{member.avgResponseTime || 'N/A'}</div>
                      <div className="text-xs">Avg Response</div>
                    </div>
                    <div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (member.performance || 0) >= 95 ? 'text-green-600 bg-green-100' :
                        (member.performance || 0) >= 90 ? 'text-blue-600 bg-blue-100' :
                        (member.performance || 0) >= 85 ? 'text-yellow-600 bg-yellow-100' :
                        'text-red-600 bg-red-100'
                      }`}>
                        {member.performance || 0}%
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => onContactMember?.(member)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Contact
                  </button>
                  <button 
                    onClick={() => onEditMember?.(member)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Grid view rendering (default)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">{members.length} members</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {members.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              onEdit={onEditMember}
              onDelete={onDeleteMember}
              onContact={onContactMember}
              onToggleOnCall={onToggleOnCall}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamMembersGrid;
