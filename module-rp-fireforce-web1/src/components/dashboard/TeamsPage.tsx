import { motion } from "framer-motion";
import { Users, Plus, Search, UserPlus, Settings, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useState } from "react";

export function TeamsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const teamsPerPage = 4;

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
    },
    {
      id: 5,
      name: "Security & Compliance",
      description: "Information security and compliance",
      members: 3,
      lead: "Jennifer Lee",
      status: "active",
      incidentsThisWeek: 1,
      avgResponseTime: "1.5m",
      members_list: [
        { name: "Jennifer Lee", role: "Tech Lead" },
        { name: "Robert Taylor", role: "Security Engineer" },
        { name: "Michelle Adams", role: "Compliance Specialist" }
      ],
      color: "bg-red-500"
    },
    {
      id: 6,
      name: "DevOps & Infrastructure",
      description: "CI/CD and cloud infrastructure",
      members: 7,
      lead: "Daniel Kim",
      status: "active",
      incidentsThisWeek: 4,
      avgResponseTime: "2.8m",
      members_list: [
        { name: "Daniel Kim", role: "Tech Lead" },
        { name: "Jessica Brown", role: "DevOps Engineer" },
        { name: "Mark Wilson", role: "Cloud Architect" },
        { name: "Amanda Davis", role: "Infrastructure Engineer" }
      ],
      color: "bg-teal-500"
    },
    {
      id: 7,
      name: "Quality Assurance",
      description: "Testing and quality assurance",
      members: 5,
      lead: "Brian Miller",
      status: "active",
      incidentsThisWeek: 0,
      avgResponseTime: "3.5m",
      members_list: [
        { name: "Brian Miller", role: "QA Lead" },
        { name: "Sarah Connor", role: "Senior QA Engineer" },
        { name: "Tim Cook", role: "Automation Engineer" },
        { name: "Lisa Anderson", role: "QA Engineer" }
      ],
      color: "bg-indigo-500"
    },
    {
      id: 8,
      name: "Product Management",
      description: "Product strategy and management",
      members: 4,
      lead: "Carol White",
      status: "active",
      incidentsThisWeek: 0,
      avgResponseTime: "5.2m",
      members_list: [
        { name: "Carol White", role: "Product Manager" },
        { name: "Steve Jobs", role: "Senior PM" },
        { name: "Grace Hopper", role: "Technical PM" },
        { name: "Ada Lovelace", role: "Product Analyst" }
      ],
      color: "bg-pink-500"
    }
  ];

  // Filter teams based on search and selected filter
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedTeamFilter === "all" || 
                         (selectedTeamFilter === "active" && team.status === "active") ||
                         (selectedTeamFilter === "high-incidents" && team.incidentsThisWeek > 2) ||
                         (selectedTeamFilter === "low-incidents" && team.incidentsThisWeek <= 1);
    
    return matchesSearch && matchesFilter;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTeams.length / teamsPerPage);
  const startIndex = (currentPage - 1) * teamsPerPage;
  const endIndex = startIndex + teamsPerPage;
  const currentTeams = filteredTeams.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const teamFilterOptions = [
    { value: "all", label: "All Teams" },
    { value: "active", label: "Active Teams" },
    { value: "high-incidents", label: "High Incidents (3+)" },
    { value: "low-incidents", label: "Low Incidents (≤1)" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Teams</h1>
          <p className="text-white/80 mt-1">Manage teams and their incident response</p>
        </div>
        <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
          <Input
            type="search"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-orange-500 focus:ring-orange-500"
          />
        </div>
        
        {/* Team Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
              {teamFilterOptions.find(option => option.value === selectedTeamFilter)?.label}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
            {teamFilterOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => {
                  setSelectedTeamFilter(option.value);
                  setCurrentPage(1); // Reset to first page when filter changes
                }}
                className="text-white hover:bg-slate-700 focus:bg-slate-700 cursor-pointer"
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {currentTeams.map((team, index) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-xl transition-all duration-300 border border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${team.color}`} />
                    <div>
                      <CardTitle className="text-lg text-white font-semibold">{team.name}</CardTitle>
                      <p className="text-sm text-white/80 mt-1">{team.description}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-600 text-white border-0">
                    {team.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Team Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-white">{team.members}</p>
                      <p className="text-xs text-white/70">Members</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{team.incidentsThisWeek}</p>
                      <p className="text-xs text-white/70">Incidents</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{team.avgResponseTime}</p>
                      <p className="text-xs text-white/70">Avg Response</p>
                    </div>
                  </div>

                  {/* Team Lead */}
                  <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/20">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`/placeholder-avatar-${team.id}.jpg`} alt={team.lead} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs">
                        {team.lead.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-white">{team.lead}</p>
                      <p className="text-xs text-white/70">Team Lead</p>
                    </div>
                  </div>

                  {/* Team Members Preview */}
                  <div>
                    <p className="text-sm font-medium text-white mb-2">Team Members</p>
                    <div className="flex -space-x-2">
                      {team.members_list.slice(0, 4).map((member, idx) => (
                        <Avatar key={idx} className="h-8 w-8 border-2 border-white/20">
                          <AvatarImage src={`/placeholder-avatar-${idx}.jpg`} alt={member.name} />
                          <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {team.members > 4 && (
                        <div className="h-8 w-8 rounded-full bg-white/20 border-2 border-white/20 flex items-center justify-center text-xs font-medium text-white">
                          +{team.members - 4}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 border-white/30 text-white hover:bg-white/20 hover:text-white">
                      <Users className="h-4 w-4 mr-2" />
                      View Team
                    </Button>
                    <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/20 hover:text-white">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/20 hover:text-white">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="border-white/30 text-white hover:bg-white/20 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className={
                  currentPage === page
                    ? "bg-gradient-to-r from-orange-500 to-red-600 text-white border-0"
                    : "border-white/30 text-white hover:bg-white/20 hover:text-white"
                }
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
            className="border-white/30 text-white hover:bg-white/20 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Results Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <p className="text-white/70 text-sm">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredTeams.length)} of {filteredTeams.length} teams
          {searchTerm && ` matching "${searchTerm}"`}
        </p>
      </motion.div>

      {/* Team Performance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-white/5 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Team Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{teams.length}</p>
                <p className="text-sm text-white/70">Active Teams</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {teams.reduce((sum, team) => sum + team.members, 0)}
                </p>
                <p className="text-sm text-white/70">Total Engineers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {teams.reduce((sum, team) => sum + team.incidentsThisWeek, 0)}
                </p>
                <p className="text-sm text-white/70">Incidents This Week</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">2.3m</p>
                <p className="text-sm text-white/70">Avg Response Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
