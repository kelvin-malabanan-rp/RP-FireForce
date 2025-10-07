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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CurrentOnCall, OnCallUser, OnCallTeam, OnCallScheduleDay } from '@/types/oncall-types';
import { oncallController } from '@/api/oncall-schedule-controller';
import { FONT_FAMILY } from '@/constants/fonts';
import { retrieveUserSession } from "@/constants/local-storage";
import {LinearGradient} from "expo-linear-gradient";

export default function OnCallTab() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const teamId = (params.teamId as string) || 'team-1';
    const [currentOnCall, setCurrentOnCall] = useState<CurrentOnCall | null>(null);
    const [schedule, setSchedule] = useState<OnCallScheduleDay[]>([]);
    const [teams, setTeams] = useState<OnCallTeam[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState(teamId);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userTeamId, setUserTeamId] = useState<string | null>(null);
    const [hasActiveOnCall, setHasActiveOnCall] = useState(true);

    useEffect(() => {
        loadUserTeam();
    }, []);

    useEffect(() => {
        if (selectedTeamId) {
            loadOnCallData();
        }
    }, [selectedTeamId, userTeamId]);

    const loadUserTeam = async () => {
        try {
            const session = await retrieveUserSession();
            if (session?.id) {
                const userTeam = await oncallController.getUserTeam(session.id);
                if (userTeam) {
                    setUserTeamId(userTeam.id);
                    setSelectedTeamId(userTeam.id);
                }
            }
        } catch (error) {
            console.error('Error loading user team:', error);
        }
    };

    const loadOnCallData = async () => {
        try {
            setLoading(true);
            const data = await oncallController.loadAllOnCallData(selectedTeamId);

            setCurrentOnCall(data.currentOnCall || null);
            setSchedule(data.schedule || []);
            setHasActiveOnCall(true);

            const sortedTeams = userTeamId
                ? [
                    ...data.teams.filter(t => t.id === userTeamId),
                    ...data.teams.filter(t => t.id !== userTeamId)
                ]
                : data.teams;
            setTeams(sortedTeams);
        } catch (error: any) {
            if (error.message?.includes("No active on-call found")) {
                console.warn(`No active on-call for team ${selectedTeamId}`);
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
        await loadUserTeam();
        await loadOnCallData();
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

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'primary': return '#10B981';
            case 'backup': return '#F59E0B';
            case 'escalation': return '#6B7280';
            default: return '#6B7280';
        }
    };

    const getRoleIcon = (role: string): keyof typeof Ionicons.glyphMap => {
        switch (role) {
            case 'primary': return 'star';
            case 'backup': return 'shield-checkmark';
            case 'escalation': return 'arrow-up-circle';
            default: return 'person';
        }
    };

    const handleCreateOverride = () => {
        router.push({ pathname: '/create-override', params: { teamId: selectedTeamId } });
    };

    const handleEscalate = () => {
        router.push({ pathname: '/escalate-incident', params: { teamId: selectedTeamId } });
    };

    const handleManageSchedule = () => {
        router.push({ pathname: '/manage-schedule', params: { teamId: selectedTeamId } });
    };

    const isMyTeam = userTeamId && selectedTeamId === userTeamId;

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#F97316" />
                <Text style={styles.loadingText}>Loading on-call schedule...</Text>
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
                {/* Team Selector */}
                <View style={styles.teamSelector}>
                    <Text style={styles.sectionTitle}>On Call Teams</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {teams.map(team => (
                            <View key={team.id} style={styles.teamButtonWrapper}>
                                {/* Badge outside the button */}
                                {userTeamId === team.id && (
                                    <View style={styles.myTeamBadge}>
                                        <Text style={styles.myTeamBadgeText}>My Team</Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    onPress={() => setSelectedTeamId(team.id)}
                                >
                                    {selectedTeamId === team.id ? (
                                        <LinearGradient
                                            colors={['#F97316', '#DC2626']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.teamButtonActive}
                                        >
                                            <Text style={styles.teamButtonTextActive}>
                                                {team.name}
                                            </Text>
                                        </LinearGradient>
                                    ) : (
                                        <View style={styles.teamButton}>
                                            <Text style={styles.teamButtonText}>
                                                {team.name}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Current On-Call Section */}
                {hasActiveOnCall ? (
                    <>
                        {currentOnCall && (
                            <View style={styles.currentOnCallCard}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.sectionTitle}>Currently On-Call</Text>
                                    <TouchableOpacity onPress={onRefresh}>
                                        <Ionicons name="refresh" size={20} color="#F97316" />
                                    </TouchableOpacity>
                                </View>

                                {currentOnCall.primary && (
                                    <View style={styles.onCallPerson}>
                                        <View style={styles.roleIndicator}>
                                            <Ionicons
                                                name={getRoleIcon('primary')}
                                                size={20}
                                                color={getRoleColor('primary')}
                                            />
                                            <Text style={[styles.roleText, { color: getRoleColor('primary') }]}>
                                                Primary
                                            </Text>
                                        </View>
                                        <Text style={styles.personName}>{formatUserName(currentOnCall.primary)}</Text>
                                        <Text style={styles.personEmail}>{currentOnCall.primary.email}</Text>
                                    </View>
                                )}

                                {currentOnCall.backup && (
                                    <View style={styles.onCallPerson}>
                                        <View style={styles.roleIndicator}>
                                            <Ionicons
                                                name={getRoleIcon('backup')}
                                                size={20}
                                                color={getRoleColor('backup')}
                                            />
                                            <Text style={[styles.roleText, { color: getRoleColor('backup') }]}>
                                                Backup
                                            </Text>
                                        </View>
                                        <Text style={styles.personName}>{formatUserName(currentOnCall.backup)}</Text>
                                        <Text style={styles.personEmail}>{currentOnCall.backup.email}</Text>
                                    </View>
                                )}

                                <View style={styles.timeInfo}>
                                    <Text style={styles.timeLabel}>On-call until:</Text>
                                    <Text style={styles.timeValue}>{formatTime(currentOnCall.endTime)}</Text>
                                </View>
                            </View>
                        )}

                        {/* Upcoming Schedule */}
                        <View style={styles.scheduleCard}>
                            <Text style={styles.sectionTitle}>7-Day Schedule</Text>
                            {schedule.map((day, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.scheduleDay,
                                        index === schedule.length - 1 && { borderBottomWidth: 0 }
                                    ]}
                                >
                                    <View style={styles.dayHeader}>
                                        <Text style={styles.dayDate}>{day.date}</Text>
                                        <Text style={styles.dayOfWeek}>{day.dayOfWeek}</Text>
                                    </View>

                                    {day.assignment ? (
                                        <View style={styles.dayAssignment}>
                                            {day.assignment.primary && (
                                                <Text style={styles.assignmentText}>
                                                    Primary: {formatUserName(day.assignment.primary)}
                                                </Text>
                                            )}
                                            {day.assignment.backup && (
                                                <Text style={styles.assignmentText}>
                                                    Backup: {formatUserName(day.assignment.backup)}
                                                </Text>
                                            )}
                                        </View>
                                    ) : (
                                        <Text style={styles.noAssignment}>No assignment</Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    </>
                ) : (
                    <View style={styles.noOnCallContainer}>
                        <Ionicons name="alert-circle-outline" size={50} color="#64748B" />
                        <Text style={styles.noOnCallText}>No active on-call schedule for this team</Text>
                    </View>
                )}

                {/* Quick Actions */}
                {isMyTeam && (
                    <View style={styles.actionsCard}>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>

                        <TouchableOpacity style={styles.actionButton} onPress={handleCreateOverride}>
                            <Ionicons name="swap-horizontal" size={20} color="#3B82F6" />
                            <Text style={styles.actionButtonText}>Create Override</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={handleEscalate}>
                            <Ionicons name="arrow-up-circle" size={20} color="#EA580C" />
                            <Text style={styles.actionButtonText}>Escalate Incident</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={handleManageSchedule}>
                            <Ionicons name="calendar" size={20} color="#8B5CF6" />
                            <Text style={styles.actionButtonText}>Manage Schedule</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
        marginTop: 15,
    },
    scrollContent: {
        paddingBottom: 20,
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
    teamSelector: {
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        padding: 16,
        marginBottom: 16,
        marginHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 12,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    teamButtonWrapper: {
        marginTop: 10,
        marginRight: 8,
        position: 'relative',
        // NO overflow property here
    },
    teamButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderWidth: 1,
        borderColor: '#334155',
        overflow: 'hidden', // ✅ Add here instead
    },
    teamButtonActive: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        overflow: 'hidden', // ✅ Add here instead
    },
    teamButtonText: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '500',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    teamButtonTextActive: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD
    },
    myTeamBadge: {
        position: 'absolute',
        top: -8,
        left: '18%',
        transform: [{ translateX: -30 }], // Center it
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
        zIndex: 10,
    },
    myTeamBadgeText: {
        fontSize: 9,
        color: '#FFFFFF',
        fontWeight: '700',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    currentOnCallCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    noOnCallContainer: {
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderRadius: 16,
        padding: 30,
        marginHorizontal: 16,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    noOnCallText: {
        fontSize: 16,
        color: '#94A3B8',
        marginTop: 10,
        textAlign: 'center',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    onCallPerson: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    roleIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    roleText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    personName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    personEmail: {
        fontSize: 14,
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    timeInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    timeLabel: {
        fontSize: 14,
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    timeValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    scheduleCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    scheduleDay: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    dayHeader: {
        flex: 1,
    },
    dayDate: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    dayOfWeek: {
        fontSize: 12,
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    dayAssignment: {
        flex: 2,
        alignItems: 'flex-end',
    },
    assignmentText: {
        fontSize: 14,
        color: '#CBD5E1',
        marginBottom: 2,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    noAssignment: {
        fontSize: 14,
        color: '#64748B',
        fontStyle: 'italic',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    actionsCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 8,
    },
    actionButtonText: {
        fontSize: 16,
        color: '#CBD5E1',
        marginLeft: 12,
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
});