import React from 'react';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Download, 
  Upload,
  Grid3X3,
  List,
  SlidersHorizontal,
  Users
} from 'lucide-react';

const TeamFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  selectedTeam, 
  setSelectedTeam, 
  selectedRole,
  setSelectedRole,
  viewMode,
  setViewMode,
  teams, 
  roles,
  onAddMember,
  onExport,
  onImport,
  memberCount = 0
}) => {
  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-600">Manage team members, roles, and performance</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Add Member Button */}
          <button 
            onClick={onAddMember}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </button>
          
          {/* Export/Import Actions */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={onExport}
              className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              title="Export team data"
            >
              <Download className="w-4 h-4" />
            </button>
            <button 
              onClick={onImport}
              className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              title="Import team data"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0 gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[250px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search members, roles, or emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
          
          {/* Team Filter */}
          <select 
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 min-w-[150px]"
          >
            <option value="all">All Teams</option>
            {teams?.map(team => (
              <option key={team.id} value={team.id}>
                {team.name} ({team.count || 0})
              </option>
            ))}
          </select>

          {/* Role Filter */}
          {roles && roles.length > 0 && (
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 min-w-[150px]"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          )}
          
          {/* Advanced Filter Button */}
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <SlidersHorizontal className="w-4 h-4 mr-2 text-gray-600" />
            <span className="hidden sm:inline">Advanced</span>
          </button>
        </div>

        {/* View Controls and Results Count */}
        <div className="flex items-center gap-4">
          {/* Results Count */}
          <div className="text-sm text-gray-600">
            <span className="font-medium">{memberCount}</span> members
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grid view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(searchTerm || selectedTeam !== 'all' || selectedRole !== 'all') && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Active filters:</span>
          {searchTerm && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              Search: "{searchTerm}"
              <button 
                onClick={() => setSearchTerm('')}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          )}
          {selectedTeam !== 'all' && (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
              Team: {teams?.find(t => t.id === selectedTeam)?.name}
              <button 
                onClick={() => setSelectedTeam('all')}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          )}
          {selectedRole !== 'all' && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
              Role: {roles?.find(r => r.id === selectedRole)?.name}
              <button 
                onClick={() => setSelectedRole('all')}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          )}
          <button 
            onClick={() => {
              setSearchTerm('');
              setSelectedTeam('all');
              setSelectedRole('all');
            }}
            className="text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

export default TeamFilters;
