// app/create-override.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    TextInput,
    Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { oncallController } from '@/api/oncall-schedule-controller';
import { OnCallUser } from '@/types/oncall-types';
import { FONT_FAMILY } from '@/constants/fonts';

export default function CreateOverrideScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const teamId = (params.teamId as string) || 'team-1';

    const [selectedUser, setSelectedUser] = useState<string>('');
    const [role, setRole] = useState<'primary' | 'backup'>('primary');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // 24 hours from now
    const [reason, setReason] = useState('');
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<OnCallUser[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTeamMembers();
    }, [teamId]);

    const loadTeamMembers = async () => {
        try {
            const teams = await oncallController.getTeams();
            const team = teams.find(t => t.id === teamId);

            if (team && team.members && Array.isArray(team.members)) {
                setAvailableUsers(team.members);
            } else {
                console.log('Team members not found or invalid format:', team);
                setAvailableUsers([]);
            }
        } catch (error) {
            console.error('Error loading team members:', error);
            setAvailableUsers([]);
        }
    };

    const handleCreateOverride = async () => {
        if (!selectedUser) {
            Alert.alert('Error', 'Please select a user');
            return;
        }

        if (startDate >= endDate) {
            Alert.alert('Error', 'End time must be after start time');
            return;
        }

        setLoading(true);
        try {
            await oncallController.createOverride({
                teamId,
                userId: selectedUser,
                role,
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
                reason,
            });

            Alert.alert('Success', 'Override created successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to create override');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.title}>Create Override</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Role Selection */}
                <View style={styles.section}>
                    <Text style={styles.label}>Role</Text>
                    <View style={styles.roleContainer}>
                        <TouchableOpacity
                            style={[styles.roleButton, role === 'primary' && styles.roleButtonActive]}
                            onPress={() => setRole('primary')}
                        >
                            <Text style={[styles.roleText, role === 'primary' && styles.roleTextActive]}>
                                Primary
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.roleButton, role === 'backup' && styles.roleButtonActive]}
                            onPress={() => setRole('backup')}
                        >
                            <Text style={[styles.roleText, role === 'backup' && styles.roleTextActive]}>
                                Backup
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* User Selection */}
                <View style={styles.section}>
                    <Text style={styles.label}>Assign To</Text>
                    <ScrollView style={styles.userList}>
                        {availableUsers.map((user) => (
                            <TouchableOpacity
                                key={user.id}
                                style={[styles.userItem, selectedUser === user.id && styles.userItemSelected]}
                                onPress={() => setSelectedUser(user.id)}
                            >
                                <View style={styles.userInfo}>
                                    <Text style={styles.userName}>
                                        {user.firstName} {user.lastName}
                                    </Text>
                                    <Text style={styles.userEmail}>{user.email}</Text>
                                </View>
                                {selectedUser === user.id && (
                                    <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Date Selection */}
                <View style={styles.section}>
                    <Text style={styles.label}>Start Time</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowStartPicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                        <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                    </TouchableOpacity>

                    {showStartPicker && (
                        <DateTimePicker
                            value={startDate}
                            mode="datetime"
                            onChange={(event, date) => {
                                setShowStartPicker(Platform.OS === 'ios');
                                if (date) setStartDate(date);
                            }}
                        />
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>End Time</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowEndPicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                        <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                    </TouchableOpacity>

                    {showEndPicker && (
                        <DateTimePicker
                            value={endDate}
                            mode="datetime"
                            onChange={(event, date) => {
                                setShowEndPicker(Platform.OS === 'ios');
                                if (date) setEndDate(date);
                            }}
                        />
                    )}
                </View>

                {/* Reason */}
                <View style={styles.section}>
                    <Text style={styles.label}>Reason (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Vacation, Sick leave, etc."
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleCreateOverride}
                    disabled={loading}
                >
                    <Text style={styles.submitButtonText}>
                        {loading ? 'Creating...' : 'Create Override'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    roleButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    roleButtonActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    roleText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    roleTextActive: {
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    userList: {
        maxHeight: 200,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    userItemSelected: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    userEmail: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    dateText: {
        fontSize: 16,
        color: '#374151',
        marginLeft: 8,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 12,
        fontSize: 16,
        color: '#111827',
        minHeight: 80,
        textAlignVertical: 'top',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    submitButton: {
        backgroundColor: '#3B82F6',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 32,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
});