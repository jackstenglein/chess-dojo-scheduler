import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';

import Stack from '../components/Stack';
import Button from '../components/Button';

export default function App() {
    const onSignUp = () => {
        router.push('/settings/');
    };

    const onSignIn = () => {
        router.push('/signin/');
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
            <Text variant='displayMedium' style={{ textAlign: 'center' }}>
                ChessDojo Scoreboard
            </Text>

            <Text variant='headlineSmall' style={{ textAlign: 'center' }}>
                The ChessDojo <Text style={{ color: '#F7941F' }}>Training Program</Text>{' '}
                offers structured training plans for all levels 0-2500, along with an
                active and supportive community
            </Text>

            <Stack direction='row' spacing={3} style={{ justifyContent: 'center' }}>
                <Button
                    mode='contained'
                    labelStyle={{ fontWeight: 'bold' }}
                    onPress={onSignUp}
                    color='success'
                >
                    Sign Up for Free
                </Button>

                <Button
                    mode='outlined'
                    labelStyle={{ fontWeight: 'bold' }}
                    onPress={onSignIn}
                    color='success'
                >
                    Sign In
                </Button>
            </Stack>

            <StatusBar style='auto' />
        </Stack>
    );
}
