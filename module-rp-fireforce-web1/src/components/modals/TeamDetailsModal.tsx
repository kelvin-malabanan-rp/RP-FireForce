// components/modals/TeamDetailsModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Shield, Mail, Circle, UserPlus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { teamManagementService } from '../../services';

interface TeamMember {
    id: string;
    userId: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    email: string;
    role: 'primary' | 'backup' | 'escalation';
    orderIndex?: number;
    is_online?: boolean;
    avatar?: string;
    avatarUrl?: string;
    isActive?: boolean;
}

interface Team {
    id: string;
    name: string;
    description?: string;
    members: TeamMember[];
    timezone?: string;
    location?: string;
    created_at?: string;
    updated_at?: string;
}

interface TeamDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    team: Team | null;
    onTeamUpdated?: () => void;
}

export const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({
                                                                      isOpen,
                                                                      onClose,
                                                                      team,
                                                                      onTeamUpdated
                                                                  }) => {
    const [detailedMembers, setDetailedMembers] = useState<TeamMember[]>([]);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<'primary' | 'backup' | 'escalation'>('backup');
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Load detailed team members when modal opens
    useEffect(() => {
        if (isOpen && team) {
            loadDetailedMembers();
            loadAvailableUsers();
        }
    }, [isOpen, team?.id]);

    const loadDetailedMembers = async () => {
        if (!team) return;

        try {
            setIsLoading(true);
            const response = await teamManagementService.getTeamMembers(team.id);

            if (response.success && response.data) {
                setDetailedMembers(response.data);
            }
        } catch (error) {
            console.error('Error loading team members:', error);
            showNotification('error', 'Failed to load team members');
        } finally {
            setIsLoading(false);
        }
    };

    const loadAvailableUsers = async () => {
        try {
            const response = await teamManagementService.getAvailableUsers();

            if (response.success && response.data) {
                setAvailableUsers(response.data);
            }
        } catch (error) {
            console.error('Error loading available users:', error);
        }
    };

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleAddMember = async () => {
        if (!team || !selectedUserId) {
            showNotification('error', 'Please select a user');
            return;
        }

        try {
            setIsLoading(true);
            const response = await teamManagementService.addMemberToTeam(
                selectedUserId,
                team.id,
                selectedRole
            );

            if (response.success) {
                showNotification('success', response.message);
                setShowAddMember(false);
                setSelectedUserId('');
                setSelectedRole('backup');
                await loadDetailedMembers();
                await loadAvailableUsers();
                onTeamUpdated?.();
            } else {
                showNotification('error', response.message);
            }
        } catch (error: any) {
            console.error('Error adding member:', error);
            showNotification('error', error.message || 'Failed to add member');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveMember = async (userId: string, memberName: string) => {
        if (!team) return;

        if (!confirm(`Are you sure you want to remove ${memberName} from this team?`)) {
            return;
        }

        try {
            setIsLoading(true);
            const response = await teamManagementService.removeMemberFromTeam(userId, team.id);

            if (response.success) {
                showNotification('success', `${memberName} removed from team`);
                await loadDetailedMembers();
                await loadAvailableUsers();
                onTeamUpdated?.();
            } else {
                showNotification('error', response.message);
            }
        } catch (error: any) {
            console.error('Error removing member:', error);
            showNotification('error', error.message || 'Failed to remove member');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangeRole = async (userId: string, newRole: 'primary' | 'backup' | 'escalation', currentRole: string) => {
        if (!team || newRole === currentRole) return;

        try {
            setIsLoading(true);
            const response = await teamManagementService.changeTeamRole(userId, team.id, newRole);

            if (response.success) {
                showNotification('success', `Role changed to ${newRole}`);
                await loadDetailedMembers();
                onTeamUpdated?.();
            } else {
                showNotification('error', response.message);
            }
        } catch (error: any) {
            console.error('Error changing role:', error);
            showNotification('error', error.message || 'Failed to change role');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !team) return null;

    // Use detailed members if loaded, otherwise fallback to team.members
    const displayMembers = detailedMembers.length > 0 ? detailedMembers : team.members;

    // Helper to get full name from member
    const getFullName = (member: TeamMember): string => {
        if (member.displayName) return member.displayName;
        if (member.name) return member.name;
        if (member.firstName && member.lastName) {
            return `${member.firstName} ${member.lastName}`;
        }
        if (member.firstName) return member.firstName;
        if (member.lastName) return member.lastName;
        return member.email || 'Unknown';
    };

    const getInitials = (member: TeamMember): string => {
        if (member.firstName && member.lastName) {
            return (member.firstName[0] + member.lastName[0]).toUpperCase();
        }

        const name = member.displayName || member.name || member.firstName || member.lastName || member.email || '??';

        if (!name || typeof name !== 'string') return '??';

        const parts = name.trim().split(' ').filter(n => n.length > 0);
        if (parts.length === 0) return '??';

        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }

        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role?.toLowerCase()) {
            case 'primary':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
            case 'backup':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
            case 'escalation':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
            default:
                return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600';
        }
    };

    const getRoleLabel = (role: string) => {
        if (!role) return 'Member';
        return role.charAt(0).toUpperCase() + role.slice(1);
    };

    const sortedMembers = [...displayMembers].sort((a, b) => {
        // Primary first, then backup, then escalation
        const roleOrder = { primary: 1, backup: 2, escalation: 3 };
        const aOrder = roleOrder[a.role as keyof typeof roleOrder] || 4;
        const bOrder = roleOrder[b.role as keyof typeof roleOrder] || 4;

        if (aOrder !== bOrder) return aOrder - bOrder;

        // Then by order index
        if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
            return a.orderIndex - b.orderIndex;
        }

        // Then by online status
        if (a.is_online && !b.is_online) return -1;
        if (!a.is_online && b.is_online) return 1;

        // Then alphabetically
        return getFullName(a).localeCompare(getFullName(b));
    });

    const onlineCount = displayMembers?.filter(m => m.is_online).length || 0;
    const totalCount = displayMembers?.length || 0;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
                >
                    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xl">
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 px-6 py-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-white/20 rounded-lg">
                                            <Users className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">{team.name}</h2>
                                            {team.description && (
                                                <p className="text-blue-100 text-sm mt-1">{team.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                                            <Users className="h-3 w-3 mr-1" />
                                            {totalCount} Members
                                        </Badge>
                                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                                            <Circle className="h-3 w-3 mr-1 fill-green-400 text-green-400" />
                                            {onlineCount} Online
                                        </Badge>
                                        {team.location && (
                                            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                                                {team.location}
                                            </Badge>
                                        )}
                                        {team.timezone && (
                                            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                                                {team.timezone}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="text-white hover:bg-white/20 hover:text-white flex-shrink-0"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Notification Toast */}
                        <AnimatePresence>
                            {notification && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className={`mx-6 mt-4 p-4 rounded-lg border flex items-center gap-3 ${
                                        notification.type === 'success'
                                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-400'
                                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
                                    }`}
                                >
                                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                    <p className="text-sm font-medium">{notification.message}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Content */}
                        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
                            {/* Add Member Section */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Team Members</h3>
                                    <Button
                                        size="sm"
                                        onClick={() => setShowAddMember(!showAddMember)}
                                        disabled={isLoading}
                                        className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                                    >
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Add Member
                                    </Button>
                                </div>

                                {/* Add Member Form */}
                                <AnimatePresence>
                                    {showAddMember && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mb-4 overflow-hidden"
                                        >
                                            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-slate-900 dark:text-white">
                                                            Select User
                                                        </label>
                                                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                                            <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                                                <SelectValue placeholder="Choose a user..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {availableUsers.length === 0 ? (
                                                                    <div className="px-2 py-6 text-center text-sm text-slate-600 dark:text-slate-400">
                                                                        No available users
                                                                    </div>
                                                                ) : (
                                                                    availableUsers.map((user) => (
                                                                        <SelectItem key={user.id} value={user.id}>
                                                                            {user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                                                                        </SelectItem>
                                                                    ))
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-slate-900 dark:text-white">
                                                            Role
                                                        </label>
                                                        <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val as any)}>
                                                            <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="primary">Primary</SelectItem>
                                                                <SelectItem value="backup">Backup</SelectItem>
                                                                <SelectItem value="escalation">Escalation</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={handleAddMember}
                                                        disabled={!selectedUserId || isLoading}
                                                        className="bg-blue-500 hover:bg-blue-600 text-white"
                                                    >
                                                        Add Member
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setShowAddMember(false);
                                                            setSelectedUserId('');
                                                            setSelectedRole('backup');
                                                        }}
                                                        className="border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Members List */}
                            {isLoading && detailedMembers.length === 0 ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="h-24 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
                                    ))}
                                </div>
                            ) : sortedMembers.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full inline-block mb-4">
                                        <Users className="h-12 w-12 text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <p className="text-lg font-medium text-slate-900 dark:text-white">No members found</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                        Add your first member to get started
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {sortedMembers.map((member, index) => {
                                        const fullName = getFullName(member);
                                        const isPrimary = member.role === 'primary';

                                        return (
                                            <motion.div
                                                key={member.userId || member.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05, duration: 0.3 }}
                                            >
                                                <Card className={`
                          bg-white dark:bg-slate-900 
                          border-slate-200 dark:border-slate-700 
                          hover:shadow-lg hover:border-blue-500/50 dark:hover:border-blue-500/50
                          transition-all duration-200
                          ${isPrimary ? 'ring-2 ring-blue-500/20' : ''}
                        `}>
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start gap-3">
                                                            {/* Avatar with Status */}
                                                            <div className="relative flex-shrink-0">
                                                                <Avatar className={`
                                  h-14 w-14 
                                  ${isPrimary ? 'ring-2 ring-blue-500' : 'ring-2 ring-slate-200 dark:ring-slate-700'}
                                `}>
                                                                    <AvatarImage src={member.avatarUrl || member.avatar} alt={fullName} />
                                                                    <AvatarFallback className={`
                                    text-base font-semibold
                                    ${isPrimary
                                                                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                                                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                                                                    }
                                  `}>
                                                                        {getInitials(member)}
                                                                    </AvatarFallback>
                                                                </Avatar>

                                                                {/* Online status indicator */}
                                                                <div className={`
                                  absolute -bottom-0.5 -right-0.5 
                                  h-4 w-4 rounded-full border-2 border-white dark:border-slate-900
                                  ${member.is_online ? 'bg-green-500' : 'bg-slate-400 dark:bg-slate-600'}
                                `} />
                                                            </div>

                                                            {/* Member Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                                                                        {fullName}
                                                                    </h3>
                                                                    {isPrimary && (
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 flex-shrink-0"
                                                                        >
                                                                            <Shield className="h-3 w-3 mr-1" />
                                                                            Primary
                                                                        </Badge>
                                                                    )}
                                                                </div>

                                                                <div className="space-y-2">
                                                                    {/* Email */}
                                                                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                                                        <Mail className="h-3 w-3 flex-shrink-0" />
                                                                        <span className="truncate">{member.email}</span>
                                                                    </div>

                                                                    {/* Role Selector */}
                                                                    <div className="flex items-center gap-2">
                                                                        <Select
                                                                            value={member.role}
                                                                            onValueChange={(newRole) =>
                                                                                handleChangeRole(member.userId || member.id, newRole as any, member.role)
                                                                            }
                                                                            disabled={isLoading}
                                                                        >
                                                                            <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                                                                <SelectValue>
                                                                                    <Badge variant="outline" className={getRoleBadgeColor(member.role)}>
                                                                                        {getRoleLabel(member.role)}
                                                                                    </Badge>
                                                                                </SelectValue>
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="primary">Primary</SelectItem>
                                                                                <SelectItem value="backup">Backup</SelectItem>
                                                                                <SelectItem value="escalation">Escalation</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>

                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => handleRemoveMember(member.userId || member.id, fullName)}
                                                                            disabled={isLoading}
                                                                            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>

                                                                    {/* Status */}
                                                                    <div className="flex items-center gap-2 text-xs">
                                    <span className={`
                                      font-medium
                                      ${member.is_online
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-slate-500 dark:text-slate-500'
                                    }
                                    `}>
                                      {member.is_online ? 'Online' : 'Offline'}
                                    </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>

                        {/* Footer */}
                        <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Showing {sortedMembers.length} member{sortedMembers.length !== 1 ? 's' : ''}
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default TeamDetailsModal;