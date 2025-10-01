// app/manage-schedule.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, Alert, ActivityIndicator, ScrollView,
    Animated, PanResponder, LayoutAnimation, Platform, UIManager
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { oncallController } from '@/api/oncall-schedule-controller';
import { SafeAreaView } from "react-native-safe-area-context";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Custom Toggle Switch Component
function ToggleSwitch({ isActive, onToggle }: { isActive: boolean; onToggle: () => void }) {
    const translateX = React.useRef(new Animated.Value(isActive ? 20 : 2)).current;

    React.useEffect(() => {
        Animated.spring(translateX, {
            toValue: isActive ? 20 : 2,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
        }).start();
    }, [isActive, translateX]);

    return (
        <TouchableOpacity
            onPress={onToggle}
            style={[
                styles.toggleContainer,
                { backgroundColor: isActive ? '#10B981' : '#D1D5DB' }
            ]}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Animated.View
                style={[
                    styles.toggleCircle,
                    { transform: [{ translateX }] }
                ]}
            />
        </TouchableOpacity>
    );
}

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
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

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
                members: (data.members ?? []).map((m: any, i: number) => {
                    // Try to get name from different possible fields
                    let displayName = '';
                    if (m.firstName || m.lastName) {
                        displayName = `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim();
                    } else if (m.username) {
                        displayName = m.username;
                    } else if (m.name) {
                        displayName = m.name;
                    }

                    return {
                        userId: m.userId,
                        name: displayName,
                        email: m.email,
                        role: (m.role ?? 'primary') as MemberRow['role'],
                        orderIndex: Number(m.orderIndex ?? i),
                        isActive: m.isActive ?? true,
                    };
                }).sort((a: MemberRow, b: MemberRow) => a.orderIndex - b.orderIndex),
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

    const reorderMembers = (fromIndex: number, toIndex: number) => {
        if (!cfg || fromIndex === toIndex) return;

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        const next = [...cfg.members];
        const [removed] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, removed);
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
                scrollEnabled={draggingIndex === null}
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
                        <DraggableMemberCard
                            key={item.userId}
                            item={item}
                            index={index}
                            totalCount={cfg.members.length}
                            onReorder={reorderMembers}
                            onCycleRole={cycleRole}
                            onToggleActive={toggleActive}
                            onDragStart={() => setDraggingIndex(index)}
                            onDragEnd={() => setDraggingIndex(null)}
                            capitalize={capitalize}
                        />
                    ))}
                    <Text style={styles.hint}>Tip: Long-press and drag to reorder</Text>
                </View>

                <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
                    <Ionicons name="save" size={20} color="#FFFFFF" />
                    <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save changes'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

// Draggable Member Card Component
function DraggableMemberCard({
                                 item,
                                 index,
                                 totalCount,
                                 onReorder,
                                 onCycleRole,
                                 onToggleActive,
                                 onDragStart,
                                 onDragEnd,
                                 capitalize
                             }: {
    item: MemberRow;
    index: number;
    totalCount: number;
    onReorder: (from: number, to: number) => void;
    onCycleRole: (index: number) => void;
    onToggleActive: (index: number) => void;
    onDragStart: () => void;
    onDragEnd: () => void;
    capitalize: (str: string) => string;
}) {
    const pan = React.useRef(new Animated.ValueXY()).current;
    const scale = React.useRef(new Animated.Value(1)).current;
    const [isDragging, setIsDragging] = useState(false);

    const CARD_HEIGHT = 90; // Approximate height of each card including separator

    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onStartShouldSetPanResponderCapture: () => false,
            onMoveShouldSetPanResponder: (_, gesture) => {
                // Only set if we're dragging and there's significant movement
                return isDragging && (Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2);
            },
            onMoveShouldSetPanResponderCapture: (_, gesture) => {
                return isDragging && (Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2);
            },
            onPanResponderGrant: () => {
                if (isDragging) {
                    Animated.spring(scale, {
                        toValue: 1.05,
                        useNativeDriver: true,
                    }).start();
                }
            },
            onPanResponderMove: (_, gesture) => {
                if (isDragging) {
                    pan.setValue({ x: 0, y: gesture.dy });
                }
            },
            onPanResponderRelease: (_, gesture) => {
                if (!isDragging) return;

                const movedIndex = Math.round(gesture.dy / CARD_HEIGHT);
                const newIndex = Math.max(0, Math.min(totalCount - 1, index + movedIndex));

                if (newIndex !== index) {
                    onReorder(index, newIndex);
                }

                Animated.parallel([
                    Animated.spring(pan, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: true,
                    }),
                    Animated.spring(scale, {
                        toValue: 1,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    setIsDragging(false);
                    onDragEnd();
                });
            },
            onPanResponderTerminate: () => {
                // Reset if gesture is interrupted
                Animated.parallel([
                    Animated.spring(pan, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: true,
                    }),
                    Animated.spring(scale, {
                        toValue: 1,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    setIsDragging(false);
                    onDragEnd();
                });
            },
        })
    ).current;

    const handleLongPress = () => {
        setIsDragging(true);
        onDragStart();
    };

    const handlePressOut = () => {
        if (!isDragging) return;
        // If user releases without dragging much, cancel drag mode
        setTimeout(() => {
            setIsDragging(false);
            onDragEnd();
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
            }).start();
        }, 100);
    };

    return (
        <View>
            <Animated.View
                style={[
                    {
                        transform: [
                            { translateY: pan.y },
                            { scale: scale }
                        ],
                    },
                    isDragging && styles.dragging
                ]}
            >
                <View
                    {...panResponder.panHandlers}
                    style={{ width: '100%' }}
                >
                    <TouchableOpacity
                        style={[
                            styles.memberCard,
                            isDragging && styles.memberCardDragging
                        ]}
                        onLongPress={handleLongPress}
                        onPressOut={handlePressOut}
                        delayLongPress={400}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="menu"
                            size={20}
                            color="#9CA3AF"
                            style={{ marginRight: 12 }}
                        />

                        <View style={{ flex: 1 }} pointerEvents="none">
                            <Text style={styles.memberName}>{item.name || item.userId}</Text>
                            {!!item.email && <Text style={styles.memberEmail}>{item.email}</Text>}
                            <Text style={styles.memberMeta}>
                                Role: <Text style={styles.bold}>{capitalize(item.role)}</Text> • Order: {item.orderIndex}
                            </Text>
                        </View>

                        <View style={styles.btnGroup} pointerEvents="box-none">
                            <TouchableOpacity
                                style={styles.iconBtn}
                                onPress={() => onCycleRole(index)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="swap-horizontal" size={18} color="#2563EB" />
                            </TouchableOpacity>
                            <ToggleSwitch
                                isActive={item.isActive}
                                onToggle={() => onToggleActive(index)}
                            />
                        </View>
                    </TouchableOpacity>
                </View>
            </Animated.View>
            {index < totalCount - 1 && <View style={styles.sep} />}
        </View>
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
    memberCardDragging: {
        backgroundColor: '#E5E7EB',
    },
    dragging: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 1000,
    },
    memberName: { fontSize: 16, fontWeight: '600', color: '#111827' },
    memberEmail: { fontSize: 12, color: '#6B7280' },
    memberMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    bold: { fontWeight: '700', color: '#111827' },
    btnGroup: { flexDirection: 'row', gap: 12, marginLeft: 12, alignItems: 'center' },
    iconBtn: {
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    toggleContainer: {
        width: 44,
        height: 24,
        borderRadius: 12,
        padding: 2,
        justifyContent: 'center',
    },
    toggleCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    sep: { height: 12 },
    hint: { fontSize: 12, color: '#6B7280', fontStyle: 'italic', marginTop: 12, textAlign: 'center' },
    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#10B981', borderRadius: 10, padding: 16, marginTop: 8
    },
    saveText: { color: '#FFF', fontWeight: '700', marginLeft: 8, fontSize: 16 },
});