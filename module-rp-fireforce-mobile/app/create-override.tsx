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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {getAllCurrentOnCall, oncallController} from '@/api/oncall-schedule-controller';
import { OnCallUser } from '@/types/oncall-types';
import { FONT_FAMILY } from '@/constants/fonts';
import {LinearGradient} from "expo-linear-gradient";

export default function CreateOverrideScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const teamId = (params.teamId as string) || 'team-1';

    const [selectedUser, setSelectedUser] = useState<string>('');
    const [role, setRole] = useState<'primary' | 'backup'>('primary');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
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
            // ✅ Use getAllCurrentOnCall to get teams WITH actual members
            const response = await getAllCurrentOnCall(teamId);

            if (response.httpStatus === 'OK' && response.data) {
                console.log('[override] Raw response data:', response.data);

                const data = response.data as any;

                // ✅ Extract users from the object structure (not arrays!)
                const allMembers: OnCallUser[] = [];

                // Add primary if exists
                if (data.primary && typeof data.primary === 'object') {
                    allMembers.push({
                        id: data.primary.id,
                        firstName: data.primary.firstName || '',
                        lastName: data.primary.lastName || '',
                        email: data.primary.email,
                        role: 'primary',
                        timezone: data.timezone,
                        startTime: data.startTime,
                        endTime: data.endTime,
                        teamId: data.teamId,
                        teamName: data.teamName,
                        phoneNumber: data.primary.phoneNumber,
                    });
                }

                // Add backup if exists
                if (data.backup && typeof data.backup === 'object') {
                    allMembers.push({
                        id: data.backup.id,
                        firstName: data.backup.firstName || '',
                        lastName: data.backup.lastName || '',
                        email: data.backup.email,
                        role: 'backup',
                        timezone: data.timezone,
                        startTime: data.startTime,
                        endTime: data.endTime,
                        teamId: data.teamId,
                        teamName: data.teamName,
                        phoneNumber: data.backup.phoneNumber,
                    });
                }

                // Add escalation if exists (could be object or array)
                if (data.escalation) {
                    if (Array.isArray(data.escalation)) {
                        data.escalation.forEach((user: any) => {
                            allMembers.push({
                                id: user.id,
                                firstName: user.firstName || '',
                                lastName: user.lastName || '',
                                email: user.email,
                                role: 'escalation',
                                timezone: data.timezone,
                                startTime: data.startTime,
                                endTime: data.endTime,
                                teamId: data.teamId,
                                teamName: data.teamName,
                                phoneNumber: user.phoneNumber,
                            });
                        });
                    } else if (typeof data.escalation === 'object') {
                        allMembers.push({
                            id: data.escalation.id,
                            firstName: data.escalation.firstName || '',
                            lastName: data.escalation.lastName || '',
                            email: data.escalation.email,
                            role: 'escalation',
                            timezone: data.timezone,
                            startTime: data.startTime,
                            endTime: data.endTime,
                            teamId: data.teamId,
                            teamName: data.teamName,
                            phoneNumber: data.escalation.phoneNumber,
                        });
                    }
                }

                // Remove duplicates based on userId
                const uniqueUsers = allMembers.filter((user, index, self) =>
                    index === self.findIndex(u => u.id === user.id)
                );

                setAvailableUsers(uniqueUsers);
                console.log('[override] Loaded users:', uniqueUsers.length);
                console.log('[override] Users:', uniqueUsers);
            } else {
                console.log('[override] No on-call data found');
                setAvailableUsers([]);
            }
        } catch (error) {
            console.error('Error loading team members:', error);
            setAvailableUsers([]);
            Alert.alert('Error', 'Failed to load team members');
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

        if (!teamId) {
            Alert.alert('Error', 'Team ID is missing');
            return;
        }

        setLoading(true);
        try {
            console.log('[override] Creating override with params:', {
                teamId,
                userId: selectedUser,
                role,
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
                reason,
            });

            const result = await oncallController.createOverride({
                teamId,
                userId: selectedUser,
                role,
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
                reason,
            });

            console.log('[override] ✅ Override created successfully:', result);

            Alert.alert('Success', 'Override created successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('[override] ❌ Error creating override:', error);

            // More detailed error message
            const errorMessage = error instanceof Error
                ? error.message
                : 'Failed to create override';

            Alert.alert('Error', errorMessage);
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

    const handleStartConfirm = (date: Date) => {
        setStartDate(date);
        setShowStartPicker(false);
    };

    const handleEndConfirm = (date: Date) => {
        setEndDate(date);
        setShowEndPicker(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#F97316" />
                </TouchableOpacity>
                <Text style={styles.title}>Create Override</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Role Selection */}
                {/* Role Selection */}
                <View style={styles.section}>
                    <Text style={styles.label}>Role</Text>
                    <View style={styles.roleContainer}>
                        <TouchableOpacity
                            style={styles.roleButtonWrapper}
                            onPress={() => setRole('primary')}
                        >
                            {role === 'primary' ? (
                                <LinearGradient
                                    colors={['#F97316', '#DC2626']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.roleButtonActive}
                                >
                                    <Text style={styles.roleTextActive}>
                                        Primary
                                    </Text>
                                </LinearGradient>
                            ) : (
                                <View style={styles.roleButton}>
                                    <Text style={styles.roleText}>
                                        Primary
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.roleButtonWrapper}
                            onPress={() => setRole('backup')}
                        >
                            {role === 'backup' ? (
                                <LinearGradient
                                    colors={['#F97316', '#DC2626']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.roleButtonActive}
                                >
                                    <Text style={styles.roleTextActive}>
                                        Backup
                                    </Text>
                                </LinearGradient>
                            ) : (
                                <View style={styles.roleButton}>
                                    <Text style={styles.roleText}>
                                        Backup
                                    </Text>
                                </View>
                            )}
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
                        <Ionicons name="calendar-outline" size={20} color="#F97316" />
                        <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                        <Ionicons name="chevron-down" size={20} color="#6B7280" />
                    </TouchableOpacity>

                    <DateTimePickerModal
                        isVisible={showStartPicker}
                        mode="datetime"
                        date={startDate}
                        onConfirm={handleStartConfirm}
                        onCancel={() => setShowStartPicker(false)}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>End Time</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowEndPicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={20} color="#F97316" />
                        <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                        <Ionicons name="chevron-down" size={20} color="#6B7280" />
                    </TouchableOpacity>

                    <DateTimePickerModal
                        isVisible={showEndPicker}
                        mode="datetime"
                        date={endDate}
                        onConfirm={handleEndConfirm}
                        onCancel={() => setShowEndPicker(false)}
                    />
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
                    style={styles.submitButtonWrapper}
                    onPress={handleCreateOverride}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={['#F97316', '#DC2626']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    >
                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.submitButtonText}>
                            {loading ? 'Creating...' : 'Create Override'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
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
        color: '#FFFFFF',
        marginBottom: 8,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    roleButtonWrapper: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    roleButton: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#334155',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        alignItems: 'center',
    },
    roleButtonActive: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    roleText: {
        fontSize: 16,
        color: '#94A3B8',
        fontWeight: '500',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    roleTextActive: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
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
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },
    userItemSelected: {
        borderColor: '#F97316',
        backgroundColor: 'rgba(249, 115, 22, 0.15)',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    userEmail: {
        fontSize: 14,
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: 'rgba(249, 115, 22, 0.15)', // ✅ Orange background
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#F97316', // ✅ Orange border
    },
    dateText: {
        fontSize: 16,
        color: '#FB923C', // ✅ Orange text
        flex: 1,
        marginLeft: 8,
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
        fontWeight: '600',
    },
    input: {
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#334155',
        padding: 12,
        fontSize: 16,
        color: '#FFFFFF',
        minHeight: 80,
        textAlignVertical: 'top',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    submitButtonWrapper: {
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 8,
        marginBottom: 32,
    },
    submitButton: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginLeft: 8,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
});