import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Clock, 
  User, 
  Phone, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  UserCheck,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "../ui/dropdown-menu";

export function OnCallPage() {
  const [selectedTeam, setSelectedTeam] = useState<string>('Platform');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);

  // Teams data
  const teams = [
    { id: 'Platform', name: 'Platform Team', color: 'bg-blue-500' },
    { id: 'Infrastructure', name: 'Infrastructure Team', color: 'bg-green-500' },
    { id: 'Security', name: 'Security Team', color: 'bg-red-500' },
    { id: 'Database', name: 'Database Team', color: 'bg-purple-500' }
  ];

  // Team members
  const teamMembers = {
    Platform: [
      { id: 1, name: 'John Doe', role: 'Senior SRE', phone: '+1 (555) 123-4567' },
      { id: 2, name: 'Alice Johnson', role: 'Platform Engineer', phone: '+1 (555) 234-5678' },
      { id: 3, name: 'Bob Wilson', role: 'DevOps Engineer', phone: '+1 (555) 345-6789' }
    ],
    Infrastructure: [
      { id: 4, name: 'Jane Smith', role: 'Infrastructure Lead', phone: '+1 (555) 456-7890' },
      { id: 5, name: 'Mike Brown', role: 'Cloud Engineer', phone: '+1 (555) 567-8901' },
      { id: 6, name: 'Sarah Davis', role: 'Network Engineer', phone: '+1 (555) 678-9012' }
    ],
    Security: [
      { id: 7, name: 'David Chen', role: 'Security Engineer', phone: '+1 (555) 789-0123' },
      { id: 8, name: 'Lisa Park', role: 'Security Analyst', phone: '+1 (555) 890-1234' }
    ],
    Database: [
      { id: 9, name: 'Alex Rodriguez', role: 'DBA Lead', phone: '+1 (555) 901-2345' },
      { id: 10, name: 'Emily Taylor', role: 'Database Engineer', phone: '+1 (555) 012-3456' }
    ]
  };

  // On-call schedules (date -> team -> member assignments)
  const [onCallSchedules, setOnCallSchedules] = useState<any>({
    '2025-10-07_Platform': { primary: 1, secondary: 2, tertiary: 3 },
    '2025-10-08_Platform': { primary: 2, secondary: 3, tertiary: 1 },
    '2025-10-09_Platform': { primary: 3, secondary: 1, tertiary: 2 },
    '2025-10-07_Infrastructure': { primary: 4, secondary: 5, tertiary: 6 },
    '2025-10-08_Infrastructure': { primary: 5, secondary: 6, tertiary: 4 },
    '2025-10-07_Security': { primary: 7, secondary: 8 },
    '2025-10-07_Database': { primary: 9, secondary: 10 }
  });

  // Current on-call engineers (for today)
  const onCallSchedule = [
    {
      id: 1,
      name: "John Doe",
      role: "Senior SRE",
      team: "Platform",
      status: "active",
      shift: "Primary",
      startTime: "08:00",
      endTime: "20:00",
      phone: "+1 (555) 123-4567"
    },
    {
      id: 2,
      name: "Alice Johnson",
      role: "Platform Engineer", 
      team: "Platform",
      status: "standby",
      shift: "Secondary",
      startTime: "20:00",
      endTime: "08:00",
      phone: "+1 (555) 234-5678"
    },
    {
      id: 4,
      name: "Jane Smith",
      role: "Infrastructure Lead",
      team: "Infrastructure", 
      status: "active",
      shift: "Primary",
      startTime: "08:00",
      endTime: "20:00",
      phone: "+1 (555) 456-7890"
    }
  ];

  // Upcoming schedule
  const upcomingSchedule = [
    {
      date: "Tomorrow, Oct 8",
      primary: "Alice Johnson",
      secondary: "Bob Wilson", 
      tertiary: "John Doe"
    },
    {
      date: "Wed, Oct 9",
      primary: "Bob Wilson",
      secondary: "John Doe",
      tertiary: "Alice Johnson"
    },
    {
      date: "Thu, Oct 10", 
      primary: "John Doe",
      secondary: "Alice Johnson",
      tertiary: "Bob Wilson"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500 text-white";
      case "standby":
        return "bg-yellow-500 text-white";
      case "off":
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
          <h1 className="text-3xl font-bold text-white">On-Call Schedule</h1>
          <p className="text-slate-300 mt-1">Manage on-call rotations and escalations</p>
        </div>
        <div className="flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                <UserCheck className="h-4 w-4 mr-2" />
                {selectedTeam} Team
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-800 border-slate-600">
              {teams.map((team) => (
                <DropdownMenuItem 
                  key={team.id}
                  onClick={() => setSelectedTeam(team.id)}
                  className="text-white hover:bg-slate-700"
                >
                  <div className={`w-3 h-3 rounded-full ${team.color} mr-2`} />
                  {team.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            onClick={() => {
              // Just show team management, no calendar in modal anymore
              setSelectedDate(null);
              setIsEditMode(true);
            }}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Manage Team
          </Button>
        </div>
      </motion.div>

      {/* Current On-Call */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-green-400" />
              Current On-Call Engineers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {onCallSchedule.map((engineer, index) => (
                <motion.div
                  key={engineer.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between p-4 border border-slate-600 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`/placeholder-avatar-${engineer.id}.jpg`} alt={engineer.name} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
                        {engineer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-white">{engineer.name}</h3>
                        <Badge className={getStatusColor(engineer.status)}>
                          {engineer.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="border-slate-500 text-slate-300">
                          {engineer.shift}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-300">{engineer.role} • {engineer.team} Team</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {engineer.startTime} - {engineer.endTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {engineer.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-slate-600 text-white hover:bg-slate-700">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                    <Button variant="outline" size="sm" className="border-slate-600 text-white hover:bg-slate-700">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upcoming Schedule */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Calendar className="h-5 w-5 text-blue-400" />
              Upcoming Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingSchedule.map((day, index) => (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between p-4 border border-slate-600 rounded-lg hover:bg-slate-700/30 transition-colors"
                >
                  <div className="font-medium text-white">{day.date}</div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-green-400 text-green-300 bg-green-400/10">
                        Primary
                      </Badge>
                      <span className="text-white">{day.primary}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-yellow-400 text-yellow-300 bg-yellow-400/10">
                        Secondary
                      </Badge>
                      <span className="text-white">{day.secondary}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-blue-400 text-blue-300 bg-blue-400/10">
                        Tertiary
                      </Badge>
                      <span className="text-white">{day.tertiary}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Calendar Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                <Calendar className="h-5 w-5 text-blue-400" />
                Schedule Calendar - {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setMonth(currentDate.getMonth() - 1);
                    setCurrentDate(newDate);
                  }}
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setMonth(currentDate.getMonth() + 1);
                    setCurrentDate(newDate);
                  }}
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {/* Days of week */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center p-3 text-sm font-medium text-slate-400 border-b border-slate-600">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {Array.from({ length: 35 }, (_, i) => {
                const day = i - 6; // Start from day -6 to show previous month days
                const isCurrentMonth = day > 0 && day <= 31;
                const isToday = day === 7;
                const hasSchedule = isCurrentMonth && [7, 8, 9, 10].includes(day);
                
                return (
                  <motion.div
                    key={i}
                    whileHover={{ scale: isCurrentMonth ? 1.02 : 1 }}
                    whileTap={{ scale: isCurrentMonth ? 0.98 : 1 }}
                    className={`
                      min-h-[80px] border rounded-lg cursor-pointer transition-all p-2 relative
                      ${isCurrentMonth 
                        ? 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50' 
                        : 'border-slate-700 text-slate-600 cursor-not-allowed'
                      }
                      ${isToday ? 'ring-2 ring-orange-500 bg-orange-500/10' : ''}
                      ${hasSchedule ? 'bg-blue-500/10 border-blue-400' : ''}
                    `}
                    onClick={() => {
                      if (isCurrentMonth) {
                        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        setSelectedDate(newDate);
                        setIsEditMode(true);
                      }
                    }}
                  >
                    <div className={`text-sm font-medium mb-2 ${isCurrentMonth ? 'text-white' : 'text-slate-600'}`}>
                      {isCurrentMonth ? day : ''}
                    </div>
                    {hasSchedule && isCurrentMonth && (
                      <div className="space-y-1">
                        <div className="text-xs bg-green-400/20 text-green-300 px-1 py-0.5 rounded truncate">
                          P: {teamMembers[selectedTeam as keyof typeof teamMembers]?.[0]?.name.split(' ')[0]}
                        </div>
                        <div className="text-xs bg-yellow-400/20 text-yellow-300 px-1 py-0.5 rounded truncate">
                          S: {teamMembers[selectedTeam as keyof typeof teamMembers]?.[1]?.name.split(' ')[0]}
                        </div>
                        <div className="text-xs bg-blue-400/20 text-blue-300 px-1 py-0.5 rounded truncate">
                          T: {teamMembers[selectedTeam as keyof typeof teamMembers]?.[2]?.name.split(' ')[0]}
                        </div>
                      </div>
                    )}
                    {isCurrentMonth && !hasSchedule && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Plus className="h-4 w-4 text-slate-400" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
            <div className="text-sm text-slate-400 space-y-1">
              <p>• Click on any date to manage on-call assignments</p>
              <p>• P = Primary, S = Secondary, T = Tertiary on-call</p>
              <p>• Colored backgrounds indicate existing schedules</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <Button className="w-full border-slate-600 text-white hover:bg-slate-700" variant="outline">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Override Schedule
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <Button className="w-full border-slate-600 text-white hover:bg-slate-700" variant="outline">
              <UserCheck className="h-4 w-4 mr-2" />
              Request Coverage
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <Button className="w-full border-slate-600 text-white hover:bg-slate-700" variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Escalate Incident
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Edit Schedule Modal */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsEditMode(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-600">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedDate ? `Schedule for ${selectedDate.toLocaleDateString()}` : 'Manage Team'}
                  </h2>
                  <p className="text-slate-300 mt-1">
                    {selectedDate ? 'Assign on-call engineers for this date' : `Manage assignments for ${selectedTeam} Team`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditMode(false);
                    setSelectedDate(null);
                  }}
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {selectedDate ? (
                  /* Date-specific CRUD operations */
                  <div>
                    {/* Team Selector for Date Assignment */}
                    <div className="mb-6">
                      <Label className="text-white font-medium mb-3 block">Team</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full max-w-sm justify-between border-slate-600 text-white hover:bg-slate-700">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${teams.find(t => t.id === selectedTeam)?.color}`} />
                              {teams.find(t => t.id === selectedTeam)?.name}
                            </div>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-800 border-slate-600 w-64">
                          {teams.map((team) => (
                            <DropdownMenuItem 
                              key={team.id}
                              onClick={() => setSelectedTeam(team.id)}
                              className="text-white hover:bg-slate-700"
                            >
                              <div className={`w-3 h-3 rounded-full ${team.color} mr-3`} />
                              {team.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Assignment Form */}
                    <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
                      <h4 className="text-lg font-semibold text-white mb-4">On-Call Assignments</h4>
                      
                      <div className="space-y-4">
                        {['Primary', 'Secondary', 'Tertiary'].map((role, index) => (
                          <div key={role} className="space-y-2">
                            <Label className="text-white font-medium flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                index === 0 ? 'bg-green-500' : 
                                index === 1 ? 'bg-yellow-500' : 'bg-blue-500'
                              }`}></div>
                              {role} On-Call
                            </Label>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between border-slate-600 text-white hover:bg-slate-700">
                                  Select Engineer
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-slate-800 border-slate-600 w-full">
                                {teamMembers[selectedTeam as keyof typeof teamMembers]?.map((member) => (
                                  <DropdownMenuItem 
                                    key={member.id}
                                    className="text-white hover:bg-slate-700"
                                  >
                                    <div className="flex items-center gap-3 w-full">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback className={`bg-gradient-to-r ${
                                          index === 0 ? 'from-green-500 to-green-600' :
                                          index === 1 ? 'from-yellow-500 to-yellow-600' :
                                          'from-blue-500 to-blue-600'
                                        } text-white text-xs`}>
                                          {member.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium">{member.name}</div>
                                        <div className="text-xs text-slate-400">{member.role}</div>
                                      </div>
                                    </div>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3 mt-6">
                        <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
                          <Save className="h-4 w-4 mr-2" />
                          Save Assignment
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-red-500 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Schedule
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSelectedDate(null);
                            setIsEditMode(false);
                          }}
                          className="border-slate-600 text-white hover:bg-slate-700 hover:text-white ml-auto"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Team Management */
                  <div>
                    {/* Team Selector */}
                    <div className="mb-6">
                      <Label className="text-white font-medium mb-3 block">Select Team</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full max-w-sm justify-between border-slate-600 text-white hover:bg-slate-700">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${teams.find(t => t.id === selectedTeam)?.color}`} />
                              {teams.find(t => t.id === selectedTeam)?.name}
                            </div>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-800 border-slate-600 w-64">
                          {teams.map((team) => (
                            <DropdownMenuItem 
                              key={team.id}
                              onClick={() => setSelectedTeam(team.id)}
                              className="text-white hover:bg-slate-700"
                            >
                              <div className={`w-3 h-3 rounded-full ${team.color} mr-3`} />
                              {team.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )}

                {/* Action Buttons for Team Management */}
                {!selectedDate && (
                  <div className="flex gap-3 mt-8 pt-6 border-t border-slate-600">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditMode(false)}
                      className="border-slate-600 text-white hover:bg-slate-700 hover:text-white ml-auto"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
