// hooks/use-push-notifications.ts
import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { registerPushToken, respondToIncident } from '@/api/alert-controller';
import { router } from 'expo-router';
import { retrieveUserSession } from '@/constants/local-storage';
import { BASE_URL_DEV } from '@/utils/backend-url';
import {getAllCurrentOnCall, getUsersForEmergencyOverride, oncallController} from '@/api/oncall-schedule-controller';
import {createAuditLog} from "@/api/audit-trail";
import {getIncidentById} from "@/api/incident-controller";
import {sendEscalationEmail, sendIncidentAlertEmail, sendReminderEmail} from "@/api/email-controller";

export const usePushNotifications = () => {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
    const [registrationStatus, setRegistrationStatus] = useState<'pending' | 'registered' | 'failed'>('pending');
    const [id, setId] = useState<string | null>(null);
    const [notificationIds, setNotificationIds] = useState<Record<string, string[]>>({});

    // Load user session on mount
    useEffect(() => {
        const loadUserSession = async () => {
            const session = await retrieveUserSession();
            if (session?.id) {
                setId(session.id);
                console.log('[push] User session loaded:', session.id);
            } else {
                console.warn('[push] No user session found');
            }
        };
        loadUserSession();
    }, []);

    useEffect(() => {
        const sub = Notifications.addNotificationReceivedListener((notification) => {
            const data = notification.request.content.data as any;
            const incidentId = data?.incidentId || data?.data?.incidentId;
            const notificationId = notification.request.identifier;

            if (incidentId) {
                console.log('[push] Notification received, storing ID:', notificationId);
                setNotificationIds(prev => ({
                    ...prev,
                    [incidentId]: [...(prev[incidentId] || []), notificationId]
                }));
            }
        });

        return () => sub.remove();
    }, []);

    const clearStoredNotifications = async (incidentId: string) => {
        const ids = notificationIds[incidentId] || [];

        for (const id of ids) {
            await Notifications.dismissNotificationAsync(id);
        }

        setNotificationIds(prev => {
            const updated = { ...prev };
            delete updated[incidentId];
            return updated;
        });
    };

    // ✅ Auto-schedule reminders when receiving new incident notifications
    useEffect(() => {
        const sub = Notifications.addNotificationReceivedListener(async (notification) => {
            const data = notification.request.content.data as any;
            const incidentId = data?.incidentId;
            const notificationType = data?.type;

            // Store notification ID
            const notificationId = notification.request.identifier;
            if (incidentId) {
                console.log('[push] Notification received, storing ID:', notificationId);
                setNotificationIds(prev => ({
                    ...prev,
                    [incidentId]: [...(prev[incidentId] || []), notificationId]
                }));
            }

            console.log('[push] Incident ID:', incidentId);
            console.log('[push] notificationType:', notificationType);
            console.log('[push] data:', JSON.stringify(data, null, 2));

            // ✅ Only schedule reminders for NEW incident notifications
            if (incidentId && notificationType === 'incident_alert') {
                console.log('[push] 🔔 New incident notification received, scheduling 3 auto-reminders');

                await scheduleAutoReminder({
                    id: incidentId,
                    title: notification.request.content.title || 'Incident',
                    description: notification.request.content.body || '',
                    severity: data.severity || 'medium',
                    teamId: data.teamId,
                    maxReminders: 1,
                    delaySeconds: 10
                });

                console.log('[push] ✅ Auto-reminders scheduled: 10s, 20s, 30s');

                // ✅ Dismiss the initial notification
                await Notifications.dismissNotificationAsync(notificationId);
                console.log('[push] ✅ Initial notification dismissed');
            }
        });

        return () => sub.remove();
    }, []);

    // In your notification response handle
    useEffect(() => {
        const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
            const { actionIdentifier } = response;
            const data = response.notification.request.content.data as any;
            const incidentId = data?.incidentId || data?.data?.incidentId;
            const notificationId = response.notification.request.identifier;

            if (!incidentId) {
                console.error('[push] No incident ID in notification data');
                return;
            }

            const session = await retrieveUserSession();

            if (actionIdentifier === 'ACKNOWLEDGE') {
                console.log('[push] User acknowledged incident', incidentId);

                if (!session?.id) {
                    console.error('[push] Cannot acknowledge - user not logged in');
                    return;
                }

                try {
                    await respondToIncident(incidentId, 'acknowledge', session.id);
                    console.log('[push] Successfully acknowledged incident');
                    await Notifications.dismissNotificationAsync(notificationId);

                    // ✅ Fetch incident and send status notification
                    try {
                        const incidentResponse = await getIncidentById(incidentId);
                        if (incidentResponse.httpStatus === 'OK' && incidentResponse.data) {
                            await sendStatusChangeNotification({
                                id: incidentId,
                                title: incidentResponse.data.title,
                                status: 'investigating',
                                investigatedBy: session.email,
                                excludeUserId: session.id,
                                teamId: incidentResponse.data.teamId
                            });
                        }
                    } catch (error) {
                        console.error('[push] Error sending status notification:', error);
                    }
                } catch (error) {
                    console.error('[push] Error acknowledging:', error);
                }
            } else if (actionIdentifier === 'DECLINE') {
                console.log('[push] User declined incident', incidentId);

                if (!session?.id) {
                    console.error('[push] Cannot decline - user not logged in');
                    return;
                }

                try {
                    await respondToIncident(incidentId, 'decline', session.id);
                    console.log('[push] Successfully declined incident');
                    await Notifications.dismissNotificationAsync(notificationId);
                } catch (error) {
                    console.error('[push] Error declining:', error);
                }
            } else {
                console.log('[push] User tapped notification', incidentId);
                await Notifications.dismissNotificationAsync(notificationId);
                router.push({
                    pathname: '/inner-incident-page',
                    params: { incidentId },
                });
            }
        });

        return () => sub.remove();
    }, []);

    useEffect(() => {
        console.log('[push] useEffect start');
        setupNotifications();
    }, []);

    const ensureCategoriesAsync = async () => {
        await Notifications.setNotificationCategoryAsync('incident-actions', [
            {
                identifier: 'ACKNOWLEDGE',
                buttonTitle: "I've got this ✅",
                options: { opensAppToForeground: false },
            },
            {
                identifier: 'DECLINE',
                buttonTitle: "I can't right now ❌",
                options: { opensAppToForeground: false },
            },
        ]);
    };

    const setupNotifications = async () => {
        try {
            await Notifications.setNotificationHandler({
                handleNotification: async () =>
                    ({
                        shouldShowAlert: true,
                        shouldPlaySound: true,
                        shouldSetBadge: true,
                    } as Notifications.NotificationBehavior),
            });

            const { status } = await Notifications.requestPermissionsAsync({
                ios: {
                    allowAlert: true,
                    allowBadge: true,
                    allowSound: true,
                    allowCriticalAlerts: true,
                },
            });

            setPermissionStatus(status);
            console.log('[push] Permission status:', status);

            if (status === 'granted') {
                await ensureCategoriesAsync();
                await createNotificationChannels();
                await registerDevice();
            }
        } catch (err) {
            console.error('[push] setup error:', err);
            setRegistrationStatus('failed');
        }
    };

    const CHANNELS = {
        critical: 'critical-alerts-v4',
        high: 'high-priority-v4',
        medium: 'medium-priority-v4',
        default: 'default-v4',
    } as const;

    const createNotificationChannels = async () => {
        if (Platform.OS !== 'android') return;

        for (const id of Object.values(CHANNELS)) {
            try {
                await Notifications.deleteNotificationChannelAsync(id);
            } catch {}
        }

        // ✅ Use different sound files with pre-set volume levels
        await Notifications.setNotificationChannelAsync(CHANNELS.critical, {
            name: 'Critical Alerts',
            importance: Notifications.AndroidImportance.MAX,
            sound: 'alarm_critical', // ✅ Loudest audio file
            enableVibrate: true,
            vibrationPattern: [0, 1000, 500, 1000, 500, 1000], // ✅ Longer vibration
            bypassDnd: true, // ✅ Bypass Do Not Disturb
        });

        await Notifications.setNotificationChannelAsync(CHANNELS.high, {
            name: 'High Priority',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'alarm_high', // ✅ Loud audio file
            enableVibrate: true,
            vibrationPattern: [0, 250, 250, 250],
        });

        await Notifications.setNotificationChannelAsync(CHANNELS.medium, {
            name: 'Medium Priority',
            importance: Notifications.AndroidImportance.DEFAULT,
            sound: 'alarm_medium', // ✅ Medium audio file
            enableVibrate: true,
            vibrationPattern: [0, 250, 250],
        });

        await Notifications.setNotificationChannelAsync(CHANNELS.default, {
            name: 'Default',
            importance: Notifications.AndroidImportance.DEFAULT,
            sound: 'alarm_low', // ✅ Quiet audio file
        });
    };

    const getChannelBySeverity = (s: string) =>
        s === 'critical'
            ? CHANNELS.critical
            : s === 'high'
                ? CHANNELS.high
                : s === 'medium'
                    ? CHANNELS.medium
                    : CHANNELS.default;

    const registerDevice = async () => {
        if (!Device.isDevice) {
            console.warn('[push] physical device required');
            return null;
        }
        try {
            const userSession = await retrieveUserSession();
            if (!userSession?.id) {
                console.error('[push] No user session found. Cannot register push token.');
                setRegistrationStatus('failed');
                return null;
            }

            setId(userSession.id);

            const expoTok = await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig?.extra?.eas?.projectId,
            });
            setExpoPushToken(expoTok.data);

            const platformTok = await Notifications.getDevicePushTokenAsync();
            if (Platform.OS === 'android' && platformTok.type === 'android') {
                setFcmToken((platformTok as any).data);
            }

            const response = await registerPushToken({
                userId: userSession.id,
                token: expoTok.data,
                deviceType: Platform.OS,
                fcmToken: Platform.OS === 'android' ? (platformTok as any).data : undefined,
            });

            if (response?.httpStatus === 'OK') {
                setRegistrationStatus('registered');
                console.log('[push] device registered for user:', userSession.id);
            } else {
                setRegistrationStatus('failed');
                console.warn('[push] backend registration failed:', response);
            }
            return expoTok.data;
        } catch (err) {
            console.error('[push] register error:', err);
            setRegistrationStatus('failed');
            return null;
        }
    };

    // ==================== HELPER FUNCTIONS ====================

    // ✅ Helper 1: Send notifications to a group of members
    const sendNotificationsToMembers = async (
        members: any[],
        incident: any,
        roleType: string
    ) => {
        let sentCount = 0, failedCount = 0, skippedCount = 0;
        const results: any[] = [];

        // ✅ Deduplicate by email - send ONE email per unique email address
        const uniqueEmails = new Set<string>();

        for (const member of members) {
            // ✅ SEND EMAIL FIRST - Only once per unique email
            if (!uniqueEmails.has(member.email)) {
                uniqueEmails.add(member.email);

                try {
                    await sendIncidentAlertEmail({
                        to: member.email,
                        incidentId: incident.id,
                        title: incident.title,
                        description: incident.description,
                        severity: incident.severity,
                        reportedBy: incident.reportedBy || 'System',
                        timestamp: new Date().toISOString(),
                        role: roleType
                    });
                    console.log(`[email] ✅ Incident alert email sent to:`, member.email, `(${roleType})`);
                } catch (emailError) {
                    console.error(`[email] ❌ Email failed for:`, member.email, emailError);
                }
            }

            // Then send push notification (one per device/token)
            if (!member.pushToken) {
                skippedCount++;
                results.push({
                    userId: member.userId,
                    fullname: member.fullname,
                    email: member.email,
                    role: roleType,
                    status: 'skipped',
                    reason: 'No push token'
                });
                continue;
            }

            try {
                const message = {
                    to: member.pushToken,
                    sound: 'default',
                    title: `[${roleType.toUpperCase()}] ${incident.severity.toUpperCase()}: ${incident.title}`,
                    body: incident.description,
                    data: {
                        incidentId: incident.id,
                        severity: incident.severity,
                        type: 'incident_alert',
                        role: roleType
                    },
                    channelId: getChannelBySeverity(incident.severity),
                    categoryId: 'incident-actions',
                    priority: incident.severity === 'critical' ? 'high' : 'default',
                };

                const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(message),
                });

                if (pushResponse.ok) {
                    sentCount++;
                    results.push({
                        userId: member.userId,
                        fullname: member.fullname,
                        email: member.email,
                        role: roleType,
                        status: 'sent',
                        pushToken: member.pushToken
                    });
                } else {
                    failedCount++;
                    const errorText = await pushResponse.text();
                    results.push({
                        userId: member.userId,
                        fullname: member.fullname,
                        email: member.email,
                        role: roleType,
                        status: 'failed',
                        error: errorText
                    });
                }
            } catch (err) {
                failedCount++;
                results.push({
                    userId: member.userId,
                    fullname: member.fullname,
                    email: member.email,
                    role: roleType,
                    status: 'failed',
                    error: String(err)
                });
            }
        }

        console.log(`[push] ${roleType.toUpperCase()}: Sent: ${sentCount}, Failed: ${failedCount}, Skipped: ${skippedCount}`);
        return { sent: sentCount, failed: failedCount, skipped: skippedCount, results };
    };

    // ✅ Helper 2: Wait for acknowledgment
    const waitForAcknowledgment = async (incidentId: string, timeoutMs: number): Promise<boolean> => {
        return new Promise((resolve) => {
            const startTime = Date.now();

            const checkInterval = setInterval(async () => {
                try {
                    const response = await fetch(`${BASE_URL_DEV}/api/incidents/${incidentId}`);
                    const data = await response.json();

                    if (data.data?.status === 'investigating' || data.data?.status === 'resolved') {
                        clearInterval(checkInterval);
                        console.log('[push] ✅ Incident acknowledged, stopping escalation');
                        resolve(true);
                        return;
                    }

                    if (Date.now() - startTime >= timeoutMs) {
                        clearInterval(checkInterval);
                        console.log('[push] ⏰ Timeout reached, escalating...');
                        resolve(false);
                    }
                } catch (error) {
                    console.error('[push] Error checking acknowledgment:', error);
                }
            }, 3000);
        });
    };

    // ✅ Helper 3: Create audit log
    const createNotificationAuditLog = async (
        incident: any,
        userId: string,
        sentCount: number,
        failedCount: number,
        skippedCount: number,
        results: any[],
        isEmergency: boolean
    ) => {
        const totalTargeted = results.length;
        const notificationMode = isEmergency ? 'Emergency Override' : 'Escalation-Based Rotation';

        const auditPayload = {
            action: "SEND_PUSH_NOTIFICATION",
            incidentId: incident.id,
            userId: userId,
            description: isEmergency
                ? `Push notifications sent via Emergency Override to ${totalTargeted} selected users (${sentCount} sent, ${failedCount} failed, ${skippedCount} skipped)`
                : `Push notifications sent via Escalation (${totalTargeted} users: ${sentCount} sent, ${failedCount} failed, ${skippedCount} skipped)`,
            details: {
                incidentTitle: incident.title,
                severity: incident.severity,
                notificationMode: notificationMode,
                teamId: incident.teamId || 'global',
                emergencyOverride: isEmergency,
                targetedUsers: totalTargeted,
                sentCount: sentCount,
                failedCount: failedCount,
                skippedCount: skippedCount,
                recipients: results.map(r => ({
                    userId: r.userId,
                    fullname: r.fullname,
                    email: r.email,
                    role: r.role,
                    status: r.status
                }))
            },
            metadata: {
                device: Platform.OS,
                timestamp: new Date().toISOString(),
                notificationType: 'push',
                channelId: getChannelBySeverity(incident.severity),
            }
        };

        try {
            const auditResponse = await createAuditLog(auditPayload);
            console.log("✅ Notification audit log created:", auditResponse);
        } catch (auditError: any) {
            console.error("⚠️ Failed to create notification audit log:", auditError);
        }
    };

    // ==================== MAIN FUNCTIONS ====================

    // ✅ Main: Escalation-based notification (Primary → Backup → Escalation)
    const sendNotificationToOnCallTeam = async (
        incident: {
            id: string;
            title: string;
            description: string;
            severity: 'low' | 'medium' | 'high' | 'critical';
            teamId?: string | null;
            emergencyOverride?: { enabled: boolean; userEmails?: string[] };
        },
        currentUserId?: string | null
    ) => {
        try {
            const userId = currentUserId || id;

            if (!userId) {
                console.error('[push] ❌ Cannot create audit log: User session not loaded');
            }

            console.log('[push] Preparing to send notifications for incident:', incident.title);

            const emergency = incident.emergencyOverride;
            const isEmergency =
                !!emergency &&
                emergency.enabled === true &&
                Array.isArray(emergency.userEmails) &&
                emergency.userEmails.length > 0;

            let primaryMembers: any[] = [];
            let backupMembers: any[] = [];
            let escalationMembers: any[] = [];
            let allMembersToNotify: any[] = [];

            // Handle emergency override
            if (isEmergency && emergency.userEmails) {
                console.log('[push] Emergency override active:', emergency.userEmails);
                const response = await getUsersForEmergencyOverride(emergency.userEmails);
                if (response.httpStatus === 'OK' && response.data) {
                    allMembersToNotify = response.data;
                }
            } else {
                console.log('[push] Using escalation-based on-call rotation');
                const response = await getAllCurrentOnCall();

                console.log('[push] API Response:', response);

                if (response.httpStatus === 'OK' && response.data) {
                    // ✅ Data is now { primary: [], backup: [], escalation: [] }
                    primaryMembers = response.data.primary || [];
                    backupMembers = response.data.backup || [];
                    escalationMembers = response.data.escalation || [];

                    console.log('[push] Primary:', primaryMembers.length, 'Backup:', backupMembers.length, 'Escalation:', escalationMembers.length);
                }
            }

            // Emergency: Send all at once
            if (isEmergency) {
                const result = await sendNotificationsToMembers(allMembersToNotify, incident, 'emergency');

                if (userId && incident.id) {
                    await createNotificationAuditLog(
                        incident, userId, result.sent, result.failed,
                        result.skipped, result.results || [], isEmergency
                    );
                }

                return result;
            }

            // Normal: Escalate Primary → Backup → Escalation
            let totalSent = 0, totalFailed = 0, totalSkipped = 0;
            let allResults: any[] = [];

            // Step 1: Send to Primary
            if (primaryMembers.length > 0) {
                console.log('[push] 📍 Step 1: Notifying PRIMARY members...');
                const primaryResult = await sendNotificationsToMembers(primaryMembers, incident, 'primary');
                totalSent += primaryResult.sent;
                totalFailed += primaryResult.failed;
                totalSkipped += primaryResult.skipped;
                allResults.push(...(primaryResult.results || []));

                console.log('[push] ⏳ Waiting 30 seconds for primary response...');
                const hasAck = await waitForAcknowledgment(incident.id, 30000);

                if (!hasAck && backupMembers.length > 0) {
                    // Step 2: Backup
                    console.log('[push] 📍 Step 2: No response, escalating to BACKUP...');
                    const backupResult = await sendNotificationsToMembers(backupMembers, incident, 'backup');
                    totalSent += backupResult.sent;
                    totalFailed += backupResult.failed;
                    totalSkipped += backupResult.skipped;
                    allResults.push(...(backupResult.results || []));

                    const backupAck = await waitForAcknowledgment(incident.id, 30000);

                    if (!backupAck && escalationMembers.length > 0) {
                        // Step 3: Escalation
                        console.log('[push] 📍 Step 3: Final escalation...');
                        const escResult = await sendNotificationsToMembers(escalationMembers, incident, 'escalation');
                        totalSent += escResult.sent;
                        totalFailed += escResult.failed;
                        totalSkipped += escResult.skipped;
                        allResults.push(...(escResult.results || []));
                    }
                }
            } else {
                console.warn('[push] No primary members found');
            }

            // Create audit log
            if (userId && incident.id) {
                await createNotificationAuditLog(
                    incident, userId, totalSent, totalFailed,
                    totalSkipped, allResults, isEmergency
                );
            }

            return { sent: totalSent, failed: totalFailed, skipped: totalSkipped };
        } catch (err) {
            console.error('[push] Error sending notifications:', err);
            return { sent: 0, failed: 0, skipped: 0 };
        }
    };

    // ✅ Send status change notification to team
    const sendStatusChangeNotification = async (incident: {
        id: string;
        title: string;
        status: 'investigating' | 'resolved';
        resolvedBy?: string;
        investigatedBy?: string;
        excludeUserId?: string;
        teamId?: string | null;
    }) => {
        try {
            console.log('[push] Sending status change notification:', incident.status);

            const session = await retrieveUserSession();
            let membersToNotify: any[] = [];

            const response = await getAllCurrentOnCall();

            if (response.httpStatus === 'OK' && response.data) {
                // ✅ Combine all roles from new format
                membersToNotify = [
                    ...(response.data.primary || []),
                    ...(response.data.backup || []),
                    ...(response.data.escalation || [])
                ];
            }

            if (!membersToNotify.length) {
                console.warn('[push] No team members found to notify');
                return;
            }

            const statusMessage = incident.status === 'resolved'
                ? `✅ "${incident.title}" has been resolved${incident.resolvedBy ? ` by ${incident.resolvedBy}` : ''}.`
                : `🔍 "${incident.title}" is now being investigated${incident.investigatedBy ? ` by ${incident.investigatedBy}` : ''}.`;

            let sentCount = 0;
            let skippedCount = 0;

            for (const member of membersToNotify) {
                if (member.userId === incident.excludeUserId) {
                    if (session?.id === member.userId) {
                        await clearStoredNotifications(incident.id);
                    }
                    skippedCount++;
                    continue;
                }

                if (!member.pushToken) {
                    skippedCount++;
                    continue;
                }

                try {
                    const message = {
                        to: member.pushToken,
                        sound: 'default',
                        title: incident.status === 'resolved'
                            ? '✅ Incident Resolved'
                            : '🔍 Incident Under Investigation',
                        body: statusMessage,
                        data: {
                            incidentId: incident.id,
                            status: incident.status,
                            type: 'status_change'
                        },
                        badge: 0,
                        priority: 'default',
                    };

                    const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(message),
                    });

                    if (pushResponse.ok) {
                        sentCount++;
                    }

                    if (session?.id === member.userId) {
                        await clearStoredNotifications(incident.id);
                    }
                } catch (err) {
                    console.error('[push] Error sending to:', member.email, err);
                }
            }

            console.log(`[push] Status notifications: Sent ${sentCount}, Skipped ${skippedCount}`);
        } catch (error) {
            console.error('[push] Error sending status change notification:', error);
        }
    };

    // ✅ Auto-reminder system - sends reminders every 10 seconds, max 3 times
    const scheduleAutoReminder = async (incident: {
        id: string;
        title: string;
        description: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        teamId?: string | null;
        maxReminders?: number; // Default 3
        delaySeconds?: number; // Default 10 seconds
    }) => {
        try {
            const maxReminders = incident.maxReminders || 3;
            const delaySeconds = incident.delaySeconds || 10;
            const delayMilliseconds = delaySeconds * 1000;

            console.log(`[push] Scheduling ${maxReminders} auto-reminders for incident ${incident.id} every ${delaySeconds} seconds`);

            // Schedule multiple reminders
            for (let i = 1; i <= maxReminders; i++) {
                const delay = delayMilliseconds * i;

                setTimeout(async () => {
                    await checkAndSendReminder(incident, i, maxReminders);
                }, delay);
            }

            return {
                success: true,
                totalReminders: maxReminders,
                intervalSeconds: delaySeconds,
                firstReminderAt: new Date(Date.now() + delayMilliseconds)
            };
        } catch (error) {
            console.error('[push] Error scheduling auto-reminders:', error);
            return { success: false, error };
        }
    };

    // ✅ Check incident status and send reminder if still open
    const checkAndSendReminder = async (
        incident: {
            id: string;
            title: string;
            description: string;
            severity: 'low' | 'medium' | 'high' | 'critical';
            teamId?: string | null;
        },
        reminderNumber: number,
        totalReminders: number
    ) => {
        try {
            console.log(`[push] Checking incident status for reminder #${reminderNumber}/${totalReminders}:`, incident.id);

            // Fetch current incident status
            const incidentResponse = await getIncidentById(incident.id);

            if (incidentResponse.httpStatus !== 'OK' || !incidentResponse.data) {
                console.log('[push] Failed to fetch incident, skipping reminder');
                return;
            }

            const currentIncident = incidentResponse.data;

            // Only send reminder if incident is still open
            if (currentIncident.status !== 'open') {
                console.log('[push] Incident no longer open, stopping reminders. Current status:', currentIncident.status);
                await clearStoredNotifications(incident.id);
                return;
            }

            // ✅ Dismiss previous reminders before sending new one
            if (reminderNumber > 1) {
                console.log(`[push] Dismissing previous reminders for incident:`, incident.id);
                await clearStoredNotifications(incident.id);
            }

            console.log(`[push] Incident still open, sending reminder #${reminderNumber}/${totalReminders}`);

            // Get team members to remind
            let membersToNotify: any[] = [];

            const response = await getAllCurrentOnCall(incident.teamId);

            if (response.httpStatus === 'OK' && response.data) {
                // ✅ Handle the {primary: [], backup: [], escalation: []} format
                membersToNotify = [
                    ...(response.data.primary || []),
                    ...(response.data.backup || []),
                    ...(response.data.escalation || [])
                ];
            }

            if (!membersToNotify.length) {
                console.warn('[push] No team members found to remind');
                return;
            }

            let sentCount = 0;
            let skippedCount = 0;
            const uniqueEmails = new Set<string>();

            for (const member of membersToNotify) {
                // ✅ Send email once per unique email
                if (!uniqueEmails.has(member.email)) {
                    uniqueEmails.add(member.email);

                    try {
                        await sendReminderEmail({
                            to: member.email,
                            incidentId: incident.id,
                            title: incident.title,
                            description: incident.description,
                            severity: incident.severity,
                            reminderNumber: reminderNumber,
                            totalReminders: totalReminders
                        });
                        console.log(`[email] ✅ Reminder email sent to:`, member.email);
                    } catch (emailError) {
                        console.error(`[email] ❌ Email failed for:`, member.email, emailError);
                    }
                }

                if (!member.pushToken) {
                    skippedCount++;
                    continue;
                }

                try {
                    // ✅ ADD ROLE TO REMINDER NOTIFICATION TITLE
                    const message = {
                        to: member.pushToken,
                        sound: 'default',
                        title: `[${member.role?.toUpperCase() || 'TEAM'}] ⏰ REMINDER #${reminderNumber}/${totalReminders}: ${incident.severity.toUpperCase()} - ${incident.title}`,
                        body: `This incident still requires attention. ${incident.description}`,
                        data: {
                            incidentId: incident.id,
                            severity: incident.severity,
                            type: 'auto_reminder',
                            reminderNumber: reminderNumber,
                            totalReminders: totalReminders,
                            role: member.role // ✅ ADD ROLE TO DATA
                        },
                        channelId: getChannelBySeverity(incident.severity),
                        categoryId: 'incident-actions',
                        priority: incident.severity === 'critical' ? 'high' : 'default',
                        badge: reminderNumber,
                    };

                    const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(message),
                    });

                    if (pushResponse.ok) {
                        sentCount++;
                        console.log(`[push] Reminder #${reminderNumber} sent to:`, member.email, `(${member.role})`);
                    } else {
                        console.warn(`[push] Failed to send reminder #${reminderNumber} to:`, member.email);
                    }

                } catch (err) {
                    console.error(`[push] Error sending reminder #${reminderNumber} to:`, member.email, err);
                }
            }

            console.log(`[push] Auto-reminder #${reminderNumber}/${totalReminders} sent: ${sentCount} notifications, ${skippedCount} skipped`);

            // 🔔 Create audit log for auto-reminder
            const session = await retrieveUserSession();
            if (session?.id && incident.id) {
                const auditPayload = {
                    action: "AUTO_REMINDER_SENT",
                    incidentId: incident.id,
                    userId: session.id,
                    description: `Automatic reminder #${reminderNumber}/${totalReminders} sent to ${sentCount} team member(s) - incident still open`,
                    details: {
                        incidentTitle: incident.title,
                        severity: incident.severity,
                        currentStatus: currentIncident.status,
                        reminderNumber: reminderNumber,
                        totalReminders: totalReminders,
                        targetedUsers: membersToNotify.length,
                        sentCount: sentCount,
                        skippedCount: skippedCount,
                        reminderTrigger: `auto_10sec_${reminderNumber}`
                    },
                    metadata: {
                        device: Platform.OS,
                        timestamp: new Date().toISOString(),
                        notificationType: 'auto_reminder'
                    }
                };

                try {
                    await createAuditLog(auditPayload);
                    console.log(`✅ Auto-reminder #${reminderNumber} audit log created`);
                } catch (auditError) {
                    console.error(`⚠️ Failed to create auto-reminder #${reminderNumber} audit log:`, auditError);
                }
            }

            // ✅ CHECK IF THIS IS THE FINAL REMINDER - TRIGGER ESCALATION
            if (reminderNumber === totalReminders) {
                console.log(`[push] 🏁 Final reminder (#${reminderNumber}) sent for incident ${incident.id}`);

                // Check one more time if still open before escalating
                const finalCheck = await getIncidentById(incident.id);
                if (finalCheck.httpStatus === 'OK' && finalCheck.data?.status === 'open') {
                    console.log('[push] 🚨 Incident still open after all reminders - triggering escalation');

                    // ✅ Trigger automatic escalation
                    await triggerAutoEscalation(incident);
                } else {
                    console.log('[push] ✅ Incident resolved during reminder cycle - no escalation needed');
                }
            }

            return { sent: sentCount, skipped: skippedCount };
        } catch (error) {
            console.error(`[push] Error in checkAndSendReminder #${reminderNumber}:`, error);
            return { sent: 0, skipped: 0 };
        }
    };

    // ✅ Trigger automatic escalation after all reminders exhausted
    const triggerAutoEscalation = async (incident: {
        id: string;
        title: string;
        description: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        teamId?: string | null;
    }) => {
        try {
            console.log('[push] 🚨 Triggering auto-escalation for incident:', incident.id);

            const session = await retrieveUserSession();
            if (!session?.id) {
                console.error('[push] Cannot escalate - no user session');
                return;
            }

            const teamId = incident.teamId || 'team-1'; // Default team if none specified

            // ✅ Use the oncallController.escalateIncident method
            const escalateResult = await oncallController.escalateIncident({
                teamId: teamId,
                incidentId: incident.id,
                reason: 'Auto-escalation: No response after 3 reminders (30 seconds)',
                priority: incident.severity,
                currentLevel: 0
            });

            if (escalateResult && escalateResult.success !== false) {
                console.log('[push] ✅ Auto-escalation successful');

                // Send escalation notifications
                const escalatedUsers = escalateResult.object?.notifiedUsers ||
                    escalateResult.notifiedUsers ||
                    [];

                if (escalatedUsers.length > 0) {
                    await sendEscalationNotifications(incident, escalatedUsers);
                }

                // Create audit log
                const auditPayload = {
                    action: "AUTO_ESCALATION_TRIGGERED",
                    incidentId: incident.id,
                    userId: session.id,
                    description: `Incident auto-escalated after 3 unanswered reminders (30 seconds)`,
                    details: {
                        incidentTitle: incident.title,
                        severity: incident.severity,
                        fromLevel: 0,
                        toLevel: escalateResult.object?.escalatedToLevel || 1,
                        notifiedCount: escalatedUsers.length,
                        reason: 'No response after 3 reminders',
                        teamId: teamId
                    },
                    metadata: {
                        device: Platform.OS,
                        timestamp: new Date().toISOString(),
                        triggerType: 'auto_escalation'
                    }
                };

                await createAuditLog(auditPayload);
                console.log('✅ Auto-escalation audit log created');

            } else {
                console.error('[push] ❌ Auto-escalation failed:', escalateResult);
            }

        } catch (error) {
            console.error('[push] Error triggering auto-escalation:', error);
        }
    };

    // ✅ Send escalation notifications to escalated users
    const sendEscalationNotifications = async (
        incident: {
            id: string;
            title: string;
            description: string;
            severity: 'low' | 'medium' | 'high' | 'critical';
        },
        escalatedUsers: any[]
    ) => {
        try {
            console.log('[push] Sending escalation notifications to', escalatedUsers.length, 'users');

            let sentCount = 0;
            const uniqueEmails = new Set<string>();

            for (const user of escalatedUsers) {
                // ✅ Send email once per unique email
                if (!uniqueEmails.has(user.email)) {
                    uniqueEmails.add(user.email);

                    try {
                        await sendEscalationEmail({
                            to: user.email,
                            incidentId: incident.id,
                            title: incident.title,
                            description: incident.description,
                            severity: incident.severity,
                            escalatedFrom: 0,
                            escalatedTo: 1,
                            reason: 'No response after 3 reminders'
                        });
                        console.log(`[email] ✅ Escalation email sent to:`, user.email);
                    } catch (emailError) {
                        console.error(`[email] ❌ Escalation email failed for:`, user.email, emailError);
                    }
                }

                if (!user.pushToken) {
                    console.warn('[push] No push token for user:', user.email);
                    continue;
                }

                try {
                    const message = {
                        to: user.pushToken,
                        sound: 'default',
                        title: `[ESCALATION] 🚨 ESCALATED: ${incident.severity.toUpperCase()} - ${incident.title}`,
                        body: `This incident has been escalated to you after no response. ${incident.description}`,
                        data: {
                            incidentId: incident.id,
                            severity: incident.severity,
                            type: 'escalation',
                            role: 'escalation' // ✅ ADD ROLE TO DATA
                        },
                        channelId: getChannelBySeverity(incident.severity),
                        categoryId: 'incident-actions',
                        priority: 'high',
                        badge: 1,
                    };

                    const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(message),
                    });

                    if (pushResponse.ok) {
                        sentCount++;
                        console.log('[push] Escalation notification sent to:', user.email);
                    } else {
                        console.warn('[push] Failed to send escalation to:', user.email);
                    }
                } catch (err) {
                    console.error('[push] Error sending escalation to:', user.email, err);
                }
            }

            console.log(`[push] ✅ Escalation notifications sent: ${sentCount}/${escalatedUsers.length}`);
        } catch (error) {
            console.error('[push] Error sending escalation notifications:', error);
        }
    };

    const clearIncidentNotifications = async (incidentId: string) => {
        await Notifications.dismissNotificationAsync(`incident-${incidentId}`);
        await Notifications.dismissNotificationAsync(`incident-${incidentId}-reminder`);
    };

    const getNotificationSettings = async () => {
        if (Platform.OS !== 'android') return null;
        const ids = Object.values(CHANNELS);
        return Promise.all(ids.map((id) => Notifications.getNotificationChannelAsync(id)));
    };

    return {
        expoPushToken,
        fcmToken,
        permissionStatus,
        registrationStatus,
        id,
        registerDevice,
        sendNotificationToOnCallTeam,
        sendStatusChangeNotification,
        scheduleAutoReminder,
        triggerAutoEscalation,
        clearIncidentNotifications,
        getNotificationSettings,
    };
};