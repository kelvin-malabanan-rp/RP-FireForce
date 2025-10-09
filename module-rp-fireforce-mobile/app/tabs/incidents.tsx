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
    Platform,
} from "react-native";
import {
    createIncident,
    getAllIncidents
} from "@/api/incident-controller";
import {getAllCurrentOnCall} from "@/api/oncall-schedule-controller";
import {
    CreateIncidentData,
    Team,
    TeamMember,
    IncidentUI} from "@/types/incident-types";
import { FONT_FAMILY } from '@/constants/fonts';
import { Ionicons } from "@expo/vector-icons";
import IncidentList from "@/components/incident-list";
import { retrieveUserSession } from "@/constants/local-storage";
import { createAuditLog } from "@/api/audit-trail";
import { usePushNotificationContext } from "@/context/push-notification-context";
import {LinearGradient} from "expo-linear-gradient";

type NotificationMode = 'individual' | 'team';

export default function IncidentsScreen() {
    const { sendNotificationToOnCallTeam, scheduleAutoReminder } = usePushNotificationContext(); // ✅ Add scheduleAutoReminder
    const [incidents, setIncidents] = useState<IncidentUI[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [availableUsers, setAvailableUsers] = useState<TeamMember[]>([]);
    const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
    const [notificationMode, setNotificationMode] = useState<NotificationMode>('individual');

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
        setSelectedTeams([]);
        setNotificationMode('individual');
    };

    const transformApiIncident = (apiIncident: any): IncidentUI => ({
        id: apiIncident.id,
        title: apiIncident.title,
        description: apiIncident.description,
        severity: apiIncident.severity,
        status: apiIncident.status,
        timestamp: new Date(apiIncident.timestamp),
        reportedBy: apiIncident.reported_by,
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

    const fetchTeamMembersAndTeams = async () => {
        try {
            const onCallResponse = await getAllCurrentOnCall();

            if (onCallResponse.httpStatus !== 'OK' || !onCallResponse.data) {
                throw new Error('Failed to fetch on-call teams with members');
            }

            console.log("onCallResponse: ", onCallResponse.data);

            // ✅ Transform the grouped role data into teams
            const { primary = [], backup = [], escalation = [] } = onCallResponse.data;

            // Combine all roles and group by teamId
            const allAssignments = [...primary, ...backup, ...escalation];

            // Group by team
            const teamMap = new Map<string, any>();

            allAssignments.forEach((assignment: any) => {
                const teamId = assignment.teamId;

                if (!teamMap.has(teamId)) {
                    teamMap.set(teamId, {
                        id: teamId,
                        name: assignment.teamName,
                        membersMap: new Map<string, TeamMember>() // Use Map to avoid duplicates
                    });
                }

                const team = teamMap.get(teamId);
                const userId = assignment.userId;

                // Only add if not already in the team
                if (!team.membersMap.has(userId)) {
                    const [firstName = '', lastName = ''] = (assignment.fullname || '').split(' ');
                    team.membersMap.set(userId, {
                        id: userId,
                        email: assignment.email,
                        firstName,
                        lastName,
                        role: assignment.role // Will be 'primary', 'backup', or 'escalation'
                    });
                }
            });

            // Convert Map to array and transform members Map to array
            const transformedTeams: Team[] = Array.from(teamMap.values()).map(team => ({
                id: team.id,
                name: team.name,
                members: Array.from(team.membersMap.values())
            }));

            setAvailableTeams(transformedTeams);

            // Flatten all team members (avoid duplicates)
            const allMembersMap = new Map<string, TeamMember>();
            transformedTeams.forEach((team: Team) => {
                team.members.forEach((member: TeamMember) => {
                    if (!allMembersMap.has(member.id)) {
                        allMembersMap.set(member.id, member);
                    }
                });
            });

            const allMembers = Array.from(allMembersMap.values());
            setAvailableUsers(allMembers);

            console.log('[incident] ✅ Loaded teams:', transformedTeams.length);
            console.log('[incident] ✅ Loaded users:', allMembers.length);

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
            fetchTeamMembersAndTeams();
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

    const toggleTeamSelection = (teamId: string) => {
        setSelectedTeams(prev =>
            prev.includes(teamId)
                ? prev.filter(id => id !== teamId)
                : [...prev, teamId]
        );
    };

    const createNewIncident = async () => {
        if (!newIncident.title || !newIncident.description) {
            Alert.alert("Error", "Please fill in all required fields");
            return;
        }

        if (newIncident.bypassRotation) {
            if (notificationMode === 'individual' && selectedUsers.length === 0) {
                Alert.alert("Error", "Please select at least one person to notify");
                return;
            }
            if (notificationMode === 'team' && selectedTeams.length === 0) {
                Alert.alert("Error", "Please select at least one team to notify");
                return;
            }
        }

        setCreating(true);
        try {
            const session = await retrieveUserSession();
            const reportedByEmail = session?.email || "Unknown User";
            const userId = session?.id || "usr_unknown";
            const userName = session?.firstName + " " + session?.lastName || "Unknown User";

            const incidentData: CreateIncidentData = {
                title: newIncident.title,
                description: newIncident.description,
                severity: newIncident.severity,
                location: newIncident.location || null,
                reportedBy: reportedByEmail,
            };

            if (newIncident.bypassRotation) {
                if (notificationMode === 'individual') {
                    incidentData.notifyUsers = selectedUsers;
                } else {
                    const teamUserIds = availableTeams
                        .filter(team => selectedTeams.includes(team.id))
                        .flatMap(team => team.members.map((member: TeamMember) => member.id));
                    incidentData.notifyUsers = teamUserIds;
                }
            }

            // 1️⃣ Create the incident FIRST
            const response = await createIncident(incidentData);

            if (response.httpStatus === "OK" && response.data) {
                const incident = response.data;

                // 2️⃣ Create audit log for incident creation
                const auditPayload = {
                    action: "CREATE_INCIDENT",
                    incidentId: incident.id,
                    userId: userId,
                    description: `${userName} created incident "${incident.title}"`,
                    details: {
                        title: incident.title,
                        severity: incident.severity,
                        location: incident.location,
                        createdFrom: "mobile_app",
                    },
                    metadata: {
                        device: Platform.OS,
                        timestamp: new Date().toISOString(),
                    },
                };

                // Fire and forget - don't wait
                createAuditLog(auditPayload)
                    .then(() => console.log("✅ Audit log created"))
                    .catch(err => console.warn("⚠️ Failed to create audit log:", err));

                // 3️⃣ Refresh incidents list
                fetchAllIncidents();

                // 4️⃣ Prepare notification data
                const isBypassing = newIncident.bypassRotation;
                let selectedEmails: string[] = [];

                if (isBypassing) {
                    if (notificationMode === 'individual') {
                        selectedEmails = availableUsers
                            .filter(u => selectedUsers.includes(u.id))
                            .map(u => u.email);
                    } else {
                        selectedEmails = availableTeams
                            .filter(team => selectedTeams.includes(team.id))
                            .flatMap(team => team.members.map((member: TeamMember) => member.email));
                    }
                }

                // 5️⃣ Send notifications in background - DON'T WAIT
                sendNotificationToOnCallTeam({
                    id: incident.id,
                    title: incident.title,
                    description: incident.description,
                    severity: incident.severity,
                    emergencyOverride: {
                        enabled: isBypassing,
                        userEmails: selectedEmails,
                    },
                }).then(result => {
                    console.log("[push] ✅ Notifications sent:", result);
                }).catch(error => {
                    console.error("[incident] Remote notification failed", error);
                });

                // 6️⃣ Cleanup & Show success immediately
                // 6️⃣ Cleanup & UI feedback
                resetIncidentForm();
                setModalVisible(false);

                const notificationCount = notificationMode === 'individual'
                    ? selectedUsers.length
                    : selectedEmails.length;

                Alert.alert(
                    "Success",
                    newIncident.bypassRotation
                        ? `Incident created! Notifying ${notificationCount} people in the background...`
                        : "Incident created! On-call team will be notified..."
                );
            } else {
                throw new Error(response.message || "Failed to create incident");
            }
        } catch (error) {
            console.error("Failed to create incident:", error);
            Alert.alert("Error", "Failed to create incident");
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#F97316" />
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
                    style={styles.addButtonWrapper}
                    onPress={() => setModalVisible(true)}
                >
                    <LinearGradient
                        colors={['#F97316', '#DC2626']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.addButton}
                    >
                        <Ionicons name="add" size={24} color="#FFFFFF" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#F97316"
                        colors={['#F97316']}
                    />
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
                                    <Ionicons name="close" size={24} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="Incident Title"
                                placeholderTextColor="#64748B"
                                value={newIncident.title}
                                onChangeText={(text) =>
                                    setNewIncident((prev) => ({ ...prev, title: text }))
                                }
                            />

                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Description"
                                placeholderTextColor="#64748B"
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
                                placeholderTextColor="#64748B"
                                value={newIncident.location}
                                onChangeText={(text) =>
                                    setNewIncident((prev) => ({ ...prev, location: text }))
                                }
                            />

                            {/* Severity Selector */}
                            <View style={styles.severitySelector}>
                                <Text style={styles.severityLabel}>Severity:</Text>
                                <View style={styles.severityContainer}>
                                    {[
                                        { key: "low", label: "Low", colors: ['#16A34A', '#15803D'] as const, color: '#16A34A' },
                                        { key: "medium", label: "Medium", colors: ['#D97706', '#B45309'] as const, color: '#D97706' },
                                        { key: "high", label: "High", colors: ['#EA580C', '#C2410C'] as const, color: '#EA580C' },
                                        { key: "critical", label: "Critical", colors: ['#DC2626', '#B91C1C'] as const, color: '#DC2626' },
                                    ].map((sev) => {
                                        const isActive = newIncident.severity === sev.key;
                                        return (
                                            <TouchableOpacity
                                                key={sev.key}
                                                style={[
                                                    styles.severityButtonWrapper,
                                                    { flex: isActive ? 1.5 : 1 }, // ✅ Selected is bigger
                                                ]}
                                                onPress={() =>
                                                    setNewIncident((prev) => ({
                                                        ...prev,
                                                        severity: sev.key as "low" | "medium" | "high" | "critical",
                                                    }))
                                                }
                                            >
                                                {isActive ? (
                                                    <LinearGradient
                                                        colors={sev.colors}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 0 }}
                                                        style={styles.severityActive}
                                                    >
                                                        <Text style={styles.severityTextActive} numberOfLines={1}>
                                                            {sev.label}
                                                        </Text>
                                                        <Ionicons
                                                            name="checkmark-circle"
                                                            size={18}
                                                            color="#FFFFFF"
                                                            style={{ marginLeft: 4 }}
                                                        />
                                                    </LinearGradient>
                                                ) : (
                                                    <View style={[styles.severityInactive, { borderColor: sev.color }]}>
                                                        <Text style={styles.severityText} numberOfLines={1}>
                                                            {sev.label}
                                                        </Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
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

                                {/* Notification Mode Selection */}
                                {newIncident.bypassRotation && (
                                    <>
                                        <View style={styles.modeSelector}>
                                            <Text style={styles.modeSelectorLabel}>Notify by:</Text>
                                            <View style={styles.modeButtons}>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.modeButton,
                                                        notificationMode === 'individual' && styles.modeButtonActive
                                                    ]}
                                                    onPress={() => setNotificationMode('individual')}
                                                >
                                                    <Ionicons
                                                        name="person"
                                                        size={16}
                                                        color={notificationMode === 'individual' ? '#FFFFFF' : '#94A3B8'}
                                                    />
                                                    <Text style={[
                                                        styles.modeButtonText,
                                                        notificationMode === 'individual' && styles.modeButtonTextActive
                                                    ]}>
                                                        Individual
                                                    </Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[
                                                        styles.modeButton,
                                                        notificationMode === 'team' && styles.modeButtonActive
                                                    ]}
                                                    onPress={() => setNotificationMode('team')}
                                                >
                                                    <Ionicons
                                                        name="people"
                                                        size={16}
                                                        color={notificationMode === 'team' ? '#FFFFFF' : '#94A3B8'}
                                                    />
                                                    <Text style={[
                                                        styles.modeButtonText,
                                                        notificationMode === 'team' && styles.modeButtonTextActive
                                                    ]}>
                                                        Team
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {/* Individual Selection */}
                                        {notificationMode === 'individual' && (
                                            <View style={styles.userSelectionContainer}>
                                                <Text style={styles.userSelectionTitle}>
                                                    Select Team Members ({selectedUsers.length} selected)
                                                </Text>
                                                {availableUsers.length === 0 ? (
                                                    <View style={styles.emptyUsersContainer}>
                                                        <Ionicons name="people-outline" size={32} color="#64748B" />
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
                                                                    color="#94A3B8"
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

                                        {/* Team Selection */}
                                        {notificationMode === 'team' && (
                                            <View style={styles.userSelectionContainer}>
                                                <Text style={styles.userSelectionTitle}>
                                                    Select Teams ({selectedTeams.length} selected)
                                                </Text>
                                                {availableTeams.length === 0 ? (
                                                    <View style={styles.emptyUsersContainer}>
                                                        <Ionicons name="people-outline" size={32} color="#64748B" />
                                                        <Text style={styles.emptyUsersText}>No teams found</Text>
                                                    </View>
                                                ) : (
                                                    availableTeams.map(team => (
                                                        <TouchableOpacity
                                                            key={team.id}
                                                            style={styles.userOption}
                                                            onPress={() => toggleTeamSelection(team.id)}
                                                        >
                                                            <View style={styles.userInfo}>
                                                                <Ionicons
                                                                    name="people-circle"
                                                                    size={24}
                                                                    color="#3B82F6"
                                                                />
                                                                <View style={styles.userDetails}>
                                                                    <Text style={styles.userName}>
                                                                        {team.name}
                                                                    </Text>
                                                                    <Text style={styles.userEmail}>
                                                                        {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                            <View style={[
                                                                styles.checkbox,
                                                                selectedTeams.includes(team.id) && styles.checkboxActive
                                                            ]}>
                                                                {selectedTeams.includes(team.id) && (
                                                                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                                                )}
                                                            </View>
                                                        </TouchableOpacity>
                                                    ))
                                                )}
                                            </View>
                                        )}
                                    </>
                                )}
                            </View>
                            <TouchableOpacity
                                style={styles.createButtonWrapper}
                                onPress={createNewIncident}
                                disabled={creating}
                            >
                                <LinearGradient
                                    colors={['#F97316', '#DC2626']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.createButton, creating && styles.createButtonDisabled]}
                                >
                                    {creating ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Ionicons name="send" size={18} color="#FFFFFF" />
                                            <Text style={styles.createButtonText}>
                                                {newIncident.bypassRotation ? 'Create & Notify' : 'Create Incident'}
                                            </Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </ScrollView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 15,
        color: "#94A3B8",
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 100 : 80,
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    headerTitle: {
        fontSize: 22,
        color: "#FFFFFF",
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    addButtonWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    scrollView: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#1E293B",
        borderRadius: 16,
        padding: 20,
        width: "90%",
        maxHeight: "90%",
        borderWidth: 1,
        borderColor: '#334155',
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
        color: "#FFFFFF",
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    input: {
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 8,
        padding: 14,
        fontSize: 14,
        marginBottom: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    textArea: {
        height: 100,
        textAlignVertical: "top",
    },
    severityContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    severitySelector: {
        marginBottom: 20,
    },
    severityOptionActive: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    severityLabel: {
        fontSize: 15,
        fontWeight: "500",
        color: "#CBD5E1",
        marginBottom: 12,
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    severityButtonWrapper: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    severityOptionWrapper: {
        marginBottom: 8,
        borderRadius: 8,
        overflow: 'hidden',
    },
    severityInactive: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 2,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
    },
    severityActive: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    severityDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 6,
    },
    severityText: {
        fontSize: 12,
        color: "#94A3B8",
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    severityTextActive: {
        fontSize: 13,
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    emergencySection: {
        marginBottom: 20,
        borderTopWidth: 1,
        borderTopColor: "#334155",
        paddingTop: 20,
    },
    bypassToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DC2626',
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
        color: '#FCA5A5',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    bypassSubtitle: {
        fontSize: 11,
        color: '#DC2626',
        marginTop: 2,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    toggleSwitch: {
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#475569',
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
    modeSelector: {
        marginBottom: 16,
    },
    modeSelectorLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#CBD5E1',
        marginBottom: 8,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    modeButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    modeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#334155',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        gap: 6,
    },
    modeButtonActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    modeButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    modeButtonTextActive: {
        color: '#FFFFFF',
    },
    userSelectionContainer: {
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 0,
        borderWidth: 1,
        borderColor: '#334155',
    },
    userSelectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#CBD5E1',
        marginBottom: 12,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    userOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderRadius: 6,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#334155',
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
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    userEmail: {
        fontSize: 11,
        color: '#94A3B8',
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
        backgroundColor: '#1E293B',
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    emptyUsersContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
    },
    emptyUsersText: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 8,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#475569',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    createButton: {
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: "center",
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 20,
        marginBottom: 20,
        overflow: 'hidden', // Add this for gradient
    },
    createButtonDisabled: {
        backgroundColor: "#64748B",
    },
    createButtonWrapper: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    createButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#FFFFFF",
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
});