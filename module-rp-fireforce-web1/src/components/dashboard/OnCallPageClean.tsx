// components/pages/OnCallPageClean.tsx - OPTIMIZED VERSION
import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import React from "react";
import { motion } from "framer-motion";
import {
    Calendar, ChevronLeft, ChevronRight, Loader2, RefreshCw,
    AlertCircle, Plus, Users, CheckCircle, X, Edit2, UserCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Label } from "../ui/label";
import { onCallService, Team, Assignment, TeamMember } from "@/services/oncallService.ts";
import { BulkSchedulerModal } from "../modals/BulkSchedulerModal";
import { OverrideModal } from "../modals/OverrideModal";
import { teamManagementServiceV2 } from "@/services/team-management-service.ts";

interface ConsecutiveEvent {
    startDay: number;
    endDay: number;
    person: any;
    role: 'primary' | 'backup' | 'escalation';
    rowIndex: number;
}

// ✅ OPTIMIZATION 1: Memoized CalendarDay Component
const CalendarDay = memo(({
                              day,
                              isToday,
                              hasAssignment,
                              events,
                              currentDate,
                              selectedTeam,
                              onDayClick,
                              onRightClick
                          }: any) => {
    return (
        <div
            className={`h-24 border rounded-lg cursor-pointer relative overflow-visible ${
                isToday
                    ? 'bg-blue-500/20 border-blue-500 dark:bg-blue-500/20'
                    : hasAssignment
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-600 hover:border-blue-500'
                        : 'bg-white dark:bg-slate-800/20 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
            }`}
            onClick={() => onDayClick(day)}
            onContextMenu={onRightClick}
        >
            <div className="flex items-center justify-between p-2">
                <span className={`text-sm font-semibold ${
                    isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                }`}>
                    {day}
                </span>
                {isToday && (
                    <Badge className="bg-blue-500 text-white text-xs px-1.5 py-0 h-4">Today</Badge>
                )}
            </div>

            {events.map((event: ConsecutiveEvent, index: number) => {
                const span = event.endDay - event.startDay + 1;
                const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
                const currentDayOfWeek = (firstDayOfMonth + day - 1) % 7;
                const daysUntilEndOfWeek = 7 - currentDayOfWeek;
                const actualSpan = Math.min(span, daysUntilEndOfWeek);
                const widthPercent = actualSpan * 100;

                let bgColor = 'bg-green-500';
                let topPosition = 30;

                if (selectedTeam === 'all') {
                    const teamColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                    bgColor = teamColors[event.rowIndex % teamColors.length];
                    topPosition = 30 + index * 19;
                } else {
                    const roleColors = {
                        primary: 'bg-green-500',
                        backup: 'bg-yellow-500',
                        escalation: 'bg-orange-500'
                    };
                    bgColor = roleColors[event.role];
                    topPosition = 30 + event.rowIndex * 19;
                }

                return (
                    <div
                        key={`${event.role}-${event.person.id}`}
                        className={`absolute ${bgColor} text-white rounded-md px-2 text-xs font-medium shadow-sm hover:shadow-md transition-all z-10 cursor-pointer flex items-center`}
                        style={{
                            top: `${topPosition}px`,
                            left: '4px',
                            width: `calc(${widthPercent}% + ${(actualSpan - 1) * 8}px - 8px)`,
                            height: '16px'
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDayClick(event.startDay);
                        }}
                    >
                        <span className="truncate text-[11px]">
                            {event.person.firstName}
                            {event.role === 'escalation' && event.person.count > 1 && ` +${event.person.count - 1}`}
                        </span>
                    </div>
                );
            })}
        </div>
    );
});

CalendarDay.displayName = 'CalendarDay';

