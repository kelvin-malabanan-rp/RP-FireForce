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
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { oncallController } from '@/api/oncall-schedule-controller';
import { BASE_URL_DEV } from '@/utils/backend-url';

type IncidentLite = { id: string; title: string };

export default function EscalateIncidentScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const teamId = (params.teamId as string) || 'team-1';
    const routedIncidentId = (params.incidentId as string) || '';

    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
    const [reason, setReason] = useState('');
    const [selectedIncident, setSelectedIncident] = useState(routedIncidentId);
    const [incidents, setIncidents] = useState<IncidentLite[]>([]);
    const [loadingIncidents, setLoadingIncidents] = useState(true);
    const [loading, setLoading] = useState(false);

    // Fetch incidents for dropdown
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoadingIncidents(true);
                const res = await fetch(`${BASE_URL_DEV}/api/incidents`);
                const json = await res.json();
                // Expecting { success, data: Incident[] } or similar;
                // pick id + title robustly:
                const list: IncidentLite[] = (json?.data || json || []).map((x: any) => ({
                    id: String(x.id),
                    title: String(x.title ?? x.name ?? x.id),
                }));
                if (!cancelled) {
                    setIncidents(list);
                    // If no incidentId came from route, preselect first
                    if (!routedIncidentId && list.length > 0) {
                        setSelectedIncident(list[0].id);
                    }
                }
            } catch (e) {
                if (!cancelled) {
                    console.warn('Failed to load incidents:', e);
                    setIncidents([]);
                }
            } finally {
                if (!cancelled) setLoadingIncidents(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [routedIncidentId]);

    const handleEscalate = async () => {
        if (!selectedIncident) {
            Alert.alert('Error', 'Please choose an incident');
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
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (error) {
            console.error(error);
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

    const priorities = ['low', 'medium', 'high', 'critical'] as const;

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
                {/* Incident selector */}
                <View style={styles.section}>
                    <Text style={styles.label}>Incident</Text>

                    {loadingIncidents ? (
                        <View style={[styles.input, styles.centerRow]}>
                            <ActivityIndicator />
                            <Text style={{ marginLeft: 8, color: '#6B7280' }}>Loading incidents…</Text>
                        </View>
                    ) : incidents.length === 0 ? (
                        <>
                            <Text style={{ marginBottom: 8, color: '#6B7280' }}>
                                No incidents found. You can paste an Incident ID below:
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter incident ID"
                                value={selectedIncident}
                                onChangeText={setSelectedIncident}
                                autoCapitalize="none"
                            />
                        </>
                    ) : (
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectedIncident}
                                onValueChange={(val) => setSelectedIncident(String(val))}
                                style={styles.picker}
                                dropdownIconColor="#111827"
                                mode="dropdown" // 👈 forces dropdown on iOS instead of wheel
                            >
                                {incidents.map((inc) => (
                                    <Picker.Item
                                        key={inc.id}
                                        label={inc.title}
                                        value={inc.id}
                                        color="#111827"
                                    />
                                ))}
                            </Picker>
                        </View>
                    )}
                </View>

                {/* Priority */}
                <View style={styles.section}>
                    <Text style={styles.label}>Priority Level</Text>
                    <View style={styles.priorityContainer}>
                        {priorities.map((p) => {
                            const isActive = priority === p;
                            const color = getPriorityColor(p);
                            return (
                                <TouchableOpacity
                                    key={p}
                                    style={[
                                        styles.priorityButton,
                                        { borderColor: color },
                                        isActive && { backgroundColor: `${color}22`, borderColor: color },
                                    ]}
                                    onPress={() => setPriority(p)}
                                >
                                    <View style={[styles.priorityDot, { backgroundColor: color }]} />
                                    <Text
                                        style={[
                                            styles.priorityText,
                                            isActive && { color, fontWeight: '700' },
                                        ]}
                                    >
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </Text>
                                    {isActive && (
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={18}
                                            color={color}
                                            style={{ marginLeft: 6 }}
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Reason */}
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

                {/* Info */}
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <Text style={styles.infoText}>
                        This will notify the next person in the escalation chain based on the current escalation level.
                    </Text>
                </View>

                {/* Submit */}
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
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    },
    title: { fontSize: 20, fontWeight: '700', color: '#111827' },
    content: { flex: 1, padding: 16 },
    section: { marginBottom: 24 },
    label: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
    input: {
        backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB',
        padding: 12, fontSize: 16, color: '#111827',
    },
    textArea: { minHeight: 120, textAlignVertical: 'top' },
    centerRow: { flexDirection: 'row', alignItems: 'center' },

    pickerContainer: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF', // 👈 makes background white
        borderRadius: 8,
        overflow: 'hidden',
        height: 50, // 👈 fixes the "middle of screen" wheel issue on iOS
        justifyContent: 'center',
    },
    picker: {
        color: '#111827',
        backgroundColor: '#FFFFFF', // 👈 force white background
        width: '100%',
        height: '100%', },

    priorityContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    priorityButton: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 10, paddingHorizontal: 12,
        borderRadius: 8, borderWidth: 2, backgroundColor: '#FFFFFF',
    },
    priorityDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
    priorityText: { fontSize: 14, fontWeight: '600', color: '#374151' },

    infoCard: { flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 12, borderRadius: 8, marginBottom: 24 },
    infoText: { flex: 1, fontSize: 14, color: '#1E40AF', marginLeft: 8, lineHeight: 20 },

    submitButton: {
        flexDirection: 'row', backgroundColor: '#EA580C', padding: 16, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center', marginBottom: 32,
    },
    submitButtonDisabled: { opacity: 0.6 },
    submitButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginLeft: 8 },

});

