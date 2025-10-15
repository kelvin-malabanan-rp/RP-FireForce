import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Platform,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
    getIncidentById,
    postIncidentComment,
    getAllIncidentComments,
    updateIncidentStatus
} from '@/api/incident-controller';
import { getSeverityColor, getStatusColor } from '@/constants/colors';
import {
    IncidentUI,
    Incident,
    PostIncidentComments,
    GetAllIncidentComments
} from '@/types/incident-types';
import { FONT_FAMILY } from '@/constants/fonts';
import { UserSession } from "@/types";
import { retrieveUserSession } from "@/constants/local-storage";
import { Ionicons } from "@expo/vector-icons";
import { createAuditLog } from "@/api/audit-trail";
import { usePushNotificationContext } from '@/context/push-notification-context';
import { LinearGradient } from "expo-linear-gradient";
import {escalateIncident, oncallController} from '@/api/oncall-schedule-controller';

export default function InnerIncidentPage() {
    const router = useRouter();
    const { incidentId } = useLocalSearchParams<{ incidentId: string }>();

    const [incident, setIncident] = useState<IncidentUI | null>(null);
    const [comments, setComments] = useState<GetAllIncidentComments[]>([]);
    const [userSession, setUserSession] = useState<UserSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingComments, setLoadingComments] = useState(false);
    const [comment, setComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [processingAction, setProcessingAction] = useState(false);
    const { sendStatusChangeNotification } = usePushNotificationContext();

    // Escalation modal states
    const [showEscalateModal, setShowEscalateModal] = useState(false);
    const [escalationPriority, setEscalationPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
    const [escalationReason, setEscalationReason] = useState('');
    const [escalating, setEscalating] = useState(false);

    const parseApiDateTime = (dateTimeString: string): Date => {
        return new Date(dateTimeString);
    };

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

    const loadUserSession = async () => {
        try {
            const session = await retrieveUserSession();
            setUserSession(session || null);
            console.log("USER SESSION STORAGE RETRIVAL: ", session);
        } catch (error) {
            console.error('Error loading user session:', error);
        }
    };

    const fetchComments = async () => {
        if (!incidentId) return;

        setLoadingComments(true);
        try {
            const commentsResponse = await getAllIncidentComments(incidentId);
            if (commentsResponse.httpStatus === "OK" && commentsResponse.data) {
                setComments(commentsResponse.data);
            }
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const fetchIncident = async () => {
        try {
            const response = await getIncidentById(incidentId);

            if (response.httpStatus === "OK" && response.data) {
                const transformedIncident = transformApiIncident(response.data);
                setIncident(transformedIncident);
                await fetchComments();
            } else {
                Alert.alert("Error", response.message || "Incident not found", [
                    { text: "OK", onPress: () => router.push('/tabs/incidents') }
                ]);
            }
        } catch (error) {
            console.error('Failed to fetch incident:', error);
            Alert.alert("Error", "Failed to load incident details", [
                { text: "OK", onPress: () => router.push('/tabs/incidents') }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUserSession();
        if (incidentId) {
            fetchIncident();
        }
    }, [incidentId]);

    const handleAccept = async () => {
        if (!incident || !userSession) return;

        const isInvestigating = incident.status === "investigating";

        Alert.alert(
            isInvestigating ? "Resolve Incident" : "Accept Incident",
            isInvestigating
                ? "Mark this incident as resolved? All notified users will receive an all-clear notification."
                : "Are you sure you want to accept this incident?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: isInvestigating ? "Resolve" : "Accept",
                    style: "default",
                    onPress: async () => {
                        setProcessingAction(true);
                        try {
                            const result = await updateIncidentStatus({
                                incidentId: incident.id,
                                newStatus: isInvestigating ? "resolved" : "investigating",
                                resolvedBy: userSession.email
                            });

                            if (result.data || result.object) {
                                const resultData = result.data || result.object!;

                                await sendStatusChangeNotification({
                                    id: incident.id,
                                    title: incident.title,
                                    status: isInvestigating ? 'resolved' : 'investigating',
                                    resolvedBy: isInvestigating ? userSession.email : undefined,
                                    investigatedBy: !isInvestigating ? userSession.email : undefined,
                                    excludeUserId: userSession.email,
                                    teamId: incident.teamId
                                });

                                const auditPayload = {
                                    action: isInvestigating ? "RESOLVE_INCIDENT" : "ACCEPT_INCIDENT",
                                    incidentId: incident.id,
                                    userId: userSession.id,
                                    description: isInvestigating
                                        ? `User ${userSession.firstName} ${userSession.lastName} resolved incident "${incident.title}"`
                                        : `User ${userSession.firstName} ${userSession.lastName} accepted and is investigating incident "${incident.title}"`,
                                    details: {
                                        title: incident.title,
                                        previousStatus: incident.status,
                                        newStatus: resultData.status,
                                        severity: incident.severity,
                                        actionFrom: "mobile_app",
                                    },
                                    oldValue: {
                                        status: incident.status,
                                    },
                                    newValue: {
                                        status: resultData.status,
                                        ...(isInvestigating && { resolvedBy: userSession.email }),
                                    },
                                    metadata: {
                                        device: Platform.OS,
                                        timestamp: new Date().toISOString(),
                                        userEmail: userSession.email,
                                        notifiedCount: resultData.notifiedCount || 0,
                                    },
                                };

                                try {
                                    const auditResponse = await createAuditLog(auditPayload);
                                    console.log("✅ Audit log created:", auditResponse);
                                } catch (auditError) {
                                    console.warn("⚠️ Failed to create audit log:", auditError);
                                }

                                if (isInvestigating && resultData.notifiedCount) {
                                    Alert.alert(
                                        'Success',
                                        `Incident resolved! All-clear notification sent to ${resultData.notifiedCount} people.`,
                                        [{ text: 'OK', onPress: () => router.push('/tabs/incidents') }]
                                    );
                                } else {
                                    Alert.alert("Success", "Incident accepted successfully. Now investigating.");
                                }

                                setIncident(prev => prev ? {
                                    ...prev,
                                    status: resultData.status as IncidentUI['status']
                                } : null);
                            }
                        } catch (error) {
                            console.error(`Error ${isInvestigating ? 'resolving' : 'accepting'} incident:`, error);
                            Alert.alert("Error", `Failed to ${isInvestigating ? 'resolve' : 'accept'} incident`);
                        } finally {
                            setProcessingAction(false);
                        }
                    }
                }
            ]
        );
    };

    const handleEscalate = async () => {
        if (!escalationReason.trim()) {
            Alert.alert('Error', 'Please provide a reason for escalation');
            return;
        }

        setEscalating(true);
        try {
            if (!userSession?.teamId) {
                console.warn("⚠️ Missing teamId in user session, cannot escalate incident");
                Alert.alert('Error', 'Your account is not associated with a team.');
                return;
            }

            console.log('[escalate] Starting incident escalation...');

            // Step 1: Escalate the incident
            const escalationResponse = await escalateIncident({
                teamId: userSession.teamId,
                incidentId: incident!.id,
                reason: escalationReason.trim(),
                priority: escalationPriority || 'high',
                userRole: userSession?.teamRole ?? null,
            });

            const escalationData = escalationResponse.data;
            console.log('[escalate] Escalation response:', escalationData);

            // Step 2: Send push notifications to escalated users
            if (escalationData?.object?.notifiedUsers && escalationData.object.notifiedUsers.length > 0) {
                console.log('[escalate] Sending notifications to', escalationData.object.notifiedUsers.length, 'users');

                const notificationResult = await sendEscalationNotifications(
                    escalationData.object.notifiedUsers,
                    incident!,
                    escalationData.escalatedToRole || 'escalation',
                    escalationReason.trim()
                );

                console.log('[escalate] Notification results:', notificationResult);
            } else {
                console.warn('[escalate] No users to notify in escalation response');
            }

            // Step 3: Create audit log
            if (userSession) {
                try {
                    await createAuditLog({
                        action: "ESCALATE_INCIDENT",
                        incidentId: incident!.id,
                        userId: userSession.id,
                        description: `${userSession.firstName} ${userSession.lastName} escalated incident "${incident!.title}"`,
                        details: {
                            incidentTitle: incident!.title,
                            priority: escalationData?.priority || escalationPriority,
                            reason: escalationData?.reason || escalationReason.trim(),
                            severity: incident!.severity,
                            actionFrom: "mobile_app",
                            escalatedToRole: escalationData?.object?.escalatedToRole || null,
                            notifiedUsers: escalationData?.object?.notifiedUsers?.map(u => ({
                                fullname: u.fullname,
                                email: u.email,
                                role: u.role,
                                pushToken: u.pushToken ?? null,
                                fcmToken: u.fcmToken ?? null,
                            })) || [],
                        },
                        metadata: {
                            device: Platform.OS,
                            timestamp: new Date().toISOString(),
                            userEmail: userSession.email,
                        },
                    });
                    console.log('[escalate] Audit log created successfully');
                } catch (auditError) {
                    console.warn("⚠️ Failed to create escalation audit log:", auditError);
                }
            }

            setShowEscalateModal(false);
            setEscalationReason('');

            Alert.alert('Success', 'Incident escalated and notifications sent', [
                { text: 'OK', onPress: () => router.push('/tabs/incidents') }
            ]);
        } catch (error) {
            console.error('[escalate] Error escalating incident:', error);
            Alert.alert('Error', 'Failed to escalate incident');
        } finally {
            setEscalating(false);
        }
    };

    // Helper function to send escalation notifications
    const sendEscalationNotifications = async (
        users: Array<{
            fullname: string;
            email: string;
            role: string;
            pushToken?: string | null;
            fcmToken?: string | null;
        }>,
        incident: any,
        escalatedToRole: string,
        escalationReason: string
    ) => {
        let sent = 0, failed = 0, skipped = 0;
        const results: any[] = [];

        for (const user of users) {
            const token = user.pushToken || user.fcmToken;

            if (!token) {
                console.log(`[escalate] ⏭️ Skipping ${user.fullname} - No push token`);
                skipped++;
                results.push({
                    email: user.email,
                    fullname: user.fullname,
                    role: user.role,
                    status: 'skipped',
                    reason: 'No push token',
                });
                continue;
            }

            try {
                console.log(`[escalate] 📤 Sending to ${user.fullname} (${user.role})`);

                await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        to: token,
                        title: `🚨 ESCALATED: ${incident.title}`,
                        body: `Escalated to ${escalatedToRole}. Reason: ${escalationReason}`,
                        data: {
                            incidentId: incident.id,
                            type: 'escalation',
                            severity: incident.severity,
                            escalatedToRole,
                            reason: escalationReason,
                        },
                        priority: 'high',
                        sound: 'default',
                        channelId: 'incidents',
                    }),
                });

                sent++;
                results.push({
                    email: user.email,
                    fullname: user.fullname,
                    role: user.role,
                    status: 'sent',
                });
                console.log(`[escalate] ✅ Sent to ${user.fullname}`);
            } catch (error) {
                console.error(`[escalate] ❌ Failed to send to ${user.fullname}:`, error);
                failed++;
                results.push({
                    email: user.email,
                    fullname: user.fullname,
                    role: user.role,
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        console.log(`[escalate] 📊 Results: ${sent} sent, ${failed} failed, ${skipped} skipped`);
        return { sent, failed, skipped, results };
    };

    const handleSubmitComment = async () => {
        if (!comment.trim() || !incident) {
            Alert.alert("Error", "Please enter a comment");
            return;
        }

        setSubmittingComment(true);
        try {
            if (!userSession) {
                Alert.alert("Error", "User session not found. Please log in again.");
                return;
            }

            const commentData: PostIncidentComments = {
                incidentId: incident.id,
                userId: userSession.id,
                comment: comment.trim()
            };

            const response = await postIncidentComment(commentData);

            if (response.httpStatus === "OK") {
                const auditPayload = {
                    action: "ADD_INCIDENT_COMMENT",
                    incidentId: incident.id,
                    userId: userSession.id,
                    description: `${userSession.firstName} ${userSession.lastName} added a comment to incident "${incident.title}"`,
                    details: {
                        incidentTitle: incident.title,
                        commentLength: comment.trim().length,
                        commentPreview: comment.trim().substring(0, 100),
                        severity: incident.severity,
                        incidentStatus: incident.status,
                        actionFrom: "mobile_app"
                    },
                    metadata: {
                        device: Platform.OS,
                        timestamp: new Date().toISOString(),
                        userEmail: userSession.email,
                        commentId: response.data?.id
                    }
                };

                try {
                    const auditResponse = await createAuditLog(auditPayload);
                    console.log("✅ Comment audit log created:", auditResponse);
                } catch (auditError) {
                    console.warn("⚠️ Failed to create comment audit log:", auditError);
                }

                Alert.alert("Success", "Comment added successfully");
                setComment('');
                await fetchComments();
            } else {
                Alert.alert("Error", response.message || "Failed to add comment");
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
            Alert.alert("Error", "Failed to add comment");
        } finally {
            setSubmittingComment(false);
        }
    };

    const formatTimestamp = (timestamp: string | Date | null | undefined): string => {
        if (!timestamp) return 'N/A';

        try {
            const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

            if (isNaN(date.getTime())) return 'Invalid date';

            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'open':
                return 'exclamationmark.circle.fill';
            case 'investigating':
                return 'magnifyingglass.circle.fill';
            case 'resolved':
                return 'checkmark.circle.fill';
            default:
                return 'questionmark.circle.fill';
        }
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'low': return '#10B981';
            case 'medium': return '#F59E0B';
            case 'high': return '#F97316';
            case 'critical': return '#DC2626';
            default: return '#6B7280';
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading incident details...</Text>
            </SafeAreaView>
        );
    }

    if (!incident) {
        return (
            <SafeAreaView style={[styles.container, styles.errorContainer]}>
                <Text style={styles.errorText}>Incident not found</Text>
            </SafeAreaView>
        );
    }

    const priorities = ['low', 'medium', 'high', 'critical'] as const;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.push('/tabs/incidents')}
                >
                    {Platform.OS === 'ios' ? (
                        <IconSymbol name="chevron.left" size={20} color="#3B82F6" />
                    ) : (
                        <Ionicons name="arrow-back" size={20} color="#3B82F6" />
                    )}
                    <Text style={styles.backButtonText}></Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Incident Details</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={[styles.statusBanner, { backgroundColor: getStatusColor(incident.status) }]}>
                    <IconSymbol
                        name={getStatusIcon(incident.status)}
                        size={24}
                        color="#FFFFFF"
                    />
                    <Text style={styles.statusBannerText}>
                        {incident.status.toUpperCase()}
                    </Text>
                </View>

                <View style={styles.detailsCard}>
                    <View style={styles.titleSection}>
                        <Text style={styles.incidentTitle}>{incident.title}</Text>
                        <View style={styles.severityBadgeWrapper}>
                            <LinearGradient
                                colors={
                                    incident.severity === 'low' ? ['#16A34A', '#15803D'] as const :
                                        incident.severity === 'medium' ? ['#D97706', '#B45309'] as const :
                                            incident.severity === 'high' ? ['#EA580C', '#C2410C'] as const :
                                                ['#DC2626', '#B91C1C'] as const
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.severityBadge}
                            >
                                <Text style={styles.severityText}>
                                    {incident.severity.toUpperCase()}
                                </Text>
                            </LinearGradient>
                        </View>
                    </View>

                    <Text style={styles.incidentDescription}>{incident.description}</Text>

                    <View style={styles.metadataSection}>
                        <View style={styles.metadataRow}>
                            <IconSymbol name="clock" size={16} color="#6B7280" />
                            <Text style={styles.metadataLabel}>Reported:</Text>
                            <Text style={styles.metadataValue}>
                                {formatTimestamp(incident.timestamp)}
                            </Text>
                        </View>

                        <View style={styles.metadataRow}>
                            <IconSymbol name="person" size={16} color="#6B7280" />
                            <Text style={styles.metadataLabel}>Reported by:</Text>
                            <Text style={styles.metadataValue}>{incident.reportedBy}</Text>
                        </View>

                        {incident.location && (
                            <View style={styles.metadataRow}>
                                <IconSymbol name="location" size={16} color="#6B7280" />
                                <Text style={styles.metadataLabel}>Location:</Text>
                                <Text style={styles.metadataValue}>{incident.location}</Text>
                            </View>
                        )}

                        {incident.assignedTo && (
                            <View style={styles.metadataRow}>
                                <IconSymbol name="person.badge.plus" size={16} color="#6B7280" />
                                <Text style={styles.metadataLabel}>Assigned to:</Text>
                                <Text style={styles.metadataValue}>{incident.assignedTo}</Text>
                            </View>
                        )}

                        {incident.awsAlarmName && (
                            <View style={styles.metadataRow}>
                                <IconSymbol name="server.rack" size={16} color="#6B7280" />
                                <Text style={styles.metadataLabel}>AWS Alarm:</Text>
                                <Text style={styles.metadataValue}>{incident.awsAlarmName}</Text>
                            </View>
                        )}

                        {incident.resolvedAt && (
                            <View style={styles.metadataRow}>
                                <IconSymbol name="checkmark.circle" size={16} color="#10B981" />
                                <Text style={styles.metadataLabel}>Resolved:</Text>
                                <Text style={styles.metadataValue}>
                                    {formatTimestamp(incident.resolvedAt)}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {incident.status !== 'resolved' && (
                    <View style={styles.actionButtonsContainer}>
                        {incident.status === 'open' && (
                            <>
                                <TouchableOpacity
                                    style={styles.actionButtonWrapper}
                                    onPress={handleAccept}
                                    disabled={processingAction}
                                >
                                    <LinearGradient
                                        colors={['#16A34A', '#15803D'] as const}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.acceptButton}
                                    >
                                        {processingAction ? (
                                            <ActivityIndicator color="#FFFFFF" size="small" />
                                        ) : (
                                            <>
                                                <IconSymbol name="checkmark" size={20} color="#FFFFFF" />
                                                <Text style={styles.actionButtonText}>Acknowledge</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionButtonWrapper}
                                    onPress={() => setShowEscalateModal(true)}
                                    disabled={processingAction}
                                >
                                    <LinearGradient
                                        colors={['#DC2626', '#B91C1C'] as const}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.ignoreButton}
                                    >
                                        {processingAction ? (
                                            <ActivityIndicator color="#FFFFFF" size="small" />
                                        ) : (
                                            <>
                                                <IconSymbol name="arrow.up.circle" size={20} color="#FFFFFF" />
                                                <Text style={styles.actionButtonText}>Escalate</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}

                {incident.status === 'investigating' && (
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                            style={styles.actionButtonWrapper}
                            onPress={handleAccept}
                            disabled={processingAction}
                        >
                            <LinearGradient
                                colors={['#16A34A', '#15803D'] as const}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.resolveButton}
                            >
                                {processingAction ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <>
                                        <IconSymbol name="checkmark" size={20} color="#FFFFFF" />
                                        <Text style={styles.actionButtonText}>Mark as Resolved</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}

                {comments.length > 0 && (
                    <View style={styles.commentsDisplaySection}>
                        <Text style={styles.commentsDisplayTitle}>Comments ({comments.length})</Text>
                        {loadingComments ? (
                            <ActivityIndicator color="#3B82F6" style={styles.commentsLoader} />
                        ) : (
                            comments.map((commentItem) => (
                                <View key={commentItem.id} style={styles.commentItem}>
                                    <View style={styles.commentHeader}>
                                        <View>
                                            <Text style={styles.commentAuthor}>{commentItem.userFullname}</Text>
                                            <Text style={styles.commentAuthorEmail}>{commentItem.userEmail}</Text>
                                        </View>
                                        <Text style={styles.commentTime}>
                                            {new Date(commentItem.createdAt).toLocaleString([], {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </Text>
                                    </View>
                                    <Text style={styles.commentText}>{commentItem.comment}</Text>
                                </View>
                            ))
                        )}
                    </View>
                )}

                <View style={styles.commentSection}>
                    <Text style={styles.commentSectionTitle}>Add Comment</Text>
                    <TextInput
                        style={styles.commentInput}
                        placeholder="Enter your comment here..."
                        placeholderTextColor="#9CA3AF"
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                    <TouchableOpacity
                        style={styles.submitCommentButtonWrapper}
                        onPress={handleSubmitComment}
                        disabled={!comment.trim() || submittingComment}
                    >
                        <LinearGradient
                            colors={(!comment.trim() || submittingComment)
                                ? ['#64748B', '#64748B']
                                : ['#F97316', '#DC2626']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.submitCommentButton}
                        >
                            {submittingComment ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <>
                                    <IconSymbol name="paperplane.fill" size={16} color="#FFFFFF" />
                                    <Text style={styles.submitCommentButtonText}>Submit Comment</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Escalation Modal */}
            <Modal
                visible={showEscalateModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowEscalateModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Escalate Incident</Text>
                            <TouchableOpacity onPress={() => setShowEscalateModal(false)}>
                                <Ionicons name="close" size={24} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={styles.modalSection}>
                                <Text style={styles.modalLabel}>Incident</Text>
                                <View style={styles.modalIncidentCard}>
                                    <Text style={styles.modalIncidentTitle}>{incident.title}</Text>
                                    <View style={styles.modalIncidentMeta}>
                                        <Text style={styles.modalIncidentMetaText}>
                                            Severity: {incident.severity.toUpperCase()}
                                        </Text>
                                        <Text style={styles.modalIncidentMetaText}>•</Text>
                                        <Text style={styles.modalIncidentMetaText}>
                                            Status: {incident.status.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.modalSection}>
                                <Text style={styles.modalLabel}>Priority Level</Text>
                                <View style={styles.priorityContainer}>
                                    {priorities.map((p) => {
                                        const isActive = escalationPriority === p;
                                        const color = getPriorityColor(p);
                                        return (
                                            <TouchableOpacity
                                                key={p}
                                                style={[
                                                    styles.priorityButton,
                                                    {
                                                        borderColor: color,
                                                        flex: isActive ? 1.5 : 1,
                                                    },
                                                    isActive && { backgroundColor: `${color}22`, borderWidth: 2 },
                                                ]}
                                                onPress={() => setEscalationPriority(p)}
                                            >
                                                <View style={[styles.priorityDot, { backgroundColor: color }]} />
                                                <Text
                                                    style={[
                                                        styles.priorityText,
                                                        isActive && { color, fontWeight: '700' },
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                                </Text>
                                                {isActive && (
                                                    <Ionicons
                                                        name="checkmark-circle"
                                                        size={18}
                                                        color={color}
                                                        style={{ marginLeft: 4 }}
                                                    />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            <View style={styles.modalSection}>
                                <Text style={styles.modalLabel}>Escalation Reason</Text>
                                <TextInput
                                    style={styles.modalTextArea}
                                    placeholder="Describe why this incident needs escalation..."
                                    placeholderTextColor="#6B7280"
                                    value={escalationReason}
                                    onChangeText={setEscalationReason}
                                    multiline
                                    numberOfLines={6}
                                />
                            </View>

                            <View style={styles.modalInfoCard}>
                                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                                <Text style={styles.modalInfoText}>
                                    This will notify the next person in the escalation chain based on the current escalation level.
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.modalSubmitButtonWrapper}
                                onPress={handleEscalate}
                                disabled={escalating || !escalationReason.trim()}
                            >
                                <LinearGradient
                                    colors={escalating || !escalationReason.trim()
                                        ? ['#64748B', '#64748B']
                                        : ['#F97316', '#DC2626']
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.modalSubmitButton}
                                >
                                    {escalating ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <>
                                            <Ionicons name="arrow-up-circle" size={20} color="#FFFFFF" />
                                            <Text style={styles.modalSubmitButtonText}>Escalate Incident</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
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
    errorContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 15,
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    errorText: {
        fontSize: 16,
        color: '#FCA5A5',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        marginLeft: -8,
        gap: 4,
    },
    backButtonText: {
        fontSize: 16,
        color: '#F97316',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    headerRight: {
        width: 40,
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    statusBannerText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    detailsCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        margin: 16,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    titleSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    incidentTitle: {
        fontSize: 17,
        color: '#FFFFFF',
        flex: 1,
        marginRight: 12,
        lineHeight: 28,
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    severityBadgeWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    severityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    severityText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    incidentDescription: {
        fontSize: 15,
        color: '#CBD5E1',
        lineHeight: 22,
        marginBottom: 24,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    metadataSection: {
        borderTopWidth: 1,
        borderTopColor: '#334155',
        paddingTop: 20,
        gap: 12,
    },
    metadataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metadataLabel: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '500',
        minWidth: 80,
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    metadataValue: {
        fontSize: 13,
        color: '#FFFFFF',
        flex: 1,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 16,
    },
    actionButtonWrapper: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
        minWidth: 0,
    },
    acceptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    ignoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    resolveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    commentsDisplaySection: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        margin: 16,
        marginTop: 0,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    commentsDisplayTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 16,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    commentsLoader: {
        paddingVertical: 20,
    },
    commentItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
        paddingBottom: 12,
        marginBottom: 12,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    commentAuthor: {
        fontSize: 13,
        fontWeight: '600',
        color: '#F97316',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    commentAuthorEmail: {
        fontSize: 10,
        fontWeight: '600',
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    commentTime: {
        marginTop: -15,
        fontSize: 11,
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    commentText: {
        fontSize: 14,
        color: '#CBD5E1',
        lineHeight: 20,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    commentSection: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        margin: 16,
        marginTop: 0,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    commentSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 12,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 8,
        padding: 14,
        fontSize: 14,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        color: '#FFFFFF',
        marginBottom: 16,
        minHeight: 100,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    submitCommentButtonWrapper: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    submitCommentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    submitCommentButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1E293B',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    modalBody: {
        padding: 20,
    },
    modalSection: {
        marginBottom: 24,
    },
    modalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 12,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    modalIncidentCard: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    modalIncidentTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 8,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    modalIncidentMeta: {
        flexDirection: 'row',
        gap: 8,
    },
    modalIncidentMetaText: {
        fontSize: 12,
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    priorityContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    priorityButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
    },
    priorityDot: {
        width: 10,
        height: 10,
        borderRadius: 6,
        marginRight: 6,
    },
    priorityText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    modalTextArea: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#334155',
        padding: 14,
        fontSize: 15,
        color: '#FFFFFF',
        minHeight: 140,
        textAlignVertical: 'top',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    modalInfoCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        padding: 14,
        borderRadius: 10,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    modalInfoText: {
        flex: 1,
        fontSize: 13,
        color: '#93C5FD',
        marginLeft: 10,
        lineHeight: 20,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    modalSubmitButtonWrapper: {
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 20,
    },
    modalSubmitButton: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    modalSubmitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
});