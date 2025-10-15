import { useState, useEffect } from 'react';
import {
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    StyleSheet,
    View,
    Platform,
    TouchableOpacity,
    Text
} from 'react-native';
import { getAllIncidents, getAllIncidentStats } from '@/api/incident-controller';
import { FONT_FAMILY } from '@/constants/fonts';
import { Incident } from '@/types/incident-types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { retrieveUserSession } from '@/constants/local-storage';

export default function HomeScreen() {
    const router = useRouter();
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>('');

    const AUTO_REFRESH_INTERVAL = 30000;

    useEffect(() => {
        loadUserSession();
        loadData();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            loadData(true);
        }, AUTO_REFRESH_INTERVAL);

        return () => clearInterval(interval);
    }, []);

    const loadUserSession = async () => {
        try {
            const session = await retrieveUserSession();
            if (session) {
                const name = session.firstName && session.lastName
                    ? `${session.firstName} ${session.lastName}`
                    : session.firstName || session.email?.split('@')[0] || 'User';
                setUserName(name);
            }
        } catch (error) {
            console.error('Error loading user session:', error);
        }
    };

    const loadData = async (isAutoRefresh = false) => {
        try {
            if (!isAutoRefresh) {
                setError(null);
            }

            const [incidentsResponse, statsResponse] = await Promise.all([
                getAllIncidents(),
                getAllIncidentStats('24h')
            ]);

            if (incidentsResponse.data && Array.isArray(incidentsResponse.data)) {
                setIncidents(incidentsResponse.data);
            } else if (incidentsResponse.data) {
                setIncidents(incidentsResponse.data);
            }

            if (statsResponse.data) {
                setStats(statsResponse.data);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            if (!isAutoRefresh) {
                setError('Failed to load incidents. Pull to refresh.');
            }
        } finally {
            if (!isAutoRefresh) {
                setLoading(false);
            }
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            setError(null);
            await loadData();
        } catch (error) {
            console.error('Failed to refresh data:', error);
            setError('Failed to refresh incidents.');
        } finally {
            setRefreshing(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getRecentIncidents = () => {
        return incidents
            .sort((a, b) => new Date(b.timestamp || b.createdAt || '').getTime() -
                new Date(a.timestamp || a.createdAt || '').getTime())
            .slice(0, 3);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'open':
                return '#DC2626';
            case 'investigating':
                return '#F59E0B';
            case 'resolved':
                return '#10B981';
            default:
                return '#6B7280';
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical':
                return ['#DC2626', '#B91C1C'];
            case 'high':
                return ['#EA580C', '#C2410C'];
            case 'medium':
                return ['#D97706', '#B45309'];
            case 'low':
                return ['#16A34A', '#15803D'];
            default:
                return ['#6B7280', '#4B5563'];
        }
    };

    const getRelativeTime = (timestamp: string) => {
        const now = new Date().getTime();
        const time = new Date(timestamp).getTime();
        const diff = now - time;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F97316" />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
        );
    }

    const recentIncidents = getRecentIncidents();

    // Calculate stats directly from incidents data for accuracy
    const activeIncidents = incidents.filter(i =>
        i.status === 'open' || i.status === 'investigating'
    ).length;

    const resolvedIncidents = incidents.filter(i => i.status === 'resolved').length;

    const criticalIncidents = incidents.filter(i => i.severity === 'critical').length;

    const totalIncidents = incidents.length;

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#F97316']}
                        tintColor="#F97316"
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>{getGreeting()} 👋</Text>
                        <Text style={styles.subtitle}>{userName}</Text>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <LinearGradient
                            colors={['#DC2626', '#B91C1C']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.statGradient}
                        >
                            <Ionicons name="flame" size={28} color="#FFFFFF" />
                            <Text style={styles.statValue}>{activeIncidents}</Text>
                            <Text style={styles.statLabel}>Active</Text>
                        </LinearGradient>
                    </View>

                    <View style={styles.statCard}>
                        <LinearGradient
                            colors={['#10B981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.statGradient}
                        >
                            <Ionicons name="checkmark-circle" size={28} color="#FFFFFF" />
                            <Text style={styles.statValue}>{resolvedIncidents}</Text>
                            <Text style={styles.statLabel}>Resolved</Text>
                        </LinearGradient>
                    </View>

                    <View style={styles.statCard}>
                        <LinearGradient
                            colors={['#F59E0B', '#D97706']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.statGradient}
                        >
                            <Ionicons name="alert-circle" size={28} color="#FFFFFF" />
                            <Text style={styles.statValue}>{criticalIncidents}</Text>
                            <Text style={styles.statLabel}>Critical</Text>
                        </LinearGradient>
                    </View>

                    <View style={styles.statCard}>
                        <LinearGradient
                            colors={['#8B5CF6', '#7C3AED']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.statGradient}
                        >
                            <Ionicons name="layers" size={28} color="#FFFFFF" />
                            <Text style={styles.statValue}>{totalIncidents}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </LinearGradient>
                    </View>
                </View>

                {/* Recent Incidents */}
                <View style={styles.recentSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Incidents</Text>
                        <TouchableOpacity onPress={() => router.push('/tabs/incidents')}>
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    {recentIncidents.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="checkmark-circle-outline" size={64} color="#64748B" />
                            <Text style={styles.emptyStateTitle}>All Clear!</Text>
                            <Text style={styles.emptyStateText}>No recent incidents to display</Text>
                        </View>
                    ) : (
                        recentIncidents.map((incident) => (
                            <TouchableOpacity
                                key={incident.id}
                                style={styles.incidentCard}
                                onPress={() => router.push({
                                    pathname: '/inner-incident-page',
                                    params: { incidentId: incident.id }
                                })}
                            >
                                <View style={styles.incidentHeader}>
                                    <LinearGradient
                                        colors={getSeverityColor(incident.severity)}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.severityBadge}
                                    >
                                        <Text style={styles.severityText}>
                                            {incident.severity.toUpperCase()}
                                        </Text>
                                    </LinearGradient>
                                    <View style={styles.incidentStatus}>
                                        <View
                                            style={[
                                                styles.statusDot,
                                                { backgroundColor: getStatusColor(incident.status) }
                                            ]}
                                        />
                                        <Text style={styles.statusText}>{incident.status}</Text>
                                    </View>
                                </View>

                                <Text style={styles.incidentTitle} numberOfLines={2}>
                                    {incident.title}
                                </Text>

                                <View style={styles.incidentFooter}>
                                    <View style={styles.incidentMeta}>
                                        <Ionicons name="time-outline" size={14} color="#94A3B8" />
                                        <Text style={styles.incidentTime}>
                                            {getRelativeTime(incident.timestamp || incident.createdAt || '')}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#F97316" />
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* System Status */}
                <View style={styles.systemStatus}>
                    <Text style={styles.sectionTitle}>System Status</Text>
                    <View style={styles.statusCard}>
                        <View style={styles.statusRow}>
                            <View style={styles.statusIndicator}>
                                <View style={[styles.statusDotLarge, { backgroundColor: activeIncidents > 0 ? '#DC2626' : '#10B981' }]} />
                                <Text style={styles.statusLabel}>Operations</Text>
                            </View>
                            <Text style={styles.statusValue}>
                                {activeIncidents > 0 ? 'Active Issues' : 'All Systems Operational'}
                            </Text>
                        </View>

                        <View style={styles.statusRow}>
                            <View style={styles.statusIndicator}>
                                <View style={[styles.statusDotLarge, { backgroundColor: '#10B981' }]} />
                                <Text style={styles.statusLabel}>Response Time</Text>
                            </View>
                            <Text style={styles.statusValue}>Normal</Text>
                        </View>

                        <View style={[styles.statusRow, { borderBottomWidth: 0 }]}>
                            <View style={styles.statusIndicator}>
                                <View style={[styles.statusDotLarge, { backgroundColor: '#10B981' }]} />
                                <Text style={styles.statusLabel}>Team Availability</Text>
                            </View>
                            <Text style={styles.statusValue}>Online</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0F172A',
    },
    loadingText: {
        marginTop: 16,
        color: '#94A3B8',
        fontSize: 15,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: Platform.OS === 'ios' ? 100 : 80,
        paddingBottom: 20,
    },
    header: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    greeting: {
        fontSize: 28,
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    subtitle: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 4,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 10,
        marginBottom: 24,
    },
    statCard: {
        width: '48%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    statGradient: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 28,
        color: '#FFFFFF',
        marginTop: 6,
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 2,
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    sectionTitle: {
        fontSize: 18,
        color: '#FFFFFF',
        marginBottom: 12,
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    recentSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    viewAllText: {
        fontSize: 14,
        color: '#F97316',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    emptyState: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    emptyStateTitle: {
        fontSize: 20,
        color: '#FFFFFF',
        marginTop: 16,
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 8,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    incidentCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    incidentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    severityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    severityText: {
        fontSize: 11,
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    incidentStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        color: '#94A3B8',
        textTransform: 'capitalize',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    incidentTitle: {
        fontSize: 15,
        color: '#FFFFFF',
        marginBottom: 12,
        lineHeight: 22,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    incidentFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    incidentMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    incidentTime: {
        fontSize: 12,
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    systemStatus: {
        paddingHorizontal: 20,
        marginBottom: 80,
    },
    statusCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#334155',
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statusDotLarge: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    statusLabel: {
        fontSize: 14,
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    statusValue: {
        fontSize: 14,
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
});