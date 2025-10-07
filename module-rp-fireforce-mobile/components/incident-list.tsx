import { IconSymbol } from "@/components/ui/icon-symbol";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { getSeverityColor } from "@/constants/colors";
import { IncidentUI } from "@/types/incident-types";
import { FONT_FAMILY } from '@/constants/fonts';
import {LinearGradient} from "expo-linear-gradient";

const ITEMS_PER_PAGE = 5;

interface IncidentListProps {
    incidents: IncidentUI[];
    error?: string | null;
}

export default function IncidentList({ incidents, error }: IncidentListProps) {
    const router = useRouter();
    const [selectedStatusTab, setSelectedStatusTab] = useState<string>("open");
    const [currentPageNum, setCurrentPageNum] = useState(0);

    // Status tabs configuration
    const statusTabs = [
        {
            key: 'open',
            label: 'Open',
            color: '#EF4444',
            bgColor: 'rgba(220, 38, 38, 0.2)',
            count: incidents.filter(i => i.status === 'open').length
        },
        {
            key: 'investigating',
            label: 'Investigating',
            color: '#F59E0B',
            bgColor: 'rgba(245, 158, 11, 0.2)',
            count: incidents.filter(i => i.status === 'investigating').length
        },
        {
            key: 'resolved',
            label: 'Resolved',
            color: '#10B981',
            bgColor: 'rgba(16, 185, 129, 0.2)',
            count: incidents.filter(i => i.status === 'resolved').length
        }
    ];

    // Filter incidents by selected status tab
    const getAllStatusIncidents = incidents.filter(
        incident => incident.status === selectedStatusTab
    );

    // Pagination logic
    const totalPages = Math.ceil(getAllStatusIncidents.length / ITEMS_PER_PAGE);
    const startIndex = currentPageNum * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentStatusIncidents = getAllStatusIncidents.slice(startIndex, endIndex);

    const handleTabChange = (status: string) => {
        setSelectedStatusTab(status);
        setCurrentPageNum(0);
    };

    const handlePageChange = (direction: 'next' | 'prev') => {
        if (direction === 'next' && currentPageNum < totalPages - 1) {
            setCurrentPageNum(prev => prev + 1);
        } else if (direction === 'prev' && currentPageNum > 0) {
            setCurrentPageNum(prev => prev - 1);
        }
    };

    // Navigate to incident detail page
    const handleIncidentPress = (incident: IncidentUI) => {
        router.push({
            pathname: "/inner-incident-page",
            params: { incidentId: incident.id }
        });
    };

    const formatTimestamp = (timestamp: Date) => {
        return timestamp.toLocaleString();
    };

    // Render incident card
    const renderIncidentCard = (incident: IncidentUI) => (
        <TouchableOpacity
            key={incident.id}
            style={styles.incidentCard}
            onPress={() => handleIncidentPress(incident)}
            activeOpacity={0.7}
        >
            <View style={styles.incidentHeader}>
                <View style={styles.incidentTitleRow}>
                    <Text style={styles.incidentTitle}>{incident.title}</Text>
                    <View
                        style={[
                            styles.severityBadge,
                            { backgroundColor: getSeverityColor(incident.severity) },
                        ]}
                    >
                        <Text style={styles.severityText}>
                            {incident.severity.toUpperCase()}
                        </Text>
                    </View>
                </View>
                <Text style={styles.incidentTime}>
                    {formatTimestamp(incident.timestamp)}
                </Text>
            </View>

            <Text style={styles.incidentDescription} numberOfLines={2}>
                {incident.description}
            </Text>

            <View style={styles.incidentFooter}>
                <Text style={styles.reportedBy}>
                    Reported by: {incident.reportedBy}
                </Text>
                {incident.location && (
                    <Text style={styles.location}>📍 {incident.location}</Text>
                )}
            </View>

            {incident.assignedTo && (
                <Text style={styles.assignedTo}>
                    Assigned to: {incident.assignedTo}
                </Text>
            )}
            {incident.awsAlarmName && (
                <Text style={styles.awsInfo}>
                    AWS Alarm: {incident.awsAlarmName}
                </Text>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.incidentsSection}>
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                        {error}
                    </Text>
                </View>
            )}

            {/* Status Tabs */}
            <View style={styles.tabContainer}>
                {statusTabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tab,
                            selectedStatusTab === tab.key && styles.activeTab,
                            { borderBottomColor: selectedStatusTab === tab.key ? tab.color : 'transparent' }
                        ]}
                        onPress={() => handleTabChange(tab.key)}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                selectedStatusTab === tab.key && styles.activeTabText,
                                { color: selectedStatusTab === tab.key ? tab.color : '#94A3B8' }
                            ]}
                        >
                            {tab.label}
                        </Text>
                        <View
                            style={[
                                styles.badge,
                                { backgroundColor: tab.bgColor }
                            ]}
                        >
                            <Text style={[styles.badgeText, { color: tab.color }]}>
                                {tab.count}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Incident Cards */}
            <View style={styles.cardsContainer}>
                {currentStatusIncidents.map((incident) => (
                    <View key={incident.id} style={styles.cardWrapper}>
                        {renderIncidentCard(incident)}
                    </View>
                ))}

                {getAllStatusIncidents.length === 0 && (
                    <View style={styles.emptyState}>
                        <IconSymbol
                            name="exclamationmark.triangle"
                            size={48}
                            color="#64748B"
                        />
                        <Text style={styles.emptyText}>
                            No {statusTabs.find(tab => tab.key === selectedStatusTab)?.label.toLowerCase()} incidents
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {selectedStatusTab === 'open' ? 'All systems operational' :
                                selectedStatusTab === 'investigating' ? 'No ongoing investigations' :
                                    'No recently resolved incidents'}
                        </Text>
                    </View>
                )}

                {/* Pagination Controls */}
                {getAllStatusIncidents.length > ITEMS_PER_PAGE && (
                    <View style={styles.paginationContainer}>
                        <TouchableOpacity
                            style={styles.paginationButtonWrapper}
                            onPress={() => handlePageChange('prev')}
                            disabled={currentPageNum === 0}
                        >
                            <LinearGradient
                                colors={currentPageNum === 0 ? ['#475569', '#475569'] : ['#F97316', '#DC2626']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.paginationButton}
                            >
                                <Text style={[
                                    styles.paginationButtonText,
                                    currentPageNum === 0 && styles.paginationButtonTextDisabled
                                ]}>Previous</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.paginationInfo}>
                            <Text style={styles.paginationText}>
                                Page {currentPageNum + 1} of {totalPages}
                            </Text>
                            <Text style={styles.paginationSubtext}>
                                {startIndex + 1}-{Math.min(endIndex, getAllStatusIncidents.length)} of {getAllStatusIncidents.length}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.paginationButtonWrapper}
                            onPress={() => handlePageChange('next')}
                            disabled={currentPageNum >= totalPages - 1}
                        >
                            <LinearGradient
                                colors={currentPageNum >= totalPages - 1 ? ['#475569', '#475569'] : ['#F97316', '#DC2626']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.paginationButton}
                            >
                                <Text style={[
                                    styles.paginationButtonText,
                                    currentPageNum >= totalPages - 1 && styles.paginationButtonTextDisabled
                                ]}>Next</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Stats Summary */}
            {incidents.length > 0 && (
                <View style={styles.statsFooter}>
                    <Text style={styles.statsText}>
                        Total incidents: {incidents.length}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    incidentsSection: {
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        margin: 16,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#FFFFFF",
        marginBottom: 16,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    errorContainer: {
        backgroundColor: 'rgba(220, 38, 38, 0.2)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#DC2626',
    },
    errorText: {
        color: "#FCA5A5",
        fontSize: 13,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    tabContainer: {
        flexDirection: "row",
        marginTop: -10,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#334155",
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 3,
        gap: 6,
    },
    activeTab: {
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
    },
    tabText: {
        fontSize: 13,
        fontWeight: "500",
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    activeTabText: {
        fontWeight: "600",
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 24,
        alignItems: "center",
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "600",
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    cardsContainer: {
        gap: 12,
    },
    cardWrapper: {
        marginBottom: 0,
    },
    incidentCard: {
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#334155',
        position: 'relative',
    },
    incidentHeader: {
        marginBottom: 10,
    },
    incidentTitleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 6,
    },
    incidentTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#FFFFFF",
        flex: 1,
        marginRight: 12,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    severityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    severityText: {
        fontSize: 9,
        fontWeight: "600",
        color: "#FFFFFF",
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    incidentTime: {
        fontSize: 11,
        color: "#94A3B8",
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    incidentDescription: {
        fontSize: 12,
        color: "#CBD5E1",
        lineHeight: 17,
        marginBottom: 10,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    incidentFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    reportedBy: {
        fontSize: 10,
        color: "#94A3B8",
        fontStyle: "italic",
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    assignedTo: {
        fontSize: 10,
        color: "#94A3B8",
        fontStyle: "italic",
        marginTop: 3,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    awsInfo: {
        fontSize: 10,
        color: "#94A3B8",
        fontStyle: "italic",
        marginTop: 2,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    location: {
        fontSize: 10,
        color: "#94A3B8",
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    tapIndicator: {
        position: 'absolute',
        right: 12,
        top: 12,
    },
    paginationButtonWrapper: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    paginationContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#334155",
    },
    paginationButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    paginationButtonTextDisabled: {
        color: "#94A3B8",
    },
    paginationButtonText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#FFFFFF",
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    paginationInfo: {
        alignItems: "center",
    },
    paginationText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#FFFFFF",
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    paginationSubtext: {
        fontSize: 11,
        color: "#94A3B8",
        marginTop: 2,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    statsFooter: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#334155",
    },
    statsText: {
        fontSize: 12,
        color: "#94A3B8",
        textAlign: "center",
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    emptyText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#94A3B8",
        marginTop: 12,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    emptySubtext: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 6,
        textAlign: "center",
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
});