import React, { useState, useMemo } from 'react';
import { 
  Users, 
  RefreshCw, 
  TrendingUp, 
  Shield, 
  Activity,
  Sparkles,
  Grid3x3,
  List,
  Wifi,
  Clock,
  MapPin,
  Search
} from 'lucide-react';
import { useTeamsData } from './hooks/useTeams';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { SearchInput } from '../../components/ui/search-input';
import { Select } from '../../components/ui/select';
import { Separator } from '../../components/ui/separator';
import { TeamCardEnhanced } from './TeamCardEnhanced';
import { TeamDetailsModalEnhanced } from './TeamDetailsModalEnhanced';
import { cn } from '../../lib/utils';

/**
 * TeamsPage Component - Main page for displaying and managing teams
 * Redesigned with shadcn/ui components
 */
export const TeamsPageEnhanced = () => {
  const { allTeams, myTeam, otherTeams, isLoading, error, refetch } = useTeamsData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');

  // Filter and search teams
  const filteredTeams = useMemo(() => {
    let teams = [...otherTeams];

    if (searchTerm) {
      teams = teams.filter(team => 
        team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.timezone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    teams.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'members':
          return (b.members?.length || 0) - (a.members?.length || 0);
        case 'created':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        default:
          return 0;
      }
    });

    return teams;
  }, [otherTeams, searchTerm, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalMembers = allTeams.reduce((sum, team) => sum + (team.members?.length || 0), 0);
    const totalPrimary = allTeams.reduce((sum, team) => 
      sum + (team.members?.filter(m => m.role === 'primary').length || 0), 0
    );
    const totalBackup = allTeams.reduce((sum, team) => 
      sum + (team.members?.filter(m => m.role === 'backup').length || 0), 0
    );
    const totalOnline = allTeams.reduce((sum, team) => 
      sum + (team.members?.filter(m => m.is_online || m.online).length || 0), 0
    );

    return {
      totalTeams: allTeams.length,
      totalMembers,
      totalPrimary,
      totalBackup,
      totalOnline,
    };
  }, [allTeams]);

  const handleTeamClick = (team) => {
    setSelectedTeam(team);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedTeam(null), 300);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="shadow-lg">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
                <p className="text-lg font-medium text-gray-700">Loading teams...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="shadow-lg border-red-200">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <Activity className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Teams</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button onClick={refetch} variant="default">
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-1">Teams</h1>
              <p className="text-gray-600">Manage and view all your teams</p>
            </div>
          </div>

          <Button 
            variant="default" 
            onClick={refetch}
            size="lg"
            className="shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            icon={Users}
            label="Total Teams"
            value={stats.totalTeams}
            gradient="from-blue-500 to-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={Activity}
            label="Total Members"
            value={stats.totalMembers}
            gradient="from-purple-500 to-purple-600"
            bgColor="bg-purple-50"
          />
          <StatCard
            icon={Shield}
            label="Primary On-Call"
            value={stats.totalPrimary}
            gradient="from-green-500 to-green-600"
            bgColor="bg-green-50"
          />
          <StatCard
            icon={TrendingUp}
            label="Backup Members"
            value={stats.totalBackup}
            gradient="from-orange-500 to-orange-600"
            bgColor="bg-orange-50"
          />
          <StatCard
            icon={Wifi}
            label="Online Now"
            value={stats.totalOnline}
            gradient="from-cyan-500 to-cyan-600"
            bgColor="bg-cyan-50"
          />
        </div>

        {/* Search and Filters Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              <CardTitle>Search & Filter</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <SearchInput
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search teams by name, location, timezone..."
                />
              </div>

              {/* Sort */}
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="lg:w-48"
              >
                <option value="name">Sort by Name</option>
                <option value="members">Sort by Members</option>
                <option value="created">Sort by Created</option>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 border border-gray-300 rounded-xl p-1 bg-white">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-9"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-9"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Search Results Info */}
            {searchTerm && (
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="primary">
                  {filteredTeams.length} {filteredTeams.length === 1 ? 'result' : 'results'}
                </Badge>
                <span className="text-sm text-gray-600">
                  matching "{searchTerm}"
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Team Section */}
        {myTeam && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900">My Team</h2>
              <Badge variant="warning" icon={Sparkles}>Featured</Badge>
            </div>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              <TeamCardEnhanced
                team={myTeam}
                isMyTeam={true}
                onClick={handleTeamClick}
              />
            </div>
          </div>
        )}

        {/* Separator */}
        {myTeam && <Separator className="my-8" />}

        {/* All Teams Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                {myTeam ? 'Other Teams' : 'All Teams'}
              </h2>
              <Badge variant="primary">{filteredTeams.length}</Badge>
            </div>
          </div>

          {filteredTeams.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Teams Found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm 
                    ? `No teams match your search for "${searchTerm}"` 
                    : 'No teams available at the moment.'}
                </p>
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className={cn(
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-4'
            )}>
              {filteredTeams.map((team) => (
                <TeamCardEnhanced
                  key={team.id}
                  team={team}
                  onClick={handleTeamClick}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Details Modal */}
      <TeamDetailsModalEnhanced
        team={selectedTeam}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

/**
 * StatCard Component - Displays a statistic with modern design
 */
const StatCard = ({ icon: Icon, label, value, gradient, bgColor }) => {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "p-3 rounded-xl",
            bgColor
          )}>
            <Icon className={cn(
              "w-6 h-6 bg-gradient-to-br bg-clip-text text-transparent",
              gradient
            )} 
            style={{ 
              backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
            />
          </div>
          <div className={cn(
            "absolute top-0 right-0 w-24 h-24 opacity-10 rounded-bl-full",
            bgColor
          )} />
        </div>
        <div className="relative">
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-sm font-medium text-gray-600">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamsPageEnhanced;
