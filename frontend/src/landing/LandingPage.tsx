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
        return <Navigate to='/profile' />;
    }

    const onGoogleSignIn = () => {
        auth.socialSignin('Google');
    };

    return (
        <Container maxWidth='md' sx={{ pt: 10 }}>
            <Stack justifyContent='center' alignItems='center' spacing={6}>
                <Stack alignItems='center' spacing={2}>
                    <Typography variant='h4' textAlign='center' data-cy='title'>
                        Chess Dojo Scoreboard
                    </Typography>
                    <Typography variant='h5' textAlign='center' data-cy='subtitle'>
                        A structured plan to hold yourself accountable and a group to do
                        it with
                    </Typography>
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
