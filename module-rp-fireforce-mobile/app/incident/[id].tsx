// app/incident/[id].tsx
import { View, Text, Button } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { respondToIncident } from '@/api/alert-controller';

export default function IncidentScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '600' }}>Incident: {id}</Text>

            {/* Simple inline prompt */}
            <View style={{ marginTop: 24, gap: 12 }}>
                <Button
                    title="I've got this"
                    onPress={() => respondToIncident(id, 'acknowledge')}
                />
                <Button
                    title="I can't right now, escalate"
                    onPress={() => respondToIncident(id, 'decline')}
                    color="#c00"
                />
            </View>
        </View>
    );
}
