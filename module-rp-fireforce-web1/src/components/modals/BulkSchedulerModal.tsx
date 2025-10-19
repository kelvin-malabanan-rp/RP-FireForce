// components/modals/BulkSchedulerModal.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, RefreshCw, CheckCircle, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import type { Team } from '../../services/oncallService';

interface BulkSchedulerModalProps {
    isOpen: boolean;
    onClose: () => void;
    team: Team | null;
    onSave: (data: {
        scheduleId: string;
        teamId: string;
        assignments: Array<{
            userId: string;
            role: 'primary' | 'backup' | 'escalation';
            dates: string[];
        }>;
    }) => Promise<void>;
}

// Utility: Generate date range array
const generateDateRange = (startDate: string, endDate: string): string[] => {
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }

    return dates;
};

export function BulkSchedulerModal({ isOpen, onClose, team, onSave }: BulkSchedulerModalProps) {
    const [scheduleType, setScheduleType] = useState<'single' | 'range' | 'recurring'>('single');
    const [singleDate, setSingleDate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedPrimary, setSelectedPrimary] = useState('');
    const [selectedBackup, setSelectedBackup] = useState('');
    const [selectedEscalation, setSelectedEscalation] = useState<string[]>([]);
    const [recurringPattern, setRecurringPattern] = useState<'daily' | 'weekly' | 'biweekly'>('daily');
    const [isSaving, setIsSaving] = useState(false);

    const primaryUsers = team?.members?.filter(m => m.role === 'primary') || [];
    const backupUsers = team?.members?.filter(m => m.role === 'backup') || [];
    const escalationUsers = team?.members?.filter(m => m.role === 'escalation') || [];

    const handleSave = async () => {
        if (!team) return;

        if (!selectedPrimary && !selectedBackup && selectedEscalation.length === 0) {
            alert('Please select at least one person for the schedule');
            return;
        }

        setIsSaving(true);

        try {
            let dates: string[] = [];

            // Generate dates based on schedule type
            if (scheduleType === 'single') {
                if (!singleDate) {
                    alert('Please select a date');
                    return;
                }
                dates = [singleDate];
            } else if (scheduleType === 'range') {
                if (!startDate || !endDate) {
                    alert('Please select start and end dates');
                    return;
                }
                dates = generateDateRange(startDate, endDate);
            } else if (scheduleType === 'recurring') {
                if (!startDate || !endDate) {
                    alert('Please select start and end dates');
                    return;
                }
                const allDates = generateDateRange(startDate, endDate);

                // Filter based on recurring pattern
                if (recurringPattern === 'daily') {
                    dates = allDates;
                } else if (recurringPattern === 'weekly') {
                    dates = allDates.filter((_, index) => index % 7 === 0);
                } else if (recurringPattern === 'biweekly') {
                    dates = allDates.filter((_, index) => index % 14 === 0);
                }
            }

            // Build assignments array
            const assignments: Array<{
                userId: string;
                role: 'primary' | 'backup' | 'escalation';
                dates: string[];
            }> = [];

            if (selectedPrimary) {
                assignments.push({ userId: selectedPrimary, role: 'primary', dates });
            }

            if (selectedBackup) {
                assignments.push({ userId: selectedBackup, role: 'backup', dates });
            }

            selectedEscalation.forEach(userId => {
                assignments.push({ userId, role: 'escalation', dates });
            });

            // Get scheduleId from team's first schedule entry
            const scheduleId = team.schedule.find(s => s.assignment?.scheduleId)?.assignment?.scheduleId || '';

            if (!scheduleId) {
                alert('No active schedule found for this team. Please create a schedule first.');
                return;
            }

            await onSave({
                scheduleId,
                teamId: team.teamId,
                assignments
            });

            // Reset form
            setSingleDate('');
            setStartDate('');
            setEndDate('');
            setSelectedPrimary('');
            setSelectedBackup('');
            setSelectedEscalation([]);

            onClose();
        } catch (error) {
            console.error('Error saving schedule:', error);
            alert('Failed to save schedule. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Bulk Scheduler</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Schedule on-call assignments for {team?.teamName}
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-600 dark:text-slate-400">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Schedule Type Selection */}
                <div className="mb-6">
                    <Label className="text-slate-900 dark:text-white mb-3 block">Schedule Type</Label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { value: 'single' as const, label: 'Single Date', icon: Calendar },
                            { value: 'range' as const, label: 'Date Range', icon: ChevronRight },
                            { value: 'recurring' as const, label: 'Recurring', icon: RefreshCw }
                        ].map(({ value, label, icon: Icon }) => (
                            <button
                                key={value}
                                onClick={() => setScheduleType(value)}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                    scheduleType === value
                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
                                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                }`}
                            >
                                <Icon className={`h-5 w-5 mx-auto mb-2 ${
                                    scheduleType === value ? 'text-blue-500' : 'text-slate-400'
                                }`} />
                                <p className={`text-sm font-medium ${
                                    scheduleType === value ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                                }`}>
                                    {label}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date Selection */}
                <div className="mb-6">
                    {scheduleType === 'single' && (
                        <div>
                            <Label className="text-slate-900 dark:text-white mb-2 block">Select Date</Label>
                            <input
                                type="date"
                                value={singleDate}
                                onChange={(e) => setSingleDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full p-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                        </div>
                    )}

                    {(scheduleType === 'range' || scheduleType === 'recurring') && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-slate-900 dark:text-white mb-2 block">Start Date</Label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full p-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <Label className="text-slate-900 dark:text-white mb-2 block">End Date</Label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate || new Date().toISOString().split('T')[0]}
                                    className="w-full p-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                    )}

                    {scheduleType === 'recurring' && (
                        <div className="mt-4">
                            <Label className="text-slate-900 dark:text-white mb-2 block">Recurring Pattern</Label>
                            <select
                                value={recurringPattern}
                                onChange={(e) => setRecurringPattern(e.target.value as 'daily' | 'weekly' | 'biweekly')}
                                className="w-full p-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            >
                                <option value="daily">Every Day</option>
                                <option value="weekly">Every Week</option>
                                <option value="biweekly">Every 2 Weeks</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Role Assignment */}
                <div className="space-y-4 mb-6">
                    {/* Primary */}
                    <div>
                        <Label className="text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            Primary On-Call
                        </Label>
                        <select
                            value={selectedPrimary}
                            onChange={(e) => setSelectedPrimary(e.target.value)}
                            className="w-full p-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                            <option value="">None</option>
                            {primaryUsers.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Backup */}
                    <div>
                        <Label className="text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            Backup On-Call
                        </Label>
                        <select
                            value={selectedBackup}
                            onChange={(e) => setSelectedBackup(e.target.value)}
                            className="w-full p-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                            <option value="">None</option>
                            {backupUsers.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Escalation */}
                    <div>
                        <Label className="text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            Escalation Contacts (Multiple)
                        </Label>
                        <div className="space-y-2 max-h-48 overflow-y-auto border-2 border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-900">
                            {escalationUsers.map(user => {
                                const isSelected = selectedEscalation.includes(user.id);
                                return (
                                    <div
                                        key={user.id}
                                        onClick={() => {
                                            setSelectedEscalation(prev =>
                                                isSelected
                                                    ? prev.filter(id => id !== user.id)
                                                    : [...prev, user.id]
                                            );
                                        }}
                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                                            isSelected
                                                ? 'bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-500'
                                                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                            isSelected ? 'bg-orange-500 border-orange-500' : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                            {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-slate-900 dark:text-white">
                                                {user.firstName} {user.lastName}
                                            </p>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">{user.email}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {escalationUsers.length === 0 && (
                                <p className="text-sm text-slate-500 text-center py-4">No escalation contacts available</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="flex-1 border-slate-200 dark:border-slate-700"
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Create Schedule
                            </>
                        )}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}