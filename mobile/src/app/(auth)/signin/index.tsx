import { View } from 'react-native';

import { AuthStatus, useAuth } from '@/auth/Auth';
import Stack from '@/components/Stack';
import Button from '@/components/Button';
import GoogleLogo from '@/components/GoogleLogo';
import { Redirect } from 'expo-router';

export default function SigninPage() {
    const auth = useAuth();

    if (auth.status === AuthStatus.Authenticated) {
        return <Redirect href='/profile/' />;
    }

    const onGoogleSignIn = () => {
        auth.socialSignin('Google', '');
    };

    return (
        <Stack
            spacing={4}
            style={{
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 8,
            }}
        >
            <Button
                icon={() => (
                    <View
                        style={{
                            backgroundColor: 'white',
                            height: 48,
                            width: 48,
                            marginLeft: -12,
                        }}
                    >
                        <GoogleLogo />
                    </View>
                )}
                style={{
                    borderRadius: 0,
                }}
                contentStyle={{
                    backgroundColor: 'rgb(66, 133, 244)',
                    height: 50,
                    width: 240,
                    justifyContent: 'space-between',
                    padding: 0,
                }}
                labelStyle={{
                    color: 'white',
                    textAlign: 'center',
                    fontSize: 16,
                    lineHeight: 28,
                }}
                onPress={onGoogleSignIn}
            >
                Sign in with Google
            </Button>
        </Stack>
    );
}
