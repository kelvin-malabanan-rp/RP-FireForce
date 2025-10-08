import { useState } from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Clock, 
  Phone, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit,
  Save,
  X,
  UserCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Label } from "../ui/label";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "../ui/dropdown-menu";

// Type definitions
interface TeamMember {
  id: number;
  name: string;
  role: string;
  phone: string;
}

interface Schedule {
  primary: number | null;
  secondary: number | null;
  tertiary?: number | null;
}

interface EditingSchedule extends Schedule {
  date: Date;
  team: string;
}

type TeamMembers = {
  [key: string]: TeamMember[];
};

type OnCallSchedules = {
  [key: string]: Schedule;
};

export function OnCallPage() {
  const [selectedTeam, setSelectedTeam] = useState<string>('Platform');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<EditingSchedule | null>(null);

  // Teams data
  const teams = [
    { id: 'Platform', name: 'Platform Team', color: 'bg-blue-500' },
    { id: 'Infrastructure', name: 'Infrastructure Team', color: 'bg-green-500' },
    { id: 'Security', name: 'Security Team', color: 'bg-red-500' },
    { id: 'Database', name: 'Database Team', color: 'bg-purple-500' }
  ];

  // Team members
  const teamMembers: TeamMembers = {
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
  const [onCallSchedules, setOnCallSchedules] = useState<OnCallSchedules>({
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

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    
    // Get existing schedule for this date and team
    const dateKey = formatDateKey(clickedDate);
    const scheduleKey = `${dateKey}_${selectedTeam}`;
    const existingSchedule = onCallSchedules[scheduleKey];
    
    setEditingSchedule({
      date: clickedDate,
      team: selectedTeam,
      primary: existingSchedule?.primary || null,
      secondary: existingSchedule?.secondary || null,
      tertiary: existingSchedule?.tertiary || null
    });
    
    setIsEditMode(true);
  };

  const saveSchedule = () => {
    if (editingSchedule && selectedDate) {
      const dateKey = formatDateKey(selectedDate);
      const scheduleKey = `${dateKey}_${selectedTeam}`;
      
      setOnCallSchedules((prev: OnCallSchedules) => ({
        ...prev,
        [scheduleKey]: {
          primary: editingSchedule.primary,
          secondary: editingSchedule.secondary,
          tertiary: editingSchedule.tertiary
        }
      }));
    }
    
    setIsEditMode(false);
    setSelectedDate(null);
    setEditingSchedule(null);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: React.ReactElement[] = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-20"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = formatDateKey(date);
      const scheduleKey = `${dateKey}_${selectedTeam}`;
      const hasSchedule = onCallSchedules[scheduleKey];
      const isToday = new Date().toDateString() === date.toDateString();
      
      days.push(
        <motion.div
          key={day}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`h-20 border border-slate-600 cursor-pointer relative ${
            isToday ? 'bg-blue-600/20 border-blue-500' : 'hover:bg-slate-700/50'
          }`}
          onClick={() => handleDateClick(day)}
        >
          <div className="p-2 h-full flex flex-col">
            <span className={`text-sm font-medium ${isToday ? 'text-blue-400' : 'text-white'}`}>
              {day}
            </span>
            {hasSchedule && (
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-xs text-green-400">
                  P: {teamMembers[selectedTeam]?.find((m: TeamMember) => m.id === hasSchedule.primary)?.name.split(' ')[0]}
                </div>
                {hasSchedule.secondary && (
                  <div className="text-xs text-yellow-400">
                    S: {teamMembers[selectedTeam]?.find((m: TeamMember) => m.id === hasSchedule.secondary)?.name.split(' ')[0]}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      );
    }
    
    return days;
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
        </div>
      </motion.div>

      {/* Current On-Call Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5" />
              Current On-Call Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {onCallSchedule.map((member) => (
                <motion.div
                  key={member.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={getStatusColor(member.status)}>
                      {member.shift}
                    </Badge>
                    <Badge variant="outline" className="text-slate-300 border-slate-600">
                      {member.team}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-slate-600 text-white">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-white">{member.name}</h4>
                      <p className="text-sm text-slate-400">{member.role}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="h-4 w-4" />
                      {member.startTime} - {member.endTime}
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="h-4 w-4" />
                      {member.phone}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Calendar View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                <Calendar className="h-5 w-5" />
                Schedule Calendar - {selectedTeam} Team
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  className="text-white hover:bg-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-white font-medium">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  className="text-white hover:bg-slate-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="h-10 flex items-center justify-center">
                  <span className="text-sm font-medium text-slate-400">{day}</span>
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upcoming Schedule */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Clock className="h-5 w-5" />
              Upcoming Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingSchedule.map((schedule, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.01 }}
                  className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white mb-2">{schedule.date}</h4>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-slate-300">Primary: </span>
                          <span className="text-white">{schedule.primary}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-slate-300">Secondary: </span>
                          <span className="text-white">{schedule.secondary}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-slate-300">Tertiary: </span>
                          <span className="text-white">{schedule.tertiary}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-slate-600"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Schedule Modal */}
      <AnimatePresence>
        {isEditMode && selectedDate && editingSchedule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setIsEditMode(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-800 rounded-xl p-6 border border-slate-600 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  Edit Schedule - {selectedDate.toLocaleDateString()}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditMode(false)}
                  className="text-white hover:bg-slate-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-white">Primary On-Call</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-start border-slate-600 text-white hover:bg-slate-700">
                        {editingSchedule.primary 
                          ? teamMembers[selectedTeam]?.find((m: TeamMember) => m.id === editingSchedule.primary)?.name
                          : "Select member"
                        }
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-800 border-slate-600">
                      {teamMembers[selectedTeam]?.map((member: TeamMember) => (
                        <DropdownMenuItem 
                          key={member.id}
                          onClick={() => setEditingSchedule({...editingSchedule, primary: member.id})}
                          className="text-white hover:bg-slate-700"
                        >
                          {member.name} - {member.role}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div>
                  <Label className="text-white">Secondary On-Call</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-start border-slate-600 text-white hover:bg-slate-700">
                        {editingSchedule.secondary 
                          ? teamMembers[selectedTeam]?.find((m: TeamMember) => m.id === editingSchedule.secondary)?.name
                          : "Select member"
                        }
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-800 border-slate-600">
                      {teamMembers[selectedTeam]?.map((member: TeamMember) => (
                        <DropdownMenuItem 
                          key={member.id}
                          onClick={() => setEditingSchedule({...editingSchedule, secondary: member.id})}
                          className="text-white hover:bg-slate-700"
                        >
                          {member.name} - {member.role}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div>
                  <Label className="text-white">Tertiary On-Call</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-start border-slate-600 text-white hover:bg-slate-700">
                        {editingSchedule.tertiary 
                          ? teamMembers[selectedTeam]?.find((m: TeamMember) => m.id === editingSchedule.tertiary)?.name
                          : "Select member"
                        }
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-800 border-slate-600">
                      {teamMembers[selectedTeam]?.map((member: TeamMember) => (
                        <DropdownMenuItem 
                          key={member.id}
                          onClick={() => setEditingSchedule({...editingSchedule, tertiary: member.id})}
                          className="text-white hover:bg-slate-700"
                        >
                          {member.name} - {member.role}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={saveSchedule}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Schedule
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditMode(false)}
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
