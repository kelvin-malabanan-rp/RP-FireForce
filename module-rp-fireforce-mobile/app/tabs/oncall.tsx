import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    StatusBar,
    ActivityIndicator,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CurrentOnCall, OnCallUser, OnCallTeam } from '@/types/oncall-types';
import { oncallController, getTeamDetails } from '@/api/oncall-schedule-controller';
import { FONT_FAMILY } from '@/constants/fonts';
import { retrieveUserSession } from "@/constants/local-storage";
import { LinearGradient } from "expo-linear-gradient";

export default function OnCallTab() {
    const router = useRouter();
    const [currentOnCall, setCurrentOnCall] = useState<CurrentOnCall | null>(null);
    const [myTeam, setMyTeam] = useState<any>(null);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [schedule, setSchedule] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [hasActiveOnCall, setHasActiveOnCall] = useState(false);
    const [isUserOnCallToday, setIsUserOnCallToday] = useState(false);
    const [userOnCallRole, setUserOnCallRole] = useState<'primary' | 'backup' | 'escalation' | null>(null);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const session = await retrieveUserSession();
            if (session?.id && session?.email) {
                setUserId(session.id);
                setUserEmail(session.email);
                await loadOnCallData(session.id, session.email);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            setLoading(false);
        }
    };

    // ✅ Build 7-day schedule from members' assigned dates
    const build7DaySchedule = (members: any[]) => {
        const scheduleData = [];
        const today = new Date();

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateString = date.toISOString().split('T')[0];

            const primary = members.find(m =>
                m.role === 'primary' && m.assignedDates?.includes(dateString)
            );

            const backup = members.find(m =>
                m.role === 'backup' && m.assignedDates?.includes(dateString)
            );

            scheduleData.push({
                date: dateString,
                dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
                fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                assignment: {
                    primary: primary ? {
                        id: primary.id,
                        email: primary.email,
                        firstName: primary.firstName,
                        lastName: primary.lastName,
                        role: primary.role
                    } : null,
                    backup: backup ? {
                        id: backup.id,
                        email: backup.email,
                        firstName: backup.firstName,
                        lastName: backup.lastName,
                        role: backup.role
                    } : null
                }
            });
        }

        return scheduleData;
    };

    const loadOnCallData = async (userIdParam: string, userEmailParam: string) => {
        try {
            setLoading(true);

            const userTeam = await oncallController.getUserTeam(userIdParam);
            if (!userTeam) {
                setHasActiveOnCall(false);
                setLoading(false);
                return;
            }

            const response = await getTeamDetails(userTeam.id);

            if (response.httpStatus !== 'OK' || !response.data) {
                setHasActiveOnCall(false);
                setLoading(false);
                return;
            }

            const { team, members, currentOnCall: onCall } = response.data;

            // ✅ Sort members: Primary first, then Backup, then Escalation
            const sortedMembers = [...members].sort((a, b) => {
                const roleOrder = { primary: 1, backup: 2, escalation: 3 };
                const aOrder = roleOrder[a.role as keyof typeof roleOrder] || 4;
                const bOrder = roleOrder[b.role as keyof typeof roleOrder] || 4;
                return aOrder - bOrder;
            });

            setMyTeam(team);
            setTeamMembers(sortedMembers);

            const scheduleData = build7DaySchedule(members);
            setSchedule(scheduleData);

            // ✅ IMPROVED: Check user's on-call status from TODAY's schedule
            const today = new Date().toISOString().split('T')[0];
            const todaySchedule = scheduleData.find(day => day.date === today);

            if (todaySchedule && todaySchedule.assignment) {
                setHasActiveOnCall(true);

                // Check if user is on-call today based on TODAY's assignment
                const isPrimary = todaySchedule.assignment.primary?.id === userIdParam ||
                                 todaySchedule.assignment.primary?.email === userEmailParam;
                const isBackup = todaySchedule.assignment.backup?.id === userIdParam ||
                                todaySchedule.assignment.backup?.email === userEmailParam;

                console.log('📅 Today schedule assignment:', todaySchedule.assignment);
                console.log('👤 Current user ID:', userIdParam);
                console.log('📧 Current user email:', userEmailParam);
                console.log('✅ isPrimary:', isPrimary);
                console.log('✅ isBackup:', isBackup);

                if (isPrimary) {
                    setIsUserOnCallToday(true);
                    setUserOnCallRole('primary');
                    console.log('✅ User is PRIMARY on-call today!');
                } else if (isBackup) {
                    setIsUserOnCallToday(true);
                    setUserOnCallRole('backup');
                    console.log('✅ User is BACKUP on-call today!');
                } else {
                    // Check if user is in escalation (from members list)
                    const userMember = members.find((m: any) => m.id === userIdParam || m.email === userEmailParam);
                    if (userMember?.role === 'escalation') {
                        setIsUserOnCallToday(true);
                        setUserOnCallRole('escalation');
                        console.log('✅ User is ESCALATION on-call!');
                    } else {
                        setIsUserOnCallToday(false);
                        setUserOnCallRole(null);
                        console.log('ℹ️ User is not on-call today');
                    }
                }
            } else {
                setHasActiveOnCall(false);
                setIsUserOnCallToday(false);
                setUserOnCallRole(null);
            }

        } catch (error: any) {
            console.error('Error loading on-call data:', error);
            setHasActiveOnCall(false);
            Alert.alert('Error', 'Failed to load on-call data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        if (userId && userEmail) {
            await loadOnCallData(userId, userEmail);
        }
        setRefreshing(false);
    };

    const formatUserName = (user: any) => {
        if (!user) return 'Unknown';
        return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown';
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#F97316" />
                <Text style={styles.loadingText}>Loading your schedule...</Text>
            </View>
        );
    }

    if (!myTeam || !hasActiveOnCall) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <ScrollView
                    contentContainerStyle={styles.emptyScrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#F97316"
                            colors={['#F97316']}
                        />
                    }
                >
                    <View style={styles.emptyStateContainer}>
                        <Ionicons name="calendar-outline" size={80} color="#64748B" />
                        <Text style={styles.emptyStateTitle}>No Active Schedule</Text>
                        <Text style={styles.emptyStateText}>
                            {!myTeam
                                ? "You're not assigned to an on-call team yet."
                                : "There's no active schedule for your team."}
                        </Text>
                        <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
                            <Text style={styles.retryButtonText}>Refresh</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#F97316"
                        colors={['#F97316']}
                    />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Team Header */}
                <View style={styles.teamHeader}>
                    <View style={styles.teamHeaderLeft}>
                        <Ionicons name="people" size={24} color="#F97316" />
                    </View>
                    <View style={styles.teamHeaderText}>
                        <Text style={styles.teamName}>{myTeam.name}</Text>
                        <Text style={styles.teamSubtitle}>
                            {myTeam.memberCount} {myTeam.memberCount === 1 ? 'Member' : 'Members'}
                        </Text>
                    </View>
                    <View style={styles.teamHeaderRight}>
                        <TouchableOpacity onPress={onRefresh}>
                            <Ionicons name="refresh" size={24} color="#F97316" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Your Status Card */}
                {isUserOnCallToday ? (
                    <View style={styles.statusCard}>
                        <LinearGradient
                            colors={
                                userOnCallRole === 'primary'
                                    ? ['#10B981', '#059669']  // Green for Primary
                                    : userOnCallRole === 'backup'
                                    ? ['#F59E0B', '#D97706']  // Orange for Backup
                                    : ['#8B5CF6', '#7C3AED']  // Purple for Escalation
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.statusGradient}
                        >
                            <View style={styles.statusHeader}>
                                <Ionicons name="shield-checkmark" size={32} color="#FFFFFF" />
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusBadgeText}>
                                        {userOnCallRole?.toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.statusTitle}>You&apos;re On-Call Today!</Text>
                        </LinearGradient>
                    </View>
                ) : (
                    <View style={styles.statusCard}>
                        <View style={styles.statusOffDuty}>
                            <Ionicons name="moon-outline" size={32} color="#64748B" />
                            <Text style={styles.statusOffDutyTitle}>You&apos;re Off-Duty</Text>
                            <Text style={styles.statusOffDutySubtitle}>Not on call today</Text>
                        </View>
                    </View>
                )}

                {/* Team Members */}
                {teamMembers.length > 0 && (
                    <View style={styles.scheduleCard}>
                        <View style={styles.cardTitleRow}>
                            <Text style={styles.cardTitle}>Team Members</Text>
                            <Ionicons name="people-outline" size={20} color="#F97316" />
                        </View>

                        {teamMembers.map((member, index) => (
                            <View
                                key={member.id}
                                style={[
                                    styles.teamMemberItem,
                                    index === 0 && styles.scheduleItemFirst,
                                    index === teamMembers.length - 1 && { borderBottomWidth: 0 }
                                ]}
                            >
                                <View style={styles.memberInfo}>
                                    <View style={[
                                        styles.avatarContainer,
                                        member.role === 'backup' && styles.avatarBackup,
                                        member.role === 'escalation' && styles.avatarEscalation
                                    ]}>
                                        <Text style={styles.avatarText}>
                                            {member.firstName?.[0] || '?'}{member.lastName?.[0] || '?'}
                                        </Text>
                                    </View>
                                    <View style={styles.memberDetails}>
                                        <Text style={styles.memberName}>
                                            {member.firstName} {member.lastName}
                                        </Text>
                                        <Text style={styles.memberEmail}>{member.email}</Text>
                                    </View>
                                </View>
                                <View style={[
                                    member.role === 'primary' && styles.primaryBadge,
                                    member.role === 'backup' && styles.backupBadge,
                                    member.role === 'escalation' && styles.escalationBadge
                                ]}>
                                    <Text style={styles.roleBadgeText}>
                                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* 7-Day Schedule */}
                {schedule.length > 0 && (
                    <View style={styles.scheduleCard}>
                        <View style={styles.cardTitleRow}>
                            <Text style={styles.cardTitle}>7-Day Schedule</Text>
                            <Ionicons name="calendar-outline" size={20} color="#F97316" />
                        </View>

                        {schedule.map((day, index) => {
                            const isToday = index === 0;

                            return (
                                <View
                                    key={day.date}
                                    style={[
                                        styles.scheduleItemRow,
                                        isToday && styles.scheduleItemToday,
                                        index === 0 && styles.scheduleItemFirst,
                                        index === schedule.length - 1 && { borderBottomWidth: 0 }
                                    ]}
                                >
                                    <View style={styles.scheduleDateColumn}>
                                        {isToday && <View style={styles.todayDot} />}
                                        <View>
                                            <Text style={[styles.scheduleDayOfWeek, isToday && styles.todayText]}>
                                                {day.dayOfWeek}
                                            </Text>
                                            <Text style={[styles.scheduleDateText, isToday && styles.todayText]}>
                                                {day.fullDate}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.scheduleAssignmentsColumn}>
                                        {day.assignment.primary || day.assignment.backup ? (
                                            <>
                                                {day.assignment.primary && (
                                                    <View style={styles.scheduleAssignment}>
                                                        <View style={styles.scheduleRoleIndicator}>
                                                            <View style={styles.primaryDot} />
                                                            <Text style={styles.scheduleRoleText}>P</Text>
                                                        </View>
                                                        <Text style={styles.schedulePersonName}>
                                                            {formatUserName(day.assignment.primary)}
                                                        </Text>
                                                    </View>
                                                )}
                                                {day.assignment.backup && (
                                                    <View style={styles.scheduleAssignment}>
                                                        <View style={styles.scheduleRoleIndicator}>
                                                            <View style={styles.backupDot} />
                                                            <Text style={styles.scheduleRoleText}>B</Text>
                                                        </View>
                                                        <Text style={styles.schedulePersonName}>
                                                            {formatUserName(day.assignment.backup)}
                                                        </Text>
                                                    </View>
                                                )}
                                            </>
                                        ) : (
                                            <Text style={styles.noAssignmentText}>No assignment</Text>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    scrollContent: {
        paddingBottom: 50,
        paddingTop: Platform.OS === 'ios' ? 100 : 80
    },
    emptyScrollContent: {
        flexGrow: 1,
        paddingTop: Platform.OS === 'ios' ? 100 : 80
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40
    },
    loadingText: {
        fontSize: 16,
        color: '#94A3B8',
        marginTop: 12,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyStateTitle: {
        fontSize: 24,
        color: '#FFFFFF',
        marginTop: 24,
        marginBottom: 12,
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 24,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    retryButton: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#F97316',
        borderRadius: 8,
    },
    retryButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    teamHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    teamHeaderLeft: {
        width: 40,
        alignItems: 'flex-start',
    },
    teamHeaderText: {
        flex: 1,
        alignItems: 'center',
    },
    teamHeaderRight: {
        width: 40,
        alignItems: 'flex-end',
    },
    teamName: {
        fontSize: 20,
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
        textAlign: 'center',
    },
    teamSubtitle: {
        fontSize: 13,
        color: '#94A3B8',
        marginTop: 2,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
        textAlign: 'center',
    },
    statusCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
    },
    statusGradient: {
        padding: 24,
        borderRadius: 16,
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    statusBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusBadgeText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    statusTitle: {
        fontSize: 24,
        color: '#FFFFFF',
        marginBottom: 4,
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    statusOffDuty: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    statusOffDutyTitle: {
        fontSize: 20,
        color: '#FFFFFF',
        marginTop: 12,
        marginBottom: 4,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    statusOffDutySubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    cardTitle: {
        fontSize: 18,
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    cardTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarBackup: {
        backgroundColor: '#F59E0B',
    },
    avatarEscalation: {
        backgroundColor: '#8B5CF6',
    },
    avatarText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    memberDetails: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        color: '#FFFFFF',
        marginBottom: 2,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    memberEmail: {
        fontSize: 13,
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    primaryBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    backupBadge: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    escalationBadge: {
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    roleBadgeText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    scheduleCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    scheduleItemRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
        gap: 16,
    },
    teamMemberItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    scheduleItemToday: {
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        marginHorizontal: -20,
        paddingHorizontal: 20,
        borderBottomColor: '#F97316',
    },
    scheduleItemFirst: {
        paddingTop: 8,
    },
    scheduleDateColumn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minWidth: 90,
    },
    scheduleAssignmentsColumn: {
        flex: 1,
        gap: 8,
    },
    todayDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F97316',
    },
    scheduleDayOfWeek: {
        fontSize: 14,
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    scheduleDateText: {
        fontSize: 13,
        color: '#64748B',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    todayText: {
        color: '#F97316',
    },
    scheduleAssignment: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    scheduleRoleIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    primaryDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
    },
    backupDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#F59E0B',
    },
    scheduleRoleText: {
        fontSize: 11,
        color: '#64748B',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    schedulePersonName: {
        fontSize: 14,
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    noAssignmentText: {
        fontSize: 14,
        color: '#64748B',
        fontStyle: 'italic',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
});