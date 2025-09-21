import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface Incident {
    id: string;
    title: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    status: "open" | "investigating" | "resolved";
    timestamp: Date;
    reportedBy: string;
    location?: string;
}

interface IncidentSummaryProps {
    timeframe?: '24h' | '7d' | '30d';
    incidents?: Incident[];
    onTimeframeChange?: (timeframe: '24h' | '7d' | '30d') => void;
}

const IncidentSummary: React.FC<IncidentSummaryProps> = ({
                                                             timeframe = '24h',
                                                             incidents = [],
                                                             onTimeframeChange
                                                         }) => {
    const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
    const [localIncidents, setLocalIncidents] = useState<Incident[]>(incidents);

    // If no incidents prop provided, use mock data
    useEffect(() => {
        if (incidents.length === 0) {
            const mockIncidents: Incident[] = [
                {
                    id: "1",
                    title: "Database Connection Pool Exhausted",
                    description: "Primary database connection pool has reached maximum capacity.",
                    severity: "critical",
                    status: "investigating",
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                    reportedBy: "System Monitor",
                    location: "Data Center A",
                },
                {
                    id: "2",
                    title: "API Response Time Elevated",
                    description: "Authentication API experiencing 5x normal response times.",
                    severity: "high",
                    status: "open",
                    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
                    reportedBy: "Performance Monitor",
                    location: "API Gateway",
                },
                {
                    id: "3",
                    title: "Cache Hit Rate Below Threshold",
                    description: "Redis cache hit rate dropped to 60%, below 85% threshold.",
                    severity: "medium",
                    status: "investigating",
                    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
                    reportedBy: "Cache Monitor",
                    location: "Redis Cluster",
                },
                {
                    id: "4",
                    title: "SSL Certificate Expiring Soon",
                    description: "SSL certificate for api.example.com expires in 7 days.",
                    severity: "low",
                    status: "open",
                    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
                    reportedBy: "Certificate Monitor",
                    location: "Load Balancer",
                },
                {
                    id: "5",
                    title: "Memory Usage Spike Resolved",
                    description: "Application memory usage returned to normal levels.",
                    severity: "medium",
                    status: "resolved",
                    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
                    reportedBy: "Resource Monitor",
                    location: "Application Server",
                },
                {
                    id: "6",
                    title: "Failed Login Attempts High",
                    description: "Unusual spike in failed login attempts detected.",
                    severity: "high",
                    status: "resolved",
                    timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 hours ago
                    reportedBy: "Security Monitor",
                    location: "Authentication Service",
                },
            ];
            setLocalIncidents(mockIncidents);
        } else {
            setLocalIncidents(incidents);
        }
    }, [incidents]);

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

        return incidents.filter(incident => incident.timestamp >= cutoffDate);
    };

    const getIncidentStats = () => {
        const filteredIncidents = filterIncidentsByTimeframe(localIncidents, selectedTimeframe);

        const total = filteredIncidents.length;
        const open = filteredIncidents.filter((i) => i.status === "open").length;
        const investigating = filteredIncidents.filter((i) => i.status === "investigating").length;
        const resolved = filteredIncidents.filter((i) => i.status === "resolved").length;

        const critical = filteredIncidents.filter((i) => i.severity === "critical").length;
        const high = filteredIncidents.filter((i) => i.severity === "high").length;
        const medium = filteredIncidents.filter((i) => i.severity === "medium").length;
        const low = filteredIncidents.filter((i) => i.severity === "low").length;

        return {
            total, open, investigating, resolved,
            severities: { critical, high, medium, low }
        };
    };

    const handleTimeframeChange = (newTimeframe: '24h' | '7d' | '30d') => {
        setSelectedTimeframe(newTimeframe);
        onTimeframeChange?.(newTimeframe);
    };

    const renderSeverityChart = () => {
        const stats = getIncidentStats();
        const { critical, high, medium, low } = stats.severities;
        const total = stats.total;

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

        const maxCount = Math.max(...severityData.map(item => item.count));

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
                                            height: Math.max(maxCount > 0 ? (item.count / maxCount) * 80 : 4, 4),
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
        const stats = getIncidentStats();
        const { open, investigating, resolved, total } = stats;

        if (total === 0) {
            return null;
        }

        const statusData = [
            { label: 'Open', count: open, color: getStatusColor('open') },
            { label: 'Investigating', count: investigating, color: getStatusColor('investigating') },
            { label: 'Resolved', count: resolved, color: getStatusColor('resolved') },
        ].filter(item => item.count > 0); // Only show statuses with incidents

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

    const getTimeframeLabel = (timeframe: string) => {
        switch (timeframe) {
            case '24h': return 'Last 24 Hours';
            case '7d': return 'Last 7 Days';
            case '30d': return 'Last 30 Days';
            default: return timeframe;
        }
    };

    const stats = getIncidentStats();

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

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Quick Stats */}
                <View style={styles.quickStats}>
                    <View style={[styles.statCard, styles.totalCard]}>
                        <IconSymbol name="exclamationmark.triangle" size={20} color="#3B82F6" />
                        <Text style={styles.statNumber}>{stats.total}</Text>
                        <Text style={styles.statLabel}>Total Incidents</Text>
                    </View>

                    <View style={[styles.statCard, styles.criticalCard]}>
                        <IconSymbol name="exclamationmark.circle.fill" size={20} color="#DC2626" />
                        <Text style={styles.statNumber}>{stats.severities.critical}</Text>
                        <Text style={styles.statLabel}>Critical</Text>
                    </View>

                    <View style={[styles.statCard, styles.openCard]}>
                        <IconSymbol name="clock" size={20} color="#EA580C" />
                        <Text style={styles.statNumber}>{stats.open + stats.investigating}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                    </View>
                </View>

                {/* Charts */}
                {renderSeverityChart()}
                {renderStatusChart()}

                {/* Recent Incidents Preview */}
                <View style={styles.recentIncidents}>
                    <Text style={styles.sectionTitle}>Recent Incidents</Text>
                    {filterIncidentsByTimeframe(localIncidents, selectedTimeframe)
                        .slice(0, 3)
                        .map((incident) => (
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
                                    {incident.timestamp.toLocaleString([], {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </Text>
                            </View>
                        ))}

                    {filterIncidentsByTimeframe(localIncidents, selectedTimeframe).length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No incidents in this timeframe</Text>
                            <Text style={styles.emptySubtext}>All systems operational</Text>
                        </View>
                    )}
                </View>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
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
        fontSize: 12,
        fontWeight: '500',
        color: '#6B7280',
    },
    timeframeTextActive: {
        color: '#FFFFFF',
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
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        fontWeight: '500',
    },
    chartContainer: {
        marginBottom: 24,
        backgroundColor: '#FAFBFC',
        borderRadius: 12,
        padding: 16,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    barChart: {
        flexDirection: 'row',
        alignItems: 'end',
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
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 4,
    },
    barCount: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
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
        fontSize: 14,
        color: '#374151',
    },
    pieCount: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
    },
    emptyChart: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
    },
    emptyChartText: {
        fontSize: 14,
        color: '#6B7280',
    },
    recentIncidents: {
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
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
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
        marginRight: 12,
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
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    emptySubtext: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
    },
});

export default IncidentSummary;