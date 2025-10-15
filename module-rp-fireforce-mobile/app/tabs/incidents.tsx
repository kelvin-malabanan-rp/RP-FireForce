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
import { retrieveUserSession } from "@/constants/local-storage";
import { createAuditLog } from "@/api/audit-trail";
import { usePushNotificationContext } from "@/context/push-notification-context";
import {LinearGradient} from "expo-linear-gradient";
import { useRouter } from "expo-router";

type NotificationMode = 'individual' | 'team';

export default function IncidentsScreen() {
    const router = useRouter();
    const { sendNotificationToOnCallTeam } = usePushNotificationContext();
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
    const [selectedStatusTab, setSelectedStatusTab] = useState<string>("open");

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
            setError("Failed to load incidents. Pull to refresh.");
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

            const { primary = [], backup = [], escalation = [] } = onCallResponse.data;
            const allAssignments = [...primary, ...backup, ...escalation];
            const teamMap = new Map<string, any>();

            allAssignments.forEach((assignment: any) => {
                const teamId = assignment.teamId;

                if (!teamMap.has(teamId)) {
                    teamMap.set(teamId, {
                        id: teamId,
                        name: assignment.teamName,
                        membersMap: new Map<string, TeamMember>()
                    });
                }

                const team = teamMap.get(teamId);
                const userId = assignment.userId;

                if (!team.membersMap.has(userId)) {
                    const [firstName = '', lastName = ''] = (assignment.fullname || '').split(' ');
                    team.membersMap.set(userId, {
                        id: userId,
                        email: assignment.email,
                        firstName,
                        lastName,
                        role: assignment.role
                    });
                }
            });

            const transformedTeams: Team[] = Array.from(teamMap.values()).map(team => ({
                id: team.id,
                name: team.name,
                members: Array.from(team.membersMap.values())
            }));

            setAvailableTeams(transformedTeams);

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
        if (!newIncident.title || !newIncident.description || !newIncident.severity) {
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

            const response = await createIncident(incidentData);

            if (response.httpStatus === "OK" && response.data) {
                const incident = response.data;

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

                createAuditLog(auditPayload)
                    .then(() => console.log("✅ Audit log created"))
                    .catch(err => console.warn("⚠️ Failed to create audit log:", err));

                fetchAllIncidents();

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

                resetIncidentForm();
                setModalVisible(false);

                const notificationCount = notificationMode === 'individual'
                    ? selectedUsers.length
                    : selectedEmails.length;

                Alert.alert(
                    "Success",
                    newIncident.bypassRotation
                        ? `Incident created! Notifying ${notificationCount} people...`
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

    const statusTabs = [
        {
            key: 'open',
            label: 'Open',
            color: '#EF4444',
            count: incidents.filter(i => i.status === 'open').length
        },
        {
            key: 'investigating',
            label: 'Active',
            color: '#F59E0B',
            count: incidents.filter(i => i.status === 'investigating').length
        },
        {
            key: 'resolved',
            label: 'Resolved',
            color: '#10B981',
            count: incidents.filter(i => i.status === 'resolved').length
        }
    ];

    const filteredIncidents = incidents
        .filter(incident => incident.status === selectedStatusTab)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return ['#DC2626', '#B91C1C'];
            case 'high': return ['#EA580C', '#C2410C'];
            case 'medium': return ['#D97706', '#B45309'];
            case 'low': return ['#16A34A', '#15803D'];
            default: return ['#6B7280', '#4B5563'];
        }
    };

    const getRelativeTime = (timestamp: Date) => {
        const now = new Date().getTime();
        const time = timestamp.getTime();
        const diff = now - time;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const handleIncidentPress = (incident: IncidentUI) => {
        router.push(`/inner-incident-page?incidentId=${incident.id}`);
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
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#F97316"
                        colors={['#F97316']}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Incidents</Text>
                        <Text style={styles.headerSubtitle}>{incidents.length} total incidents</Text>
                    </View>
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

                {/* Status Tabs */}
                <View style={styles.tabsContainer}>
                    {statusTabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[
                                styles.tab,
                                selectedStatusTab === tab.key && styles.tabActive
                            ]}
                            onPress={() => setSelectedStatusTab(tab.key)}
                        >
                            <Text style={[
                                styles.tabLabel,
                                selectedStatusTab === tab.key && styles.tabLabelActive
                            ]}>
                                {tab.label}
                            </Text>
                            <View style={[
                                styles.tabBadge,
                                selectedStatusTab === tab.key && { backgroundColor: tab.color }
                            ]}>
                                <Text style={[
                                    styles.tabBadgeText,
                                    selectedStatusTab === tab.key && styles.tabBadgeTextActive
                                ]}>
                                    {tab.count}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Incidents List */}
                {error && (
                    <View style={styles.errorBanner}>
                        <Ionicons name="alert-circle" size={20} color="#FCA5A5" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {filteredIncidents.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons
                            name={selectedStatusTab === 'resolved' ? "checkmark-circle-outline" : "folder-open-outline"}
                            size={64}
                            color="#64748B"
                        />
                        <Text style={styles.emptyTitle}>No {statusTabs.find(t => t.key === selectedStatusTab)?.label} Incidents</Text>
                        <Text style={styles.emptySubtitle}>
                            {selectedStatusTab === 'open' ? 'All systems operational' :
                                selectedStatusTab === 'investigating' ? 'No active investigations' :
                                    'No resolved incidents yet'}
                        </Text>
                    </View>
                ) : (
                    filteredIncidents.map((incident) => (
                        <TouchableOpacity
                            key={incident.id}
                            style={styles.incidentCard}
                            onPress={() => handleIncidentPress(incident)}
                            activeOpacity={0.7}
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
                                <Text style={styles.incidentTime}>{getRelativeTime(incident.timestamp)}</Text>
                            </View>

                            <Text style={styles.incidentTitle} numberOfLines={2}>
                                {incident.title}
                            </Text>

                            {incident.description && (
                                <Text style={styles.incidentDescription} numberOfLines={2}>
                                    {incident.description}
                                </Text>
                            )}

                            <View style={styles.incidentFooter}>
                                <View style={styles.incidentMeta}>
                                    <Ionicons name="person-outline" size={14} color="#94A3B8" />
                                    <Text style={styles.metaText}>{incident.reportedBy}</Text>
                                </View>
                                {incident.location && (
                                    <View style={styles.incidentMeta}>
                                        <Ionicons name="location-outline" size={14} color="#94A3B8" />
                                        <Text style={styles.metaText}>{incident.location}</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* Create Incident Modal - Keep the same, just updated styling */}
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
                                <Text style={styles.modalTitle}>New Incident</Text>
                                <TouchableOpacity onPress={() => {
                                    resetIncidentForm();
                                    setModalVisible(false);
                                }}>
                                    <Ionicons name="close" size={24} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="Incident Title *"
                                placeholderTextColor="#64748B"
                                value={newIncident.title}
                                onChangeText={(text) =>
                                    setNewIncident((prev) => ({ ...prev, title: text }))
                                }
                            />

                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Description *"
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
                                <Text style={styles.sectionLabel}>Severity *</Text>
                                <View style={styles.severityContainer}>
                                    {[
                                        { key: "low", label: "Low", colors: ['#16A34A', '#15803D'] as const },
                                        { key: "medium", label: "Medium", colors: ['#D97706', '#B45309'] as const },
                                        { key: "high", label: "High", colors: ['#EA580C', '#C2410C'] as const },
                                        { key: "critical", label: "Critical", colors: ['#DC2626', '#B91C1C'] as const },
                                    ].map((sev) => {
                                        const isActive = newIncident.severity === sev.key;
                                        return (
                                            <TouchableOpacity
                                                key={sev.key}
                                                style={styles.severityOption}
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
                                                        style={styles.severityOptionGradient}
                                                    >
                                                        <Text style={styles.severityOptionTextActive}>
                                                            {sev.label}
                                                        </Text>
                                                        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                                                    </LinearGradient>
                                                ) : (
                                                    <View style={styles.severityOptionInactive}>
                                                        <Text style={styles.severityOptionText}>{sev.label}</Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Emergency Bypass - Keep existing code */}
                            <View style={styles.emergencySection}>
                                <TouchableOpacity
                                    style={styles.bypassToggle}
                                    onPress={() => setNewIncident(prev => ({
                                        ...prev,
                                        bypassRotation: !prev.bypassRotation
                                    }))}
                                >
                                    <View style={styles.bypassToggleContent}>
                                        <Ionicons name="alert-circle" size={20} color="#EF4444" />
                                        <View style={styles.bypassTextContainer}>
                                            <Text style={styles.bypassTitle}>Emergency Override</Text>
                                            <Text style={styles.bypassSubtitle}>
                                                Bypass rotation and notify specific people
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

                                {newIncident.bypassRotation && (
                                    <>
                                        <View style={styles.modeSelector}>
                                            <Text style={styles.sectionLabel}>Notify by:</Text>
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

                                        {notificationMode === 'individual' && (
                                            <View style={styles.selectionContainer}>
                                                <Text style={styles.selectionTitle}>
                                                    Select People ({selectedUsers.length})
                                                </Text>
                                                {availableUsers.length === 0 ? (
                                                    <View style={styles.emptySelection}>
                                                        <Ionicons name="people-outline" size={32} color="#64748B" />
                                                        <Text style={styles.emptySelectionText}>No team members found</Text>
                                                    </View>
                                                ) : (
                                                    availableUsers.map(user => (
                                                        <TouchableOpacity
                                                            key={user.id}
                                                            style={styles.selectionItem}
                                                            onPress={() => toggleUserSelection(user.id)}
                                                        >
                                                            <View style={styles.selectionInfo}>
                                                                <Ionicons name="person-circle" size={24} color="#94A3B8" />
                                                                <View style={styles.selectionDetails}>
                                                                    <Text style={styles.selectionName}>
                                                                        {user.firstName} {user.lastName}
                                                                    </Text>
                                                                    <Text style={styles.selectionEmail}>{user.email}</Text>
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

                                        {notificationMode === 'team' && (
                                            <View style={styles.selectionContainer}>
                                                <Text style={styles.selectionTitle}>
                                                    Select Teams ({selectedTeams.length})
                                                </Text>
                                                {availableTeams.length === 0 ? (
                                                    <View style={styles.emptySelection}>
                                                        <Ionicons name="people-outline" size={32} color="#64748B" />
                                                        <Text style={styles.emptySelectionText}>No teams found</Text>
                                                    </View>
                                                ) : (
                                                    availableTeams.map(team => (
                                                        <TouchableOpacity
                                                            key={team.id}
                                                            style={styles.selectionItem}
                                                            onPress={() => toggleTeamSelection(team.id)}
                                                        >
                                                            <View style={styles.selectionInfo}>
                                                                <Ionicons name="people-circle" size={24} color="#3B82F6" />
                                                                <View style={styles.selectionDetails}>
                                                                    <Text style={styles.selectionName}>{team.name}</Text>
                                                                    <Text style={styles.selectionEmail}>
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
                                            <Text style={styles.createButtonText}>Create Incident</Text>
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
        backgroundColor: '#0F172A',
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: Platform.OS === 'ios' ? 100 : 80,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 4,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    addButtonWrapper: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 20,
        gap: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderWidth: 1,
        borderColor: '#334155',
        gap: 6,
    },
    tabActive: {
        backgroundColor: 'rgba(249, 115, 22, 0.15)',
        borderColor: '#F97316',
    },
    tabLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    tabLabelActive: {
        color: '#F97316',
    },
    tabBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: '#334155',
    },
    tabBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    tabBadgeTextActive: {
        color: '#FFFFFF',
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(220, 38, 38, 0.2)',
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DC2626',
        gap: 8,
    },
    errorText: {
        flex: 1,
        color: '#FCA5A5',
        fontSize: 13,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        marginHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 16,
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 8,
        textAlign: 'center',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    incidentCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 12,
        padding: 16,
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
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    severityText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    incidentTime: {
        fontSize: 12,
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    incidentTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 8,
        lineHeight: 22,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    incidentDescription: {
        fontSize: 13,
        color: '#CBD5E1',
        marginBottom: 12,
        lineHeight: 18,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    incidentFooter: {
        flexDirection: 'row',
        gap: 16,
    },
    incidentMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 11,
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#1E293B',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        maxHeight: '90%',
        borderWidth: 1,
        borderColor: '#334155',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    input: {
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 8,
        padding: 14,
        fontSize: 14,
        marginBottom: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#CBD5E1',
        marginBottom: 12,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    severitySelector: {
        marginBottom: 20,
    },
    severityContainer: {
        flexDirection: 'row',
        gap: 6,
        flexWrap: 'wrap',
    },
    severityOption: {
        flex: 1,
        minWidth: '22%',
        borderRadius: 8,
        overflow: 'hidden',
    },
    severityOptionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        gap: 4,
    },
    severityOptionInactive: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#334155',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
    },
    severityOptionText: {
        fontSize: 11,
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    severityOptionTextActive: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    emergencySection: {
        marginBottom: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#334155',
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
        fontSize: 13,
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
    selectionContainer: {
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    selectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#CBD5E1',
        marginBottom: 12,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    selectionItem: {
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
    selectionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    selectionDetails: {
        marginLeft: 10,
        flex: 1,
    },
    selectionName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    selectionEmail: {
        fontSize: 11,
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    emptySelection: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
    },
    emptySelectionText: {
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
    createButtonWrapper: {
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 20,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    createButtonDisabled: {
        opacity: 0.6,
    },
    createButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
});