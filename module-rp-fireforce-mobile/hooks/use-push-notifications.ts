// hooks/usePushNotifications.ts
import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { registerPushToken, respondToIncident } from '@/api/alert-controller';
import { router } from 'expo-router';
import { retrieveUserSession } from '@/constants/local-storage';
import { getAllCurrentOnCall, getUsersForEmergencyOverride } from '@/api/oncall-schedule-controller';

export const usePushNotifications = () => {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
    const [registrationStatus, setRegistrationStatus] = useState<'pending' | 'registered' | 'failed'>('pending');
    const [id, setId] = useState<string | null>(null);

    // ──────────────────────────────────────────────
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

    // ──────────────────────────────────────────────
    // Navigation on notification tap (basic)
    useEffect(() => {
        const sub = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data as any;
            if (data?.incidentId) {
                router.push({
                    pathname: '/inner-incident-page',
                    params: { incidentId: data.incidentId },
                });
            }
        });
        return () => sub.remove();
    }, []);

    // ──────────────────────────────────────────────
    // Unified listener for both action buttons and default taps
    useEffect(() => {
        const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
            const { actionIdentifier } = response;
            const data = response.notification.request.content.data as any;
            const incidentId = data?.incidentId || data?.data?.incidentId;

            if (!incidentId) {
                console.error('[push] No incident ID in notification data');
                return;
            }

            console.log('[push] Notification response:', actionIdentifier, data);

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
                    await Notifications.dismissNotificationAsync(`incident-${incidentId}`);
                    await Notifications.dismissNotificationAsync(`incident-${incidentId}-reminder`);
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
                    await Notifications.dismissNotificationAsync(`incident-${incidentId}`);
                    await Notifications.dismissNotificationAsync(`incident-${incidentId}-reminder`);
                } catch (error) {
                    console.error('[push] Error declining:', error);
                }
            } else {
                // Default tap (no action button)
                router.push({
                    pathname: '/inner-incident-page',
                    params: { incidentId },
                });
            }
        });

        return () => sub.remove();
    }, []); // No dependencies needed

    // ──────────────────────────────────────────────
    useEffect(() => {
        console.log('[push] useEffect start');
        setupNotifications();
    }, []);

    // ──────────────────────────────────────────────
    // Register action categories
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

    // ──────────────────────────────────────────────
    const setupNotifications = async () => {
        try {
            await Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: true,
                }),
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

    // ──────────────────────────────────────────────
    // Notification channels
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
        await Notifications.setNotificationChannelAsync(CHANNELS.critical, {
            name: 'Critical Alerts',
            importance: Notifications.AndroidImportance.MAX,
            sound: 'alarm_sound',
            enableVibrate: true,
            vibrationPattern: [0, 500, 200, 500, 200, 500],
        });
        await Notifications.setNotificationChannelAsync(CHANNELS.high, {
            name: 'High Priority',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'alarm_sound',
            enableVibrate: true,
            vibrationPattern: [0, 250, 250, 250],
        });
        await Notifications.setNotificationChannelAsync(CHANNELS.medium, {
            name: 'Medium Priority',
            importance: Notifications.AndroidImportance.DEFAULT,
            sound: 'alarm_sound',
            enableVibrate: true,
        });
        await Notifications.setNotificationChannelAsync(CHANNELS.default, {
            name: 'Default',
            importance: Notifications.AndroidImportance.DEFAULT,
            sound: 'alarm_sound',
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

    // ──────────────────────────────────────────────
    // Device registration
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

            if (response?.httpStatus === 'OK' || response?.success) {
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

    // ──────────────────────────────────────────────
    // ✅ Corrected: Normal rotation + emergency override logic
    const sendNotificationToOnCallTeam = async (incident: {
        id: string;
        title: string;
        description: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        teamId?: string;
        emergencyOverride?: { enabled: boolean; userEmails?: string[] };
    }) => {
        try {
            console.log('[push] Preparing to send notifications for incident:', incident.title);

            // Determine notification mode
            const isEmergency =
                incident.emergencyOverride?.enabled === true &&
                Array.isArray(incident.emergencyOverride.userEmails) &&
                incident.emergencyOverride.userEmails.length > 0;

            let membersToNotify: any[] = [];

            if (isEmergency) {
                console.log('[push] Emergency override active:', incident.emergencyOverride.userEmails);
                const response = await getUsersForEmergencyOverride(incident.emergencyOverride.userEmails!);
                if (response.httpStatus === 'OK' && response.data) {
                    membersToNotify = response.data;
                } else {
                    console.error('[push] Failed to load emergency override users');
                }
            } else if (incident.teamId) {
                console.log('[push] Using normal on-call rotation');
                const response = await getAllCurrentOnCall(incident.teamId);
                if (response.httpStatus === 'OK' && response.data) {
                    response.data.forEach((team: any) => {
                        membersToNotify.push(...team.members);
                    });
                } else {
                    console.error('[push] No on-call assignments found for today');
                }
            } else {
                console.warn('[push] No teamId provided, fallback to global rotation');
                const response = await getAllCurrentOnCall();
                if (response.httpStatus === 'OK' && response.data) {
                    response.data.forEach((team: any) => {
                        membersToNotify.push(...team.members);
                    });
                }
            }

            if (!membersToNotify.length) {
                console.warn('[push] No users found to notify');
                return { sent: 0, failed: 0, skipped: 0 };
            }

            let sentCount = 0,
                failedCount = 0,
                skippedCount = 0;

            for (const member of membersToNotify) {
                if (!member.pushToken) {
                    skippedCount++;
                    continue;
                }
                try {
                    const message = {
                        to: member.pushToken,
                        sound: 'default',
                        title: `${incident.severity.toUpperCase()}: ${incident.title}`,
                        body: incident.description,
                        data: { incidentId: incident.id, severity: incident.severity },
                        channelId: getChannelBySeverity(incident.severity),
                        categoryId: 'incident-actions',
                        priority: incident.severity === 'critical' ? 'high' : 'default',
                    };

                    const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(message),
                    });

                    if (pushResponse.ok) sentCount++;
                    else failedCount++;
                } catch (err) {
                    failedCount++;
                }
            }

            console.log(`[push] Sent: ${sentCount}, Failed: ${failedCount}, Skipped: ${skippedCount}`);
            return { sent: sentCount, failed: failedCount, skipped: skippedCount };
        } catch (err) {
            console.error('[push] Error sending notifications:', err);
            return { sent: 0, failed: 0, skipped: 0 };
        }
    };

    // ──────────────────────────────────────────────
    // Local notification helper
    const sendIncidentNotification = async (incident: any) => {
        const channelId = getChannelBySeverity(incident.severity);
        const content = {
            title: `${incident.severity.toUpperCase()}: ${incident.title}`,
            body: incident.description,
            sound: 'default',
            badge: 1,
        };
        await Notifications.scheduleNotificationAsync({
            content,
            trigger: null,
            identifier: `incident-${incident.id}`,
        });
    };

    // ──────────────────────────────────────────────
    const clearIncidentNotifications = async (incidentId: string) => {
        await Notifications.dismissNotificationAsync(`incident-${incidentId}`);
        await Notifications.dismissNotificationAsync(`incident-${incidentId}-reminder`);
    };

    const getNotificationSettings = async () => {
        if (Platform.OS !== 'android') return null;
        const ids = Object.values(CHANNELS);
        return Promise.all(ids.map((id) => Notifications.getNotificationChannelAsync(id)));
    };

    // ──────────────────────────────────────────────
    return {
        expoPushToken,
        fcmToken,
        permissionStatus,
        registrationStatus,
        id,
        registerDevice,
        sendIncidentNotification,
        sendNotificationToOnCallTeam,
        clearIncidentNotifications,
        getNotificationSettings,
    };
};
