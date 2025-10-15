import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT_FAMILY } from '@/constants/fonts';
import { retrieveUserSession, clearUserSession } from '@/constants/local-storage';
import { UserSession } from '@/types';

export default function ProfileScreen() {
    const router = useRouter();
    const [userSession, setUserSession] = useState<UserSession | null>(null);

    useEffect(() => {
        loadUserSession();
    }, []);

    const loadUserSession = async () => {
        try {
            const session = await retrieveUserSession();
            // @ts-ignore
            setUserSession(session);
        } catch (error) {
            console.error('Error loading user session:', error);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await clearUserSession();
                        router.replace('/');
                    }
                }
            ]
        );
    };

    const getInitials = () => {
        if (userSession?.firstName && userSession?.lastName) {
            return `${userSession.firstName[0]}${userSession.lastName[0]}`.toUpperCase();
        }
        return userSession?.email?.[0].toUpperCase() || 'U';
    };

    const getFullName = () => {
        if (userSession?.firstName && userSession?.lastName) {
            return `${userSession.firstName} ${userSession.lastName}`;
        }
        return userSession?.email?.split('@')[0] || 'User';
    };

    const accountItems = [
        {
            icon: 'person-circle-outline',
            label: 'Edit Profile',
            color: '#3B82F6',
            onPress: () => Alert.alert('Coming Soon', 'Profile editing will be available soon')
        },
        {
            icon: 'shield-checkmark-outline',
            label: 'Security',
            color: '#10B981',
            onPress: () => Alert.alert('Coming Soon', 'Security settings will be available soon')
        },
    ];

    const appItems = [
        {
            icon: 'information-circle-outline',
            label: 'About',
            color: '#8B5CF6',
            value: 'v1.0.0',
            onPress: () => {}
        },
        {
            icon: 'help-circle-outline',
            label: 'Help & Support',
            color: '#F59E0B',
            onPress: () => Alert.alert('Support', 'Contact: support@rocketpartners.io')
        },
    ];

    return (
        <View style={styles.container}>
            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    {Platform.OS === 'ios' ? (
                        <Ionicons name="chevron-back" size={24} color="#F97316" />
                    ) : (
                        <Ionicons name="arrow-back" size={24} color="#F97316" />
                    )}
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header */}
                <LinearGradient
                    colors={['#F97316', '#DC2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.profileHeader}
                >
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{getInitials()}</Text>
                        </View>
                    </View>
                    <Text style={styles.profileName}>{getFullName()}</Text>
                </LinearGradient>

                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ACCOUNT</Text>
                    <View style={styles.menuCard}>
                        {accountItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.menuItem,
                                    index === accountItems.length - 1 && { borderBottomWidth: 0 }
                                ]}
                                onPress={item.onPress}
                            >
                                <View style={styles.menuItemLeft}>
                                    <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
                                        <Ionicons name={item.icon as any} size={20} color={item.color} />
                                    </View>
                                    <Text style={styles.menuItemText}>{item.label}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#64748B" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* App Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>APP INFO</Text>
                    <View style={styles.menuCard}>
                        {appItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.menuItem,
                                    index === appItems.length - 1 && { borderBottomWidth: 0 }
                                ]}
                                onPress={item.onPress}
                            >
                                <View style={styles.menuItemLeft}>
                                    <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
                                        <Ionicons name={item.icon as any} size={20} color={item.color} />
                                    </View>
                                    <Text style={styles.menuItemText}>{item.label}</Text>
                                </View>
                                {item.value ? (
                                    <Text style={styles.menuItemValue}>{item.value}</Text>
                                ) : (
                                    <Ionicons name="chevron-forward" size={20} color="#64748B" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    style={styles.logoutButtonWrapper}
                    onPress={handleLogout}
                >
                    <View style={styles.logoutButton}>
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </View>
                </TouchableOpacity>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>RP Fire Force v1.0.0</Text>
                    <Text style={styles.footerSubtext}>Powered by Rocket Partners</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    backButton: {
        padding: 4,
        marginLeft: -4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    headerRight: {
        width: 32,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    profileHeader: {
        paddingVertical: 32,
        paddingHorizontal: 20,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 24,
        borderRadius: 20,
        alignItems: 'center',
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    profileName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    profileEmail: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 12,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    roleBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    roleBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    section: {
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontFamily: FONT_FAMILY.POPPINS_BOLD,
    },
    menuCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#334155',
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#FFFFFF',
        fontFamily: FONT_FAMILY.POPPINS_MEDIUM,
    },
    menuItemValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    logoutButtonWrapper: {
        marginHorizontal: 16,
        marginBottom: 24,
        borderRadius: 12,
        overflow: 'hidden',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#EF4444',
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EF4444',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    footerText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94A3B8',
        fontFamily: FONT_FAMILY.POPPINS_SEMI_BOLD,
    },
    footerSubtext: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 4,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
});