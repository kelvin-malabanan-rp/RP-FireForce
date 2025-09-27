// hooks/usePushNotifications.ts
import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { registerPushToken } from '@/api/alert-controller';

export const usePushNotifications = () => {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [fcmToken, setFcmToken] = useState<string | null>(null); // <-- NEW
    const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
    const [registrationStatus, setRegistrationStatus] =
        useState<'pending' | 'registered' | 'failed'>('pending');

    useEffect(() => {
        console.log('[push] useEffect start');
        setupNotifications();
    }, []);
    
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
                await createNotificationChannels();
                await registerDevice();
            }
        } catch (err) {
            console.error('[push] setup error:', err);
            setRegistrationStatus('failed');
        }
    };

    const CHANNELS = {
        critical: 'critical-alerts-v3',
        high: 'high-priority-v3',
        medium: 'medium-priority-v3',
        default: 'default-v3',
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
            // 1) Expo token (for Expo Push API)
            const expoTok = await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig?.extra?.eas?.projectId,
            });
            setExpoPushToken(expoTok.data);
            console.log('[push] expo token:', expoTok.data?.slice(0, 32) + '...');

            // 2) Platform token (FCM on Android, APNs on iOS)
            const platformTok = await Notifications.getDevicePushTokenAsync();
            console.log(
                '[push] platform token:',
                platformTok.type,
                (platformTok as any).data?.slice?.(0, 32) + '...',
            );

            // Save only if Android/FCM; APNs token is not used by your backend
            if (Platform.OS === 'android' && platformTok.type === 'fcm') {
                setFcmToken((platformTok as any).data);
            }

            // 3) Register with your backend — keep `token` as Expo token for
            //    backward compatibility and send `fcmToken` additionally.
            const response = await registerPushToken({
                token: expoTok.data, // existing field (Expo token)
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

            if ((response as any).httpStatus === 200 || (response as any).success) {
                setRegistrationStatus('registered');
                console.log('[push] device registered');
            } else {
                setRegistrationStatus('failed');
                console.warn('[push] backend registration non-200:', response);
            }

            return expoTok.data;
        } catch (err) {
            console.error('[push] register error:', err);
            setRegistrationStatus('failed');
            return null;
        }
    };

    // Local notification helper (uses channels)
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
                channelId, // Android channel
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
            sound: Platform.select({
                ios: 'alarm_sound_ios.wav',
                android: 'alarm_sound',
            }),
            badge: 1,
        };

        switch (incident.severity) {
            case 'critical':
                return {
                    ...base,
                    title: `🚨 ${base.title} 🚨`,
                    badge: 99,
                    body: `IMMEDIATE ACTION REQUIRED\n\n${base.body}`,
                };
            case 'high':
                return { ...base, title: `⚠️ ${base.title}`, badge: 10, body: `High Priority\n\n${base.body}` };
            case 'medium':
                return { ...base, title: `⚡ ${base.title}`, badge: 5 };
            default:
                return base;
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
        fcmToken, // <-- expose so you can confirm in UI/logs if needed
        permissionStatus,
        registrationStatus,
        registerDevice,
        sendIncidentNotification,
        clearIncidentNotifications,
        getNotificationSettings,
    };
};
