import {
    Button,
    CircularProgress,
    Container,
    Divider,
    Stack,
    Typography,
} from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';
import GoogleButton from 'react-google-button';

import { AuthStatus, useAuth } from '../auth/Auth';

const LandingPage = () => {
    const auth = useAuth();
    const navigate = useNavigate();

    if (auth.status === AuthStatus.Loading) {
        return (
            <Stack sx={{ pt: 6, pb: 4 }} justifyContent='center' alignItems='center'>
                <CircularProgress />
            </Stack>
        );
    }

    if (auth.status === AuthStatus.Authenticated) {
        return <Navigate to='/calendar' />;
    }

    const onGoogleSignIn = () => {
        auth.socialSignin('Google');
    };

    return (
        <Container maxWidth='md' sx={{ pt: 10 }}>
            <Stack justifyContent='center' alignItems='center' spacing={6}>
                <Stack alignItems='center'>
                    <Typography variant='h4'>Chess Dojo Scheduler</Typography>
                    <Typography variant='h6'>Sign in to Continue</Typography>
                </Stack>
                <GoogleButton onClick={onGoogleSignIn} />
                <Divider sx={{ width: 0.5 }}>Or</Divider>
                <Button variant='contained' onClick={() => navigate('/signin')}>
                    Continue with Email
                </Button>
            </Stack>
        </Container>
    );
};

export default LandingPage;
