import React, { useState } from 'react';
import { Search, User, CheckCircle, Circle, Users, Filter, X } from 'lucide-react';

const TeamMemberSelector = ({ 
  availableUsers = [], 
  selectedUsers = [], 
  onToggleUser,
  onSelectAll,
  onDeselectAll 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Filter users based on search and role
  const filteredUsers = availableUsers.filter(user => {
    const matchesSearch = searchQuery === '' || 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'primary': return 'bg-green-100 text-green-800 border-green-300';
      case 'backup': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'escalation': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'primary': return '🎯';
      case 'backup': return '🛡️';
      case 'escalation': return '🚨';
      default: return '👤';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Select Team Members
          </h3>
          <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
            {selectedUsers.length} selected
          </span>
        </div>
        
        {/* Quick Actions */}
        <div className="flex space-x-2">
          <button
            onClick={onSelectAll}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Select All
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={onDeselectAll}
            className="text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Role Filter */}
      <div className="flex items-center space-x-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">Filter by role:</span>
        <div className="flex space-x-2">
          {['all', 'primary', 'backup', 'escalation'].map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                roleFilter === role
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
              }`}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* User List */}
      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No team members found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredUsers.map(user => {
              const isSelected = selectedUsers.includes(user.id);
              
              return (
                <button
                  key={user.id}
                  onClick={() => onToggleUser(user.id)}
                  className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-indigo-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Checkbox */}
                    <div className={`flex items-center justify-center w-6 h-6 rounded border-2 ${
                      isSelected 
                        ? 'bg-indigo-600 border-indigo-600' 
                        : 'border-gray-300'
                    }`}>
                      {isSelected ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300" />
                      )}
                    </div>

                    {/* User Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </div>

                    {/* User Info */}
                    <div className="text-left">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </span>
                        {user.role && (
                          <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getRoleBadgeColor(user.role)}`}>
                            {getRoleIcon(user.role)} {user.role}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="flex items-center space-x-1 text-indigo-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      {selectedUsers.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-900">
                {selectedUsers.length} team member{selectedUsers.length !== 1 ? 's' : ''} will be notified
              </span>
            </div>
            <button
              onClick={onDeselectAll}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMemberSelector;
