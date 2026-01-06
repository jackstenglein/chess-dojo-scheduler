import { registerPushNotifications } from '@/notifications/registerPushNotifications';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { useEffect } from 'react';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowList: false,
    }),
});

export default function RootLayout() {
    useEffect(() => {
        registerPushNotifications().catch(console.error);
    }, []);

    return (
        <Stack>
            <Stack.Screen name='index' options={{ headerShown: false }} />
        </Stack>
    );
}
