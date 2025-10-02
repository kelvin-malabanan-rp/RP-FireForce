import { useState, useEffect } from 'react';
import {
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    StyleSheet
} from 'react-native';
import {getAllIncidents, getAllIncidentStats} from '@/api/incident-controller';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import IncidentSummary from '@/components/incident-summary';
import { FONT_FAMILY } from '@/constants/fonts';
import { Incident } from '@/types/incident-types';

export default function HomeScreen() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');

    // Auto-refresh interval (30 seconds)
    const AUTO_REFRESH_INTERVAL = 30000;

    // Load data on component mount
    useEffect(() => {
        loadData();
    }, []);

    // Set up auto-refresh
    useEffect(() => {
        const interval = setInterval(() => {
            loadData(true);
        }, AUTO_REFRESH_INTERVAL);

        return () => clearInterval(interval);
    }, [timeframe]);

    const loadData = async (isAutoRefresh = false) => {
        try {
            if (!isAutoRefresh) {
                setError(null);
            }

            // Fetch both incidents and stats in parallel
            const [incidentsResponse, statsResponse] = await Promise.all([
                getAllIncidents(),
                getAllIncidentStats(timeframe)
            ]);

            // Extract incidents - they're directly in data array
            if (incidentsResponse.data && Array.isArray(incidentsResponse.data)) {
                setIncidents(incidentsResponse.data);
            } else if (incidentsResponse.data) {
                setIncidents(incidentsResponse.data);
            }

            // Extract stats from the wrapped response
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

    const handleTimeframeChange = (newTimeframe: '24h' | '7d' | '30d') => {
        setTimeframe(newTimeframe);
    };

    if (loading) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
                <ThemedText style={styles.loadingText}>Loading incidents...</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#6366F1']} // Android
                        tintColor="#6366F1" // iOS
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Incident Summary Component */}
                <IncidentSummary
                    timeframe={timeframe}
                    onTimeframeChange={handleTimeframeChange}
                />
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    loadingText: {
        marginTop: 16,
        color: '#6B7280',
        fontSize: 15,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    scrollView: {
        flex: 1,
    },
    incidentsSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        margin: 16,
        marginTop: 0,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    errorContainer: {
        backgroundColor: '#FEE2E2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    errorText: {
        color: '#DC2626',
        fontSize: 13,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomWidth: 2,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        marginRight: 6,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    activeTabText: {
        fontWeight: '700',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        minWidth: 24,
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    cardsContainer: {
        marginHorizontal: -4,
    },
    cardWrapper: {
        marginBottom: 12,
        marginHorizontal: 4,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    emptySubtext: {
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 4,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    statsFooter: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    statsText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        marginTop: 8,
    },
    paginationButton: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        minWidth: 80,
        alignItems: 'center',
    },
    paginationButtonDisabled: {
        backgroundColor: '#F9FAFB',
        opacity: 0.5,
    },
    paginationButtonText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    paginationButtonTextDisabled: {
        color: '#9CA3AF',
    },
    paginationInfo: {
        alignItems: 'center',
    },
    paginationText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    paginationSubtext: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    incidentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    incidentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    incidentTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
        marginRight: 8,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    severityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    severityText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    incidentDescription: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 12,
        lineHeight: 18,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    incidentFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    incidentLocation: {
        fontSize: 11,
        color: '#6B7280',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    incidentTime: {
        fontSize: 11,
        color: '#6B7280',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
});