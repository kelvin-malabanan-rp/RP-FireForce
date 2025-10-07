import { useState, useEffect } from 'react';
import {
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    StyleSheet,
    View,
    Platform
} from 'react-native';
import { getAllIncidents, getAllIncidentStats } from '@/api/incident-controller';
import { ThemedText } from '@/components/themed-text';
import IncidentSummary from '@/components/incident-summary';
import { FONT_FAMILY } from '@/constants/fonts';
import { Incident } from '@/types/incident-types';

export default function HomeScreen() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');

    const AUTO_REFRESH_INTERVAL = 30000;

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            loadData(true);
        }, AUTO_REFRESH_INTERVAL);

        return () => clearInterval(interval);
    }, [timeframe]);

    const loadData = async (isAutoRefresh = false) => {
        try {
            if (!isAutoRefresh) {
                setError(null);
            }

            const [incidentsResponse, statsResponse] = await Promise.all([
                getAllIncidents(),
                getAllIncidentStats(timeframe)
            ]);

            if (incidentsResponse.data && Array.isArray(incidentsResponse.data)) {
                setIncidents(incidentsResponse.data);
            } else if (incidentsResponse.data) {
                setIncidents(incidentsResponse.data);
            }

            if (statsResponse.data) {
                setStats(statsResponse.data);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            if (!isAutoRefresh) {
                setError('Failed to load incidents. Pull to refresh.');
            }
        } finally {
            if (!isAutoRefresh) {
                setLoading(false);
            }
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            setError(null);
            await loadData();
        } catch (error) {
            console.error('Failed to refresh data:', error);
            setError('Failed to refresh incidents.');
        } finally {
            setRefreshing(false);
        }
    };

    const handleTimeframeChange = (newTimeframe: '24h' | '7d' | '30d') => {
        setTimeframe(newTimeframe);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F97316" />
                <ThemedText style={styles.loadingText}>Loading incidents...</ThemedText>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ paddingTop: Platform.OS === 'ios' ? 100 : 80 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#F97316']}
                        tintColor="#F97316"
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                <IncidentSummary
                    timeframe={timeframe}
                    onTimeframeChange={handleTimeframeChange}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    loadingText: {
        marginTop: 16,
        color: '#94A3B8',
        fontSize: 15,
        fontFamily: FONT_FAMILY.POPPINS_REGULAR,
    },
    scrollView: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});