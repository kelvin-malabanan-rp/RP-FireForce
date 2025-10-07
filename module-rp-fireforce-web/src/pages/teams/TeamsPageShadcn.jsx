import React, { useState, useMemo } from 'react';
import { 
  Users, 
  RefreshCw, 
  Shield, 
  Activity,
  Sparkles,
  Grid3x3,
  List,
  Search,
  Loader2
} from 'lucide-react';
import { useTeamsData } from './hooks/useTeams';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { SearchInput } from '../../components/ui/search-input';
import { Select } from '../../components/ui/select';
import { Separator } from '../../components/ui/separator';
import { TeamCardShadcn } from './TeamCardShadcn';
import { TeamDetailsModalShadcn } from './TeamDetailsModalShadcn';
import { cn } from '../../lib/utils';

/**
 * TeamsPageShadcn Component - Dark theme with official shadcn/ui design
 */
export const TeamsPageShadcn = () => {
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
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
              <p className="text-lg font-medium">Loading teams...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card className="border-destructive">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <Activity className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Error Loading Teams</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={refetch} variant="default">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            Manage and view all your teams
          </p>
        </div>

        <Button onClick={refetch} size="default">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Total Teams"
          value={stats.totalTeams}
          icon={Users}
        />
        <StatsCard
          title="Total Members"
          value={stats.totalMembers}
          icon={Activity}
        />
        <StatsCard
          title="Primary On-Call"
          value={stats.totalPrimary}
          icon={Shield}
        />
        <StatsCard
          title="Backup Members"
          value={stats.totalBackup}
          icon={Activity}
        />
        <StatsCard
          title="Online Now"
          value={stats.totalOnline}
          icon={Activity}
        />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find teams by name, location, or timezone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search teams..."
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
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search Results Info */}
          {searchTerm && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {filteredTeams.length} {filteredTeams.length === 1 ? 'result' : 'results'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                matching "{searchTerm}"
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Team Section */}
      {myTeam && (
        <>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              <h2 className="text-2xl font-bold tracking-tight">My Team</h2>
              <Badge variant="default">Featured</Badge>
            </div>
            <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
              <TeamCardShadcn
                team={myTeam}
                isMyTeam={true}
                onClick={handleTeamClick}
                viewMode={viewMode}
              />
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* All Teams Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6" />
            <h2 className="text-2xl font-bold tracking-tight">
              {myTeam ? 'Other Teams' : 'All Teams'}
            </h2>
            <Badge variant="secondary">{filteredTeams.length}</Badge>
          </div>
        </div>

        {filteredTeams.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Teams Found</h3>
              <p className="text-muted-foreground mb-6">
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
              ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' 
              : 'space-y-4'
          )}>
            {filteredTeams.map((team) => (
              <TeamCardShadcn
                key={team.id}
                team={team}
                onClick={handleTeamClick}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Team Details Modal */}
      <TeamDetailsModalShadcn
        team={selectedTeam}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

/**
 * StatsCard Component - Simple stat display
 */
const StatsCard = ({ title, value, icon: Icon }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};

export default TeamsPageShadcn;
