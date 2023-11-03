import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Slot } from 'expo-router';
import { Amplify, Hub } from 'aws-amplify';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { Platform, View } from 'react-native';

import { getConfig } from '@/config';
import { AuthProvider } from 'src/auth/Auth';
import { useEffect } from 'react';

async function urlOpener(url: string, redirectUrl: string): Promise<true> {
    const authSessionResult = await WebBrowser.openAuthSessionAsync(url, redirectUrl);

    if (authSessionResult.type === 'success' && Platform.OS === 'ios') {
        WebBrowser.dismissBrowser();
        return Linking.openURL(authSessionResult.url);
    }
    return true;
}

const config = getConfig();
Amplify.configure({
    Auth: {
        region: config.auth.region,
        userPoolId: config.auth.userPoolId,
        userPoolWebClientId: config.auth.userPoolWebClientId,
        oauth: {
            domain: config.auth.oauth.domain,
            scope: config.auth.oauth.scope,
            redirectSignIn: config.auth.oauth.redirectSignIn,
            redirectSignOut: config.auth.oauth.redirectSignOut,
            responseType: config.auth.oauth.responseType,
            urlOpener,
        },
    },
});

const theme = {
    ...MD3DarkTheme,
    colors: {
        primary: 'rgb(144,202,249)',
        onPrimary: 'rgba(0, 0, 0, 0.87)',
        primaryContainer: 'rgb(0, 75, 113)',
        onPrimaryContainer: 'rgb(203, 230, 255)',

        secondary: 'rgb(206,147,216)',
        onSecondary: 'rgba(0, 0, 0, 0.87)',
        secondaryContainer: 'rgb(104, 46, 118)',
        onSecondaryContainer: 'rgb(253, 214, 255)',

        tertiary: 'rgb(208, 192, 232)',
        onTertiary: 'rgb(54, 43, 74)',
        tertiaryContainer: 'rgb(77, 65, 98)',
        onTertiaryContainer: 'rgb(235, 220, 255)',

        error: 'rgb(244,67,54)',
        onError: 'rgb(255, 255, 255)',
        errorContainer: 'rgb(147, 0, 5)',
        onErrorContainer: 'rgb(255, 218, 213)',

        warning: 'rgb(255,167,38)',
        onWarning: 'rgba(0, 0, 0, 0.87)',
        warningContainer: 'rgb(102, 62, 0)',
        onWarningContainer: 'rgb(255, 221, 185)',

        info: 'rgb(41,182,246)',
        onInfo: 'rgba(0, 0, 0, 0.87)',
        infoContainer: 'rgb(0, 76, 107)',
        onInfoContainer: 'rgb(198, 231, 255)',

        success: 'rgb(102,187,106)',
        onSuccess: 'rgba(0, 0, 0, 0.87)',
        successContainer: 'rgb(0, 83, 24)',
        onSuccessContainer: 'rgb(159, 247, 159)',

        background: 'rgb(26, 28, 30)',
        onBackground: 'rgb(226, 226, 229)',
        surface: 'rgb(26, 28, 30)',
        onSurface: 'rgb(226, 226, 229)',
        surfaceVariant: 'rgb(65, 71, 77)',
        onSurfaceVariant: 'rgb(193, 199, 206)',
        outline: 'rgb(139, 145, 152)',
        outlineVariant: 'rgb(65, 71, 77)',
        shadow: 'rgb(0, 0, 0)',
        scrim: 'rgb(0, 0, 0)',
        inverseSurface: 'rgb(226, 226, 229)',
        inverseOnSurface: 'rgb(46, 49, 51)',
        inversePrimary: 'rgb(0, 100, 148)',
        elevation: {
            level0: 'transparent',
            level1: 'rgb(32, 37, 41)',
            level2: 'rgb(35, 42, 48)',
            level3: 'rgb(39, 48, 55)',
            level4: 'rgb(40, 49, 57)',
            level5: 'rgb(42, 53, 62)',
        },
        surfaceDisabled: 'rgba(226, 226, 229, 0.12)',
        onSurfaceDisabled: 'rgba(226, 226, 229, 0.38)',
        backdrop: 'rgba(43, 49, 55, 0.4)',
    },
};

export default function Root() {
    useEffect(() => {
        const unsubscribe = Hub.listen('auth', ({ payload: { event, data } }) => {
            console.log('event', event);
            console.log('data', data);
        });

        return unsubscribe;
    }, []);

    return (
        <PaperProvider theme={theme}>
            <AuthProvider>
                <View style={{ backgroundColor: theme.colors.background }}>
                    <Slot />
                </View>
            </AuthProvider>
        </PaperProvider>
    );
}
