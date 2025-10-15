import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    Alert,
    Platform,
    Modal,
    ScrollView,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import {checkAlertSystemHealth, registerPushToken} from '@/api/alert-controller';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { AlertSettings } from '@/types';
import {
    retrieveAlertSettings,
    retrievePushToken,
    retrieveRegistrationStatus,
    storeAlertSettings,
    storePushToken,
    storeRegistrationStatus,
    retrieveUserSession
} from "@/constants/local-storage";
import { FONT_FAMILY } from '@/constants/fonts';
import {Ionicons} from "@expo/vector-icons";
import {LinearGradient} from "expo-linear-gradient";

interface AlertManagerProps {
    style?: any;
}

const AlertManager: React.FC<AlertManagerProps> = ({ style }) => {
    const [settings, setSettings] = useState<AlertSettings>({
        enableAlerts: true,
        criticalOnly: false,
        soundEnabled: true,
        vibrationEnabled: true,
        reminderConfig: {
            enabled: true,
            maxReminders: 3,
            intervalSeconds: 10
        }
    });
    const [showSettings, setShowSettings] = useState(false);
    const [pushToken, setPushToken] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
    const [backendStatus, setBackendStatus] = useState<string>('checking');
    const [registrationStatus, setRegistrationStatus] = useState<string>('pending');

    useEffect(() => {
        loadPersistedData();
        checkBackendHealth();
    }, []);

    const loadPersistedData = async () => {
        try {
            // Load saved settings FIRST
            const savedSettings = await retrieveAlertSettings();
            if (savedSettings) {
                setSettings({
                    ...savedSettings,
                    reminderConfig: savedSettings.reminderConfig || {
                        enabled: true,
                        maxReminders: 3,
                        intervalSeconds: 10
                    }
                });
            }

            // Load saved registration status BEFORE setupNotifications
            const savedRegStatus = await retrieveRegistrationStatus();
            if (savedRegStatus) {
                setRegistrationStatus(savedRegStatus);
                console.log('Loaded registration status:', savedRegStatus);
            }

            // Load saved push token BEFORE setupNotifications
            const savedToken = await retrievePushToken();
            if (savedToken) {
                setPushToken(savedToken);
                console.log('Loaded saved token:', savedToken.substring(0, 30) + '...');
            }

            // Now setup notifications (which will check the loaded status)
            await setupNotifications();
        } catch (error) {
            console.error('Error loading persisted data:', error);
            await setupNotifications();
        }
    };

    const checkBackendHealth = async () => {
        try {
            const health = await checkAlertSystemHealth();
            setBackendStatus(health.status);
        } catch (error) {
            console.error('Backend health check failed:', error);
            setBackendStatus('error');
        }
    };

    const setupNotifications = async () => {
        try {
            // Configure notification handler
            await Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: settings.soundEnabled,
                    shouldSetBadge: true,
                    shouldShowBanner: false,
                    shouldShowList: false,
                }),
            });

            // Request permissions
            const { status } = await Notifications.requestPermissionsAsync();
            setPermissionStatus(status);
            console.log('Permission Status:', status);

            if (status !== 'granted') {
                console.log('Permissions not granted, skipping registration');
                return;
            }

            // Check if already registered - BEFORE making any API calls
            const savedRegStatus = await retrieveRegistrationStatus();
            const savedToken = await retrievePushToken();

            if (savedRegStatus === 'registered' && savedToken) {
                console.log('✅ Device already registered, skipping registration API call');
                console.log('Using existing token:', savedToken.substring(0, 30) + '...');
                setPushToken(savedToken);
                setRegistrationStatus('registered');
                return; // Exit early - don't re-register
            }

            console.log('📝 Device not registered yet, proceeding with registration...');

            // Get tokens
            const token = await Notifications.getExpoPushTokenAsync();
            setPushToken(token.data);
            await storePushToken(token.data);

            let platformToken = null;
            if (Platform.OS === 'android') {
                platformToken = await Notifications.getDevicePushTokenAsync();
            }

            // Get user session
            const retrieveUser = await retrieveUserSession();

            if (!retrieveUser || !retrieveUser.id) {
                console.error('No user session found. User must be logged in to register push token.');
                setRegistrationStatus('failed');
                await storeRegistrationStatus('failed');
                return;
            }

            console.log('Registering push token for user:', retrieveUser.id);

            // Register token with backend
            try {
                const response = await registerPushToken({
                    userId: retrieveUser.id,
                    token: token.data,
                    deviceType: Platform.OS,
                    fcmToken: Platform.OS === 'android' && platformToken ? (platformToken as any).data : undefined,
                    settings
                });

                if (response.httpStatus === 'OK' || response.data.success) {
                    setRegistrationStatus('registered');
                    await storeRegistrationStatus('registered');
                    console.log('✅ Device registered successfully');
                } else {
                    setRegistrationStatus('failed');
                    await storeRegistrationStatus('failed');
                    console.warn('Backend registration failed:', response);
                }
            } catch (error) {
                console.error('Registration API call failed:', error);
                setRegistrationStatus('failed');
                await storeRegistrationStatus('failed');
            }

            // Set up notification channels for Android
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('critical-alerts-v4', {
                    name: 'Critical Incidents',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#DC2626',
                    sound: 'alarm_sound.mp3',
                });
            }
        } catch (error) {
            console.error('Error setting up notifications:', error);
            setRegistrationStatus('error');
            await storeRegistrationStatus('error');
        }
    };

    const registerDevice = async () => {
        console.log('Manual device registration triggered');

        if (!Device.isDevice) {
            console.warn('Must use physical device for push notifications');
            setRegistrationStatus('failed');
            await storeRegistrationStatus('failed');
            return;
        }

        try {
            setRegistrationStatus('pending');
            await storeRegistrationStatus('pending');

            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig?.extra?.eas?.projectId,
            });

            const token = tokenData.data;
            setPushToken(token);
            await storePushToken(token);
            console.log('Got new token:', token.substring(0, 30) + '...');

            const retrieveUser = await retrieveUserSession();

            if (!retrieveUser || !retrieveUser.id) {
                console.error('No user session found');
                setRegistrationStatus('failed');
                await storeRegistrationStatus('failed');
                Alert.alert('Error', 'Please login first before registering device');
                return;
            }

            console.log('📤 Calling registration API...');
            const response = await registerPushToken({
                userId: retrieveUser.id,
                token,
                deviceType: Platform.OS,
                settings
            });

            if (response.httpStatus === "OK") {
                setRegistrationStatus('registered');
                await storeRegistrationStatus('registered');
                console.log('✅ Manual registration successful');
                Alert.alert('Success', 'Device registered successfully!');
            } else {
                setRegistrationStatus('failed');
                await storeRegistrationStatus('failed');
                console.error('❌ Manual registration failed:', response.data);
                Alert.alert('Error', 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Error in manual registration:', error);
            setRegistrationStatus('failed');
            await storeRegistrationStatus('failed');
            Alert.alert('Error', 'Registration failed. Please check your connection.');
        }
    };

    const updateSettings = async (newSettings: Partial<AlertSettings>) => {
        const updatedSettings = { ...settings, ...newSettings };
        setSettings(updatedSettings);
        await storeAlertSettings(updatedSettings);

        // Update notification handler
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: updatedSettings.enableAlerts,
                shouldPlaySound: updatedSettings.soundEnabled,
                shouldSetBadge: true,
                shouldShowBanner: false,
                shouldShowList: false,
            }),
        });

        // Only update backend if device is already registered
        const savedRegStatus = await retrieveRegistrationStatus();
        const savedToken = await retrievePushToken();
        const retrieveUser = await retrieveUserSession();

        if (savedRegStatus === 'registered' && savedToken && retrieveUser?.id) {
            console.log('📤 Updating settings on backend...');
            try {
                await registerPushToken({
                    userId: retrieveUser.id,
                    token: savedToken,
                    deviceType: Platform.OS,
                    settings: updatedSettings
                });
                console.log('✅ Settings updated on backend');
            } catch (error) {
                console.warn('⚠️ Failed to update settings on backend:', error);
            }
        } else {
            console.log('⏭️ Device not registered, skipping backend settings update');
        }
    };

    const requestPermissions = async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        setPermissionStatus(status);

        if (status === 'granted') {
            await setupNotifications();
        }
    };

    const getPermissionStatusColor = (status: string): string => {
        switch (status) {
            case 'granted': return '#10B981';
            case 'denied': return '#EF4444';
            default: return '#F59E0B';
        }
    };

    const getPermissionStatusText = (status: string): string => {
        switch (status) {
            case 'granted': return 'Enabled';
            case 'denied': return 'Denied';
            case 'undetermined': return 'Not requested';
            default: return 'Unknown';
        }
    };

    const getIntervalText = (seconds: number): string => {
        if (seconds < 60) return `${seconds} seconds`;
        const minutes = seconds / 60;
        return minutes === 1 ? '1 minute' : `${minutes} minutes`;
    };

    return (
        <View style={[styles.container, style]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={settings.enableAlerts ? "notifications" : "notifications-off"}
                            size={20}
                            color="#F97316"
                        />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>Alert Manager</Text>
                        <Text style={styles.subtitle}>Configure notification settings</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.infoButton}
                    onPress={() => setShowSettings(true)}
                >
                    <Ionicons name="information-circle-outline" size={22} color="#F97316" />
                </TouchableOpacity>
            </View>

            {/* Status Cards */}
            <View style={styles.statusGrid}>
                <View style={styles.statusCard}>
                    <View style={[styles.statusDot, { backgroundColor: getPermissionStatusColor(permissionStatus) }]} />
                    <Text style={styles.statusLabel}>Permissions</Text>
                    <Text style={styles.statusValue}>{getPermissionStatusText(permissionStatus)}</Text>
                </View>

                <View style={styles.statusCard}>
                    <View style={[styles.statusDot, { backgroundColor: backendStatus === 'healthy' ? '#10B981' : '#EF4444' }]} />
                    <Text style={styles.statusLabel}>Backend</Text>
                    <Text style={styles.statusValue}>{backendStatus}</Text>
                </View>

                <View style={styles.statusCard}>
                    <View style={[styles.statusDot, {
                        backgroundColor: registrationStatus === 'registered' ? '#10B981' :
                            registrationStatus === 'failed' ? '#EF4444' : '#F59E0B'
                    }]} />
                    <Text style={styles.statusLabel}>Device</Text>
                    <Text style={styles.statusValue}>{registrationStatus}</Text>
                    {(registrationStatus === 'failed' || registrationStatus === 'pending') && (
                        <TouchableOpacity
                            onPress={registerDevice}
                            style={styles.retryBadge}
                        >
                            <Text style={styles.retryBadgeText}>Retry</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Settings Toggles */}
            <View style={styles.settingsCard}>
                <View style={styles.toggleItem}>
                    <View style={styles.toggleLeft}>
                        <Ionicons name="notifications" size={18} color="#F97316" />
                        <Text style={styles.toggleLabel}>Enable Alerts</Text>
                    </View>
                    <Switch
                        value={settings.enableAlerts}
                        onValueChange={(value) => updateSettings({ enableAlerts: value })}
                        trackColor={{ false: '#475569', true: '#F97316' }}
                        thumbColor="#FFFFFF"
                    />
                </View>

                {settings.enableAlerts && (
                    <>
                        <View style={styles.toggleItem}>
                            <View style={styles.toggleLeft}>
                                <Ionicons name="flash" size={18} color="#DC2626" />
                                <Text style={styles.toggleLabel}>Critical Only</Text>
                            </View>
                            <Switch
                                value={settings.criticalOnly}
                                onValueChange={(value) => updateSettings({ criticalOnly: value })}
                                trackColor={{ false: '#475569', true: '#F97316' }}
                                thumbColor="#FFFFFF"
                            />
                        </View>

                        <View style={styles.toggleItem}>
                            <View style={styles.toggleLeft}>
                                <Ionicons name="volume-high" size={18} color="#3B82F6" />
                                <Text style={styles.toggleLabel}>Sound</Text>
                            </View>
                            <Switch
                                value={settings.soundEnabled}
                                onValueChange={(value) => updateSettings({ soundEnabled: value })}
                                trackColor={{ false: '#475569', true: '#F97316' }}
                                thumbColor="#FFFFFF"
                            />
                        </View>

                        <View style={[styles.toggleItem, { borderBottomWidth: 0 }]}>
                            <View style={styles.toggleLeft}>
                                <Ionicons name="phone-portrait" size={18} color="#8B5CF6" />
                                <Text style={styles.toggleLabel}>Vibration</Text>
                            </View>
                            <Switch
                                value={settings.vibrationEnabled}
                                onValueChange={(value) => updateSettings({ vibrationEnabled: value })}
                                trackColor={{ false: '#475569', true: '#F97316' }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                    </>
                )}
            </View>

            {/* Settings Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showSettings}
                onRequestClose={() => setShowSettings(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Alert System Info</Text>
                            <TouchableOpacity onPress={() => setShowSettings(false)}>
                                <Ionicons name="close" size={24} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>System Status</Text>

                                <View style={styles.modalInfoRow}>
                                    <Text style={styles.modalInfoLabel}>Push Token:</Text>
                                    <Text style={styles.modalInfoValue}>
                                        {pushToken ? 'Registered' : 'Not registered'}
                                    </Text>
                                </View>

                                <View style={styles.modalInfoRow}>
                                    <Text style={styles.modalInfoLabel}>Permissions:</Text>
                                    <Text style={[styles.modalInfoValue, { color: getPermissionStatusColor(permissionStatus) }]}>
                                        {getPermissionStatusText(permissionStatus)}
                                    </Text>
                                </View>

                                <View style={[styles.modalInfoRow, { borderBottomWidth: 0 }]}>
                                    <Text style={styles.modalInfoLabel}>Platform:</Text>
                                    <Text style={styles.modalInfoValue}>{Platform.OS}</Text>
                                </View>
                            </View>

                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>How It Works</Text>
                                <Text style={styles.modalHelpText}>
                                    When incidents are created, your backend API sends push notifications to this device.
                                    Notifications work even when the app is closed or in the background.
                                </Text>

                                <Text style={styles.modalHelpText}>
                                    Critical incidents always use high priority notifications with sound and vibration (if enabled).
                                </Text>
                            </View>

                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Troubleshooting</Text>
                                <Text style={styles.modalHelpText}>
                                    • Ensure notifications are enabled in device settings
                                </Text>
                                <Text style={styles.modalHelpText}>
                                    • Check that your backend API is running
                                </Text>
                                <Text style={styles.modalHelpText}>
                                    • Verify incident creation triggers notifications
                                </Text>
                                <Text style={styles.modalHelpText}>
                                    • Use physical device for testing (simulators may not work)
                                </Text>
                            </View>

                            {permissionStatus !== 'granted' && (
                                <TouchableOpacity
                                    style={styles.permissionButtonWrapper}
                                    onPress={requestPermissions}
                                >
                                    <LinearGradient
                                        colors={['#F97316', '#DC2626']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.permissionButton}
                                    >
                                        <Ionicons name="key" size={20} color="#FFFFFF" />
                                        <Text style={styles.permissionButtonText}>Grant Permissions</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderRadius: 16,
        padding: 14,
        margin: 16,
        marginTop: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(249, 115, 22, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    subtitle: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    infoButton: {
        padding: 4,
    },
    statusGrid: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 12,
    },
    statusCard: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#334155',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginBottom: 6,
    },
    statusLabel: {
        fontSize: 10,
        color: '#94A3B8',
        marginBottom: 3,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    statusValue: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    retryBadge: {
        backgroundColor: '#F97316',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 4,
    },
    retryBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    settingsCard: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    toggleItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    toggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    toggleLabel: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '500',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
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
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '85%',
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    modalSection: {
        marginBottom: 24,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F97316',
        marginBottom: 12,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    modalInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    modalInfoLabel: {
        fontSize: 14,
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    modalInfoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    modalHelpText: {
        fontSize: 14,
        color: '#CBD5E1',
        lineHeight: 20,
        marginBottom: 8,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    permissionButtonWrapper: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 16,
    },
    permissionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    permissionButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
});

export default AlertManager;