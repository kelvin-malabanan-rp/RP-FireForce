// components/pages/OnCallPage.tsx
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import React from "react";
import { motion } from "framer-motion";
import {
    Shield, Calendar, ChevronLeft, ChevronRight, UserCheck, Loader2, RefreshCw,
    AlertCircle, Plus, Users, CheckCircle, X, Edit2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Label } from "../ui/label";
import { onCallService, Team, Assignment, TeamMember } from "../../services/on-call-service";

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

    const [editData, setEditData] = useState({
        primaryUser: '',
        backupUser: '',
        escalationUsers: [] as string[],
    });

    const lastLoadRef = useRef<number>(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const calendarResponse = await onCallService.getCalendarData(30);

            if (!calendarResponse.success || !calendarResponse.data) {
                throw new Error('Failed to load calendar data');
            }

            setTeams(calendarResponse.data);

            // Find user's team
            const userStr = localStorage.getItem('user');
            const currentUserId = userStr ? JSON.parse(userStr).id : null;

            if (currentUserId) {
                const userTeam = calendarResponse.data.find((team: Team) =>
                    team.members?.some(m => m.id === currentUserId)
                );
                setMyTeam(userTeam || null);
            }

            lastLoadRef.current = Date.now();

        } catch (error: any) {
            console.error('❌ Error loading on-call data:', error);
            setError(error.message || 'Failed to load on-call data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getTeamMembers = useCallback((teamId: string): TeamMember[] => {
        const team = teams.find(t => t.teamId === teamId);
        return team?.members || [];
    }, [teams]);

    const getUsersByRole = useCallback((teamId: string, role: 'primary' | 'backup' | 'escalation'): TeamMember[] => {
        const members = getTeamMembers(teamId);
        return members.filter(m => m.role?.toLowerCase() === role.toLowerCase());
    }, [getTeamMembers]);

    const filteredTeams = useMemo(() => {
        if (selectedTeam === 'my-team' && myTeam) return [myTeam];
        if (selectedTeam === 'all') return teams;
        return teams.filter(t => t.teamId === selectedTeam);
    }, [teams, selectedTeam, myTeam]);

    const today = useMemo(() => new Date().toISOString().split('T')[0], []);

    const formatDateKey = useCallback((date: Date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }, []);

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

            // Prepare payload with clearDate when removing all assignments
            const payload: any = {
                scheduleId,
                teamId: selectedTeamForEdit.teamId,
                assignments
            };

            // If no assignments selected, add clearDate to remove the date
            if (assignments.length === 0) {
                payload.clearDate = dateKey;
            }

            const result = await onCallService.updateSchedule(payload);

            if (result.success) {
                closeModals();
                setTimeout(() => loadData(), 300);
            } else {
                throw new Error(result.message || 'Failed to update schedule');
            }
        } catch (error: any) {
            console.error('Error updating schedule:', error);
            alert(error.message || 'Failed to update schedule');
        }
    };

    const calendarDays = useMemo(() => {
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        const days: React.ReactElement[] = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-24"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateKey = formatDateKey(date);
            const isToday = new Date().toDateString() === date.toDateString();

            const dayAssignments = filteredTeams.map(team => {
                const daySchedule = team.schedule.find(s => s.date === dateKey);
                return { team, assignment: daySchedule?.assignment || null };
            }).filter(item => item.assignment !== null);

            const hasAnyAssignment = dayAssignments.length > 0;

            days.push(
                <motion.div
                    key={day}
                    whileHover={{ scale: 1.02 }}
                    className={`h-24 border rounded-lg cursor-pointer relative p-2 transition-all ${
                        isToday
                            ? 'bg-blue-500/20 border-blue-500 dark:bg-blue-500/20'
                            : hasAnyAssignment
                                ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-600 hover:border-blue-500'
                                : 'bg-white dark:bg-slate-800/20 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                    }`}
                    onClick={() => handleDateClick(day)}
                >
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-semibold ${
                            isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                            {day}
                        </span>
                        {isToday && (
                            <Badge className="bg-blue-500 text-white text-xs px-1.5 py-0 h-4">Today</Badge>
                        )}
                    </div>

                    {hasAnyAssignment && (
                        <div className="space-y-1">
                            {selectedTeam === 'all' ? (
                                // All Teams view - show only team names
                                <>
                                    {dayAssignments.slice(0, 3).map((item, idx) => {
                                        const teamIndex = teams.findIndex(t => t.teamId === item.team.teamId);
                                        const teamColor = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'][teamIndex % 5];

                                        return (
                                            <div key={idx} className="flex items-center gap-1.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${teamColor} flex-shrink-0`} />
                                                <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                                                    {item.team.teamName}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {dayAssignments.length > 3 && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                                            +{dayAssignments.length - 3}
                                        </p>
                                    )}
                                </>
                            ) : (
                                // My Team view - show all roles
                                <>
                                    {dayAssignments[0]?.assignment?.primary && (
                                        <div className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                            <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                                                {dayAssignments[0].assignment.primary.firstName}
                                            </span>
                                        </div>
                                    )}
                                    {dayAssignments[0]?.assignment?.backup && (
                                        <div className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0" />
                                            <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                                {dayAssignments[0].assignment.backup.firstName}
                                            </span>
                                        </div>
                                    )}
                                    {dayAssignments[0]?.assignment?.escalation && dayAssignments[0].assignment.escalation.length > 0 && (
                                        <div className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                                            <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                                {dayAssignments[0].assignment.escalation[0].firstName}
                                                {dayAssignments[0].assignment.escalation.length > 1 && ` +${dayAssignments[0].assignment.escalation.length - 1}`}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </motion.div>
            );
        }

        return days;
    }, [currentDate, filteredTeams, formatDateKey, handleDateClick, selectedTeam, teams]);

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
                    <RefreshCw className="h-4 w-4 mr-2" />Retry
                </Button>
            </div>
        );
    }

    const teamToDisplay = filteredTeams[0];

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
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadData}
                        className="text-slate-900 dark:text-white border-slate-200 dark:border-slate-700"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
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
                        : 'text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'}
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
                        : 'text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'}
                >
                    All Teams ({teams.length})
                </Button>
            </div>

            {/* Calendar */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                            <Calendar className="h-5 w-5" />
                            {selectedTeam === 'all'
                                ? 'All Teams Schedule'
                                : selectedTeam === 'my-team' && myTeam
                                    ? myTeam.teamName
                                    : teamToDisplay?.teamName || 'Schedule'}
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
                    {/* Week headers */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="h-10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{day}</span>
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-2">{calendarDays}</div>

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

            {/* Schedule Detail/Edit Modal */}
            {isScheduleModalOpen && selectedDate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModals}>
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
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

                        {/* View Mode */}
                        {!isEditMode && (
                            <div className="space-y-4">
                                {filteredTeams.map((team) => {
                                    const selectedDateAssignment = team.schedule.find(s => s.date === formatDateKey(selectedDate))?.assignment;

                                    return (
                                        <div key={team.teamId} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/30">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-semibold text-slate-900 dark:text-white">{team.teamName}</h4>
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

                        {/* Edit Mode */}
                        {isEditMode && selectedTeamForEdit && (
                            <div className="space-y-4">
                                <div className="mb-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Editing: <span className="font-semibold text-slate-900 dark:text-white">{selectedTeamForEdit.teamName}</span>
                                    </p>
                                </div>

                                {/* Primary */}
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
                                                    onClick={() => {
                                                        // Toggle selection - allow uncheck
                                                        setEditData({
                                                            ...editData,
                                                            primaryUser: isSelected ? '' : member.id
                                                        });
                                                    }}
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

                                {/* Backup */}
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
                                                    onClick={() => {
                                                        // Toggle selection - allow uncheck
                                                        setEditData({
                                                            ...editData,
                                                            backupUser: isSelected ? '' : member.id
                                                        });
                                                    }}
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

                                {/* Escalation */}
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

                                {/* Action Buttons */}
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
        </div>
    );
}

export default OnCallPage;