export function OnCallPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [myTeam, setMyTeam] = useState<Team | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<string>('my-team');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTeamForEdit, setSelectedTeamForEdit] = useState<Team | null>(null);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Modal states
    const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
    const [isOverrideOpen, setIsOverrideOpen] = useState(false);
    const [overrideDate, setOverrideDate] = useState<Date | null>(null);
    const [overrideAssignment, setOverrideAssignment] = useState<Assignment | null>(null);

    const [editData, setEditData] = useState({
        primaryUser: '',
        backupUser: '',
        escalationUsers: [] as string[],
    });

    const lastLoadRef = useRef<number>(0);

    // ✅ OPTIMIZATION 2: Reduce initial data fetch to 45 days (faster load)
    const loadData = useCallback(async () => {
        const now = Date.now();
        if (now - lastLoadRef.current < 1000) {
            console.log('⏱️ Skipping duplicate load (debounced)');
            return;
        }
        lastLoadRef.current = now;

        setIsLoading(true);
        setError(null);
        try {
            // ✅ Fetch only 45 days instead of 60 for faster load
            const calendarResponse = await onCallService.getCalendarData(45);

            if (!calendarResponse.success || !calendarResponse.data) {
                throw new Error('Failed to load calendar data');
            }
            setTeams(calendarResponse.data);

            // Get current user
            const userStr = localStorage.getItem('user');
            const currentUserId = userStr ? JSON.parse(userStr).id : null;

            if (currentUserId) {
                try {
                    const userTeamResponse = await teamManagementServiceV2.getUserTeam(currentUserId);

                    if (userTeamResponse.success && userTeamResponse.data?.data) {
                        const userTeamId = userTeamResponse.data.data.id;
                        const userTeam = calendarResponse.data.find((team: Team) =>
                            team.teamId === userTeamId
                        );

                        if (userTeam) {
                            setMyTeam(userTeam);
                        } else {
                            setMyTeam(calendarResponse.data[0] || null);
                        }
                    } else {
                        setMyTeam(calendarResponse.data[0] || null);
                    }
                } catch (teamError) {
                    console.error('❌ Error fetching user team:', teamError);
                    setMyTeam(calendarResponse.data[0] || null);
                }
            } else {
                setMyTeam(calendarResponse.data[0] || null);
            }
        } catch (error: any) {
            console.error('❌ Error loading on-call data:', error);
            setError(error.message || 'Failed to load on-call data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // ✅ OPTIMIZATION 3: Memoize format function
    const formatDateKey = useCallback((date: Date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }, []);

    // ✅ OPTIMIZATION 4: Cache team members by role
    const teamMembersByRole = useMemo(() => {
        const cache = new Map<string, Map<string, TeamMember[]>>();

        teams.forEach(team => {
            const roleMap = new Map<string, TeamMember[]>();
            roleMap.set('primary', team.members.filter(m => m.role?.toLowerCase() === 'primary'));
            roleMap.set('backup', team.members.filter(m => m.role?.toLowerCase() === 'backup'));
            roleMap.set('escalation', team.members.filter(m => m.role?.toLowerCase() === 'escalation'));
            cache.set(team.teamId, roleMap);
        });

        return cache;
    }, [teams]);

    const getUsersByRole = useCallback((teamId: string, role: 'primary' | 'backup' | 'escalation'): TeamMember[] => {
        return teamMembersByRole.get(teamId)?.get(role) || [];
    }, [teamMembersByRole]);

    // ✅ OPTIMIZATION 5: More efficient filtered teams
    const filteredTeams = useMemo(() => {
        if (selectedTeam === 'my-team') return myTeam ? [myTeam] : [];
        if (selectedTeam === 'all') return teams;
        const team = teams.find(t => t.teamId === selectedTeam);
        return team ? [team] : [];
    }, [teams, selectedTeam, myTeam]);

    const today = useMemo(() => new Date().toISOString().split('T')[0], []);

    const handleDateClick = useCallback((day: number) => {
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(clickedDate);
        setIsScheduleModalOpen(true);
        setIsEditMode(false);
    }, [currentDate]);

    const openEditModal = useCallback((team: Team, assignment: Assignment | null) => {
        setSelectedTeamForEdit(team);
        setEditData({
            primaryUser: assignment?.primary?.id || '',
            backupUser: assignment?.backup?.id || '',
            escalationUsers: assignment?.escalation?.map(e => e.id) || []
        });
        setIsEditMode(true);
    }, []);

    const closeModals = useCallback(() => {
        setIsScheduleModalOpen(false);
        setIsEditMode(false);
        setSelectedDate(null);
        setSelectedTeamForEdit(null);
        setEditData({ primaryUser: '', backupUser: '', escalationUsers: [] });
    }, []);

    const handleSaveSchedule = async () => {
        if (!selectedDate || !selectedTeamForEdit) return;
        try {
            const scheduleId = selectedTeamForEdit.schedule.find(d => d.assignment?.scheduleId)?.assignment?.scheduleId;
            if (!scheduleId) throw new Error('Schedule ID not found');

            const dateKey = formatDateKey(selectedDate);
            const assignments = [];

            if (editData.primaryUser) {
                assignments.push({ userId: editData.primaryUser, role: 'primary' as const, dates: [dateKey] });
            }
            if (editData.backupUser) {
                assignments.push({ userId: editData.backupUser, role: 'backup' as const, dates: [dateKey] });
            }
            editData.escalationUsers.forEach(userId => {
                assignments.push({ userId, role: 'escalation' as const, dates: [dateKey] });
            });

            const payload: any = { scheduleId, teamId: selectedTeamForEdit.teamId, assignments };
            if (assignments.length === 0) {
                payload.clearDate = dateKey;
            }

            const result = await onCallService.updateSchedule(payload);

            if (result.success) {
                closeModals();
                await loadData();
            } else {
                throw new Error(result.message || 'Failed to update schedule');
            }
        } catch (error: any) {
            console.error('Error updating schedule:', error);
            alert(error.message || 'Failed to update schedule');
        }
    };

    const handleSaveBulkSchedule = useCallback(async (data: {
        scheduleId: string;
        teamId: string;
        assignments: Array<{
            userId: string;
            role: 'primary' | 'backup' | 'escalation';
            dates: string[];
        }>;
    }) => {
        try {
            const result = await onCallService.updateSchedule({
                scheduleId: data.scheduleId,
                teamId: data.teamId,
                assignments: data.assignments,
            });

            if (result.success) {
                setIsSchedulerOpen(false);

                // Navigate to first scheduled date
                if (data.assignments.length > 0 && data.assignments[0].dates.length > 0) {
                    const firstScheduledDate = new Date(data.assignments[0].dates[0]);
                    setCurrentDate(firstScheduledDate);
                }

                // Reload data
                await loadData();
                alert(`✅ Schedule created for ${data.assignments[0].dates.length} day(s)!`);
            } else {
                throw new Error(result.message || 'Failed to save schedule');
            }
        } catch (error: any) {
            console.error('❌ Error saving schedule:', error);
            alert(error.message || 'Failed to save schedule');
        }
    }, [loadData]);

    const handleSaveOverride = useCallback(async (data: {
        teamId: string;
        scheduleId?: string;
        startTime: string;
        endTime: string;
        userId: string;
        role: 'primary' | 'backup' | 'escalation';
        reason: string;
        originalUserId?: string;
    }) => {
        try {
            const result = await onCallService.createOverride(data);

            if (result.success) {
                setIsOverrideOpen(false);
                await loadData();
                alert('✅ Override created successfully!');
            } else {
                throw new Error(result.message || 'Failed to create override');
            }
        } catch (error: any) {
            console.error('❌ Error creating override:', error);
            alert(error.message || 'Failed to create override');
        }
    }, [loadData]);

    const handleOpenOverride = useCallback((date: Date, team: Team, assignment: Assignment | null) => {
        setOverrideDate(date);
        setOverrideAssignment(assignment);
        setSelectedTeamForEdit(team);
        setIsOverrideOpen(true);
    }, []);

    const handleOpenScheduler = useCallback(() => {
        if (!myTeam) {
            alert('Please select your team first');
            return;
        }
        setIsSchedulerOpen(true);
    }, [myTeam]);

    // ✅ OPTIMIZATION 6: Optimized consecutive events calculation
    const consecutiveEvents = useMemo(() => {
        if (!filteredTeams || filteredTeams.length === 0) return [];

        const events: ConsecutiveEvent[] = [];
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

        if (selectedTeam === 'all') {
            filteredTeams.forEach((team, teamIndex) => {
                let currentEvent: ConsecutiveEvent | null = null;

                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const dateKey = formatDateKey(date);
                    const daySchedule = team.schedule.find(s => s.date === dateKey);
                    const hasAssignment = !!daySchedule?.assignment;
                    const isStartOfWeek = date.getDay() === 0 && currentEvent !== null;

                    if (hasAssignment) {
                        if (!currentEvent || isStartOfWeek) {
                            if (currentEvent && isStartOfWeek) {
                                events.push(currentEvent);
                            }
                            currentEvent = {
                                startDay: day,
                                endDay: day,
                                person: { id: team.teamId, firstName: team.teamName },
                                role: 'primary',
                                rowIndex: teamIndex
                            };
                        } else {
                            currentEvent.endDay = day;
                        }
                    } else {
                        if (currentEvent) {
                            events.push(currentEvent);
                            currentEvent = null;
                        }
                    }
                }
                if (currentEvent) {
                    events.push(currentEvent);
                }
            });
        } else {
            const team = filteredTeams[0];
            if (!team) return [];

            const roles: ('primary' | 'backup' | 'escalation')[] = ['primary', 'backup', 'escalation'];

            roles.forEach((role, roleIndex) => {
                let currentEvent: ConsecutiveEvent | null = null;

                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const dateKey = formatDateKey(date);
                    const daySchedule = team.schedule.find(s => s.date === dateKey);
                    const assignment = daySchedule?.assignment;
                    const isStartOfWeek = date.getDay() === 0 && currentEvent !== null;

                    let personForRole: any = null;
                    if (role === 'primary' && assignment?.primary) {
                        personForRole = assignment.primary;
                    } else if (role === 'backup' && assignment?.backup) {
                        personForRole = assignment.backup;
                    } else if (role === 'escalation' && assignment?.escalation && assignment.escalation.length > 0) {
                        personForRole = {
                            id: assignment.escalation.map(e => e.id).join(','),
                            firstName: assignment.escalation[0].firstName,
                            count: assignment.escalation.length
                        };
                    }

                    if (personForRole) {
                        if (!currentEvent || currentEvent.person.id !== personForRole.id || isStartOfWeek) {
                            if (currentEvent) {
                                events.push(currentEvent);
                            }
                            currentEvent = { startDay: day, endDay: day, person: personForRole, role, rowIndex: roleIndex };
                        } else {
                            currentEvent.endDay = day;
                        }
                    } else {
                        if (currentEvent) {
                            events.push(currentEvent);
                            currentEvent = null;
                        }
                    }
                }
                if (currentEvent) {
                    events.push(currentEvent);
                }
            });
        }

        return events;
    }, [filteredTeams, currentDate, formatDateKey, selectedTeam]);

    // ✅ OPTIMIZATION 7: Optimized calendar days rendering
    const calendarDays = useMemo(() => {
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        const days: React.ReactElement[] = [];

        // Empty cells for alignment
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 relative"></div>);
        }

        // Actual days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateKey = formatDateKey(date);
            const isToday = new Date().toDateString() === date.toDateString();

            const dayAssignments = filteredTeams.map(team => {
                const daySchedule = team.schedule.find(s => s.date === dateKey);
                return { team, assignment: daySchedule?.assignment || null };
            }).filter(item => item.assignment !== null);

            const hasAnyAssignment = dayAssignments.length > 0;
            const eventsStartingHere = consecutiveEvents.filter(e => e.startDay === day);

            const handleRightClick = (e: React.MouseEvent) => {
                e.preventDefault();
                if (selectedTeam === 'my-team' && myTeam) {
                    const dayAssignment = myTeam.schedule.find(s => s.date === dateKey)?.assignment || null;
                    handleOpenOverride(date, myTeam, dayAssignment);
                }
            };

            days.push(
                <CalendarDay
                    key={day}
                    day={day}
                    isToday={isToday}
                    hasAssignment={hasAnyAssignment}
                    events={eventsStartingHere}
                    currentDate={currentDate}
                    selectedTeam={selectedTeam}
                    onDayClick={handleDateClick}
                    onRightClick={handleRightClick}
                />
            );
        }

        return days;
    }, [currentDate, filteredTeams, formatDateKey, handleDateClick, consecutiveEvents, selectedTeam, myTeam, handleOpenOverride]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                <p className="text-slate-400">Loading schedules...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <p className="text-white text-xl mb-2">Error Loading Data</p>
                <p className="text-slate-400 mb-4">{error}</p>
                <Button onClick={loadData} className="bg-blue-600 hover:bg-blue-700">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                        On-Call Schedule
                    </h1>
                    <p className="text-slate-700 dark:text-slate-200 mt-2 text-lg">
                        Manage your team's on-call rotations
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadData}
                        className="text-slate-900 dark:text-white border-slate-200 dark:border-slate-700"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenScheduler}
                        disabled={!myTeam}
                        className="text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Bulk Scheduler
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (!myTeam) {
                                alert('Please select your team first');
                                return;
                            }
                            const today = new Date();
                            const todayStr = formatDateKey(today);
                            const todayAssignment = myTeam.schedule.find(s => s.date === todayStr)?.assignment || null;
                            handleOpenOverride(today, myTeam, todayAssignment);
                        }}
                        disabled={!myTeam}
                        className="text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Create Override
                    </Button>
                </div>
            </motion.div>

            {/* Team Filter */}
            <div className="flex gap-2">
                <Button
                    variant={selectedTeam === 'my-team' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTeam('my-team')}
                    disabled={!myTeam}
                    className={selectedTeam === 'my-team'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        : 'text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'
                    }
                >
                    <Users className="mr-2 h-4 w-4" />
                    My Team
                </Button>
                <Button
                    variant={selectedTeam === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTeam('all')}
                    className={selectedTeam === 'all'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        : 'text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'
                    }
                >
                    All Teams ({teams.length})
                </Button>
            </div>

            {/* Calendar Card */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                            <Calendar className="h-5 w-5" />
                            {selectedTeam === 'all'
                                ? 'All Teams Schedule'
                                : selectedTeam === 'my-team' && myTeam
                                    ? myTeam.teamName
                                    : filteredTeams[0]?.teamName || 'Schedule'
                            }
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                                className="text-slate-900 dark:text-white"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-slate-900 dark:text-white font-medium min-w-[150px] text-center">
                                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                                className="text-slate-900 dark:text-white"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="h-10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                                    {day}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2">
                        {calendarDays}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 flex items-center justify-center gap-6 text-sm border-t border-slate-200 dark:border-slate-700 pt-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-slate-600 dark:text-slate-400">Primary</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="text-slate-600 dark:text-slate-400">Backup</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span className="text-slate-600 dark:text-slate-400">Escalation</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Schedule Detail Modal */}
            {isScheduleModalOpen && selectedDate && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={closeModals}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    {selectedTeam === 'all' ? 'All Teams' : filteredTeams[0]?.teamName}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={closeModals}
                                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {!isEditMode && (
                            <div className="space-y-4">
                                {filteredTeams.map((team) => {
                                    const selectedDateAssignment = team.schedule.find(s => s.date === formatDateKey(selectedDate))?.assignment;
                                    return (
                                        <div
                                            key={team.teamId}
                                            className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/30"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-semibold text-slate-900 dark:text-white">
                                                    {team.teamName}
                                                </h4>
                                                {selectedTeam === 'my-team' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => openEditModal(team, selectedDateAssignment)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                                    >
                                                        <Edit2 className="h-3 w-3 mr-1" />
                                                        Edit
                                                    </Button>
                                                )}
                                            </div>

                                            {selectedDateAssignment ? (
                                                <div className="space-y-3">
                                                    {/* Primary */}
                                                    {selectedDateAssignment.primary && (
                                                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                                            <Badge className="bg-green-500 text-white mb-2">Primary</Badge>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-10 w-10 border-2 border-green-500">
                                                                    <AvatarImage src={selectedDateAssignment.primary.avatarUrl} />
                                                                    <AvatarFallback className="bg-green-500 text-white text-xs">
                                                                        {selectedDateAssignment.primary.firstName[0]}{selectedDateAssignment.primary.lastName[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="font-medium text-slate-900 dark:text-white text-sm">
                                                                        {selectedDateAssignment.primary.firstName} {selectedDateAssignment.primary.lastName}
                                                                    </p>
                                                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                                                        {selectedDateAssignment.primary.email}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Backup */}
                                                    {selectedDateAssignment.backup && (
                                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                                            <Badge className="bg-yellow-500 text-white mb-2">Backup</Badge>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-10 w-10 border-2 border-yellow-500">
                                                                    <AvatarImage src={selectedDateAssignment.backup.avatarUrl} />
                                                                    <AvatarFallback className="bg-yellow-500 text-white text-xs">
                                                                        {selectedDateAssignment.backup.firstName[0]}{selectedDateAssignment.backup.lastName[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="font-medium text-slate-900 dark:text-white text-sm">
                                                                        {selectedDateAssignment.backup.firstName} {selectedDateAssignment.backup.lastName}
                                                                    </p>
                                                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                                                        {selectedDateAssignment.backup.email}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Escalation */}
                                                    {selectedDateAssignment.escalation && selectedDateAssignment.escalation.length > 0 && (
                                                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                                                            <Badge className="bg-orange-500 text-white mb-2">Escalation</Badge>
                                                            <div className="space-y-2">
                                                                {selectedDateAssignment.escalation.map((person, idx) => (
                                                                    <div key={idx} className="flex items-center gap-3">
                                                                        <Avatar className="h-8 w-8 border-2 border-orange-500">
                                                                            <AvatarImage src={person.avatarUrl} />
                                                                            <AvatarFallback className="bg-orange-500 text-white text-xs">
                                                                                {person.firstName[0]}{person.lastName[0]}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div>
                                                                            <p className="font-medium text-slate-900 dark:text-white text-sm">
                                                                                {person.firstName} {person.lastName}
                                                                            </p>
                                                                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                                                                {person.email}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center py-6">
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">No schedule set</p>
                                                    {selectedTeam === 'my-team' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => openEditModal(team, null)}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white mt-3"
                                                        >
                                                            <Plus className="h-3 w-3 mr-1" />
                                                            Add
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {isEditMode && selectedTeamForEdit && (
                            <div className="space-y-4">
                                <div className="mb-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Editing: <span className="font-semibold text-slate-900 dark:text-white">{selectedTeamForEdit.teamName}</span>
                                    </p>
                                </div>

                                {/* Primary Selection */}
                                <div className="space-y-2">
                                    <Label className="text-slate-900 dark:text-white flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        Primary On-Call
                                    </Label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {getUsersByRole(selectedTeamForEdit.teamId, 'primary').map(member => {
                                            const isSelected = editData.primaryUser === member.id;
                                            return (
                                                <div
                                                    key={member.id}
                                                    onClick={() => setEditData({ ...editData, primaryUser: isSelected ? '' : member.id })}
                                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 transition-all ${
                                                        isSelected
                                                            ? 'bg-green-50 dark:bg-green-900/30 border-green-500'
                                                            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:border-green-300'
                                                    }`}
                                                >
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                                        isSelected ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-slate-600'
                                                    }`}>
                                                        {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                                                    </div>
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={member.avatarUrl} />
                                                        <AvatarFallback className="text-xs bg-green-500 text-white">
                                                            {member.firstName[0]}{member.lastName[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                                                            {member.firstName} {member.lastName}
                                                        </p>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">{member.email}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {getUsersByRole(selectedTeamForEdit.teamId, 'primary').length === 0 && (
                                            <p className="text-sm text-slate-500 text-center py-4">No primary users available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Backup Selection */}
                                <div className="space-y-2">
                                    <Label className="text-slate-900 dark:text-white flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        Backup On-Call
                                    </Label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {getUsersByRole(selectedTeamForEdit.teamId, 'backup').map(member => {
                                            const isSelected = editData.backupUser === member.id;
                                            return (
                                                <div
                                                    key={member.id}
                                                    onClick={() => setEditData({ ...editData, backupUser: isSelected ? '' : member.id })}
                                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 transition-all ${
                                                        isSelected
                                                            ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-500'
                                                            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:border-yellow-300'
                                                    }`}
                                                >
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                                        isSelected ? 'bg-yellow-500 border-yellow-500' : 'border-slate-300 dark:border-slate-600'
                                                    }`}>
                                                        {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                                                    </div>
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={member.avatarUrl} />
                                                        <AvatarFallback className="text-xs bg-yellow-500 text-white">
                                                            {member.firstName[0]}{member.lastName[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                                                            {member.firstName} {member.lastName}
                                                        </p>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">{member.email}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {getUsersByRole(selectedTeamForEdit.teamId, 'backup').length === 0 && (
                                            <p className="text-sm text-slate-500 text-center py-4">No backup users available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Escalation Selection */}
                                <div className="space-y-2">
                                    <Label className="text-slate-900 dark:text-white flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                        Escalation Contacts
                                    </Label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {getUsersByRole(selectedTeamForEdit.teamId, 'escalation').map(member => {
                                            const isSelected = editData.escalationUsers.includes(member.id);
                                            return (
                                                <div
                                                    key={member.id}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setEditData({
                                                                ...editData,
                                                                escalationUsers: editData.escalationUsers.filter(id => id !== member.id)
                                                            });
                                                        } else {
                                                            setEditData({
                                                                ...editData,
                                                                escalationUsers: [...editData.escalationUsers, member.id]
                                                            });
                                                        }
                                                    }}
                                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 transition-all ${
                                                        isSelected
                                                            ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-500'
                                                            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:border-orange-300'
                                                    }`}
                                                >
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                                        isSelected ? 'bg-orange-500 border-orange-500' : 'border-slate-300 dark:border-slate-600'
                                                    }`}>
                                                        {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                                                    </div>
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={member.avatarUrl} />
                                                        <AvatarFallback className="text-xs bg-orange-500 text-white">
                                                            {member.firstName[0]}{member.lastName[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                                                            {member.firstName} {member.lastName}
                                                        </p>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">{member.email}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {getUsersByRole(selectedTeamForEdit.teamId, 'escalation').length === 0 && (
                                            <p className="text-sm text-slate-500 text-center py-4">No escalation contacts available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Save/Cancel Buttons */}
                                <div className="flex gap-3 mt-6">
                                    <Button
                                        onClick={() => setIsEditMode(false)}
                                        variant="outline"
                                        className="flex-1 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSaveSchedule}
                                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        {!editData.primaryUser && !editData.backupUser && editData.escalationUsers.length === 0
                                            ? 'Clear Schedule'
                                            : 'Save Schedule'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* Bulk Scheduler Modal */}
            <BulkSchedulerModal
                isOpen={isSchedulerOpen}
                onClose={() => setIsSchedulerOpen(false)}
                team={myTeam}
                onSave={handleSaveBulkSchedule}
            />

            {/* Override Modal */}
            <OverrideModal
                isOpen={isOverrideOpen}
                onClose={() => setIsOverrideOpen(false)}
                team={selectedTeamForEdit}
                selectedDate={overrideDate}
                currentAssignment={overrideAssignment}
                onSave={handleSaveOverride}
            />
        </div>
    );
}

export default OnCallPage;