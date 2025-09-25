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
import {checkAlertSystemHealth, AlertSettings, registerPushToken} from '@/api/alert-controller';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

interface AlertManagerProps {
    style?: any;
}

const AlertManager: React.FC<AlertManagerProps> = ({ style }) => {
    const [settings, setSettings] = useState<AlertSettings>({
        enableAlerts: true,
        criticalOnly: false,
        soundEnabled: true,
        vibrationEnabled: true,
    });
    const [showSettings, setShowSettings] = useState(false);
    const [pushToken, setPushToken] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
    const [backendStatus, setBackendStatus] = useState<string>('checking');
    const [registrationStatus, setRegistrationStatus] = useState<string>('pending');

    useEffect(() => {
        setupNotifications();
        checkBackendHealth();
    }, []);

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
                }),
            });

            // Request permissions
            const { status } = await Notifications.requestPermissionsAsync();
            setPermissionStatus(status);
            console.log('Status:', status);

            if (status === 'granted') {
                // Get push token
                console.log('Granting!');
                const token = await Notifications.getExpoPushTokenAsync();
                setPushToken(token.data);

                console.log('Token:', token);
                // Register token with backend using alert-controller
                try {
                    const response = await registerPushToken({
                        token: token.data,
                        deviceType: Platform.OS,
                        settings
                    });

                    setRegistrationStatus('registered');
                    console.log('Device registered successfully:', response);
                } catch (error) {
                    console.error('Registration failed:', error);
                    setRegistrationStatus('failed');
                }
            }

            // Set up notification channels for Android
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('critical', {
                    name: 'Critical Incidents',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#DC2626',
                    sound: 'default',
                });
            }

        } catch (error) {
            console.error('Error setting up notifications:', error);
            setRegistrationStatus('error');
        }
    };

    const registerDevice = async () => {
        console.log('Manual device registration triggered');

        if (!Device.isDevice) {
            console.warn('Must use physical device for push notifications');
            setRegistrationStatus('failed');
            return;
        }

        try {
            setRegistrationStatus('pending');

            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig?.extra?.eas?.projectId,
            });

            const token = tokenData.data;
            setPushToken(token);
            console.log('Got new token:', token.substring(0, 30) + '...');

            const response = await registerPushToken({
                token,
                deviceType: Platform.OS,
                settings
            });

            if (response.httpStatus === 'OK') {
                setRegistrationStatus('registered');
                console.log('Retry registration successful');
            } else {
                setRegistrationStatus('failed');
                console.error('Retry registration failed:', response.message);
            }
        } catch (error) {
            console.error('Error in retry registration:', error);
            setRegistrationStatus('failed');
        }
    };

    const updateSettings = (newSettings: Partial<AlertSettings>) => {
        const updatedSettings = { ...settings, ...newSettings };
        setSettings(updatedSettings);

        // Update notification handler
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: updatedSettings.enableAlerts,
                shouldPlaySound: updatedSettings.soundEnabled,
                shouldSetBadge: true,
            }),
        });

        // Update backend with new settings
        if (pushToken) {
            registerPushToken(pushToken);
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
                trigger: null, // Show immediately
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

    return (
        <View style={[styles.container, style]}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <IconSymbol
                        name={settings.enableAlerts ? "bell.fill" : "bell.slash"}
                        size={20}
                        color={settings.enableAlerts ? "#10B981" : "#EF4444"}
                    />
                    <Text style={styles.title}>Alert Manager</Text>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => setShowSettings(true)}
                    >
                        <IconSymbol name="gearshape" size={20} color="#6B7280" />
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
                        <TouchableOpacity onPress={requestPermissions} style={styles.enableButton}>
                            <Text style={styles.enableButtonText}>Enable</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.statusRow}>
                    <View style={[styles.statusIndicator, { backgroundColor: backendStatus === 'healthy' ? '#10B981' : '#EF4444' }]} />
                    <Text style={styles.statusText}>
                        Backend: {backendStatus}
                    </Text>
                    <TouchableOpacity onPress={checkBackendHealth} style={styles.refreshButton}>
                        <IconSymbol name="arrow.clockwise" size={12} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                <View style={styles.statusRow}>
                    <View style={[styles.statusIndicator, {
                        backgroundColor: registrationStatus === 'registered' ? '#10B981' :
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
                        trackColor={{ false: '#D1D5DB', true: '#10B981' }}
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
                                trackColor={{ false: '#D1D5DB', true: '#EA580C' }}
                                thumbColor="#FFFFFF"
                            />
                        </View>

                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Sound</Text>
                            <Switch
                                value={settings.soundEnabled}
                                onValueChange={(value) => updateSettings({ soundEnabled: value })}
                                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                                thumbColor="#FFFFFF"
                            />
                        </View>

                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Vibration</Text>
                            <Switch
                                value={settings.vibrationEnabled}
                                onValueChange={(value) => updateSettings({ vibrationEnabled: value })}
                                trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                    </>
                )}
            </View>

            <TouchableOpacity
                style={styles.testButton}
                onPress={testAlert}
            >
                <IconSymbol name="play.circle" size={18} color="#3B82F6" />
                <Text style={styles.testButtonText}>Test Alert</Text>
            </TouchableOpacity>

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
                            <Text style={styles.modalTitle}>Alert Settings</Text>
                            <TouchableOpacity onPress={() => setShowSettings(false)}>
                                <IconSymbol name="xmark" size={24} color="#6B7280" />
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
                            </View>

                            <View style={styles.settingSection}>
                                <Text style={styles.sectionTitle}>How It Works</Text>
                                <Text style={styles.helpText}>
                                    When AWS CloudWatch alarms trigger, your backend API immediately sends push notifications to this device. Notifications work even when the app is closed or in the background.
                                </Text>

                                <Text style={styles.helpText}>
                                    Critical incidents will always use high priority notifications with sound and vibration (if enabled).
                                </Text>
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
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
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
        fontWeight: '700',
        color: '#111827',
        marginLeft: 8,
        flex: 1,
    },
    settingsButton: {
        padding: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 28,
    },
    statusSection: {
        marginBottom: 16,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        marginBottom: 8,
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        flex: 1,
    },
    enableButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
    },
    enableButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    refreshButton: {
        padding: 4,
        marginLeft: 8,
    },
    retryButton: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
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
        borderBottomColor: '#F3F4F6',
    },
    switchLabel: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EFF6FF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    testButtonText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '600',
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    settingSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    infoLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '600',
    },
    helpText: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 8,
    },
});

export default AlertManager;