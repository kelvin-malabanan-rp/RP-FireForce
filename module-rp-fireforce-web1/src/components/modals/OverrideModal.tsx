// components/modals/OverrideModal.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, RefreshCw, CheckCircle, X, UserCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

import type { Team, Assignment } from '../../services/oncallService';

// Helper: safely extract display name and initials from various user shapes
function getDisplayName(user: any): string {
    if (!user) return '';
    return (
        user.firstName || user.first_name || user.given_name || user.name || ''
    ).toString().trim() + (user.lastName || user.last_name ? ' ' + (user.lastName || user.last_name).toString().trim() : '');
}

function getInitials(user: any): string {
    if (!user) return '';
    const first = (user.firstName || user.first_name || user.given_name || '').toString().trim();
    const last = (user.lastName || user.last_name || '').toString().trim();
    const initials = ((first[0] || '') + (last[0] || '')).toUpperCase();
    if (initials) return initials;
    // fallback to derive from email
    const email = (user.email || '').toString();
    if (email) return email[0].toUpperCase();
    return '';
}

interface OverrideModalProps {
    isOpen: boolean;
    onClose: () => void;
    team: Team | null;
    selectedDate: Date | null;
    currentAssignment: Assignment | null;
    onSave: (data: {
        teamId: string;
        scheduleId?: string;
        startTime: string;
        endTime: string;
        userId: string;
        role: 'primary' | 'backup' | 'escalation';
        reason: string;
        originalUserId?: string;
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

export function OverrideModal({ isOpen, onClose, team, selectedDate, currentAssignment, onSave }: OverrideModalProps) {
    const [overrideType, setOverrideType] = useState<'single' | 'multiple'>('single');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [role, setRole] = useState<'primary' | 'backup' | 'escalation'>('primary');
    const [replacementUserId, setReplacementUserId] = useState('');
    const [reason, setReason] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (selectedDate) {
            const dateStr = selectedDate.toISOString().split('T')[0];
            setStartDate(dateStr);
            setEndDate(dateStr);
        }
    }, [selectedDate]);

    const availableUsers = team?.members || [];

    // Resolves the "original user" for a given role/assignment, handling arrays, ids, and user objects
    const resolveOriginalUser = () => {
        const val = currentAssignment?.[role];
        if (!val) return null;

        // If the assignment stored multiple users (e.g., escalation array), handle arrays
        if (Array.isArray(val)) {
            if (val.length === 0) return null;
            // Prefer an element that already looks like a full user object
            const byUserShape = val.find((v: any) => v && (v.id || v.email || v.firstName || v.first_name));
            if (byUserShape) return byUserShape;
            // Otherwise if array contains ids, try to resolve by id using team members
            const asId = val.find((v: any) => typeof v === 'string');
            if (asId) return team?.members?.find((m: any) => String(m.id) === String(asId)) || null;
            // fallback to first element
            return val[0] || null;
        }

        // If it's already a user-like object (contains id or name/email), return it
        if (typeof val === 'object') {
            if (val.id || val.email || val.firstName || val.first_name || val.user_id) {
                // If it has user_id, prefer finding the real user object from team members
                if (val.user_id) {
                    return team?.members?.find((m: any) => String(m.id) === String(val.user_id)) || null;
                }
                return val;
            }
        }

        // If it's a string (likely a user id), look up in team members
        if (typeof val === 'string') {
            return team?.members?.find((m: any) => String(m.id) === String(val)) || null;
        }

        return null;
    };
    const originalUser = resolveOriginalUser();

    const handleSave = async () => {
        if (!team || !startDate || !endDate) return;

        if (!replacementUserId) {
            alert('Please select a replacement user');
            return;
        }

        if (!reason.trim()) {
            alert('Please provide a reason for the override');
            return;
        }

        setIsSaving(true);

        try {
            const startIsoUtc = `${startDate}T00:00:00.000Z`;
            const endIsoUtc = `${endDate}T23:59:59.999Z`;

            if (isNaN(new Date(startIsoUtc).getTime()) || isNaN(new Date(endIsoUtc).getTime())) {
                alert('Invalid date selected');
                setIsSaving(false);
                return;
            }

            const payload = {
                teamId: team.teamId,
                scheduleId: currentAssignment?.scheduleId ?? null,
                startTime: startIsoUtc,
                endTime: endIsoUtc,
                userId: replacementUserId,
                role,
                reason,
                originalUserId: originalUser?.id ?? null,
            };

            await onSave(payload);

            // Reset form
            setReplacementUserId('');
            setReason('');

            onClose();
        } catch (error) {
            console.error('Error creating override:', error);
            alert('Failed to create override. Please try again.');
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
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <UserCheck className="h-6 w-6 text-orange-500" />
                            Schedule Override
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Temporarily replace on-call assignment for {team?.teamName}
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Override Type */}
                <div className="mb-6">
                    <Label className="text-slate-900 dark:text-white mb-3 block">Override Duration</Label>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { value: 'single' as const, label: 'Single Date', icon: Calendar },
                            { value: 'multiple' as const, label: 'Date Range', icon: ChevronRight }
                        ].map(({ value, label, icon: Icon }) => (
                            <button
                                key={value}
                                onClick={() => setOverrideType(value)}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                    overrideType === value
                                        ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-500'
                                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:border-orange-300'
                                }`}
                            >
                                <Icon className={`h-5 w-5 mx-auto mb-2 ${
                                    overrideType === value ? 'text-orange-500' : 'text-slate-400'
                                }`} />
                                <p className={`text-sm font-medium ${
                                    overrideType === value ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'
                                }`}>
                                    {label}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date Selection */}
                <div className="mb-6">
                    {overrideType === 'single' ? (
                        <div>
                            <Label className="text-slate-900 dark:text-white mb-2 block">Override Date</Label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setEndDate(e.target.value);
                                }}
                                className="w-full p-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-slate-900 dark:text-white mb-2 block">Start Date</Label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full p-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <Label className="text-slate-900 dark:text-white mb-2 block">End Date</Label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate}
                                    className="w-full p-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Role Selection */}
                <div className="mb-6">
                    <Label className="text-slate-900 dark:text-white mb-2 block">Role to Override</Label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as 'primary' | 'backup' | 'escalation')}
                        className="w-full p-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                        <option value="primary">Primary</option>
                        <option value="backup">Backup</option>
                        <option value="escalation">Escalation</option>
                    </select>
                </div>

                {/* Original Assignment Info */}
                {originalUser && (
                    <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Currently Assigned:</p>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={originalUser?.avatarUrl ?? originalUser?.avatar_url ?? undefined} />
                                <AvatarFallback className="bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                    {getInitials(originalUser)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">
                                    {getDisplayName(originalUser) || originalUser?.email || 'Unknown'}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">{originalUser?.email ?? ''}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Replacement User */}
                <div className="mb-6">
                    <Label className="text-slate-900 dark:text-white mb-2 block">Replacement User</Label>
                    <select
                        value={replacementUserId}
                        onChange={(e) => setReplacementUserId(e.target.value)}
                        className="w-full p-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                        <option value="">Select a user...</option>
                        {availableUsers.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.firstName} {user.lastName} ({user.email})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Reason */}
                <div className="mb-6">
                    <Label className="text-slate-900 dark:text-white mb-2 block">Reason for Override</Label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Vacation, sick leave, emergency..."
                        rows={3}
                        className="w-full p-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none"
                    />
                </div>

                {/* Date Range Preview */}
                {overrideType === 'multiple' && startDate && endDate && (
                    <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Override will apply to <strong>{generateDateRange(startDate, endDate).length} day(s)</strong>
                        </p>
                    </div>
                )}

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
                        className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Create Override
                            </>
                        )}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}