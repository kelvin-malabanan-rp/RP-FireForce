import React, { useState, useEffect } from 'react';
import TeamStatsSection from './TeamStatsSection';
import TeamFilters from './TeamFilters';
import TeamMembersGrid from './TeamMembersGrid';
import { LoadingState, ErrorMessage } from './LoadingAndError';

const TeamsPage = () => {
  // State management
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  
  // API state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamsData, setTeamsData] = useState([]);
  const [membersData, setMembersData] = useState([]);
  const [statsData, setStatsData] = useState([]);

  // API Configuration
  const API_BASE_URL = 'https://incident-webhook-api.rapidresponse.workers.dev';

  // Fetch team data using OnCall teams endpoint
  const fetchTeams = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/oncall/teams`);
      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.status}`);
      }
      const data = await response.json();
      
      // Handle the actual API response structure: { "success": true, "object": [...] }
      const teams = data.object || data.response_data?.data || data.data || [];
      
      // Calculate total member count across all teams
      const totalMembers = teams.reduce((sum, team) => sum + (team.members?.length || 0), 0);
      
      // Transform OnCall teams to match our team structure
      const transformedTeams = Array.isArray(teams) ? [
        { id: 'all', name: 'All Teams', count: totalMembers, color: 'gray' },
        ...teams.map(team => ({
          id: team.id,
          name: team.name,
          count: team.members?.length || 0,
          color: 'blue',
          timezone: team.timezone
        }))
      ] : mockTeams;
      
      setTeamsData(transformedTeams);
    } catch (err) {
      console.error('Error fetching teams:', err);
      // Use mock data as fallback
      setTeamsData(mockTeams);
    }
  };

  // Fetch team members from OnCall teams API
  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/oncall/teams`);
      if (!response.ok) {
        throw new Error(`Failed to fetch team members: ${response.status}`);
      }
      const data = await response.json();
      
      // Handle the actual API response structure: { "success": true, "object": [...] }
      const teams = data.object || data.response_data?.data || data.data || [];
      
      // Transform OnCall team members to our member structure
      const allMembers = [];
      if (Array.isArray(teams)) {
        teams.forEach(team => {
          if (team.members && Array.isArray(team.members)) {
            team.members.forEach(member => {
              allMembers.push({
                id: member.id,
                name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown User',
                role: member.role === 'primary' ? 'Primary Engineer' : 
                      member.role === 'backup' ? 'Backup Engineer' : 
                      'Team Member',
                team: team.name,
                email: member.email,
                phone: member.phoneNumber,
                location: `${team.timezone}` || 'Unknown',
                status: 'online', // Default status - could be enhanced with real presence data
                avatar: `${member.firstName?.charAt(0) || ''}${member.lastName?.charAt(0) || ''}` || 'U',
                joinDate: '2023-01-01', // Could be enhanced with real join date
                alertsHandled: Math.floor(Math.random() * 200) + 50, // Mock data - could be from real metrics
                avgResponseTime: `${(Math.random() * 3 + 2).toFixed(1)} min`, // Mock data
                performance: Math.floor(Math.random() * 20) + 80, // Mock data
                specialties: ['Emergency Response', 'System Administration'], // Could be enhanced
                isOnCall: member.role === 'primary', // Primary members are considered on-call
                lastActive: '2 min ago', // Mock data
                isTeamLead: member.role === 'primary' // Primary members are considered team leads
              });
            });
          }
        });
      }
      
      setMembersData(allMembers.length > 0 ? allMembers : mockTeamMembers);
    } catch (err) {
      console.error('Error fetching team members:', err);
      // Use mock data as fallback
      setMembersData(mockTeamMembers);
    }
  };

  // Calculate team statistics from API data
  const calculateTeamStats = async () => {
    try {
      // Get fresh team data for accurate stats
      const response = await fetch(`${API_BASE_URL}/api/oncall/teams`);
      if (!response.ok) {
        throw new Error(`Failed to fetch team data for stats: ${response.status}`);
      }
      const data = await response.json();
      const teams = data.object || data.response_data?.data || data.data || [];
      
      // Calculate real statistics from API data
      const totalTeams = teams.length;
      const totalMembers = teams.reduce((sum, team) => sum + (team.members?.length || 0), 0);
      const primaryCount = teams.reduce((sum, team) => 
        sum + (team.members?.filter(member => member.role === 'primary').length || 0), 0
      );
      const backupCount = teams.reduce((sum, team) => 
        sum + (team.members?.filter(member => member.role === 'backup').length || 0), 0
      );
      
      const calculatedStats = [
        {
          title: 'Total Members',
          value: totalMembers.toString(),
          change: totalMembers > 0 ? `+${Math.floor(totalMembers * 0.1)}` : '0',
          trend: 'up',
          icon: 'Users',
          description: 'Active team members'
        },
        {
          title: 'Primary On-Call',
          value: primaryCount.toString(),
          change: primaryCount.toString(),
          trend: 'stable',
          icon: 'Shield',
          description: 'Primary responders'
        },
        {
          title: 'Backup Support',
          value: backupCount.toString(),
          change: backupCount.toString(),
          trend: 'stable',
          icon: 'Timer',
          description: 'Backup responders'
        },
        {
          title: 'Active Teams',
          value: totalTeams.toString(),
          change: totalTeams > 0 ? `${totalTeams}` : '0',
          trend: 'up',
          icon: 'Target',
          description: 'Response teams'
        }
      ];
      
      setStatsData(calculatedStats);
    } catch (err) {
      console.error('Error calculating team stats:', err);
      // Use mock data as fallback
      setStatsData(mockTeamStats);
    }
  };

  // Load all data
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchTeams(),
        fetchTeamMembers(),
        calculateTeamStats()
      ]);
    } catch (err) {
      setError(err.message || 'Failed to load team data');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    loadData();
  }, []);

  // Mock data as fallback
  const mockTeams = [
    { id: 'all', name: 'All Teams', count: 42, color: 'gray' },
    { id: 'backend', name: 'Backend Engineering', count: 12, color: 'blue' },
    { id: 'frontend', name: 'Frontend Engineering', count: 8, color: 'green' },
    { id: 'devops', name: 'DevOps & Infrastructure', count: 10, color: 'purple' },
    { id: 'mobile', name: 'Mobile Development', count: 6, color: 'orange' },
    { id: 'qa', name: 'Quality Assurance', count: 6, color: 'red' }
  ];

  const mockTeamMembers = [
    {
      id: 1,
      name: 'Sarah Chen',
      role: 'Senior Backend Engineer',
      team: 'Backend Engineering',
      email: 'sarah.chen@company.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      status: 'online',
      avatar: 'SC',
      joinDate: '2023-01-15',
      alertsHandled: 156,
      avgResponseTime: '3.2 min',
      performance: 94,
      specialties: ['Node.js', 'MongoDB', 'AWS'],
      isOnCall: true,
      lastActive: '2 min ago'
    },
    {
      id: 2,
      name: 'Mike Rodriguez', 
      role: 'DevOps Lead',
      team: 'DevOps & Infrastructure',
      email: 'mike.rodriguez@company.com',
      phone: '+1 (555) 987-6543',
      location: 'Austin, TX',
      status: 'online',
      avatar: 'MR',
      joinDate: '2022-08-22',
      alertsHandled: 203,
      avgResponseTime: '2.8 min',
      performance: 96,
      specialties: ['Kubernetes', 'Docker', 'Terraform'],
      isOnCall: false,
      lastActive: '5 min ago',
      isTeamLead: true
    },
    {
      id: 3,
      name: 'Emma Watson',
      role: 'Frontend Developer',
      team: 'Frontend Engineering',
      email: 'emma.watson@company.com',
      phone: '+1 (555) 456-7890',
      location: 'New York, NY',
      status: 'away',
      avatar: 'EW',
      joinDate: '2023-03-10',
      alertsHandled: 89,
      avgResponseTime: '4.1 min',
      performance: 91,
      specialties: ['React', 'TypeScript', 'Tailwind'],
      isOnCall: true,
      lastActive: '1 hour ago'
    },
    {
      id: 4,
      name: 'Alex Kumar',
      role: 'Mobile Developer',
      team: 'Mobile Development',
      email: 'alex.kumar@company.com',
      phone: '+1 (555) 234-5678',
      location: 'Seattle, WA',
      status: 'offline',
      avatar: 'AK',
      joinDate: '2022-11-05',
      alertsHandled: 134,
      avgResponseTime: '3.7 min',
      performance: 88,
      specialties: ['React Native', 'Swift', 'Kotlin'],
      isOnCall: false,
      lastActive: '3 hours ago'
    },
    {
      id: 5,
      name: 'Lisa Zhang',
      role: 'QA Engineer',
      team: 'Quality Assurance',
      email: 'lisa.zhang@company.com',
      phone: '+1 (555) 345-6789',
      location: 'Los Angeles, CA',
      status: 'online',
      avatar: 'LZ',
      joinDate: '2023-05-20',
      alertsHandled: 67,
      avgResponseTime: '5.2 min',
      performance: 93,
      specialties: ['Selenium', 'Jest', 'Cypress'],
      isOnCall: false,
      lastActive: '10 min ago'
    },
    {
      id: 6,
      name: 'David Park',
      role: 'Backend Engineer',
      team: 'Backend Engineering',
      email: 'david.park@company.com',
      phone: '+1 (555) 567-8901',
      location: 'Denver, CO',
      status: 'online',
      avatar: 'DP',
      joinDate: '2022-12-15',
      alertsHandled: 145,
      avgResponseTime: '3.9 min',
      performance: 90,
      specialties: ['Python', 'PostgreSQL', 'Redis'],
      isOnCall: true,
      lastActive: '1 min ago'
    }
  ];

  const mockTeamStats = [
    {
      title: 'Total Members',
      value: '42',
      change: '+3',
      trend: 'up',
      icon: 'Users',
      description: 'Active team members'
    },
    {
      title: 'On-Call Now',
      value: '8',
      change: '2',
      trend: 'stable',
      icon: 'Shield',
      description: 'Currently on-call'
    },
    {
      title: 'Avg Response Time',
      value: '3.6m',
      change: '-0.4m',
      trend: 'down',
      icon: 'Timer',
      description: 'Team average'
    },
    {
      title: 'Team Performance',
      value: '92%',
      change: '+2%',
      trend: 'up',
      icon: 'Target',
      description: 'Overall rating'
    }
  ];

  // Filter members based on search and team selection
  const filteredMembers = membersData.filter(member => {
    const matchesSearch = member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = selectedTeam === 'all' || member.team === teamsData.find(t => t.id === selectedTeam)?.name;
    return matchesSearch && matchesTeam;
  });

  // Event handlers
  const handleAddMember = () => {
    console.log('Add member clicked');
    // TODO: Implement add member modal
  };

  const handleExport = () => {
    console.log('Export clicked');
    // TODO: Implement export functionality
  };

  const handleImport = () => {
    console.log('Import clicked');
    // TODO: Implement import functionality
  };

  const handleEditMember = (member) => {
    console.log('Edit member:', member);
    // TODO: Implement edit member modal
  };

  const handleDeleteMember = (member) => {
    console.log('Delete member:', member);
    // TODO: Implement delete confirmation
  };

  const handleContactMember = (member) => {
    console.log('Contact member:', member);
    // TODO: Implement contact functionality (email/slack)
  };

  const handleToggleOnCall = (member) => {
    console.log('Toggle on-call for:', member);
    // TODO: Implement on-call toggle API call
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <LoadingState message="Loading team data..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <ErrorMessage error={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header and Filters */}
      <TeamFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedTeam={selectedTeam}
        setSelectedTeam={setSelectedTeam}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        viewMode={viewMode}
        setViewMode={setViewMode}
        teams={teamsData}
        roles={[]} // TODO: Add roles API
        onAddMember={handleAddMember}
        onExport={handleExport}
        onImport={handleImport}
        memberCount={filteredMembers.length}
      />

      {/* Team Statistics */}
      <TeamStatsSection 
        stats={statsData}
        isLoading={false}
      />

      {/* Team Members Grid */}
      <TeamMembersGrid
        members={filteredMembers}
        isLoading={false}
        error={null}
        viewMode={viewMode}
        onEditMember={handleEditMember}
        onDeleteMember={handleDeleteMember}
        onContactMember={handleContactMember}
        onToggleOnCall={handleToggleOnCall}
        emptyStateMessage={
          searchTerm || selectedTeam !== 'all' 
            ? 'No members match your current filters' 
            : 'No team members found'
        }
      />
    </div>
  );
};

export default TeamsPage;
