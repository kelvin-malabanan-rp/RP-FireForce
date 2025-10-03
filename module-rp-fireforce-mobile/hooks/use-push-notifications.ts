// hooks/usePushNotifications.ts
import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { registerPushToken, respondToIncident} from '@/api/alert-controller';
import { router } from "expo-router";
import { retrieveUserSession } from "@/constants/local-storage";
import {getAllCurrentOnCall} from "@/api/oncall-schedule-controller";

export const usePushNotifications = () => {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
    const [registrationStatus, setRegistrationStatus] = useState<'pending' | 'registered' | 'failed'>('pending');
    const [id, setId] = useState<string | null>(null);

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
        const sub = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data as any;
            console.log('usePushNotification data:', data);
            if (data?.data?.incidentId) {
                router.push({
                    pathname: "/inner-incident-page",
                    params: { incidentId: data.data.incidentId }
                });
            }
        });

        return () => sub.remove();
    }, []);

    // ► response listener for action buttons
    useEffect(() => {
        const sub = Notifications.addNotificationResponseReceivedListener((response) => {
            const { actionIdentifier } = response;
            const data = response.notification.request.content.data as
                | { incidentId?: string }
                | undefined;

            if (!data?.incidentId) return;
            const incidentId = data.incidentId;

            if (actionIdentifier === "ACKNOWLEDGE") {
                console.log("User acknowledged incident", incidentId);
                if (id) {
                    respondToIncident(incidentId, "acknowledge", id);
                } else {
                    console.error('[push] Cannot acknowledge - no id available');
                }
            } else if (actionIdentifier === "DECLINE") {
                console.log("User declined incident", incidentId);
                if (id) {
                    respondToIncident(incidentId, "decline", id);
                } else {
                    console.error('[push] Cannot decline - no id available');
                }
            } else {
                // Default tap → navigate inside app
                if (data.incidentId) {
                    router.push({
                        pathname: "/inner-incident-page",
                        params: { incidentId: data.incidentId }
                    });
                }
            }
        });

        return () => sub.remove();
    }, [id]);

    useEffect(() => {
        console.log('[push] useEffect start');
        setupNotifications();
    }, []);

    // ► register the category (2 buttons)
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
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: true,
                    shouldShowBanner: true,
                    shouldShowList: true,
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
            console.log('[push] permissions:', status);

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
            try { await Notifications.deleteNotificationChannelAsync(id); } catch {}
        }

        await Notifications.setNotificationChannelAsync(CHANNELS.critical, {
            name: 'Critical Alerts',
            importance: Notifications.AndroidImportance.MAX,
            sound: 'alarm_sound',
            enableVibrate: true,
            enableLights: true,
            vibrationPattern: [0,500,200,500,200,500],
        });
        await Notifications.setNotificationChannelAsync(CHANNELS.high, {
            name: 'High Priority',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'alarm_sound',
            enableVibrate: true,
            vibrationPattern: [0,250,250,250],
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
            enableVibrate: true,
        });
    };

    const getChannelBySeverity = (s: string) =>
        s === 'critical' ? CHANNELS.critical :
            s === 'high'     ? CHANNELS.high :
                s === 'medium'   ? CHANNELS.medium :
                    CHANNELS.default;

    const registerDevice = async () => {
        if (!Device.isDevice) {
            console.warn('[push] physical device required');
            return null;
        }

        try {
            // Get user session
            const userSession = await retrieveUserSession();
            if (!userSession || !userSession.id) {
                console.error('[push] No user session found. Cannot register push token.');
                setRegistrationStatus('failed');
                return null;
            }

            setId(userSession.id);

            const expoTok = await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig?.extra?.eas?.projectId,
            });
            setExpoPushToken(expoTok.data);
            console.log('[push] expo token:', expoTok.data?.slice(0, 32) + '...');

            const platformTok = await Notifications.getDevicePushTokenAsync();
            console.log('[push] platform token:', platformTok.type, (platformTok as any).data?.slice?.(0, 32) + '...');
            console.log('[push] Platform.OS:', Platform.OS);
            console.log('[push] platformTok.type:', platformTok.type);

            if (Platform.OS === 'android' && platformTok.type === 'android') {
                console.log('[push] fcm token:', (platformTok as any).data);
                setFcmToken((platformTok as any).data);
            }

            const response = await registerPushToken({
                userId: userSession.id,
                token: expoTok.data,
                deviceType: Platform.OS,
                fcmToken: Platform.OS === 'android' ? (platformTok as any).data : undefined,
                settings: {
                    enableAlerts: true,
                    criticalOnly: false,
                    soundEnabled: true,
                    vibrationEnabled: true,
                    channelPreferences: {
                        critical: CHANNELS.critical,
                        high: CHANNELS.high,
                        medium: CHANNELS.medium,
                        low: CHANNELS.default,
                    },
                },
            });

            if ((response as any).httpStatus === 'OK' || (response as any).success) {
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

    // Send notification to on-call team members with push tokens
    const sendNotificationToOnCallTeam = async (incident: {
        id: string;
        title: string;
        description: string;
        severity: "low" | "medium" | "high" | "critical";
        teamId?: string;
    }) => {
        try {
            console.log('[push] Fetching current on-call assignments');

            // Get current on-call assignments for today
            const response = await getAllCurrentOnCall(incident.teamId);

            if (response.httpStatus !== 'OK' || !response.data || response.data.length === 0) {
                console.error('[push] No on-call assignments found for today');
                return { sent: 0, failed: 0, skipped: 0 };
            }

            let sentCount = 0;
            let failedCount = 0;
            let skippedCount = 0;

            // Loop through each team
            for (const team of response.data) {
                console.log(`[push] Processing team: ${team.teamName}`);

                // Loop through each member
                for (const member of team.members) {
                    // Only send if member has a push token
                    if (member.pushToken) {
                        try {
                            const channelId = getChannelBySeverity(incident.severity);
                            const notificationContent = getNotificationContent(incident);

                            // Build Expo push message
                            const message = {
                                to: member.pushToken,
                                sound: 'default',
                                title: notificationContent.title,
                                body: notificationContent.body,
                                data: {
                                    incidentId: incident.id,
                                    severity: incident.severity
                                },
                                channelId: member.deviceType === 'android' ? channelId : undefined,
                                categoryId: 'incident-actions',
                                priority: incident.severity === 'critical' ? 'high' : 'default',
                            };

                            console.log(`[push] Sending to ${member.fullname} (${member.role})`);

                            // Send via Expo Push Notification service
                            const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(message),
                            });

                            if (pushResponse.ok) {
                                console.log(`[push] ✓ Sent to ${member.fullname} (${member.role})`);
                                sentCount++;
                            } else {
                                const error = await pushResponse.json();
                                console.error(`[push] ✗ Failed to send to ${member.fullname}:`, error);
                                failedCount++;
                            }
                        } catch (error) {
                            console.error(`[push] ✗ Error sending to ${member.fullname}:`, error);
                            failedCount++;
                        }
                    } else {
                        console.log(`[push] ⊘ No token for ${member.fullname} (${member.role}), skipping`);
                        skippedCount++;
                    }
                }
            }

            console.log(`[push] Summary - Sent: ${sentCount}, Failed: ${failedCount}, Skipped: ${skippedCount}`);
            return { sent: sentCount, failed: failedCount, skipped: skippedCount };
        } catch (error) {
            console.error('[push] Error sending to on-call team:', error);
            return { sent: 0, failed: 0, skipped: 0 };
        }
    };

    // Local notification helper
    const sendIncidentNotification = async (incident: any) => {
        const channelId = getChannelBySeverity(incident.severity);
        const notificationContent = getNotificationContent(incident);
        console.log('[push] local notify on', channelId);

        await Notifications.scheduleNotificationAsync({
            content: {
                title: notificationContent.title,
                body: notificationContent.body,
                sound: notificationContent.sound,
                badge: notificationContent.badge ?? 1,
                data: { incidentId: incident.id, severity: incident.severity },
                channelId,
                categoryIdentifier: 'incident-actions',
            },
            trigger: null,
            identifier: `incident-${incident.id}`,
        });

        if (incident.severity === 'critical') {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '⚠️ UNACKNOWLEDGED CRITICAL ALERT',
                    body: `${incident.title} - Immediate action required!`,
                    sound: 'default',
                    badge: 99,
                    data: { incidentId: incident.id, severity: 'critical', isReminder: true },
                    channelId: CHANNELS.critical,
                    categoryIdentifier: 'incident-actions',
                },
                trigger: { seconds: 30, repeats: false } as Notifications.TimeIntervalTriggerInput,
                identifier: `incident-${incident.id}-reminder`,
            });
        }
    };

    const getNotificationContent = (incident: any) => {
        const base = {
            title: `${incident.severity.toUpperCase()}: ${incident.title}`,
            body: incident.description,
            sound: Platform.select({ ios: 'alarm_sound_ios.wav', android: 'alarm_sound' }),
            badge: 1,
        };
        switch (incident.severity) {
            case 'critical': return { ...base, title: `🚨 ${base.title} 🚨`, badge: 99, body: `IMMEDIATE ACTION REQUIRED\n\n${base.body}` };
            case 'high':     return { ...base, title: `⚠️ ${base.title}`, badge: 10, body: `High Priority\n\n${base.body}` };
            case 'medium':   return { ...base, title: `⚡ ${base.title}`, badge: 5 };
            default:         return base;
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
        sendIncidentNotification, // Local notification
        sendNotificationToOnCallTeam, // ← NEW: Send to on-call team with tokens
        clearIncidentNotifications,
        getNotificationSettings,
    };
};