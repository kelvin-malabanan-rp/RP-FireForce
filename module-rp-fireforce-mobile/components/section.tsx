import { View, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';

interface SectionProps {
    title: string;
    children: React.ReactNode;
}

export default function Section({ title, children }: SectionProps) {
    return (
        <View style={styles.container}>
            <ThemedText style={styles.title}>{title}</ThemedText>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
});