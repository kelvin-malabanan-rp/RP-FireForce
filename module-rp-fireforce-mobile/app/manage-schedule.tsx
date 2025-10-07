// app/manage-schedule.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { oncallController } from '@/api/oncall-schedule-controller';
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {LinearGradient} from "expo-linear-gradient";
import {FONT_FAMILY} from "@/constants/fonts";

// Simple Toggle Switch Component
function ToggleSwitch({ isActive, onToggle }: { isActive: boolean; onToggle: () => void }) {
    return (
        <TouchableOpacity
            onPress={onToggle}
            style={[
                styles.toggleContainer,
                { backgroundColor: isActive ? '#10B981' : '#D1D5DB' }
            ]}
            activeOpacity={0.8}
        >
            <View
                style={[
                    styles.toggleCircle,
                    { marginLeft: isActive ? 20 : 2 }
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
    rotationStartISO: string;
    members: MemberRow[];
};

// Date Picker Component
function DatePickerField({
                             value,
                             onChange
                         }: {
    value: string;
    onChange: (date: string) => void;
}) {
    const [isVisible, setIsVisible] = useState(false);

    const formatUTC = (isoString: string) => {
        try {
            const d = new Date(isoString);
            const options: Intl.DateTimeFormatOptions = {
                timeZone: 'UTC',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                weekday: 'short'
            };
            return d.toLocaleString('en-US', options) + ' UTC';
        } catch {
            return 'Invalid date';
        }
    };

    const handleConfirm = (date: Date) => {
        onChange(date.toISOString());
        setIsVisible(false);
    };

    return (
        <View>
            <TouchableOpacity
                style={styles.dateDisplay}
                onPress={() => setIsVisible(true)}
            >
                <Ionicons name="calendar-outline" size={20} color="#F97316" />
                <Text style={styles.dateDisplayText}>
                    {formatUTC(value)}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>

            <DateTimePickerModal
                isVisible={isVisible}
                mode="datetime"
                date={new Date(value)}
                onConfirm={handleConfirm}
                onCancel={() => setIsVisible(false)}
            />

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    onPress={() => onChange(new Date().toISOString())}
                    style={styles.dateBtn}
                >
                    <Ionicons name="time" size={16} color="#F97316" />
                    <Text style={styles.dateBtnText}>Set to now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        tomorrow.setHours(0, 0, 0, 0);
                        onChange(tomorrow.toISOString());
                    }}
                    style={styles.dateBtn}
                >
                    <Ionicons name="calendar" size={16} color="#F97316" />
                    <Text style={styles.dateBtnText}>Tomorrow</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => {
                        const nextMonday = new Date();
                        const day = nextMonday.getDay();
                        const daysUntilMonday = day === 0 ? 1 : 8 - day;
                        nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
                        nextMonday.setHours(0, 0, 0, 0);
                        onChange(nextMonday.toISOString());
                    }}
                    style={styles.dateBtn}
                >
                    <Ionicons name="calendar-outline" size={16} color="#F97316" />
                    <Text style={styles.dateBtnText}>Next Monday</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// Calendar Preview Component
function CalendarPreview({
                             config
                         }: {
    config: ScheduleConfig;
}) {
    const [schedule, setSchedule] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSchedule();
    }, [config]);

    const loadSchedule = async () => {
        try {
            setLoading(true);
            const result = await oncallController.getSchedule(config.teamId, 14);
            setSchedule(result.schedule || []);
        } catch (e) {
            console.error('Failed to load schedule preview', e);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <View style={styles.calendarContainer}>
                <ActivityIndicator size="small" />
                <Text style={styles.muted}>Loading preview...</Text>
            </View>
        );
    }

    return (
        <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
                <Ionicons name="calendar" size={20} color="#F97316" />
                <Text style={styles.calendarTitle}>14-Day Schedule Preview</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.calendarGrid}>
                    {schedule.map((day, index) => {
                        const isToday = day.isToday;
                        const primary = day.assignment?.primary;

                        return (
                            <View
                                key={index}
                                style={[
                                    styles.dayCard,
                                    isToday && styles.dayCardToday
                                ]}
                            >
                                <Text style={[
                                    styles.dayDate,
                                    isToday && styles.dayDateToday
                                ]}>
                                    {formatDate(day.date)}
                                </Text>
                                <Text style={styles.dayOfWeek}>
                                    {day.dayOfWeek}
                                </Text>
                                {primary ? (
                                    <>
                                        <Text style={styles.onCallName} numberOfLines={1}>
                                            {primary.firstName} {primary.lastName}
                                        </Text>
                                        <View style={styles.roleBadge}>
                                            <Text style={styles.roleBadgeText}>Primary</Text>
                                        </View>
                                    </>
                                ) : (
                                    <Text style={styles.noOnCall}>No one</Text>
                                )}
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}

// Member Card Component
function MemberCard({
                        member,
                        onMoveUp,
                        onMoveDown,
                        onCycleRole,
                        onToggleActive,
                        isFirst,
                        isLast
                    }: {
    member: MemberRow;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onCycleRole: () => void;
    onToggleActive: () => void;
    isFirst: boolean;
    isLast: boolean;
}) {
    return (
        <View style={styles.memberCard}>
            <View style={styles.arrowContainer}>
                <TouchableOpacity
                    onPress={onMoveUp}
                    disabled={isFirst}
                    style={styles.arrowBtn}
                >
                    <Text style={[styles.arrowText, { color: isFirst ? '#64748B' : '#F97316' }]}>
                        ▲
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onMoveDown}
                    disabled={isLast}
                    style={styles.arrowBtn}
                >
                    <Text style={[styles.arrowText, { color: isLast ? '#D1D5DB' : '#F97316' }]}>
                        ▼
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{member.name}</Text>
                {!!member.email && <Text style={styles.memberEmail}>{member.email}</Text>}
                <Text style={styles.memberMeta}>
                    Role: <Text style={styles.bold}>{member.role}</Text> • Order: {member.orderIndex}
                </Text>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={onCycleRole}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="swap-horizontal" size={18} color="#F97316" />
                </TouchableOpacity>
                <ToggleSwitch isActive={member.isActive} onToggle={onToggleActive} />
            </View>
        </View>
    );
}

export default function ManageSchedule() {
    const router = useRouter();
    const { teamId: teamIdParam } = useLocalSearchParams<{ teamId?: string }>();
    const teamId = teamIdParam ?? 'team-1';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [cfg, setCfg] = useState<ScheduleConfig | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await oncallController.getScheduleConfig(teamId);
            const normalized: ScheduleConfig = {
                teamId,
                rotationType: data.rotationType ?? 'weekly',
                rotationStartISO: data.rotationStartISO ?? new Date().toISOString(),
                members: (data.members ?? []).map((m: any, i: number) => {
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
                        name: displayName || m.userId,
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

    const moveUp = (index: number) => {
        if (!cfg || index === 0) return;
        const next = [...cfg.members];
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
        next.forEach((m, i) => (m.orderIndex = i));
        setCfg({ ...cfg, members: next });
    };

    const moveDown = (index: number) => {
        if (!cfg || index === cfg.members.length - 1) return;
        const next = [...cfg.members];
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
        next.forEach((m, i) => (m.orderIndex = i));
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

    const toggleActive = (index: number) => {
        if (!cfg) return;
        const next = [...cfg.members];
        next[index].isActive = !next[index].isActive;
        setCfg({ ...cfg, members: next });
    };

    const save = async () => {
        if (!cfg) return;
        setSaving(true);
        try {
            const rotationLengthHours =
                cfg.rotationType === 'daily' ? 24 :
                    cfg.rotationType === 'weekly' ? 168 :
                        cfg.rotationType === 'biweekly' ? 336 : 720;

            await oncallController.updateScheduleConfig({
                teamId: cfg.teamId,
                rotationType: cfg.rotationType,
                rotationLengthHours,
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
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#F97316" />
                </TouchableOpacity>
                <Text style={styles.title}>Manage Schedule</Text>
                <View style={{ width: 24 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Rotation Type */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Rotation Schedule</Text>
                    <Text style={styles.sectionDesc}>How often should the on-call person change?</Text>
                    <View style={styles.chipGrid}>
                        {[
                            { value: 'daily', label: 'Daily', desc: '24 hours' },
                            { value: 'weekly', label: 'Weekly', desc: '7 days' },
                            { value: 'biweekly', label: 'Bi-weekly', desc: '14 days' },
                            { value: 'monthly', label: 'Monthly', desc: '30 days' }
                        ].map(({ value, label, desc }) => (
                            <TouchableOpacity
                                key={value}
                                style={styles.chipWrapper}
                                onPress={() => setCfg({ ...cfg, rotationType: value as any })}
                            >
                                {cfg.rotationType === value ? (
                                    <LinearGradient
                                        colors={['#F97316', '#DC2626']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.chipActive}
                                    >
                                        <Text style={styles.chipLabelActive}>
                                            {label}
                                        </Text>
                                        <Text style={styles.chipDescActive}>
                                            {desc}
                                        </Text>
                                    </LinearGradient>
                                ) : (
                                    <View style={styles.chip}>
                                        <Text style={styles.chipLabel}>
                                            {label}
                                        </Text>
                                        <Text style={styles.chipDesc}>
                                            {desc}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Start Date */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Rotation Start Date (UTC)</Text>
                    <Text style={styles.sectionDesc}>When should this rotation schedule begin?</Text>
                    <DatePickerField
                        value={cfg.rotationStartISO}
                        onChange={(date) => setCfg({ ...cfg, rotationStartISO: date })}
                    />
                </View>

                {/* Calendar Preview */}
                <View style={styles.section}>
                    <CalendarPreview config={cfg} />
                </View>

                {/* Members */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Team Members</Text>
                    <Text style={styles.sectionDesc}>
                        Arrange team members in rotation order (first person starts on-call)
                    </Text>
                    {cfg.members.map((member, index) => (
                        <MemberCard
                            key={member.userId}
                            member={member}
                            onMoveUp={() => moveUp(index)}
                            onMoveDown={() => moveDown(index)}
                            onCycleRole={() => cycleRole(index)}
                            onToggleActive={() => toggleActive(index)}
                            isFirst={index === 0}
                            isLast={index === cfg.members.length - 1}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.saveBtnWrapper}
                    onPress={save}
                    disabled={saving}
                >
                    <LinearGradient
                        colors={['#F97316', '#DC2626']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                    >
                        <Ionicons name="save" size={20} color="#FFFFFF" />
                        <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save changes'}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A'
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
    scrollContent: {
        padding: 16,
        paddingBottom: 32
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    muted: {
        color: '#94A3B8',
        marginTop: 8,
        fontSize: 14,
        textAlign: 'center'
    },
    section: {
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4
    },
    sectionDesc: {
        fontSize: 14,
        color: '#94A3B8',
        marginBottom: 12
    },
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'space-between',
    },
    chipWrapper: {
        width: '48%',
        borderRadius: 8,
        overflow: 'hidden',
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderWidth: 1,
        borderColor: '#334155',
        alignItems: 'center',
        minHeight: 70,
        justifyContent: 'center',
    },
    chipActive: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        minHeight: 70,
        justifyContent: 'center',
    },
    chipLabel: {
        color: '#CBD5E1',
        fontWeight: '600',
        fontSize: 14
    },
    chipLabelActive: {
        color: '#FFFFFF'
    },
    chipDesc: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4,
        fontWeight: 'normal'
    },
    chipDescActive: {
        color: 'rgba(255, 255, 255, 0.9)'
    },
    dateDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(249, 115, 22, 0.15)',
        padding: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#F97316',
        gap: 12,
        marginBottom: 12
    },
    dateDisplayText: {
        fontSize: 16,
        color: '#FB923C',
        fontWeight: '600',
        flex: 1
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 8,
    },
    dateBtn: {
        flex: 1, // ✅ Equal width for all buttons
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // ✅ Center content
        gap: 4, // ✅ Reduced gap
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        paddingHorizontal: 8, // ✅ Reduced padding
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#334155'
    },
    dateBtnText: {
        color: '#FB923C',
        fontWeight: '600',
        fontSize: 12, // ✅ Slightly smaller text
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 12
    },
    arrowContainer: {
        flexDirection: 'column',
        marginRight: 12
    },
    arrowBtn: {
        padding: 4
    },
    arrowText: {
        fontSize: 16,
        lineHeight: 16
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF'
    },
    memberEmail: {
        fontSize: 12,
        color: '#94A3B8'
    },
    memberMeta: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2
    },
    bold: {
        fontWeight: '700',
        color: '#CBD5E1'
    },
    controls: {
        flexDirection: 'row',
        gap: 12,
        marginLeft: 12,
        alignItems: 'center'
    },
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
    calendarContainer: {
        marginTop: 8,
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    calendarTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF'
    },
    calendarGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    dayCard: {
        width: 120,
        padding: 12,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },
    dayCardToday: {
        backgroundColor: 'rgba(249, 115, 22, 0.2)',
        borderColor: '#F97316',
        borderWidth: 2,
    },
    dayDate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    dayDateToday: {
        color: '#FB923C',
    },
    dayOfWeek: {
        fontSize: 12,
        color: '#94A3B8',
        marginBottom: 8,
    },
    onCallName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#CBD5E1',
        marginBottom: 4,
    },
    roleBadge: {
        backgroundColor: 'rgba(249, 115, 22, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    roleBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FB923C',
    },
    noOnCall: {
        fontSize: 12,
        color: '#64748B',
        fontStyle: 'italic',
    },
    saveBtnWrapper: {
        borderRadius: 10,
        overflow: 'hidden',
        marginTop: 8,
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        padding: 16,
    },
    saveText: {
        color: '#FFF',
        fontWeight: '700',
        marginLeft: 8,
        fontSize: 16
    },
});