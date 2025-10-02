import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator, Platform,
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
import {Ionicons} from "@expo/vector-icons";

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
                // commentsResponse.data is already the array
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

    // Handle ignore action
    const handleIgnore = async () => {
        if (!incident) return;

        Alert.alert(
            "Ignore Incident",
            "Are you sure you want to ignore this incident?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Ignore",
                    style: "destructive",
                    onPress: async () => {
                        setProcessingAction(true);
                        try {
                            Alert.alert("Success", "Incident ignored");
                            router.back();
                        } catch (error) {
                            Alert.alert("Error", "Failed to ignore incident");
                        } finally {
                            setProcessingAction(false);
                        }
                    }
                }
            ]
        );
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

    const formatTimestamp = (timestamp: Date) => {
        return timestamp.toLocaleString([], {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
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

                {/* Incident Details Card */}
                <View style={styles.detailsCard}>
                    <View style={styles.titleSection}>
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

                    <Text style={styles.incidentDescription}>{incident.description}</Text>

                    {/* Incident Metadata */}
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

                {/* Action Buttons */}
                {incident.status !== 'resolved' && (
                    <View style={styles.actionButtonsContainer}>
                        {incident.status === 'open' && (
                            <>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.acceptButton]}
                                    onPress={handleAccept}
                                    disabled={processingAction}
                                >
                                    {processingAction ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <>
                                            <IconSymbol name="checkmark" size={20} color="#FFFFFF" />
                                            <Text style={styles.actionButtonText}>Accept</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, styles.ignoreButton]}
                                    onPress={handleIgnore}
                                    disabled={processingAction}
                                >
                                    {processingAction ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <>
                                            <IconSymbol name="xmark" size={20} color="#FFFFFF" />
                                            <Text style={styles.actionButtonText}>Ignore</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}
                {/* Action Buttons */}
                {incident.status === 'investigating' && (
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.acceptButton]}
                            onPress={handleAccept}
                            disabled={processingAction}
                        >
                            {processingAction ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <>
                                    <IconSymbol name="checkmark" size={20} color="#FFFFFF" />
                                    <Text style={styles.actionButtonText}>Mark as Resolved</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Comments Display Section */}
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

                {/* Comment Section */}
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
                        style={[
                            styles.submitCommentButton,
                            (!comment.trim() || submittingComment) && styles.submitCommentButtonDisabled
                        ]}
                        onPress={handleSubmitComment}
                        disabled={!comment.trim() || submittingComment}
                    >
                        {submittingComment ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <>
                                <IconSymbol name="paperplane.fill" size={16} color="#FFFFFF" />
                                <Text style={styles.submitCommentButtonText}>Submit Comment</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
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
        color: '#6B7280',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    errorText: {
        fontSize: 16,
        color: '#DC2626',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
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
        color: '#3B82F6',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    headerRight: {
        width: 40,
    },
    scrollView: {
        flex: 1,
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
        backgroundColor: '#FFFFFF',
        margin: 16,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
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
        color: '#111827',
        flex: 1,
        marginRight: 12,
        lineHeight: 28,
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    severityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    severityText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    incidentDescription: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
        marginBottom: 24,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    metadataSection: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
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
        color: '#6B7280',
        fontWeight: '500',
        minWidth: 80,
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    metadataValue: {
        fontSize: 13,
        color: '#111827',
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
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
        minWidth: '100%',
    },
    acceptButton: {
        backgroundColor: '#10B981',
        flex: 1,
        minWidth: 0,
    },
    ignoreButton: {
        backgroundColor: '#EF4444',
        flex: 1,
        minWidth: 0,
    },
    resolveButton: {
        backgroundColor: '#8B5CF6',
        flex: 1,
        minWidth: 0,
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    commentsDisplaySection: {
        backgroundColor: '#FFFFFF',
        margin: 16,
        marginTop: 0,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    commentsDisplayTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    commentsLoader: {
        paddingVertical: 20,
    },
    commentItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
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
        color: '#3B82F6',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    commentAuthorEmail: {
        fontSize: 10,
        fontWeight: '600',
        color: '#525050',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    commentTime: {
        marginTop: -15,
        fontSize: 11,
        color: '#6B7280',
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    commentText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    commentSection: {
        backgroundColor: '#FFFFFF',
        margin: 16,
        marginTop: 0,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    commentSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 14,
        fontSize: 14,
        backgroundColor: '#FFFFFF',
        marginBottom: 16,
        minHeight: 100,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    submitCommentButton: {
        backgroundColor: '#3B82F6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    submitCommentButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    submitCommentButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
})