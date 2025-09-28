import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getAllIncidents, getAllIncidentStats } from '@/api/incident-controller';
import { Incident, IncidentStatsResponse } from '@/types/incident-types';
import {FONT_FAMILY} from "@/constants/fonts";

interface IncidentSummaryProps {
    timeframe?: '24h' | '7d' | '30d';
    onTimeframeChange?: (timeframe: '24h' | '7d' | '30d') => void;
}

const IncidentSummary: React.FC<IncidentSummaryProps> = ({
                                                             timeframe = '24h',
                                                             onTimeframeChange
                                                         }) => {
    const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [stats, setStats] = useState<IncidentStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Auto-refresh interval (30 seconds)
    const AUTO_REFRESH_INTERVAL = 30000;

    const loadIncidentData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch both incidents and stats in parallel
            const [incidentsResponse, statsResponse] = await Promise.all([
                getAllIncidents(),
                getAllIncidentStats(selectedTimeframe) // Actually call the API
            ]);

            // Extract incidents - they're directly in data array
            if (incidentsResponse.data && Array.isArray(incidentsResponse.data)) {
                setIncidents(incidentsResponse.data);
            } else if (incidentsResponse.data) {
                setIncidents(incidentsResponse.data);
            }

            // Extract stats
            if (statsResponse.data) {
                setStats(statsResponse.data);
            }
        } catch (err) {
            console.error('Failed to load incident data:', err);
            setError('Unable to load incident data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Load data from API
    useEffect(() => {
        loadIncidentData();
    }, [selectedTimeframe]);

    // Sync with parent timeframe changes
    useEffect(() => {
        if (timeframe !== selectedTimeframe) {
            setSelectedTimeframe(timeframe);
        }
    }, [timeframe]);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "critical":
                return "#DC2626";
            case "high":
                return "#EA580C";
            case "medium":
                return "#D97706";
            case "low":
                return "#16A34A";
            default:
                return "#6B7280";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "open":
                return "#DC2626";
            case "investigating":
                return "#D97706";
            case "resolved":
                return "#16A34A";
            default:
                return "#6B7280";
        }
    };

    const filterIncidentsByTimeframe = (incidents: Incident[], timeframe: string) => {
        const now = new Date();
        let cutoffDate: Date;

        switch (timeframe) {
            case '24h':
                cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                cutoffDate = new Date(0);
        }

        return incidents.filter(incident => {
            const incidentDate = new Date(incident.timestamp || incident.created_at);
            return incidentDate >= cutoffDate;
        });
    };

    const getIncidentStats = () => {
        // Use API stats if available
        if (stats) {
            return {
                total: stats.total || 0,
                open: stats.open || 0,
                investigating: stats.investigating || 0,
                resolved: stats.resolved || 0,
                severities: stats.severities || {
                    critical: 0,
                    high: 0,
                    medium: 0,
                    low: 0,
                }
            };
        }

        // Fallback to manual calculation from incidents
        const filteredIncidents = filterIncidentsByTimeframe(incidents, selectedTimeframe);

        return {
            total: filteredIncidents.length,
            open: filteredIncidents.filter(i => i.status === "open").length,
            investigating: filteredIncidents.filter(i => i.status === "investigating").length,
            resolved: filteredIncidents.filter(i => i.status === "resolved").length,
            severities: {
                critical: filteredIncidents.filter(i => i.severity === "critical").length,
                high: filteredIncidents.filter(i => i.severity === "high").length,
                medium: filteredIncidents.filter(i => i.severity === "medium").length,
                low: filteredIncidents.filter(i => i.severity === "low").length,
            }
        };
    };

    const handleTimeframeChange = (newTimeframe: '24h' | '7d' | '30d') => {
        setSelectedTimeframe(newTimeframe);
        onTimeframeChange?.(newTimeframe);
    };

    const renderSeverityChart = () => {
        const currentStats = getIncidentStats();
        const { critical, high, medium, low } = currentStats.severities;
        const total = currentStats.total;

        if (total === 0) {
            return (
                <View style={styles.emptyChart}>
                    <Text style={styles.emptyChartText}>No incidents in this timeframe</Text>
                </View>
            );
        }

        const severityData = [
            { label: 'Critical', count: critical, color: getSeverityColor('critical') },
            { label: 'High', count: high, color: getSeverityColor('high') },
            { label: 'Medium', count: medium, color: getSeverityColor('medium') },
            { label: 'Low', count: low, color: getSeverityColor('low') },
        ];

        const maxCount = Math.max(...severityData.map(item => item.count), 1);

        return (
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Severity Distribution</Text>
                <View style={styles.barChart}>
                    {severityData.map((item, index) => (
                        <View key={index} style={styles.barContainer}>
                            <View style={styles.barWrapper}>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            height: Math.max((item.count / maxCount) * 80, 4),
                                            backgroundColor: item.color,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.barLabel}>{item.label}</Text>
                            <Text style={styles.barCount}>{item.count}</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const renderStatusChart = () => {
        const currentStats = getIncidentStats();
        const { open, investigating, resolved, total } = currentStats;

        if (total === 0) {
            return null;
        }

        const statusData = [
            { label: 'Open', count: open, color: getStatusColor('open') },
            { label: 'Investigating', count: investigating, color: getStatusColor('investigating') },
            { label: 'Resolved', count: resolved, color: getStatusColor('resolved') },
        ].filter(item => item.count > 0);

        return (
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Status Distribution</Text>
                <View style={styles.pieChartContainer}>
                    {statusData.map((item, index) => (
                        <View key={index} style={styles.pieItem}>
                            <View style={[styles.pieIndicator, { backgroundColor: item.color }]} />
                            <View style={styles.pieTextContainer}>
                                <Text style={styles.pieLabel}>{item.label}</Text>
                                <Text style={styles.pieCount}>
                                    {item.count} ({Math.round((item.count / total) * 100)}%)
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const formatIncidentTime = (incident: Incident) => {
        const date = new Date(incident.timestamp || incident.created_at);
        return date.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTimeframeLabel = (timeframe: string) => {
        switch (timeframe) {
            case '24h': return 'Last 24 Hours';
            case '7d': return 'Last 7 Days';
            case '30d': return 'Last 30 Days';
            default: return timeframe;
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading incident summary...</Text>
            </View>
        );
    }

    const currentStats = getIncidentStats();
    const recentIncidents = filterIncidentsByTimeframe(incidents, selectedTimeframe)
        .sort((a, b) => {
            const dateA = new Date(a.timestamp || a.created_at).getTime();
            const dateB = new Date(b.timestamp || b.created_at).getTime();
            return dateB - dateA;
        })
        .slice(0, 3);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Incident Summary</Text>
                <View style={styles.timeframeSelector}>
                    {['24h', '7d', '30d'].map((period) => (
                        <TouchableOpacity
                            key={period}
                            style={[
                                styles.timeframeButton,
                                selectedTimeframe === period && styles.timeframeButtonActive,
                            ]}
                            onPress={() => handleTimeframeChange(period as '24h' | '7d' | '30d')}
                            disabled={loading}
                        >
                            <Text
                                style={[
                                    styles.timeframeText,
                                    selectedTimeframe === period && styles.timeframeTextActive,
                                ]}
                            >
                                {period}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <Text style={styles.subtitle}>{getTimeframeLabel(selectedTimeframe)}</Text>

            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={loadIncidentData} style={styles.retryButton}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Quick Stats */}
                <View style={styles.quickStats}>
                    <View style={[styles.statCard, styles.totalCard]}>
                        <IconSymbol name="exclamationmark.triangle" size={20} color="#3B82F6" />
                        <Text style={styles.statNumber}>{currentStats.total}</Text>
                        <Text style={styles.statLabel}>Total Incidents</Text>
                    </View>

                    <View style={[styles.statCard, styles.criticalCard]}>
                        <IconSymbol name="exclamationmark.circle.fill" size={20} color="#DC2626" />
                        <Text style={styles.statNumber}>{currentStats.severities.critical}</Text>
                        <Text style={styles.statLabel}>Critical</Text>
                    </View>

                    <View style={[styles.statCard, styles.openCard]}>
                        <IconSymbol name="clock" size={20} color="#EA580C" />
                        <Text style={styles.statNumber}>{currentStats.open + currentStats.investigating}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                    </View>
                </View>

                {/* Charts */}
                {!error && (
                    <>
                        {renderSeverityChart()}
                        {renderStatusChart()}
                    </>
                )}

                {/* Recent Incidents Preview */}
                {!error && (
                    <View style={styles.recentIncidents}>
                        <Text style={styles.sectionTitle}>Recent Incidents</Text>
                        {recentIncidents.map((incident) => (
                            <View key={incident.id} style={styles.incidentPreview}>
                                <View style={styles.incidentPreviewHeader}>
                                    <Text style={styles.incidentPreviewTitle} numberOfLines={1}>
                                        {incident.title}
                                    </Text>
                                    <View style={styles.incidentPreviewBadges}>
                                        <View
                                            style={[
                                                styles.statusDot,
                                                { backgroundColor: getStatusColor(incident.status) },
                                            ]}
                                        />
                                        <View
                                            style={[
                                                styles.severityDot,
                                                { backgroundColor: getSeverityColor(incident.severity) },
                                            ]}
                                        />
                                    </View>
                                </View>
                                <Text style={styles.incidentPreviewTime}>
                                    {formatIncidentTime(incident)}
                                </Text>
                            </View>
                        ))}

                        {recentIncidents.length === 0 && (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No incidents in this timeframe</Text>
                                <Text style={styles.emptySubtext}>All systems operational</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        margin: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    loadingContainer: {
        minHeight: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 13,
        color: '#6B7280',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    errorContainer: {
        backgroundColor: '#FEE2E2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    errorText: {
        color: '#DC2626',
        fontSize: 13,
        flex: 1,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    retryButton: {
        backgroundColor: '#DC2626',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        marginLeft: 12,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '500',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    subtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 16,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    timeframeSelector: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 2,
    },
    timeframeButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    timeframeButtonActive: {
        backgroundColor: '#3B82F6',
    },
    timeframeText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#6B7280',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    timeframeTextActive: {
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    quickStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 8,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    totalCard: { backgroundColor: '#EFF6FF' },
    criticalCard: { backgroundColor: '#FEF2F2' },
    openCard: { backgroundColor: '#FEF3C7' },
    statNumber: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        marginTop: 8,
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    statLabel: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 4,
        fontWeight: '500',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    chartContainer: {
        marginBottom: 24,
        backgroundColor: '#FAFBFC',
        borderRadius: 12,
        padding: 16,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    barChart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 140,
        paddingHorizontal: 8,
    },
    barContainer: {
        alignItems: 'center',
        flex: 1,
    },
    barWrapper: {
        height: 110,
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 12,
    },
    bar: {
        width: 36,
        borderRadius: 6,
        minHeight: 8,
    },
    barLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 4,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    barCount: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    pieChartContainer: {
        paddingVertical: 8,
    },
    pieItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    pieIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    pieTextContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    pieLabel: {
        fontSize: 13,
        color: '#374151',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    pieCount: {
        fontSize: 13,
        fontWeight: '500',
        color: '#111827',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    emptyChart: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
    },
    emptyChartText: {
        fontSize: 13,
        color: '#6B7280',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    recentIncidents: {
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    incidentPreview: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    incidentPreviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    incidentPreviewTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
        marginRight: 12,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    incidentPreviewBadges: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    severityDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    incidentPreviewTime: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    emptyText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    emptySubtext: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 4,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
});

export default IncidentSummary;