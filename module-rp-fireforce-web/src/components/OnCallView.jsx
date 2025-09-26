import React, { useState } from 'react';
import { 
  Shield, 
  Users, 
  Clock, 
  Phone, 
  Mail,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  UserCheck,
  UserPlus,
  RotateCcw,
  Settings,
  Edit,
  MoreVertical
} from 'lucide-react';

const OnCallView = () => {
  const [expandedTeam, setExpandedTeam] = useState('platform');

  // Mock on-call data
  const onCallSchedules = [
    {
      id: 'platform',
      name: 'Platform Engineering',
      description: 'Infrastructure and core services',
      currentOnCall: {
        primary: {
          name: 'Sarah Chen',
          avatar: '👩‍💻',
          phone: '+1 (555) 123-4567',
          email: 'sarah.chen@company.com',
          location: 'San Francisco, CA',
          since: '2024-01-15T09:00:00Z',
          until: '2024-01-22T09:00:00Z'
        },
        secondary: {
          name: 'Mike Rodriguez',
          avatar: '👨‍💻', 
          phone: '+1 (555) 234-5678',
          email: 'mike.rodriguez@company.com',
          location: 'Austin, TX',
          since: '2024-01-15T09:00:00Z',
          until: '2024-01-22T09:00:00Z'
        }
      },
      escalationPolicy: [
        { level: 1, duration: '5 min', action: 'Primary on-call' },
        { level: 2, duration: '10 min', action: 'Secondary on-call' },
        { level: 3, duration: '15 min', action: 'Team lead' },
        { level: 4, duration: '30 min', action: 'Engineering manager' }
      ],
      stats: {
        alertsThisWeek: 23,
        avgResponseTime: '4.2m',
        escalationRate: '12%'
      }
    },
    {
      id: 'frontend',
      name: 'Frontend Team',
      description: 'Web application and user interface',
      currentOnCall: {
        primary: {
          name: 'Alex Kim',
          avatar: '👨‍🎨',
          phone: '+1 (555) 345-6789',
          email: 'alex.kim@company.com',
          location: 'Seattle, WA',
          since: '2024-01-15T09:00:00Z',
          until: '2024-01-22T09:00:00Z'
        },
        secondary: {
          name: 'Lisa Wang',
          avatar: '👩‍🎨',
          phone: '+1 (555) 456-7890',
          email: 'lisa.wang@company.com',
          location: 'Portland, OR',
          since: '2024-01-15T09:00:00Z',
          until: '2024-01-22T09:00:00Z'
        }
      },
      escalationPolicy: [
        { level: 1, duration: '10 min', action: 'Primary on-call' },
        { level: 2, duration: '20 min', action: 'Secondary on-call' },
        { level: 3, duration: '30 min', action: 'Team lead' }
      ],
      stats: {
        alertsThisWeek: 8,
        avgResponseTime: '6.1m',
        escalationRate: '8%'
      }
    },
    {
      id: 'backend',
      name: 'Backend Services',
      description: 'APIs and microservices',
      currentOnCall: {
        primary: {
          name: 'David Park',
          avatar: '👨‍💼',
          phone: '+1 (555) 567-8901',
          email: 'david.park@company.com',
          location: 'New York, NY',
          since: '2024-01-15T09:00:00Z',
          until: '2024-01-22T09:00:00Z'
        },
        secondary: {
          name: 'Emma Thompson',
          avatar: '👩‍💼',
          phone: '+1 (555) 678-9012',
          email: 'emma.thompson@company.com',
          location: 'Boston, MA',
          since: '2024-01-15T09:00:00Z',
          until: '2024-01-22T09:00:00Z'
        }
      },
      escalationPolicy: [
        { level: 1, duration: '3 min', action: 'Primary on-call' },
        { level: 2, duration: '8 min', action: 'Secondary on-call' },
        { level: 3, duration: '15 min', action: 'Team lead' },
        { level: 4, duration: '25 min', action: 'Engineering director' }
      ],
      stats: {
        alertsThisWeek: 31,
        avgResponseTime: '3.8m',
        escalationRate: '15%'
      }
    }
  ];

  const upcomingRotations = [
    { team: 'Platform Engineering', person: 'Mike Rodriguez', starts: '2024-01-22T09:00:00Z' },
    { team: 'Frontend Team', person: 'Lisa Wang', starts: '2024-01-22T09:00:00Z' },
    { team: 'Backend Services', person: 'Emma Thompson', starts: '2024-01-22T09:00:00Z' }
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const OnCallPersonCard = ({ person, role, teamName }) => (
    <div className="bg-surface-50 rounded-lg p-4 border border-surface-200">
      <div className="flex items-start space-x-3">
        <div className="text-3xl">{person.avatar}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-semibold text-surface-900">{person.name}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              role === 'primary' 
                ? 'bg-success-100 text-success-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {role === 'primary' ? 'Primary' : 'Secondary'}
            </span>
          </div>
          <div className="space-y-1 text-sm text-surface-600">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>{person.phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>{person.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>{person.location}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>On call until {formatDate(person.until)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 mt-3">
            <button className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-primary-700 transition-colors">
              Contact
            </button>
            <button className="border border-surface-300 text-surface-700 px-3 py-1.5 rounded-lg text-sm hover:bg-surface-50 transition-colors">
              Override
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-surface-900">On-Call Management</h1>
          <p className="text-surface-600 mt-1">Current on-call personnel and escalation policies</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="border border-surface-300 text-surface-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-50 transition-colors flex items-center space-x-2">
            <RotateCcw className="w-4 h-4" />
            <span>Manual Override</span>
          </button>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>Add Schedule</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-surface-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-surface-500 text-sm font-medium">Active On-Call</p>
              <p className="text-3xl font-bold text-surface-900 mt-2">6</p>
              <p className="text-sm text-surface-600 mt-1">Across 3 teams</p>
            </div>
            <div className="p-3 bg-success-50 text-success-600 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-surface-500 text-sm font-medium">Avg Response Time</p>
              <p className="text-3xl font-bold text-surface-900 mt-2">4.7m</p>
              <p className="text-sm text-success-600 mt-1">-12% vs last week</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-surface-500 text-sm font-medium">Escalations</p>
              <p className="text-3xl font-bold text-surface-900 mt-2">11.7%</p>
              <p className="text-sm text-yellow-600 mt-1">+2.3% vs last week</p>
            </div>
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-surface-500 text-sm font-medium">Coverage</p>
              <p className="text-3xl font-bold text-surface-900 mt-2">100%</p>
              <p className="text-sm text-success-600 mt-1">All teams covered</p>
            </div>
            <div className="p-3 bg-success-50 text-success-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* On-Call Teams */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-surface-900">Current On-Call Teams</h2>
        {onCallSchedules.map((team) => (
          <div key={team.id} className="bg-white rounded-xl border border-surface-200 overflow-hidden">
            <div 
              className="p-6 cursor-pointer hover:bg-surface-50 transition-colors"
              onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {expandedTeam === team.id ? (
                      <ChevronDown className="w-5 h-5 text-surface-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-surface-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-surface-900">{team.name}</h3>
                    <p className="text-surface-600 text-sm">{team.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-surface-900">{team.stats.alertsThisWeek}</div>
                    <div className="text-surface-500">Alerts</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-surface-900">{team.stats.avgResponseTime}</div>
                    <div className="text-surface-500">Avg Response</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-surface-900">{team.stats.escalationRate}</div>
                    <div className="text-surface-500">Escalation Rate</div>
                  </div>
                  <button className="p-2 hover:bg-surface-100 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-surface-400" />
                  </button>
                </div>
              </div>
            </div>

            {expandedTeam === team.id && (
              <div className="border-t border-surface-200 p-6 bg-surface-50">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Current On-Call */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-surface-900 flex items-center space-x-2">
                      <Users className="w-5 h-5" />
                      <span>Current On-Call</span>
                    </h4>
                    <OnCallPersonCard 
                      person={team.currentOnCall.primary} 
                      role="primary"
                      teamName={team.name}
                    />
                    <OnCallPersonCard 
                      person={team.currentOnCall.secondary} 
                      role="secondary"
                      teamName={team.name}
                    />
                  </div>

                  {/* Escalation Policy */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-surface-900 flex items-center space-x-2">
                      <Settings className="w-5 h-5" />
                      <span>Escalation Policy</span>
                    </h4>
                    <div className="space-y-3">
                      {team.escalationPolicy.map((policy, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-surface-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-medium text-sm">
                              {policy.level}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-surface-900">{policy.action}</div>
                              <div className="text-sm text-surface-600">After {policy.duration}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Upcoming Rotations */}
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <h3 className="text-xl font-semibold text-surface-900 mb-4 flex items-center space-x-2">
          <Calendar className="w-6 h-6" />
          <span>Upcoming Rotations</span>
        </h3>
        <div className="space-y-3">
          {upcomingRotations.map((rotation, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-surface-50 rounded-lg">
              <div>
                <div className="font-medium text-surface-900">{rotation.team}</div>
                <div className="text-sm text-surface-600">{rotation.person} takes over</div>
              </div>
              <div className="text-sm font-medium text-surface-700">
                {formatDate(rotation.starts)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnCallView;
