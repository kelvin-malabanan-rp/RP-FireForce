// context/PushNotificationContext.tsx
import React, { createContext, useContext } from 'react';
import { usePushNotifications } from '@/hooks/use-push-notifications';

const PushNotificationContext = createContext<ReturnType<typeof usePushNotifications> | null>(null);

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
    const pushNotifications = usePushNotifications();
    return (
        <PushNotificationContext.Provider value={pushNotifications}>
            {children}
        </PushNotificationContext.Provider>
    );
}

export function usePushNotificationContext() {
    const context = useContext(PushNotificationContext);
    if (!context) {
        throw new Error('usePushNotificationContext must be used within PushNotificationProvider');
    }
    return context;
}