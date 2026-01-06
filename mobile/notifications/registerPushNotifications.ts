import Constants from 'expo-constants';
import { isDevice } from 'expo-device';
import {
    AndroidImportance,
    getExpoPushTokenAsync,
    getPermissionsAsync,
    PermissionStatus,
    requestPermissionsAsync,
    setNotificationChannelAsync,
} from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Registers for push notifications and returns the Expo
 * push token.
 * @returns The Expo push token.
 */
export async function registerPushNotifications(): Promise<string> {
    if (Platform.OS === 'android') {
        await setNotificationChannelAsync('default', {
            name: 'default',
            importance: AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (!isDevice) {
        throw new Error(`A physical device is required for push notifications`);
    }

    let { status } = await getPermissionsAsync();
    if (status !== PermissionStatus.GRANTED) {
        status = (await requestPermissionsAsync()).status;
    }
    if (status !== PermissionStatus.GRANTED) {
        throw new Error(`Permission not granted to get push token. Current permission: ${status}`);
    }

    const projectId =
        Constants?.expoConfig?.extra?.eas.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
        throw new Error('Project ID not found');
    }

    try {
        const pushToken = (await getExpoPushTokenAsync({ projectId })).data;
        console.log('Push Token: ', pushToken);
        return pushToken;
    } catch (err) {
        throw new Error(`Failed to get expo push token for project id ${projectId}: ${err}`);
    }
}
