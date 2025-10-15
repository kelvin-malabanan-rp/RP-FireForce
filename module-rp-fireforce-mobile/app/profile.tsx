import React from 'react';
import { View, StyleSheet } from 'react-native';
import ProfileComponent from '@/components/profile-screen';

export default function ProfileRoute() {
    return (
        <View style={styles.container}>
            <ProfileComponent />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});