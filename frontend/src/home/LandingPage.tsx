import { Container, Stack, Typography } from '@mui/material';
import { Navigate } from 'react-router-dom';
import GoogleButton from 'react-google-button';

import { AuthStatus, useAuth } from '../auth/Auth';

const LandingPage = () => {
    const auth = useAuth();

    if (auth.status === AuthStatus.Authenticated) {
        return <Navigate to='/home' />;
    }

    const onSignIn = () => {
        auth.socialSignin('Google');
    };

    return (
        <Container maxWidth='md' sx={{ pt: 5 }}>
            <Stack alignItems='center' spacing={3}>
                <Stack alignItems='center'>
                    <Typography variant='h4'>Chess Dojo Scheduler</Typography>
                    <Typography variant='h6'>Sign in to Continue</Typography>
                </Stack>
                <GoogleButton onClick={onSignIn} />
            </Stack>
        </Container>
    );
};

export default LandingPage;
