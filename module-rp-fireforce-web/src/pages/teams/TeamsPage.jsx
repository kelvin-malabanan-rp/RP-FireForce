import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Award, 
  Search, 
  Filter, 
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Clock,
  Shield,
  Star,
  Calendar,
  Activity,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Settings,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Timer,
  Target,
  TrendingUp
} from 'lucide-react';

const TeamsPage = () => {
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  // Mock team data
  const teams = [
    { id: 'all', name: 'All Teams', count: 42, color: 'gray' },
    { id: 'backend', name: 'Backend Engineering', count: 12, color: 'blue' },
    { id: 'frontend', name: 'Frontend Engineering', count: 8, color: 'green' },
    { id: 'devops', name: 'DevOps & Infrastructure', count: 10, color: 'purple' },
    { id: 'mobile', name: 'Mobile Development', count: 6, color: 'orange' },
    { id: 'qa', name: 'Quality Assurance', count: 6, color: 'red' }
  ];

  const teamMembers = [
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
      lastActive: '5 min ago'
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

  const teamStats = [
    {
      title: 'Total Members',
      value: '42',
      change: '+3',
      trend: 'up',
      icon: Users,
      description: 'Active team members'
    },
    {
      title: 'On-Call Now',
      value: '8',
      change: '2',
      trend: 'stable',
      icon: Shield,
      description: 'Currently on-call'
    },
    {
      title: 'Avg Response Time',
      value: '3.6m',
      change: '-0.4m',
      trend: 'down',
      icon: Timer,
      description: 'Team average'
    },
    {
      title: 'Team Performance',
      value: '92%',
      change: '+2%',
      trend: 'up',
      icon: Target,
      description: 'Overall rating'
    }
  ];

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

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = selectedTeam === 'all' || member.team === teams.find(t => t.id === selectedTeam)?.name;
    return matchesSearch && matchesTeam;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 space-y-4 lg:space-y-0">
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
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          
          <select 
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
          
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 mr-2 text-gray-600" />
            Filter
          </button>
          
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </button>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {teamStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  stat.trend === 'up' ? 'bg-green-100 text-green-800' : 
                  stat.trend === 'down' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : stat.trend === 'down' ? (
                    <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
                  ) : (
                    <Activity className="w-3 h-3 mr-1" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Team Members Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{filteredMembers.length} members</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <div key={member.id} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">{member.avatar}</span>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(member.status)} rounded-full border-2 border-white`}></div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {member.isOnCall && (
                      <div className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        On-Call
                      </div>
                    )}
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {member.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {member.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {member.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    Last active: {member.lastActive}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <div className="text-gray-600">Alerts Handled</div>
                      <div className="font-bold text-gray-900">{member.alertsHandled}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Avg Response</div>
                      <div className="font-bold text-gray-900">{member.avgResponseTime}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">Performance</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(member.performance)}`}>
                      {member.performance}%
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {member.specialties.map((specialty, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {specialty}
                      </span>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      <Mail className="w-4 h-4 mr-1" />
                      Contact
                    </button>
                    <button className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamsPage;
