import { View, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';

interface Alarm {
    alarmName: string;
    stateValue: string;
    description?: string;
    // add any other fields you need
}

export default function AlarmCard({ alarm }: { alarm: Alarm }) {
    return (
        <View style={styles.card}>
            <ThemedText style={styles.name}>{alarm.alarmName}</ThemedText>
            <ThemedText style={styles.state}>{alarm.stateValue}</ThemedText>
            {alarm.description && (
                <ThemedText style={styles.desc}>{alarm.description}</ThemedText>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    name: {
        fontSize: 16,
        fontWeight: '500',
    },
    state: {
        fontSize: 14,
        color: '#666',
    },
    desc: {
        marginTop: 4,
        fontSize: 12,
        color: '#444',
    },
});