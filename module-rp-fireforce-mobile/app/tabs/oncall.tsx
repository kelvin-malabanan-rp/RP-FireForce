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
import { CurrentOnCall, OnCallUser, OnCallTeam, OnCallScheduleDay } from '@/types/oncall-types';
import { oncallController } from '@/api/oncall-schedule-controller';
import { FONT_FAMILY } from '@/constants/fonts';
import { retrieveUserSession } from "@/constants/local-storage";
import { LinearGradient } from "expo-linear-gradient";

export default function OnCallTab() {
    const router = useRouter();
    const [currentOnCall, setCurrentOnCall] = useState<CurrentOnCall | null>(null);
    const [schedule, setSchedule] = useState<OnCallScheduleDay[]>([]);
    const [myTeam, setMyTeam] = useState<OnCallTeam | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [hasActiveOnCall, setHasActiveOnCall] = useState(true);
    const [isUserOnCallToday, setIsUserOnCallToday] = useState(false);
    const [userOnCallRole, setUserOnCallRole] = useState<'primary' | 'backup' | null>(null);

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
            Alert.alert('Error', 'Failed to load user information');
        }
    };

    const loadOnCallData = async (userIdParam: string, userEmailParam: string) => {
        try {
            setLoading(true);

            // Get user's team
            const userTeam = await oncallController.getUserTeam(userIdParam);
            if (!userTeam) {
                setHasActiveOnCall(false);
                setLoading(false);
                return;
            }

            setMyTeam(userTeam);

            // Load on-call data for user's team
            const data = await oncallController.loadAllOnCallData(userTeam.id);

            setCurrentOnCall(data.currentOnCall || null);
            setSchedule(data.schedule || []);
            setHasActiveOnCall(true);

            // Check if user is on call TODAY (first day in schedule)
            if (data.schedule && data.schedule.length > 0) {
                const today = data.schedule[0];
                const isPrimary = today.assignment?.primary?.email === userEmailParam;
                const isBackup = today.assignment?.backup?.email === userEmailParam;

                if (isPrimary) {
                    setIsUserOnCallToday(true);
                    setUserOnCallRole('primary');
                } else if (isBackup) {
                    setIsUserOnCallToday(true);
                    setUserOnCallRole('backup');
                } else {
                    setIsUserOnCallToday(false);
                    setUserOnCallRole(null);
                }
            } else {
                setIsUserOnCallToday(false);
                setUserOnCallRole(null);
            }
        } catch (error: any) {
            if (error.message?.includes("No active on-call found")) {
                console.warn('No active on-call schedule');
                setCurrentOnCall(null);
                setSchedule([]);
                setHasActiveOnCall(false);
                return;
            }

            console.error('Error loading on-call data:', error);
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

    const formatUserName = (user: OnCallUser) => `${user.firstName} ${user.lastName}`;

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleString([], {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString([], {
            month: 'short',
            day: 'numeric'
        });
    };

    const handleCreateOverride = () => {
        if (myTeam) {
            router.push({ pathname: '/create-override', params: { teamId: myTeam.id } });
        }
    };

    const handleManageSchedule = () => {
        if (myTeam) {
            router.push({ pathname: '/manage-schedule', params: { teamId: myTeam.id } });
        }
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
                            You&apos;re not assigned to an on-call team yet or there&apos;s no active schedule.
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
                        <Text style={styles.teamSubtitle}>Your On-Call Team</Text>
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
                            colors={userOnCallRole === 'primary' ? ['#10B981', '#059669'] : ['#F59E0B', '#D97706']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.statusGradient}
                        >
                            <View style={styles.statusHeader}>
                                <Ionicons name="shield-checkmark" size={32} color="#FFFFFF" />
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusBadgeText}>
                                        {userOnCallRole === 'primary' ? 'PRIMARY' : 'BACKUP'}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.statusTitle}>You&apos;re On-Call Today!</Text>
                            <Text style={styles.statusSubtitle}>
                                {currentOnCall ? `Until ${formatTime(currentOnCall.endTime)}` : ''}
                            </Text>
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

                {/* Current On-Call Team */}
                {currentOnCall && (
                    <View style={styles.currentOnCallCard}>
                        <Text style={styles.cardTitle}>Currently On-Call</Text>

                        {currentOnCall.primary && (
                            <View style={styles.memberCard}>
                                <View style={styles.memberHeader}>
                                    <View style={styles.memberInfo}>
                                        <View style={styles.avatarContainer}>
                                            <Text style={styles.avatarText}>
                                                {currentOnCall.primary.firstName[0]}{currentOnCall.primary.lastName[0]}
                                            </Text>
                                        </View>
                                        <View style={styles.memberDetails}>
                                            <Text style={styles.memberName}>{formatUserName(currentOnCall.primary)}</Text>
                                            <Text style={styles.memberEmail}>{currentOnCall.primary.email}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.primaryBadge}>
                                        <Ionicons name="star" size={14} color="#FFFFFF" />
                                        <Text style={styles.primaryBadgeText}>Primary</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {currentOnCall.backup && (
                            <View style={[styles.memberCard, { marginTop: 12 }]}>
                                <View style={styles.memberHeader}>
                                    <View style={styles.memberInfo}>
                                        <View style={[styles.avatarContainer, styles.avatarBackup]}>
                                            <Text style={styles.avatarText}>
                                                {currentOnCall.backup.firstName[0]}{currentOnCall.backup.lastName[0]}
                                            </Text>
                                        </View>
                                        <View style={styles.memberDetails}>
                                            <Text style={styles.memberName}>{formatUserName(currentOnCall.backup)}</Text>
                                            <Text style={styles.memberEmail}>{currentOnCall.backup.email}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.backupBadge}>
                                        <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
                                        <Text style={styles.backupBadgeText}>Backup</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Upcoming Schedule */}
                <View style={styles.scheduleCard}>
                    <View style={styles.cardTitleRow}>
                        <Text style={styles.cardTitle}>7-Day Schedule</Text>
                        <Ionicons name="calendar-outline" size={20} color="#F97316" />
                    </View>

                    {schedule.map((day, index) => {
                        const isToday = index === 0;
                        const isFirstItem = index === 0;

                        return (
                            <View
                                key={index}
                                style={[
                                    styles.scheduleItem,
                                    isToday && styles.scheduleItemToday,
                                    isFirstItem && styles.scheduleItemFirst
                                ]}
                            >
                                <View style={styles.scheduleDate}>
                                    {isToday && (
                                        <View style={styles.todayDot} />
                                    )}
                                    <Text style={[styles.scheduleDayOfWeek, isToday && styles.todayText]}>
                                        {day.dayOfWeek}
                                    </Text>
                                    <Text style={[styles.scheduleDateText, isToday && styles.todayText]}>
                                        {day.date}
                                    </Text>
                                </View>

                                <View style={styles.scheduleAssignments}>
                                    {day.assignment ? (
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
        fontWeight: '700',
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
        fontWeight: '600',
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
        fontWeight: '700',
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
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    statusTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    statusSubtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
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
        fontWeight: '600',
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
    currentOnCallCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 16,
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    cardTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    memberCard: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    memberHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    avatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    memberDetails: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
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
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    primaryBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    backupBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F59E0B',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    backupBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    scheduleCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 50,
        borderWidth: 1,
        borderColor: '#334155',
    },
    scheduleItem: {
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
    scheduleDate: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    todayDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F97316',
    },
    scheduleDayOfWeek: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    scheduleDateText: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    todayText: {
        color: '#F97316',
    },
    scheduleAssignments: {
        flex: 1,
        gap: 8,
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
        fontWeight: '700',
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
    actionsCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    actionButtonText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
});