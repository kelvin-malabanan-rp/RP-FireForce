import { useEffect, useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { fetchAlarms } from '@/lib/api';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import Section from '@/components/section';
import AlarmCard from '@/components/alarm-card';
import IncidentSummary from '@/components/incident-summary';

console.log('🏠 HOME SCREEN FILE IS LOADING');

export default function HomeScreen() {
  console.log('🏠 HOME COMPONENT IS RENDERING');
  const [alarms, setAlarms] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  console.log('Home screen loaded!')

  useEffect(() => {
    const load = async () => {
      try {
        console.log('About to fetch alarms...');
        // Temporarily comment out the API call
        // const data = await fetchAlarms();

        // Use mock data instead for testing
        const mockData = [
          { alarmName: 'Test Alarm', stateValue: 'ALARM' },
          { alarmName: 'Another Alarm', stateValue: 'OK' }
        ];

        setAlarms(mockData);
        console.log('Mock data set successfully');
      } catch (error) {
        console.error('Error in load function:', error);
      }
    };
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await fetchAlarms();
      setAlarms(data);
    } catch (error) {
      console.error('Failed to refresh alarms:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Simple priority mapping – adjust as needed
  const priorities: Record<string, string> = {
    OK: 'Low',
    ALARM: 'Critical',
    INSUFFICIENT_DATA: 'Medium',
  };

  return (
      <ThemedView style={{ flex: 1, backgroundColor: '#F3F4F6' , marginTop: 50}}>
        <ScrollView
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
        >
          {/* Incident Summary Component */}
          <IncidentSummary timeframe="24h" />

          {/* AWS CloudWatch Alarms Section */}
          <ThemedView style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            margin: 16,
            marginTop: 0,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <ThemedText style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#111827',
              marginBottom: 16,
            }}>
              AWS CloudWatch Alarms
            </ThemedText>

            {Object.entries(priorities).map(([state, label]) => (
                <Section key={state} title={label}>
                  {alarms
                      .filter((a) => a.stateValue === state)
                      .map((alarm) => (
                          <AlarmCard key={alarm.alarmName} alarm={alarm} />
                      ))}
                </Section>
            ))}

            {alarms.length === 0 && (
                <ThemedView style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 40,
                }}>
                  <ThemedText style={{
                    fontSize: 16,
                    color: '#6B7280',
                    textAlign: 'center',
                  }}>
                    No alarms found
                  </ThemedText>
                  <ThemedText style={{
                    fontSize: 14,
                    color: '#9CA3AF',
                    textAlign: 'center',
                    marginTop: 4,
                  }}>
                    All systems are operational
                  </ThemedText>
                </ThemedView>
            )}
          </ThemedView>
        </ScrollView>
      </ThemedView>
  );
}