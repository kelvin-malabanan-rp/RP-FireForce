import { useState, useEffect } from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Loader2,
  RefreshCw,
  User,
  AlertCircle,
  Mail,
  Plus,
  Users,
  Info,
  CheckCircle,
  X,
  Edit
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "../ui/dropdown-menu";
import { 
  onCallService, 
  Team, 
  Assignment, 
  TeamMember,
  UpdateSchedulePayload
} from "../../services/on-call-service";

export function OnCallPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [calendarData, setCalendarData] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  
  const [daysToShow] = useState(30);

  // Edit mode state - ALL ROLES
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState({
    scheduleName: '',
    primaryUser: '',
    backupUser: '',
    escalationUsers: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('📅 Loading calendar data...');
      
      const calendarResponse = await onCallService.getCalendarData(daysToShow);
      
      if (!calendarResponse.success || !calendarResponse.data) {
        throw new Error('Failed to load calendar data');
      }

      console.log('✅ Calendar data loaded:', calendarResponse.data);
      
      // Force state update to trigger re-render
      setCalendarData([...calendarResponse.data]);
      setTeams([...calendarResponse.data]);

    } catch (error: any) {
      console.error('❌ Error loading on-call data:', error);
      setError(error.message || 'Failed to load on-call data');
    } finally {
      setIsLoading(false);
    }
  };

  const getTeamMembers = (teamId: string): TeamMember[] => {
    const membersMap = new Map<string, TeamMember>();
    
    const team = calendarData.find(t => t.teamId === teamId);
    team?.members?.forEach(member => {
      membersMap.set(member.id, member);
    });
    
    team?.schedule?.forEach(day => {
      if (day.assignment) {
        const assignedMembers = [
          day.assignment.primary,
          day.assignment.backup,
          ...(day.assignment.escalation || [])
        ].filter(Boolean) as TeamMember[];
        
        assignedMembers.forEach(person => {
          if (!membersMap.has(person.id)) {
            membersMap.set(person.id, person);
          }
        });
      }
    });
    
    return Array.from(membersMap.values()).sort((a, b) => 
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    );
  };

  const getTeamColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
    return colors[index % colors.length];
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleCellClick = (day: number, dateKey: string) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setSelectedTeamId(null);
    
    setIsDetailModalOpen(true);
    setIsEditMode(false);
  };

  const closeModals = () => {
    setIsDetailModalOpen(false);
    setIsEditMode(false);
    setSelectedDate(null);
    setSelectedTeamId(null);
    setSelectedAssignment(null);
    setEditData({
      scheduleName: '',
      primaryUser: '',
      backupUser: '',
      escalationUsers: []
    });
  };

  const handleUpdateFromModal = async () => {
    if (!selectedTeamId || !selectedDate) {
      setModalMessage('Missing required information');
      setIsErrorModalOpen(true);
      return;
    }

    if (!editData.primaryUser && !editData.backupUser && editData.escalationUsers.length === 0) {
      setModalMessage('Please assign at least one person');
      setIsErrorModalOpen(true);
      return;
    }

    try {
      const team = calendarData.find(t => t.teamId === selectedTeamId);

      if (!team) {
        throw new Error('Team not found');
      }

      let scheduleId: string | null = null;
      for (const day of team.schedule) {
        if (day.assignment?.scheduleId) {
          scheduleId = day.assignment.scheduleId;
          break;
        }
      }

      if (!scheduleId) {
        throw new Error('Schedule ID not found for this team.');
      }

      const dateKey = formatDateKey(selectedDate);
      
      const assignments = [];
      
      if (editData.primaryUser) {
        assignments.push({
          userId: editData.primaryUser,
          role: 'primary' as const,
          dates: [dateKey]
        });
      }
      
      if (editData.backupUser) {
        assignments.push({
          userId: editData.backupUser,
          role: 'backup' as const,
          dates: [dateKey]
        });
      }
      
      if (editData.escalationUsers.length > 0) {
        editData.escalationUsers.forEach(userId => {
          assignments.push({
            userId: userId,
            role: 'escalation' as const,
            dates: [dateKey]
          });
        });
      }

      const payload: UpdateSchedulePayload = {
        scheduleId: scheduleId,
        teamId: selectedTeamId,
        name: editData.scheduleName || undefined,
        assignments: assignments
      };

      console.log('📝 Updating schedule with all roles:', payload);

      const result = await onCallService.updateSchedule(payload);

      if (result.success) {
        setModalMessage('Schedule updated successfully!');
        setIsSuccessModalOpen(true);
        closeModals();
        await loadData();
      } else {
        throw new Error(result.message || 'Failed to update schedule');
      }
    } catch (error: any) {
      console.error('❌ Error updating schedule:', error);
      setModalMessage(error.message || 'Failed to update schedule');
      setIsErrorModalOpen(true);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: React.ReactElement[] = [];
    
    // IMPORTANT: Filter teams based on selection for calendar display
    const teamsToDisplay = selectedTeam === 'all' 
      ? teams 
      : teams.filter(t => t.teamId === selectedTeam);
    
    console.log('📊 Rendering calendar for teams:', teamsToDisplay.map(t => t.teamName));
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = formatDateKey(date);
      const isToday = new Date().toDateString() === date.toDateString();
      
      // Get assignments ONLY from filtered teams
      const dayAssignments = teamsToDisplay.map(team => {
        const daySchedule = team.schedule.find(s => s.date === dateKey);
        return {
          team,
          assignment: daySchedule?.assignment || null
        };
      }).filter(item => item.assignment !== null);
      
      const hasAnyAssignment = dayAssignments.length > 0;
      
      days.push(
        <motion.div
          key={`${day}-${selectedTeam}`}
          whileHover={{ scale: 1.03, zIndex: 10 }}
          whileTap={{ scale: 0.98 }}
          className={`h-32 border-2 cursor-pointer relative overflow-hidden transition-all rounded-lg ${
            isToday 
              ? 'bg-gradient-to-br from-blue-600/30 to-purple-600/30 border-blue-500 shadow-lg' 
              : hasAnyAssignment
              ? 'bg-slate-700/30 border-slate-600 hover:border-purple-500 hover:bg-slate-700/50'
              : 'bg-slate-800/20 border-slate-700 hover:border-slate-600 hover:bg-slate-700/30'
          }`}
          onClick={() => handleCellClick(day, dateKey)}
        >
          <div className="absolute top-2 left-2">
            <span className={`text-sm font-bold ${
              isToday ? 'text-blue-400' : hasAnyAssignment ? 'text-white' : 'text-slate-500'
            }`}>
              {day}
            </span>
          </div>

          {hasAnyAssignment ? (
            <div className="absolute inset-0 p-2 pt-8 flex flex-col gap-1 overflow-hidden">
              {dayAssignments.slice(0, 3).map((item, idx) => {
                const teamIndex = teams.findIndex(t => t.teamId === item.team.teamId);
                const teamColor = getTeamColor(teamIndex);
                const primaryName = item.assignment?.primary?.firstName || 'N/A';
                
                return (
                  <div 
                    key={`${item.team.teamId}-${idx}`}
                    className="flex items-center gap-1.5 bg-slate-600/40 border border-slate-500/40 rounded px-2 py-1"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${teamColor}`}></div>
                    <span className="text-xs text-slate-200 truncate font-medium">
                      {selectedTeam === 'all' ? `${item.team.teamName.split(' ')[0]}: ` : ''}{primaryName}
                    </span>
                  </div>
                );
              })}
              {dayAssignments.length > 3 && (
                <div className="flex items-center justify-center">
                  <span className="text-xs text-slate-400 font-medium">
                    +{dayAssignments.length - 3} more
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Plus className="h-5 w-5 text-slate-600" />
            </div>
          )}
        </motion.div>
      );
    }
    
    return days;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
        <p className="text-slate-400">Loading on-call schedules...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-white text-xl mb-2">Error Loading Data</p>
        <p className="text-slate-400 mb-4">{error}</p>
        <Button onClick={loadData} className="bg-purple-600 hover:bg-purple-700">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="space-y-6 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">On-Call Schedule</h1>
              <p className="text-slate-300 mt-1">View and manage on-call rotations for all teams</p>
            </div>
          </div>
          <div className="flex gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                  <UserCheck className="h-4 w-4 mr-2" />
                  {selectedTeam === 'all' 
                    ? 'All Teams' 
                    : teams.find(t => t.teamId === selectedTeam)?.teamName || 'Select Team'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-600">
                <DropdownMenuItem 
                  onClick={() => setSelectedTeam('all')}
                  className="text-white hover:bg-slate-700"
                >
                  <Users className="h-4 w-4 mr-2" />
                  All Teams
                </DropdownMenuItem>
                {teams.map((team, index) => (
                  <DropdownMenuItem 
                    key={team.teamId}
                    onClick={() => setSelectedTeam(team.teamId)}
                    className="text-white hover:bg-slate-700"
                  >
                    <div className={`w-3 h-3 rounded-full ${getTeamColor(index)} mr-2`} />
                    {team.teamName}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={loadData}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Current On-Call Today */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5" />
                Current On-Call Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team, idx) => {
                  const today = new Date().toISOString().split('T')[0];
                  const todayAssignment = team.schedule.find(day => day.date === today)?.assignment;
                  
                  if (selectedTeam !== 'all' && team.teamId !== selectedTeam) {
                    return null;
                  }
                  
                  return (
                    <motion.div
                      key={team.teamId}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                      className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-3 h-3 rounded-full ${getTeamColor(idx)}`} />
                        <h4 className="font-semibold text-white">{team.teamName}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">{team.timezone}</p>
                      
                      {todayAssignment ? (
                        <div className="space-y-2">
                          {todayAssignment.primary && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
                              <Badge className="bg-green-500 text-white text-xs mb-1">Primary</Badge>
                              <p className="text-sm text-white font-medium">
                                {todayAssignment.primary.firstName} {todayAssignment.primary.lastName}
                              </p>
                              <p className="text-xs text-slate-400">{todayAssignment.primary.email}</p>
                            </div>
                          )}
                          
                          {todayAssignment.backup && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                              <Badge className="bg-yellow-500 text-white text-xs mb-1">Backup</Badge>
                              <p className="text-sm text-white font-medium">
                                {todayAssignment.backup.firstName} {todayAssignment.backup.lastName}
                              </p>
                              <p className="text-xs text-slate-400">{todayAssignment.backup.email}</p>
                            </div>
                          )}
                          
                          {todayAssignment.escalation && todayAssignment.escalation.length > 0 && (
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
                              <Badge className="bg-blue-500 text-white text-xs mb-1">Escalation</Badge>
                              {todayAssignment.escalation.map((person, pidx) => (
                                <p key={pidx} className="text-sm text-white font-medium">
                                  {person.firstName} {person.lastName}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-slate-500">No assignment today</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Calendar View */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Calendar className="h-5 w-5" />
                  {selectedTeam === 'all' ? 'All Teams Schedule Calendar' : `${teams.find(t => t.teamId === selectedTeam)?.teamName} Schedule`}
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
                  <span className="text-white font-medium min-w-[150px] text-center">
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
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                  <div key={day} className="h-10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-slate-400">{day}</span>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {renderCalendar()}
              </div>
              
              <div className="mt-6 flex items-center justify-center gap-6 text-sm border-t border-slate-700 pt-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="text-slate-400">Primary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <span className="text-slate-400">Backup</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  <span className="text-slate-400">Escalation</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detail Modal - All Teams for Selected Date */}
        <AnimatePresence>
          {isDetailModalOpen && selectedDate && !isEditMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={closeModals}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      On-Call Assignments for All Teams
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeModals}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {(() => {
                    const dateKey = formatDateKey(selectedDate);
                    const teamsToShow = selectedTeam === 'all' ? teams : teams.filter(t => t.teamId === selectedTeam);
                    
                    return teamsToShow.map((team, idx) => {
                      const daySchedule = team.schedule.find(s => s.date === dateKey);
                      const assignment = daySchedule?.assignment;
                      
                      return (
                        <div key={team.teamId} className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full ${getTeamColor(teams.indexOf(team))}`} />
                              <div>
                                <h4 className="text-lg font-semibold text-white">{team.teamName}</h4>
                                <p className="text-xs text-slate-400">{team.timezone}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedTeamId(team.teamId);
                                setSelectedAssignment(assignment || null);
                                
                                if (assignment) {
                                  setEditData({
                                    scheduleName: '',
                                    primaryUser: assignment.primary?.id || '',
                                    backupUser: assignment.backup?.id || '',
                                    escalationUsers: assignment.escalation?.map(e => e.id) || []
                                  });
                                } else {
                                  setEditData({
                                    scheduleName: '',
                                    primaryUser: '',
                                    backupUser: '',
                                    escalationUsers: []
                                  });
                                }
                                
                                setIsEditMode(true);
                              }}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </div>

                          {assignment ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {assignment.primary && (
                                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                                  <Badge className="bg-green-500 text-white text-xs mb-2">Primary</Badge>
                                  <div className="flex items-start gap-2">
                                    <Avatar className="h-8 w-8 border-2 border-green-500/50 flex-shrink-0">
                                      <AvatarFallback className="bg-green-600 text-white text-xs font-semibold">
                                        {assignment.primary.firstName?.[0]}{assignment.primary.lastName?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm text-white font-semibold truncate">
                                        {assignment.primary.firstName} {assignment.primary.lastName}
                                      </p>
                                      <p className="text-xs text-slate-400 truncate" title={assignment.primary.email}>
                                        {assignment.primary.email}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {assignment.backup && (
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                                  <Badge className="bg-yellow-500 text-white text-xs mb-2">Backup</Badge>
                                  <div className="flex items-start gap-2">
                                    <Avatar className="h-8 w-8 border-2 border-yellow-500/50 flex-shrink-0">
                                      <AvatarFallback className="bg-yellow-600 text-white text-xs font-semibold">
                                        {assignment.backup.firstName?.[0]}{assignment.backup.lastName?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm text-white font-semibold truncate">
                                        {assignment.backup.firstName} {assignment.backup.lastName}
                                      </p>
                                      <p className="text-xs text-slate-400 truncate" title={assignment.backup.email}>
                                        {assignment.backup.email}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {assignment.escalation && assignment.escalation.length > 0 && (
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                                  <Badge className="bg-blue-500 text-white text-xs mb-2">Escalation</Badge>
                                  {assignment.escalation.map((person, pidx) => (
                                    <div key={pidx} className="flex items-start gap-2 mb-2 last:mb-0">
                                      <Avatar className="h-8 w-8 border-2 border-blue-500/50 flex-shrink-0">
                                        <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">
                                          {person.firstName?.[0]}{person.lastName?.[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm text-white font-semibold truncate">
                                          {person.firstName} {person.lastName}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate" title={person.email}>
                                          {person.email}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-sm text-slate-500">No assignment for this date</p>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Modal - Edit All Roles */}
        <AnimatePresence>
          {isEditMode && selectedDate && selectedTeamId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setIsEditMode(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {selectedAssignment ? 'Edit Assignment' : 'Create Assignment'}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {teams.find(t => t.teamId === selectedTeamId)?.teamName} - {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditMode(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label className="text-white mb-2 block">Schedule Name (Optional)</Label>
                    <Input
                      value={editData.scheduleName}
                      onChange={(e) => setEditData({ ...editData, scheduleName: e.target.value })}
                      placeholder="e.g., Holiday Coverage Schedule"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  {/* Primary User */}
                  <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                    <Label className="text-white mb-2 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      Primary On-Call
                    </Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-start bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                          {editData.primaryUser && getTeamMembers(selectedTeamId).find(m => m.id === editData.primaryUser)
                            ? `${getTeamMembers(selectedTeamId).find(m => m.id === editData.primaryUser)!.firstName} ${getTeamMembers(selectedTeamId).find(m => m.id === editData.primaryUser)!.lastName}`
                            : "Select primary (optional)"
                          }
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-600 max-h-60 overflow-y-auto">
                        <DropdownMenuItem 
                          onClick={() => setEditData({...editData, primaryUser: ''})}
                          className="text-white hover:bg-slate-700"
                        >
                          <X className="h-3 w-3 mr-2" />
                          Clear Primary
                        </DropdownMenuItem>
                        {getTeamMembers(selectedTeamId).map((member) => (
                          <DropdownMenuItem 
                            key={member.id}
                            onClick={() => setEditData({...editData, primaryUser: member.id})}
                            className="text-white hover:bg-slate-700"
                          >
                            {member.firstName} {member.lastName}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Backup User */}
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                    <Label className="text-white mb-2 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      Backup On-Call
                    </Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-start bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                          {editData.backupUser && getTeamMembers(selectedTeamId).find(m => m.id === editData.backupUser)
                            ? `${getTeamMembers(selectedTeamId).find(m => m.id === editData.backupUser)!.firstName} ${getTeamMembers(selectedTeamId).find(m => m.id === editData.backupUser)!.lastName}`
                            : "Select backup (optional)"
                          }
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-600 max-h-60 overflow-y-auto">
                        <DropdownMenuItem 
                          onClick={() => setEditData({...editData, backupUser: ''})}
                          className="text-white hover:bg-slate-700"
                        >
                          <X className="h-3 w-3 mr-2" />
                          Clear Backup
                        </DropdownMenuItem>
                        {getTeamMembers(selectedTeamId).map((member) => (
                          <DropdownMenuItem 
                            key={member.id}
                            onClick={() => setEditData({...editData, backupUser: member.id})}
                            className="text-white hover:bg-slate-700"
                          >
                            {member.firstName} {member.lastName}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Escalation Users */}
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                    <Label className="text-white mb-2 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      Escalation Contact(s)
                    </Label>
                    
                    {editData.escalationUsers.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {editData.escalationUsers.map((userId) => {
                          const member = getTeamMembers(selectedTeamId).find(m => m.id === userId);
                          return member ? (
                            <div key={userId} className="flex items-center justify-between bg-slate-700/50 border border-slate-600 rounded p-2">
                              <span className="text-sm text-white">
                                {member.firstName} {member.lastName}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditData({
                                  ...editData,
                                  escalationUsers: editData.escalationUsers.filter(id => id !== userId)
                                })}
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-start bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                          <Plus className="h-3 w-3 mr-2" />
                          Add Escalation Contact
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-600 max-h-60 overflow-y-auto">
                        {getTeamMembers(selectedTeamId)
                          .filter(member => !editData.escalationUsers.includes(member.id))
                          .map((member) => (
                            <DropdownMenuItem 
                              key={member.id}
                              onClick={() => setEditData({
                                ...editData,
                                escalationUsers: [...editData.escalationUsers, member.id]
                              })}
                              className="text-white hover:bg-slate-700"
                            >
                              {member.firstName} {member.lastName}
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-300">
                        Update all roles for this date in one go. Leave any role empty to remove that assignment.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsEditMode(false)}
                      variant="outline"
                      className="flex-1 border-slate-600 text-white hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpdateFromModal}
                      disabled={!editData.primaryUser && !editData.backupUser && editData.escalationUsers.length === 0}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save All Changes
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Modal */}
        <AnimatePresence>
          {isSuccessModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setIsSuccessModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-gradient-to-br from-green-800 to-green-900 rounded-2xl p-6 border border-green-700 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col items-center text-center">
                  <CheckCircle className="h-16 w-16 text-green-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Success!</h3>
                  <p className="text-green-200 mb-6">{modalMessage}</p>
                  <Button
                    onClick={() => setIsSuccessModalOpen(false)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Modal */}
        <AnimatePresence>
          {isErrorModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setIsErrorModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-gradient-to-br from-red-800 to-red-900 rounded-2xl p-6 border border-red-700 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col items-center text-center">
                  <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Error</h3>
                  <p className="text-red-200 mb-6">{modalMessage}</p>
                  <Button
                    onClick={() => setIsErrorModalOpen(false)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default OnCallPage;