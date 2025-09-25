// hooks/usePushNotifications.ts
import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from "react-native";
import { registerPushToken } from '@/api/alert-controller';

export const usePushNotifications = () => {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
    const [registrationStatus, setRegistrationStatus] = useState<'pending' | 'registered' | 'failed'>('pending');

    useEffect(() => {
        setupNotifications();
    }, []);

    const setupNotifications = async () => {
        try {
            await Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowBanner: true,
                    shouldShowList: true,
                    shouldPlaySound: true,
                    shouldSetBadge: true,
                }),
            });

            const { status } = await Notifications.requestPermissionsAsync();
            setPermissionStatus(status);

            if (status === 'granted') {
                await registerDevice();
            }

            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'Default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }
        } catch (error) {
            console.error('Error setting up notifications:', error);
            setRegistrationStatus('failed');
        }
    };

    const registerDevice = async () => {
        if (!Device.isDevice) {
            console.warn('Must use physical device for push notifications');
            return null;
        }

        try {
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig?.extra?.eas?.projectId,
            });

            const token = tokenData.data;
            setExpoPushToken(token);
            console.log('Expo Push Token:', token.substring(0, 30) + '...');

            const response = await registerPushToken({
                token,
                deviceType: Platform.OS,
                settings: {
                    enableAlerts: true,
                    criticalOnly: false,
                    soundEnabled: true,
                    vibrationEnabled: true
                }
            });

            if (response.httpStatus === 'OK') {
                setRegistrationStatus('registered');
                console.log('Device registered successfully');
            } else {
                setRegistrationStatus('failed');
            }

            return token;
        } catch (error) {
            console.error('Error registering device:', error);
            setRegistrationStatus('failed');
            return null;
        }
    };

    return {
        expoPushToken,
        permissionStatus,
        registrationStatus,
        registerDevice
    };
};