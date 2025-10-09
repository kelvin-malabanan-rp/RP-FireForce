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
    Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { oncallController } from '@/api/oncall-schedule-controller';
import { FONT_FAMILY } from "@/constants/fonts";
import { BASE_URL_DEV } from '@/utils/backend-url';
import { LinearGradient } from "expo-linear-gradient";

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
    const [showIncidentModal, setShowIncidentModal] = useState(false);

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
                    <Ionicons name="arrow-back" size={24} color="#F97316" />
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
                                placeholderTextColor="#6B7280"
                                value={selectedIncident}
                                onChangeText={setSelectedIncident}
                                autoCapitalize="none"
                            />
                        </>
                    ) : (
                        <TouchableOpacity
                            style={styles.selectButton}
                            onPress={() => setShowIncidentModal(true)}
                        >
                            <Text style={styles.selectButtonText} numberOfLines={1}>
                                {incidents.find(i => i.id === selectedIncident)?.title || 'Select an incident'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#94A3B8" />
                        </TouchableOpacity>
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
                                        {
                                            borderColor: color,
                                            flex: isActive ? 1.5 : 1,
                                        },
                                        isActive && { backgroundColor: `${color}22`, borderWidth: 2 },
                                    ]}
                                    onPress={() => setPriority(p)}
                                >
                                    <View style={[styles.priorityDot, { backgroundColor: color }]} />
                                    <Text
                                        style={[
                                            styles.priorityText,
                                            isActive && { color, fontWeight: '700' },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </Text>
                                    {isActive && (
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={18}
                                            color={color}
                                            style={{ marginLeft: 4 }}
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
                        placeholderTextColor="#6B7280"
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
                    style={styles.submitButtonWrapper}
                    onPress={handleEscalate}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={['#F97316', '#DC2626']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    >
                        <Ionicons name="arrow-up-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.submitButtonText}>
                            {loading ? 'Escalating...' : 'Escalate Incident'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>

            {/* Incident Selection Modal */}
            <Modal
                visible={showIncidentModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowIncidentModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Incident</Text>
                            <TouchableOpacity onPress={() => setShowIncidentModal(false)}>
                                <Ionicons name="close" size={24} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalList}>
                            {incidents.map((incident) => (
                                <TouchableOpacity
                                    key={incident.id}
                                    style={[
                                        styles.modalItem,
                                        selectedIncident === incident.id && styles.modalItemSelected
                                    ]}
                                    onPress={() => {
                                        setSelectedIncident(incident.id);
                                        setShowIncidentModal(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.modalItemText,
                                        selectedIncident === incident.id && styles.modalItemTextSelected
                                    ]}>
                                        {incident.title}
                                    </Text>
                                    {selectedIncident === incident.id && (
                                        <Ionicons name="checkmark" size={20} color="#F97316" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    input: {
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#334155',
        padding: 12,
        fontSize: 16,
        color: '#FFFFFF',
    },
    textArea: {
        minHeight: 120,
        textAlignVertical: 'top',
    },
    centerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#334155',
        padding: 12,
        minHeight: 50,
    },
    selectButtonText: {
        flex: 1,
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1E293B',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    modalList: {
        padding: 8,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 8,
        marginVertical: 4,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
    },
    modalItemSelected: {
        backgroundColor: 'rgba(249, 115, 22, 0.15)',
        borderWidth: 1,
        borderColor: '#F97316',
    },
    modalItemText: {
        flex: 1,
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    modalItemTextSelected: {
        color: '#F97316',
        fontWeight: '600',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    priorityContainer: {
        flexDirection: 'row',
        gap: 6,
    },
    priorityButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
    },
    priorityDot: {
        width: 10,
        height: 10,
        borderRadius: 6,
        marginRight: 6,
    },
    priorityText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#93C5FD',
        marginLeft: 8,
        lineHeight: 20,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    submitButtonWrapper: {
        borderRadius: 8,
        overflow: 'hidden',
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