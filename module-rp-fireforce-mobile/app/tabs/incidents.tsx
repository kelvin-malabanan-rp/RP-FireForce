import React, { useState, useEffect, useCallback } from "react";
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
    createIncident,
    getAllIncidents
} from "@/api/incident-controller";
import { oncallController } from "@/api/oncall-schedule-controller";
import {getSeverityColor} from "@/constants/colors";
import {CreateIncidentData,
    Incident,
    IncidentUI} from "@/types/incident-types";
import { FONT_FAMILY } from '@/constants/fonts';
import {Ionicons} from "@expo/vector-icons";
import IncidentList from "@/components/incident-list";
import {usePushNotifications} from "@/hooks/use-push-notifications";
import {retrieveUserSession} from "@/constants/local-storage";

type TeamMember = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
};

export default function IncidentsScreen() {
    const [incidents, setIncidents] = useState<IncidentUI[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { sendNotificationToOnCallTeam, sendIncidentNotification } = usePushNotifications();
    const [availableUsers, setAvailableUsers] = useState<TeamMember[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [newIncident, setNewIncident] = useState({
        title: "",
        description: "",
        severity: "" as "low" | "medium" | "high" | "critical",
        location: "",
        bypassRotation: false,
    });
    const resetIncidentForm = () => {
        setNewIncident({
            title: "",
            description: "",
            severity: "" as "low" | "medium" | "high" | "critical",
            location: "",
            bypassRotation: false,
        });
        setSelectedUsers([]);
    };

    const parseApiDateTime = (dateTimeString: string): Date => {
        return new Date(dateTimeString);
    };

    // utils/incident-transform.ts (or wherever transformApiIncident is)
    const transformApiIncident = (apiIncident: any): IncidentUI => ({
        id: apiIncident.id,
        title: apiIncident.title,
        description: apiIncident.description,
        severity: apiIncident.severity,
        status: apiIncident.status,
        timestamp: new Date(apiIncident.timestamp),
        reportedBy: apiIncident.reported_by, // 👈 snake → camel
        location: apiIncident.location ?? undefined,
        assignedTo: apiIncident.assigned_to ?? undefined,
        resolvedBy: apiIncident.resolved_by ?? undefined,
        resolvedAt: apiIncident.resolved_at ? new Date(apiIncident.resolved_at) : undefined,
        awsAlarmName: apiIncident.aws_alarm_name ?? undefined,
    });

    const fetchAllIncidents = async () => {
        try {
            setError(null);
            const response = await getAllIncidents();

            if (response.httpStatus === "OK" && response.data) {
                const transformedIncidents = response.data.map(transformApiIncident);
                setIncidents(transformedIncidents);
            }
        } catch (error) {
            console.error('Failed to fetch incidents:', error);
            setError("Failed to load incidents. Please check your connection and try again.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Fetch team members when bypass rotation is enabled
    const fetchTeamMembers = async () => {
        try {
            const teams = await oncallController.getTeams();

            // Flatten all team members from all teams into a single list
            const allMembers: TeamMember[] = [];
            teams.forEach(team => {
                team.members.forEach(member => {
                    // Avoid duplicates
                    if (!allMembers.find(m => m.id === member.id)) {
                        allMembers.push({
                            id: member.id,
                            email: member.email,
                            firstName: member.firstName,
                            lastName: member.lastName,
                            role: member.role
                        });
                    }
                });
            });

            setAvailableUsers(allMembers);
        } catch (error) {
            console.error('Failed to fetch team members:', error);
            Alert.alert('Error', 'Failed to load team members');
        }
    };

    useEffect(() => {
        fetchAllIncidents();
    }, []);

    useEffect(() => {
        if (newIncident.bypassRotation) {
            fetchTeamMembers();
        }
    }, [newIncident.bypassRotation]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAllIncidents();
    }, []);

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const createNewIncident = async () => {
        if (!newIncident.title || !newIncident.description) {
            Alert.alert("Error", "Please fill in all required fields");
            return;
        }

        if (newIncident.bypassRotation && selectedUsers.length === 0) {
            Alert.alert("Error", "Please select at least one person to notify");
            return;
        }

        setCreating(true);
        try {
            const session = await retrieveUserSession();
            const reportedByEmail = session?.email || "Unknown User";

            const incidentData: CreateIncidentData = {
                title: newIncident.title,
                description: newIncident.description,
                severity: newIncident.severity,
                location: newIncident.location || null,
                reportedBy: reportedByEmail,
            };

            if (newIncident.bypassRotation) {
                incidentData.notifyUsers = selectedUsers;
            }

            const response = await createIncident(incidentData);

            if (response.httpStatus === "OK" && response.data) {
                // ✅ instead of manually updating state, just re-fetch
                await fetchAllIncidents();

                // local notification
                await sendIncidentNotification(response.data);

                // optional: send remote notifications
                const isBypassing = newIncident.bypassRotation;
                const selectedEmails = isBypassing
                    ? availableUsers
                        .filter(u => selectedUsers.includes(u.id))
                        .map(u => u.email)
                    : [];

                try {
                    await sendNotificationToOnCallTeam({
                        id: response.data.id,
                        title: response.data.title,
                        description: response.data.description,
                        severity: response.data.severity,
                        emergencyOverride: {
                            enabled: isBypassing,
                            userEmails: selectedEmails,
                        },
                    });
                } catch (error) {
                    console.error('[incident] Remote notification failed', error);
                }

                resetIncidentForm();
                setModalVisible(false);

                Alert.alert(
                    "Success",
                    newIncident.bypassRotation
                        ? `Incident created and ${selectedUsers.length} people notified immediately`
                        : "Incident created successfully"
                );
            } else {
                throw new Error(response.message || "Failed to create incident");
            }
        } catch (error) {
            console.error('Failed to create incident:', error);
            Alert.alert("Error", "Failed to create incident");
        } finally {
            setCreating(false);
        }
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

            {/* Incident List Component */}
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <IncidentList incidents={incidents} error={error} />
            </ScrollView>

            {/* Create Incident Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    resetIncidentForm();
                    setModalVisible(false);
                }}
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
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        >
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Report New Incident</Text>
                                <TouchableOpacity onPress={() => {
                                    resetIncidentForm();
                                    setModalVisible(false);
                                }}>
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
                                            { borderColor: getSeverityColor(sev) },
                                            newIncident.severity === sev && {
                                                backgroundColor: getSeverityColor(sev)
                                            },
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
                                                    color: '#FFFFFF', // White text when selected
                                                },
                                            ]}
                                        >
                                            {sev.charAt(0).toUpperCase() + sev.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Emergency Bypass Section */}
                            <View style={styles.emergencySection}>
                                <TouchableOpacity
                                    style={styles.bypassToggle}
                                    onPress={() => setNewIncident(prev => ({
                                        ...prev,
                                        bypassRotation: !prev.bypassRotation
                                    }))}
                                >
                                    <View style={styles.bypassToggleContent}>
                                        <Ionicons
                                            name="alert-circle"
                                            size={20}
                                            color="#EF4444"
                                        />
                                        <View style={styles.bypassTextContainer}>
                                            <Text style={styles.bypassTitle}>Emergency Override</Text>
                                            <Text style={styles.bypassSubtitle}>
                                                Bypass rotation and notify specific people immediately
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[
                                        styles.toggleSwitch,
                                        newIncident.bypassRotation && styles.toggleSwitchActive
                                    ]}>
                                        <View style={[
                                            styles.toggleCircle,
                                            newIncident.bypassRotation && styles.toggleCircleActive
                                        ]} />
                                    </View>
                                </TouchableOpacity>

                                {/* User Selection */}
                                {newIncident.bypassRotation && (
                                    <View style={styles.userSelectionContainer}>
                                        <Text style={styles.userSelectionTitle}>
                                            Select Team Members to Notify ({selectedUsers.length} selected)
                                        </Text>
                                        {availableUsers.length === 0 ? (
                                            <View style={styles.emptyUsersContainer}>
                                                <Ionicons name="people-outline" size={32} color="#9CA3AF" />
                                                <Text style={styles.emptyUsersText}>No team members found</Text>
                                            </View>
                                        ) : (
                                            availableUsers.map(user => (
                                                <TouchableOpacity
                                                    key={user.id}
                                                    style={styles.userOption}
                                                    onPress={() => toggleUserSelection(user.id)}
                                                >
                                                    <View style={styles.userInfo}>
                                                        <Ionicons
                                                            name="person-circle"
                                                            size={24}
                                                            color="#6B7280"
                                                        />
                                                        <View style={styles.userDetails}>
                                                            <Text style={styles.userName}>
                                                                {user.firstName} {user.lastName}
                                                            </Text>
                                                            <Text style={styles.userEmail}>{user.email}</Text>
                                                            {user.role && (
                                                                <Text style={styles.userRole}>
                                                                    {user.role.toUpperCase()}
                                                                </Text>
                                                            )}
                                                        </View>
                                                    </View>
                                                    <View style={[
                                                        styles.checkbox,
                                                        selectedUsers.includes(user.id) && styles.checkboxActive
                                                    ]}>
                                                        {selectedUsers.includes(user.id) && (
                                                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                                        )}
                                                    </View>
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </View>
                                )}
                            </View>

                            {/* Only show button here if bypass is OFF */}
                            {!newIncident.bypassRotation && (
                                <TouchableOpacity
                                    style={[styles.createButton, creating && styles.createButtonDisabled]}
                                    onPress={createNewIncident}
                                    disabled={creating}
                                >
                                    {creating ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Ionicons name="send" size={18} color="#FFFFFF" />
                                            <Text style={styles.createButtonText}>
                                                Create Incident
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                        </ScrollView>

                        {/* Fixed button at bottom when bypass is ON */}
                        {newIncident.bypassRotation && (
                            <View style={styles.fixedButtonContainer}>
                                <TouchableOpacity
                                    style={[styles.createButton, creating && styles.createButtonDisabled]}
                                    onPress={createNewIncident}
                                    disabled={creating}
                                >
                                    {creating ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Ionicons name="send" size={18} color="#FFFFFF" />
                                            <Text style={styles.createButtonText}>
                                                Create & Notify
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
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
        color: "#111827",
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    addButton: {
        backgroundColor: "#3B82F6",
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    scrollView: {
        flex: 1,
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
        maxHeight: "90%",
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
        backgroundColor: '#FFFFFF', // Default white background
    },
    // severityOptionActive: {
    //     backgroundColor: "#F9FAFB",
    // },
    severityOptionText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#6B7280", // Default gray text
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    emergencySection: {
        marginBottom: 20,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        paddingTop: 20,
    },
    bypassToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FEE2E2',
        marginBottom: 16,
    },
    bypassToggleContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    bypassTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    bypassTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#DC2626',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    bypassSubtitle: {
        fontSize: 11,
        color: '#991B1B',
        marginTop: 2,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    toggleSwitch: {
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#D1D5DB',
        padding: 2,
        justifyContent: 'center',
    },
    toggleSwitchActive: {
        backgroundColor: '#EF4444',
    },
    toggleCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        transform: [{ translateX: 0 }],
    },
    toggleCircleActive: {
        transform: [{ translateX: 20 }],
    },
    userSelectionContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 12,
        marginBottom: 0,
    },
    userSelectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    userOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        marginBottom: 8,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    userDetails: {
        marginLeft: 10,
        flex: 1,
    },
    userName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    userEmail: {
        fontSize: 11,
        color: '#6B7280',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    userRole: {
        fontSize: 10,
        color: '#3B82F6',
        fontWeight: '600',
        marginTop: 2,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    fixedButtonContainer: {
        padding: 16,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    emptyUsersContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
    },
    emptyUsersText: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 8,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    createButton: {
        backgroundColor: "#3B82F6",
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: "center",
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 20, // Add top margin
        marginBottom: 20, // Add bottom margin for safety
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