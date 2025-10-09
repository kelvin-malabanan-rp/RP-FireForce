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
  Settings,
  Plus,
  Users,
  Info,
  CheckCircle,
  X
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
  CurrentOnCallResponse,
  ScheduleConfigResponse,
  SimpleTeam,
  TeamMember
} from "../../services/oncallService";

interface OverrideData {
  teamId: string;
  startDate: string;
  endDate: string;
  userId: string;
  role: 'primary' | 'backup' | 'escalation';
  reason: string;
  originalUserId: string;
}

export function OnCallPage() {
  const [teams, setTeams] = useState<SimpleTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [currentOnCallByTeam, setCurrentOnCallByTeam] = useState<Assignment | null>(null);
  const [calendarData, setCalendarData] = useState<Team[]>([]);
  const [currentOnCallAll, setCurrentOnCallAll] = useState<CurrentOnCallResponse | null>(null);
  const [showAllTeams, setShowAllTeams] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  
  const [overrideData, setOverrideData] = useState<OverrideData>({
    teamId: '',
    startDate: '',
    endDate: '',
    userId: '',
    role: 'primary',
    reason: '',
    originalUserId: ''
  });
  
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfigResponse | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      loadCurrentOnCallByTeam(selectedTeam);
      loadScheduleConfig(selectedTeam);
    }
  }, [selectedTeam]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Get all teams
      const teamsResponse = await onCallService.getAllTeams();
      if (teamsResponse.success && teamsResponse.object) {
        setTeams(teamsResponse.object);
        
        if (teamsResponse.object.length > 0 && !selectedTeam) {
          setSelectedTeam(teamsResponse.object[0].id);
        }

        // 2. Get schedules for each team
        const teamSchedules = await Promise.all(
          teamsResponse.object.map(async (team) => {
            try {
              const scheduleResponse = await onCallService.getTeamSchedule(team.id, 30);
              
              if (scheduleResponse.success && scheduleResponse.object) {
                return {
                  teamId: team.id,
                  teamName: team.name,
                  timezone: team.timezone,
                  members: team.members,
                  schedule: scheduleResponse.object.schedule
                };
              }
              
              return {
                teamId: team.id,
                teamName: team.name,
                timezone: team.timezone,
                members: team.members,
                schedule: []
              };
            } catch (err) {
              console.warn(`Failed to load schedule for team ${team.id}:`, err);
              return {
                teamId: team.id,
                teamName: team.name,
                timezone: team.timezone,
                members: team.members,
                schedule: []
              };
            }
          })
        );
        
        setCalendarData(teamSchedules as Team[]);
      }

      // 3. Get current on-call for all teams
      const currentOnCall = await onCallService.getCurrentOnCall();
      if (currentOnCall.httpStatus === 'OK') {
        setCurrentOnCallAll(currentOnCall);
      }
    } catch (error: any) {
      console.error('Error loading on-call data:', error);
      setError(error.message || 'Failed to load on-call data');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIXED: Use getCurrentOnCallByTeam instead of getTeamDetails
  const loadCurrentOnCallByTeam = async (teamId: string) => {
    try {
      const response = await onCallService.getCurrentOnCallByTeam(teamId);
      if (response.httpStatus === 'OK' && response.data) {
        setCurrentOnCallByTeam(response.data);
      }
    } catch (error) {
      console.error('Error loading current on-call:', error);
    }
  };

  const loadScheduleConfig = async (teamId: string) => {
    try {
      const config = await onCallService.getScheduleConfig(teamId);
      if (config.success) {
        setScheduleConfig(config);
      }
    } catch (error) {
      console.error('Error loading schedule config:', error);
    }
  };

  // ✅ NEW: Get all unique members from multiple sources (like mobile app)
  const getTeamMembers = (): TeamMember[] => {
    const membersMap = new Map<string, TeamMember>();
    
    // 1. Add members from team list
    const calendarTeam = calendarData.find(t => t.teamId === selectedTeam);
    calendarTeam?.members?.forEach(member => {
      membersMap.set(member.id, member);
    });
    
    // 2. Add current on-call members
    if (currentOnCallByTeam) {
      const currentMembers = [
        currentOnCallByTeam.primary,
        currentOnCallByTeam.backup,
        ...(currentOnCallByTeam.escalation || [])
      ].filter(Boolean) as TeamMember[];
      
      currentMembers.forEach(person => {
        if (!membersMap.has(person.id)) {
          membersMap.set(person.id, person);
        }
      });
    }
    
    // 3. Add members from calendar schedule assignments
    calendarTeam?.schedule?.forEach(day => {
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
    
    // Convert Map to Array and sort by name
    return Array.from(membersMap.values()).sort((a, b) => 
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    );
  };

  const handleCreateOverride = async () => {
    if (!overrideData.teamId || !overrideData.startDate || !overrideData.endDate || 
        !overrideData.userId || !overrideData.reason) {
      setModalMessage('Please fill in all required fields');
      setIsErrorModalOpen(true);
      return;
    }

    try {
      const startDateTime = new Date(overrideData.startDate + 'T00:00:00');
      const endDateTime = new Date(overrideData.endDate + 'T23:59:59');

      const payload = {
        teamId: overrideData.teamId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        userId: overrideData.userId,
        role: overrideData.role,
        reason: overrideData.reason,
        originalUserId: overrideData.originalUserId || undefined  // Send undefined if empty
      };

      const result = await onCallService.createOverride(payload);
      
      if (result.success) {
        setIsOverrideModalOpen(false);
        setModalMessage('Override created successfully! Refreshing schedule...');
        setIsSuccessModalOpen(true);
        
        setOverrideData({
          teamId: selectedTeam,
          startDate: '',
          endDate: '',
          userId: '',
          role: 'primary',
          reason: '',
          originalUserId: ''
        });
        
        await loadData();
      } else {
        throw new Error(result.message || 'Failed to create override');
      }
    } catch (error: any) {
      console.error('Override creation error:', error);
      setModalMessage(error.message || 'Failed to create override. Please try again.');
      setIsErrorModalOpen(true);
    }
  };

  const handleUpdateScheduleConfig = async () => {
    if (!scheduleConfig) return;
    
    try {
      const result = await onCallService.updateScheduleConfig({
        teamId: scheduleConfig.object.teamId,
        rotationType: scheduleConfig.object.schedule.rotationType,
        rotationLengthHours: scheduleConfig.object.schedule.rotationLengthHours,
        rotationStartISO: scheduleConfig.object.schedule.rotationStartISO,
        members: scheduleConfig.object.members
      });
      
      if (result.success) {
        setIsSettingsModalOpen(false);
        setModalMessage('Schedule configuration updated successfully!');
        setIsSuccessModalOpen(true);
        await loadData();
      } else {
        throw new Error('Failed to update configuration');
      }
    } catch (error: any) {
      setModalMessage(error.message || 'Failed to update configuration');
      setIsErrorModalOpen(true);
    }
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

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    
    const selectedTeamData = calendarData.find(t => t.teamId === selectedTeam);
    const dateKey = formatDateKey(clickedDate);
    const daySchedule = selectedTeamData?.schedule.find(s => s.date === dateKey);
    
    if (daySchedule?.assignment) {
      setSelectedAssignment(daySchedule.assignment);
      setIsViewMode(true);
    } else {
      setOverrideData({
        teamId: selectedTeam,
        startDate: dateKey,
        endDate: dateKey,
        userId: '',
        role: 'primary',
        reason: '',
        originalUserId: ''
      });
      setIsOverrideModalOpen(true);
    }
  };

  const closeModals = () => {
    setIsViewMode(false);
    setSelectedDate(null);
    setSelectedAssignment(null);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: React.ReactElement[] = [];
    
    const selectedTeamData = calendarData.find(t => t.teamId === selectedTeam);
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = formatDateKey(date);
      const daySchedule = selectedTeamData?.schedule.find(s => s.date === dateKey);
      const isToday = new Date().toDateString() === date.toDateString();
      const hasAssignment = daySchedule?.assignment;
      
      days.push(
        <motion.div
          key={day}
          whileHover={{ scale: 1.03, zIndex: 10 }}
          whileTap={{ scale: 0.98 }}
          className={`h-24 border-2 cursor-pointer relative overflow-hidden transition-all ${
            isToday 
              ? 'bg-gradient-to-br from-blue-600/30 to-purple-600/30 border-blue-500 shadow-lg' 
              : hasAssignment
              ? 'bg-slate-700/30 border-slate-600 hover:border-purple-500 hover:bg-slate-700/50'
              : 'bg-slate-800/20 border-slate-700 hover:border-slate-600 hover:bg-slate-700/30'
          }`}
          onClick={() => handleDateClick(day)}
        >
          <div className="absolute top-2 left-2">
            <span className={`text-sm font-bold ${
              isToday ? 'text-blue-400' : hasAssignment ? 'text-white' : 'text-slate-500'
            }`}>
              {day}
            </span>
          </div>

          {hasAssignment && daySchedule?.assignment && (
            <div className="absolute inset-0 p-2 pt-8 flex flex-col gap-1">
              {daySchedule.assignment.primary && (
                <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/40 rounded px-2 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                  <span className="text-xs text-green-300 truncate font-medium">
                    {daySchedule.assignment.primary.firstName || 'Unknown'}
                  </span>
                </div>
              )}
              {daySchedule.assignment.backup && (
                <div className="flex items-center gap-1.5 bg-yellow-500/20 border border-yellow-500/40 rounded px-2 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                  <span className="text-xs text-yellow-300 truncate font-medium">
                    {daySchedule.assignment.backup.firstName || 'Unknown'}
                  </span>
                </div>
              )}
              {daySchedule.assignment.escalation && daySchedule.assignment.escalation.length > 0 && (
                <div className="flex items-center gap-1.5 bg-blue-500/20 border border-blue-500/40 rounded px-2 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-blue-300 truncate font-medium">
                    {daySchedule.assignment.escalation[0].firstName || 'Unknown'}
                  </span>
                </div>
              )}
            </div>
          )}

          {!hasAssignment && (
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
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
        <p className="text-slate-400">Loading on-call schedules...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900">
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
              <p className="text-slate-300 mt-1">Manage on-call rotations and overrides</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant={showAllTeams ? "default" : "outline"}
              onClick={() => setShowAllTeams(!showAllTeams)}
              className={showAllTeams ? "bg-purple-600 text-white" : "border-slate-600 text-white hover:bg-slate-700"}
            >
              <Users className="h-4 w-4 mr-2" />
              All Teams
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                  <UserCheck className="h-4 w-4 mr-2" />
                  {teams.find(t => t.id === selectedTeam)?.name || 'Select Team'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-600">
                {teams.map((team, index) => (
                  <DropdownMenuItem 
                    key={team.id}
                    onClick={() => setSelectedTeam(team.id)}
                    className="text-white hover:bg-slate-700"
                  >
                    <div className={`w-3 h-3 rounded-full ${getTeamColor(index)} mr-2`} />
                    {team.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              onClick={() => {
                setOverrideData({ 
                  teamId: selectedTeam,
                  startDate: '',
                  endDate: '',
                  userId: '',
                  role: 'primary',
                  reason: '',
                  originalUserId: ''
                });
                setIsOverrideModalOpen(true);
              }}
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Override
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsSettingsModalOpen(true)}
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Rotation
            </Button>
            
            <Button
              onClick={loadData}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* All Teams Dashboard */}
        {showAllTeams && currentOnCallAll && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="h-5 w-5" />
                  All Teams - Current On-Call Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentOnCallAll.data.primary.map((person, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg p-4 border border-green-500/30">
                      <Badge className="bg-green-500 text-white mb-2">Primary</Badge>
                      <h4 className="font-semibold text-white">{person.fullname}</h4>
                      <p className="text-sm text-slate-400">{person.teamName}</p>
                      <p className="text-xs text-slate-500 mt-1">{person.email}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Current On-Call Status */}
        {!showAllTeams && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="h-5 w-5" />
                  Current On-Call Status - {teams.find(t => t.id === selectedTeam)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentOnCallByTeam ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentOnCallByTeam.primary && (
                      <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg p-4 border border-green-500/30">
                        <Badge className="bg-green-500 text-white mb-3">Primary</Badge>
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-12 w-12 border-2 border-green-500/50">
                            <AvatarFallback className="bg-green-600 text-white font-semibold">
                              {currentOnCallByTeam.primary.firstName?.[0]}{currentOnCallByTeam.primary.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-white">
                              {currentOnCallByTeam.primary.firstName} {currentOnCallByTeam.primary.lastName}
                            </h4>
                            <p className="text-sm text-slate-400">{currentOnCallByTeam.primary.role}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-slate-300">
                            <Mail className="h-4 w-4 text-green-400" />
                            <span className="truncate">{currentOnCallByTeam.primary.email}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {currentOnCallByTeam.backup && (
                      <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-lg p-4 border border-yellow-500/30">
                        <Badge className="bg-yellow-500 text-white mb-3">Backup</Badge>
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-12 w-12 border-2 border-yellow-500/50">
                            <AvatarFallback className="bg-yellow-600 text-white font-semibold">
                              {currentOnCallByTeam.backup.firstName?.[0]}{currentOnCallByTeam.backup.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-white">
                              {currentOnCallByTeam.backup.firstName} {currentOnCallByTeam.backup.lastName}
                            </h4>
                            <p className="text-sm text-slate-400">{currentOnCallByTeam.backup.role}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-slate-300">
                            <Mail className="h-4 w-4 text-yellow-400" />
                            <span className="truncate">{currentOnCallByTeam.backup.email}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {currentOnCallByTeam.escalation?.map((person, idx) => (
                      <motion.div key={idx} whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-lg p-4 border border-blue-500/30">
                        <Badge className="bg-blue-500 text-white mb-3">Escalation</Badge>
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-12 w-12 border-2 border-blue-500/50">
                            <AvatarFallback className="bg-blue-600 text-white font-semibold">
                              {person.firstName?.[0]}{person.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-white">{person.firstName} {person.lastName}</h4>
                            <p className="text-sm text-slate-400">{person.role}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-slate-300">
                            <Mail className="h-4 w-4 text-blue-400" />
                            <span className="truncate">{person.email}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <User className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No current on-call assignments</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Calendar View */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Calendar className="h-5 w-5" />
                  Schedule Calendar - {teams.find(t => t.id === selectedTeam)?.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="text-white hover:bg-slate-700">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-white font-medium min-w-[150px] text-center">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="text-white hover:bg-slate-700">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                  <div key={day} className="h-10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-slate-400">{day}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {renderCalendar()}
              </div>
              <div className="mt-6 flex items-center justify-center gap-6 text-sm">
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

        {/* Create Override Modal */}
        <AnimatePresence>
          {isOverrideModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setIsOverrideModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Create Schedule Override</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOverrideModalOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Person Needing Coverage (Optional)</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-start bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                          {overrideData.originalUserId && getTeamMembers().find(m => m.id === overrideData.originalUserId)
                            ? `${getTeamMembers().find(m => m.id === overrideData.originalUserId)!.firstName} ${getTeamMembers().find(m => m.id === overrideData.originalUserId)!.lastName}`
                            : "Select person (optional)"
                          }
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-600">
                        <DropdownMenuItem 
                          onClick={() => setOverrideData({...overrideData, originalUserId: ''})}
                          className="text-white hover:bg-slate-700"
                        >
                          None (New assignment)
                        </DropdownMenuItem>
                        {getTeamMembers().map((member) => (
                          <DropdownMenuItem 
                            key={member.id}
                            onClick={() => setOverrideData({...overrideData, originalUserId: member.id})}
                            className="text-white hover:bg-slate-700"
                          >
                            {member.firstName} {member.lastName}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div>
                    <Label className="text-white">Replacement Person *</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-start bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                          {overrideData.userId && getTeamMembers().find(m => m.id === overrideData.userId)
                            ? `${getTeamMembers().find(m => m.id === overrideData.userId)!.firstName} ${getTeamMembers().find(m => m.id === overrideData.userId)!.lastName}`
                            : "Select replacement person"
                          }
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-600">
                        {getTeamMembers().map((member) => (
                          <DropdownMenuItem 
                            key={member.id}
                            onClick={() => setOverrideData({...overrideData, userId: member.id})}
                            className="text-white hover:bg-slate-700"
                          >
                            {member.firstName} {member.lastName}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div>
                    <Label className="text-white">Role *</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-start bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                          {overrideData.role.charAt(0).toUpperCase() + overrideData.role.slice(1)}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-600">
                        <DropdownMenuItem onClick={() => setOverrideData({...overrideData, role: 'primary'})} className="text-white hover:bg-slate-700">
                          Primary
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setOverrideData({...overrideData, role: 'backup'})} className="text-white hover:bg-slate-700">
                          Backup
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setOverrideData({...overrideData, role: 'escalation'})} className="text-white hover:bg-slate-700">
                          Escalation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div>
                    <Label className="text-white">Start Date *</Label>
                    <Input 
                      type="date" 
                      value={overrideData.startDate} 
                      onChange={(e) => setOverrideData({...overrideData, startDate: e.target.value})} 
                      className="bg-slate-700 border-slate-600 text-white" 
                    />
                  </div>
                  
                  <div>
                    <Label className="text-white">End Date *</Label>
                    <Input 
                      type="date" 
                      value={overrideData.endDate} 
                      onChange={(e) => setOverrideData({...overrideData, endDate: e.target.value})} 
                      className="bg-slate-700 border-slate-600 text-white" 
                    />
                  </div>
                  
                  <div>
                    <Label className="text-white">Reason *</Label>
                    <Input 
                      value={overrideData.reason} 
                      onChange={(e) => setOverrideData({...overrideData, reason: e.target.value})} 
                      placeholder="e.g., Vacation coverage, Sick leave" 
                      className="bg-slate-700 border-slate-600 text-white" 
                    />
                  </div>

                  <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-300">
                        Override will temporarily assign the replacement person during the specified date range. Original rotation resumes after.
                      </p>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCreateOverride} 
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Override
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Assignment Modal */}
        <AnimatePresence>
          {isViewMode && selectedAssignment && (
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
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 max-w-lg w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">
                    Schedule Details
                    {selectedDate && ` - ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeModals}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {selectedAssignment.primary && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <Badge className="bg-green-500 text-white mb-2">Primary</Badge>
                      <h4 className="text-white font-semibold">
                        {selectedAssignment.primary.firstName} {selectedAssignment.primary.lastName}
                      </h4>
                      <p className="text-sm text-slate-400">{selectedAssignment.primary.email}</p>
                    </div>
                  )}

                  {selectedAssignment.backup && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <Badge className="bg-yellow-500 text-white mb-2">Backup</Badge>
                      <h4 className="text-white font-semibold">
                        {selectedAssignment.backup.firstName} {selectedAssignment.backup.lastName}
                      </h4>
                      <p className="text-sm text-slate-400">{selectedAssignment.backup.email}</p>
                    </div>
                  )}

                  {selectedAssignment.escalation && selectedAssignment.escalation.length > 0 && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <Badge className="bg-blue-500 text-white mb-2">Escalation</Badge>
                      {selectedAssignment.escalation.map((person, idx) => (
                        <div key={idx} className="mb-2 last:mb-0">
                          <h4 className="text-white font-semibold">
                            {person.firstName} {person.lastName}
                          </h4>
                          <p className="text-sm text-slate-400">{person.email}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    onClick={() => {
                      closeModals();
                      setOverrideData({
                        teamId: selectedTeam,
                        startDate: selectedDate ? formatDateKey(selectedDate) : '',
                        endDate: selectedDate ? formatDateKey(selectedDate) : '',
                        userId: '',
                        role: 'primary',
                        reason: '',
                        originalUserId: selectedAssignment.primary?.id || ''
                      });
                      setIsOverrideModalOpen(true);
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Override for This Day
                  </Button>
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