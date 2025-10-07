import { motion } from "framer-motion";
import { Users, Plus, Search, UserPlus, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export function TeamsPage() {
  const teams = [
    {
      id: 1,
      name: "Platform Engineering",
      description: "Infrastructure and platform services",
      members: 8,
      lead: "John Doe",
      status: "active",
      incidentsThisWeek: 3,
      avgResponseTime: "2.1m",
      members_list: [
        { name: "John Doe", role: "Tech Lead" },
        { name: "Jane Smith", role: "Senior SRE" },
        { name: "Mike Johnson", role: "DevOps Engineer" },
        { name: "Sarah Wilson", role: "Platform Engineer" }
      ],
      color: "bg-blue-500"
    },
    {
      id: 2,
      name: "API Services",
      description: "Backend APIs and microservices",
      members: 6,
      lead: "Alex Rodriguez",
      status: "active",
      incidentsThisWeek: 1,
      avgResponseTime: "1.8m",
      members_list: [
        { name: "Alex Rodriguez", role: "Tech Lead" },
        { name: "Emily Davis", role: "Senior Backend Engineer" },
        { name: "Tom Wilson", role: "Backend Engineer" },
        { name: "Lisa Chen", role: "API Specialist" }
      ],
      color: "bg-green-500"
    },
    {
      id: 3,
      name: "Frontend & Mobile",
      description: "Web and mobile application development",
      members: 5,
      lead: "Maria Garcia",
      status: "active",
      incidentsThisWeek: 0,
      avgResponseTime: "3.2m",
      members_list: [
        { name: "Maria Garcia", role: "Tech Lead" },
        { name: "David Brown", role: "Senior Frontend Engineer" },
        { name: "Rachel Kim", role: "Mobile Engineer" },
        { name: "James Liu", role: "UI/UX Engineer" }
      ],
      color: "bg-purple-500"
    },
    {
      id: 4,
      name: "Data & Analytics",
      description: "Data infrastructure and analytics",
      members: 4,
      lead: "Chris Johnson",
      status: "active",
      incidentsThisWeek: 2,
      avgResponseTime: "4.1m",
      members_list: [
        { name: "Chris Johnson", role: "Tech Lead" },
        { name: "Anna Martinez", role: "Data Engineer" },
        { name: "Kevin Wong", role: "Analytics Engineer" },
        { name: "Sophie Turner", role: "Data Scientist" }
      ],
      color: "bg-orange-500"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500 text-white";
      case "inactive":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Teams</h1>
          <p className="text-slate-600 dark:text-slate-200 mt-1">Manage teams and their incident response</p>
        </div>
        <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-md"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="search"
            placeholder="Search teams..."
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map((team, index) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow border border-slate-200 dark:border-white/20">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${team.color}`} />
                    <div>
                      <CardTitle className="text-lg text-slate-900 dark:text-white">{team.name}</CardTitle>
                      <p className="text-sm text-slate-600 dark:text-slate-200 mt-1">{team.description}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(team.status)}>
                    {team.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Team Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{team.members}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">Members</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{team.incidentsThisWeek}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">Incidents</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{team.avgResponseTime}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">Avg Response</p>
                    </div>
                  </div>

                  {/* Team Lead */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`/placeholder-avatar-${team.id}.jpg`} alt={team.lead} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs">
                        {team.lead.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{team.lead}</p>
                      <p className="text-xs text-gray-600">Team Lead</p>
                    </div>
                  </div>

                  {/* Team Members Preview */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Team Members</p>
                    <div className="flex -space-x-2">
                      {team.members_list.slice(0, 4).map((member, idx) => (
                        <Avatar key={idx} className="h-8 w-8 border-2 border-white">
                          <AvatarImage src={`/placeholder-avatar-${idx}.jpg`} alt={member.name} />
                          <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {team.members > 4 && (
                        <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                          +{team.members - 4}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Users className="h-4 w-4 mr-2" />
                      View Team
                    </Button>
                    <Button variant="outline" size="sm">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Team Performance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Team Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
                <p className="text-sm text-gray-600">Active Teams</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {teams.reduce((sum, team) => sum + team.members, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Engineers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {teams.reduce((sum, team) => sum + team.incidentsThisWeek, 0)}
                </p>
                <p className="text-sm text-gray-600">Incidents This Week</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">2.3m</p>
                <p className="text-sm text-gray-600">Avg Response Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
