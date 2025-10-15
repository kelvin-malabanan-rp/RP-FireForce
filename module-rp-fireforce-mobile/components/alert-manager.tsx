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
import { IconSymbol } from '@/components/ui/icon-symbol';
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
import {Picker} from '@react-native-picker/picker'; // ✅ NEW IMPORT

interface AlertManagerProps {
    style?: any;
}

const AlertManager: React.FC<AlertManagerProps> = ({ style }) => {
    const [settings, setSettings] = useState<AlertSettings>({
        enableAlerts: true,
        criticalOnly: false,
        soundEnabled: true,
        vibrationEnabled: true,
        // ✅ NEW: Default reminder settings
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
            // Load saved settings
            const savedSettings = await retrieveAlertSettings();
            if (savedSettings) {
                // ✅ Ensure reminderConfig exists with defaults
                setSettings({
                    ...savedSettings,
                    reminderConfig: savedSettings.reminderConfig || {
                        enabled: true,
                        maxReminders: 3,
                        intervalSeconds: 10
                    }
                });
            }

            // Load saved registration status
            const savedRegStatus = await retrieveRegistrationStatus();
            if (savedRegStatus) {
                setRegistrationStatus(savedRegStatus);
            }

            // Load saved push token
            const savedToken = await retrievePushToken();
            if (savedToken) {
                setPushToken(savedToken);
            }

            // Setup notifications after loading persisted data
            await setupNotifications();
        } catch (error) {
            console.error('Error loading persisted data:', error);
            await setupNotifications();
        }
    };

    const checkBackendHealth = async () => {
        try {
            const health = await checkAlertSystemHealth();
            console.log('health:', health);
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
            console.log('Status:', status);

            if (status === 'granted') {
                // Check if already registered
                if (registrationStatus === 'registered' && pushToken) {
                    console.log('Device already registered, skipping registration');
                    return;
                }

                console.log('Granting!');
                const token = await Notifications.getExpoPushTokenAsync();
                setPushToken(token.data);
                await storePushToken(token.data);

                // Get platform token for Android FCM
                let platformToken = null;
                if (Platform.OS === 'android') {
                    platformToken = await Notifications.getDevicePushTokenAsync();
                }

                const retrieveUser = await retrieveUserSession();

                console.log('Token:', token);

                // Check if user session exists
                if (!retrieveUser || !retrieveUser.id) {
                    console.error('No user session found. User must be logged in to register push token.');
                    setRegistrationStatus('failed');
                    await storeRegistrationStatus('failed');
                    return;
                }

                console.log('Registering push token for user:', retrieveUser.id);

                // ✅ Register token with reminder config included
                try {
                    const response = await registerPushToken({
                        userId: retrieveUser.id,
                        token: token.data,
                        deviceType: Platform.OS,
                        fcmToken: Platform.OS === 'android' && platformToken ? (platformToken as any).data : undefined,
                        settings // ✅ Now includes reminderConfig
                    });

                    if (response.httpStatus === 'OK' || response.data.success) {
                        setRegistrationStatus('registered');
                        await storeRegistrationStatus('registered');
                        console.log('Device registered successfully for user:', retrieveUser.id);
                    } else {
                        setRegistrationStatus('failed');
                        await storeRegistrationStatus('failed');
                        console.warn('Backend registration failed:', response);
                    }
                } catch (error) {
                    console.error('Registration failed:', error);
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
                return;
            }

            const response = await registerPushToken({
                userId: retrieveUser.id,
                token,
                deviceType: Platform.OS,
                settings
            });

            if (response.httpStatus === "OK") {
                setRegistrationStatus('registered');
                await storeRegistrationStatus('registered');
                console.log('Retry registration successful');
            } else {
                setRegistrationStatus('failed');
                await storeRegistrationStatus('failed');
                console.error('Retry registration failed:', response.data);
            }
        } catch (error) {
            console.error('Error in retry registration:', error);
            setRegistrationStatus('failed');
            await storeRegistrationStatus('failed');
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

        // ✅ Update backend with new settings (including reminder config)
        const retrieveUser = await retrieveUserSession();
        if (pushToken && retrieveUser?.id) {
            registerPushToken({
                userId: retrieveUser.id,
                token: pushToken,
                deviceType: Platform.OS,
                settings: updatedSettings
            });
        }
    };

    const testAlert = async () => {
        if (permissionStatus !== 'granted') {
            Alert.alert('Permissions Required', 'Please enable notifications to test alerts.');
            return;
        }

        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'CRITICAL Alert Test',
                    body: 'TEST-HighCPU-WebServer\n\nThis is a test alert to verify notifications are working.',
                    sound: settings.soundEnabled ? 'default' : undefined,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    categoryIdentifier: 'incident',
                    data: {
                        incidentId: 'test-alert',
                        severity: 'critical',
                        type: 'test'
                    }
                },
                trigger: null,
            });
        } catch (error) {
            console.error('Error sending test notification:', error);
            Alert.alert('Error', 'Failed to send test notification');
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
            case 'granted': return '#F97316';
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

    // ✅ Helper function to format interval text
    const getIntervalText = (seconds: number): string => {
        if (seconds < 60) return `${seconds} seconds`;
        const minutes = seconds / 60;
        return minutes === 1 ? '1 minute' : `${minutes} minutes`;
    };

    return (
        <View style={[styles.container, style]}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <IconSymbol
                        name={settings.enableAlerts ? "bell.fill" : "bell.slash"}
                        size={20}
                        color={settings.enableAlerts ? "#F97316" : "#EF4444"}
                    />
                    <Text style={styles.title}>Alert Manager</Text>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => setShowSettings(true)}
                    >
                        {Platform.OS === 'ios' ? (
                            <IconSymbol name="gearshape" size={20} color="#F97316" />
                        ) : (
                            <Ionicons name="settings-sharp" size={20} color="#F97316" />
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.subtitle}>
                    Real-time incident notifications
                </Text>
            </View>

            <View style={styles.statusSection}>
                <View style={styles.statusRow}>
                    <View style={[styles.statusIndicator, { backgroundColor: getPermissionStatusColor(permissionStatus) }]} />
                    <Text style={styles.statusText}>
                        Permissions: {getPermissionStatusText(permissionStatus)}
                    </Text>
                    {permissionStatus !== 'granted' && (
                        <TouchableOpacity
                            style={styles.settingsButton}
                            onPress={() => setShowSettings(true)}
                        >
                            <Ionicons name="settings-outline" size={20} color="#F97316" />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.statusRow}>
                    <View style={[styles.statusIndicator, { backgroundColor: backendStatus === 'healthy' ? '#F97316' : '#EF4444' }]} />
                    <Text style={styles.statusText}>
                        Backend: {backendStatus}
                    </Text>
                    <TouchableOpacity onPress={checkBackendHealth} style={styles.refreshButton}>
                        <IconSymbol name="arrow.clockwise" size={12} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                <View style={styles.statusRow}>
                    <View style={[styles.statusIndicator, {
                        backgroundColor: registrationStatus === 'registered' ? '#F97316' :
                            registrationStatus === 'failed' ? '#EF4444' : '#F59E0B'
                    }]} />
                    <Text style={styles.statusText}>
                        Device: {registrationStatus}
                    </Text>
                    {(registrationStatus === 'failed' || registrationStatus === 'pending') && (
                        <TouchableOpacity onPress={async () => {
                            console.log('Retry button pressed');
                            setRegistrationStatus('pending');
                            await registerDevice();
                        }} style={styles.retryButton}>
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.controls}>
                <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Enable Alerts</Text>
                    <Switch
                        value={settings.enableAlerts}
                        onValueChange={(value) => updateSettings({ enableAlerts: value })}
                        trackColor={{ false: '#475569', true: '#F97316' }}
                        thumbColor="#FFFFFF"
                    />
                </View>

                {settings.enableAlerts && (
                    <>
                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Critical Only</Text>
                            <Switch
                                value={settings.criticalOnly}
                                onValueChange={(value) => updateSettings({ criticalOnly: value })}
                                trackColor={{ false: '#475569', true: '#F97316' }}
                                thumbColor="#FFFFFF"
                            />
                        </View>

                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Sound</Text>
                            <Switch
                                value={settings.soundEnabled}
                                onValueChange={(value) => updateSettings({ soundEnabled: value })}
                                trackColor={{ false: '#475569', true: '#F97316' }}
                                thumbColor="#FFFFFF"
                            />
                        </View>

                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Vibration</Text>
                            <Switch
                                value={settings.vibrationEnabled}
                                onValueChange={(value) => updateSettings({ vibrationEnabled: value })}
                                trackColor={{ false: '#475569', true: '#F97316' }}
                                thumbColor="#FFFFFF"
                            />
                        </View>

                        {/* ✅ NEW: Reminder Settings Section */}
                        <View style={styles.sectionDivider} />

                        <View style={styles.sectionHeader}>
                            <Ionicons name="alarm-outline" size={16} color="#F97316" />
                            <Text style={styles.sectionHeaderText}>Auto-Reminders</Text>
                        </View>

                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Enable Reminders</Text>
                            <Switch
                                value={settings.reminderConfig?.enabled ?? true}
                                onValueChange={(value) => updateSettings({
                                    reminderConfig: {
                                        ...settings.reminderConfig!,
                                        enabled: value
                                    }
                                })}
                                trackColor={{ false: '#475569', true: '#F97316' }}
                                thumbColor="#FFFFFF"
                            />
                        </View>

                        {settings.reminderConfig?.enabled && (
                            <>
                                {/* Number of Reminders */}
                                <View style={styles.pickerRow}>
                                    <Text style={styles.pickerLabel}>Reminders</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={settings.reminderConfig?.maxReminders ?? 3}
                                            onValueChange={(value) => updateSettings({
                                                reminderConfig: {
                                                    ...settings.reminderConfig!,
                                                    maxReminders: value
                                                }
                                            })}
                                            style={styles.picker}
                                            dropdownIconColor="#F97316"
                                        >
                                            <Picker.Item label="1 reminder" value={1} />
                                            <Picker.Item label="2 reminders" value={2} />
                                            <Picker.Item label="3 reminders" value={3} />
                                            <Picker.Item label="4 reminders" value={4} />
                                            <Picker.Item label="5 reminders" value={5} />
                                        </Picker>
                                    </View>
                                </View>

                                {/* Reminder Interval */}
                                <View style={styles.pickerRow}>
                                    <Text style={styles.pickerLabel}>Interval</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={settings.reminderConfig?.intervalSeconds ?? 10}
                                            onValueChange={(value) => updateSettings({
                                                reminderConfig: {
                                                    ...settings.reminderConfig!,
                                                    intervalSeconds: value
                                                }
                                            })}
                                            style={styles.picker}
                                            dropdownIconColor="#F97316"
                                        >
                                            <Picker.Item label="10 seconds" value={10} />
                                            <Picker.Item label="30 seconds" value={30} />
                                            <Picker.Item label="1 minute" value={60} />
                                            <Picker.Item label="5 minutes" value={300} />
                                            <Picker.Item label="10 minutes" value={600} />
                                        </Picker>
                                    </View>
                                </View>

                                {/* Info Box */}
                                <View style={styles.infoBox}>
                                    <Ionicons name="information-circle-outline" size={16} color="#F97316" />
                                    <Text style={styles.infoBoxText}>
                                        You'll receive {settings.reminderConfig?.maxReminders} reminder(s)
                                        every {getIntervalText(settings.reminderConfig?.intervalSeconds ?? 10)} if you don't acknowledge the incident.
                                    </Text>
                                </View>
                            </>
                        )}
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
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowSettings(false)}
                >
                    <TouchableOpacity
                        style={styles.modalContent}
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Alert Settings</Text>
                            <TouchableOpacity onPress={() => setShowSettings(false)}>
                                <Ionicons name="close" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <View style={styles.settingSection}>
                                <Text style={styles.sectionTitle}>Notification Details</Text>

                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Push Token Status:</Text>
                                    <Text style={styles.infoValue}>
                                        {pushToken ? 'Registered' : 'Not registered'}
                                    </Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Permission Status:</Text>
                                    <Text style={[styles.infoValue, { color: getPermissionStatusColor(permissionStatus) }]}>
                                        {getPermissionStatusText(permissionStatus)}
                                    </Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Platform:</Text>
                                    <Text style={styles.infoValue}>{Platform.OS}</Text>
                                </View>

                                {/* ✅ NEW: Show reminder config */}
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Reminders:</Text>
                                    <Text style={styles.infoValue}>
                                        {settings.reminderConfig?.enabled
                                            ? `${settings.reminderConfig.maxReminders}x every ${getIntervalText(settings.reminderConfig.intervalSeconds)}`
                                            : 'Disabled'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.settingSection}>
                                <Text style={styles.sectionTitle}>How It Works</Text>
                                <Text style={styles.helpText}>
                                    When AWS CloudWatch alarms trigger, your backend API immediately sends push notifications to this device. Notifications work even when the app is closed or in the background.
                                </Text>

                                <Text style={styles.helpText}>
                                    Critical incidents will always use high priority notifications with sound and vibration (if enabled).
                                </Text>

                                {/* ✅ NEW: Reminder explanation */}
                                {settings.reminderConfig?.enabled && (
                                    <Text style={styles.helpText}>
                                        If you don't acknowledge an incident, you'll receive {settings.reminderConfig.maxReminders} automatic
                                        reminder(s) at {getIntervalText(settings.reminderConfig.intervalSeconds)} intervals.
                                    </Text>
                                )}
                            </View>

                            <View style={styles.settingSection}>
                                <Text style={styles.sectionTitle}>Troubleshooting</Text>
                                <Text style={styles.helpText}>
                                    • Ensure notifications are enabled in device settings
                                </Text>
                                <Text style={styles.helpText}>
                                    • Check that your backend API is running
                                </Text>
                                <Text style={styles.helpText}>
                                    • Verify AWS CloudWatch alarms are connected to SNS
                                </Text>
                            </View>
                        </ScrollView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderRadius: 16,
        padding: 16,
        margin: 16,
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 18,
        color: '#FFFFFF',
        marginLeft: 8,
        flex: 1,
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    settingsButton: {
        padding: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#94A3B8',
        marginLeft: 28,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    statusSection: {
        marginBottom: 16,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 12,
        color: '#CBD5E1',
        fontWeight: '500',
        flex: 1,
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    refreshButton: {
        padding: 4,
        marginLeft: 8,
    },
    retryButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: '#F97316',
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    controls: {
        marginBottom: 16,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    switchLabel: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '500',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    // ✅ NEW STYLES for reminder configuration
    sectionDivider: {
        height: 1,
        backgroundColor: '#F97316',
        marginVertical: 16,
        opacity: 0.3,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionHeaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F97316',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    pickerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    pickerLabel: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '500',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    pickerContainer: {
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#475569',
        minWidth: 150,
        overflow: 'hidden',
    },
    picker: {
        color: '#FFFFFF',
        height: 50,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(249, 115, 22, 0.3)',
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
        gap: 8,
        alignItems: 'flex-start',
    },
    infoBoxText: {
        flex: 1,
        color: '#FCD34D',
        fontSize: 12,
        lineHeight: 18,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1E293B',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '80%',
        borderWidth: 1,
        borderColor: '#334155',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
        paddingBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    settingSection: {
        marginBottom: 24,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 12,
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    infoLabel: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '500',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    infoValue: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    helpText: {
        fontSize: 14,
        color: '#CBD5E1',
        lineHeight: 20,
        marginBottom: 8,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
});

export default AlertManager;