// pages/TeamsPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Shield, Clock, MapPin, RefreshCw, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { onCallService } from '../../services';
import { TeamDetailsModal } from '../modals/TeamDetailsModal';
import { CreateTeamModal } from '../modals/CreateTeamModal';

interface TeamMember {
    id: string;
    userId?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    email: string;
    role: string;
    is_online: boolean;
    avatar?: string;
    avatarUrl?: string;
}

interface Team {
    id: string;
    name: string;
    description?: string;
    members: TeamMember[];
    timezone?: string;
    location?: string;
    created_at?: string;
    updated_at?: string;
}

export const TeamsPage: React.FC = () => {
    console.log('🎯 TeamsPage component mounted/rendered');

    const [teams, setTeams] = useState<Team[]>([]);
    const [myTeam, setMyTeam] = useState<Team | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOption, setFilterOption] = useState<'all' | 'my-team'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasSetInitialFilter, setHasSetInitialFilter] = useState(false);
    const teamsPerPage = 4;

    // Modal states
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleViewDetails = (team: Team) => {
        setSelectedTeam(team);
        setIsDetailsModalOpen(true);
    };

    const handleCloseDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setTimeout(() => setSelectedTeam(null), 200);
    };

    const handleOpenCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
    };

    // Refresh teams after updates
    const handleTeamUpdated = () => {
        console.log('🔄 Team updated, refreshing teams list...');
        loadTeams(true);
    };

    const handleTeamCreated = () => {
        console.log('✅ Team created, refreshing teams list...');
        loadTeams(true);
    };

    // Load teams from API
    const loadTeams = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            setError(null);

            console.log('👥 Loading teams from API...');
            const response = await onCallService.getTeams();

            if (response.success && response.data) {
                const teamsData = Array.isArray(response.data) ? response.data : [];
                console.log('✅ Teams loaded:', teamsData.length);

                // Get current user to identify their team
                const userStr = localStorage.getItem('user');
                const currentUserId = userStr ? JSON.parse(userStr).id : null;

                console.log('🔍 Current user ID:', currentUserId);

                if (currentUserId) {
                    const userTeam = teamsData.find((team: Team) => {
                        const isMember = team.members?.some((member: TeamMember) => {
                            const matches = member.id === currentUserId || member.userId === currentUserId;
                            if (matches) {
                                console.log('✓ Found user in team:', team.name, 'as', member.role);
                            }
                            return matches;
                        });
                        return isMember;
                    });

                    if (userTeam) {
                        console.log('✅ My Team set to:', userTeam.name);
                        setMyTeam(userTeam);
                    } else {
                        console.log('⚠️ User not found in any team');
                        setMyTeam(null);
                    }
                } else {
                    console.log('⚠️ No current user ID found');
                }

                setTeams(teamsData);
            } else {
                throw new Error(response.message || 'Failed to load teams');
            }
        } catch (err: any) {
            console.error('❌ Error loading teams:', err);
            setError(err.message || 'Failed to load teams');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadTeams();
    }, []);

    // Auto-select "My Team" filter if user has a team
    useEffect(() => {
        if (myTeam && !hasSetInitialFilter) {
            console.log('✓ User has a team, defaulting to My Team filter');
            setFilterOption('my-team');
            setHasSetInitialFilter(true);
        }
    }, [myTeam, hasSetInitialFilter]);

    // Filter and search teams
    const filteredTeams = useMemo(() => {
        let result = teams;

        // Apply team filter
        if (filterOption === 'my-team' && myTeam) {
            result = [myTeam];
        }

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (team) =>
                    team.name.toLowerCase().includes(query) ||
                    team.description?.toLowerCase().includes(query) ||
                    team.location?.toLowerCase().includes(query) ||
                    team.timezone?.toLowerCase().includes(query) ||
                    team.members?.some((m) =>
                        getFullName(m).toLowerCase().includes(query) ||
                        m.email.toLowerCase().includes(query)
                    )
            );
        }

        return result;
    }, [teams, myTeam, filterOption, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredTeams.length / teamsPerPage);
    const paginatedTeams = filteredTeams.slice(
        (currentPage - 1) * teamsPerPage,
        currentPage * teamsPerPage
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Helper functions
    const getFullName = (member: TeamMember): string => {
        if (member.displayName) return member.displayName;
        if (member.name) return member.name;
        if (member.firstName && member.lastName) {
            return `${member.firstName} ${member.lastName}`;
        }
        if (member.firstName) return member.firstName;
        if (member.lastName) return member.lastName;
        return member.email || 'Unknown';
    };

    const getInitials = (member: TeamMember): string => {
        if (member.firstName && member.lastName) {
            return (member.firstName[0] + member.lastName[0]).toUpperCase();
        }

        const name = member.displayName || member.name || member.firstName || member.lastName || member.email || '??';

        if (!name || typeof name !== 'string') return '??';

        return name
            .split(' ')
            .filter(n => n.length > 0)
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '??';
    };

    const getMemberRole = (member: TeamMember): string => {
        if (member.role?.toLowerCase() === 'primary') return 'Primary';
        if (member.role?.toLowerCase() === 'backup') return 'Backup';
        if (member.role?.toLowerCase() === 'escalation') return 'Escalation';
        if (member.role?.toLowerCase().includes('lead') || member.role?.toLowerCase().includes('manager')) {
            return 'Team Lead';
        }
        return member.role || 'Member';
    };

    const getRoleBadgeColor = (role: string) => {
        const roleLower = role?.toLowerCase() || '';
        if (roleLower === 'primary') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        if (roleLower === 'backup') return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
        if (roleLower === 'escalation') return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    };

    // Calculate stats
    const totalMembers = teams.reduce((sum, team) => sum + (team.members?.length || 0), 0);
    const onlineMembers = teams.reduce(
        (sum, team) => sum + (team.members?.filter((m) => m.is_online).length || 0),
        0
    );
    const primaryCount = teams.reduce(
        (sum, team) => sum + (team.members?.filter((m) => m.role?.toLowerCase() === 'primary').length || 0),
        0
    );

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-64 animate-pulse" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-96 animate-pulse" />
                    </div>
                    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-40 animate-pulse" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 h-32 border border-slate-200 dark:border-slate-700 animate-pulse" />
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 h-64 border border-slate-200 dark:border-slate-700 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <Card className="bg-white dark:bg-slate-800 border-red-500/50">
                <CardHeader>
                    <CardTitle className="text-red-600 dark:text-red-400">Error Loading Teams</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-gray-400">{error}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => loadTeams()} variant="outline" className="border-red-500 text-red-600 dark:text-red-400 hover:bg-red-500/10">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                        Teams
                    </h1>
                    <p className="text-slate-700 dark:text-slate-200 mt-2 text-lg">
                        Manage and view your organization's teams
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadTeams(true)}
                        disabled={isRefreshing}
                        className="text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                    <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
                        onClick={handleOpenCreateModal}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Team
                    </Button>
                </div>
            </motion.div>

            {/* Info Banner - Only show when My Team is selected */}
            {filterOption === 'my-team' && myTeam && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                >
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Shield className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                                    Viewing: {myTeam.name}
                                </p>
                                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                                    {myTeam.description || 'Your team'}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Search and Filters */}
            <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
            >
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-gray-400" />
                    <Input
                        placeholder="Search teams, members, or locations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={filterOption === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterOption('all')}
                        className={filterOption === 'all'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg'
                            : 'text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}
                    >
                        All Teams ({teams.length})
                    </Button>
                    <Button
                        variant={filterOption === 'my-team' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterOption('my-team')}
                        disabled={!myTeam}
                        className={filterOption === 'my-team'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg'
                            : 'text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50'}
                    >
                        <Users className="mr-1 h-3 w-3" />
                        My Team {myTeam ? '(1)' : ''}
                    </Button>
                </div>
            </motion.div>

            {/* Team Performance Summary */}
            <div className="grid gap-4 md:grid-cols-3">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                    <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-900 dark:text-white">Total Teams</CardTitle>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{teams.length}</div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Active teams</p>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                    <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-900 dark:text-white">Total Members</CardTitle>
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalMembers}</div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                {primaryCount} primary on-call
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                    <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-900 dark:text-white">Members Online</CardTitle>
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{onlineMembers}</div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                {totalMembers > 0 ? Math.round((onlineMembers / totalMembers) * 100) : 0}% online
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Teams Grid */}
            {paginatedTeams.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                >
                    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
                                <Users className="h-12 w-12 text-slate-400 dark:text-gray-400" />
                            </div>
                            <p className="text-lg font-medium text-slate-900 dark:text-white">
                                {filterOption === 'my-team' && !myTeam
                                    ? "You're not in a team yet"
                                    : 'No teams found'}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-gray-400 mt-2">
                                {filterOption === 'my-team' && !myTeam
                                    ? 'Ask an admin to add you to a team or view all teams'
                                    : searchQuery
                                        ? 'Try adjusting your search'
                                        : 'Create your first team to get started'}
                            </p>
                            {!searchQuery && filterOption !== 'my-team' && (
                                <Button
                                    className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                                    onClick={handleOpenCreateModal}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Your First Team
                                </Button>
                            )}
                            {filterOption === 'my-team' && !myTeam && (
                                <Button
                                    className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                                    onClick={() => setFilterOption('all')}
                                >
                                    <Users className="mr-2 h-4 w-4" />
                                    View All Teams
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <motion.div
                    className="grid gap-6 md:grid-cols-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                >
                    {paginatedTeams.map((team, index) => {
                        const teamMembers = team.members || [];
                        const onlineCount = teamMembers.filter((m) => m.is_online).length;
                        const primaryMember = teamMembers.find((m) => m.role?.toLowerCase() === 'primary');
                        const backupCount = teamMembers.filter((m) => m.role?.toLowerCase() === 'backup').length;
                        const escalationCount = teamMembers.filter((m) => m.role?.toLowerCase() === 'escalation').length;

                        return (
                            <motion.div
                                key={team.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                            >
                                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20 transition-all h-full">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1 flex-1">
                                                <CardTitle className="text-xl text-slate-900 dark:text-white">{team.name}</CardTitle>
                                                <CardDescription className="text-slate-600 dark:text-gray-400">
                                                    {team.description || 'No description'}
                                                </CardDescription>
                                            </div>
                                            <Badge
                                                variant={myTeam?.id === team.id ? 'default' : 'secondary'}
                                                className={myTeam?.id === team.id
                                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'}
                                            >
                                                {myTeam?.id === team.id ? 'My Team' : 'Team'}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Team Stats */}
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400">
                                                <Users className="h-4 w-4" />
                                                <span className="text-slate-900 dark:text-white font-medium">{teamMembers.length}</span>
                                                <span>members</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400">
                                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                                <span className="text-slate-900 dark:text-white font-medium">{onlineCount}</span>
                                                <span>online</span>
                                            </div>
                                        </div>

                                        {/* Role Distribution */}
                                        <div className="flex items-center gap-2 text-xs flex-wrap">
                                            {primaryMember && (
                                                <Badge variant="outline" className={getRoleBadgeColor('primary')}>
                                                    1 Primary
                                                </Badge>
                                            )}
                                            {backupCount > 0 && (
                                                <Badge variant="outline" className={getRoleBadgeColor('backup')}>
                                                    {backupCount} Backup
                                                </Badge>
                                            )}
                                            {escalationCount > 0 && (
                                                <Badge variant="outline" className={getRoleBadgeColor('escalation')}>
                                                    {escalationCount} Escalation
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Location and Timezone */}
                                        {(team.location || team.timezone) && (
                                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                                {team.location && (
                                                    <div className="flex items-center gap-1 text-slate-600 dark:text-gray-400">
                                                        <MapPin className="h-4 w-4" />
                                                        <span className="text-slate-900 dark:text-white">{team.location}</span>
                                                    </div>
                                                )}
                                                {team.timezone && (
                                                    <div className="flex items-center gap-1 text-slate-600 dark:text-gray-400">
                                                        <Clock className="h-4 w-4" />
                                                        <span className="text-slate-900 dark:text-white">{team.timezone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Primary On-Call Member */}
                                        {primaryMember && (
                                            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                <Shield className="h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <Avatar className="h-8 w-8 border-2 border-blue-500 flex-shrink-0">
                                                        <AvatarImage src={primaryMember.avatarUrl || primaryMember.avatar} alt={getFullName(primaryMember)} />
                                                        <AvatarFallback className="text-xs bg-blue-500 text-white">
                                                            {getInitials(primaryMember)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate text-slate-900 dark:text-white">
                                                            {getFullName(primaryMember)}
                                                        </p>
                                                        <p className="text-xs text-blue-600 dark:text-blue-400">Primary On-Call</p>
                                                    </div>
                                                    {primaryMember.is_online && (
                                                        <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Members Avatars */}
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">All Members</p>
                                            <div className="flex -space-x-2">
                                                {teamMembers.slice(0, 8).map((member, idx) => (
                                                    <Avatar
                                                        key={member?.id || member?.userId || idx}
                                                        className="h-10 w-10 border-2 border-white dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:z-10 transition-colors"
                                                        title={`${getFullName(member)} - ${getMemberRole(member)} - ${member?.is_online ? 'Online' : 'Offline'}`}
                                                    >
                                                        <AvatarImage src={member?.avatarUrl || member?.avatar} alt={getFullName(member)} />
                                                        <AvatarFallback className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white">
                                                            {getInitials(member)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                ))}
                                                {teamMembers.length > 8 && (
                                                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white hover:border-blue-500 dark:hover:border-blue-500 hover:z-10 transition-colors">
                                                        +{teamMembers.length - 8}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                onClick={() => handleViewDetails(team)}
                                            >
                                                <Users className="mr-2 h-4 w-4" />
                                                View Details
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <motion.div
                    className="flex items-center justify-center gap-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                        Previous
                    </Button>
                    <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={page === currentPage ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                                className={page === currentPage
                                    ? 'w-10 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                                    : 'w-10 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}
                            >
                                {page}
                            </Button>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                        Next
                    </Button>
                </motion.div>
            )}

            {/* Modals */}
            <CreateTeamModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                onTeamCreated={handleTeamCreated}
            />

            <TeamDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={handleCloseDetailsModal}
                team={selectedTeam}
                onTeamUpdated={handleTeamUpdated}
            />
        </div>
    );
};

export default TeamsPage;