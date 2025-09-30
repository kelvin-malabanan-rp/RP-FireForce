// app/(tabs)/oncall.tsx
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { CurrentOnCall, OnCallUser, OnCallTeam, OnCallScheduleDay } from '@/types/oncall-types';
import { oncallController } from '@/api/oncall-schedule-controller';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import {SafeAreaView} from "react-native-safe-area-context";

export default function OnCallTab() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const teamId = (params.teamId as string) || 'team-1';

    const [currentOnCall, setCurrentOnCall] = useState<CurrentOnCall | null>(null);
    const [schedule, setSchedule] = useState<OnCallScheduleDay[]>([]);
    const [teams, setTeams] = useState<OnCallTeam[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState(teamId);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOnCallData();
    }, [selectedTeamId]);

    const loadOnCallData = async () => {
        try {
            setLoading(true);
            const data = await oncallController.loadAllOnCallData(selectedTeamId);
            setCurrentOnCall(data.currentOnCall);
            setSchedule(data.schedule);
            setTeams(data.teams);
        } catch (error) {
            console.error('Error loading on-call data:', error);
            Alert.alert('Error', 'Failed to load on-call data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadOnCallData();
        setRefreshing(false);
    };

    const formatUserName = (user: OnCallUser) => {
        return `${user.firstName} ${user.lastName}`;
    };

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
        router.push('/create-override?teamId=' + selectedTeamId);
    };

    const handleEscalate = () => {
        router.push('/escalate-incident?teamId=' + selectedTeamId);
    };

    const handleManageSchedule = () => {
        Alert.alert('Schedule', 'Schedule management coming soon');
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
                <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>
                        Loading on-call schedule...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: false, // We're using the tab header
                }}
            />
            <SafeAreaView style={[styles.container, { backgroundColor: '#F3F4F6' }]}>
                <StatusBar barStyle={colorScheme === 'dark' ? "light-content" : "dark-content"} />

                <ScrollView
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#3B82F6"
                        />
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Team Selector */}
                    <View style={styles.teamSelector}>
                        <Text style={styles.sectionTitle}>Team</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {teams.map(team => (
                                <TouchableOpacity
                                    key={team.id}
                                    style={[
                                        styles.teamButton,
                                        selectedTeamId === team.id && styles.teamButtonActive
                                    ]}
                                    onPress={() => setSelectedTeamId(team.id)}
                                >
                                    <Text style={[
                                        styles.teamButtonText,
                                        selectedTeamId === team.id && styles.teamButtonTextActive
                                    ]}>
                                        {team.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Current On-Call */}
                    {currentOnCall && (
                        <View style={styles.currentOnCallCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.sectionTitle}>Currently On-Call</Text>
                                <TouchableOpacity onPress={onRefresh}>
                                    <Ionicons name="refresh" size={20} color="#3B82F6" />
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
                                    <Text style={styles.personName}>
                                        {formatUserName(currentOnCall.primary)}
                                    </Text>
                                    <Text style={styles.personEmail}>
                                        {currentOnCall.primary.email}
                                    </Text>
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
                                    <Text style={styles.personName}>
                                        {formatUserName(currentOnCall.backup)}
                                    </Text>
                                    <Text style={styles.personEmail}>
                                        {currentOnCall.backup.email}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.timeInfo}>
                                <Text style={styles.timeLabel}>On-call until:</Text>
                                <Text style={styles.timeValue}>
                                    {formatTime(currentOnCall.endTime)}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Upcoming Schedule */}
                    <View style={styles.scheduleCard}>
                        <Text style={styles.sectionTitle}>7-Day Schedule</Text>

                        {schedule.map((day, index) => (
                            <View key={index} style={[
                                styles.scheduleDay,
                                index === schedule.length - 1 && { borderBottomWidth: 0 }
                            ]}>
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

                    {/* Quick Actions */}
                    <View style={styles.actionsCard}>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleCreateOverride}
                        >
                            <Ionicons name="swap-horizontal" size={20} color="#3B82F6" />
                            <Text style={styles.actionButtonText}>Create Override</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleEscalate}
                        >
                            <Ionicons name="arrow-up-circle" size={20} color="#EA580C" />
                            <Text style={styles.actionButtonText}>Escalate Incident</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleManageSchedule}
                        >
                            <Ionicons name="calendar" size={20} color="#8B5CF6" />
                            <Text style={styles.actionButtonText}>Manage Schedule</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        fontSize: 16,
        color: '#6B7280',
    },
    teamSelector: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    teamButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
    },
    teamButtonActive: {
        backgroundColor: '#3B82F6',
    },
    teamButtonText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    teamButtonTextActive: {
        color: '#FFFFFF',
    },
    currentOnCallCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
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
        borderBottomColor: '#F3F4F6',
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
    },
    personName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    personEmail: {
        fontSize: 14,
        color: '#6B7280',
    },
    timeInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    timeLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    timeValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    scheduleCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    scheduleDay: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dayHeader: {
        flex: 1,
    },
    dayDate: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    dayOfWeek: {
        fontSize: 12,
        color: '#6B7280',
    },
    dayAssignment: {
        flex: 2,
        alignItems: 'flex-end',
    },
    assignmentText: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 2,
    },
    noAssignment: {
        fontSize: 14,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    actionsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
        marginBottom: 8,
    },
    actionButtonText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
        marginLeft: 12,
    },
});