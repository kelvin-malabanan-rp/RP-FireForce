// app/escalate-incident.tsx
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
import { oncallController } from '@/api/oncall-schedule-controller';

export default function EscalateIncidentScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const teamId = (params.teamId as string) || 'team-1';
    const incidentId = (params.incidentId as string) || '';

    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
    const [reason, setReason] = useState('');
    const [selectedIncident, setSelectedIncident] = useState(incidentId);
    const [loading, setLoading] = useState(false);

    const handleEscalate = async () => {
        if (!selectedIncident) {
            Alert.alert('Error', 'Please enter an incident ID');
            return;
        }

        if (!reason.trim()) {
            Alert.alert('Error', 'Please provide a reason for escalation');
            return;
        }

        setLoading(true);
        try {
            await oncallController.escalateIncident({
                teamId,
                incidentId: selectedIncident,
                reason,
                priority,
            });

            Alert.alert('Success', 'Incident escalated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to escalate incident');
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'low': return '#10B981';
            case 'medium': return '#F59E0B';
            case 'high': return '#F97316';
            case 'critical': return '#DC2626';
            default: return '#6B7280';
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.title}>Escalate Incident</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Incident ID */}
                <View style={styles.section}>
                    <Text style={styles.label}>Incident ID</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter incident ID"
                        value={selectedIncident}
                        onChangeText={setSelectedIncident}
                    />
                </View>

                {/* Priority Selection */}
                <View style={styles.section}>
                    <Text style={styles.label}>Priority Level</Text>
                    <View style={styles.priorityContainer}>
                        {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                            <TouchableOpacity
                                key={p}
                                style={[
                                    styles.priorityButton,
                                    priority === p && styles.priorityButtonActive,
                                    { borderColor: getPriorityColor(p) }
                                ]}
                                onPress={() => setPriority(p)}
                            >
                                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(p) }]} />
                                <Text style={[
                                    styles.priorityText,
                                    priority === p && { color: getPriorityColor(p) }
                                ]}>
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Escalation Reason */}
                <View style={styles.section}>
                    <Text style={styles.label}>Escalation Reason</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Describe why this incident needs escalation..."
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        numberOfLines={6}
                    />
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <Text style={styles.infoText}>
                        This will notify the next person in the escalation chain based on the current escalation level.
                    </Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleEscalate}
                    disabled={loading}
                >
                    <Ionicons name="arrow-up-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>
                        {loading ? 'Escalating...' : 'Escalate Incident'}
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
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 12,
        fontSize: 16,
        color: '#111827',
    },
    textArea: {
        minHeight: 120,
        textAlignVertical: 'top',
    },
    priorityContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    priorityButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        marginBottom: 4,
    },
    priorityButtonActive: {
        backgroundColor: '#F3F4F6',
    },
    priorityDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    priorityText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#1E40AF',
        marginLeft: 8,
        lineHeight: 20,
    },
    submitButton: {
        flexDirection: 'row',
        backgroundColor: '#EA580C',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginLeft: 8,
    },
});