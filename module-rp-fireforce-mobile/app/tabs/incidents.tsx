import { IconSymbol } from "@/components/ui/icon-symbol";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import {
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from "react-native";
import {
    createIncident, getAllIncidents
} from "@/api/incident-controller";
import {getSeverityColor, getStatusColor} from "@/constants/colors";
import {CreateIncidentData, Incident, IncidentUI, Stats} from "@/types/incident-types";
import { FONT_FAMILY } from '@/constants/fonts';
import {Ionicons} from "@expo/vector-icons";

export default function IncidentsScreen() {
    const router = useRouter();
    const [incidents, setIncidents] = useState<IncidentUI[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [modalVisible, setModalVisible] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newIncident, setNewIncident] = useState({
        title: "",
        description: "",
        severity: "medium" as "low" | "medium" | "high" | "critical",
        location: "",
    });

    // Helper function to parse API datetime - now handles ISO format
    const parseApiDateTime = (dateTimeString: string): Date => {
        return new Date(dateTimeString);
    };

    // Transform API incident to UI incident format
    const transformApiIncident = (apiIncident: Incident): IncidentUI => ({
        id: apiIncident.id,
        title: apiIncident.title,
        description: apiIncident.description,
        severity: apiIncident.severity,
        status: apiIncident.status,
        timestamp: parseApiDateTime(apiIncident.timestamp),
        reportedBy: apiIncident.reportedBy,
        location: apiIncident.location || undefined,
        assignedTo: apiIncident.assignedTo || undefined,
        resolvedBy: apiIncident.resolvedBy || undefined,
        resolvedAt: apiIncident.resolvedAt ? parseApiDateTime(apiIncident.resolvedAt) : undefined,
        awsAlarmName: apiIncident.awsAlarmName || undefined,
    });

    // Fetch incidents from API
    const fetchAllIncidents = async () => {
        try {
            const response = await getAllIncidents();

            if (response.httpStatus === "OK" && response.data) {
                const transformedIncidents = response.data.map(transformApiIncident);
                setIncidents(transformedIncidents);
            }
        } catch (error) {
            console.error('Failed to fetch incidents:', error);
            Alert.alert(
                "Error",
                "Failed to load incidents. Please check your connection and try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAllIncidents();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        Promise.all([fetchAllIncidents()]);
    }, [fetchAllIncidents]);

    const filteredIncidents = incidents.filter(
        (incident) => filterStatus === "all" || incident.status === filterStatus
    );

    // Navigate to incident detail page
    const handleIncidentPress = (incident: IncidentUI) => {
        router.push({
            pathname: "/inner-incident-page",
            params: { incidentId: incident.id }
        });
    };

    const createNewIncident = async () => {
        if (!newIncident.title || !newIncident.description) {
            Alert.alert("Error", "Please fill in all required fields");
            return;
        }

        setCreating(true);
        try {
            const incidentData: CreateIncidentData = {
                title: newIncident.title,
                description: newIncident.description,
                severity: newIncident.severity,
                location: newIncident.location || null,
                reportedBy: "Mobile App User",
            };

            const response = await createIncident(incidentData);

            if (response.httpStatus === "OK" && response.data) {
                const transformedIncident = transformApiIncident(response.data);

                setIncidents((prev) => [transformedIncident, ...prev]);

                setNewIncident({
                    title: "",
                    description: "",
                    severity: "medium",
                    location: "",
                });
                setModalVisible(false);
                Alert.alert("Success", response.message || "Incident created successfully");
            } else {
                throw new Error(response.message || "Failed to create incident");
            }
        } catch (error) {
            console.error('Failed to create incident:', error);
        } finally {
            setCreating(false);
        }
    };

    const formatTimestamp = (timestamp: Date) => {
        return timestamp.toLocaleString();
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading incidents...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Incident Management</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {["all", "open", "investigating", "resolved"].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[
                                styles.filterButton,
                                filterStatus === status && styles.filterButtonActive,
                            ]}
                            onPress={() => setFilterStatus(status)}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    filterStatus === status && styles.filterTextActive,
                                ]}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Incidents List */}
            <ScrollView
                style={styles.incidentsList}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {filteredIncidents.map((incident) => (
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
                            <View style={styles.incidentMeta}>
                                <Text style={styles.incidentTime}>
                                    {formatTimestamp(incident.timestamp)}
                                </Text>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: getStatusColor(incident.status) },
                                    ]}
                                >
                                    <Text style={styles.statusText}>
                                        {incident.status.toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <Text style={styles.incidentDescription}>
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

                        {/* Tap indicator */}
                        <View style={styles.tapIndicator}>
                            <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
                        </View>
                    </TouchableOpacity>
                ))}

                {filteredIncidents.length === 0 && !loading && (
                    <View style={styles.emptyState}>
                        <IconSymbol
                            name="exclamationmark.triangle"
                            size={48}
                            color="#9CA3AF"
                        />
                        <Text style={styles.emptyText}>No incidents found</Text>
                        <Text style={styles.emptySubtext}>
                            {filterStatus === "all"
                                ? "All systems are operational"
                                : `No incidents with status: ${filterStatus}`}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Create Incident Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <TouchableOpacity
                        style={styles.modalContent}
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Report New Incident</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Incident Title"
                            value={newIncident.title}
                            onChangeText={(text) =>
                                setNewIncident((prev) => ({ ...prev, title: text }))
                            }
                        />

                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Description"
                            value={newIncident.description}
                            onChangeText={(text) =>
                                setNewIncident((prev) => ({ ...prev, description: text }))
                            }
                            multiline
                            numberOfLines={4}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Location (optional)"
                            value={newIncident.location}
                            onChangeText={(text) =>
                                setNewIncident((prev) => ({ ...prev, location: text }))
                            }
                        />

                        <View style={styles.severitySelector}>
                            <Text style={styles.severityLabel}>Severity:</Text>
                            {["low", "medium", "high", "critical"].map((sev) => (
                                <TouchableOpacity
                                    key={sev}
                                    style={[
                                        styles.severityOption,
                                        newIncident.severity === sev && styles.severityOptionActive,
                                        { borderColor: getSeverityColor(sev) },
                                    ]}
                                    onPress={() =>
                                        setNewIncident((prev) => ({
                                            ...prev,
                                            severity: sev as "low" | "medium" | "high" | "critical",
                                        }))
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.severityOptionText,
                                            newIncident.severity === sev && {
                                                color: getSeverityColor(sev),
                                            },
                                        ]}
                                    >
                                        {sev.charAt(0).toUpperCase() + sev.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.createButton, creating && styles.createButtonDisabled]}
                            onPress={createNewIncident}
                            disabled={creating}
                        >
                            {creating ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.createButtonText}>Create Incident</Text>
                            )}
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 15,
        color: "#6B7280",
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#111827",
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    addButton: {
        backgroundColor: "#3B82F6",
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    filterContainer: {
        backgroundColor: "#FFFFFF",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#F3F4F6",
        marginRight: 8,
    },
    filterButtonActive: {
        backgroundColor: "#3B82F6",
    },
    filterText: {
        fontSize: 13,
        color: "#6B7280",
        fontWeight: "500",
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    filterTextActive: {
        color: "#FFFFFF",
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    incidentsList: {
        flex: 1,
        padding: 20,
    },
    incidentCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        position: 'relative',
    },
    incidentHeader: {
        marginBottom: 12,
    },
    incidentTitleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    incidentTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
        flex: 1,
        marginRight: 12,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    severityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    severityText: {
        fontSize: 10,
        fontWeight: "600",
        color: "#FFFFFF",
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    incidentMeta: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    incidentTime: {
        fontSize: 11,
        color: "#6B7280",
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: "500",
        color: "#FFFFFF",
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    incidentDescription: {
        fontSize: 13,
        color: "#374151",
        lineHeight: 18,
        marginBottom: 12,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    incidentFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    reportedBy: {
        fontSize: 11,
        color: "#6B7280",
        fontStyle: "italic",
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    assignedTo: {
        fontSize: 11,
        color: "#6B7280",
        fontStyle: "italic",
        marginTop: 4,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    awsInfo: {
        fontSize: 11,
        color: "#6B7280",
        fontStyle: "italic",
        marginTop: 2,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    location: {
        fontSize: 11,
        color: "#6B7280",
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    tapIndicator: {
        position: 'absolute',
        right: 16,
        top: 16,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#6B7280",
        marginTop: 16,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    emptySubtext: {
        fontSize: 13,
        color: "#9CA3AF",
        marginTop: 8,
        textAlign: "center",
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        width: "90%",
        maxHeight: "80%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    input: {
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        padding: 14,
        fontSize: 14,
        marginBottom: 16,
        backgroundColor: "#FFFFFF",
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    textArea: {
        height: 100,
        textAlignVertical: "top",
    },
    severitySelector: {
        marginBottom: 20,
    },
    severityLabel: {
        fontSize: 15,
        fontWeight: "500",
        color: "#374151",
        marginBottom: 12,
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    severityOption: {
        borderWidth: 2,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    severityOptionActive: {
        backgroundColor: "#F9FAFB",
    },
    severityOptionText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#6B7280",
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    createButton: {
        backgroundColor: "#3B82F6",
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: "center",
    },
    createButtonDisabled: {
        backgroundColor: "#9CA3AF",
    },
    createButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#FFFFFF",
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
});