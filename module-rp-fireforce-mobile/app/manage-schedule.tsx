// app/manage-schedule.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    TextInput, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { oncallController } from '@/api/oncall-schedule-controller';
import { SafeAreaView } from "react-native-safe-area-context";

type MemberRow = {
    userId: string;
    name: string;
    email?: string;
    role: 'primary' | 'backup' | 'escalation';
    orderIndex: number;
    isActive: boolean;
};

type ScheduleConfig = {
    teamId: string;
    rotationType: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    rotationLengthHours: number;
    rotationStartISO: string;
    members: MemberRow[];
};

export default function ManageSchedule() {
    const router = useRouter();
    const { teamId: teamIdParam } = useLocalSearchParams<{ teamId?: string }>();
    const teamId = teamIdParam ?? 'team-1';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [cfg, setCfg] = useState<ScheduleConfig | null>(null);

    // Helper functions
    const formatUTC = (isoString: string) => {
        try {
            const date = new Date(isoString);
            const options: Intl.DateTimeFormatOptions = {
                timeZone: 'UTC',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            };
            return date.toLocaleString('en-US', options) + ' UTC';
        } catch {
            return 'Invalid date';
        }
    };

    const capitalize = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await oncallController.getScheduleConfig(teamId);
            const normalized: ScheduleConfig = {
                teamId,
                rotationType: data.rotationType ?? 'weekly',
                rotationLengthHours: Number(data.rotationLengthHours ?? 168),
                rotationStartISO: data.rotationStartISO ?? new Date().toISOString(),
                members: (data.members ?? []).map((m: any, i: number) => ({
                    userId: m.userId,
                    name: m.name ?? `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim(),
                    email: m.email,
                    role: (m.role ?? 'primary') as MemberRow['role'],
                    orderIndex: Number(m.orderIndex ?? i),
                    isActive: m.isActive ?? true,
                })).sort((a: MemberRow, b: MemberRow) => a.orderIndex - b.orderIndex),
            };
            setCfg(normalized);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to load schedule config');
        } finally {
            setLoading(false);
        }
    }, [teamId]);

    useEffect(() => { load(); }, [load]);

    const move = (index: number, dir: -1 | 1) => {
        if (!cfg) return;
        const next = [...cfg.members];
        const swapWith = index + dir;
        if (swapWith < 0 || swapWith >= next.length) return;
        [next[index], next[swapWith]] = [next[swapWith], next[index]];
        next.forEach((m, i) => (m.orderIndex = i));
        setCfg({ ...cfg, members: next });
    };

    const toggleActive = (index: number) => {
        if (!cfg) return;
        const next = [...cfg.members];
        next[index].isActive = !next[index].isActive;
        setCfg({ ...cfg, members: next });
    };

    const cycleRole = (index: number) => {
        if (!cfg) return;
        const order: MemberRow['role'][] = ['primary', 'backup', 'escalation'];
        const cur = cfg.members[index].role;
        const nextRole = order[(order.indexOf(cur) + 1) % order.length];
        const next = [...cfg.members];
        next[index].role = nextRole;
        setCfg({ ...cfg, members: next });
    };

    const save = async () => {
        if (!cfg) return;
        setSaving(true);
        try {
            await oncallController.updateScheduleConfig({
                teamId: cfg.teamId,
                rotationType: cfg.rotationType,
                rotationLengthHours: cfg.rotationLengthHours,
                rotationStartISO: cfg.rotationStartISO,
                members: cfg.members.map(m => ({
                    userId: m.userId,
                    role: m.role,
                    orderIndex: m.orderIndex,
                    isActive: m.isActive,
                })),
            });
            Alert.alert('Saved', 'Schedule updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', e?.message ?? 'Failed to save schedule');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !cfg) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ title: 'Manage Schedule' }} />
                <View style={styles.center}>
                    <ActivityIndicator />
                    <Text style={styles.muted}>Loading…</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: 'Manage Schedule' }} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.section}>
                    <Text style={styles.label}>Rotation Type</Text>
                    <View style={styles.rowChip}>
                        {(['daily', 'weekly', 'biweekly', 'monthly'] as const).map(rt => (
                            <TouchableOpacity
                                key={rt}
                                style={[styles.chip, cfg.rotationType === rt && styles.chipActive]}
                                onPress={() => setCfg({ ...cfg, rotationType: rt })}
                            >
                                <Text style={[styles.chipText, cfg.rotationType === rt && styles.chipTextActive]}>
                                    {capitalize(rt)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Rotation Length (hours)</Text>
                    <TextInput
                        value={String(cfg.rotationLengthHours)}
                        onChangeText={(t) => setCfg({ ...cfg, rotationLengthHours: Number(t || 0) })}
                        keyboardType="numeric"
                        style={styles.input}
                        placeholder="e.g. 168"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Rotation Start (UTC)</Text>
                    <TextInput
                        value={cfg.rotationStartISO}
                        onChangeText={(t) => setCfg({ ...cfg, rotationStartISO: t })}
                        style={styles.input}
                        placeholder="YYYY-MM-DDTHH:mm:ss.sssZ"
                    />
                    <Text style={styles.utcDisplay}>{formatUTC(cfg.rotationStartISO)}</Text>
                    <TouchableOpacity
                        onPress={() => setCfg({ ...cfg, rotationStartISO: new Date().toISOString() })}
                        style={styles.smallBtn}
                    >
                        <Ionicons name="time" size={16} color="#2563EB" />
                        <Text style={styles.smallBtnText}>Set to now</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Members</Text>
                    {cfg.members.map((item, index) => (
                        <View key={item.userId}>
                            <TouchableOpacity
                                style={styles.memberCard}
                                onLongPress={() => {
                                    // Future: implement drag functionality
                                    Alert.alert('Drag & Drop', 'Long press drag functionality coming soon');
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.memberName}>{item.name || item.userId}</Text>
                                    {!!item.email && <Text style={styles.memberEmail}>{item.email}</Text>}
                                    <Text style={styles.memberMeta}>
                                        Role: <Text style={styles.bold}>{capitalize(item.role)}</Text> • Order: {item.orderIndex}
                                    </Text>
                                </View>

                                <View style={styles.btnGroup}>
                                    <TouchableOpacity
                                        style={styles.iconBtn}
                                        onPress={() => cycleRole(index)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons name="swap-horizontal" size={18} color="#2563EB" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.iconBtn}
                                        onPress={() => toggleActive(index)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons
                                            name={item.isActive ? 'toggle-sharp' : 'toggle-outline'}
                                            size={24}
                                            color={item.isActive ? '#10B981' : '#9CA3AF'}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                            {index < cfg.members.length - 1 && <View style={styles.sep} />}
                        </View>
                    ))}
                    <Text style={styles.hint}>Tip: Use up/down buttons or long-press to reorder</Text>
                </View>

                <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
                    <Ionicons name="save" size={20} color="#FFFFFF" />
                    <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save changes'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    scrollContent: { padding: 16, paddingBottom: 32 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    muted: { color: '#6B7280', marginTop: 8 },
    section: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16 },
    label: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
    input: {
        backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
        borderRadius: 8, padding: 12, fontSize: 16, color: '#111827'
    },
    rowChip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#F3F4F6'
    },
    chipActive: { backgroundColor: '#2563EB' },
    chipText: { color: '#374151', fontWeight: '600' },
    chipTextActive: { color: '#FFFFFF' },
    smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    smallBtnText: { color: '#2563EB', fontWeight: '600' },
    utcDisplay: { fontSize: 14, color: '#2563EB', marginTop: 4 },

    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    memberRow: { flexDirection: 'row', alignItems: 'center' },
    memberName: { fontSize: 16, fontWeight: '600', color: '#111827' },
    memberEmail: { fontSize: 12, color: '#6B7280' },
    memberMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    bold: { fontWeight: '700', color: '#111827' },
    btnGroup: { flexDirection: 'row', gap: 12, marginLeft: 12 },
    btnCol: { marginLeft: 8, gap: 8 },
    iconBtn: {
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    sep: { height: 12 },
    hint: { fontSize: 12, color: '#6B7280', fontStyle: 'italic', marginTop: 12, textAlign: 'center' },
    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#10B981', borderRadius: 10, padding: 16, marginTop: 8
    },
    saveText: { color: '#FFF', fontWeight: '700', marginLeft: 8, fontSize: 16 },
});